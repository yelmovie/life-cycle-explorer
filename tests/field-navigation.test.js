import test from 'node:test';
import assert from 'node:assert/strict';
import {POINTS,DOORS} from '../game-model.js';

// Exercise the actual scene's travel lifecycle with controlled animation callbacks.
globalThis.Phaser={Scene:class{},CANVAS:1,Scale:{ENVELOP:1,CENTER_BOTH:2},Game:class{constructor(config){this.scene=new config.scene();}}};
const {createFieldGame}=await import('../field-scenes.js');
function navigation(){
 const events=[],s={avatar:{x:POINTS[0][0],y:POINTS[0][1]},settings:{reducedMotion:true}},context={s,mode:()=> 'map',modalOpen:()=>false,emit:(type,data)=>events.push({type,data})};
 const {scene}=createFieldGame(context),pending=[],timers=[];
 scene.avatar={x:s.avatar.x*1280,y:s.avatar.y*800,setFrame(){return this;}};
 scene.tweens={killTweensOf(){pending.length=0;},add(tween){pending.push(tween);}};
 scene.time={addEvent(){const timer={removed:false,remove(){this.removed=true;}};timers.push(timer);return timer;}};
 const finish=()=>{let limit=100;while(pending.length&&limit--){const tween=pending.shift();scene.avatar.x=tween.x;scene.avatar.y=tween.y;tween.onComplete();}assert.ok(limit>0,'a route must terminate');};
 return {scene,s,events,pending,timers,finish,context};
}
test('도착 전에는 입장하지 않고, 경로를 마치면 해당 구역에 한 번만 입장한다',()=>{
 const n=navigation();n.scene.walkDoor(0);assert.equal(n.scene.walking,true);assert.deepEqual(n.events,[{type:'travel-start',data:0}]);n.finish();assert.equal(n.scene.walking,false);assert.deepEqual(n.s.avatar,{x:POINTS[DOORS[0]][0],y:POINTS[DOORS[0]][1]});assert.deepEqual(n.events.filter(e=>e.type==='arrived'),[{type:'arrived',data:0}]);
});
test('이동 중 목적지를 바꾸면 이전 도착 콜백이 새 위치나 입장을 덮어쓰지 않는다',()=>{
 const n=navigation();n.scene.walkDoor(0);const stale=n.pending[0],before={...n.s.avatar};n.scene.walkDoor(3);assert.equal(n.timers[0].removed,true);const count=n.events.length;stale.onComplete();assert.deepEqual(n.s.avatar,before);assert.equal(n.events.length,count);n.finish();assert.deepEqual(n.events.filter(e=>e.type==='arrived'),[{type:'arrived',data:3}]);assert.deepEqual(n.s.avatar,{x:POINTS[DOORS[3]][0],y:POINTS[DOORS[3]][1]});
});
test('같은 목적지를 중복 누르거나 모달이 열렸을 때 새 이동을 중복 시작하지 않는다',()=>{
 const n=navigation();n.scene.walkDoor(1);n.scene.walkDoor(1);assert.equal(n.events.filter(e=>e.type==='travel-start').length,1);n.context.modalOpen=()=>true;n.scene.walkDoor(2);assert.equal(n.events.filter(e=>e.type==='travel-start').length,1);n.finish();assert.deepEqual(n.events.filter(e=>e.type==='arrived'),[{type:'arrived',data:1}]);
});
test('안내창 때문에 이동을 멈추면 뒤늦은 콜백으로 구역에 입장하지 않는다',()=>{
 const n=navigation();n.scene.walkDoor(4);const stale=n.pending[0],before={...n.s.avatar};n.scene.cancelTravel();stale.onComplete();n.finish();assert.equal(n.scene.walking,false);assert.deepEqual(n.s.avatar,before);assert.deepEqual(n.events.filter(e=>e.type==='arrived'),[]);assert.equal(n.timers[0].removed,true);
});
