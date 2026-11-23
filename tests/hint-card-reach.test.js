import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Doto's hint card opens over the lower scene, where answer buttons sit. It once hid the
// right answer in the care comparison and kept wrong-answer feedback invisible.
const app=readFileSync(new URL('../src/game-app.js',import.meta.url),'utf8');

test('도토 힌트 말풍선은 장면을 누르면 닫혀서 아래 버튼이 그대로 눌린다',()=>{
 assert.match(app,/addEventListener\('pointerdown',e=>\{if\(ui\.guide&&mode\(\)==='room'&&e\.target\.closest\?\.\('#phaser-root,#focus-targets'\)\)hideGuide\(\);\},true\)/);
});

test('말풍선 본문을 누르면 닫히고, 말풍선 버튼은 그대로 동작한다',()=>{
 assert.match(app,/guideBubble\.addEventListener\('click',e=>\{if\(ui\.guide&&!e\.target\.closest\('button'\)\)closeGuide\(\);\}\)/);
});

test('활동 결과가 나오면 말풍선을 닫아 피드백 문구가 보인다',()=>{
 const act=app.slice(app.indexOf('function act('),app.indexOf('// What the learner'));
 assert.match(act,/if\(mode\(\)==='room'\)hideGuide\(\);\s*countMiss\(result\.ok\)/);
});

test('위치 보기는 말풍선을 닫고 표시할 자리를 보여 준다',()=>{
 assert.match(app,/name==='hint-point'\)\{closeGuide\(\);ctx\.scene\?\.showHint/);
});
