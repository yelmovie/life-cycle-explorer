import {SETTINGS_CONTENT as C} from './settings-content.js';
export {SETTINGS_CONTENT} from './settings-content.js';

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button = (label, action, classes='', extra='') => `<button type="button" class="${classes}" data-action="${action}" ${extra}>${esc(label)}</button>`;
const paragraphs = items => items.map(text => `<p>${esc(text)}</p>`).join('');
const details = (label, body, classes='') => `<details class="settings-section ${classes}"><summary>${esc(label)}</summary><div class="settings-section-body">${body}</div></details>`;
const switchRow = (label, action, enabled, disabled) => `<div class="sound-row"><span>${esc(label)}</span>${button(enabled?'켜짐':'꺼짐',action,'sound-switch',`role="switch" aria-checked="${enabled}" aria-label="${esc(label)} ${enabled?'끄기':'켜기'}" ${disabled?'disabled':''}`)}</div>`;

/** Returns modal content; caller owns persistence, focus and action handling. */
export function renderSettings(options={}) {
  const {audio={}, completed=0,total=5,teacherPreview=false,version='dev',audioAvailable=true} = options;
  const finished = Array.isArray(completed) ? completed.length >= total : Number(completed) >= total, sample = teacherPreview && !finished;
  const bgm = audio.bgm === true, sfx = audio.sfx !== false;
  const rawVolume = Number(audio.volume ?? .2);
  const volume = Math.round(Math.max(0, Math.min(1,Number.isFinite(rawVolume)?rawVolume:.2))*100);
  const standards = options.standards?.length ? options.standards : C.standards;
  const standardMarkup = standards.map(item => typeof item === 'string' ? `<p>${esc(item)}</p>` : `<p><strong>[${esc(item.code)}]</strong> ${esc(item.text)}</p>`).join('');
  const body = `<div class="settings-sound">
    ${switchRow('배경 음악','audio-bgm',bgm,!audioAvailable)}
    ${switchRow('효과음','audio-sfx',sfx,!audioAvailable)}
    <label class="volume-row" for="bgm-volume"><span>배경 음악 크기</span><output id="bgm-volume-value">${volume}%</output><input id="bgm-volume" data-action="audio-volume" type="range" min="0" max="100" step="5" value="${volume}" ${!bgm||!audioAvailable?'disabled':''} aria-label="배경 음악 크기"></label>
    ${!audioAvailable?'<p class="settings-note" role="status">이 브라우저에서는 소리를 재생할 수 없어요. 소리 없이도 모든 활동을 할 수 있어요.</p>':''}
  </div>
  <div class="settings-replays">
    ${button(C.intro,'intro','wide-button')}
    ${button(sample?'엔딩 다시 보기 (샘플)':'엔딩 다시 보기','ending','wide-button',finished?'':sample?'data-sample="1"':'disabled aria-describedby="ending-lock"')}
    ${button(sample?'인증서 받기 (샘플)':'인증서 받기','certificate','wide-button',finished?'':sample?'data-sample="1"':'disabled aria-describedby="ending-lock"')}
    ${button('개념 영상 모아 보기 (선택)','concept-list','wide-button')}
    ${finished?'':sample?'<p class="settings-note">교사 시연에서는 예시 기록으로 만든 샘플 엔딩과 인증서를 볼 수 있어요. 학생 기록에는 남지 않아요.</p>':'<p class="settings-note" id="ending-lock">다섯 구역의 탐구를 마치면 엔딩과 인증서가 열려요.</p>'}
  </div>
  ${details('앱 정보 · 배움과 보상',`<dl class="learning-list"><div><dt>${esc(C.purpose)}</dt><dd>${esc(C.purposeText)}</dd></div><div><dt>미션 보상</dt><dd>${esc(C.rewardText)}</dd></div><div><dt>남는 배움</dt><dd>${esc(C.learningText)}</dd></div></dl><p class="app-signature">${esc(C.appName)} v${esc(version)} · ${esc(C.signature)}</p><div class="settings-shortcuts">${button('탐구 기록함','records')}${button('도구 가방','bag')}</div>`)}
  ${details('학생용 가이드',paragraphs(C.students))}
  ${details('교사용 가이드',`${paragraphs(C.teachers)}${details('성취기준',`<p>${esc(C.curriculum)}</p>${C.curriculumNotice?`<p>${esc(C.curriculumNotice)}</p>`:''}${standardMarkup}`)}${details('교사용 도구',`${paragraphs(C.teacherTools)}${button(teacherPreview?'모두 열림 · 다시 누르면 닫기':'모든 단계 한 번에 열기','teacher-preview','wide-button',`aria-pressed="${teacherPreview}"`)}`)}`)}
  ${details('이미지·소리·저작권 고지',`${paragraphs(C.credits)}${details('자료 출처 모아 보기',`<p>미션 화면에는 출처를 표시하지 않고 이곳에 모아 두었습니다.</p>${C.sources.map(source=>`<h3>${esc(source.title)}</h3><p>${esc(source.text)}</p>`).join('')}`)}<div class="rights-notice">${paragraphs([C.copyright,C.ownRights,C.externalRights,C.educationalSources])}</div>`)}
  `;
  return {title:C.title,body,actions:button('탐구 기록 초기화','reset','quiet-button')+button('닫기','close','primary'),className:'settings-dialog'};
}

export function renderResetConfirm(cancel='settings') {
  return {title:C.resetTitle,body:`<p>${esc(C.resetText)}</p>`,actions:button('취소',cancel,'', 'autofocus')+button('기록 지우기','reset-confirm','danger'),className:'reset-dialog'};
}
