// app/api/resolve-code/route.js

import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from 'next/server';

// Configure DynamoDB Client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);
const tableName = process.env.DYNAMODB_TABLE_NAME;

// Configure S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    
});

const bucketName = process.env.S3_BUCKET_NAME;

export async function POST(request) {
    if (!bucketName) {
        console.error("S3_BUCKET_NAME environment variable is not set.");
        return NextResponse.json({ message: 'Server configuration error: S3 bucket name not set.' }, { status: 500 });
    }

    if (!tableName) {
        console.error("DYNAMODB_TABLE_NAME environment variable is not set.");
        return NextResponse.json({ message: 'Server configuration error: DynamoDB table name not set.' }, { status: 500 });
    }

    try {
        // Parse the request body to get the share code
        const data = await request.json();
        const shareCode = data.shareCode;
        
        if (!shareCode) {
            return NextResponse.json({ message: 'No share code provided.' }, { status: 400 });
        }
        
        console.log(`Looking up share code: ${shareCode}`);
        
        // Query DynamoDB for the share code
        const getParams = {
            TableName: tableName,
            Key: { shareCode: shareCode }
        };
        
        const response = await docClient.send(new GetCommand(getParams));
        
        if (!response.Item) {
            return NextResponse.json({ message: 'Share code not found or expired.' }, { status: 404 });
        }
        
        const shareData = response.Item;
        console.log(`Share code ${shareCode} resolved to: ${shareData.s3Key}`);
        
        // Check if the file has expired
        if (shareData.expirationTime < Date.now()) {
            return NextResponse.json({ message: 'This share has expired.' }, { status: 410 });
        }
        
        // Generate a pre-signed URL for file download
        const getObjectParams = {
            Bucket: bucketName,
            Key: shareData.s3Key,
            // Force download for all file types by setting content-disposition header
    ResponseContentDisposition: `attachment; filename="${shareData.originalArchiveName}"`,
        };
        // Set appropriate content type based on whether it's compressed
if (shareData.isCompressed === true) {
    getObjectParams.ResponseContentType = 'application/zip';
} else {
    // For uncompressed files, still force download but use original content type when possible
    // If it's an image, this ensures proper icon in downloads but still forces download
    if (shareData.s3Key.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        getObjectParams.ResponseContentType = `image/${shareData.s3Key.split('.').pop().toLowerCase()}`;
    } else if (shareData.s3Key.match(/\.(pdf)$/i)) {
        getObjectParams.ResponseContentType = 'application/pdf';
    }
    // Other file types will use S3's content type
}
        const getCommand = new GetObjectCommand(getObjectParams);
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 }); // URL valid for 1 hour
        
        return NextResponse.json({
            message: 'Share code resolved successfully.',
            downloadUrl: presignedUrl,
            fileName: shareData.originalArchiveName,
            filesCount: shareData.filesCount,
            fileNames: shareData.fileNames || [],
            totalSize: shareData.totalSizeBytes,
            uploadedAt: shareData.uploadedAt,
            expiresAt: shareData.expirationTime
        }, { status: 200 });
        
    } catch (error) {
        console.error('Error resolving share code:', error);
        return NextResponse.json({ 
            message: 'Error resolving share code', 
            error: error.message 
        }, { status: 500 });
    }
}

// Also implement GET to support direct URL access
export async function GET(request) {
    // Extract the share code from the query string
    const { searchParams } = new URL(request.url);
    const shareCode = searchParams.get('code');
    
    if (!shareCode) {
        return NextResponse.json({ message: 'No share code provided.' }, { status: 400 });
    }
    
    // Create a POST request body with the share code
    const mockPostRequest = {
        json: async () => ({ shareCode })
    };
    
    // Reuse the POST logic
    return await POST(mockPostRequest);
}