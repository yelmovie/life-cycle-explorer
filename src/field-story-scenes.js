import {TEXT_LIMITS,captionText,draftValue} from './field-writing.js';
import {reducedMotion} from './game-motion.js';
import {fieldRecords,towerStep,TOWER_REGIONS,TOWER_CLAIMS} from './field-model.js';
import {esc} from './game-metadata.js';

// Keep the learner's own evidence on the corkboard. The table only holds
// records that have not been pinned yet, so photos never appear twice.
export const storyRoomAssets=['storyCamera','researchNotebook','towerEmblem0','towerEmblem1','towerEmblem2','towerEmblem3','towerGearLarge','towerGearMedium','towerBell'];
export const towerBackdrop=f=>{const step=towerStep(f);return f.chapters[4].towerRun||step==='ready'?'towerRoomAwake':step==='tower-evidence'?'towerEvidenceBoard':'towerRoomSleep';};

export function storyInfoNotebook(q){
 return `<div class="notebook-book story-writing-book"><section class="notebook-page"><p class="notebook-kicker">나의 발견 연구노트</p><h3>내 탐구에 이름 붙이기</h3><label>이야기 이름<input id="story-title" type="text" maxlength="${TEXT_LIMITS.title}" placeholder="내가 찾은 생명의 비밀" value="${esc(draftValue(q,'story','title',q.title))}"></label><p class="story-writing-guide">관찰 사진 ${q.records.length}장이 모였어.<br>기억에 남는 발견을 제목에 담아 줘.</p></section><section class="notebook-page"><h3>내가 설명할 수 있는 것</h3><label>관찰한 모습과 나의 설명<textarea id="story-summary" maxlength="${TEXT_LIMITS.summary}" placeholder="나는 …을 관찰해서 …을 알았어.">${esc(draftValue(q,'story','summary',q.summary))}</textarea></label><p class="story-writing-guide">내 사진을 보고, 이제 무엇을 설명할 수 있는지<br>네 말로 써 줘.</p></section></div>`;
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
 // ── Life clock tower ─────────────────────────────────────────────
 // The backdrop already paints the clock; sockets sit on its four brass rings
 // (1920×1080 art, centre-cropped to 16:10 → world = (px-96)×0.7407, py×0.7407).
 // The room art is redrawn 60px lower so the top socket clears the objective banner.
 const DY=60,CX=640,CY=318+DY,awake=q.towerRun,evidence=phase==='tower-evidence';
 if(!evidence)v.pic(towerBackdrop(ctx.s.field),640,400+DY,1280,800).setDisplaySize(1280,800);
 const sockets=[[640,119+DY],[844,318+DY],[640,511+DY],[440,318+DY]];
 const slotOf=c=>selected.find(r=>r.fieldEvidence.chapter===c);
 const seen=new Set(ctx.ui.towerSeen||[]);
 const gears=evidence?[]:[v.pic('towerGearLarge',290,620,170),v.pic('towerGearMedium',395,700,110)];
 if(!reduced&&awake)gears.forEach((g,i)=>v.tweens.add({targets:g,angle:i?-360:360,duration:i?6000:9000,repeat:-1}));
 const turnGears=()=>{if(!reduced)gears.forEach((g,i)=>v.tweens.add({targets:g,angle:(i?-1:1)*120,duration:900,ease:'Cubic.easeOut'}));};
 const column=title=>{v.add.graphics().fillStyle(0xfffbed,.92).fillRoundedRect(912,190,330,520,22);v.label(1077,215,title,24,300);};

 if(!evidence){
  const slotCards=[];
  sockets.forEach(([x,y],c)=>{
   const r=slotOf(c);
   if(!r){
    const emblem=v.pic('towerEmblem'+c,x,y,92).setAlpha(.55);
    v.label(x,y+62,TOWER_REGIONS[c],18,140);
    if(phase==='tower-slots'){target(x,y,150,150,'slot-'+c,TOWER_REGIONS[c]+' 칸에 끼우기');if(!reduced)v.tweens.add({targets:emblem,alpha:.85,duration:900,yoyo:true,repeat:-1});}
    return;
   }
   const card=photo(r,x,y,120,110,{caption:TOWER_REGIONS[c]});v.pic('towerEmblem'+c,x+52,y-46,44);slotCards[c]={card,record:r};
   // A newly fitted record pops in and turns the gears.
   if(!seen.has(r.id)&&!reduced){card.setScale(.4);v.tweens.add({targets:card,scale:1,duration:450,ease:'Back.Out'});turnGears();}
  });
  ctx.ui.towerSeen=[...q.records];

  if(phase==='tower-slots'){
   column(`내 기록 ${selected.length}/4`);
   // Records for regions whose socket is still empty come first.
   const remaining=bank.filter(r=>!q.records.includes(r.id)).sort((a,b)=>!!slotOf(a.fieldEvidence.chapter)-!!slotOf(b.fieldEvidence.chapter));
   const pages=Math.max(1,Math.ceil(remaining.length/3));
   ctx.ui.recordPage=((ctx.ui.recordPage||0)%pages+pages)%pages;
   remaining.slice(ctx.ui.recordPage*3,ctx.ui.recordPage*3+3).forEach((r,i)=>{
    photo(r,1077,320+i*140,270,126,{kind:'record',data:{id:r.id},caption:r.title.replace(' 확대 관찰','').replace(' 조건 비교 실험',' 실험').replace(' 화분 돌봄 기록',' 돌봄'),attach:true,onTap:()=>act('book-record',{id:r.id})});
    v.pic('towerEmblem'+r.fieldEvidence.chapter,1077-112,320+i*140-40,40);
   });
   for(const r of remaining){const item=v.focusTargets.findLast?.(p=>p.label===r.title+' 눌러서 기록판에 붙이기');if(item)item.fn=()=>act('book-record',{id:r.id});}
   v.text(1077,692,(ctx.ui.recordPage+1)+' / '+pages+'쪽',18,160);
  }
  if(['tower-note','tower-run','plan','ready'].includes(phase)){
   column(phase==='plan'?'관찰 약속':'나의 연구 노트');
   if(phase==='plan'){
    // Ring the bell to make the promise; it keeps swinging until the plan is written.
    const bell=v.pic('towerBell',1077,330,190).setOrigin(.5,.12);
    if(!reduced)v.tweens.add({targets:bell,angle:{from:-8,to:8},duration:700,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    v.click(1077,360,200,220,()=>ctx.emit('open-plan'),'종 울리고 관찰 약속하기');
    v.label(1077,520,'종을 눌러\n실제로 이어 갈 관찰을 약속해 줘!',21,280);
   }else{
    if(v.textures.exists('researchNotebook'))v.pic('researchNotebook',1077,430,290,360);
    handwriting(1077,330,q.title||'제목을 붙여 줘',26,230).setMaxLines(2);
    handwriting(1077,435,q.summary||'나는 …을 관찰해서\n…을 알았어.',22,215).setMaxLines(4);
    if(phase==='tower-note')v.click(1077,430,290,360,()=>ctx.emit('story-info'),'연구 노트 쓰기');
   }
  }
  if(phase==='tower-run'){
   // Drag the golden hand clockwise all the way round; each socket lights up as it passes.
   const L=150,hand=v.add.graphics().setPosition(CX,CY).setDepth(6);
   const drawHand=a=>{hand.clear().lineStyle(16,0xffe28a,.35).lineBetween(0,0,Math.cos(a)*L,Math.sin(a)*L).lineStyle(8,0xd6a640).lineBetween(0,0,Math.cos(a)*L,Math.sin(a)*L).fillStyle(0xd6a640).fillCircle(0,0,13);};
   drawHand(-Math.PI/2);
   const knob=v.add.circle(CX,CY-L,24,0xffd76a).setStrokeStyle(4,0x6b4a12).setDepth(7).setInteractive({useHandCursor:true});
   if(!reduced)v.tweens.add({targets:knob,scale:1.2,duration:600,yoyo:true,repeat:-1});
   v.input.setDraggable(knob);
   let progress=0,last=-Math.PI/2,done=false;
   const caption=v.label(1077,668,'금빛 손잡이를 잡고\n시계 방향으로 돌려 봐',20,300);
   const light=c=>{const s=slotCards[c];if(!s)return;v.tweens.add({targets:s.card,scale:1.35,duration:260,yoyo:true});turnGears();caption.setText(TOWER_REGIONS[c]+' · '+s.record.title);};
   const step=a=>{
    let d=a-last;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;
    if(d<=0||done)return;const before=progress;progress+=d;last=a;drawHand(a);
    knob.setPosition(CX+Math.cos(a)*L,CY+Math.sin(a)*L);
    for(let c=0;c<4;c++){const mark=c*Math.PI/2;if(before<mark+.01&&progress>=mark+.01)light(c);}
    if(progress>=2*Math.PI-.05){done=true;act('tower-run');}
   };
   knob.on('drag',p=>{const point=v.pointerWorld?.(p)||p;step(Math.atan2(point.y-CY,point.x-CX));});
   // Keyboard/tap path: each press turns a quarter.
   v.focusTargets.push({x:CX,y:CY,w:200,h:200,label:'시곗바늘 4분의 1 돌리기',fn:()=>{for(let i=0;i<9;i++)step(last+Math.PI/18);}});
  }
 }

 if(evidence){
  // Detective board: my four photos on the left, claim notes on the right, red string between.
  const spots=[[315,300],[545,300],[315,525],[545,525]];
  const placed=selected.map((r,i)=>{const [x,y]=spots[i];photo(r,x,y,200,180,{caption:TOWER_REGIONS[r.fieldEvidence.chapter]});v.pic('towerEmblem'+r.fieldEvidence.chapter,x+82,y-72,46);target(x,y,200,180,'evid-'+r.id,TOWER_REGIONS[r.fieldEvidence.chapter]+' 사진을 증거로 놓기');return {r,x,y};});
  v.label(430,640,'쪽지를 끌어 증거 사진 위에 놓아 줘',21,500);
  TOWER_CLAIMS.forEach((claim,i)=>{
   const y=250+i*175,linked=placed.find(p=>p.r.id===q.matches[claim.request]);
   const note=paper(960,y,380,130);note.add(handwriting(0,4,claim.text,30,350).setMaxLines(3));
   if(linked){
    v.add.graphics().lineStyle(4,0xb3352c,.9).lineBetween(770,y,linked.x+100,linked.y).fillStyle(0xb3352c).fillCircle(770,y,7).fillCircle(linked.x+100,linked.y,7).setDepth(5);
    v.text(960,y+52,'✓ 증거 연결',18,200,'#21573b');
   }else v.draggable(note,'claim',{request:claim.request},claim.text+' 쪽지를 증거 사진으로 옮기기');
  });
 }
}
