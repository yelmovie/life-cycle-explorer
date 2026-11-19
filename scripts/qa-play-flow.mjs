// Shared full playthrough for qa-field-play (pointer taps on the canvas) and
// qa-recovery-play (keyboard: focus + Enter). Both press the same in-room steps
// by the labels the scenes give their canvas targets (#focus-targets), so a
// label change shows up here instead of a silent coordinate miss.
// Flow as of 0.9.x (2026-11-19): a zone finishes by itself on its last step,
// the reward dialog opens on the map, and the next door stays shut until the
// villain beside the finished zone is hit three times.
import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const KEY='life-clock-lab.phaser.4';
const VILLAINS=['butterfly','seed','care','season'];

export async function runPlay({input,output,defaultUrl}){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
 const out=path.join(root,process.env.QA_OUTPUT||output);await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
 const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
 const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:1280,height:800},acceptDownloads:true}),page=await context.newPage(),errors=[],checks=[];
 await page.addInitScript(()=>{let library;Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){library=value;const Game=value.Game;value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};}});});
 page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 const start=Number(process.env.START_CHAPTER||0);
 const state=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);
 const field=async c=>(await state()).field.chapters[c];
 const pause=(ms=150)=>page.waitForTimeout(ms);
 const snap=async name=>{await pause(500);await page.screenshot({path:path.join(out,name+'.png')});};
 const objective=()=>page.locator('#objective').innerText();
 const waitObjective=(text,timeout=40000)=>page.waitForFunction(t=>document.querySelector('#objective')?.innerText===t,text,{timeout});
 const nextText=()=>page.locator('#next').innerText();
 async function closeNote(){if(await page.locator('dialog[open] [data-notebook-close]').count()){await page.locator('[data-notebook-close]').click();await pause();}}
 // One canvas target by its label (exact string or pattern); nth picks among equal labels.
 async function target(name,nth=0){
  const b=page.locator('#focus-targets').getByRole('button',{name,exact:typeof name==='string'}).nth(nth);
  await b.waitFor({state:'attached'});return b;
 }
 async function press(name,nth=0){
  const b=await target(name,nth);
  if(input==='keyboard'){await b.focus();await b.press('Enter');}
  else{const r=await b.boundingBox();assert.ok(r,'no box for '+name);await page.mouse.click(r.x+r.width/2,r.y+r.height/2);}
  await pause();await closeNote();
 }
 async function click(selector){await page.locator(selector).click();await pause();await closeNote();}
 async function point(x,y){return page.evaluate(({x,y})=>{const scene=window.__qaGame.scene.getScene('field-world'),p=scene.projectWorld({x,y}),b=scene.game.canvas.getBoundingClientRect(),size=scene.viewportSize();return {x:b.x+p.x*b.width/size.width,y:b.y+p.y*b.height/size.height};},{x,y});}
 async function drag(x,y,tx,ty){const a=await point(x,y),b=await point(tx,ty);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();await pause();}
 async function inRoom(c){await page.waitForFunction(({k,c})=>document.querySelector('#app').dataset.view==='room'&&JSON.parse(localStorage.getItem(k)||'{}').field?.active===c,{k:KEY,c},{timeout:60000});await pause(600);}
 // 「시작」 goes straight into the first zone; close a guide dialog if one opens first.
 async function begin(){await click('[data-action=start]');for(let i=0;i<10;i++){if(await page.evaluate(k=>document.querySelector('#app').dataset.view==='room'&&JSON.parse(localStorage.getItem(k)||'{}').field?.active===0,KEY))break;if(await page.locator('dialog[open]').count())await page.keyboard.press('Escape');else if(await page.locator('#next').isVisible())await page.locator('#next').click();await pause(600);}await inRoom(0);}
 async function checkpoint(c){await writeFile(path.join(out,`checkpoint-${c}.json`),JSON.stringify(await state()));}
 async function finished(c){
  await page.locator('dialog[open] [data-action=reward-continue]').waitFor({timeout:20000});
  assert.deepEqual((await state()).field.completed,Array.from({length:c+1},(_,i)=>i));await snap('reward-'+c);checks.push('chapter-'+c);console.log('PASS chapter',c);
 }
 async function concept(c){
  await click('dialog[open] [data-action=reward-concept]');await page.locator('#concept-video').waitFor();
  await page.waitForFunction(()=>document.querySelector('#concept-video').readyState>=2,null,{timeout:20000});
  assert.equal(await page.locator('#concept-caption').isVisible(),true);await snap('concept-'+c);
  // While the film plays full screen only its ✕ is reachable; 「숲으로 돌아가기」 waits under it.
  await click('dialog[open].concept-dialog [data-action=close] >> visible=true');await page.locator('dialog.concept-dialog[open]').waitFor({state:'detached'}).catch(()=>{});
  assert.equal(await page.locator('dialog.concept-dialog[open]').count(),0);checks.push('concept-'+c);
 }
 // Walk to the finished zone's door, hit its villain three times, keep the card, then walk into the next zone.
 async function nextZone(c){
  const id=VILLAINS[c],hits=()=>page.evaluate(({k,id})=>JSON.parse(localStorage.getItem(k)).mapEncounters?.[id]||0,{k:KEY,id});
  await page.locator('#app[data-view=map]').waitFor();await pause(800);
  const attack=page.locator('[data-map-attack-dock]:not([hidden])');
  // Zone 1 opens without a walk, so the hero may stand far away. Walking to the finished door
  // goes inside; coming back out leaves the hero beside that door's villain.
  if(!await attack.count()){
   await page.locator(`#map-doors [data-chapter="${c}"]`).click();await inRoom(c);
   await click('[data-action=back]');await page.locator('#app[data-view=map]').waitFor();await pause(1200);
  }
  for(let i=0;i<200&&await hits()<3;i++){
   if(await attack.count()){if(input==='keyboard'){await attack.focus();await attack.press('Enter');}else await attack.click();await pause(450);}else await pause(150);
  }
  assert.equal(await hits(),3,'villain '+id);checks.push('villain-'+id);
  // The ready button bobs forever, so tap its centre (or press Enter) instead of waiting for it to hold still.
  const take=page.locator('.rc-take.is-ready');await take.waitFor({state:'visible',timeout:20000});
  if(input==='keyboard'){await take.focus();await take.press('Enter');}else{const r=await take.boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height/2);}
  await take.waitFor({state:'detached',timeout:10000});await pause(800);
  for(let i=0;i<15&&!/따라가는/.test(await nextText())&&await page.locator('#app').getAttribute('data-view')==='map';i++){await page.locator('#next').click();await pause(600);}
  await inRoom(c+1);await checkpoint(c+1);
 }

 try{
  if(start){const fixture=JSON.parse(await readFile(path.join(out,`checkpoint-${start}.json`),'utf8'));await page.addInitScript(({k,value})=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,JSON.stringify(value));sessionStorage.setItem('seeded','1');}},{k:KEY,value:fixture});}
  await page.goto(process.env.BASE_URL||defaultUrl);await page.locator('.boot').waitFor({state:'detached'});
  if(start===0){await begin();await checkpoint(0);}else await inRoom(start);

  if(start===0){ // 나비의 숲: 네 모습 확대 관찰 → 관찰 글 → 순서 → 다음 세대
   assert.equal(await objective(),'나비 그림의 ‘보기’를 눌러 확대해 봐. 돋보기를 끌어도 돼.');
   if(input==='pointer'){
    // The magnifier: drop it on the larva's body segment (POSITIONS.larva + FORM_SPOTS.larva[0]) to open that view.
    await drag(640,350,980+(.36-.5)*204,284+(.43-.5)*204);await target('본 특징 기록하기');checks.push('magnifier-drop-opens-view');
    await press('알 관찰');
   }else await press('알 확대해서 보기');
   await press('모양 보기');
   for(const form of ['애벌레','번데기','어른벌레'])await press(form+' 관찰');
   await press('더듬이 보기');await press('애벌레와 어른벌레 비교');await press('확대 관찰로 돌아가기');await snap('01-observation-view');
   await press('관찰 글 쓰기');const seen=(await field(0)).inspected;
   assert.deepEqual([seen.egg,seen.adult].map(a=>[...a].sort()),[[0,1],[0,1]]);assert.ok(['larva','pupa'].every(f=>seen[f].length));checks.push('four-forms-observed');
   await page.locator('#observation-note').fill('애벌레 몸에는 여러 마디와 작은 다리가 보여.');await page.locator('#observation-note').press('Enter');await pause(600);
   assert.equal((await field(0)).note,'애벌레 몸에는 여러 마디와 작은 다리가 보여.');checks.push('observation-note');
   await waitObjective('흩어진 사진을 자라는 순서로 이어 줘.');
   const forms=['egg','larva','pupa','adult'],names={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'},slots=['첫 번째 자리','두 번째 자리','세 번째 자리','네 번째 자리'];
   for(let to=0;to<4;to++){if((await field(0)).order[to]===forms[to])continue;await press(names[forms[to]]+' 사진 옮기기');await press(slots[to]);await pause(400);}
   assert.deepEqual((await field(0)).order,forms);checks.push('film-order');
   await waitObjective('어른벌레가 낳은 알로 다음 세대를 이어 줘.');await snap('02-generation');
   await press('새 알을 고른 뒤 오른쪽 잎 자리 누르기');await press('다음 세대의 새 알을 놓을 자리');
   await finished(0);await concept(0);await nextZone(0);
  }
  if(start<=1){ // 씨앗 연구소: 물, 온도 두 번의 조건 비교
   for(let round=0;round<2;round++){
    const q=await field(1);if(!['a','b'].every(k=>q.rounds[round].prepared[k].soil&&q.rounds[round].prepared[k].seeds===3))for(let n=0;n<2;n++)await press('같은 흙과 콩 세 알 넣기',0);
    if(!round){
     await press('B만');assert.equal(await page.locator('#next').isVisible(),false);assert.equal((await field(1)).rounds[0].run,null);checks.push('prediction-alone-does-not-start');
     await press(/^① /);assert.equal(await nextText(),'비교 실험 시작');await click('#next');
    }else await press(/^① /);
    await waitObjective('노트에 남은 사진을 비교해 보자.');await snap('03-seed-'+round);
    const tags=['물을 다르게 했어 꼬리표 옮기기','온도를 다르게 했어 꼬리표 옮기기'];
    await press(tags[1-round]);await press('화분 B에 꼬리표 붙이기');
    assert.equal((await field(1)).rounds[round].reason,'');checks.push('wrong-seed-reason-blocked-'+round);
    await press(tags[round]);await press('화분 B에 꼬리표 붙이기');
    assert.equal((await field(1)).rounds[round].reason,round?'warm':'water');
    if(!round){await page.locator('#next',{hasText:'다른 씨앗 돕기'}).waitFor();await click('#next');}
   }
   await finished(1);await concept(1);await nextZone(1);
  }
  if(start<=2){ // 햇살 온실: 물·빛을 재고 원인에 맞게 돌보기, 두 화분
   const cases=[['알맞게 물 주기','빛이 드는 곳으로','축 처졌던 잎이 다시 섰어','잎의 수가 더 많아졌어'],['빛이 드는 곳으로','알맞게 물 주기','새로 자란 잎이 더 초록빛이야','길어진 줄기가 짧아졌어']];
   for(let n=0;n<2;n++){
    const [tool,wrongTool,change,wrongChange]=cases[n];
    await press(/물기·빛.*재기$/);await press(/^② 잎/);
    await press(wrongTool);assert.equal((await field(2)).cases[n].tool,'');checks.push('wrong-care-blocked-'+n);
    await press(tool);await waitObjective('돌보기 전과 나중 모습을 비교해 봐. 무엇이 달라졌니?');await snap('04-care-'+n);
    await press(wrongChange);assert.equal((await field(2)).cases[n].comparison,'');checks.push('wrong-comparison-blocked-'+n);
    await press(change);
    // The second pot may open by itself; press 「다른 화분 조사」 only while it is offered.
    if(!n){await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).field.chapters[2].case===1||/다른 화분 조사/.test(document.querySelector('#next')?.innerText||''),KEY,{timeout:15000});
     if((await field(2)).case!==1&&await page.locator('#next',{hasText:'다른 화분 조사'}).isVisible())await click('#next');
     await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).field.chapters[2].case===1,KEY);await pause(600);}
   }
   await finished(2);await concept(2);await nextZone(2);
  }
  if(start<=3){ // 사계절 정원: 동물의 다음 세대, 이름표로 겨울·다음 봄 추적, 한해살이·여러해살이
   await waitObjective('부모와 새로 태어난 생명은 같은 몸일까?');
   await press('다음 세대: 부모와 같은 몸');assert.equal((await field(3)).generation,'');checks.push('wrong-generation-blocked');
   await press('다음 세대: 부모와 다른 생명');
   await waitObjective('두 식물에 이름표를 달아 첫봄 모습을 기록해 줘.');
   await press('A-01 이름표 옮기기');await press('사과나무 이름표');await press('B-01 이름표 옮기기');await press('봉선화 이름표');
   await waitObjective('이름표 줄을 보고 작년 그 식물인지, 새로 자란 식물인지 골라 줘.');await snap('05-seasons');
   await press('사과나무: 새로 자란 식물');assert.deepEqual((await field(3)).classifications,{});checks.push('wrong-identity-blocked');
   await press('사과나무: 작년 그 식물');await press('봉선화: 새로 자란 식물');
   await waitObjective('식물 카드를 한해살이와 여러해살이로 나눠 봐.');
   const many='여러해살이 · 여러 해 동안 살아 상자',once='한해살이 · 한 해 살고 씨앗을 남겨 상자';
   await press('장미 카드 옮기기');await press(once);assert.deepEqual((await field(3)).transfers,{});checks.push('wrong-transfer-blocked');
   for(const [card,box] of [['장미',many],['콩',once],['해바라기',once]]){await press(card+' 카드 옮기기');await press(box);}
   await finished(3);await concept(3);await nextZone(3);
  }
  // 생명 시계탑: 쪽지마다 맞는 증거 사진 → 발견과 관찰 약속 → 시계 돌리기
  await waitObjective('쪽지를 읽고 네가 직접 찾은 증거 사진을 골라 줘.');
  await press('물 조건 비교 실험 증거로 선택');assert.deepEqual((await field(4)).records,[]);checks.push('wrong-evidence-blocked');
  for(const pattern of [/확대 관찰 증거로 선택$/,/조건 비교 실험 증거로 선택$/,/돌봄 기록 증거로 선택$/,/^이름표를 단 .*증거로 선택$/])await press(pattern);
  assert.equal((await field(4)).records.length,4);await snap('06-evidence');
  await page.locator('#next',{hasText:'연구 노트 쓰기'}).waitFor();await click('#next');
  await click('[data-action=save-story]');assert.equal(await page.locator('dialog[open] #story-title').isVisible(),true);assert.equal((await field(4)).title,'');checks.push('empty-note-blocked');
  const summary='나는 이제 관찰 사진을 근거로 나비의 모습 변화와 식물에 필요한 물과 빛을 설명할 수 있어.';
  for(const [id,text] of [['story-title','작은 생명들의 서로 다른 시간'],['story-summary',summary],['plan-subject','학교 화단의 봉선화'],['plan-when','매주 월요일과 목요일'],['plan-what','잎 수와 줄기 모양을 보고 글과 그림으로 남기기']])await page.locator('#'+id).fill(text);
  await click('[data-action=save-story]');
  await page.locator('#next',{hasText:'시계 돌리기'}).waitFor();await snap('07-tower-run');await click('#next');
  // The last zone has no reward card: the ending film starts straight after the clock turns.
  await page.waitForFunction(k=>JSON.parse(localStorage.getItem(k)).field.completed.length===5,KEY,{timeout:20000});checks.push('chapter-4');console.log('PASS chapter',4);
  await page.locator('[data-cinema-skip]').waitFor({state:'visible',timeout:20000});await snap('08-final-film');checks.push('final-film');
  await page.locator('[data-cinema-skip]').click();
  if(await page.locator('[data-cinema-finish]:visible').count())await page.locator('[data-cinema-finish]:visible').first().click();
  await page.locator('dialog[open].ending-dialog, dialog.ending-dialog[open]').waitFor({timeout:20000});
  assert.ok((await page.locator('dialog[open]').innerText()).includes(summary));await snap('08-ending');checks.push('ending');
  await click('dialog[open] [data-action=export]');await page.waitForFunction(()=>/인쇄 창을 열었어/.test(document.querySelector('#status')?.innerText||''),null,{timeout:15000});checks.push('notebook-print');
  await click('dialog[open] [data-action=certificate]');await snap('09-certificate');
  const pending=page.waitForEvent('download');await click('dialog[open] [data-action=certificate-png]');await(await pending).saveAs(path.join(out,'certificate.png'));checks.push('certificate-PNG');
  await click('dialog[open] [data-action=close] >> visible=true');
  const saved=await state();await writeFile(path.join(out,'earned-state.json'),JSON.stringify(saved,null,2));
  await page.reload();await page.locator('.boot').waitFor({state:'detached'});assert.deepEqual((await state()).field,saved.field);checks.push('complete-reload');
  assert.deepEqual(errors,[]);
  await writeFile(path.join(out,'result.json'),JSON.stringify({input,checks,errors,completed:saved.field.completed,mapEncounters:saved.mapEncounters},null,2));console.log(JSON.stringify({input,checks,errors}));
 }catch(e){
  await page.screenshot({path:path.join(out,'FAILURE.png')}).catch(()=>{});
  const goal=await page.locator('#objective').innerText().catch(()=>''),targets=await page.locator('#focus-targets button').evaluateAll(b=>b.map(x=>x.getAttribute('aria-label'))).catch(()=>[]);
  await writeFile(path.join(out,'failure.json'),JSON.stringify({error:e.stack,objective:goal,targets,errors,checks,state:await state().catch(()=>null)},null,2));
  console.error('FAIL',e.message,goal);process.exitCode=1;
 }finally{await browser.close();}
}
