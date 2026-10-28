import {ART,esc} from './game-metadata.js';
import {FORM_NAMES,FORM_TRAITS} from './field-content.js';
import {careTimeLabels,seedObservation} from './field-model.js';
import {lightRecoveryLeaves} from './field-record-art.js';
import {mountSpecimen3d} from './field-specimen-3d.js';

const FORMS=['egg','larva','pupa','adult'];
const img=(key,alt='')=>`<img src="${ART[key]}" alt="${esc(alt)}" draggable="false">`;
const stageName={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레',puppy:'갓 태어난 강아지',dogYoung:'어린 개',dog:'다 자란 개'};

/** A snapshot of the current capture, never a future growth/reward illustration. */
export function photoNotebookEntry(s,type,p={}){
 const f=s.field;
 if(type==='seed-photo'){
  const r=f.chapters[1].rounds[f.chapters[1].round];if(!r.run)return null;
  const cards=['a','b'].map(side=>{const observed=seedObservation(r,side),c=observed.condition;return {art:'pot'+observed.level,label:`화분 ${side.toUpperCase()} · ${r.day}일`,detail:`물 ${c.water?'있음':'없음'} · ${c.warm?'22°C 따뜻함':'5°C 차가움'}`};});
  const complete=[d=>d===0,d=>d>=2&&d<=4,d=>d>=6].every(test=>r.photos.some(test));
  return {title:`씨앗 비교 · ${r.day}일`,cards,note:r.day===0?'두 화분의 처음 모습을 남겼다. 며칠 뒤 모습과 비교해 보자.':cards.every(c=>c.art==='pot0')?'아직 싹이 보이지 않는다. 같은 조건을 유지하고 더 관찰해 보자.':'두 화분에서 싹이 보이는지 살펴보았다. 바꾼 조건과 함께 비교해 보자.',next:complete?'사진을 닫고 결과를 바꾼 조건을 연결해 줘.':'사진을 닫고 시간을 돌려 다음 모습을 찍어 줘.',stamp:'비교 사진 기록'};
 }
 if(type==='care-photo'){
  const r=f.chapters[2].cases[f.chapters[2].case],when=careTimeLabels(r)[r.day],recovered=r.day===2&&!!r.tool,art=r.variable==='light'?['pale','paleRecover1','paleRecover2'][r.tool?r.day:0]:['dry','dryRecover1','pot3'][r.tool?r.day:0];
  return {title:`식물 돌봄 · ${when}`,cards:[{art,newLeaves:recovered&&r.variable==='light',label:when,detail:`흙 속 물: ${r.variable==='water'?'부족':'충분'} · 빛: ${r.variable==='light'?'부족':'충분'}${r.day?' (돌봄 전 측정)':''}`}],note:r.day===0?'돌보기 전 모습을 남겼다. 물기와 빛을 잰 결과에 맞게 도와주자.':recovered&&r.variable==='light'?'길어진 줄기는 그대로다. 빛을 받은 뒤 자란 새잎의 초록빛을 살펴보자.':r.day===2?'돌본 뒤 새잎의 모습을 기록했다. 돌보기 전 사진과 비교해 보자.':'돌본 뒤의 모습을 살펴보았다. 더 시간이 흐른 뒤 변화도 기록하자.',next:r.day===0?'사진을 닫고 알맞은 돌봄 도구를 골라 줘.':r.day===2?'사진을 닫고 돌봄 전후 사진을 비교해 줘.':'사진을 닫고 다음 시간의 모습을 살펴봐.',stamp:'돌봄 관찰 기록'};
 }
 if(type==='animal-photo'){
  const animal=p.animal;if(!['butterfly','dog'].includes(animal))return null;
  const a=f.chapters[3].animals[animal],forms=animal==='butterfly'?FORMS:['puppy','dogYoung','dog'],art=forms[a.step];
  return {title:`${animal==='butterfly'?'나비':'개'}의 시간 · ${stageName[art]}`,cards:[{art,label:stageName[art],detail:animal==='butterfly'?'나비의 한살이에서 관찰한 모습':'개의 한살이에서 관찰한 모습'}],note:`${stageName[art]}의 모습을 사진으로 남겼다. 이 동물의 처음과 다 자란 모습을 비교해 보자.`,next:'사진을 닫고 각 동물의 처음·마지막 모습을 모두 찍어 줘.',stamp:'동물의 시간 기록'};
 }
 if(type==='season-photo'){
  const q=f.chapters[3],plant=p.plant;if(!['apple','balsam'].includes(plant))return null;
  const apple=plant==='apple',forms=apple?['appleSpring','appleSummer','apple','winter','appleSpring']:['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'],when=['첫봄','여름','가을','겨울','다음 봄'][q.season];
  return {title:`${apple?'사과나무':'봉선화'} · ${when}`,cards:[{art:forms[q.season],label:when,detail:apple?'이름표 A-01':q.season===4?'씨앗에서 자란 새 봉선화 B-02':'이름표 B-01'}],note:apple?'계절이 달라져도 이름표와 줄기를 따라 같은 나무인지 확인해 보자.':q.season===4?'지난해 남긴 씨앗에서 새 봉선화가 자랐다. 지난해 살던 봉선화와는 다른 식물이다.':'잎과 꽃, 씨앗의 변화를 기록했다. 겨울 뒤 무엇이 남는지 찾아보자.',next:'사진을 닫고 첫봄·겨울·다음 봄의 두 식물을 기록해 줘.',stamp:'계절 관찰 기록'};
 }
 return null;
}

export function createFieldNotebook(ctx){
 let cleanup=()=>{};
 const reduced=()=>!!ctx.s.settings.reducedMotion||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function mount({title,body,actions,specimen}){
  cleanup();ctx.dialog({title,className:'field-notebook-dialog',body,actions});
  const modal=document.getElementById('modal'),controller=new AbortController(),timers=[];
  const stop=()=>{timers.forEach(clearTimeout);controller.abort();};cleanup=stop;
  modal.addEventListener('close',stop,{signal:controller.signal});modal.addEventListener('modal-dismiss',stop,{signal:controller.signal});
  const later=(fn,ms)=>{const id=setTimeout(()=>{if(modal.open&&!controller.signal.aborted)fn();},reduced()?0:ms);timers.push(id);};
  modal.querySelectorAll('[data-notebook-close]').forEach(b=>b.addEventListener('click',()=>ctx.close?.(),{signal:controller.signal}));
  const typeAll=()=>{modal.querySelectorAll('[data-handwriting]').forEach(el=>{el.textContent=el.dataset.handwriting;el.classList.remove('writing');});};
  modal.querySelector('[data-notebook-skip]')?.addEventListener('click',typeAll,{signal:controller.signal});
  modal.querySelectorAll('[data-handwriting]').forEach(el=>{const content=el.dataset.handwriting;el.setAttribute('aria-label',content);el.textContent='';if(reduced()){el.textContent=content;return;}el.classList.add('writing');Array.from(content).forEach((_,i)=>later(()=>{if(el.classList.contains('writing')){el.textContent=Array.from(content).slice(0,i+1).join('');if(i===Array.from(content).length-1)el.classList.remove('writing');}},280+i*34));});
  if(specimen)mountSpecimen3d(modal.querySelector('[data-specimen-3d]'),specimen,{signal:controller.signal,reduced:reduced(),label:FORM_NAMES[specimen]});
  later(()=>modal.classList.add('notebook-developed'),380);return modal;
 }
 function observe(form,spot){
  if(!FORMS.includes(form))return;
  const q=ctx.s.field.chapters[0],seen=q.inspected[form],next=FORMS.map(id=>({id})).find(a=>!q.inspected[a.id].length),total=FORMS.filter(id=>q.inspected[id].length>0).length;
  const nextText=next?`다음은 ${FORM_NAMES[next.id]}의 특징을 살펴봐.`:'이제 네가 본 특징을 그림과 네 말로 남겨 줘.';
  const traits=seen.map(n=>`<li><span class="notebook-check">✓</span><span class="notebook-hand" data-handwriting="${esc(FORM_TRAITS[form][n])}">${esc(FORM_TRAITS[form][n])}</span></li>`).join('');
  return mount({title:FORM_NAMES[form]+' 관찰 노트',body:`<div class="notebook-book"><div class="notebook-specimen"><div class="specimen-3d" data-specimen-3d>${img(form,FORM_NAMES[form]+' 확대 모습')}<span class="specimen-3d-hint" aria-hidden="true">끌어서 돌려 보기</span></div><span class="notebook-photo-caption">돋보기로 자세히 본 모습</span><span class="notebook-scale-note">확대한 모형 · 실제 크기와 달라</span></div><section class="notebook-page"><p class="notebook-kicker">화면에서 확인한 특징 · 자동 정리</p><h3>${FORM_NAMES[form]}의 관찰 단서</h3><ol class="notebook-findings">${traits}</ol><p class="notebook-stamp">모습 관찰! ${total}/4</p><p class="notebook-next">${esc(nextText)}</p></section></div>`,actions:`<button type="button" data-notebook-skip>글 바로 보기</button><button type="button" class="primary" data-notebook-close>${next?'다음 특징 살피기':'내 글·그림 남기러 가기'}</button>`,specimen:form});
 }
 function capture(type,payload){
  const entry=photoNotebookEntry(ctx.s,type,payload);if(!entry)return;
  return mount({title:entry.title,body:`<div class="notebook-capture-camera" aria-hidden="true">${img('fieldCamera')}<span>찰칵!</span></div><div class="notebook-viewfinder" aria-hidden="true"><b></b><b></b><b></b><b></b></div><div class="notebook-shutter" aria-hidden="true"><i></i><i></i></div><div class="notebook-flash" aria-hidden="true"></div><div class="notebook-book notebook-capture"><div class="notebook-photo-sheet"><div class="notebook-photo-grid ${entry.cards.length===2?'paired':''}">${entry.cards.map(c=>`<figure><div class="notebook-photo-art">${img(c.art,c.label)}</div><figcaption>${esc(c.label)}</figcaption><small>${esc(c.detail)}</small></figure>`).join('')}</div><p class="notebook-photo-caption">지금 관찰한 모습을 붙였다!</p></div><section class="notebook-page"><p class="notebook-kicker">촬영한 모형 · 자동 정리 메모</p><h3>${esc(entry.title)}</h3><p class="notebook-hand notebook-entry" data-handwriting="${esc(entry.note)}">${esc(entry.note)}</p><p class="notebook-stamp">✓ ${esc(entry.stamp)}</p><p class="notebook-next">${esc(entry.next)}</p></section></div>`,actions:'<button type="button" data-notebook-skip>글 바로 보기</button><button type="button" class="primary" data-notebook-close>기록하고 계속 탐구</button>'});
 }
 return {observe,capture,cleanup};
}
