import {readFileSync,writeFileSync} from 'node:fs';
let t=readFileSync('game-scenes.js','utf8');
const old="for(const [k,path] of Object.entries(ART))this.load.image(k,path);SCENES.forEach((p,i)=>this.load.image('bg'+i,p));";
const initial="this.aliases={};this.paths={};const canonical=new Map();for(const[k,path]of Object.entries(ART)){if(canonical.has(path))this.aliases[k]=canonical.get(path);else{canonical.set(path,k);this.paths[k]=path;}}SCENES.forEach((p,i)=>this.paths['bg'+i]=p);this.failedAssets=new Set();for(const k of ['forestMap','ipsae','pot3'])this.load.image(k,ART[k]);";
if(!t.includes(old))throw Error('Missing preload target');t=t.replace(old,initial);
t=t.replace("this.load.on('loaderror',f=>context.emit('error','그림을 불러오지 못했어: '+f.key));", "this.load.on('loaderror',f=>{this.failedAssets.add(f.key);context.emit('error','그림을 불러오지 못했어. 연결을 확인하고 새로고침해 줘.');});");
t=t.replace("pic(key,x,y,w,h=w){const ob=", "pic(key,x,y,w,h=w){key=this.aliases[key]||key;const ob=");
t=t.replace("refresh(){this.renderToken=", "refresh(){if(!this.ensureAssets())return;this.renderToken=");
const method=`  ensureAssets(){
   if(this.loadingAssets)return false;
   const s=context.s;let keys;
   if(s.screen==='map')keys=['forestMap','ipsae',...['adult','pot3','lamp','balsam','core'].slice(0,Math.floor(s.completed.length/2))];
   else keys=['bg'+s.mission,'ipsae',...[
    ['egg','larva','pupa','adult'],['egg','larva','pupa','adult'],['vessel','soil','seed0','pot0','watercan','lamp'],
    ['pot0','pot1','pot2','pot3'],['pot3','moistureSensor','lightSensor','watercan','lamp'],
    ['pot3','dry','pale','watercan','lamp'],['egg','larva','pupa','adult','puppy','dogYoung','dog','balsamSprout','balsam','balsamSeeds','balsamDry','appleSpring','appleSummer','apple','winter'],
    ['adult','frog','chicken','dog','balsam','apple'],['book',...recordBank(s).filter(r=>s.book.cards.includes(r.id)).map(r=>r.art).filter(k=>k!=='drawing')],
    ['clock','core','adult','pot3','lamp','season','book','balsam','cheer']
   ][s.mission]];
   const missing=[...new Set(keys.map(k=>this.aliases[k]||k))].filter(k=>this.paths[k]&&!this.textures.exists(k)&&!this.failedAssets.has(k));
   if(!missing.length)return true;
   this.loadingAssets=true;this.load.once('complete',()=>{this.loadingAssets=false;this.refresh();});for(const k of missing)this.load.image(k,this.paths[k]);this.load.start();return false;
  }
`;
t=t.replace('  map(){',method+'  map(){');
writeFileSync('game-scenes.js',t);
