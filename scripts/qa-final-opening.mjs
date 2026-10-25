import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=new URL('../.tmp/final-opening/',import.meta.url);await mkdir(out,{recursive:true});
process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1280,height:800}}),frames=[],errors=[];
page.on('pageerror',e=>errors.push(e.message));const started=Date.now();
const capture=async name=>{frames.push({name,elapsed:Date.now()-started,text:await page.locator('body').innerText()});await page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});};
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.locator('.boot').waitFor({state:'detached'});await capture('title');
 await page.locator('[data-action=start]').click();await capture('opening');await page.waitForTimeout(20000);
 await page.locator('[data-action=begin]').click();await capture('map');await page.waitForTimeout(15000);
 await page.locator('#next').click();await page.waitForFunction(()=>document.querySelector('#app').dataset.view==='room');await page.locator('.boot').waitFor({state:'detached'});await capture('first-mission');
 for(const form of ['알','애벌레','번데기','어른벌레']){await page.getByRole('button',{name:form+' 확대해서 보기',exact:true}).press('Enter');await capture('observe-'+form);await page.waitForTimeout(30000);await page.getByRole('button',{name:'관찰한 모습 기록',exact:true}).press('Enter');await page.locator('[data-notebook-close]').click();}
 await page.waitForTimeout(Math.max(0,180000-(Date.now()-started)));await capture('three-minutes');
 await page.locator('[data-action=settings]').click();await capture('settings');
 const settings={collapsed:await page.locator('#modal details[open]').count(),summary:await page.locator('#modal summary').allTextContents(),endingLocked:await page.locator('#modal [data-action=ending]').isDisabled(),certificateLocked:await page.locator('#modal [data-action=certificate]').isDisabled()};
 await writeFile(new URL('result.json',out),JSON.stringify({frames,settings,errors},null,2));console.log(JSON.stringify({frames:frames.length,settings,errors}));
}finally{await browser.close();}
