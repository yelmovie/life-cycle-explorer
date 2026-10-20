// Render the learner's captured conditions, dates, marks and drawing, not a stock reward image.
export async function fieldRecordArt(r,{img,text,parts}){
 const e=r.fieldEvidence;
 if(e.type==='observation'){
  await img(e.form,20,45,300,320);for(const i of e.spots)parts.push(`<circle cx="${110+i*110}" cy="220" r="13" fill="#e9bd54" stroke="#fff" stroke-width="4"/>`);
  parts.push('<rect x="355" y="50" width="335" height="325" rx="12" fill="#eee8cf"/>');
  for(const stroke of e.drawing)parts.push(`<polyline points="${stroke.map(p=>[365+p[0]*315,60+p[1]*305].join(',')).join(' ')}" fill="none" stroke="#285e45" stroke-width="4" stroke-linecap="round"/>`);
  text(360,420,'확대 관찰 두 부분 · 네 모습을 살핀 공통 관찰 노트',21);text(360,464,e.note.slice(0,30)||'관찰한 특징 기록',21);
 }else if(e.type==='retry'){
  const day=Math.max(...e.photos),growth=condition=>condition.water&&condition.warm?(day>=6?3:day>=4?2:day>=2?1:0):0;
  for(const[side,i]of ['a','b'].map((k,i)=>[k,i])){const c=e.conditions[side],x=180+i*360;await img('pot'+growth(c),x-155,50,310,290);text(x,35,'화분 '+side.toUpperCase());text(x,365,'물 '+(c.water?'있음':'없음')+' · '+(c.warm?'따뜻함':'차가움'));}
  text(360,410,'바꾼 조건: '+(e.variable==='water'?'물':'온도')+' 하나');text(360,448,'직접 찍은 날: '+e.photos.map(d=>d+'일').join(' · '),21);text(360,480,'내 예상: '+({a:'A만',b:'B만',both:'둘 다',neither:'둘 다 안 틈',unsure:'아직 모름'}[e.prediction]),20);
 }else if(e.type==='care'){
  await img(e.variable==='water'?'dry':'pale',25,45,310,310);await img('pot3',385,45,310,310);text(180,395,'돌봄 전 · 0일');text(540,395,'돌봄 뒤 · 이틀 뒤');text(360,440,'확인한 센서: 물 + 빛');text(360,475,'도운 조건: '+(e.tool==='water'?'물':'빛'));
 }else if(e.type==='comparison'){
  const forms=e.animal==='butterfly'?['egg','larva','pupa','adult']:['puppy','dogYoung','dog'];
  for(let i=0;i<forms.length;i++)await img(forms[i],25+i*680/forms.length,75,660/forms.length,270);
  text(360,400,'직접 기록한 모습: '+e.photos.map(n=>forms[n]?({egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레',puppy:'갓 태어난 강아지',dogYoung:'어린 개',dog:'다 자란 개'}[forms[n]]):'').join(' · '),21);text(360,455,'다음 세대는 부모와 다른 새로운 개체야.');
 }else if(e.type==='season'){
  const apple=e.plant==='apple',forms=apple?['appleSpring','winter','appleSpring']:['balsamSprout','balsamDry','balsamSprout'];
  for(let i=0;i<3;i++){await img(forms[i],25+i*230,60,210,300);text(130+i*230,400,['첫봄','겨울','다음 봄'][i]);}
  text(360,445,apple?'A-01 → A-01 · 겨울을 지난 같은 나무':'B-01 → 씨앗 → B-02 · 새로운 봉선화',22);text(360,480,'내 이름표와 세 계절의 사진 기록',20);
 }
}
