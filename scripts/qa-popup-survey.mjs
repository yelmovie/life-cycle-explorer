import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {initialField} from '../src/field-model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'.tmp/popup-survey');await mkdir(out,{recursive:true});process.env.TEMP=out;process.env.TMP=out;
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),earned=JSON.parse(await readFile(path.join(root,'.tmp/field-play/earned-state.json'),'utf8')),results=[],errors=[],base=process.env.BASE_URL||'http://127.0.0.1:4186';
const click=async(p,s)=>p.locator(s).click();
const cases=[
 ['opening',s=>s.fieldView='title',async p=>click(p,'[data-action=start]')],
 ['locked-door',s=>{s.field=initialField();s.fieldView='map';},async p=>click(p,'[data-action=door][data-chapter="2"]')],
 ['note',s=>{s.field.active=0;s.field.chapters[0].note='';},async p=>click(p,'[data-field-action=note]')],
 ['prediction',s=>{s.field.active=1;s.field.chapters[1].round=0;s.field.chapters[1].rounds[0].run=null;},async p=>click(p,'[data-field-action=prediction]')],
 ['story-info',s=>{s.field.active=4;s.field.chapters[4].title='';},async p=>click(p,'[data-field-action=story-info]')],
 ['caption',s=>{s.field.active=4;s.field.chapters[4].title='';},async p=>click(p,'[data-field-action=story-caption]')],
 ['plan',s=>{s.field.active=4;s.field.chapters[4].plan.subject='';},async p=>click(p,'#next')],
 ['compare',s=>{s.field.active=2;s.field.chapters[2].case=0;s.field.chapters[2].cases[0].photos=[0];},async p=>click(p,'[data-action=care-compare]')],
 ['records',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'summary:text-is("앱 정보 · 배움과 보상")');await click(p,'[data-action=records]');}],
 ['record-detail',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'summary:text-is("앱 정보 · 배움과 보상")');await click(p,'[data-action=records]');await click(p,'[data-action=record][data-id="field-observation-egg"]');await p.locator('.story-image').waitFor();}],
 ['bag',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'summary:text-is("앱 정보 · 배움과 보상")');await click(p,'[data-action=bag]');}],
 ['story',s=>{s.field.active=4;s.field.chapters[4].plan.subject='';},async p=>click(p,'[data-field-action=story-play]')],
 ['ending',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'[data-action=ending]');}],
 ['certificate',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'[data-action=certificate]');}],
 ['reset',()=>{},async p=>{await click(p,'[data-action=settings]');await click(p,'[data-action=reset]');}],
];
try{
 for(const [width,height]of [[1024,600],[1024,768],[1920,1080]])for(const[name,prepare,trigger]of cases){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),s=structuredClone(earned);s.fieldView='room';prepare(s);await p.addInitScript(s=>localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(s)),s);p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.locator('.boot').waitFor({state:'detached'});await trigger(p);await p.locator('dialog[open]').waitFor();
  await p.locator('dialog').evaluate(async d=>{await Promise.all(d.getAnimations().map(a=>a.finished.catch(()=>{})));});
  const layout=await p.locator('dialog').evaluate(d=>{const r=d.getBoundingClientRect(),b=d.querySelector('.modal-body'),a=d.querySelector('.dialog-actions');return {outside:r.left<0||r.top<0||r.right>innerWidth+1||r.bottom>innerHeight+1,center:Math.abs((r.top+r.bottom)/2-innerHeight/2),horizontalScroll:b.scrollWidth-b.clientWidth,bodyScroll:b.scrollHeight-b.clientHeight,footerVisible:a.getBoundingClientRect().bottom<=innerHeight,minButton:Math.min(...[...d.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>b.getBoundingClientRect().height))};});
  await p.screenshot({path:path.join(out,`${name}-${width}-${height}.png`)});assert.equal(layout.outside,false,name);assert.ok(layout.center<2,name+' centered');assert.ok(layout.horizontalScroll<3,name);assert.ok(layout.minButton>=47,name);assert.equal(layout.footerVisible,true,name);results.push({name,width,height,...layout});
  if(name==='compare'){await p.locator('#care-wipe').fill('80');assert.match(await p.locator('#care-before-image').getAttribute('style'),/20%/);}
  if(name==='story'){await click(p,'[data-action=story-auto]');assert.equal(await p.locator('[data-action=story-auto]').innerText(),'넘김 멈춤');await click(p,'[data-action=story-next]');assert.equal(await p.locator('[data-action=story-auto]').innerText(),'자동 넘김');}
  await p.close();await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({popups:cases.length,profiles:3,screens:results.length,errors}));
}catch(e){process.exitCode=1;console.error(e.stack);}finally{await writeFile(path.join(out,'result.json'),JSON.stringify({results,errors},null,2));await browser.close();}
