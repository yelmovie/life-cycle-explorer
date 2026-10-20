import * as G from './game-model.js';
import {fieldAction,fieldRecords,fieldUnlocked} from './field-model.js';
import {FIELD_CHAPTERS,FORM_NAMES,FORM_TRAITS} from './field-content.js';
import {roomPhase,roomUI} from './field-flow.js';
import {createFieldGame} from './field-scenes.js';
import {ART,esc} from './game-metadata.js';
import {icon} from './ui-icons.js';
import {renderSettings,renderResetConfirm} from './game-settings.js';
import * as audio from './game-audio.js';
import {recordImage,downloadBlob} from './game-records.js';
import {createDialogs,btn} from './field-dialogs.js';
import {VERSION} from './game-info.js';

const storage={getItem(key){try{return window.localStorage.getItem(key);}catch{return null;}},setItem(key,value){window.localStorage.setItem(key,value);}};
let s=G.loadGame(storage),previewOriginal=null,focusItems=[];
const ui={selection:null,recordPage:0,play:false,guide:false,message:'',pending:false,restoreChapter:null,travelChapter:null};
const app=document.querySelector('#app'),modal=document.querySelector('#modal'),$=id=>document.getElementById(id),mode=()=>s.fieldView||'title';
const ib=(name,label,action)=>btn(icon(name),action,`aria-label="${label}" title="${label}"`,'icon-button');
app.innerHTML=`<main id="stage"><div id="phaser-root"></div><div id="map-doors"></div><div id="focus-targets"></div></main><nav class="screen-nav" aria-label="화면 도구"><div class="nav-left">${ib('home','처음으로','home')}${ib('back','이전 화면','back')}</div><div class="nav-right">${ib('sound','소리 끄기','sound')}${ib('settings','설정','settings')}</div></nav><div id="scene-title"></div><h1 id="objective"></h1><div id="controls"></div><button id="next" class="primary" data-action="next"></button><button id="guide" data-action="guide" aria-label="지훈이의 도움 보기"><img alt="" src="${ART.guideLook}"><span>…</span></button><div id="guide-bubble" hidden></div><div id="status" role="status" aria-live="polite"></div><section id="title-screen"><div class="title-copy"><p class="title-kicker">지훈이와 함께 떠나는 생명 탐험</p><h1>멈춰 버린 숲의<br><em>시간을 이어 줘!</em></h1><p>작은 생명을 관찰하고, 실험하고,<br>네가 찾은 증거로 숲을 깨워 봐.</p><div class="row">${btn('탐험 시작','start','','primary')}${btn('이어서 탐험','continue','','gold')}</div><small>끝까지 탐험하면 내 기록책과 탐험 기록증이 완성돼.</small></div><img class="title-jihoon" src="${ART.guideStory}" alt="기록책을 든 지훈"><img class="title-spirit" src="${ART.ipsae}" alt="숲의 친구 잎새"></section><div class="portrait">화면을 가로로 돌리면 숲을 더 넓게 볼 수 있어.</div><div class="boot">숲의 시간을 펼치는 중…</div>`;
function persist(){if(previewOriginal){previewOriginal.audio={...s.audio};return true;}const ok=G.saveGame(storage,s);if(!ok){ui.message='기기에 저장하지 못했어. 설정의 기록함에서 지금까지의 진행 파일을 보관해 줘.';ui.pending=true;}return ok;}
function announce(message,error=false){ui.message=message;ui.pending=true;$('status').textContent=message;audio.playSfx(error?'error':'place');updateGuide();}
function hint(){
 if(mode()==='map'){const n=[0,1,2,3,4].find(c=>!s.field.completed.includes(c));return n===undefined?'다섯 장소의 시간이 이어졌어. 다시 걸어가 기록을 더 살펴보자.':FIELD_CHAPTERS[n].title+'로 가 보자. 장소나 길을 누르면 내가 길을 따라 걸어갈게.';}
 const p=roomPhase(s.field),h={search:'돋보기를 잡아 생물의 앞과 뒤에 놓아 봐. 초록 표시가 생기면 다른 부분도 관찰해. 키보드로는 Tab으로 대상을 골라 Enter를 눌러도 돼.',draw:'왼쪽에서 보고 싶은 모습을 골라 빈 종이에 특징을 그려 봐. 네가 본 특징도 한 문장 남겨 줘.',film:'사진을 잡아 옆자리로 옮겨 봐. 네 순서대로 재생하며 몸이 자라는 변화를 비교해.',generation:'어른벌레가 낳은 알을 새 잎으로 옮겨 줘. 어른벌레가 알로 바뀌는 게 아니라 새로운 생명이 시작돼.',prepare:'흙 주머니를 각 화분으로 옮기고, 씨앗을 한 알씩 세 번 넣어. 두 화분의 재료를 같게 해야 조건을 비교할 수 있어.',design:'A는 그대로 두고 B에서 조건 하나만 바꿔. 물뿌리개는 물, 따뜻한 등은 온도를 바꿔. 내 예상도 먼저 남겨 줘.',grow:'시간 손잡이를 원을 그리며 돌려 봐. 처음(0일), 중간(2~4일), 마지막(6~7일) 사진이 필요해. 아래 슬라이더도 쓸 수 있어.',reason:'실제로 바꾼 조건이 네 근거야. 두 결과를 다르게 만든 조건을 가운데 연결 자리에 놓아 봐.',measure:'물과 빛 센서를 각각 화분에 놓아 봐. 잎이 시들었다고 모두 물이 부족한 건 아니야.',symptom:'관찰핀을 마른 흙이나 빛이 부족해 달라진 잎에 놓아 봐. 센서와 겉모습을 함께 살펴보자.',care:'센서로 확인한 부족한 조건을 도와줘. 물뿌리개나 빛 도구를 화분에 놓아 봐.','care-before':'지금 모습을 먼저 찍어야 돌본 뒤와 비교할 수 있어.','care-after':'시간을 돌려 이틀 뒤 새잎을 보고 찍어 줘. 실제 식물의 회복 시간은 종류와 환경에 따라 달라.',animals:'두 생물이 자라는 실제 기간은 서로 달라. 두 시간 손잡이를 따로 움직여 처음과 다 자란 모습을 각각 찍어 봐.','animal-birth':'나비는 알에서, 개는 어미에게서 새끼로 태어나. 태어난 모습은 달라도 다음 세대는 모두 부모와 다른 새 개체야. 다음 세대 표를 연결해.',tags:'A-01과 B-01을 알맞은 식물에 달고 첫봄 사진을 각각 찍어. 이름표는 같은 개체를 추적하는 단서야.',seasons:'나침반을 돌려 겨울과 다음 봄을 찍어. 사과나무의 줄기와 봉선화가 남긴 씨앗을 찾아봐.','plant-identity':'사과나무 A-01은 겨울을 지난 같은 개체야. 봉선화 B-01의 씨앗에서 난 B-02는 새 개체지.',transfer:'새 자료에서도 줄기 표식이 이어지는지, 무엇에서 태어났는지 살펴봐.','story-pick':'아래 실제 기록을 위 이야기판에 끌어 줘. 동물과 식물을 함께 담아 3~6장 골라.','story-edit':'이야기 이름과 발견한 생각을 써 줘. 사진 두 장 이상에는 무엇을 보고 알았는지도 설명해. 순서도 끌어 바꿀 수 있어.','story-help':'확대 관찰, 조건 비교 실험, 식물 돌봄에서 실제로 만든 기록을 요청에 연결해.',plan:'실제 주변 생물을 언제 어떻게 관찰할지 네 계획을 남겨 줘.'};
 if(p==='search'){const missing=Object.entries(s.field.chapters[0].inspected).find(([,a])=>a.length<2);return h[p]+(missing?' 아직 '+FORM_NAMES[missing[0]]+'에서 볼 부분이 남았어.':'');}return h[p]||FIELD_CHAPTERS[s.field.active].start;
}
function updateGuide(){$('guide').querySelector('img').src=ART[mode()==='room'?FIELD_CHAPTERS[s.field.active].guide:'guideLook'];$('guide').querySelector('span').textContent=ui.pending?'!':'…';$('guide-bubble').hidden=!ui.guide;$('guide-bubble').textContent=ui.message||hint();$('guide').setAttribute('aria-expanded',String(ui.guide));}
function view(next){s.fieldView=next;Object.assign(ui,{selection:null,guide:false,message:'',play:false,travelChapter:null});persist();render();ctx.scene?.refresh();}
function rangeControl(){const c=s.field.active,q=s.field.chapters[c],p=roomPhase(s.field);let value,max,label,type;
 if(c===1&&p==='grow'){value=q.rounds[q.round].day;max=7;label='씨앗 관찰 날짜';type='seed-day';}
 if(c===2&&p==='care-after'){value=q.cases[q.case].day;max=2;label='돌봄 뒤 시간';type='care-day';}
 if(c===3&&p==='seasons'){value=q.season;max=4;label='식물 관찰 계절';type='season';}
 if(c===3&&p==='animals')return `<div class="row time-sliders">${['butterfly','dog'].map(a=>`<label>${a==='butterfly'?'나비':'개'}<input type="range" data-time="animal-time" data-animal="${a}" aria-label="${a==='butterfly'?'나비':'개'}의 시간" min="0" max="${a==='butterfly'?3:2}" value="${q.animals[a].step}"></label>`).join('')}</div>`;
 return type?`<label class="time-slider">${label}<input type="range" data-time="${type}" min="0" max="${max}" value="${value}" aria-label="${label}"></label>`:'';
}
function render(){const m=mode(),room=m==='room';app.dataset.view=m;$('title-screen').hidden=m!=='title';for(const id of ['objective','guide','next','controls'])$(id).hidden=m==='title';$('scene-title').textContent=m==='title'?'':(previewOriginal?'교사 미리보기 · ':'')+(room?FIELD_CHAPTERS[s.field.active].title+' → '+FIELD_CHAPTERS[s.field.active].reward:'생명의 숲');$('map-doors').hidden=m!=='map';$('focus-targets').hidden=!room;
 $('title-screen').querySelector('[data-action=continue]').hidden=!s.field.completed.length&&!Object.values(s.field.chapters[0].inspected).some(a=>a.length);
 if(room){const info=roomUI(s,ui);$('objective').textContent=info.objective;$('controls').innerHTML=`<div class="field-menu">${info.controls}</div>`+rangeControl();$('next').textContent=info.next;}
 if(m==='map'){
  const c=[0,1,2,3,4].find(i=>!s.field.completed.includes(i)),travelling=Number.isInteger(ui.travelChapter);
  $('objective').textContent=travelling?FIELD_CHAPTERS[ui.travelChapter].title+' 가는 길을 따라 걷는 중이야.':c===undefined?'숲의 시간이 다시 흐르기 시작했어!':FIELD_CHAPTERS[c].question;
  $('controls').innerHTML=`<div class="row direction-pad">${[['left','왼쪽',-1,0],['up','위',0,-1],['down','아래',0,1],['right','오른쪽',1,0]].map(([i,l,x,y])=>btn(icon(i),'step',`data-x="${x}" data-y="${y}" aria-label="${l} 길로 걷기"`)).join('')}</div>`;
  $('next').textContent=travelling?'길을 따라 가는 중…':c===undefined?'내 이야기 보기':FIELD_CHAPTERS[c].title+' 가기';
  $('map-doors').innerHTML=FIELD_CHAPTERS.map((ch,i)=>`<button class="map-door ${s.field.completed.includes(i)?'done':fieldUnlocked(s.field,i)?'':'locked'}" data-action="door" data-chapter="${i}" aria-label="${ch.title}${fieldUnlocked(s.field,i)?' 입장하기':' · 앞 탐사 뒤 열림'}">${s.field.completed.includes(i)?icon('check'):fieldUnlocked(s.field,i)?'':icon('lock')}${ch.title}</button>`).join('');
 }
 $('next').disabled=m==='map'&&Number.isInteger(ui.travelChapter);
 const b=app.querySelector('[data-action=sound]'),on=s.audio.bgm||s.audio.sfx;b.innerHTML=icon(on?'sound':'mute');b.setAttribute('aria-label',on?'소리 끄기':'소리 켜기');b.setAttribute('aria-pressed',String(on));updateGuide();}
function coordinates(item){const canvas=document.querySelector('canvas');if(!canvas)return null;const a=canvas.getBoundingClientRect(),b=app.getBoundingClientRect();return {left:a.left-b.left+item.x*a.width/1280,top:a.top-b.top+item.y*a.height/800,w:item.w*a.width/1280,h:item.h*a.height/800};}
function focusTargets(items){focusItems=items;$('focus-targets').replaceChildren();items.forEach(item=>{const b=document.createElement('button');b.className='focus-target';b.setAttribute('aria-label',item.label);b.addEventListener('click',item.fn);$('focus-targets').append(b);});positionFocus();}
function positionFocus(){[...$('focus-targets').children].forEach((b,i)=>{const p=coordinates(focusItems[i]);if(p)Object.assign(b.style,{left:p.left+'px',top:p.top+'px',width:Math.max(48,p.w)+'px',height:Math.max(48,p.h)+'px'});});}
function dialog({title,body,actions=btn('계속 탐험','close','','primary'),className=''}){if(mode()==='map'){ctx.scene?.cancelTravel();ui.travelChapter=null;render();}modal.className=className;modal.innerHTML=`<h2>${esc(title)}</h2><button class="close icon-button" data-action="close" aria-label="닫기">${icon('close')}</button><div class="modal-body">${body}</div><div class="dialog-actions">${actions}</div>`;if(!modal.open)modal.showModal();if(ctx.scene)ctx.scene.input.enabled=false;modal.querySelector('[autofocus]')?.focus();}
modal.addEventListener('close',()=>{if(ctx.scene)ctx.scene.input.enabled=true;audio.resumeAudio();});
function settings(){dialog(renderSettings({audio:s.audio,completed:s.field.completed,teacherPreview:!!previewOriginal,version:VERSION,audioAvailable:audio.isAudioAvailable()}));}
function lockedDoor(chapter){
 const first=[0,1,2,3,4].find(i=>!s.field.completed.includes(i))??0,previous=FIELD_CHAPTERS[first];
 dialog({title:'앞 탐사를 먼저 마쳐 줘.',body:`<p>${FIELD_CHAPTERS[chapter].title}에 들어가려면 앞 탐사를 먼저 끝내야 해.</p><p>먼저 ${previous.title}에서 탐사를 마치고 ${previous.reward}를 받아 줘. 구역을 순서대로 탐사하면 다음 길이 열려.</p>`,actions:btn('닫기','close')+btn(previous.title+' 가기','door-next',`data-chapter="${first}"`,'primary')});
}
function requestDoor(chapter){
 if(!Number.isInteger(chapter)||chapter<0||chapter>4||mode()!=='map')return;
 if(!fieldUnlocked(s.field,chapter)){lockedDoor(chapter);return;}
 ctx.scene?.walkDoor(chapter);
}
function act(type,payload={}){const before=roomPhase(s.field),result=fieldAction(s.field,type,payload);ui.selection=null;announce(result.message,!result.ok);if(result.ok&&type==='inspect')ui.message=FORM_TRAITS[payload.form][payload.spot];if(result.ok&&roomPhase(s.field)!==before)Object.assign(ui,{guide:false,message:'',pending:false,recordPage:0});persist();render();ctx.scene?.refresh();return result;}
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
const ctx={get s(){return s;},ui,mode,dialog,announce,modalOpen:()=>modal.open,recordImage,focusTargets,sceneReady:positionFocus,placeDoors(items){if(mode()!=='map')return;for(const item of items){const b=$('map-doors').querySelector(`[data-chapter="${item.chapter}"]`),p=coordinates({...item,w:0,h:0});if(b&&p){const box=b.getBoundingClientRect(),question=$('objective').getBoundingClientRect();let x=Math.max(16+box.width/2,Math.min(innerWidth-16-box.width/2,p.left)),y=Math.max(16+box.height/2,Math.min(innerHeight-120-box.height/2,p.top));if(x+box.width/2>question.left&&x-box.width/2<question.right&&y-box.height/2<question.bottom+10)y=question.bottom+10+box.height/2;Object.assign(b.style,{left:x+'px',top:y+'px'});}}},emit(type,data){
 if(type==='loaded'){app.querySelector('.boot')?.remove();return;}if(type==='load-error'){announce('일부 그림을 불러오지 못했어. 연결을 확인한 뒤 다시 열어 줘.',true);return;}if(type==='map-step'){persist();return;}
 if(type==='travel-start'){ui.travelChapter=data;ui.guide=false;render();return;}
 if(type==='arrived'){ui.travelChapter=null;if(fieldUnlocked(s.field,data)){fieldAction(s.field,'chapter-enter',{chapter:data});view('room');}else{render();lockedDoor(data);}return;}
 if(type==='select'){ui.selection=data;audio.playSfx('select');$('status').textContent='도구를 골랐어. 연결할 대상을 골라 줘.';return;}if(type==='target'){if(ui.selection)drop({...ui.selection,target:data});return;}if(type==='drop'){drop(data);return;}if(type==='act'){act(data.type,data.payload);return;}
 if(type==='dial'){if(ui.dial)act(ui.dial.type,{...ui.dial.payload,...(ui.dial.type==='season'?{step:data}:{day:data})});return;}if(type.startsWith('animal-dial-')){act('animal-time',{animal:type.slice(12),step:data});return;}if(type==='caption'){dialogs.caption(data);return;}if(type==='feedback')announce(data,true);
}};
const dialogs=createDialogs(ctx);
function action(name,b){void audio.initAudio(s.audio);audio.playSfx('click');
 if(['start','intro'].includes(name)){dialogs.opening();return;}if(name==='continue'){view(s.fieldView==='title'?'map':s.fieldView);return;}if(name==='begin'){modal.close();view('map');return;}if(name==='home'){view('title');return;}if(name==='back'){if(modal.open)modal.close();else view(mode()==='room'?'map':'title');return;}
 if(name==='settings'){settings();return;}if(name==='close'){modal.close();return;}
 if(name==='sound'){const on=s.audio.bgm||s.audio.sfx;if(on){ui.previousAudio={...s.audio};s.audio.bgm=false;s.audio.sfx=false;}else s.audio=ui.previousAudio||{...s.audio,sfx:true};audio.updateAudio(s.audio);persist();render();return;}
 if(name==='audio-bgm'||name==='audio-sfx'){const k=name==='audio-bgm'?'bgm':'sfx';s.audio[k]=!s.audio[k];audio.updateAudio(s.audio);persist();render();settings();return;}
 if(name==='guide'){ui.guide=!ui.guide;ui.pending=false;updateGuide();return;}if(name==='door'||name==='door-next'){if(name==='door-next')modal.close();requestDoor(Number(b.dataset.chapter));return;}if(name==='step'){ctx.scene?.step(Number(b.dataset.x),Number(b.dataset.y));return;}
 if(name==='next'){if(mode()==='map'){const c=[0,1,2,3,4].find(i=>!s.field.completed.includes(i));if(c===undefined)dialogs.story();else requestDoor(c);return;}const next=roomUI(s,ui).nextAction;if(next==='complete'){const c=s.field.active;if(act('chapter-complete',{chapter:c}).ok){ui.restoreChapter=c;view('map');audio.playSfx('reward');if(c===4)dialogs.ending();}return;}if(next==='hint'){ui.message=hint();ui.guide=true;updateGuide();return;}if(next==='plan'){dialogs.plan();return;}act(next);return;}
 if(name==='clear-drawing'){s.field.chapters[0].drawing=[];persist();ctx.scene.refresh();return;}if(name==='film-play'){ui.play=!ui.play;render();ctx.scene.refresh();return;}if(name==='cross-section'){ui.crossSection=!ui.crossSection;ctx.scene.refresh();return;}if(name==='record-page'){ui.recordPage+=Number(JSON.parse(b.dataset.payload||'{}').delta)||0;ctx.scene.refresh();return;}
 if(name==='save-note'){act('observation-note',{text:$('observation-note').value});modal.close();return;}if(name==='predict'){act('seed-predict',{choice:b.dataset.choice});modal.close();return;}if(name==='save-story'){const title=$('story-title').value,summary=$('story-summary').value;act('book-title',{text:title});act('book-summary',{text:summary});modal.close();return;}
 if(name==='save-caption'){act('book-caption',{id:$('caption-record').value,text:$('story-caption').value});modal.close();return;}if(name==='remove-record'){act('book-record',{id:$('caption-record').value});modal.close();return;}
 if(name==='save-plan'){const result=act('observation-plan',{subject:$('plan-subject').value,when:$('plan-when').value,what:$('plan-what').value});if(result.ok)modal.close();return;}
 if(name==='record'){void dialogs.record(b.dataset.id);return;}if(name==='backup'){downloadBlob(new Blob([JSON.stringify(previewOriginal||s,null,2)],{type:'application/json'}),'생명시계-진행기록.json');return;}
 if(name==='teacher-preview'){if(!previewOriginal){previewOriginal=s;s=structuredClone(s);s.field.preview=true;}else{const prefs=s.audio;s=previewOriginal;s.audio=prefs;previewOriginal=null;persist();}render();ctx.scene.refresh();settings();return;}
 if(name==='reset'){dialog(renderResetConfirm());return;}if(name==='reset-confirm'){const prefs=s.audio;s=G.fresh();s.audio=prefs;if(previewOriginal)s.field.preview=true;persist();modal.close();view('title');return;}
 if(name==='story-prev'||name==='story-next'){ui.storyStep?.(name==='story-next'?1:-1);return;}
 const map={note:'note',prediction:'prediction','story-info':'storyInfo','story-caption':'caption',plan:'plan',records:'records',bag:'bag',ending:'ending',certificate:'certificate','certificate-png':'certificatePNG',export:'export','story-play':'story'};if(map[name]){void dialogs[map[name]]();return;}act(name,b.dataset.payload?JSON.parse(b.dataset.payload):{});
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled||b.classList.contains('focus-target'))return;const name=b.dataset.action||b.dataset.fieldAction;if(name)void action(name,b);});
document.addEventListener('change',e=>{const b=e.target;if(b.id==='caption-record'){$('story-caption').value=s.field.chapters[4].captions[b.value]||'';return;}if(b.dataset.time)act(b.dataset.time,b.dataset.time==='animal-time'?{animal:b.dataset.animal,step:Number(b.value)}:b.dataset.time==='season'?{step:Number(b.value)}:{day:Number(b.value)});});
document.addEventListener('input',e=>{if(e.target.id==='bgm-volume'){s.audio.volume=Number(e.target.value)/100;audio.updateAudio(s.audio);$('bgm-volume-value').textContent=e.target.value+'%';persist();}});
document.addEventListener('pointerdown',()=>void audio.initAudio(s.audio),{once:true});window.addEventListener('resize',()=>{positionFocus();app.classList.toggle('portrait-display',innerHeight>innerWidth);});window.addEventListener('pagehide',persist);
// Phaser's window listeners must not interpret an HTML tool press as a ground press.
for(const event of ['pointerdown','mousedown','touchstart'])for(const surface of [app,modal])surface.addEventListener(event,e=>{if(!e.target.closest('canvas'))e.stopPropagation();});
render();createFieldGame(ctx);
