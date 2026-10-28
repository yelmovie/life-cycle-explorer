import {SORT_CARDS,CORE_PLANT_CARDS} from '../src/field-content.js';
import {roomPhase,roomUI,holdObservation,releaseObservation} from '../src/field-flow.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialField,restoreField,fieldAction,fieldReady,fieldPhase,fieldRecords,fieldUnlocked,fieldCompletedCount,fieldBookReady,towerClaimText,TOWER_CLAIMS,FIELD_FORMS} from '../src/field-model.js';

const act=(field,type,p={}) => {
  const result=fieldAction(field,type,p);
  assert.equal(result.ok,true,`${type}: ${result.message}`);
  return result;
};
function finishObservation(field) {
  for (const form of FIELD_FORMS) for (const spot of [0,1]) act(field,'inspect',{form,spot});
  act(field,'observation-draw',{stroke:[[.1,.1],[.4,.3],[.6,.2]]});
  act(field,'observation-note',{text:'애벌레는 다리가 있고 길쭉해요.'});
  FIELD_FORMS.forEach((form,to) => act(field,'film-move',{from:field.chapters[0].order.indexOf(form),to}));
  act(field,'generation',{target:'next-egg'});
}
function finishSeeds(field) {
  for (const variable of ['water','warm']) {
    for (const side of ['a','b']) act(field,'seed-prepare',{side,soil:true,seeds:3});
    // An incorrect prediction is still a valid scientific starting point.
    act(field,'seed-predict',{choice:'a'});
    act(field,'seed-condition',{key:variable});
    act(field,'seed-run');
    for (const day of [0,3,7]) {act(field,'seed-day',{day});act(field,'seed-photo');}
    act(field,'seed-report',{reason:variable,result:'b',expectation:'changed'});
    if (variable === 'water') act(field,'seed-next');
  }
}
function finishCare(field) {
  for (const variable of ['water','light']) {
    for (const sensor of ['water','light']) act(field,'care-measure',{sensor});
    act(field,'care-pin',{symptom:variable === 'water' ? 'dry' : 'pale'});
    act(field,'care-photo');act(field,'care-tool',{tool:variable});
    act(field,'care-day',{day:2});act(field,'care-photo');
    if (variable === 'water') act(field,'care-next');
  }
}
function finishComparison(field) {
  for (const animal of ['butterfly','dog']) for (const step of [0,animal === 'butterfly' ? 3 : 2]) {
    act(field,'animal-time',{animal,step});act(field,'animal-photo',{animal});
  }
  act(field,'animal-generation',{answer:'different'});
  for (const plant of ['apple','balsam']) act(field,'plant-tag',{plant});
  for (const step of [0,3,4]) {
    act(field,'season',{step});
    for (const plant of ['apple','balsam']) act(field,'season-photo',{plant});
  }
  act(field,'plant-classify',{plant:'apple',answer:'same'});
  act(field,'plant-classify',{plant:'balsam',answer:'new'});
  for (const c of SORT_CARDS) act(field,'transfer',{card:c.id,bin:c.bin});
}
const finishers=[finishObservation,finishSeeds,finishCare,finishComparison];
function completedThrough(chapter) {
  const field=initialField();
  for (let c=0;c<=chapter;c++) {act(field,'chapter-enter',{chapter:c});finishers[c](field);assert.equal(fieldReady(field),true);act(field,'chapter-complete');}
  return field;
}
function composeBook(field) {
  act(field,'chapter-enter',{chapter:4});
  for (const id of ['field-observation-larva','field-seed-water','field-care-water','field-animal-butterfly']) act(field,'book-record',{id});
  act(field,'book-title',{text:'생명 탐사책'});
  act(field,'book-caption',{id:'field-observation-larva',text:'애벌레의 다리와 몸을 살펴봤다.'});
  act(field,'book-caption',{id:'field-seed-water',text:'물을 다르게 주니 싹이 달라졌다.'});
  act(field,'book-summary',{text:'생명은 자라며 모습이 달라지고 다음 세대로 이어진다.'});
}

test('field notebook requires distinct inspections, a written note, order and next generation',() => {
  const field=initialField();
  assert.equal(fieldUnlocked(field,1),false);
  assert.equal(fieldAction(field,'chapter-complete').ok,false);
  act(field,'inspect',{form:'egg',spot:0});act(field,'inspect',{form:'egg',spot:0});
  assert.deepEqual(field.chapters[0].inspected.egg,[0]);
  assert.equal(fieldAction(field,'film-move',{from:0,to:1}).ok,false);
  for (const form of FIELD_FORMS) for (const spot of [0,1]) act(field,'inspect',{form,spot});
  assert.equal(fieldPhase(field),'draw');
  assert.equal(fieldAction(field,'observation-draw',{stroke:[[.2,.2],[.2,.2]]}).ok,false);
  act(field,'observation-note',{text:'긴'});
  assert.equal(fieldPhase(field),'draw');
  act(field,'observation-note',{text:'긴 몸과 짧은 다리를 관찰했어.'});
  assert.equal(fieldPhase(field),'film');
  FIELD_FORMS.forEach((form,to) => act(field,'film-move',{from:field.chapters[0].order.indexOf(form),to}));
  assert.equal(fieldAction(field,'generation',{target:'same-egg'}).ok,false);
  act(field,'generation',{target:'next-egg'});assert.equal(fieldReady(field),true);
  act(field,'chapter-complete');assert.equal(fieldUnlocked(field,1),true);
});

test('seed rounds require equal preparation, one changed variable and three dated photographs',() => {
  const field=completedThrough(0);act(field,'chapter-enter',{chapter:1});
  act(field,'seed-predict',{choice:'unsure'});assert.equal(fieldAction(field,'seed-run').ok,false);
  for (const side of ['a','b']) act(field,'seed-prepare',{side,soil:true,seeds:3});
  assert.equal(fieldAction(field,'seed-condition',{side:'a',key:'water'}).ok,false);
  assert.equal(fieldAction(field,'seed-run').ok,false);
  act(field,'seed-condition',{key:'water'});act(field,'seed-run');
  const original=structuredClone(field.chapters[1].rounds[0].run);
  assert.equal(fieldAction(field,'seed-condition',{key:'water'}).ok,false);
  assert.equal(fieldAction(field,'seed-prepare',{side:'b',seeds:1}).ok,false);
  assert.deepEqual(field.chapters[1].rounds[0].run,original);
  // Start, middle and end photos are saved automatically as the dial moves.
  assert.deepEqual(field.chapters[1].rounds[0].photos,[0]);
  assert.equal(fieldAction(field,'seed-report',{reason:'water'}).ok,false);
  act(field,'seed-day',{day:7});
  assert.deepEqual(field.chapters[1].rounds[0].photos,[0,3,7]);
  assert.equal(fieldAction(field,'seed-report',{reason:'warm'}).ok,false);
  act(field,'seed-report',{reason:'water',result:'b',expectation:'unsure'});assert.equal(fieldReady(field),false);
  act(field,'seed-next');assert.equal(field.chapters[1].rounds[1].variable,'warm');
});

test('predictions may differ from outcomes without preventing completion',() => {
  const field=completedThrough(1);
  assert.equal(fieldCompletedCount(field),2);
  assert.equal(field.chapters[1].rounds.every(round => round.prediction === 'a'),true);
  assert.equal(fieldRecords(field).filter(record => record.fieldEvidence.type === 'retry').length,2);
});

test('care wrong tool keeps measured evidence and requires before and final photographs for both plants',() => {
  const field=completedThrough(1);act(field,'chapter-enter',{chapter:2});
  assert.equal(fieldAction(field,'care-tool',{tool:'water'}).ok,false);
  for (const sensor of ['water','light']) act(field,'care-measure',{sensor});
  act(field,'care-pin',{symptom:'dry'});assert.equal(fieldAction(field,'care-tool',{tool:'water'}).ok,false);
  act(field,'care-photo');assert.equal(fieldAction(field,'care-tool',{tool:'light'}).ok,false);
  assert.deepEqual(field.chapters[2].cases[0].measured,['water','light']);
  assert.equal(field.chapters[2].cases[0].symptom,'dry');
  act(field,'care-tool',{tool:'water'});act(field,'care-day',{day:2});
  assert.equal(fieldAction(field,'care-next').ok,false);
  act(field,'care-photo');act(field,'care-next');assert.equal(fieldReady(field),false);
});

test('animal clocks are independent and next generation is not the same individual',() => {
  const field=completedThrough(2);act(field,'chapter-enter',{chapter:3});
  act(field,'animal-time',{animal:'butterfly',step:3});assert.equal(field.chapters[3].animals.dog.step,0);
  assert.equal(fieldAction(field,'animal-generation',{answer:'different'}).ok,false);
  for (const animal of ['butterfly','dog']) for (const step of [0,animal === 'butterfly' ? 3 : 2]) {act(field,'animal-time',{animal,step});act(field,'animal-photo',{animal});}
  assert.equal(fieldAction(field,'animal-generation',{answer:'same'}).ok,false);
  act(field,'animal-generation',{answer:'different'});
  for (const plant of ['apple','balsam']) act(field,'plant-tag',{plant});
  act(field,'season',{step:4});
  for (const plant of ['apple','balsam']) act(field,'season-photo',{plant});
  assert.equal(fieldAction(field,'plant-classify',{plant:'apple',answer:'same'}).ok,false);
  for (const step of [0,3]) {act(field,'season',{step});for (const plant of ['apple','balsam']) act(field,'season-photo',{plant});}
  assert.equal(fieldAction(field,'plant-classify',{plant:'apple',answer:'new'}).ok,false);
  act(field,'plant-classify',{plant:'apple',answer:'same'});act(field,'plant-classify',{plant:'balsam',answer:'new'});
  assert.equal(fieldAction(field,'transfer',{card:'whale',bin:'egg'}).ok,false);
  assert.equal(fieldReady(field),false);
  for (const c of SORT_CARDS) act(field,'transfer',{card:c.id,bin:c.bin});assert.equal(fieldReady(field),true);
});

test('final book uses real records, both life kinds, reasoning and three evidence-based help requests',() => {
  const field=completedThrough(3);composeBook(field);
  assert.equal(fieldAction(field,'book-record',{id:'invented-picture'}).ok,false);
  assert.equal(fieldBookReady(field),true);
  assert.equal(fieldAction(field,'help-match',{request:'care',recordId:'field-observation-larva'}).ok,false);
  for (const [request,recordId] of [['observation','field-animal-butterfly'],['retry','field-seed-water'],['care','field-care-water']]) act(field,'help-match',{request,recordId});
  act(field,'tower-run');
  assert.equal(fieldAction(field,'chapter-complete').ok,false);
  assert.equal(fieldAction(field,'observation-plan',{subject:'',when:'',what:''}).ok,false);
  assert.deepEqual(field.chapters[4].plan,{subject:'',when:'',what:''});
  act(field,'observation-plan',{subject:'학교 화단 봉선화',when:'매주 월요일',what:'잎과 줄기의 모습을 그림과 글로 남기기'});
  assert.equal(fieldReady(field),true);act(field,'chapter-complete');
  assert.equal(fieldCompletedCount(field),5);
  const restored=restoreField(JSON.stringify(field));
  assert.equal(fieldCompletedCount(restored),5);assert.equal(fieldRecords(restored).length,12);
  assert.deepEqual(restored.chapters[4],field.chapters[4]);
});

test('restore rejects completion flags, fabricated records and invalid immutable runs',() => {
  assert.deepEqual(restoreField('bad json'),initialField());
  const raw=initialField();raw.completed=[0,1,2,3,4];raw.active=4;raw.preview=true;
  raw.chapters[1].rounds[0].run={a:{water:true,warm:true},b:{water:true,warm:true},prepared:{a:{soil:true,seeds:3},b:{soil:true,seeds:3}},prediction:'b'};
  raw.chapters[1].rounds[0].photos=[0,3,7];raw.chapters[1].rounds[0].reason='water';
  raw.chapters[4].records=['made-up'];
  const field=restoreField(raw);
  assert.deepEqual(field.completed,[]);assert.equal(field.active,0);assert.equal(field.preview,undefined);
  assert.equal(field.chapters[1].rounds[0].run,null);assert.deepEqual(field.chapters[4].records,[]);
});

test('restore keeps usable partial progress and bounds malformed drawing and attempts',() => {
  const raw=initialField();raw.chapters[0].inspected.egg=[0,0,1,8,'0'];
  raw.chapters[0].order=['egg','egg','egg','egg'];
  raw.chapters[0].drawing=[[[0,0],[.5,.5],[Infinity,0]],null];
  raw.attempts=[{chapter:1,action:'seed-report',message:'물과 온도를 비교해 봐.'},null];
  const field=restoreField(raw);
  assert.deepEqual(field.chapters[0].inspected.egg,[0,1]);
  assert.deepEqual(field.chapters[0].order,initialField().chapters[0].order);
  assert.deepEqual(field.chapters[0].drawing,[[[0,0],[.5,.5]]]);assert.equal(field.attempts.length,1);
});

test('revisiting completed chapters preserves earned evidence and rewards after save and restore',() => {
  const field=completedThrough(1), records=fieldRecords(field);
  act(field,'chapter-replay',{chapter:0});act(field,'film-move',{from:0,to:3});
  act(field,'observation-note',{text:''});assert.equal(fieldReady(field,0),false);
  assert.equal(fieldCompletedCount(field),2);assert.deepEqual(fieldRecords(field),records);
  const restored=restoreField(JSON.stringify(field));
  assert.equal(fieldCompletedCount(restored),2);assert.equal(fieldUnlocked(restored,2),true);
  assert.deepEqual(fieldRecords(restored),records);
  const corrupted=initialField();corrupted.completed=[0];corrupted.snapshots={0:{generation:'next-egg'}};
  assert.equal(fieldCompletedCount(restoreField(corrupted)),0);
});

test('teacher preview unlocks entry while requiring genuine work and is discarded on restore',() => {
  const field=initialField();field.preview=true;
  act(field,'chapter-enter',{chapter:2});assert.equal(fieldAction(field,'chapter-complete').ok,false);
  finishCare(field);act(field,'chapter-complete');assert.equal(field.completed.includes(2),true);
  const restored=restoreField(field);assert.equal(restored.preview,undefined);assert.equal(restored.active,0);assert.deepEqual(restored.completed,[]);
});

test('chapter restart clears only the active challenge and preserves earned records, rewards and published book',() => {
  const field=completedThrough(3);composeBook(field);
  for (const [request,recordId] of [['observation','field-animal-butterfly'],['retry','field-seed-water'],['care','field-care-water']]) act(field,'help-match',{request,recordId});
  act(field,'tower-run');
  act(field,'observation-plan',{subject:'학교 봉선화',when:'매주 월요일',what:'잎과 줄기를 그림으로 남기기'});act(field,'chapter-complete');
  const records=fieldRecords(field),book=structuredClone(field.chapters[4]);
  for (const chapter of [0,1,2,3,4]) {
    act(field,'chapter-restart',{chapter});
    assert.equal(field.active,chapter);assert.equal(fieldReady(field,chapter),false);
    assert.deepEqual(field.chapters[chapter],initialField().chapters[chapter]);
    assert.equal(fieldCompletedCount(field),5);assert.deepEqual(fieldRecords(field),records);
  }
  assert.deepEqual(field.snapshots[4],book);
  const restored=restoreField(JSON.stringify(field));
  assert.equal(restored.active,4);assert.equal(fieldReady(restored,4),false);
  assert.equal(fieldCompletedCount(restored),5);assert.deepEqual(fieldRecords(restored),records);
  assert.deepEqual(restored.snapshots[4],book);
  act(restored,'chapter-enter',{chapter:0});finishObservation(restored);
  act(restored,'observation-note',{text:'이번에는 어른벌레의 날개를 더 자세히 그렸어.'});act(restored,'chapter-complete');
  assert.deepEqual(fieldRecords(restored),records);
  assert.deepEqual(restoreField(JSON.stringify(restored)).snapshots[4],book);
  assert.equal(fieldAction(initialField(),'chapter-restart',{chapter:0}).ok,false);
});


test('streamlined garden reuses real butterfly observation and records only visited seasons',()=>{
 const f=completedThrough(2);act(f,'chapter-enter',{chapter:3});
 assert.deepEqual(f.chapters[3].animals.butterfly.photos,[0,3]);
 assert.deepEqual(f.chapters[3].animals.dog.photos,[0]);
 act(f,'animal-time',{animal:'dog',step:2});assert.equal(roomPhase(f),'animal-birth');
 act(f,'animal-generation',{answer:'different'});
 act(f,'plant-tag',{plant:'apple'});
 let saved=restoreField(f);assert.deepEqual(saved.chapters[3].plantPhotos,['apple-0']);
 act(saved,'plant-tag',{plant:'balsam'});assert.equal(roomPhase(saved),'seasons');
 act(saved,'season',{step:4});assert.equal(roomPhase(saved),'seasons');
 assert.ok(!saved.chapters[3].plantPhotos.includes('apple-3'));
 // Seeing winter after next spring opens the same-or-new choice right away; no separate compare click.
 act(saved,'season',{step:3});assert.equal(saved.chapters[3].season,3);assert.equal(saved.chapters[3].seasonCompared,true);
 assert.equal(roomPhase(saved),'plant-identity');assert.notEqual(roomUI({field:saved},{}).nextAction,'season-compare');
 act(saved,'plant-classify',{plant:'apple',answer:'same'});act(saved,'plant-classify',{plant:'balsam',answer:'new'});
 for(const card of SORT_CARDS.filter(c=>CORE_PLANT_CARDS.includes(c.id)))act(saved,'transfer',{card:card.id,bin:card.bin});
 assert.equal(fieldReady(saved),true);assert.equal(roomPhase(saved),'ready');
 const restored=restoreField(saved);assert.equal(fieldReady(restored),true);
});

test('first completed experiment prepares the second without copying its answer',()=>{
 const f=initialField();act(f,'chapter-enter',{chapter:0});finishObservation(f);act(f,'chapter-complete');act(f,'chapter-enter',{chapter:1});
 for(const side of ['a','b'])act(f,'seed-prepare',{side,soil:true,seeds:3});
 act(f,'seed-predict',{choice:'a'});act(f,'seed-condition',{key:'water'});act(f,'seed-run');act(f,'seed-day',{day:7});act(f,'seed-report',{reason:'water',result:'b',expectation:'changed'});act(f,'seed-next');
 assert.deepEqual(f.chapters[1].rounds[1].prepared,{a:{soil:true,seeds:3},b:{soil:true,seeds:3}});
 assert.equal(f.chapters[1].rounds[1].prediction,'');assert.equal(roomPhase(f),'design');
 assert.equal(roomPhase(restoreField(f)),'design');
});

test('additional discovery can be skipped and resumed without granting completion',()=>{
 const f=initialField();finishObservation(f);assert.equal(roomPhase(f),'ready');
 assert.match(roomUI({field:f},{}).controls,/선택/);act(f,'discovery-enter');assert.equal(roomPhase(f),'discovery');
 const saved=restoreField(f);assert.equal(roomPhase(saved),'discovery');assert.deepEqual(saved.completed,[]);
 act(saved,'discovery-exit');assert.equal(roomPhase(saved),'ready');act(saved,'chapter-complete');assert.deepEqual(saved.completed,[0]);
});


test('one observed feature per butterfly form is enough and evidence contains only what was seen',()=>{
 const f=initialField();for(const form of FIELD_FORMS)act(f,'inspect',{form,spot:1});
 assert.equal(roomPhase(f),'draw');
 for(const form of FIELD_FORMS){const record=fieldRecords(f).find(r=>r.id==='field-observation-'+form);assert.deepEqual(record.fieldEvidence.spots,[1]);}
 assert.equal(roomPhase(restoreField(f)),'draw');
});

test('older partial garden saves remain completable without photo buttons',()=>{
 const f=completedThrough(2);act(f,'chapter-enter',{chapter:3});
 f.chapters[3].animals={butterfly:{step:0,photos:[]},dog:{step:0,photos:[]}};
 act(f,'animal-time',{animal:'butterfly',step:0});act(f,'animal-time',{animal:'butterfly',step:3});
 act(f,'animal-time',{animal:'dog',step:0});act(f,'animal-time',{animal:'dog',step:2});
 assert.equal(roomPhase(f),'animal-birth');
 act(f,'animal-generation',{answer:'different'});act(f,'plant-tag',{plant:'apple'});
 f.chapters[3].plantPhotos=[];
 const restored=restoreField(f);act(restored,'plant-tag',{plant:'balsam'});assert.equal(roomPhase(restored),'seasons');
});

test('tower claims accept only records that show the claimed change',() => {
  const field=completedThrough(3);composeBook(field);
  // Region 3 holds an unrelated plant photo: same region, but no animal growth.
  act(field,'book-record',{id:'field-season-apple'});
  for (const recordId of ['field-observation-larva','field-season-apple']) {
    const result=fieldAction(field,'help-match',{request:'observation',recordId});
    assert.equal(result.ok,false);assert.match(result.message,/변화 전후가 함께 보이는 기록/);
  }
  assert.equal(field.chapters[4].matches.observation,undefined);
  // Re-picking the region's time-series record makes it valid evidence.
  act(field,'book-record',{id:'field-animal-butterfly'});
  act(field,'help-match',{request:'observation',recordId:'field-animal-butterfly'});
  assert.equal(fieldAction(field,'help-match',{request:'retry',recordId:'field-care-water'}).ok,false);
  act(field,'help-match',{request:'retry',recordId:'field-seed-water'});
  act(field,'help-match',{request:'care',recordId:'field-care-water'});
  act(field,'tower-run');
});

test('one-condition evidence narrows the claim to the condition that was compared',() => {
  const field=completedThrough(3);composeBook(field);
  const text=request => towerClaimText(field,TOWER_CLAIMS.find(c => c.request === request));
  assert.equal(text('retry'),'씨앗이 싹트려면 물이 필요해.');
  assert.equal(text('care'),'식물은 물이 부족하면 겉모습으로 신호를 보내.');
  act(field,'book-record',{id:'field-seed-warm'});act(field,'book-record',{id:'field-care-light'});
  assert.equal(text('retry'),'씨앗이 싹트려면 알맞은 온도가 필요해.');
  assert.equal(text('care'),'식물은 빛이 부족하면 겉모습으로 신호를 보내.');
});

test('a finished tower that linked a close-up keeps its completion and the learner pick after restore',() => {
  const field=completedThrough(3);composeBook(field);
  for (const [request,recordId] of [['observation','field-animal-butterfly'],['retry','field-seed-water'],['care','field-care-water']]) act(field,'help-match',{request,recordId});
  act(field,'tower-run');act(field,'observation-plan',{subject:'학교 봉선화',when:'매주 월요일',what:'잎과 줄기를 사진으로 남기기'});act(field,'chapter-complete');
  // Saved by the earlier version, where a single close-up was accepted.
  const old=JSON.parse(JSON.stringify(field));old.chapters[4].matches.observation='field-observation-larva';old.snapshots[4].matches.observation='field-observation-larva';
  const restored=restoreField(JSON.stringify(old));
  assert.equal(fieldCompletedCount(restored),5);
  assert.equal(restored.chapters[4].matches.observation,'field-observation-larva');
  assert.equal(restored.chapters[4].plan.subject,'학교 봉선화');
  // An unfinished tower drops the unsupported link and asks again.
  const draft=completedThrough(3);composeBook(draft);
  const raw=JSON.parse(JSON.stringify(draft));raw.chapters[4].matches={observation:'field-observation-larva'};
  assert.equal(restoreField(JSON.stringify(raw)).chapters[4].matches.observation,undefined);
});

test('the last time-dial frame stays until the learner finishes observing, and nothing of it is saved',() => {
  const field=completedThrough(0);act(field,'chapter-enter',{chapter:1});
  for (const side of ['a','b']) act(field,'seed-prepare',{side,soil:true,seeds:3});
  act(field,'seed-predict',{choice:'b'});act(field,'seed-condition',{key:'water'});act(field,'seed-run');
  const before=roomPhase(field);assert.equal(before,'grow');
  act(field,'seed-day',{day:7});holdObservation(field,before,'seed-day');
  assert.equal(roomPhase(field),'grow');
  const ui=roomUI({field},{});assert.equal(ui.nextAction,'observation-done');assert.equal(ui.next,'관찰을 마쳤어요');
  assert.equal(roomPhase(restoreField(JSON.stringify(field))),'reason');
  releaseObservation(field);assert.equal(roomPhase(field),'reason');
  // Other actions never hold the screen.
  holdObservation(field,'reason','seed-report');assert.equal(roomPhase(field),'reason');
});
