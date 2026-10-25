import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.tmp/recovery-storage');
await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),base=process.env.BASE_URL||'http://127.0.0.1:4186';
const earned=JSON.parse(await readFile(path.join(root,'.tmp/recovery-play/earned-state.json'),'utf8'));
const fixture=structuredClone(earned);fixture.audio={bgm:false,sfx:false,volume:.2};fixture.settings.reducedMotion=true;fixture.fieldView='room';fixture.field.active=4;
const fixtureRaw=JSON.stringify(fixture),results=[],errors=[];
async function open(raw,mode='normal'){
 const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,acceptDownloads:true}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(({raw,mode})=>{
  const key='life-clock-lab.phaser.4',saved=window.localStorage,read=Storage.prototype.getItem,write=Storage.prototype.setItem;
  if(!sessionStorage.getItem('qa-storage-seeded')){write.call(saved,key,raw);sessionStorage.setItem('qa-storage-seeded','1');}
  window.__qaReadRaw=()=>read.call(saved,key);window.__qaWriteRaw=value=>write.call(saved,key,value);
  if(mode==='quota')Storage.prototype.setItem=function(k,value){if(this===saved&&k===key)throw new DOMException('Test quota exhausted','QuotaExceededError');return write.call(this,k,value);};
  if(mode==='read-failed')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Test storage inaccessible','SecurityError');}});
 },{raw,mode});
 await page.goto(base);await page.locator('canvas').waitFor({state:'visible'});await page.locator('.boot').waitFor({state:'detached'});await page.waitForTimeout(250);
 return {context,page};
}
const read=page=>page.evaluate(()=>window.__qaReadRaw());
const tap=async(page,selector)=>{await page.locator(selector).tap();await page.waitForTimeout(80);};
async function settings(page){if(await page.locator('dialog[open]').count())await tap(page,'dialog .close');await tap(page,'#app [data-action=settings]');}
async function teacherTools(page){await tap(page,'summary:text-is("교사용 가이드")');await tap(page,'summary:text-is("교사용 도구")');}
async function records(page){await settings(page);await tap(page,'summary:text-is("앱 정보 · 배움과 보상")');await tap(page,'[data-action=records]');}
async function download(page,selector,file){const pending=page.waitForEvent('download');await tap(page,selector);const d=await pending;await d.saveAs(path.join(out,file));return {text:await readFile(path.join(out,file),'utf8'),suggested:d.suggestedFilename()};}
async function snap(page,name){await page.waitForTimeout(400);await page.screenshot({path:path.join(out,name+'.png')});}
try{
 const future=structuredClone(fixture);future.version=999;
 for(const [name,raw]of [['invalid-json','{broken'],['null','null'],['future-version',JSON.stringify(future)]]){
  const {context,page}=await open(raw);
  assert.equal(await page.locator('#dialog-title').innerText(),'저장된 기록을 보호하고 있어');
  await tap(page,'dialog [data-action=records]');
  assert.match(await page.locator('.modal-body').innerText(),/진행 파일 가져오기 기능이 없어/);
  assert.match(await page.locator('.modal-body').innerText(),/복구 성공을 뜻하지는 않아/);
  const saved=await download(page,'[data-action=original-backup]',name+'-original.txt');
  assert.equal(saved.text,raw);assert.match(saved.suggested,/\.txt$/);
  const current=await download(page,'[data-action=backup]',name+'-temporary.json');assert.equal(JSON.parse(current.text).version,3);
  await snap(page,name+'-protected-archive');await tap(page,'dialog .close');
  await tap(page,'[data-action=start]');await tap(page,'[data-action=begin]');
  await tap(page,'[data-action=sound]');assert.equal(await read(page),raw);
  await page.reload();await page.locator('canvas').waitFor({state:'visible'});await page.locator('#dialog-title').filter({hasText:'저장된 기록을 보호하고 있어'}).waitFor();
  assert.equal(await read(page),raw);
  results.push({check:name+'-raw-download-temporary-activity-reload',preserved:true,downloadExtension:'.txt'});
  if(name==='invalid-json'){
   await settings(page);await tap(page,'[data-action=reset]');assert.equal(await read(page),raw);
   await tap(page,'[data-action=reset-confirm]');const next=JSON.parse(await read(page));assert.equal(next.version,3);assert.deepEqual(next.field.completed,[]);
   await page.reload();await page.locator('canvas').waitFor({state:'visible'});await page.waitForTimeout(200);
   assert.equal(await page.locator('dialog[open]').count(),0);await snap(page,'explicit-reset-after-invalid');results.push({check:'explicit-reset-unchanged-invalid-source',reset:true});
  }
  await context.close();
 }

 {
  const {context,page}=await open(fixtureRaw);await settings(page);await tap(page,'[data-action=reset]');
  const other=structuredClone(fixture);other.field.chapters[4].title='다른 창에서 새로 쓴 생명 기록';const otherRaw=JSON.stringify(other);
  await page.evaluate(raw=>window.__qaWriteRaw(raw),otherRaw);await tap(page,'[data-action=reset-confirm]');
  assert.equal(await page.locator('#dialog-title').innerText(),'기록을 지우지 않았어');assert.equal(await read(page),otherRaw);
  await snap(page,'reset-conflict-protected');await tap(page,'dialog [data-action=records]');
  const original=await download(page,'[data-action=original-backup]','conflict-original.txt');assert.equal(original.text,otherRaw);
  results.push({check:'reset-confirm-refuses-changed-source',preserved:true});await context.close();
 }

 for(const mode of ['quota','read-failed']){
  const {context,page}=await open(fixtureRaw,mode);
  if(mode==='read-failed'){
   assert.equal(await page.locator('#dialog-title').innerText(),'저장된 기록을 보호하고 있어');await tap(page,'dialog .primary[data-action=close]');
   await tap(page,'[data-action=start]');await tap(page,'[data-action=begin]');
  }else await tap(page,'[data-action=home]');
  assert.match(await page.locator('#status').innerText(),/저장하지 못했어/);
  assert.doesNotMatch(await page.locator('#status').innerText(),/저장했어|저장 완료/);
  assert.equal(await read(page),fixtureRaw);await records(page);
  const current=await download(page,'[data-action=backup]',mode+'-temporary.json');assert.equal(JSON.parse(current.text).version,3);
  if(mode==='quota'){const original=await download(page,'[data-action=original-backup]',mode+'-original.txt');assert.equal(original.text,fixtureRaw);}
  else assert.equal(await page.locator('[data-action=original-backup]').count(),0);
  await settings(page);await tap(page,'[data-action=reset]');await tap(page,'[data-action=reset-confirm]');
  assert.equal(await page.locator('#dialog-title').innerText(),'기록을 지우지 않았어');assert.equal(await read(page),fixtureRaw);
  await snap(page,mode+'-reset-protected');results.push({check:mode+'-preserves-source-no-save-success',preserved:true});await context.close();
 }

 {
  const {context,page}=await open(fixtureRaw);await settings(page);await teacherTools(page);await tap(page,'[data-action=teacher-preview]');
  assert.equal(await read(page),fixtureRaw);await tap(page,'[data-action=door][data-chapter="4"]');await page.locator('[data-preview-phase]').waitFor();await page.locator('[data-preview-phase]').selectOption('story-pick');await page.locator('.boot').waitFor({state:'detached'});
  const box=await page.locator('canvas').boundingBox();await page.touchscreen.tap(box.x+380*box.width/1280,box.y+638*box.height/800);await page.waitForTimeout(120);
  assert.equal(await read(page),fixtureRaw);
  await settings(page);await tap(page,'[data-action=reset]');await tap(page,'[data-action=reset-confirm]');assert.equal(await read(page),fixtureRaw);
  await settings(page);await teacherTools(page);await tap(page,'[data-action=teacher-preview]');
  const restored=JSON.parse(await read(page));assert.deepEqual(restored.field,fixture.field);assert.deepEqual(restored.field.completed,fixture.field.completed);
  assert.equal(restored.field.preview,undefined);await snap(page,'teacher-preview-original-preserved');
  results.push({check:'teacher-preview-actions-and-reset-preserve-original-field',preserved:true});await context.close();
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(out,'result.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({checks:results.length,results,errors}));
}catch(error){await writeFile(path.join(out,'failure.json'),JSON.stringify({error:error.stack,results,errors},null,2));console.error(error.stack);process.exitCode=1;}finally{await browser.close();}
