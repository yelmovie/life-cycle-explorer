export const COMPANION_ART='assets/field/doto.webp';
const STEPS=[
 [['search','확대 관찰'],['draw','관찰 기록'],['film','시간 필름'],['generation','다음 세대']],
 [['prepare','같게 준비'],['design','조건 바꾸기'],['grow','시간 관찰'],['reason','결과 살펴보기'],['seed-next','다음 실험']],
 [['measure','물·빛 재기'],['symptom','신호 찾기'],['care-before','먼저 기록'],['care','맞춤 돌봄'],['care-after','변화 비교'],['care-next','다른 화분']],
 [['animals','동물의 시간'],['animal-birth','다음 세대'],['tags','이름표 달기'],['seasons','계절 따라 보기'],['plant-identity','작년 식물 찾기'],['transfer','새 상황']],
 [['tower-slots','기록 끼우기'],['tower-evidence','증거 잇기'],['tower-note','연구 노트'],['tower-run','시계 깨우기'],['plan','관찰 약속']],
];
const HINTS={
 search:['보기 버튼을 누르면 크게 확대돼. ◀ ▶로 넘겨 보고 「관찰 마치기」를 누르면 본 특징이 모두 남아.','돋보기를 몸 위로 옮겨 놓아도 기록돼. 네 모습에서 특징을 하나씩 찾아봐.'],
 draw:['종이 칸을 눌러 본 특징을 바로 적어 봐. 다 쓰고 칸 밖을 누르면 저장돼.','아래 모습을 골라 그림을 보며 써도 돼.'],
 film:['사진을 옆자리로 끌어 순서를 바꿔 봐.','내 순서 재생으로 몸의 변화가 자연스러운지 확인해.'],
 generation:['알을 잡고 새 잎으로 옮겨 봐.','부모와 새로 태어날 생명을 구분해 봐.'],
 prepare:['흙과 씨앗을 A와 B 화분에 나누어 놓아 봐.','흙이 들어갔는지, 씨앗은 각각 세 알인지 확인해.'],
 design:['B 조건 버튼으로 조건 하나만 바꿔 봐.','내 예상을 남긴 뒤 비교 실험을 시작해.'],
 grow:['시간 손잡이를 돌리거나 날짜 버튼을 눌러 봐.','처음·중간·마지막에 사진을 남겨 비교해.'],
 reason:['두 화분에서 다르게 바꾼 조건을 찾아 봐.','그 조건의 도구를 가운데 연결 자리에 놓아 봐.'],
 'seed-next':['다른 조건에서도 같은 방법이 통할까?','다음 씨앗에서도 한 조건만 바꿔 비교해.'],
 measure:['물기와 빛을 재는 도구를 화분 위에 놓아 봐.','물과 빛을 모두 재면 숨은 원인을 알 수 있어.'],
 symptom:['흙 또는 잎에 표시하기 버튼을 눌러 봐.','측정한 값과 겉모습이 이어지는 부분을 찾아 봐.'],
 'care-before':['오른쪽 사진 버튼으로 지금 모습을 남겨.','돌본 뒤 비교할 처음 사진이 필요해.'],
 care:['측정값을 보고 알맞은 도구를 화분에 놓아 봐.','시든 모습만 보고 정하지 말고 물과 빛을 비교해.'],
 'care-after':['시간을 옮긴 뒤 전후 비교를 밀어 봐.','새잎이 어떻게 달라졌는지 보고 사진을 남겨.'],
 'care-next':['다른 화분도 직접 조사해 보자.','같은 증상이어도 원인이 같을까?'],
 animals:['나비의 숲에서 본 나비와 개를 비교해 봐.','개의 시간을 다 자란 모습까지 움직이면 자동으로 기록돼.'],
 'animal-birth':['다음 세대 표를 알맞은 자리에 옮겨 봐.','태어난 새 생명과 부모의 몸이 같은지 생각해.'],
 tags:['이름표를 두 식물에 하나씩 달아 봐.','첫봄의 모습은 이름표를 달면 자동으로 기록돼.'],
 seasons:['계절을 돌려 겨울과 다음 봄을 찾아 봐.','아래 이름표 줄을 봐. 줄이 끝까지 이어지는지, 씨앗에서 끊기는지 살펴봐.'],
 'plant-identity':['사과나무는 A-01 줄이 끝까지 이어졌어. 봉선화는 어땠지?','줄이 이어지면 작년 그 식물, 씨앗에서 끊기면 새로 자란 식물이야.'],
 transfer:['식물 카드를 알맞은 상자에 넣어 봐.','상자 속 사과나무·봉선화 이름표 줄과 비교해 봐. 여러 해 살아가는지, 한 해 살고 씨앗을 남기는지 생각해 봐. 겨울에 땅 위가 시들어도 땅속 부분이 살아 있다가 다시 자라는 여러해살이 식물도 있어.'],
 'tower-slots':['오른쪽 내 사진을 끌어 같은 지역 칸에 끼워 봐.','사진을 누르면 알맞은 칸에 바로 들어가. 칸마다 지역 이름이 있어.'],
 'tower-evidence':['주장 쪽지를 끌어 그걸 증명하는 사진 위에 놓아 봐.','사진이 그 주장을 정말 보여 주는지 생각해 봐. 사진 하나는 남아.'],
 'tower-note':['「연구 노트 쓰기」를 눌러 제목과 한 문장을 써 줘.','"나는 …을 관찰해서 …을 알았어."로 시작해 봐.'],
 'tower-run':['시곗바늘 끝의 손잡이를 잡고 시계 방향으로 한 바퀴 돌려 봐.','바늘이 지나는 칸마다 네 기록이 빛나.'],
 plan:['내 기록을 재생하고 실제 관찰 계획을 남겨 봐.','언제, 어떤 생물을, 무엇에 주목해 볼까?'],
 discovery:['화면에서 새 단서를 찾아 네가 배운 방법을 써 봐.','연결하거나 표시한 다음 발견 기록을 남겨 줘.'],
 ready:['기록을 모두 모았어! 오른쪽에서 보상을 받아.','발견 영상으로 네 탐구 개념을 다시 볼 수 있어.'],
};
export function companionHint(phase,level=0){const hints=HINTS[phase]||HINTS.ready;return hints[Math.min(level,hints.length-1)];}
export function stageProgress(chapter,phase,preview=false){const steps=preview||phase==='discovery'?[...STEPS[chapter],['discovery','추가 발견']]:STEPS[chapter],index=phase==='ready'?steps.length:Math.max(0,steps.findIndex(([p])=>p===phase));return {index,total:steps.length,phase:steps[index]?.[0]||'ready',nextPhase:steps[index+1]?.[0],firstPhase:steps[0][0],label:phase==='ready'?'탐사 완료':steps[index][1],html:preview?`<select class="teacher-phase" aria-label="시연할 활동 단계" data-preview-phase>${steps.map(([id,label],i)=>`<option value="${id}" ${id===phase?'selected':''}>활동 바로가기 · ${i+1}. ${label}</option>`).join('')}</select>`:steps.map(([,label],i)=>`<span class="phase-dot ${i<index?'done':i===index?'current':''}" title="${label}">${i<index?'✓':i+1}</span>`).join('')};}
export function hintTarget(phase){return ({search:/확대/,draw:/보며 쓰기/,film:/사진 옮기기/,generation:/새 알|다음 세대가/,prepare:/흙 주머니|씨앗 한 알|화분/,design:/B의/,grow:/시간/,reason:/기록 연결|결과를 바꾼/,measure:/재기|재는 도구/,symptom:/표시하기/,care:/돌보기/,'animal-birth':/다음 세대|생명|몸/,tags:/이름표/,seasons:/시간/,'plant-identity':/작년 그 식물|새로 자란 식물/,transfer:/카드 옮기기|상자/,'tower-slots':/칸에 끼우기/,'tower-evidence':/쪽지/,'tower-run':/시곗바늘/})[phase]||/시간|사진/;}
