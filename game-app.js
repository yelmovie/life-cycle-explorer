import {reducedMotion} from './game-motion.js';
import {openKeyboardDrawing} from './field-observation-scenes.js';
import * as G from './game-model.js';
import {fieldAction,storeFieldDraft,fieldRecords,fieldUnlocked,careTimeLabels} from './field-model.js';
import {FIELD_CHAPTERS,FORM_TRAITS} from './field-content.js';
import {roomPhase,roomUI} from './field-flow.js';
import {applyQuest,questInfo} from './field-quests.js';
import {createFieldGame} from './field-scenes.js';
import {ART,esc} from './game-metadata.js';
import {icon} from './ui-icons.js';
import {renderSettings,renderResetConfirm} from './game-settings.js';
import * as audio from './game-audio.js';
import {recordImage,downloadBlob} from './game-records.js';
import {createDialogs,btn} from './field-dialogs.js';
import {createFieldNotebook} from './field-notebook.js';
import {lightRecoveryLeaves} from './field-record-art.js';
import {VERSION} from './game-info.js';
import {previewFieldForPhase} from './field-preview.js';
import {openConcept} from './field-concepts.js';
import {COMPANION_ART,companionHint,stageProgress,hintTarget} from './field-companion.js';

const storage={getItem(key){return window.localStorage.getItem(key);},setItem(key,value){window.localStorage.setItem(key,value);}};
const TEACHER_SESSION_KEY='life-clock-lab.teacher-preview.1';
let s=G.loadGame(storage),previewOriginal=null,focusItems=[];
const ui={selection:null,recordPage:0,play:false,guide:false,message:'',pending:false,hintLevel:0,restoreChapter:null,travelChapter:null};
let mediaCleanup=null,dialogFocus=null,statusTimer=null;
const app=document.querySelector('#app'),modal=document.querySelector('#modal'),$=id=>document.getElementById(id),mode=()=>s.fieldView||'title';
const ib=(name,label,action)=>btn(icon(name),action,`aria-label="${label}" title="${label}"`,'icon-button');
const titleScreen=`<section id="title-screen" aria-label="생명 시계 연구실 시작 화면">
 <div class="title-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
 <div class="title-copy">
  <p class="title-kicker"><span></span>지훈·잎새·도토와 함께하는 숲속 탐험</p>
  <h1 class="title-wordmark"><span class="sr-only">생명 시계 연구실</span><img class="title-logo" src="assets/field/title-logo-v1.webp" alt="" width="1200" height="668" fetchpriority="high" decoding="async" draggable="false"></h1>
  <p class="title-hook">작은 씨앗이 숲을 깨울 수 있을까?</p>
  <p class="title-description">나비의 변신부터 씨앗의 첫 새싹까지.<br>네가 찾은 생명의 비밀로 숲의 시간을 이어 줘.</p>
  <div class="title-actions">${btn('<span>탐험 시작</span>'+icon('right'),'start','','primary title-start')}${btn('이어서 탐험','continue','','title-continue')}</div>
  <p class="title-reward">${icon('book')}<span>탐험 끝에는 네 발견이 담긴 기록책이 기다려.</span></p>
 </div>
 <div class="title-character-glow" aria-hidden="true"></div>
 <img class="title-jihoon" src="${ART.guideStory}" alt="기록책을 들고 숲으로 안내하는 지훈" draggable="false">
 <img class="title-spirit" src="${ART.ipsae}" alt="숲의 친구 잎새" draggable="false">
 <img class="title-doto" src="${COMPANION_ART}" alt="함께 탐험하는 다람쥐 도토" draggable="false">
</section>`;
app.innerHTML=`<header class="game-header"><nav class="screen-nav" aria-label="화면 도구"><div class="nav-left">${ib('home','처음으로','home')}${ib('back','이전 화면','back')}</div><div id="scene-title"></div><div class="nav-right">${ib('sound','소리 끄기','sound')}${ib('settings','설정','settings')}</div></nav><h1 id="objective"></h1></header><main id="stage"><div id="phaser-root"></div><div id="map-doors"></div><div id="focus-targets"></div></main><footer class="game-footer"><div id="status" role="status" aria-live="polite"></div><div id="guide-bubble" hidden></div><button id="guide" data-action="guide" aria-label="지훈이의 도움 보기"><img alt="" src="${ART.guideLook}"><span>…</span></button><div id="controls"></div><button id="next" class="primary" data-action="next"></button></footer>${titleScreen}<div class="portrait" role="status">화면을 가로로 돌리면 숲을 더 넓게 볼 수 있어.</div><div class="boot">숲의 시간을 펼치는 중…</div>`;
// Keep only the teacher's mode/location in this tab. Student answers stay in
// their existing storage; demonstration answers are rebuilt from sample data.
function rememberTeacherPreview(){
 try{if(!previewOriginal){sessionStorage.removeItem(TEACHER_SESSION_KEY);return;}sessionStorage.setItem(TEACHER_SESSION_KEY,JSON.stringify({view:mode(),chapter:s.field.active,phase:roomPhase(s.field)}));}catch{}
}
function restoreTeacherPreview(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(TEACHER_SESSION_KEY));}catch{return;}
 if(!saved||!Number.isInteger(saved.chapter)||saved.chapter<0||saved.chapter>4||!['title','map','room'].includes(saved.view))return;
 const phase=stageProgress(saved.chapter,saved.phase,true).phase;
 if(saved.view==='room'&&phase!==saved.phase)return;
 previewOriginal=s;s=structuredClone(s);s.field.preview=true;
 if(saved.view==='room')s.field=previewFieldForPhase(s.field,saved.chapter,phase);
 s.fieldView=saved.view;
}
function saveIssue(){const reason=G.getSaveStatus(storage).reason;return reason==='conflict'?'다른 창에서 기록이 바뀌어 덮어쓰기를 멈췄어. 기록함에서 지금 활동을 보관한 뒤 새로고침해 줘.':['invalid-json','invalid-structure','unsupported-version'].includes(reason)?'저장된 기록을 읽지 못해서 원본을 보호하고 있어. 기록함에서 기존 원본과 지금 활동을 따로 보관할 수 있어.':'기기에 저장하지 못했어. 기록함에서 지금까지의 활동을 파일로 보관해 줘.';}
function persist(){if(previewOriginal){previewOriginal.audio={...s.audio};return true;}const ok=G.saveGame(storage,s);if(!ok){ui.message=saveIssue();ui.pending=true;$('status').textContent=ui.message;$('status').classList.add('visible');}return ok;}
function announce(message,error=false){ui.message=message;ui.pending=error;$('status').textContent=message;$('status').classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').classList.remove('visible'),3400);audio.playSfx(error?'error':'place');updateGuide();}
function hint(){
 if(mode()==='map'){const n=[0,1,2,3,4].find(c=>!s.field.completed.includes(c));return n===undefined?'다섯 장소의 시간이 이어졌어. 다시 걸어가 기록을 더 살펴보자.':FIELD_CHAPTERS[n].title+'로 가 보자. 장소나 길을 누르면 내가 길을 따라 걸어갈게.';}
 return FIELD_CHAPTERS[s.field.active].start;
}
function syncOrientationFocus(){
 const portrait=innerHeight>innerWidth,notice=modal.querySelector('.modal-portrait');
 if(modal.open&&portrait&&notice){if(document.activeElement!==notice){ui.rotationFocus=document.activeElement;notice.focus({preventScroll:true});}}
 else if(!portrait&&ui.rotationFocus?.isConnected){ui.rotationFocus.focus({preventScroll:true});ui.rotationFocus=null;}
}
function closeGuide(){ui.guide=false;updateGuide();const target=ui.hintReturn?.isConnected?ui.hintReturn:$('guide');target.focus({preventScroll:true});ui.hintReturn=null;}
function updateGuide(){
 const focused=$('guide-bubble').contains(document.activeElement)?document.activeElement.dataset.action:null;
 $('guide').querySelector('img').src=COMPANION_ART;$('guide').querySelector('span').textContent=ui.pending?'도토 !':'도토 힌트';$('guide').setAttribute('aria-label','다람쥐 도토의 힌트');$('guide').setAttribute('aria-controls','guide-bubble');$('guide-bubble').hidden=!ui.guide;
 const text=mode()==='room'?(roomPhase(s.field)==='discovery'?questInfo(s.field).objective:companionHint(roomPhase(s.field),ui.hintLevel)):hint();
 $('guide-bubble').innerHTML=`<p id="guide-text">${esc(text)}</p><div class="row">${btn('위치 보기','hint-point')}${btn('다음 단서','hint-more')}${btn('닫기','hint-close','aria-label="도토 도움말 닫기"')}</div>`;$('guide').setAttribute('aria-expanded',String(ui.guide));
 if(focused)$('guide-bubble').querySelector(`[data-action="${focused}"]`)?.focus({preventScroll:true});
}

function view(next){audio.setMusicTheme('main');s.fieldView=next;Object.assign(ui,{selection:null,guide:false,message:'',play:false,travelChapter:null});persist();render();ctx.scene?.refresh();}
function rangeControl(){const c=s.field.active,q=s.field.chapters[c],p=roomPhase(s.field);let value,max,label,type;
 if(c===1&&p==='grow'){value=q.rounds[q.round].day;max=7;label='씨앗 관찰 날짜';type='seed-day';}
 if(c===2&&p==='care-after'){value=q.cases[q.case].day;max=2;label='돌봄 뒤 시간';type='care-day';}
 if(c===3&&p==='seasons'){value=q.season;max=4;label='식물 관찰 계절';type='season';}
 if(c===3&&p==='animals')return `<div class="row time-sliders">${['butterfly','dog'].map(a=>`<label>${a==='butterfly'?'나비':'개'}<input type="range" data-time="animal-time" data-animal="${a}" aria-label="${a==='butterfly'?'나비':'개'}의 시간" min="0" max="${a==='butterfly'?3:2}" value="${q.animals[a].step}"></label>`).join('')}</div>`;
 return type?`<label class="time-slider">${label}<input type="range" data-time="${type}" min="0" max="${max}" value="${value}" aria-label="${label}"></label>`:'';
}
function timeStops(){const p=roomPhase(s.field),q=s.field.chapters[s.field.active];
 const stops=p==='grow'?[[0,'0일'],[3,'중간'],[7,'마지막']]:p==='care-after'?careTimeLabels(q.cases[q.case]).map((label,n)=>[n,label]):p==='seasons'?[[0,'첫봄'],[1,'여름'],[2,'가을'],[3,'겨울'],[4,'다음 봄']]:[];
 const type=p==='grow'?'seed-day':p==='care-after'?'care-day':'season',value=p==='grow'?q.rounds[q.round].day:p==='care-after'?q.cases[q.case].day:q.season;
 return stops.length?`<div class="time-stops" aria-label="시간 바로 이동">${stops.map(([n,label])=>{const recorded=p==='grow'?q.rounds[q.round].photos.some(d=>n===0?d===0:n===3?d>=2&&d<=4:d>=6):p==='care-after'?q.cases[q.case].photos.includes(n):['apple-'+n,'balsam-'+n].every(id=>q.plantPhotos.includes(id));return btn((recorded?'✓ ':'')+label,'time-stop',`data-type="${type}" data-value="${n}" aria-pressed="${n===value}"`);}).join('')}${p==='care-after'&&value===2?btn('전후 비교','care-compare'):''}</div>`:'';
}
function render(){rememberTeacherPreview();const m=mode(),room=m==='room';app.dataset.view=m;$('title-screen').hidden=m!=='title';for(const id of ['objective','guide','next','controls'])$(id).hidden=m==='title';$('scene-title').textContent=m==='title'?'':(previewOriginal?'교사 시연 · ':'')+(room?FIELD_CHAPTERS[s.field.active].title+' → '+FIELD_CHAPTERS[s.field.active].reward:'생명의 숲');$('map-doors').hidden=m!=='map';$('focus-targets').hidden=!room;
 $('title-screen').querySelector('[data-action=continue]').hidden=!s.field.completed.length&&!Object.values(s.field.chapters[0].inspected).some(a=>a.length);
 if(room){const info=roomUI(s,ui),progress=stageProgress(s.field.active,info.phase,!!previewOriginal);$('scene-title').innerHTML=esc((previewOriginal?'교사 시연 · ':'')+FIELD_CHAPTERS[s.field.active].title)+`<span class="progress-rail" aria-label="${progress.label}, ${Math.min(progress.index+1,progress.total)} / ${progress.total}">${progress.html}</span><span>${progress.label}</span>`;$('objective').textContent=info.objective;$('controls').innerHTML=`<div class="field-menu">${info.controls}${info.phase==='ready'?btn('(선택) 개념 영상','concept'):''}</div>`+`<div class="time-tools">${rangeControl()}${timeStops()}</div>`;$('next').textContent=previewOriginal?(progress.nextPhase?'다음 활동으로 건너뛰기':s.field.active<4?'다음 구역 시연':'시연 마치고 지도'):(info.nextAction==='hint'?'다음 할 일 보기':info.next);}
 if(m==='map'){
  const c=[0,1,2,3,4].find(i=>!s.field.completed.includes(i)),travelling=Number.isInteger(ui.travelChapter);
  $('objective').textContent=travelling?FIELD_CHAPTERS[ui.travelChapter].title+' 가는 길을 따라 걷는 중이야.':c===undefined?'숲의 시간이 다시 흐르기 시작했어!':FIELD_CHAPTERS[c].question;
  $('controls').innerHTML=`<div class="row direction-pad">${[['left','왼쪽',-1,0],['up','위',0,-1],['down','아래',0,1],['right','오른쪽',1,0]].map(([i,l,x,y])=>btn(icon(i),'step',`data-x="${x}" data-y="${y}" aria-label="${l} 길로 걷기"`)).join('')}</div>`;
  $('next').textContent=travelling?'길을 따라 가는 중…':c===undefined?'내 이야기 보기':FIELD_CHAPTERS[c].title+' 가기';
  $('map-doors').innerHTML=FIELD_CHAPTERS.map((ch,i)=>`<button class="map-door ${s.field.completed.includes(i)?'done':fieldUnlocked(s.field,i)?'':'locked'}" data-action="door" data-chapter="${i}" aria-label="${ch.title}${fieldUnlocked(s.field,i)?' 입장하기':' · 앞 탐사 뒤 열림'}">${s.field.completed.includes(i)?icon('check'):fieldUnlocked(s.field,i)?'':icon('lock')}${ch.title}</button>`).join('');
 }
 $('next').disabled=m==='map'&&Number.isInteger(ui.travelChapter);
 const b=app.querySelector('[data-action=sound]'),on=s.audio.bgm||s.audio.sfx;b.innerHTML=icon(on?'sound':'mute');b.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');b.setAttribute('aria-pressed',String(on));updateGuide();}
function coordinates(item){const canvas=document.querySelector('canvas');if(!canvas)return null;const a=canvas.getBoundingClientRect(),b=$('stage').getBoundingClientRect(),size=ctx.scene?.scale?.gameSize,p=ctx.scene?.projectWorld?.(item)||item,sx=a.width/(size?.width||1280),sy=a.height/(size?.height||800);return {left:a.left-b.left+p.x*sx,top:a.top-b.top+p.y*sy,w:p.w*sx,h:p.h*sy};}
function focusTargets(items){focusItems=items;$('focus-targets').replaceChildren();items.forEach(item=>{const b=document.createElement('button');b.className='focus-target';b.setAttribute('aria-label',item.label);b.addEventListener('click',item.fn);$('focus-targets').append(b);});positionFocus();}
function positionFocus(){[...$('focus-targets').children].forEach((b,i)=>{const p=coordinates(focusItems[i]);if(p)Object.assign(b.style,{left:p.left+'px',top:p.top+'px',width:Math.max(48,p.w)+'px',height:Math.max(48,p.h)+'px'});});}
let layoutFrame=0;
function syncLayout(){
 cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(()=>{
  const header=app.querySelector('.game-header'),footer=app.querySelector('.game-footer'),host=$('phaser-root');
  app.style.setProperty('--header-height',header.offsetHeight+'px');app.style.setProperty('--footer-height',footer.offsetHeight+'px');app.style.setProperty('--footer-top',footer.offsetTop+'px');
  const scale=ctx.scene?.game?.scale,width=Math.round(host.clientWidth),height=Math.round(host.clientHeight);
  if(scale&&width>0&&height>0&&(scale.gameSize.width!==width||scale.gameSize.height!==height))scale.setParentSize(width,height);
  else ctx.scene?.syncInsets?.();
  positionFocus();
 });
}
const layoutObserver=new ResizeObserver(syncLayout);for(const element of [app,$('phaser-root'),app.querySelector('.game-header'),app.querySelector('.game-footer'),$('guide-bubble')])layoutObserver.observe(element);
function positionDoors(items){
 if(mode()!=='map')return;const stage=$('stage'),width=stage.clientWidth,area=stage.getBoundingClientRect(),gap=12;
 // Keep doors between the floating header and footer.
 const top=Math.max(0,app.querySelector('.game-header').getBoundingClientRect().bottom-area.top),height=Math.min(stage.clientHeight,app.querySelector('.game-footer').getBoundingClientRect().top-area.top)-top;
 const boxes=items.map(item=>{const button=$('map-doors').querySelector(`[data-chapter="${item.chapter}"]`),p=coordinates({...item,w:0,h:0});if(!button||!p)return null;const rect=button.getBoundingClientRect();return {button,x:p.left,y:p.top,w:rect.width,h:rect.height};}).filter(Boolean).sort((a,b)=>a.y-b.y);
 const clamp=box=>{box.x=Math.max(gap+box.w/2,Math.min(width-gap-box.w/2,box.x));box.y=Math.max(top+gap+box.h/2,Math.min(top+height-gap-box.h/2,box.y));};
 for(const box of boxes)clamp(box);
 for(let pass=0;pass<5;pass++)for(let i=1;i<boxes.length;i++)for(let j=0;j<i;j++){
  const a=boxes[j],b=boxes[i];if(Math.abs(a.x-b.x)>=(a.w+b.w)/2+gap||Math.abs(a.y-b.y)>=(a.h+b.h)/2+gap)continue;
  const below=a.y+(a.h+b.h)/2+gap;b.y=below+b.h/2+gap<=top+height?below:a.y-(a.h+b.h)/2-gap;clamp(b);
 }
 for(const box of boxes)Object.assign(box.button.style,{left:box.x+'px',top:box.y+'px'});
}
function dialog({title,body,actions=btn('계속 탐험','close','','primary'),className='',music='main',values={}}){mediaCleanup?.();mediaCleanup=null;modal.dispatchEvent(new Event('modal-dismiss'));audio.setMusicTheme(music);if(!modal.open)dialogFocus=document.activeElement;if(mode()==='map'){ctx.scene?.cancelTravel();ui.travelChapter=null;render();}modal.className=className;modal.setAttribute('aria-labelledby','dialog-title');modal.innerHTML=`<h2 id="dialog-title">${esc(title)}</h2><button class="close icon-button" data-action="close" aria-label="닫기">${icon('close')}</button><div class="modal-portrait" tabindex="-1" role="status">화면을 가로로 돌리면 작성 중인 내용을 이어 갈 수 있어.</div><div class="modal-body">${body}</div><div class="dialog-actions">${actions}</div>`;for(const[id,value]of Object.entries(values)){const input=modal.querySelector('#'+id);if(input)input.value=value;}if(!modal.open)modal.showModal();syncOrientationFocus();if(ctx.scene)ctx.scene.input.enabled=false;modal.querySelector('.modal-body').scrollTop=0;modal.querySelector('[autofocus]')?.focus();}
modal.addEventListener('close',()=>{if(modal.open)return;mediaCleanup?.();mediaCleanup=null;if(ctx.scene)ctx.scene.input.enabled=true;audio.setMusicTheme('main');audio.resumeAudio();if(Number.isInteger(ui.pendingRestoreChapter)&&mode()==='map'){ui.restoreChapter=ui.pendingRestoreChapter;ui.pendingRestoreChapter=null;ctx.scene?.refresh();}if(dialogFocus?.isConnected)dialogFocus.focus({preventScroll:true});else if(mode()==='room')$('next')?.focus({preventScroll:true});});
function concept(chapter=s.field.active,finish=false,returnToList=false){mediaCleanup=openConcept({chapter,dialog,modal,audio,reduced:reducedMotion(s.settings),returnToList,finishLabel:returnToList?'영상 목록으로':undefined,onFinish:()=>{if(returnToList)dialogs.concepts();else if(finish&&chapter===4)dialogs.ending();}});}
function settings(){dialog(renderSettings({audio:s.audio,completed:s.field.completed,teacherPreview:!!previewOriginal,version:VERSION,audioAvailable:audio.isAudioAvailable()}));}
function lockedDoor(chapter){
 const first=[0,1,2,3,4].find(i=>!s.field.completed.includes(i))??0,previous=FIELD_CHAPTERS[first];
 dialog({title:'앞 탐사를 먼저 마쳐 줘.',body:`<p>${FIELD_CHAPTERS[chapter].title}에 들어가려면 앞 탐사를 먼저 끝내야 해.</p><p>먼저 ${previous.title}에서 탐사를 마치고 ${previous.reward}를 받아 줘. 구역을 순서대로 탐사하면 다음 길이 열려.</p>`,actions:btn('닫기','close')+btn(previous.title+' 가기','door-next',`data-chapter="${first}"`,'primary')});
}
function requestDoor(chapter){
 if(!Number.isInteger(chapter)||chapter<0||chapter>4||mode()!=='map')return;
 if(!fieldUnlocked(s.field,chapter)){lockedDoor(chapter);return;}
 if(previewOriginal){s.field=previewFieldForPhase(s.field,chapter,stageProgress(chapter,'',true).firstPhase);view('room');return;}
 ctx.scene?.walkDoor(chapter);
}
function act(type,payload={}){const before=roomPhase(s.field),result=type==='quest-answer'?applyQuest(s.field,payload):fieldAction(s.field,type,payload);ui.selection=null;announce(result.message,!result.ok);if(result.ok)audio.playSfx(type.includes('photo')?'photo':type==='inspect'?'inspect':roomPhase(s.field)!==before?'success':['seed-day','care-day','season','animal-time'].includes(type)?'time':'place');if(result.ok&&type==='inspect')ui.message=FORM_TRAITS[payload.form][payload.spot];if(result.ok&&roomPhase(s.field)!==before)Object.assign(ui,{guide:false,message:'',pending:false,recordPage:0,hintLevel:0});persist();render();ctx.scene?.refresh();if(result.ok&&type==='inspect')notebook.observe(payload.form,payload.spot);if(result.ok&&/^(seed|care|animal|season)-photo$/.test(type))notebook.capture(type,payload);return result;}
function drop(data){const {kind,target}=data,q=s.field.chapters[s.field.active];let type,p={};
 if(kind==='film'&&target.startsWith('film-')){type='film-move';p={from:data.from,to:Number(target.slice(5))};}
 else if(kind==='generation'){type='generation';p={target};}
 else if(['soil','seed'].includes(kind)&&target.startsWith('pot-')){const side=target.slice(4),prep=q.rounds[q.round].prepared[side];type='seed-prepare';p=kind==='soil'?{side,soil:true}:{side,seeds:Math.min(3,prep.seeds+1)};}
 else if(kind==='seed-condition'&&target==='pot-b'){type='seed-condition';p={key:data.key,side:'b'};}
 else if(kind==='seed-reason'&&target==='reason'){type='seed-report';p={reason:data.reason};}
 else if(kind==='sensor'&&target==='plant'){type='care-measure';p={sensor:data.sensor};}
 else if(kind==='symptom'&&['dry','pale'].includes(target)){type='care-pin';p={symptom:target};}
 else if(kind==='care-tool'&&target==='plant'){type='care-tool';p={tool:data.tool};}
 else if(kind==='birth'&&target.startsWith('birth-')){type='animal-generation';p={answer:target.slice(6)};}
 else if(kind==='tag'&&target==='plant-'+data.plant){type='plant-tag';p={plant:data.plant};}
 else if(kind==='identity'&&target.startsWith('plant-')){type='plant-classify';p={plant:target.slice(6),answer:data.answer};}
 else if(kind==='transfer'&&target==='transfer'){type='transfer';p={subject:data.subject,answer:data.answer};}
 else if(kind==='record'&&(target==='story'||target.startsWith('book-'))){type='book-record';p={id:data.id};}
 else if(kind==='record'&&target.startsWith('help-')){type='help-match';p={request:target.slice(5),recordId:data.id};}
 else if(kind==='book'&&target.startsWith('book-')){type='book-move';p={from:data.from,to:Number(target.slice(5))};}
 if(type)act(type,p);else{announce(kind==='seed-condition'?'A는 그대로 두고 B에서 조건 하나를 바꿔 보자.':'도구를 알맞은 연결 자리에 놓아 줘.',true);ctx.scene?.refresh();}}
const ctx={get s(){return s;},saveStatus:()=>G.getSaveStatus(storage),saveDraft(scope,values){if(storeFieldDraft(s.field,scope,values))persist();},ui,mode,dialog,announce,modalOpen:()=>modal.open,recordImage,focusTargets,sceneReady:positionFocus,placeDoors:positionDoors,emit(type,data){
 if(type==='assets-loading'){let cover=app.querySelector('.boot');if(!cover){cover=document.createElement('div');cover.className='boot';cover.setAttribute('role','status');app.append(cover);}cover.innerHTML=`<img src="${ART.dotoMap}" alt="" width="240" height="242"><p>탐사 그림을 불러오는 중…</p><span class="boot-bar"><i></i></span>`;$('next').disabled=true;return;}
 if(type==='assets-progress'){const progress=Math.round(data.progress*100),cover=app.querySelector('.boot');if(cover?.querySelector('p')){cover.querySelector('p').textContent='탐사 그림을 불러오는 중… '+progress+'%';cover.querySelector('.boot-bar i').style.width=progress+'%';}window.dispatchEvent(new CustomEvent('life-clock-progress',{detail:{progress}}));return;}
 if(type==='loaded'){app.querySelector('.boot')?.remove();render();window.dispatchEvent(new Event('life-clock-ready'));return;}
 if(type==='assets-unavailable'){dialog({title:'탐사 그림을 불러오지 못했어.',className:'asset-error',body:'<p>연결을 확인하고 다시 눌러 줘. 지금까지의 탐구 기록은 그대로 남아 있어.</p>',actions:btn('숲으로 돌아가기','asset-map')+btn('그림 다시 불러오기','retry-assets','','primary')});$('next').textContent='그림 다시 불러오기';return;}
 if(type==='map-step'){persist();return;}if(type==='footstep'){audio.playSfx('step');return;}
 if(type==='travel-start'){ui.travelChapter=data;ui.guide=false;render();return;}
 if(type==='arrived'){ui.travelChapter=null;if(fieldUnlocked(s.field,data)){fieldAction(s.field,'chapter-enter',{chapter:data});view('room');}else{render();lockedDoor(data);}return;}
 if(type==='select'){ui.selection=data;audio.playSfx('select');$('status').textContent='도구를 골랐어. 이름이 표시된 자리를 눌러 적용하거나 끌어 놓아 줘.';$('status').classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').classList.remove('visible'),2200);ctx.scene?.showDropTargets?.();return;}if(type==='target'){if(ui.selection)drop({...ui.selection,target:data});else announce('먼저 옮길 도구나 사진을 고른 다음, 이 자리를 눌러 줘.',true);return;}if(type==='drop'){drop(data);return;}if(type==='act'){act(data.type,data.payload);return;}
 if(type==='observe'){act('inspect',data);return;}if(type==='dial'){if(ui.dial)act(ui.dial.type,{...ui.dial.payload,...(ui.dial.type==='season'?{step:data}:{day:data})});return;}if(type.startsWith('animal-dial-')){act('animal-time',{animal:type.slice(12),step:data});return;}if(type==='caption'){dialogs.caption(data);return;}if(type==='feedback')announce(data,true);
}};
const dialogs=createDialogs(ctx);
const notebook=createFieldNotebook({get s(){return s;},dialog,close:()=>modal.close()});
function action(name,b){void audio.initAudio(s.audio);audio.playSfx('click');
 if(name==='retry-assets'||name==='next'&&ctx.scene?.assetFailure){if(modal.open)modal.close();ctx.scene?.retryAssets();return;}
 if(name==='asset-map'){modal.close();view('map');return;}
 if(['start','intro'].includes(name)){dialogs.opening();return;}if(name==='continue'){view(s.fieldView==='title'?'map':s.fieldView);return;}if(name==='begin'){modal.close();view('map');return;}if(name==='home'){view('title');return;}if(name==='back'){if(modal.open)modal.close();else view(mode()==='room'?'map':'title');return;}
 if(name==='settings'){settings();return;}if(name==='close'){modal.close();return;}if(name==='concept'){concept(Number(b.dataset.chapter??s.field.active));return;}
 if(name==='concept-list'){dialogs.concepts();return;}
 if(name==='concept-select'){const c=Number(b.dataset.chapter);if(previewOriginal||s.field.completed.includes(c))concept(c,false,true);return;}
 if(name==='reward-continue'){modal.close();if(Number(b.dataset.chapter)===4)dialogs.ending();return;}
 if(name==='reward-concept'){const c=Number(b.dataset.chapter);if(s.field.completed.includes(c))concept(c,true);return;}
 if(name==='time-stop'){act(b.dataset.type,b.dataset.type==='season'?{step:Number(b.dataset.value)}:{day:Number(b.dataset.value)});return;}
 if(name==='care-compare'){const r=s.field.chapters[2].cases[s.field.chapters[2].case];dialog({title:'돌봄 전후를 밀어서 비교해 봐',className:'compare-dialog',body:`<div class="care-comparison"><img src="${ART[r.variable==='light'?'pale':'pot3']}" alt="돌봄 후 관찰 모형">${r.variable==='light'?'<svg class="recovery-new-leaves" viewBox="0 0 310 310" role="img" aria-label="기존 긴 줄기 끝에 새로 자란 초록 잎">'+lightRecoveryLeaves(0,0,310)+'</svg>':''}<div id="care-before-image"><img src="${ART[r.variable==='water'?'dry':'pale']}" alt="돌봄 전 모습"></div><span class="compare-before-label">돌봄 전</span><span class="compare-after-label">${careTimeLabels(r)[2]} 모형</span><div id="compare-divider"></div></div><label>비교 손잡이<input id="care-wipe" type="range" min="0" max="100" value="50" aria-label="돌봄 전후 비교 손잡이"></label><p class="small">실제 회복 시간은 식물과 환경에 따라 달라.</p>`});return;}
 if(name==='hint-more'){ui.message='';ui.hintLevel=Math.min(1,ui.hintLevel+1);updateGuide();return;}if(name==='hint-point'){ctx.scene?.showHint?.(hintTarget(roomPhase(s.field)));return;}
 if(name==='sound'){const on=s.audio.bgm||s.audio.sfx;if(on){ui.previousAudio={...s.audio};s.audio.bgm=false;s.audio.sfx=false;}else s.audio=ui.previousAudio||{...s.audio,sfx:true};audio.updateAudio(s.audio);persist();render();return;}
 if(name==='audio-bgm'||name==='audio-sfx'){const k=name==='audio-bgm'?'bgm':'sfx';s.audio[k]=!s.audio[k];audio.updateAudio(s.audio);persist();render();settings();return;}
 if(name==='guide'){if(ui.guide){closeGuide();return;}ui.hintReturn=b;ui.guide=true;if(!ui.pending)ui.message='';ui.pending=false;updateGuide();return;}if(name==='hint-close'){closeGuide();return;}if(name==='door'||name==='door-next'){if(name==='door-next')modal.close();requestDoor(Number(b.dataset.chapter));return;}if(name==='step'){ctx.scene?.step(Number(b.dataset.x),Number(b.dataset.y));return;}
 if(name==='next'){if(mode()==='map'){const c=[0,1,2,3,4].find(i=>!s.field.completed.includes(i));if(c===undefined)dialogs.story();else requestDoor(c);return;}if(previewOriginal){const chapter=s.field.active,phase=stageProgress(chapter,roomPhase(s.field),true).nextPhase;if(phase){s.field=previewFieldForPhase(s.field,chapter,phase);Object.assign(ui,{selection:null,play:false,guide:false,message:''});render();ctx.scene.refresh();}else if(chapter<4){s.field=previewFieldForPhase(s.field,chapter+1,stageProgress(chapter+1,'',true).firstPhase);view('room');}else view('map');return;}const next=roomUI(s,ui).nextAction;if(next==='complete'){const c=s.field.active;if(act('chapter-complete',{chapter:c}).ok){ui.pendingRestoreChapter=c;view('map');audio.playSfx('reward');dialogs.reward(c);}return;}if(next==='hint'){ui.hintReturn=b;ui.message='';ui.guide=true;updateGuide();ctx.scene?.showHint?.(hintTarget(roomPhase(s.field)));return;}if(next==='plan'){dialogs.plan();return;}act(next);return;}
 if(name==='keyboard-drawing'){openKeyboardDrawing(ctx);return;}if(name==='clear-drawing'){s.field.chapters[0].drawing=[];persist();ctx.scene.refresh();return;}if(name==='film-play'){ui.play=!ui.play;render();ctx.scene.refresh();return;}if(name==='cross-section'){ui.crossSection=!ui.crossSection;ctx.scene.refresh();return;}if(name==='record-page'){ui.recordPage+=Number(JSON.parse(b.dataset.payload||'{}').delta)||0;ctx.scene.refresh();return;}
 if(name==='save-note'){act('observation-note',{text:$('observation-note').value});modal.close();return;}if(name==='predict'){act('seed-predict',{choice:b.dataset.choice});modal.close();return;}if(name==='save-story'){const title=$('story-title').value,summary=$('story-summary').value;act('book-title',{text:title});act('book-summary',{text:summary});modal.close();return;}
 if(name==='save-caption'){act('book-caption',{id:$('caption-record').value,text:$('story-caption').value});modal.close();return;}if(name==='remove-record'){act('book-record',{id:$('caption-record').value});modal.close();return;}
 if(name==='save-plan'){const result=act('observation-plan',{subject:$('plan-subject').value,when:$('plan-when').value,what:$('plan-what').value});if(result.ok)modal.close();return;}
 if(name==='original-backup'){const saved=G.getSaveStatus(storage);if(saved.raw!==null){downloadBlob(new Blob([saved.raw],{type:'text/plain;charset=utf-8'}),'생명시계-저장원본.txt');}return;}
 if(name==='record'){void dialogs.record(b.dataset.id);return;}if(name==='archive-page'){ui.archivePage=(ui.archivePage||0)+Number(b.dataset.delta);dialogs.records();return;}if(name==='backup'){downloadBlob(new Blob([JSON.stringify(previewOriginal||s,null,2)],{type:'application/json'}),'생명시계-진행기록.json');return;}
 if(name==='teacher-preview'){if(!previewOriginal){previewOriginal=s;s=structuredClone(s);s.field.preview=true;modal.close();view('map');announce('교사 시연을 켰어. 모든 구역과 활동 단계를 고를 수 있어.');}else{const prefs=s.audio;s=previewOriginal;s.audio=prefs;previewOriginal=null;persist();render();ctx.scene.refresh();settings();}return;}
 if(name==='reset'){ui.resetSnapshot=G.getSaveStatus(storage).expectedRaw;dialog(renderResetConfirm());return;}if(name==='reset-confirm'){const next=G.fresh();next.audio={...s.audio};if(previewOriginal){next.field.preview=true;s=next;persist();}else if(G.resetGame(storage,next,ui.resetSnapshot)){s=next;}else{announce(saveIssue(),true);dialog({title:'기록을 지우지 않았어',body:'<p>확인하는 동안 저장된 기록이 바뀌었거나 저장소를 사용할 수 없어. 원본을 그대로 두었어. 기록함에서 현재 활동을 먼저 보관해 줘.</p>',actions:btn('기록함 열기','records')+btn('닫기','close','','primary')});return;}ui.resetSnapshot=null;modal.close();view('title');return;}
 if(name==='story-auto'){ui.storyAuto?.();return;}if(name==='story-prev'||name==='story-next'){ui.storyStep?.(name==='story-next'?1:-1);return;}
 if(name==='export'){void dialogs.export(b.dataset.bookSource==='finished');return;}
 const map={note:'note',prediction:'prediction','story-info':'storyInfo','story-caption':'caption',plan:'plan',records:'records',bag:'bag',ending:'ending',certificate:'certificate','certificate-png':'certificatePNG','story-play':'story'};if(map[name]){void dialogs[map[name]]();return;}act(name,b.dataset.payload?JSON.parse(b.dataset.payload):{});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.classList.contains('focus-target'))return;const name=b.dataset.action||b.dataset.fieldAction;if(name)void action(name,b);});
document.addEventListener('input',e=>{
 const el=e.target;let scope,values;
 if(el.id==='story-caption'){scope='caption';values={id:el.dataset.recordId,text:el.value};}
 else if(el.id==='observation-note'){scope='observation';values={text:el.value};}
 else if(['story-title','story-summary'].includes(el.id)){scope='story';values={[el.id.slice(6)]:el.value};}
 else if(['plan-subject','plan-when','plan-what'].includes(el.id)){scope='plan';values={[el.id.slice(5)]:el.value};}
 if(scope){ctx.saveDraft(scope,values);const status=modal.querySelector('[data-draft-status]');if(status)status.textContent='초안 보관됨 · 제출은 「설명 기록」을 눌러 줘.';}
});
document.addEventListener('change',e=>{const b=e.target;if(b.matches('[data-preview-phase]')&&previewOriginal){s.field=previewFieldForPhase(s.field,s.field.active,b.value);Object.assign(ui,{selection:null,play:false,guide:false});render();ctx.scene.refresh();return;}if(b.dataset.time)act(b.dataset.time,b.dataset.time==='animal-time'?{animal:b.dataset.animal,step:Number(b.value)}:b.dataset.time==='season'?{step:Number(b.value)}:{day:Number(b.value)});});
document.addEventListener('input',e=>{if(e.target.id==='bgm-volume'){s.audio.volume=Number(e.target.value)/100;audio.updateAudio(s.audio);$('bgm-volume-value').textContent=e.target.value+'%';persist();}if(e.target.id==='care-wipe'){modal.querySelector('#care-before-image').style.clipPath=`inset(0 ${100-e.target.value}% 0 0)`;modal.querySelector('#compare-divider').style.left=e.target.value+'%';}});
modal.addEventListener('toggle',e=>{const detail=e.target;if(detail instanceof HTMLDetailsElement&&detail.open&&detail.classList.contains('settings-section')){for(const sibling of detail.parentElement.children)if(sibling!==detail&&sibling instanceof HTMLDetailsElement)sibling.open=false;}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.guide&&!modal.open){e.preventDefault();e.stopPropagation();closeGuide();}});
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
motionPreference.addEventListener('change',()=>{
 if(reducedMotion(s.settings)){ui.play=false;ui.storyStop?.();document.querySelector('#concept-video')?.pause();document.querySelectorAll('[data-handwriting]').forEach(el=>{el.classList.remove('writing');el.textContent=el.dataset.handwriting;});}
 const travel=ui.travelChapter;ctx.scene?.refresh();if(Number.isInteger(travel)&&mode()==='map')ctx.scene?.walkDoor(travel);
});
document.addEventListener('pointerdown',()=>void audio.initAudio(s.audio),{once:true});window.addEventListener('resize',()=>{positionFocus();app.classList.toggle('portrait-display',innerHeight>innerWidth);syncOrientationFocus();});window.addEventListener('pagehide',persist);
window.addEventListener('online',()=>{if(!ctx.scene?.failed?.size)return;if(modal.classList.contains('asset-error')&&modal.open)modal.close();ctx.scene.retryAssets();});
// Phaser's window listeners must not interpret an HTML tool press as a ground press.
for(const event of ['pointerdown','mousedown','touchstart'])for(const surface of [app,modal])surface.addEventListener(event,e=>{if(!e.target.closest('canvas'))e.stopPropagation();});
restoreTeacherPreview();
if(!G.getSaveStatus(storage).ok){ui.message=saveIssue();ui.pending=true;}
render();await Promise.allSettled([document.fonts.load('24px Jua')]);createFieldGame(ctx);

if(!G.getSaveStatus(storage).ok)dialog({title:'저장된 기록을 보호하고 있어',body:'<p>'+esc(saveIssue())+'</p><p>지금 화면의 활동은 임시로 이어갈 수 있어. 기존 원본은 바꾸지 않아.</p>',actions:btn('기록함 열기','records')+btn('임시로 살펴보기','close','','primary')});
