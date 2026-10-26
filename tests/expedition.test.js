import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/game-model.js';
import {preparedState} from './inquiry-fixture.js';

function at(chapter){const s=G.restore(JSON.stringify(preparedState(chapter*2)));s.screen='mission';s.mission=chapter*2+1;s.phase[s.mission]=1;s.expedition=G.initialExpedition();assert.ok(G.startQuest(s,chapter));return s;}
function solve(s,c){
  if(c===0)for(const x of G.CLUES)assert.ok(G.questAction(s,'match',{id:x.id,target:x.target}).ok);
  if(c===1)for(const x of G.SEED_CASES){
    assert.ok(G.questAction(s,'seed-adjust',{key:x.question}).ok);
    assert.ok(G.questAction(s,'seed-run').ok);
    assert.ok(G.questAction(s,'seed-time',{day:7}).ok);
    assert.ok(G.questAction(s,'seed-record').ok);
  }
  if(c===2)for(const x of G.CARE_CASES){
    for(const key of ['water','light'])assert.ok(G.questAction(s,'care-measure',{key}).ok);
    assert.ok(G.questAction(s,'care-tool',{key:x.cause}).ok);
    assert.ok(G.questAction(s,'care-time',{day:2}).ok);
    assert.ok(G.questAction(s,'care-record').ok);
  }
  if(c===3)for(const x of G.GARDEN_CASES)assert.ok(G.questAction(s,'garden-match',{id:x.id,target:x.target}).ok);
  if(c===4)for(const x of G.FINAL_CASES){const record=G.questRecords(s).find(x.accept);assert.ok(G.questAction(s,'record-match',{id:record.id,target:x.id}).ok);}
}
test('기존 완료·그림·책을 보존하며 새 의뢰나 보상을 만들어 넣지 않는다',()=>{
  const old=preparedState(9),s=G.restore(JSON.stringify(old));
  assert.deepEqual(s.completed,old.completed);assert.deepEqual(s.discovery,old.discovery);assert.deepEqual(s.book,old.book);
  assert.equal(G.restoredChapters(s),0);assert.deepEqual(s.expedition,G.initialExpedition());
});
test('학습과 선수 활동 없이 의뢰를 시작하거나 구역 보상을 받을 수 없다',()=>{
  const s=G.fresh();s.screen='mission';s.mission=1;
  assert.equal(G.startQuest(s,0),false);assert.equal(G.complete(s,1),false);
  assert.equal(G.questAction(s,'match',{id:'leaf',target:'larva'}).ok,false);
  const ready=at(0);assert.equal(G.complete(ready,1),false);solve(ready,0);assert.ok(G.complete(ready,1));
});
test('틀린 관찰 단서를 수정해도 연결한 기록을 잃지 않고 다음 세대를 구별한다',()=>{
  const s=at(0);assert.ok(G.questAction(s,'match',{id:'leaf',target:'larva'}).ok);
  assert.equal(G.questAction(s,'match',{id:'leaf',target:'egg'}).ok,false);assert.equal(s.expedition.clues.leaf,'larva');
  assert.equal(G.questSolved(s,0),false);solve(s,0);assert.ok(G.questSolved(s,0));
});
test('새 씨앗은 한 조건만 바꿔 비교하며 두 문제 모두 시간과 결과 기록이 필요하다',()=>{
  const s=at(1);assert.equal(G.questAction(s,'seed-record').ok,false);
  G.questAction(s,'seed-adjust',{key:'warm'});assert.equal(G.questAction(s,'seed-run').ok,false);
  G.questAction(s,'seed-adjust',{key:'warm'});G.questAction(s,'seed-adjust',{key:'water'});G.questAction(s,'seed-run');
  const before=structuredClone(s.expedition.seeds[0]);assert.equal(G.questAction(s,'seed-adjust',{key:'warm'}).ok,false);assert.deepEqual(s.expedition.seeds[0],before);
  assert.equal(G.questAction(s,'seed-record').ok,false);G.questAction(s,'seed-time',{day:7});G.questAction(s,'seed-record');
  assert.equal(G.questSolved(s,1),false);G.questAction(s,'seed-adjust',{key:'warm'});G.questAction(s,'seed-run');G.questAction(s,'seed-time',{day:7});G.questAction(s,'seed-record');assert.ok(G.questSolved(s,1));
});
test('두 센서·알맞은 돌봄·시간·새잎 기록을 모두 요구하고 오답은 진도를 보존한다',()=>{
  const s=at(2);assert.equal(G.questAction(s,'care-tool',{key:'water'}).ok,false);
  G.questAction(s,'care-measure',{key:'water'});G.questAction(s,'care-measure',{key:'light'});
  assert.equal(G.questAction(s,'care-tool',{key:'light'}).ok,false);assert.equal(s.expedition.care[0].tool,null);
  G.questAction(s,'care-tool',{key:'water'});G.questAction(s,'care-time',{day:1});assert.equal(G.questAction(s,'care-record').ok,false);
  G.questAction(s,'care-time',{day:2});G.questAction(s,'care-record');assert.equal(G.questSolved(s,2),false);
  G.questAction(s,'care-measure',{key:'water'});G.questAction(s,'care-measure',{key:'light'});G.questAction(s,'care-tool',{key:'light'});G.questAction(s,'care-time',{day:2});G.questAction(s,'care-record');assert.ok(G.questSolved(s,2));
});
test('새 장미도 같은 개체의 표식으로 판단하고 최종 연결에는 실제 증거만 쓴다',()=>{
  const garden=at(3);assert.equal(G.questAction(garden,'garden-match',{id:'rose',target:'new'}).ok,false);solve(garden,3);assert.ok(G.questSolved(garden,3));
  const s=at(4),obs=G.questRecords(s).find(r=>r.evidence.type==='observation');
  assert.equal(G.questAction(s,'record-match',{id:obs.id,target:'experiment'}).ok,false);
  assert.equal(G.questAction(s,'record-match',{id:'not-a-record',target:'cycle'}).ok,false);
  solve(s,4);assert.ok(G.questSolved(s,4));s.inquiry.evidence=[];assert.equal(G.questSolved(s,4),false);
});
test('중단한 의뢰의 도구·조건·관찰 시간·기록 연결이 저장 복원된다',()=>{
  for(let c=0;c<5;c++){const s=at(c);solve(s,c);assert.deepEqual(G.restore(JSON.stringify(s)),s);}
  const s=at(2);G.questAction(s,'care-measure',{key:'water'});assert.deepEqual(G.restore(JSON.stringify(s)),s);
});
test('손상된 신규 의뢰 저장은 안전하게 보정하고 없는 기록이나 시간으로 완료하지 않는다',()=>{
  const s=at(1);s.expedition={version:1,active:99,clues:[],seeds:[{after:{water:false,warm:false},running:true,day:Infinity,recorded:true}],care:[{measured:'waterlight',tool:'water',day:2,recorded:true}],final:{experiment:'missing'}};
  const r=G.restore(JSON.stringify(s));assert.equal(r.expedition.active,null);assert.equal(G.questSolved(r,1),false);assert.equal(G.questSolved(r,2),false);assert.deepEqual(r.expedition.final,{});
});
test('모든 탐구·다섯 의뢰·증거·작품을 마치면 보상이 연결되고 완료가 중복되지 않는다',()=>{
  const s=G.restore(JSON.stringify(preparedState()));s.expedition=G.initialExpedition();s.screen='mission';
  for(let c=0;c<5;c++){
    assert.ok(G.complete(s,c*2));s.mission=c*2+1;assert.ok(G.startQuest(s,c));solve(s,c);assert.ok(G.complete(s,s.mission));assert.ok(G.complete(s,s.mission));
    assert.equal(G.restoredChapters(s),c+1);assert.equal(s.completed.length,(c+1)*2);
  }
  assert.deepEqual(G.restore(JSON.stringify(s)),s);
});
