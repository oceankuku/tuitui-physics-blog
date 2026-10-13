import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const mime = { '.html': 'text/html; charset=utf-8', '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
export async function staticServer(directory) {
  const root = resolve(directory);
  const server = createServer(async (request, response) => {
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let filename = resolve(root, '.' + path);
      if (!filename.startsWith(root + sep) && filename !== root) { response.writeHead(403).end(); return; }
      try { if ((await stat(filename)).isDirectory()) filename = resolve(filename, 'index.html'); }
      catch { filename = resolve(root, '404.html'); response.statusCode = 404; }
      let body;
      try { body = await readFile(filename); }
      catch { filename = resolve(root, '404.html'); response.statusCode = 404; body = await readFile(filename); }
      const extension = '.' + filename.split('.').at(-1);
      response.setHeader('Content-Type', mime[extension] || 'application/octet-stream');
      response.end(body);
    } catch { response.writeHead(400).end('Bad request'); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, origin: `http://127.0.0.1:${server.address().port}` };
}
