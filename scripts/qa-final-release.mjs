import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const project=new URL('../',import.meta.url),out=new URL(process.env.RELEASE_OUTPUT||'.tmp/final-release/',project);
await mkdir(out,{recursive:true});process.env.TEMP='D:/DevTemp';process.env.TMP='D:/DevTemp';
const base=process.env.BASE_URL||'http://127.0.0.1:4215',hash=b=>createHash('sha256').update(b).digest('hex');
const manifest=JSON.parse(await readFile(new URL('dist/build-manifest.json',project),'utf8')),result={cacheVersion:manifest.cacheVersion,manifestFiles:0,sourceFiles:0,httpFiles:0,errors:[]};
for(const f of manifest.files){
 const dist=await readFile(new URL('dist/'+f.path,project));assert.equal(hash(dist),f.sha256,f.path+' manifest');result.manifestFiles++;
 if(f.path!=='offline-config.json'){const source=await readFile(new URL(f.path,project));assert.equal(hash(source),f.sha256,f.path+' source/dist');result.sourceFiles++;}
}
for(const f of ['index.html','src/game-app.js','src/game.css','src/field-preview.js','src/field-story-scenes.js','src/field-observation-scenes.js','src/field-mission-data.js','src/game-network.js','service-worker.js']){
 const response=await fetch(base+'/'+f);assert.equal(response.status,200,f);assert.equal(hash(Buffer.from(await response.arrayBuffer())),hash(await readFile(new URL('dist/'+f,project))),f+' HTTP');result.httpFiles++;
}
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:800}});
page.on('pageerror',e=>result.errors.push(e.message));
try{
 await page.goto(base);await page.locator('.boot').waitFor({state:'detached'});await page.locator('[data-action=start]').click();
 const opening=await page.locator('dialog[open]').innerText();assert.match(opening,/時間|시간 손잡이/);assert.match(opening,/기록증/);result.openingRewardPromise=opening;
 await page.screenshot({path:fileURLToPath(new URL('opening.png',out))});
 const completed=JSON.parse(await readFile(new URL(process.env.RELEASE_FIXTURE||'.tmp/recovery-play/earned-state.json',project),'utf8'));
 await page.evaluate(s=>localStorage.setItem('life-clock-lab.phaser.4',JSON.stringify(s)),completed);await page.reload();await page.locator('.boot').waitFor({state:'detached'});
 await page.getByRole('button',{name:'설정',exact:true}).click();await page.locator('[data-action=ending]').click();
 const ending=await page.locator('dialog[open]').innerText();assert.ok(ending.includes(completed.field.chapters[4].summary));assert.ok(ending.includes(completed.field.chapters[4].plan.what));result.personalizedEnding=true;
 await page.screenshot({path:fileURLToPath(new URL('ending.png',out))});assert.deepEqual(result.errors,[]);
 await writeFile(new URL('result.json',out),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();}
