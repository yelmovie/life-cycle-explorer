import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
const project = path.dirname(fileURLToPath(import.meta.url));
const previewBuild = process.argv.includes('--dist');
const root = previewBuild ? path.join(project, 'dist') : project;
const port = Number(process.env.PORT || 4186);
const mime = {'.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.avif':'image/avif','.ico':'image/x-icon','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm','.wav':'audio/wav','.mp3':'audio/mpeg','.glb':'model/gltf-binary'};
const runtimeFiles = new Set(['index.html','src/game-bootstrap.js','src/game-network.js','src/game-shell.css','offline-config.json','manifest.webmanifest','src/field-preview.js','src/expedition.js','src/adventure-core.js','src/adventure-export.js','src/inquiry-core.js']);
const compressed=new Map();
mime['.json']='application/json; charset=utf-8';mime['.webmanifest']='application/manifest+json; charset=utf-8';
const securityHeaders = {
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'none'"
};
function permitted(relative) {
  if(relative==='src/field-mission-data.js')return true;
  if(previewBuild&&relative==='service-worker.js')return true;
  if (['src/field-writing.js','src/game-motion.js','src/field-quests.js','src/field-quest-state.js','src/field-world-effects.js','src/field-clock.js','src/field-observation-scenes.js','src/field-plant-scenes.js','src/field-story-scenes.js','src/field-notebook.js','src/field-notebook.css','src/field-specimen-3d.js','src/field-concepts.js','src/field-companion.js','src/field-certificate.js','src/field-record-art.js','src/field-model.js','src/field-content.js','src/field-flow.js','src/field-scenes.js','src/field-room-scenes.js','src/field-dialogs.js','src/ui-icons.js','src/game-info.js','src/game-audio.js','src/game-settings.js','src/settings-content.js'].includes(relative)) return true;
  if (['src/game-app.js','src/game-model.js','src/game-records.js','src/game-assets.js','src/game-metadata.js','src/game.css','vendor/phaser-3.90.0.min.js','vendor/PHASER-LICENSE.md','vendor/three-gltf-0.170.0.min.js','vendor/THREE-LICENSE.md'].includes(relative)) return true;
  if (runtimeFiles.has(relative)) return true;
  if (!/^assets\/(?:(?:generated|optimized|adventure)\/)?[A-Za-z0-9_./-]+$/.test(relative)) return false;
  const parts = relative.split('/');
  return !parts.some(part => part.startsWith('.') || ['source','raw','raw-png','originals','original-downloads'].includes(part.toLowerCase())) && !['.html','.js','.css'].includes(path.extname(relative));
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
    const data = await readFile(file);
    if (/\.(?:mp4|webm|wav|mp3)$/.test(file)) {
      headers['Accept-Ranges']='bytes';
      if(req.headers.range){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const start=match&&match[1]?Number(match[1]):match?Math.max(0,info.size-Number(match[2])):NaN;
        const endByte=match&&match[1]&&match[2]?Math.min(info.size-1,Number(match[2])):info.size-1;
        if(!match||!Number.isSafeInteger(start)||!Number.isSafeInteger(endByte)||start<0||start>endByte||start>=info.size){res.writeHead(416,{...headers,'Content-Range':`bytes */${info.size}`});return res.end();}
        res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${endByte}/${info.size}`,'Content-Length':endByte-start+1});return res.end(req.method==='HEAD'?undefined:data.subarray(start,endByte+1));
      }
    }
    let output=data;
    if(/\.(?:html|js|css|json|webmanifest|svg)$/.test(file)){
      headers.Vary='Accept-Encoding';
      const accepted=req.headers['accept-encoding']||'',encoding=/\bbr\b/.test(accepted)?'br':/\bgzip\b/.test(accepted)?'gzip':null;
      if(encoding){const key=file+encoding,previous=compressed.get(key);output=previous?.etag===etag?previous.data:encoding==='br'?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:4}}):gzipSync(data);compressed.set(key,{etag,data:output});headers['Content-Encoding']=encoding;}
    }
    res.writeHead(200,{...headers,'Content-Length':output.length});res.end(req.method==='HEAD'?undefined:output);
  } catch {end(404,'Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Life Clock Lab${previewBuild?' (dist)':''}: http://127.0.0.1:${port}`));
