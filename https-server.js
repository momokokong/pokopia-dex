// Simple self-signed HTTPS server for local PWA testing
// PWA requires HTTPS (localhost is exempt but "Add to Home Screen" needs HTTPS on mobile)
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8443;
const DIR = path.resolve(__dirname);

// Generate self-signed cert if not exists
const certPath = path.join(__dirname, 'cert.pem');
const keyPath = path.join(__dirname, 'key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.log('Need to generate self-signed cert. Run:');
  console.log('  openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function serve(req, res) {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  
  const filePath = path.join(DIR, urlPath);
  
  // Security: prevent directory traversal
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const ct = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': ct, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}

const options = {
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
};

https.createServer(options, serve).listen(PORT, () => {
  console.log(`\n🔒 HTTPS server running at https://localhost:${PORT}`);
  console.log('   (Self-signed cert — browser will warn, click "Advanced" → "Proceed")');
  console.log('   (This is for local PWA testing only)\n');
});

// Also run plain HTTP on 3457 for backward compat
http.createServer(serve).listen(3457, () => {
  console.log(`📡 HTTP server still running at http://localhost:3457`);
});