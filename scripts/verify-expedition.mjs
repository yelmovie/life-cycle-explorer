// Optional integration check. Uses an existing Playwright installation and Chrome;
// every localStorage operation belongs to a fresh, isolated browser context.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {preparedState} from '../tests/inquiry-fixture.js';
import * as G from '../game-model.js';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=new URL('../docs/reviews/expedition-20261018/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
let page=await context.newPage();const errors=[],warnings=[],failures=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));
p.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
p.on('response',r=>{if(r.status()>=400)failures.push({url:r.url(),status:r.status()});});}
watch(page);
const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),G.GAME_KEY);
async function shot(name){await page.screenshot({path:fileURLToPath(new URL(name+'.png',output))});}
async function settled(){await page.waitForSelector('canvas');await page.waitForFunction(()=>!document.querySelector('.boot'));await page.waitForTimeout(180);const box=await page.locator('canvas').boundingBox();assert.ok(box.width>0&&box.height>0,'Canvas must be visible');}
async function tabletViews(name){await shot(name);await page.setViewportSize({width:1024,height:768});await settled();await shot(name+'-1024');assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1280,height:800});await settled();}
async function closeModal(){if(await page.locator('#modal').evaluate(d=>d.open))await page.locator('#modal [data-action="close"]').first().click();}
async function next(){await closeModal();await page.locator('#next').click();await settled();}
async function point(x,y){const b=await page.locator('canvas').boundingBox();return {x:b.x+x*b.width/1280,y:b.y+y*b.height/((await state()).screen==='map'?800:610)};}
async function drag(x,y,tx,ty){const a=await point(x,y),b=await point(tx,ty);await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:15});await page.mouse.up();await settled();}
async function clickCanvas(x,y){const p=await point(x,y);await page.mouse.click(p.x,p.y);await settled();}
async function dial(x,y,value,max){const angle=(value===max?.96:value/max)*Math.PI*2-Math.PI/2;await drag(x,y-60,x+Math.cos(angle)*65,y+Math.sin(angle)*65);}
async function toQuest(c){
  for(let tries=0;tries<12;tries++){if((await state()).expedition.active===c)return;await next();}
  throw Error('Could not reach quest '+c);
}
try{
  await page.goto(process.env.QA_URL||'http://127.0.0.1:4194/');await settled();await closeModal();
  const navigation=await page.evaluate(()=>{const nav=performance.getEntriesByType('navigation')[0],resources=performance.getEntriesByType('resource');return {domContentLoadedMs:nav.domContentLoadedEventEnd,loadEventMs:nav.loadEventEnd,requests:resources.length,transferredBytes:resources.reduce((n,r)=>n+r.transferSize,0)};});
  for(const [width,height] of [[1280,800],[1024,768],[1920,1080],[915,412]]){
    await page.setViewportSize({width,height});await settled();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight||document.documentElement.scrollWidth>innerWidth),false);
    await shot(`map-${width}x${height}`);
  }
  await page.setViewportSize({width:1280,height:800});
  // Existing inquiry records are a fixture. The five new commissions below are
  // performed through real pointer/keyboard input, not by changing app internals.
  const fixture=preparedState(0);fixture.screen='mission';fixture.mission=1;fixture.phase[1]=1;fixture.settings.reducedMotion=true;fixture.expedition=G.initialExpedition();
  const play=await browser.newContext({viewport:{width:1280,height:800}});
  await play.addInitScript(({key,fixture})=>{if(!sessionStorage.getItem('qa-seeded')){localStorage.setItem(key,JSON.stringify(fixture));sessionStorage.setItem('qa-seeded','1');}},{key:G.GAME_KEY,fixture});
  await context.close();page=await play.newPage();watch(page);
  await page.goto(process.env.QA_URL||'http://127.0.0.1:4194/');await settled();await next();assert.equal((await state()).expedition.active,0);await tabletViews('quest-butterfly');
  await drag(320,480,320,240);assert.equal(Object.keys((await state()).expedition.clues).length,0);
  await drag(320,480,580,240);assert.equal((await state()).expedition.clues.leaf,'larva');
  await page.reload();await settled();assert.equal((await state()).expedition.active,0);assert.equal((await state()).expedition.clues.leaf,'larva');
  await drag(580,480,840,240);await drag(840,480,1100,240);await drag(1100,480,320,240);
  assert.ok(G.questSolved(await state(),0));await shot('reward-ready');await next();await shot('reward-earned');await closeModal();
  assert.equal(G.restoredChapters(await state()),1);
  await toQuest(1);await tabletViews('quest-seed-start');
  await drag(760,535,850,285);await next();assert.equal((await state()).expedition.seeds[0].running,false);
  await drag(760,535,850,285);await drag(520,535,850,285);await next();assert.equal((await state()).expedition.seeds[0].running,true);
  await next();assert.equal((await state()).expedition.seeds[0].recorded,false);
  await dial(1135,335,7,7);assert.equal((await state()).expedition.seeds[0].day,7);await shot('quest-seed-comparison');await next();
  await drag(760,535,850,285);await next();await dial(1135,335,7,7);await next();assert.ok(G.questSolved(await state(),1));await next();
  await toQuest(2);await tabletViews('quest-care-start');
  await drag(955,200,650,285);assert.equal((await state()).expedition.care[0].tool,null);
  for(const [index,toolY] of [[0,200],[1,390]]){
    await drag(325,220,650,285);await drag(325,410,650,285);
    if(index===0){await drag(955,390,650,285);assert.equal((await state()).expedition.care[0].tool,null);}
    await drag(955,toolY,650,285);await dial(1130,355,2,2);
    if(index===0){await page.reload();await settled();assert.equal((await state()).expedition.care[0].day,2);await shot('quest-care-recovery');}
    await clickCanvas(650,285);
  }
  assert.ok(G.questSolved(await state(),2));await next();await toQuest(3);await tabletViews('quest-garden');
  await drag(1055,180,1055,440);assert.equal((await state()).expedition.garden.rose,undefined);
  await drag(345,180,345,440);await drag(700,180,700,440);await drag(1055,180,700,440);
  assert.ok(G.questSolved(await state(),3));await next();await toQuest(4);await tabletViews('quest-final');
  let recordPage=0;
  for(const [i,problem] of G.FINAL_CASES.entries()){
    const bank=G.questRecords(await state()),at=bank.findIndex(problem.accept),wantedPage=Math.floor(at/3);
    while(recordPage<wantedPage){await page.locator('[data-action="quest-page"][data-value="1"]').click();recordPage++;await settled();}
    await drag(345+(at%3)*355,450,345+i*355,205);
  }
  assert.ok(G.questSolved(await state(),4));await next();assert.equal(G.restoredChapters(await state()),5);
  await page.locator('#modal [data-action="certificate"]').click();await shot('certificate');await closeModal();
  const final=await state();await page.reload();await settled();assert.equal(G.restoredChapters(await state()),5);
  await page.locator('#help').click();await page.locator('[data-action="revisit"]').click();await page.locator('[data-action="visit"][data-value="8"]').click();await settled();
  await page.locator('[data-action="export"]').click();await page.waitForSelector('#export-preview');
  await page.waitForFunction(()=>document.querySelector('#export-preview')?.naturalWidth>0);
  const png=await page.locator('#export-preview').evaluate(im=>({width:im.naturalWidth,height:im.naturalHeight}));assert.equal(png.width,1800);await shot('story-png');await closeModal();
  await page.locator('#map').click();await page.locator('#bag').click();assert.equal(await page.locator('.bag-item.earned').count(),5);await shot('tool-bag');await closeModal();
  await page.locator('#help').click();await page.locator('[data-action="reset-confirm"]').click();await page.locator('[data-action="reset"]').click();assert.equal((await state()).completed.length,0);assert.equal(G.restoredChapters(await state()),0);
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  const result={fixture:'Existing inquiry performance injected; all five new commissions used real UI inputs.',navigation,png,completed:final.completed,restoredChapters:G.restoredChapters(final),errors,warnings,failures,reset:'passed',reload:'passed'};
  await writeFile(new URL('browser-results.json',output),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}catch(error){await shot('failure').catch(()=>{});await writeFile(new URL('browser-failure.json',output),JSON.stringify({error:error.message,errors,failures,state:await state().catch(()=>null),body:await page.locator('body').innerText().catch(()=>null)},null,2));throw error;}finally{await browser.close();}
