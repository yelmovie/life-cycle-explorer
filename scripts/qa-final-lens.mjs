import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
const root=new URL('../.tmp/final-lens/',import.meta.url);await mkdir(root,{recursive:true});process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),checks=[],errors=[];
try{for(const [width,height,touch]of [[1280,800,false],[1024,600,true]]){
 const context=await browser.newContext({viewport:{width,height},hasTouch:touch}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.locator('.boot').waitFor({state:'detached'});await page.locator('[data-action=start]').click();await page.locator('[data-action=begin]').click();await page.locator('#next').click();await page.waitForFunction(()=>document.querySelector('#app').dataset.view==='room');await page.locator('.boot').waitFor({state:'detached'});
 await page.locator('canvas').scrollIntoViewIfNeeded();
 const p=async(x,y)=>page.evaluate(({x,y})=>{const scene=window.__qaGame.scene.getScene('field-world'),point=scene.projectWorld({x,y}),b=scene.game.canvas.getBoundingClientRect(),size=scene.viewportSize();return {x:b.x+point.x*b.width/size.width,y:b.y+point.y*b.height/size.height};},{x,y});
 const a=await p(640,350),z=await p(926,290);const session=await context.newCDPSession(page);
 if(touch){await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});for(let i=1;i<=20;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:a.x+(z.x-a.x)*i/20,y:a.y+(z.y-a.y)*i/20}]});}
 else{await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(z.x,z.y,{steps:20});}
 await page.waitForTimeout(250);await page.screenshot({path:fileURLToPath(new URL(`live-${width}.png`,root))});
 if(touch)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await page.mouse.up();
 await page.locator('[data-notebook-close]').waitFor();assert.match(await page.locator('#modal').innerText(),/애벌레의 관찰 단서/);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')));assert.deepEqual(saved.field.chapters[0].inspected.larva,[0]);
 await page.locator('[data-notebook-close]').click();await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')).field.chapters[0].inspected.larva),[0]);
 checks.push({width,height,touch,liveMagnifier:'screenshot',releaseRecordsOneClue:true,reloadPreservesClue:true});await context.close();
}assert.deepEqual(errors,[]);await writeFile(new URL('result.json',root),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors}));}finally{await browser.close();}
