import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {initialField} from '../src/field-model.js';
import {applyQuest} from '../src/field-quests.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'.tmp/recovery-layout');
await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:4212';
const earned=JSON.parse(await readFile(path.join(root,'.tmp/field-play/earned-state.json'),'utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[],errors=[];
function fixture(chapter){const s=structuredClone(earned);s.fieldView='room';s.field.active=chapter;s.field.completed=[0,1,2,3].filter(i=>i<chapter);s.audio={bgm:false,sfx:false,volume:.2};s.settings.reducedMotion=false;return s;}
async function open(viewport,s){
 const context=await browser.newContext({viewport,hasTouch:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(value=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(value));sessionStorage.setItem('qa-seeded','1');}},s);
 await page.goto(base);await page.locator('.boot').waitFor({state:'detached'});await page.waitForTimeout(450);
 return {context,page};
}
const state=page=>page.evaluate(()=>JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')));
async function tap(page,x,y){const b=await page.locator('canvas').boundingBox();await page.touchscreen.tap(b.x+x*b.width/1280,b.y+y*b.height/800);await page.waitForTimeout(120);}
async function snap(page,name){
 await page.waitForTimeout(850);
 const layout=await page.evaluate(()=>{
  const visible=e=>e.getClientRects().length&&!e.hidden&&getComputedStyle(e).visibility!=='hidden';
  const bounds=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  const modal=document.querySelector('dialog[open]');
  const targets=[...(modal||document).querySelectorAll('button')].filter(e=>visible(e)&&!e.classList.contains('focus-target'));
  return {viewport:{width:innerWidth,height:innerHeight},overflow:document.documentElement.scrollWidth>innerWidth,modal:modal?bounds(modal):null,buttons:targets.map(e=>({label:e.textContent.trim()||e.getAttribute('aria-label'),...bounds(e)}))};
 });
 assert.equal(layout.overflow,false,name+' horizontal overflow');
 if(layout.modal){assert.ok(layout.modal.y>=-1&&layout.modal.bottom<=layout.viewport.height+1,name+' modal containment');}
 for(const b of layout.buttons){assert.ok(b.width>=44&&b.height>=44,name+' small button '+b.label);assert.ok(b.y>=-1&&b.bottom<=layout.viewport.height+1,name+' clipped button '+b.label);}
 await page.screenshot({path:path.join(out,name+'.png')});results.push({name,...layout});
}
try{
 for(const viewport of [{width:1280,height:800},{width:1024,height:768}]){
  const tag=`${viewport.width}-${viewport.height}`;
  let s=fixture(0);s.field.chapters[0]=initialField().chapters[0];s.field.snapshots={};
  let {context,page}=await open(viewport,s);
  await snap(page,tag+'-observation');await tap(page,231,381);
  await page.locator('.field-notebook-dialog').waitFor({state:'visible'});
  const initial=await page.locator('[data-handwriting]').first().evaluate(el=>({shown:el.textContent,full:el.dataset.handwriting}));
  assert.ok(initial.shown.length<initial.full.length,'observation typing starts gradually');
  await page.locator('[data-notebook-skip]').tap();
  assert.equal(await page.locator('[data-handwriting]').first().textContent(),initial.full);
  assert.deepEqual((await state(page)).field.chapters[0].inspected.egg,[0]);
  await snap(page,tag+'-observation-notebook');await page.locator('[data-notebook-close]').tap();
  await tap(page,389,381);await page.locator('[data-notebook-skip]').tap();
  assert.equal(await page.locator('.notebook-findings li').count(),2);await page.locator('[data-notebook-close]').tap();
  await context.close();

  s=fixture(0);s.field.chapters[0].drawing=[];s.field.chapters[0].note='';s.field.snapshots={};
  ({context,page}=await open(viewport,s));await snap(page,tag+'-draw');
  await page.locator('[data-field-action=note]').tap();
  await page.locator('#observation-note').fill('애벌레의 몸에는 여러 마디가 보였다.');
  await snap(page,tag+'-own-notebook');await page.locator('[data-action=save-note]').tap();
  assert.equal((await state(page)).field.chapters[0].note,'애벌레의 몸에는 여러 마디가 보였다.');await context.close();

  s=fixture(1);const round=s.field.chapters[1].rounds[0];s.field.chapters[1].round=0;round.day=0;round.photos=[];round.reason='';
  ({context,page}=await open(viewport,s));await page.locator('#next').tap();await page.locator('[data-notebook-skip]').tap();
  assert.equal(await page.locator('.notebook-photo-grid figure').count(),2);
  assert.match(await page.locator('.notebook-page h3').innerText(),/0일/);
  await snap(page,tag+'-seed-photo');await context.close();

  s=fixture(2);s.field.chapters[2].case=1;const care=s.field.chapters[2].cases[1];care.day=2;care.photos=[0];
  ({context,page}=await open(viewport,s));await page.locator('#next').tap();await page.locator('[data-notebook-skip]').tap();
  assert.equal(await page.locator('.notebook-new-leaves').count(),1);
  const leafLayout=await page.locator('.notebook-photo-art').evaluate(el=>{const a=el.querySelector('img'),b=el.querySelector('svg'),imageStyle=getComputedStyle(a),leafStyle=getComputedStyle(b);return {imageHeight:parseFloat(imageStyle.height),leafHeight:parseFloat(leafStyle.height),leafWidth:parseFloat(leafStyle.width),groups:b.querySelectorAll('g').length};});
  assert.ok(Math.abs(leafLayout.leafHeight-leafLayout.leafWidth)<1&&Math.abs(leafLayout.imageHeight-leafLayout.leafHeight)<1&&leafLayout.groups===3,'new leaves align with the contain-fit plant image: '+JSON.stringify(leafLayout));
  assert.match(await page.locator('.notebook-hand').innerText(),/길어진 줄기는 그대로/);
  await snap(page,tag+'-care-photo');await context.close();

  s=fixture(4);const q=s.field.chapters[4];q.records=[];q.title='';q.summary='';q.captions={};q.matches={};q.plan={subject:'',when:'',what:''};
  ({context,page}=await open(viewport,s));await snap(page,tag+'-story-empty');
  await tap(page,380,638);let ids=(await state(page)).field.chapters[4].records;assert.equal(ids.length,1);const first=ids[0];
  await tap(page,380,638);ids=(await state(page)).field.chapters[4].records;assert.equal(ids.length,2);assert.equal(new Set(ids).size,2);assert.equal(ids[0],first);
  await snap(page,tag+'-story-two');
  await tap(page,449,319);await page.locator('#story-caption').waitFor({state:'visible'});
  await page.locator('#story-caption').fill('표면의 작은 줄을 관찰했다.');await page.locator('[data-action=save-caption]').tap();
  assert.equal((await state(page)).field.chapters[4].captions[first],'표면의 작은 줄을 관찰했다.');
  await tap(page,449,319);const firstAlt=await page.locator('.story-note-evidence').getAttribute('alt');
  await page.locator('#caption-record').selectOption(ids[1]);
  await page.waitForFunction(previous=>document.querySelector('.story-note-evidence')?.alt!==previous,firstAlt);
  assert.equal(await page.locator('#story-caption').inputValue(),'');
  await snap(page,tag+'-story-caption');await page.locator('dialog .close').tap();await context.close();

  s=fixture(4);Object.assign(s.field.chapters[4],{records:['field-observation-egg','field-seed-water','field-care-water'],title:'',summary:'',captions:{},matches:{},plan:{subject:'',when:'',what:''}});
  ({context,page}=await open(viewport,s));await snap(page,tag+'-story-edit');
  await page.locator('[data-field-action=story-info]').tap();
  await page.locator('#story-title').fill('내가 찾은 생명의 변화');await page.locator('#story-summary').fill('물과 빛을 살피고 조건 하나씩 바꾸어 생명의 변화를 관찰했다.');
  await snap(page,tag+'-story-writing');await page.locator('[data-action=save-story]').tap();
  assert.equal((await state(page)).field.chapters[4].title,'내가 찾은 생명의 변화');
  await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.equal((await state(page)).field.chapters[4].title,'내가 찾은 생명의 변화');await context.close();

  s=fixture(4);Object.assign(s.field.chapters[4],{records:['field-observation-egg','field-observation-larva','field-seed-water','field-seed-warm','field-care-water','field-care-light'],title:'물과 빛을 살피며 내가 찾아낸 생명의 변화와 다음 봄의 새로운 발견',summary:'물과 빛의 조건을 하나씩 바꾸어 비교하고 관찰한 모습을 그림과 사진으로 남겼다. 다음에는 우리 교실에서 자라는 실제 식물을 같은 자리에서 꾸준히 관찰하고 싶다.',plan:{subject:'',when:'',what:''}});
  ({context,page}=await open(viewport,s));await snap(page,tag+'-story-six-long');await context.close();

  const firstSteps=[
   [{kind:'connect',target:'larva'},{kind:'record'}],
   [{kind:'repair',setting:'warm'},{kind:'verify'}],
   [{kind:'check',clue:'water'},{kind:'check',clue:'light'},{kind:'decide',choice:'keep'}],
   [{kind:'track',mark:'A-01'},{kind:'record'}],
   [{kind:'stamp',recordId:'field-observation-egg'},{kind:'stamp',recordId:'field-seed-water'},{kind:'stamp',recordId:'field-care-water'}]
  ];
  const lastSteps=[
   [{kind:'connect',target:'adult'},{kind:'record'}],
   [{kind:'check',clue:'water'},{kind:'check',clue:'temperature'},{kind:'check',clue:'time'},{kind:'decide',choice:'observe'}],
   [{kind:'mark',spot:'new-leaf'},{kind:'record'}],
   [{kind:'plan',item:'same-view'},{kind:'plan',item:'regular'},{kind:'plan',item:'leave-growing'},{kind:'record'}],
   [{kind:'question',text:'우리 교실의 콩은 언제 새잎이 날까?'}]
  ];
  for(let chapter=0;chapter<5;chapter++){
   s=fixture(chapter);s.field.chapters[chapter].discovery=[];
   for(const step of [0,1]){
    if(step)for(const payload of firstSteps[chapter])assert.equal(applyQuest(s.field,{step:0,...payload}).ok,true);
    ({context,page}=await open(viewport,s));assert.match(await page.locator('#objective').innerText(),/추가 발견/);
    await snap(page,tag+`-discovery-${chapter}-${step}`);await context.close();
   }
   if([1,4].includes(chapter)){
    for(const payload of lastSteps[chapter])assert.equal(applyQuest(s.field,{step:1,...payload}).ok,true);
    ({context,page}=await open(viewport,s));await snap(page,tag+`-reward-stamp-${chapter}`);await context.close();
   }
  }
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(out,'result.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({screens:results.length,viewports:['1280x800','1024x768'],errors}));
}catch(error){await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,results,errors},null,2));console.error(error.stack);process.exitCode=1;}finally{await browser.close();}
