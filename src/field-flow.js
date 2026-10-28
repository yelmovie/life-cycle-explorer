import {SORT_CARDS,CORE_PLANT_CARDS} from './field-content.js';
import {fieldReady,seedReportDone,fieldRecords,fieldPhase,towerStep} from './field-model.js';
import {questReady,questInfo} from './field-quests.js';
import {FIELD_CHAPTERS,FIELD_REPLAY_GOALS,FORM_NAMES} from './field-content.js';
import {icon} from './ui-icons.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fieldButton=(label,action,payload={},symbol='')=>`<button class="tool-button" data-field-action="${action}" data-payload="${esc(JSON.stringify(payload))}">${symbol?icon(symbol):''}<span>${label}</span></button>`;
export function roomPhase(f){
 const c=f.active,q=f.chapters[c];if(fieldReady(f,c))return f.discoveryVisit===c&&!questReady(f,c)?'discovery':'ready';
 if(c===0){
  if(!Object.values(q.inspected).every(p=>p.length>=1))return 'search';
  if(fieldPhase(f,c)==='draw')return 'draw';
  if(q.order.join()!=='egg,larva,pupa,adult')return 'film';return 'generation';
 }
 if(c===1){const r=q.rounds[q.round];if(!['a','b'].every(k=>r.prepared[k].soil&&r.prepared[k].seeds===3))return 'prepare';if(!r.run)return 'design';if(![d=>d===0,d=>d>=2&&d<=4,d=>d>=6].every(fn=>r.photos.some(fn)))return 'grow';if(r.reason!==r.variable||!seedReportDone(r))return 'reason';return 'seed-next';}
 if(c===2){const r=q.cases[q.case];if(r.measured.length<2)return 'measure';if(!r.symptom)return 'symptom';if(!r.photos.includes(0))return 'care-before';if(!r.tool)return 'care';if(!r.photos.includes(2))return 'care-after';return 'care-next';}
 if(c===3){
  if(![0,3].every(n=>q.animals.butterfly.photos.includes(n))||![0,2].every(n=>q.animals.dog.photos.includes(n)))return 'animals';
  if(q.generation!=='different')return 'animal-birth';
  if(q.tags.length<2||!['apple-0','balsam-0'].every(k=>q.plantPhotos.includes(k)))return 'tags';
  if(!['apple-3','balsam-3','apple-4','balsam-4'].every(k=>q.plantPhotos.includes(k))||!q.seasonCompared)return 'seasons';
  if(q.classifications.apple!=='same'||q.classifications.balsam!=='new')return 'plant-identity';return 'transfer';
 }
 {const step=towerStep(f);return step==='ready'?'plan':step;}
}
export function roomUI(s,ui){
 const f=s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),r=FIELD_CHAPTERS[c];let objective=r.goal,controls='',next='발견 기록',nextAction='hint';
 const action=(label,type,payload={},symbol='')=>fieldButton(label,type,payload,symbol);
 if(phase==='discovery')return {phase,...questInfo(f),controls:action('나중에 할게','discovery-exit',{},'left')};
 if(phase==='ready')return {phase,objective:f.completed.includes(c)?FIELD_REPLAY_GOALS[c]:'네가 찾은 기록으로 숲을 깨울 준비가 됐어.',controls:(!questReady(f,c)?fieldButton('(선택) 새 발견 미션','discovery-enter',{chapter:c},'lens'):'')+(f.completed.includes(c)?fieldButton(c===4?'새 이야기 만들기':'다시 탐사하기','chapter-restart',{chapter:c},'reset'):''),next:c===4?'숲의 시간 잇기':f.completed.includes(c)?'숲으로 돌아가기':r.reward+' 받기',nextAction:'complete'};
 if(c===0){
  if(phase==='search'){objective='돋보기를 움직여 나비의 네 모습을 살펴봐.';next='관찰한 단서 보기';}
  if(phase==='draw'){objective='직접 본 특징을 한 문장으로 남겨 줘.';controls='';next='내 기록 확인';}
  if(phase==='film'){objective='흩어진 사진을 자라는 순서로 이어 줘.';controls=action(ui.play?'재생 멈춤':'내 순서 재생','film-play',{},'play');next='시간길 확인';}
  if(phase==='generation'){objective='어른벌레가 낳은 알로 다음 세대를 이어 줘.';controls='';next='다음 세대 확인';}
 }
 if(c===1){const trial=q.rounds[q.round];
  if(phase==='prepare'){objective='두 화분에 같은 흙과 씨앗 세 알을 놓아 줘.';next='준비 확인';}
  if(phase==='design'){objective=q.round===0?'A는 그대로, B에만 물을 주면 어떻게 될까?':'온도만 다르게 두면 씨앗은 어떻게 될까?';controls=action('내 예상 남기기','prediction',{},'pin');next='비교 실험 시작';nextAction='seed-run';}
  if(phase==='grow'){objective='시간 손잡이를 돌려 0일부터 7일까지 지켜봐.';controls=action('흙 속 단면','cross-section',{},'lens');}
  if(phase==='reason'){objective='노트에 남은 사진을 비교해 보자.';next='비교 기록 확인';}
  if(phase==='seed-next'){objective='네가 바꾼 조건과 씨앗의 변화가 기록됐어.';next='다른 씨앗 돕기';nextAction='seed-next';}
 }
 if(c===2){const plant=q.cases[q.case];
  if(phase==='measure'){objective='도구를 화분에 놓아 물기와 빛을 재어 줘.';next='물·빛 기록 확인';}
  if(phase==='symptom'){objective='물·빛을 잰 결과와 모습을 보고 흙이나 잎에 표시해 줘.';next='관찰핀 확인';}
  if(phase==='care-before'){objective='돌보기 전 모습부터 사진으로 남겨 줘.';next='돌봄 전 사진';nextAction='care-photo';}
  if(phase==='care'){objective='확인한 원인에 맞는 돌봄 도구를 놓아 줘.';next='돌봄 확인';}
  if(phase==='care-after'){objective='돌본 뒤 시간을 움직여 새잎을 비교해 줘.';next='돌봄 뒤 사진';nextAction='care-photo';}
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
  if(phase==='tower-slots'){objective='시계탑 네 칸에 지역마다 내 기록을 하나씩 끼워 줘.';controls=action('이전 기록','record-page',{delta:-1},'left')+action('다음 기록','record-page',{delta:1},'right');next='칸 확인';}
  if(phase==='tower-evidence'){objective='주장 쪽지마다 그걸 증명하는 내 사진을 실로 이어 줘.';next='증거 확인';}
  if(phase==='tower-note'){objective='연구 노트에 내 발견의 이름과 한 문장을 남겨 줘.';controls=action('연구 노트 쓰기','story-info',{},'pen');next='노트 확인';}
  if(phase==='tower-run'){objective='큰 시곗바늘을 한 바퀴 돌려 시계탑을 깨워 줘.';next='시계 확인';}
  if(phase==='plan'){objective='모형 밖에서 직접 이어갈 관찰을 약속해 줘.';controls=action('내 이야기 재생','story-play',{},'play')+action('이야기 PNG','export',{},'camera');next='실제 관찰 약속';nextAction='plan';}
 }
 return {phase,objective,controls,next,nextAction,guide:r.guide};
}
