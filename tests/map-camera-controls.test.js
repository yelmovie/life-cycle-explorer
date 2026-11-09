import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.Phaser={Scene:class{},CANVAS:1,Scale:{RESIZE:1,NO_CENTER:0},Game:class{constructor(config){this.scene=new config.scene();}}};
const {createFieldGame}=await import('../src/field-scenes.js');
test('overview fits the complete map between HUD bars and hand mode restores camera bounds',()=>{
 const context={mode:()=> 'map',s:{settings:{reducedMotion:true}},ui:{}};
 const {scene}=createFieldGame(context);scene.avatar={x:400,y:300};scene.tweens={killTweensOf(){}};
 const camera={zoom:1,bounded:true,follow:true,resetFX(){},stopFollow(){this.follow=false;return this;},removeBounds(){this.bounded=false;},setBounds(){this.bounded=true;return this;},setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.center={x,y};},startFollow(){this.follow=true;return this;},setFollowOffset(){return this;}};
 scene.cameras={main:camera};scene.mapZoom=1.2;scene.mapFollowOffset=0;
 for(const [width,height] of [[1024,768],[1920,1080],[1280,800]]){
  scene.viewport={width,height,insets:{top:100,bottom:140}};scene.setMapOverview(true);
  assert.equal(camera.follow,false);assert.equal(camera.bounded,false);
  assert.ok(1280*camera.zoom<=width);assert.ok(800*camera.zoom<=height-240);
  scene.setMapHand(true,true);assert.equal(camera.bounded,true);assert.ok(Math.abs(camera.zoom-1.8)<1e-10);
  scene.setMapOverview(false);assert.equal(camera.follow,true);assert.equal(camera.zoom,1.2);
 }
});
