import {TEXT_LIMITS,PLAN_LIMITS,preserveText,meaningfulText} from './field-writing.js';
import {normalizeDiscovery} from './field-quest-state.js';
import {SORT_CARDS,CORE_PLANT_CARDS} from './field-content.js';

// The field notebook is independent of the earlier inquiry and expedition saves.
// It contains observations made by the learner, never inferred chapter rewards.
export const FIELD_FORMS = ['egg', 'larva', 'pupa', 'adult'];
export const FIELD_PREDICTIONS = ['a', 'b', 'both', 'neither', 'unsure'];
const copy = value => JSON.parse(JSON.stringify(value));
const prep = () => ({soil:false, seeds:0});
const baseline = variable => ({water:variable !== 'water', warm:variable !== 'warm'});
const seedRound = variable => ({variable, prepared:{a:prep(), b:prep()}, prediction:'', b:baseline(variable), run:null, day:0, photos:[], reason:'', report:{result:'',expectation:''},legacyReport:false});
const careCase = variable => ({variable, measured:[], symptom:'', observations:[], tool:'', day:0, photos:[]});

// These are observation frames in a simplified bean experiment, not a promise
// that every species germinates on a fixed day or that cold seeds are dead.
export function seedObservation(round, side) {
  const condition=round.run?.[side] || (side==='a' ? baseline(round.variable) : round.b);
  const day=round.run ? round.day : 0;
  const level=!condition.water || !condition.warm || day<2 ? 0 : day<4 ? 1 : day<6 ? 2 : 3;
  const detail=day===0 ? '실험을 시작한 모습' : !condition.water ? '물이 없어 아직 싹이 트지 않았어' : !condition.warm ? '낮은 온도에서 아직 싹이 트지 않았어' : level===0 ? '씨앗이 물을 흡수하고 있어' : level===1 ? '뿌리가 나오고 싹이 올라와' : level===2 ? '줄기와 잎이 자라고 있어' : '잎이 펼쳐진 모습을 관찰했어';
  return {condition:{...condition},day,level,detail};
}

export const careTimeLabels = task => task.variable==='light' ? ['돌봄 전','며칠 뒤','새잎이 자란 뒤'] : ['돌봄 전','하루 뒤','이틀 뒤'];

export function initialField() {
  return {
    version:1, active:0, completed:[], attempts:[], snapshots:{},
    chapters:[
      {inspected:Object.fromEntries(FIELD_FORMS.map(id => [id, []])), drawing:[], drawingForm:'larva',note:'',noteDraft:null, order:['pupa','egg','adult','larva'], generation:'',discovery:[]},
      {round:0, rounds:[seedRound('water'), seedRound('warm')],discovery:[]},
      {case:0, cases:[careCase('water'), careCase('light')],discovery:[]},
      {animals:{butterfly:{step:0, photos:[]}, dog:{step:0, photos:[]}}, generation:'', tags:[], season:0, plantPhotos:[], seasonCompared:false, classifications:{}, transfers:{},discovery:[]},
      {records:[], title:'', captions:{}, drafts:{captions:{},story:{},plan:{}},summary:'', matches:{}, towerRun:false, plan:{subject:'', when:'', what:''},discovery:[]},
    ],
  };
}

// Drafts persist writing only. They never update submitted answers or readiness.
export function storeFieldDraft(field,scope,values={}){
 if(scope==='observation'){field.chapters[0].noteDraft=preserveText(values.text,TEXT_LIMITS.observation);return true;}
 const book=field.chapters[4];book.drafts||={captions:{},story:{},plan:{}};
 if(scope==='caption'){if(!book.records.includes(values.id))return false;book.drafts.captions[values.id]=preserveText(values.text,TEXT_LIMITS.caption);return true;}
 const limits=scope==='story'?{title:TEXT_LIMITS.title,summary:TEXT_LIMITS.summary}:scope==='plan'?PLAN_LIMITS:null;
 if(!limits)return false;
 for(const[key,limit]of Object.entries(limits))if(typeof values[key]==='string')book.drafts[scope][key]=preserveText(values[key],limit);
 return true;
}

const textValue = (value, limit=300) => preserveText(value,limit);
const numberIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const array = value => Array.isArray(value) ? value : [];
const unique = values => [...new Set(values)];
const validPrep = round => ['a','b'].every(side => round.prepared[side].soil === true && round.prepared[side].seeds === 3);
const validSeedChange = round => round.b.water === true && round.b.warm === true;
const seedPhotosDone = round => round.photos.includes(0) && round.photos.some(day => day >= 2 && day <= 4) && round.photos.some(day => day >= 6);
export const seedExpectation=round=>round.run?.prediction==='unsure'?'unsure':round.run?.prediction==='b'?'same':'changed';
export const seedReportDone=round=>round.legacyReport===true||(round.report?.result==='b'&&round.report?.expectation===seedExpectation(round));
const seedDone = round => !!round.run && seedPhotosDone(round) && round.reason === round.variable && seedReportDone(round);
const careDone = task => task.measured.includes('water') && task.measured.includes('light') && task.symptom === (task.variable === 'water' ? 'dry' : 'pale') && task.tool === task.variable && task.photos.includes(0) && task.photos.includes(2);
const observed = chapter => FIELD_FORMS.every(form => chapter.inspected[form].length > 0);
const drawingDone = chapter => meaningfulText(chapter.note) >= 4;
const filmDone = chapter => FIELD_FORMS.every((form,i) => chapter.order[i] === form);
const animalDone = chapter => chapter.animals.butterfly.photos.includes(0) && chapter.animals.butterfly.photos.includes(3) && chapter.animals.dog.photos.includes(0) && chapter.animals.dog.photos.includes(2) && chapter.generation === 'different';
const plantsSeen = chapter => ['apple','balsam'].every(plant => chapter.tags.includes(plant) && [0,3,4].every(step => chapter.plantPhotos.includes(`${plant}-${step}`)));
const classificationsDone = chapter => chapter.classifications.apple === 'same' && chapter.classifications.balsam === 'new';
const transfersDone = chapter => SORT_CARDS.filter(card => CORE_PLANT_CARDS.includes(card.id)).every(card => chapter.transfers[card.id] === card.bin);

export function fieldUnlocked(field, chapter) {
  return numberIn(chapter,0,4) && (field.preview === true || chapter === 0 || Array.from({length:chapter},(_,i) => i).every(i => field.completed.includes(i)));
}

export function fieldCompletedCount(field) { return unique(field.completed).filter(i => numberIn(i,0,4)).length; }

// Life clock tower: one record from each of the four regions sits in its socket.
export const TOWER_REGIONS=['나비의 숲','씨앗 연구소','햇살 온실','사계절 정원'];
// Claims the learner proves with their own records; the request ids stay stable for saved books.
export const TOWER_CLAIMS=[
  {request:'observation',text:'동물은 자라면서 몸의 생김새가 달라져.',accept:['observation','comparison'],clue:'이 사진에서 몸의 생김새가 바뀌는 모습이 보일까? 동물이 자라는 기록을 찾아봐.'},
  {request:'retry',text:'씨앗이 싹트려면 물과 알맞은 온도가 필요해.',accept:['retry'],clue:'조건 하나만 바꿔 싹을 비교한 기록이어야 증거가 돼.'},
  {request:'care',text:'식물은 물이나 빛이 부족하면 겉모습으로 신호를 보내.',accept:['care'],clue:'물기와 빛을 재고 돌본 뒤 달라진 기록을 찾아봐.'},
];
const slotsDone = field => {
  const bank = fieldRecords(field), slots = field.chapters[4].records.map(id => bank.find(record => record.id === id));
  return slots.length === 4 && slots.every(Boolean) && [0,1,2,3].every(c => slots.filter(record => record.fieldEvidence.chapter === c).length === 1);
};
const noteDone = book => meaningfulText(book.title) >= 2 && meaningfulText(book.summary) >= 8;
export function fieldBookReady(field) { return slotsDone(field) && noteDone(field.chapters[4]); }
const claimFits = (request,record) => !!record && !!TOWER_CLAIMS.find(claim => claim.request === request)?.accept.includes(record.fieldEvidence.type);
export function towerStep(field) {
  const book = field.chapters[4];
  return !slotsDone(field) ? 'tower-slots' : !matchesDone(field) ? 'tower-evidence' : !noteDone(book) ? 'tower-note' : !book.towerRun ? 'tower-run' : !planDone(book) ? 'plan' : 'ready';
}

const matchesDone = field => {const book=field.chapters[4],bank=fieldRecords(field);return TOWER_CLAIMS.every(({request}) => book.records.includes(book.matches[request]) && claimFits(request,bank.find(record => record.id === book.matches[request])));};
const planDone = book => meaningfulText(book.plan.subject) >= 2 && meaningfulText(book.plan.when) >= 2 && meaningfulText(book.plan.what) >= 4;

export function fieldReady(field, chapter=field.active) {
  if (!numberIn(chapter,0,4)) return false;
  const data = field.chapters[chapter];
  if (chapter === 0) return observed(data) && drawingDone(data) && filmDone(data) && data.generation === 'next-egg';
  if (chapter === 1) return data.rounds.every(seedDone);
  if (chapter === 2) return data.cases.every(careDone);
  if (chapter === 3) return animalDone(data) && plantsSeen(data) && classificationsDone(data) && transfersDone(data);
  return (field.preview===true || [0,1,2,3].every(i => field.completed.includes(i))) && towerStep(field) === 'ready';
}

// Phases are derived, so an old or damaged save cannot jump ahead using a phase number.
export function fieldPhase(field, chapter=field.active) {
  const data = field.chapters[chapter];
  if (!data) return 'observe';
  if (chapter === 0) return !observed(data) ? 'observe' : !drawingDone(data) ? 'draw' : !filmDone(data) ? 'film' : data.generation !== 'next-egg' ? 'generation' : 'ready';
  if (chapter === 1) {
    const round = data.rounds[data.round];
    return !round.run ? 'prepare' : !seedPhotosDone(round) ? 'time' : !seedDone(round) ? 'report' : data.round === 0 ? 'round-done' : 'ready';
  }
  if (chapter === 2) {
    const task = data.cases[data.case];
    return task.measured.length < 2 ? 'measure' : !task.symptom ? 'pin' : !task.photos.includes(0) ? 'before-photo' : !task.tool ? 'tool' : !careDone(task) ? 'recover' : data.case === 0 ? 'case-done' : 'ready';
  }
  if (chapter === 3) return !animalDone(data) ? 'animals' : data.tags.length < 2 ? 'tag' : !plantsSeen(data) ? 'seasons' : !classificationsDone(data) ? 'classify' : !transfersDone(data) ? 'transfer' : 'ready';
  return towerStep(field);
}

export function fieldRecords(field) {
  const evidenceChapters=field.chapters.map((chapter,index) => field.completed.includes(index) && field.snapshots?.[index] ? field.snapshots[index] : chapter);
  const records = [], [observation,seeds,care,comparison] = evidenceChapters;
  const names = {egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'};
  for (const form of FIELD_FORMS) {
    if (!observation.inspected[form].length) continue;
    records.push({id:`field-observation-${form}`,art:form,title:`${names[form]} 확대 관찰`,kind:'animal',detail:observation.note || '모습의 특징을 확대해 살펴봤어.',fieldEvidence:{chapter:0,type:'observation',form,spots:[...observation.inspected[form]],drawing:copy(observation.drawing),note:observation.note,drawingForm:observation.drawingForm}});
  }
  for (const round of seeds.rounds) {
    if (!seedDone(round)) continue;
    const name = round.variable === 'water' ? '물' : '온도';
    records.push({id:`field-seed-${round.variable}`,art:'pot3',title:`${name} 조건 비교 실험`,kind:'plant',detail:`A는 그대로 두고 B의 ${name} 조건 하나만 바꿨어. 0일·중간·마지막 모습을 비교했어. ${round.legacyReport?'이전 기록에는 예상-결과 비교 응답이 없어.':'마지막 사진: B에서만 싹이 났어. 처음 예상과 '+({same:'같았어.',changed:'달라서 생각을 바꿨어.',unsure:'비교해 새롭게 알았어.'}[round.report?.expectation]||'비교했어.')} `,fieldEvidence:{chapter:1,type:'retry',variable:round.variable,prediction:round.run.prediction,conditions:copy(round.run),photos:[...round.photos],reason:round.reason,report:copy(round.report),legacyReport:round.legacyReport}});
  }
  for (const task of care.cases) {
    if (!careDone(task)) continue;
    records.push({id:`field-care-${task.variable}`,art:task.variable==='light'?'pale':'pot3',title:task.variable === 'water' ? '시든 화분 돌봄 기록' : '빛이 부족한 화분 돌봄 기록',kind:'plant',detail:`물기와 빛을 재고 ${task.variable === 'water' ? '물' : '빛'} 조건을 돌본 뒤, 돌보기 전과 ${task.variable==='light'?'새잎이 자란 뒤':'이틀 뒤'}를 비교했어.`,fieldEvidence:{chapter:2,type:'care',variable:task.variable,measured:[...task.measured],symptom:task.symptom,observations:copy(task.observations||[]),tool:task.tool,photos:[...task.photos]}});
  }
  for (const animal of ['butterfly','dog']) {
    const last = animal === 'butterfly' ? 3 : 2, data = comparison.animals[animal];
    if (!data.photos.includes(0) || !data.photos.includes(last) || comparison.generation !== 'different') continue;
    records.push({id:`field-animal-${animal}`,art:animal === 'butterfly' ? 'adult' : 'dog',title:animal === 'butterfly' ? '나비의 한살이' : '개의 한살이',kind:'animal',detail:animal === 'butterfly' ? '나비의 숲에서 관찰한 모습을 다시 살펴봤어. 다음 세대는 새로 태어난 생명이야.' : '처음과 다 자란 모습을 살펴봤어. 다음 세대는 새로 태어난 생명이야.',fieldEvidence:{chapter:3,type:'comparison',animal,photos:[...data.photos],generation:'different'}});
  }
  for (const plant of ['apple','balsam']) {
    if (!comparison.tags.includes(plant) || ![0,3,4].every(step => comparison.plantPhotos.includes(`${plant}-${step}`)) || comparison.classifications[plant] !== (plant === 'apple' ? 'same' : 'new')) continue;
    records.push({id:`field-season-${plant}`,art:plant === 'apple' ? 'appleSpring' : 'balsam',title:plant === 'apple' ? '이름표를 단 사과나무' : '봉선화와 다음 세대',kind:'plant',detail:plant === 'apple' ? '겨울을 지난 같은 사과나무에서 새봄에 잎이 났어.' : '한해를 살고 남긴 씨앗에서 새로운 봉선화가 자랐어.',fieldEvidence:{chapter:3,type:'season',plant,photos:[0,3,4],classification:comparison.classifications[plant]}});
  }
  return records;
}

const actionChapter = type => type.startsWith('seed-') ? 1 : type.startsWith('care-') ? 2 : ['animal-time','animal-photo','animal-generation','plant-tag','season','season-photo','season-compare','plant-classify','transfer'].includes(type) ? 3 : type.startsWith('book-') || ['help-match','observation-plan','tower-run'].includes(type) ? 4 : ['inspect','observation-draw','observation-note','observation-reference','film-move','generation'].includes(type) ? 0 : -1;

export function fieldAction(field, type, payload={}) {
  const done = message => ({ok:true,message});
  const fail = message => {
    field.attempts.push({chapter:field.active,action:type,message});
    if (field.attempts.length > 60) field.attempts.shift();
    return {ok:false,message};
  };
  const p = payload && typeof payload === 'object' ? payload : {};
  if (type === 'discovery-enter') {
    const chapter=p.chapter??field.active;
    if(chapter!==field.active||!fieldReady(field,chapter))return fail('먼저 이 구역의 관찰 기록을 마쳐 줘.');
    field.discoveryVisit=chapter;
    return done('기존 기록과 보상은 그대로야. 새 발견 미션을 이어서 해 보자.');
  }
  if (type === 'discovery-exit') {
    delete field.discoveryVisit;
    return done('추가 발견은 나중에도 이어갈 수 있어.');
  }
  if (type === 'chapter-restart') {
    const chapter=p.chapter ?? p.c;
    if (!numberIn(chapter,0,4) || !field.completed.includes(chapter)) return fail('탐사를 마친 구역에서 다시 도전할 수 있어.');
    field.snapshots ||= {};
    if (!field.snapshots[chapter]) {
      if (!fieldReady(field,chapter)) return fail('완성한 탐사 기록을 확인한 뒤 다시 시작할 수 있어.');
      field.snapshots[chapter]=copy(field.chapters[chapter]);
    }
    field.chapters[chapter]=initialField().chapters[chapter];
    field.active=chapter;
    return done('완성한 기록과 보상은 간직했어. 이번에는 어떤 기록을 찾을지 다시 탐사해 보자.');
  }
  if (['chapter-enter','chapter-replay'].includes(type)) {
    const chapter = p.chapter ?? p.c;
    if (!fieldUnlocked(field,chapter)) return fail('앞 구역의 탐사 기록을 마무리하면 이 길이 열려.');
    field.active = chapter;
    if (chapter === 3 && field.completed.includes(0)) {
      const prior=field.snapshots?.[0] || field.chapters[0], animals=field.chapters[3].animals;
      if (observed(prior) && filmDone(prior)) animals.butterfly.photos=unique([...animals.butterfly.photos,0,3]);
      if (animals.dog.step===0) animals.dog.photos=unique([...animals.dog.photos,0]);
    }
    return done(field.completed.includes(chapter) ? '기록과 보상을 간직한 채 다시 살펴보자.' : '지훈이와 함께 탐사를 시작하자.');
  }
  if (type === 'chapter-complete') {
    const chapter = p.chapter ?? p.c ?? field.active;
    if (chapter !== field.active || !fieldUnlocked(field,chapter) || !fieldReady(field,chapter)) return fail('아직 남은 탐사 기록이 있어. 지훈이의 안내를 살펴봐.');
    if (!field.completed.includes(chapter)) field.completed.push(chapter);
    field.snapshots ||= {};
    if (!field.snapshots[chapter]) field.snapshots[chapter]=copy(field.chapters[chapter]);
    field.completed.sort((a,b) => a-b);
    return done('직접 모은 기록으로 탐사를 마쳤어. 새로운 길이 열렸어!');
  }
  if (actionChapter(type) !== field.active || !fieldUnlocked(field,field.active)) return fail('지금 탐사하는 구역에서 할 수 있는 활동을 골라 줘.');
  const data = field.chapters[field.active];
  if (type === 'inspect') {
    if (!FIELD_FORMS.includes(p.form) || !numberIn(p.spot,0,1)) return fail('확대경으로 생물의 특징을 찾아보자.');
    data.inspected[p.form] = unique([...data.inspected[p.form],p.spot]);
    return done(`${{egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'}[p.form]}의 특징을 발견했어.`);
  }
  if(type==='observation-reference'){if(!FIELD_FORMS.includes(p.form))return fail('살펴볼 생물의 모습을 골라 줘.');data.drawingForm=p.form;return done('그림의 참고 모습을 보관했어.');}
  if (type === 'observation-draw') {
    if (!observed(data)) return fail('네 모습의 특징을 하나씩 먼저 살펴보자.');
    const stroke = sanitizeStroke(p.stroke);
    if (stroke.length < 2 || !stroke.some(point => point[0] !== stroke[0][0] || point[1] !== stroke[0][1])) return fail('관찰한 모양을 선으로 그려 줘.');
    if (data.drawing.length >= 200) return fail('그림 기록이 가득 찼어. 관찰 글을 마무리해 보자.');
    data.drawing.push(stroke);
    return done('관찰 그림에 선을 남겼어.');
  }
  if (type === 'observation-note') {
    if (!observed(data)) return fail('네 모습을 먼저 관찰해 보자.');
    data.note = textValue(p.text,TEXT_LIMITS.observation);data.noteDraft=null;
    return done('눈으로 찾은 특징을 글로 남겼어.');
  }
  if (type === 'film-move') {
    if (!observed(data) || !drawingDone(data)) return fail('관찰한 특징을 먼저 기록해 보자.');
    if (!numberIn(p.from,0,3) || !numberIn(p.to,0,3)) return fail('필름 네 장을 끌어서 순서대로 놓아 줘.');
    const [form] = data.order.splice(p.from,1); data.order.splice(p.to,0,form);
    return done(filmDone(data) ? '알에서 어른벌레까지 이어졌어!' : '몸의 모습이 어떻게 달라지는지 비교해 보자.');
  }
  if (type === 'generation') {
    if (!filmDone(data) || !drawingDone(data) || !observed(data)) return fail('관찰 기록과 한살이 필름을 먼저 완성해 보자.');
    if (p.target !== 'next-egg') return fail('어른벌레가 다시 알로 변할까? 알에서 자라는 것은 다음 세대의 새 생명이야.');
    data.generation = p.target; return done('다음 세대의 새로운 알로 한살이가 이어졌어.');
  }
  if (type.startsWith('seed-')) return seedAction(data,type,p,done,fail);
  if (type.startsWith('care-')) return careAction(data,type,p,done,fail);
  if (field.active === 3) return comparisonAction(data,type,p,done,fail);
  if (field.active === 4) return bookAction(field,data,type,p,done,fail);
  return fail('이 활동을 찾지 못했어.');
}

function seedAction(data,type,p,done,fail) {
  const round = data.rounds[data.round];
  if (type === 'seed-next') {
    if (data.round !== 0 || !seedDone(round)) return fail('첫 실험의 사진 세 장과 바꾼 조건을 먼저 기록하자.');
    data.round = 1;
    if (!data.rounds[1].run && !validPrep(data.rounds[1])) data.rounds[1].prepared=copy(data.rounds[0].prepared);
    return done('같은 흙과 씨앗을 준비했어. 이번에는 물을 같게 두고 온도를 알아보자.');
  }
  if (['seed-prepare','seed-predict','seed-condition'].includes(type) && round.run) return fail('실험을 시작한 뒤에는 조건을 바꾸지 않아. 같은 조건에서 시간이 흐른 결과를 살펴보자.');
  if (type === 'seed-prepare') {
    if (!['a','b'].includes(p.side)) return fail('A와 B 화분을 각각 준비해 줘.');
    if (typeof p.soil === 'boolean') round.prepared[p.side].soil = p.soil;
    if (numberIn(p.seeds,0,3)) round.prepared[p.side].seeds = p.seeds;
    return done('두 화분은 같은 흙과 씨앗 세 개로 준비하자.');
  }
  if (type === 'seed-predict') {
    if (!FIELD_PREDICTIONS.includes(p.choice)) return fail('어느 쪽에서 싹이 날지 예상하거나 아직 모르겠다고 해도 좋아.');
    round.prediction = p.choice; return done('예상을 남겼어. 결과가 달라도 괜찮아. 기록으로 확인해 보자.');
  }
  if (type === 'seed-condition') {
    if (p.side && p.side !== 'b') return fail('A는 처음 조건을 그대로 두고 B에서 한 가지 조건만 바꿔 보자.');
    if (!['water','warm'].includes(p.key)) return fail('물과 온도 중 알아볼 조건을 골라 줘.');
    if(p.key!==round.variable) return fail(`이번에는 ${round.variable==='water'?'물':'온도'}만 바꿔 비교해. ${round.variable==='water'?'온도':'물의 양'}는 두 화분을 같게 두자.`);
    const next=typeof p.value==='boolean'?p.value:!round.b[p.key];
    round.b[p.key] = next; return done(`화분 B: ${p.key==='water'?(next?'물을 주었어. A는 물 없음, B는 물 있음이야.':'물을 주지 않는 조건이야. 두 화분이 같은 상태인지 확인해.'):(next?'B를 22°C로 따뜻하게 맞췄어. 콩은 20~25°C에서 싹이 잘 터. A는 5°C 그대로야.':'낮은 온도 조건으로 바꿨어. A와 다른 조건인지 확인해.')} 예상을 남기고 실험을 시작하자.`);
  }
  if (type === 'seed-run') {
    if (!validPrep(round)) return fail('A와 B 모두 같은 흙에 씨앗 세 개를 준비해 줘.');
    if (!round.prediction) return fail('실험하기 전에 예상부터 남겨 줘. 아직 모르겠다고 해도 괜찮아.');
    if (!validSeedChange(round)) return fail(`아직 두 화분의 조건이 같아. B 옆의 '${round.variable === 'water' ? 'B에 물 주기' : 'B를 22°C로 올리기'}'를 눌러 한 조건만 다르게 두자.`);
    if (round.run) return done('시작한 실험의 조건은 그대로 보관하고 있어.');
    round.run = {a:baseline(round.variable),b:copy(round.b),prepared:copy(round.prepared),prediction:round.prediction};
    round.day = 0; round.photos = unique([...round.photos,0]); return done('실험 시작! 0일 모습이 노트에 남았어. 시간 손잡이를 돌려 봐.');
  }
  if (!round.run) return fail('화분을 준비하고 실험을 시작해 줘.');
  if (type === 'seed-day') {
    if (!numberIn(p.day,0,7)) return fail('0일부터 7일 사이의 시간을 살펴보자.');
    round.day = p.day;
    const before = round.photos.length, mid = d => d >= 2 && d <= 4, end = d => d >= 6;
    if (p.day === 0 || mid(p.day) && !round.photos.some(mid) || end(p.day) && !round.photos.some(end)) round.photos.push(p.day);
    // Jumping straight to the end still leaves a middle page to compare.
    if (end(p.day) && !round.photos.some(mid)) round.photos.push(3);
    round.photos = unique(round.photos).sort((a,b) => a-b);
    return done(round.photos.length > before ? `${p.day}일 모습이 노트에 자동으로 남았어.` : `관찰 모형 ${p.day}일: A와 B에서 무엇이 달라졌는지 보자.`);
  }
  if (type === 'seed-photo') {round.photos = unique([...round.photos,round.day]).sort((a,b) => a-b); return done(`${round.day}일 사진을 기록했어.`);}
  if (type === 'seed-report') {
    if (!seedPhotosDone(round)) return fail('0일·중간(2~4일)·마지막(6~7일) 사진을 모아 비교해 보자.');
    if(p.reason!==undefined&&p.reason!==round.variable)return fail(`두 화분에서 다르게 둔 것은 ${round.variable==='water'?'물':'온도'} 조건이야. 같은 조건과 다른 조건을 다시 살펴봐.`);
    if(p.result!==undefined&&p.result!=='b')return fail('네가 남긴 날짜별 사진에서 A와 B의 싹을 비교해 봐. 마지막 사진에서는 B에서 싹이 자랐어.');
    if(p.expectation!==undefined&&p.expectation!==seedExpectation(round))return fail('처음 예상과 마지막 사진을 나란히 비교해 봐. 예상이 달랐어도 사진을 보고 생각을 고치면 돼.');
    if(p.reason!==undefined)round.reason=p.reason;
    round.report||={result:'',expectation:''};
    if(p.result!==undefined)round.report.result=p.result;
    if(p.expectation!==undefined)round.report.expectation=p.expectation;
    return done(seedDone(round)?'사진의 변화, 바꾼 조건, 처음 예상과의 비교를 기록했어.':'선택한 내용을 보관했어. 사진의 변화·바꾼 조건·예상 비교를 모두 살펴봐.');
  }
  return fail('실험에서 할 활동을 다시 골라 줘.');
}

function careAction(data,type,p,done,fail) {
  const task = data.cases[data.case], expectedSymptom = task.variable === 'water' ? 'dry' : 'pale';
  if (type === 'care-next') {
    if (data.case !== 0 || !careDone(task)) return fail('첫 화분의 돌보기 전과 뒤 모습을 먼저 비교해 보자.');
    data.case = 1; return done('다음 화분도 물기와 빛을 재고 돌보자.');
  }
  if (type === 'care-measure') {
    if (!['water','light'].includes(p.sensor)) return fail('물기와 빛을 재는 도구를 화분에 가져가 보자.');
    task.measured = unique([...task.measured,p.sensor]); return done(`${p.sensor === 'water' ? '흙의 물기' : '빛의 양'}를 측정했어.`);
  }
  if (type === 'care-pin') {
    if (task.measured.length < 2) return fail('물과 빛을 둘 다 재 본 다음, 눈에 보이는 변화를 찾아보자.');
    const observed=p.part&&p.feature?{part:p.part,feature:p.feature}:p.symptom==='dry'?{part:'soil',feature:'dry-soil'}:p.symptom==='pale'?{part:'leaf',feature:'pale-leaf'}:null;
    const valid=observed&&(task.variable==='water'?(observed.part==='soil'&&observed.feature==='dry-soil'||observed.part==='leaf'&&observed.feature==='drooping-leaf'):observed.part==='leaf'&&observed.feature==='pale-leaf');
    if(!valid)return fail(task.variable==='water'?'이 화분에서는 마른 흙과 처진 잎을 살펴볼 수 있어. 원인은 물기·빛을 잰 결과와 함께 판단해.':'이 화분은 흙의 물기가 충분하고 빛이 부족해. 잎빛이 옅어진 모습을 살펴봐.');
    task.observations||=[];if(!task.observations.some(o=>o.part===observed.part&&o.feature===observed.feature))task.observations.push(observed);
    task.symptom=expectedSymptom;
    return done('관찰한 부위와 특징을 기록했어. 잎이 처진 까닭은 모습만으로 정하지 않고 물기·빛 측정과 함께 판단해.');
  }
  if (type === 'care-photo') {
    if (task.measured.length < 2 || !task.symptom) return fail('물과 빛을 재고 증상을 표시한 뒤 사진을 남겨 줘.');
    if(task.day>0 && !task.tool) return fail('먼저 돌보기 전 사진을 남기고, 물·빛을 잰 결과에 맞는 돌봄을 해 줘.');
    task.photos = unique([...task.photos,task.day]).sort((a,b) => a-b); return done(`${careTimeLabels(task)[task.day]} 사진을 남겼어.`);
  }
  if (type === 'care-tool') {
    if (task.measured.length < 2 || !task.symptom || !task.photos.includes(0)) return fail('물·빛을 잰 결과와 식물 모습을 확인하고, 돌보기 전 사진을 남겨 줘.');
    if (p.tool !== task.variable) return fail(task.variable === 'water' ? '빛은 충분하지만 흙의 물기가 부족해. 이 결과를 도울 도구를 찾아보자.' : '흙의 물기는 충분하지만 빛이 부족해. 빛을 받을 방법을 찾아보자.');
    task.tool = p.tool; return done('기록에 맞는 돌봄을 했어. 시간이 흐른 뒤 다시 관찰하자.');
  }
  if (type === 'care-day') {
    if (!task.tool || !task.photos.includes(0)) return fail('돌보기 전 사진을 남기고 알맞은 돌봄을 먼저 해 줘.');
    if (!numberIn(p.day,0,2)) return fail('돌보기 전부터 나중 모습까지 차례로 살펴보자.');
    task.day = p.day; return done(`${careTimeLabels(task)[p.day]} 모습을 살펴보자. 실제 회복은 식물과 환경에 따라 달라.`);
  }
  return fail('화분을 돌보는 활동을 다시 골라 줘.');
}

function comparisonAction(data,type,p,done,fail) {
  if (type === 'animal-time') {
    const limit = p.animal === 'butterfly' ? 3 : p.animal === 'dog' ? 2 : -1;
    if (!numberIn(p.step,0,limit)) return fail('각 동물의 시간 손잡이를 따로 움직여 보자.');
    data.animals[p.animal].step = p.step;
    if ((p.animal==='dog' && [0,2].includes(p.step)) || (p.animal==='butterfly' && [0,3].includes(p.step))) data.animals[p.animal].photos=unique([...data.animals[p.animal].photos,p.step]);
    return done('두 동물은 자라는 모습과 걸리는 시간이 서로 달라. 살펴본 모습은 자동으로 기록했어.');
  }
  if (type === 'animal-photo') {
    if (!['butterfly','dog'].includes(p.animal)) return fail('관찰할 동물을 골라 줘.');
    const animal = data.animals[p.animal]; animal.photos = unique([...animal.photos,animal.step]); return done('이 동물의 모습을 기록했어.');
  }
  if (type === 'animal-generation') {
    if (![0,3].every(step => data.animals.butterfly.photos.includes(step)) || ![0,2].every(step => data.animals.dog.photos.includes(step))) return fail('각 동물의 처음과 다 자란 모습을 먼저 남겨 보자.');
    if (p.answer !== 'different') return fail('다 자란 동물이 처음 모습으로 돌아간 걸까? 다음 세대는 새로 태어난 생명이야.');
    data.generation = p.answer; return done('한살이가 이어져도 다음 세대는 새로 태어난 생명이라는 것을 찾았어.');
  }
  if (type === 'plant-tag') {
    if (!animalDone(data)) return fail('동물 두 종류의 한살이를 먼저 비교해 보자.');
    if (!['apple','balsam'].includes(p.plant) || data.season !== 0) return fail('첫봄의 사과나무와 봉선화에 이름표를 달아 줘.');
    data.tags = unique([...data.tags,p.plant]);
    data.plantPhotos=unique([...data.plantPhotos,`${p.plant}-0`]);
    return done('이름표와 첫봄 모습이 기록됐어.');
  }
  if (type === 'season') {
    if (data.tags.length < 2) return fail('첫봄의 두 식물에 이름표를 먼저 달아 줘.');
    if (!numberIn(p.step,0,4)) return fail('첫봄부터 다음 봄까지 시간을 살펴보자.');
    data.season = p.step;
    if ([0,3,4].includes(p.step)) for (const plant of ['apple','balsam']) data.plantPhotos=unique([...data.plantPhotos,`${plant}-${p.step}`]);
    // Seeing both winter and next spring opens the same-or-new choice on this screen; no separate compare step.
    if (!data.seasonCompared && plantsSeen(data)) {data.seasonCompared=true; return done('겨울과 다음 봄을 모두 봤어. 이름표 줄을 보고 같은 식물인지 골라 봐.');}
    return done('살펴본 계절의 두 식물을 자동으로 기록했어.');
  }
  if (type === 'season-compare') {
    if (!plantsSeen(data)) return fail('첫봄·겨울·다음 봄의 두 식물을 먼저 살펴보자.');
    data.seasonCompared=true; return done('이제 작년과 같은 식물인지 비교해 보자.');
  }
  if (type === 'season-photo') {
    if (!['apple','balsam'].includes(p.plant) || !data.tags.includes(p.plant)) return fail('이름표를 단 식물의 모습을 기록해 줘.');
    data.plantPhotos = unique([...data.plantPhotos,`${p.plant}-${data.season}`]); return done('이 계절의 식물 모습을 기록했어.');
  }
  if (type === 'plant-classify') {
    if (!plantsSeen(data)) return fail('첫봄·겨울·다음 봄의 두 식물을 모두 기록해서 비교해 보자.');
    if (!['apple','balsam'].includes(p.plant)) return fail('이름표를 단 두 식물을 비교해 보자.');
    const answer = p.plant === 'apple' ? 'same' : 'new';
    if (p.answer !== answer) return fail(p.plant === 'apple' ? '겨울에도 줄기와 이름표가 남아 있었어. 다음 봄 잎이 난 나무는 작년 그 나무일까?' : '지난 봉선화는 한해를 살았고, 남긴 씨앗에서 새 싹이 났어. 이름표와 씨앗을 비교해 보자.');
    data.classifications[p.plant] = p.answer; return done('작년 식물이 살아남은 것과 씨앗에서 새 식물이 자란 것을 구별했어.');
  }
  if (type === 'transfer') {
    if (!classificationsDone(data)) return fail('사과나무와 봉선화의 이름표 기록을 먼저 비교해 보자.');
    const card = SORT_CARDS.find(c => c.id === p.card);
    if (!card) return fail('분류할 생물 카드를 골라 줘.');
    if (p.bin !== card.bin) return fail(`'${card.name}' 카드는 다른 상자야. 단서: ${card.clue}`);
    data.transfers[card.id] = card.bin; return done(`맞아! ${card.why}`);
  }
  return fail('생명의 시간을 비교할 활동을 다시 골라 줘.');
}

function bookAction(field,data,type,p,done,fail) {
  const bank = fieldRecords(field);
  if (type === 'book-record') {
    const record = bank.find(item => item.id === p.id);
    if (!record) return fail('직접 탐사해서 만든 기록만 시계탑에 끼울 수 있어.');
    const chapter = record.fieldEvidence.chapter;
    if (p.slot !== undefined && p.slot !== chapter) return fail(`이 사진은 ${TOWER_REGIONS[chapter]}에서 모은 기록이야. 같은 지역 칸을 찾아봐.`);
    // One record per region: a new pick replaces that socket's old record.
    data.records = data.records.filter(id => bank.find(item => item.id === id)?.fieldEvidence.chapter !== chapter);
    data.records.push(p.id);
    data.records.sort((a,b) => bank.find(item => item.id === a).fieldEvidence.chapter - bank.find(item => item.id === b).fieldEvidence.chapter);
    for (const key of Object.keys(data.matches)) if (!data.records.includes(data.matches[key])) delete data.matches[key];
    return done(`${TOWER_REGIONS[chapter]} 칸에 기록을 끼웠어. 톱니가 맞물렸어!`);
  }
  if (type === 'book-move') {
    if (!numberIn(p.from,0,data.records.length-1) || !numberIn(p.to,0,data.records.length-1)) return fail('책에 넣은 기록을 끌어서 순서를 바꿔 줘.');
    const [id] = data.records.splice(p.from,1); data.records.splice(p.to,0,id); return done('읽는 순서에 맞게 기록을 놓았어.');
  }
  if (type === 'book-title') {data.title=textValue(p.text,TEXT_LIMITS.title);if(data.drafts?.story)delete data.drafts.story.title;return done('나만의 책 제목을 남겼어.');}
  if (type === 'book-summary') {data.summary=textValue(p.text,TEXT_LIMITS.summary);if(data.drafts?.story)delete data.drafts.story.summary;return done('관찰해서 알게 된 생각을 남겼어.');}
  if (type === 'book-caption') {
    if (!data.records.includes(p.id) || !bank.some(record => record.id === p.id)) return fail('책에 넣은 기록에 설명을 써 줘.');
    data.captions[p.id]=textValue(p.text,TEXT_LIMITS.caption);if(data.drafts?.captions)delete data.drafts.captions[p.id]; return done('기록 옆에 내 설명을 남겼어.');
  }
  if (type === 'help-match') {
    if (!slotsDone(field)) return fail('시계탑 네 칸에 기록을 먼저 끼워 줘.');
    const claim = TOWER_CLAIMS.find(item => item.request === p.request);
    if (!claim) return fail('증명할 주장 쪽지를 먼저 골라 줘.');
    const record = bank.find(item => item.id === p.recordId);
    if (!record || !data.records.includes(record.id)) return fail('시계탑에 끼운 내 사진 중에서 골라 줘.');
    if (!claimFits(p.request,record)) return fail(claim.clue);
    data.matches[p.request]=record.id;return done('주장과 증거를 실로 이었어!');
  }
  if (type === 'tower-run') {
    if (!slotsDone(field) || !matchesDone(field) || !noteDone(data)) return fail('기록 끼우기, 증거 잇기, 연구 노트를 먼저 마쳐 줘.');
    data.towerRun = true; return done('생명 시계탑이 다시 움직여! 네 기록이 차례로 빛났어.');
  }
  if (type === 'observation-plan') {
    if (!data.towerRun) return fail('시곗바늘을 돌려 시계탑을 먼저 깨워 줘.');
    const plan=Object.fromEntries(['subject','when','what'].map(key => [key,textValue(typeof p[key] === 'string' ? p[key] : data.plan[key],PLAN_LIMITS[key])]));
    if (meaningfulText(plan.subject) < 2 || meaningfulText(plan.when) < 2 || meaningfulText(plan.what) < 4) return fail('관찰할 생물과 언제 볼지 각각 두 글자 이상, 무엇을 기록할지 네 글자 이상으로 세 칸을 모두 써 줘.');
    data.plan=plan;if(data.drafts)data.drafts.plan={};
    return done('교실 밖에서도 이어 갈 나의 실제 관찰 계획을 세웠어.');
  }
  return fail('기록 책에서 할 활동을 다시 골라 줘.');
}

function sanitizeStroke(raw) {
  return array(raw).slice(0,300).filter(point => Array.isArray(point) && point.length === 2 && point.every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1)).map(point => [...point]);
}

const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const integerList = (value,min,max) => unique(array(value).filter(item => numberIn(item,min,max))).sort((a,b) => a-b);
const sanitizedPrep = value => ({soil:object(value).soil === true,seeds:numberIn(object(value).seeds,0,3) ? value.seeds : 0});
const sanitizedPrepared = value => ({a:sanitizedPrep(object(value).a),b:sanitizedPrep(object(value).b)});
const conditionEquals = (actual,expected) => object(actual).water === expected.water && object(actual).warm === expected.warm;

export function restoreField(raw) {
  let parsed=raw;
  if (typeof raw === 'string') {try {parsed=JSON.parse(raw);} catch {return initialField();}}
  if (!parsed || parsed.version !== 1) return initialField();
  const snapshots=object(parsed.snapshots);
  const archived=Object.keys(snapshots).some(key => numberIn(Number(key),0,4)) ? restoreField({...parsed,chapters:initialField().chapters.map((chapter,index) => object(snapshots[index]) === snapshots[index] ? snapshots[index] : array(parsed.chapters)[index]),snapshots:undefined}) : null;
  const field=initialField(), saved=array(parsed.chapters), [observation,seeds,care,comparison,book]=field.chapters;
  const c0=object(saved[0]);
  for (const form of FIELD_FORMS) observation.inspected[form]=integerList(object(c0.inspected)[form],0,1);
  observation.drawing=array(c0.drawing).slice(0,200).map(sanitizeStroke).filter(stroke => stroke.length >= 2);
  observation.note=textValue(c0.note,TEXT_LIMITS.observation);observation.drawingForm=FIELD_FORMS.includes(c0.drawingForm)?c0.drawingForm:'larva';observation.noteDraft=typeof c0.noteDraft==='string'?textValue(c0.noteDraft,TEXT_LIMITS.observation):null;
  if (Array.isArray(c0.order) && c0.order.length === 4 && unique(c0.order).length === 4 && c0.order.every(form => FIELD_FORMS.includes(form))) observation.order=[...c0.order];
  if (observed(observation) && drawingDone(observation) && filmDone(observation) && c0.generation === 'next-egg') observation.generation='next-egg';

  const c1=object(saved[1]);
  seeds.rounds.forEach((round,index) => {
    const source=object(array(c1.rounds)[index]);
    round.prepared=sanitizedPrepared(source.prepared);
    round.prediction=FIELD_PREDICTIONS.includes(source.prediction) ? source.prediction : '';
    for (const key of ['water','warm']) if (typeof object(source.b)[key] === 'boolean') round.b[key]=source.b[key];
    const run=object(source.run), runPrepared=sanitizedPrepared(run.prepared);
    const validRun=conditionEquals(run.a,baseline(round.variable)) && conditionEquals(run.b,{water:true,warm:true}) && validPrep({prepared:runPrepared}) && FIELD_PREDICTIONS.includes(run.prediction);
    if (!validRun) return;
    round.run={a:baseline(round.variable),b:{water:true,warm:true},prepared:runPrepared,prediction:run.prediction};
    round.prepared=copy(runPrepared);round.prediction=run.prediction;round.b={water:true,warm:true};
    round.day=numberIn(source.day,0,7) ? source.day : 0;
    round.photos=integerList(source.photos,0,7);
    if(seedPhotosDone(round)&&source.reason===round.variable)round.reason=source.reason;
    if(source.report&&typeof source.report==='object'){round.report={result:source.report.result==='b'?'b':'',expectation:source.report.expectation===seedExpectation(round)?source.report.expectation:''};}
    // Prior completed experiments had no comparison responses. Preserve them as
    // legacy evidence, without inventing a student's answer to the new choices.
    round.legacyReport=source.legacyReport===true||(!Object.hasOwn(source,'report')&&round.reason===round.variable);
  });
  seeds.round=c1.round === 1 && seedDone(seeds.rounds[0]) ? 1 : 0;

  const c2=object(saved[2]);
  care.cases.forEach((task,index) => {
    const source=object(array(c2.cases)[index]);
    task.measured=unique(array(source.measured).filter(sensor => ['water','light'].includes(sensor)));
    if (task.measured.length !== 2 || source.symptom !== (task.variable === 'water' ? 'dry' : 'pale')) return;
    task.symptom=source.symptom;
    const allowed=task.variable==='water'?['soil:dry-soil','leaf:drooping-leaf']:['leaf:pale-leaf'];task.observations=array(source.observations).filter(o=>allowed.includes(`${object(o).part}:${object(o).feature}`)).map(o=>({part:o.part,feature:o.feature,...(o.legacy===true?{legacy:true}:{})}));
    if(!task.observations.length)task.observations=[task.variable==='water'?{part:'soil',feature:'dry-soil',legacy:true}:{part:'leaf',feature:'pale-leaf',legacy:true}];
    const photos=integerList(source.photos,0,2);
    if (!photos.includes(0)) return;
    task.photos=[0];
    if (source.tool !== task.variable) return;
    task.tool=source.tool;task.photos=photos;task.day=numberIn(source.day,0,2) ? source.day : 0;
  });
  care.case=c2.case === 1 && careDone(care.cases[0]) ? 1 : 0;

  const c3=object(saved[3]);
  for (const animal of ['butterfly','dog']) {
    const source=object(object(c3.animals)[animal]), last=animal === 'butterfly' ? 3 : 2;
    comparison.animals[animal].step=numberIn(source.step,0,last) ? source.step : 0;
    comparison.animals[animal].photos=integerList(source.photos,0,last);
  }
  if ([0,3].every(step => comparison.animals.butterfly.photos.includes(step)) && [0,2].every(step => comparison.animals.dog.photos.includes(step)) && c3.generation === 'different') comparison.generation='different';
  if (animalDone(comparison)) comparison.tags=unique(array(c3.tags).filter(plant => ['apple','balsam'].includes(plant)));
  if (comparison.tags.length === 2) comparison.season=numberIn(c3.season,0,4) ? c3.season : 0;
  comparison.plantPhotos=unique(array(c3.plantPhotos).filter(photo => ['apple','balsam'].some(plant => comparison.tags.includes(plant) && [0,1,2,3,4].some(step => photo === `${plant}-${step}`))));
  // A tag can only be attached in the first spring, which was visibly observed.
  for (const plant of comparison.tags) comparison.plantPhotos=unique([...comparison.plantPhotos,`${plant}-0`]);
  if (plantsSeen(comparison)) {
    comparison.seasonCompared=c3.seasonCompared===true || object(c3.classifications).apple === 'same' || object(c3.classifications).balsam === 'new';
    if (object(c3.classifications).apple === 'same') comparison.classifications.apple='same';
    if (object(c3.classifications).balsam === 'new') comparison.classifications.balsam='new';
  }
  if (classificationsDone(comparison)) {
    const saved = object(c3.transfers);
    // Saves from the old two-question version count as a finished sort.
    const legacy = saved.rose === 'same' && saved.dog === 'live';
    for (const card of SORT_CARDS) if (legacy || saved[card.id] === card.bin) comparison.transfers[card.id] = card.bin;
  }

  if (archived) {
    field.completed=[...archived.completed];
    field.snapshots=copy(archived.snapshots);
  }
  const c4=object(saved[4]), bank=fieldRecords(field);
  // Old saves held 3~6 free picks; keep at most one per region.
  const savedIds=array(c4.records);
  for (const c of [0,1,2,3]) {const id=savedIds.find(x => bank.find(record => record.id === x)?.fieldEvidence.chapter === c);if(id)book.records.push(id);}
  book.title=textValue(c4.title,TEXT_LIMITS.title);book.summary=textValue(c4.summary,TEXT_LIMITS.summary);
  for (const id of book.records) if (typeof object(c4.captions)[id] === 'string') book.captions[id]=textValue(c4.captions[id],TEXT_LIMITS.caption);
  const drafts=object(c4.drafts);
  for(const record of bank)if(typeof object(drafts.captions)[record.id]==='string')book.drafts.captions[record.id]=textValue(drafts.captions[record.id],TEXT_LIMITS.caption);
  for(const key of ['title','summary'])if(typeof object(drafts.story)[key]==='string')book.drafts.story[key]=textValue(drafts.story[key],TEXT_LIMITS[key]);
  for(const key of ['subject','when','what'])if(typeof object(drafts.plan)[key]==='string')book.drafts.plan[key]=textValue(drafts.plan[key],PLAN_LIMITS[key]);
  // Finished books from the earlier version keep their completion: fill the empty sockets.
  const legacy=c4.towerRun===undefined&&['observation','retry','care'].every(request => bank.some(record => record.id === object(c4.matches)[request]));
  if (legacy) for (const c of [0,1,2,3]) if (!book.records.some(id => bank.find(record => record.id === id).fieldEvidence.chapter === c)) {const record=bank.find(item => item.fieldEvidence.chapter === c);if(record)book.records.push(record.id);}
  book.records.sort((a,b) => bank.find(record => record.id === a).fieldEvidence.chapter - bank.find(record => record.id === b).fieldEvidence.chapter);
  if (slotsDone(field)) {
    for (const {request} of TOWER_CLAIMS) {
      const id=legacy?bank.find(record => book.records.includes(record.id) && claimFits(request,record))?.id:object(c4.matches)[request];
      if (book.records.includes(id) && claimFits(request,bank.find(record => record.id === id))) book.matches[request]=id;
    }
  }
  book.towerRun=matchesDone(field)&&noteDone(book)&&(c4.towerRun===true||legacy);
  if (book.towerRun) for (const key of ['subject','when','what']) book.plan[key]=textValue(object(c4.plan)[key],PLAN_LIMITS[key]);

  // Completed flags alone are not evidence. Keep only a contiguous, supported path.
  const claimed=integerList(parsed.completed,0,4);
  field.completed=[];
  for (let chapter=0;chapter<5;chapter++) {
    if (!claimed.includes(chapter) || !fieldReady(field,chapter) && !archived?.completed.includes(chapter)) break;
    field.completed.push(chapter);
    if (!field.snapshots[chapter]) field.snapshots[chapter]=copy(field.chapters[chapter]);
  }
  // Extra discoveries never grant a core completion flag. Preserve only valid,
  // ordered mission evidence after the underlying chapter is actually ready.
  const discoveryRecords=fieldRecords(field);
  for(let chapter=0;chapter<5;chapter++){
    const data=field.chapters[chapter];
    data.discovery=fieldReady(field,chapter)?normalizeDiscovery(chapter,object(saved[chapter]).discovery,discoveryRecords):[];
    if(field.snapshots[chapter]&&!object(snapshots[chapter]).discovery)field.snapshots[chapter].discovery=copy(data.discovery);
  }
  field.active=numberIn(parsed.active,0,4) && fieldUnlocked(field,parsed.active) ? parsed.active : Math.min(field.completed.length,4);
  if(numberIn(parsed.discoveryVisit,0,4)&&fieldReady(field,parsed.discoveryVisit))field.discoveryVisit=parsed.discoveryVisit;
  field.attempts=array(parsed.attempts).slice(-60).map(item => {
    const attempt=object(item);
    return {chapter:numberIn(attempt.chapter,0,4) ? attempt.chapter : 0,action:textValue(attempt.action,80),message:textValue(attempt.message,240)};
  }).filter(item => item.action && item.message);
  // In particular, teacher preview is never restored into a student's notebook.
  return field;
}
