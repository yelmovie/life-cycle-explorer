// Static markup of the game shell: the header, stage, footer and title screen, and Doto's hint card.
// Split out of game-app.js (E2); game-app.js fills and wires these elements.
import {btn} from './field-dialogs.js';
import {icon} from './ui-icons.js';
import {ART,esc} from './game-metadata.js';
import {SETTINGS_CONTENT} from './game-settings.js';
import {COMPANION_ART} from './field-companion.js';

const ib=(name,label,action)=>btn(icon(name),action,`aria-label="${label}" title="${label}"`,'icon-button');
const titleScreen=`<section id="title-screen" aria-label="생명 시계 연구실 시작 화면">
 <div class="title-motes" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
 <div class="title-copy">
  <p class="title-kicker"><span></span>지훈·잎새·도토와 함께하는 숲속 탐험</p>
  <h1 class="title-wordmark"><span class="sr-only">생명 시계 연구실</span><img class="title-logo" src="assets/field/title-logo-v1.webp" alt="" width="1200" height="668" fetchpriority="high" decoding="async" draggable="false"></h1>
  <p class="title-hook">작은 씨앗이 숲을 깨울 수 있을까?</p>
  <p class="title-description">나비의 변신부터 씨앗의 첫 새싹까지.<br>네가 찾은 생명의 비밀로 숲의 시간을 이어 줘.</p>
  <div class="title-actions">${btn('<span>나비 관찰 시작</span>'+icon('right'),'start','','primary title-start')}${btn('이어서 탐험','continue','','title-continue')}${btn('처음부터 다시 하기','title-restart','hidden','title-continue title-restart')}</div>
 </div>
 <div class="title-character-glow" aria-hidden="true"></div>
 <img class="title-jihoon" src="${ART.guideStory}" alt="기록책을 들고 숲으로 안내하는 지훈" draggable="false">
 <img class="title-spirit" src="${ART.ipsae}" alt="숲의 친구 잎새" draggable="false">
 <img class="title-doto" src="${COMPANION_ART}" alt="함께 탐험하는 다람쥐 도토" draggable="false">
 <p class="title-credit">${esc(SETTINGS_CONTENT.copyright)}</p>
</section>`;
export const shellMarkup=rewardSlots=>`<header class="game-header"><nav class="screen-nav" aria-label="화면 도구"><div class="nav-left">${ib('home','처음으로','home')}${ib('back','이전 화면','back')}</div><div id="scene-title"></div><div class="nav-right"><button id="save-badge" class="save-badge" data-action="records" hidden>기록 보호 중</button><button id="autoplay" class="autoplay-button" data-action="autoplay" hidden></button>${rewardSlots}${ib('sound','소리 끄기','sound')}${ib('settings','설정','settings')}</div></nav><h1 id="objective"></h1></header><main id="stage"><div id="phaser-root"></div><div id="map-doors"></div><div class="map-companion-layer"></div><div id="focus-targets"></div><section id="field-recovery" hidden><p role="status"></p>${btn('탐험 도구 다시 불러오기','field-retry','hidden','primary')}${btn('탐구부터 시작하기','field-direct','hidden')}</section><section id="flat-observation" hidden></section></main><footer class="game-footer"><div id="status" role="status" aria-live="polite"></div><div id="guide-bubble" hidden></div><div class="guide-tools"><button id="guide" data-action="guide" aria-label="지훈이의 도움 보기"><img alt="" src="${ART.guideLook}"><span>…</span></button></div><div id="controls"></div><div class="game-next"><div class="map-camera-tools"><button id="map-fit" class="map-hand" data-action="map-fit" aria-label="지도 전체 보기" title="지도 전체 보기" aria-pressed="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M8 8h8v8H8z"/></svg></button><button id="map-hand" class="map-hand" data-action="map-hand" aria-pressed="false" hidden></button></div><button id="next" class="primary" data-action="next"></button></div></footer>${titleScreen}<div class="portrait" role="status">화면을 가로로 돌리면 숲을 더 넓게 볼 수 있어.</div>`;
export const GUIDE_BUBBLE_MARKUP=`<div class="npc-dialogue-portrait" aria-hidden="true"></div><div class="npc-dialogue-card"><h3>도토</h3><p id="guide-text" data-npc-speech aria-live="polite" aria-atomic="true"></p><div class="row">${btn('위치 보기','hint-point','hidden')}${btn('다음 단서','hint-more','hidden')}${btn('닫기','hint-close','aria-label="도토 도움말 닫기"')}</div></div>`;
