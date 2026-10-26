import {reducedMotion} from './game-motion.js';
import {FORM_NAMES,FORM_TRAITS} from './field-content.js';

const FORMS=['egg','larva','pupa','adult'];
const PARTS={egg:['표면 보기','모양 보기'],larva:['몸마디 보기','다리 보기'],pupa:['겉모습 보기','모양 보기'],adult:['날개 보기','더듬이 보기']};
const POSITIONS={egg:[310,310,160/3],larva:[960,310,170],pupa:[310,535,145],adult:[960,535,128]};
// Feature centres in the actual square illustrations (0..1 coordinates).
const SPOTS={egg:[[.50,.42],[.50,.22]],larva:[[.36,.43],[.56,.57]],pupa:[[.54,.52],[.68,.18]],adult:[[.23,.33],[.63,.26]]};

/** Chapter 1 has visible, tappable steps as well as optional magnifier dragging. */
export function renderObservationRoom(v,ctx,phase){
 const q=ctx.s.field.chapters[0],act=(type,payload={})=>ctx.emit('act',{type,payload});
 const open=(form,spot)=>ctx.emit('observe',{form,spot});
 const button=(x,y,w,h,label,fn,done=false,z=50)=>{
  const text=v.text(x,y,(done?'✓ ':'')+label,22,w-14,done?'#356c47':'#244d3d').setDepth(z+1);h=Math.max(h,text.height+12);
  const plate=v.add.graphics().fillStyle(done?0xdcebd5:0xfffcf0,.98).fillRoundedRect(x-w/2,y-h/2,w,h,14).setDepth(z);
  return [plate,text,v.click(x,y,w,h,fn,label).setDepth(z+2)];
 };
 if(phase==='search'){
  const next=FORMS.flatMap(form=>[0,1].map(spot=>({form,spot}))).find(({form,spot})=>!q.inspected[form].includes(spot));
  const spots=[],specimens=[];
  // A quiet specimen mat, number and name separate each organism from the busy forest.
  for(const [i,id] of FORMS.entries()){
   const [x,y,size]=POSITIONS[id];
   v.paper(x-3,y+10,354,216);
   v.text(x,y-72,`${i+1}  ${FORM_NAMES[id]}${q.inspected[id].length===2?' · 기록 완료':''}`,26,320);
   // The egg remains one third its old displayed size; the whole mat is a large touch target.
   const specimenY=y+(id==='egg'?7:id==='adult'?-5:-3);
   specimens.push({id,x,y:specimenY,size});v.pic(id,x,specimenY,size,size);
   v.click(x,y-2,330,90,()=>{const spot=[0,1].find(n=>!q.inspected[id].includes(n))??0;focusSpot(id,spot);},FORM_NAMES[id]+' 확대해서 보기');
   for(const spot of [0,1]){
    const bx=x+(spot?79:-79),by=y+71,done=q.inspected[id].includes(spot);
    button(bx,by,146,56,PARTS[id][spot],()=>focusSpot(id,spot),done);
    const [px,py]=SPOTS[id][spot],sx=x+(px-.5)*size,sy=specimenY+(py-.5)*size;
    spots.push({form:id,spot,x:sx,y:sy});
    if(done)v.add.circle(sx,sy,6,0x4a885c).setStrokeStyle(2,0xfffbed);
   }
   if(next?.form===id){v.text(x-153,y-72,'▶',23,32,'#337b63');}
  }
  // Keep the original live magnifier: moving it reveals a larger view of the
  // actual body region underneath, and releasing it records that observation.
  // The image's glass centre is offset from its handle; the container origin
  // follows the glass so mouse and touch coordinates match what children see.
  const lensArt=v.pic('observationLens',28,32,220);
  const lens=v.add.container(640,350,[lensArt]).setSize(220,220).setDepth(40).setInteractive({useHandCursor:true});v.input.setDraggable(lens);
  const maskShape=v.make.graphics({add:false});maskShape.fillStyle(0xffffff).fillCircle(0,0,43);v.lensMask=maskShape;
  const mask=maskShape.createGeometryMask();let zoom=null,zoomId=null,nearest=null,viewed=null;
  const feedback=v.label(640,590,'돋보기를 생물 위로\n옮겨서 살펴봐.',22,250);
  const inspect=(x,y)=>{
   lens.setPosition(x,y);maskShape.setPosition(x,y);
   nearest=spots.map(a=>({...a,d:Math.hypot(a.x-x,a.y-y)})).sort((a,b)=>a.d-b.d)[0];
   const base=specimens.find(a=>a.id===nearest.form),inside=Math.hypot(base.x-x,base.y-y)<base.size*.62+40;
   if(!inside){zoom?.destroy();zoom=null;zoomId=null;viewed=null;feedback.setText('돋보기를 생물 위로\n옮겨서 살펴봐.');return;}
   viewed={form:nearest.form,spot:nearest.spot};
   const factor=base.id==='egg'?4:2.8;
   if(zoomId!==base.id){zoom?.destroy();zoom=v.pic(base.id,x,y,base.size*factor).setDepth(41).setMask(mask);zoomId=base.id;}
   zoom.setPosition(x+(base.x-x)*factor,y+(base.y-y)*factor);
   feedback.setText(PARTS[base.id][nearest.spot].replace(' 보기','')+' 확대 관찰\n놓으면 노트에 남아.');
  };
  // View buttons open a large centred observation window before recording.
  // Previewing alone must not add a clue or immediately open the notebook.
  let popup=null;
  const closePopup=()=>{if(!popup)return;popup.items.forEach(o=>o.destroy());v.focusTargets=popup.targets;ctx.focusTargets?.(v.focusTargets);popup=null;};
  const focusSpot=(form,spot)=>{
   closePopup();
   const [px,py]=SPOTS[form][spot],S=340,lx=420,ly=420,zx=860,zy=420,R=165,factor=2.6;
   const targets=v.focusTargets,items=[];v.focusTargets=[];
   items.push(v.add.rectangle(640,400,1280,800,0x0d2a20,.6).setDepth(100).setInteractive());
   items.push(v.paper(640,415,920,580).setDepth(101));
   items.push(v.text(640,172,`${FORM_NAMES[form]} · ${PARTS[form][spot].replace(' 보기','')} 확대 관찰`,30,800).setDepth(102));
   items.push(v.pic(form,lx,ly,S).setDepth(102));
   items.push(v.add.circle(lx+(px-.5)*S,ly+(py-.5)*S,S/factor/2).setStrokeStyle(4,0xd39b36).setDepth(103));
   const maskShape=v.make.graphics({add:false}).fillStyle(0xffffff).fillCircle(zx,zy,R);items.push(maskShape);
   items.push(v.add.circle(zx,zy,R,0xfffbed).setDepth(102));
   items.push(v.pic(form,zx-(px-.5)*S*factor,zy-(py-.5)*S*factor,S*factor).setDepth(103).setMask(maskShape.createGeometryMask()));
   items.push(v.add.circle(zx,zy,R).setStrokeStyle(8,0xb88a3a).setDepth(104));
   // Finishing the look is the record; no separate save step.
   items.push(...button(640,650,260,58,'관찰 마치기',()=>{closePopup();open(form,spot);},false,105));
   popup={items,targets};ctx.focusTargets?.(v.focusTargets);
  };
  lens.on('drag',(_,x,y)=>inspect(x,y));
  lens.on('dragend',()=>{
   if(nearest&&nearest.d<75){open(nearest.form,nearest.spot);return;}
   zoom?.destroy();zoom=null;zoomId=null;viewed=null;
   feedback.setText('생물 가까이에서 놓아 봐.\n보기 버튼도 눌러 봐.');
   v.tweens.add({targets:lens,x:640,y:350,duration:reducedMotion(ctx.s.settings)?1:180});
  });
  return;
 }
 if(phase==='draw'){
  const id=q.drawingForm||'larva';v.paper(347,407,355,355);
  v.pic(id,345,365,id==='egg'?160/3:240);v.label(345,550,'내가 본 '+FORM_NAMES[id],26,300);
  const x=610,y=230,w=470,h=305;v.paper(x+w/2,y+h/2,w,h);
  v.text(x+w/2,y-28,'본 특징을 내 말로 적어 줘',26,460);
  // A real textarea sits over the paper; leaving it saves the note.
  ctx.noteBox?.({x:x+w/2,y:y+h/2,w:w-36,h:h-36});
  FORMS.forEach((form,i)=>{const bx=225+i*85;v.pic(form,bx,625,form==='egg'?40:65);v.click(bx,625,76,68,()=>act('observation-reference',{form}),FORM_NAMES[form]+' 보며 그리기');});return;
 }
 if(phase==='film'){
  for(let i=0;i<4;i++){
   const x=300+i*225;v.paper(x,400,198,280);
   v.drop(x,390,200,265,'film-'+i,['처음','다음','다음','마지막'][i],()=>ctx.emit('target','film-'+i));
   v.label(x,575,['1 처음','2 다음','3 다음','4 마지막'][i],24,200);
   const id=q.order[i],o=v.pic(id,x,385,id==='egg'?160/3:165,220);v.draggable(o,'film',{from:i},FORM_NAMES[id]+' 사진 옮기기');
  }
  v.text(640,635,'사진을 먼저 누른 뒤, 옮길 자리를 눌러도 돼.',24,900);
  if(ctx.ui.play){let i=0;const marker=v.add.graphics().lineStyle(5,0x4d9270).strokeRoundedRect(199,258,202,284,18),caption=v.label(640,215,'내 시간 필름 · '+FORM_NAMES[q.order[0]],27,850);v.time.addEvent({delay:1150,loop:true,callback:()=>{i=(i+1)%4;marker.x=i*225;caption.setText('내 시간 필름 · '+FORM_NAMES[q.order[i]]);}});}return;
 }
 v.paper(390,400,360,320);v.pic('adult',390,370,260);
 v.paper(915,400,340,320);
 v.text(915,330,'새 잎에서\n새로운 생명이 시작돼',28,300);v.drop(915,440,280,170,'next-egg','다음 세대의 새 알을 놓을 자리',()=>ctx.emit('target','next-egg'));
 v.dashedBox(915,455,280,150);
 const egg=v.pic('egg',650,440,160/3);v.marker(egg,48,'새 알');v.draggable(egg,'generation',{},'새 알을 고른 뒤 오른쪽 잎 자리 누르기');
 v.label(390,590,'알을 낳는 어른벌레',25,330);v.label(915,590,'새 알을 여기에 놓기',25,330);v.text(640,655,'어른벌레가 알로 바뀌는 게 아니라, 새 개체가 태어나.',23,1000);
}
