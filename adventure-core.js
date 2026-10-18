export const STORAGE_KEY = 'life-clock-lab.adventure.2';
export const CHAPTERS = ['나비 관찰숲', '씨앗 실험터', '햇살 온실', '한살이 도서관', '생명 시계탑'];

const STAGES = ['egg', 'larva', 'pupa', 'adult'];
const STAGE_NAMES = {egg: '알', larva: '애벌레', pupa: '번데기', adult: '어른벌레'};
const INITIAL_ORDER = ['adult', 'pupa', 'egg', 'larva'];
const SENSORS = ['a-water', 'a-light', 'b-water', 'b-light'];
const ANIMAL_STEPS = ['butterfly-0', 'butterfly-1', 'butterfly-2', 'butterfly-3', 'dog-0', 'dog-1', 'dog-2'];
const PLANT_STEPS = ['balsam-0', 'balsam-1', 'balsam-2', 'balsam-3', 'apple-0', 'apple-1', 'apple-2', 'apple-3'];
const PLACEMENTS = {butterfly: 'egg', frog: 'egg', chicken: 'egg', dog: 'live', balsam: 'annual', apple: 'perennial', rose: 'perennial'};
const GROUPS = ['egg', 'live', 'annual', 'perennial'];
const TRAITS = ['color', 'stem', 'leaf', 'soil'];
const SIDES = ['a', 'b'];

export function fresh() {
 return {
  version: 2, screen: 'map', mission: 0, completed: [], phase: Array(10).fill(0),
  avatar: {x: 0.20, y: 0.56}, intro: true,
  discovery: {seen: [], drawing: [], note: ''},
  cycle: {order: [...INITIAL_ORDER], compared: false, generation: false, note: ''},
  seed: {
   question: 'water',
   prepared: {a: {soil: false, seeds: false}, b: {soil: false, seeds: false}},
   a: {water: true, warm: true}, b: {water: true, warm: true}, prediction: null
  },
  journey: {day: 0, peek: false, shots: [], winner: null, reason: null},
  greenhouse: {
   question: 'light', sensors: [],
   a: {water: true, light: true}, b: {water: true, light: true}, prediction: null
  },
  recovery: {traits: [], cause: null, repaired: false, note: ''},
  archives: {animalSeen: [], plantSeen: [], birth: null, perennial: null},
  garden: {placements: {}},
  book: {title: '', cards: [], captions: {}, summary: ''},
  clock: {rings: [], transfer: ''},
  settings: {reducedMotion: false}
 };
}

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isMission = n => Number.isInteger(n) && n >= 0 && n < 10;
const isDay = n => Number.isInteger(n) && n >= 0 && n <= 7;
const longEnough = (value, min) => typeof value === 'string' && value.trim().length >= min;
const all = (value, expected) => Array.isArray(value) && expected.every(item => value.includes(item));
const exactSet = (value, expected) => Array.isArray(value) && value.length === expected.length && new Set(value).size === value.length && all(value, expected);
const textValue = (value, fallback = '') => typeof value === 'string' ? value : fallback;
const booleanValue = (value, fallback = false) => typeof value === 'boolean' ? value : fallback;
const choice = (value, options, fallback = null) => options.includes(value) ? value : fallback;
const arrayValue = value => Array.isArray(value) ? value : [];
const uniqueAllowed = (value, allowed) => [...new Set(arrayValue(value).filter(item => allowed.includes(item)))];

// Only an explicitly saved, consecutive chain counts as completed.
function completedChain(value) {
 const saved = new Set(arrayValue(value).filter(isMission));
 const result = [];
 for (let n = 0; n < 10 && saved.has(n); n++) result.push(n);
 return result;
}

function validPoint(point) {
 return Array.isArray(point) && point.length === 2 && point.every(value => Number.isFinite(value) && value >= 0 && value <= 1);
}

function meaningfulStroke(stroke) {
 if (!Array.isArray(stroke) || stroke.length < 2 || !stroke.every(validPoint)) return false;
 let length = 0;
 for (let i = 1; i < stroke.length; i++) {
  length += Math.hypot(stroke[i][0] - stroke[i - 1][0], stroke[i][1] - stroke[i - 1][1]);
 }
 return length >= 0.04;
}

function experimentKeys(e, question) {
 if (!isObject(e) || !isObject(e.a) || !isObject(e.b)) return null;
 if (question === 'warm') return ['water', 'warm'];
 if (question === 'light') return ['water', 'light'];
 if (question !== 'water') return null;
 const hasWarm = ['a', 'b'].every(side => typeof e[side].warm === 'boolean');
 const hasLight = ['a', 'b'].every(side => typeof e[side].light === 'boolean');
 return hasWarm !== hasLight ? ['water', hasWarm ? 'warm' : 'light'] : null;
}

export function experimentIssue(e, question = e?.question) {
 const keys = experimentKeys(e, question);
 if (!keys || !SIDES.every(side => keys.every(key => typeof e[side][key] === 'boolean'))) return 'difference';
 const changed = keys.filter(key => e.a[key] !== e.b[key]);
 if (changed.length !== 1 || changed[0] !== question) return 'difference';
 return keys.some(key => key !== question && (!e.a[key] || !e.b[key])) ? 'baseline' : null;
}

function seedWinner(seed) {
 if (experimentIssue(seed, seed?.question) !== null) return null;
 const a = seed.a.water && seed.a.warm;
 const b = seed.b.water && seed.b.warm;
 return a === b ? null : a ? 'a' : 'b';
}

export function canEnter(s, n) {
 return isMission(n) && (n === 0 || completedChain(s?.completed).length >= n);
}

export function ready(s, n) {
 if (!isObject(s) || !isMission(n)) return false;
 switch (n) {
  case 0:
   return all(s.discovery?.seen, STAGES) &&
    arrayValue(s.discovery?.drawing).some(meaningfulStroke) && longEnough(s.discovery?.note, 4);
  case 1:
   return Array.isArray(s.cycle?.order) && s.cycle.order.length === 4 &&
    STAGES.every((stage, i) => s.cycle.order[i] === stage) &&
    s.cycle.compared === true && s.cycle.generation === true && longEnough(s.cycle.note, 4);
  case 2:
   return ['water', 'warm'].includes(s.seed?.question) &&
    SIDES.every(side => s.seed?.prepared?.[side]?.soil === true && s.seed?.prepared?.[side]?.seeds === true) &&
    experimentIssue(s.seed, s.seed?.question) === null && SIDES.includes(s.seed?.prediction);
  case 3: {
   if (!ready(s, 2) || s.journey?.peek !== true) return false;
   const days = arrayValue(s.journey.shots).filter(shot => isObject(shot) && isDay(shot.day)).map(shot => shot.day);
   const winner = seedWinner(s.seed);
   return days.includes(0) && days.some(day => day >= 2 && day <= 4) && days.some(day => day >= 6) &&
    winner !== null && s.journey.winner === winner && s.journey.reason === s.seed.question;
  }
  case 4:
   return ['water', 'light'].includes(s.greenhouse?.question) && all(s.greenhouse?.sensors, SENSORS) &&
    experimentIssue(s.greenhouse, s.greenhouse?.question) === null && SIDES.includes(s.greenhouse?.prediction);
  case 5: {
   if (!ready(s, 4)) return false;
   const traits = s.greenhouse.question === 'light' ? ['color', 'stem'] : ['leaf', 'soil'];
   return exactSet(s.recovery?.traits, traits) && s.recovery.cause === s.greenhouse.question &&
    s.recovery.repaired === true && longEnough(s.recovery.note, 4);
  }
  case 6:
   return all(s.archives?.animalSeen, ['butterfly-0', 'butterfly-3', 'dog-0', 'dog-2']) &&
    all(s.archives?.plantSeen, ['balsam-0', 'balsam-3', 'apple-0', 'apple-3']) &&
    s.archives.birth === 'different' && s.archives.perennial === 'same';
  case 7:
   return Object.entries(PLACEMENTS).every(([id, group]) => s.garden?.placements?.[id] === group);
  case 8: {
   if (!longEnough(s.book?.title, 2) || !longEnough(s.book?.summary, 8)) return false;
   const cards = s.book.cards;
   if (!Array.isArray(cards) || cards.length < 3 || cards.length > 6 || new Set(cards).size !== cards.length) return false;
   const bank = new Map(recordBank(s).map(card => [card.id, card]));
   if (!cards.every(id => bank.has(id))) return false;
   return new Set(cards.map(id => bank.get(id).kind)).size >= 2 &&
    cards.filter(id => longEnough(s.book.captions?.[id], 4)).length >= 2;
  }
  case 9:
   return completedChain(s.completed).length >= 9 && ready(s, 8) &&
    all(s.clock?.rings, [0, 1, 2, 3, 4]) && longEnough(s.clock?.transfer, 4);
  default:
   return false;
 }
}

export function complete(s, n) {
 if (!canEnter(s, n) || !ready(s, n)) return false;
 const completed = completedChain(s.completed);
 if (!completed.includes(n)) completed.push(n);
 s.completed = completed;
 return true;
}

export function progress(s) {
 const completed = completedChain(s?.completed).length;
 return {completed, total: 10, ratio: completed / 10, percent: completed * 10, rings: Math.floor(completed / 2)};
}

export function recordBank(s) {
 if (!isObject(s)) return [];
 const records = [];
 for (const id of uniqueAllowed(s.discovery?.seen, STAGES)) {
  const note = textValue(s.discovery?.note).trim();
  records.push({id: 'obs-' + id, kind: 'animal', title: STAGE_NAMES[id] + ' 관찰',
   detail: STAGE_NAMES[id] + '의 모습을 살펴본 기록' + (note ? ' · ' + note : ''), art: id});
 }
 const completed = completedChain(s.completed);
 if (completed.includes(0) && arrayValue(s.discovery?.drawing).some(meaningfulStroke)) {
  records.push({id: 'drawing', kind: 'animal', title: '내 관찰 그림', detail: textValue(s.discovery?.note), art: 'drawing'});
 }
 if (completed.includes(1)) records.push({id: 'cycle', kind: 'animal', title: '한살이 순서 필름',
  detail: STAGES.map(id => STAGE_NAMES[id]).join(' → ') + ' · ' + textValue(s.cycle?.note), art: 'adult'});
 const days = [...new Set(arrayValue(s.journey?.shots).filter(shot => isObject(shot) && isDay(shot.day)).map(shot => shot.day))].sort((a, b) => a - b);
 for (const day of days) {
  const observations = SIDES.map(side => {
   const conditions = s.seed?.[side];
   const level = conditions?.water === true && conditions?.warm === true ? (day < 2 ? 0 : day < 4 ? 1 : day < 6 ? 2 : 3) : 0;
   const result = ['아직 싹이 보이지 않아', '뿌리가 나와', '싹이 올라와', '잎이 펼쳐져'][level];
   return side.toUpperCase() + ' 화분: 물 ' + (conditions?.water === true ? '있음' : '없음') +
    ', 온도 ' + (conditions?.warm === true ? '따뜻함' : '차가움') + ' → ' + result;
  });
  records.push({id: 'seed-' + day, kind: 'plant', title: '씨앗 실험 ' + day + '일',
   detail: day + '일의 A/B 모습 · ' + (s.seed?.question === 'warm' ? '온도' : '물') + ' 조건 비교 · ' + observations.join(' / '),
   art: 'seed' + Math.min(3, Math.floor(day / 2))});
 }
 if (completed.includes(5)) records.push({id: 'greenhouse', kind: 'plant', title: '온실 환경 수리 기록',
  detail: (s.greenhouse?.question === 'water' ? '물' : '햇빛') + ' 조건을 비교하고 돌봄 방법을 정한 기록 · ' + textValue(s.recovery?.note), art: 'plant'});
 const archiveRecords = [
  ['butterfly', 'animal', 'animalSeen', 'butterfly-3', '나비', '알, 애벌레, 번데기, 어른벌레의 변화를 살펴본 기록'],
  ['dog', 'animal', 'animalSeen', 'dog-2', '개', '태어난 강아지가 자라 다 자란 개가 되는 과정을 살펴본 기록'],
  ['balsam', 'plant', 'plantSeen', 'balsam-3', '봉선화', '한 해의 변화와 씨를 남긴 뒤 한살이를 마치는 모습을 살펴본 기록'],
  ['apple', 'plant', 'plantSeen', 'apple-3', '사과나무', '같은 나무가 여러 해 살아가며 변하는 모습을 살펴본 기록']
 ];
 for (const [id, kind, field, last, name, detail] of archiveRecords) {
  if (arrayValue(s.archives?.[field]).includes(last)) records.push({id: 'species-' + id, kind, title: name + ' 한살이', detail, art: id});
 }
 return records;
}

function copyConditions(raw, defaults, keys) {
 return Object.fromEntries(keys.map(key => [key, booleanValue(raw?.[key], defaults[key])]));
}

function drawingValue(raw) {
 // Bound storage work without inventing points or connecting across invalid points.
 return arrayValue(raw).slice(0, 256)
  .filter(stroke => Array.isArray(stroke) && stroke.length >= 2 && stroke.every(validPoint))
  .map(stroke => stroke.slice(0, 2000).map(point => [...point]));
}

export function restore(raw) {
 let x;
 try { x = JSON.parse(raw); } catch { return fresh(); }
 if (!isObject(x) || x.version !== 2) return fresh();
 const s = fresh();
 s.completed = completedChain(x.completed);
 s.screen = choice(x.screen, ['map', 'mission', 'home'], 'map');
 s.mission = isMission(x.mission) ? x.mission : 0;
 s.phase = s.phase.map((_, i) => x.phase?.[i] === 1 ? 1 : 0);
 s.avatar.x = Number.isFinite(x.avatar?.x) ? Math.max(0, Math.min(1, x.avatar.x)) : s.avatar.x;
 s.avatar.y = Number.isFinite(x.avatar?.y) ? Math.max(0, Math.min(1, x.avatar.y)) : s.avatar.y;
 s.intro = booleanValue(x.intro, true);
 s.discovery = {seen: uniqueAllowed(x.discovery?.seen, STAGES), drawing: drawingValue(x.discovery?.drawing), note: textValue(x.discovery?.note)};
 s.cycle = {
  order: exactSet(x.cycle?.order, STAGES) ? [...x.cycle.order] : [...INITIAL_ORDER],
  compared: booleanValue(x.cycle?.compared), generation: booleanValue(x.cycle?.generation), note: textValue(x.cycle?.note)
 };
 s.seed.question = choice(x.seed?.question, ['water', 'warm'], 'water');
 for (const side of SIDES) {
  s.seed.prepared[side] = {soil: booleanValue(x.seed?.prepared?.[side]?.soil), seeds: booleanValue(x.seed?.prepared?.[side]?.seeds)};
  s.seed[side] = copyConditions(x.seed?.[side], s.seed[side], ['water', 'warm']);
 }
 s.seed.prediction = choice(x.seed?.prediction, SIDES);
 s.journey = {
  day: isDay(x.journey?.day) ? x.journey.day : 0,
  peek: booleanValue(x.journey?.peek),
  shots: [...new Set(arrayValue(x.journey?.shots).filter(shot => isObject(shot) && isDay(shot.day)).map(shot => shot.day))].sort((a, b) => a - b).map(day => ({day})),
  winner: choice(x.journey?.winner, SIDES), reason: choice(x.journey?.reason, ['water', 'warm'])
 };
 s.greenhouse.question = choice(x.greenhouse?.question, ['water', 'light'], 'light');
 s.greenhouse.sensors = uniqueAllowed(x.greenhouse?.sensors, SENSORS);
 for (const side of SIDES) s.greenhouse[side] = copyConditions(x.greenhouse?.[side], s.greenhouse[side], ['water', 'light']);
 s.greenhouse.prediction = choice(x.greenhouse?.prediction, SIDES);
 s.recovery = {
  traits: uniqueAllowed(x.recovery?.traits, TRAITS), cause: choice(x.recovery?.cause, ['water', 'light']),
  repaired: booleanValue(x.recovery?.repaired), note: textValue(x.recovery?.note)
 };
 s.archives = {
  animalSeen: uniqueAllowed(x.archives?.animalSeen, ANIMAL_STEPS), plantSeen: uniqueAllowed(x.archives?.plantSeen, PLANT_STEPS),
  birth: choice(x.archives?.birth, ['same', 'different']), perennial: choice(x.archives?.perennial, ['same', 'new', 'different'])
 };
 for (const id of Object.keys(PLACEMENTS)) {
  if (GROUPS.includes(x.garden?.placements?.[id])) s.garden.placements[id] = x.garden.placements[id];
 }
 s.book.title = textValue(x.book?.title);
 s.book.summary = textValue(x.book?.summary);
 const recordIds = recordBank(s).map(card => card.id);
 s.book.cards = uniqueAllowed(x.book?.cards, recordIds).slice(0, 6);
 for (const id of recordIds) {
  if (typeof x.book?.captions?.[id] === 'string') s.book.captions[id] = x.book.captions[id];
 }
 s.clock = {rings: uniqueAllowed(x.clock?.rings, [0, 1, 2, 3, 4]), transfer: textValue(x.clock?.transfer)};
 s.settings.reducedMotion = booleanValue(x.settings?.reducedMotion);
 if (!canEnter(s, s.mission)) { s.screen = 'map'; s.mission = Math.min(9, s.completed.length); }
 return s;
}
