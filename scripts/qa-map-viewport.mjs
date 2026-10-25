import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
process.env.TEMP=process.env.TMP='D:/DevTemp';
const out=new URL('../.tmp/map-viewport-20261025/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1874,height:918}}),errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{let lib;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>lib,set(value){lib=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
try{
 await page.goto('http://127.0.0.1:4316');await page.locator('[data-action=start]').click();await page.locator('[data-action=begin]').click();await page.waitForTimeout(600);
 for(const [width,height]of [[1874,918],[1280,800],[873,580]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(400);
  for(const position of ['start','upper-left','lower-right']){
   if(position!=='start'){await page.evaluate(position=>{const s=window.__qaGame.scene.getScene('field-world');s.avatar.setPosition(position==='upper-left'?40:1240,position==='upper-left'?40:760);},position);await page.waitForTimeout(800);}
   const r=await page.evaluate(()=>{const s=window.__qaGame.scene.getScene('field-world'),a=s.projectWorld({x:0,y:0}),b=s.projectWorld({x:1280,y:800}),size=s.viewportSize();return {a,b,size};});
   assert.ok(r.a.x<=1&&r.a.y<=1&&r.b.x>=r.size.width-1&&r.b.y>=r.size.height-1,JSON.stringify(r));checks.push({width,height,position,covered:true});
  }
  if(width===1874){await page.locator('#app').screenshot({path:new URL('wide-fixed.png',out).pathname.replace(/^\//,'').replace(/%20/g,' ')});}
 }
 await page.getByRole('button',{name:'나비의 숲 입장하기',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#app').dataset.view==='room');
 assert.deepEqual(errors,[]);await writeFile(new URL('result.json',out),JSON.stringify({checks,doorEntry:true,errors},null,2));console.log(JSON.stringify({checks:checks.length,doorEntry:true,errors}));
}finally{await browser.close();}
