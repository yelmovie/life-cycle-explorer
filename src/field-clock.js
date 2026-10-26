import {reducedMotion} from './game-motion.js';
// The face of the illustration is offset from its bounding box by the crank.
export function clockFace(key,width,height,size=204){
 const scale=Math.min(size/width,size/height);
 const origin=key==='seasonCompass'?[.5,.525]:[.407,.51];
 return {scale,origin,radius:(key==='seasonCompass'?width*.24:width*.25)*scale};
}
export const clockAngle=(value,max)=>-Math.PI/2+Math.max(0,Math.min(max,value))/max*Math.PI*2;

export function renderLifeClock(v,ctx,key,x,y,value,max,event,labels,size=204){
 const k=size/204,image=v.pic(key,x,y,size).setInteractive({useHandCursor:true});
 const face=clockFace(key,image.width,image.height);
 image.setOrigin(...face.origin);const radius=face.radius;
 const facePaint=v.add.graphics(),ticks=v.add.graphics(),hand=v.add.graphics();
 // The seasonal reference contains a painted pointer. A clean face lets the
 // real pointer rotate without leaving a second, frozen pointer underneath.
 if(key==='seasonCompass')facePaint.fillStyle(0xfaf3dc).fillCircle(x,y,radius*.98);
 ticks.lineStyle(1.5,0x617759,.8);
 for(let i=0;i<24;i++){
  const a=i*Math.PI/12,r1=radius*(i%2?.87:.80),r2=radius*.94;
  ticks.lineBetween(x+Math.cos(a)*r1,y+Math.sin(a)*r1,x+Math.cos(a)*r2,y+Math.sin(a)*r2);
 }
 const caption=v.label(x,y+128*k,labels?.[value]??`${value}일째`,22,225);
 const instruction=event.startsWith('animal-')?null:v.text(x,y-126*k,'시간 손잡이를 돌려 봐',18,245);
 let next=value,moved=false;const draw=n=>{
  const a=clockAngle(n,max),long=radius*.72,short=radius*.40;
  hand.clear().lineStyle(5,0x285b45,1).lineBetween(x,y,x+Math.cos(a)*long,y+Math.sin(a)*long);
  const hour=-Math.PI/2+(n/max)*Math.PI/2;
  hand.lineStyle(3,0x8e6436,1).lineBetween(x,y,x+Math.cos(hour)*short,y+Math.sin(hour)*short);
  hand.fillStyle(0x285b45).fillCircle(x,y,6).fillStyle(0xfff9e9).fillCircle(x,y,2);
 };
 const clockKey=event+':'+x+':'+y,previous=ctx.ui.clockValues?.[clockKey];
 ctx.ui.clockValues??={};ctx.ui.clockValues[clockKey]=value;
 const state={n:Number.isFinite(previous)?previous:value};draw(state.n);
 if(state.n!==value&&!reducedMotion(ctx.s.settings))v.tweens.add({targets:state,n:value,duration:650,ease:'Cubic.easeInOut',onUpdate:()=>draw(state.n)});
 else draw(value);
 const commit=n=>ctx.emit(event,Math.max(0,Math.min(max,n)));
 v.input.setDraggable(image);
 image.on('pointerdown',()=>{moved=false;});
 image.on('drag',p=>{
  moved=true;const point=v.pointerWorld?.(p)||p;let angle=Math.atan2(point.y-y,point.x-x)+Math.PI/2;
  if(angle<0)angle+=Math.PI*2;next=Math.round(angle/(Math.PI*2)*max);
  draw(next);caption.setText(labels?.[next]??`${next}일째`);
 });
 image.on('dragend',()=>commit(next));
 image.on('pointerup',()=>{if(!moved)commit(value===max?0:value+1);});
 const step=(dx,delta,label)=>{
  const bg=v.add.circle(x+dx,y+86*k,23,0xfffbec).setStrokeStyle(2,0x3f735c);
  v.text(x+dx,y+84*k,delta<0?'−':'+',28,45);v.click(x+dx,y+86*k,48,48,()=>commit(value+delta),label);
  return bg;
 };
 step(-61*k,-1,'시간 한 단계 이전');step(61*k,1,'시간 한 단계 다음');
 v.focusTargets.push({x,y,w:125,h:125,label:'시간 손잡이 한 단계 앞으로',fn:()=>commit(value===max?0:value+1)});
 return {image,caption,hand,instruction};
}
