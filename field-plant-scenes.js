import {reducedMotion} from './game-motion.js';
import {seedObservation,careTimeLabels} from './field-model.js';

// Plant rooms keep the specimens at the same baseline. Every drag also has
// a labelled tap path; visual size never determines the seed's hit area.
export function renderPlantRoom(v,ctx,phase){
 const f=ctx.s.field,c=f.active,q=f.chapters[c],act=(type,payload={})=>ctx.emit('act',{type,payload});
 const reduced=reducedMotion(ctx.s.settings);
 const observationMat=(x,y,w,h)=>v.add.graphics().fillStyle(0xfffdf3,1).fillRoundedRect(x-w/2,y-h/2,w,h,20).lineStyle(2,0xc6ceb8,1).strokeRoundedRect(x-w/2,y-h/2,w,h,20);
 const card=(x,y,w,h)=>v.add.rectangle(x,y,w,h,0xfffbee,.94).setStrokeStyle(2,0xb6c8a7);
 const label=(x,y,text,size=23,w=270)=>v.label(x,y,text,size,w);
 const button=(x,y,w,text,fn,active=false)=>{
  const shadow=v.add.rectangle(x,y+4,w,64,0x244d3d,.94);const face=v.add.rectangle(x,y,w,64,active?0x3c7353:0xfffbee,.98).setStrokeStyle(2,active?0x2e5c41:0x829779);
  const caption=v.text(x,y,text,23,w-20,active?'#fffbea':'#254d3b'),height=Math.max(64,caption.height+16);shadow.setSize(w,height);face.setSize(w,height);v.click(x,y,w,height+4,fn,text);return face;
 };
 const tool=(key,x,y,kind,data,text,size=100)=>{
  const o=v.pic(key,x,y,size);v.draggable(o,kind,data,text);
  // The bean is intentionally tiny, so enlarge only its invisible hit area.
  if(size<64&&o.setInteractive){const area=new globalThis.Phaser.Geom.Rectangle(o.width/2-32/o.scaleX,o.height/2-32/o.scaleY,64/o.scaleX,64/o.scaleY);o.setInteractive(area,globalThis.Phaser.Geom.Rectangle.Contains);}
  return o;
 };
 const drop=(x,y,w,h,id,text)=>v.drop(x,y,w,h,id,text,()=>ctx.emit('target',id));
 const specimen=(key,x,y,size=280)=>{v.shadow(x,y+size*.42,size*.63);return v.pic(key,x,y,size,size);};
 const dial=(x,y,value,max,type,labels)=>{v.dial('timeWheel',x,y,value,max,'dial',labels);ctx.ui.dial={type,payload:{}};};
 const fadeSpecimen=(key,x,y,size,id,frame)=>{
  const next=specimen(key,x,y,size);ctx.ui.plantFrames||={};const previous=ctx.ui.plantFrames[id];ctx.ui.plantFrames[id]={key,frame};
  if(previous&&previous.frame!==frame&&!reduced){const old=v.pic(previous.key,x,y,size,size);next.setAlpha(0);v.tweens.add({targets:old,alpha:0,duration:600,onComplete:()=>old.destroy()});v.tweens.add({targets:next,alpha:1,duration:700});}
  return next;
 };
 const check=(yes,text)=>`${yes?'✓':'○'} ${text}`;
 if(c===1&&phase==='reason'){
  const r=q.rounds[q.round],names={a:'A만 싹이 날 거야',b:'B만 싹이 날 거야',both:'둘 다 싹이 날 거야',neither:'둘 다 싹이 안 날 거야',unsure:'아직 모르겠어'};
  label(640,175,'이 콩 실험에서는 다른 조건을 같게 하고 물·온도를 비교했어.',20,1100);
  card(275,292,300,150);label(275,275,'내 첫 예상\n'+names[r.run.prediction],24,275);
  const days=[0,r.photos.find(d=>d>=2&&d<=4),r.photos.find(d=>d>=6)];
  days.forEach((day,i)=>{const x=590+i*235;observationMat(x,302,215,165);for(const[side,dx]of [['a',-43],['b',43]]){const frame=seedObservation({...r,day},side);v.pic('pot'+frame.level,x+dx,290,84,100);v.text(x+dx,335,side.toUpperCase(),18,60);}label(x,367,day+'일 사진',20,180);});
  label(640,409,'① 마지막 사진에서 무엇이 달라졌니?',23,1000);
  for(const[result,x,text]of [['a',300,'A에서만 싹이 났어'],['b',640,'B에서만 싹이 났어'],['both',980,'둘 다 싹이 났어']])button(x,463,290,text,()=>act('seed-report',{result}),r.report?.result===result);
  label(235,550,'② 바꾼 조건',24,260);
  button(540,550,270,'물 조건',()=>act('seed-report',{reason:'water'}),r.reason==='water');button(900,550,270,'온도 조건',()=>act('seed-report',{reason:'warm'}),r.reason==='warm');
  label(235,652,'③ 처음 예상과 비교',24,270);
  for(const[expectation,x,w,text]of [['same',500,185,'예상과 같았어'],['changed',770,270,'달라서 생각을 바꿨어'],['unsure',1060,230,'처음엔 몰랐어']])button(x,652,w,text,()=>act('seed-report',{expectation}),r.report?.expectation===expectation);
  return true;
 }
 if(c===1){
  const r=q.rounds[q.round],started=!!r.run,day=started?r.day:0,variable=r.variable;
  const positions={a:390,b:790};
  for(const side of ['a','b']){
   const x=positions[side],p=r.prepared[side],state=seedObservation(r,side),cond=state.condition;
   observationMat(x,405,330,310);
   label(x,240,`화분 ${side.toUpperCase()}${side==='a'?' · 그대로':' · 바꿔 보기'}`,27,325);
   drop(x,405,285,290,'pot-'+side,'화분 '+side.toUpperCase()+'에 선택한 재료 놓기');
   if(started){fadeSpecimen('pot'+state.level,x,410,280,`seed-${q.round}-${side}`,day);label(x,600,state.detail,21,340);}
   else{
    specimen('vessel',x,410,280);
    if(p.soil){v.add.ellipse(x,423,148,42,0x614a32);for(let n=0;n<p.seeds;n++)v.pic('seed0',x-35+n*35,420,10);}
   }
   if(phase==='prepare'){
    button(x-73,565,135,check(p.soil,'흙 넣기'),()=>act('seed-prepare',{side,soil:true}),p.soil);
    button(x+78,565,145,`콩 ${p.seeds}/3 · +1`,()=>act('seed-prepare',{side,seeds:Math.min(3,p.seeds+1)}),p.seeds===3);
   }else{
    card(x,546,300,68);v.text(x,546,`물 ${cond.water?'있음':'없음'}\n온도 ${cond.warm?'알맞음':'낮음'}`,23,280);
    if(cond.water){const g=v.add.graphics().fillStyle(0x6dbbd1,.75);for(let i=0;i<3;i++)g.fillCircle(x-26+i*26,489,4);}
   }
  }
  if(phase==='prepare'){
   tool('soil',1070,370,'soil',{},'흙 주머니를 화분으로 옮기기',230);
   label(1070,492,'흙 주머니',23,250);
   tool('seed0',1070,578,'seed',{},'씨앗 한 알을 화분으로 옮기기',115/3);
   label(1070,643,'콩 한 알',23,240);
   label(590,650,'재료를 끌거나 화분 아래 버튼을 눌러 봐.',23,760);
  }
  if(phase==='design'){
   const changed=r.b.water&&r.b.warm;
   const key=variable==='water'?'watercan':'plantSensor';
   tool(key,1060,340,'seed-condition',{key:variable},variable==='water'?'B의 물 조건 바꾸기':'B의 온도 조건 바꾸기',95);
   button(1060,438,245,variable==='water'?(changed?'✓ B에 물을 주었어':'① B에 물 주기'):(changed?'✓ B의 온도 바꿨어':'① B를 알맞은 온도로'),()=>act('seed-condition',{side:'b',key:variable,value:true}),changed);
   label(1060,535,changed?'두 화분의 차이: '+(variable==='water'?'물':'온도'):'먼저 B의 조건을 바꿔 줘.',22,270);
   const prediction={a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 틈',unsure:'아직 모르겠어'}[r.prediction];
   label(590,647,`② 예상 남기기 → ③ 실험 시작${prediction?'\n내 예상: '+prediction:''}`,23,660);
  }
  if(phase==='grow'){
   dial(1070,397,day,7,'seed-day');
   label(1065,582,`직접 찍은 날\n${r.photos.length?r.photos.map(n=>n+'일').join(' · '):'아직 없음'}`,21,275);
   if(ctx.ui.crossSection)for(const side of ['a','b']){
    const state=seedObservation(r,side);label(positions[side],650,state.level?'뿌리 먼저 → 줄기와 잎':'아직 뿌리가 보이지 않아',21,340);
   }
   v.text(650,190,'씨앗 종류와 환경에 따라 싹트는 때가 달라. 두 화분의 빛·공기·흙·콩 수는 같아.',20,1080);
  }
  if(phase==='seed-next')label(640,650,'물을 주고 알맞은 온도에 둔 콩에서 싹이 났어.\n다음에는 다른 조건을 하나만 바꿔 보자.',24,850);
  if(phase==='design')v.text(590,700,variable==='water'?'같게 둔 것: 온도·빛·공기·흙·콩 종류와 수':'같게 둔 것: 물의 양·빛·공기·흙·콩 종류와 수',20,820);
  return true;
 }
 if(c!==2)return false;
 const r=q.cases[q.case],isLight=r.variable==='light',after=!!r.tool,level=after?r.day:0,labels=careTimeLabels(r);
 const image=isLight?'pale':level===2?'pot3':'dry';
 observationMat(655,420,340,370);
 fadeSpecimen(image,655,420,350,`care-${q.case}`,level);
 if(isLight&&level>0){
  // Retain the stretched stems. Recovery is observed in new green leaves,
  // rather than turning the old plant into a short, different specimen.
  const tips=[[.385,.075],[.56,.25],[.725,.33]];
  for(const[dx,dy]of tips)for(const side of [-1,1]){const o=v.add.ellipse(480+350*dx+side*11,245+350*dy-4,level===1?19:29,level===1?8:13,0x78a34c,.96).setAngle(side*28);if(!reduced)v.tweens.add({targets:o,alpha:.8,duration:1100,yoyo:true,repeat:-1});}
 }
 drop(655,420,325,360,'plant','화분에 선택한 물·빛 도구 놓기');
 if(!['care-after','care-next'].includes(phase))label(655,225,isLight?'잎빛이 옅고 줄기가 길어졌어':'잎이 축 처졌어',27,480);
 for(const [sensor,x]of [['water',350],['light',970]]){
  const measured=r.measured.includes(sensor),low=sensor===r.variable;
  card(x,298,255,78);v.text(x,298,`${sensor==='water'?'흙의 물기':'받는 빛'}\n${measured?(low?'부족':'충분'):'도구로 재어 봐'}`,23,235);
 }
 if(phase==='measure'){
  for(const[sensor,x,key]of [['water',350,'moistureSensor'],['light',970,'lightSensor']]){
   tool(key,x,490,'sensor',{sensor},sensor==='water'?'물기 재는 도구를 화분으로':'빛 재는 도구를 화분으로',105);
   button(x,595,250,check(r.measured.includes(sensor),sensor==='water'?'물기 재기':'빛 재기'),()=>act('care-measure',{sensor}),r.measured.includes(sensor));
  }
  label(655,655,'양쪽의 물기 재기·빛 재기 버튼을 눌러 줘.',23,620);
 }
 if(phase==='symptom'){
  let pinBusy=false;
  const choose=(part,feature)=>{if(pinBusy)return;pinBusy=true;act('care-pin',{part,feature});};
  const leafFeature=isLight?'pale-leaf':'drooping-leaf';
  v.drop(655,490,210,90,'care-soil','흙 · 마른 흙에 표시',()=>choose('soil','dry-soil'));
  v.drop(655,320,250,150,'care-leaf',isLight?'잎 · 옅어진 잎빛에 표시':'잎 · 처진 잎에 표시',()=>choose('leaf',leafFeature));
  button(350,495,250,'① 흙 · 마른 흙',()=>choose('soil','dry-soil'));
  button(970,495,250,isLight?'② 잎 · 옅어진 잎빛':'② 잎 · 처진 잎',()=>choose('leaf',leafFeature));
  label(655,657,'관찰한 부위와 특징을 골라 줘.\n원인은 모습만으로 정하지 않고 물기·빛 측정과 함께 판단해.',22,930);
 }
 if(phase==='care-before')label(655,650,'오른쪽 아래 사진 버튼을 눌러 지금 모습을 기록해 줘.',24,760);
 if(phase==='care'){
  tool('watercan',350,460,'care-tool',{tool:'water'},'물로 돌보기',110);
  tool('lamp',970,460,'care-tool',{tool:'light'},'빛으로 돌보기',110);
  button(350,575,250,'알맞게 물 주기',()=>act('care-tool',{tool:'water'}));
  button(970,575,250,'빛이 드는 곳으로',()=>act('care-tool',{tool:'light'}));
  label(655,657,'시든 모습만 보고 정하지 말고, 물·빛을 잰 결과를 비교해 줘.',23,830);
 }
 if(phase==='care-after'){
  dial(1070,478,r.day,2,'care-day',labels);
  label(350,525,labels[r.day],26,270);
  label(655,650,isLight?(r.day===0?'빛을 받을 수 있도록 옮겼어. 시간이 흐른 뒤 새잎을 관찰하자.':r.day===1?'긴 줄기는 그대로야. 새로 나오는 잎의 색을 살펴봐.':'새잎이 더 초록빛으로 자랐어. 전후 사진으로 확인해 봐.'):(r.day===2?'이 화분은 잎이 다시 섰어. 전후 사진으로 확인해 봐.':'흙에 물을 주었어. 시간이 흐른 뒤 잎의 모습을 살펴봐.'),23,820);
  v.text(655,702,'관찰 모형이야. 실제 회복 모습과 걸리는 시간은 식물과 환경에 따라 달라.',20,950);
  const effectKey=`${q.case}:${r.tool}`;
  if(r.day===0&&ctx.ui.careApplied!==effectKey){
   ctx.ui.careApplied=effectKey;
   if(!reduced&&!isLight)for(let i=0;i<5;i++){
    const drop=v.add.ellipse(730+i*7,355,6,12,0x69aeca,.9);v.tweens.add({targets:drop,x:655+i*5,y:470,alpha:0,delay:i*100,duration:600,onComplete:()=>drop.destroy()});
   }
   if(!reduced&&isLight){const ray=v.add.rectangle(655,380,270,330,0xf8f4da,.30);v.tweens.add({targets:ray,alpha:0,duration:1100,onComplete:()=>ray.destroy()});}
  }
 }
 if(phase==='care-next')label(655,650,'측정 → 관찰 표시 → 사진 → 돌봄 → 시간 뒤 비교\n네가 찾은 기록이 실험일지에 남았어.',24,850);
 return true;
}
