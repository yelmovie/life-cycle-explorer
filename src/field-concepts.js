import {esc} from './game-metadata.js';

// Captions stay in the DOM, so classroom text scales independently of video.
export const CONCEPTS=[
 {id:'butterfly',title:'모습이 달라져도 이어지는 한살이',seconds:12,cues:[
  [0,'알에서 깨어난 애벌레가 먹이를 먹으며 자라.'],[4,'번데기를 거쳐 날개가 있는 어른벌레가 돼.'],[8,'어른벌레가 낳은 알은 다음 세대의 새 생명이야.']]},
 {id:'seed',title:'씨앗이 싹트려면?',seconds:12,cues:[
  [0,'같은 씨앗과 흙에서 조건 하나만 바꿔 비교해.'],[4,'물과 알맞은 온도가 갖춰지면 싹이 터.'],[8,'발아 조건을 비교할 때 다른 조건은 같게 유지해.']]},
 {id:'care',title:'식물의 신호를 읽는 돌봄',seconds:12,cues:[
  [0,'잎이 달라졌다면 흙 속 물과 받은 빛을 함께 살펴봐.'],[4,'부족한 조건에 맞춰 물이나 빛을 도와줘.'],[8,'시간이 지난 뒤 새잎과 돌봄 전 사진을 비교해.']]},
 {id:'seasons',title:'같은 생물일까, 다음 세대일까?',seconds:12,cues:[
  [0,'나비와 개는 태어난 모습과 자라는 과정이 달라.'],[4,'겨울을 지난 사과나무는 작년 그 나무야. 줄기가 이어져 있어.'],[8,'봉선화가 남긴 씨앗에서 자란 새싹은 다음 세대야.']]},
 {id:'evidence',title:'내 기록으로 설명할 수 있어',seconds:12,cues:[
  [0,'자세히 관찰하고, 조건을 바꾸고, 변화를 기록해.'],[4,'사진 기록을 이어 무엇을 알아냈는지 설명해.'],[8,'실제 생물도 여러 날 관찰하며 내 생각을 확인해.']]},
];

export function openConcept({chapter,dialog,modal,audio,reduced=false,onFinish=()=>{},returnToList=false,finishLabel}){
 const clip=CONCEPTS[chapter];let closed=false,timeout=null,lastCue=-1,failed=false;
 dialog({title:clip.title,className:'concept-dialog',body:`<div class="concept-stage"><video id="concept-video" playsinline muted preload="metadata" poster="assets/concepts/${clip.id}.webp" aria-label="${esc(clip.title)} 모션 그래픽"></video><p id="concept-caption" role="status"></p><span class="concept-duration">12초 개념 발견</span></div><div class="concept-playback"><button type="button" id="concept-toggle">재생</button><label class="concept-seek-label">영상 시간<input id="concept-seek" type="range" min="0" max="12" step="0.1" value="0" aria-label="개념 영상 시간"></label><output id="concept-clock">0 / 12초</output></div><div id="concept-fallback" hidden><p>영상 대신 핵심 장면을 함께 살펴봐.</p><ol>${clip.cues.map(([,text])=>`<li>${esc(text)}</li>`).join('')}</ol></div>`,actions:`<button id="concept-replay">다시 보기</button><button id="concept-finish" class="primary">${chapter===4?'탐험 마무리':'숲으로 돌아가기'}</button>`});
 audio.pauseAudio();
 const legend=document.createElement('div');legend.className='concept-labels';modal.querySelector('.concept-stage').append(legend);
 const labels=[['알','애벌레','번데기','어른벌레'],['물 없음','낮은 온도','물 + 알맞은 온도'],['물 부족','빛 부족'],['나비','개'],['자세히 관찰','조건 비교','변화 기록']];
 const showLabels=t=>{const list=chapter===3&&t>=4?['사과나무 · 같은 줄기','봉선화 · 씨앗에서 새 생명']:labels[chapter];legend.style.gridTemplateColumns=`repeat(${list.length},1fr)`;legend.innerHTML=list.map(text=>`<span>${esc(text)}</span>`).join('');};showLabels(0);
 const video=modal.querySelector('video'),caption=modal.querySelector('#concept-caption'),seek=modal.querySelector('#concept-seek'),toggle=modal.querySelector('#concept-toggle'),controller=new AbortController(),opts={signal:controller.signal};
 const cue=()=>{const t=video.currentTime||0,i=clip.cues.findLastIndex(([start])=>t>=start);if(i!==lastCue){lastCue=i;caption.textContent=clip.cues[Math.max(0,i)][1];showLabels(t);}seek.value=t;modal.querySelector('#concept-clock').value=`${Math.floor(t)} / 12초`;};
 const fallback=()=>{if(closed)return;failed=true;clearTimeout(timeout);video.pause();video.hidden=true;modal.classList.add('is-fallback');modal.querySelector('.concept-stage').style.backgroundImage=`url("assets/concepts/${clip.id}.webp")`;modal.querySelector('#concept-fallback').hidden=false;modal.querySelector('.concept-playback').hidden=true;caption.textContent=clip.cues[2][1];};
 const armTimeout=()=>{clearTimeout(timeout);timeout=setTimeout(fallback,8000);};
 const play=()=>{if(closed||failed)return;video.hidden=false;armTimeout();video.play().catch(()=>{clearTimeout(timeout);toggle.textContent='재생';toggle.focus();});};
 const replay=()=>{if(failed){failed=false;video.hidden=false;modal.classList.remove('is-fallback');modal.querySelector('#concept-fallback').hidden=true;modal.querySelector('.concept-playback').hidden=false;video.load();}video.currentTime=0;cue();play();};
 video.addEventListener('loadedmetadata',()=>{clearTimeout(timeout);if(!reduced)play();},opts);
 video.addEventListener('timeupdate',cue,opts);video.addEventListener('playing',()=>{clearTimeout(timeout);toggle.textContent='일시정지';},opts);
 video.addEventListener('pause',()=>{clearTimeout(timeout);toggle.textContent='재생';},opts);
 video.addEventListener('waiting',armTimeout,opts);video.addEventListener('error',fallback,opts);
 video.addEventListener('ended',()=>{clearTimeout(timeout);video.hidden=true;modal.querySelector('.concept-stage').style.backgroundImage=`url("assets/concepts/${clip.id}.webp")`;toggle.textContent='다시 재생';modal.querySelector('#concept-finish').focus();},opts);
 toggle.addEventListener('click',()=>video.paused?(video.ended?replay():play()):video.pause(),opts);
 seek.addEventListener('input',()=>{if(Number.isFinite(video.duration)){video.hidden=false;video.currentTime=Number(seek.value);cue();}},opts);
 modal.querySelector('#concept-replay').addEventListener('click',replay,opts);
 if(finishLabel)modal.querySelector('#concept-finish').textContent=finishLabel;
 modal.querySelector('#concept-finish').addEventListener('click',()=>{modal.close();if(!returnToList)onFinish();},opts);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)video.pause();},opts);
 const cleanup=()=>{if(closed)return;closed=true;clearTimeout(timeout);controller.abort();video.pause();video.removeAttribute('src');video.querySelectorAll('source').forEach(n=>n.remove());video.load();audio.resumeAudio();if(returnToList&&!modal.open)queueMicrotask(onFinish);};
 modal.addEventListener('close',cleanup,opts);modal.addEventListener('modal-dismiss',cleanup,opts);
 cue();video.innerHTML=`<source src="assets/concepts/${clip.id}.webm" type="video/webm"><source src="assets/concepts/${clip.id}.mp4" type="video/mp4">`;video.load();armTimeout();
 return cleanup;
}
