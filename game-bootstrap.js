const cover=document.getElementById('boot-screen');
const label=document.getElementById('boot-message');
const meter=document.getElementById('boot-progress');
const retry=document.getElementById('boot-retry');
let started=false,finished=false;
function progress(value,message){meter.value=value;label.textContent=message;}
function failed(){
 if(finished)return;
 clearTimeout(deadline);cover.hidden=false;meter.hidden=true;retry.hidden=false;
 label.textContent='숲을 불러오지 못했어. 연결을 확인한 뒤 다시 열어 줘. 저장된 탐구 기록은 그대로야.';
}
retry.addEventListener('click',()=>location.reload());
const deadline=setTimeout(failed,60000);
window.addEventListener('error',()=>{if(started&&!finished)failed();});
window.addEventListener('unhandledrejection',()=>{if(started&&!finished)failed();});
window.addEventListener('life-clock-progress',event=>progress(30+event.detail.progress*.7,'탐사 그림을 펼치는 중… '+event.detail.progress+'%'));
window.addEventListener('life-clock-ready',()=>{
 if(finished)return;finished=true;clearTimeout(deadline);cover.hidden=true;
 import('./game-network.js').then(({prepareOffline})=>prepareOffline()).catch(()=>{});
},{once:true});
try{
 progress(8,'탐험 도구를 준비하는 중…');
 await new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='vendor/phaser-3.90.0.min.js';script.async=true;
  script.onload=()=>globalThis.Phaser?resolve():reject(new Error('Engine unavailable'));
  script.onerror=()=>reject(new Error('Engine could not be loaded'));document.head.append(script);
 });
 started=true;progress(25,'숲의 시간을 펼치는 중…');await import('./game-app.js');
}catch{failed();}
