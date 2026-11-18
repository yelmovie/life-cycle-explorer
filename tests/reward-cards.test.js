import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {REWARD_CARDS,ownedRewardCards,wonRewardCards} from '../src/reward-card-set.js';
import {normalizeVillageEncounters} from '../src/village-encounters.js';

const root=new URL('../',import.meta.url);

test('성취 카드는 지도 악당 순서와 같고 격퇴 기록(3타)에서만 보유를 계산한다',()=>{
 const ids=REWARD_CARDS.map(card=>card.id);
 assert.deepEqual(ids,['butterfly','seed','care','season','clock']);
 // The villain ids come from the map's own table: every card id must be one the save can hold.
 assert.deepEqual(Object.keys(normalizeVillageEncounters(Object.fromEntries(ids.map(id=>[id,3])))),ids);
 assert.deepEqual(ownedRewardCards(undefined),[false,false,false,false,false]);
 assert.deepEqual(ownedRewardCards({butterfly:3,seed:2,season:3}),[true,false,false,true,false]);
 // Saves from releases that stored five numeric slots still fill the same cards.
 assert.deepEqual(ownedRewardCards(normalizeVillageEncounters(undefined,[3,1,0,3,0])),[true,false,false,true,false]);
});

test('카드는 타격 수가 3이 되는 저장에서 한 번만 나온다',()=>{
 assert.deepEqual(wonRewardCards({},{butterfly:1}),[]);
 assert.deepEqual(wonRewardCards({butterfly:2},{butterfly:3}),[0]);
 assert.deepEqual(wonRewardCards({butterfly:3,seed:2},{butterfly:3,seed:3}),[1]);
 // The map repeats earlier hits of the same visit in every patch.
 assert.deepEqual(wonRewardCards({butterfly:3,clock:3},{butterfly:3,clock:3}),[]);
});

test('카드 그림·효과음 파일이 있고 배포본과 개발 서버 목록에 들어간다',()=>{
 for(const [index,{id}] of REWARD_CARDS.entries())for(const kind of ['card','thumb'])
  assert.ok(existsSync(new URL(`assets/reward-cards/${kind}-${index+1}-${id}.webp`,root)),`${kind}-${index+1}-${id}.webp`);
 for(const name of ['whoosh','reveal','epic','slot','complete'])assert.ok(existsSync(new URL(`assets/audio/sfx/card-${name}.mp3`,root)),name);
 const build=readFileSync(new URL('scripts/build.mjs',root),'utf8'),server=readFileSync(new URL('server.mjs',root),'utf8'),page=readFileSync(new URL('index.html',root),'utf8');
 for(const file of ['src/reward-cards.js','src/reward-cards.css','src/reward-card-set.js'])for(const list of [build,server])assert.ok(list.includes(`'${file}'`),file);
 assert.match(page,/href="src\/reward-cards\.css"/);
});
