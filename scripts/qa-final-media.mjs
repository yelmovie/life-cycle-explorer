import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('../.tmp/final-media/',import.meta.url);await mkdir(out,{recursive:true});process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),checks=[],errors=[];
const earned=JSON.parse(await readFile(new URL('../.tmp/recovery-play/earned-state.json',import.meta.url),'utf8'));earned.fieldView='map';earned.audio={bgm:true,sfx:true,volume:.2};
page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(s=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(s));sessionStorage.setItem('seeded','1');}},earned);
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.getByRole('button',{name:'설정',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#theme-audio')?.paused===false);
 await page.locator('[data-action=concept-list]').click();
 for(let c=0;c<5;c++){
  await page.locator(`[data-action=concept-select][data-chapter="${c}"]`).click();await page.waitForFunction(()=>document.querySelector('#concept-video')?.readyState>=2);
  assert.equal(await page.locator('#theme-audio').evaluate(a=>a.paused),true);
  await page.waitForFunction(()=>document.querySelector('#concept-video')?.ended,{},{timeout:18000});
  const video=await page.locator('#concept-video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,ended:v.ended,currentTime:v.currentTime}));assert.ok(video.duration>=11.9);assert.equal(video.ended,true);
  await page.locator('#concept-finish').click();await page.getByRole('heading',{name:'개념 영상 모아 보기',exact:true}).waitFor();await page.waitForFunction(()=>document.querySelector('#theme-audio')?.paused===false);
  assert.equal(await page.locator('#theme-audio').count(),1);checks.push({chapter:c,...video,bgmPausedDuringVideo:true,bgmResumed:true});console.log('PASS full video',c);
 }
 await page.locator('[data-action=settings]').last().click();await page.locator('dialog [data-action=ending]').click();await page.waitForFunction(()=>document.querySelector('#theme-audio')?.dataset.musicTheme==='ending'&&!document.querySelector('#theme-audio').paused);await page.locator('dialog .close').click();await page.waitForFunction(()=>document.querySelector('#theme-audio')?.dataset.musicTheme==='main'&&!document.querySelector('#theme-audio').paused);checks.push({endingThemeSwitch:true,playerCount:await page.locator('#theme-audio').count()});
 await page.route('**/assets/concepts/*',route=>/\.(mp4|webm)$/.test(route.request().url())?route.abort():route.continue());await page.getByRole('button',{name:'설정',exact:true}).click();await page.locator('[data-action=concept-list]').click();await page.locator('[data-action=concept-select][data-chapter="0"]').click();await page.locator('#concept-fallback').waitFor({state:'visible',timeout:12000});assert.equal(await page.locator('#concept-fallback li').count(),3);await page.locator('dialog .close').click();await page.getByRole('heading',{name:'개념 영상 모아 보기',exact:true}).waitFor();checks.push({failedVideoShowsThreeCluesAndReturns:true});
 assert.deepEqual(errors,[]);await writeFile(new URL('result.json',out),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));
}finally{await browser.close();}
