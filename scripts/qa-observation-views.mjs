import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=new URL('../.tmp/observation-views-20261025/',import.meta.url);await mkdir(out,{recursive:true});process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{for(const [width,height,touch]of [[1280,800,false],[873,580,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.locator('[data-action=start]').click();await page.locator('[data-action=begin]').click();await page.locator('#next').click();await page.locator('[aria-label="알 확대해서 보기"]').waitFor({state:'attached'});await page.locator('.boot').waitFor({state:'detached'});
 const total=()=>page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')).field.chapters[0].inspected).reduce((n,a)=>n+a.length,0));
 const tap=async(name,index=0)=>{const target=page.getByRole('button',{name,exact:true}).nth(index);for(let attempt=0;attempt<3;attempt++){try{await target.scrollIntoViewIfNeeded();break;}catch(error){if(attempt===2||!error.message.includes('not attached'))throw error;await page.waitForTimeout(200);}}const b=await target.boundingBox();if(touch)await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);else await page.mouse.click(b.x+b.width/2,b.y+b.height/2);};
 for(const [form,part,index]of [['egg','표면 보기',0],['egg','모양 보기',0],['larva','몸마디 보기',0],['larva','다리 보기',0],['pupa','겉모습 보기',0],['pupa','모양 보기',1],['adult','날개 보기',0],['adult','더듬이 보기',0]]){
  const before=await total();await tap(part,index);assert.equal(await page.locator('dialog[open]').count(),0,part+' should preview first');assert.equal(await total(),before,'preview must not record');
  const magnified=await page.evaluate(()=>window.__qaGame.scene.getScene('field-world').children.list.filter(o=>o.type==='Image'&&o.mask).map(o=>({key:o.texture.key,width:o.displayWidth})));assert.equal(magnified.length,1);assert.equal(magnified[0].key,form);assert.ok(magnified[0].width>100);
  await page.screenshot({path:fileURLToPath(new URL(`${width}-${form}-${before}.png`,out))});await tap('관찰 마치기');await page.locator('[data-notebook-close]').waitFor();assert.equal(await total(),before+1);await page.locator('[data-notebook-close]').click();await page.waitForTimeout(200);checks.push({width,height,touch,form,part,previewOnly:true,recordedAfterConfirm:true});
 }
 await page.getByRole('heading',{name:'직접 본 특징을 그림과 한 문장으로 남겨 줘.',exact:true}).waitFor();await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.equal(await total(),8);await context.close();
}assert.deepEqual(errors,[]);await writeFile(new URL('result.json',out),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));}finally{await browser.close();}
