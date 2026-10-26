import test from 'node:test';
import assert from 'node:assert/strict';
import {initialField} from '../src/field-model.js';
import {previewFieldForPhase} from '../src/field-preview.js';
import {roomPhase} from '../src/field-flow.js';
const phases=[['search','draw','film','generation','discovery'],['prepare','design','grow','reason','seed-next','discovery'],['measure','symptom','care-before','care','care-after','care-next','discovery'],['animals','animal-birth','tags','seasons','plant-identity','transfer','discovery'],['tower-slots','tower-evidence','tower-note','tower-run','plan','discovery']];
test('all teacher phase choices open the requested activity without completing any chapter',()=>{
 const source={...initialField(),preview:true};source.chapters[0].note='학생 원본에 있던 관찰';const before=structuredClone(source);
 for(let c=0;c<phases.length;c++)for(const phase of phases[c]){
  const preview=previewFieldForPhase(source,c,phase);
  assert.equal(roomPhase(preview),phase,`${c}: ${phase}`);
  assert.deepEqual(preview.completed,[]);assert.deepEqual(preview.snapshots,{});assert.equal(preview.previewSample,true);
 }
 assert.deepEqual(source,before,'opening sample phases must leave the source notebook unchanged');
});
test('student play cannot call the teacher sample helper',()=>{assert.throws(()=>previewFieldForPhase(initialField(),4,'plan'),/교사 시연/);});
