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
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);

    // Serve RetailEdge_Autonomous_Agent_v2.html as the main page
    let filePath = req.url === '/' ? './src/index_ultimate.html' : '.' + req.url;
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 - File Not Found</h1>', 'utf-8');
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
    console.log(`\n🚀 RetailEdge Autonomous Agent Server`);
    console.log(`📊 Running at http://localhost:${PORT}`);
    console.log(`📂 Serving: RetailEdge Ultimate (index_ultimate.html)`);
    console.log(`\n✨ Open http://localhost:${PORT} in your browser\n`);
    console.log(`⚠️  Remember to configure your API keys in the HTML file:`);
    console.log(`   - CLAUDE_API_KEY`);
    console.log(`   - FINNHUB_API_KEY`);
    console.log(`   - FMP_API_KEY`);
    console.log(`   - TWELVE_DATA_KEY\n`);
});
