// Only release builds contain offline-config.json. Local source editing stays uncached.
export async function prepareOffline(){
 const panel=document.getElementById('connection-status'),label=panel.querySelector('span'),retry=panel.querySelector('button');
 let registration=null,ready=false,percent=0,problem=false,update=false,hideTimer=null,enabled=false;
 const show=()=>{
  clearTimeout(hideTimer);panel.hidden=!enabled&&navigator.onLine;if(panel.hidden)return;panel.dataset.offline=String(!navigator.onLine);
  retry.hidden=!problem||!navigator.onLine;
  label.textContent=!navigator.onLine?(ready?'인터넷이 잠시 끊겼어. 탐험과 기록은 계속할 수 있어.':'인터넷이 잠시 끊겼어. 연결되면 필요한 그림을 다시 불러올게.'):
   update?'새 버전이 준비됐어. 탐험 창을 모두 닫고 다시 열면 적용돼.':
   ready?'연결 없이도 탐험할 준비가 됐어.':
   problem?'오프라인 준비를 마치지 못했어. 연결된 동안 탐험을 계속할 수 있어.':
   '연결이 끊겨도 탐험할 수 있게 준비 중… '+percent+'%';
  if(ready&&!update)hideTimer=setTimeout(()=>{panel.hidden=true;},5000);
 };
 window.addEventListener('offline',show);window.addEventListener('online',()=>{show();if(problem)void register();});
 if(!('serviceWorker' in navigator)||!window.isSecureContext){
  if(!navigator.onLine)show();return;
 }
 navigator.serviceWorker.addEventListener('message',event=>{
  const info=event.data;if(info?.type!=='life-clock-cache')return;
  if(info.state==='ready')ready=true;
  if(info.state==='failed')problem=true;
  if(info.state==='progress'){percent=info.percent;problem=false;}
  show();
 });
 function inspect(){
  if(registration.waiting&&navigator.serviceWorker.controller){update=true;show();}
  registration.active?.postMessage({type:'CACHE_STATUS'});
 }
 async function register(){
  try{
   problem=false;
   registration=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
   show();inspect();
   registration.addEventListener('updatefound',()=>{
    const worker=registration.installing;worker?.addEventListener('statechange',()=>{
     if(worker.state==='installed'){inspect();if(!navigator.serviceWorker.controller){ready=true;show();}}
     if(worker.state==='redundant'&&!ready){problem=true;show();}
    });
   });
   await navigator.serviceWorker.ready;inspect();
  }catch{problem=true;show();}
 }
 retry.addEventListener('click',()=>void register());
 try{
  const config=await fetch('./offline-config.json',{cache:'no-cache'});
  if(!config.ok){if(!navigator.onLine)show();return;}
  if((await config.json()).enabled!==true)return;enabled=true;
  await register();
 }catch{if(!navigator.onLine)show();}
}
