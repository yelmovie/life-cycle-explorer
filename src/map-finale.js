// The map award plays once on the last hit. It never changes learning or certificate progress.
export function openMapFinale(host, source) {
 const doc=host.ownerDocument;
 if(!host.isConnected||doc.querySelector('.map-finale-dialog'))return;
 const dialog=doc.createElement('dialog');dialog.className='map-finale-dialog';
 dialog.setAttribute('aria-label','지도 모험 피날레');
 // Full screen on black: the film carries its own captions in its bottom band, so nothing is placed there.
 Object.assign(dialog.style,{position:'fixed',inset:'0',width:'100vw',maxWidth:'100vw',height:'100dvh',maxHeight:'100dvh',margin:'0',padding:'0',overflow:'hidden',border:'0',borderRadius:'0',background:'#000',color:'#fff',textAlign:'center',zIndex:'999'});
 const title=doc.createElement('h2');title.textContent='모든 악당을 물리쳤어!';
 Object.assign(title.style,{position:'absolute',top:'max(10px, 2dvh)',left:'max(12px, 2vw)',zIndex:'2',maxWidth:'calc(100% - 260px)',margin:'0',padding:'6px 16px',borderRadius:'999px',background:'#000a',fontSize:'clamp(18px, 3.4dvh, 28px)',lineHeight:'1.25',textAlign:'left',color:'inherit'});
 const video=doc.createElement('video');video.src=source;video.playsInline=true;video.muted=true;video.controls=false;video.autoplay=true;video.preload='metadata';video.setAttribute('aria-label','지도 탐험 피날레 영상');
 Object.assign(video.style,{position:'absolute',inset:'0',display:'block',width:'100%',height:'100%',objectFit:'contain',background:'#000'});
 const status=doc.createElement('p');status.hidden=true;status.role='status';Object.assign(status.style,{position:'absolute',left:'50%',top:'50%',zIndex:'2',width:'min(90vw, 560px)',margin:'0',padding:'14px 18px',borderRadius:'12px',background:'#172525',transform:'translate(-50%,-50%)',fontSize:'18px'});
 const close=doc.createElement('button');close.type='button';close.textContent='지도로 돌아가기';Object.assign(close.style,{position:'absolute',top:'max(10px, 2dvh)',right:'max(12px, 2vw)',zIndex:'2',minWidth:'148px',maxWidth:'100%',minHeight:'44px',padding:'6px 18px',border:'1px solid #b6cebe',borderRadius:'8px',background:'#f4f7ea',color:'#20362d',font:'600 16px/1.25 NanumSquareNeo,system-ui',cursor:'pointer'});
 dialog.append(title,video,status,close);doc.body.append(dialog);dialog.showModal();
 // This dialog has a single column; the activity dialogs use a separate header and close-button grid.
 dialog.style.display='block';
 // game-app.js plays the ending theme while this dialog is open (the film itself stays muted) and the main theme after it.
 const announce=open=>doc.dispatchEvent(new CustomEvent('map-finale',{detail:{open}}));announce(true);
 close.addEventListener('click',()=>dialog.close());
 video.addEventListener('error',()=>{status.hidden=false;status.textContent='지금은 영상을 열 수 없어. 지도 퇴치 기록은 저장됐어.';});
 dialog.addEventListener('close',()=>{video.pause();dialog.remove();announce(false);},{once:true});
 // Muted autoplay normally starts; if it is blocked, show native controls so the learner can start it.
 video.play().catch(()=>{video.controls=true;});
}
