import * as inquiry from './inquiry-core.js';
import {initialExpedition,restoreExpedition,questSolved} from './expedition.js';
import {initialField,restoreField,fieldRecords} from './field-model.js';
export * from './inquiry-core.js';
export * from './expedition.js';
export const GAME_KEY='life-clock-lab.phaser.4';
export const NAMES=['확대 관찰','시간 필름','씨앗 실험 설계','흙 속 시간 여행','온실 센서','온실 회복','생명 시간 비교','정원 탐정','기록 스튜디오','시계 복원'];
export const LABELS={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레',butterfly:'나비',frog:'개구리',chicken:'닭',dog:'개',balsam:'봉선화',apple:'사과나무',rose:'장미',water:'물',warm:'온도',light:'빛'};
export const POINTS=[[.43,.91],[.43,.80],[.34,.79],[.25,.74],[.24,.65],[.27,.56],[.28,.48],[.21,.45],[.18,.40],[.33,.43],[.37,.33],[.43,.30],[.47,.26],[.55,.30],[.61,.34],[.64,.39],[.69,.42],[.73,.39],[.66,.51],[.68,.59],[.63,.70],[.66,.77],[.73,.80],[.80,.78],[.53,.80],[.47,.77],[.43,.71]];
export const EDGES=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[6,9],[9,10],[10,11],[11,12],[11,13],[13,14],[14,15],[15,16],[16,17],[15,18],[18,19],[19,20],[20,21],[21,22],[22,23],[21,24],[24,25],[25,26],[25,1]];
export const DOORS=[8,12,17,23,26];
export function nearest(p){return POINTS.reduce((b,q,i)=>Math.hypot(q[0]-p[0],q[1]-p[1])<Math.hypot(POINTS[b][0]-p[0],POINTS[b][1]-p[1])?i:b,0);}
export function route(a,b){const distance=POINTS.map(()=>Infinity),previous=[],open=new Set(POINTS.map((_,i)=>i));distance[a]=0;while(open.size){const u=[...open].reduce((x,y)=>distance[x]<distance[y]?x:y);open.delete(u);if(u===b)break;for(const [x,y] of EDGES){const v=x===u?y:y===u?x:null;if(v===null||!open.has(v))continue;const d=distance[u]+Math.hypot(POINTS[u][0]-POINTS[v][0],POINTS[u][1]-POINTS[v][1]);if(d<distance[v]){distance[v]=d;previous[v]=u;}}}const result=[b];while(result[0]!==a&&previous[result[0]]!==undefined)result.unshift(previous[result[0]]);return result;}
export function fresh(){return {...inquiry.fresh(),avatar:{x:POINTS[0][0],y:POINTS[0][1]},expedition:initialExpedition(),field:initialField(),fieldView:'title',audio:{bgm:false,sfx:true,volume:.2}};}
export function restore(raw){
 let parsed;try{parsed=JSON.parse(raw);}catch{}if(!parsed||![2,3].includes(parsed.version))return fresh();
 const s=inquiry.restore(raw);s.expedition=restoreExpedition(parsed.expedition,s);s.field=restoreField(parsed.field);
 s.fieldView=['title','map','room'].includes(parsed.fieldView)?parsed.fieldView:'title';
 s.audio={bgm:parsed.audio?.bgm===true,sfx:parsed.audio?.sfx!==false,volume:Number.isFinite(parsed.audio?.volume)?Math.max(0,Math.min(1,parsed.audio.volume)):.2};
 return s;
}
const saveSessions=new WeakMap(),saveKeys=[GAME_KEY,inquiry.STORAGE_KEY,inquiry.LEGACY_KEY];
const savedObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const coreShape=inquiry.fresh(),fieldShape=initialField();
// Discovery quests were added to the same field version; their absence is a
// supported older save, while losing a whole chapter/record container is not.
for(const chapter of fieldShape.chapters)delete chapter.discovery;
// New draft/observation fields are optional in older student saves.
for(const key of ['drawingForm','noteDraft'])delete fieldShape.chapters[0][key];
for(const round of fieldShape.chapters[1].rounds){delete round.report;delete round.legacyReport;}
for(const task of fieldShape.chapters[2].cases)delete task.observations;
delete fieldShape.chapters[3].seasonCompared;
delete fieldShape.chapters[4].drafts;
function sameShape(value,shape){
 if(shape===null)return value===null||typeof value==='string'||Number.isFinite(value)||savedObject(value);
 if(Array.isArray(shape))return Array.isArray(value)&&(!shape.length||value.length===shape.length&&shape.every((item,i)=>sameShape(value[i],item)));
 if(savedObject(shape))return savedObject(value)&&Object.keys(shape).every(key=>sameShape(value[key],shape[key]));
 return typeof value===typeof shape&&(typeof value!=='number'||Number.isFinite(value));
}
function savedDataIssue(value){
 if(!savedObject(value)||!Number.isInteger(value.version))return 'invalid-structure';
 if(![2,3].includes(value.version))return 'unsupported-version';
 const keys=Object.keys(coreShape).filter(key=>key!=='inquiry');
 if(!keys.every(key=>sameShape(value[key],coreShape[key]))||value.version===3&&!sameShape(value.inquiry,coreShape.inquiry))return 'invalid-structure';
 for(const[key,shape]of [['field',fieldShape],['expedition',initialExpedition()]]){
  if(!Object.hasOwn(value,key))continue;
  if(!savedObject(value[key])||!Number.isInteger(value[key].version))return 'invalid-structure';
  if(value[key].version!==shape.version)return 'unsupported-version';
  if(!sameShape(value[key],shape))return 'invalid-structure';
 }
 if(value.field){
  const chapters=[...value.field.chapters,...Object.values(value.field.snapshots)];
  if(chapters.some(chapter=>!savedObject(chapter)||Object.hasOwn(chapter,'discovery')&&!Array.isArray(chapter.discovery)))return 'invalid-structure';
  if(Object.entries(value.field.snapshots).some(([index,chapter])=>!/^[0-4]$/.test(index)||!sameShape(chapter,fieldShape.chapters[Number(index)])))return 'invalid-structure';
 }
 return null;
}
function statusSource(session,snapshot){
 const key=saveKeys.find(key=>Object.hasOwn(snapshot,key)&&snapshot[key]!==null)||GAME_KEY;
 session.sourceKey=key;session.raw=snapshot[key]??null;
}
function checkSavedRaw(storage,session){
 const snapshot={};
 try{
  for(const key of session.keys)snapshot[key]=storage.getItem(key);
 }catch{session.reason='read-failed';session.blocked=true;session.snapshot=null;return false;}
 session.snapshot=snapshot;statusSource(session,snapshot);
 if(session.keys.some(key=>!Object.hasOwn(session.expectedRaw,key)||snapshot[key]!==session.expectedRaw[key])){
  session.reason='conflict';session.blocked=true;return false;
 }
 return true;
}
export function loadGame(storage){
 if(!savedObject(storage))return fresh();
 const session={keys:[],expectedRaw:{},snapshot:null,sourceKey:GAME_KEY,raw:null,reason:'new',blocked:false};saveSessions.set(storage,session);
 try{
  for(const key of saveKeys){
   session.keys.push(key);const raw=storage.getItem(key);session.expectedRaw[key]=raw;
   if(raw===null)continue;
   session.sourceKey=key;session.raw=raw;session.snapshot={...session.expectedRaw};
   let parsed;try{parsed=JSON.parse(raw);}catch{session.reason='invalid-json';session.blocked=true;return fresh();}
   const issue=savedDataIssue(parsed);
   if(issue){session.reason=issue;session.blocked=true;return fresh();}
   session.reason=key===GAME_KEY?'ready':'migrated';return restore(raw);
  }
  session.snapshot={...session.expectedRaw};return fresh();
 }catch{session.reason='read-failed';session.blocked=true;session.snapshot=null;return fresh();}
}
/** raw is the last readable source, for preservation only, not a validated backup. */
export function getSaveStatus(storage){
 if(!savedObject(storage))return {ok:false,reason:'read-failed',sourceKey:GAME_KEY,raw:null,expectedRaw:null};
 if(!saveSessions.has(storage))loadGame(storage);
 const session=saveSessions.get(storage);checkSavedRaw(storage,session);
 return {ok:!session.blocked&&['new','ready','migrated'].includes(session.reason),reason:session.reason,sourceKey:session.sourceKey,raw:session.raw,expectedRaw:session.snapshot?{...session.snapshot}:null};
}
function writeGame(storage,s,session){
 try{
  if(savedDataIssue(s))throw new Error('Invalid game state');
  const raw=JSON.stringify(s);storage.setItem(GAME_KEY,raw);
  Object.assign(session,{keys:[GAME_KEY],expectedRaw:{[GAME_KEY]:raw},snapshot:{[GAME_KEY]:raw},sourceKey:GAME_KEY,raw,reason:'ready',blocked:false});return true;
 }catch{session.reason='write-failed';return false;}
}
// Compare before writing to detect another tab's changes. localStorage does
// not offer an atomic compare-and-swap, so this is not a cross-tab lock.
export function saveGame(storage,s){
 if(!savedObject(storage))return false;
 if(!saveSessions.has(storage))loadGame(storage);
 const session=saveSessions.get(storage);
 if(!checkSavedRaw(storage,session)||session.blocked)return false;
 return writeGame(storage,s,session);
}
/** Pass the expectedRaw snapshot captured when the reset confirmation opened. */
export function resetGame(storage,s,expectedRaw){
 if(!savedObject(storage))return false;
 if(!saveSessions.has(storage))loadGame(storage);
 const session=saveSessions.get(storage);
 if(!savedObject(expectedRaw)||!Object.hasOwn(expectedRaw,GAME_KEY)||!session.keys.every(key=>Object.hasOwn(expectedRaw,key))||Object.keys(expectedRaw).some(key=>!saveKeys.includes(key)||expectedRaw[key]!==null&&typeof expectedRaw[key]!=='string'))return false;
 const snapshot={};
 try{for(const key of Object.keys(expectedRaw))snapshot[key]=storage.getItem(key);}
 catch{session.reason='read-failed';session.blocked=true;session.snapshot=null;return false;}
 session.snapshot=snapshot;statusSource(session,snapshot);
 if(Object.keys(expectedRaw).some(key=>snapshot[key]!==expectedRaw[key])){session.reason='conflict';session.blocked=true;return false;}
 return writeGame(storage,s,session);
}
export function complete(s,n){if(n%2===1&&!questSolved(s,Math.floor(n/2)))return false;return inquiry.complete(s,n);}
// Repeated inspection replaces the same notebook slot; it cannot consume every
// evidence slot and block later required observations. Experiment runs stay immutable.
export function addEvidence(s,data){const old=s.inquiry.evidence.find(e=>e.type===data.type&&(['compare','care','season'].includes(e.type)||e.type==='observation'&&e.species===data.species));if(old){Object.assign(old,JSON.parse(JSON.stringify(data)));return old;}return inquiry.addEvidence(s,data);}
export function capturePin(s,id,p){if(!inquiry.SPECIES.includes(id)||!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;const old=s.inquiry.evidence.find(e=>e.type==='observation'&&e.species===id);if(!old)return inquiry.capturePin(s,id,p);old.pin={...p};s.inquiry.pins[id]={...p};if(!s.discovery.seen.includes(id))s.discovery.seen.push(id);return true;}
export function captureRetry(s){const r=inquiry.activeRetry(s);if(!r||s.inquiry.retryDay<2)return null;const old=s.inquiry.evidence.find(e=>e.type==='retry'&&e.runId===r.id);if(old){old.day=s.inquiry.retryDay;return old;}return inquiry.captureRetry(s);}
export function recordBank(s){return [...inquiry.recordBank(s).map(r=>r.id.startsWith('obs-')?{...r,detail:LABELS[r.id.slice(4)]+'의 전체 모습을 살펴본 기록'}:r),...(s.field?fieldRecords(s.field):[])];}
export function moveFilm(s,from,to){if(from<0||to<0||from>3||to>3)return false;const [id]=s.cycle.order.splice(from,1);s.cycle.order.splice(to,0,id);return true;}
export function changeCondition(s,domain,side,key){if(!['seed','greenhouse'].includes(domain)||!['a','b'].includes(side)||typeof s[domain][side][key]!=='boolean')return false;if(domain==='seed'&&inquiry.initialRun(s)||domain==='greenhouse'&&s.completed.includes(4))return false;s[domain][side][key]=!s[domain][side][key];return true;}
export function classify(s,id,group){if(!(id in inquiry.GROUPS)||!['egg','live','annual','perennial'].includes(group))return false;s.inquiry.garden.draft[id]=group;if(inquiry.GROUPS[id]!==group)return false;s.garden.placements[id]=group;return true;}
export function repair(s,tool){if(s.recovery.cause!==s.greenhouse.question||tool!==s.greenhouse.question)return false;if(s.recovery.repaired)return true;s.recovery.repaired=true;s.inquiry.care.step=0;s.inquiry.care.seen=[0];return true;}
export function careStep(s,step){if(!s.recovery.repaired)return false;s.inquiry.care.step=Math.max(0,Math.min(2,step));if(!s.inquiry.care.seen.includes(s.inquiry.care.step))s.inquiry.care.seen.push(s.inquiry.care.step);return true;}
export function seasonStep(s,step){const q=s.inquiry.season;q.step=Math.max(0,Math.min(4,step));if(!q.seen.includes(q.step))q.seen.push(q.step);if(q.step===0||q.step===3){for(const id of ['balsam','apple']){const key=id+'-'+q.step;if(!s.archives.plantSeen.includes(key))s.archives.plantSeen.push(key);}}}
export function selectRecord(s,id){if(!inquiry.recordBank(s).some(r=>r.id===id))return false;const at=s.book.cards.indexOf(id);if(at>=0)s.book.cards.splice(at,1);else if(s.book.cards.length<6)s.book.cards.push(id);else return false;return true;}
export function hint(s){const n=s.mission,p=s.phase[n];if(n===2||n===4){const d=n===2?s.seed:s.greenhouse;const e=inquiry.experimentIssue(d);if(p&&e)return e==='baseline'?'비교하지 않는 조건은 두 화분 모두 자랄 수 있게 맞춰 줘.':'알아볼 조건 하나만 다르게 맞춰 줘.';}return inquiry.remaining(s,n,p);}
