import {SORT_CARDS} from '../src/field-content.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {initialField,fieldAction,fieldReady,fieldRecords,restoreField,FIELD_FORMS} from '../src/field-model.js';
import {applyQuest,questReady,questInfo} from '../src/field-quests.js';
import {roomPhase,roomUI} from '../src/field-flow.js';
import {normalizeDiscovery} from '../src/field-quest-state.js';

const act=(f,type,p={})=>{const r=fieldAction(f,type,p);assert.equal(r.ok,true,`${type}: ${r.message}`);return r;};
const quest=(f,step,p)=>{const r=applyQuest(f,{step,...p});assert.equal(r.ok,true,r.message);return r;};
function readyField(){
 const f=initialField();
 for(let c=0;c<5;c++){
  act(f,'chapter-enter',{chapter:c});
  if(c===0){
   for(const form of FIELD_FORMS)for(const spot of [0,1])act(f,'inspect',{form,spot});
   act(f,'observation-draw',{stroke:[[.1,.1],[.4,.3],[.6,.2]]});act(f,'observation-note',{text:'몸의 마디와 다리를 자세히 관찰했다.'});
   FIELD_FORMS.forEach((form,to)=>act(f,'film-move',{from:f.chapters[0].order.indexOf(form),to}));act(f,'generation',{target:'next-egg'});
  }else if(c===1){
   for(const key of ['water','warm']){
    for(const side of ['a','b'])act(f,'seed-prepare',{side,soil:true,seeds:3});act(f,'seed-predict',{choice:'unsure'});act(f,'seed-condition',{key});act(f,'seed-run');
    for(const day of [0,3,7]){act(f,'seed-day',{day});act(f,'seed-photo');}act(f,'seed-report',{reason:key,result:'b',expectation:'unsure'});if(key==='water')act(f,'seed-next');
   }
  }else if(c===2){
   for(const variable of ['water','light']){
    for(const sensor of ['water','light'])act(f,'care-measure',{sensor});act(f,'care-pin',{symptom:variable==='water'?'dry':'pale'});act(f,'care-photo');act(f,'care-tool',{tool:variable});act(f,'care-day',{day:2});act(f,'care-photo');if(variable==='water')act(f,'care-next');
   }
  }else if(c===3){
   for(const animal of ['butterfly','dog'])for(const step of [0,animal==='butterfly'?3:2]){act(f,'animal-time',{animal,step});act(f,'animal-photo',{animal});}act(f,'animal-generation',{answer:'different'});
   for(const plant of ['apple','balsam'])act(f,'plant-tag',{plant});for(const step of [0,3,4]){act(f,'season',{step});for(const plant of ['apple','balsam'])act(f,'season-photo',{plant});}
   for(const [plant,answer]of [['apple','same'],['balsam','new']])act(f,'plant-classify',{plant,answer});for(const c of SORT_CARDS)act(f,'transfer',{card:c.id,bin:c.bin});
  }else{
   for(const id of ['field-observation-larva','field-seed-water','field-care-water','field-animal-butterfly'])act(f,'book-record',{id});act(f,'book-title',{text:'나의 생명 탐험'});
   for(const id of f.chapters[4].records.slice(0,2))act(f,'book-caption',{id,text:'직접 관찰한 모습을 비교해 기록했다.'});act(f,'book-summary',{text:'조건과 생물에 따라 자라며 달라지는 모습이 다르다는 것을 발견했다.'});
   for(const [request,recordId]of [['observation','field-observation-larva'],['retry','field-seed-water'],['care','field-care-water']])act(f,'help-match',{request,recordId});act(f,'tower-run');act(f,'observation-plan',{subject:'학교 화단의 봉선화',when:'매주 월요일',what:'같은 자리에서 잎과 꽃이 달라지는 모습을 찍기'});
  }
  assert.equal(fieldReady(f),true);act(f,'chapter-complete');
 }
 return f;
}
function finishQuest(f,c){
 f.active=c;
 if(c===0)for(const[step,target]of [[0,'larva'],[1,'adult']]){quest(f,step,{kind:'connect',target});quest(f,step,{kind:'record'});}
 if(c===1){quest(f,0,{kind:'repair',setting:'warm'});quest(f,0,{kind:'verify'});for(const clue of ['water','temperature','time'])quest(f,1,{kind:'check',clue});quest(f,1,{kind:'decide',choice:'observe'});}
 if(c===2){for(const clue of ['water','light'])quest(f,0,{kind:'check',clue});quest(f,0,{kind:'decide',choice:'keep'});quest(f,1,{kind:'mark',spot:'new-leaf'});quest(f,1,{kind:'record'});}
 if(c===3){quest(f,0,{kind:'track',mark:'A-01'});quest(f,0,{kind:'record'});for(const item of ['same-view','regular','leave-growing'])quest(f,1,{kind:'plan',item});quest(f,1,{kind:'record'});}
 if(c===4){for(const type of ['observation','retry','care'])quest(f,0,{kind:'stamp',recordId:fieldRecords(f).find(r=>r.fieldEvidence.type===type).id});quest(f,1,{kind:'question',text:'우리 학교의 봉선화는 언제부터 씨앗을 만들까?'});}
 assert.equal(questReady(f),true);
}

test('new discoveries require real core work and an ordered step',()=>{
 const f=initialField();assert.equal(applyQuest(f,{step:0,kind:'connect',target:'larva'}).ok,false);assert.deepEqual(f.chapters[0].discovery,[]);
 const ready=readyField();ready.active=1;assert.equal(applyQuest(ready,{step:1,kind:'check',clue:'water'}).ok,false);assert.equal(questReady(ready),false);
 assert.match(questInfo(ready).objective,/1\/2/);
});

test('all five discovery missions complete without changing core evidence and award their stamp once',()=>{
 const f=readyField(),records=structuredClone(fieldRecords(f));
 for(let c=0;c<5;c++){
  finishQuest(f,c);const before=JSON.stringify(f.chapters[c].discovery),result=applyQuest(f,{step:1,kind:'record'});
  assert.equal(result.ok,true);assert.equal(result.reward,undefined);assert.equal(JSON.stringify(f.chapters[c].discovery),before);
 }
 assert.deepEqual(fieldRecords(f),records);assert.deepEqual(f.completed,[0,1,2,3,4]);
 const restored=restoreField(JSON.stringify(f));
 for(let c=0;c<5;c++){assert.equal(questReady(restored,c),true);assert.deepEqual(restored.chapters[c].discovery,f.chapters[c].discovery);}
});

test('science misconceptions fail without granting discovery progress',()=>{
 const f=readyField();
 for(const[c,p]of [[0,{kind:'connect',target:'egg'}],[1,{kind:'repair',setting:'water'}],[2,{kind:'decide',choice:'more-water'}],[3,{kind:'track',mark:'B-02'}],[4,{kind:'stamp',recordId:'made-up-record'}]]){
  f.active=c;const before=JSON.stringify(f.chapters[c].discovery);assert.equal(applyQuest(f,{step:0,...p}).ok,false);assert.equal(JSON.stringify(f.chapters[c].discovery),before);
 }
 f.active=1;quest(f,0,{kind:'repair',setting:'warm'});quest(f,0,{kind:'verify'});assert.equal(applyQuest(f,{step:1,kind:'decide',choice:'dead'}).ok,false);
 f.active=2;for(const clue of ['water','light'])quest(f,0,{kind:'check',clue});quest(f,0,{kind:'decide',choice:'keep'});assert.equal(applyQuest(f,{step:1,kind:'mark',spot:'stem'}).ok,false);
});

test('partial discoveries survive restore but invented and skipped evidence is discarded',()=>{
 const f=readyField();f.active=1;quest(f,0,{kind:'repair',setting:'warm'});
 const restored=restoreField(f);assert.equal(restored.chapters[1].discovery[0].aWarm,true);assert.equal(questReady(restored,1),false);
 const raw=initialField();raw.chapters[1].discovery=[{aWarm:true,verified:true},{checks:['water','temperature','time'],decision:'observe'}];assert.deepEqual(restoreField(raw).chapters[1].discovery,[]);
 assert.deepEqual(normalizeDiscovery(4,[{stamps:{observation:'invented'}},{question:'어떤 생물이 언제 꽃을 피울까?'}],[]),[{stamps:{}}]);
});

test('learner questions are real saved writing and require the three actual evidence stamps first',()=>{
 const f=readyField();f.active=4;assert.equal(applyQuest(f,{step:1,kind:'question',text:'우리 학교 봉선화는 언제 꽃이 필까?'}).ok,false);
 for(const type of ['observation','retry','care'])quest(f,0,{kind:'stamp',recordId:fieldRecords(f).find(r=>r.fieldEvidence.type===type).id});
 assert.equal(applyQuest(f,{step:1,kind:'question',text:'몰라'}).ok,false);assert.equal(applyQuest(f,{step:1,kind:'question',text:'aaaaaaaaaaaaa'}).ok,false);
 quest(f,1,{kind:'question',text:'우리 학교 봉선화는 언제 꽃이 필까?'});assert.match(f.chapters[4].discovery[1].question,/봉선화/);
});

test('previously completed explorers can visit discoveries without losing original progress',()=>{
 const f=readyField();f.active=2;const completed=[...f.completed],records=structuredClone(fieldRecords(f));
 assert.equal(roomPhase(f),'ready');assert.match(roomUI({field:f},{}).controls,/새 발견 미션/);
 act(f,'discovery-enter',{chapter:2});assert.equal(roomPhase(f),'discovery');
 const restored=restoreField(f);assert.equal(roomPhase(restored),'discovery');
 assert.deepEqual(restored.completed,completed);assert.deepEqual(fieldRecords(restored),records);
 finishQuest(restored,2);assert.equal(roomPhase(restored),'ready');assert.deepEqual(restored.completed,completed);
});
