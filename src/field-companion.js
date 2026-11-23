export const COMPANION_ART='assets/field/doto.webp';
const STEPS=[
 [['search','돋보기 탐색'],['closeup','확대 관찰'],['film','시간 필름'],['generation','다음 세대']],
 [['prepare','같게 준비'],['design','조건 바꾸기'],['grow','시간 관찰'],['reason','결과 살펴보기'],['seed-next','다음 실험']],
 [['measure','물·빛 재기'],['symptom','신호 찾기'],['care','맞춤 돌봄'],['care-after','시간 관찰'],['care-compare','변화 비교'],['care-next','다른 화분']],
 [['animals','동물의 시간'],['animal-birth','다음 세대'],['tags','이름표 달기'],['seasons','계절 따라 보기'],['plant-identity','작년 식물 찾기'],['transfer','새 상황']],
 [['tower-evidence','증거 찾기'],['tower-note','발견과 관찰 약속'],['tower-run','시계 깨우기']],
];
const LENS_HINTS=['돋보기를 그림 위로 끌어 가까이에서 살펴봐.','그림 아래 버튼을 눌러도 돋보기를 옮길 수 있어. 네 모습에 모두 돋보기를 대 봐.'];
const HINTS={
 search:['보기 버튼을 누르면 크게 확대돼. 위쪽 이름을 눌러 네 모습을 하나씩 살펴봐.','애벌레와 어른벌레를 나란히 보면 없던 부분이 어디에 생겼는지 찾을 수 있어.'],
 film:['사진을 옆자리로 끌어 순서를 바꿔 봐.','내 순서 재생으로 몸의 변화가 자연스러운지 확인해.'],
 generation:['알을 잡고 새 잎으로 옮겨 봐.','부모와 새로 태어날 생명을 구분해 봐.'],
 prepare:['화분 아래 버튼을 눌러 같은 흙과 콩 세 알을 넣어 봐.','두 화분에 같은 양을 넣어야 나중에 조건 하나만 비교할 수 있어.'],
 design:['B 조건 버튼으로 조건 하나만 바꿔 봐.','내 예상을 남긴 뒤 비교 실험을 시작해.'],
 grow:['시간 손잡이를 돌리거나 날짜 버튼을 눌러 봐.','처음·중간·마지막에 사진을 남겨 비교해.'],
 reason:['마지막 사진에서 A와 B의 싹을 먼저 비교해 봐.','두 화분에서 어떤 조건은 같고 어떤 조건은 다른지 살펴봐.'],
 'seed-next':['다른 조건에서도 같은 방법이 통할까?','다음 씨앗에서도 한 조건만 바꿔 비교해.'],
 measure:['물기와 빛을 재는 도구를 화분 위에 놓아 봐.','물과 빛을 모두 재면 숨은 원인을 알 수 있어.'],
 symptom:['흙이나 잎에 표시하는 버튼을 눌러 봐.','측정한 값과 겉모습이 이어지는 부분을 찾아 봐.'],
 care:['측정값을 보고 알맞은 도구를 화분에 놓아 봐.','시든 모습만 보고 정하지 말고 물과 빛을 비교해.'],
 'care-after':['마지막 시간으로 옮겨 돌봄 뒤 모습을 살펴봐.','돌봄 전과 나중 모습은 노트에 자동으로 남아.'],
 'care-compare':['두 사진을 나란히 보고 달라진 점을 골라 봐.','잎이 선 방향이나 새잎의 색을 자세히 봐.'],
 'care-next':['다른 화분도 직접 조사해 보자.','같은 증상이어도 원인이 같을까?'],
 animals:['나비의 숲에서 본 나비와 개를 비교해 봐.','개의 시간을 다 자란 모습까지 움직이면 자동으로 기록돼.'],
 'animal-birth':['새로 태어난 생명이 부모와 어떤 관계인지 골라 봐.','태어난 새 생명과 부모의 몸이 같은지 생각해.'],
 tags:['이름표를 두 식물에 하나씩 달아 봐.','첫봄의 모습은 이름표를 달면 자동으로 기록돼.'],
 seasons:['계절을 돌려 겨울과 다음 봄을 찾아 봐.','아래 이름표 줄을 봐. 줄이 끝까지 이어지는지, 씨앗에서 끊기는지 살펴봐.'],
 'plant-identity':['겨울과 다음 봄의 사진을 다시 보고 이름표를 비교해 봐.','두 시점의 이름표 줄을 따라가 봐. 같은 개체인지 판단할 단서를 사진에서 찾아봐.'],
 transfer:['식물 카드를 알맞은 상자에 넣어 봐.','상자 속 사과나무·봉선화 이름표 줄과 비교해 봐. 여러 해 살아가는지, 한 해 살고 씨앗을 남기는지 생각해 봐. 겨울에 땅 위가 시들어도 땅속 부분이 살아 있다가 다시 자라는 여러해살이 식물도 있어.'],
 'tower-evidence':['질문을 읽고, 답을 보여 주는 사진을 골라 봐.','사진 속에서 그때 무엇을 관찰하고 비교했는지 떠올려 봐.'],
 'tower-note':['「연구 노트 쓰기」에서 발견과 다음 관찰 약속을 한 번에 남겨.','"나는 …을 관찰해서 …을 알았어."로 시작해 봐.'],
 'tower-run':['시계 돌리기를 한 번 누르면 바늘이 네 기록을 차례로 지나가.','네가 고른 사진 네 장으로 숲의 시간이 다시 움직여.'],
 discovery:['화면에서 새 단서를 찾아 네가 배운 방법을 써 봐.','연결하거나 표시한 다음 발견 기록을 남겨 줘.'],
 ready:['기록을 모두 모았어! 오른쪽에서 보상을 받아.','발견 영상으로 네 탐구 개념을 다시 볼 수 있어.'],
};
const recordedHint=(key,index)=>({key:key+'-'+index,text:HINTS[key][index]});
export function companionLine(phase,level=0){
 if(phase==='search')return {key:'',text:LENS_HINTS[Math.min(level,LENS_HINTS.length-1)]};
 if(phase==='closeup')phase='search';
 const key=Object.hasOwn(HINTS,phase)?phase:'ready';
 const index=Math.min(level,HINTS[key].length-1);
 return recordedHint(key,index);
}
export function companionHint(phase,level=0){return companionLine(phase,level).text;}
export const COMPANION_HINT_LINES=Object.entries(HINTS).flatMap(([key,hints])=>hints.map((_,index)=>recordedHint(key,index)));
export function companionMapLine(chapter,title){
 if(!Number.isInteger(chapter))return {key:'map-done',text:'다섯 장소의 시간이 이어졌어. 다시 걸어가 기록을 더 살펴보자.'};
 if(chapter===0)return {key:'map-0',text:'나비의 숲에 가 보자. 장소나 길을 누르면 내가 길을 따라 걸어갈게.'};
 const final=(title.charCodeAt(title.length-1)-0xac00)%28;
 const direction=final&&final!==8?'으로':'로';
 return {key:'map-'+chapter,text:title+direction+' 가 보자. 장소나 길을 누르면 내가 길을 따라 걸어갈게.'};
}
export function companionDiscoveryLine(chapter,step,text){return {key:`discovery-${chapter}-${step}`,text};}
export function stageProgress(chapter,phase,preview=false){const steps=preview||phase==='discovery'?[...STEPS[chapter],['discovery','추가 발견']]:STEPS[chapter],index=phase==='ready'?steps.length:Math.max(0,steps.findIndex(([p])=>p===phase));return {index,total:steps.length,phase:steps[index]?.[0]||'ready',nextPhase:steps[index+1]?.[0],firstPhase:steps[0][0],label:phase==='ready'?'탐사 완료':steps[index][1],html:preview?`<select class="teacher-phase" aria-label="시연할 활동 단계" data-preview-phase>${steps.map(([id,label],i)=>`<option value="${id}" ${id===phase?'selected':''}>활동 바로가기 · ${i+1}. ${label}</option>`).join('')}</select>`:steps.map(([,label],i)=>`<span class="phase-dot ${i<index?'done':i===index?'current':''}" title="${label}">${i<index?'✓':i+1}</span>`).join('')};}
export function hintTarget(phase){return ({search:/돋보기 대기/,closeup:/ 관찰$/,film:/사진 옮기기/,grow:/시간/,measure:/재기|재는 도구/,reason:/꼬리표/,seasons:/시간/,'tower-run':/시곗바늘/})[phase]??null;}
