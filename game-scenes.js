import {ART,SCENES} from './game-assets.js';
import {CHAPTER_NAMES} from './game-metadata.js';
import {POINTS,EDGES,DOORS,route,nearest,LABELS,seedLevel,initialRun,activeRetry,recordBank,restoredChapters,REQUESTS,questSolved} from './game-model.js';
import {renderQuest,timeDial} from './expedition-scenes.js';
const P=globalThis.Phaser, W=1280,H=610;
const ink='#244f40',font='"Malgun Gothic", sans-serif';
export function createGame(context){
 class World extends P.Scene{
  constructor(){super('world');}
  preload(){const label=this.add.text(640,280,'숲의 시간을 깨우는 중…',{fontFamily:font,fontSize:28,color:ink}).setOrigin(.5);this.load.on('progress',p=>label.setText(`숲의 시간을 깨우는 중… ${Math.round(p*100)}%`));this.aliases={};this.paths={};const canonical=new Map();for(const[k,path]of Object.entries(ART)){if(canonical.has(path))this.aliases[k]=canonical.get(path);else{canonical.set(path,k);this.paths[k]=path;}}SCENES.forEach((p,i)=>this.paths['bg'+i]=p);this.failedAssets=new Set();for(const k of ['forestMap','ipsae','pot3'])this.load.image(k,ART[k]);this.load.spritesheet('walker',ART.walk,{frameWidth:256,frameHeight:256});this.load.on('loaderror',f=>{this.failedAssets.add(f.key);context.emit('error','그림을 불러오지 못했어. 연결을 확인하고 새로고침해 줘.');});}
  create(){context.scene=this;this.events.once('shutdown',()=>this.input.removeAllListeners());this.refresh();context.emit('loaded');}
  text(x,y,t,size=23,color=ink){return this.add.text(x,y,t,{fontFamily:font,fontSize:size,color,fontStyle:'bold',align:'center',wordWrap:{width:410}}).setOrigin(.5);}
  pic(key,x,y,w,h=w){key=this.aliases[key]||key;const ob=this.add.image(x,y,this.textures.exists(key)?key:'pot3');const k=Math.min(w/ob.width,h/ob.height);return ob.setScale(k);}
  panel(x,y,w,h){return this.add.rectangle(x,y,w,h,0xfffdeb,.91).setStrokeStyle(2,0xd6dfbd);}
  click(x,y,w,h,fn){const z=this.add.zone(x,y,w,h).setInteractive({useHandCursor:true});z.on('pointerdown',fn);return z;}
  refresh(){
   if(!this.ensureAssets())return;
   this.renderToken=(this.renderToken||0)+1;this.walking=false;
   if(this.lensMask){this.lensMask.destroy();this.lensMask=null;}
   this.tweens.killAll();this.time.removeAllEvents();this.input.removeAllListeners();this.input.keyboard?.removeAllListeners();this.children.removeAll(true);
   for(const k of Object.keys(this.paths))if(!this.neededAssets.has(k)&&this.textures.exists(k))this.textures.remove(k);
   for(const key of [this.recordTexture,...(this.recordTextures||[])])if(key&&this.textures.exists(key))this.textures.remove(key);
   this.recordTexture=null;this.recordTextures=[];
   this.input.enabled=!context.modalOpen();this.s=context.s;this.u=context.ui;this.emit=(a,b)=>context.emit(a,b);
   const map=this.s.screen==='map',height=map?800:610;
   this.scale.scaleMode=map?P.Scale.ENVELOP:P.Scale.FIT;this.scale.setGameSize(1280,height);this.cameras.main.setSize(1280,height);this.cameras.main.setBackgroundColor('#b9d3a4');
   if(map)return this.map();
   const n=this.s.mission;this.pic('bg'+n,640,305,1280,800).setAlpha(.88);this.add.rectangle(640,305,1280,610,0xe9f1d2,.15);this.pic('ipsae',1207,70,90);
   if(this.s.expedition.active!==null)return renderQuest(this,context);
   if(n===0)this.observe();if(n===1)this.film();if(n===2)this.setup(false);if(n===3)this.seeds();if(n===4)this.setup(true);if(n===5)this.recovery();if(n===6)this.archives();if(n===7)this.garden();if(n===8)this.studio();if(n===9)this.clock();
   if(![1,7,9].includes(n))this.pic(['guideLook','guideLook','guideTime','guideTime','guideLook','guideCare','guideTime','guideStory','guideStory','guideStory'][n],92,430,155,230);
  }
  ensureAssets(){
   if(this.loadingAssets)return false;
   const s=context.s;let keys;
   if(s.screen==='map')keys=['forestMap','ipsae',...['adult','pot3','lamp','balsam','core'].slice(0,restoredChapters(s))];
   else keys=['bg'+s.mission,'ipsae',...[
    ['egg','larva','pupa','adult'],['egg','larva','pupa','adult'],['vessel','soil','seed0','pot0','watercan','lamp'],
    ['pot0','pot1','pot2','pot3'],['pot3','plantSensor','moistureSensor','lightSensor','watercan','lamp'],
    ['pot3','dry','pale','watercan','lamp'],['egg','larva','pupa','adult','puppy','dogYoung','dog','balsamSprout','balsam','balsamSeeds','balsamDry','appleSpring','appleSummer','apple','winter'],
    ['adult','frog','chicken','dog','balsam','apple'],['book','storyCamera',...recordBank(s).filter(r=>s.book.cards.includes(r.id)).map(r=>r.art).filter(k=>k!=='drawing')],
    ['clock','core','adult','pot3','lamp','season','book','balsam','cheer']
   ][s.mission]];
   if(s.screen!=='map')keys.push(['guideLook','guideLook','guideTime','guideTime','guideLook','guideCare','guideTime','guideStory','guideStory','guideStory'][s.mission]);
   if(s.screen!=='map'&&[3,5,6].includes(s.mission))keys.push('timeWheel','seasonCompass');
   if(s.expedition.active!==null&&s.screen!=='map'){
    const c=s.expedition.active;
    keys.push('guideStory','guideTime','guideCare',REQUESTS[c].art,...[
     ['egg','larva','pupa','adult','leaf'],['pot0','pot1','pot2','pot3','watercan','lamp','timeWheel'],
     ['plantSensor','dry','pale','pot3','watercan','lamp','timeWheel'],['puppy','apple','rose'],
     recordBank(s).filter(r=>r.evidence).map(r=>r.art)
    ][c]);
   }
   this.neededAssets=new Set([...keys.map(k=>this.aliases[k]||k),'pot3','forestMap','ipsae']);
   const missing=[...new Set(keys.map(k=>this.aliases[k]||k))].filter(k=>this.paths[k]&&!this.textures.exists(k)&&!this.failedAssets.has(k));
   if(!missing.length)return true;
   this.loadingAssets=true;this.input.enabled=false;this.load.once('complete',()=>{this.loadingAssets=false;this.input.enabled=!context.modalOpen();this.refresh();});for(const k of missing)this.load.image(k,this.paths[k]);this.load.start();return false;
  }
  map(){
   const s=this.s,cleared=restoredChapters(s),mapImage=this.pic('forestMap',640,400,1280,800);
   this.mapBounds={x:mapImage.x-mapImage.displayWidth/2,y:mapImage.y-mapImage.displayHeight/2,w:mapImage.displayWidth,h:mapImage.displayHeight};
   mapImage.setInteractive().on('pointerdown',p=>{const b=this.mapBounds,n=nearest([(p.x-b.x)/b.w,(p.y-b.y)/b.h]),chapter=DOORS.indexOf(n);this.walk(n,chapter<0?null:chapter);});
   this.add.rectangle(640,400,1280,800,0x183e46,Math.max(0,.15-cleared*.03));
   DOORS.forEach((n,i)=>{
    const [x,y]=this.mapPoint(n),open=i<=Math.floor(s.completed.length/2),done=s.completed.includes(i*2+1)&&questSolved(s,i);
    this.add.circle(x,y,29,done?0x2e7950:open?0xf6da7a:0x5c7770,.98).setStrokeStyle(4,0xfff6d5);
    this.text(x,y,done?'✓':open?String(i+1):'⌁',26,open?ink:'#e1e9d2');
    this.text(x,y-53,CHAPTER_NAMES[i],23).setBackgroundColor('#fff7dbef').setPadding(12,7);
    this.click(x,y-17,190,100,()=>this.walk(n,i));
    if(done){const ob=this.pic(['adult','pot3','lamp','balsam','core'][i],x+58,y+31,75);if(i===0&&!s.settings.reducedMotion)this.tweens.add({targets:ob,y:ob.y-15,duration:1100,yoyo:true,repeat:-1});}
   });
   const pos=nearest([s.avatar.x,s.avatar.y]);this.avatar=this.add.sprite(...this.mapPoint(pos),'walker',0).setDisplaySize(95,95).setOrigin(.5,.8).setDepth(8);this.mapSpirit=this.pic('ipsae',this.avatar.x+35,this.avatar.y-52,42).setDepth(7);
   this.input.keyboard?.on('keydown',event=>{
    const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(!dirs[event.key]||this.walking||context.modalOpen())return;
    event.preventDefault();const a=nearest([s.avatar.x,s.avatar.y]),[dx,dy]=dirs[event.key],neighbors=EDGES.flatMap(([x,y])=>x===a?[y]:y===a?[x]:[]);
    const next=neighbors.map(n=>({n,score:((POINTS[n][0]-POINTS[a][0])*dx+(POINTS[n][1]-POINTS[a][1])*dy)/Math.hypot(POINTS[n][0]-POINTS[a][0],POINTS[n][1]-POINTS[a][1])})).sort((a,b)=>b.score-a.score)[0];
    if(next?.score>.2)this.walk(next.n,null);
   });
  }
  mapPoint(n){const b=this.mapBounds||{x:0,y:0,w:1280,h:610};return [b.x+POINTS[n][0]*b.w,b.y+POINTS[n][1]*b.h];}
  walk(target,chapter){
   if(this.walking)return;
   if(chapter!==null&&chapter>Math.floor(this.s.completed.length/2))return this.emit('toast','앞 구역의 탐구와 의뢰를 마치면 이 길이 열려.');
   this.walking=true;const points=route(nearest([this.s.avatar.x,this.s.avatar.y]),target);let i=0,frame=0;
   const timer=this.time.addEvent({delay:125,loop:true,callback:()=>this.avatar?.setFrame((frame++%4)+(this.walkRow||0)*4)});
   const next=()=>{
    if(i>=points.length){timer.remove();this.walking=false;if(chapter!==null)this.emit('arrived',chapter);return;}
    const node=points[i++],[x,y]=this.mapPoint(node),dx=x-this.avatar.x,dy=y-this.avatar.y,d=Math.hypot(dx,dy);
    this.walkRow=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;
    this.tweens.add({targets:this.avatar,x,y,duration:this.s.settings.reducedMotion?1:Math.max(60,d*3),onUpdate:()=>this.mapSpirit.setPosition(this.avatar.x+35,this.avatar.y-52),onComplete:()=>{this.s.avatar={x:POINTS[node][0],y:POINTS[node][1]};this.emit('map-step');next();}});
   };next();
  }
  draggable(ob,type,detail){ob.setInteractive({useHandCursor:true});this.input.setDraggable(ob);const x=ob.x,y=ob.y;ob.on('dragstart',()=>ob.setDepth(15));ob.on('drag',(_,dx,dy)=>ob.setPosition(dx,dy));ob.on('dragend',(_,dx,dy,dropped)=>{if(!dropped)this.tweens.add({targets:ob,x,y,duration:160});});ob.on('drop',(_,zone)=>this.emit(type,{...detail,target:zone.getData('target')}));return ob;}
  drop(x,y,w,h,target){return this.add.zone(x,y,w,h).setRectangleDropZone(w,h).setData('target',target);}
  pin(x,y,label=''){this.add.circle(x,y,15,0xf2c665).setStrokeStyle(3,0xfff9e5);this.text(x,y,'•',22);if(label)this.text(x,y+30,label,16);}
  observe(){const id=this.u.species||'egg',drawing=this.u.draw;this.panel(drawing?410:615,310,drawing?630:790,430);const image=this.pic(id,drawing?390:600,300,drawing?470:620,390);this.text(drawing?390:600,536,LABELS[id],28);if(drawing){this.panel(985,300,370,340);this.text(985,98,'관찰 그림',24);const lines=this.add.graphics().lineStyle(4,0x285c45);const paint=stroke=>{for(let i=1;i<stroke.length;i++)lines.lineBetween(800+stroke[i-1][0]*370,130+stroke[i-1][1]*340,800+stroke[i][0]*370,130+stroke[i][1]*340);};this.s.discovery.drawing.forEach(paint);let stroke=null;this.input.on('pointerdown',p=>{if(p.x>=800&&p.x<=1170&&p.y>=130&&p.y<=470)stroke=[[(p.x-800)/370,(p.y-130)/340]];});this.input.on('pointermove',p=>{if(!stroke||!p.isDown)return;const q=[P.Math.Clamp((p.x-800)/370,0,1),P.Math.Clamp((p.y-130)/340,0,1)];stroke.push(q);paint(stroke.slice(-2));});this.input.on('pointerup',()=>{if(stroke?.length>1)this.emit('draw',stroke);stroke=null;});return;}
   const pos=this.u.lens||{x:.5,y:.5},bounds={x:image.x-image.displayWidth/2,y:image.y-image.displayHeight/2,w:image.displayWidth,h:image.displayHeight};
   this.panel(1060,292,270,310);this.text(1060,105,'2× 관찰 렌즈',20);const maskShape=this.make.graphics().fillStyle(0xffffff).fillCircle(1060,275,118),mask=maskShape.createGeometryMask();this.lensMask=maskShape;const zoom=this.pic(id,1060,275,image.displayWidth*2,image.displayHeight*2).setMask(mask);const lens=this.add.circle(0,0,54,0xffffff,.10).setStrokeStyle(5,0xf1c565).setInteractive({useHandCursor:true});this.input.setDraggable(lens);const place=(nx,ny)=>{lens.setPosition(bounds.x+nx*bounds.w,bounds.y+ny*bounds.h);zoom.setPosition(1060+(image.x-lens.x)*2,275+(image.y-lens.y)*2);this.u.lens={x:nx,y:ny,zoom:2};};place(pos.x,pos.y);lens.on('drag',(_,x,y)=>place(P.Math.Clamp((x-bounds.x)/bounds.w,0,1),P.Math.Clamp((y-bounds.y)/bounds.h,0,1)));image.setInteractive({useHandCursor:true}).on('pointerdown',p=>place(P.Math.Clamp((p.x-bounds.x)/bounds.w,0,1),P.Math.Clamp((p.y-bounds.y)/bounds.h,0,1)));this.text(1060,424,'렌즈를 끌어 살펴봐',19);const pin=this.s.inquiry.pins[id];if(pin)this.pin(bounds.x+pin.x*bounds.w,bounds.y+pin.y*bounds.h);}
  film(){const s=this.s;if(s.phase[1]){this.panel(640,300,1040,430);for(const[id,x]of[['larva',385],['adult',895]]){this.pic(id,x,295,380,330);this.text(x,490,LABELS[id],25);this.click(x,285,390,330,p=>this.emit('compare-pin',{id,p:{x:P.Math.Clamp((p.x-x+195)/390,0,1),y:P.Math.Clamp((p.y-120)/330,0,1),zoom:1}}));const p=s.inquiry.compare[id];if(p)this.pin(x-195+p.x*390,120+p.y*330);}if(s.cycle.generation){this.pic('egg',1120,390,95);this.text(1110,490,'다음 세대',18);}return;}
   s.cycle.order.forEach((id,i)=>{const x=220+i*280;this.panel(x,305,240,320);this.pic(id,x,290,215,230);this.text(x,445,LABELS[id],22);this.text(x,110,String(i+1),27);const zone=this.add.rectangle(x,300,238,315,0xffffff,0).setInteractive({useHandCursor:true});this.input.setDraggable(zone);zone.on('drag',(_,dx,dy)=>zone.setPosition(dx,dy).setStrokeStyle(4,0xe4b343));zone.on('dragend',()=>this.emit('film-move',{from:i,to:P.Math.Clamp(Math.round((zone.x-220)/280),0,3)}));this.click(x,510,200,65,()=>this.emit('film-select',i));});if(this.u.play){const frame=this.add.rectangle(220,305,254,332).setStrokeStyle(8,0xefbc4b).setFillStyle(0,0);let step=0;this.time.addEvent({delay:850,repeat:3,callback:()=>{frame.x=220+step++*280;if(step===4)this.emit('film-end');}});}}
  setup(growth){const d=growth?this.s.greenhouse:this.s.seed;for(const[k,x]of[['a',405],['b',795]]){this.panel(x,303,335,440);this.text(x,105,'화분 '+k.toUpperCase(),28);const prepared=growth||d.prepared[k].seeds;this.pic(growth?'pot3':prepared?'pot0':'vessel',x,305,290,280);if(!growth&&d.prepared[k].soil&&!prepared)this.pic('soil',x,340,185,80);this.drop(x,300,335,420,k);this.click(x,300,310,280,()=>this.emit('pot',k));const keys=growth?['water','light']:['water','warm'];keys.forEach((key,j)=>{const known=!growth||d.sensors.includes(k+'-'+key);this.text(x,462+j*36,known?this.condition(key,d[k][key]):LABELS[key]+'  ? 센서가 필요해',20);});}
   const keys=growth?(this.s.phase[4]?['water','light']:['moistureSensor','lightSensor']):(this.s.phase[2]?['water','warm']:['soil','seed']);keys.forEach((key,i)=>{const arts={water:'watercan',warm:'lamp',light:'lamp',soil:'soil',seed:'seed0'};const names={soil:'흙',seed:'씨앗',moistureSensor:'물 센서',lightSensor:'빛 센서',water:'물 조절',warm:'온도 조절',light:'빛 조절'};this.panel(1117,190+i*180,180,155);this.draggable(this.pic(growth&&!this.s.phase[4]?'plantSensor':arts[key]||key,1117,170+i*180,110),growth&&!this.s.phase[4]?'sensor':'supply',{tool:key});this.text(1117,245+i*180,names[key],21);});}
  condition(key,value){return key==='water'?'물 '+(value?'있음':'없음'):key==='warm'?'온도 '+(value?'따뜻함':'차가움'):'빛 '+(value?'있음':'없음');}
  seeds(){const s=this.s,retry=this.u.retry,r=retry?activeRetry(s):initialRun(s),day=retry?s.inquiry.retryDay:s.journey.day;if(!r){this.text(640,300,'먼저 씨앗 실험을 설계해 줘.',28);return;}const keys=retry?['before','after']:['a','b'];keys.forEach((key,i)=>{const x=420+i*450,c=r.conditions[key],level=seedLevel(c,day);this.panel(x,285,385,410);this.text(x,105,retry?(i?'새 실험':'이전 실험'):'화분 '+key.toUpperCase(),27);this.pic('pot'+level,x,300,295,290);if(s.journey.peek){this.add.rectangle(x,385,232,105,0xcba877,.78).setStrokeStyle(3,0xf7df9e);const g=this.add.graphics().lineStyle(4,0x755331);if(level>0){for(let j=0;j<5;j++)g.lineBetween(x,349,x+(j-2)*20,365+level*18);g.lineBetween(x,345,x,400+level*10);}else this.add.ellipse(x,368,28,20,0xd9b466);this.text(x,450,'흙 속 단면 · 모형',17);}this.text(x,505,[this.condition('water',c.water),this.condition('warm',c.warm)].join(' / '),20);});timeDial(this,'timeWheel',1150,340,day,7,'day');}
  scrubber(value,max,type){const x0=170,y=566,wide=940;this.add.rectangle(640,y,wide,8,0xe4d28e);for(let d=0;d<=max;d++)this.add.circle(x0+d*wide/max,y,6,0x5a8761);const ob=this.add.circle(x0+value*wide/max,y,22,0xf3d170).setStrokeStyle(4,0xfff6d3).setInteractive({useHandCursor:true});this.input.setDraggable(ob);ob.on('drag',(_,x)=>{ob.x=P.Math.Clamp(x,x0,x0+wide);});ob.on('dragend',()=>this.emit(type,Math.round((ob.x-x0)/wide*max)));}
  recovery(){const s=this.s,c=s.inquiry.care,weak=s.greenhouse.a[s.greenhouse.question]?'b':'a';for(const[k,x]of[['a',400],['b',850]]){const poor=k===weak&&(!s.recovery.repaired||c.step<2);this.panel(x,292,375,420);const art=poor?(s.greenhouse.question==='water'?'dry':'pale'):'pot3';this.pic(art,x,300,330,320).setAlpha(poor&&s.recovery.repaired&&c.step===1?.82:1);this.text(x,104,'화분 '+k.toUpperCase(),27);this.text(x,490,k===weak&&s.recovery.repaired?['돌봄 직후','며칠 뒤 · 새잎이 자라는 중','더 며칠 뒤 · 새잎을 확인해'][c.step]:'같은 날의 모습',19);this.drop(x,300,375,420,k);this.click(x,300,330,320,p=>this.emit('care-pin',{id:k,p:{x:P.Math.Clamp((p.x-x+165)/330,0,1),y:P.Math.Clamp((p.y-140)/320,0,1),zoom:1}}));const pin=c.pins[k];if(pin)this.pin(x-165+pin.x*330,140+pin.y*320);}if(s.phase[5]&&!s.recovery.repaired){this.draggable(this.pic('watercan',1157,220,125),'repair',{tool:'water'});this.draggable(this.pic('lamp',1157,405,125),'repair',{tool:'light'});}if(s.recovery.repaired)timeDial(this,'timeWheel',1157,420,c.step,2,'care-day');}
  archives(){const s=this.s;if(!s.phase[6]){for(const[id,x,max]of[['butterfly',395,3],['dog',875,2]]){const step=s.inquiry.animalSteps[id],arts=id==='butterfly'?['egg','larva','pupa','adult']:['puppy','dogYoung','dog'];this.panel(x,293,430,425);this.pic(arts[step],x,300,360,310);this.text(x,110,LABELS[id]+'의 시간',26);this.text(x,488,id==='butterfly'?['알에서 시작','먹으며 자라','몸이 바뀌는 중','날개를 가진 어른벌레'][step]:['어미에게서 태어난 새끼','자라는 강아지','다 자란 개'][step],20);}return;}
   const q=s.inquiry.season;const balsam=['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'][q.step],apple=['appleSpring','appleSummer','apple','winter','appleSpring'][q.step];for(const[id,key,x]of[['balsam',balsam,405],['apple',apple,870]]){this.panel(x,300,410,435);this.pic(key,x,300,360,330);this.text(x,110,LABELS[id],27);if(q.tagged){this.add.rectangle(x+110,365,93,46,0xf1d184);this.text(x+110,365,(id==='balsam'&&q.step===4?'새 B-02':id==='balsam'?'B-01':'A-01'),17);}this.text(x,500,['봄','여름','가을','겨울','다음 봄'][q.step],23);}timeDial(this,'seasonCompass',1140,400,q.step,4,'season');}
  garden(){const s=this.s,groups=[['egg','알에서 태어나는 동물'],['live','새끼로 태어나는 동물'],['annual','한해살이 식물'],['perennial','여러해살이 식물']];groups.forEach(([key,name],i)=>{const x=178+i*307;this.panel(x,412,284,285);this.text(x,298,name,19);this.drop(x,410,285,280,key);this.click(x,410,280,275,()=>this.emit('classify',{id:this.u.garden||'butterfly',group:key}));const ids=Object.keys(s.garden.placements).filter(id=>s.garden.placements[id]===key);ids.forEach((id,j)=>{if(id==='rose')this.text(x+(j-1)*70,415,'✿',54,'#bd6582');else this.pic(id==='butterfly'?'adult':id,x+(j-1)*70,415,100);this.text(x+(j-1)*70,501,LABELS[id],17);});});const id=s.phase[7]?'rose':this.u.garden||'butterfly';if(id==='rose'){this.panel(640,140,600,145);this.text(640,138,'장미 관찰 카드\n지난해와 같은 줄기의 표식 R-01\n겨울을 지나 다음 봄에 새잎이 났어',22);this.draggable(this.text(1060,150,'✿ 장미',30),'garden-drop',{id});}else{this.draggable(this.pic(id==='butterfly'?'adult':id,640,145,170,180),'garden-drop',{id});this.text(860,140,LABELS[id]+'를 알맞은 정원으로',22);}}
  studio(){this.pic('storyCamera',1150,425,125).setInteractive({useHandCursor:true}).on('pointerdown',()=>this.emit('story-camera'));const bank=recordBank(this.s),cards=this.s.book.cards.map(id=>bank.find(r=>r.id===id)).filter(Boolean);this.panel(640,285,970,420);if(!cards.length){this.pic('book',640,285,290);this.text(640,500,'내 기록을 담아 이야기를 만들자',25);return;}let index=this.u.card||0;const show=i=>{const r=cards[i%cards.length];const token=this.renderToken,preview=this.pic(r.art==='drawing'?'book':r.art,440,300,405,310);context.recordImage(r,this.s).then(data=>{if(this.renderToken!==token)return;const key='evidence-'+r.id+'-'+token;this.recordTexture=key;this.textures.once('addtexture-'+key,()=>{if(this.renderToken===token&&preview.active){preview.setTexture(key);preview.setScale(Math.min(430/preview.width,330/preview.height));}});this.textures.addBase64(key,data);}).catch(()=>this.emit('toast','기록 그림을 다시 불러와 줘.')); this.text(845,175,r.title,27);this.text(845,300,this.s.book.captions[r.id]||'이 기록에 설명을 붙여 줘.',22);this.text(845,440,`${i%cards.length+1} / ${cards.length}`,20);};show(index);if(this.u.play){this.time.addEvent({delay:2100,repeat:cards.length-1,callback:()=>{this.emit('story-frame',++index%cards.length);}});}}
  clock(){const s=this.s;this.pic('clock',640,303,530,520);const colors=[0x80b57e,0xe3bd65,0x7db9a3,0xc4a7c9,0xe9b477];for(let i=0;i<5;i++){const a=(i/5*Math.PI*2)-Math.PI/2,x=640+Math.cos(a)*244,y=307+Math.sin(a)*244;this.add.circle(x,y,52,s.clock.rings.includes(i)?colors[i]:0x809383).setStrokeStyle(5,0xf4e9ba);this.text(x,y,String(i+1),26,'#fff9de');this.drop(x,y,110,110,String(i));}if(s.clock.rings.length<5){const i=this.u.ring||0;this.panel(171,295,232,242);this.draggable(this.pic(['adult','pot3','lamp','season','book'][i],171,270,160),'ring-drop',{ring:i});this.text(171,401,['관찰과 변화','씨앗 실험','식물의 돌봄','한살이 비교','나의 이야기'][i],22);}else{const core=this.pic('core',640,300,180);if(!s.settings.reducedMotion)this.tweens.add({targets:core,scale:core.scale*1.08,alpha:.65,duration:1000,yoyo:true,repeat:-1});if(s.completed.length===10){this.pic('adult',1020,150,170);this.pic('balsam',1070,410,235);this.pic('cheer',170,350,235);this.text(640,570,'서로 다른 생명의 시간이 다시 흘러!',27);}}}
 }
 return new P.Game({type:P.AUTO,parent:'phaser-root',backgroundColor:'#d7e4c6',scale:{mode:P.Scale.FIT,autoCenter:P.Scale.CENTER_BOTH,width:W,height:H},render:{antialias:true},input:{activePointers:3},scene:World,banner:false,audio:{noAudio:true}});
}
