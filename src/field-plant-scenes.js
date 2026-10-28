import {reducedMotion} from './game-motion.js';
import {seedObservation,careTimeLabels,seedExpectation} from './field-model.js';

// Plant rooms keep the specimens at the same baseline. Every drag also has
// a labelled tap path; visual size never determines the seed's hit area.
export function renderPlantRoom(v,ctx,phase){
 const f=ctx.s.field,c=f.active,q=f.chapters[c],act=(type,payload={})=>ctx.emit('act',{type,payload});
 const reduced=reducedMotion(ctx.s.settings);
 const observationMat=(x,y,w,h)=>v.paper(x,y,w,h);
 const card=(x,y,w,h)=>v.paper(x,y,w,h);
 // A card that grows with its caption, since the 20px reading floor can make two lines taller than the design.
 const cardText=(x,y,w,h,message)=>{const t=v.text(x,y,message,23,w-20).setDepth(2);card(x,y,w,Math.max(h,t.height+16));return t;};
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
 const thermo=(x,y,temp,h=140)=>{
  // In the 1024px art the tube runs from 0°C at y=684 to 30°C at y=208; the bulb top is y=770.
  const s=(h+90)/1024,art=v.pic('thermometer',0,0,h+90),g=v.add.graphics(),txt=v.text(0,-(h+90)/2-14,temp+'°C',24,100,'#a8352b');
  const draw=t=>{const top=(684-476*Math.min(1,Math.max(0,t/30))-512)*s,bottom=(770-512)*s;g.clear().fillStyle(0xd23a2e).fillRect(-6*s*1.6,top,12*s*1.6,bottom-top);};
  draw(temp);const c=v.add.container(x,y,[art,g,txt]).setSize(80,h+90);
  c.setTemp=t=>{draw(t);txt.setText(Math.round(t)+'°C');return c;};return c;
 };
 const check=(yes,text)=>`${yes?'✓':'○'} ${text}`;
 if(c===1&&phase==='reason'){
  const r=q.rounds[q.round],names={a:'A만 싹이 날 거야',b:'B만 싹이 날 거야',both:'둘 다 싹이 날 거야',neither:'둘 다 싹이 안 날 거야',unsure:'아직 모르겠어'};
  card(275,302,300,165);label(275,302,'내 첫 예상\n'+names[r.run.prediction],24,275);
  const days=[0,r.photos.find(d=>d>=2&&d<=4),r.photos.find(d=>d>=6)];
  days.forEach((day,i)=>{const x=590+i*235;observationMat(x,302,215,165);for(const[side,dx]of [['a',-43],['b',43]]){const frame=seedObservation({...r,day},side);v.pic('pot'+frame.level,x+dx,290,84,100);v.text(x+dx,335,side.toUpperCase(),18,60);}label(x,367,day+'일 노트 사진',20,180);});
  // One question at a time keeps the comparison page calm.
  const steps=[
   {done:r.report?.result==='b',q:'① 마지막 사진에서 무엇이 달라졌니?',opts:[['a','A에서만 싹이 났어'],['b','B에서만 싹이 났어'],['both','둘 다 싹이 났어']],key:'result',value:r.report?.result},
   {done:r.reason===r.variable,q:'② 두 화분에서 다르게 둔 조건은?',opts:[['water','물 조건'],['warm','온도 조건']],key:'reason',value:r.reason},
   {done:r.report?.expectation===seedExpectation(r),q:'③ 처음 예상과 비교하면?',opts:[['same','예상과 같았어'],['changed','달라서 생각을 바꿨어'],['unsure','처음엔 몰랐어']],key:'expectation',value:r.report?.expectation}];
  const answered=steps.filter(st=>st.done).map(st=>'✓ '+st.opts.find(([k])=>k===st.value)[1]);
  if(answered.length)label(640,455,answered.join('   '),21,1100);
  const cur=steps.find(st=>!st.done);
  if(cur){
   label(640,530,cur.q,26,900);
   const w=cur.opts.length===3?300:320,gap=cur.opts.length===3?340:360,x0=640-(cur.opts.length-1)*gap/2;
   cur.opts.forEach(([value,text],i)=>button(x0+i*gap,620,w,text,()=>act('seed-report',{[cur.key]:value})));
  }
  return true;
 }
 if(c===1){
  const r=q.rounds[q.round],started=!!r.run,day=started?r.day:0,variable=r.variable;
  const positions={a:390,b:790};
  for(const side of ['a','b']){
   const x=positions[side],p=r.prepared[side],state=seedObservation(r,side),cond=state.condition;
   observationMat(x,405,330,310);
   if(variable==='warm'&&cond.warm&&side==='b')v.pic('heatMat',x,505,250,150);
   label(x,240,`화분 ${side.toUpperCase()}${side==='a'?' · 그대로':' · 바꿔 보기'}`,27,325);
   drop(x,405,285,290,'pot-'+side,'화분 '+side.toUpperCase()+'에 선택한 재료 놓기');
   if(started){fadeSpecimen('pot'+state.level,x,410,280,`seed-${q.round}-${side}`,day);label(x,630,state.detail+(phase==='grow'&&ctx.ui.crossSection?'\n'+(state.level?'흙 속: 뿌리 먼저 → 줄기와 잎':'흙 속: 아직 뿌리가 보이지 않아'):''),21,340).setDepth(3);}
   else{
    specimen('vessel',x,410,280);
    if(p.soil){v.add.ellipse(x,423,148,42,cond.water?0x3a2718:0x614a32);if(cond.water)v.add.ellipse(x-22,416,58,10,0xa9dcea,.55);for(let n=0;n<p.seeds;n++)v.pic('seed0',x-35+n*35,420,10);}
   }
   if(phase==='prepare'){
    button(x-73,565,135,check(p.soil,'흙 넣기'),()=>act('seed-prepare',{side,soil:true}),p.soil);
    button(x+78,565,145,`콩 ${p.seeds}/3 · +1`,()=>act('seed-prepare',{side,seeds:Math.min(3,p.seeds+1)}),p.seeds===3);
   }else{
    cardText(x,546,300,68,`물 ${cond.water?'있음':'없음'}\n${cond.warm?'22°C 따뜻함':'5°C 차가움'}`);
   }
  }
  if(phase==='prepare'){
   // Narrower and pushed right so pot B keeps the same gap as between the pots.
   const mx=1115;
   observationMat(mx,465,230,430);v.text(mx,282,'재료',26,200);
   tool('soil',mx,385,'soil',{},'흙 주머니를 화분으로 옮기기',180);
   label(mx,490,'흙 주머니',23,210);
   v.marker(tool('seed0',mx,575,'seed',{},'씨앗 한 알을 화분으로 옮기기',115/3),40,'콩 한 알');
   label(590,650,'재료를 끌거나 화분 아래 버튼을 눌러 봐.',23,760);
  }
  if(phase==='design'&&ctx.ui.waterFx){
   ctx.ui.waterFx=false;const x=positions.b;
   if(!reduced){
    // Spout of the pouring-can art sits at (0.27, 0.55) of the image.
    const can=v.pic('watercanPour',x+115,290,230).setDepth(40).setAlpha(0);
    v.tweens.add({targets:can,alpha:1,x:x+105,duration:350,onComplete:()=>{
     for(let i=0;i<22;i++){const d=v.add.ellipse(x+40+Math.random()*30,340,7,12,0x6dbbd1).setDepth(39).setAlpha(0);v.tweens.add({targets:d,alpha:{from:.9,to:.9},y:418,x:'-=' + Math.round(10+Math.random()*30),delay:i*55,duration:420,onComplete:()=>{d.destroy();const s=v.add.ellipse(d.x,421,14,5,0xa9dcea,.8).setDepth(39);v.tweens.add({targets:s,scaleX:2.4,alpha:0,duration:350,onComplete:()=>s.destroy()});}});}
     v.tweens.add({targets:can,alpha:0,delay:1500,duration:350,onComplete:()=>can.destroy()});
    }});
   }
  }
  if(phase==='design'&&ctx.ui.tempFx){
   ctx.ui.tempFx=false;const x=positions.b;
   if(!reduced){
    const glow=v.add.circle(x,410,150,0xffb347,0).setDepth(38),th=thermo(x+120,360,5,170).setDepth(40).setAlpha(0),t={v:5};
    v.tweens.add({targets:th,alpha:1,duration:250});
    v.tweens.add({targets:glow,fillAlpha:.32,duration:600,yoyo:true,repeat:1,onComplete:()=>glow.destroy()});
    v.tweens.add({targets:t,v:22,delay:250,duration:1300,ease:'Sine.easeInOut',onUpdate:()=>th.setTemp(t.v)});
    for(let i=0;i<3;i++){const w=v.add.text(x-40+i*40,470,'〰',{fontSize:'34px',color:'#e0782f'}).setOrigin(.5).setDepth(39).setAlpha(0);v.tweens.add({targets:w,y:330,alpha:{from:.9,to:0},delay:300+i*220,duration:1100,repeat:1,onComplete:()=>w.destroy()});}
    v.tweens.add({targets:th,alpha:0,delay:2300,duration:350,onComplete:()=>th.destroy()});
   }
  }
  if(phase==='design'){
   const changed=r.b.water&&r.b.warm;
   if(variable==='water')tool('watercan',1060,340,'seed-condition',{key:variable},'B의 물 조건 바꾸기',95);
   else v.draggable(thermo(1060,310,changed?22:5,100),'seed-condition',{key:variable},'B의 온도 조건 바꾸기');
   button(1060,438,245,variable==='water'?(changed?'✓ B에 물을 주었어':'① B에 물 주기'):(changed?'✓ B를 22°C로 맞췄어':'① B를 22°C로 올리기'),()=>act('seed-condition',{side:'b',key:variable,value:true}),changed);
   label(1060,540,variable==='warm'?(changed?'A 5°C · B 22°C\n두 화분의 차이: 온도':'콩은 20~25°C에서\n싹이 잘 터.'):changed?'두 화분의 차이: 물':'먼저 B의 조건을 바꿔 줘.',22,270);
   const prediction={a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 틈',unsure:'아직 모르겠어'}[r.prediction];
   label(590,647,`② 예상 남기기 → ③ 실험 시작${prediction?'\n내 예상: '+prediction:''}`,23,660);
  }
  if(phase==='grow'){
   dial(1070,397,day,7,'seed-day');
   label(1065,582,`노트에 남은 날\n${r.photos.length?r.photos.map(n=>n+'일').join(' · '):'아직 없음'}`,21,275);
   v.text(650,190,'씨앗 종류와 환경에 따라 싹트는 때가 달라. 두 화분의 빛·공기·흙·콩 수는 같아.',20,1080);
  }
  if(phase==='seed-next')label(640,715,'물을 주고 22°C에 둔 콩에서 싹이 났어.\n다음에는 다른 조건을 하나만 바꿔 보자.',24,850);
  if(phase==='design')v.text(590,700,variable==='water'?'같게 둔 것: 온도·빛·공기·흙·콩 종류와 수':'같게 둔 것: 물의 양·빛·공기·흙·콩 종류와 수',20,820);
  return true;
 }
 if(c!==2)return false;
 const r=q.cases[q.case],isLight=r.variable==='light',after=!!r.tool,level=after?r.day:0,labels=careTimeLabels(r);
 const image=isLight?['pale','paleRecover1','paleRecover2'][level]:['dry','dryRecover1','pot3'][level];
 observationMat(655,420,340,370);
 fadeSpecimen(image,655,420,350,`care-${q.case}`,level);
 drop(655,420,325,360,'plant','화분에 선택한 물·빛 도구 놓기');
 if(!['care-after','care-next'].includes(phase))label(655,225,isLight?'잎빛이 옅고 줄기가 길어졌어':'잎이 축 처졌어',27,480);
 for(const [sensor,x]of [['water',350],['light',970]]){
  const measured=r.measured.includes(sensor),low=sensor===r.variable;
  // After care nothing is re-measured, so the reading stays labelled as before care.
  cardText(x,298,255,78,`${sensor==='water'?'흙의 물기':'받는 빛'}${after&&measured?' · 돌봄 전':''}\n${measured?(low?'부족':'충분'):'도구로 재어 봐'}`);
 }
 if(after)cardText(350,410,255,78,`적용한 돌봄\n${isLight?'빛이 드는 곳으로':'알맞게 물 주기'}`);
 if(phase==='measure'){
  for(const[sensor,x,key]of [['water',350,'moistureSensor'],['light',970,'lightSensor']]){
   tool(key,x,490,'sensor',{sensor},sensor==='water'?'물기 재는 도구를 화분으로':'빛 재는 도구를 화분으로',105);
   button(x,595,250,check(r.measured.includes(sensor),sensor==='water'?'물기 재기':'빛 재기'),()=>act('care-measure',{sensor}),r.measured.includes(sensor));
  }
  label(655,655,q.case?'이번 화분도 물기와 빛을 재 줘.':'양쪽의 물기 재기·빛 재기 버튼을 눌러 줘.',23,620);
 }
 if(phase==='symptom'){
  let pinBusy=false;
  const choose=(part,feature)=>{if(pinBusy)return;pinBusy=true;act('care-pin',{part,feature});};
  const leafFeature=isLight?'pale-leaf':'drooping-leaf';
  v.drop(655,490,210,90,'care-soil','흙 · 마른 흙에 표시',()=>choose('soil','dry-soil'));
  v.drop(655,320,250,150,'care-leaf',isLight?'잎 · 옅어진 잎빛에 표시':'잎 · 처진 잎에 표시',()=>choose('leaf',leafFeature));
  button(350,495,250,'① 흙 · 마른 흙',()=>choose('soil','dry-soil'));
  button(970,495,250,isLight?'② 잎 · 옅어진 잎빛':'② 잎 · 처진 잎',()=>choose('leaf',leafFeature));
  label(655,657,q.case?'달라진 부위를 골라 줘. 원인은 측정과 함께 판단해.':'관찰한 부위와 특징을 골라 줘.\n원인은 모습만으로 정하지 않고 물기·빛 측정과 함께 판단해.',22,930);
 }
 if(phase==='care-before')label(655,650,'오른쪽 아래 사진 버튼을 눌러 지금 모습을 기록해 줘.',24,760);
 if(phase==='care'){
  tool('watercan',350,460,'care-tool',{tool:'water'},'물로 돌보기',110);
  tool('lamp',970,460,'care-tool',{tool:'light'},'빛으로 돌보기',110);
  button(350,575,250,'알맞게 물 주기',()=>act('care-tool',{tool:'water'}));
  button(970,575,250,'빛이 드는 곳으로',()=>act('care-tool',{tool:'light'}));
  label(655,657,q.case?'잰 결과에 맞는 돌봄을 골라 줘.':'시든 모습만 보고 정하지 말고, 물·빛을 잰 결과를 비교해 줘.',23,830);
 }
 if(phase==='care-after'){
  dial(1070,478,r.day,2,'care-day',labels);
  label(350,525,'지금 모습\n'+labels[r.day],24,270);
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
