import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';

// The story "자동 넘김" button once threw because field-dialogs.js called reducedMotion without importing it.
test('reducedMotion을 부르는 모든 실행 파일은 game-motion.js에서 가져온다',()=>{
 const dir=new URL('../src/',import.meta.url);
 const missing=readdirSync(dir).filter(name=>name.endsWith('.js')&&name!=='game-motion.js').filter(name=>{
  const code=readFileSync(new URL(name,dir),'utf8');
  return /\breducedMotion\(/.test(code)&&!/^import\s*\{[^}]*\breducedMotion\b[^}]*\}\s*from\s*'\.\/game-motion\.js'/m.test(code);
 });
 assert.deepEqual(missing,[]);
});
