import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,process.env.QA_OUTPUT||'.tmp/recovery-play');await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true}),page=await context.newPage(),errors=[],checks=[];
await page.addInitScript(()=>{let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const start=Number(process.env.START_CHAPTER||0);
const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')));
const pause=()=>page.waitForTimeout(100);
async function closeNote(){if(await page.locator('dialog[open] [data-notebook-close]').count()){assert.equal(await page.locator('.notebook-book').isVisible(),true);await page.locator('[data-notebook-close]').click();await pause();}}
async function click(selector){await page.locator(selector).click();await pause();await closeNote();}
async function key(name,index=0){const b=page.getByRole('button',{name,exact:typeof name==='string'}).nth(index);await b.focus();await b.press('Enter');await pause();await closeNote();}
async function point(x,y){await page.locator('canvas').scrollIntoViewIfNeeded();return page.evaluate(({x,y})=>{const scene=window.__qaGame.scene.getScene('field-world'),p=scene.projectWorld({x,y}),b=scene.game.canvas.getBoundingClientRect(),size=scene.viewportSize();return {x:b.x+p.x*b.width/size.width,y:b.y+p.y*b.height/size.height};},{x,y});}
async function drag(x,y,tx,ty){const a=await point(x,y),b=await point(tx,ty);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();await pause();}
async function range(name,value){const b=page.getByRole('slider',{name,exact:true});await b.focus();await b.press('Home');for(let i=0;i<value;i++)await page.getByRole('slider',{name,exact:true}).press('ArrowRight');await pause();}
const snap=async name=>{await page.waitForTimeout(800);return page.screenshot({path:path.join(out,name+'.png')});};
async function enter(c){await click('#next');await page.waitForFunction(c=>document.querySelector('#app').dataset.view==='room'&&JSON.parse(localStorage.getItem('life-clock-lab.phaser.4')).field.active===c,c);await page.locator('.boot').waitFor({state:'detached'});await pause();await writeFile(path.join(out,`checkpoint-${c}.json`),JSON.stringify(await state()));}
async function complete(c){await snap('discovery-done-'+c);await click('#next');assert.deepEqual((await state()).field.completed,Array.from({length:c+1},(_,i)=>i));await click('[data-action=reward-concept]');await page.locator('#concept-video').waitFor();await page.waitForFunction(()=>document.querySelector('#concept-video').readyState>=2);await click('#concept-finish');checks.push('chapter-and-concept-'+c);console.log('PASS chapter',c);}
async function discoveries(c){
 assert.match(await page.locator('#objective').innerText(),/추가 발견/);
 if(c===0){await key('애벌레');await key('내 흔적 발견 기록');await key('어른벌레');await key('내 흔적 발견 기록');}
 if(c===1){await key('A에도 물 주기');assert.equal((await state()).field.chapters[1].discovery.length,0);await key('A의 온도를 B와 같게');await key('수리한 실험 설계 저장');for(const t of ['물은 알맞게 주었을까?','온도는 알맞을까?','충분히 관찰했을까?'])await key(t);await key('조건을 확인하며 관찰 이어가기');}
 if(c===2){await key('흙의 물기 측정 결과');await key('빛 측정 결과');await key('물·빛 그대로 두고 관찰');await key('새잎의 초록빛에 표시');await key('새잎 발견 기록');}
 if(c===3){await key('A-01 나무 선택');await key('같은 이름표의 사진 기록');for(const t of ['같은 자리·같은 방향으로','정한 때마다 꾸준하게','꺾거나 잡지 않고 그 자리에서'])await key(t);await key('나의 관찰 사진 계획 완성');}
 if(c===4){for(let i=0;i<3;i++)await key('이 기록에 도장');await key('나만의 궁금증 쓰기');await page.locator('#discovery-question').fill('우리 학교 봉선화는 언제 꽃이 필까?');await click('#discovery-question-save');}
 assert.equal((await state()).field.chapters[c].discovery.length,2);checks.push('two-discoveries-'+c);
}
try{
 if(start){const fixture=JSON.parse(await readFile(path.join(root,'.tmp/recovery-play',`checkpoint-${start}.json`),'utf8'));await page.addInitScript(value=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(value));sessionStorage.setItem('seeded','1');}},fixture);}
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:4186');await page.locator('.boot').waitFor({state:'detached'});if(start===0){await click('[data-action=start]');await click('[data-action=begin]');await enter(0);}
 if(start===0){
 for(const form of ['알','애벌레','번데기','어른벌레'])for(let i=0;i<2;i++){await key(form+' 확대해서 보기');assert.equal(await page.locator('dialog[open]').count(),0);await key('관찰한 모습 기록');}
 await drag(720,310,880,440);await drag(880,440,980,290);await click('[data-field-action=note]');await page.locator('#observation-note').fill('애벌레 몸에는 여러 마디와 작은 다리가 보여.');await click('[data-action=save-note]');
 for(let to=0;to<4;to++){const order=(await state()).field.chapters[0].order,from=order.indexOf(['egg','larva','pupa','adult'][to]);if(from!==to)await drag(300+from*225,385,300+to*225,390);}
 await key('새 알을 고른 뒤 오른쪽 잎 자리 누르기');await key('다음 세대의 새 알을 놓을 자리');await discoveries(0);await complete(0);await enter(1);}
 if(start<=1){
 for(let round=0;round<2;round++){
  for(let side=0;side<2;side++){await key('○ 흙 넣기');for(let n=0;n<3;n++)await key(`콩 ${n}/3 · +1`);}
  await click('#next');assert.equal((await state()).field.chapters[1].rounds[round].run,null);checks.push('seed-prerequisites-'+round);
  await key(round?'① B를 알맞은 온도로':'① B에 물 주기');await click('[data-field-action=prediction]');await click('[data-action=predict][data-choice=both]');await click('#next');
  for(const day of [0,3,7]){if(day)await range('씨앗 관찰 날짜',day);await click('#next');}
  await snap('seed-grown-'+round);await key('B에서만 싹이 났어');await key(round?'온도 조건':'물 조건');await key('달라서 생각을 바꿨어');if(!round)await click('#next');
 }
 await discoveries(1);await complete(1);await enter(2);}
 if(start<=2){
 for(let c=0;c<2;c++){
  await key('○ 물기 재기');await key('○ 빛 재기');await key(c?'② 잎 · 옅어진 잎빛':'② 잎 · 처진 잎');await page.getByRole('button',{name:'돌봄 전 사진',exact:true}).waitFor();await click('#next');await key(c?'빛이 드는 곳으로':'알맞게 물 주기');await range('돌봄 뒤 시간',2);await snap('care-after-'+c);await click('#next');if(!c)await click('#next');
 }
 await discoveries(2);await complete(2);await enter(3);}
 if(start<=3){
 await click('[data-field-action=animal-photo][data-payload*=butterfly]');await click('[data-field-action=animal-photo][data-payload*=dog]');await range('나비의 시간',3);await click('[data-field-action=animal-photo][data-payload*=butterfly]');await range('개의 시간',2);await click('[data-field-action=animal-photo][data-payload*=dog]');
 await key('다음 세대 옮기기');await key('부모와 다른 생명');
 await key('A-01 옮기기');await key('사과나무 이름표');await key('B-01 옮기기');await key('봉선화 이름표');
 for(const season of [0,4,3]){if(season)await range('식물 관찰 계절',season);await click('[data-field-action=season-photo][data-payload*=apple]');await click('[data-field-action=season-photo][data-payload*=balsam]');}
 await key('작년 그 식물 옮기기');await key('사과나무 이름표');await key('새로 자란 식물 옮기기');await key('봉선화 이름표');await key('작년 그 식물 옮기기');await key('새 자료에 판단 연결');await key('새끼로 태어남 옮기기');await key('새 자료에 판단 연결');
 await discoveries(3);await complete(3);await enter(4);}
 await key(/눌러서 기록판에 붙이기$/);await key(/눌러서 기록판에 붙이기$/);await click('[data-field-action=record-page] >> text=다음 자료');await key(/눌러서 기록판에 붙이기$/);await snap('story-cork');
 await click('[data-field-action=story-info]');await page.locator('#story-title').fill('작은 생명들의 서로 다른 시간');await page.locator('#story-summary').fill('나는 이제 관찰 사진을 근거로 나비의 모습 변화와 식물에 필요한 물과 빛을 설명할 수 있어.');await click('[data-action=save-story]');
 for(let i=0;i<2;i++){await click('[data-field-action=story-caption]');await page.locator('#caption-record').selectOption({index:i});await page.locator('#story-caption').fill(i?'몸의 여러 마디와 작은 다리를 관찰했어.':'잎에 붙은 작고 길쭉한 알을 자세히 살펴봤어.');await click('[data-action=save-caption]');}
 for(const [pattern,target] of [[/알.*기록으로 선택하기$/,'생김새를 보여 줘 자리에 기록 놓기'],[/물.*기록으로 선택하기$/,'조건을 비교한 기록은? 자리에 기록 놓기'],[/시든.*기록으로 선택하기$/,'어떻게 돌봤니? 자리에 기록 놓기']]){
  let found=false;for(let n=0;n<5;n++){const match=page.getByRole('button',{name:pattern});if(await match.count()){await key(pattern);found=true;break;}await click('[data-field-action=record-page] >> text=다음 자료');}assert.ok(found,String(pattern));await key(target);
 }
 await click('#next');await click('[data-action=save-plan]');assert.equal(await page.locator('dialog').isVisible(),true);await page.locator('#plan-subject').fill('학교 화단의 봉선화');await page.locator('#plan-when').fill('매주 월요일과 목요일');await page.locator('#plan-what').fill('잎 수와 줄기 모양을 보고 글과 그림으로 남기기');await click('[data-action=save-plan]');
 await discoveries(4);await complete(4);assert.ok((await page.locator('dialog[open]').innerText()).includes((await state()).field.chapters[4].summary));await snap('ending');await click('[data-action=certificate]');await snap('certificate');
 for(const [selector,file] of [['[data-action=export]','story.png'],['[data-action=certificate-png]','certificate.png']]){const pending=page.waitForEvent('download');await click(selector);await(await pending).saveAs(path.join(out,file));}
 await click('dialog .close');const saved=await state();await writeFile(path.join(out,'earned-state.json'),JSON.stringify(saved,null,2));await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.deepEqual((await state()).field,saved.field);checks.push('export-and-reload');assert.deepEqual(errors,[]);await writeFile(path.join(out,'result.json'),JSON.stringify({checks,errors,completed:saved.field.completed},null,2));console.log(JSON.stringify({checks,errors}));
}catch(e){await snap('FAILURE');const objective=await page.locator('#objective').innerText().catch(()=>''),buttons=await page.getByRole('button').allTextContents();await writeFile(path.join(out,'failure.json'),JSON.stringify({error:e.stack,objective,buttons,errors,checks,state:await state()},null,2));console.error('FAIL',e.message,objective);process.exitCode=1;}finally{await browser.close();}
