import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/game-model.js';
import {preparedState} from './inquiry-fixture.js';
test('Phaser 저장은 이전 탐구를 읽어 오되 기존 키와 내용을 덮어쓰지 않는다',()=>{const old=JSON.stringify(preparedState(3)),data=new Map([[G.STORAGE_KEY,old]]),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};const s=G.loadGame(storage);assert.deepEqual(s.completed,JSON.parse(old).completed);s.discovery.note='새 관찰';assert.ok(G.saveGame(storage,s));assert.equal(data.get(G.STORAGE_KEY),old);assert.equal(G.loadGame(storage).discovery.note,'새 관찰');});
test('저장이 차단되면 실패를 돌려주고 새 관찰 상태를 제공한다',()=>{const storage={getItem(){throw Error('blocked');},setItem(){throw Error('quota');}};assert.deepEqual(G.loadGame(storage).completed,[]);assert.equal(G.saveGame(storage,G.fresh()),false);});
test('걸어가는 경로는 모든 구역 사이에서 연결된 숲길만 지난다',()=>{for(const a of G.DOORS)for(const b of G.DOORS){const route=G.route(a,b);assert.equal(route[0],a);assert.equal(route.at(-1),b);for(let i=1;i<route.length;i++)assert.ok(G.EDGES.some(([x,y])=>x===route[i-1]&&y===route[i]||y===route[i-1]&&x===route[i]));}});
test('실행을 마친 실험 조건은 재방문 중 바뀌지 않는다',()=>{const s=preparedState(5),before=JSON.stringify(s.seed);assert.equal(G.changeCondition(s,'seed','a','water'),false);assert.equal(JSON.stringify(s.seed),before);assert.equal(G.changeCondition(s,'greenhouse','b','light'),false);});
test('돌봄은 원인에 맞는 도구와 시간이 필요하며 다시 눌러도 관찰을 잃지 않는다',()=>{const s=G.fresh();s.greenhouse.b.light=false;s.recovery.cause='light';assert.equal(G.repair(s,'water'),false);assert.equal(G.careStep(s,2),false);assert.equal(G.repair(s,'light'),true);assert.deepEqual(s.inquiry.care.seen,[0]);assert.ok(G.careStep(s,2));assert.deepEqual(s.inquiry.care.seen,[0,2]);assert.equal(G.repair(s,'light'),true);assert.equal(s.inquiry.care.step,2);assert.deepEqual(s.inquiry.care.seen,[0,2]);});
test('겨울과 다음 봄의 방문은 개체 판정을 대신하지 않는다',()=>{const s=G.fresh();G.seasonStep(s,0);G.seasonStep(s,3);G.seasonStep(s,4);assert.deepEqual(s.archives.plantSeen,['balsam-0','apple-0','balsam-3','apple-3']);assert.equal(!!G.ready(s,6),false);assert.equal(s.inquiry.season.labels.balsam,null);});
test('잘못 놓은 분류는 완료 위치를 덮어쓰지 않고 시도로 남는다',()=>{const s=G.fresh();assert.ok(G.classify(s,'dog','live'));assert.equal(G.classify(s,'dog','egg'),false);assert.equal(s.garden.placements.dog,'live');assert.equal(s.inquiry.garden.draft.dog,'egg');});
test('관찰을 반복해도 필수 증거 공간을 소진하지 않는다',()=>{const s=G.fresh(),p={x:.4,y:.6,zoom:2};for(let i=0;i<70;i++)assert.ok(G.capturePin(s,'egg',p));for(const id of ['larva','pupa','adult'])assert.ok(G.capturePin(s,id,p));assert.equal(s.inquiry.evidence.length,4);assert.ok(G.phaseReady(s,0));});

function fakeStorage(entries=[]){
 const data=new Map(entries),faults={read:false,write:false},writes=[];
 const storage={getItem(key){if(faults.read)throw Error('blocked');return data.has(key)?data.get(key):null;},setItem(key,value){if(faults.write)throw Error('quota');writes.push([key,value]);data.set(key,value);}};
 return {storage,data,faults,writes};
}

test('없는 저장 키만 새 기록으로 취급하고 첫 저장을 허용한다',()=>{
 const {storage,data}=fakeStorage(),s=G.loadGame(storage);
 assert.equal(G.getSaveStatus(storage).reason,'new');assert.equal(G.getSaveStatus(storage).ok,true);
 s.discovery.note='새로 관찰한 메모';assert.equal(G.saveGame(storage,s),true);
 assert.equal(JSON.parse(data.get(G.GAME_KEY)).discovery.note,s.discovery.note);
});

test('깨진 JSON·null·미지원 버전·필수 구조 오류는 반복 저장해도 원문이 보존된다',()=>{
 const wrongDrawing=G.fresh();wrongDrawing.discovery.drawing={};
 const wrongChapters=G.fresh();wrongChapters.field.chapters=[];
 const futureField=G.fresh();futureField.field.version=2;
 const wrongInquiry=G.fresh();wrongInquiry.inquiry.evidence=null;
 const wrongDiscoveries=G.fresh();wrongDiscoveries.field.chapters[0].discovery={};
 const wrongSnapshots=G.fresh();wrongSnapshots.field.snapshots[0]={note:'남아 있는 원문'};
 for(const[raw,reason]of [['{unfinished','invalid-json'],['','invalid-json'],['null','invalid-structure'],['[]','invalid-structure'],['{"version":99}','unsupported-version'],['{"version":3}','invalid-structure'],[JSON.stringify(wrongDrawing),'invalid-structure'],[JSON.stringify(wrongChapters),'invalid-structure'],[JSON.stringify(wrongInquiry),'invalid-structure'],[JSON.stringify(futureField),'unsupported-version'],[JSON.stringify(wrongDiscoveries),'invalid-structure'],[JSON.stringify(wrongSnapshots),'invalid-structure']]){
  const {storage,data,writes}=fakeStorage([[G.GAME_KEY,raw],[G.STORAGE_KEY,JSON.stringify(preparedState(1))]]);
  for(let attempt=0;attempt<3;attempt++){
   const s=G.loadGame(storage);assert.equal(G.getSaveStatus(storage).reason,reason);
   s.discovery.note='임시 화면에서 쓴 메모';assert.equal(G.saveGame(storage,s),false);
   const status=G.getSaveStatus(storage);assert.equal(status.ok,false);assert.equal(status.raw,raw);assert.equal(status.sourceKey,G.GAME_KEY);
  }
  assert.equal(data.get(G.GAME_KEY),raw);assert.equal(writes.length,0);
 }
});

test('읽기 실패 때 쓰기 기능이 살아 있어도 빈 기본값으로 덮어쓰지 않는다',()=>{
 const raw=JSON.stringify(preparedState(1)),f=fakeStorage([[G.GAME_KEY,raw]]);f.faults.read=true;
 G.loadGame(f.storage);assert.equal(G.saveGame(f.storage,G.fresh()),false);
 assert.equal(G.getSaveStatus(f.storage).reason,'read-failed');assert.equal(G.getSaveStatus(f.storage).expectedRaw,null);
 assert.equal(f.data.get(G.GAME_KEY),raw);assert.equal(f.writes.length,0);
 f.faults.read=false;assert.equal(G.saveGame(f.storage,G.fresh()),false);assert.equal(f.data.get(G.GAME_KEY),raw);
});

test('용량 부족 후에는 실패 상태와 마지막 저장본을 유지하고 다시 저장할 수 있다',()=>{
 const raw=JSON.stringify(G.fresh()),f=fakeStorage([[G.GAME_KEY,raw]]),s=G.loadGame(f.storage);s.discovery.note='용량 부족 뒤 남길 메모';f.faults.write=true;
 assert.equal(G.saveGame(f.storage,s),false);assert.equal(G.getSaveStatus(f.storage).reason,'write-failed');assert.equal(G.getSaveStatus(f.storage).ok,false);assert.equal(f.data.get(G.GAME_KEY),raw);
 f.faults.write=false;assert.equal(G.saveGame(f.storage,s),true);assert.equal(G.getSaveStatus(f.storage).ok,true);
 assert.equal(JSON.parse(f.data.get(G.GAME_KEY)).discovery.note,s.discovery.note);
});

test('다른 창의 새 기록을 발견하면 자동 저장과 오래된 초기화 확인을 막는다',()=>{
 const raw=JSON.stringify(G.fresh()),f=fakeStorage([[G.GAME_KEY,raw]]),s=G.loadGame(f.storage),before=G.getSaveStatus(f.storage).expectedRaw;
 const changed=G.fresh();changed.discovery.note='다른 창에서 새로 저장';const changedRaw=JSON.stringify(changed);f.data.set(G.GAME_KEY,changedRaw);
 s.discovery.note='오래된 창의 메모';assert.equal(G.saveGame(f.storage,s),false);
 assert.equal(G.getSaveStatus(f.storage).reason,'conflict');assert.equal(G.getSaveStatus(f.storage).raw,changedRaw);
 assert.equal(G.resetGame(f.storage,G.fresh(),before),false);assert.equal(f.data.get(G.GAME_KEY),changedRaw);
 assert.equal(G.saveGame(f.storage,s),false);assert.equal(f.writes.length,0);
 const latest=G.getSaveStatus(f.storage).expectedRaw;assert.equal(G.resetGame(f.storage,G.fresh(),latest),true);assert.equal(G.getSaveStatus(f.storage).ok,true);
});

test('빈 상태로 열었어도 다른 창이 첫 저장을 하면 덮어쓰지 않는다',()=>{
 const f=fakeStorage(),s=G.loadGame(f.storage),before=G.getSaveStatus(f.storage).expectedRaw,raw=JSON.stringify(preparedState(1));f.data.set(G.GAME_KEY,raw);
 assert.equal(G.saveGame(f.storage,s),false);assert.equal(G.resetGame(f.storage,G.fresh(),before),false);assert.equal(f.data.get(G.GAME_KEY),raw);
});

test('지원하는 구버전의 진행·그림·사진은 보존하며 원래 키는 유지한다',()=>{
 for(const version of [2,3]){
  const legacy=preparedState(1);legacy.version=version;if(version===2)delete legacy.inquiry;
  const key=version===2?G.LEGACY_KEY:G.STORAGE_KEY,raw=JSON.stringify(legacy),f=fakeStorage([[key,raw]]),s=G.loadGame(f.storage);
  assert.equal(G.getSaveStatus(f.storage).reason,'migrated');assert.deepEqual(s.completed,legacy.completed);assert.deepEqual(s.discovery.drawing,legacy.discovery.drawing);assert.deepEqual(s.journey.shots,legacy.journey.shots);assert.equal(s.discovery.note,legacy.discovery.note);
  assert.equal(G.saveGame(f.storage,s),true);assert.equal(f.data.get(key),raw);assert.equal(JSON.parse(f.data.get(G.GAME_KEY)).version,3);
 }
});

test('이전 field 기록은 추가 퀘스트 속성이 없어도 이어서 저장한다',()=>{
 const prior=G.fresh();for(const chapter of prior.field.chapters)delete chapter.discovery;
 prior.field.chapters[0].drawing=[[[.1,.2],[.3,.4],[.5,.6]]];prior.field.chapters[0].note='잎맥을 보았어';
 const f=fakeStorage([[G.GAME_KEY,JSON.stringify(prior)]]),s=G.loadGame(f.storage);
 assert.equal(G.getSaveStatus(f.storage).ok,true);assert.deepEqual(s.field.chapters[0].drawing,prior.field.chapters[0].drawing);assert.equal(G.saveGame(f.storage,s),true);
});

test('읽지 못한 구버전 원문도 보관하며 새 키 자동 생성을 막는다',()=>{
 const raw='{legacy broken',f=fakeStorage([[G.STORAGE_KEY,raw]]),s=G.loadGame(f.storage),status=G.getSaveStatus(f.storage);
 assert.equal(status.sourceKey,G.STORAGE_KEY);assert.equal(status.raw,raw);assert.equal(G.saveGame(f.storage,s),false);assert.equal(f.data.has(G.GAME_KEY),false);
 assert.equal(G.resetGame(f.storage,G.fresh(),status.expectedRaw),true);assert.equal(f.data.get(G.STORAGE_KEY),raw);
});

test('초기화 확인 중 구버전 원문이 바뀌어도 오래된 확인을 거절한다',()=>{
 const f=fakeStorage([[G.STORAGE_KEY,'{broken']]);G.loadGame(f.storage);const before=G.getSaveStatus(f.storage).expectedRaw,next=JSON.stringify(preparedState(1));f.data.set(G.STORAGE_KEY,next);
 assert.equal(G.resetGame(f.storage,G.fresh(),before),false);assert.equal(f.data.has(G.GAME_KEY),false);assert.equal(f.data.get(G.STORAGE_KEY),next);
});
