/* Minimal static development server; production hosting only needs the files. */
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json' };
const port = Number(process.env.PORT || 8321);
http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch (_) { res.writeHead(400).end(); return; }
  let filename = path.resolve(root, '.' + pathname);
  if (!filename.startsWith(root + path.sep) && filename !== root) { res.writeHead(403).end(); return; }
  if (pathname.split('/').some(part => part.startsWith('.') && part.length > 1)) { res.writeHead(403).end(); return; }
  if (pathname.endsWith('/')) filename = path.join(filename, pathname === '/' ? 'arcade.html' : 'index.html');
  fs.readFile(filename, (error, bytes) => {
    if (error) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    res.end(bytes);
  });
}).listen(port, '0.0.0.0', () => console.log('Candy Arcade: http://localhost:' + port + '/arcade.html'));
