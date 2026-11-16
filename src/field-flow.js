import {fieldReady,fieldBookReady,seedReportDone,fieldPhase,towerStep} from './field-model.js';
import {questReady,questInfo} from './field-quests.js';
import {FIELD_CHAPTERS,FIELD_REPLAY_GOALS} from './field-content.js';
import {icon} from './ui-icons.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fieldButton=(label,action,payload={},symbol='')=>`<button class="tool-button" data-field-action="${action}" data-payload="${esc(JSON.stringify(payload))}">${symbol?icon(symbol):''}<span>${label}</span></button>`;
// The last time-dial frame stays on screen until the learner says the observation is done.
// The hold lives in memory only, so saves and restores follow the original progress rules.
const holds=new WeakMap();
const HOLD_FROM={grow:'seed-day'};
export function holdObservation(f,before,type){if(HOLD_FROM[before]===type&&roomPhase(f)!==before)holds.set(f,{chapter:f.active,phase:before});}
export const observationHeld=f=>holds.get(f)?.chapter===f.active;
export function releaseObservation(f){holds.delete(f);}
const validChange=r=>r.b.water===true&&r.b.warm===true;
export function roomPhase(f){
 const c=f.active,q=f.chapters[c];if(observationHeld(f))return holds.get(f).phase;if(fieldReady(f,c))return f.discoveryVisit===c&&!questReady(f,c)?'discovery':'ready';
 if(c===0){
  if(!Object.values(q.inspected).every(p=>p.length>=1))return 'search';
  if(fieldPhase(f,c)==='draw')return 'draw';
  if(q.order.join()!=='egg,larva,pupa,adult')return 'film';return 'generation';
 }
 if(c===1){const r=q.rounds[q.round];if(!['a','b'].every(k=>r.prepared[k].soil&&r.prepared[k].seeds===3))return 'prepare';if(!r.run)return 'design';if(![d=>d===0,d=>d>=2&&d<=4,d=>d>=6].every(fn=>r.photos.some(fn)))return 'grow';if(r.reason!==r.variable||!seedReportDone(r))return 'reason';return 'seed-next';}
 if(c===2){const r=q.cases[q.case];if(r.measured.length<2)return 'measure';if(!r.symptom)return 'symptom';if(!r.tool)return 'care';if(!r.photos.includes(2))return 'care-after';return r.comparison?'care-next':'care-compare';}
 if(c===3){
  if(![0,3].every(n=>q.animals.butterfly.photos.includes(n))||![0,2].every(n=>q.animals.dog.photos.includes(n)))return 'animals';
  if(q.generation!=='different')return 'animal-birth';
  if(q.tags.length<2||!['apple-0','balsam-0'].every(k=>q.plantPhotos.includes(k)))return 'tags';
  if(!['apple-3','balsam-3','apple-4','balsam-4'].every(k=>q.plantPhotos.includes(k))||!q.seasonCompared)return 'seasons';
  if(q.classifications.apple!=='same'||q.classifications.balsam!=='new')return 'plant-identity';return 'transfer';
 }
 {const step=towerStep(f);return step==='plan'||step==='ready'?'tower-note':step;}
}
export function roomUI(s,ui){
 const f=s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),r=FIELD_CHAPTERS[c];let objective=r.goal,controls='',next='발견 기록',nextAction='hint';
 const action=(label,type,payload={},symbol='')=>fieldButton(label,type,payload,symbol);
 if(phase==='discovery')return {phase,...questInfo(f),controls:action('나중에 할게','discovery-exit',{},'left')};
 if(phase==='ready')return {phase,objective:f.completed.includes(c)?FIELD_REPLAY_GOALS[c]:'네가 찾은 기록으로 숲을 깨울 준비가 됐어.',controls:(!questReady(f,c)?fieldButton('(선택) 새 발견 미션','discovery-enter',{chapter:c},'lens'):'')+(f.completed.includes(c)?fieldButton(c===4?'새 이야기 만들기':'다시 탐사하기','chapter-restart',{chapter:c},'reset'):''),next:c===4?'숲의 시간 잇기':f.completed.includes(c)?'숲으로 돌아가기':r.reward+' 받기',nextAction:'complete'};
 if(c===0){
  if(phase==='search'){objective='나비 그림의 ‘보기’를 눌러 확대해 봐. 돋보기를 끌어도 돼.';next='관찰한 단서 보기';}
  if(phase==='draw'){objective='직접 본 특징을 한 문장으로 남겨 줘.';controls='';next='내 기록 확인';}
  if(phase==='film'){objective='흩어진 사진을 자라는 순서로 이어 줘.';controls=action(ui.play?'재생 멈춤':'내 순서 재생','film-play',{},'play');next='시간길 확인';}
  if(phase==='generation'){objective='어른벌레가 낳은 알로 다음 세대를 이어 줘.';controls='';next='다음 세대 확인';}
 }
 if(c===1){
  if(phase==='prepare'){objective='두 화분에 같은 흙과 씨앗 세 알을 놓아 줘.';next='준비 확인';}
  if(phase==='design'){objective=q.round===0?'A는 그대로, B에만 물을 주면 어떻게 될까?':'온도만 다르게 두면 씨앗은 어떻게 될까?';const r=q.rounds[q.round];if(q.round===0&&r.prediction&&validChange(r)){next='비교 실험 시작';nextAction='seed-run';}}
  if(phase==='grow'){objective='시간이 저절로 흘러가. 0일부터 7일까지 지켜봐.';controls=action('흙 속 단면','cross-section',{},'lens');}
  if(phase==='reason'){objective='노트에 남은 사진을 비교해 보자.';next='비교 기록 확인';}
  if(phase==='seed-next'){objective='네가 바꾼 조건과 씨앗의 변화가 기록됐어.';next='다른 씨앗 돕기';nextAction='seed-next';}
 }
 if(c===2){const plant=q.cases[q.case];
  if(phase==='measure'){objective=q.case?'흙은 촉촉한데 잎빛이 옅어. 이 화분에는 무엇이 부족할까?':'물기와 빛을 재서 잎이 처진 까닭을 찾아보자.';next='물·빛 기록 확인';}
  if(phase==='symptom'){objective='물·빛을 잰 결과와 모습을 보고 흙이나 잎에 표시해 줘.';next='관찰핀 확인';}
  if(phase==='care'){objective='확인한 원인에 맞는 돌봄 도구를 놓아 줘.';next='돌봄 확인';}
  if(phase==='care-after'){objective=plant.variable==='light'?'시간이 저절로 흘러가. 새잎이 자란 뒤를 살펴봐.':'시간이 저절로 흘러가. 이틀 뒤 잎을 살펴봐.';}
  if(phase==='care-compare'){objective='돌보기 전과 나중 모습을 비교해 봐. 무엇이 달라졌니?';}
  if(phase==='care-next'){objective='다른 화분도 같은 도움이 필요할까?';next='다른 화분 조사';nextAction='care-next';}
 }
 if(c===3){
  if(phase==='animals'){objective=[0,3].every(n=>q.animals.butterfly.photos.includes(n))?'나비 기록을 가져왔어. 개의 시간을 움직여 비교해 봐.':'나비와 개의 처음과 다 자란 모습을 살펴봐.';next='태어난 모습 비교';}
  if(phase==='animal-birth'){objective='부모와 새로 태어난 생명은 같은 몸일까?';next='다음 세대 확인';}
  if(phase==='tags'){objective='두 식물에 이름표를 달아 첫봄 모습을 기록해 줘.';next='이름표 확인';}
  if(phase==='seasons'){objective='겨울과 다음 봄을 보며 같은 식물이 살아남는지 찾아봐.';next='시간 기록 확인';}
  if(phase==='plant-identity'){objective='이름표 줄을 보고 작년 그 식물인지, 새로 자란 식물인지 골라 줘.';next='작년 식물 확인';}
  if(phase==='transfer'){objective='식물 카드를 한해살이와 여러해살이로 나눠 봐.';next='분류 확인';}
 }
 if(c===4){
  if((phase==='tower-note'||phase==='tower-run')&&fieldBookReady(f))controls=action('내 이야기 재생','story-play',{},'play')+action('나의 생명 관찰 노트 인쇄하기','export',{},'camera');
  if(phase==='tower-evidence'){objective='쪽지를 읽고 네가 직접 찾은 증거 사진을 골라 줘.';}
  if(phase==='tower-note'){objective='찾은 증거로 발견 한 문장과 실제 관찰 약속을 남겨 줘.';next='연구 노트 쓰기';nextAction='story-info';}
  if(phase==='tower-run'){objective='네 증거가 모두 모였어. 시계를 깨울 차례야!';next='시계 돌리기';nextAction='tower-start';}
 }
 if(observationHeld(f)){next='관찰을 마쳤어요';nextAction='observation-done';objective='마지막 날 A와 B를 0일 모습과 비교해 봐. 어디가 달라졌니?';}
 return {phase,objective,controls,next,nextAction,guide:r.guide};
}
