import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState,validExperiment,experimentIssue,seedLevel,growthLevel,ready,complete,restore,canEnter,species} from '../src/core.js';
test('새 연구는 첫 미션만 열리고 기록 없이 완료할 수 없다',()=>{const s=freshState();assert.equal(canEnter(s,0),true);assert.equal(canEnter(s,1),false);for(let n=0;n<10;n++)assert.equal(ready(s,n),false);});
test('실험 질문과 일치하는 단 하나의 조건만 달라야 한다',()=>{const s=freshState();assert.equal(validExperiment(s.seed,['water','warm']),false);s.seed.b.water=false;assert.equal(ready(s,2),true);s.seed.b.warm=false;assert.equal(ready(s,2),false);s.seed.b.water=true;assert.equal(ready(s,2),false);s.seed.question='warm';assert.equal(ready(s,2),true);});
test('발아 모형은 물과 알맞은 온도를 함께 요구한다',()=>{assert.equal(seedLevel({water:true,warm:true},7),3);assert.equal(seedLevel({water:false,warm:true},7),0);assert.equal(seedLevel({water:true,warm:false},7),0);});
test('조사하지 않는 공통 조건이 부적합한 실험은 결과 비교 전에 막는다',()=>{
 const s=freshState();s.seed.b.water=false;s.seed.a.warm=false;s.seed.b.warm=false;
 assert.equal(validExperiment(s.seed,['water','warm']),true);
 assert.equal(experimentIssue(s.seed,['water','warm']),'baseline');assert.equal(complete(s,2),false);
 s.seed.a.warm=true;s.seed.b.warm=true;
 assert.equal(experimentIssue(s.seed,['water','warm']),null);assert.equal(complete(s,2),true);
 s.green.sensors=['water','light'];s.green.b.light=false;s.green.a.water=false;s.green.b.water=false;
 assert.equal(validExperiment(s.green,['water','light']),true);
 assert.equal(experimentIssue(s.green,['water','light']),'baseline');assert.equal(complete(s,4),false);
});
test('이전 저장의 동률 실험 결과를 B의 성공으로 잘못 인정하지 않는다',()=>{
 const s=freshState();s.seedRun={question:'water',a:{water:true,warm:false},b:{water:false,warm:false}};
 s.snapshots=[0,7];s.seedConclusion='b';assert.equal(ready(s,3),false);
 s.greenRun={question:'light',a:{water:false,light:true},b:{water:false,light:false}};
 s.analysis={claim:'b',condition:'light',observation:'b'};assert.equal(ready(s,5),false);
});
test('완료한 실험은 조건의 독립적인 사본을 보관한다',()=>{const s=freshState();s.seed.b.water=false;assert.equal(complete(s,2),true);s.seed.a.water=false;assert.equal(s.seedRun.a.water,true);});
test('이전의 비유효 실험을 보완하면 완료 중복 없이 실험 사본을 다시 저장한다',()=>{
 const s=freshState();s.completed=[0,1,2];s.seed.b.water=false;s.seed.a.warm=false;s.seed.b.warm=false;s.seedRun=structuredClone(s.seed);
 assert.equal(complete(s,2),false);s.seed.a.warm=true;s.seed.b.warm=true;assert.equal(complete(s,2),true);
 assert.equal(s.seedRun.a.warm,true);assert.equal(s.seedRun.b.warm,true);assert.deepEqual(s.completed,[0,1,2]);
});
test('시간 기록은 서로 다른 시점을 비교하고 문장을 남겨야 한다',()=>{const s=freshState();s.comparison.note='날개가 새로 생겼다';assert.equal(ready(s,1),true);s.comparison.right=0;assert.equal(ready(s,1),false);});
test('발아 결과는 끝 시점 관찰과 조건에 맞는 결론을 요구한다',()=>{const s=freshState();s.seed.a.water=false;complete(s,2);s.snapshots=[0,3];s.seedConclusion='b';assert.equal(ready(s,3),false);s.snapshots.push(7);assert.equal(ready(s,3),true);s.seedConclusion='a';assert.equal(ready(s,3),false);});
test('온실 결과의 주장과 조건, 관찰 근거가 일치해야 한다',()=>{const s=freshState();s.green.sensors=['water','light'];s.green.b.light=false;assert.equal(complete(s,4),true);s.analysis={claim:'a',condition:'light',observation:'b'};assert.equal(ready(s,5),false);s.analysis.observation='a';assert.equal(ready(s,5),true);assert.ok(growthLevel(s.green.a,7)>growthLevel(s.green.b,7));});
test('동물과 식물에 각각 두 개의 비교 기준이 필요하다',()=>{const s=freshState();s.comparisons=[{kind:'animal',notes:[1,2]}];assert.equal(ready(s,6),false);s.comparisons.push({kind:'plant',notes:[1,2]});assert.equal(ready(s,6),true);});
test('분류만 정답이어도 근거와 새 사례가 없으면 완료되지 않는다',()=>{const s=freshState();for(const [id,x]of Object.entries(species))s.classification[id]=x.type;assert.equal(ready(s,7),false);for(const id of Object.keys(species))s.reasons[id]=id;s.transfer='perennial';assert.equal(ready(s,7),true);});
test('작품의 제목, 장면 수, 설명, 요약을 검증한다',()=>{const s=freshState();s.artifact={title:'나비의 한살이',summary:'자라면서 모습이 변한다',scenes:[{caption:'작은 알'},{caption:'몸이 긴 애벌레'},{caption:''}]};assert.equal(ready(s,8),true);s.artifact.scenes[1].caption='';assert.equal(ready(s,8),false);});
test('전 미션과 링, 완성한 결과물이 있어야 엔딩을 완료하고 중복 완료는 쌓이지 않는다',()=>{const s=freshState();s.completed=[0,1,2,3,4,5,6,7,8];s.artifact={title:'한살이 기록',summary:'생물은 자라면서 변화한다',scenes:[{caption:'작은 알'},{caption:'자란 애벌레'},{caption:''}]};s.rings=[0,1,2,3];assert.equal(ready(s,9),false);s.rings.push(4);assert.equal(complete(s,9),true);complete(s,9);assert.equal(s.completed.length,10);});
test('완료한 결과물을 다시 편집해 미완성이 되면 엔딩 완료를 막는다',()=>{
 const s=freshState();s.completed=[0,1,2,3,4,5,6,7,8];s.rings=[0,1,2,3,4];
 s.artifact={title:'한살이 기록',summary:'생물은 자라면서 변화한다',scenes:[{caption:'작은 알'},{caption:'자란 애벌레'},{caption:''}]};
 assert.equal(ready(s,9),true);s.artifact.scenes.pop();assert.equal(complete(s,9),false);assert.equal(s.completed.includes(9),false);
});
test('저장 복원은 기록을 유지하고 잠긴 화면, 손상된 JSON을 처리한다',()=>{const s=freshState();s.note='흰 날개가 있다';s.screen=8;const restored=restore(JSON.stringify(s));assert.equal(restored.note,s.note);assert.equal(restored.screen,'home');assert.deepEqual(restore('{broken'),freshState());});
test('관리자 전체 해금은 10개 미션을 함께 열고 학습 완료 기록을 바꾸지 않는다',()=>{const s=freshState();s.adminUnlocked=true;for(let n=0;n<10;n++)assert.equal(canEnter(s,n),true);assert.equal(canEnter(s,10),false);assert.equal(canEnter(s,-1),false);assert.deepEqual(s.completed,[]);s.adminUnlocked=false;assert.equal(canEnter(s,9),false);});
test('관리자와 소리 설정은 저장 복원되며 기존 저장에는 기본값을 적용한다',()=>{const s=freshState();s.adminUnlocked=true;s.sound=false;s.screen=9;const restored=restore(JSON.stringify(s));assert.equal(restored.screen,9);assert.equal(restored.adminUnlocked,true);assert.equal(restored.sound,false);delete s.adminUnlocked;delete s.sound;delete s.navigationHistory;const legacy=restore(JSON.stringify(s));assert.equal(legacy.adminUnlocked,false);assert.equal(legacy.sound,true);assert.deepEqual(legacy.navigationHistory,[]);});
test('부분 손상 저장은 안전한 기본값으로 보완하며 남아 있는 기록을 유지한다',()=>{
 const s=freshState();s.note='내가 남긴 관찰';s.navigationHistory=null;s.comparison={left:1};s.artifact={scenes:[null]};s.green.sensors=null;
 const restored=restore(JSON.stringify(s));assert.equal(restored.note,s.note);assert.deepEqual(restored.navigationHistory,[]);
 assert.deepEqual(restored.comparison,{left:1,right:3,note:''});assert.deepEqual(restored.artifact,{title:'',summary:'',scenes:[]});
 for(let n=0;n<10;n++)assert.doesNotThrow(()=>ready(restored,n));
});
test('저장 속 잘못된 ID와 중복 완료·링은 화면 오류나 거짓 완료를 만들지 않는다',()=>{
 const s=freshState();s.completed=[0,0,-1,99];s.rings=[0,0,1,99];s.pair=['missing',null];s.classification={dog:'live'};s.reasons={dog:'dog'};
 s.comparisons=[null,{ids:['butterfly','missing'],kind:'animal',notes:[]}];
 const restored=restore(JSON.stringify(s));assert.deepEqual(restored.completed,[0]);assert.deepEqual(restored.rings,[0,1]);assert.deepEqual(restored.pair,['butterfly','dog']);
 assert.deepEqual(restored.comparisons,[]);assert.equal(restored.classification.dog,'live');assert.equal(restored.reasons.dog,'dog');assert.equal(ready(restored,9),false);
});
