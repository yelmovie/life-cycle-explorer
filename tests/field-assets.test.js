import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Phaser={Scene:class{},CANVAS:1,Scale:{ENVELOP:1,CENTER_BOTH:2},Game:class{constructor(config){this.scene=new config.scene();}}};
const {createFieldGame}=await import('../field-scenes.js');

function assets(chapter=1){
 const events=[],textures=new Set(['forestMap','ipsae','guideLook','guideStory','walker','doto']),queued=[],handlers=new Map();
 const context={s:{field:{active:chapter}},mode:()=> 'room',modalOpen:()=>false,focusTargets(){},emit:(type)=>events.push(type)};
 const {scene}=createFieldGame(context);
 scene.load={image(key){queued.push(key);},spritesheet(){},on(event,fn){handlers.set(event,fn);},once(event,fn){handlers.set(event,fn);},start(){}};
 scene.preload();queued.length=0;
 scene.textures={exists:key=>textures.has(key)};scene.input={enabled:true,removeAllListeners(){}};
 scene.tweens={killAll(){}};scene.time={removeAllEvents(){}};scene.children={removeAll(){}};
 const camera={stopFollow(){},setZoom(){return this;},setBounds(){return this;},centerOn(){}};
 scene.cameras={main:camera};scene.pic=()=>({setDisplaySize(){}});scene.add={rectangle(){}};scene.label=()=>{};
 return {scene,context,events,textures,queued,handlers};
}

for(const chapter of [1,2,3,4])test(`${chapter+1}단계는 배경과 도구를 불러온 뒤에만 활동을 연다`,()=>{
 const a=assets(chapter);a.scene.refresh();
 assert.equal(a.scene.loading,true);assert.equal(a.scene.input.enabled,false);
 assert.ok(a.queued.includes(['fieldClearing','bg2','bg4','gardenSeasons','bg8'][chapter]));assert.ok(a.queued.length>1);
 assert.deepEqual(a.events,['assets-loading']);
});

test('실패한 배경은 한 번 재시도하고, 계속 실패하면 활동 대신 복구 화면을 연다',()=>{
 const a=assets();a.scene.refresh();
 for(const key of a.queued)a.textures.add(key);a.textures.delete('bg2');
 a.handlers.get('loaderror')({key:'bg2'});a.queued.length=0;a.handlers.get('complete')();
 assert.deepEqual(a.queued,['bg2']);
 a.handlers.get('loaderror')({key:'bg2'});a.handlers.get('complete')();
 assert.equal(a.scene.input.enabled,false);assert.ok(a.scene.assetFailure);
 assert.equal(a.events.filter(e=>e==='assets-unavailable').length,1);
 // Refreshes while disconnected must not create an endless request/dialog loop.
 a.scene.refresh();assert.equal(a.events.filter(e=>e==='assets-unavailable').length,1);
});

test('다시 불러오기는 실패 목록을 풀고 같은 구역의 그림을 새로 요청한다',()=>{
 const a=assets();a.scene.failed.add('bg2');a.scene.assetAttempts.set('bg2',2);a.scene.assetFailure='room:1:bg2';
 a.scene.retryAssets();assert.equal(a.scene.failed.size,0);assert.ok(a.queued.includes('bg2'));assert.equal(a.scene.loading,true);
 a.handlers.get('filecomplete')('bg2');assert.equal(a.scene.failed.has('bg2'),false);
});

test('복구된 그림은 다음 화면의 입력을 다시 열고 탐구 상태를 바꾸지 않는다',()=>{
 const a=assets(),before=JSON.stringify(a.context.s.field);a.scene.assetFailure='room:1:bg2';
 a.scene.retryAssets();for(const key of a.queued)a.textures.add(key);
 a.context.mode=()=> 'map';a.scene.input.on=()=>{};let rendered=false;a.scene.map=()=>{rendered=true;};
 a.handlers.get('complete')();assert.equal(rendered,true);assert.equal(a.scene.input.enabled,true);
 assert.equal(a.scene.assetFailure,null);assert.equal(JSON.stringify(a.context.s.field),before);assert.equal(a.events.at(-1),'loaded');
});

test('첫 화면은 지도·걷기 그림을 미리 받지 않고 바로 열린다',()=>{
 const a=assets();a.context.mode=()=> 'title';a.textures.clear();let rendered=false;a.scene.map=()=>{rendered=true;};
 a.scene.refresh();assert.deepEqual(a.queued,[]);assert.equal(rendered,true);assert.equal(a.events.at(-1),'loaded');
});

test('누락된 그림은 지훈 캐릭터로 대체하지 않는다',()=>{
 const a=assets(),original=createFieldGame(a.context).scene;let rendered;
 original.textures={exists:()=>false};original.add={image(x,y,key){rendered=key;return {width:100,height:100,setScale(){return this;}};}};
 original.pic('bg2',640,400,1280,800);assert.equal(rendered,'__MISSING');assert.notEqual(rendered,'guideLook');
});
