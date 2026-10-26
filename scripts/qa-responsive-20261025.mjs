import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {initialField} from '../src/field-model.js';
import {applyQuest} from '../src/field-quests.js';
import {roomPhase} from '../src/field-flow.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.tmp/responsive-20261025-'+(process.env.RESPONSIVE_LABEL||'baseline'));
await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const earned=JSON.parse(await readFile(path.join(root,process.env.RESPONSIVE_FIXTURE||'.tmp/recovery-play/earned-state.json'),'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true}),base=process.env.BASE_URL||'http://127.0.0.1:4318';
const allViews=[[1595,892],[1280,800],[1024,768],[906,755],[873,580],[812,375],[768,1024],[375,812]];
const views=allViews.filter(v=>!process.env.RESPONSIVE_VIEWS||process.env.RESPONSIVE_VIEWS.split(',').includes(v.join('x')));
const results=[],errors=[],specs=[];
function room(c,mutate=()=>{}){const s=structuredClone(earned);s.field.active=c;s.fieldView='room';s.field.completed=Array.from({length:c},(_,i)=>i);s.audio={bgm:false,sfx:false,volume:.2};s.settings.reducedMotion=true;mutate(s.field.chapters[c],s);return s;}
const add=(name,s,action)=>specs.push({name,s,action});
const basic=initialField();
add('title',room(0,(_,s)=>{s.fieldView='title';}));add('map',room(2,(_,s)=>{s.fieldView='map';}));
const observation=room(0,(_,s)=>s.field.chapters[0]=structuredClone(basic.chapters[0]));add('observation',observation);
const drawing=room(0,q=>{q.drawing=[];q.note='';});add('drawing',drawing);
add('film',room(0,q=>q.order=['pupa','egg','adult','larva']));add('generation',room(0,q=>q.generation=''));
add('seed-prepare',room(1,(_,s)=>s.field.chapters[1]=structuredClone(basic.chapters[1])));
add('seed-design',room(1,q=>{q.round=0;q.rounds[0].run=null;}));
const seedGrow=room(1,q=>{q.round=0;Object.assign(q.rounds[0],{day:3,photos:[0],reason:''});});add('seed-grow',seedGrow);
add('seed-reason',room(1,q=>{q.round=0;q.rounds[0].reason='';}));
add('seed-next',room(1,q=>{q.round=0;q.rounds[1]=structuredClone(basic.chapters[1].rounds[1]);}));
add('care-measure',room(2,(_,s)=>s.field.chapters[2]=structuredClone(basic.chapters[2])));
for(const [name,patch]of [['symptom',{measured:['water','light'],symptom:'',photos:[],tool:''}],['before',{photos:[],tool:''}],['tool',{photos:[0],tool:''}],['after',{photos:[0],day:1}],['next',{}]])add('care-'+name,room(2,q=>{q.case=0;q.cases[1]=structuredClone(basic.chapters[2].cases[1]);Object.assign(q.cases[0],patch);}));
add('animals',room(3,(_,s)=>s.field.chapters[3]=structuredClone(basic.chapters[3])));
add('animal-birth',room(3,q=>q.generation=''));
add('tags',room(3,q=>{q.tags=[];q.plantPhotos=[];}));
add('seasons',room(3,q=>{q.plantPhotos=['apple-0','balsam-0'];q.season=3;}));
add('plant-identity',room(3,q=>q.classifications={}));add('transfer',room(3,q=>q.transfers={}));
const records=['field-observation-egg','field-seed-water','field-care-water'];
const storyEmpty=room(4,q=>Object.assign(q,{records:[],title:'',summary:'',captions:{},matches:{},plan:{subject:'',when:'',what:''}}));add('story-empty',storyEmpty);
const storyEdit=room(4,q=>Object.assign(q,{records,title:'',summary:'',captions:{},matches:{},plan:{subject:'',when:'',what:''}}));add('story-edit',storyEdit);
add('story-help',room(4,q=>q.matches={}));
const storyPlan=room(4,q=>{q.plan={subject:'',when:'',what:''};q.title='물과 빛을 살피며 내가 찾아낸 생명의 변화와 다음 봄의 새로운 발견';q.summary='물과 빛의 조건을 하나씩 바꾸어 비교하고 관찰한 모습을 그림과 사진으로 남겼다. 다음에는 우리 교실에서 자라는 실제 식물을 같은 자리에서 꾸준히 관찰하고 싶다.';});add('story-plan-long',storyPlan);
const firstSteps=[[{kind:'connect',target:'larva'},{kind:'record'}],[{kind:'repair',setting:'warm'},{kind:'verify'}],[{kind:'check',clue:'water'},{kind:'check',clue:'light'},{kind:'decide',choice:'keep'}],[{kind:'track',mark:'A-01'},{kind:'record'}],[{kind:'stamp',recordId:'field-observation-egg'},{kind:'stamp',recordId:'field-seed-water'},{kind:'stamp',recordId:'field-care-water'}]];
for(let c=0;c<5;c++){
 const s=room(c,q=>q.discovery=[]);add(`discovery-${c}-0`,structuredClone(s));for(const payload of firstSteps[c])applyQuest(s.field,{step:0,...payload});add(`discovery-${c}-1`,s);
 add('reward-'+c,room(c));
}
async function click(p,selector){await p.locator(selector).click();}
async function settings(p){await click(p,'#app [data-action=settings]');}
const completed=room(4,(_,s)=>s.field.completed=[0,1,2,3,4]);
add('opening',room(0,(_,s)=>s.fieldView='title'),p=>click(p,'[data-action=start]'));
add('settings',completed,settings);
add('settings-teacher',completed,async p=>{await settings(p);await click(p,'summary:text-is("교사용 가이드")');await click(p,'summary:text-is("교사용 도구")');});
add('concept-library',completed,async p=>{await settings(p);await click(p,'[data-action=concept-list]');});
add('concept-library-locked',room(0),async p=>{await settings(p);await click(p,'[data-action=concept-list]');});
add('records',completed,async p=>{await settings(p);await click(p,'summary:text-is("앱 정보 · 배움과 보상")');await click(p,'[data-action=records]');});
add('certificate',completed,async p=>{await settings(p);await click(p,'[data-action=certificate]');});
add('ending',completed,async p=>{await settings(p);await click(p,'[data-action=ending]');});
add('concept',room(0),async p=>{await click(p,'[data-action=concept]');await p.waitForTimeout(160);await p.evaluate(()=>document.querySelectorAll('video').forEach(v=>v.pause()));});
add('observation-note',observation,async p=>{const b=await p.locator('canvas').boundingBox();await p.touchscreen.tap(b.x+231*b.width/1280,b.y+381*b.height/800);});
add('own-note',drawing,p=>click(p,'[data-field-action=note]'));
add('seed-photo',seedGrow,p=>click(p,'#next'));
add('story-writing',storyEdit,p=>click(p,'[data-field-action=story-info]'));
add('story-caption',storyEdit,p=>click(p,'[data-field-action=story-caption]'));
add('guide',observation,async p=>{await click(p,'[data-action=guide]');await p.locator('#guide-bubble:not([hidden])').waitFor({state:'visible'});});
for(let c=0;c<5;c++){
 add('reward-dialog-'+c,room(c),async p=>{await click(p,'#next');await p.locator('.reward-dialog').waitFor({state:'visible'});});
 add('teacher-phase-'+c,room(c),async p=>{
  await settings(p);await click(p,'summary:text-is("교사용 가이드")');await click(p,'summary:text-is("교사용 도구")');await click(p,'[data-action=teacher-preview]');
  if(await p.locator('#modal[open]').isVisible())await p.locator('#modal [data-action=close]').first().click();
  if(await p.locator('#app').getAttribute('data-view')==='map')await click(p,`#map-doors [data-chapter="${c}"]`);
  await p.locator('[data-preview-phase]').selectOption(['generation','design','care-before','plant-identity','story-help'][c]);
  await p.waitForFunction(()=>!document.querySelector('#status').classList.contains('visible'));
 });
}

/**
 * Isolated visual audit. Fixtures are QA demonstrations, never student evidence.
 * This audit also inspects canvas glyphs after actual camera projection.
 */
const representative=new Set([
 'title','map','observation','drawing','film','generation','seed-prepare','seed-design','seed-grow','seed-reason',
 'care-measure','care-symptom','care-before','care-tool','care-after','animals','animal-birth','tags','seasons','plant-identity','transfer',
 'story-empty','story-edit','story-help','story-plan-long','discovery-0-0','discovery-1-0','discovery-2-0','discovery-2-1','discovery-3-0','discovery-4-0',
 'opening','settings','settings-teacher','concept-library','records','certificate','ending','concept','own-note','story-writing','story-caption','guide',
 'reward-dialog-0','reward-dialog-1','reward-dialog-2','reward-dialog-3','reward-dialog-4'
]);
const filter=process.env.RESPONSIVE_SCREENS?.split(',');
const selected=specs.filter(s=>filter?filter.includes(s.name):representative.has(s.name));
const sourceFiles=['src/game-app.js','src/game.css','src/game-shell.css','src/field-scenes.js','src/field-plant-scenes.js','src/field-room-scenes.js','src/field-story-scenes.js','src/field-quests.js'];
async function sourceStamp(){
 const rows=await Promise.all(sourceFiles.map(async file=>({file,sha256:createHash('sha256').update(await readFile(path.join(root,file))).digest('hex')})));
 return Object.fromEntries(rows.map(r=>[r.file,r.sha256]));
}
const before=await sourceStamp();
const findings=[],startedAt=new Date().toISOString();
const observationSpec=specs.find(s=>s.name==='observation-note');
observationSpec.action=async page=>{
 const point=await page.evaluate(()=>{
  const scene=window.__qaGame?.scene.getScene('field-world'),target=scene?.focusTargets?.find(t=>/알/.test(t.label));
  if(!target||!scene.projectWorld)throw new Error('Projected observation target unavailable');
  const p=scene.projectWorld(target),r=scene.game.canvas.getBoundingClientRect(),v=scene.viewportSize();
  return {x:r.x+p.x*r.width/v.width,y:r.y+p.y*r.height/v.height};
 });
 await page.touchscreen.tap(point.x,point.y);
};
async function metrics(page){
 return page.evaluate(()=>{
  const visible=e=>!!e&&!!e.getClientRects().length&&!e.hidden&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&Number(getComputedStyle(e).opacity)!==0;
  const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const box=(x,y,width,height)=>({x,y,width,height,right:x+width,bottom:y+height});
  const intersect=(a,b)=>{const x=Math.max(a.x,b.x),y=Math.max(a.y,b.y),right=Math.min(a.right,b.right),bottom=Math.min(a.bottom,b.bottom);return box(x,y,Math.max(0,right-x),Math.max(0,bottom-y));};
  const meaningful=(a,b)=>{const i=intersect(a,b);return i.width>2&&i.height>2&&i.width*i.height>Math.min(a.width*a.height,b.width*b.height)*.06?i:null;};
  const label=e=>(e.getAttribute('aria-label')||e.textContent||e.id||e.className).trim().replace(/\s+/g,' ').slice(0,110);
  const viewport=box(0,0,innerWidth,innerHeight);
  function clippedRect(e){
   let r=intersect(rect(e),viewport);
   for(let a=e.parentElement;a&&a!==document.documentElement;a=a.parentElement){const c=getComputedStyle(a);if(/hidden|clip|scroll|auto/.test(c.overflow+c.overflowX+c.overflowY))r=intersect(r,rect(a));}
   return r;
  }
  const portrait=document.querySelector('.portrait'),portraitBlocked=visible(portrait)&&getComputedStyle(portrait).pointerEvents==='auto';
  const modal=document.querySelector('dialog[open]');
  const surface=modal||(portraitBlocked?portrait:document.querySelector('#app'));
  const controls=[...surface.querySelectorAll('button,input,select,textarea,summary')].filter(e=>visible(e)&&!e.classList.contains('focus-target'));
  const controlData=controls.map((e,i)=>{
   const r=rect(e),clip=clippedRect(e),c=getComputedStyle(e),inBody=!!e.closest('.modal-body'),inFooter=!!e.closest('.dialog-actions');
   const cx=(clip.x+clip.right)/2,cy=(clip.y+clip.bottom)/2,top=clip.width>0&&clip.height>0?document.elementFromPoint(cx,cy):null;
   return {id:i,label:label(e),tag:e.tagName,...r,clip,font:parseFloat(c.fontSize),inBody,inFooter,inGameFooter:!!e.closest('.game-footer'),disabled:!!e.disabled,reachable:!!top&&(top===e||e.contains(top)),outside:r.x<-.5||r.y<-.5||r.right>innerWidth+.5||r.bottom>innerHeight+.5};
  });
  const out=controlData.filter(c=>c.outside&&(!c.inBody||c.inFooter));
  const obscured=controlData.filter(c=>c.clip.width>=10&&c.clip.height>=10&&!c.reachable&&(c.inFooter||!c.inBody));
  const overlaps=[];
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
   if(controls[i].contains(controls[j])||controls[j].contains(controls[i]))continue;
   const a=controlData[i],b=controlData[j],hit=meaningful(a.clip,b.clip);if(hit)overlaps.push({a:a.label,b:b.label,intersection:hit});
  }
  const textClips=[];
  for(const e of [...surface.querySelectorAll('button,label,p,h1,h2,h3,figcaption,small,.tool-hint')].filter(visible)){
   const c=getComputedStyle(e);if(e.closest('.modal-body')&&clippedRect(e).height<rect(e).height-2)continue;
   if(e.scrollWidth>e.clientWidth+2&&e.clientWidth>0&&!/auto|scroll/.test(c.overflowX))textClips.push({label:label(e),kind:'horizontal-text-overflow',scroll:e.scrollWidth,client:e.clientWidth});
  }
  const images=[...surface.querySelectorAll('img')].filter(visible).map(e=>({label:e.alt,loaded:e.complete&&e.naturalWidth>0,...rect(e)}));
  const footer=modal?.querySelector('.dialog-actions'),body=modal?.querySelector('.modal-body'),heading=modal?.querySelector('h2');
  const modalLayout=modal?{dialog:rect(modal),body:body?rect(body):null,footer:footer?rect(footer):null,heading:heading?rect(heading):null,scrollTop:body?.scrollTop,scrollHeight:body?.scrollHeight,clientHeight:body?.clientHeight,footerOverlap:footer&&body?meaningful(rect(footer),rect(body)):null,footerButtons:controlData.filter(c=>c.inFooter)}:null;
  const canvas=document.querySelector('canvas'),scene=window.__qaGame?.scene.getScene('field-world'),canvasRect=canvas?rect(canvas):null;
  const canvasText=[],canvasLabelOverlaps=[],canvasDomOverlaps=[],canvasClipped=[];
  if(scene&&canvas&&!modal&&!portraitBlocked){
   const size=scene.viewportSize?.()||scene.scale.gameSize,sx=canvasRect.width/size.width,sy=canvasRect.height/size.height;
   const cam=scene.cameras.main;
   const project=point=>{
    const q=scene.projectWorld?scene.projectWorld(point):{x:(point.x-cam.scrollX)*cam.zoom+cam.x,y:(point.y-cam.scrollY)*cam.zoom+cam.y};
    return {x:canvasRect.x+q.x*sx,y:canvasRect.y+q.y*sy};
   };
   const toScreen=(o,x,y,w,h)=>{
    const m=o.getWorldTransformMatrix(),corners=[[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>{
     const world=m.transformPoint(a-o.displayOriginX,b-o.displayOriginY);
     world.x+=(cam.scrollX||0)*(1-(o.scrollFactorX??1));world.y+=(cam.scrollY||0)*(1-(o.scrollFactorY??1));
     return project(world);
    });
    const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return box(Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys));
   };
   const visit=(items,parentVisible=true)=>{for(const o of items||[]){
    const ok=parentVisible&&o.visible!==false&&o.active!==false&&(o.alpha??1)>.01;
    if(ok&&o.type==='Text'&&String(o.text).trim()){
     const lines=o.getWrappedText?.()||String(o.text).split('\n'),pad=o.padding||{},pw=(pad.left||0)+(pad.right||0),ph=(pad.top||0)+(pad.bottom||0),spacing=o.lineSpacing||0,lineH=(o.height-ph-spacing*(lines.length-1))/Math.max(1,lines.length);
     const glyphs=lines.map((line,index)=>{
      const measured=o.context.measureText(line),w=Math.min(o.width-pw,measured.width),left=(pad.left||0)+(o.style.align==='center'?(o.width-pw-w)/2:o.style.align==='right'?o.width-pw-w:0);
      const h=Math.min(lineH,(measured.actualBoundingBoxAscent||lineH*.7)+(measured.actualBoundingBoxDescent||lineH*.15));
      return toScreen(o,left,(pad.top||0)+index*(lineH+spacing)+(lineH-h)/2,w,h);
     });
     const r=toScreen(o,0,0,o.width,o.height);
     const row={id:canvasText.length,text:String(o.text),bounds:r,glyphs,background:!!o.style.backgroundColor,font:parseFloat(o.style.fontSize)*Math.abs(o.scaleX)*scene.screenScale(),depth:o.depth||0};
     canvasText.push(row);
     if(glyphs.some(g=>g.x<canvasRect.x-1||g.y<canvasRect.y-1||g.right>canvasRect.right+1||g.bottom>canvasRect.bottom+1))canvasClipped.push({text:row.text,bounds:r});
    }
    if(o.type==='Container'||o.list)visit(o.list,ok);
   }};
   visit(scene.children.list);
   for(let i=0;i<canvasText.length;i++)for(let j=i+1;j<canvasText.length;j++){
    const a=canvasText[i],b=canvasText[j];
    let hit=null,kind='glyph';
    for(const ar of a.glyphs)for(const br of b.glyphs)hit=hit||meaningful(ar,br);
    if(!hit&&a.background){hit=b.glyphs.map(g=>meaningful(a.bounds,g)).find(Boolean);kind='label-background';}
    if(!hit&&b.background){hit=a.glyphs.map(g=>meaningful(b.bounds,g)).find(Boolean);kind='label-background';}
    if(hit)canvasLabelOverlaps.push({a:a.text,b:b.text,kind,intersection:hit});
   }
   const occluders=[...document.querySelectorAll('#objective,#scene-title,#controls,#next,#guide,#guide-bubble,#status,.screen-nav button,.game-header,.game-footer,.preview-banner,#map-doors button')].filter(visible).map(e=>({label:label(e),selector:e.id?'#'+e.id:'.'+String(e.className).split(' ')[0],bounds:rect(e)}));
   for(const a of canvasText)for(const b of occluders){const hit=a.glyphs.map(g=>meaningful(g,b.bounds)).find(Boolean);if(hit)canvasDomOverlaps.push({canvas:a.text,dom:b.selector,label:b.label,intersection:hit});}
  }
  const app=document.querySelector('#app'),appCss=app?getComputedStyle(app):null;
  const appLayout=app?{...rect(app),scrollTop:app.scrollTop,scrollHeight:app.scrollHeight,clientHeight:app.clientHeight,scrollable:/auto|scroll/.test(appCss.overflowY)&&app.scrollHeight>app.clientHeight+2}:null;
  return {overflow:document.documentElement.scrollWidth>innerWidth+1,portraitBlocked,portrait:visible(portrait)?rect(portrait):null,modalLayout,appLayout,canvas:canvasRect,controls:controlData,out,obscured,overlaps,textClips,images,canvasText,canvasLabelOverlaps,canvasDomOverlaps,canvasClipped};
 });
}
const tasks=views.flatMap(([width,height])=>selected.filter(s=>width>=height||['title','care-after'].includes(s.name)).map(spec=>({width,height,spec})));
let cursor=0;
async function run(task){
 const {width,height,spec}=task,name=[width,height,spec.name].join('-');
 const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce',serviceWorkers:'block'}),page=await context.newPage();page.setDefaultTimeout(12000);
 const entry={name,width,height,screen:spec.name,fixture:'isolated-QA-demonstration',phase:spec.s.fieldView==='room'?roomPhase(spec.s.field):spec.s.fieldView};
 page.on('pageerror',e=>errors.push({name,message:e.message}));
 page.on('response',r=>{if(r.status()>=400)errors.push({name,message:r.status()+' '+r.url()});});
 try{
  await page.addInitScript(value=>{
   localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(value));
   let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});
  },spec.s);
  await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('canvas').waitFor({state:'visible'});await page.locator('.boot').waitFor({state:'detached'});
  await page.evaluate(()=>document.fonts.ready);
  if(spec.action&&width>=height)await spec.action(page);
  await page.waitForTimeout(100);
  entry.metrics=await metrics(page);entry.screenshot=name+'.png';await page.screenshot({path:path.join(out,entry.screenshot)});
  if(entry.metrics.modalLayout&&entry.metrics.modalLayout.scrollHeight>entry.metrics.modalLayout.clientHeight+2){
   await page.locator('dialog[open] .modal-body').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(60);
   entry.scrolled=await metrics(page);entry.scrolledScreenshot=name+'-scrolled.png';await page.screenshot({path:path.join(out,entry.scrolledScreenshot)});
  }
  if(entry.metrics.appLayout?.scrollable&&!entry.metrics.modalLayout&&!entry.metrics.portraitBlocked){
   await page.locator('#app').evaluate(e=>e.scrollTop=e.scrollHeight);await page.waitForTimeout(60);
   entry.scrolled=await metrics(page);entry.scrolledScreenshot=name+'-scrolled.png';await page.screenshot({path:path.join(out,entry.scrolledScreenshot)});
   entry.scrollReachability=[];
   for(const c of entry.metrics.controls.filter(c=>(c.outside||c.inGameFooter)&&!c.disabled)){
    const item={id:c.id,label:c.label,reachable:false};
    try{
     const point=await page.evaluate(target=>{
      const label=e=>(e.getAttribute('aria-label')||e.textContent||e.id||e.className).trim().replace(/\s+/g,' ').slice(0,110);
      const e=[...document.querySelectorAll('#app button,#app input,#app select,#app textarea,#app summary')].find(e=>e.tagName===target.tag&&label(e)===target.label&&e.getClientRects().length&&!e.disabled);
      if(!e)throw new Error('Touch target missing after layout refresh');
      e.scrollIntoView({block:'nearest',inline:'nearest'});
      const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,top=document.elementFromPoint(x,y);
      if(!top||!(top===e||e.contains(top)))throw new Error('Touch target remains obscured after scroll');
      window.__responsiveTouchHits=[];
      const handler=event=>{const t=event.target.closest?.('button,input,select,textarea,summary');if(t)window.__responsiveTouchHits.push({type:event.type,label:label(t)});event.preventDefault();event.stopImmediatePropagation();};
      const types=['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup','click'];
      types.forEach(type=>window.addEventListener(type,handler,{capture:true,passive:false}));
      window.__responsiveTouchCleanup=()=>types.forEach(type=>window.removeEventListener(type,handler,true));
      return {x,y};
     },c);
     await page.touchscreen.tap(point.x,point.y);
     const hits=await page.evaluate(()=>{window.__responsiveTouchCleanup?.();return window.__responsiveTouchHits;});
     item.reachable=hits.some(hit=>hit.type==='touchstart'&&hit.label===c.label);
     item.touchEvents=hits.map(hit=>hit.type);
    }catch(e){item.reason=e.message.split('\n')[0];}
    entry.scrollReachability.push(item);
   }
  }
  results.push(entry);
  const m=entry.metrics;
  const accessibleAfterScroll=new Set((entry.scrollReachability||[]).filter(c=>c.reachable).map(c=>c.id));
  const blockedOut=m.out.filter(c=>!c.disabled&&!accessibleAfterScroll.has(c.id)),blockedObscured=m.obscured.filter(c=>!c.disabled&&!accessibleAfterScroll.has(c.id));
  const scrollBlocked=(entry.scrollReachability||[]).filter(c=>!c.reachable);
  if(blockedOut.length||blockedObscured.length||scrollBlocked.length||m.overlaps.length||m.canvasLabelOverlaps.length||m.canvasDomOverlaps.length||m.canvasClipped.length||m.overflow||m.modalLayout?.footerOverlap)
   findings.push({name,out:blockedOut.length,obscured:blockedObscured.length,scrollBlocked,controlOverlaps:m.overlaps.length,canvasLabels:m.canvasLabelOverlaps.length,canvasDom:m.canvasDomOverlaps.length,canvasClipped:m.canvasClipped.length,overflow:m.overflow,footerOverlap:!!m.modalLayout?.footerOverlap});
 }catch(error){entry.failure=error.message;results.push(entry);errors.push({name,message:error.message});await page.screenshot({path:path.join(out,name+'-failure.png')}).catch(()=>{});}
 finally{await context.close();}
 if(results.length%12===0){await writeFile(path.join(out,'progress.json'),JSON.stringify({completed:results.length,total:tasks.length,errors:errors.length,findings:findings.length}));console.log(JSON.stringify({progress:results.length,total:tasks.length,findings:findings.length,errors:errors.length}));}
}
try{
 const concurrency=Math.max(1,Math.min(3,Number(process.env.RESPONSIVE_WORKERS||2)));
 await Promise.all(Array.from({length:concurrency},async()=>{while(cursor<tasks.length)await run(tasks[cursor++]);}));
 const after=await sourceStamp(),sourceChanged=sourceFiles.filter(f=>before[f]!==after[f]);
 const report={startedAt,endedAt:new Date().toISOString(),base,scope:'visual/layout only; no functional-test suite',fixture:'earned-state is QA demonstration only',sourceBefore:before,sourceAfter:after,sourceChanged,results,errors,findings};
 await writeFile(path.join(out,'result.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({screens:results.length,viewports:views.length,errors:errors.length,findings:findings.length,sourceChanged,out}));
}finally{await browser.close();}


