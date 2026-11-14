/* Release builder replaces the following markers with content hashes. */
const VERSION=__CACHE_VERSION__;
const FILES=__CACHE_FILES__;
const PREFIX='life-clock-assets-';
const NAME=PREFIX+VERSION;
const base=new URL('./',self.location.href);
const marker=new URL('.offline-ready',base).href;
const registryName='life-clock-release-registry';
const current=new URL('.offline-active',base).href;
const pinKey=id=>new URL('.offline-client/'+id,base).href;
const urls=new Set(FILES.map(file=>new URL(file.path,base).href));
async function report(state,extra={}){
 const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of clients)client.postMessage({type:'life-clock-cache',state,...extra});
}
async function digest(data){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',data))].map(n=>n.toString(16).padStart(2,'0')).join('');}
self.addEventListener('install',event=>event.waitUntil(installRelease()));
async function installRelease(){
 const cache=await caches.open(NAME);let cursor=0,done=0;
 try{
  const registry=await caches.open(registryName);
  const oldName=await (await registry.match(current))?.text();
  const previous=oldName&&oldName!==NAME&&await caches.has(oldName)?await caches.open(oldName):null;
  const results=await Promise.allSettled(Array.from({length:3},async()=>{
   while(cursor<FILES.length){
    const file=FILES[cursor++],url=new URL(file.path,base).href;
    let response=await previous?.match(url,{ignoreVary:true});
    // Reuse unchanged, verified bytes so returning learners only download what changed.
    if(!response?.ok||await digest(await response.clone().arrayBuffer())!==file.sha256){
     response=await fetch(url,{cache:'no-cache'});
     if(!response.ok||await digest(await response.clone().arrayBuffer())!==file.sha256)throw new Error('Release file unavailable');
    }
    // Hosts such as Cloudflare Pages redirect index.html to ./; a redirected response cannot answer a page navigation.
    if(response.redirected){const headers=new Headers(response.headers);headers.delete('content-encoding');headers.delete('content-length');response=new Response(await response.blob(),{status:200,headers});}
    await cache.put(url,response);done++;await report('progress',{percent:Math.round(done/FILES.length*100)});
   }
  }));
  if(results.some(result=>result.status==='rejected'))throw new Error('Release cache incomplete');
  await cache.put(marker,new Response(VERSION));
 }catch(error){await caches.delete(NAME);await report('failed');throw error;}
 // Every file has been verified. Open pages keep their own snapshot after activation.
 await self.skipWaiting();
}
function readyFor(client,name){
 client?.postMessage({type:'life-clock-cache',state:'ready',updateAvailable:!!name&&name!==NAME});
}
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const registry=await caches.open(registryName);
 const names=(await caches.keys()).filter(key=>key.startsWith(PREFIX));
 let previous=await (await registry.match(current))?.text();
 if(!names.includes(previous)){
  // Migrate from the earlier worker, which kept one complete active snapshot.
  for(const name of names)if(name!==NAME&&await(await caches.open(name)).match(marker)){previous=name;break;}
 }
 const keep=new Set([NAME]);
 const pins=new Map();
 const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 const liveIds=new Set(windows.map(client=>pinKey(client.id)));
 for(const key of await registry.keys())if(key.url!==current&&!liveIds.has(key.url))await registry.delete(key);
 for(const client of windows){
  const key=pinKey(client.id);
  let name=await (await registry.match(key))?.text();
  if(!names.includes(name))name=names.includes(previous)?previous:NAME;
  keep.add(name);pins.set(client,name);await registry.put(key,new Response(name));
 }
 await registry.put(current,new Response(NAME));
 for(const key of names)if(!keep.has(key))await caches.delete(key);
 if(!previous)await self.clients.claim();
 for(const [client,name] of pins)readyFor(client,name);
})()));
self.addEventListener('message',event=>{
 if(event.data?.type==='CACHE_STATUS')event.waitUntil((async()=>{
  const client=event.source;
  if(!client?.id||!await (await caches.open(NAME)).match(marker))return;
  const registry=await caches.open(registryName);
  readyFor(client,await (await registry.match(pinKey(client.id)))?.text());
 })());
});
async function fromCache(request,url,name=NAME){
 const cache=await caches.open(name),response=await cache.match(url,{ignoreVary:true});
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
  event.respondWith((async()=>{
   const cache=await caches.open(NAME);
   const page=await cache.match(new URL('index.html',base).href,{ignoreVary:true});
   if(!page)return fetch(request);
   if(event.resultingClientId){
    const registry=await caches.open(registryName);
    await registry.put(pinKey(event.resultingClientId),new Response(NAME));
   }
   const headers=new Headers(page.headers);
   headers.delete('content-encoding');headers.delete('content-length');
   return new Response(page.body,{headers});
  })());return;
 }
 url.search='';url.hash='';if(!urls.has(url.href)&&!/^\/(?:src|assets|vendor)\//.test(url.pathname))return;
 event.respondWith((async()=>{
  const key=event.clientId&&pinKey(event.clientId);
  const name=key&&await(await(await caches.open(registryName)).match(key))?.text();
  return fromCache(request,url.href,name||NAME);
 })());
});
