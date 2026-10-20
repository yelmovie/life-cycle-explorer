// The field notebook is independent of the earlier inquiry and expedition saves.
// It contains observations made by the learner, never inferred chapter rewards.
export const FIELD_FORMS = ['egg', 'larva', 'pupa', 'adult'];
export const FIELD_PREDICTIONS = ['a', 'b', 'both', 'neither', 'unsure'];
const copy = value => JSON.parse(JSON.stringify(value));
const prep = () => ({soil:false, seeds:0});
const baseline = variable => ({water:variable !== 'water', warm:variable !== 'warm'});
const seedRound = variable => ({variable, prepared:{a:prep(), b:prep()}, prediction:'', b:baseline(variable), run:null, day:0, photos:[], reason:''});
const careCase = variable => ({variable, measured:[], symptom:'', tool:'', day:0, photos:[]});

export function initialField() {
  return {
    version:1, active:0, completed:[], attempts:[], snapshots:{},
    chapters:[
      {inspected:Object.fromEntries(FIELD_FORMS.map(id => [id, []])), drawing:[], note:'', order:['pupa','egg','adult','larva'], generation:''},
      {round:0, rounds:[seedRound('water'), seedRound('warm')]},
      {case:0, cases:[careCase('water'), careCase('light')]},
      {animals:{butterfly:{step:0, photos:[]}, dog:{step:0, photos:[]}}, generation:'', tags:[], season:0, plantPhotos:[], classifications:{}, transfers:{}},
      {records:[], title:'', captions:{}, summary:'', matches:{}, plan:{subject:'', when:'', what:''}},
    ],
  };
}

const textValue = (value, limit=300) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const numberIn = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const array = value => Array.isArray(value) ? value : [];
const unique = values => [...new Set(values)];
const validPrep = round => ['a','b'].every(side => round.prepared[side].soil === true && round.prepared[side].seeds === 3);
const validSeedChange = round => round.b.water === true && round.b.warm === true;
const seedPhotosDone = round => round.photos.includes(0) && round.photos.some(day => day >= 2 && day <= 4) && round.photos.some(day => day >= 6);
const seedDone = round => !!round.run && seedPhotosDone(round) && round.reason === round.variable;
const careDone = task => task.measured.includes('water') && task.measured.includes('light') && task.symptom === (task.variable === 'water' ? 'dry' : 'pale') && task.tool === task.variable && task.photos.includes(0) && task.photos.includes(2);
const observed = chapter => FIELD_FORMS.every(form => chapter.inspected[form].includes(0) && chapter.inspected[form].includes(1));
const drawingDone = chapter => chapter.note.length >= 4 && chapter.drawing.reduce((count, stroke) => count + stroke.slice(1).filter((point, i) => point[0] !== stroke[i][0] || point[1] !== stroke[i][1]).length, 0) >= 2;
const filmDone = chapter => FIELD_FORMS.every((form,i) => chapter.order[i] === form);
const animalDone = chapter => chapter.animals.butterfly.photos.includes(0) && chapter.animals.butterfly.photos.includes(3) && chapter.animals.dog.photos.includes(0) && chapter.animals.dog.photos.includes(2) && chapter.generation === 'different';
const plantsSeen = chapter => ['apple','balsam'].every(plant => chapter.tags.includes(plant) && [0,3,4].every(step => chapter.plantPhotos.includes(`${plant}-${step}`)));
const classificationsDone = chapter => chapter.classifications.apple === 'same' && chapter.classifications.balsam === 'new';
const transfersDone = chapter => chapter.transfers.rose === 'same' && chapter.transfers.dog === 'live';

export function fieldUnlocked(field, chapter) {
  return numberIn(chapter,0,4) && (field.preview === true || chapter === 0 || Array.from({length:chapter},(_,i) => i).every(i => field.completed.includes(i)));
}

export function fieldCompletedCount(field) { return unique(field.completed).filter(i => numberIn(i,0,4)).length; }

export function fieldBookReady(field) {
  const book = field.chapters[4], bank = fieldRecords(field);
  const selected = book.records.map(id => bank.find(record => record.id === id));
  return selected.length >= 3 && selected.length <= 6 && unique(book.records).length === selected.length && selected.every(Boolean)
    && selected.some(record => record.kind === 'animal') && selected.some(record => record.kind === 'plant')
    && book.title.length >= 2 && book.summary.length >= 8
    && selected.filter(record => (book.captions[record.id] || '').length >= 4).length >= 2;
}

const matchesDone = field => ['observation','retry','care'].every(request => fieldRecords(field).some(record => record.id === field.chapters[4].matches[request] && record.fieldEvidence.type === request));
const planDone = book => book.plan.subject.length >= 2 && book.plan.when.length >= 2 && book.plan.what.length >= 4;

export function fieldReady(field, chapter=field.active) {
  if (!numberIn(chapter,0,4)) return false;
  const data = field.chapters[chapter];
  if (chapter === 0) return observed(data) && drawingDone(data) && filmDone(data) && data.generation === 'next-egg';
  if (chapter === 1) return data.rounds.every(seedDone);
  if (chapter === 2) return data.cases.every(careDone);
  if (chapter === 3) return animalDone(data) && plantsSeen(data) && classificationsDone(data) && transfersDone(data);
  return [0,1,2,3].every(i => field.completed.includes(i)) && fieldBookReady(field) && matchesDone(field) && planDone(data);
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
  return !fieldBookReady(field) ? 'book' : !matchesDone(field) ? 'help' : !planDone(data) ? 'plan' : 'ready';
}

export function fieldRecords(field) {
  const evidenceChapters=field.chapters.map((chapter,index) => field.completed.includes(index) && field.snapshots?.[index] ? field.snapshots[index] : chapter);
  const records = [], [observation,seeds,care,comparison] = evidenceChapters;
  const names = {egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'};
  for (const form of FIELD_FORMS) {
    if (observation.inspected[form].length !== 2) continue;
    records.push({id:`field-observation-${form}`,art:form,title:`${names[form]} 확대 관찰`,kind:'animal',detail:observation.note || '서로 다른 두 부분을 확대해 살펴봤어.',fieldEvidence:{chapter:0,type:'observation',form,spots:[...observation.inspected[form]],drawing:copy(observation.drawing),note:observation.note}});
  }
  for (const round of seeds.rounds) {
    if (!seedDone(round)) continue;
    const name = round.variable === 'water' ? '물' : '온도';
    records.push({id:`field-seed-${round.variable}`,art:'pot3',title:`${name} 조건 비교 실험`,kind:'plant',detail:`A는 그대로 두고 B의 ${name} 조건 하나만 바꿨어. 0일·중간·마지막 모습을 비교했어.`,fieldEvidence:{chapter:1,type:'retry',variable:round.variable,prediction:round.run.prediction,conditions:copy(round.run),photos:[...round.photos],reason:round.reason}});
  }
  for (const task of care.cases) {
    if (!careDone(task)) continue;
    records.push({id:`field-care-${task.variable}`,art:'pot3',title:task.variable === 'water' ? '시든 화분 돌봄 기록' : '빛이 부족한 화분 돌봄 기록',kind:'plant',detail:`두 센서를 재고 ${task.variable === 'water' ? '물' : '빛'} 조건을 돌본 뒤, 돌보기 전과 이틀 뒤를 비교했어.`,fieldEvidence:{chapter:2,type:'care',variable:task.variable,measured:[...task.measured],symptom:task.symptom,tool:task.tool,photos:[...task.photos]}});
  }
  for (const animal of ['butterfly','dog']) {
    const last = animal === 'butterfly' ? 3 : 2, data = comparison.animals[animal];
    if (!data.photos.includes(0) || !data.photos.includes(last) || comparison.generation !== 'different') continue;
    records.push({id:`field-animal-${animal}`,art:animal === 'butterfly' ? 'adult' : 'dog',title:animal === 'butterfly' ? '나비의 한살이' : '개의 한살이',kind:'animal',detail:'처음과 다 자란 모습을 각각 기록했어. 다음 세대는 새로운 개체야.',fieldEvidence:{chapter:3,type:'comparison',animal,photos:[...data.photos],generation:'different'}});
  }
  for (const plant of ['apple','balsam']) {
    if (!comparison.tags.includes(plant) || ![0,3,4].every(step => comparison.plantPhotos.includes(`${plant}-${step}`)) || comparison.classifications[plant] !== (plant === 'apple' ? 'same' : 'new')) continue;
    records.push({id:`field-season-${plant}`,art:plant === 'apple' ? 'appleSpring' : 'balsam',title:plant === 'apple' ? '이름표를 단 사과나무' : '봉선화와 다음 세대',kind:'plant',detail:plant === 'apple' ? '겨울을 지난 같은 사과나무에서 새봄에 잎이 났어.' : '한해를 살고 남긴 씨앗에서 새로운 봉선화가 자랐어.',fieldEvidence:{chapter:3,type:'season',plant,photos:[0,3,4],classification:comparison.classifications[plant]}});
  }
  return records;
}

const actionChapter = type => type.startsWith('seed-') ? 1 : type.startsWith('care-') ? 2 : ['animal-time','animal-photo','animal-generation','plant-tag','season','season-photo','plant-classify','transfer'].includes(type) ? 3 : type.startsWith('book-') || ['help-match','observation-plan'].includes(type) ? 4 : ['inspect','observation-draw','observation-note','film-move','generation'].includes(type) ? 0 : -1;

export function fieldAction(field, type, payload={}) {
  const done = message => ({ok:true,message});
  const fail = message => {
    field.attempts.push({chapter:field.active,action:type,message});
    if (field.attempts.length > 60) field.attempts.shift();
    return {ok:false,message};
  };
  const p = payload && typeof payload === 'object' ? payload : {};
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
    return done('완성한 기록과 보상은 간직했어. 이번에는 어떤 증거를 찾을지 다시 탐사해 보자.');
  }
  if (['chapter-enter','chapter-replay'].includes(type)) {
    const chapter = p.chapter ?? p.c;
    if (!fieldUnlocked(field,chapter)) return fail('앞 구역의 탐사 기록을 마무리하면 이 길이 열려.');
    field.active = chapter;
    return done(field.completed.includes(chapter) ? '기록과 보상을 간직한 채 다시 살펴보자.' : '지훈이와 함께 탐사를 시작하자.');
  }
  if (type === 'chapter-complete') {
    const chapter = p.chapter ?? p.c ?? field.active;
    if (chapter !== field.active || !fieldUnlocked(field,chapter) || !fieldReady(field,chapter)) return fail('아직 남은 탐사 기록이 있어. 지훈이의 안내를 살펴봐.');
    if (!field.completed.includes(chapter)) field.completed.push(chapter);
    field.snapshots ||= {};
    if (!field.snapshots[chapter]) field.snapshots[chapter]=copy(field.chapters[chapter]);
    field.completed.sort((a,b) => a-b);
    return done('직접 모은 증거로 탐사를 마쳤어. 새로운 길이 열렸어!');
  }
  if (actionChapter(type) !== field.active || !fieldUnlocked(field,field.active)) return fail('지금 탐사하는 구역에서 할 수 있는 활동을 골라 줘.');
  const data = field.chapters[field.active];
  if (type === 'inspect') {
    if (!FIELD_FORMS.includes(p.form) || !numberIn(p.spot,0,1)) return fail('확대경으로 생물의 서로 다른 두 부분을 찾아보자.');
    data.inspected[p.form] = unique([...data.inspected[p.form],p.spot]);
    return done(`${{egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'}[p.form]}의 특징을 발견했어.`);
  }
  if (type === 'observation-draw') {
    if (!observed(data)) return fail('네 모습에서 서로 다른 두 부분을 먼저 살펴보자.');
    const stroke = sanitizeStroke(p.stroke);
    if (stroke.length < 2 || !stroke.some(point => point[0] !== stroke[0][0] || point[1] !== stroke[0][1])) return fail('관찰한 모양을 선으로 그려 줘.');
    if (data.drawing.length >= 200) return fail('그림 기록이 가득 찼어. 관찰 글을 마무리해 보자.');
    data.drawing.push(stroke);
    return done('관찰 그림에 선을 남겼어.');
  }
  if (type === 'observation-note') {
    if (!observed(data)) return fail('네 모습을 먼저 관찰해 보자.');
    data.note = textValue(p.text,180);
    return done('눈으로 찾은 특징을 글로 남겼어.');
  }
  if (type === 'film-move') {
    if (!observed(data) || !drawingDone(data)) return fail('관찰 그림과 특징을 먼저 기록해 보자.');
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
    data.round = 1; return done('이번에는 물을 같게 두고 온도를 알아보자.');
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
    round.prediction = p.choice; return done('예상을 남겼어. 결과가 달라도 괜찮아. 증거로 확인해 보자.');
  }
  if (type === 'seed-condition') {
    if (p.side && p.side !== 'b') return fail('A는 처음 조건을 그대로 두고 B에서 한 가지 조건만 바꿔 보자.');
    if (!['water','warm'].includes(p.key)) return fail('물과 온도 중 알아볼 조건을 골라 줘.');
    round.b[p.key] = !round.b[p.key]; return done('비교할 조건 하나만 다르게 두었는지 확인해 보자.');
  }
  if (type === 'seed-run') {
    if (!validPrep(round)) return fail('A와 B 모두 같은 흙에 씨앗 세 개를 준비해 줘.');
    if (!round.prediction) return fail('실험하기 전에 예상부터 남겨 줘. 아직 모르겠다고 해도 괜찮아.');
    if (!validSeedChange(round)) return fail(`A는 그대로 두고 B의 ${round.variable === 'water' ? '물' : '온도'} 조건 하나만 바꿔 줘. 다른 조건은 같아야 비교할 수 있어.`);
    if (round.run) return done('시작한 실험의 조건은 그대로 보관하고 있어.');
    round.run = {a:baseline(round.variable),b:copy(round.b),prepared:copy(round.prepared),prediction:round.prediction};
    round.day = 0; return done('조건을 고정했어. 먼저 0일 모습을 사진으로 남기자.');
  }
  if (!round.run) return fail('화분을 준비하고 실험을 시작해 줘.');
  if (type === 'seed-day') {
    if (!numberIn(p.day,0,7)) return fail('0일부터 7일 사이의 시간을 살펴보자.');
    round.day = p.day; return done(`${p.day}일의 모습을 관찰해 보자.`);
  }
  if (type === 'seed-photo') {round.photos = unique([...round.photos,round.day]).sort((a,b) => a-b); return done(`${round.day}일 사진을 기록했어.`);}
  if (type === 'seed-report') {
    if (!seedPhotosDone(round)) return fail('0일·중간(2~4일)·마지막(6~7일) 사진을 모아 비교해 보자.');
    if (p.reason !== round.variable) return fail(`두 화분의 조건표를 다시 비교해 봐. 이번 실험에서 A와 B가 달랐던 것은 ${round.variable === 'water' ? '물' : '온도'} 조건이야.`);
    round.reason = p.reason; return done('예상과 결과를 비교하고, 실제로 달랐던 조건을 찾았어.');
  }
  return fail('실험에서 할 활동을 다시 골라 줘.');
}

function careAction(data,type,p,done,fail) {
  const task = data.cases[data.case], expectedSymptom = task.variable === 'water' ? 'dry' : 'pale';
  if (type === 'care-next') {
    if (data.case !== 0 || !careDone(task)) return fail('첫 화분의 돌보기 전과 이틀 뒤 모습을 먼저 비교해 보자.');
    data.case = 1; return done('다음 화분도 센서로 확인하고 돌보자.');
  }
  if (type === 'care-measure') {
    if (!['water','light'].includes(p.sensor)) return fail('물 센서와 빛 센서를 화분에 가져가 보자.');
    task.measured = unique([...task.measured,p.sensor]); return done(`${p.sensor === 'water' ? '흙의 물기' : '빛의 양'}를 측정했어.`);
  }
  if (type === 'care-pin') {
    if (task.measured.length < 2) return fail('물과 빛을 둘 다 재 본 다음, 눈에 보이는 증거를 찾아보자.');
    if (p.symptom !== expectedSymptom) return fail(task.variable === 'water' ? '흙이 마르고 잎이 처진 부분을 살펴봐. 측정 결과와 함께 생각해 보자.' : '빛의 양과 잎의 옅은 색을 함께 살펴봐.');
    task.symptom = p.symptom; return done('측정 결과와 눈으로 본 증거가 연결됐어.');
  }
  if (type === 'care-photo') {
    if (task.measured.length < 2 || !task.symptom) return fail('물과 빛을 재고 증상을 표시한 뒤 사진을 남겨 줘.');
    task.photos = unique([...task.photos,task.day]).sort((a,b) => a-b); return done(task.day === 0 ? '돌보기 전 사진을 남겼어.' : `${task.day}일 뒤 사진을 남겼어.`);
  }
  if (type === 'care-tool') {
    if (task.measured.length < 2 || !task.symptom || !task.photos.includes(0)) return fail('두 센서의 수치와 증상을 확인하고, 돌보기 전 사진을 남겨 줘.');
    if (p.tool !== task.variable) return fail(task.variable === 'water' ? '빛은 충분하지만 흙의 물기가 부족해. 이 결과를 도울 도구를 찾아보자.' : '흙의 물기는 충분하지만 빛이 부족해. 빛을 받을 방법을 찾아보자.');
    task.tool = p.tool; return done('증거에 맞는 돌봄을 했어. 시간이 흐른 뒤 다시 관찰하자.');
  }
  if (type === 'care-day') {
    if (!task.tool || !task.photos.includes(0)) return fail('돌보기 전 사진을 남기고 알맞은 돌봄을 먼저 해 줘.');
    if (!numberIn(p.day,0,2)) return fail('돌본 날부터 이틀 뒤까지 살펴보자.');
    task.day = p.day; return done(`${p.day}일 뒤의 모습을 살펴보자.`);
  }
  return fail('화분을 돌보는 활동을 다시 골라 줘.');
}

function comparisonAction(data,type,p,done,fail) {
  if (type === 'animal-time') {
    const limit = p.animal === 'butterfly' ? 3 : p.animal === 'dog' ? 2 : -1;
    if (!numberIn(p.step,0,limit)) return fail('각 동물의 시간 손잡이를 따로 움직여 보자.');
    data.animals[p.animal].step = p.step; return done('두 동물은 자라는 모습과 걸리는 시간이 서로 달라.');
  }
  if (type === 'animal-photo') {
    if (!['butterfly','dog'].includes(p.animal)) return fail('관찰할 동물을 골라 줘.');
    const animal = data.animals[p.animal]; animal.photos = unique([...animal.photos,animal.step]); return done('이 동물의 모습을 기록했어.');
  }
  if (type === 'animal-generation') {
    if (![0,3].every(step => data.animals.butterfly.photos.includes(step)) || ![0,2].every(step => data.animals.dog.photos.includes(step))) return fail('각 동물의 처음과 다 자란 모습을 먼저 남겨 보자.');
    if (p.answer !== 'different') return fail('다 자란 동물이 처음 모습으로 돌아간 걸까? 다음 세대는 새로 태어난 개체야.');
    data.generation = p.answer; return done('한살이가 이어져도 다음 세대는 다른 개체라는 것을 찾았어.');
  }
  if (type === 'plant-tag') {
    if (!animalDone(data)) return fail('동물 두 종류의 한살이를 먼저 비교해 보자.');
    if (!['apple','balsam'].includes(p.plant) || data.season !== 0) return fail('첫봄의 사과나무와 봉선화에 이름표를 달아 줘.');
    data.tags = unique([...data.tags,p.plant]); return done('같은 개체인지 다시 찾을 수 있도록 이름표를 달았어.');
  }
  if (type === 'season') {
    if (data.tags.length < 2) return fail('첫봄의 두 식물에 이름표를 먼저 달아 줘.');
    if (!numberIn(p.step,0,4)) return fail('첫봄부터 다음 봄까지 시간을 살펴보자.');
    data.season = p.step; return done('이름표가 달린 식물과 새로 자란 식물을 자세히 살펴보자.');
  }
  if (type === 'season-photo') {
    if (!['apple','balsam'].includes(p.plant) || !data.tags.includes(p.plant)) return fail('이름표를 단 식물의 모습을 기록해 줘.');
    data.plantPhotos = unique([...data.plantPhotos,`${p.plant}-${data.season}`]); return done('이 계절의 식물 모습을 기록했어.');
  }
  if (type === 'plant-classify') {
    if (!plantsSeen(data)) return fail('첫봄·겨울·다음 봄의 두 식물을 모두 기록해서 비교해 보자.');
    if (!['apple','balsam'].includes(p.plant)) return fail('이름표를 단 두 식물을 비교해 보자.');
    const answer = p.plant === 'apple' ? 'same' : 'new';
    if (p.answer !== answer) return fail(p.plant === 'apple' ? '겨울에도 줄기와 이름표가 남아 있었어. 다음 봄 잎이 난 개체는 누구일까?' : '지난 봉선화는 한해를 살았고, 남긴 씨앗에서 새 싹이 났어. 이름표와 씨앗을 비교해 보자.');
    data.classifications[p.plant] = p.answer; return done('같은 개체가 살아남은 것과 다음 세대가 자란 것을 구별했어.');
  }
  if (type === 'transfer') {
    if (!classificationsDone(data)) return fail('사과나무와 봉선화의 이름표 기록을 먼저 비교해 보자.');
    if (!['rose','dog'].includes(p.subject)) return fail('새로운 생물의 증거를 가져가 보자.');
    const answer = p.subject === 'rose' ? 'same' : 'live';
    if (p.answer !== answer) return fail(p.subject === 'rose' ? '장미도 여러 해 같은 줄기와 뿌리에서 자라. 사과나무의 기록을 연결해 보자.' : '개는 새끼를 낳아. 나비가 알을 낳는 모습과 비교해 보자.');
    data.transfers[p.subject] = p.answer; return done('관찰에서 찾은 생각을 다른 생물에도 적용했어.');
  }
  return fail('생명의 시간을 비교할 활동을 다시 골라 줘.');
}

function bookAction(field,data,type,p,done,fail) {
  const bank = fieldRecords(field);
  if (type === 'book-record') {
    if (!bank.some(record => record.id === p.id)) return fail('직접 탐사해서 만든 기록만 책에 넣을 수 있어.');
    const index = data.records.indexOf(p.id);
    if (index >= 0) data.records.splice(index,1);
    else if (data.records.length < 6) data.records.push(p.id);
    else return fail('책에는 최대 여섯 장을 넣을 수 있어. 다른 기록을 먼저 꺼내 줘.');
    return done('내가 모은 탐사 기록으로 책을 만들고 있어.');
  }
  if (type === 'book-move') {
    if (!numberIn(p.from,0,data.records.length-1) || !numberIn(p.to,0,data.records.length-1)) return fail('책에 넣은 기록을 끌어서 순서를 바꿔 줘.');
    const [id] = data.records.splice(p.from,1); data.records.splice(p.to,0,id); return done('읽는 순서에 맞게 기록을 놓았어.');
  }
  if (type === 'book-title') {data.title=textValue(p.text,60);return done('나만의 책 제목을 남겼어.');}
  if (type === 'book-summary') {data.summary=textValue(p.text,300);return done('관찰해서 알게 된 생각을 남겼어.');}
  if (type === 'book-caption') {
    if (!data.records.includes(p.id) || !bank.some(record => record.id === p.id)) return fail('책에 넣은 기록에 설명을 써 줘.');
    data.captions[p.id]=textValue(p.text,180); return done('증거 옆에 내 설명을 남겼어.');
  }
  if (type === 'help-match') {
    if (!fieldBookReady(field)) return fail('동물·식물 기록과 설명을 담은 책을 먼저 마무리해 보자.');
    if (!['observation','retry','care'].includes(p.request)) return fail('도움을 요청한 친구의 이야기를 살펴봐.');
    const record = bank.find(item => item.id === p.recordId);
    if (!record || record.fieldEvidence.type !== p.request) return fail({observation:'생김새를 자세히 관찰한 기록이 이 친구에게 도움이 될 거야.',retry:'한 가지 조건만 다르게 비교한 씨앗 실험 기록을 찾아보자.',care:'센서로 확인하고 돌본 뒤 변화를 살펴본 기록을 찾아보자.'}[p.request]);
    data.matches[p.request]=record.id;return done('내 탐사 증거로 친구가 해결할 방법을 찾았어.');
  }
  if (type === 'observation-plan') {
    if (!matchesDone(field)) return fail('세 친구에게 도움이 되는 탐사 기록을 먼저 연결해 보자.');
    const plan=Object.fromEntries(['subject','when','what'].map(key => [key,textValue(typeof p[key] === 'string' ? p[key] : data.plan[key],180)]));
    if (plan.subject.length < 2 || plan.when.length < 2 || plan.what.length < 4) return fail('관찰할 생물과 언제 볼지 각각 두 글자 이상, 무엇을 기록할지 네 글자 이상으로 세 칸을 모두 써 줘.');
    data.plan=plan;
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
  observation.note=textValue(c0.note,180);
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
    if (seedPhotosDone(round) && source.reason === round.variable) round.reason=source.reason;
  });
  seeds.round=c1.round === 1 && seedDone(seeds.rounds[0]) ? 1 : 0;

  const c2=object(saved[2]);
  care.cases.forEach((task,index) => {
    const source=object(array(c2.cases)[index]);
    task.measured=unique(array(source.measured).filter(sensor => ['water','light'].includes(sensor)));
    if (task.measured.length !== 2 || source.symptom !== (task.variable === 'water' ? 'dry' : 'pale')) return;
    task.symptom=source.symptom;
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
  if (comparison.tags.length === 2) {
    comparison.season=numberIn(c3.season,0,4) ? c3.season : 0;
    comparison.plantPhotos=unique(array(c3.plantPhotos).filter(photo => ['apple','balsam'].some(plant => comparison.tags.includes(plant) && [0,1,2,3,4].some(step => photo === `${plant}-${step}`))));
  }
  if (plantsSeen(comparison)) {
    if (object(c3.classifications).apple === 'same') comparison.classifications.apple='same';
    if (object(c3.classifications).balsam === 'new') comparison.classifications.balsam='new';
  }
  if (classificationsDone(comparison)) {
    if (object(c3.transfers).rose === 'same') comparison.transfers.rose='same';
    if (object(c3.transfers).dog === 'live') comparison.transfers.dog='live';
  }

  if (archived) {
    field.completed=[...archived.completed];
    field.snapshots=copy(archived.snapshots);
  }
  const c4=object(saved[4]), bank=fieldRecords(field);
  book.records=unique(array(c4.records).filter(id => bank.some(record => record.id === id))).slice(0,6);
  book.title=textValue(c4.title,60);book.summary=textValue(c4.summary,300);
  for (const id of book.records) if (typeof object(c4.captions)[id] === 'string') book.captions[id]=textValue(c4.captions[id],180);
  if (fieldBookReady(field)) {
    for (const request of ['observation','retry','care']) {
      const id=object(c4.matches)[request];
      if (bank.some(record => record.id === id && record.fieldEvidence.type === request)) book.matches[request]=id;
    }
  }
  if (matchesDone(field)) for (const key of ['subject','when','what']) book.plan[key]=textValue(object(c4.plan)[key],180);

  // Completed flags alone are not evidence. Keep only a contiguous, supported path.
  const claimed=integerList(parsed.completed,0,4);
  field.completed=[];
  for (let chapter=0;chapter<5;chapter++) {
    if (!claimed.includes(chapter) || !fieldReady(field,chapter) && !archived?.completed.includes(chapter)) break;
    field.completed.push(chapter);
    if (!field.snapshots[chapter]) field.snapshots[chapter]=copy(field.chapters[chapter]);
  }
  field.active=numberIn(parsed.active,0,4) && fieldUnlocked(field,parsed.active) ? parsed.active : Math.min(field.completed.length,4);
  field.attempts=array(parsed.attempts).slice(-60).map(item => {
    const attempt=object(item);
    return {chapter:numberIn(attempt.chapter,0,4) ? attempt.chapter : 0,action:textValue(attempt.action,80),message:textValue(attempt.message,240)};
  }).filter(item => item.action && item.message);
  // In particular, teacher preview is never restored into a student's notebook.
  return field;
}
