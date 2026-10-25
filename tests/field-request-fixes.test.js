import {applyQuest} from '../field-quests.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../game-model.js';
import {initialField,fieldAction,fieldReady,fieldRecords,restoreField,storeFieldDraft} from '../field-model.js';
import {previewFieldForPhase} from '../field-preview.js';
import {TEXT_LIMITS} from '../field-writing.js';
const act=(f,type,p={})=>{const r=fieldAction(f,type,p);assert.equal(r.ok,true,`${type}: ${r.message}`);return r;};
function fixture(){const s=G.fresh();s.field=previewFieldForPhase({...initialField(),preview:true},4,'ready');delete s.field.preview;delete s.field.previewSample;s.field.completed=[0,1,2,3];s.fieldView='room';return s;}
const writing=n=>'\n '+('한글과 공백\n줄바꿈을 함께 보관한다. '.repeat(20)).slice(0,n-4)+' \n';
for(const length of [180,181,TEXT_LIMITS.caption])test(`${length} character caption and plan retain Korean, spaces and newlines through save and restore`,()=>{
 const s=fixture(),f=s.field,q=f.chapters[4],id=q.records[0],text=writing(length);assert.equal(text.length,length);
 act(f,'book-caption',{id,text});act(f,'observation-plan',{subject:'교실의 콩',when:'매주 월요일',what:text});
 let raw=null;const storage={getItem:()=>raw,setItem:(key,value)=>{raw=value;}};G.loadGame(storage);assert.equal(G.saveGame(storage,s),true);const restored=G.loadGame(storage);
 assert.equal(restored.field.chapters[4].captions[id],text);assert.equal(restored.field.chapters[4].plan.what,text);
});
test('drafts survive restore separately for each photo and never count as submitted work',()=>{
 const f=fixture().field,q=f.chapters[4];q.captions={};q.summary='';q.matches={};q.plan={subject:'',when:'',what:''};const [a,b]=q.records;
 storeFieldDraft(f,'caption',{id:a,text:writing(200)});storeFieldDraft(f,'caption',{id:b,text:'다른 사진에서 본 모습을 따로 적던 초안'});storeFieldDraft(f,'story',{summary:'관찰한 특징과 근거를 연결해 설명하는 중인 글'});
 assert.deepEqual(q.captions,{});assert.equal(q.summary,'');assert.equal(fieldReady(f,4),false);
 const r=restoreField(f);assert.equal(r.chapters[4].drafts.captions[a],writing(200));assert.equal(r.chapters[4].drafts.captions[b],q.drafts.captions[b]);assert.equal(fieldReady(r,4),false);
 act(r,'book-caption',{id:a,text:writing(200)});assert.equal(Object.hasOwn(r.chapters[4].drafts.captions,a),false);assert.equal(r.chapters[4].drafts.captions[b],q.drafts.captions[b]);
});
test('observed drooping leaves are accepted only with the measured context, and do not decide the care tool',()=>{
 const f=initialField();f.preview=true;f.active=2;const observation={part:'leaf',feature:'drooping-leaf'};
 assert.equal(fieldAction(f,'care-pin',observation).ok,false);act(f,'care-measure',{sensor:'water'});assert.equal(fieldAction(f,'care-pin',observation).ok,false);act(f,'care-measure',{sensor:'light'});act(f,'care-pin',observation);
 assert.deepEqual(f.chapters[2].cases[0].observations,[observation]);assert.equal(f.chapters[2].cases[0].tool,'');act(f,'care-photo');assert.equal(fieldAction(f,'care-tool',{tool:'light'}).ok,false);act(f,'care-tool',{tool:'water'});
});
test('pale leaves and dry soil stay distinct, while old dry/pale payloads remain compatible',()=>{
 for(const [index,legacy]of [[0,'dry'],[1,'pale']]){const f=initialField();f.preview=true;f.active=2;f.chapters[2].case=index;for(const sensor of ['water','light'])act(f,'care-measure',{sensor});act(f,'care-pin',{symptom:legacy});assert.equal(f.chapters[2].cases[index].symptom,legacy);}
 const f=initialField();f.preview=true;f.active=2;f.chapters[2].case=1;for(const sensor of ['water','light'])act(f,'care-measure',{sensor});assert.equal(fieldAction(f,'care-pin',{part:'soil',feature:'dry-soil'}).ok,false);assert.equal(fieldAction(f,'care-pin',{part:'leaf',feature:'drooping-leaf'}).ok,false);act(f,'care-pin',{part:'leaf',feature:'pale-leaf'});
});
test('seed condition alone no longer finishes the report; a changed prediction can be revised using photos',()=>{
 const f=initialField();f.preview=true;f.active=1;for(const side of ['a','b'])act(f,'seed-prepare',{side,soil:true,seeds:3});act(f,'seed-predict',{choice:'a'});act(f,'seed-condition',{key:'water'});act(f,'seed-run');for(const day of [0,3,7]){act(f,'seed-day',{day});act(f,'seed-photo');}
 act(f,'seed-report',{reason:'water'});assert.equal(fieldAction(f,'seed-next').ok,false);assert.equal(fieldAction(f,'seed-report',{result:'a'}).ok,false);act(f,'seed-report',{result:'b'});assert.equal(fieldAction(f,'seed-report',{expectation:'same'}).ok,false);act(f,'seed-report',{expectation:'changed'});assert.equal(f.chapters[1].rounds[0].run.prediction,'a');act(f,'seed-next');
});
test('old completed records restore without losing drawings, photos, or completion, and retry keeps their snapshot',()=>{
 const s=fixture(),f=s.field;f.completed=[0,1,2,3,4];f.snapshots=Object.fromEntries(f.chapters.map((q,i)=>[i,structuredClone(q)]));
 const oldChapter=q=>{delete q.drawingForm;delete q.noteDraft;delete q.drafts;for(const r of q.rounds||[]){delete r.report;delete r.legacyReport;}for(const r of q.cases||[])delete r.observations;};f.chapters.forEach(oldChapter);Object.values(f.snapshots).forEach(oldChapter);
 const original=JSON.stringify(s);const storage={getItem:()=>original,setItem(){throw new Error('reading must not write');}};const r=G.loadGame(storage);assert.equal(G.getSaveStatus(storage).ok,true);assert.deepEqual(r.field.completed,[0,1,2,3,4]);assert.deepEqual(r.field.chapters[0].drawing,f.chapters[0].drawing);assert.deepEqual(r.field.chapters[1].rounds.map(x=>x.photos),f.chapters[1].rounds.map(x=>x.photos));assert.deepEqual(r.field.chapters[2].cases.map(x=>x.photos),f.chapters[2].cases.map(x=>x.photos));
 assert.equal(r.field.chapters[1].rounds.every(x=>x.legacyReport),true);const before=fieldRecords(r.field);act(r.field,'chapter-enter',{chapter:2});act(r.field,'chapter-restart',{chapter:2});assert.deepEqual(r.field.completed,[0,1,2,3,4]);assert.deepEqual(fieldRecords(r.field),before);assert.equal(storage.getItem(),original);
});
test('drawing reference and an unsubmitted note draft restore independently of submitted writing',()=>{const f=fixture().field;f.active=0;f.chapters[0].note='';act(f,'observation-reference',{form:'adult'});storeFieldDraft(f,'observation',{text:'  어른벌레의 더듬이를 살펴보는 중\n'});const r=restoreField(f);assert.equal(r.chapters[0].drawingForm,'adult');assert.equal(r.chapters[0].note,'');assert.equal(r.chapters[0].noteDraft,'  어른벌레의 더듬이를 살펴보는 중\n');});

test('submitted discovery writing keeps its spaces and line breaks too',()=>{const f=fixture().field;for(const type of ['observation','retry','care']){const record=fieldRecords(f).find(r=>r.fieldEvidence.type===type);assert.equal(applyQuest(f,{step:0,kind:'stamp',recordId:record.id}).ok,true);}const text='\n 학교 콩의 새잎은 언제 어떤 모양으로 자랄까? \n';assert.equal(applyQuest(f,{step:1,kind:'question',text}).ok,true);assert.equal(f.chapters[4].discovery[1].question,text);assert.equal(restoreField(f).chapters[4].discovery[1].question,text);});

for(const length of [180,200])test(`plan subject and timing retain ${length} characters rather than narrowing the old 180-character save limit`,()=>{const f=fixture().field,subject=(' 기존 관찰 대상 '+ '가'.repeat(210)).slice(0,length),when=(' 매주 관찰할 시간 '+ '나'.repeat(210)).slice(0,length);act(f,'observation-plan',{subject,when,what:'줄기와 잎을 관찰한다.'});const r=restoreField(f);assert.equal(r.chapters[4].plan.subject,subject);assert.equal(r.chapters[4].plan.when,when);});
