// import { readFileSync } from 'fs';
// import { createServer } from 'https';
/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  experimental: {
    appDir: true,
  }, api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
    responseLimit: '100mb',
  },
  async rewrites() {
    return [
      {
        source: '/api/websocket',
        destination: '/api/websocket'
      }
    ];
  }
};
// Enable HTTPS in development
// if (process.env.NODE_ENV === 'development') {
//   const httpsOptions = {
//     key: readFileSync('./certificates/localhost-key.pem'),
//     cert: readFileSync('./certificates/localhost.pem'),
//   };

//   nextConfig.server = {
//     https: httpsOptions,
//     port: 3000,
//   };
// }

export default nextConfig
