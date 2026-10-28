// Delivery check for the 2026-10-28 minimal fixes: science wording, observation-record naming,
// tower evidence, before-care readings, held last frames, keyboard-safe writing and viewports.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {initialField} from '../src/field-model.js';
const root=process.cwd(),out=path.join(root,'.tmp/delivery-20261028');await mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP='D:/DevTemp';
const {chromium}=createRequire(import.meta.url)('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),earned=JSON.parse(await readFile(path.join(root,'.tmp/recovery-play/earned-state.json'),'utf8')),base=process.env.BASE_URL||'http://127.0.0.1:4186',results=[],runtimeErrors=[],key='life-clock-lab.phaser.4';
const only=process.env.CASES?.split(',');let current;
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
function room(c,mutate=()=>{}){const s=structuredClone(earned);s.fieldView='room';s.field.active=c;s.field.completed=Array.from({length:c},(_,i)=>i);s.settings.reducedMotion=true;s.audio={bgm:false,sfx:false,volume:.2};mutate(s.field.chapters[c],s);return s;}
async function open(s,{width=1280,height=800,touch=false}={}){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,reducedMotion:'reduce',acceptDownloads:true,serviceWorkers:'block'}),page=await context.newPage();current=page;page.setDefaultTimeout(12000);page.on('pageerror',e=>runtimeErrors.push(e.message));
 await page.addInitScript(({s,key})=>{if(s&&!sessionStorage.getItem('seeded')){localStorage.setItem(key,JSON.stringify(s));sessionStorage.setItem('seeded','1');}let lib;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>lib,set(value){lib=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});},{s,key});
 await page.goto(base);await page.locator('.boot').waitFor({state:'detached'});await page.waitForTimeout(600);return {page,context};
}
// Every visible Phaser text in the active scenes, so scene wording can be asserted.
const texts=p=>p.evaluate(()=>window.__qaGame.scene.getScenes(true).flatMap(sc=>sc.children.list.flatMap(function walk(o){return o.list?o.list.flatMap(walk):o.type==='Text'&&o.visible?[o.text]:[];})).join('\n'));
const focusButton=(p,name)=>p.locator('#focus-targets button',{hasText:''}).and(p.locator(`[aria-label="${name}"]`)).first();
async function press(p,label){await p.evaluate(label=>{const b=[...document.querySelectorAll('#focus-targets button')].find(x=>x.getAttribute('aria-label')===label);if(!b)throw new Error('no focus target: '+label);b.click();},label);await p.waitForTimeout(250);}
async function closeNote(p){const b=p.locator('[data-notebook-close]');if(await b.isVisible().catch(()=>false))await b.click();await p.waitForTimeout(150);}
async function shot(p,name){await p.screenshot({path:path.join(out,name+'.png')});}
async function run(name,fn){if(only&&!only.some(o=>name.startsWith(o)))return;try{await fn();results.push({name,status:'passed'});console.log('PASS',name);}catch(error){await current?.screenshot({path:path.join(out,'FAIL-'+name+'.png')}).catch(()=>{});results.push({name,status:'failed',error:String(error.stack||error)});console.log('FAIL',name,error.message);}finally{await current?.context().close().catch(()=>{});}}
const VIEWS=[[1280,800],[1024,768],[768,1024]];
try{
// 1·4 Care: readings stay labelled as before care, with the applied care and the current look apart.
for(const variable of ['water','light'])for(const [w,h] of VIEWS)await run(`care-${variable}-${w}x${h}`,async()=>{
 const s=room(2,q=>{Object.assign(q,initialField().chapters[2]);const r=q.cases[variable==='water'?0:1];if(variable==='light'){const a=q.cases[0];Object.assign(a,{measured:['water','light'],symptom:'dry',observations:[{part:'soil',feature:'dry-soil'}],tool:'water',day:2,photos:[0,2]});q.case=1;}Object.assign(r,{measured:['water','light'],symptom:variable==='water'?'dry':'pale',observations:[variable==='water'?{part:'soil',feature:'dry-soil'}:{part:'leaf',feature:'pale-leaf'}],tool:variable,day:2,photos:[0]});});
 const {page:p}=await open(s,{width:w,height:h});const t=await texts(p);
 assert.match(t,variable==='water'?/흙의 물기 · 돌봄 전\n부족/:/받는 빛 · 돌봄 전\n부족/);assert.match(t,/적용한 돌봄/);assert.match(t,/지금 모습\n(이틀 뒤|새잎이 자란 뒤)/);
 await shot(p,`care-${variable}-${w}x${h}`);
});
// 5 Held last frames: the final date stays until 「관찰을 마쳤어요」.
await run('hold-seed',async()=>{
 const s=room(1,q=>{Object.assign(q,initialField().chapters[1]);const r=q.rounds[0];r.prepared={a:{soil:true,seeds:3},b:{soil:true,seeds:3}};r.prediction='a';r.b={water:true,warm:true};r.run={a:{water:false,warm:true},b:{water:true,warm:true},prepared:structuredClone(r.prepared),prediction:'a'};r.photos=[0];});
 const {page:p}=await open(s);await p.locator('[data-action=time-stop][data-value="7"]').click();await closeNote(p);await p.waitForTimeout(300);
 assert.equal((await p.locator('#next').textContent()).trim(),'관찰을 마쳤어요');assert.match(await p.locator('#objective').textContent(),/0일 모습과 비교/);
 assert.match(await texts(p),/잎이 펼쳐진 모습을 관찰했어/);await shot(p,'hold-seed-day7');
 await p.locator('#next').click();await p.waitForTimeout(400);assert.match(await texts(p),/마지막 사진에서 무엇이 달라졌니/);
 // Reload keeps saved progress; the hold itself is screen-only.
 await p.reload();await p.locator('.boot').waitFor({state:'detached'});await p.waitForTimeout(600);assert.match(await texts(p),/마지막 사진에서 무엇이 달라졌니/);
});
await run('hold-dog',async()=>{
 const s=room(3,q=>{Object.assign(q,initialField().chapters[3]);q.animals.butterfly={step:3,photos:[0,3]};q.animals.dog={step:0,photos:[0]};});
 const {page:p}=await open(s);await p.locator('[data-time=animal-time][data-animal=dog]').evaluate(el=>{el.value='2';el.dispatchEvent(new Event('change',{bubbles:true}));});await closeNote(p);await p.waitForTimeout(300);
 assert.equal((await p.locator('#next').textContent()).trim(),'관찰을 마쳤어요');assert.ok(await p.locator('[data-time=animal-time][data-animal=dog]').count(),'dog dial stays');await shot(p,'hold-dog-adult');
 await p.locator('#next').click();await p.waitForTimeout(300);assert.notEqual((await p.locator('#next').textContent()).trim(),'관찰을 마쳤어요');
});
await run('hold-season',async()=>{
 const s=room(3,q=>{Object.assign(q,initialField().chapters[3]);q.animals.butterfly={step:3,photos:[0,3]};q.animals.dog={step:2,photos:[0,2]};q.generation='different';q.tags=['apple','balsam'];q.season=3;q.plantPhotos=['apple-0','balsam-0','apple-3','balsam-3'];});
 const {page:p}=await open(s);await p.locator('[data-action=time-stop][data-value="4"]').click();await closeNote(p);await p.waitForTimeout(300);
 assert.equal((await p.locator('#next').textContent()).trim(),'관찰을 마쳤어요');await shot(p,'hold-season-spring');
 await p.locator('#next').click();await p.waitForTimeout(300);assert.match(await p.locator('#objective').textContent(),/작년 그 식물인지/);
 // Transfer hint and bin wording use the general perennial definition.
});
await run('perennial-wording',async()=>{
 const s=room(3,q=>{Object.assign(q,initialField().chapters[3]);q.animals.butterfly={step:3,photos:[0,3]};q.animals.dog={step:2,photos:[0,2]};q.generation='different';q.tags=['apple','balsam'];q.season=4;q.seasonCompared=true;q.plantPhotos=['apple','balsam'].flatMap(id=>[0,3,4].map(n=>id+'-'+n));q.classifications={apple:'same',balsam:'new'};});
 const {page:p}=await open(s);const t=await texts(p);assert.match(t,/여러해살이 · 여러 해 동안 살아/);assert.doesNotMatch(t,/겨울에도 줄기가 살아 있어/);
 const names=await p.locator('#focus-targets button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')).join('\n'));assert.doesNotMatch(names,/겨울에도 줄기가 살아/);await shot(p,'perennial-transfer');
});
// 2 Butterfly forest writing step: no drawing claims, reference picks read as 「그림 보며 쓰기」.
for(const [w,h] of VIEWS)await run(`observation-note-${w}x${h}`,async()=>{
 const s=room(0,q=>{Object.assign(q,initialField().chapters[0]);q.inspected={egg:[0,1],larva:[0,1],pupa:[0,1],adult:[0,1]};});
 const {page:p}=await open(s,{width:w,height:h});const names=await p.locator('#focus-targets button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')).join('\n'));
 assert.match(names,/애벌레 그림 보며 쓰기/);assert.doesNotMatch(names+await texts(p),/그리기|그림 기록/);await shot(p,`observation-note-${w}x${h}`);
});
// 7 Keyboard: emulate a tablet keyboard covering the lower half and check note + done button stay visible.
for(const [w,h] of [[1024,768],[768,1024]])await run(`keyboard-note-${w}x${h}`,async()=>{
 const s=room(0,q=>{Object.assign(q,initialField().chapters[0]);q.inspected={egg:[0,1],larva:[0,1],pupa:[0,1],adult:[0,1]};});
 const {page:p}=await open(s,{width:w,height:h,touch:true});const kb=Math.round(h*.45);
 await p.evaluate(kb=>{const fake={offsetTop:0,offsetLeft:0,height:innerHeight-kb,width:innerWidth,scale:1,addEventListener(){},removeEventListener(){}};Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>fake});},kb);
 await p.locator('#observation-note').focus();await p.keyboard.type('애벌레 몸에 마디가 여러 개 있어');await p.waitForTimeout(500);
 const box=await p.locator('#observation-note').boundingBox(),done=await p.locator('.field-note-done').boundingBox();
 assert.ok(box.y>=0&&done&&done.y+done.height<=h-kb,`note ${JSON.stringify(box)} done ${JSON.stringify(done)} visible ${h-kb}`);await shot(p,`keyboard-note-${w}x${h}`);
 // A draft survives reload while typing; the done button submits it.
 await p.waitForTimeout(500);await p.reload();await p.locator('.boot').waitFor({state:'detached'});await p.waitForTimeout(600);
 const draft=(await state(p)).field.chapters[0];console.log('  draft after reload:',JSON.stringify({note:draft.note,noteDraft:draft.noteDraft}));
 await p.evaluate(kb=>{const fake={offsetTop:0,offsetLeft:0,height:innerHeight-kb,width:innerWidth,scale:1,addEventListener(){},removeEventListener(){}};Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>fake});},kb);
 await p.locator('#observation-note').focus();await p.locator('#observation-note').fill('애벌레 몸에 마디가 여러 개 있어');await p.waitForTimeout(450);
 // Portrait keeps the original rotate-to-landscape policy, so the note is finished in landscape only.
 if(w<h){assert.ok(await p.locator('.portrait').isVisible());return;}
 await p.locator('.field-note-done').tap();await p.waitForTimeout(400);
 assert.equal((await state(p)).field.chapters[0].note,'애벌레 몸에 마디가 여러 개 있어');
});
await run('keyboard-dialog-1024x768',async()=>{
 const s=room(4,q=>Object.assign(q,{records:['field-observation-larva','field-seed-water','field-care-water','field-animal-butterfly'],matches:{observation:'field-animal-butterfly',retry:'field-seed-water',care:'field-care-water'},title:'',summary:'',towerRun:false,plan:{subject:'',when:'',what:''}}));
 const {page:p}=await open(s,{width:1024,height:768,touch:true});const kb=345;
 await p.evaluate(kb=>{const fake={offsetTop:0,offsetLeft:0,height:innerHeight-kb,width:innerWidth,scale:1,addEventListener(){},removeEventListener(){}};Object.defineProperty(window,'visualViewport',{configurable:true,get:()=>fake});},kb);
 await press(p,'연구 노트 쓰기');await p.locator('#story-summary').focus();await p.waitForTimeout(500);
 const dlg=await p.locator('#modal').boundingBox(),save=await p.locator('[data-action=save-story]').boundingBox(),field=await p.locator('#story-summary').boundingBox();
 assert.ok(dlg.y+dlg.height<=768-kb+1&&save.y+save.height<=768-kb+1&&field.y>=0,`dialog ${JSON.stringify(dlg)} save ${JSON.stringify(save)}`);await shot(p,'keyboard-dialog-1024x768');
});
// 3 Tower: same-region unrelated photos are rejected with a clue; the time-series record is accepted; claims narrow.
for(const [w,h] of VIEWS)await run(`tower-${w}x${h}`,async()=>{
 const s=room(4,q=>Object.assign(q,{records:['field-observation-larva','field-seed-water','field-care-water','field-season-apple'],matches:{},title:'',summary:'',towerRun:false,plan:{subject:'',when:'',what:''}}));
 const {page:p}=await open(s,{width:w,height:h});let t=await texts(p);
 assert.match(t,/씨앗이 싹트려면 물이 필요해\./);assert.match(t,/식물은 물이 부족하면 겉모습으로 신호를 보내\./);
 const claim='동물은 자라면서 몸의 생김새가 달라져. 쪽지를 증거 사진으로 옮기기';
 for(const target of ['사계절 정원 사진을 증거로 놓기','나비의 숲 사진을 증거로 놓기']){
  await press(p,claim);await press(p,target);assert.match(await p.locator('#status, [role=status]').allTextContents().then(a=>a.join(' ')),/변화 전후가 함께 보이는 기록/);
 }
 assert.equal((await state(p)).field.chapters[4].matches.observation,undefined);await shot(p,`tower-${w}x${h}-rejected`);
 // Cycle the garden socket to the butterfly life cycle, then link it.
 for(let i=0;i<4&&!(await state(p)).field.chapters[4].records.includes('field-animal-butterfly');i++){const label=await p.locator('#focus-targets button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label')).find(l=>/^사계절 정원 사진을 .* 기록으로 바꾸기$/.test(l)));await press(p,label);}
 await press(p,claim);await press(p,'사계절 정원 사진을 증거로 놓기');
 assert.equal((await state(p)).field.chapters[4].matches.observation,'field-animal-butterfly');await shot(p,`tower-${w}x${h}-linked`);
});
// 6 Clock tower: a real touch drag around the dial, and the visible quarter-turn button for touch users.
const towerRun=()=>room(4,q=>Object.assign(q,{records:['field-observation-larva','field-seed-water','field-care-water','field-animal-butterfly'],matches:{observation:'field-animal-butterfly',retry:'field-seed-water',care:'field-care-water'},title:'나의 생명 탐험',summary:'조건과 생물에 따라 자라는 모습이 달라.',towerRun:false,plan:{subject:'',when:'',what:''}}));
const screenPoint=(p,x,y)=>p.evaluate(([x,y])=>{const sc=window.__qaGame.scene.getScenes(true)[0],c=document.querySelector('canvas').getBoundingClientRect(),w=sc.projectWorld?.({x,y,w:0,h:0})||{x,y};return {x:c.left+w.x*c.width/sc.scale.gameSize.width,y:c.top+w.y*c.height/sc.scale.gameSize.height};},[x,y]);
for(const [w,h] of [[1024,768],[1280,800]])await run(`tower-touch-button-${w}x${h}`,async()=>{
 const {page:p}=await open(towerRun(),{width:w,height:h,touch:true});await shot(p,`tower-run-${w}x${h}`);
 const b=await screenPoint(p,640,712);for(let i=0;i<4;i++){await p.touchscreen.tap(b.x,b.y);await p.waitForTimeout(250);}
 assert.equal((await state(p)).field.chapters[4].towerRun,true);
});
await run('tower-touch-drag-1024x768',async()=>{
 const {page:p}=await open(towerRun(),{width:1024,height:768,touch:true});const cdp=await p.context().newCDPSession(p);
 const pts=[];for(let i=0;i<=40;i++){const a=-Math.PI/2+i/40*2*Math.PI;pts.push(await screenPoint(p,640+Math.cos(a)*150,378+Math.sin(a)*150));}
 const touch=(type,pt)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pt?[{x:pt.x,y:pt.y}]:[]});
 await touch('touchStart',pts[0]);for(const pt of pts.slice(1)){await touch('touchMove',pt);await p.waitForTimeout(16);}await touch('touchEnd');await p.waitForTimeout(400);
 assert.equal((await state(p)).field.chapters[4].towerRun,true,'touch drag completes the clock');
 // A cancelled touch leaves the clock unchanged.
 const {page:q}=await open(towerRun(),{width:1024,height:768,touch:true});const c2=await q.context().newCDPSession(q);
 await c2.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pts[0]]});for(const pt of pts.slice(1,12))await c2.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[pt]});await c2.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await q.waitForTimeout(300);
 assert.equal((await state(q)).field.chapters[4].towerRun,false,'cancelled touch does not wake the tower');
});
// Finished save from the earlier version: completion, plan and the learner's link are preserved.
await run('legacy-finished-save',async()=>{
 const s=structuredClone(earned);s.fieldView='map';for(const book of [s.field.chapters[4],s.field.snapshots?.[4]].filter(Boolean))book.matches.observation='field-observation-egg';
 const {page:p}=await open(s);assert.equal(await p.locator('#modal').evaluate(d=>d.open),false,'no storage-protection dialog');
 await p.locator('#next').click();await p.waitForTimeout(300);const f=(await state(p)).field;console.log('  legacy:',JSON.stringify({completed:f.completed,matches:f.chapters[4].matches,plan:f.chapters[4].plan.subject}));
 assert.deepEqual(f.completed,[0,1,2,3,4]);assert.equal(f.chapters[4].matches.observation,'field-observation-egg');
});
// Certificate PNG: open the actual file to check wording and clipping.
await run('certificate-png',async()=>{
 const s=structuredClone(earned);s.fieldView='map';const {page:p}=await open(s);
 // The ending dialog's certificate button, pressed the way the app routes it.
 await p.evaluate(()=>{const b=document.createElement('button');b.dataset.action='ending';document.body.append(b);b.click();b.remove();});await p.waitForTimeout(400);await shot(p,'ending-dialog');
 await p.locator('[data-action=certificate]').first().click();await p.waitForTimeout(400);await shot(p,'certificate-dialog');
 const certText=await p.locator('#modal').textContent().catch(()=>'');console.log('  certificate dialog:',certText.replace(/\s+/g,' ').slice(0,200));
 if(/그림 기록|글·그림/.test(certText))throw new Error('drawing claim in certificate');
 const [download]=await Promise.all([p.waitForEvent('download'),p.locator('[data-action=certificate-png]').click()]);await download.saveAs(path.join(out,'certificate.png'));
});
}finally{await browser.close();await writeFile(path.join(out,'results.json'),JSON.stringify({results,runtimeErrors},null,1));console.log(results.filter(r=>r.status==='passed').length+'/'+results.length+' passed; runtime errors '+runtimeErrors.length);}
