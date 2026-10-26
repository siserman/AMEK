// Minimal static server for local play: node tools/serve.mjs [port]
// (ES modules and fetch() need http://, opening index.html as a file won't work)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 8080;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml' };

http
  .createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(root, rel);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    if (rel.endsWith('/')) file = path.join(file, 'index.html');
    fs.readFile(file, (err, buf) => {
      if (err) return res.writeHead(404).end('not found');
      res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' }).end(buf);
    });
  })
  .listen(port, () => console.log(`AMEK läuft auf http://localhost:${port}/`));
