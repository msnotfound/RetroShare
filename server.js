const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Check for certificates
try {
  if (!fs.existsSync('./certificates')) {
    fs.mkdirSync('./certificates');
    console.log('Created certificates directory. You need to generate SSL certificates.');
    console.log('Run: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certificates/localhost-key.pem -out certificates/localhost.pem');
    process.exit(1);
  }

  if (!fs.existsSync('./certificates/localhost-key.pem') || !fs.existsSync('./certificates/localhost.pem')) {
    console.log('SSL certificates not found in ./certificates directory.');
    console.log('Run: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certificates/localhost-key.pem -out certificates/localhost.pem');
    process.exit(1);
  }
} catch (err) {
  console.error('Error checking for certificates:', err);
  process.exit(1);
}

const httpsOptions = {
  key: fs.readFileSync('./certificates/localhost-key.pem'),
  cert: fs.readFileSync('./certificates/localhost.pem')
};

app.prepare().then(() => {
  const server = createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on https://localhost:3000');
  });
});
