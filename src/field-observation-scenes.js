import {reducedMotion} from './game-motion.js';
import {FORM_NAMES,FORM_TRAITS,FORM_SPOTS as SPOTS} from './field-content.js';
import {autoPlayRoom,autoStep} from './field-autoplay.js';

const FORMS=['egg','larva','pupa','adult'];
const PARTS={egg:['표면 보기','모양 보기'],larva:['몸마디 보기','다리 보기'],pupa:['겉모습 보기','모양 보기'],adult:['날개 보기','더듬이 보기']};
// Two rows fill the room band (ROOM_VIEW y 140–740) so the table below is not left empty.
const POSITIONS={egg:[300,287,64],larva:[980,287,204],pupa:[300,569,174],adult:[980,569,154]};
const MAT={w:400,h:270};

export function renderObservationRoom(v,ctx,phase){
 const q=ctx.s.field.chapters[0],act=(type,payload)=>ctx.emit('act',{type,payload});
 const button=(x,y,w,h,label,fn,done=false,z=50,shown=(done?'✓ ':'')+label)=>{
  const text=v.text(x,y,shown,22,w-14,done?'#356c47':'#244d3d').setDepth(z+1);h=Math.max(h,text.height+12);
  const plate=v.add.graphics().fillStyle(done?0xdcebd5:0xfffcf0,.98).fillRoundedRect(x-w/2,y-h/2,w,h,14).setDepth(z);
  return [plate,text,v.click(x,y,w,h,fn,label).setDepth(z+2)];
 };
 if(phase==='search'){
  const specimens=FORMS.map(id=>{
   const [x,y,size]=POSITIONS[id],specimenY=y+(id==='egg'?7:id==='adult'?-5:-3);
   v.paper(x-3,y+10,MAT.w,MAT.h);
   const seen=q.explored.includes(id);
   const title=v.text(x,y-96,FORM_NAMES[id]+(seen?' ✓':''),26,320);
   v.pic(id,x,specimenY,size,size);
   button(x,y+100,240,54,FORM_NAMES[id]+'에 돋보기 대기',()=>peek(id),false,50,'돋보기 대기');
   return {id,x,y:specimenY,size,title};
  });
  // The container origin is the centre of the glass, not of the handle.
  const lensArt=v.pic('observationLens',28,32,220);
  const lens=v.add.container(640,350,[lensArt]).setSize(220,220).setDepth(40).setInteractive({useHandCursor:true});
  v.input.setDraggable(lens);
  const shape=v.make.graphics({add:false});shape.fillStyle(0xffffff).fillCircle(0,0,43);v.lensMask=shape;
  const mask=shape.createGeometryMask();
  const progress=v.label(654,510,'돋보기 · '+q.explored.length+'/4',22,205);
  const target=(x,y)=>specimens.find(base=>Math.abs(base.x-x)<=base.size/2+12&&Math.abs(base.y-y)<=base.size/2+12);
  let zoom=null,zoomId=null,reveal=null;
  const hideZoom=()=>{zoom?.destroy();zoom=null;zoomId=null;};
  const inspect=(x,y)=>{
   lens.setPosition(x,y);shape.setPosition(x,y);
   const base=target(x,y);
   if(!base){hideZoom();return;}
   const factor=base.id==='egg'?4:2.8;
   if(zoomId!==base.id){hideZoom();zoom=v.pic(base.id,x,y,base.size*factor).setDepth(41).setMask(mask);zoomId=base.id;}
   zoom.setPosition(x+(base.x-x)*factor,y+(base.y-y)*factor);
  };
  const returnLens=()=>{
   hideZoom();
   v.tweens.add({targets:lens,x:640,y:350,duration:reducedMotion(ctx.s.settings)?1:180});
  };
  const release=base=>{
   if(!base){returnLens();return;}
   if(q.explored.includes(base.id))return;
   // Keep the last specimen under the glass briefly before the close-up opens.
   if(q.explored.length===3){
    if(!reveal)reveal=v.time.delayedCall(650,()=>act('observation-look',{form:base.id}));
    return;
   }
   act('observation-look',{form:base.id});
   base.title.setText(FORM_NAMES[base.id]+' ✓');
   progress.setText('돋보기 · '+q.explored.length+'/4');
  };
  const peek=form=>{
   v.tweens.killTweensOf(lens);
   const base=specimens.find(item=>item.id===form),[px,py]=SPOTS[form][0];
   inspect(base.x+(px-.5)*base.size,base.y+(py-.5)*base.size);
   release(base);
  };
  lens.on('dragstart',()=>v.tweens.killTweensOf(lens));
  lens.on('drag',(_,x,y)=>inspect(x,y));
  lens.on('dragend',()=>release(target(lens.x,lens.y)));
  let tourStep;
  autoPlayRoom(v,ctx,()=>{
   tourStep?.remove();
   const tour=()=>{const form=FORMS.find(id=>!q.explored.includes(id));if(form)peek(form);if(!reveal)tourStep=autoStep(v,ctx,2100,tour);};
   tour();
  });
  return;
 }
 if(phase==='closeup'){
  let page=[];const seen={};
  v.paper(640,437,1090,555);
  const lookedAt=form=>!!(seen[form]?.length||q.inspected[form].length);
  const finish=()=>{ctx.ui.autoPlay=false;act('observation-finish',{inspected:seen});};
  const focusSpot=(form,spot,compare=false)=>{
   page.forEach(o=>o.destroy());page=[];v.lensMask=null;v.focusTargets=[];
   if(!compare)seen[form]=[...new Set([...(seen[form]||[]),spot])];
   FORMS.forEach((id,i)=>{
    const selected=!compare&&id===form,label=FORM_NAMES[id]+' 관찰';
    page.push(...button(286+i*236,202,214,52,label,()=>focusSpot(id,seen[id]?.[0]??q.inspected[id][0]??0),selected,105,(lookedAt(id)?'✓ ':'')+label));
   });
   if(compare){
    page.push(v.pic('larva',408,385,252).setDepth(102),v.pic('adult',862,385,252).setDepth(102));
    page.push(v.text(408,519,'애벌레',24,260).setDepth(102),v.text(862,519,'어른벌레',24,260).setDepth(102));
    page.push(v.text(640,570,'애벌레에 없던 어떤 부분이 어른벌레에게 생겼을까?',25,800,'#356c47').setDepth(102));
    page.push(...button(936,668,300,54,'확대 관찰로 돌아가기',()=>focusSpot(form,spot),false,105));
   }else{
    const [px,py]=SPOTS[form][spot],S=265,lx=425,ly=374,zx=852,zy=374,R=124,factor=2.6;
    page.push(v.pic(form,lx,ly,S).setDepth(102));
    page.push(v.add.circle(lx+(px-.5)*S,ly+(py-.5)*S,S/factor/2).setStrokeStyle(4,0xd39b36).setDepth(103));
    const shape=v.make.graphics({add:false});shape.fillStyle(0xffffff).fillCircle(zx,zy,R);page.push(shape);v.lensMask=shape;
    page.push(v.add.circle(zx,zy,R,0xfffbed).setDepth(102));
    page.push(v.pic(form,zx-(px-.5)*S*factor,zy-(py-.5)*S*factor,S*factor).setDepth(103).setMask(shape.createGeometryMask()));
    page.push(v.add.circle(zx,zy,R).setStrokeStyle(7,0xb88a3a).setDepth(104));
    page.push(v.text(640,543,FORM_TRAITS[form][spot],25,935,'#356c47').setDepth(102));
    page.push(...button(417,605,312,49,PARTS[form][1-spot],()=>focusSpot(form,1-spot),false,105));
    if(lookedAt('larva')&&lookedAt('adult'))
     page.push(...button(852,605,360,49,'애벌레와 어른벌레 비교',()=>focusSpot(form,spot,true),false,105));
   }
   const count=FORMS.filter(lookedAt).length;
   page.push(v.text(271,668,`네 모습 중 ${count}/4 관찰`,21,270).setDepth(106));
   if(count===FORMS.length)page.push(...button(622,668,300,54,'시간 필름으로',finish,false,105));
   ctx.focusTargets?.(v.focusTargets);
  };
  focusSpot(FORMS.find(id=>!lookedAt(id))??FORMS[0],0);
  let tourStep;
  autoPlayRoom(v,ctx,()=>{
   tourStep?.remove();
   const tour=()=>{const next=FORMS.find(id=>!lookedAt(id));if(!next){finish();return;}focusSpot(next,0);tourStep=autoStep(v,ctx,3000,tour);};
   tourStep=autoStep(v,ctx,3000,tour);
  });
  return;
 }
 if(phase==='film'){
  for(let i=0;i<4;i++){
   const x=300+i*225;v.paper(x,400,198,280);
   v.drop(x,390,200,265,'film-'+i,['첫 번째 자리','두 번째 자리','세 번째 자리','네 번째 자리'][i],()=>ctx.emit('target','film-'+i));
   v.label(x,575,['1 처음','2 다음','3 다음','4 마지막'][i],24,200);
   const id=q.order[i],o=v.pic(id,x,385,id==='egg'?160/3:165,220);
   v.draggable(o,'film',{from:i},FORM_NAMES[id]+' 사진 옮기기','film-'+i);
  }
  v.text(640,635,'사진을 누른 뒤 옮길 자리를 눌러 봐. 사진 위를 눌러도 돼.',24,900);
  if(ctx.ui.play){let i=0;const marker=v.add.graphics().lineStyle(5,0x4d9270).strokeRoundedRect(199,258,202,284,18),caption=v.label(640,215,'내 시간 필름 · '+FORM_NAMES[q.order[0]],27,850);v.time.addEvent({delay:1150,loop:true,callback:()=>{i=(i+1)%4;marker.x=i*225;caption.setText('내 시간 필름 · '+FORM_NAMES[q.order[i]]);}});}return;
 }
 v.paper(390,400,360,320);v.pic('adult',390,370,260);
 v.paper(915,400,340,320);
 v.text(915,330,'새 잎에서\n새로운 생명이 시작돼',28,300);v.drop(915,440,280,170,'next-egg','다음 세대의 새 알을 놓을 자리',()=>ctx.emit('target','next-egg'));
 v.dashedBox(915,455,280,150);
 const egg=v.pic('egg',650,440,160/3);v.marker(egg,48,'새 알');v.draggable(egg,'generation',{},'새 알을 고른 뒤 오른쪽 잎 자리 누르기');
 v.label(390,590,'알을 낳는 어른벌레',25,330);v.label(915,590,'새 알을 여기에 놓기',25,330);v.text(640,655,'어른벌레가 알로 바뀌는 게 아니라, 새 개체가 태어나.',23,1000);
}
