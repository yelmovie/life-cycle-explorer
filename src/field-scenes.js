import {mapKeyDirection,MAP_VECTORS} from './map-controls.js';
import {reducedMotion} from './game-motion.js';
import {ART,SCENES} from './game-assets.js';
import {POINTS,EDGES,DOORS,nearest,route} from './game-model.js';
import {FIELD_CHAPTERS} from './field-content.js';
import {renderFieldRoom,fieldRoomAssets} from './field-room-scenes.js';
import {towerBackdrop} from './field-story-scenes.js';
import {lightRestoredLandmarks} from './field-world-effects.js';
import {renderLifeClock} from './field-clock.js';
import {COMPANION_ART} from './field-companion.js';

const W=1280,H=800;
// Activity renderers keep their established world coordinates. The room camera
// fits the content only; page chrome reserves its own space outside the canvas.
const ROOM_VIEW={x:64,y:140,width:1184,height:600};
const ROOM_BACKDROPS=['fieldClearing','bg2','bg4','gardenSeasons','bg8'];
export function createFieldGame(context){
 const P=globalThis.Phaser;
 class FieldWorld extends P.Scene{
  constructor(){super('field-world');}
  preload(){
   this.load.on('progress',progress=>context.emit('assets-progress',{progress}));
   // Nothing preloads: the title is DOM art, so map and room images arrive when first needed.
   this.paths={...ART,...SCENES,doto:COMPANION_ART,walker:ART.walk};
   this.failed=new Set();this.assetAttempts=new Map();this.load.on('loaderror',file=>{this.failed.add(file.key);this.assetAttempts.set(file.key,(this.assetAttempts.get(file.key)||0)+1);});
   this.load.on('filecomplete',key=>this.failed.delete(key));
  }
  create(){context.scene=this;this.renderToken=0;this.refresh();this.scale.on('resize',()=>this.relayout());}
  relayout(){
   const cam=this.cameras.main;
   const saved=context.mode()==='map'&&context.ui.mapHand?this.mapViewSnapshot():null;
   const travel=context.mode()==='map'&&this.walking?{target:this.walkTarget,chapter:Number.isInteger(context.ui.travelChapter)?context.ui.travelChapter:null}:null;
   this.refresh();
   if(saved&&this.avatar&&!this.loading)this.applyMapView(saved);
   // A wrapping header may resize the stage during a walk. Continue from the
   // last recorded path node instead of leaving the destination button locked.
   if(travel&&!this.loading&&!this.assetFailure)this.walkTo(travel.target,travel.chapter);
  }
  // The HUD floats over the artwork; activities fit between the bars it covers.
  hudInsets(){
   const canvas=this.game?.canvas?.getBoundingClientRect?.(),doc=globalThis.document;if(!canvas?.height||!doc?.querySelector)return {top:0,bottom:0};
   const box=selector=>{const r=doc.querySelector(selector)?.getBoundingClientRect?.();return r?.height?r:null;};
   const head=box('.game-header'),foot=box('.game-footer'),bubble=context.mode()==='room'?box('#guide-bubble:not([hidden])'):null,k=this.viewportSize().height/canvas.height;
   // An open hint bubble floats above the footer, so the activity steps up instead of hiding under it.
   const floor=Math.min(foot?foot.top:Infinity,bubble?bubble.top-8:Infinity);
   return {top:Math.round(Math.max(0,head?head.bottom-canvas.top:0)*k),bottom:Math.round(Math.max(0,floor===Infinity?0:canvas.bottom-floor)*k)};
  }
  syncInsets(){const now=this.hudInsets(),was=this.viewport?.insets;if(!this.loading&&was&&(now.top!==was.top||now.bottom!==was.bottom))this.relayout();}
  viewportSize(){const size=this.scale?.gameSize||this.game?.scale?.gameSize;return {width:Math.max(1,size?.width||W),height:Math.max(1,size?.height||H)};}
  configureViewport(mode){
   const size=this.viewportSize(),camera=this.cameras.main,insets=this.hudInsets(),room=mode==='room',bounds=room?ROOM_VIEW:{x:0,y:0,width:W,height:H};
   // Rooms contain the activity inside the uncovered band; the map covers the whole canvas.
   const zoom=room?Math.min(size.width/bounds.width,Math.max(1,size.height-insets.top-insets.bottom)/bounds.height):Math.max(size.width/bounds.width,size.height/bounds.height);
   const center={x:bounds.x+bounds.width/2,y:bounds.y+bounds.height/2-(room?(insets.top-insets.bottom)/2/zoom:0)};
   this.viewport={...size,zoom,insets,center};camera.stopFollow();camera.setViewport?.(0,0,size.width,size.height);camera.setRotation?.(0);camera.setZoom(zoom);
   if(room)camera.removeBounds?.();else camera.setBounds(0,0,W,H);
   camera.centerOn(center.x,center.y);
  }
  // Mirror the room art past its edges so wide or tall screens never show bare canvas.
  backdrop(key){
   const {width,height,zoom,center}=this.viewport,hw=width/2/zoom,hh=height/2/zoom;
   for(const i of [-1,0,1])for(const j of [-1,0,1]){
    if(i*W+W<center.x-hw||i*W>center.x+hw||j*H+H<center.y-hh||j*H>center.y+hh)continue;
    this.pic(key,W/2+i*W,H/2+j*H,W,H).setDisplaySize(W,H).setFlip(i!==0,j!==0);
    if(i||j)this.add.rectangle(W/2+i*W,H/2+j*H,W,H,0x173d2e,.18);
   }
   this.add.rectangle(W/2,H/2,W*3,H*3,0x173d2e,.22);
  }
  screenScale(){const size=this.viewportSize(),cssWidth=this.game?.canvas?.getBoundingClientRect?.()?.width||size.width;return cssWidth/size.width*(this.cameras?.main?.zoom||this.viewport?.zoom||1);}
  projectWorld(item){
   const camera=this.cameras.main,size=this.viewportSize(),width=camera.width||size.width,height=camera.height||size.height;
   const zoomX=camera.zoomX||camera.zoom||this.viewport?.zoom||1,zoomY=camera.zoomY||camera.zoom||this.viewport?.zoom||1;
   const ox=width*(camera.originX??.5),oy=height*(camera.originY??.5);
   // Cameras have no rotation. Match Phaser's rounded camera origin without
   // waiting for the next render to rebuild its transform matrix after resize.
   return {x:Math.floor((camera.x||0)+ox+.5)+(item.x-(camera.scrollX||0)-ox)*zoomX,y:Math.floor((camera.y||0)+oy+.5)+(item.y-(camera.scrollY||0)-oy)*zoomY,w:(item.w||0)*zoomX,h:(item.h||0)*zoomY};
  }
  pointerWorld(pointer){
   const origin=this.projectWorld({x:0,y:0}),camera=this.cameras.main;
   const zoomX=camera.zoomX||camera.zoom||this.viewport?.zoom||1,zoomY=camera.zoomY||camera.zoom||this.viewport?.zoom||1;
   return {x:(pointer.x-origin.x)/zoomX,y:(pointer.y-origin.y)/zoomY};
  }
  text(x,y,message,size=27,width=420,color){
   const scale=this.screenScale(),theme=this.theme;
   const text=this.add.text(x,y,message,{fontFamily:theme.font,fontStyle:'700',fontSize:Math.max(size,(size<22?theme.caption:theme.body)/scale),color:color||theme.ink,align:'center',wordWrap:{width,useAdvancedWrap:false},lineSpacing:3}).setOrigin(.5);
   // A thin paper outline keeps the letters readable over detailed forest art.
   if(!color||!/^#fff/i.test(color))text.setStroke(theme.paper,Math.max(2,2/scale));
   return text;
  }
  label(x,y,message,size=25,width=360){
   const text=this.text(0,0,message,size,width).setStroke(this.theme.paper,0),paper=this.add.graphics();
   const tag=this.add.container(x,y,[paper,text]);
   const resize=()=>{
    const w=Math.ceil(text.width+24),h=Math.ceil(text.height+12);
    paper.clear().fillStyle(0xfffdf4,.60).fillRoundedRect(-w/2,-h/2,w,h,Math.min(14,h/2));tag.setSize(w,h);
    if(tag.input?.hitArea instanceof P.Geom.Rectangle){const min=this.theme.touch/this.screenScale(),hitW=Math.max(w,min),hitH=Math.max(h,min);tag.input.hitArea.setTo((w-hitW)/2,(h-hitH)/2,hitW,hitH);}
    return tag;
   };
   // Keep the caption and draggable-tag API used by clocks, the lens and quests.
   tag.setText=value=>{text.setText(value);return resize();};
   tag.setColor=value=>{text.setColor(value);return tag;};
   Object.defineProperty(tag,'text',{get:()=>text.text});
   return resize();
  }
  pic(key,x,y,w,h=w){const texture=this.textures.exists(key)?key:'__MISSING',o=this.add.image(x,y,texture);return o.setScale(Math.min(w/o.width,h/o.height));}
  dashed(g,points){for(let i=0;i<points.length-1;i+=2)g.lineBetween(...points[i],...points[i+1]);return g;}
  // Small items vanish on detailed art; a cream disc and dashed ring set them apart.
  marker(object,r,text){
   const ring=[...Array(48)].map((_,i)=>[Math.cos(i/24*Math.PI)*r,Math.sin(i/24*Math.PI)*r]);
   const halo=this.add.container(object.x,object.y,[this.add.circle(0,0,r,0xfffbed,.95),this.dashed(this.add.graphics().lineStyle(4,0x337b63),ring)]);
   object.setDepth(Math.max(object.depth,1));this.time.addEvent({delay:16,loop:true,callback:()=>halo.setPosition(object.x,object.y)});
   if(text)this.label(object.x,object.y+r+24,text,22,160);return halo;
  }
  dashedBox(x,y,w,h){const p=[],l=x-w/2,t=y-h/2;for(let i=0;i<=40;i++)p.push([l+w*i/40,t]);for(let i=0;i<=24;i++)p.push([l+w,t+h*i/24]);for(let i=0;i<=40;i++)p.push([l+w-w*i/40,t+h]);for(let i=0;i<=24;i++)p.push([l,t+h-h*i/24]);return this.dashed(this.add.graphics().lineStyle(4,0x337b63,.8),p);}
  shadow(x,y,w=210){return this.add.ellipse(x,y,w,25,0x173d2e,.20);}
  // Nine-slice paper card (Canvas has no NineSlice object): taped corners keep their size, edges stretch.
  paper(x,y,w,h){
   if(!this.textures.exists('paperCard'))return this.add.graphics().fillStyle(0xfffbed,.97).fillRoundedRect(x-w/2,y-h/2,w,h,20);
   const t=this.textures.get('paperCard'),{width:SW,height:SH}=t.source[0],m=Math.round(Math.min(SW,SH)*.15),c=Math.min(52,w/3,h/3);
   const cut=[[0,m,SW-m],[m,SW-2*m,m],[0,m,SH-m],[m,SH-2*m,m]];
   if(!t.has('paper8'))for(let n=0;n<9;n++)t.add('paper'+n,0,cut[0][n%3],cut[2][n/3|0],cut[1][n%3],cut[3][n/3|0]);
   const xs=[x-w/2,x-w/2+c,x+w/2-c],ws=[c,w-2*c,c],ys=[y-h/2,y-h/2+c,y+h/2-c],hs=[c,h-2*c,c];
   return this.add.container(0,0,[...Array(9)].map((_,n)=>this.add.image(xs[n%3],ys[n/3|0],'paperCard','paper'+n).setOrigin(0).setDisplaySize(ws[n%3]+.6,hs[n/3|0]+.6)));
  }
  click(x,y,w,h,fn,label='대상 살펴보기'){
   const min=this.theme.touch/this.screenScale();w=Math.max(w,min);h=Math.max(h,min);
   const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});zone.on('pointerdown',fn);
   this.focusTargets.push({x,y,w,h,label,fn});return zone;
  }
  drop(x,y,w,h,id,label='여기에 놓기',tap){
   const zone=this.add.zone(x,y,w,h).setRectangleDropZone(w,h).setData('target',id);
   if(tap)this.click(x,y,w,h,tap,label);return zone;
  }
  draggable(object,kind,data={},label='끌어 옮기기'){
   const min=this.theme.touch/this.screenScale(),w=Math.max(object.width,min/Math.abs(object.scaleX)),h=Math.max(object.height,min/Math.abs(object.scaleY));
   object.setInteractive(new P.Geom.Rectangle((object.width-w)/2,(object.height-h)/2,w,h),P.Geom.Rectangle.Contains);object.input.cursor='pointer';this.input.setDraggable(object);const x=object.x,y=object.y;
   // The picked object keeps an outline until the pick is used or replaced; a rebuilt scene redraws it.
   const pick=()=>{this.markPick(object);context.emit('select',{kind,...data});},picked=context.ui.selection;
   object.on('pointerdown',pick);
   object.on('dragstart',()=>{this.pickMark?.destroy();object.setDepth(30).setScale(object.scale*1.05);});
   object.on('drag',(_,dx,dy)=>object.setPosition(dx,dy));
   object.on('drop',(_,zone)=>context.emit('drop',{kind,...data,target:zone.getData('target')}));
   object.on('dragend',(_,dx,dy,dropped)=>{if(!dropped)this.tweens.add({targets:object,x,y,duration:reducedMotion(context.s.settings)?1:160,onComplete:()=>{object.setScale(object.scale/1.05);this.markPick(object);}});});
   if(picked?.kind===kind&&Object.entries(data).every(([key,value])=>picked[key]===value))this.markPick(object);
   this.focusTargets.push({x,y,w:Math.max(min,object.displayWidth),h:Math.max(min,object.displayHeight),label,fn:pick});return object;
  }
  markPick(object){this.pickMark?.destroy();const b=object.getBounds();this.pickMark=this.add.graphics().lineStyle(5,0xd39b36,1).strokeRoundedRect(b.x-7,b.y-7,b.width+14,b.height+14,16).setDepth(29);}
  ensureTouchTargets(){
   const min=this.theme.touch/this.screenScale();
   for(const o of this.children.getChildren?.()||[]){
    const hit=o.input?.hitArea;if(!o.input?.enabled||o.input.dropZone||!(hit instanceof P.Geom.Rectangle))continue;
    const w=Math.max(hit.width,min/Math.abs(o.scaleX||1)),h=Math.max(hit.height,min/Math.abs(o.scaleY||1));
    hit.setTo(hit.x-(w-hit.width)/2,hit.y-(h-hit.height)/2,w,h);
   }
  }
  dial(key,x,y,value,max,event,labels,size){return renderLifeClock(this,context,key,x,y,value,max,event,labels,size);}
  showHint(pattern,items=this.focusTargets){
   this.hintMarks?.forEach(o=>o.destroy());this.hintMarks=[];
   const targets=items.filter(item=>pattern.test(item.label)).slice(0,4);
   for(const item of targets){const o=this.add.graphics().lineStyle(Math.max(3,3/this.screenScale()),0x2d7550,.95).strokeRoundedRect(item.x-item.w/2-5,item.y-item.h/2-5,item.w+10,item.h+10,14).setDepth(45);this.hintMarks.push(o);if(!reducedMotion(context.s.settings))this.tweens.add({targets:o,alpha:.4,duration:500,yoyo:true,repeat:2});}
   this.time.delayedCall(4000,()=>this.hintMarks?.forEach(o=>o.destroy()));
  }
  showDropTargets(){this.showHint(/./,this.children.getChildren().filter(o=>o.getData?.('target')).map(o=>({x:o.x,y:o.y,w:o.width,h:o.height,label:'놓을 자리'})));}
  retryAssets(){if(this.loading)return;this.failed.clear();this.assetAttempts.clear();this.assetFailure=null;this.refresh();}
  refresh(){
   if(this.loading)return;
   const css=typeof getComputedStyle==='function'&&globalThis.document?.documentElement?getComputedStyle(document.documentElement):null,token=(name,fallback)=>css?.getPropertyValue(name).trim()||fallback;
   this.theme={font:token('--font-body','NanumSquareNeo,Malgun Gothic,sans-serif'),ink:token('--forest-900','#1e4337'),paper:token('--cream-50','#fffbed'),body:parseFloat(token('--field-body-min','20')),caption:parseFloat(token('--field-caption-min','16')),touch:parseFloat(token('--field-touch-min','48'))};
   const mode=context.mode(),chapter=context.s.field.active;
   const keys=mode==='room'?[...fieldRoomAssets(context),...['guideLook','guideCare','guideTime','guideStory']]:mode==='map'?['forestMap','ipsae','guideLook','guideStory','walker','doto']:[];
   const unavailable=[...new Set(keys)].filter(key=>!this.textures.exists(key));
   const missing=unavailable.filter(key=>this.paths[key]&&(this.assetAttempts.get(key)||0)<2);
   if(missing.length){this.loading=true;this.input.enabled=false;context.focusTargets([]);context.emit('assets-loading');this.load.once('complete',()=>{this.loading=false;this.refresh();});for(const key of missing)key==='walker'?this.load.spritesheet(key,this.paths[key],{frameWidth:256,frameHeight:256}):this.load.image(key,this.paths[key]);this.load.start();return;}
   this.clearMapInput?.();this.clearMapInput=null;
   if(mode!=='map')this.priorMapView=null;
   this.renderToken++;this.walking=false;this.guidedWalk=false;this.autoPlay=null;this.focusTargets=[];context.noteBox?.(null);this.tweens.killAll();this.time.removeAllEvents();this.input.removeAllListeners();this.input.keyboard?.removeAllListeners();
   this.children.removeAll(true);for(const key of this.recordTextures||[])if(this.textures.exists(key))this.textures.remove(key);this.recordTextures=[];
   for(const mask of this.worldMasks||[])mask.destroy();this.worldMasks=[];
   if(this.lensMask){this.lensMask.destroy();this.lensMask=null;}
   this.input.enabled=!context.modalOpen();this.configureViewport(mode);
   if(unavailable.length){
    this.input.enabled=false;
    if(this.textures.exists('forestMap'))this.pic('forestMap',W/2,H/2,W,H).setDisplaySize(W,H);
    this.add.rectangle(W/2,H/2,W,H,0x244d39,.55);this.label(W/2,H/2,'그림을 다시 불러오면 탐사를 이어 갈 수 있어.',30,850);
    context.focusTargets([]);
    const failure=mode+':'+chapter+':'+unavailable.join(',');if(this.assetFailure!==failure){this.assetFailure=failure;context.emit('assets-unavailable');}return;
   }
   this.assetFailure=null;
   if(mode==='room'){
    this.backdrop(chapter===4?towerBackdrop(context.s.field):ROOM_BACKDROPS[chapter]);
    renderFieldRoom(this,context);
   }else this.map(mode==='title');
   // Place map doors now, not on the next frame, so they never flash at the corner.
   this.update();
   this.ensureTouchTargets();context.focusTargets(this.focusTargets);context.sceneReady?.();context.emit('loaded');
  }
  // Precompute outlined map poses once, preserving each pose's original pixels and frame bounds.
  mapOutline(key,frameSize=0){
   const name=key+'-map-outline',textures=this.textures;
   if(textures.exists(name))return name;
   const source=textures.get(key).getSourceImage(),w=frameSize||source.width,h=frameSize||source.height,pad=11,r=5;
   const cols=Math.floor(source.width/w),rows=Math.floor(source.height/h),fw=w+2*pad,fh=h+2*pad;
   const texture=textures.createCanvas(name,fw*cols,fh*rows),ink=texture.getContext();
   const pose=document.createElement('canvas');pose.width=fw;pose.height=fh;const brush=pose.getContext('2d');
   for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const dx=x*fw,dy=y*fh;
    const draw=(ox,oy)=>brush.drawImage(source,x*w,y*h,w,h,pad+ox,pad+oy,w,h);
    brush.clearRect(0,0,fw,fh);
    for(const [ox,oy] of [[-r,0],[r,0],[0,-r],[0,r],[-4,-4],[4,4],[4,-4],[-4,4]])draw(ox,oy);
    brush.globalCompositeOperation='source-in';brush.fillStyle='#fff4d2';brush.fillRect(0,0,fw,fh);brush.globalCompositeOperation='source-over';
    ink.save();ink.shadowColor='#23392a66';ink.shadowBlur=4;ink.shadowOffsetY=4;ink.drawImage(pose,dx,dy);ink.restore();
    ink.drawImage(source,x*w,y*h,w,h,dx+pad,dy+pad,w,h);
    if(frameSize)texture.add(y*cols+x,0,dx,dy,fw,fh);
   }
   texture.refresh();return name;
  }
  map(title=false){
   const s=context.s,completed=s.field.completed;
   if(title&&!this.textures.exists('forestMap'))return;
   // Mirrored strips above and below let the camera lift edge paths clear of the floating HUD.
   // Canvas mode has no tint, so a dim, greyed copy of the map stands for the sleeping forest.
   if(!title&&!this.textures.exists('forestMapSleep')){const src=this.textures.get('forestMap').getSourceImage(),t=this.textures.createCanvas('forestMapSleep',src.width,src.height),c=t.getContext();c.filter='grayscale(.7) brightness(.72)';c.drawImage(src,0,0);t.refresh();}
   for(const j of title?[0]:[-1,0,1])this.pic(title?'forestMap':'forestMapSleep',640,400+j*H,W,H).setDisplaySize(W,H).setFlipY(j!==0);
   // Every completed landmark brings some daylight back; the fifth restores the full forest.
   if(!title&&completed.length){
    const daylight=completed.length/5,fresh=Number.isInteger(context.ui.restoreChapter)&&!reducedMotion(s.settings);
    for(const j of [-1,0,1]){
     const day=this.pic('forestMap',640,400+j*H,W,H).setDisplaySize(W,H).setFlipY(j!==0);
     day.setAlpha(fresh?Math.max(0,daylight-.2):daylight);
     if(fresh)this.tweens.add({targets:day,alpha:daylight,duration:950,ease:'Sine.easeInOut'});
    }
   }
   this.add.rectangle(640,400,W,H*3,0x173d36,title?.12:.16-completed.length*.024);
   if(title)return;
   lightRestoredLandmarks(this,context);
   const pos=nearest([s.avatar.x,s.avatar.y]),point=POINTS[pos];
   const walker=this.mapOutline('walker',256),doto=this.mapOutline('doto');
   this.avatar=this.add.sprite(point[0]*W,point[1]*H,walker,0).setScale(86/256).setOrigin(.5,(256*.83+11)/278).setDepth(15);
   this.foot=this.add.ellipse(this.avatar.x,this.avatar.y,42,13,0x092f22,.30).setDepth(14);
   const companionSource=this.textures.get('doto').getSourceImage();
   this.spirit=this.add.image(this.avatar.x-55,this.avatar.y-12,doto).setScale(64/Math.max(companionSource.width,companionSource.height)).setDepth(16);
   const zoom=this.viewport.zoom*1.08,{top,bottom}=this.viewport.insets;
   this.cameras.main.setZoom(zoom).setBounds(0,-top/zoom,W,H+(top+bottom)/zoom).startFollow(this.avatar,true,reducedMotion(s.settings)?1:.16,reducedMotion(s.settings)?1:.16).setFollowOffset(0,(top-bottom)/2/zoom);
   this.mapZoom=zoom;this.mapFollowOffset=(top-bottom)/2/zoom;
   this.mapLand=this.add.zone(W/2,H/2,W,H).setInteractive({cursor:'pointer'}).setDepth(-1);
   // A tap walks along the graph; a drag stops a guided trip and frees the camera.
   let drag=null,pinch=null;
   const fingers=new Map();
   const mid=()=>{const [a,b]=[...fingers.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y)};};
   const zoomAt=(ratio,screen,world)=>{
    const cam=this.cameras.main;if(this.walking)this.cancelTravel();
    context.ui.mapOverview=false;context.ui.mapHand=true;this.priorMapView=null;
    cam.resetFX();cam.stopFollow();cam.setZoom(Math.min(this.mapZoom*2,Math.max(this.mapZoom,ratio)));
    cam.setBounds(0,-top/cam.zoom,W,H+(top+bottom)/cam.zoom);
    const now=this.pointerWorld(screen);cam.setScroll(cam.scrollX+world.x-now.x,cam.scrollY+world.y-now.y);
    context.emit('map-pan-start');this.mapCursor('grab');
   };
   const canvas=this.game.canvas,stage=canvas.closest('#stage')||canvas;
   const input=new AbortController(),opts={signal:input.signal};
   const pointer=e=>{const r=canvas.getBoundingClientRect(),{width,height}=this.viewportSize();return{id:e.pointerId,x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height};};
   stage.addEventListener('pointerdown',e=>{
    if(context.modalOpen()||e.button>0||e.target.closest('button,input,summary,[tabindex="0"]'))return;
    const p=pointer(e);stage.setPointerCapture?.(p.id);
    if(e.pointerType==='touch'){
     fingers.set(p.id,{x:p.x,y:p.y});
     if(fingers.size===2){if(this.walking)this.cancelTravel();const m=mid();pinch={...m,zoom:this.cameras.main.zoom,point:this.pointerWorld(m)};drag=null;return;}
    }
    if(drag||pinch||context.ui.mapOverview)return;
    if(this.guidedWalk)this.cancelTravel();
    const cam=this.cameras.main;drag={id:p.id,x:p.x,y:p.y,sx:cam.scrollX,sy:cam.scrollY,moved:false};
   },opts);
   stage.addEventListener('pointermove',e=>{
    const p=pointer(e);
    if(fingers.has(p.id))fingers.set(p.id,{x:p.x,y:p.y});
    if(pinch&&fingers.size>=2){const m=mid();zoomAt(pinch.zoom*m.d/Math.max(8,pinch.d),m,pinch.point);return;}
    if(!drag||drag.id!==p.id||context.ui.mapOverview)return;
    const dx=p.x-drag.x,dy=p.y-drag.y;
    if(!drag.moved&&Math.hypot(dx,dy)<8)return;
    const cam=this.cameras.main;
    if(!drag.moved){if(this.walking)this.cancelTravel();drag.moved=true;context.ui.mapHand=true;cam.stopFollow();context.emit('map-pan-start');this.mapCursor('grabbing');}
    cam.setScroll(drag.sx-dx/cam.zoom,drag.sy-dy/cam.zoom);
   },opts);
   const release=(p,tap=false)=>{
    if(p)fingers.delete(p.id);else fingers.clear();if(fingers.size<2)pinch=null;
    if(!drag||(p&&p.id!==drag.id))return;
    const walk=tap&&!drag.moved&&!context.ui.mapHand&&!context.modalOpen();
    drag=null;this.mapCursor(context.ui.mapHand?'grab':'');
    if(walk){const point=this.pointerWorld(p);if(point.x>=0&&point.x<=W&&point.y>=0&&point.y<=H)this.walkTo(nearest([point.x/W,point.y/H]),null);}
   };
   stage.addEventListener('pointerup',e=>release(pointer(e),true),opts);
   stage.addEventListener('pointercancel',e=>release(pointer(e)),opts);
   stage.addEventListener('lostpointercapture',e=>release(pointer(e)),opts);
   this.releaseMapGesture=()=>release();
   const wheel=event=>{
    if(context.modalOpen()||!event.deltaY)return;
    event.preventDefault();
    const p=pointer(event),{height}=this.viewportSize();
    const dy=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?height:1);
    zoomAt(this.cameras.main.zoom*Math.exp(-dy*.0015),p,this.pointerWorld(p));
   };
   stage.addEventListener('wheel',wheel,{...opts,passive:false});
   if(context.ui.mapHand)this.setMapHand(true,true);else if(context.ui.mapOverview)this.setMapOverview(true);
   this.mapKeys=new Map();
   const clearKeys=()=>{this.mapKeys.clear();this.releaseMapGesture?.();};
   this.input.keyboard?.on('keydown',event=>{const dir=mapKeyDirection(event);if(!dir||context.modalOpen()||event.ctrlKey||event.altKey||event.metaKey||event.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])'))return;event.preventDefault();if(!event.repeat){this.resumeMapFollow();if(this.guidedWalk)this.cancelTravel();this.mapKeys.set(event.code||event.key,dir);}});
   this.input.keyboard?.on('keyup',event=>this.mapKeys.delete(event.code||event.key));
   window.addEventListener('blur',clearKeys,opts);document.addEventListener('visibilitychange',clearKeys,opts);
   const cleanup=()=>{input.abort();this.releaseMapGesture=null;this.events.off('shutdown',cleanup);};
   this.clearMapInput=cleanup;this.events.once('shutdown',cleanup);
   const c=context.ui.restoreChapter;
   if(Number.isInteger(c)){
    context.ui.restoreChapter=null;
    if(!reducedMotion(s.settings)){
     const path=[DOORS[c],...route(DOORS[c],DOORS[4])],first=POINTS[path[0]],glow=this.add.circle(first[0]*W,first[1]*H,8,0xffef9d,.95).setDepth(19);
     let i=1;
     const move=()=>{if(i>=path.length){glow.destroy();return;}const p=POINTS[path[i++]];this.tweens.add({targets:glow,x:p[0]*W,y:p[1]*H,duration:850/Math.max(1,path.length-1),onComplete:move});};move();
    }
   }
  }
  // Looking around zooms in and lets go of the walker; ending it returns the view to the walker.
  mapViewSnapshot(){
   const cam=this.cameras.main,p=this.pointerWorld({x:cam.width/2,y:cam.height/2});
   return {x:p.x/W,y:p.y/H,zoom:cam.zoom/this.mapZoom,hand:!!context.ui.mapHand};
  }
  applyMapView(saved){
   const cam=this.cameras.main,{top,bottom}=this.viewport.insets,zoom=this.mapZoom*saved.zoom;
   cam.stopFollow();cam.setZoom(zoom);cam.setBounds(0,-top/zoom,W,H+(top+bottom)/zoom);
   cam.centerOn(saved.x*W,saved.y*H);context.ui.mapHand=saved.hand;
   this.mapCursor(saved.hand?'grab':'');if(!saved.hand)this.setMapHand(false);
  }
  setMapHand(on){
   if(context.mode()!=='map'||!this.avatar)return;
   const cam=this.cameras.main,{top,bottom}=this.viewport.insets;
   if(this.mapLand?.input)this.mapLand.input.cursor=on?'grab':'pointer';this.mapCursor(on?'grab':'');
   if(on){
    if(this.walking)this.cancelTravel();cam.stopFollow();
    if(this.priorMapView){const saved=this.priorMapView;this.priorMapView=null;this.applyMapView({...saved,hand:true});}
    return;
   }
   cam.setBounds(0,-top/this.mapZoom,W,H+(top+bottom)/this.mapZoom);cam.setZoom(this.mapZoom);
   const n=reducedMotion(context.s.settings)?1:.16;cam.startFollow(this.avatar,true,n,n).setFollowOffset(0,this.mapFollowOffset);
  }
  setMapOverview(on,restore=true){
   if(context.mode()!=='map'||!this.avatar)return;
   const cam=this.cameras.main;cam.resetFX();
   if(!on){const saved=this.priorMapView;this.priorMapView=null;if(restore&&saved)this.applyMapView(saved);else{context.ui.mapHand=false;this.setMapHand(false);}return;}
   if(!this.priorMapView)this.priorMapView=this.mapViewSnapshot();
   if(this.walking)this.cancelTravel();const {width,height,insets}=this.viewport;const zoom=Math.min(width/W,Math.max(1,height-insets.top-insets.bottom)/H);
   context.ui.mapHand=false;cam.stopFollow();cam.removeBounds();cam.setZoom(zoom);cam.centerOn(W/2,H/2-(insets.top-insets.bottom)/2/zoom);this.mapCursor('');
  }
  resumeMapFollow(){
   this.releaseMapGesture?.();
   if(!context.ui)return;
   const changed=!!(context.ui.mapOverview||context.ui.mapHand);
   if(context.ui.mapOverview){context.ui.mapOverview=false;this.setMapOverview(false,false);}
   if(context.ui.mapHand){context.ui.mapHand=false;this.setMapHand(false);}
   if(changed)context.emit('map-pan-start');
  }
  mapCursor(value){if(this.game?.canvas)this.game.canvas.style.cursor=value;}
  walkDoor(chapter){if(!Number.isInteger(chapter)||chapter<0||chapter>4)return;this.walkTo(DOORS[chapter],chapter);}
  cancelTravel(){
   const guided=this.guidedWalk;
   this.travelId=(this.travelId||0)+1;this.walkTimer?.remove();if(this.avatar){this.tweens.killTweensOf(this.avatar);this.avatar.setFrame(0);}this.walking=false;this.walkTarget=null;this.guidedWalk=false;
   if(guided)context.emit('travel-cancel');
  }
  step(dx,dy){
   if(context.mode()!=='map'||context.modalOpen())return;
   this.resumeMapFollow();
   if(this.guidedWalk)this.cancelTravel();
   if(this.walking)return;
   const at=nearest([context.s.avatar.x,context.s.avatar.y]),neighbors=EDGES.flatMap(([a,b])=>a===at?[b]:b===at?[a]:[]);
   const next=neighbors.map(n=>{const x=POINTS[n][0]-POINTS[at][0],y=POINTS[n][1]-POINTS[at][1];return {n,score:(x*dx+y*dy)/Math.hypot(x,y)};}).sort((a,b)=>b.score-a.score)[0];
   if(next?.score>.2)this.walkTo(next.n,null);
  }
  walkTo(target,chapter){
   if(context.mode()!=='map'||context.modalOpen()||this.walking&&this.walkTarget===target&&this.guidedWalk===(chapter!==null))return;
   const cameraChanged=!!(context.ui?.mapOverview||context.ui?.mapHand);
   if(context.ui?.mapOverview){context.ui.mapOverview=false;this.setMapOverview(false,false);}
   if(context.ui?.mapHand){context.ui.mapHand=false;this.setMapHand(false);}
   this.walkTimer?.remove();this.tweens.killTweensOf(this.avatar);
   this.walking=true;this.guidedWalk=chapter!==null;this.walkTarget=target;const trip=this.travelId=(this.travelId||0)+1;
   const path=route(nearest([context.s.avatar.x,context.s.avatar.y]),target);let i=0,frame=0;
   context.emit('travel-start',{chapter,cameraChanged});
   const timer=this.walkTimer=this.time.addEvent({delay:130,loop:true,callback:()=>{if(!reducedMotion(context.s.settings)){this.avatar.setFrame((this.walkRow||0)*4+(frame++%4));if(frame%2===0)context.emit('footstep');}}});
   const advance=()=>{
    if(trip!==this.travelId)return;
    if(i===path.length){timer.remove();this.walking=false;this.guidedWalk=false;this.avatar.setFrame(0);if(chapter!==null)context.emit('arrived',chapter);return;}
    const node=path[i++],[nx,ny]=POINTS[node],x=nx*W,y=ny*H,dx=x-this.avatar.x,dy=y-this.avatar.y;
    this.walkRow=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
    this.tweens.add({targets:this.avatar,x,y,duration:reducedMotion(context.s.settings)?1:Math.max(70,Math.hypot(dx,dy)*2.7),onComplete:()=>{if(trip!==this.travelId)return;context.s.avatar={x:nx,y:ny};context.emit('map-step');advance();}});
   };advance();
  }
  update(_time,delta=1000/60){
   if(context.mode()!=='map'||!this.avatar)return;
   if(context.modalOpen()||document.hidden)this.mapKeys?.clear();
   else if((!this.walking||this.guidedWalk)&&this.mapKeys?.size){const v=MAP_VECTORS[[...this.mapKeys.values()].at(-1)];this.step(v.x,v.y);}
   const cameraLerp=reducedMotion(context.s.settings)?1:1-Math.exp(-Math.max(0,delta)/95);
   this.cameras.main.setLerp?.(cameraLerp,cameraLerp);
   this.foot?.setPosition(this.avatar.x,this.avatar.y);if(this.spirit){const follow=reducedMotion(context.s.settings)?1:.09;this.spirit.x+=(this.avatar.x-55-this.spirit.x)*follow;this.spirit.y+=(this.avatar.y-12-this.spirit.y)*follow;this.spirit.setFlipX(this.walkRow===1);}
   context.placeDoors(DOORS.map((node,c)=>({chapter:c,x:POINTS[node][0]*W,y:POINTS[node][1]*H})),this.spirit&&{x:this.spirit.x,y:this.spirit.y,w:this.spirit.displayWidth,h:this.spirit.displayHeight});
  }
 }
 // The game uses 2D images and geometry masks; embedded previews need no WebGL context.
 return new P.Game({type:P.CANVAS,parent:'phaser-root',backgroundColor:'#72966e',scale:{mode:P.Scale.RESIZE,autoCenter:P.Scale.NO_CENTER,width:W,height:H},render:{antialias:true},input:{activePointers:3},scene:FieldWorld,banner:false,audio:{noAudio:true}});
}
