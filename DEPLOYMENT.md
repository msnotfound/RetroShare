# Vercel Deployment Guide for RetroShare v1.0

This guide will help you deploy RetroShare v1.0 to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **AWS Account**: Set up S3 bucket and DynamoDB table

## Step 1: Prepare Your Repository

Ensure your repository contains:
- ✅ All source code files
- ✅ `package.json` with correct scripts
- ✅ `vercel.json` configuration
- ✅ `.gitignore` excluding large files

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Import Repository**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository: `msnotfound/RetroShare`

2. **Configure Project**
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

3. **Set Environment Variables**
   Add these environment variables in the Vercel dashboard:

   ```env
   RETROSHARE_AWS_ACCESS_KEY_ID=your_aws_access_key
   RETROSHARE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   RETROSHARE_AWS_REGION=us-east-1
   RETROSHARE_S3_BUCKET_NAME=your_s3_bucket_name
   RETROSHARE_DYNAMODB_TABLE_NAME=your_dynamodb_table_name
   FILE_EXPIRATION_HOURS=24
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add RETROSHARE_AWS_ACCESS_KEY_ID
   vercel env add RETROSHARE_AWS_SECRET_ACCESS_KEY
   vercel env add RETROSHARE_AWS_REGION
   vercel env add RETROSHARE_S3_BUCKET_NAME
   vercel env add RETROSHARE_DYNAMODB_TABLE_NAME
   ```

## Step 3: AWS Setup

### S3 Bucket Configuration

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://retroshare-files
   ```

2. **Configure CORS** (if needed)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["https://your-vercel-domain.vercel.app"],
       "ExposeHeaders": []
     }
   ]
   ```

3. **Bucket Policy** (optional)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Deny",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::retroshare-files/*"
       }
     ]
   }
   ```

### DynamoDB Table

1. **Create Table**
   ```bash
   aws dynamodb create-table \
     --table-name retroshare-shares \
     --attribute-definitions AttributeName=shareCode,AttributeType=S \
     --key-schema AttributeName=shareCode,KeyType=HASH \
     --billing-mode PAY_PER_REQUEST
   ```

### IAM Permissions

Create an IAM user with these permissions:

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

## Step 4: Verify Deployment

1. **Check Build Logs**
   - Go to your Vercel dashboard
   - Check deployment logs for any errors

2. **Test Functionality**
   - Visit your deployed URL
   - Test file upload functionality
   - Test file download functionality

3. **Monitor Logs**
   - Check Vercel function logs
   - Monitor AWS CloudWatch logs

## Step 5: Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to Vercel dashboard → Settings → Domains
   - Add your custom domain
   - Configure DNS records

2. **Update CORS** (if using custom domain)
   - Update S3 CORS policy with your custom domain

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check `package.json` scripts
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment Variables**
   - Ensure all AWS credentials are set
   - Check variable names match exactly
   - Redeploy after adding new variables

3. **API Errors**
   - Check AWS permissions
   - Verify S3 bucket and DynamoDB table names
   - Check Vercel function logs

4. **File Upload Issues**
   - Check S3 bucket permissions
   - Verify CORS configuration
   - Check file size limits

### Debug Commands

```bash
# Check Vercel deployment status
vercel ls

# View function logs
vercel logs

# Redeploy
vercel --prod
```

## Performance Optimization

1. **Enable Edge Functions** (if needed)
   - Update `vercel.json` for edge runtime
   - Optimize for global performance

2. **Caching**
   - Configure appropriate cache headers
   - Use Vercel's edge caching

3. **Monitoring**
   - Set up Vercel Analytics
   - Monitor AWS CloudWatch metrics

## Security Considerations

1. **Environment Variables**
   - Never commit AWS credentials to git
   - Use Vercel's environment variable encryption
   - Rotate AWS keys regularly

2. **CORS Configuration**
   - Restrict origins to your domain
   - Limit allowed methods

3. **File Validation**
   - Implement file type validation
   - Set appropriate file size limits

## Support

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **AWS Documentation**: [aws.amazon.com/documentation](https://aws.amazon.com/documentation)
- **GitHub Issues**: [github.com/msnotfound/RetroShare/issues](https://github.com/msnotfound/RetroShare/issues)

---

**Happy Deploying! 🚀** 