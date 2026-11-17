import {TEXT_LIMITS,PLAN_LIMITS,captionText,draftValue} from './field-writing.js';
import {reducedMotion} from './game-motion.js';
import {fieldRecords,towerStep,TOWER_REGIONS,TOWER_EVIDENCE_TASKS} from './field-model.js';
import {esc} from './game-metadata.js';

// Keep the learner's own evidence on the corkboard. The table only holds
// records that have not been pinned yet, so photos never appear twice.
export const storyRoomAssets=['storyCamera','researchNotebook','towerEmblem0','towerEmblem1','towerEmblem2','towerEmblem3','towerGearLarge','towerGearMedium','towerBell'];
export const towerBackdrop=f=>{const step=towerStep(f);return f.chapters[4].towerRun||step==='ready'?'towerRoomAwake':step==='tower-evidence'?'towerEvidenceBoard':'towerRoomSleep';};

export function storyInfoNotebook(q){
 const plan={...q.plan,...q.drafts?.plan};
 return `<div class="notebook-book story-writing-book tower-writing-book">
 <section class="notebook-page"><h3>내가 알아낸 것</h3><label>발견 이름<input id="story-title" type="text" maxlength="${TEXT_LIMITS.title}" placeholder="내가 찾은 생명의 비밀" value="${esc(draftValue(q,'story','title',q.title))}"></label><label>발견 한 문장<textarea id="story-summary" maxlength="${TEXT_LIMITS.summary}" placeholder="나는 …을 관찰해서 …을 알았어.">${esc(draftValue(q,'story','summary',q.summary))}</textarea></label></section>
 <section class="notebook-page"><h3>다음에 관찰할 것</h3><label>어떤 생물을?<input id="plan-subject" type="text" maxlength="${PLAN_LIMITS.subject}" value="${esc(plan.subject)}"></label><label>언제 볼까?<input id="plan-when" type="text" maxlength="${PLAN_LIMITS.when}" value="${esc(plan.when)}"></label><label>무엇을 기록할까?<textarea id="plan-what" maxlength="${PLAN_LIMITS.what}">${esc(plan.what)}</textarea></label></section>
 </div><p id="story-writing-error" role="alert" tabindex="-1"></p>`;
}

export function storyCaptionNotebook(q,records,id,image){
 const record=records.find(r=>r.id===id)||records[0];
 return `<div class="notebook-book story-writing-book"><section class="notebook-page"><p class="notebook-kicker">사진 한 장, 발견 하나</p><label>기록 고르기<select id="caption-record">${records.map(r=>`<option value="${esc(r.id)}" ${r.id===record.id?'selected':''}>${esc(r.title)}</option>`).join('')}</select></label>${image?`<img class="story-note-evidence" src="${image}" alt="${esc(record.title)}">`:''}<p class="story-writing-guide">${esc(record.title)}</p></section><section class="notebook-page"><h3>사진이 들려준 기록</h3><label>무엇을 보고 무엇을 알았니?<textarea id="story-caption" maxlength="${TEXT_LIMITS.caption}" data-record-id="${esc(record.id)}" placeholder="나는 사진에서 …을 보았다. 그래서 …을 알았다.">${esc(captionText(q,record.id))}</textarea></label><p class="story-writing-guide">본 모습 · 바꾼 조건 · 달라진 점<br>사진에서 무엇을 보았는지 써 줘.</p><p class="draft-status" data-draft-status role="status">초안은 자동 보관돼. 「설명 기록」을 눌러야 제출돼.</p></section></div>`;
}

export function renderStoryRoom(v,ctx,phase){
 const q=ctx.s.field.chapters[4],bank=fieldRecords(ctx.s.field),stamp=v.renderToken;
 const reduced=reducedMotion(ctx.s.settings);
 const act=(type,payload)=>ctx.emit('act',{type,payload});
 const selected=bank.filter(r=>q.records.includes(r.id));
 const handwriting=(x,y,message,size,width)=>v.text(x,y,message,size,width,'#294e43').setFontFamily('NanumSquareNeo,Malgun Gothic,sans-serif');
 const paper=(x,y,w,h)=>{
  const group=v.add.container(x,y).setSize(w,h);
  group.add(v.add.rectangle(3,5,w,h,0x253d2a,.16));
  group.add(v.add.rectangle(0,0,w,h,0xfffbed).setStrokeStyle(1,0xcab88e));
  group.add(v.add.rectangle(-w*.24,-h/2+3,54,18,0x90a78b,.86).setAngle(-9));
  return group;
 };
 const photo=(record,x,y,w,h,{caption='',captionSize=24,onTap}={})=>{
  const card=paper(x,y,w,h),imageY=-h*.13,iw=w-18,ih=h*.55;
  card.add(v.add.rectangle(0,imageY,iw,ih,0xe9e7d5));
  const short=caption.length>35?caption.slice(0,34)+'…':caption;
  card.add(handwriting(0,h*.26,short,captionSize,w-18).setMaxLines(2));
  if(onTap)v.click(x,y,w,h,onTap,record.title+' 증거로 선택');
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
 if(phase==='tower-evidence'){
  const task=TOWER_EVIDENCE_TASKS.find(t=>t.request==='season'
   ? !selected.some(r=>r.fieldEvidence.chapter===3)
   : !q.matches[t.request]);
  if(!task)return;
  const available=chapter=>bank.filter(r=>r.fieldEvidence.chapter===chapter);
  const saved=selected.find(r=>r.fieldEvidence.chapter===task.chapter);
  const own=available(task.chapter),other=available((task.chapter+1)%4);
  const examples=task.request==='season'
   ? [own.find(r=>r.fieldEvidence.type==='comparison'),saved||own.find(r=>r.fieldEvidence.plant==='apple'),own.find(r=>r.fieldEvidence.plant==='balsam'),other[0]]
   : [own[0],other[0],own.find(r=>r.id!==own[0]?.id),available((task.chapter+2)%4)[0]];
  if(saved&&!examples.includes(saved))examples[2]=saved;
  const candidates=[...new Set(examples.filter(Boolean))];
  if(task.chapter%2===1)candidates.reverse();
  const x0=640-(candidates.length-1)*132;
  const links=v.add.graphics();
  const heading=paper(640,299,1020,116);
  heading.add(handwriting(0,0,task.question,31,924));
  TOWER_REGIONS.forEach((region,c)=>{
   const x=280+c*240,r=selected.find(item=>item.fieldEvidence.chapter===c);
   const linked=r&&(c===3||q.matches[TOWER_EVIDENCE_TASKS[c].request]===r.id);
   v.pic('towerEmblem'+c,x,170,54).setAlpha(linked||c===task.chapter?1:.55);
   v.label(x,211,(linked?'✓ ':'')+region,19,230);
   if(linked&&c!==task.chapter)links.lineStyle(4,0xa94934,.9).lineBetween(x,223,x,247).fillStyle(0xa94934,.9).fillCircle(x,244,6);
  });
  candidates.forEach((r,i)=>photo(r,x0+i*264,514,240,226,{
   caption:r.title,onTap:()=>{
    const result=ctx.emit('act',{type:'book-evidence',payload:{id:r.id,request:task.request}});
    if(result?.ok)ctx.emit('clock-tick');
   }
  }));
  return;
 }

 // The final hand crosses the four records in one turn.
 const DY=60,CX=640,CY=318+DY,awake=q.towerRun;
 v.pic(towerBackdrop(ctx.s.field),640,400+DY,1280,800).setDisplaySize(1280,800);
 const sockets=[[640,147+DY],[844,318+DY],[640,511+DY],[440,318+DY]];
 const gears=[v.pic('towerGearLarge',290,620,170),v.pic('towerGearMedium',395,700,110)];
 if(!reduced&&awake)gears.forEach((g,i)=>v.tweens.add({targets:g,angle:i?-360:360,duration:i?6000:9000,repeat:-1}));
 const cards=sockets.map(([x,y],c)=>{
  const r=selected.find(item=>item.fieldEvidence.chapter===c);
  if(!r)return null;
  const card=photo(r,x,y,148,104,{caption:TOWER_REGIONS[c],captionSize:19});
  v.pic('towerEmblem'+c,x+62,y-40,37);
  return card;
 });
 if(phase==='tower-note'){
  v.add.graphics().fillStyle(0xfffbed,.92).fillRoundedRect(922,214,320,428,22);
  v.pic('researchNotebook',1082,400,270,335);
  handwriting(1082,348,q.title||'내 발견',24,208).setMaxLines(2);
  handwriting(1082,443,q.summary||'무엇을 알았니?\n다음엔 무엇을 볼까?',22,207).setMaxLines(4);
  v.click(1082,400,280,340,()=>ctx.emit('story-info'),'연구 노트 쓰기');
 }
 if(phase!=='tower-run')return;
 const hand=v.add.graphics().setPosition(CX,CY).setDepth(9);
 const draw=a=>{const x=Math.cos(a)*150,y=Math.sin(a)*150;hand.clear().lineStyle(16,0xffe28a,.35).lineBetween(0,0,x,y).lineStyle(8,0xd6a640).lineBetween(0,0,x,y).fillStyle(0xffd76a).fillCircle(x,y,13);};
 draw(-Math.PI/2);
 v.startTower=()=>{
  v.startTower=null;
  if(reduced){ctx.emit('tower-finished');return;}
  const turn={arc:0};let lit=-1;
  v.tweens.add({targets:gears,angle:120,duration:950,ease:'Cubic.easeOut'});
  v.tweens.add({targets:turn,arc:Math.PI*2,duration:950,onUpdate:()=>{
   draw(turn.arc-Math.PI/2);
   const n=Math.min(3,Math.floor(turn.arc/(Math.PI/2)));
   if(n===lit)return;
   lit=n;ctx.emit('clock-tick');
   if(cards[n])v.tweens.add({targets:cards[n],scale:1.16,duration:120,yoyo:true});
  },onComplete:()=>ctx.emit('tower-finished')});
 };
}
