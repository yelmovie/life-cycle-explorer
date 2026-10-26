import test from 'node:test';
import assert from 'node:assert/strict';
import {STORAGE_KEY, CHAPTERS, fresh, restore, canEnter, ready, complete, experimentIssue, recordBank, progress} from '../src/adventure-core.js';

function evidenceState() {
 const s = fresh();
 s.discovery = {seen: ['egg', 'larva', 'pupa', 'adult'], drawing: [[[0.1, 0.2], [0.3, 0.4]]], note: '잎 위에 작은 알이 보여.'};
 s.cycle = {order: ['egg', 'larva', 'pupa', 'adult'], compared: true, generation: true, note: '어른벌레에게 날개가 생겼어.'};
 s.seed.prepared = {a: {soil: true, seeds: true}, b: {soil: true, seeds: true}};
 s.seed.b.water = false;
 s.seed.prediction = 'b'; // An incorrect prediction is still a valid starting hypothesis.
 s.journey = {day: 7, peek: true, shots: [{day: 0}, {day: 3}, {day: 7}], winner: 'a', reason: 'water'};
 s.greenhouse.sensors = ['a-water', 'a-light', 'b-water', 'b-light'];
 s.greenhouse.b.light = false;
 s.greenhouse.prediction = 'b';
 s.recovery = {traits: ['color', 'stem'], cause: 'light', repaired: true, note: '잎과 줄기를 보고 햇빛을 살폈어.'};
 s.archives = {
  animalSeen: ['butterfly-0', 'butterfly-3', 'dog-0', 'dog-2'],
  plantSeen: ['balsam-0', 'balsam-3', 'apple-0', 'apple-3'], birth: 'different', perennial: 'same'
 };
 s.garden.placements = {butterfly: 'egg', frog: 'egg', chicken: 'egg', dog: 'live', balsam: 'annual', apple: 'perennial', rose: 'perennial'};
 s.book = {
  title: '내가 찾은 한살이',
  cards: ['obs-egg', 'obs-adult', 'seed-7'],
  captions: {'obs-egg': '작고 길쭉한 알이 보여.', 'seed-7': '물을 준 화분에서 싹이 보였어.'},
  summary: '생물은 자라면서 모습이 달라져.'
 };
 s.clock = {rings: [0, 1, 2, 3, 4], transfer: '학교 화단에서도 같은 식물을 계속 관찰할 거야.'};
 return s;
}

function finish(s, last = 9) {
 for (let n = 0; n <= last; n++) assert.equal(complete(s, n), true, 'mission ' + n);
 return s;
}

test('새 저장키와 독립된 초기 상태는 이전 앱 기록에 손대지 않는다', () => {
 assert.equal(STORAGE_KEY, 'life-clock-lab.adventure.2');
 assert.equal(CHAPTERS.length, 5);
 const s = fresh(), other = fresh();
 assert.equal(s.version, 2);
 assert.equal(s.screen, 'map');
 for (let n = 0; n < 10; n++) {
  assert.equal(ready(s, n), false);
  assert.equal(canEnter(s, n), n === 0);
 }
 s.phase[0] = 1; s.seed.a.water = false; s.cycle.order.reverse();
 assert.equal(other.phase[0], 0);
 assert.equal(other.seed.a.water, true);
 assert.deepEqual(other.cycle.order, ['adult', 'pupa', 'egg', 'larva']);
});

test('관찰은 네 모습, 실제 선, 자기 메모를 요구하고 점이나 짧은 탭은 제외한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 0), true);
 for (const drawing of [[], [[[0.2, 0.2]]], [[[0.2, 0.2], [0.201, 0.201]]], [[[0.2, 0.2], [2, 0.2]]]]) {
  s.discovery.drawing = drawing; assert.equal(ready(s, 0), false);
 }
 s.discovery.drawing = [[[0.1, 0.1], [0.2, 0.2]]];
 s.discovery.seen.pop(); assert.equal(ready(s, 0), false);
 s.discovery.seen.push('adult'); s.discovery.note = '   알  '; assert.equal(ready(s, 0), false);
});

test('순서만 맞혀서는 변화 비교와 다음 세대 연결을 완료한 것이 아니다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 1), true);
 s.cycle.order = ['egg', 'pupa', 'larva', 'adult']; assert.equal(ready(s, 1), false);
 s.cycle.order = ['egg', 'larva', 'pupa', 'adult'];
 s.cycle.compared = false; assert.equal(ready(s, 1), false);
 s.cycle.compared = true; s.cycle.generation = false; assert.equal(ready(s, 1), false);
 s.cycle.generation = true; s.cycle.note = '  '; assert.equal(ready(s, 1), false);
});

test('공정 비교와 공통 조건의 적합성을 구분하고 누락·틀린 자료형을 안전하게 막는다', () => {
 const s = fresh();
 assert.equal(experimentIssue(s.seed, 'water'), 'difference');
 s.seed.b.water = false; assert.equal(experimentIssue(s.seed, 'water'), null);
 s.seed.a.warm = false; assert.equal(experimentIssue(s.seed, 'water'), 'difference');
 s.seed.b.warm = false; assert.equal(experimentIssue(s.seed, 'water'), 'baseline');
 for (const e of [null, {}, {a: null, b: {}}, {a: {water: 'yes', warm: true}, b: {water: false, warm: true}}]) {
  assert.equal(experimentIssue(e, 'water'), 'difference');
 }
 assert.equal(experimentIssue(s.seed, 'sun'), 'difference');
});

test('물·온도·햇빛의 각각의 실험은 다른 조건을 같고 알맞게 유지한다', () => {
 const seedWarm = {a: {water: true, warm: false}, b: {water: true, warm: true}};
 assert.equal(experimentIssue(seedWarm, 'warm'), null);
 seedWarm.a.water = false; seedWarm.b.water = false;
 assert.equal(experimentIssue(seedWarm, 'warm'), 'baseline');
 const green = {a: {water: true, light: true}, b: {water: true, light: false}};
 assert.equal(experimentIssue(green, 'light'), null);
 green.a.water = false; green.b.water = false;
 assert.equal(experimentIssue(green, 'light'), 'baseline');
 const water = {a: {water: false, light: true}, b: {water: true, light: true}};
 assert.equal(experimentIssue(water, 'water'), null);
});

test('실험 준비는 두 용기의 흙과 씨앗을 모두 요구하되 예측의 오답은 허용한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 2), true);
 assert.equal(s.seed.prediction, 'b');
 for (const side of ['a', 'b']) for (const tool of ['soil', 'seeds']) {
  s.seed.prepared[side][tool] = false; assert.equal(ready(s, 2), false); s.seed.prepared[side][tool] = true;
 }
 s.seed.prediction = null; assert.equal(ready(s, 2), false);
});

test('시간 기록에는 시작·중간·마지막의 서로 다른 증거와 흙 속 관찰이 필요하다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 3), true);
 for (const days of [[0, 0, 7], [0, 5, 7], [2, 4, 7], [0, 3, 5], [0, 3, 99]]) {
  s.journey.shots = days.map(day => ({day})); assert.equal(ready(s, 3), false);
 }
 s.journey.shots = [{day: 0}, {day: 2}, {day: 6}]; assert.equal(ready(s, 3), true);
 s.journey.peek = false; assert.equal(ready(s, 3), false);
});

test('발아 결론은 고정된 A 정답이 아니라 선택한 실험의 실제 결과와 질문을 따른다', () => {
 const s = evidenceState();
 s.seed.a.water = false; s.seed.b.water = true;
 s.journey.winner = 'a'; assert.equal(ready(s, 3), false);
 s.journey.winner = 'b'; assert.equal(ready(s, 3), true);
 s.seed.question = 'warm'; s.seed.a.water = true; s.seed.a.warm = false;
 s.journey.reason = 'water'; assert.equal(ready(s, 3), false);
 s.journey.reason = 'warm'; assert.equal(ready(s, 3), true);
});

test('둘 다 싹이 나지 않는 동률 실험을 B 성공으로 인정하지 않는다', () => {
 const s = evidenceState();
 s.seed.a.warm = false; s.seed.b.warm = false; s.journey.winner = 'b';
 assert.equal(experimentIssue(s.seed, 'water'), 'baseline');
 assert.equal(ready(s, 2), false);
 assert.equal(ready(s, 3), false);
});

test('온실은 각 화분에 물·빛 센서가 있어야 하고 비교가 가능해야 한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 4), true);
 for (const sensor of [...s.greenhouse.sensors]) {
  const sensors = [...s.greenhouse.sensors];
  s.greenhouse.sensors = sensors.filter(id => id !== sensor);
  assert.equal(ready(s, 4), false); s.greenhouse.sensors = sensors;
 }
 s.greenhouse.a.water = false; s.greenhouse.b.water = false;
 assert.equal(ready(s, 4), false);
 s.greenhouse = {question: 'warm', sensors: ['a-water', 'a-light', 'b-water', 'b-light'], a: {water: true, warm: true}, b: {water: true, warm: false}, prediction: 'a'};
 assert.equal(ready(s, 4), false);
});

test('환경 수리는 질문에 맞는 두 관찰 특징·원인·조치·설명을 연결한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 5), true);
 s.recovery.traits = ['color', 'stem', 'leaf', 'soil']; assert.equal(ready(s, 5), false);
 s.recovery.traits = ['color', 'color']; assert.equal(ready(s, 5), false);
 s.recovery.traits = ['color', 'stem']; s.recovery.cause = 'water'; assert.equal(ready(s, 5), false);
 s.recovery.cause = 'light'; s.recovery.repaired = false; assert.equal(ready(s, 5), false);
 s.recovery.repaired = true; s.recovery.note = ''; assert.equal(ready(s, 5), false);
 s.recovery.note = '물을 주지 않아 잎이 처졌어.';
 s.greenhouse.question = 'water'; s.greenhouse.b.light = true; s.greenhouse.b.water = false;
 s.recovery.traits = ['leaf', 'soil']; s.recovery.cause = 'water'; assert.equal(ready(s, 5), true);
});

test('동물과 식물의 처음·마지막 기록 모두를 비교해야 한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 6), true);
 for (const field of ['animalSeen', 'plantSeen']) for (const id of [...s.archives[field]]) {
  const seen = [...s.archives[field]];
  s.archives[field] = seen.filter(item => item !== id);
  assert.equal(ready(s, 6), false); s.archives[field] = seen;
 }
 s.archives.birth = 'same'; assert.equal(ready(s, 6), false);
 s.archives.birth = 'different'; s.archives.perennial = 'new'; assert.equal(ready(s, 6), false);
});

test('분류 정원은 기존 생물 여섯과 새로운 장미 사례를 모두 검증한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 7), true);
 for (const id of Object.keys(s.garden.placements)) {
  const group = s.garden.placements[id]; delete s.garden.placements[id];
  assert.equal(ready(s, 7), false); s.garden.placements[id] = group;
 }
 s.garden.placements.rose = 'annual'; assert.equal(ready(s, 7), false);
});

test('이야기책은 유효하고 중복 없는 동물·식물 증거와 직접 쓴 설명을 요구한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 8), true);
 for (const cards of [
  ['obs-egg', 'obs-egg', 'seed-7'], ['obs-egg', 'obs-adult', 'unknown'],
  ['obs-egg', 'obs-adult', 'obs-larva'], ['obs-egg', 'seed-7'],
  ['obs-egg', 'obs-larva', 'obs-pupa', 'obs-adult', 'seed-0', 'seed-3', 'seed-7']
 ]) { s.book.cards = cards; assert.equal(ready(s, 8), false); }
 s.book.cards = ['obs-egg', 'obs-adult', 'seed-7'];
 s.book.captions['seed-7'] = ''; s.book.captions['seed-3'] = '선택하지 않은 자료의 설명';
 assert.equal(ready(s, 8), false);
 s.book.captions['seed-7'] = '싹이 나온 모습이 달라.';
 s.book.summary = '자라요'; assert.equal(ready(s, 8), false);
});

test('기록 보관함에는 실제로 본 모습·저장한 시점·완료한 조사만 들어간다', () => {
 const s = fresh();
 assert.deepEqual(recordBank(s), []);
 s.discovery.seen = ['egg', 'egg', 'not-animal'];
 s.journey.shots = [{day: 3}, {day: 0}, {day: 3}, {day: -1}, null];
 s.archives.animalSeen = ['butterfly-0', 'dog-2'];
 assert.deepEqual(recordBank(s).map(card => card.id), ['obs-egg', 'seed-0', 'seed-3', 'species-dog']);
 assert.equal(recordBank(s).find(card => card.id === 'seed-3').art, 'seed1');
 const completeEvidence = evidenceState();
 assert.equal(recordBank(completeEvidence).some(card => card.id === 'cycle'), false);
 finish(completeEvidence, 1);
 assert.equal(recordBank(completeEvidence).some(card => card.id === 'cycle'), true);
 assert.equal(recordBank(completeEvidence).some(card => card.id === 'greenhouse'), false);
 for (let n = 2; n <= 5; n++) assert.equal(complete(completeEvidence, n), true);
 assert.equal(recordBank(completeEvidence).some(card => card.id === 'greenhouse'), true);
 assert.ok(recordBank(completeEvidence).every(card => ['animal', 'plant'].includes(card.kind)));
});

test('완료한 관찰 그림은 학생의 설명과 함께 이야기 책과 저장 복원에 이어진다', () => {
 const s = evidenceState();
 assert.equal(recordBank(s).some(card => card.id === 'drawing'), false);
 finish(s, 0);
 assert.deepEqual(recordBank(s).find(card => card.id === 'drawing'), {
  id: 'drawing', kind: 'animal', title: '내 관찰 그림', detail: s.discovery.note, art: 'drawing'
 });
 s.book.cards = ['drawing', 'obs-adult', 'seed-7'];
 s.book.captions.drawing = '내가 본 알의 모양을 그렸어.';
 assert.equal(ready(s, 8), true);
 const restored = restore(JSON.stringify(s));
 assert.deepEqual(restored.book.cards, s.book.cards);
 assert.deepEqual(restored.discovery.drawing, s.discovery.drawing);
 assert.equal(ready(restored, 8), true);
 for (const drawing of [[], [[[0.2, 0.2]]], [[[0.2, 0.2], [0.201, 0.201]]], [[[0, 0], [2, 2]]]]) {
  s.discovery.drawing = drawing;
  assert.equal(recordBank(s).some(card => card.id === 'drawing'), false);
 }
});

test('씨앗 사진 기록은 날짜별 실제 A/B 조건과 성장 결과를 담는다', () => {
 const s = evidenceState();
 s.journey.shots = Array.from({length: 8}, (_, day) => ({day}));
 const results = ['아직 싹이 보이지 않아', '아직 싹이 보이지 않아', '뿌리가 나와', '뿌리가 나와', '싹이 올라와', '싹이 올라와', '잎이 펼쳐져', '잎이 펼쳐져'];
 for (const [day, result] of results.entries()) {
  const detail = recordBank(s).find(card => card.id === 'seed-' + day).detail;
  assert.ok(detail.includes('A 화분: 물 있음, 온도 따뜻함 → ' + result));
  assert.ok(detail.includes('B 화분: 물 없음, 온도 따뜻함 → 아직 싹이 보이지 않아'));
 }
 s.seed.question = 'warm';
 s.seed.a = {water: true, warm: false};
 s.seed.b = {water: true, warm: true};
 const detail = recordBank(s).find(card => card.id === 'seed-7').detail;
 assert.ok(detail.includes('온도 조건 비교'));
 assert.ok(detail.includes('A 화분: 물 있음, 온도 차가움 → 아직 싹이 보이지 않아'));
 assert.ok(detail.includes('B 화분: 물 있음, 온도 따뜻함 → 잎이 펼쳐져'));
});

test('한살이 기록의 생물 이름은 관찰 화면의 나비와 봉선화 이름을 유지한다', () => {
 const records = recordBank(evidenceState());
 assert.equal(records.find(card => card.id === 'species-butterfly').title, '나비 한살이');
 assert.equal(records.find(card => card.id === 'species-balsam').title, '봉선화 한살이');
});

test('준비된 답만으로 앞 미션을 건너뛸 수 없고 전체 경로는 엔딩까지 이어진다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 2), true);
 assert.equal(complete(s, 2), false);
 assert.deepEqual(s.completed, []);
 finish(s);
 assert.deepEqual(progress(s), {completed: 10, total: 10, ratio: 1, percent: 100, rings: 5});
 assert.deepEqual(s.completed, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
 assert.equal(complete(s, 9), true);
 assert.equal(s.completed.length, 10);
 for (const n of [-1, 10, 1.5, '2', NaN]) {
  assert.equal(canEnter(s, n), false); assert.equal(ready(s, n), false); assert.equal(complete(s, n), false);
 }
});

test('링 보상은 학습 완료된 두 미션마다 하나씩 늘어난다', () => {
 const s = evidenceState();
 assert.equal(progress(s).rings, 0);
 assert.equal(complete(s, 0), true); assert.equal(progress(s).rings, 0);
 assert.equal(complete(s, 1), true); assert.equal(progress(s).rings, 1);
 assert.equal(progress(s).ratio, 0.2);
 assert.equal(progress(s).percent, 20);
});

test('엔딩은 이전 학습 전체·다섯 링·전이 계획·현재 완성된 책을 함께 요구한다', () => {
 const s = evidenceState();
 assert.equal(ready(s, 9), false);
 finish(s, 8); assert.equal(ready(s, 9), true);
 s.clock.rings = [0, 0, 1, 2, 3]; assert.equal(ready(s, 9), false);
 s.clock.rings = [0, 1, 2, 3, 4]; s.clock.transfer = ''; assert.equal(ready(s, 9), false);
 s.clock.transfer = '화단에서 잎의 변화를 기록할래.';
 s.book.cards.pop(); assert.equal(ready(s, 9), false);
 assert.equal(complete(s, 9), false);
 assert.equal(s.completed.includes(9), false);
});

test('이전 선택을 보완하면 수정된 실험과 근거를 현재 기준으로 다시 검증한다', () => {
 const s = evidenceState(); finish(s, 2);
 s.seed.a.water = false; s.seed.b.water = true;
 assert.equal(ready(s, 3), false);
 s.journey.winner = 'b'; assert.equal(ready(s, 3), true);
 assert.equal(complete(s, 2), true);
 assert.deepEqual(s.completed, [0, 1, 2]);
});

test('전체 탐구·설정·자기 문장은 새로고침용 저장 복원에서 그대로 유지된다', () => {
 const s = finish(evidenceState());
 s.screen = 'mission'; s.mission = 9; s.phase[9] = 1; s.settings.reducedMotion = true;
 assert.deepEqual(restore(JSON.stringify(s)), s);
 assert.equal(ready(restore(JSON.stringify(s)), 9), true);
});

test('각 탐험의 저장 단계는 0과 1만 허용하고 잘못된 단계는 첫 활동으로 돌아간다', () => {
 const s = fresh();
 s.phase = [0, 1, 2, -1, '1', true, null, 0.5, 99, 1];
 assert.deepEqual(restore(JSON.stringify(s)).phase, [0, 1, 0, 0, 0, 0, 0, 0, 0, 1]);
});

test('이전 버전·깨진 JSON·원시 타입은 새 상태로 복원하고 기존 키는 접근하지 않는다', () => {
 for (const raw of [null, undefined, '', '{broken', 'null', '[]', '"text"', '{"version":1}', '{"version":3}']) {
  assert.deepEqual(restore(raw), fresh());
 }
});

test('부분 손상은 해당 필드만 기본값으로 보완하며 안전한 메모는 남긴다', () => {
 const s = restore(JSON.stringify({
  version: 2, completed: [], discovery: {note: '남겨둔 관찰 메모', seen: null, drawing: [null, 'broken']},
  cycle: null, seed: {a: null, b: 'broken', prepared: null}, journey: {shots: [null, {}, {day: '3'}]},
  greenhouse: null, recovery: null, archives: null, garden: null, book: null, clock: null, settings: null
 }));
 assert.equal(s.discovery.note, '남겨둔 관찰 메모');
 for (let n = 0; n < 10; n++) assert.doesNotThrow(() => ready(s, n));
 assert.deepEqual(recordBank(s), []);
 assert.deepEqual(s.seed.a, {water: true, warm: true});
 assert.equal(progress(s).completed, 0);
});

test('완료 기록의 중복·순서 혼란은 정리하되 선수 미션이 빠진 뒤쪽 진행은 인정하지 않는다', () => {
 const s = evidenceState();
 s.completed = [2, 0, 0, 3, 9, -1]; s.screen = 'mission'; s.mission = 3;
 const restored = restore(JSON.stringify(s));
 assert.deepEqual(restored.completed, [0]);
 assert.equal(restored.screen, 'map');
 assert.equal(restored.mission, 1);
 assert.equal(canEnter(restored, 2), false);
 assert.deepEqual(progress(restored), {completed: 1, total: 10, ratio: 0.1, percent: 10, rings: 0});
 assert.deepEqual(restore(JSON.stringify({...s, completed: [1, 2, 3]})).completed, []);
 assert.deepEqual(restore(JSON.stringify({...s, completed: [2, 0, 1, 2]})).completed, [0, 1, 2]);
});

test('저장 복원은 사진·센서·분류·카드의 잘못된 ID와 자료형을 제거한다', () => {
 const s = evidenceState();
 s.discovery.seen.push('unknown');
 s.journey.shots.push({day: 3}, {day: 8}, {day: '0'});
 s.greenhouse.sensors.push('missing', 'a-water');
 s.archives.animalSeen.push('apple-3');
 s.garden.placements.dog = 'made-up';
 s.book.cards.push('unknown', 'obs-egg');
 s.book.captions.unknown = '없는 자료';
 s.clock.rings.push(4, '3', 99);
 const restored = restore(JSON.stringify(s));
 assert.deepEqual(restored.journey.shots, [{day: 0}, {day: 3}, {day: 7}]);
 assert.equal(restored.greenhouse.sensors.length, 4);
 assert.equal(restored.discovery.seen.length, 4);
 assert.equal(restored.archives.animalSeen.includes('apple-3'), false);
 assert.equal(restored.garden.placements.dog, undefined);
 assert.deepEqual(restored.book.cards, ['obs-egg', 'obs-adult', 'seed-7']);
 assert.equal(restored.book.captions.unknown, undefined);
 assert.deepEqual(restored.clock.rings, [0, 1, 2, 3, 4]);
});

test('화면·위치·단계·선 좌표의 손상을 보정해도 학습 완료를 새로 만들지 않는다', () => {
 const s = evidenceState();
 s.screen = '<script>'; s.mission = 999; s.phase = [99, -1, '1']; s.avatar = {x: -3, y: 5};
 s.discovery.drawing = [[[0, 0], [3, 3]]]; s.cycle.order = ['egg']; s.completed = [];
 const restored = restore(JSON.stringify(s));
 assert.equal(restored.screen, 'map'); assert.equal(restored.mission, 0);
 assert.deepEqual(restored.avatar, {x: 0, y: 1});
 assert.deepEqual(restored.phase, Array(10).fill(0));
 assert.deepEqual(restored.discovery.drawing, []);
 assert.deepEqual(restored.cycle.order, ['adult', 'pupa', 'egg', 'larva']);
 assert.deepEqual(restored.completed, []);
 assert.equal(ready(restored, 0), false);
 assert.equal(ready(restored, 1), false);
});

test('조회 함수들은 학생의 원래 기록을 바꾸지 않는다', () => {
 const s = evidenceState(), before = structuredClone(s);
 for (let n = 0; n < 10; n++) { ready(s, n); canEnter(s, n); }
 recordBank(s); progress(s); experimentIssue(s.seed, s.seed.question);
 assert.deepEqual(s, before);
});
