import {roomPhase} from './field-flow.js';
import {fieldRecords} from './field-model.js';
import {FIELD_CHAPTERS,FORM_NAMES,FORM_TRAITS} from './field-content.js';

const ROOM_ART=[['fieldClearing','egg','larva','pupa','adult','leaf'],['bg2','vessel','soil','seed0','pot0','pot1','pot2','pot3','watercan','lamp','timeWheel'],['bg4','dry','pale','pot3','watercan','lamp','lightSensor','moistureSensor','timeWheel'],['bg6','egg','larva','pupa','adult','puppy','dogYoung','dog','timeWheel','seasonCompass','appleSpring','appleSummer','apple','winter','balsam','balsamDry','balsamSprout','balsamSeeds','rose'],['bg8','storyCamera']];
export const fieldRoomAssets=ctx=>[...ROOM_ART[ctx.s.field.active],FIELD_CHAPTERS[ctx.s.field.active].art];
const names={water:'물',warm:'온도',light:'빛'}, seasons=['첫봄','여름','가을','겨울','다음 봄'];
export function renderFieldRoom(v,ctx){
 const f=ctx.s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),act=(type,payload={})=>ctx.emit('act',{type,payload});
 const target=(x,y,w,h,id,label)=>v.drop(x,y,w,h,id,label,()=>ctx.emit('target',id));
 const tool=(key,x,y,kind,data={},label='')=>{const o=v.pic(key,x,y,115);v.draggable(o,kind,data,label||key);return o;};
 const token=(text,x,y,kind,data={},w=155)=>{const plate=v.add.rectangle(0,0,w,68,0xfff7d9).setStrokeStyle(3,0xa88a43),label=v.text(0,0,text,26,w-12);const o=v.add.container(x,y,[plate,label]).setSize(w,68);v.draggable(o,kind,data,text+' 옮기기');return o;};
 const check=(x,y,yes)=>{if(yes)v.text(x,y,'✓',35,50,'#21573b');};
 const plant=(key,x,y,size=290)=>{v.shadow(x,y+size*.40,size*.65);return v.pic(key,x,y,size,size);};
 const line=(x1,y1,x2,y2)=>v.add.graphics().lineStyle(5,0xffe8a9,.9).lineBetween(x1,y1,x2,y2);
 const tag=(x,y,text)=>v.label(x,y,text,22,250);
 const dayDial=(key,x,y,value,max,type,payload={},labels)=>{v.dial(key,x,y,value,max,'dial',labels);ctx.ui.dial={type,payload};};
 if(phase==='ready'){
  v.pic(c===4?'guideStory':'guideCare',370,440,370,440);const art=FIELD_CHAPTERS[c].art;
  const reward=v.pic(art,800,360,280);v.shadow(800,510,260);
  v.label(800,560,FIELD_CHAPTERS[c].reward,38,530);v.text(800,620,FIELD_CHAPTERS[c].use,24,530);
  if(!ctx.s.settings.reducedMotion)v.tweens.add({targets:reward,y:340,duration:1300,yoyo:true,repeat:-1});return;
 }
 if(c===0){
  if(phase==='search'){
   const forms=[['egg',325,250,160],['larva',460,445,215],['pupa',970,260,180],['adult',885,505,235]],spots=[];
   for(const[id,x,y,size]of forms){v.pic(id,x,y,size);for(let i=0;i<2;i++){const sx=x+(i?size*.20:-size*.20),sy=y+(id==='pupa'?i*size*.30-size*.15:(i?size*.10:-size*.10));spots.push({form:id,spot:i,x:sx,y:sy});check(sx,sy,q.inspected[id].includes(i));v.focusTargets.push({x:sx,y:sy,w:60,h:60,label:FORM_NAMES[id]+' '+FORM_TRAITS[id][i]+' 확대',fn:()=>act('inspect',{form:id,spot:i})});}v.label(x,y+size*.55,FORM_NAMES[id]+(q.inspected[id].length===2?' · 관찰 완료':''),23,255);}
   const lens=v.add.container(650,360).setSize(126,126);const rim=v.add.circle(0,0,58,0xfff8d8,.22).setStrokeStyle(10,0xdcbf76);const handle=v.add.rectangle(53,65,23,88,0x335c47).setAngle(-38);lens.add([handle,rim]);lens.setDepth(40).setInteractive({useHandCursor:true});v.input.setDraggable(lens);
   let zoom=null;const maskShape=v.make.graphics({add:false});maskShape.fillStyle(0xffffff).fillCircle(0,0,49);v.lensMask=maskShape;
   const inspect=p=>{lens.setPosition(p.x,p.y);maskShape.setPosition(p.x,p.y);const nearby=spots.map(a=>({...a,d:Math.hypot(a.x-p.x,a.y-p.y)})).sort((a,b)=>a.d-b.d)[0];if(zoom)zoom.destroy();if(nearby.d<115){const base=forms.find(a=>a[0]===nearby.form);zoom=v.pic(base[0],p.x+(base[1]-p.x)*2,p.y+(base[2]-p.y)*2,base[3]*2).setDepth(39).setMask(maskShape.createGeometryMask());}return nearby;};
   lens.on('drag',p=>inspect(p));lens.on('dragend',p=>{const a=inspect(p);if(a.d<80)act('inspect',{form:a.form,spot:a.spot});else ctx.emit('feedback','몸 가까이 돋보기를 옮겨 봐. 같은 모습에서도 두 부분을 살펴보자.');});
   v.text(650,615,'몸의 앞과 뒤 · 날개와 더듬이 · 작은 표면',23,640);
  }else if(phase==='draw'){
   const id=ctx.ui.drawForm||'larva';v.pic(id,390,380,300);v.label(390,590,'내가 본 '+FORM_NAMES[id],27,300);
   const x=640,y=230,w=420,h=315;v.add.rectangle(x+w/2,y+h/2,w,h,0xfffbee,.96).setStrokeStyle(3,0xc7ad72);v.text(x+w/2,y-26,'내 관찰 그림',25,400);
   const ink=v.add.graphics().lineStyle(4,0x24573d,1);for(const stroke of q.drawing){ink.beginPath();stroke.forEach((p,i)=>i?ink.lineTo(x+p[0]*w,y+p[1]*h):ink.moveTo(x+p[0]*w,y+p[1]*h));ink.strokePath();}
   let stroke=null;const area=v.add.zone(x+w/2,y+h/2,w,h).setInteractive();area.on('pointerdown',p=>{stroke=[[Math.max(0,Math.min(1,(p.x-x)/w)),Math.max(0,Math.min(1,(p.y-y)/h))]];ink.beginPath().moveTo(p.x,p.y);});
   v.input.on('pointermove',p=>{if(!stroke||!p.isDown)return;const nx=Math.max(x,Math.min(x+w,p.x)),ny=Math.max(y,Math.min(y+h,p.y));stroke.push([(nx-x)/w,(ny-y)/h]);ink.lineTo(nx,ny).strokePath();});v.input.on('pointerup',()=>{if(stroke){const a=stroke;stroke=null;act('observation-draw',{stroke:a});}});
   v.text(850,590,q.note||'어떤 부분이 어떻게 생겼는지 써 봐.',25,440);for(const[id2,i]of Object.keys(FORM_NAMES).map((id2,i)=>[id2,i])){v.pic(id2,290+i*74,650,65);v.click(290+i*74,650,68,68,()=>{ctx.ui.drawForm=id2;v.refresh();},FORM_NAMES[id2]+' 보며 그리기');}
  }else if(phase==='film'){
   for(let i=0;i<4;i++){const x=300+i*225;target(x,380,200,265,'film-'+i,['처음','그다음','그다음','마지막'][i]);v.label(x,550,['처음','다음','다음','마지막'][i],25,200);const o=v.pic(q.order[i],x,365,180,230);v.draggable(o,'film',{from:i},FORM_NAMES[q.order[i]]+' 사진 옮기기');}
   if(ctx.ui.play){let i=0;const glow=v.add.rectangle(300,380,205,270,0xffefaf,.08).setStrokeStyle(7,0xffd466);v.time.addEvent({delay:850,loop:true,callback:()=>{i=(i+1)%4;glow.x=300+i*225;}});}
  }else{
   v.pic('adult',380,350,300);v.pic('leaf',890,390,330);target(890,380,285,215,'next-egg','다음 세대가 자라는 잎');tool('egg',540,450,'generation',{},'새 알을 다음 잎으로 옮기기');line(610,360,715,360);v.label(380,560,'알을 낳는 어른벌레',26,330);v.label(890,560,'다음 세대의 자리',26,330);
  }return;
 }
 if(c===1){
  const r=q.rounds[q.round],day=r.run?r.day:0;
  for(const[side,i]of ['a','b'].map((a,i)=>[a,i])){const x=420+i*405,p=r.prepared[side],cond=r.run?.[side]||(side==='a'?{water:r.variable!=='water',warm:r.variable!=='warm'}:r.b),level=day<2||!cond.water||!cond.warm?0:day<4?1:day<6?2:3;
   target(x,400,275,290,'pot-'+side,'화분 '+side.toUpperCase());plant(r.run?'pot'+level:'vessel',x,400,280);if(!r.run&&p.soil){v.add.ellipse(x,415,145,36,0x5e442c);for(let n=0;n<p.seeds;n++)v.pic('seed0',x-45+n*45,412,30);}
   v.label(x,235,'화분 '+side.toUpperCase(),29,200);
   if(phase!=='prepare')v.label(x,590,`물 ${cond.water?'있음':'없음'} · ${cond.warm?'따뜻함':'차가움'}`,24,355);
   if(ctx.ui.crossSection&&r.run){const root=v.add.graphics().lineStyle(4,0xf3e6b7);if(level>0)for(let n=0;n<3;n++)root.lineBetween(x,455,x+(n-1)*30,470+level*15);v.text(x,515,level?'뿌리와 싹이 자랐어':'아직 싹이 나지 않았어',21,300);}
  }
  if(phase==='prepare'){tool('soil',585,640,'soil',{},'흙 주머니를 화분으로');tool('seed0',720,640,'seed',{},'씨앗 한 알을 화분으로');v.text(650,175,'지훈이 건넨 재료 · 흙과 씨앗 수는 같게',23,650);}
  if(phase==='design'){tool('watercan',510,650,'seed-condition',{key:'water'},'B의 물 조건 바꾸기');tool('lamp',700,650,'seed-condition',{key:'warm'},'B의 온도 조건 바꾸기');v.text(650,175,'A는 그대로 · 알아볼 조건 하나만 B에서 바꾸기',23,790);if(r.prediction)v.label(1020,310,'내 예상: '+({a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 자람',unsure:'아직 모르겠어'}[r.prediction]),22,250);}
  if(phase==='grow'){dayDial('timeWheel',1090,430,day,7,'seed-day');v.text(650,175,'씨앗 관찰 모형 · 사진을 찍으면 그날의 증거가 남아',22,790);v.text(650,650,'찍은 날: '+r.photos.map(n=>n+'일').join(' · '),24,600);}
  if(phase==='reason'){target(640,640,300,85,'reason','결과를 바꾼 조건');tool('watercan',340,640,'seed-reason',{reason:'water'},'물 증거 연결');tool('lamp',950,640,'seed-reason',{reason:'warm'},'온도 증거 연결');v.label(640,175,'내 예상: '+({a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 틈',unsure:'아직 모름'}[r.run.prediction])+' → 실험 결과: B만 싹이 텄어',23,850);}
  if(phase==='seed-next')v.label(650,650,'물도, 알맞은 온도도 싹트기에 필요해.',28,750);return;
 }
 if(c===2){
  const r=q.cases[q.case],fixed=!!r.tool&&r.day===2,key=fixed?'pot3':r.variable==='water'?'dry':'pale';plant(key,690,390,350);target(690,400,320,360,'plant','화분에 도구 놓기');v.label(690,205,q.case?'흙은 촉촉한데 잎빛이 옅어졌어':'잎이 축 늘어졌어',28,540);
  if(r.measured.includes('water'))v.label(375,310,'흙 속 물: '+(r.variable==='water'?'부족':'충분'),26,275);
  if(r.measured.includes('light'))v.label(1010,310,'받은 빛: '+(r.variable==='light'?'부족':'충분'),26,275);
  if(phase==='measure'){tool('moistureSensor',430,610,'sensor',{sensor:'water'},'물 센서로 재기');tool('lightSensor',850,610,'sensor',{sensor:'light'},'빛 센서로 재기');}
  if(phase==='symptom'){token('관찰핀',380,580,'symptom',{},150);target(690,480,210,90,'dry','마른 흙에 관찰핀');target(690,325,250,150,'pale','달라진 잎에 관찰핀');v.text(690,650,'흙과 잎 중 원인과 이어지는 곳을 찾아 봐.',23,670);}
  if(phase==='care'){tool('watercan',410,610,'care-tool',{tool:'water'},'물로 돌보기');tool('lamp',960,610,'care-tool',{tool:'light'},'빛으로 돌보기');}
  if(phase==='care-after'){dayDial('timeWheel',1070,510,r.day,2,'care-day',{},['돌봄 전','하루 뒤','이틀 뒤']);v.label(410,590,r.day===2?'새잎이 자라며 회복했어':'새잎의 변화를 지켜보자',24,380);}
  if(phase==='care-before'||phase==='care-next')v.label(690,625,phase==='care-before'?'먼저 사진을 남겨야 뒤의 변화와 비교할 수 있어.':'측정 → 관찰 → 돌봄 → 변화 기록',25,800);return;
 }
 if(c===3){
  if(phase==='animals'||phase==='animal-birth'){
   const a=q.animals;v.pic(['egg','larva','pupa','adult'][a.butterfly.step],380,360,270);v.pic(['puppy','dogYoung','dog'][a.dog.step],885,360,300);v.label(380,185,'나비의 시간',28,320);v.label(885,185,'개의 시간',28,320);
   if(phase==='animals'){
    v.dial('timeWheel',380,575,a.butterfly.step,3,'animal-dial-butterfly',['알','애벌레','번데기','어른벌레']);v.dial('timeWheel',885,575,a.dog.step,2,'animal-dial-dog',['갓 태어난 강아지','어린 개','다 자란 개']);
   }else{v.pic('egg',380,590,100);v.pic('puppy',885,590,130);target(630,465,220,95,'birth-different','부모와 다음 세대는 다른 개체');v.label(630,465,'새 개체',26,230);target(630,590,220,85,'birth-same','부모와 다음 세대가 같은 개체');v.label(630,590,'같은 개체',26,210);token('다음 세대',630,290,'birth',{},200);}
   return;
  }
  if(['tags','seasons','plant-identity'].includes(phase)){
   const step=phase==='plant-identity'?4:q.season;const apples=['appleSpring','appleSummer','apple','winter','appleSpring'],balsams=['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'];
   plant(apples[step],420,385,330);plant(balsams[step],845,400,275);target(420,400,310,340,'plant-apple','사과나무 이름표');target(845,400,270,330,'plant-balsam','봉선화 이름표');
   v.label(420,195,'사과나무'+(q.tags.includes('apple')?' · A-01':''),27,340);v.label(845,195,'봉선화'+(q.tags.includes('balsam')?(step===4?' · B-02':' · B-01'):''),27,340);
   if(phase==='tags'){token('A-01',420,620,'tag',{plant:'apple'});token('B-01',845,620,'tag',{plant:'balsam'});}
   if(phase==='seasons'){dayDial('seasonCompass',1090,480,step,4,'season',{},seasons);v.text(650,600,step===3?'봉선화의 씨앗과 사과나무의 줄기를 찾아봐.':step===4?'씨앗에서 자란 봉선화는 새 개체야.':'이름표를 따라 같은 식물을 찾아봐.',24,760);}
   if(phase==='plant-identity'){token('같은 개체',400,640,'identity',{answer:'same'},210);token('새 개체',855,640,'identity',{answer:'new'},210);v.text(650,555,'다음 봄 · A-01의 줄기 / B-01이 남긴 씨앗',24,800);}
   return;
  }
  if(phase==='transfer'){
   const rose=q.transfers.rose!=='same';if(rose){plant('rose',460,370,270);plant('rose',850,370,270);v.label(460,205,'지난해 장미 R-01',26,350);v.label(850,205,'새봄 장미 R-01',26,350);}else{v.pic('dog',450,370,290);v.pic('puppy',850,390,200);v.label(450,205,'어미 개',27,300);v.label(850,205,'갓 태어난 강아지',27,350);}
   target(650,390,180,190,'transfer','새 자료에 판단 연결');token(rose?'같은 개체':'새끼로 태어남',400,625,'transfer',{subject:rose?'rose':'dog',answer:rose?'same':'live'},240);token(rose?'새 개체':'알에서 태어남',880,625,'transfer',{subject:rose?'rose':'dog',answer:rose?'new':'egg'},240);return;
  }
 }
 if(c===4){
  const bank=fieldRecords(f),tokenId=v.renderToken;
  const photo=(record,x,y,w,h,kind,data)=>{
   const placeholder=v.add.rectangle(x,y,w,h,0xfff8e5).setStrokeStyle(2,0xb7a173);if(kind)v.draggable(placeholder,kind,data,record.title+' 옮기기');
   ctx.recordImage(record,ctx.s).then(url=>{if(v.renderToken!==tokenId||!v.sys.isActive())return;const key='record-'+tokenId+'-'+record.id+'-'+x+'-'+y;const image=new Image();image.onload=()=>{if(v.renderToken!==tokenId)return;v.textures.addImage(key,image);v.recordTextures.push(key);const o=v.pic(key,x,y,w,h);if(kind){placeholder.disableInteractive();v.draggable(o,kind,data,record.title+' 옮기기');}v.focusTargets.push({x,y,w,h,label:record.title+' 선택',fn:()=>ctx.emit('select',{kind,...data})});ctx.focusTargets(v.focusTargets);};image.src=url;}).catch(()=>ctx.emit('feedback','기록 그림을 다시 불러오려면 이 구역을 다시 열어 줘.'));
   return placeholder;
  };
  if(['story-pick','story-edit','plan'].includes(phase)){
   v.text(650,190,q.title||'내 발견을 이어 만드는 이야기',32,900);target(650,340,1000,240,'story','이야기판에 기록 담기');
   q.records.forEach((id,i)=>{const record=bank.find(r=>r.id===id);if(!record)return;const w=q.records.length>4?140:180,x=640+(i-(q.records.length-1)/2)*(w+15);target(x,340,w,220,'book-'+i,'이야기 순서 '+(i+1));photo(record,x,335,w,w*.7,'book',{from:i});v.text(x,435,q.captions[id]||record.title,22,w+15);v.click(x,465,w,55,()=>ctx.emit('caption',id),record.title+' 설명 쓰기');});
   if(phase==='story-pick')v.text(650,470,'동물과 식물을 함께 · 3~6장 · 위로 끌어 담기',24,900);
   if(phase==='plan')v.text(650,555,q.summary||'동물과 식물의 한살이에서 알아낸 점을 써 봐.',26,880);
  }
  if(phase==='story-help'){
   const requests=[['observation','어떻게 생겼는지 보여 줘'],['retry','조건 하나만 바꾼 증거는?'],['care','어떻게 돌봤는지 알려 줘']];requests.forEach(([id,label],i)=>{const x=310+i*330;target(x,310,300,220,'help-'+id,label);v.label(x,230,label,25,300);if(q.matches[id]){const r=bank.find(r=>r.id===q.matches[id]);if(r)photo(r,x,355,220,150);}else v.pic('storyCamera',x,350,100);});
  }
  if(['story-pick','story-edit','story-help'].includes(phase)){
   const pages=Math.max(1,Math.ceil(bank.length/3));ctx.ui.recordPage=((ctx.ui.recordPage||0)%pages+pages)%pages;const list=bank.slice(ctx.ui.recordPage*3,ctx.ui.recordPage*3+3);
   list.forEach((r,i)=>{const x=370+i*280;photo(r,x,575,220,130,'record',{id:r.id});v.text(x,660,r.title,22,270);if(q.records.includes(r.id))v.label(x+80,520,'담음',21,85);});
   if(!list.length)v.label(650,570,'앞 구역에서 직접 모은 기록이 여기에 나타나.',26,850);
  }
 }
}
