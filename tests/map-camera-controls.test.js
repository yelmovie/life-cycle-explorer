import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Phaser={Scene:class{},CANVAS:1,Scale:{RESIZE:1,NO_CENTER:0},Game:class{constructor(config){this.scene=new config.scene();}}};
const {createFieldGame}=await import('../src/field-scenes.js');
test('overview fits between the HUD bars and returns to the previous follow or hand view',()=>{
 const context={mode:()=> 'map',s:{settings:{reducedMotion:true}},ui:{}};
 const {scene}=createFieldGame(context);scene.avatar={x:400,y:300};scene.tweens={killTweensOf(){}};
 const camera={zoom:1,bounded:true,follow:true,resetFX(){},stopFollow(){this.follow=false;return this;},removeBounds(){this.bounded=false;},setBounds(){this.bounded=true;return this;},setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.center={x,y};},startFollow(){this.follow=true;return this;},setFollowOffset(){return this;}};
 scene.cameras={main:camera};scene.mapZoom=1.2;scene.mapFollowOffset=0;
 for(const [width,height] of [[1024,768],[1920,1080],[1280,800]]){
  scene.viewport={width,height,insets:{top:100,bottom:140}};scene.setMapOverview(true);
  assert.equal(camera.follow,false);assert.equal(camera.bounded,false);
  assert.ok(1280*camera.zoom<=width);assert.ok(800*camera.zoom<=height-240);
  scene.setMapOverview(false);assert.equal(camera.follow,true);assert.equal(camera.bounded,true);assert.equal(camera.zoom,1.2);
  context.ui.mapHand=true;camera.zoom=1.8;
  scene.setMapOverview(true);scene.setMapOverview(false);
  assert.equal(camera.follow,false);assert.equal(camera.bounded,true);assert.ok(Math.abs(camera.zoom-1.8)<1e-10);assert.equal(context.ui.mapHand,true);
  context.ui.mapHand=false;scene.setMapHand(false);
 }
});
test('a HUD bar that grows on the map keeps the walk going and only refits the camera',()=>{
 const context={mode:()=> 'map',s:{settings:{reducedMotion:true}},ui:{}};
 const {scene}=createFieldGame(context);scene.avatar={x:400,y:300};
 const camera={zoom:1.2,bounds:null,offset:null,setBounds(...b){this.bounds=b;return this;},setFollowOffset(x,y){this.offset=[x,y];return this;}};
 scene.cameras={main:camera};scene.mapZoom=1.2;scene.walking=true;scene.walkTarget=7;
 let relayouts=0;scene.relayout=()=>{relayouts++;};
 scene.viewport={width:1280,height:800,zoom:1.1,insets:{top:52,bottom:124}};
 scene.hudInsets=()=>({top:52,bottom:128});
 scene.syncInsets();
 assert.equal(relayouts,0);assert.equal(scene.walking,true);assert.equal(scene.walkTarget,7);
 assert.deepEqual(scene.viewport.insets,{top:52,bottom:128});
 assert.deepEqual(camera.bounds,[0,-52/1.2,1280,800+180/1.2]);assert.deepEqual(camera.offset,[0,(52-128)/2/1.2]);
 context.mode=()=> 'room';scene.hudInsets=()=>({top:60,bottom:128});scene.syncInsets();
 assert.equal(relayouts,1);
});
