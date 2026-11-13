import {reducedMotion} from './game-motion.js';
// Restored landmarks use the exact original pixels, so buildings never jump
// when the learner earns a chapter. Only completed regions regain full light.
export const RESTORED_LANDMARKS=[
 {center:[.173,.337],size:[.31,.31],lights:[[.17,.36],[.128,.367],[.216,.368]]},
 {center:[.454,.182],size:[.31,.30],lights:[[.455,.224],[.403,.219],[.505,.217]]},
 {center:[.718,.264],size:[.30,.39],lights:[[.714,.307],[.678,.291],[.753,.289]]},
 {center:[.806,.642],size:[.31,.35],lights:[[.797,.632],[.861,.654],[.755,.694]]},
 {center:[.451,.514],size:[.28,.49],lights:[[.449,.632],[.407,.622],[.491,.621]]},
];

export function lightRestoredLandmarks(v,ctx){
 const reduced=reducedMotion(ctx.s.settings),restoring=ctx.ui.restoreChapter;
 v.worldMasks=[];
 for(const chapter of ctx.s.field.completed){
  const region=RESTORED_LANDMARKS[chapter];if(!region)continue;
  const [cx,cy]=region.center.map((n,i)=>n*[1280,800][i]);
  const [w,h]=region.size.map((n,i)=>n*[1280,800][i]);
  const fresh=restoring===chapter;
  // Three nested colour layers feather the edge of the woken region.
  const layers=[[1.18,.35],[1.07,.6],[1,1]].map(([k,a])=>{
   const mask=v.make.graphics({add:false}).fillStyle(0xffffff).fillEllipse(cx,cy,w*k,h*k);v.worldMasks.push(mask);
   const awake=v.pic('forestMap',640,400,1280,800).setDisplaySize(1280,800).setMask(mask.createGeometryMask());
   awake.setAlpha(fresh&&!reduced?0:a);if(fresh&&!reduced)v.tweens.add({targets:awake,alpha:a,duration:1700,ease:'Sine.easeInOut'});
   return awake;
  });
  // Warm sunlight and drifting sparkles say "alive" at a glance.
  const sun=v.add.ellipse(cx,cy,w*.9,h*.8,0xfff0a8,fresh&&!reduced?0:.13).setBlendMode('ADD');
  if(fresh&&!reduced)v.tweens.add({targets:sun,fillAlpha:.13,duration:1700});
  if(!reduced)for(let i=0;i<7;i++){
   const sx=cx+(Math.random()-.5)*w*.7,sy=cy+(Math.random()-.5)*h*.6,dot=v.add.circle(sx,sy,3,0xfff6c8,0).setBlendMode('ADD');
   v.tweens.add({targets:dot,y:sy-26,fillAlpha:{from:0,to:.9},duration:1600+i*170,delay:i*260,yoyo:true,repeat:-1});
  }
  if(fresh&&!reduced){
   const ring=v.add.ellipse(cx,cy,w*.2,h*.2).setStrokeStyle(6,0xfff1b0,.9).setDepth(21);
   v.tweens.add({targets:ring,scaleX:5,scaleY:5,alpha:0,duration:1400,ease:'Cubic.easeOut',onComplete:()=>ring.destroy()});
   for(let i=0;i<18;i++){const a=i/18*Math.PI*2,p=v.add.star(cx,cy,5,4,9,0xffe08a).setDepth(21);v.tweens.add({targets:p,x:cx+Math.cos(a)*w*.42,y:cy+Math.sin(a)*h*.42,angle:180,alpha:0,duration:1300,delay:200,ease:'Cubic.easeOut',onComplete:()=>p.destroy()});}
  }
  for(const [index,point] of region.lights.entries()){
   const x=point[0]*1280,y=point[1]*800,glow=v.add.graphics();
   for(let r=24;r>=5;r-=3)glow.fillStyle(0xffe2a4,.018).fillCircle(x,y,r);
   const window=v.add.ellipse(x,y,10,15,0xfff3bf,.85);
   if(fresh&&!reduced){glow.setAlpha(0);window.setAlpha(0);v.tweens.add({targets:[glow,window],alpha:1,delay:350+index*190,duration:700});}
   else if(!reduced)v.tweens.add({targets:glow,alpha:.55,duration:1800+index*200,yoyo:true,repeat:-1});
  }
  // A small, persistent detail tied to the actual activity, painted behind the HUD and avatar.
  const [px,py]=region.lights[0],x=px*1280+26,y=py*800+16;
  const prop=v.add.graphics().setDepth(3);
  prop.fillStyle(0x273e31,.32).fillEllipse(x,y+10,39,10);
  if(chapter===0){ // potted sprout
   prop.fillStyle(0xb77a52).fillRoundedRect(x-10,y,20,11,3);
   prop.lineStyle(2,0x517f45,1).lineBetween(x,y,x,y-16);
   prop.fillStyle(0x90bb68).fillEllipse(x-4,y-11,9,6).fillEllipse(x+5,y-15,10,6);
  }else if(chapter===1){ // sun and rain over the greenhouse bed
   prop.fillStyle(0x847d53).fillRoundedRect(x-15,y+2,30,9,3);
   prop.fillStyle(0xffd17a).fillCircle(x+6,y-11,7);
   prop.fillStyle(0x94c7bd).fillEllipse(x-7,y-8,9,13);
  }else if(chapter===2){ // pollinator
   prop.fillStyle(0xffd483).fillEllipse(x,y-5,17,10);
   prop.fillStyle(0x6d6245).fillRect(x-3,y-9,4,8);
   prop.fillStyle(0xe8f7d3,.9).fillEllipse(x-4,y-11,10,6).fillEllipse(x+5,y-12,10,6);
  }else if(chapter===3){ // seasonal bed
   prop.fillStyle(0xa9704d).fillRoundedRect(x-16,y+2,32,9,3);
   [0xf6b395,0xffda85,0xb5d886].forEach((color,i)=>{const xx=x-9+i*9;prop.lineStyle(2,0x5b864b).lineBetween(xx,y+1,xx,y-8-i*2);prop.fillStyle(color).fillCircle(xx,y-8-i*2,4);});
  }else{ // lamp at the life clock
   prop.fillStyle(0x6f513b).fillRoundedRect(x-9,y-13,18,24,3);
   prop.fillStyle(0xffd172).fillRoundedRect(x-6,y-10,12,15,2);
   prop.lineStyle(2,0xfff2b3).lineBetween(x,y-8,x,y+3);
  }
  if(fresh&&!reduced){prop.setAlpha(0);v.tweens.add({targets:prop,alpha:1,delay:220,duration:580});}
 }
}
