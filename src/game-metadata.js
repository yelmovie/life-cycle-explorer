import {ART} from './game-assets.js';
import {REQUESTS} from './expedition.js';
export {ART};
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const art = (key,alt='',cls='') => `<img class="art ${esc(cls)}" src="${ART[key]||ART.seed3}" alt="${esc(alt)}" draggable="false" decoding="async">`;
export const BIO = [{id:'egg',name:'알',feature:'잎에 붙은 작은 알',detail:'잎에 붙은 작고 길쭉한 알이 보여.'},{id:'larva',name:'애벌레',feature:'길쭉한 몸과 다리',detail:'몸이 길쭉하고 여러 마디가 보여. 잎을 먹으며 자라.'},{id:'pupa',name:'번데기',feature:'몸을 감싼 단단한 껍질',detail:'겉모습은 조용해 보여도 안에서는 몸이 변하고 있어.'},{id:'adult',name:'어른벌레',feature:'넓게 펼쳐진 날개',detail:'날개가 생겼어. 어른벌레가 낳은 알에서 다음 세대가 시작돼.'}];
export const CHAPTER_NAMES=['나비의 숲','씨앗 연구소','햇살 온실','사계절 정원','생명 시계탑'];
export const REWARDS=REQUESTS.map(r=>({name:r.reward,art:r.art,use:r.use}));
