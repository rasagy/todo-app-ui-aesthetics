const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

const folders = [
  'simple', 'flat', 'neumorphism', 'futuristic', 'cyberpunk', 'swiss',
  'aurora', 'ascii', 'skeuomorphism', 'maximalism', 'material', 'biomorphic',
  'win95', 'shadcn', 'nes', 'art-deco'
];

const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const filePath = path.join(ROOT, decodeURIComponent(req.url));
      const ext = path.extname(filePath);
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
        } else {
          res.writeHead(200, { 'Content-Type': mime });
          res.end(data);
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  console.log(`Server running on port ${port}`);

  const browser = await chromium.launch();
  for (const folder of folders) {
    const page = await browser.newPage({ viewport: { width: 500, height: 500 } });
    await page.goto(`http://127.0.0.1:${port}/${folder}/index.html`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(ROOT, folder, 'screenshot.png') });
    await page.close();
    console.log(`✓ ${folder}/screenshot.png`);
  }
  await browser.close();
  server.close();
  console.log('Done!');
})();
