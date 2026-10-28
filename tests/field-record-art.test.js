import test from 'node:test';
import assert from 'node:assert/strict';
import {fieldRecordArt} from '../src/field-record-art.js';

async function render(fieldEvidence){
 const images=[],captions=[],parts=[];
 await fieldRecordArt({fieldEvidence},{img:async(key,...box)=>images.push({key,box}),text:(_x,_y,value)=>captions.push(value),parts});
 return {images,captions,parts};
}

test('light care record preserves the elongated plant and marks later new leaves',async()=>{
 const r=await render({type:'care',variable:'light',tool:'light',photos:[0,2]});
 // The recovery art keeps the same long stems and adds new green leaves.
 assert.deepEqual(r.images.map(x=>x.key),['pale','paleRecover2']);
 assert.match(r.captions.join(' '),/길어진 줄기는 그대로/);
 assert.match(r.captions.join(' '),/새잎이 자란 뒤/);
 assert.doesNotMatch(r.captions.join(' '),/이틀/);
});

// The butterfly record follows the four-stage film the learner ordered in the butterfly forest.
test('animal records show a time series: the butterfly film and the photographed dog stages',async()=>{
 for(const [animal,photos,expected]of [['butterfly',[0,3],['egg','larva','pupa','adult']],['dog',[0,2],['puppy','dog']],['dog',[2,0,2,-1,3],['puppy','dog']]]){
  const r=await render({type:'comparison',animal,photos});
  assert.deepEqual(r.images.map(x=>x.key),expected);
 }
});
