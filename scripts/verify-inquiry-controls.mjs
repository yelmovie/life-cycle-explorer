import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import * as G from '../game-model.js';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const url=process.env.QA_URL||'http://127.0.0.1:4194/';
async function open(mission){
 const context=await browser.newContext({viewport:{width:1024,height:768}}),s=G.fresh();s.intro=false;s.screen='mission';s.mission=mission;s.completed=Array.from({length:mission},(_,i)=>i);s.settings.reducedMotion=true;
 await context.addInitScript(({key,s})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem(key,JSON.stringify(s));sessionStorage.setItem('qa-seeded','1');}},{key:G.GAME_KEY,s});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.waitForSelector('canvas');await page.waitForFunction(()=>!document.querySelector('.boot'));return {page,context};
}
const state=p=>p.evaluate(key=>JSON.parse(localStorage.getItem(key)),G.GAME_KEY);
async function drag(p,x,y,tx,ty){const b=await p.locator('canvas').boundingBox(),point=(x,y)=>[b.x+x*b.width/1280,b.y+y*b.height/610];await p.mouse.move(...point(x,y));await p.mouse.down();await p.mouse.move(...point(tx,ty),{steps:12});await p.mouse.up();await p.waitForTimeout(150);}
async function setRange(p,action,value){const control=p.locator('[data-range="'+action+'"]');await control.focus();await control.press('Home');for(let i=0;i<value;i++){await control.focus();await control.press('ArrowRight');}}
async function click(p,x,y){const b=await p.locator('canvas').boundingBox();await p.mouse.click(b.x+x*b.width/1280,b.y+y*b.height/610);await p.waitForTimeout(100);}
try{
 const {page:p,context}=await open(2);await p.waitForTimeout(250);
 for(const x of [405,795]){await drag(p,1117,170,x,300);await drag(p,1117,350,x,300);}
 assert.ok(G.phaseReady(await state(p),2));await p.locator('#next').click();
 assert.equal(await p.locator('[data-choice-action="question"]').count(),1);
 await p.locator('[data-choice-action="seed-prediction"]').selectOption('unsure');
 await drag(p,1117,170,795,300);await p.locator('#next').click();await p.waitForTimeout(250);
 let s=await state(p);assert.equal(s.mission,3);assert.equal(G.initialRun(s).conditions.b.water,false);
 await p.locator('[data-action="peek"]').click();
 for(const day of [0,3,7]){await setRange(p,'day',day);await p.locator('[data-action="seed-photo"]').click();}
 await p.locator('#next').click();await p.locator('[data-choice-action="seed-winner"]').selectOption('a');await p.locator('[data-choice-action="seed-reason"]').selectOption('water');
 await p.locator('[data-action="retry-setup"]').click();await p.locator('[data-action="retry-toggle"][data-value="water"]').click();await p.locator('[data-action="retry-pred"][data-value="unsure"]').click();await p.locator('[data-action="retry-start"]').click();
 await setRange(p,'day',7);await p.locator('[data-action="seed-photo"]').click();await p.locator('[data-action="reflection"][data-value="changed"]').click();await p.locator('#next').click();
 assert.equal((await state(p)).expedition.active,1);await context.close();
 const {page:q,context:careContext}=await open(4);await q.waitForTimeout(250);
 for(const x of [405,795]){await drag(q,1117,170,x,300);await drag(q,1117,350,x,300);}
 assert.ok(G.phaseReady(await state(q),4));await q.locator('#next').click();await q.locator('[data-choice-action="question"]').selectOption('light');await q.locator('[data-choice-action="greenhouse-prediction"]').selectOption('unsure');
 await drag(q,1117,350,795,300);await q.locator('#next').click();await q.waitForTimeout(250);assert.equal((await state(q)).mission,5);
 await click(q,400,300);await click(q,850,300);await q.locator('[data-action="trait"][data-value="color"]').click();await q.locator('[data-action="trait"][data-value="stem"]').click();await q.locator('[data-action="cause"][data-value="light"]').click();await q.locator('#next').click();
 await q.locator('[data-action="repair-button"][data-value="light"]').click();await setRange(q,'care-day',2);await q.locator('[data-action="care-photo"]').click();await q.locator('[data-action="note"]').click();await q.locator('#note-input').fill('빛을 돌려준 뒤 시간을 두고 새잎을 살펴보았어요.');await q.locator('[data-action="save-note"]').click();await q.locator('#next').click();
 assert.equal((await state(q)).expedition.active,2);assert.deepEqual(errors,[]);await careContext.close();
 const result={viewport:'1024x768',seed:'soil/seeds drag, fair setup, prediction dropdown, photos, retry and commission passed',greenhouse:'sensor drag, question/prediction dropdown, care pins, correct tool, time, evidence, note and commission passed',errors};
 await writeFile(new URL('../docs/reviews/expedition-20261018/inquiry-controls-results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}finally{await browser.close();}
