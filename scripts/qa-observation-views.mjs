import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=new URL('../.tmp/observation-views-20261028/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
const ORDER=[['egg',0],['egg',1],['larva',0],['larva',1],['pupa',0],['pupa',1],['adult',0],['adult',1]];
try{for(const [width,height,touch]of [[1280,800,false],[873,580,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch,bypassCSP:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.locator('[data-action=start]').click();await page.locator('[data-cinema-skip]').click();await page.locator('[data-cinema-finish]').click();await page.locator('[data-action=begin]').click();await page.locator('#next').click();await page.locator('[aria-label="알 확대해서 보기"]').waitFor({state:'attached'});await page.locator('.boot').waitFor({state:'detached'});
 const total=()=>page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')).field.chapters[0].inspected).reduce((n,a)=>n+a.length,0));
 const magnified=()=>page.evaluate(()=>window.__qaGame.scene.getScene('field-world').children.list.filter(o=>o.type==='Image'&&o.mask&&o.depth===103).map(o=>({key:o.texture.key,x:Math.round(o.x),y:Math.round(o.y)})));
 const tap=async name=>{const target=page.getByRole('button',{name,exact:true}).first(),b=await target.boundingBox();if(touch)await page.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);else await page.mouse.click(b.x+b.width/2,b.y+b.height/2);};
 // One view button opens the viewer; ▶ pages through all eight features without recording or a notebook.
 await tap('표면 보기');const views=[];
 for(let i=0;i<ORDER.length;i++){
  const [form]=ORDER[i],m=await magnified();assert.equal(m.length,1);assert.equal(m[0].key,form,`page ${i+1} shows ${form}`);views.push(JSON.stringify(m[0]));
  assert.equal(await page.locator('dialog[open]').count(),0,'paging must not open the notebook');assert.equal(await total(),0,'paging must not record yet');
  await page.screenshot({path:fileURLToPath(new URL(`${width}-page${i+1}.png`,out))});
  if(i<ORDER.length-1)await tap('다음 특징 보기');
 }
 assert.equal(new Set(views).size,ORDER.length,'every page shows a different close-up');
 // ◀ wraps back, then quick repeated ▶ taps each advance one page.
 await tap('이전 특징 보기');assert.equal((await magnified())[0].key,'adult');
 await tap('다음 특징 보기');await tap('다음 특징 보기');await tap('다음 특징 보기');assert.equal((await magnified())[0].key,'egg');
 await tap('관찰 마치기');await page.getByRole('heading',{name:'직접 본 특징을 한 문장으로 남겨 줘.',exact:true}).waitFor();
 assert.equal(await page.locator('dialog[open]').count(),0,'finishing records without a notebook popup');assert.equal(await total(),8);
 await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.equal(await total(),8);await context.close();checks.push({width,height,touch,pages:ORDER.length,recordedOnFinish:8});
}assert.deepEqual(errors,[]);await writeFile(new URL('result.json',out),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));}finally{await browser.close();}
