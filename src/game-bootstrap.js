const cover=document.getElementById('boot-screen');
const label=document.getElementById('boot-message');
const meter=document.getElementById('boot-progress');
const retry=document.getElementById('boot-retry');
retry.addEventListener('click',()=>location.reload());
const deadline=setTimeout(()=>{
 label.textContent='연결이 느려서 시간이 조금 더 걸리고 있어요. 잠시 더 기다리거나 다시 열어 주세요.';
 retry.hidden=false;
},12000);
try{
 await import('./game-app.js');
 cover.hidden=true;
}catch{
 meter.hidden=true;retry.hidden=false;
 label.textContent='연구실을 불러오지 못했어요. 연결을 확인하고 다시 열어 주세요. 저장된 탐구 기록은 그대로예요.';
}finally{clearTimeout(deadline);}
