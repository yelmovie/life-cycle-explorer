import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=path.resolve(process.env.QA_OUTPUT||'.tmp/observation-views');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--mute-audio','--disable-breakpad','--disk-cache-dir='+out]});
const base=process.env.BASE_URL||'http://127.0.0.1:4186';
const key='life-clock-lab.phaser.4';
const objectives=['돋보기로 네 모습을 원하는 순서로 살펴봐.','위쪽 이름을 눌러 한 모습씩 더 크게 살펴봐.','흩어진 사진을 자라는 순서로 이어 줘.'];
try{
 for(const [width,height,touch] of [[1280,800,false],[873,580,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,bypassCSP:true});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   let library;
   Object.defineProperty(window,'Phaser',{configurable:true,get:()=>library,set(value){
    library=value;
    const Game=value.Game;
    value.Game=class extends Game{constructor(...args){super(...args);window.__qaGame=this;}};
   }});
  });
  const button=name=>page.locator('#focus-targets').getByRole('button',{name,exact:true});
  const tap=name=>touch?button(name).tap():button(name).click();
  const waitObjective=text=>page.waitForFunction(text=>document.querySelector('#objective').textContent===text,text);
  const state=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).field.chapters[0],key);
  const shot=name=>page.screenshot({path:path.join(out,width+'-'+name+'.png')});
  const position=([x,y])=>page.evaluate(({x,y})=>{
   const scene=window.__qaGame.scene.getScene('field-world'),projected=scene.projectWorld({x,y});
   const bounds=scene.game.canvas.getBoundingClientRect(),size=scene.viewportSize();
   return {x:bounds.x+projected.x*bounds.width/size.width,y:bounds.y+projected.y*bounds.height/size.height};
  },{x,y});
  const lensSpecimens=depth=>page.evaluate(depth=>window.__qaGame.scene.getScene('field-world').children.list
   .filter(object=>object.type==='Image'&&object.mask&&object.depth===depth).map(object=>object.texture.key),depth);
  const client=touch?await context.newCDPSession(page):null;
  const drag=async(from,to,form)=>{
   const start=await position(from),end=await position(to);
   if(client){
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[start]});
    for(let i=1;i<=12;i++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start.x+(end.x-start.x)*i/12,y:start.y+(end.y-start.y)*i/12}]});
   }else{
    await page.mouse.move(start.x,start.y);
    await page.mouse.down();
    await page.mouse.move(end.x,end.y,{steps:12});
   }
   await page.waitForFunction(({form})=>window.__qaGame.scene.getScene('field-world').children.list.some(object=>object.mask&&object.depth===41&&object.texture?.key===form),{form});
   assert.deepEqual(await lensSpecimens(41),[form]);
   if(client)await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   else await page.mouse.up();
  };
  await page.goto(base);
  await page.locator('[data-action=start]').click();
  await page.locator('[data-cinema-skip]').click();
  await page.locator('[data-cinema-finish]').click();
  await page.locator('[data-action=begin]').click();
  await page.locator('#app[data-view=map][data-field-ready=true] #next').click();
  await waitObjective(objectives[0]);
  await button('알에 돋보기 대기').waitFor();
  await shot('lens');
  await drag([640,350],[951,270],'larva');
  assert.deepEqual((await state()).explored,['larva']);
  assert.equal(await button('알 관찰').count(),0);
  await drag([951,270],[980,564],'adult');
  assert.deepEqual((await state()).explored,['larva','adult']);
  assert.equal(await button('알 관찰').count(),0);
  await tap('번데기에 돋보기 대기');
  assert.deepEqual((await state()).explored,['larva','adult','pupa']);
  assert.equal(await button('알 관찰').count(),0);
  await tap('알에 돋보기 대기');
  await waitObjective(objectives[1]);
  await button('알 관찰').waitFor();
  assert.deepEqual(await lensSpecimens(103),['egg']);
  assert.equal(await button('시간 필름으로').count(),0);
  await tap('모양 보기');
  for(const [form,name] of [['adult','어른벌레'],['pupa','번데기'],['larva','애벌레']]){
   await tap(name+' 관찰');
   assert.deepEqual(await lensSpecimens(103),[form]);
  }
  await tap('애벌레와 어른벌레 비교');
  assert.deepEqual(await lensSpecimens(103),[]);
  await tap('확대 관찰로 돌아가기');
  await shot('closeup');
  await tap('시간 필름으로');
  await waitObjective(objectives[2]);
  assert.equal(await page.locator('textarea, dialog[open]').count(),0);
  assert.deepEqual((await state()).inspected,{egg:[0,1],larva:[0],pupa:[0],adult:[0]});
  assert.equal((await state()).note,'');
  assert.deepEqual(errors,[]);
  await context.close();
  console.log(`PASS ${width}×${height} ${touch?'touch':'mouse'}: free lens, close-ups, comparison, time film`);
 }
}finally{await browser.close();}
