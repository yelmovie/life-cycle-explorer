import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {missionUnlockText} from '../src/field-writing.js';

test('I11 mission lock labels use the correct particle for all five missions',()=>{
 assert.deepEqual(Array.from({length:5},(_,i)=>missionUnlockText(i)),["\ubbf8\uc158 1\uc744 \ub9c8\uce58\uba74 \uc5f4\ub824\uc694","\ubbf8\uc158 2\ub97c \ub9c8\uce58\uba74 \uc5f4\ub824\uc694","\ubbf8\uc158 3\uc744 \ub9c8\uce58\uba74 \uc5f4\ub824\uc694","\ubbf8\uc158 4\ub97c \ub9c8\uce58\uba74 \uc5f4\ub824\uc694","\ubbf8\uc158 5\ub97c \ub9c8\uce58\uba74 \uc5f4\ub824\uc694"]);
});
test('I11 spelling and notebook labels stay corrected in active source and content',async()=>{
 const forbidden=["\ud55c\ud574\ub97c","\uc0c8 \uc2f9","\uc2dc\uacc4 \ubc14\ub298","\ub2e4\uc2dc\ud558\uae30","\uc774\uc5b4\uac08","\uc5f0\uad6c\ub178\ud2b8","\uc0dd\uba85\uad00\ucc30\ub178\ud2b8","\uc774\uc5b4\uac00","\ud574\ubcf4\uae30","\uad00\ucc30 \ub178\ud2b8.png"];
 for(const dir of ['src','content'])for(const name of await readdir(new URL('../'+dir+'/',import.meta.url))){
  if(!/\.(js|css|json)$/.test(name))continue;
  const source=await readFile(new URL('../'+dir+'/'+name,import.meta.url),'utf8');
  for(const word of forbidden)assert.ok(!source.includes(word),dir+'/'+name+' still contains '+word);
 }
});

test('I11 designated font is local and used in DOM, Phaser and exports',async()=>{
 const files=['src/game.css','src/game-shell.css','src/field-notebook.css','src/field-scenes.js','src/field-story-scenes.js','src/game-app.js','src/adventure-export.js','src/field-certificate.js'];
 for(const file of files){const source=await readFile(new URL('../'+file,import.meta.url),'utf8');assert.match(source,/NanumSquareNeo/);assert.doesNotMatch(source,/Jua|Research Hand/);}
 // Chrome cannot instantiate Naver's variable WOFF, so the static weights are shipped instead.
 const css=await readFile(new URL('../src/game.css',import.meta.url),'utf8');
 assert.doesNotMatch(css,/NanumSquareNeo-Variable/);
 for(const weight of ['bRg','cBd','dEb']){
  const name='NanumSquareNeoTTF-'+weight+'.woff';
  assert.ok(css.includes("url('../assets/fonts/"+name+"')"),name+' is not declared in game.css');
  const font=await readFile(new URL('../assets/fonts/'+name,import.meta.url));
  assert.equal(font.subarray(0,4).toString(),'wOFF');
  assert.equal(font.readUInt32BE(8),font.length,name+' is truncated');
 }
});
