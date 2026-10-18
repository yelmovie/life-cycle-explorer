import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const changes=new Map();
async function read(f){return await readFile(path.join(root,f),'utf8');}
function replace(s,a,b){if(!s.includes(a))throw Error('Missing anchor: '+a.slice(0,90));return s.replace(a,b);}
function fn(s,name,next,body){const a=s.indexOf('function '+name+'('),b=s.indexOf('function '+next+'(',a);if(a<0||b<0)throw Error(name);return s.slice(0,a)+body+'\n'+s.slice(b);}
let s=await read('adventure.js');
s=replace(s,"progress,STORAGE_KEY} from './adventure-core.js';","progress,STORAGE_KEY,LEGACY_KEY,phaseReady as inquiryPhaseReady,remaining} from './inquiry-core.js';\nimport {createInquiryUI} from './inquiry-ui.js';");
s=replace(s,"localStorage.getItem(STORAGE_KEY)||'null'","localStorage.getItem(STORAGE_KEY)||localStorage.getItem(LEGACY_KEY)||'null'");
s=replace(s,'const MISSIONS=[','const iq=createInquiryUI({state:()=>state,save,render,toast,dialog,updateFooter});\nconst MISSIONS=[');
s=replace(s,"modal.addEventListener('close',()=>{","modal.addEventListener('close',()=>{iq.stop();");
s=replace(s,'function render({focus=false}={}){dispose();','function render({focus=false}={}){iq.stop();dispose();');
s=replace(s,'bindDrawing();const activity','bindDrawing();iq.bind();const activity');
s=replace(s,"${activities[n](p)}","${iq.view(n,p)??activities[n](p)}");
const asideStart=s.indexOf('<aside class="companion">',s.indexOf('function missionMarkup'));
const asideEnd=s.indexOf('</aside>',asideStart)+8;
if(asideStart<0)throw Error('aside');s=s.slice(0,asideStart)+s.slice(asideEnd);
s=replace(s,'<main class="mission-screen" style=', '<main class="mission-screen" data-mission="${n}" data-phase="${p}" style=');
s=fn(s,'phaseStatus','phaseReady',"function phaseStatus(){return remaining(state,state.mission,state.phase[state.mission]);}");
s=fn(s,'phaseReady','updateFooter',"function phaseReady(){return inquiryPhaseReady(state);}");
s=replace(s,'<span id="save-state">','${btn("내 기록","records","","icon-button")}<span id="save-state">');
s=replace(s,"'자동 저장 중'","'저장됨'");s=s.replaceAll('자동 저장 중','저장됨');
s=replace(s,'<div class="map-footnote"><span>', '<div class="quick-missions">${MISSIONS.filter((_,n)=>canEnter(state,n)).map((m,n)=>btn(`${n+1}. ${m.title}`,"open-mission",n,n===state.completed.length?"primary":"")).join("")}</div><div class="map-footnote"><span>');
s=replace(s,"if(e.target.dataset.field)setField(e.target.dataset.field,e.target.value);const range=e.target.dataset.range;if(!range)return;","if(e.target.dataset.field)setField(e.target.dataset.field,e.target.value);if(e.target.dataset.iqPlan){state.inquiry.plan[e.target.dataset.iqPlan]=e.target.value;save();updateFooter();}const range=e.target.dataset.range;if(!range)return;if(iq.range(range,e.target.value))return;");
s=replace(s,"document.addEventListener('change',e=>{", "document.addEventListener('change',e=>{if(e.target.dataset.range&&iq.range(e.target.dataset.range,e.target.value,true))return;");
s=replace(s,"const {action,value}=target.dataset;if(!action)return;", "const {action,value}=target.dataset;if(!action)return;const handled=iq.action(action,value);if(handled){if(handled==='present'){if(modal.open)modal.close();await present();}if(handled==='records'){if(modal.open)modal.close();showRecords();}return;}");
s=replace(s,"if(action==='condition'){const[k,p,c]=value.split(':');state[k][p][c]=!state[k][p][c];}","if(action==='condition'){const[k,p,c]=value.split(':');if(state.completed.includes(k==='seed'?2:4))return;state[k][p][c]=!state[k][p][c];}");
s=replace(s,"if(action==='question'){const[k,q]=value.split(':');state[k].question=q;state[k].prediction=null;}","if(action==='question'){const[k,q]=value.split(':');if(state.completed.includes(k==='seed'?2:4))return;state[k].question=q;state[k].prediction=null;}");
s=replace(s,"if(action==='book-up')", "if(action==='book-down'){const i=state.book.cards.indexOf(value);if(i>=0&&i<state.book.cards.length-1)[state.book.cards[i+1],state.book.cards[i]]=[state.book.cards[i],state.book.cards[i+1]];}\n  if(action==='book-up')");
s=replace(s,"${btn('앞으로','book-up',r.id,'',i===0)}", "${btn('앞으로','book-up',r.id,'',i===0)}${btn('뒤로','book-down',r.id,'',i===selected.length-1)}");
s=replace(s,"if(recordBank(state).some(x=>x.id===id))state.book.cards.push(id);", "if(recordBank(state).some(x=>x.id===id)){state.book.cards.push(id);if(!state.book.captions[id]){const note=id.startsWith('obs-')||id==='drawing'?state.discovery.note:id==='cycle'?state.cycle.note:id==='greenhouse'?state.recovery.note:'';if(note)state.book.captions[id]=note;}}");
s=s.replaceAll('사진에 내 목소리를 더해 줘','사진에 내 설명을 더해 줘').replaceAll('내가 찾은 증거로 펼치는 이야기','내 관찰 기록으로 책을 만들자').replaceAll('내 증거로 책 만들기','관찰 기록 고르기').replaceAll('네 눈으로 본','모형에서 본').replaceAll('실제로 본 특징','모형에서 본 특징');
s=replace(s,"function recordImage(r){const key=thumbnailKey(r);", "function recordImage(r){const key=thumbnailKey(r);");
s=replace(s,"if(r.id.startsWith('seed-')||r.id==='drawing')prepareThumbnail(r)","if(r.evidence||r.id.startsWith('seed-')||r.id==='drawing')prepareThumbnail(r)");
s=replace(s,"const task=(async()=>{const canvas=", "const task=(async()=>{if(r.evidence){const url=await iq.thumbnail(r);recordThumbnails.set(key,url);document.querySelectorAll('img[data-record-thumb]').forEach(img=>{if(img.dataset.recordThumb===r.id)img.src=url;});return url;}const canvas=");
s=replace(s,"(r.id==='drawing'||r.id.startsWith('seed-'))", "(r.evidence||r.id==='drawing'||r.id.startsWith('seed-'))");
s=replace(s,'${esc(r.caption||r.detail)}</p></figcaption>', '${esc(r.caption||r.detail)}</p>${iq.controls(r)}</figcaption>');
s=replace(s,'${esc(r.detail)}</p></figcaption>', '${esc(r.detail)}</p>${iq.controls(r)}${r.evidence&&!state.book.cards.includes(r.id)?btn("記録整理".replace("記録整理","기록 지우기"),"iq-delete",r.id):""}</figcaption>');
s=replace(s,'image:recordImage(r)}','image:recordImage(r)}');
s=replace(s,"complete(state,n);save();", "if(!complete(state,n))return toast('남은 관찰을 먼저 확인해 줘.');save();");
s=replace(s,"const bank=recordBank(state);return {title", "const bank=recordBank(state);return {title");
s=replace(s,"'움직임 줄이기: '+(state.settings.reducedMotion?'켜짐':'꺼짐')", "'움직임 줄이기: '+(state.settings.reducedMotion?'켜짐':'꺼짐')");
// Keep sensor values visible beside the changed conditions, not only during installation.
s=replace(s,"return `${questionChoice('greenhouse')}<div", "return `${questionChoice('greenhouse')}${iq.sensorReadings()}<div");
s=replace(s,"${['a','b'].map(k=>btn(`${k.toUpperCase()} 화분 예상`,'prediction',kind+':'+k,state[kind].prediction===k?'selected':'')).join('')}","${[['a','A'],['b','B'],['both','둘 다'],['neither','둘 다 아님'],['unsure','아직 모르겠어']].map(([k,t])=>btn(t,'prediction',kind+':'+k,state[kind].prediction===k?'selected':'')).join('')}");
s=replace(s,"function showTeacher(){", "function showTeacher(){");
s=replace(s,'동물의 한살이를 관찰하고 글과 그림으로 표현하기','동물의 한살이를 직접 관찰하고 글과 그림으로 표현하기');
s=replace(s,'<p>기존 버전의 저장 기록은 그대로 보존돼.', '<p>이 앱의 모의 관찰만으로 직접 관찰 성취기준을 완료한 것으로 평가하지 않아. 실제 곤충을 기르며 여러 날 관찰하고 글과 그림으로 남기는 수업을 함께 진행해 줘. 소개 자료는 친구 앞에서 발표하거나 PNG로 저장해 공유할 수 있어. 글자 수는 작성 여부만 확인하며 설명의 정확성은 교사가 살펴봐.</p><p><a href="https://www.goe.go.kr/resource/old/BBSMSTR_000000030136/BBS_202411110127574203.pdf" target="_blank" rel="noopener">교육청 성취기준 원문 · 81~83쪽</a></p><p>기존 버전의 저장 기록은 그대로 보존돼.');
s=replace(s,'<p>활동 도구와 사진은', '<p>확대 그림은 누르거나 방향키로 위치를 정해. 시간 손잡이는 끌거나 양옆 화살표를 눌러 움직여.</p><p>활동 도구와 사진은');
s=replace(s,'탐험 버전 0.2','탐험 버전 0.3');
changes.set('adventure.js',s);
s=await read('index.html');s=replace(s,'initial-scale=1','initial-scale=1, viewport-fit=cover');s=replace(s,'<link rel="stylesheet" href="adventure.css">','<link rel="stylesheet" href="adventure.css">\n  <link rel="stylesheet" href="inquiry.css">');changes.set('index.html',s);
for(const name of ['scripts/build.mjs','server.mjs']){s=await read(name);s=replace(s,"'adventure-export.js'","'adventure-export.js','inquiry-core.js','inquiry-ui.js','inquiry.css'");changes.set(name,s);}
const pkg=JSON.parse(await read('package.json'));pkg.version='0.3.0';pkg.scripts.check+=' && node --check inquiry-core.js && node --check inquiry-ui.js';changes.set('package.json',JSON.stringify(pkg,null,2)+'\n');
const backup=path.join(root,'docs/reviews/before-inquiry-20261016');await mkdir(backup,{recursive:true});
for(const [name,content] of changes){await mkdir(path.dirname(path.join(backup,name)),{recursive:true});await copyFile(path.join(root,name),path.join(backup,name));await writeFile(path.join(root,name),content);}
let ui=await read('inquiry-ui.js');ui=ui.replace("toast('次の春の前に予想してみよう。'.replace('次の春の前に予想してみよう。','次の春'));",'');await writeFile(path.join(root,'inquiry-ui.js'),ui);
console.log('Integrated '+changes.size+' runtime/config files. Backups preserved.');
