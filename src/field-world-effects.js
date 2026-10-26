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
  if(fresh){
   const seal=v.label(cx,Math.max(190,cy-h*.35),'✓ 이곳의 시간이 깨어났어!',22,430).setDepth(22);
   if(!reduced)v.tweens.add({targets:seal,y:seal.y-12,alpha:0,delay:1900,duration:1000,onComplete:()=>seal.destroy()});
   else v.time.delayedCall(2500,()=>seal.destroy());
  }
 }
}
