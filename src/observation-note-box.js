// The written observation note that sits over the butterfly room canvas, and its 「기록 완료」 button.
// Split out of game-app.js (E2); the behaviour is unchanged.
export function createNoteBox({stage,coordinates,note,save,limit}){
 let noteRect=null;const noteBox=Object.assign(document.createElement('textarea'),{id:'observation-note',className:'field-note-box',hidden:true,placeholder:'예: 애벌레의 몸에는 마디가 여러 개 있다.'});noteBox.setAttribute('aria-label','관찰한 특징 쓰기');
 noteBox.addEventListener('blur',()=>{if(!noteBox.hidden&&noteBox.value.trim()&&noteBox.value!==note().note)save(noteBox.value);});
 // The game canvas swallows focus changes, so a tap anywhere else or Enter ends the note.
 document.addEventListener('pointerdown',e=>{if(e.target!==noteBox&&document.activeElement===noteBox)noteBox.blur();},true);noteBox.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();noteBox.blur();}});
 function place(rect){noteRect=rect;if(!noteBox.isConnected)stage().append(noteBox);noteBox.hidden=!rect;if(!rect)return;const q=note();noteBox.maxLength=limit;if(document.activeElement!==noteBox)noteBox.value=q.noteDraft??q.note;const p=coordinates(rect);if(p)Object.assign(noteBox.style,{left:p.left+'px',top:p.top+'px',width:p.w+'px',height:p.h+'px'});}
 // A tablet keyboard covers the lower half of the stage: lift the note and its done button into the visible area.
 const noteDone=Object.assign(document.createElement('button'),{type:'button',className:'primary field-note-done',textContent:'기록 완료',hidden:true});
 function fit(){const vv=window.visualViewport,active=document.activeElement===noteBox&&!noteBox.hidden;noteBox.style.transform='';noteBox.style.background='';noteDone.hidden=!active;if(!active)return;if(!noteDone.isConnected)stage().append(noteDone);
  if(noteRect){const p=coordinates(noteRect);if(p)noteBox.style.height=p.h+'px';}
  const top=vv?vv.offsetTop:0,bottom=vv?top+vv.height:innerHeight,room=64;let r=noteBox.getBoundingClientRect();
  if(r.height+room+16>bottom-top){noteBox.style.height=Math.max(96,bottom-top-room-16)+'px';r=noteBox.getBoundingClientRect();}
  const shift=r.bottom+room>bottom?Math.max(top+8,bottom-room-r.height)-r.top:0;noteBox.style.transform=shift?`translate(-50%,-50%) translateY(${shift}px)`:'';noteBox.style.background=shift?'#fffdf4':'';
  const area=stage().getBoundingClientRect();Object.assign(noteDone.style,{left:(r.right-area.left-160)+'px',top:(r.bottom+shift-area.top+8)+'px'});}
 noteBox.addEventListener('focus',()=>{fit();setTimeout(fit,350);});noteBox.addEventListener('blur',()=>setTimeout(fit,0));
 return {place,fit,refresh(){if(noteRect)place(noteRect);fit();}};
}
