// app/api/s3-compress-and-upload/route.js
console.log("ALL ENV VARS:", JSON.stringify(process.env, null, 2));
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { NextResponse } from 'next/server';
import archiver from 'archiver';
// export const runtime = 'edge';
// Configure DynamoDB Client
const dynamoClient = new DynamoDBClient({
    region: process.env.RETROSHARE_AWS_REGION || "ap-south-1",
    credentials: {
        accessKeyId: process.env.RETROSHARE_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.RETROSHARE_AWS_SECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.RETROSHARE_DYNAMODB_TABLE_NAME || "FileShareCodes";

// Configuration constants
const MAX_SINGLE_FILE_SIZE = process.env.MAX_SINGLE_FILE_SIZE; // 25MB threshold for direct upload

// Function to generate a unique 6-digit code
const generateUniqueCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.RETROSHARE_AWS_REGION,
    credentials: {
        accessKeyId: process.env.RETROSHARE_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.RETROSHARE_AWS_SECRET_ACCESS_KEY,
    },
    
});

const bucketName = process.env.RETROSHARE_S3_BUCKET_NAME;

export async function POST(request) {
    if (!bucketName) {
        console.error("RETROSHARE_S3_BUCKET_NAME environment variable is not set.");
        return NextResponse.json({ message: 'Server configuration error: S3 bucket name not set.' }, { status: 500 });
    }

    if (!tableName) {
        console.error("RETROSHARE_DYNAMODB_TABLE_NAME environment variable is not set.");
        return NextResponse.json({ message: 'Server configuration error: DynamoDB table name not set.' }, { status: 500 });
    }

    try {
        // Parse the FormData directly
        const formData = await request.formData();
        const files = formData.getAll('files');
        
        console.log("Files from formData:", files);
        
        if (!files || files.length === 0) {
            return NextResponse.json({ message: 'No files uploaded.' }, { status: 400 });
        }

        const timestamp = Date.now();
        
        // Check if this is a single file below threshold that can be uploaded directly
        if (files.length === 1 && files[0].size <= MAX_SINGLE_FILE_SIZE) {
            // Direct upload for single, small file
            const file = files[0];
            console.log(`Single file ${file.name} (${file.size} bytes) will be uploaded directly without compression`);
            
            const s3Key = `${timestamp}-${file.name}`;
            const buffer = await file.arrayBuffer();
            
            // Upload directly to S3
            const putCommand = new PutObjectCommand({
                Bucket: bucketName,
                Key: s3Key,
                Body: Buffer.from(buffer),
                ContentType: file.type || 'application/octet-stream',
                ContentLength: file.size,
                ACL: 'private',
            });
            
            await s3Client.send(putCommand);
            console.log(`Single file ${s3Key} uploaded to S3 without compression.`);
            
            // Generate share code
            const sixDigitCode = generateUniqueCode();
            const expirationTime = Date.now() + (24 * 60 * 60 * 1000);
            
            // Store in DynamoDB
            const shareData = {
                shareCode: sixDigitCode,
                s3Key: s3Key,
                originalArchiveName: file.name, // Use original filename for single files
                expirationTime: expirationTime,
                uploadedAt: timestamp,
                filesCount: 1,
                fileNames: [file.name],
                totalSizeBytes: file.size,
                isCompressed: false, // Flag to indicate this isn't a zip file
                ttl: Math.floor(expirationTime / 1000)
            };
            
            const putParams = {
                TableName: tableName,
                Item: shareData
            };
            
            await docClient.send(new PutCommand(putParams));
            console.log(`Generated code ${sixDigitCode} for direct file ${s3Key} and stored in DynamoDB.`);
            
            return NextResponse.json({
                message: 'File uploaded successfully!',
                archiveName: file.name,
                shareCode: sixDigitCode,
                filesCount: 1,
                fileNames: [file.name],
                isCompressed: false
            }, { status: 200 });
        }
        
        // If we reach here, we need to create a compressed archive
        // (for multiple files or single large file)
        
        // Generate archive name
        const s3ArchiveKey = `${timestamp}-archive.zip`;
        
        // Create a descriptive archive name
        let originalArchiveName;
        if (files.length === 1) {
            originalArchiveName = `${files[0].name.split('.')[0]}.zip`;
        } else {
            originalArchiveName = `${files[0].name.split('.')[0]}_and_${files.length - 1}_more_files.zip`;
        }

        // Create a zip archive in memory
        const archive = archiver('zip', { zlib: { level: 9 } });
        const archiveBuffers = [];
        
        return new Promise((resolve) => {
            archive.on('data', (data) => archiveBuffers.push(data));
            
            archive.on('end', async () => {
                try {
                    // Create a single buffer from all chunks
                    const resultBuffer = Buffer.concat(archiveBuffers);
                    
                    // Use buffer directly instead of stream to avoid content-length issues
                    const putCommand = new PutObjectCommand({
                        Bucket: bucketName,
                        Key: s3ArchiveKey,
                        Body: resultBuffer,
                        ContentType: 'application/zip',
                        ContentLength: resultBuffer.length,
                        ACL: 'private',
                    });

                    await s3Client.send(putCommand);
                    console.log(`Compressed archive ${s3ArchiveKey} uploaded to S3.`);

                    // Generate and store code
                    const sixDigitCode = generateUniqueCode();
                    const expirationTime = Date.now() + (24 * 60 * 60 * 1000);

                    // Get list of filenames
                    const fileNames = files.map(file => file.name);
                    
                    // Store data in DynamoDB
                    const shareData = {
                        shareCode: sixDigitCode,
                        s3Key: s3ArchiveKey,
                        originalArchiveName: originalArchiveName,
                        expirationTime: expirationTime,
                        uploadedAt: timestamp,
                        filesCount: files.length,
                        fileNames: fileNames,
                        totalSizeBytes: resultBuffer.length,
                        isCompressed: true, // Flag to indicate this is a zip file
                        ttl: Math.floor(expirationTime / 1000)
                    };
                    
                    // Save to DynamoDB
                    const putParams = {
                        TableName: tableName,
                        Item: shareData
                    };
                    
                    await docClient.send(new PutCommand(putParams));
                    
                    console.log(`Generated code ${sixDigitCode} for ${s3ArchiveKey} and stored in DynamoDB.`);
                    
                    resolve(NextResponse.json({
                        message: 'Files compressed and uploaded successfully!',
                        archiveName: originalArchiveName,
                        shareCode: sixDigitCode,
                        filesCount: files.length,
                        fileNames: fileNames,
                        isCompressed: true
                    }, { status: 200 }));
                } catch (error) {
                    console.error('Error during S3 upload or DynamoDB operation:', error);
                    resolve(NextResponse.json({ 
                        message: 'Failed to upload archive to S3 or save to database.', 
                        error: error.message 
                    }, { status: 500 }));
                }
            });

            archive.on('error', (archiveErr) => {
                console.error('Archiver error:', archiveErr);
                resolve(NextResponse.json({ 
                    message: 'Failed to create archive.', 
                    error: archiveErr.message 
                }, { status: 500 }));
            });

            // Process each file and add to archive
            const processFiles = async () => {
                for (const file of files) {
                    try {
                        const buffer = await file.arrayBuffer();
                        archive.append(Buffer.from(buffer), { name: file.name });
                    } catch (error) {
                        console.error(`Error processing file ${file.name}:`, error);
                    }
                }
                archive.finalize();
            };
            
            processFiles();
        });
    } catch (error) {
        console.error('Error processing request:', error);
        return NextResponse.json({ 
            message: 'Error processing upload request', 
            error: error.message 
        }, { status: 500 });
    }
}