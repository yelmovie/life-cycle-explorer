import {ART,esc} from './game-metadata.js';

// Full-screen story films. The generated clips are silent: the game's own BGM keeps playing underneath,
// and captions, place tags and stamps stay in the DOM so they scale and remain readable on classroom screens.
export const CINEMA={
 intro:{
  title:'멈춰 버린 숲의 시간',music:'main',seconds:17.4,
  label:'생명 시계의 빛이 꺼지고 바늘이 사라지는 인트로 영상',
  places:[[0,'그날 밤','생명 시계탑'],[3.4,'다음 날 아침','숲 너머 마을로'],[10.4,'도착','생명 시계 연구실 앞']],
  cues:[
   [0.4,3.2,'반짝이던 생명 시계의 빛이\n갑자기 꺼져 버렸어.'],
   [3.6,6.6,'다음 날 아침, 지훈이와 잎새, 도토는\n시계를 찾아 길을 나섰어.'],
   [6.9,10.1,'그런데 마을이 이상해.\n나비도 씨앗도 자라지 않는대.'],
   [10.6,13.4,'앗, 시계 바늘이…\n하나씩 사라지고 있어!'],
   [13.7,16.2,'생명의 변화를 기록한 증거만이\n멈춘 시간을 다시 이을 수 있대.'],
  ],
  cardAt:16.3,
 },
 final:{
  title:'다시 이어진 숲의 시간',music:'ending',seconds:24.5,
  label:'탐험을 되돌아보고 생명 시계가 황금빛으로 다시 움직이는 파이널 영상',
  cues:[
   [0.6,3.4,'다섯 장소를 모두 지나\n드디어 여기까지 왔어!'],
   [3.7,7.3,'작은 꼬투리도 돋보기로\n자세히 관찰했고,'],
   [7.6,10.9,'조건을 하나씩 바꾸며\n씨앗이 싹트는 걸 비교했지.'],
   [11.2,14.8,'나비의 한살이도, 계절의 변화도\n모두 네 기록책에 담겼어.'],
   [15.2,19.3,'네 기록이 모이자\n생명 시계가 다시 움직이기 시작했어!'],
   [19.7,22.2,'숲의 시간이 다시 이어졌어.\n고마워, 생명 탐험가!'],
  ],
  // Each stamp lights up as the film recaps that kind of evidence; all five glow when the clock restarts.
  stamps:[[3.7,'나비의 숲'],[7.6,'씨앗 연구소'],[9.4,'햇살 온실'],[12.6,'사계절 정원'],[15.2,'생명 시계탑']],
  glowAt:15.2,cardAt:22.3,
 },
};

export function openCinema({id,dialog,modal,reduced=false,detail='',onFinish=()=>{}}){
 const film=CINEMA[id];let closed=false,finished=false,timeout=null,lastCue=-2,lastPlace=-1,cardShown=false;
 const places=film.places?`<p class="cinema-place" aria-hidden="true"><span class="cinema-place-kicker"></span><span class="cinema-place-name"></span></p>`:'';
 const stamps=film.stamps?`<ol class="cinema-stamps" aria-label="탐험한 장소">${film.stamps.map(([,name],i)=>`<li data-stamp="${i}"><span class="cinema-stamp-seal" aria-hidden="true">${i+1}</span><span>${esc(name)}</span></li>`).join('')}</ol>`:'';
 const card=id==='intro'
  ?`<img class="cinema-card-logo" src="assets/field/title-logo-v1.webp" alt="생명 시계 연구실"><p class="cinema-card-line">멈춘 시간을 이어 줄 탐험가를 기다리고 있어.</p><button type="button" class="primary cinema-finish" data-cinema-finish>숲으로 출발</button>`
  :`<img class="cinema-card-medal" src="${ART.towerMedal}" alt="생명 시계 연구원 메달"><h3 class="cinema-card-title">생명 탐험가 인증!</h3><p class="cinema-card-line">${esc(detail||'네 관찰과 실험 기록이 숲의 시간을 다시 이었어.')}</p><button type="button" class="gold cinema-finish" data-cinema-finish>내 탐험 기록 보기</button>`;
 dialog({title:film.title,className:'cinema-dialog cinema-'+id,music:film.music,actions:'',body:`<div class="cinema-stage">
  <video class="cinema-video" playsinline muted preload="auto" poster="assets/video/${id}-poster.jpg" aria-label="${esc(film.label)}"></video>
  <div class="cinema-shade" aria-hidden="true"></div>${places}${stamps}
  <p class="cinema-caption" role="status"></p>
  <button type="button" class="cinema-play" data-cinema-play hidden>▶ 영상 보기</button>
  <button type="button" class="cinema-skip" data-cinema-skip>건너뛰기 ›</button>
  <div class="cinema-card" hidden>${card}</div>
  <div class="cinema-progress" aria-hidden="true"><span></span></div>
 </div>`});
 const stage=modal.querySelector('.cinema-stage'),video=stage.querySelector('video'),caption=stage.querySelector('.cinema-caption'),bar=stage.querySelector('.cinema-progress span'),playButton=stage.querySelector('[data-cinema-play]');
 const controller=new AbortController(),opts={signal:controller.signal};
 const showCard=()=>{if(cardShown)return;cardShown=true;caption.classList.remove('is-on');stage.classList.add('is-card');stage.querySelector('.cinema-card').hidden=false;stage.querySelector('[data-cinema-skip]').hidden=true;stage.querySelector('[data-cinema-finish]').focus({preventScroll:true});};
 const tick=()=>{
  const t=video.currentTime||0;bar.style.transform=`scaleX(${Math.min(1,t/film.seconds)})`;
  const i=film.cues.findIndex(([start,end])=>t>=start&&t<end);
  if(i!==lastCue){lastCue=i;caption.classList.remove('is-on');if(i>=0){caption.textContent=film.cues[i][2];void caption.offsetWidth;caption.classList.add('is-on');}}
  if(film.places){const p=film.places.findLastIndex(([start])=>t>=start);if(p!==lastPlace&&p>=0){lastPlace=p;const tag=stage.querySelector('.cinema-place');tag.classList.remove('is-on');tag.firstElementChild.textContent=film.places[p][1];tag.lastElementChild.textContent=film.places[p][2];void tag.offsetWidth;tag.classList.add('is-on');}}
  if(film.stamps){stage.querySelectorAll('[data-stamp]').forEach((li,n)=>li.classList.toggle('is-lit',t>=film.stamps[n][0]));stage.classList.toggle('is-glow',t>=film.glowAt);}
  if(t>=film.cardAt)showCard();
 };
 const finish=()=>{if(finished)return;finished=true;cleanup();onFinish();};
 const fallback=()=>{if(closed)return;clearTimeout(timeout);video.pause();stage.style.backgroundImage=`url("assets/video/${id}-poster.jpg")`;video.hidden=true;showCard();};
 const play=()=>{if(closed)return;playButton.hidden=true;clearTimeout(timeout);timeout=setTimeout(fallback,8000);video.play().catch(()=>{clearTimeout(timeout);playButton.hidden=false;playButton.focus();});};
 video.addEventListener('playing',()=>clearTimeout(timeout),opts);
 video.addEventListener('waiting',()=>{clearTimeout(timeout);timeout=setTimeout(fallback,8000);},opts);
 video.addEventListener('timeupdate',tick,opts);video.addEventListener('ended',()=>{tick();showCard();},opts);
 video.addEventListener('error',fallback,opts);
 playButton.addEventListener('click',play,opts);
 stage.querySelector('[data-cinema-skip]').addEventListener('click',()=>{video.pause();if(cardShown)finish();else{video.currentTime=film.cardAt;tick();showCard();}},opts);
 stage.querySelector('[data-cinema-finish]').addEventListener('click',finish,opts);
 // Escape skips ahead instead of dropping the learner out of the story flow.
 modal.addEventListener('cancel',e=>{e.preventDefault();if(cardShown)finish();else stage.querySelector('[data-cinema-skip]').click();},opts);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();else if(!cardShown&&!reduced&&video.paused&&video.currentTime>0)play();},opts);
 const cleanup=()=>{if(closed)return;closed=true;clearTimeout(timeout);controller.abort();video.pause();video.removeAttribute('src');video.load();};
 // A close queued by the previous dialog can arrive after the film has reopened the modal; only a real close ends it.
 modal.addEventListener('close',()=>{if(!modal.open)cleanup();},opts);modal.addEventListener('modal-dismiss',cleanup,opts);
 video.src=`assets/video/${id}.mp4`;video.load();
 if(reduced)playButton.hidden=false;else play();
 tick();
 return cleanup;
}
