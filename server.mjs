import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const project = path.dirname(fileURLToPath(import.meta.url));
const previewBuild = process.argv.includes('--dist');
const root = previewBuild ? path.join(project, 'dist') : project;
const port = Number(process.env.PORT || 4186);
const mime = {'.md':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.avif':'image/avif','.ico':'image/x-icon','.woff2':'font/woff2'};
const runtimeFiles = new Set(['index.html','expedition.js','expedition-scenes.js','adventure.js','adventure.css','adventure-core.js','adventure-assets.js','adventure-map.js','adventure-export.js','inquiry-core.js','inquiry-ui.js','inquiry.css','assets.js','app.js','core.js','art.js','style.css','polish.css']);
const securityHeaders = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'"
};
function permitted(relative) {
  if (['game-app.js','game-model.js','game-scenes.js','game-records.js','game-assets.js','game-metadata.js','game.css','vendor/phaser-3.90.0.min.js','vendor/PHASER-LICENSE.md'].includes(relative)) return true;
  if (runtimeFiles.has(relative)) return true;
  if (!/^assets\/(?:(?:generated|optimized|adventure)\/)?[A-Za-z0-9_./-]+$/.test(relative)) return false;
  const parts = relative.split('/');
  return !parts.some(part => part.startsWith('.') || ['source','raw-png','originals','original-downloads'].includes(part.toLowerCase())) && !['.html','.js','.css'].includes(path.extname(relative));
}
http.createServer(async (req,res) => {
  const end = (status, message) => {res.writeHead(status, {...securityHeaders,'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});res.end(message);};
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.setHeader('Allow','GET, HEAD');return end(405,'Method not allowed');}
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname.includes('\\') || pathname.includes('\0')) return end(403,'Forbidden');
    const relative = pathname === '/' ? 'index.html' : pathname.slice(1);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + path.sep)) return end(403,'Forbidden');
    if (!permitted(relative) || !mime[path.extname(file)]) return end(404,'Not found');
    const info = await stat(file);
    if (!info.isFile()) return end(404,'Not found');
    const etag = `W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
    const headers = {...securityHeaders,'Content-Type':mime[path.extname(file)],'Cache-Control':previewBuild && relative.startsWith('assets/') ? 'public, max-age=3600, must-revalidate' : 'no-cache','ETag':etag,'Last-Modified':info.mtime.toUTCString()};
    if (req.headers['if-none-match'] === etag) {res.writeHead(304,headers);return res.end();}
    if (req.method === 'HEAD') {res.writeHead(200,{...headers,'Content-Length':info.size});return res.end();}
    const data = await readFile(file);
    res.writeHead(200,{...headers,'Content-Length':data.length});res.end(data);
  } catch {end(404,'Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Life Clock Lab${previewBuild?' (dist)':''}: http://127.0.0.1:${port}`));
