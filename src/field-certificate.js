import {fieldRecords} from './field-model.js';
import {SETTINGS_CONTENT} from './settings-content.js';
import {esc} from './game-metadata.js';
import {saveCertificatePng} from './certificate-png.js';

// NanumSquareNeo is the local font. Completed saves have no completion timestamp,
// so the date is the certificate creation day and the save format stays intact.
export const certificateDate=(date=new Date())=>`${date.getFullYear()}. ${date.getMonth()+1}. ${date.getDate()}.`;

export function certificateMarkup(field,book,{sample=false,reduced=false}={}){
 return `<section class="cert-paper${reduced?' cert-reduced':''}" aria-label="생명 탐험가 인증서"><img class="cert-frame" src="assets/field/certificate-frame-20261122.webp" alt="" aria-hidden="true"><div class="cert-content"><p class="cert-world">생명시계 연구실 · 숲의 시간 탐험대</p><h3 class="cert-title">생명 탐험가 인증서</h3><div class="cert-recipient"><div class="cert-recipient-top"><span class="cert-blank cert-school" data-cert-blank="school"></span><span>학교</span><span class="cert-blank cert-short" data-cert-blank="grade"></span><span>학년</span><span class="cert-blank cert-short" data-cert-blank="class"></span><span>반</span><span class="cert-blank cert-short" data-cert-blank="number"></span><span>번</span></div><div class="cert-recipient-name"><b>이름</b><span class="cert-blank cert-name" data-cert-blank="name"></span></div></div><p class="cert-award">위 탐험가는 생물의 한살이를 관찰하고 물·온도 조건을 비교하며,<br>물·빛을 잰 식물 돌봄과 겨울·다음 봄의 변화를 탐구하였으므로<br><strong>생명 탐험가</strong>로 이 인증서를 드립니다.</p><p class="cert-summary">다섯 구역 탐사 5/5 · 관찰 기록 ${fieldRecords(field).length}개 · 이야기 사진 ${book.records.length}장</p><p class="cert-context">${sample?'교사 시연용 샘플 · 학생 기록이나 기록증으로 저장되지 않아요.':'모형 활동의 수행 기록 · 실제 생물 관찰은 나의 약속으로 이어 가요.'}</p><div class="cert-bottom"><p class="cert-date">인증서를 만든 날<br><b>${certificateDate()}</b></p><div class="cert-stamp"><span aria-hidden="true">✦</span><strong>생명 탐험가<br>연구원 인증</strong></div><p class="cert-issuer">주는 이<br><b>생명시계 연구실 · 도토</b></p></div><small class="cert-credit">${esc(SETTINGS_CONTENT.copyright)}</small></div></section><p class="cert-note">인쇄한 뒤 학교·반·번호·이름을 직접 적어요.</p>`;
}

export async function saveCertificate(field,{print=false}={}){
 if(field.completed.length!==5)throw new Error('다섯 구역의 탐구를 먼저 마쳐 줘.');
 const paper=document.querySelector('.certificate-dialog .cert-paper');
 if(!paper)throw new Error('인증서를 먼저 열어 줘.');
 if(print){window.print();return;}
 await saveCertificatePng(paper,'생명-탐험가-인증서.png');
}
