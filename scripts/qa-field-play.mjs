import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.tmp','field-play');await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true}),page=await context.newPage(),errors=[],checks=[];
page.on('pageerror',e=>{errors.push(e.message);console.log('ERROR',e.message);});page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const pause=()=>page.waitForTimeout(120),state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('life-clock-lab.phaser.4'))),click=async selector=>{await page.locator(selector).click();await pause();},snap=async name=>{await page.screenshot({path:path.join(out,name+'.png')});};
async function point(x,y){const b=await page.locator('canvas').boundingBox();return {x:b.x+x*b.width/1280,y:b.y+y*b.height/800};}
async function drag(x,y,tx,ty){const a=await point(x,y),b=await point(tx,ty);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();await pause();}
async function range(label,value){const l=page.getByRole('slider',{name:label,exact:true});await l.focus();await l.press('Home');for(let i=0;i<value;i++)await page.getByRole('slider',{name:label,exact:true}).press('ArrowRight');await pause();}
async function enter(c){await click('#next');await page.waitForFunction(c=>document.querySelector('#app').dataset.view==='room'&&JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')).field.active===c,c);await page.waitForTimeout(400);}
async function complete(c){await click('#next');assert.deepEqual((await state()).field.completed,Array.from({length:c+1},(_,i)=>i));await page.locator('#concept-video').waitFor();await page.waitForFunction(()=>document.querySelector('#concept-video').readyState>=2);assert.equal(await page.locator('#concept-caption').isVisible(),true);await snap('concept-'+c);await click('#concept-finish');checks.push('chapter-'+c,'concept-'+c);console.log('PASS chapter + concept',c);}
try{
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4202');await page.locator('.boot').waitFor({state:'detached'});await click('[data-action=start]');await click('[data-action=begin]');await enter(0);
 const forms=[['egg',325,250,160],['larva',460,445,215],['pupa',970,260,180],['adult',885,505,235]];
 for(const[id,x,y,size]of forms)for(let i=0;i<2;i++){await drag(650,360,x+(i?size*.2:-size*.2),y+(id==='pupa'?i*size*.3-size*.15:(i?size*.1:-size*.1)));assert.equal((await state()).field.chapters[0].inspected[id].includes(i),true,id+' spot '+i);}
 await snap('01-drawing');await drag(720,310,880,440);await drag(880,440,980,290);await click('[data-field-action=note]');await page.locator('#observation-note').fill('애벌레 몸에는 여러 마디와 작은 다리가 보여.');await click('[data-action=save-note]');
 for(let to=0;to<4;to++){const order=(await state()).field.chapters[0].order,from=order.indexOf(['egg','larva','pupa','adult'][to]);if(from!==to)await drag(300+from*225,365,300+to*225,380);}
 await drag(540,450,890,380);await snap('02-first-reward');await complete(0);await enter(1);
 for(let round=0;round<2;round++){
  for(const x of [420,825]){await drag(585,640,x,400);for(let i=0;i<3;i++)await drag(720,640,x,400);}
  await click('#next');assert.equal((await state()).field.chapters[1].rounds[round].run,null);checks.push('missing-prediction-blocked');
  await drag(round?700:510,650,825,400);await click('[data-field-action=prediction]');await click('[data-action=predict][data-choice=both]');await click('#next');
  await click('#next');await range('씨앗 관찰 날짜',3);await click('#next');await range('씨앗 관찰 날짜',7);await snap('03-seed-'+round);await click('#next');
  await drag(round?340:950,640,640,640);assert.equal((await state()).field.chapters[1].rounds[round].reason,'');checks.push('wrong-seed-reason-blocked');await drag(round?950:340,640,640,640);if(!round)await click('#next');
 }
 await complete(1);await enter(2);
 for(let n=0;n<2;n++){
  await drag(430,610,690,400);await drag(850,610,690,400);await drag(380,580,690,n?480:325);assert.equal((await state()).field.chapters[2].cases[n].symptom,'');checks.push('wrong-pin-blocked');await drag(380,580,690,n?325:480);await click('#next');
  await drag(n?410:960,610,690,400);assert.equal((await state()).field.chapters[2].cases[n].tool,'');checks.push('wrong-care-blocked');await drag(n?960:410,610,690,400);await range('돌봄 뒤 시간',2);await snap('04-care-'+n);await click('#next');if(!n)await click('#next');
 }
 await complete(2);await enter(3);
 await click('[data-field-action=animal-photo][data-payload*=butterfly]');await click('[data-field-action=animal-photo][data-payload*=dog]');await range('나비의 시간',3);await click('[data-field-action=animal-photo][data-payload*=butterfly]');await range('개의 시간',2);await click('[data-field-action=animal-photo][data-payload*=dog]');await drag(630,290,630,465);
 await drag(420,620,420,400);await drag(845,620,845,400);await click('[data-field-action=season-photo][data-payload*=apple]');await click('[data-field-action=season-photo][data-payload*=balsam]');
 for(const season of [4,3]){await range('식물 관찰 계절',season);await click('[data-field-action=season-photo][data-payload*=apple]');await click('[data-field-action=season-photo][data-payload*=balsam]');}
 await snap('05-identity-nextspring');await drag(400,640,420,400);await drag(855,640,845,400);await drag(400,625,650,390);await drag(400,625,650,390);await complete(3);await enter(4);await page.waitForTimeout(700);
 await drag(370,615,650,340);await drag(650,615,650,340);await click('[data-field-action=record-page] >> text=다음 자료');await page.waitForTimeout(350);await drag(650,615,650,340); // observation + observation + water experiment
 await snap('06-story-edit');await click('[data-field-action=story-info]');await page.locator('#story-title').fill('작은 생명들의 서로 다른 시간');await page.locator('#story-summary').fill('나비는 몸 모습이 달라지고 식물은 자라는 데 물과 빛이 필요해. 사과나무는 겨울을 지난 같은 나무야.');await click('[data-action=save-story]');
 for(let i=0;i<2;i++){await click('[data-field-action=story-caption]');await page.locator('#caption-record').selectOption({index:i});await page.locator('#story-caption').fill(i?'몸이 여러 마디인 애벌레가 잎을 먹으며 자라.':'작은 알의 모양과 붙어 있는 부분을 자세히 관찰했어.');await click('[data-action=save-caption]');}
 await page.waitForTimeout(350); // help bank resets page0
 await drag(370,615,310,310);await click('[data-field-action=record-page] >> text=다음 자료');await page.waitForTimeout(350);await drag(650,615,640,310);await click('[data-field-action=record-page] >> text=다음 자료');await page.waitForTimeout(350);await drag(370,615,970,310);
 await click('#next');await click('[data-action=save-plan]');assert.equal(await page.locator('dialog').isVisible(),true);checks.push('empty-plan-blocked');await page.locator('#plan-subject').fill('학교 화단의 봉선화');await page.locator('#plan-when').fill('매주 월요일과 목요일');await page.locator('#plan-what').fill('잎 수와 줄기 모양을 보고 글과 그림으로 남기기');await click('[data-action=save-plan]');await snap('07-final-reward');await complete(4);
 await snap('08-ending');await click('[data-action=certificate]');await snap('09-certificate');const downloadPromise=page.waitForEvent('download');await click('[data-action=export]');const download=await downloadPromise;await download.saveAs(path.join(out,'story.png'));checks.push('actual-evidence-PNG');
 const certPromise=page.waitForEvent('download');await click('[data-action=certificate-png]');const cert=await certPromise;await cert.saveAs(path.join(out,'certificate.png'));checks.push('certificate-PNG');await click('dialog .close');const saved=await state();await writeFile(path.join(out,'earned-state.json'),JSON.stringify(saved));await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.deepEqual((await state()).field,saved.field);checks.push('complete-reload');assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({checks,records:12,errors,out}));await writeFile(path.join(out,'result.json'),JSON.stringify({checks,errors,completed:saved.field.completed,story:saved.field.chapters[4],out},null,2));
}catch(e){await snap('FAILURE');console.log('FAIL',e.message,await page.locator('#objective').innerText());await writeFile(path.join(out,'failed-state.json'),JSON.stringify(await state()));await writeFile(path.join(out,'failure.json'),JSON.stringify({error:e.message,errors,checks},null,2));process.exitCode=1;}finally{await browser.close();}
