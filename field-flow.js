import {fieldReady,fieldRecords,fieldPhase} from './field-model.js';
import {questReady,questInfo} from './field-quests.js';
import {FIELD_CHAPTERS,FIELD_REPLAY_GOALS,FORM_NAMES} from './field-content.js';
import {icon} from './ui-icons.js';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fieldButton=(label,action,payload={},symbol='')=>`<button class="tool-button" data-field-action="${action}" data-payload="${esc(JSON.stringify(payload))}">${symbol?icon(symbol):''}<span>${label}</span></button>`;
export function roomPhase(f){
 const c=f.active,q=f.chapters[c];if(fieldReady(f,c))return (!f.completed.includes(c)||f.discoveryVisit===c)&&!questReady(f,c)?'discovery':'ready';
 if(c===0){
  if(!Object.values(q.inspected).every(p=>p.length>=2))return 'search';
  if(fieldPhase(f,c)==='draw')return 'draw';
  if(q.order.join()!=='egg,larva,pupa,adult')return 'film';return 'generation';
 }
 if(c===1){const r=q.rounds[q.round];if(!['a','b'].every(k=>r.prepared[k].soil&&r.prepared[k].seeds===3))return 'prepare';if(!r.run)return 'design';if(![d=>d===0,d=>d>=2&&d<=4,d=>d>=6].every(fn=>r.photos.some(fn)))return 'grow';if(r.reason!==r.variable)return 'reason';return 'seed-next';}
 if(c===2){const r=q.cases[q.case];if(r.measured.length<2)return 'measure';if(!r.symptom)return 'symptom';if(!r.photos.includes(0))return 'care-before';if(!r.tool)return 'care';if(!r.photos.includes(2))return 'care-after';return 'care-next';}
 if(c===3){
  if(![0,3].every(n=>q.animals.butterfly.photos.includes(n))||![0,2].every(n=>q.animals.dog.photos.includes(n)))return 'animals';
  if(q.generation!=='different')return 'animal-birth';
  if(q.tags.length<2||!['apple-0','balsam-0'].every(k=>q.plantPhotos.includes(k)))return 'tags';
  if(!['apple-3','balsam-3','apple-4','balsam-4'].every(k=>q.plantPhotos.includes(k)))return 'seasons';
  if(q.classifications.apple!=='same'||q.classifications.balsam!=='new')return 'plant-identity';return 'transfer';
 }
 const bank=fieldRecords(f).filter(r=>q.records.includes(r.id));
 if(q.records.length<3||new Set(bank.map(r=>r.kind)).size<2)return 'story-pick';
 if(q.title.trim().length<2||q.summary.trim().length<8||q.records.filter(id=>q.captions[id]?.trim().length>=4).length<2)return 'story-edit';
 if(['observation','retry','care'].some(k=>!q.matches[k]))return 'story-help';return 'plan';
}
export function roomUI(s,ui){
 const f=s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),r=FIELD_CHAPTERS[c];let objective=r.goal,controls='',next='발견 기록',nextAction='hint';
 const action=(label,type,payload={},symbol='')=>fieldButton(label,type,payload,symbol);
 if(phase==='discovery')return {phase,...questInfo(f)};
 if(phase==='ready')return {phase,objective:f.completed.includes(c)?FIELD_REPLAY_GOALS[c]:'네가 찾은 기록으로 숲을 깨울 준비가 됐어.',controls:f.completed.includes(c)?(!questReady(f,c)?fieldButton('새 발견 미션','discovery-enter',{chapter:c},'lens'):'')+fieldButton(c===4?'새 이야기 만들기':'다시 탐사하기','chapter-restart',{chapter:c},'reset'):'',next:c===4?'숲의 시간 잇기':f.completed.includes(c)?'숲으로 돌아가기':r.reward+' 받기',nextAction:'complete'};
 if(c===0){
  if(phase==='search'){objective='돋보기를 움직여 나비의 네 모습을 살펴봐.';controls='<span class="tool-hint">몸 위로 옮기기 → 확대해서 보기 → 놓아서 기록</span>';next='관찰한 단서 보기';}
  if(phase==='draw'){objective='직접 본 특징을 그림과 한 문장으로 남겨 줘.';controls=action('특징 쓰기','note',{},'pen')+action('그림 지우기','clear-drawing',{},'reset');next='내 기록 확인';}
  if(phase==='film'){objective='흩어진 사진을 자라는 순서로 이어 줘.';controls=action(ui.play?'재생 멈춤':'내 순서 재생','film-play',{},'play');next='시간길 확인';}
  if(phase==='generation'){objective='어른벌레가 낳은 알로 다음 세대를 이어 줘.';controls='';next='다음 세대 확인';}
 }
 if(c===1){const trial=q.rounds[q.round];
  if(phase==='prepare'){objective='두 화분에 같은 흙과 씨앗 세 알을 놓아 줘.';controls='<span class="tool-hint">지훈의 흙 주머니와 씨앗을 화분에 놓아 봐.</span>';next='준비 확인';}
  if(phase==='design'){objective=q.round===0?'A는 그대로, B에만 물을 주면 어떻게 될까?':'온도만 다르게 두면 씨앗은 어떻게 될까?';controls=action('내 예상 남기기','prediction',{},'pin');next='비교 실험 시작';nextAction='seed-run';}
  if(phase==='grow'){objective='시간을 돌려 처음·중간·마지막 모습을 찍어 줘.';controls=action('흙 속 단면','cross-section',{},'lens');next=`${trial.day}일 비교 사진`;nextAction='seed-photo';}
  if(phase==='reason'){objective='두 결과를 다르게 만든 조건을 연결해 줘.';next='비교 근거 확인';}
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
  if(phase==='animals'){objective='두 생물의 시간을 따로 움직이며 처음과 끝을 찍어 줘.';controls=action('나비 사진','animal-photo',{animal:'butterfly'},'camera')+action('개 사진','animal-photo',{animal:'dog'},'camera');next='태어난 모습 비교';}
  if(phase==='animal-birth'){objective='부모와 새로 태어난 생명은 같은 몸일까?';next='다음 세대 확인';}
  if(phase==='tags'){objective='두 식물에 이름표을 달고 첫봄의 모습을 찍어 줘.';controls=action('사과나무 사진','season-photo',{plant:'apple'},'camera')+action('봉선화 사진','season-photo',{plant:'balsam'},'camera');next='이름표 확인';}
  if(phase==='seasons'){objective='겨울과 다음 봄에도 이름표과 씨앗을 찾아 찍어 줘.';controls=action('사과나무 사진','season-photo',{plant:'apple'},'camera')+action('봉선화 사진','season-photo',{plant:'balsam'},'camera');next='시간 기록 확인';}
  if(phase==='plant-identity'){objective='지난해 이름표과 새 씨앗의 이름표를 이어 줘.';next='작년 식물 확인';}
  if(phase==='transfer'){objective=q.transfers.rose!=='same'?'새 장미 자료에도 네 판단 방법을 써 봐.':'갓 태어난 강아지에게 맞는 기록을 이어 줘.';next='새 상황 확인';}
 }
 if(c===4){
  if(phase==='story-pick'){objective='내 동물·식물 기록을 이야기판에 담아 줘.';controls=action('이전 자료','record-page',{delta:-1},'left')+action('다음 자료','record-page',{delta:1},'right');next='내 이야기 확인';}
  if(phase==='story-edit'){objective='내 발견에 이름과 설명을 붙여 줘.';controls=action('이야기 이름·생각','story-info',{},'pen')+action('사진 설명','story-caption',{},'pen')+action('다음 자료','record-page',{delta:1},'right');next='이야기 완성 확인';}
  if(phase==='story-help'){objective='세 도움 요청에 알맞은 내 기록를 연결해 줘.';controls=action('이전 자료','record-page',{delta:-1},'left')+action('다음 자료','record-page',{delta:1},'right');next='기록 연결 확인';}
  if(phase==='plan'){objective='모형 밖에서 직접 이어갈 관찰을 약속해 줘.';controls=action('내 이야기 재생','story-play',{},'play')+action('이야기 PNG','export',{},'camera');next='실제 관찰 약속';nextAction='plan';}
 }
 return {phase,objective,controls,next,nextAction,guide:r.guide};
}
