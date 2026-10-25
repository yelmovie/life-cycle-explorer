import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const out=new URL('../.tmp/final-story-review/',import.meta.url);await mkdir(out,{recursive:true});process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}}),frames=[],errors=[];
const fixture=JSON.parse(await readFile(new URL('../.tmp/recovery-play/checkpoint-4.json',import.meta.url),'utf8'));let start;
async function frame(name,seconds){await page.waitForTimeout(Math.max(0,start+seconds*1000-Date.now()));const text=await page.locator('body').innerText();frames.push({name,elapsedMs:Date.now()-start,text});await page.screenshot({path:fileURLToPath(new URL(name+'.png',out))});console.log(name);}
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(s=>localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(s)),fixture);await page.goto(process.env.BASE_URL||'http://127.0.0.1:4215');await page.locator('.boot').waitFor({state:'detached'});start=Date.now();await frame('story-pick',0);
 for(let i=0;i<2;i++)await page.getByRole('button',{name:/눌러서 기록판에 붙이기$/}).first().press('Enter');await page.locator('[data-field-action=record-page]').filter({hasText:'다음 자료'}).click();await page.getByRole('button',{name:/눌러서 기록판에 붙이기$/}).first().press('Enter');await frame('evidence-selected',45);
 await page.locator('[data-field-action=story-info]').click();await page.locator('#story-title').fill('다른 증거로 이어 본 생명의 시간');await page.locator('#story-summary').fill('다른 장면의 사진을 골라서 나비의 모습과 식물의 변화를 내 말로 설명했어.');await page.locator('[data-action=save-story]').click();await frame('own-explanation',90);
 for(let i=0;i<2;i++){await page.locator('[data-field-action=story-caption]').click();await page.locator('#caption-record').selectOption({index:i});await page.locator('#story-caption').fill(i?'이 사진에서 몸의 여러 마디를 찾아봤어.':'이 사진에서 작고 길쭉한 알의 모습을 찾아봤어.');await page.locator('[data-action=save-caption]').click();}await frame('choose-request-evidence',135);await frame('three-minute-review',180);
 assert.deepEqual(errors,[]);await writeFile(new URL('result.json',out),JSON.stringify({frames,errors,durationMs:Date.now()-start,scope:'Adult UI review of the weakest stage; no student replay preference measured.'},null,2));
}finally{await browser.close();}
