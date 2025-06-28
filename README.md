# RetroShare v1.0

> **Instant file transfer across dimensions** 🚀

A retro-themed file sharing service that allows users to upload files to AWS S3 and share them via unique 6-character codes. Built with Next.js, TypeScript, and AWS services.

![RetroShare Demo](https://img.shields.io/badge/Status-Demo%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-1.0.0-orange)

## ✨ Features

### 🔐 **Code-Based File Sharing**
- Upload multiple files simultaneously
- Automatic file compression and archiving
- Generate unique 6-character share codes
- Secure file storage on AWS S3
- One-click file downloads

### 🎨 **Retro Aesthetic**
- Cyberpunk-inspired UI design
- Retro gaming color scheme
- Responsive design for all devices
- Smooth animations and transitions

### 🛡️ **Security & Reliability**
- HTTPS encryption
- AWS S3 secure storage
- DynamoDB for metadata management
- Automatic file expiration
- Presigned download URLs

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AWS Services  │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (S3 + DDB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **Backend**: Node.js, Express (via Next.js API routes)
- **Storage**: AWS S3, AWS DynamoDB
- **Authentication**: AWS IAM
- **Deployment**: Custom HTTPS server

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- AWS Account with S3 and DynamoDB access
- SSL certificates for HTTPS

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/msnotfound/RetroShare.git
   cd RetroShare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up AWS credentials**
   ```bash
   # Create .env.local file
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=your_region
   S3_BUCKET_NAME=your_bucket_name
   DYNAMODB_TABLE_NAME=your_table_name
   ```

4. **Generate SSL certificates**
   ```bash
   mkdir certificates
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
     -keyout certificates/localhost-key.pem \
     -out certificates/localhost.pem
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   https://localhost:3000
   ```

## 📁 Project Structure

```
RetroShare/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── s3-compress-and-upload/  # File upload endpoint
│   │   └── resolve-code/           # File download endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── FileDownloader.tsx
│   └── MultiFilePicker.tsx
├── lib/                  # Utility functions
├── server.js             # Custom HTTPS server
├── certificates/         # SSL certificates
└── aws/                  # AWS configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=retroshare-files
DYNAMODB_TABLE_NAME=retroshare-shares

# Optional: File expiration (in hours)
FILE_EXPIRATION_HOURS=24
```

### AWS Setup

1. **Create S3 Bucket**
   - Bucket name: `retroshare-files`
   - Region: Your preferred region
   - Enable versioning (optional)

2. **Create DynamoDB Table**
   - Table name: `retroshare-shares`
   - Partition key: `shareCode` (String)
   - Sort key: `createdAt` (String)

3. **IAM Permissions**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject"
         ],
         "Resource": "arn:aws:s3:::retroshare-files/*"
       },
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:PutItem",
           "dynamodb:GetItem",
           "dynamodb:DeleteItem",
           "dynamodb:Query"
         ],
         "Resource": "arn:aws:dynamodb:*:*:table/retroshare-shares"
       }
     ]
   }
   ```

## 📖 Usage

### Uploading Files

1. **Select Files**
   - Drag and drop files onto the upload area
   - Or click "SELECT FILES" to browse
   - Supports multiple files simultaneously

2. **Upload**
   - Click "UPLOAD FILES"
   - Files are automatically compressed into a ZIP archive
   - Uploaded to AWS S3 with secure access

3. **Share**
   - A unique 6-character code is generated
   - Copy the code to share with others
   - Code expires after 24 hours (configurable)

### Downloading Files

1. **Enter Share Code**
   - Input the 6-character code from the sender
   - Code is case-insensitive

2. **Download**
   - Click "DOWNLOAD FILES"
   - Files are automatically downloaded as a ZIP archive
   - Original file structure is preserved

## 🔒 Security Features

- **HTTPS Only**: All communication is encrypted
- **Presigned URLs**: Temporary, secure download links
- **File Expiration**: Automatic cleanup of old files
- **No File Access**: Direct S3 access is blocked
- **Rate Limiting**: Built-in protection against abuse

## 🎯 API Endpoints

### POST `/api/s3-compress-and-upload`
Upload and compress files to S3.

**Request:**
- Content-Type: `multipart/form-data`
- Body: File uploads

**Response:**
```json
{
  "message": "Files uploaded successfully",
  "shareCode": "ABC123",
  "archiveName": "files_20241201.zip",
  "filesCount": 3,
  "fileNames": ["file1.txt", "file2.jpg", "file3.pdf"]
}
```

### POST `/api/resolve-code`
Resolve a share code and get download URL.

**Request:**
```json
{
  "shareCode": "ABC123"
}
```

**Response:**
```json
{
  "downloadUrl": "https://s3.amazonaws.com/...",
  "archiveName": "files_20241201.zip",
  "expiresAt": "2024-12-02T00:00:00Z"
}
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

RetroShare v1.0 is optimized for Vercel deployment. Follow these steps:

1. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel
   ```

2. **Set Environment Variables**
   In your Vercel dashboard, add these environment variables:
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=your_s3_bucket_name
   DYNAMODB_TABLE_NAME=your_dynamodb_table_name
   FILE_EXPIRATION_HOURS=24
   ```

3. **Detailed Guide**
   See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Vercel deployment instructions.

### Production Build
```bash
npm run build
npm start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **Tailwind CSS** for the utility-first styling
- **Radix UI** for accessible components
- **AWS** for reliable cloud services
- **NES.css** for the retro aesthetic inspiration

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/msnotfound/RetroShare/issues)
- **Discussions**: [GitHub Discussions](https://github.com/msnotfound/RetroShare/discussions)
- **Email**: support@retroshare.dev

---

**Made with ❤️ by msnotfound**

*RetroShare v1.0 - Instant file transfer across dimensions* 