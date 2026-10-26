import test from 'node:test';
import assert from 'node:assert/strict';
import {initialField} from '../src/field-model.js';
import {photoNotebookEntry} from '../src/field-notebook.js';

const state=()=>({field:initialField()});
test('capture depicts actual current seed day and both controlled conditions',()=>{
 const s=state(),r=s.field.chapters[1].rounds[0];r.run={a:{water:false,warm:true},b:{water:true,warm:true}};
 assert.deepEqual(photoNotebookEntry(s,'seed-photo').cards.map(c=>c.art),['pot0','pot0']);
 r.day=7;r.photos=[0,3,7];const entry=photoNotebookEntry(s,'seed-photo');
 assert.deepEqual(entry.cards.map(c=>c.art),['pot0','pot3']);assert.match(entry.cards[0].detail,/물 없음/);assert.match(entry.cards[1].detail,/물 있음/);assert.match(entry.next,/조건을 연결/);
 r.photos=[0,7];assert.match(photoNotebookEntry(s,'seed-photo').next,/시간을 돌려/);
});
test('light care capture does not promise recovery in two days or show future leaves',()=>{
 const s=state();s.field.chapters[2].case=1;const r=s.field.chapters[2].cases[1];
 assert.equal(photoNotebookEntry(s,'care-photo').cards[0].art,'pale');
 r.tool='light';r.day=1;assert.equal(photoNotebookEntry(s,'care-photo').cards[0].art,'pale');
 r.day=2;const entry=photoNotebookEntry(s,'care-photo');assert.equal(entry.cards[0].art,'pale');assert.equal(entry.cards[0].newLeaves,true);assert.match(entry.note,/줄기는 그대로/);assert.match(entry.title,/새잎이 자란 뒤/);assert.doesNotMatch(entry.title,/이틀/);
});
test('animal capture shows only the selected individual at selected life stage',()=>{
 const s=state();assert.equal(photoNotebookEntry(s,'animal-photo',{animal:'dog'}).cards[0].art,'puppy');
 s.field.chapters[3].animals.dog.step=2;const entry=photoNotebookEntry(s,'animal-photo',{animal:'dog'});
 assert.equal(entry.cards.length,1);assert.equal(entry.cards[0].art,'dog');assert.match(entry.cards[0].label,/다 자란 개/);
 assert.equal(photoNotebookEntry(s,'animal-photo',{animal:'frog'}),null);
});
test('next spring capture preserves apple identity and gives balsam a new identity',()=>{
 const s=state();s.field.chapters[3].season=4;
 assert.match(photoNotebookEntry(s,'season-photo',{plant:'apple'}).cards[0].detail,/A-01/);
 assert.match(photoNotebookEntry(s,'season-photo',{plant:'balsam'}).cards[0].detail,/B-02/);
 assert.match(photoNotebookEntry(s,'season-photo',{plant:'balsam'}).note,/지난해 살던 봉선화와는 다른 식물이다/);
});
