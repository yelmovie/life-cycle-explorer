import {TEXT_LIMITS,preserveText} from './field-writing.js';
import {reducedMotion} from './game-motion.js';
import {fieldReady,fieldRecords,fieldUnlocked} from './field-model.js';
import {normalizeDiscovery,discoveryStepDone,DISCOVERY_TYPES,DISCOVERY_PLAN,questionValid} from './field-quest-state.js';

import {DISCOVERY_MISSIONS} from './field-mission-data.js';
export {DISCOVERY_MISSIONS};
const bank=field=>fieldRecords(field);
const state=(field,c=field.active)=>normalizeDiscovery(c,field.chapters[c]?.discovery,bank(field));
export const questReady=(field,c=field.active)=>{const a=state(field,c),records=bank(field);return [0,1].every(step=>discoveryStepDone(c,step,a[step],records));};
const currentStep=(field,c=field.active)=>{const a=state(field,c);return discoveryStepDone(c,0,a[0],bank(field))?1:0;};
export function questInfo(field){const c=field.active,step=currentStep(field);return {objective:`추가 발견 ${step+1}/2 · ${DISCOVERY_MISSIONS[c].objectives[step]}`,controls:'',next:'발견 미션 안내',nextAction:'hint'};}

export function applyQuest(field,payload={}){
 const c=field.active,q=field.chapters[c],records=bank(field),p=payload&&typeof payload==='object'?payload:{};
 const fail=message=>({ok:false,message});
 if(!fieldUnlocked(field,c)||!fieldReady(field,c))return fail('이 구역의 관찰 기록을 마치면 추가 발견에 도전할 수 있어.');
 if(questReady(field,c))return {ok:true,message:'발견 도장을 이미 받았어. 네 기록에 잘 보관돼 있어.',completed:true};
 const step=currentStep(field,c);
 if(p.step!==step)return fail('지금 화면의 발견 미션부터 차례로 완성해 줘.');
 const data=state(field,c),e=data[step]||{};
 if(c===0){
  const expected=step===0?'larva':'adult';
  if(p.kind==='connect'){
   if(p.target!==expected)return fail(step===0?'도토는 잎을 먹는 모습을 관찰했대. 알과 번데기는 먹이를 먹지 않아.':'도토는 번데기에서 나온 뒤 날개를 펼치는 모습을 보았대. 날개가 있는 모습을 찾아보자.');
   e.target=expected;
  }else if(p.kind==='record'){
   if(e.target!==expected)return fail('먼저 흔적과 생물을 연결한 뒤 발견 기록을 눌러 줘.');
   e.confirmed=true;
  }else return fail('흔적 메모를 생물에게 옮기거나 생물 그림을 눌러 줘.');
 }else if(c===1){
  if(step===0){
   if(p.kind==='repair'){
    if(p.setting!=='warm')return fail('물을 알아보는 실험이야. A는 물 없음으로 두고, 두 화분의 온도를 같게 맞춰 줘.');
    e.aWarm=true;
   }else if(p.kind==='verify'){
    if(!e.aWarm)return fail('지금은 물과 온도 두 조건이 달라. A의 온도를 B와 같게 먼저 고쳐 줘.');
    e.verified=true;
   }else return fail('화분 A의 조건 버튼을 눌러 물만 다르게 남겨 줘.');
  }else if(p.kind==='check'){
   if(!['water','temperature','time'].includes(p.clue))return fail('물·온도·관찰 기간 세 단서를 확인해 줘.');
   e.checks=[...new Set([...(e.checks||[]),p.clue])];
  }else if(p.kind==='decide'){
   if(p.choice!=='observe')return fail('아직 싹이 안 보인다고 죽었다고 단정할 수 없어. 조건과 기간을 확인하며 관찰을 이어가자.');
   if(!['water','temperature','time'].every(x=>e.checks?.includes(x)))return fail('먼저 물·온도·관찰 기간 세 단서를 모두 눌러 확인해 줘.');
   e.decision='observe';
  }else return fail('아직 안 보이는 싹을 판단하기 전에 세 단서를 확인해 줘.');
 }else if(c===2){
  if(step===0&&p.kind==='check'){
   if(!['water','light'].includes(p.clue))return fail('물과 빛의 측정 결과를 각각 확인해 줘.');
   e.checked=[...new Set([...(e.checked||[]),p.clue])];
  }else if(step===0&&p.kind==='decide'){
   if(p.choice!=='keep')return fail('물과 빛이 충분해. 더 주기보다 지금 물과 빛을 그대로 두고 상태를 관찰하자. 물이 너무 많아도 좋지 않아.');
   if(!['water','light'].every(x=>e.checked?.includes(x)))return fail('물기와 빛을 잰 결과를 먼저 눌러 확인해 줘.');
   e.decision='keep';
  }else if(step===1&&p.kind==='mark'){
   if(p.spot!=='new-leaf')return fail('이미 길어진 줄기가 짧아지는 것은 아니야. 새로 나오는 잎의 색을 비교해 줘.');
   e.spot='new-leaf';
  }else if(step===1&&p.kind==='record'){
   if(e.spot!=='new-leaf')return fail('오른쪽 화분에서 새로 자란 잎을 먼저 찾아 눌러 줘.');
   e.note=true;
  }else return fail('물·빛을 잰 결과와 새잎을 차례로 살펴보자.');
 }else if(c===3){
  if(step===0&&p.kind==='track'){
   if(p.mark!=='A-01')return fail('크기나 잎 모양보다 지난해 붙인 A-01 이름표이 이어지는지 확인해 봐.');
   e.mark='A-01';
  }else if(step===0&&p.kind==='record'){
   if(e.mark!=='A-01')return fail('지난해와 같은 A-01 이름표를 먼저 이어 줘.');
   e.confirmed=true;
  }else if(step===1&&p.kind==='plan'){
   if(!DISCOVERY_PLAN.includes(p.item))return fail('비교할 사진은 같은 자리에서 찍고, 생물은 그곳에서 계속 자라도록 지켜 줘.');
   e.plan=[...new Set([...(e.plan||[]),p.item])];
  }else if(step===1&&p.kind==='record'){
   if(!DISCOVERY_PLAN.every(x=>e.plan?.includes(x)))return fail('같은 방향·꾸준한 기록·생물 보호 세 가지 사진 계획을 모두 확인해 줘.');
   e.confirmed=true;
  }else return fail('이름표를 확인하고 다음 사진 계획을 완성해 줘.');
 }else if(step===0&&p.kind==='stamp'){
  const record=records.find(r=>r.id===p.recordId&&DISCOVERY_TYPES.includes(r.fieldEvidence?.type));
  if(!record)return fail('직접 만든 관찰·조건 비교·돌봄 기록에서 도장을 붙일 자료를 골라 줘.');
  e.stamps={...e.stamps,[record.fieldEvidence.type]:record.id};
 }else if(step===1&&p.kind==='question'){
  if(!questionValid(p.text))return fail('알아보고 싶은 생물과 궁금한 점을 여덟 글자 이상 네 말로 써 줘.');
  e.question=preserveText(p.text,TEXT_LIMITS.question);
 }else return fail('내 기록에 도장을 붙이고 다음 궁금증을 남겨 줘.');
 data[step]=e;q.discovery=normalizeDiscovery(c,data,records);
 const complete=questReady(field,c),stepDone=discoveryStepDone(c,step,q.discovery[step],records);
 return {ok:true,completed:complete,completedStep:stepDone?step:null,message:complete?`${DISCOVERY_MISSIONS[c].name} 도장을 받았어! 네가 찾은 기록와 다음 생각이 기록됐어.`:stepDone?'첫 발견 기록 완료! 다음 단서로 한 번 더 생각해 보자.':'단서를 기록했어. 화면의 다음 안내를 따라 발견을 완성해 줘.',...(complete?{reward:DISCOVERY_MISSIONS[c].name}:{})};
}

export function renderQuestRoom(v,ctx){
 const f=ctx.s.field,c=f.active,step=currentStep(f),saved=state(f),e=saved[step]||{},mission=DISCOVERY_MISSIONS[c],reduced=reducedMotion(ctx.s.settings);
 const send=payload=>ctx.emit('act',{type:'quest-answer',payload:{step,...payload}});
 const panel=(x,y,w,h)=>v.paper(x,y,w,h);
 const label=(x,y,text,size=23,w=350)=>v.label(x,y,text,size,w);
 const button=(x,y,w,text,payload,done=false)=>{
  const shadow=v.add.rectangle(x,y+4,w,52,0x315742,.96),face=v.add.rectangle(x,y,w,52,done?0x4d7d56:0xfffbee,.98).setStrokeStyle(2,done?0x39613f:0x9eaf91);
  const caption=v.text(x,y,`${done?'✓ ':''}${text}`,22,w-18,done?'#fffcef':'#244d3c'),height=Math.max(52,caption.height+16);shadow.setSize(w,height);face.setSize(w,height);v.click(x,y,w,height+8,()=>typeof payload==='function'?payload():send(payload),text);
 };
 const sprite=(key,x,y,w=160,h=w)=>{v.shadow(x,y+h*.43,w*.55);return v.pic(key,x,y,w,h);};
 const line=(x1,y1,x2,y2)=>v.add.graphics().lineStyle(6,0x4c8963,.9).lineBetween(x1,y1,x2,y2);
 const dragTo=(obj,onDrop)=>{
  const x=obj.x,y=obj.y;obj.setInteractive({useHandCursor:true});v.input.setDraggable(obj);obj.on('dragstart',()=>obj.setDepth(35));obj.on('drag',(_,dx,dy)=>obj.setPosition(dx,dy));obj.on('drop',(_,zone)=>onDrop(zone.getData('quest-target')));obj.on('dragend',()=>v.tweens.add({targets:obj,x,y,duration:reduced?1:180}));
 };
 const destination=(x,y,w,h,value,fn)=>{const z=v.add.zone(x,y,w,h).setRectangleDropZone(w,h).setData('quest-target',value);v.click(x,y,w,h,fn,'발견 연결: '+value);return z;};
 // Translucent backing panel so the busy room art doesn't swallow the quest pictures.
 v.add.graphics().fillStyle(0xfffbed,.62).fillRoundedRect(100,185,1080,500,28).lineStyle(3,0xfffbed,.9).strokeRoundedRect(100,185,1080,500,28);
 label(640,220,mission.name+' · '+mission.steps[step],28,850);
 // One completed stamp stays visible while the second discovery is in progress.
 if(step===1){const stamp=v.add.container(1095,270);stamp.add([v.add.circle(0,0,29,0x477b56),v.text(0,0,'1 ✓',21,65,'#fffbea')]);}
 if(c===0){
  const first=step===0,source=first?'leaf':'pupa',targets=first?['egg','larva','pupa']:['larva','adult','egg'],names={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'};
  panel(330,392,265,260);sprite(source,330,365,first?185:135,180);
  label(330,480,first?'잎 참고 모형':'번데기 참고 모형',20,245);
  label(340,552,first?'“잎을 갉아 먹는 모습을 봤어!”':'“번데기에서 나와\n날개를 펼치는 모습을 봤어!”',22,325);
  const memo=v.label(330,295,'도토의 관찰 메모',22,245);dragTo(memo,target=>target&&send({kind:'connect',target}));
  targets.forEach((target,i)=>{const x=650+i*185;sprite(target,x,385,target==='egg'?50:135,150);destination(x,385,160,180,target,()=>send({kind:'connect',target}));button(x,510,155,names[target],{kind:'connect',target},e.target===target);if(e.target===target)line(470,395,x-75,395);});
  if(e.target)button(785,590,360,'내 흔적 발견 기록',{kind:'record'});
  return;
 }
 if(c===1&&step===0){
  for(const[side,x]of [['A',420],['B',860]]){panel(x,385,320,240);label(x,295,'화분 '+side,25,200);sprite('vessel',x,375,140);label(x,470,side==='A'?`물 없음 · ${e.aWarm?'22°C':'5°C'}`:'물 있음 · 22°C',22,290);}
  label(640,550,'알아볼 것: 물의 영향 · 씨앗·흙·빛·공기는 두 화분이 같아.',22,1000);
  button(330,630,250,'A에도 물 주기',{kind:'repair',setting:'water'});
  button(640,630,300,'A도 22°C로 맞추기',{kind:'repair',setting:'warm'},e.aWarm);
  button(960,630,290,'수리한 실험 설계 저장',{kind:'verify'});
  return;
 }
 if(c===1&&step===1){
  panel(380,385,300,270);sprite('pot0',380,365,190);label(380,485,'아직 싹이 보이지 않는 콩',22,280);
  const checks=[['water','물은 알맞게 주었을까?','물: 알맞게 주고 있어'],['temperature','온도는 알맞을까?','온도: 22°C, 싹트기에 알맞아'],['time','충분히 관찰했을까?','기간: 관찰을 시작한 지 얼마 안 됐어']];
  checks.forEach(([clue,text,result],i)=>button(850,315+i*91,425,e.checks?.includes(clue)?result:text,{kind:'check',clue},e.checks?.includes(clue)));
  button(380,630,300,'싹이 안 보이면 죽은 것',{kind:'decide',choice:'dead'});
  button(850,630,425,'조건을 확인하며 관찰 이어가기',{kind:'decide',choice:'observe'});
  return;
 }
 if(c===2&&step===0){
  panel(640,425,320,295);sprite('pot3',640,425,270);label(640,280,'새 화분의 돌봄 상담',24,380);
  button(340,365,275,'흙의 물기 측정 결과',{kind:'check',clue:'water'},e.checked?.includes('water'));
  button(955,365,275,'빛 측정 결과',{kind:'check',clue:'light'},e.checked?.includes('light'));
  if(e.checked?.includes('water'))label(340,452,'흙의 물기: 충분',24,270);
  if(e.checked?.includes('light'))label(955,452,'받은 빛: 충분',24,270);
  button(385,590,315,'물을 더 많이 주기',{kind:'decide',choice:'more-water'});
  button(875,590,390,'물·빛 그대로 두고 관찰',{kind:'decide',choice:'keep'});
  return;
 }
 if(c===2&&step===1){
  for(const[x,title]of [[385,'빛을 받기 전'],[850,'새잎이 자란 뒤']]){panel(x,410,310,285);sprite('pale',x,412,255);label(x,275,title,24,300);}
  for(const[dx,dy]of [[.385,.075],[.56,.25],[.725,.33]])for(const side of [-1,1])v.add.ellipse(722.5+255*dx+side*8,284.5+255*dy-3,22,10,0x78a34c).setAngle(side*28);
  button(360,590,300,'긴 줄기의 길이에 표시',{kind:'mark',spot:'stem'});
  button(730,590,300,'새잎의 초록빛에 표시',{kind:'mark',spot:'new-leaf'},e.spot==='new-leaf');
  destination(855,330,180,100,'new-leaf',()=>send({kind:'mark',spot:'new-leaf'}));
  if(e.spot){line(920,330,1040,380);button(1070,445,210,'새잎 발견 기록',{kind:'record'});}
  return;
 }
 if(c===3&&step===0){
  panel(350,400,280,300);sprite('appleSpring',350,400,240);label(350,278,'지난봄 · 이름표 A-01',24,330);
  panel(785,400,270,300);panel(1030,400,200,300);sprite('appleSpring',785,400,240);sprite('balsamSprout',1030,410,150);
  label(900,278,'새봄에 다시 찾은 식물',24,440);
  const tag=v.label(350,535,'A-01 이름표 옮기기',24,280);dragTo(tag,mark=>mark&&send({kind:'track',mark}));
  for(const[mark,x]of [['A-01',785],['B-02',1030]]){destination(x,410,195,240,mark,()=>send({kind:'track',mark}));button(x,535,220,mark+(mark==='A-01'?' 나무 선택':' 새싹 선택'),{kind:'track',mark},e.mark===mark);}
  if(!e.mark)label(900,605,'같은 이름표가 붙은 식물의 선택 버튼을 눌러 줘.',22,535);
  if(e.mark){line(495,400,670,400);button(650,610,370,'같은 이름표의 사진 기록',{kind:'record'});}
  return;
 }
 if(c===3&&step===1){
  sprite('storyCamera',360,375,210);label(360,535,'다음 사진은 어떻게 찍을까?',23,330);
  const choices=[['same-view','같은 자리·같은 방향으로'],['regular','정한 때마다 꾸준하게'],['leave-growing','꺾거나 잡지 않고 그 자리에서']];
  choices.forEach(([item,text],i)=>button(850,310+i*92,470,text,{kind:'plan',item},e.plan?.includes(item)));
  button(360,590,315,'식물을 꺾어 집에 가져오기',{kind:'plan',item:'pick-plant'});
  button(850,590,470,'나의 관찰 사진 계획 완성',{kind:'record'});
  return;
 }
 if(c===4&&step===0){
  const records=bank(f),kinds={observation:'확대 관찰',retry:'조건 비교',care:'기록으로 돌봄'},token=v.renderToken;
  DISCOVERY_TYPES.forEach((type,i)=>{
   const choices=records.filter(r=>r.fieldEvidence?.type===type),chosen=e.stamps?.[type],index=(ctx.ui.questRecordPage?.[type]||0)%Math.max(1,choices.length),r=choices[index],x=340+i*300;
   panel(x,405,270,240);label(x,285,kinds[type],24,260);
   if(r){
    const holder=v.add.rectangle(x,392,245,145,0xeef0dc,.9);
    ctx.recordImage(r,ctx.s,true).then(url=>{if(v.renderToken!==token||!v.sys.isActive())return;const image=new Image();image.onload=()=>{if(v.renderToken!==token)return;const key=`quest-${token}-${type}`;v.textures.addImage(key,image);v.recordTextures.push(key);v.pic(key,x,392,245,145);holder.destroy();};image.src=url;}).catch(()=>ctx.emit('feedback','기록 사진을 다시 불러오려면 이 구역을 다시 열어 줘.'));
    label(x,475,r.title,21,255);
    button(x,530,260,chosen===r.id?'도장 붙임':chosen?'이 기록으로 바꾸기':'이 기록에 도장',{kind:'stamp',recordId:r.id},chosen===r.id);
    if(choices.length>1)button(x,590,235,'다른 내 기록 보기',()=>{ctx.ui.questRecordPage||={};ctx.ui.questRecordPage[type]=(index+1)%choices.length;v.refresh();});
   }
  });return;
 }
 // The final mission is genuine learner writing; it has no supplied answer.
 sprite('storyCamera',370,390,180);panel(820,400,510,220);
 label(820,350,'다음 탐험의 첫 질문',27,460);
 v.text(820,435,'내가 관찰한 생물에서\n아직 궁금한 점은 무엇일까?',25,445);
 button(820,590,440,'나만의 궁금증 쓰기',()=>{
  ctx.dialog({title:'다음 탐험의 첫 질문',className:'field-notebook-dialog',body:'<section class="notebook-page"><p class="notebook-kicker">발견을 새로운 질문으로!</p><label for="discovery-question">어떤 생물의 무엇이 궁금하니?</label><textarea id="discovery-question" class="notebook-own-writing"  placeholder="관찰하면서 새롭게 궁금해진 점을 네 말로 써 줘."></textarea><p class="notebook-next">여덟 글자 이상 네 말로 쓰면 돼. 정해진 정답은 없어.</p></section>',actions:'<button type="button" id="discovery-question-save" class="primary">내 궁금증 기록</button>'});
  const input=document.getElementById('discovery-question'),save=document.getElementById('discovery-question-save');input.maxLength=TEXT_LIMITS.question;
  save.addEventListener('click',()=>{const text=input.value;if(!questionValid(text)){ctx.emit('feedback','알아보고 싶은 생물과 궁금한 점을 여덟 글자 이상 써 줘.');return;}input.closest('dialog')?.close();send({kind:'question',text});});
  input.focus();
 });
}
