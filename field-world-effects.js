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
 const reduced=ctx.s.settings.reducedMotion,restoring=ctx.ui.restoreChapter;
 v.worldMasks=[];
 for(const chapter of ctx.s.field.completed){
  const region=RESTORED_LANDMARKS[chapter];if(!region)continue;
  const [cx,cy]=region.center.map((n,i)=>n*[1280,800][i]);
  const [w,h]=region.size.map((n,i)=>n*[1280,800][i]);
  const mask=v.make.graphics({add:false}).fillStyle(0xffffff).fillEllipse(cx,cy,w,h);
  v.worldMasks.push(mask);
  const awake=v.pic('forestMap',640,400,1280,800).setDisplaySize(1280,800).setMask(mask.createGeometryMask());
  const fresh=restoring===chapter;
  awake.setAlpha(fresh&&!reduced?0:1);
  if(fresh&&!reduced)v.tweens.add({targets:awake,alpha:1,duration:1700,ease:'Sine.easeInOut'});
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
