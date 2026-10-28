import {SORT_CARDS,SORT_BINS,CORE_PLANT_CARDS} from './field-content.js';
import {reducedMotion} from './game-motion.js';
import {roomPhase} from './field-flow.js';
import {renderObservationRoom} from './field-observation-scenes.js';
import {renderPlantRoom} from './field-plant-scenes.js';
import {renderStoryRoom,storyRoomAssets} from './field-story-scenes.js';
import {renderQuestRoom,questReady,DISCOVERY_MISSIONS} from './field-quests.js';
import {fieldRecords} from './field-model.js';
import {FIELD_CHAPTERS,FORM_NAMES,FORM_TRAITS} from './field-content.js';

const ROOM_ART=[['fieldClearing','egg','larva','pupa','adult','leaf','observationLens'],['bg2','vessel','soil','seed0','pot0','pot1','pot2','pot3','watercan','watercanPour','thermometer','heatMat','lamp','timeWheel'],['bg4','dry','pale','paleRecover1','paleRecover2','dryRecover1','pot3','watercan','lamp','lightSensor','moistureSensor','timeWheel'],['gardenSeasons','egg','larva','pupa','adult','puppy','dogYoung','dog','timeWheel','seasonCompass','appleSpring','appleSummer','apple','winter','balsam','balsamDry','balsamSprout','balsamSeeds','rose'],['towerRoomSleep','towerRoomAwake','towerEvidenceBoard',...storyRoomAssets]];
const QUEST_ART=[['leaf','pupa','egg','larva','adult'],['vessel','pot0'],['pot3','pale'],['appleSpring','balsamSprout','storyCamera'],['storyCamera']];
export const fieldRoomAssets=ctx=>[...new Set([...ROOM_ART[ctx.s.field.active],...(ctx.s.field.active===3?SORT_CARDS.map(c=>c.art).filter(Boolean):[]),...QUEST_ART[ctx.s.field.active],FIELD_CHAPTERS[ctx.s.field.active].art,'paperCard','rewardRays'])];
const names={water:'물',warm:'온도',light:'빛'}, seasons=['첫봄','여름','가을','겨울','다음 봄'];
const APPLES=['appleSpring','appleSummer','apple','winter','appleSpring'],BALSAMS=['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'];
export function renderFieldRoom(v,ctx){
 const f=ctx.s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),act=(type,payload={})=>ctx.emit('act',{type,payload});
 const target=(x,y,w,h,id,label)=>v.drop(x,y,w,h,id,label,()=>ctx.emit('target',id));
 const tool=(key,x,y,kind,data={},label='')=>{const o=v.pic(key,x,y,115);v.draggable(o,kind,data,label||key);return o;};
 const token=(text,x,y,kind,data={},w=155)=>{const plate=v.add.rectangle(0,0,w,68,0xfff7d9).setStrokeStyle(3,0xa88a43),label=v.text(0,0,text,26,w-12);const o=v.add.container(x,y,[plate,label]).setSize(w,68);v.draggable(o,kind,data,text+' 옮기기');return o;};
 // A garden name tag: pointed paper tag with an eyelet and a string loop.
 const tagShape=(text,x,y)=>{const g=v.add.graphics().fillStyle(0xfff4cf).lineStyle(3,0x8a6a35).beginPath().moveTo(-58,-30).lineTo(42,-30).lineTo(66,0).lineTo(42,30).lineTo(-58,30).closePath().fillPath().strokePath();g.fillStyle(0x8a6a35).fillCircle(46,0,6).lineStyle(2,0xb2945a).strokeEllipse(76,-10,30,40);return v.add.container(x,y,[g,v.text(-8,0,text,26,96,'#4a3a1a')]).setSize(150,64).setAngle(-6);};
 const nameTag=(text,x,y,data)=>{const o=tagShape(text,x,y);v.draggable(o,'tag',data,text+' 이름표 옮기기');return o;};
 const check=(x,y,yes)=>{if(yes)v.text(x,y,'✓',35,50,'#21573b');};
 // The garden art already paints two easel boards, so plants sit on them without an extra paper card.
 const plant=(key,x,y,size=260)=>{v.shadow(x,y+size*.40,size*.65);return v.pic(key,x,y,size,size);};
 const line=(x1,y1,x2,y2)=>v.add.graphics().lineStyle(5,0xffe8a9,.9).lineBetween(x1,y1,x2,y2);
 const tag=(x,y,text)=>v.label(x,y,text,22,250);
 const dayDial=(key,x,y,value,max,type,payload={},labels)=>{v.dial(key,x,y,value,max,'dial',labels);ctx.ui.dial={type,payload};};
 const choice=(x,y,w,text,fn,subject)=>{v.add.graphics().fillStyle(0xfff7d9).fillRoundedRect(x-w/2,y-26,w,52,14).lineStyle(3,0xa88a43).strokeRoundedRect(x-w/2,y-26,w,52,14);v.text(x,y,text,21,w-12,'#244d3c');v.click(x,y,w,52,fn,subject+': '+text);};
 // One plant's year as small photos on a tag line. An unbroken line means the
 // same plant lived on; for balsam the line breaks into a seed arrow before the
 // new B-02 sprout, so a new generation is visible, not just told.
 const yearStrip=(id,x,y,steps,{current=-1,shown=()=>true,gap=70}={})=>{
  const apple=id==='apple',arts=apple?APPLES:BALSAMS,xs=steps.map((_,i)=>x+(i-(steps.length-1)/2)*gap),by=y+44,line=v.add.graphics();
  for(let i=0;i<steps.length-1;i++){
   if(!shown(steps[i])||!shown(steps[i+1]))continue;
   if(apple||steps[i+1]!==4){line.lineStyle(6,0x5d8a4a,.95).lineBetween(xs[i],by,xs[i+1],by);continue;}
   for(let t=.15;t<.75;t+=.2)line.lineStyle(4,0x9b6a3a).lineBetween(xs[i]+(xs[i+1]-xs[i])*t,by,xs[i]+(xs[i+1]-xs[i])*(t+.1),by);
   line.fillStyle(0x9b6a3a).fillTriangle(xs[i+1]-24,by-7,xs[i+1]-24,by+7,xs[i+1]-12,by);
  }
  steps.forEach((n,i)=>{
   const sx=xs[i],on=n===current;
   v.add.graphics().fillStyle(0xfffbed,.96).fillRoundedRect(sx-27,y-27,54,54,10).lineStyle(on?4:2,on?0xd39b36:0xb9a676).strokeRoundedRect(sx-27,y-27,54,54,10);
   if(!shown(n)){v.text(sx,y,'?',24,40,'#8a7a55');return;}
   v.pic(arts[n],sx,y,48,48);
   const chip=apple?'A-01':n===4?'B-02':n===3?'씨앗':'B-01',seed=!apple&&n===3,born=!apple&&n===4;
   v.add.graphics().fillStyle(born?0xd6ecc9:seed?0xf6e2c8:0xfff4cf).fillRoundedRect(sx-27,by-12,54,24,8).lineStyle(2,born?0x3f7a4e:0x8a6a35).strokeRoundedRect(sx-27,by-12,54,24,8);
   v.text(sx,by,chip,15,52,born?'#21573b':seed?'#7a3f1c':'#4a3a1a');
  });
 };
 if(phase==='discovery'){renderQuestRoom(v,ctx);return;}
 if(phase==='ready'){
  v.pic(c===4?'guideStory':'guideCare',370,440,370,440);const art=FIELD_CHAPTERS[c].art;
  const rays=v.pic('rewardRays',800,360,520).setAlpha(.85);
  const reward=v.pic(art,800,360,280);v.shadow(800,510,260);
  if(!reducedMotion(ctx.s.settings))v.tweens.add({targets:rays,angle:360,duration:24000,repeat:-1});
  v.label(800,560,FIELD_CHAPTERS[c].reward,38,530);v.text(800,620,FIELD_CHAPTERS[c].use,24,530);
  if(questReady(f,c))v.label(800,678,'✓ '+DISCOVERY_MISSIONS[c].name+' 도장',23,600);
  if(!reducedMotion(ctx.s.settings))v.tweens.add({targets:reward,y:340,duration:1300,yoyo:true,repeat:-1});return;
 }
 if(c===0){renderObservationRoom(v,ctx,phase);return;}
 if(c===1||c===2){renderPlantRoom(v,ctx,phase);return;}
 if(c===3){
  if(phase==='animals'||phase==='animal-birth'){
   // Centres of the two easel boards painted in the garden background.
   const BX=[452,825],a=q.animals;v.pic(['egg','larva','pupa','adult'][phase==='animal-birth'?3:a.butterfly.step],BX[0],345,phase==='animal-birth'?230:a.butterfly.step===0?110:230);v.pic(['puppy','dogYoung','dog'][a.dog.step],BX[1],345,250,230);v.label(BX[0],205,'나비의 시간',26,300);v.label(BX[1],205,'개의 시간',26,300);
   if(phase==='animals'){
    v.dial('timeWheel',BX[0],598,a.butterfly.step,3,'animal-dial-butterfly',['알','애벌레','번데기','어른벌레'],168);v.dial('timeWheel',BX[1],598,a.dog.step,2,'animal-dial-dog',['갓 태어난 강아지','어린 개','다 자란 개'],168);
   }else{v.pic('egg',BX[0],590,100/3);v.pic('puppy',BX[1],590,130);target(630,465,220,95,'birth-different','부모와 다른 생명');v.label(630,465,'부모와 다른 생명',24,250);target(630,590,220,85,'birth-same','부모와 같은 몸');v.label(630,590,'부모와 같은 몸',24,230);token('다음 세대',630,290,'birth',{},200);}
   return;
  }
  if(['tags','seasons','plant-identity'].includes(phase)){
   const step=q.season,balsamNew=step===4&&phase!=='tags';
   plant(APPLES[step],452,335,265);
   // Next spring: last year's B-01 plant is gone (a faded husk with its old tag); the sprout beside it is new.
   if(balsamNew){v.pic('balsamDry',730,410,110).setAlpha(.38);tagShape('B-01',738,470).setScale(.55).setAngle(16).setAlpha(.7);plant('balsamSprout',870,355,200);}
   else plant(BALSAMS[step],825,345,240);
   target(452,330,320,300,'plant-apple','사과나무 이름표');target(825,330,320,300,'plant-balsam','봉선화 이름표');
   v.label(452,205,'사과나무'+(q.tags.includes('apple')?' · A-01':''),27,340);v.label(825,205,'봉선화'+(q.tags.includes('balsam')?(balsamNew?' · B-02':' · B-01'):''),27,340);
   // Tags already hung show on the plant; unused tags wait in the tray below.
   if(q.tags.includes('apple'))tagShape('A-01',548,250);if(q.tags.includes('balsam'))tagShape(balsamNew?'B-02':'B-01',915,250);
   if(phase==='tags'){v.label(640,535,'이름표를 끌어 식물에 달아 줘',23,420);if(!q.tags.includes('apple'))nameTag('A-01',540,610,{plant:'apple'});if(!q.tags.includes('balsam'))nameTag('B-01',740,610,{plant:'balsam'});return;}
   // Each plant's year sits under its easel, so last year and this year are compared side by side.
   const shown=id=>n=>n<=step||q.plantPhotos.includes(`${id}-${n}`);
   yearStrip('apple',452,525,[0,1,2,3,4],{current:step,shown:shown('apple')});yearStrip('balsam',825,525,[0,1,2,3,4],{current:step,shown:shown('balsam')});
   dayDial('seasonCompass',1115,470,step,4,'season',{},seasons);
   if(phase==='seasons')v.label(640,640,step<3?'시간을 겨울과 다음 봄까지 돌려 봐.':'이름표 줄이 끊기지 않고 이어질까?',23,620);
   else for(const [id,x,name] of [['apple',452,'사과나무'],['balsam',825,'봉선화']]){
    const answer=q.classifications[id];
    if(answer)v.label(x,640,answer==='same'?'✓ 작년 그 나무 · 겨울을 견뎠어':'✓ 씨앗에서 새로 자란 봉선화',21,340);
    else{choice(x-80,640,150,'작년 그 식물',()=>act('plant-classify',{plant:id,answer:'same'}),name);choice(x+80,640,150,'새로 자란 식물',()=>act('plant-classify',{plant:id,answer:'new'}),name);}
   }
   return;
  }
  if(phase==='transfer'){
   // 생물 탐정 분류: unsorted cards on top, two answer boxes below. Animals first, then plants.
   const group='plant';
   const cards=SORT_CARDS.filter(x=>CORE_PLANT_CARDS.includes(x.id)),left=cards.filter(x=>q.transfers[x.id]!==x.bin);
   v.label(640,205,`사과나무처럼 살까, 봉선화처럼 살까?  ${cards.length-left.length}/${cards.length}`,24,1000);
   const card=(x,y,c,small=false)=>{
    const w=small?96:150,h=small?104:170,g=v.add.graphics().fillStyle(0xfffbed).fillRoundedRect(-w/2,-h/2,w,h,14).lineStyle(3,0x8a6a35).strokeRoundedRect(-w/2,-h/2,w,h,14);
    const parts=[g];
    if(c.art&&v.textures.exists(c.art))parts.push(v.pic(c.art,0,small?-12:-18,small?70:118),v.text(0,h/2-(small?16:24),c.name,small?18:23,w-10));
    else parts.push(v.text(0,0,c.name,small?22:32,w-12));
    return v.add.container(x,y,parts).setSize(w,h);
   };
   left.forEach((c,i)=>{const o=card(640+(i-(left.length-1)/2)*172,345,c);v.draggable(o,'sort',{card:c.id},c.name+' 카드 옮기기');});
   SORT_BINS[group].forEach(([bin,title],i)=>{
    const x=i?885:395,y=600,w=440,h=200;
    v.add.graphics().fillStyle(0xfffbed,.88).fillRoundedRect(x-w/2,y-h/2,w,h,18);v.dashedBox(x,y,w,h);
    v.label(x,y-h/2,title,24,420);
    target(x,y,w,h,'sort-'+bin,title+' 상자');
    // The garden plants the child just tracked are the worked example for each box.
    const example=bin==='many'?'apple':'balsam';
    yearStrip(example,x-118,y-8,[0,3,4],{gap:64});
    v.text(x-118,y+70,example==='apple'?'예: 사과나무 A-01':'예: 봉선화 B-01 → B-02',16,200,'#4a3a1a');
    cards.filter(c=>q.transfers[c.id]===bin).forEach((c,n)=>card(x+60+n*100,y+18,c,true));
   });
   return;
  }
 }
 if(c===4){renderStoryRoom(v,ctx,phase);return;}
}
