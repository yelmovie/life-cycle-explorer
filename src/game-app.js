import {bindDirectionPad,MAP_VECTORS} from './map-controls.js';
import {reducedMotion} from './game-motion.js';
import * as G from './game-model.js';
import {TEXT_LIMITS,objectParticle} from './field-writing.js';
import {fieldAction,storeFieldDraft,fieldRecords,fieldUnlocked} from './field-model.js';
import {FIELD_CHAPTERS,FORM_TRAITS,FORM_NAMES,SORT_CARDS} from './field-content.js';
import {roomPhase,roomUI,holdObservation,releaseObservation,observationHeld} from './field-flow.js';
import {applyQuest,questInfo} from './field-quests.js';
import {ART,esc} from './game-metadata.js';
import {icon} from './ui-icons.js';
import {renderSettings,renderResetConfirm} from './game-settings.js';
import * as audio from './game-audio.js';
import {characterDialogueMarkup,mountCharacterDialogue} from './character-dialogue.js';
import {mountVillageEncounters} from './village-encounters.js';
import {dialogueCast} from './dialogue-cast.js';
import {recordImage,downloadBlob} from './game-records.js';
import {createDialogs,btn} from './field-dialogs.js';
import {createFieldNotebook} from './field-notebook.js';
import {VERSION} from './game-info.js';
import {previewFieldForPhase} from './field-preview.js';
import {shellMarkup,GUIDE_BUBBLE_MARKUP} from './game-shell.js';
import {rangeControl,timeStops} from './room-time-controls.js';
import {createDotoVoice} from './doto-voice.js';
import {layoutMapDoors} from './map-door-layout.js';
import {createNoteBox} from './observation-note-box.js';
import {installBackGuard} from './back-guard.js';
import {autoPlayable} from './field-autoplay.js';
import {openConcept} from './field-concepts.js';
import {openCinema} from './field-cinema.js';
import {COMPANION_ART,companionLine,companionMapLine,companionDiscoveryLine,stageProgress,hintTarget} from './field-companion.js';
import {REWARD_CARDS,ownedRewardCards,wonRewardCards,rewardSlotsHtml,syncRewardSlots,winRewardCard,rewardCardDue,rewardCardPending,rewardLayerOpen,watchRewardLayer} from './reward-card-set.js';
import {configureVoice,installVoiceStop,stopVoice,voiceBusy,villainSpeaking} from './voice-lines.js';

const storage={getItem(key){return window.localStorage.getItem(key);},setItem(key,value){window.localStorage.setItem(key,value);}};
const TEACHER_SESSION_KEY='life-clock-lab.teacher-preview.1';
let s=G.loadGame(storage),previewOriginal=null,focusItems=[];
const ui={selection:null,recordPage:0,play:false,autoPlay:false,mapHand:false,guide:false,message:'',pending:false,hintLevel:0,restoreChapter:null,travelChapter:null};
let mediaCleanup=null,dialogFocus=null,statusTimer=null;
let fieldGame=null,engineLoad=null,fieldTimer=null,offlineQueued=false,fieldReady=false,flatObservation=false,sceneImportFailed=false;
const app=document.querySelector('#app'),modal=document.querySelector('#modal'),$=id=>document.getElementById(id),mode=()=>s.fieldView||'title';
app.innerHTML=shellMarkup(rewardSlotsHtml(s.mapEncounters));
const guideBubble=$('guide-bubble');
guideBubble.className='doto-hint';
guideBubble.innerHTML=GUIDE_BUBBLE_MARKUP;
const guidePortrait=guideBubble.querySelector('.npc-dialogue-portrait'),guideText=$('guide-text');
const guidePoint=guideBubble.querySelector('[data-action=hint-point]'),guideMore=guideBubble.querySelector('[data-action=hint-more]'),guideClose=guideBubble.querySelector('[data-action=hint-close]');
guidePortrait.style.setProperty('--npc-dialogue-art',`url("${dialogueCast.find(c=>c.id==='doto').image}")`);
let guideLineKey=null;
const dotoVoice=createDotoVoice({bubble:guideBubble,voiceOn:()=>s.audio.voice,reduced:()=>reducedMotion(s.settings),blocked:()=>modal.open,villainSpeaking,duckMusic:audio.duckMusic}),speakGuide=dotoVoice.speak,stopGuideVoice=dotoVoice.stop;
modal.addEventListener('modal-dismiss',stopGuideVoice);
configureVoice({enabled:()=>s.audio.voice,hold:()=>audio.duckMusic('voice'),busy:dotoVoice.busy});installVoiceStop(modal);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopGuideVoice();});
window.addEventListener('pagehide',stopGuideVoice);
// Keep only the teacher's mode/location in this tab. Student answers stay in
// their existing storage; demonstration answers are rebuilt from sample data.
function rememberTeacherPreview(){
 try{if(!previewOriginal){sessionStorage.removeItem(TEACHER_SESSION_KEY);return;}sessionStorage.setItem(TEACHER_SESSION_KEY,JSON.stringify({view:mode(),chapter:s.field.active,phase:roomPhase(s.field)}));}catch{}
}
function restoreTeacherPreview(){
 let saved;try{saved=JSON.parse(sessionStorage.getItem(TEACHER_SESSION_KEY));}catch{return;}
 if(!saved||!Number.isInteger(saved.chapter)||saved.chapter<0||saved.chapter>4||!['title','map','room'].includes(saved.view))return;
 const savedPhase=saved.chapter===4&&saved.phase==='plan'?'tower-note':saved.phase;
 const phase=stageProgress(saved.chapter,savedPhase,true).phase;
 if(saved.view==='room'&&phase!==savedPhase)return;
 previewOriginal=s;s=structuredClone(s);s.field.preview=true;
 if(saved.view==='room')s.field=previewFieldForPhase(s.field,saved.chapter,phase);
 s.fieldView=saved.view;
}
function saveIssue(){const reason=G.getSaveStatus(storage).reason;return reason==='conflict'?'다른 창에서 기록이 바뀌어 덮어쓰기를 멈췄어. 기록함에서 지금 활동을 보관한 뒤 새로고침해 줘.':['invalid-json','invalid-structure','unsupported-version'].includes(reason)?'저장된 기록을 읽지 못해서 원본을 보호하고 있어. 기록함에서 기존 원본과 지금 활동을 따로 보관할 수 있어.':'기기에 저장하지 못했어. 기록함에서 지금까지의 활동을 파일로 보관해 줘.';}
function saveBadge(){const badge=$('save-badge'),ok=G.getSaveStatus(storage).ok;badge.hidden=ok;if(!ok){const why=saveIssue();badge.title=why;badge.setAttribute('aria-label','기록 보호 중. '+why+' 눌러서 기록함 열기');}}
function persist(){if(previewOriginal){previewOriginal.audio={...s.audio};return true;}const ok=G.saveGame(storage,s);if(!ok){ui.message=saveIssue();ui.pending=true;$('status').textContent=ui.message;$('status').classList.add('visible');}return ok;}
function announce(message,error=false){ui.message=message;ui.pending=error;$('status').textContent=message;$('status').classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').classList.remove('visible'),3400);audio.playSfx(error?'error':'place');updateGuide();}
function currentGuideLine(phase){
 if(phase==='discovery'&&ui.hintLevel===0){
  const {step,clue}=questInfo(s.field);
  return companionDiscoveryLine(s.field.active,step,clue);
 }
 if(phase)return companionLine(phase,ui.hintLevel);
 const chapter=FIELD_CHAPTERS.findIndex((_,i)=>!s.field.completed.includes(i));
 return chapter<0?companionMapLine():companionMapLine(chapter,FIELD_CHAPTERS[chapter].title);
}
function syncOrientationFocus(){
 const portrait=innerHeight>innerWidth,notice=modal.querySelector('.modal-portrait');
 if(modal.open&&portrait&&notice){if(document.activeElement!==notice){ui.rotationFocus=document.activeElement;notice.focus({preventScroll:true});}}
 else if(!portrait&&ui.rotationFocus?.isConnected){ui.rotationFocus.focus({preventScroll:true});ui.rotationFocus=null;}
}
function closeGuide(){ui.guide=false;updateGuide();const target=ui.hintReturn?.isConnected?ui.hintReturn:$('guide');target.focus({preventScroll:true});ui.hintReturn=null;}
// Doto's card sits over the lower scene, where answer buttons and drop spots live.
// Putting it away must not move focus off the scene the learner is pressing.
function hideGuide(){if(!ui.guide)return;ui.guide=false;ui.hintReturn=null;updateGuide();}
function updateGuide(speak=false){
 const button=$('guide'),map=mode()==='map',host=app.querySelector(map?'.map-companion-layer':'.guide-tools');
 if(button.parentElement!==host){if(!map)button.removeAttribute('style');button.hidden=map;host.prepend(button);}
 button.querySelector('img').src=COMPANION_ART;button.querySelector('span').textContent=map?'…':ui.pending?'도토 !':'도토 힌트';
 button.setAttribute('aria-label','다람쥐 도토의 힌트');button.setAttribute('aria-controls','guide-bubble');button.setAttribute('aria-expanded',String(ui.guide));
 const opening=guideBubble.hidden&&ui.guide;
 guideBubble.hidden=!ui.guide;
 if(!ui.guide){guideLineKey=null;stopGuideVoice();return;}
 const phase=mode()==='room'?roomPhase(s.field):null;
 const {key,text}=currentGuideLine(phase);
 const focused=document.activeElement;
 guidePoint.hidden=!phase||!hintTarget(phase);
 guideMore.hidden=!phase||ui.hintLevel!==0;
 if((focused===guideMore||focused===guidePoint)&&focused.hidden)(guidePoint.hidden?guideClose:guidePoint).focus({preventScroll:true});
 if(opening||guideLineKey!==key||guideText.textContent!==text){
  guideLineKey=key;
  guideText.textContent=text;
  if(speak)speakGuide(key);
  else stopGuideVoice();
 }
}

function canResumeRoom(){return s.resumeRoom&&fieldUnlocked(s.field,s.field.active);}
function view(next){
 if(next==='room'){s.resumeRoom=true;armIdleHint();}
 if(next!=='map')clearEncounters();
 audio.setMusicTheme('main');s.fieldView=next;
 Object.assign(ui,{selection:null,guide:false,message:'',play:false,autoPlay:false,mapHand:false,travelChapter:null,hintLevel:0,hintReturn:null,dial:null,carePour:null,crossSection:false,plantFrames:null,waterFx:false,tempFx:false});
 clearTimeout(statusTimer);$('status').classList.remove('visible');
 // Stop the old room's inputs and hide its canvas before exposing the new room label.
 setFieldReady(false);focusTargets([]);placeNoteBox(null);
 persist();render();openFieldView();
}
function setFieldReady(ready){
 fieldReady=ready;
 app.dataset.fieldReady=String(ready);
 $('phaser-root').setAttribute('aria-hidden',String(!ready));
 if(!ready&&ctx.scene)ctx.scene.input.enabled=false;
 for(const selector of ['.game-footer','#map-doors','#focus-targets'])app.querySelector(selector).inert=!ready;
}
function queueOffline(){
 if(offlineQueued)return;
 offlineQueued=true;
 setTimeout(()=>void import('./game-network.js').then(({prepareOffline})=>prepareOffline()).catch(()=>{}),3000);
}
// Returning browsers can check for an update on the title screen as well.
if(navigator.serviceWorker?.controller)queueOffline();
function loadFieldEngine(){
 if(engineLoad)return engineLoad;
 const engine=globalThis.Phaser?Promise.resolve():new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  script.src='vendor/phaser-3.90.0.min.js';script.async=true;
  script.onload=()=>{if(globalThis.Phaser)resolve();else{script.remove();reject(new Error('Phaser unavailable'));}};
  script.onerror=()=>{script.remove();reject(new Error('Phaser could not be loaded'));};
  document.head.append(script);
 });
 // The scene module reads Phaser at creation time, so both downloads can start together.
 const scenes=import('./field-scenes.js').catch(error=>{sceneImportFailed=true;throw error;});
 engineLoad=Promise.all([engine,scenes]).then(([,module])=>module).catch(error=>{engineLoad=null;throw error;});
 return engineLoad;
}
function fieldRecovery(message,{retry=false,direct=false}={}){
 const panel=$('field-recovery');
 panel.querySelector('[role=status]').textContent=message;
 panel.querySelector('[data-action=field-retry]').hidden=!retry;
 panel.querySelector('[data-action=field-direct]').hidden=!direct;
 panel.hidden=false;
}
function hideFieldRecovery(){clearTimeout(fieldTimer);$('field-recovery').hidden=true;}
function enterDirect(){
 const chapter=FIELD_CHAPTERS.findIndex((_,i)=>!s.field.completed.includes(i)&&fieldUnlocked(s.field,i));
 if(chapter<0){view('map');return;}
 if(previewOriginal){s.field=previewFieldForPhase(s.field,chapter,stageProgress(chapter,'',true).firstPhase);}
 else if(!fieldAction(s.field,'chapter-enter',{chapter}).ok)return;
 view('room');
}
function showFlatObservation(){
 if(mode()!=='room'||s.field.active!==0)return;
 flatObservation=true;
 hideFieldRecovery();renderFlatObservation();
 $('flat-observation').querySelector('h2').focus({preventScroll:true});
}
function renderFlatObservation(){
 const panel=$('flat-observation'),q=s.field.chapters[0],forms=Object.keys(FORM_NAMES);
 const count=forms.filter(form=>q.inspected[form].length).length;
 panel.hidden=false;
 panel.innerHTML=`<h2 tabindex="-1">나비의 숲 · 그림으로 관찰하기</h2><p>나비의 모습을 살펴보고 특징을 골라 기록해요.</p><div class="flat-specimens">${forms.map(form=>`<article><h3>${FORM_NAMES[form]}</h3><img src="${ART[form]}" alt="${FORM_NAMES[form]} 확대 모형"><div>${FORM_TRAITS[form].map((trait,spot)=>btn((q.inspected[form].includes(spot)?'✓ ':'')+esc(trait),'flat-inspect',`data-form="${form}" data-spot="${spot}"`)).join('')}</div></article>`).join('')}</div><p role="status">${count}/4 모습 관찰 · 기록은 나비의 숲에서 이어 쓸 수 있어요.</p><div class="row">${btn('탐구 도구 다시 불러오기','field-retry','','primary')}${btn('처음으로','home')}</div>`;
}
let fieldTicket=0;
function openFieldView({retryAssets=false}={}){
 const ticket=++fieldTicket;
 hideFieldRecovery();$('flat-observation').hidden=true;flatObservation=false;
 if(mode()==='title'){setFieldReady(false);ctx.scene?.refresh();return;}
 setFieldReady(false);
 fieldRecovery('탐험 도구를 준비하고 있어요.');
 fieldTimer=setTimeout(()=>{
  if(ticket!==fieldTicket||fieldReady)return;
  fieldRecovery('연결이 느려 조금 더 걸리고 있어요.',{retry:true,direct:mode()==='map'});
  if(mode()==='room'&&s.field.active===0)showFlatObservation();
 },3000);
 if(ctx.scene){if(retryAssets)ctx.scene.retryAssets();else ctx.scene?.refresh();return;}
 const fonts=Promise.allSettled([document.fonts.load('24px NanumSquareNeo'),document.fonts.load('700 24px NanumSquareNeo')]);
 void Promise.all([loadFieldEngine(),fonts]).then(([{createFieldGame}])=>{
  if(ticket!==fieldTicket||mode()==='title'||flatObservation)return;
  if(!fieldGame)fieldGame=createFieldGame(ctx);
 }).catch(()=>{
  if(ticket!==fieldTicket||mode()==='title')return;
  hideFieldRecovery();
  if(mode()==='room'&&s.field.active===0){showFlatObservation();return;}
  fieldRecovery('탐험 도구를 불러오지 못했어요. 저장된 탐구 기록은 그대로예요.',{retry:true,direct:mode()==='map'});
 });
}
function render(){rememberTeacherPreview();const m=mode(),room=m==='room';saveBadge();if(m!=='map')clearEncounters();app.dataset.view=m;$('title-screen').hidden=m!=='title';for(const id of ['objective','guide','next','controls'])$(id).hidden=m==='title';$('scene-title').textContent='';$('map-doors').hidden=m!=='map';$('focus-targets').hidden=!room;
 const nextChapter=FIELD_CHAPTERS.findIndex((_,i)=>!s.field.completed.includes(i)&&fieldUnlocked(s.field,i));
 $('title-screen').querySelector('[data-action=start] span').textContent=nextChapter<0?'숲 다시 둘러보기':nextChapter===0?'나비 관찰 시작':FIELD_CHAPTERS[nextChapter].title+' 탐사 시작';
 $('title-screen').querySelector('[data-action=continue]').hidden=!canResumeRoom()&&!s.field.completed.length;$('title-screen').querySelector('[data-action=title-restart]').hidden=s.field.completed.length<5;
 if(room){const info=roomUI(s,ui),progress=stageProgress(s.field.active,info.phase,!!previewOriginal);$('scene-title').innerHTML=esc((previewOriginal?'교사 시연 · ':'')+FIELD_CHAPTERS[s.field.active].title)+`<span class="progress-rail" aria-label="${progress.label}, ${Math.min(progress.index+1,progress.total)} / ${progress.total}">${progress.html}</span><span>${progress.label}</span>`;$('objective').textContent=info.objective;$('controls').innerHTML=`<div class="field-menu">${info.controls}${info.phase==='ready'?btn('(선택) 개념 영상','concept'):''}</div>`+`<div class="time-tools">${rangeControl(s.field)}${timeStops(s.field)}</div>`;$('next').textContent=previewOriginal?(progress.nextPhase?'다음 활동으로 건너뛰기':s.field.active<4?'다음 구역 시연':'시연 마치고 지도'):info.next;$('next').hidden=!previewOriginal&&['hint','observation-done'].includes(info.nextAction);}
 if(m==='map'){
  const c=FIELD_CHAPTERS.findIndex((_,i)=>!s.field.completed.includes(i)&&fieldUnlocked(s.field,i)),travelling=Number.isInteger(ui.travelChapter);
  $('objective').textContent='';
  $('controls').innerHTML=`<div class="row direction-pad">${[['left','왼쪽',-1,0],['up','위',0,-1],['down','아래',0,1],['right','오른쪽',1,0]].map(([i,l,x,y])=>btn(icon(i),'step',`data-x="${x}" data-y="${y}" aria-label="${l} 길로 걷기"`)).join('')}</div>`;
  $('next').innerHTML=travelling?'길을 따라가는 중…':c<0?'내 이야기 보기':villainBlocks(c)?'태엽 도깨비를 먼저 물리쳐 줘':esc(FIELD_CHAPTERS[c].title)+' 가기 <svg class="map-direction-cue" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>';
  // The next place to explore glows, so the map always answers "where now?".
  const nextDoor=c;
  $('map-doors').innerHTML=FIELD_CHAPTERS.map((ch,i)=>`<button class="map-door ${s.field.completed.includes(i)?'done':fieldUnlocked(s.field,i)?(i===nextDoor?'next':''):'locked'}" data-action="door" data-chapter="${i}" aria-label="${ch.title}${fieldUnlocked(s.field,i)?' 입장하기':' · 앞 탐사 뒤 열림'}"><svg class="map-lock-icon" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="${fieldUnlocked(s.field,i)?'M8 11V7a4 4 0 0 1 7.5-2':'M8 11V7a4 4 0 0 1 8 0v4'}"/></svg>${ch.title}</button>`).join('');
 }
 $('next').disabled=m==='map'&&Number.isInteger(ui.travelChapter);
 if($('next').disabled)$('next').setAttribute('aria-busy','true');else $('next').removeAttribute('aria-busy');
 $('next').classList.toggle('map-next-cue',m==='map'&&!reducedMotion(s.settings)&&!!$('next').querySelector('.map-direction-cue'));
 // Rebuilt door buttons take their map positions at once instead of on the next frame.
 autoPlayButton(room);mapHandButton(m==='map');
 const b=app.querySelector('[data-action=sound]'),on=s.audio.bgm||s.audio.sfx||s.audio.voice;b.innerHTML=icon(on?'sound':'mute');b.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');b.setAttribute('aria-pressed',String(on));syncRewardSlots(s.mapEncounters);updateGuide();if(m==='map')ctx.scene?.update?.();armTimeFlow();syncBack();}
// Time dials turn by themselves one step at a time, so the learner watches instead of tapping each day.
// The dial can still be turned by hand; the flow carries on from wherever it is.
function timeTarget(){const c=s.field.active,q=s.field.chapters[c],p=roomPhase(s.field);if(observationHeld(s.field))return null;
 if(c===1&&p==='grow'){const r=q.rounds[q.round];return r.day<7?['seed-day',{day:r.day+1}]:null;}
 if(c===2&&p==='care-after'){const t=q.cases[q.case];return t.day<2?['care-day',{day:t.day+1}]:null;}
 if(c===3&&p==='seasons')return q.season<4?['season',{step:q.season+1}]:null;
 if(c===3&&p==='animals')for(const [animal,max] of [['butterfly',3],['dog',2]]){const a=q.animals[animal];if([0,max].every(n=>a.photos.includes(n)))continue;return ['animal-time',{animal,step:a.photos.includes(0)?Math.min(a.step+1,max):0}];}
 return null;}
let timeTimer=null,timeKey='';
function armTimeFlow(){const t=mode()==='room'&&!previewOriginal?timeTarget():null,key=t?s.field.active+':'+JSON.stringify(t):'';
 if(key===timeKey)return;clearTimeout(timeTimer);timeKey=key;if(!t)return;
 const tick=()=>{const now=mode()==='room'&&!previewOriginal?timeTarget():null;if(!now||s.field.active+':'+JSON.stringify(now)!==key)return;
  if(modal.open||ui.autoPlay||!fieldReady||document.hidden){timeTimer=setTimeout(tick,1000);return;}act(now[0],now[1]);};
 timeTimer=setTimeout(tick,800);}
// One top-right toggle for every page that can play itself; it hides and
// switches off on pages where the learner has to choose an answer.
function autoPlayButton(room){
 const b=$('autoplay'),available=room&&autoPlayable(s.field,roomPhase(s.field));if(!available)ui.autoPlay=false;b.hidden=!available;
 const label=ui.autoPlay?'직접 해 보기':'자동 재생';b.innerHTML=icon(ui.autoPlay?'pause':'play')+'<span>'+label+'</span>';b.setAttribute('aria-pressed',String(ui.autoPlay));b.title=label;
}
// The hand sits beside the hint button on the map: while it is pressed,
// dragging moves the view and taps no longer walk.
function mapHandButton(map){
 const b=$('map-hand');if(!map){ui.mapHand=false;ui.mapOverview=false;}b.hidden=!map;
 const label=ui.mapHand?'지도 끌기 끝':'지도 끌어 보기';b.innerHTML=icon('hand');$('map-fit').hidden=!map;$('map-fit').setAttribute('aria-pressed',String(!!ui.mapOverview));b.setAttribute('aria-pressed',String(ui.mapHand));b.setAttribute('aria-label',label);b.title=label;
}
function coordinates(item){const canvas=document.querySelector('canvas');if(!canvas)return null;const a=canvas.getBoundingClientRect(),b=$('stage').getBoundingClientRect(),size=ctx.scene?.scale?.gameSize,p=ctx.scene?.projectWorld?.(item)||item,sx=a.width/(size?.width||1280),sy=a.height/(size?.height||800);return {left:a.left-b.left+p.x*sx,top:a.top-b.top+p.y*sy,w:p.w*sx,h:p.h*sy};}
function focusTargets(items){focusItems=items;$('focus-targets').replaceChildren();items.forEach(item=>{const b=document.createElement('button');b.className='focus-target';if(s.field.active===0&&roomPhase(s.field)==='search'&&(/ 보기$| 관찰$|비교$|확대 관찰로 돌아가기|본 특징 기록하기|관찰 글 쓰기/.test(item.label)&&!item.label.endsWith('확대해서 보기')))b.classList.add('tap-observation');b.setAttribute('aria-label',item.label);b.addEventListener('click',item.fn);$('focus-targets').append(b);});positionFocus();}
const notes=createNoteBox({stage:()=>$('stage'),coordinates,note:()=>s.field.chapters[0],save:text=>act('observation-note',{text}),limit:TEXT_LIMITS.observation}),placeNoteBox=notes.place,fitNote=notes.fit;
// Writing dialogs: keep the field and the action row inside what the keyboard leaves visible.
function fitDialog(){const vv=window.visualViewport,field=document.activeElement,typing=modal.open&&vv&&modal.contains(field)&&/^(INPUT|TEXTAREA)$/.test(field?.tagName)&&vv.height<innerHeight*.85;
 Object.assign(modal.style,typing?{top:vv.offsetTop+8+'px',bottom:'auto',marginTop:'0',maxHeight:vv.height-16+'px'}:{top:'',bottom:'',marginTop:'',maxHeight:''});if(typing)field.scrollIntoView({block:'nearest'});}
const fitKeyboard=()=>{fitNote();fitDialog();};document.addEventListener('focusin',()=>setTimeout(fitKeyboard,350));
window.visualViewport?.addEventListener('resize',fitKeyboard);window.visualViewport?.addEventListener('scroll',fitKeyboard);
function positionFocus(){notes.refresh();[...$('focus-targets').children].forEach((b,i)=>{const p=coordinates(focusItems[i]);if(p)Object.assign(b.style,{left:p.left+'px',top:p.top+'px',width:Math.max(48,p.w)+'px',height:Math.max(48,p.h)+'px'});});}
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
let mapEncounters=null,mapEncounterKey='';
let encounterClear=null;
function clearEncounters(){mapEncounters?.destroy();mapEncounters=null;mapEncounterKey='';}
function positionEncounters(items,companion,hero){
 if(mode()!=='map'||!hero)return;
 const key=previewOriginal?'preview':s.field.completed.join(',');
 if(key!==mapEncounterKey){
  clearEncounters();mapEncounterKey=key;
  const owner=ctx.scene;
  if(!previewOriginal)mapEncounters=mountVillageEncounters({host:$('stage'),clearIndex:encounterClear,progress:s.mapEncounters,
   stages:items.map(({chapter,x,y,near})=>s.field.completed.includes(chapter)?{
    x:near?.x??x+28,y:near?.y??y+14,name:FIELD_CHAPTERS[chapter].title}:null),
   onSave:next=>{const won=wonRewardCards(s.mapEncounters,next);s.mapEncounters={...s.mapEncounters,...next};persist();won.forEach(awardCard);render();},
   blocked:()=>!fieldReady||modal.open||ui.guide||ui.mapOverview||mode()!=='map'||rewardCardDue(),
   // The finale waits for the last card (and its set jingle), including the wait for the exit line.
   holdFinale:rewardCardPending,
   reduced:()=>reducedMotion(s.settings),
   tone:(kind,hits)=>{
    // The card-set jingle is the all-villains celebration; the separate victory jingle is only for a map without the full set.
    if(kind==='victory'&&ownedRewardCards(s.mapEncounters).every(Boolean))return;
    const cue=({finish:'map-strike-3',contact:'map-bump',appear:'map-appear',victory:'map-victory'})[kind]??(hits===2?'map-strike-2':'map-strike-1');
    // Strikes come from a press on the attack button or J/Space. That button stops pointerdown from reaching the
    // page's first-press audio unlock, so a strike unlocks audio itself (a map reopened after reload starts here).
    if(kind==='hit'||kind==='finish')void audio.initAudio(s.audio).then(()=>audio.playSfx(cue));else audio.playSfx(cue);
   },
   actors:[visible=>owner?.avatar?.setAlpha(visible?1:0),visible=>owner?.spirit?.setAlpha(visible?1:0)],
  });
  encounterClear=null;
 }
 mapEncounters?.update({hero,ally:companion,scale:ctx.scene?.cameras?.main?.zoom||1,
  project:point=>{const p=coordinates({...point,w:0,h:0});return p?{x:p.left,y:p.top}:null;}});
}
// A villain's third hit wins its achievement card. The card opens once the exit has played and covers the map like a
// dialog (modalOpen), so the all-villains finale waits until it is put away. Leaving the map first just fills the slot.
// A card whose turn comes while a dialog is open waits for it; rewardCardDue() in the villains' blocked() keeps the finale behind it.
function awardCard(index){
 // The card comes after the villain's exit line (it starts 300 ms after the strike), waiting at most 5 s from the strike.
 const until=performance.now()+5000;
 void winRewardCard(index,{delay:reducedMotion(s.settings)?520:760,hits:()=>s.mapEncounters,hold:()=>voiceBusy()&&performance.now()<until,
  state:()=>mode()!=='map'?'gone':!fieldReady||document.querySelector('dialog[open]')?'wait':'open',
  origin:()=>{const spot=$('stage').querySelector(`[data-encounter="${REWARD_CARDS[index].id}"]`)?.getClientRects()[0];return spot?{x:spot.left,y:spot.top-30}:undefined;}});
}
// A region that has just opened on the map gets one latch-and-bell cue, the first moment the map is free to show it:
// after the activity-complete sound and the reward popup (and any card). The reward popup's close calls this at once,
// so the cue comes just before the villain line that greets the learner back on the map (it never cuts that line:
// they run in different lanes). What has been announced is kept in memory and starts from the loaded save, so a
// reload or revisit never repeats it. Teacher preview (everything open at once) is never announced.
let openingsHeard=null;
const openRegions=()=>FIELD_CHAPTERS.reduce((count,_,chapter)=>count+(fieldUnlocked(s.field,chapter)?1:0),0);
const openingQuiet=()=>mode()==='map'&&fieldReady&&!modal.open&&!rewardLayerOpen()&&!rewardCardPending()&&!document.hidden&&!document.querySelector('dialog[open]');
function checkOpenings(){
 if(previewOriginal)return;
 const open=openRegions();
 if(openingsHeard===null||open<openingsHeard){openingsHeard=open;return;}
 if(open===openingsHeard||!openingQuiet())return;
 openingsHeard=open;audio.playSfx('stage-unlock');
}
checkOpenings();setInterval(()=>{checkOpenings();syncBack();},400);modal.addEventListener('close',()=>checkOpenings());
// A card or the album stops a walk as it opens, as a dialog does; when it closes the scene gets its input back.
watchRewardLayer(open=>{syncBack();if(!open){if(ctx.scene&&!modal.open)ctx.scene.input.enabled=fieldReady;}else if(mode()==='map'){ctx.scene?.cancelTravel();ui.travelChapter=null;render();}});
function positionDoors(items,companion,hero){
 positionEncounters(items,companion,hero);
 if(mode()!=='map')return;layoutMapDoors({app,stage:$('stage'),doors:$('map-doors'),guide:$('guide'),items,companion,coordinates});
}
function dialog({title,body,actions=btn('계속 탐험','close','','primary'),className='',music='main',values={}}){mediaCleanup?.();mediaCleanup=null;modal.dispatchEvent(new Event('modal-dismiss'));audio.setMusicTheme(music);if(!modal.open)dialogFocus=document.activeElement;if(mode()==='map'){ctx.scene?.cancelTravel();ui.travelChapter=null;render();}modal.className=className;const scienceSettings=className==='settings-dialog';modal.toggleAttribute('data-science-settings',scienceSettings);modal.setAttribute('aria-labelledby','dialog-title');modal.innerHTML=`<h2 id="dialog-title">${esc(title)}</h2>${scienceSettings?'':`<button class="close icon-button" data-action="close" aria-label="닫기">${icon('close')}</button>`}<div class="modal-portrait" tabindex="-1" role="status">화면을 가로로 돌리면 작성 중인 내용을 이어 갈 수 있어.</div><div class="modal-body${scienceSettings?' science-settings-body':''}">${body}</div><div class="dialog-actions${scienceSettings?' science-settings-footer':''}">${actions}</div>`;for(const[id,value]of Object.entries(values)){const input=modal.querySelector('#'+id);if(input)input.value=value;}if(!modal.open)modal.showModal();syncBack();syncOrientationFocus();if(ctx.scene)ctx.scene.input.enabled=false;modal.querySelector('.modal-body').scrollTop=0;modal.querySelector('[autofocus]')?.focus();}
modal.addEventListener('close',()=>{if(modal.open)return;mediaCleanup?.();mediaCleanup=null;if(ctx.scene)ctx.scene.input.enabled=fieldReady;if(!document.querySelector('.map-finale-dialog'))audio.setMusicTheme('main');audio.resumeAudio();if(Number.isInteger(ui.pendingRestoreChapter)&&mode()==='map'){ui.restoreChapter=ui.pendingRestoreChapter;ui.pendingRestoreChapter=null;ctx.scene?.refresh();}if(dialogFocus?.isConnected)dialogFocus.focus({preventScroll:true});else if(mode()==='room')$('next')?.focus({preventScroll:true});});
function friendsDialogue(initial=0){
 dialog({title:'생명 시계 친구들과 이야기',body:characterDialogueMarkup,actions:'',className:'npc-dialogue-stage'});
 mountCharacterDialogue(modal,{characters:dialogueCast,initial,enabled:()=>s.audio.voice,reduced:()=>reducedMotion(s.settings),hold:()=>audio.duckMusic('dialogue')});
}
function concept(chapter=s.field.active,finish=false,returnToList=false){mediaCleanup=openConcept({chapter,dialog,modal,audio,reduced:reducedMotion(s.settings),returnToList,finishLabel:returnToList?'영상 목록으로':undefined,onFinish:()=>{if(returnToList)dialogs.concepts();else if(finish&&chapter===4)finale();}});}
// Story films: the intro leads into the opening briefing, the finale into the ending record.
// Both films carry their own score (intro: main theme, final: ending theme), so the game music pauses instead of doubling it.
// Their soundtracks also carry the narration (and the Jihoon dub), so with the voice switch off the film plays muted,
// no dub starts, and the game music keeps playing as usual.
const cinemaAudio=()=>s.audio.voice?{volume:s.audio.bgm||s.audio.sfx?Math.min(1,s.audio.volume*3.5):0,holdMusic:()=>audio.pauseAudio('cinema')}:{volume:0,holdMusic:()=>()=>{}};
function intro(){mediaCleanup=openCinema({id:'intro',dialog,modal,...cinemaAudio(),reduced:reducedMotion(s.settings),onFinish:()=>dialogs.opening()});}
function finale(f=s.field){if(f.completed.length<5)return;mediaCleanup=openCinema({id:'final',dialog,modal,...cinemaAudio(),reduced:reducedMotion(s.settings),detail:`관찰·실험 기록 ${fieldRecords(f).length}개로 다섯 장소의 시간을 다시 이었어.`,onFinish:()=>dialogs.ending(f)});}
// Teacher preview shows the ending and certificate built from example records; nothing is saved or awarded.
function sampleField(){const f=previewFieldForPhase({preview:true},4,'ready');f.completed=[0,1,2,3,4];return f;}
function settings(){dialog(renderSettings({audio:s.audio,completed:s.field.completed,teacherPreview:!!previewOriginal,version:VERSION,audioAvailable:audio.isAudioAvailable()}));}
function lockedDoor(chapter){
 const first=[0,1,2,3,4].find(i=>!s.field.completed.includes(i))??0,previous=FIELD_CHAPTERS[first];
 dialog({title:'앞 탐사를 먼저 마쳐 줘.',body:`<p>${FIELD_CHAPTERS[chapter].title}에 들어가려면 앞 탐사를 먼저 끝내야 해.</p><p>먼저 ${previous.title}에서 탐사를 마치고 ${objectParticle(previous.reward)} 받아 줘. 구역을 순서대로 탐사하면 다음 길이 열려.</p>`,actions:btn('닫기','close')+btn(previous.title+' 가기','door-next',`data-chapter="${first}"`,'primary')});
}
// A newly opened region waits until the villain beside the region just finished has been driven off.
function villainBlocks(chapter){const prev=chapter-1;return !previewOriginal&&!!mapEncounters&&prev>=0&&s.field.completed.includes(prev)&&!s.field.completed.includes(chapter)&&(s.mapEncounters?.[['butterfly','seed','care','season','clock'][prev]]||0)<3;}
function villainNotice(){announce('태엽 도깨비가 길을 막고 있어! 가까이 가서 공격 버튼을 세 번 눌러 물리쳐 줘.',true);}
function requestDoor(chapter){
 if(!Number.isInteger(chapter)||chapter<0||chapter>4||mode()!=='map')return;
 if(!fieldUnlocked(s.field,chapter)){lockedDoor(chapter);return;}
 if(villainBlocks(chapter)){villainNotice();return;}
 if(previewOriginal){s.field=previewFieldForPhase(s.field,chapter,stageProgress(chapter,'',true).firstPhase);view('room');return;}
 ctx.scene?.walkDoor(chapter);
}
// Doto steps in by himself: after a quiet spell (once per page) or after two misses in a row.
let idleHintTimer=null,missStreak=0,idleHintShown='';
function autoHint(missed=false){
 if(mode()!=='room'||previewOriginal||ui.guide||ui.autoPlay||modal.open||!fieldReady||document.hidden)return;
 const phase=roomPhase(s.field),key=s.field.active+':'+phase;
 if(!missed&&(roomUI(s,ui).nextAction!=='hint'||idleHintShown===key))return;
 idleHintShown=key;ui.guide=true;updateGuide(true);ctx.scene?.showHint?.(hintTarget(phase));
}
function armIdleHint(){clearTimeout(idleHintTimer);idleHintTimer=setTimeout(()=>autoHint(),15000);}
function countMiss(ok){if(ok){missStreak=0;return;}if(++missStreak>=2){missStreak=0;autoHint(true);}}
document.addEventListener('pointerdown',armIdleHint,true);document.addEventListener('keydown',armIdleHint,true);
// A press on the scene puts Doto's card away and still reaches the button underneath,
// so an answer hidden by the hint is never a dead button.
document.addEventListener('pointerdown',e=>{if(ui.guide&&mode()==='room'&&e.target.closest?.('#phaser-root,#focus-targets'))hideGuide();},true);
// Tapping the card itself (not its buttons) also puts it away to reveal what it covered.
guideBubble.addEventListener('click',e=>{if(ui.guide&&!e.target.closest('button'))closeGuide();});
function completeChapter(){const c=s.field.active,first=!s.field.completed.includes(c);if(act('chapter-complete',{chapter:c}).ok){encounterClear=first?c:null;ui.pendingRestoreChapter=c;s.resumeRoom=false;view('map');if(c===4){finale();return;}audio.playSfx('reward');dialogs.reward(c);}}
// Steps that used to wait for a confirming press now move on by themselves, after a beat to see the result.
// Each timer re-checks that the learner is still on the same page before it acts.
let flowTimer=null;
function flowAfter(ms,stillValid,fn){clearTimeout(flowTimer);const chapter=s.field.active,phase=roomPhase(s.field);
 const tick=()=>{if(mode()!=='room'||previewOriginal||s.field.active!==chapter||roomPhase(s.field)!==phase||!stillValid())return;if(modal.open||ui.autoPlay){flowTimer=setTimeout(tick,1000);return;}fn();};
 flowTimer=setTimeout(tick,ms);}
function autoFlow(type){
 const f=s.field,c=f.active,phase=roomPhase(f);
 // The last day of the seed experiment stays on screen briefly, then the comparison page opens.
 if(observationHeld(f)){flowAfter(3000,()=>observationHeld(s.field),()=>{releaseObservation(s.field);Object.assign(ui,{guide:false,message:'',pending:false,hintLevel:0});audio.playSfx('success');render();ctx.scene?.refresh();});return;}
 // The water experiment starts once the learner has both watered B and chosen a prediction.
 if(c===1&&phase==='design'&&['seed-predict','seed-condition'].includes(type)){const r=f.chapters[1].rounds[f.chapters[1].round];if(r.prediction&&r.b.water&&r.b.warm)flowAfter(2200,()=>true,()=>act('seed-run'));return;}
 // Finishing a region's evidence for the first time goes straight to its reward.
 if(phase==='ready'&&c<4&&!f.completed.includes(c)&&!f.discoveryVisit)flowAfter(1400,()=>!s.field.completed.includes(c),completeChapter);
}
function act(type,payload={}){const before=roomPhase(s.field),result=type==='quest-answer'?applyQuest(s.field,payload):fieldAction(s.field,type,payload);if(result.ok)holdObservation(s.field,before,type);if(mode()==='room')hideGuide();countMiss(result.ok);ui.selection=null;if(result.ok&&type==='seed-condition'){if(payload.key==='water')ui.waterFx=true;if(payload.key==='warm')ui.tempFx=true;}announce(result.message,!result.ok);if(result.ok)audio.playSfx(type.includes('photo')?'photo':type==='inspect'?'inspect':roomPhase(s.field)!==before?'success':['seed-day','care-day','season','animal-time'].includes(type)?'time':'place');if(result.ok&&type==='inspect')ui.message=FORM_TRAITS[payload.form][payload.spot];if(result.ok&&roomPhase(s.field)!==before)Object.assign(ui,{guide:false,message:'',pending:false,recordPage:0,hintLevel:0});persist();render();ctx.scene?.refresh();if(result.ok&&type==='inspect'&&!payload.quiet)notebook.observe(payload.form,payload.spot);if(result.ok&&/^(seed|animal|season)-photo$/.test(type))notebook.capture(type,payload);if(result.ok&&mode()==='room'&&!previewOriginal)autoFlow(type);return result;}
// What the learner just picked and where it goes. Every listed target also accepts a tap after picking.
function pickGuide(d){const q=s.field.chapters[s.field.active],tool={water:'물뿌리개',warm:'온도계',light:'빛 램프'};
 const [name,goal]=d.kind==='film'?[FORM_NAMES[q.order?.[d.from]]+' 사진','옮길 자리를 눌러 줘.']
 :d.kind==='generation'?['새 알','오른쪽 새 잎 자리를 눌러 줘.']
 :d.kind==='soil'?['흙 주머니','흙을 담을 화분을 눌러 줘.']
 :d.kind==='seed'?['콩 한 알','심을 화분을 눌러 줘.']
 :d.kind==='seed-condition'?[tool[d.key],`B 화분을 눌러 ${d.key==='water'?'물':'온도'} 조건만 바꿔 줘.`]
 :d.kind==='sensor'?[(d.sensor==='both'?'물기·빛':d.sensor==='water'?'물기':'빛')+' 재는 도구','잴 화분을 눌러 줘.']
 :d.kind==='seed-reason'?[(d.reason==='water'?'물':'온도')+' 꼬리표','싹이 난 화분을 눌러 붙여 줘.']
 :d.kind==='care-tool'?[tool[d.tool],'돌볼 화분을 눌러 줘.']
 :d.kind==='birth'?['다음 세대 카드','알맞은 설명 칸을 눌러 줘.']
 :d.kind==='tag'?[(d.plant==='apple'?'A-01':'B-01')+' 이름표',(d.plant==='apple'?'사과나무':'봉선화')+'를 눌러 붙여 줘.']
 :d.kind==='sort'?[(SORT_CARDS.find(c=>c.id===d.card)?.name||'생물')+' 카드','알맞은 상자를 눌러 줘.']
 :d.kind==='record'?[(fieldRecords(s.field).find(r=>r.id===d.id)?.title||'이')+' 기록','기록판의 같은 장소 칸에 놓아 줘.']
 :d.kind==='claim'?['쪽지','이 쪽지를 뒷받침하는 증거 사진을 눌러 줘.']
 :['사진','옮길 자리를 눌러 줘.'];
 return {picked:objectParticle(name)+' 골랐어. '+goal,refused:objectParticle(name).replace(/을$/,'은').replace(/를$/,'는')+' 그 자리에 놓을 수 없어. '+goal};}
// The right care tool opens a short hands-on step (tilt the can, carry the pot into the light); the record is written when it ends.
// Browser back: close an open window, else room → map → title (B13). The in-app back button does the same.
let backGuard=null;
function syncBack(){backGuard??=installBackGuard({needed:()=>mode()!=='title'||!!document.querySelector('dialog[open]')||rewardLayerOpen()||ui.guide,back:()=>{if(rewardLayerOpen())return;const open=document.querySelector('dialog[open]');if(open){open.close();return;}if(ui.guide){closeGuide();return;}if(mode()==='room')view('map');else if(mode()==='map')view('title');}});backGuard();}
function startCare(t,tool){if(!t||tool!==t.variable||t.measured.length<2||!t.symptom||t.tool)return false;ui.selection=null;ui.carePour={key:s.field.active+':'+s.field.chapters[s.field.active].case,tool,amount:0};render();ctx.scene?.refresh();return true;}
function drop(data){const {kind,target}=data,q=s.field.chapters[s.field.active];let type,p={};
 if(kind==='film'&&target.startsWith('film-')){type='film-move';p={from:data.from,to:Number(target.slice(5))};}
 else if(kind==='generation'){type='generation';p={target};}
 else if(['soil','seed'].includes(kind)&&target.startsWith('pot-')){const side=target.slice(4),prep=q.rounds[q.round].prepared[side];type='seed-prepare';p=kind==='soil'?{side,soil:true}:{side,seeds:Math.min(3,prep.seeds+1)};}
 else if(kind==='seed-condition'&&target==='pot-b'){type='seed-condition';p={key:data.key,side:'b'};}
 else if(kind==='seed-reason'&&target?.startsWith('reason-')){type='seed-report';p={reason:data.reason,result:target.slice(7)};}
 else if(kind==='sensor'&&target==='plant'){type='care-measure';p={sensor:data.sensor};}
 else if(kind==='symptom'&&['dry','pale'].includes(target)){type='care-pin';p={symptom:target};}
 else if(kind==='care-tool'&&target==='plant'){const t=q.cases?.[q.case];if(startCare(t,data.tool))return;type='care-tool';p={tool:data.tool};}
 else if(kind==='birth'&&target.startsWith('birth-')){type='animal-generation';p={answer:target.slice(6)};}
 else if(kind==='tag'&&target==='plant-'+data.plant){type='plant-tag';p={plant:data.plant};}
 else if(kind==='identity'&&target.startsWith('plant-')){type='plant-classify';p={plant:target.slice(6),answer:data.answer};}
 else if(kind==='sort'&&target?.startsWith('sort-')){type='transfer';p={card:data.card,bin:target.slice(5)};}
 else if(kind==='record'&&target.startsWith('slot-')){type='book-record';p={id:data.id,slot:Number(target.slice(5))};}
 else if(kind==='claim'&&target.startsWith('evid-')){type='help-match';p={request:data.request,recordId:target.slice(5)};}
 else if(kind==='book'&&target.startsWith('book-')){type='book-move';p={from:data.from,to:Number(target.slice(5))};}
 if(type)act(type,p);else{countMiss(false);announce(kind==='seed-condition'?'A는 그대로 두고 B에서 조건 하나를 바꿔 보자.':pickGuide(data).refused,true);ctx.scene?.refresh();}}
const ctx={get s(){return s;},saveStatus:()=>G.getSaveStatus(storage),saveDraft(scope,values){if(storeFieldDraft(s.field,scope,values))persist();},ui,mode,dialog,announce,modalOpen:()=>modal.open||rewardLayerOpen(),recordImage,focusTargets,sceneReady:positionFocus,noteBox:placeNoteBox,placeDoors:positionDoors,emit(type,data){
 if(type==='assets-loading'){
  if(flatObservation||mode()==='title')return;
  setFieldReady(false);placeNoteBox(null);fieldRecovery('탐사 그림을 불러오는 중이에요.');return;
 }
 if(type==='assets-progress'){
  if(!flatObservation&&!$('field-recovery').hidden)$('field-recovery').querySelector('[role=status]').textContent='탐사 그림을 불러오는 중이에요. '+Math.round(data.progress*100)+'%';
  return;
 }
 if(type==='loaded'){if(mode()==='room'&&roomPhase(s.field)==='tower-run')$('next').disabled=false;
  if(mode()==='title'||flatObservation)return;
  hideFieldRecovery();setFieldReady(true);render();
  if(mode()==='room'&&!previewOriginal)queueOffline();
  window.dispatchEvent(new Event('life-clock-ready'));return;
 }
 if(type==='assets-unavailable'){
  if(mode()==='title'||flatObservation)return;
  setFieldReady(false);hideFieldRecovery();
  if(mode()==='room'&&s.field.active===0){showFlatObservation();return;}
  fieldRecovery('탐사 그림을 불러오지 못했어요. 저장된 탐구 기록은 그대로예요.',{retry:true,direct:mode()==='map'});return;
 }
 if(type==='map-step'){persist();return;}if(type==='footstep'){audio.playSfx('step');return;}if(type==='clock-tick'){audio.playSfx('wind');return;}
 if(type==='travel-start'){if(ui.travelChapter===data.chapter&&!data.cameraChanged)return;ui.travelChapter=data.chapter;ui.guide=false;render();return;}
 if(type==='map-pan-start'){mapHandButton(true);return;}
 if(type==='travel-cancel'){if(Number.isInteger(ui.travelChapter)){ui.travelChapter=null;render();}return;}
 if(type==='arrived'){ui.travelChapter=null;if(villainBlocks(data)){render();villainNotice();return;}if(fieldUnlocked(s.field,data)){fieldAction(s.field,'chapter-enter',{chapter:data});view('room');}else{render();lockedDoor(data);}return;}
 if(type==='select'){ui.selection=data;audio.playSfx('select');$('status').textContent=pickGuide(data).picked;$('status').classList.add('visible');clearTimeout(statusTimer);statusTimer=setTimeout(()=>$('status').classList.remove('visible'),2200);return;}if(type==='target'){if(ui.selection)drop({...ui.selection,target:data});else announce('먼저 옮길 도구나 사진을 고른 다음, 이 자리를 눌러 줘.',true);return;}if(type==='drop'){drop(data);return;}if(type==='act')return act(data.type,data.payload);
 if(type==='tower-finished'){
  if(mode()!=='room'||roomPhase(s.field)!=='tower-run'||!act('tower-run').ok)return;
  if(!previewOriginal&&act('chapter-complete',{chapter:4}).ok){ui.pendingRestoreChapter=4;view('map');finale();}
  return;
 }
 if(type==='observe'){act('inspect',data);return;}if(type==='observe-many'){data.forEach(p=>act('inspect',{...p,quiet:true}));return;}if(type==='dial'){if(ui.dial)act(ui.dial.type,{...ui.dial.payload,...(ui.dial.type==='season'?{step:data}:{day:data})});return;}if(type.startsWith('animal-dial-')){act('animal-time',{animal:type.slice(12),step:data});return;}if(type==='caption'){dialogs.caption(data);return;}if(type==='story-info'){dialogs.storyInfo();return;}if(type==='feedback')announce(data,true);
}};
const dialogs=createDialogs(ctx);
const notebook=createFieldNotebook({get s(){return s;},dialog,close:()=>modal.close()});
function action(name,b){void audio.initAudio(s.audio);audio.playSfx('click');
 if(name==='field-retry'){
  if(ctx.scene?.loading||!ctx.scene&&(fieldGame||sceneImportFailed||engineLoad)){location.reload();return;}
  if(ctx.scene?.assetFailure){openFieldView({retryAssets:true});return;}
  openFieldView();return;
 }
 if(name==='field-direct'){if(mode()==='map')enterDirect();return;}
 if(name==='flat-inspect'&&flatObservation&&mode()==='room'&&s.field.active===0){
  const {form,spot}=b.dataset;
  if(act('inspect',{form,spot:Number(spot),quiet:true}).ok){
   renderFlatObservation();
   $('flat-observation').querySelectorAll('[data-action=flat-inspect]').forEach(next=>{if(next.dataset.form===form&&next.dataset.spot===spot)next.focus({preventScroll:true});});
  }
  return;
 }
 if(b?.dataset.sample==='1'&&previewOriginal){const f=sampleField();if(name==='ending')dialogs.ending(f);else if(name==='certificate')dialogs.certificate(f);else if(name==='final-replay')finale(f);else if(name==='export')void dialogs.export(true,f);return;}
 if(name==='retry-assets'||name==='next'&&ctx.scene?.assetFailure){if(modal.open)modal.close();ctx.scene?.retryAssets();return;}
 if(name==='asset-map'){modal.close();view('map');return;}
 if(name==='start'){enterDirect();return;}if(name==='map-start'){modal.close();view('map');return;}if(name==='intro'){intro();return;}if(name==='final-replay'){finale();return;}if(name==='continue'){view(canResumeRoom()?'room':'map');return;}if(name==='begin'){modal.close();view('map');return;}if(name==='home'){view('title');return;}if(name==='back'){if(modal.open)modal.close();else view(mode()==='room'?'map':'title');return;}
 if(name==='npc-friends'){friendsDialogue();return;}
 if(name==='settings'){settings();return;}if(name==='close'){modal.close();return;}if(name==='concept'){concept(Number(b.dataset.chapter??s.field.active));return;}
 if(name==='concept-list'){dialogs.concepts();return;}
 if(name==='concept-select'){const c=Number(b.dataset.chapter);if(previewOriginal||s.field.completed.includes(c))concept(c,false,true);return;}
 if(name==='reward-continue'){if(Number(b.dataset.chapter)===4){finale();return;}modal.close();return;}
 if(name==='reward-concept'){const c=Number(b.dataset.chapter);if(s.field.completed.includes(c))concept(c,true);return;}
 if(name==='time-stop'){act(b.dataset.type,b.dataset.type==='season'?{step:Number(b.dataset.value)}:{day:Number(b.dataset.value)});return;}
 if(name==='hint-more'){ui.message='';ui.hintLevel=Math.min(1,ui.hintLevel+1);updateGuide(true);return;}if(name==='hint-point'){closeGuide();ctx.scene?.showHint?.(hintTarget(roomPhase(s.field)));return;}
 if(name==='sound'){const on=s.audio.bgm||s.audio.sfx||s.audio.voice;if(on){ui.previousAudio={...s.audio};s.audio.bgm=false;s.audio.sfx=false;s.audio.voice=false;}else s.audio=ui.previousAudio||{...s.audio,sfx:true,voice:true};if(!s.audio.voice){stopGuideVoice();stopVoice();}audio.updateAudio(s.audio);persist();render();return;}
 if(name==='audio-bgm'||name==='audio-sfx'||name==='audio-voice'){const k=name.slice(6);s.audio[k]=!s.audio[k];if(!s.audio.voice){stopGuideVoice();stopVoice();}audio.updateAudio(s.audio);persist();render();settings();return;}
 if(name==='guide'){if(ui.guide){closeGuide();return;}if(mode()==='map'&&Number.isInteger(ui.travelChapter))ctx.scene?.cancelTravel?.();ui.hintReturn=b;ui.guide=true;if(!ui.pending)ui.message='';ui.pending=false;updateGuide(true);return;}if(name==='hint-close'){closeGuide();return;}if(name==='door'||name==='door-next'){if(name==='door-next')modal.close();requestDoor(Number(b.dataset.chapter));return;}if(name==='step'){ctx.scene?.step(Number(b.dataset.x),Number(b.dataset.y));return;}
 if(name==='next'){if(mode()==='map'){const c=FIELD_CHAPTERS.findIndex((_,i)=>!s.field.completed.includes(i)&&fieldUnlocked(s.field,i));if(c<0)dialogs.story();else requestDoor(c);return;}if(previewOriginal){const chapter=s.field.active,phase=stageProgress(chapter,roomPhase(s.field),true).nextPhase;if(phase){s.field=previewFieldForPhase(s.field,chapter,phase);Object.assign(ui,{selection:null,play:false,autoPlay:false,guide:false,message:''});render();ctx.scene?.refresh();}else if(chapter<4){s.field=previewFieldForPhase(s.field,chapter+1,stageProgress(chapter+1,'',true).firstPhase);view('room');}else view('map');return;}const next=roomUI(s,ui).nextAction;if(next==='complete'){completeChapter();return;}if(next==='hint'){ui.hintReturn=b;ui.message='';ui.guide=true;updateGuide(true);ctx.scene?.showHint?.(hintTarget(roomPhase(s.field)));return;}if(next==='story-info'){dialogs.storyInfo();return;}if(next==='tower-start'){
  const start=ctx.scene?.startTower;if(!start||b.disabled)return;b.disabled=true;start();return;
 }if(next==='observation-done'){releaseObservation(s.field);Object.assign(ui,{guide:false,message:'',pending:false,hintLevel:0});audio.playSfx('success');render();ctx.scene?.refresh();return;}act(next);return;}
 if(name==='clear-drawing'){s.field.chapters[0].drawing=[];persist();ctx.scene?.refresh();return;}if(name==='map-fit'){if(mode()!=='map')return;ui.mapOverview=!ui.mapOverview;ctx.scene?.setMapOverview?.(ui.mapOverview);render();return;}if(name==='map-hand'){if(mode()!=='map')return;if(ui.mapOverview){ui.mapOverview=false;ctx.scene?.setMapOverview?.(false);}ui.mapHand=!ui.mapHand;ctx.scene?.setMapHand?.(ui.mapHand);render();return;}if(name==='autoplay'){ui.autoPlay=!ui.autoPlay;render();if(ui.autoPlay)ctx.scene?.autoPlay?.();return;}if(name==='film-play'){ui.play=!ui.play;render();ctx.scene?.refresh();return;}if(name==='cross-section'){ui.crossSection=!ui.crossSection;ctx.scene?.refresh();return;}
 if(name==='save-note'){act('observation-note',{text:$('observation-note').value});modal.close();return;}if(name==='predict'){act('seed-predict',{choice:b.dataset.choice});modal.close();return;}if(name==='save-story'){
  const values={title:$('story-title').value,summary:$('story-summary').value,subject:$('plan-subject').value,when:$('plan-when').value,what:$('plan-what').value};
  const result=act('book-finish-writing',values);
  if(result.ok)modal.close();
  else{const error=modal.querySelector('#story-writing-error');error.textContent=result.message;error.focus();}
  return;
 }
 if(name==='save-caption'){act('book-caption',{id:$('caption-record').value,text:$('story-caption').value});modal.close();return;}if(name==='remove-record'){act('book-record',{id:$('caption-record').value});modal.close();return;}
 if(name==='original-backup'){const saved=G.getSaveStatus(storage);if(saved.raw!==null){downloadBlob(new Blob([saved.raw],{type:'text/plain;charset=utf-8'}),'생명시계-저장원본.txt');}return;}
 if(name==='record'){void dialogs.record(b.dataset.id);return;}if(name==='archive-page'){ui.archivePage=(ui.archivePage||0)+Number(b.dataset.delta);dialogs.records();return;}if(name==='backup'){downloadBlob(new Blob([JSON.stringify(previewOriginal||s,null,2)],{type:'application/json'}),'생명시계-진행기록.json');return;}
 if(name==='teacher-preview'){if(!previewOriginal){previewOriginal=s;s=structuredClone(s);s.field.preview=true;modal.close();view('map');announce('교사 시연을 켰어. 모든 구역과 활동 단계를 고를 수 있어.');}else{const prefs=s.audio;s=previewOriginal;s.audio=prefs;previewOriginal=null;persist();render();openFieldView();settings();}return;}
 if(name==='reset'||name==='title-restart'){ui.restartFromTitle=name==='title-restart';ui.resetSnapshot=G.getSaveStatus(storage).expectedRaw;dialog(renderResetConfirm(ui.restartFromTitle?'close':'settings'));return;}if(name==='reset-confirm'){const next=G.fresh();next.audio={...s.audio};if(previewOriginal){next.field.preview=true;s=next;persist();}else if(G.resetGame(storage,next,ui.resetSnapshot)){s=next;}else{announce(saveIssue(),true);dialog({title:'기록을 지우지 않았어',body:'<p>확인하는 동안 저장된 기록이 바뀌었거나 저장소를 사용할 수 없어. 원본을 그대로 두었어. 기록함에서 현재 활동을 먼저 보관해 줘.</p>',actions:btn('기록함 열기','records')+btn('닫기','close','','primary')});return;}ui.resetSnapshot=null;modal.close();view('title');if(ui.restartFromTitle){ui.restartFromTitle=false;intro();}return;}
 if(name==='story-auto'){ui.storyAuto?.();return;}if(name==='story-prev'||name==='story-next'){ui.storyStep?.(name==='story-next'?1:-1);return;}
 if(name==='export'){void dialogs.export(b.dataset.bookSource==='finished');return;}
 const map={note:'note',prediction:'prediction','story-info':'storyInfo','story-caption':'caption',records:'records',bag:'bag',ending:'ending',certificate:'certificate','certificate-png':'certificatePNG','certificate-print':'certificatePrint','story-play':'story'};if(map[name]){void dialogs[map[name]]();return;}act(name,b.dataset.payload?JSON.parse(b.dataset.payload):{});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.classList.contains('focus-target'))return;const name=b.dataset.action||b.dataset.fieldAction;if(name)void action(name,b);});
document.addEventListener('input',e=>{
 const el=e.target;let scope,values;
 if(el.id==='story-caption'){scope='caption';values={id:el.dataset.recordId,text:el.value};}
 else if(el.id==='observation-note'){scope='observation';values={text:el.value};}
 else if(['story-title','story-summary'].includes(el.id)){scope='story';values={[el.id.slice(6)]:el.value};}
 else if(['plan-subject','plan-when','plan-what'].includes(el.id)){scope='plan';values={[el.id.slice(5)]:el.value};}
 if(scope){
  ctx.saveDraft(scope,values);
  if(scope==='story'||scope==='plan'){const error=modal.querySelector('#story-writing-error');if(error?.textContent)error.textContent='';}
  const status=modal.querySelector('[data-draft-status]');if(status)status.textContent='초안 보관됨 · 제출은 「설명 기록」을 눌러 줘.';
 }
});
document.addEventListener('change',e=>{const b=e.target;if(b.matches('[data-preview-phase]')&&previewOriginal){s.field=previewFieldForPhase(s.field,s.field.active,b.value);Object.assign(ui,{selection:null,play:false,autoPlay:false,guide:false});render();ctx.scene?.refresh();return;}if(b.dataset.time)act(b.dataset.time,b.dataset.time==='animal-time'?{animal:b.dataset.animal,step:Number(b.value)}:b.dataset.time==='season'?{step:Number(b.value)}:{day:Number(b.value)});});
document.addEventListener('input',e=>{if(e.target.id==='bgm-volume'){s.audio.volume=Number(e.target.value)/100;audio.updateAudio(s.audio);$('bgm-volume-value').textContent=e.target.value+'%';persist();}
 if(e.target.id==='sfx-volume'){s.audio.sfxVolume=Number(e.target.value)/100;audio.updateAudio(s.audio);$('sfx-volume-value').textContent=e.target.value+'%';persist();}});
modal.addEventListener('toggle',e=>{const detail=e.target;if(detail instanceof HTMLDetailsElement&&detail.open&&detail.classList.contains('settings-section')){for(const sibling of detail.parentElement.children)if(sibling!==detail&&sibling instanceof HTMLDetailsElement)sibling.open=false;}},true);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ui.guide&&!modal.open){e.preventDefault();e.stopPropagation();closeGuide();}});
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
motionPreference.addEventListener('change',()=>{
 dotoVoice.refreshMotion();
 if(reducedMotion(s.settings)){ui.play=false;ui.storyStop?.();document.querySelector('#concept-video')?.pause();document.querySelectorAll('[data-handwriting]').forEach(el=>{el.classList.remove('writing');el.textContent=el.dataset.handwriting;});}
 const travel=ui.travelChapter;ctx.scene?.refresh();if(Number.isInteger(travel)&&mode()==='map')ctx.scene?.walkDoor(travel);
});
// The first press or key starts the music; the listeners stay until the browser actually lets the audio run.
const unlockAudio=()=>void audio.initAudio(s.audio).then(running=>{if(running)for(const type of ['pointerdown','keydown'])document.removeEventListener(type,unlockAudio);});
for(const type of ['pointerdown','keydown'])document.addEventListener(type,unlockAudio);
// The all-villains film on the map stays muted: the ending theme plays while it is open, the main theme when it closes.
document.addEventListener('map-finale',event=>audio.setMusicTheme(event.detail?.open?'ending':'main'));
window.addEventListener('resize',()=>{positionFocus();app.classList.toggle('portrait-display',innerHeight>innerWidth);syncOrientationFocus();});window.addEventListener('pagehide',persist);
window.addEventListener('online',()=>{if(!ctx.scene?.failed?.size)return;if(modal.classList.contains('asset-error')&&modal.open)modal.close();ctx.scene.retryAssets();});
// Phaser's window listeners must not interpret an HTML tool press as a ground press.
for(const event of ['pointerdown','mousedown','touchstart'])for(const surface of [app,modal])surface.addEventListener(event,e=>{if(!e.target.closest('canvas'))e.stopPropagation();});
restoreTeacherPreview();
if(!G.getSaveStatus(storage).ok){ui.message=saveIssue();ui.pending=true;}
render();if(mode()!=='title')openFieldView();

const mapPad=bindDirectionPad(app,'.direction-pad [data-action="step"]',b=>Number(b.dataset.x)<0?'left':Number(b.dataset.x)>0?'right':Number(b.dataset.y)<0?'up':'down',{
 blocked:()=>mode()!=='map'||ctx.modalOpen(),repeatMs:80,
 press:dir=>{const v=MAP_VECTORS[dir];ctx.scene?.step(v.x,v.y);},tap:dir=>{const v=MAP_VECTORS[dir];ctx.scene?.step(v.x,v.y);}
});
