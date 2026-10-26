import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.Phaser={Scene:class{},CANVAS:1,Scale:{RESIZE:5,NO_CENTER:0},Game:class{constructor(config){this.scene=new config.scene();}}};
const {createFieldGame}=await import('../src/field-scenes.js');
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} ≈ ${expected}`);

function viewport(width,height,cssScale=1){
 const {scene}=createFieldGame({mode:()=> 'room'});
 const camera={x:0,y:0,originX:.5,originY:.5,scrollX:0,scrollY:0,
  stopFollow(){},setRotation(){},removeBounds(){},
  setViewport(x,y,w,h){Object.assign(this,{x,y,width:w,height:h});},
  setZoom(zoom){this.zoom=this.zoomX=this.zoomY=zoom;},
  centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;},
 };
 scene.scale={gameSize:{width,height}};scene.cameras={main:camera};
 scene.game={canvas:{getBoundingClientRect:()=>({width:width*cssScale,height:height*cssScale})}};
 scene.configureViewport('room');return {scene,camera};
}

for(const [width,height] of [[1280,600],[873,420],[812,420]])test(`${width}px 활동영역에서 화면·그림·시간 손잡이가 같은 좌표를 사용한다`,()=>{
 const {scene,camera}=viewport(width,height,.85),zoom=Math.min(width/1184,height/600);
 const center={x:Math.floor(width/2+.5),y:Math.floor(height/2+.5)};
 close(scene.screenScale(),zoom*.85);
 // The independently specified room centre must land in the viewport centre.
 const projectedCenter=scene.projectWorld({x:656,y:440});close(projectedCenter.x,center.x);close(projectedCenter.y,center.y);
 for(const point of [{x:64,y:140},{x:1248,y:740},{x:610,y:230},{x:1080,y:535},{x:1070,y:397}]){
  const pixels=scene.projectWorld({...point,w:48,h:48}),restored=scene.pointerWorld(pixels);
  close(pixels.x,center.x+(point.x-656)*zoom);close(pixels.y,center.y+(point.y-440)*zoom);
  close(restored.x,point.x);close(restored.y,point.y);close(pixels.w,48*camera.zoom);close(pixels.h,48*camera.zoom);
  assert.ok(pixels.x>=-.5&&pixels.x<=width+.5);assert.ok(pixels.y>=-.5&&pixels.y<=height+.5);
 }
});

test('지도를 따라가는 카메라의 이동·확대도 문 좌표와 입력 좌표에 같이 반영한다',()=>{
 const {scene,camera}=viewport(873,420);camera.setZoom(.8);camera.scrollX=140;camera.scrollY=75;
 const marker={x:900,y:530,w:120,h:60},pixels=scene.projectWorld(marker);
 close(pixels.x,437+(900-140-436.5)*.8);close(pixels.y,210+(530-75-210)*.8);
 const world=scene.pointerWorld(pixels);close(world.x,marker.x);close(world.y,marker.y);
 close(pixels.w,96);close(pixels.h,48);
});
