import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initialField} from '../field-model.js';
import {applyQuest} from '../field-quests.js';
import {roomPhase} from '../field-flow.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.tmp/design-audit-'+(process.env.AUDIT_LABEL||'baseline'));
await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const earned=JSON.parse(await readFile(path.join(root,'.tmp/recovery-play/earned-state.json'),'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true}),base=process.env.BASE_URL||'http://127.0.0.1:4186';
const allViews=[[873,580],[906,755],[1280,800],[1920,1080],[1024,768],[768,1024],[375,812],[1440,900],[1280,720]];
const views=allViews.filter(v=>!process.env.AUDIT_VIEWS||process.env.AUDIT_VIEWS.split(',').includes(v.join('x')));
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
add('guide',observation,p=>click(p,'[data-action=guide]'));
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

const filter=process.env.AUDIT_SCREENS?.split(',');
try{
 for(const [width,height] of views){
  for(const spec of specs.filter(s=>!filter||filter.includes(s.name))){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(20000);
   const name=`${width}-${height}-${spec.name}`;
   page.on('pageerror',e=>errors.push({name,message:e.message}));page.on('response',r=>{if(r.status()>=400)errors.push({name,message:`${r.status()} ${r.url()}`});});
   try{
    await page.addInitScript(value=>{
     localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(value));
     let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});
    },spec.s);
    await page.goto(base,{waitUntil:'domcontentloaded'});await page.locator('canvas').waitFor({state:'visible'});await page.locator('.boot').waitFor({state:'detached'});
    if(spec.action)await spec.action(page);await page.waitForTimeout(100);
    const metrics=await page.evaluate(()=>{
     const visible=e=>!!e.getClientRects().length&&!e.hidden&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).opacity!=='0';
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
     const label=e=>e.textContent.trim().slice(0,100)||e.getAttribute('aria-label')||e.id||e.className;
     const modal=document.querySelector('dialog[open]'),portrait=document.querySelector('.portrait'),portraitBlocked=visible(portrait)&&getComputedStyle(portrait).pointerEvents==='auto',surface=modal||(portraitBlocked?portrait:document.querySelector('#app'));
     const buttons=[...surface.querySelectorAll('button')].filter(e=>visible(e)&&!e.classList.contains('focus-target'));
     const buttonMetrics=buttons.map(e=>{const css=getComputedStyle(e);return {label:label(e),...rect(e),font:parseFloat(css.fontSize),lineHeight:parseFloat(css.lineHeight),color:css.color,background:css.backgroundColor,backgroundImage:css.backgroundImage,padding:css.padding,internal:!!e.closest('.modal-body')};});
     const out=buttonMetrics.filter(b=>!b.internal&&(b.x<-.5||b.y<-.5||b.right>innerWidth+.5||b.bottom>innerHeight+.5));
     const small=buttonMetrics.filter(b=>b.width<44||b.height<44);
     const texts=[...surface.querySelectorAll('p,label,small,h1,h2,h3,figcaption,.tool-hint,#scene-title,#guide span,.notebook-scale-note,.concept-library-item span')].filter(e=>visible(e)&&!e.closest('[hidden]')).map(e=>{const css=getComputedStyle(e),r=rect(e);return {label:label(e),font:parseFloat(css.fontSize),wordBreak:css.wordBreak,color:css.color,background:css.backgroundColor,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,...r};});
     const overlaps=[];
     for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){
      const a=buttonMetrics[i],b=buttonMetrics[j];if(a.internal||b.internal)continue;
      const w=Math.min(a.right,b.right)-Math.max(a.x,b.x),h=Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y);if(w>2&&h>2)overlaps.push({a:a.label,b:b.label,width:w,height:h});
     }
     const images=[...surface.querySelectorAll('img')].filter(visible).map(e=>({label:e.alt,loaded:e.complete&&e.naturalWidth>0,...rect(e)}));
     const scene=window.__qaGame?.scene.getScene('field-world'),scale=rect(document.querySelector('canvas')).width/1280;
     const canvasText=(scene?.children.list||[]).filter(o=>o.type==='Text').map(o=>({text:o.text,font:parseFloat(o.style.fontSize)*scale,x:o.x,y:o.y,width:o.width,height:o.height}));
     const canvasTargets=(scene?.children.list||[]).filter(o=>o.input?.enabled&&!o.input.dropZone).map(o=>({type:o.type,x:o.x,y:o.y,width:o.input.hitArea.width*Math.abs(o.scaleX)*scale,height:o.input.hitArea.height*Math.abs(o.scaleY)*scale}));
     return {overflow:document.documentElement.scrollWidth>innerWidth,portrait:visible(portrait),portraitBlocked,modal:modal?rect(modal):null,canvas:rect(document.querySelector('canvas')),buttons:buttonMetrics,small,out,overlaps,texts,images,canvasText,canvasTargets};
    });
    results.push({name,width,height,screen:spec.name,phase:spec.s.fieldView==='room'?roomPhase(spec.s.field):spec.s.fieldView,...metrics});
    await page.screenshot({path:path.join(out,name+'.png')});
   }catch(error){errors.push({name,message:error.message});}
   await context.close();
  }
  await writeFile(path.join(out,'progress.json'),JSON.stringify({completedViewport:[width,height],screens:results.length,errors:errors.length}));
  await writeFile(path.join(out,'result.json'),JSON.stringify({results,errors},null,2));
 }
 await writeFile(path.join(out,'result.json'),JSON.stringify({results,errors},null,2));
 console.log(JSON.stringify({screens:results.length,profiles:views.length,errors,issues:results.filter(r=>r.small.length||r.out.length||r.overlaps.length||r.overflow).map(r=>({name:r.name,small:r.small.length,out:r.out.length,overlaps:r.overlaps,overflow:r.overflow}))}));
}finally{await browser.close();}
