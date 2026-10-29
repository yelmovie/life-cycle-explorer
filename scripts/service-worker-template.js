/* Release builder replaces the following markers with content hashes. */
const VERSION=__CACHE_VERSION__;
const FILES=__CACHE_FILES__;
const PREFIX='life-clock-assets-';
const NAME=PREFIX+VERSION;
const base=new URL('./',self.location.href);
const marker=new URL('.offline-ready',base).href;
const urls=new Set(FILES.map(file=>new URL(file.path,base).href));
async function report(state,extra={}){
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of clients)client.postMessage({type:'life-clock-cache',state,...extra});
}
async function digest(data){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(NAME);let cursor=0,done=0;
 try{
  const results=await Promise.allSettled(Array.from({length:3},async()=>{
   while(cursor<FILES.length){
    const file=FILES[cursor++],url=new URL(file.path,base).href;
    let response=await fetch(url,{cache:'no-cache'});
    if(!response.ok||await digest(await response.clone().arrayBuffer())!==file.sha256)throw new Error('Release file unavailable');
    // Hosts such as Cloudflare Pages redirect index.html to ./; a redirected response cannot answer a page navigation.
    if(response.redirected){const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');response=new Response(await response.blob(),{status:200,headers});}
    await cache.put(url,response);done++;await report('progress',{percent:Math.round(done/FILES.length*100)});
   }
  }));
  if(results.some(result=>result.status==='rejected'))throw new Error('Release cache incomplete');
  await cache.put(marker,new Response(VERSION));await report('ready');
 }catch(error){await caches.delete(NAME);await report('failed');throw error;}
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==NAME)await caches.delete(key);
 // Normal lifecycle activates updates only when no page uses the older version.
 await self.clients.claim();await report('ready');
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='CACHE_STATUS')event.waitUntil((async()=>{
  const cache=await caches.open(NAME);if(await cache.match(marker))event.source?.postMessage({type:'life-clock-cache',state:'ready'});
 })());
});
async function fromCache(request,url){
 const cache=await caches.open(NAME),response=await cache.match(url);
 if(!response||response.redirected&&request.mode==='navigate')return fetch(request);
 if(!request.headers.has('range'))return response;
 const bytes=await response.arrayBuffer(),size=bytes.byteLength;
 const match=/^bytes=(\d*)-(\d*)$/.exec(request.headers.get('range'));
 const start=match&&match[1]?Number(match[1]):match&&match[2]?Math.max(0,size-Number(match[2])):NaN;
 const end=match&&match[1]&&match[2]?Math.min(size-1,Number(match[2])):size-1;
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start<0||start>=size)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${size}`}});
 const headers=new Headers(response.headers);headers.delete('content-encoding');headers.set('Content-Range',`bytes ${start}-${end}/${size}`);headers.set('Content-Length',String(end-start+1));headers.set('Accept-Ranges','bytes');
 return new Response(bytes.slice(start,end+1),{status:206,headers});
}
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);if(url.origin!==base.origin)return;
 if(request.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===base.pathname+'index.html')){
  event.respondWith(fromCache(request,new URL('index.html',base).href));return;
 }
 url.search='';url.hash='';if(urls.has(url.href))event.respondWith(fromCache(request,url.href));
});
