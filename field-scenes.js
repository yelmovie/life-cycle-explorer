import {ART,SCENES} from './game-assets.js';
import {POINTS,EDGES,DOORS,nearest,route} from './game-model.js';
import {FIELD_CHAPTERS} from './field-content.js';
import {renderFieldRoom,fieldRoomAssets} from './field-room-scenes.js';

const P=globalThis.Phaser,W=1280,H=800;
export function createFieldGame(context){
 class FieldWorld extends P.Scene{
  constructor(){super('field-world');}
  preload(){
   this.paths={...ART};SCENES.forEach((path,i)=>this.paths['bg'+i]=path);
   this.load.image('forestMap',ART.forestMap);this.load.image('ipsae',ART.ipsae);this.load.image('guideLook',ART.guideLook);this.load.image('guideStory',ART.guideStory);
   this.load.spritesheet('walker',ART.walk,{frameWidth:256,frameHeight:256});
   this.failed=new Set();this.load.on('loaderror',file=>{this.failed.add(file.key);context.emit('load-error',file.key);});
  }
  create(){context.scene=this;this.renderToken=0;this.refresh();context.emit('loaded');}
  text(x,y,message,size=27,width=420,color='#234d3d'){
   const scale=this.game.canvas.getBoundingClientRect().width/W||1;
   return this.add.text(x,y,message,{fontFamily:'Jua,Malgun Gothic,sans-serif',fontSize:Math.max(size,20/scale),color,align:'center',wordWrap:{width,useAdvancedWrap:true},lineSpacing:6,maxLines:3}).setOrigin(.5).setShadow(0,1,'#fff9dd',2,false,true);
  }
  label(x,y,message,size=25,width=360){return this.text(x,y,message,size,width).setBackgroundColor('#fff9e9ed').setPadding(14,8);}
  pic(key,x,y,w,h=w){const texture=this.textures.exists(key)?key:'guideLook',o=this.add.image(x,y,texture);return o.setScale(Math.min(w/o.width,h/o.height));}
  shadow(x,y,w=210){return this.add.ellipse(x,y,w,25,0x173d2e,.20);}
  click(x,y,w,h,fn,label='대상 살펴보기'){
   const zone=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});zone.on('pointerdown',fn);
   this.focusTargets.push({x,y,w,h,label,fn});return zone;
  }
  drop(x,y,w,h,id,label='여기에 놓기',tap){
   const light=this.add.ellipse(x,y,w,h,0xffe6a2,.13).setStrokeStyle(3,0xf2d891,.7);
   const zone=this.add.zone(x,y,w,h).setRectangleDropZone(w,h).setData('target',id);zone.light=light;
   if(tap)this.click(x,y,w,h,tap,label);return zone;
  }
  draggable(object,kind,data={},label='끌어 옮기기'){
   object.setInteractive({useHandCursor:true});this.input.setDraggable(object);const x=object.x,y=object.y;
   object.on('pointerdown',()=>context.emit('select',{kind,...data}));
   object.on('dragstart',()=>object.setDepth(30).setScale(object.scale*1.05));
   object.on('drag',(_,dx,dy)=>object.setPosition(dx,dy));
   object.on('drop',(_,zone)=>context.emit('drop',{kind,...data,target:zone.getData('target')}));
   object.on('dragend',(_,dx,dy,dropped)=>{if(!dropped)this.tweens.add({targets:object,x,y,duration:context.s.settings.reducedMotion?1:160,onComplete:()=>object.setScale(object.scale/1.05)});});
   this.focusTargets.push({x,y,w:Math.max(64,object.displayWidth),h:Math.max(64,object.displayHeight),label,fn:()=>context.emit('select',{kind,...data})});return object;
  }
  dial(key,x,y,value,max,event,labels){
   const o=this.pic(key,x,y,170).setInteractive({useHandCursor:true}),hand=this.add.graphics();let next=value;
   const draw=n=>{const angle=n/max*Math.PI*2-Math.PI/2;hand.clear().lineStyle(5,0x24583f).lineBetween(x,y,x+Math.cos(angle)*39,y+Math.sin(angle)*39);};draw(value);
   this.input.setDraggable(o);o.on('drag',p=>{next=Math.round(((Math.atan2(p.y-y,p.x-x)+Math.PI*2.5)%(Math.PI*2))/(Math.PI*2)*max);draw(next);});
   o.on('dragend',()=>context.emit(event,next));this.label(x,y+108,labels?.[value]??`${value}일`,23,220);
  }
  refresh(){
   if(this.loading)return;
   const mode=context.mode(),chapter=context.s.field.active;
   const keys=mode==='room'?[...fieldRoomAssets(context),...['guideLook','guideCare','guideTime','guideStory']]:['forestMap','ipsae','guideLook','guideStory'];
   const missing=[...new Set(keys)].filter(key=>this.paths[key]&&!this.textures.exists(key)&&!this.failed.has(key));
   if(missing.length){this.loading=true;this.input.enabled=false;this.load.once('complete',()=>{this.loading=false;this.refresh();});for(const key of missing)this.load.image(key,this.paths[key]);this.load.start();return;}
   this.renderToken++;this.walking=false;this.focusTargets=[];this.tweens.killAll();this.time.removeAllEvents();this.input.removeAllListeners();this.input.keyboard?.removeAllListeners();
   this.children.removeAll(true);for(const key of this.recordTextures||[])if(this.textures.exists(key))this.textures.remove(key);this.recordTextures=[];
   if(this.lensMask){this.lensMask.destroy();this.lensMask=null;}
   this.input.enabled=!context.modalOpen();this.cameras.main.stopFollow();this.cameras.main.setZoom(1).setBounds(0,0,W,H).centerOn(W/2,H/2);
   this.input.on('dragenter',(_,object,zone)=>zone.light?.setAlpha(.65));this.input.on('dragleave',(_,object,zone)=>zone.light?.setAlpha(1));
   if(mode==='room'){
    const bg=chapter===0&&this.textures.exists('fieldClearing')?'fieldClearing':'bg'+chapter*2;
    this.pic(bg,W/2,H/2,W,H).setDisplaySize(W,H);this.add.rectangle(W/2,H/2,W,H,0xf6f0c9,.10);
    renderFieldRoom(this,context);
   }else this.map(mode==='title');
   context.focusTargets(this.focusTargets);context.sceneReady?.();
  }
  map(title=false){
   const s=context.s,completed=s.field.completed;
   this.pic('forestMap',640,400,W,H).setDisplaySize(W,H);
   this.add.rectangle(640,400,W,H,0x173d36,title?.34:Math.max(0,.35-completed.length*.065));
   if(title)return;
   for(const c of completed){const [x,y]=POINTS[DOORS[c]];const aura=this.add.ellipse(x*W,y*H-27,175,135,0xffd773,.20);this.add.circle(x*W-24,y*H-34,10,0xffef9c,.85);this.add.circle(x*W+28,y*H-31,9,0xffef9c,.85);if(!s.settings.reducedMotion)this.tweens.add({targets:aura,alpha:.5,duration:1600,yoyo:true,repeat:-1});}
   const pos=nearest([s.avatar.x,s.avatar.y]),point=POINTS[pos];
   this.avatar=this.add.sprite(point[0]*W,point[1]*H,'walker',0).setDisplaySize(86,86).setOrigin(.5,.83).setDepth(15);
   this.foot=this.add.ellipse(this.avatar.x,this.avatar.y,42,13,0x092f22,.30).setDepth(14);this.spirit=this.pic('ipsae',this.avatar.x+39,this.avatar.y-62,45).setDepth(16);
   this.cameras.main.setZoom(1.08).startFollow(this.avatar,true,.12,.12);
   const land=this.add.zone(W/2,H/2,W,H).setInteractive().setDepth(-1);
   land.on('pointerdown',p=>{const n=nearest([p.worldX/W,p.worldY/H]),c=DOORS.indexOf(n);this.walkTo(n,c<0?null:c);});
   this.input.keyboard?.on('keydown',event=>{const vectors={ArrowUp:[0,-1],KeyW:[0,-1],ArrowDown:[0,1],KeyS:[0,1],ArrowLeft:[-1,0],KeyA:[-1,0],ArrowRight:[1,0],KeyD:[1,0]};const v=vectors[event.code];if(v&&!context.modalOpen()){event.preventDefault();this.step(...v);}});
   const c=context.ui.restoreChapter;
   if(Number.isInteger(c)){
    context.ui.restoreChapter=null;const path=route(DOORS[c],DOORS[4]),glow=this.add.circle(this.avatar.x,this.avatar.y,11,0xffef9d,.95).setDepth(19);let i=0;
    const move=()=>{if(i>=path.length){glow.destroy();return;}const p=POINTS[path[i++]];this.tweens.add({targets:glow,x:p[0]*W,y:p[1]*H,duration:s.settings.reducedMotion?1:145,onComplete:move});};move();
   }
  }
  walkDoor(chapter){if(!Number.isInteger(chapter)||chapter<0||chapter>4)return;this.walkTo(DOORS[chapter],chapter);}
  step(dx,dy){
   if(this.walking||context.mode()!=='map')return;
   const at=nearest([context.s.avatar.x,context.s.avatar.y]),neighbors=EDGES.flatMap(([a,b])=>a===at?[b]:b===at?[a]:[]);
   const next=neighbors.map(n=>{const x=POINTS[n][0]-POINTS[at][0],y=POINTS[n][1]-POINTS[at][1];return {n,score:(x*dx+y*dy)/Math.hypot(x,y)};}).sort((a,b)=>b.score-a.score)[0];
   if(next?.score>.2)this.walkTo(next.n,DOORS.includes(next.n)?DOORS.indexOf(next.n):null);
  }
  walkTo(target,chapter){
   if(this.walking||context.mode()!=='map'||context.modalOpen())return;
   this.walking=true;const path=route(nearest([context.s.avatar.x,context.s.avatar.y]),target);let i=0,frame=0;
   const timer=this.time.addEvent({delay:130,loop:true,callback:()=>{if(!context.s.settings.reducedMotion)this.avatar.setFrame((this.walkRow||0)*4+(frame++%4));}});
   const advance=()=>{
    if(i===path.length){timer.remove();this.walking=false;this.avatar.setFrame(0);if(chapter!==null)context.emit('arrived',chapter);return;}
    const node=path[i++],[nx,ny]=POINTS[node],x=nx*W,y=ny*H,dx=x-this.avatar.x,dy=y-this.avatar.y;
    this.walkRow=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
    this.tweens.add({targets:this.avatar,x,y,duration:context.s.settings.reducedMotion?1:Math.max(70,Math.hypot(dx,dy)*2.7),onComplete:()=>{context.s.avatar={x:nx,y:ny};context.emit('map-step');advance();}});
   };advance();
  }
  update(){
   if(context.mode()!=='map'||!this.avatar)return;
   this.foot?.setPosition(this.avatar.x,this.avatar.y);this.spirit?.setPosition(this.avatar.x+39,this.avatar.y-62);
   const camera=this.cameras.main;
   const origin=camera.getWorldPoint(0,0);
   context.placeDoors(DOORS.map((node,c)=>({chapter:c,x:(POINTS[node][0]*W-origin.x)*camera.zoom,y:(POINTS[node][1]*H-origin.y)*camera.zoom})));
  }
 }
 // The game uses 2D images and geometry masks; embedded previews need no WebGL context.
 return new P.Game({type:P.CANVAS,parent:'phaser-root',backgroundColor:'#72966e',scale:{mode:P.Scale.ENVELOP,autoCenter:P.Scale.CENTER_BOTH,width:W,height:H},render:{antialias:true},input:{activePointers:3},scene:FieldWorld,banner:false,audio:{noAudio:true}});
}
