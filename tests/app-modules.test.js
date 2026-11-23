import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Modules split out of game-app.js (E2, 2026-11-21) must be served, packaged and syntax-checked like the rest.
test('modules split out of game-app.js are served, built and checked',()=>{
 const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8'),app=read('src/game-app.js');
 for(const file of ['src/game-shell.js','src/room-time-controls.js','src/doto-voice.js','src/map-door-layout.js','src/back-guard.js']){
  assert.match(app,new RegExp(`from './${file.slice(4).replace('.','\\.')}'`),file+' imported');
  for(const list of ['server.mjs','scripts/build.mjs','scripts/check.mjs'])assert.ok(read(list).includes(`'${file}'`),`${file} listed in ${list}`);
 }
});
