import {careTimeLabels} from './field-model.js';
import {FORM_SPOTS} from './field-content.js';

// New leaves attach to the three shoot tips of the unchanged pale-plant image.
// The coordinates use its square, contain-fit display box in records and clips.
export function lightRecoveryLeaves(x,y,size,opacity=1){
 return [[.385,.075],[.56,.25],[.725,.33]].map(([dx,dy])=>`<g transform="translate(${x+size*dx} ${y+size*dy}) scale(${size/310})" opacity="${opacity}" fill="#78a34c" stroke="#547e3c" stroke-width="1.2"><path d="M0 1C-3-11-16-13-23-9C-19 1-8 5 0 1Z"/><path d="M0 1C3-11 16-13 23-9C19 1 8 5 0 1Z"/><path d="M0 6V-2" fill="none"/></g>`).join('');
}

// Render the learner's captured conditions, dates, marks and drawing, not a stock reward image.
export async function fieldRecordArt(r,{img,text,parts}){
 const e=r.fieldEvidence;
 if(e.type==='observation'){
  await img(e.form,20,45,300,320);for(const i of e.spots)parts.push(`<circle cx="${110+i*110}" cy="220" r="13" fill="#e9bd54" stroke="#fff" stroke-width="4"/>`);
  parts.push('<rect x="355" y="50" width="335" height="325" rx="12" fill="#eee8cf"/>');
  // The draw step became a written note, so most records have no strokes:
  // show the magnified feature the learner looked at instead of an empty panel.
  if(!e.drawing.length&&e.spots.length){
   const [px,py]=FORM_SPOTS[e.form][e.spots[0]],cx=522,cy=212,R=140,S=830;
   parts.push(`<clipPath id="zoom-${e.form}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath><circle cx="${cx}" cy="${cy}" r="${R}" fill="#fffbed"/><g clip-path="url(#zoom-${e.form})">`);
   await img(e.form,cx-px*S,cy-py*S,S,S);
   parts.push(`</g><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#b88a3a" stroke-width="8"/>`);
  }
  for(const stroke of e.drawing)parts.push(`<polyline points="${stroke.map(p=>[365+p[0]*315,60+p[1]*305].join(',')).join(' ')}" fill="none" stroke="#285e45" stroke-width="4" stroke-linecap="round"/>`);
  text(360,420,'확대 관찰 · 네 모습을 살핀 공통 관찰 노트',21);text(360,464,(e.note.length>30?e.note.slice(0,30)+'…':e.note)||'관찰한 특징 기록',21);
 }else if(e.type==='retry'){
  const day=Math.max(...e.photos),growth=condition=>condition.water&&condition.warm?(day>=6?3:day>=4?2:day>=2?1:0):0;
  for(const[side,i]of ['a','b'].map((k,i)=>[k,i])){const c=e.conditions[side],x=180+i*360;await img('pot'+growth(c),x-155,50,310,290);text(x,35,'화분 '+side.toUpperCase());text(x,365,'물 '+(c.water?'있음':'없음')+' · '+(c.warm?'따뜻함':'차가움'));}
  text(360,410,'바꾼 조건: '+(e.variable==='water'?'물':'온도')+' 하나');text(360,448,'직접 찍은 날: '+e.photos.map(d=>d+'일').join(' · '),21);text(180,480,'내 예상: '+({a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 틈',unsure:'아직 모름'}[e.prediction]),18);text(540,480,e.legacyReport?'이전 기록 · 비교 응답 없음':'사진 B만 · '+({same:'예상과 같음',changed:'생각을 수정함',unsure:'처음엔 몰랐음'}[e.report?.expectation]||''),18);
 }else if(e.type==='care'){
  const light=e.variable==='light',labels=careTimeLabels(e);
  await img(light?'pale':'dry',25,45,310,310);await img(light?'paleRecover2':'pot3',385,45,310,310);
  text(180,395,labels[0]);text(540,395,labels[2]);text(360,435,light?'길어진 줄기는 그대로 · 새잎의 초록빛 비교':'물 조건을 돌본 전후 모습');text(360,470,'물기와 빛을 모두 확인 · 실제 회복 시간은 달라',19);
 }else if(e.type==='comparison'){
  const forms=e.animal==='butterfly'?['egg','larva','pupa','adult']:['puppy','dogYoung','dog'],photos=e.animal==='butterfly'?[0,1,2,3]:[...new Set(e.photos)].filter(n=>Number.isInteger(n)&&forms[n]).sort((a,b)=>a-b),names={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레',puppy:'갓 태어난 강아지',dogYoung:'어린 개',dog:'다 자란 개'};
  for(let i=0;i<photos.length;i++)await img(forms[photos[i]],25+i*680/photos.length,75,660/photos.length,270);
  text(360,400,(e.animal==='butterfly'?'내 시간 필름: ':'직접 기록한 모습: ')+photos.map(n=>names[forms[n]]).join(' → '),21);text(360,455,'다음 세대는 부모와 다른, 새로 태어난 생명이야.');
 }else if(e.type==='season'){
  const apple=e.plant==='apple',forms=apple?['appleSpring','winter','appleSpring']:['balsamSprout','balsamDry','balsamSprout'];
  for(let i=0;i<3;i++){await img(forms[i],25+i*230,60,210,300);text(130+i*230,400,['첫봄','겨울','다음 봄'][i]);}
  text(360,445,apple?'A-01 → A-01 · 겨울을 지난 같은 나무':'B-01 → 씨앗 → B-02 · 새로운 봉선화',22);text(360,480,'내 이름표와 세 계절의 사진 기록',20);
 }
}
