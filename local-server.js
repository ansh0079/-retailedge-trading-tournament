const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Serve index.html for root, otherwise serve from dist or root
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Check dist folder first for built assets
  if (req.url.startsWith('/dist/') || req.url.match(/\.(js|css)$/)) {
    filePath = '.' + req.url;
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Try dist folder as fallback
        const distPath = './dist' + req.url;
        fs.readFile(distPath, (err, distContent) => {
          if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 - File Not Found</h1>', 'utf-8');
          } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(distContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('\n🚀 Local Server Started!');
  console.log(`📊 Application running at: http://localhost:${PORT}`);
  console.log(`📂 Serving from: ./`);
  console.log(`\n✨ Open http://localhost:${PORT} in your browser`);
  console.log(`\n⚠️  Press Ctrl+C to stop the server\n`);
});
