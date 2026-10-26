import {ready, canEnter, recordBank, seedLevel} from './inquiry-core.js';

export const REQUESTS = [
  {title:'사라진 나비 기록 찾기',goal:'관찰 단서를 알맞은 모습으로 옮겨 줘.',reward:'시간 손잡이',art:'timeWheel',use:'다음 연구소에서 손잡이를 돌려 씨앗의 며칠을 움직여.'},
  {title:'잠든 씨앗 깨우기',goal:'물 없는 씨앗과 추운 씨앗을 공정한 비교로 도와줘.',reward:'관찰 센서',art:'plantSensor',use:'다음 온실에서 물과 빛을 직접 재어 원인을 찾아.'},
  {title:'온실의 두 화분 구하기',goal:'물과 빛을 재고, 필요한 도움을 준 뒤 새잎을 확인해.',reward:'계절 나침반',art:'seasonCompass',use:'다음 정원에서 겨울과 다음 봄을 오가며 같은 개체를 추적해.'},
  {title:'정원의 주인 찾아 주기',goal:'생물의 관찰 자료를 알맞은 근거와 연결해.',reward:'이야기 카메라',art:'storyCamera',use:'다음 시계탑에서 네가 남긴 실제 기록으로 문제를 해결해.'},
  {title:'내 기록으로 숲의 시간 잇기',goal:'세 도움 요청에 네가 모은 알맞은 증거를 연결해.',reward:'생명 탐험가',art:'core',use:'네 이야기와 수행 기록을 보관하고 주변 생물도 직접 관찰해!'},
];
export const CLUES = [
  {id:'leaf',text:'잎을 먹으며 길쭉한 몸이 자랐어',target:'larva',art:'leaf'},
  {id:'shell',text:'몸을 감싼 껍질 안에서 변하고 있어',target:'pupa',art:'pupa'},
  {id:'wings',text:'넓은 날개로 날아 꽃을 찾아가',target:'adult',art:'adult'},
  {id:'next',text:'어른벌레가 낳아 다음 세대를 시작해',target:'egg',art:'egg'},
];
export const SEED_CASES = [
  {name:'물 없는 씨앗',question:'water',before:{water:false,warm:true}},
  {name:'추운 곳의 씨앗',question:'warm',before:{water:true,warm:false}},
];
export const CARE_CASES = [
  {name:'축 처진 화분',cause:'water',art:'dry',clue:'흙이 말라 있고 잎이 처졌어.'},
  {name:'잎이 연한 화분',cause:'light',art:'pale',clue:'물이 있지만 빛이 부족해 잎이 연하고 줄기가 길어졌어.'},
];
export const GARDEN_CASES = [
  {id:'dog',art:'puppy',text:'어미 곁에서 강아지가 태어나 자랐어.',target:'live'},
  {id:'apple',art:'apple',text:'A-01 표식의 나무가 겨울 뒤에도 새잎을 냈어.',target:'same'},
  {id:'rose',art:'rose',text:'지난해 표시한 장미 줄기에 다음 봄 새잎이 났어.',target:'same'},
];
export const FINAL_CASES = [
  {id:'cycle',text:'애벌레와 나비의 다른 모습을 보여 줘.',accept:r=>r.kind==='animal'&&['observation','compare'].includes(r.evidence?.type)},
  {id:'experiment',text:'한 조건을 바꾼 새 실험의 결과를 보여 줘.',accept:r=>r.evidence?.type==='retry'},
  {id:'care',text:'식물은 돌봄 뒤에 어떻게 달라졌을까?',accept:r=>r.evidence?.type==='care'},
];

export function initialExpedition(){
  return {version:1,active:null,clues:{},seeds:SEED_CASES.map(c=>({after:{...c.before},running:false,day:0,recorded:false})),
    care:CARE_CASES.map(()=>({measured:[],tool:null,day:0,recorded:false})),garden:{},final:{}};
}
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const day=(n,max)=>Number.isInteger(n)?Math.max(0,Math.min(max,n)):0;
export function fairRescue(c,after){return object(after)&&['water','warm'].every(k=>typeof after[k]==='boolean')&&
  ['water','warm'].filter(k=>c.before[k]!==after[k]).join()===c.question&&after.water&&after.warm;}
export function questRecords(s){return recordBank(s).filter(r=>FINAL_CASES.some(c=>c.accept(r)));}
export function questSolved(s,chapter){
  const e=s.expedition;if(!e)return false;
  if(chapter===0)return CLUES.every(c=>e.clues[c.id]===c.target);
  if(chapter===1)return SEED_CASES.every((c,i)=>e.seeds[i].recorded&&e.seeds[i].running&&e.seeds[i].day>=6&&fairRescue(c,e.seeds[i].after));
  if(chapter===2)return CARE_CASES.every((c,i)=>{const q=e.care[i];return q.recorded&&q.day===2&&q.tool===c.cause&&['water','light'].every(k=>q.measured.includes(k));});
  if(chapter===3)return GARDEN_CASES.every(c=>e.garden[c.id]===c.target);
  if(chapter===4){const bank=recordBank(s);return FINAL_CASES.every(c=>bank.some(r=>r.id===e.final[c.id]&&c.accept(r)));}
  return false;
}
export function questProgress(s,chapter){
  const e=s.expedition||initialExpedition();
  const counts=[CLUES.filter(c=>e.clues[c.id]===c.target).length,e.seeds.filter(x=>x.recorded).length,
    e.care.filter(x=>x.recorded).length,GARDEN_CASES.filter(c=>e.garden[c.id]===c.target).length,Object.keys(e.final).length];
  return [counts[chapter]||0,[4,2,2,3,3][chapter]];
}
export function restoredChapters(s){let n=0;while(n<5&&s.completed.includes(n*2+1)&&questSolved(s,n))n++;return n;}
export function startQuest(s,chapter){
  if(!Number.isInteger(chapter)||chapter<0||chapter>4||s.mission!==chapter*2+1||!canEnter(s,s.mission)||!ready(s,s.mission))return false;
  s.expedition??=initialExpedition();s.expedition.active=chapter;return true;
}
export function questAction(s,type,value={}){
  const e=s.expedition,c=e?.active;
  const result=(ok,message)=>({ok,message});
  if(!Number.isInteger(c)||s.screen!=='mission'||s.mission!==c*2+1||!canEnter(s,s.mission)||!ready(s,s.mission))return result(false,'탐구 기록을 먼저 완성해 줘.');
  if(c===0&&type==='match'){
    const clue=CLUES.find(x=>x.id===value.id);if(!clue)return result(false,'관찰 단서를 골라 줘.');
    if(value.target!==clue.target)return result(false,clue.text+' 어느 모습에서 보았는지 다시 살펴봐.');
    e.clues[clue.id]=value.target;return result(true,clue.id==='next'?'어른벌레가 낳은 알에서 다음 세대가 시작돼!':'관찰 단서가 제자리를 찾았어.');
  }
  if(c===1){
    const i=e.seeds.findIndex(x=>!x.recorded);if(i<0)return result(true,'두 씨앗의 변화를 기록했어.');
    const q=e.seeds[i],problem=SEED_CASES[i];
    if(type==='seed-adjust'&&['water','warm'].includes(value.key)){
      if(q.running)return result(false,'시작한 실험은 조건을 보관해. 시간을 돌려 결과를 확인해.');
      q.after[value.key]=!q.after[value.key];return result(true,'새 씨앗의 '+(value.key==='water'?'물':'온도')+' 조건을 바꿨어.');
    }
    if(type==='seed-run'){
      if(!fairRescue(problem,q.after))return result(false,'도움이 필요한 조건 하나만 바꾸고, 나머지는 같게 맞춰 줘.');
      if(!q.running){q.running=true;q.day=0;}return result(true,'같은 씨앗·흙·깊이야. 시간 손잡이를 돌려 둘을 비교해.');
    }
    if(type==='seed-time'){
      if(!q.running)return result(false,'조건을 맞추고 비교 실험을 먼저 시작해.');
      if(!Number.isInteger(value.day)||value.day<0||value.day>7)return result(false,'0일부터 7일 사이를 살펴봐.');
      q.day=value.day;return result(true,`${q.day}일: 새 씨앗은 ${['아직 싹이 보이지 않아','뿌리가 나왔어','싹이 올라왔어','잎이 펼쳐졌어'][seedLevel(q.after,q.day)]}.`);
    }
    if(type==='seed-record'){
      if(!q.running||q.day<6||!fairRescue(problem,q.after))return result(false,'6일 뒤까지 돌려 두 씨앗의 차이를 확인해 줘.');
      q.recorded=true;return result(true,i===0?'물이 싹 트는 데 필요했어. 이번엔 추운 씨앗을 도와주자.':'물과 알맞은 온도가 필요하다는 두 비교 기록을 얻었어!');
    }
  }
  if(c===2){
    const i=e.care.findIndex(x=>!x.recorded);if(i<0)return result(true,'두 화분의 새잎을 기록했어.');
    const q=e.care[i],problem=CARE_CASES[i];
    if(type==='care-measure'&&['water','light'].includes(value.key)){
      if(!q.measured.includes(value.key))q.measured.push(value.key);
      return result(true,value.key==='water'?(problem.cause==='water'?'물 센서: 흙이 말라 있어.':'물 센서: 물은 알맞아.'):(problem.cause==='light'?'빛 센서: 빛이 부족해.':'빛 센서: 빛은 충분해.'));
    }
    if(type==='care-tool'){
      if(q.measured.length<2)return result(false,'관찰 센서로 물과 빛을 모두 재어 원인을 찾아 줘.');
      if(value.key!==problem.cause)return result(false,problem.cause==='water'?'빛은 충분해. 마른 흙에 필요한 도움을 찾아봐.':'물은 알맞아. 빛이 부족한 식물에게 필요한 도움을 찾아봐.');
      q.tool=value.key;return result(true,'필요한 도움을 줬어. 바로 낫지는 않으니 시간을 두고 살펴보자.');
    }
    if(type==='care-time'){
      if(!q.tool)return result(false,'필요한 돌봄을 먼저 해 줘.');
      if(!Number.isInteger(value.day)||value.day<0||value.day>2)return result(false,'돌본 직후부터 며칠 뒤까지 살펴봐.');
      q.day=value.day;return result(true,['돌본 직후야. 아직 모습이 같아.','며칠 뒤: 새잎이 자라기 시작해.','더 며칠 뒤: 새잎의 변화를 눌러 기록해.'][q.day]);
    }
    if(type==='care-record'){
      if(q.day!==2||q.tool!==problem.cause)return result(false,'필요한 돌봄 뒤 마지막 시간의 새잎을 확인해 줘.');
      q.recorded=true;return result(true,i===0?'물을 돌려준 뒤 새잎을 확인했어. 다음 화분도 조사하자.':'서로 다른 두 원인에 맞는 돌봄 기록을 얻었어!');
    }
  }
  if(c===3&&type==='garden-match'){
    const problem=GARDEN_CASES.find(x=>x.id===value.id);if(!problem)return result(false,'관찰 자료를 골라 줘.');
    if(value.target!==problem.target)return result(false,problem.text+' 태어난 모습이나 표식을 다시 확인해.');
    e.garden[problem.id]=value.target;return result(true,'관찰한 증거로 '+(problem.target==='live'?'새끼로 태어난 생물':'겨울을 지낸 같은 개체')+'임을 확인했어.');
  }
  if(c===4&&type==='record-match'){
    const problem=FINAL_CASES.find(x=>x.id===value.target),r=recordBank(s).find(x=>x.id===value.id);
    if(!problem||!r||!problem.accept(r))return result(false,'도움 요청에 맞는 관찰·재실험·돌봄 증거를 골라 줘.');
    e.final[problem.id]=r.id;return result(true,r.title+' 기록이 숲의 시간에 연결됐어!');
  }
  return result(false,'장면의 도구와 대상을 연결해 줘.');
}

// Old completions never become new performances. Only validated new records are restored.
export function restoreExpedition(raw,s){
  const e=initialExpedition(),v=object(raw)&&raw.version===1?raw:{};
  for(const c of CLUES)if(v.clues?.[c.id]===c.target)e.clues[c.id]=c.target;
  SEED_CASES.forEach((c,i)=>{const q=v.seeds?.[i];if(!object(q))return;
    for(const k of ['water','warm'])if(typeof q.after?.[k]==='boolean')e.seeds[i].after[k]=q.after[k];
    const clean=e.seeds[i];clean.running=q.running===true&&fairRescue(c,clean.after);clean.day=clean.running?day(q.day,7):0;
    clean.recorded=clean.running&&clean.day>=6&&q.recorded===true;
  });
  CARE_CASES.forEach((c,i)=>{const q=v.care?.[i];if(!object(q))return;
    const clean=e.care[i];clean.measured=['water','light'].filter(k=>Array.isArray(q.measured)&&q.measured.includes(k));
    clean.tool=clean.measured.length===2&&q.tool===c.cause?c.cause:null;clean.day=clean.tool?day(q.day,2):0;
    clean.recorded=!!clean.tool&&clean.day===2&&q.recorded===true;
  });
  for(const c of GARDEN_CASES)if(v.garden?.[c.id]===c.target)e.garden[c.id]=c.target;
  const bank=recordBank(s);for(const c of FINAL_CASES)if(bank.some(r=>r.id===v.final?.[c.id]&&c.accept(r)))e.final[c.id]=v.final[c.id];
  if(Number.isInteger(v.active)&&v.active>=0&&v.active<5&&s.screen==='mission'&&s.mission===v.active*2+1&&canEnter(s,s.mission)&&ready(s,s.mission))e.active=v.active;
  return e;
}
