import test from 'node:test';
import assert from 'node:assert/strict';
import {initialField,fieldAction,seedObservation,careTimeLabels,fieldRecords} from '../field-model.js';

const act=(f,type,p={})=>fieldAction(f,type,p);
function seedField(){const f=initialField();f.preview=true;f.active=1;for(const side of ['a','b'])act(f,'seed-prepare',{side,soil:true,seeds:3});return f;}
function startRound(f){const r=f.chapters[1].rounds[f.chapters[1].round];for(const side of ['a','b'])act(f,'seed-prepare',{side,soil:true,seeds:3});act(f,'seed-predict',{choice:'unsure'});act(f,'seed-condition',{side:'b',key:r.variable,value:true});assert.equal(act(f,'seed-run').ok,true);return r;}
function finishSeed(f){const r=startRound(f);for(const day of [0,3,7]){act(f,'seed-day',{day});act(f,'seed-photo');}act(f,'seed-report',{reason:r.variable,result:'b',expectation:'unsure'});}

test('comparison start explains missing prediction and missing contrasting condition without silently starting',()=>{
 const f=seedField(),r=f.chapters[1].rounds[0];
 assert.match(act(f,'seed-run').message,/예상/);assert.equal(r.run,null);
 act(f,'seed-predict',{choice:'b'});
 assert.match(act(f,'seed-run').message,/B에 물 주기/);assert.equal(r.run,null);
});

test('one-variable experiment rejects changing the control and makes setting B water idempotent',()=>{
 const f=seedField(),r=f.chapters[1].rounds[0],before=structuredClone(r.b);
 assert.equal(act(f,'seed-condition',{key:'warm'}).ok,false);assert.deepEqual(r.b,before);
 assert.equal(act(f,'seed-condition',{side:'a',key:'water'}).ok,false);
 for(let i=0;i<2;i++)assert.equal(act(f,'seed-condition',{side:'b',key:'water',value:true}).ok,true);
 assert.equal(r.b.water,true);startRound(f);
 assert.deepEqual(r.run.a,{water:false,warm:true});assert.deepEqual(r.run.b,{water:true,warm:true});
});

test('water experiment has visible successive growth only in the watered pot and can return to the first observation',()=>{
 const f=seedField(),r=startRound(f);
 for(const [day,level]of [[0,0],[2,1],[4,2],[7,3]]){act(f,'seed-day',{day});assert.equal(seedObservation(r,'a').level,0);assert.equal(seedObservation(r,'b').level,level);}
 assert.match(seedObservation(r,'a').detail,/아직/);
 act(f,'seed-day',{day:0});assert.equal(seedObservation(r,'b').level,0);
});

test('temperature experiment keeps the same water in both pots and describes delayed cold germination without declaring the seed dead',()=>{
 const f=seedField();finishSeed(f);assert.equal(act(f,'seed-next').ok,true);const r=startRound(f);
 assert.equal(r.run.a.water,true);assert.equal(r.run.b.water,true);assert.equal(r.run.a.warm,false);assert.equal(r.run.b.warm,true);
 act(f,'seed-day',{day:7});assert.equal(seedObservation(r,'a').level,0);assert.equal(seedObservation(r,'b').level,3);
 assert.match(seedObservation(r,'a').detail,/낮은 온도.*아직/);assert.doesNotMatch(seedObservation(r,'a').detail,/죽|영원/);
});

test('light care uses observation stages rather than an unsupported universal two-day recovery claim',()=>{
 const f=initialField();f.preview=true;f.active=2;
 for(const variable of ['water','light']){
  const task=f.chapters[2].cases[f.chapters[2].case];
  for(const sensor of ['water','light'])act(f,'care-measure',{sensor});
  act(f,'care-pin',{symptom:variable==='water'?'dry':'pale'});act(f,'care-photo');
  act(f,'care-tool',{tool:variable});act(f,'care-day',{day:2});act(f,'care-photo');
  if(variable==='water')act(f,'care-next');else{
   assert.deepEqual(careTimeLabels(task),['돌봄 전','며칠 뒤','새잎이 자란 뒤']);
   const record=fieldRecords(f).find(r=>r.id==='field-care-light');assert.ok(record);assert.match(record.detail,/새잎이 자란 뒤/);assert.doesNotMatch(record.detail,/이틀/);
  }
 }
});
