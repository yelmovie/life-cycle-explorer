import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {COMPANION_HINT_LINES,companionMapLine,companionDiscoveryLine} from '../src/field-companion.js';
import {FIELD_CHAPTERS} from '../src/field-content.js';
import {DISCOVERY_MISSIONS} from '../src/field-mission-data.js';

test('도토 음원은 각 탐구 단계와 지도·추가 발견에서 실제로 보이는 문장과 일치한다',()=>{
 const dir=new URL('../assets/audio/doto-hints-el/',import.meta.url);
 const source=JSON.parse(readFileSync(new URL('provenance.json',dir),'utf8'));
 const lines=[
  ...COMPANION_HINT_LINES.filter(line=>line.key!=='discovery-0'),
  ...FIELD_CHAPTERS.map((chapter,index)=>companionMapLine(index,chapter.title)),
  companionMapLine(),
  ...DISCOVERY_MISSIONS.flatMap((mission,chapter)=>mission.objectives.map((text,step)=>companionDiscoveryLine(chapter,step,text))),
 ];
 assert.deepEqual(source.lines.map(({key,text})=>({key,text})),lines);
 assert.deepEqual(readdirSync(dir).filter(file=>!file.startsWith('.')&&file.endsWith('.mp3')).sort(),lines.map(({key})=>key+'.mp3').sort());
});
