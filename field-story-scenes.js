import {fieldRecords} from './field-model.js';
import {esc} from './game-metadata.js';

// Keep the learner's own evidence on the corkboard. The table only holds
// records that have not been pinned yet, so photos never appear twice.
export const storyRoomAssets=['storyCamera','researchNotebook'];

export function storyInfoNotebook(q){
 return `<div class="notebook-book story-writing-book"><section class="notebook-page"><p class="notebook-kicker">나의 발견 연구노트</p><h3>내 탐구에 이름 붙이기</h3><label>이야기 이름<input id="story-title" type="text" maxlength="60" placeholder="내가 찾은 생명의 비밀" value="${esc(q.title)}"></label><p class="story-writing-guide">관찰 사진 ${q.records.length}장이 모였어.<br>기억에 남는 발견을 제목에 담아 줘.</p></section><section class="notebook-page"><h3>내가 설명할 수 있는 것</h3><label>관찰한 모습과 나의 설명<textarea id="story-summary" maxlength="300" placeholder="나는 …을 관찰해서 …을 알았어.">${esc(q.summary)}</textarea></label><p class="story-writing-guide">내 사진을 보고, 이제 무엇을 설명할 수 있는지<br>네 말로 써 줘.</p></section></div>`;
}

export function storyCaptionNotebook(q,records,id,image){
 const record=records.find(r=>r.id===id)||records[0];
 return `<div class="notebook-book story-writing-book"><section class="notebook-page"><p class="notebook-kicker">사진 한 장, 발견 하나</p><label>기록 고르기<select id="caption-record">${records.map(r=>`<option value="${esc(r.id)}" ${r.id===record.id?'selected':''}>${esc(r.title)}</option>`).join('')}</select></label>${image?`<img class="story-note-evidence" src="${image}" alt="${esc(record.title)}">`:''}<p class="story-writing-guide">${esc(record.title)}</p></section><section class="notebook-page"><h3>사진이 들려준 기록</h3><label>무엇을 보고 무엇을 알았니?<textarea id="story-caption" maxlength="200" placeholder="나는 사진에서 …을 보았다. 그래서 …을 알았다.">${esc(q.captions[record.id]||'')}</textarea></label><p class="story-writing-guide">본 모습 · 바꾼 조건 · 달라진 점<br>사진에서 무엇을 보았는지 써 줘.</p></section></div>`;
}

export function renderStoryRoom(v,ctx,phase){
 const q=ctx.s.field.chapters[4],bank=fieldRecords(ctx.s.field),stamp=v.renderToken;
 const reduced=ctx.s.settings.reducedMotion;
 const act=(type,payload)=>ctx.emit('act',{type,payload});
 const selected=bank.filter(r=>q.records.includes(r.id));
 const handwriting=(x,y,message,size,width)=>v.text(x,y,message,size,width,'#294e43').setFontFamily('Research Hand,Jua,Malgun Gothic,sans-serif');
 const target=(x,y,w,h,id,label)=>v.drop(x,y,w,h,id,label,()=>ctx.emit('target',id));
 const paper=(x,y,w,h)=>{
  const group=v.add.container(x,y).setSize(w,h);
  group.add(v.add.rectangle(3,5,w,h,0x253d2a,.16));
  group.add(v.add.rectangle(0,0,w,h,0xfffbed).setStrokeStyle(1,0xcab88e));
  group.add(v.add.rectangle(-w*.24,-h/2+3,54,18,0x90a78b,.86).setAngle(-9));
  return group;
 };
 const photo=(record,x,y,w,h,{kind,data={},caption='',attach=false,onTap}={})=>{
  const card=paper(x,y,w,h),imageY=-h*.13,iw=w-18,ih=h*.55;
  card.add(v.add.rectangle(0,imageY,iw,ih,0xe9e7d5));
  const short=caption.length>35?caption.slice(0,34)+'…':caption;
  card.add(handwriting(0,h*.26,short,24,w-18).setMaxLines(2));
  if(kind){
   v.draggable(card,kind,data,record.title+' '+(kind==='book'?'순서 바꾸기':attach?'눌러서 기록판에 붙이기':'기록으로 선택하기'));
   card.on('pointerdown',()=>card.setData('moved',false));
   card.on('dragstart',()=>card.setData('moved',true));
   // A successful drop rebuilds the scene before touch pointerup is delivered.
   // Ignore that old card so the same record is not toggled off immediately.
   if(onTap)card.on('pointerup',()=>{if(v.renderToken===stamp&&card.scene&&!card.getData('moved'))onTap();});
  }
  ctx.recordImage(record,ctx.s,true).then(url=>{
   if(v.renderToken!==stamp||!v.sys.isActive())return;
   const image=new Image();
   image.onload=()=>{
    if(v.renderToken!==stamp||!v.sys.isActive()||!card.scene)return;
    const key='cork-record-'+stamp+'-'+record.id+'-'+x+'-'+y;
    v.textures.addImage(key,image);v.recordTextures.push(key);
    card.addAt(v.pic(key,0,imageY,iw,ih),4);
   };
   image.onerror=()=>ctx.emit('feedback','사진을 다시 불러오려면 이 구역을 다시 열어 줘.');
   image.src=url;
  }).catch(()=>ctx.emit('feedback','기록 사진을 다시 불러오지 못했어. 구역을 다시 열어 줘.'));
  return card;
 };
 const pinSeen=new Set(ctx.ui.storyBoardSeen||[]);
 const boardPhases=['story-pick','story-edit','plan'];
 if(boardPhases.includes(phase)){
  target(640,365,565,345,'story','코르크 기록판에 붙이기');
  const boardTitle=q.title||'나의 발견 연구노트';
  v.label(640,173,boardTitle.length>23?boardTitle.slice(0,22)+'…':boardTitle,25,540);
  for(let i=0;i<6;i++){
   const x=449+(i%3)*191,y=276+Math.floor(i/3)*174;
   const id=q.records[i],r=bank.find(record=>record.id===id);
   target(x,y,176,155,'book-'+i,'기록 '+(i+1)+'번 자리');
   if(!r){
    v.add.rectangle(x,y,170,148,0x583c22,.09).setStrokeStyle(1,0xf8e8b4,.28);
    v.text(x,y,String(i+1),28,120,'#fff5d5').setAlpha(.74);
    continue;
   }
   const saved=!!q.captions[id]?.trim();
   const concise=r.title.replace(' 확대 관찰',' 관찰').replace(' 조건 비교 실험',' 비교 실험').replace(' 화분 돌봄 기록',' 돌봄').replace('이름표를 단 ','').replace('과 다음 세대',' 다음 세대');
   const card=photo(r,x,y,174,152,{kind:'book',data:{from:i},caption:saved?q.captions[id]:concise});
   card.setAngle(i%2?1.2:-1.2);
   if(!pinSeen.has(id)&&!reduced){
    card.setAlpha(0).setY(y+35).setAngle(i%2?7:-7);
    v.tweens.add({targets:card,y,alpha:1,angle:i%2?1.2:-1.2,duration:360,delay:i*65,ease:'Back.Out'});
   }
   if(phase!=='plan'){
    const button=v.text(x,y-59,saved?'✓':'＋',23,38,saved?'#35634b':'#294e43').setBackgroundColor('#f3edd4').setPadding(4,1);
    button.setX(x+64);
    v.click(x,y+43,170,70,()=>ctx.emit('caption',id),r.title+' 설명 쓰기');
    button.setDepth(3);
   }
  }
  ctx.ui.storyBoardSeen=[...q.records];
  // A quiet notebook preview on the existing easel, separate from the board.
  if(v.textures.exists('researchNotebook'))v.pic('researchNotebook',1090,382,255,320);
  else v.add.rectangle(1090,382,220,285,0xfffbed,.96).setStrokeStyle(1,0xc9bc91);
  handwriting(1090,331,'내가 알게 된 점',28,205);
  const summary=handwriting(1090,400,q.summary||'사진을 붙이고\n내 말로 설명해 보자!',26,190);
  const summaryLines=summary.getWrappedText();
  if(summaryLines.length>3){summaryLines[2]=summaryLines[2].slice(0,-1)+'…';summary.setText(summaryLines.slice(0,3).join('\n'));}
  summary.setMaxLines(3);
  v.label(1090,545,selected.length+' / 6장 · 내 탐구 기록',19,260);
 }
 if(phase==='story-help'){
  const requests=[['observation','생김새를 보여 줘'],['retry','조건을 비교한 기록는?'],['care','어떻게 돌봤니?']];
  requests.forEach(([id,label],i)=>{
   const x=449+i*191,r=bank.find(record=>record.id===q.matches[id]);
   target(x,344,178,290,'help-'+id,label+' 자리에 기록 놓기');
   const sheet=paper(x,338,174,248);
   sheet.add(handwriting(0,-89,label,25,156).setMaxLines(2));
   if(r){
    photo(r,x,364,156,155,{caption:r.title});
    v.text(x,449,'✓ 기록를 연결했어',19,180,'#21573b');
   }else{
    v.pic('storyCamera',x,349,70,70);
     handwriting(x,417,'사진을 골라\n놓아 줘',24,156);
   }
  });
 }
 if(['story-pick','story-edit','story-help'].includes(phase)){
  const remaining=phase==='story-help'?bank:bank.filter(r=>!q.records.includes(r.id));
  const pages=Math.max(1,Math.ceil(remaining.length/3));
  ctx.ui.recordPage=((ctx.ui.recordPage||0)%pages+pages)%pages;
  const list=remaining.slice(ctx.ui.recordPage*3,ctx.ui.recordPage*3+3);
  v.label(640,553,phase==='story-help'?'① 사진 선택 → ② 질문 자리에 놓기':'사진을 누르면 위 기록판에 붙어!',23,680);
  list.forEach((r,i)=>{
   const x=380+i*260;
   photo(r,x,638,230,118,{kind:'record',data:{id:r.id},caption:r.title,attach:phase!=='story-help',onTap:phase==='story-help'?undefined:()=>act('book-record',{id:r.id})});
  });
  if(!list.length)v.label(640,638,bank.length?'모은 사진을 모두 붙였어. 위 사진에 설명을 써 줘.':'앞 구역에서 모은 관찰 사진이 이곳에 나타나.',23,810);
  // Accessible tap targets use the same direct action as pointer input.
  if(phase!=='story-help')for(const r of list){
   const item=v.focusTargets.findLast?.(p=>p.label===r.title+' 눌러서 기록판에 붙이기');
   if(item)item.fn=()=>act('book-record',{id:r.id});
  }
  v.text(1090,638,(ctx.ui.recordPage+1)+' / '+pages+'쪽',22,160);
 }
 if(phase==='plan')v.label(640,625,'내가 관찰한 근거가 한 권의 연구노트가 되었어!',24,850);
}
