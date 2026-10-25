import { ASSETS, SCENES } from './assets.js';
export const ART = Object.freeze({
  ...ASSETS, larva:ASSETS.caterpillar, pupa:ASSETS.chrysalis, adult:ASSETS.butterfly,
  jihoon:'assets/adventure/jihoon-explore.webp', think:'assets/adventure/jihoon-think.webp', cheer:'assets/adventure/jihoon-cheer.webp',
  ipsae:'assets/adventure/ipsae-guide.webp', ipsaeCheer:'assets/adventure/ipsae-cheer.webp', walk:'assets/adventure/map-walk-sheet.webp',
  leaf:'assets/adventure/leaf-world.webp', pot0:'assets/adventure/pot-seed.webp', pot1:'assets/adventure/pot-root.webp', pot2:'assets/adventure/pot-sprout.webp', pot3:'assets/adventure/pot-healthy.webp',
  pale:'assets/adventure/pot-pale.webp', dry:'assets/adventure/pot-dry.webp', magnifier:'assets/adventure/magnifier.webp', watercan:'assets/adventure/watering-can.webp',
  season:'assets/adventure/season-lens.webp', camera:'assets/adventure/field-camera.webp', book:'assets/adventure/storybook.webp', puppy:'assets/adventure/dog-puppy.webp', balsamDry:'assets/adventure/balsam-dry.webp', winter:'assets/adventure/apple-winter.webp',
  plant:'assets/adventure/pot-healthy.webp', rose:'assets/optimized/scene-08.webp',
  appleSpring:'assets/adventure/apple-spring.webp', appleSummer:'assets/adventure/apple-summer.webp',
  balsamSprout:'assets/adventure/balsam-sprout.webp', balsamSeeds:'assets/adventure/balsam-seeds.webp', dogYoung:'assets/adventure/dog-young.webp',
});
export { SCENES };
export const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const art = (key,alt='',cls='') => `<img class="art ${esc(cls)}" src="${ART[key]||ART.seed3}" alt="${esc(alt)}" draggable="false" decoding="async">`;
export const BIO = [{id:'egg',name:'알',feature:'잎에 붙은 작은 알',detail:'잎 위에 작고 둥근 알이 붙어 있어.'},{id:'larva',name:'애벌레',feature:'길쭉한 몸과 다리',detail:'몸이 길쭉하고 여러 마디가 보여. 잎을 먹으며 자라.'},{id:'pupa',name:'번데기',feature:'몸을 감싼 단단한 껍질',detail:'겉모습은 조용해 보여도 안에서는 몸이 변하고 있어.'},{id:'adult',name:'어른벌레',feature:'넓게 펼쳐진 날개',detail:'날개가 생겼어. 어른벌레가 낳은 알에서 다음 세대가 시작돼.'}];
export const CHAPTER_NAMES=['나비의 숲','씨앗 연구소','햇살 온실','사계절 정원','생명 시계탑'];
export const REWARDS=[{name:'시간 돋보기',art:'magnifier',use:'씨앗 연구소에서 흙 속 뿌리를 살펴볼 수 있어.'},{name:'비교 렌즈',art:'lightSensor',use:'햇살 온실에서 잎의 색과 줄기를 나란히 비교해.'},{name:'계절 렌즈',art:'season',use:'사계절 정원에서 한 해 뒤의 모습을 확인해.'},{name:'이야기 카메라',art:'camera',use:'모아 둔 관찰 기록으로 나만의 한살이 책을 만들어.'},{name:'생명 탐험가',art:'core',use:'내 탐구 기록이 시계에 남았어. 주변 생물도 직접 관찰해 봐!'}];
