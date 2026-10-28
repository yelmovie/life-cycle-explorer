import {FIELD_CHAPTERS} from './field-mission-data.js';
export {FIELD_CHAPTERS};
export const FORM_NAMES={egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'};
// Feature centres in the actual square illustrations (0..1 coordinates).
export const FORM_SPOTS={egg:[[.50,.42],[.50,.22]],larva:[[.36,.43],[.56,.57]],pupa:[[.54,.52],[.68,.18]],adult:[[.23,.33],[.63,.26]]};
export const FORM_TRAITS={egg:['잎에 붙은 작은 알','세로로 길쭉한 모습'],larva:['몸이 여러 마디야','몸 아래에 다리가 보여'],pupa:['몸을 감싼 껍질','가운데가 볼록하고 끝이 뾰족해'],adult:['넓게 펼친 날개','가느다란 더듬이']};
export const FIELD_OPENING=['숲의 생명 시계가 멈췄어.','나비의 모습도, 씨앗의 시간도 기록에서 떨어져 나갔어.','네가 관찰하고 실험한 기록으로 다섯 장소를 이어 줘.'];
export const FIELD_REPLAY_GOALS=[
 '이번에는 다른 모습의 특징을 써 보고, 지난 관찰과 비교해 봐.',
 '처음과 다른 예상을 세우고, 같은 실험의 결과로 생각을 확인해 봐.',
 '도움이 필요한 까닭을 물·빛을 잰 결과와 사진으로 설명해 봐.',
 '처음에 찍지 않은 시점의 사진을 더 살펴보고, 이름표가 이어지는지 찾아봐.',
 '다른 기록을 골라 새 제목과 설명으로 친구에게 들려줄 이야기를 만들어 봐.',
];

// "생물 탐정 분류": apply the birth and overwintering rules to new organisms.
export const CORE_PLANT_CARDS=['rose','bean','sunflower'];
export const SORT_BINS={animal:[['egg','알을 낳아'],['live','새끼를 낳아']],plant:[['many','여러해살이 · 여러 해 동안 살아'],['once','한해살이 · 한 해 살고 씨앗을 남겨']]};
export const SORT_CARDS=[
 {id:'frog',group:'animal',name:'개구리',art:'frog',bin:'egg',clue:'올챙이는 어디에서 나올까?',why:'개구리는 물속에 말랑한 알 덩어리를 낳아.'},
 {id:'chicken',group:'animal',name:'닭',art:'chicken',bin:'egg',clue:'병아리는 무엇을 깨고 나올까?',why:'닭은 단단한 껍데기가 있는 알을 낳아.'},
 {id:'whale',group:'animal',name:'고래',art:'sortWhale',bin:'live',clue:'물에 살아도 아기에게 젖을 먹여. 물고기와 같을까?',why:'고래는 물에 살지만 새끼를 낳아 젖을 먹여.'},
 {id:'turtle',group:'animal',name:'거북',art:'sortTurtle',bin:'egg',clue:'바닷가 모래밭에 구덩이를 파는 까닭은 뭘까?',why:'거북은 모래밭에 올라와 알을 낳고 묻어.'},
 {id:'cat',group:'animal',name:'고양이',art:'sortCat',bin:'live',clue:'앞에서 본 개와 같은 무리야.',why:'고양이는 개처럼 새끼를 낳아 젖을 먹여.'},
 {id:'snake',group:'animal',name:'뱀',art:'sortSnake',bin:'egg',clue:'다리가 없다고 태어나는 방법이 달라질까?',why:'뱀은 알을 낳아. 새끼 뱀은 알을 깨고 나와.'},
 {id:'rose',group:'plant',name:'장미',art:'rose',bin:'many',clue:'겨울에도 굵은 줄기가 남아 있어.',why:'장미는 굵은 줄기가 겨울을 나고 봄에 다시 잎이 나.'},
 {id:'bean',group:'plant',name:'콩',art:'pot3',bin:'once',clue:'씨앗 연구소에서 콩은 무엇에서 자랐지?',why:'콩은 한 해 자라 꼬투리에 씨를 남기고 시들어.'},
 {id:'forsythia',group:'plant',name:'개나리',art:'sortForsythia',bin:'many',clue:'키는 작아도 겨울에 줄기가 그대로야.',why:'개나리는 나무라서 봄마다 같은 줄기에 꽃이 펴.'},
 {id:'rice',group:'plant',name:'벼',art:'sortRice',bin:'once',clue:'가을에 낟알을 거두고 나면 줄기는 어떻게 될까?',why:'벼는 한 해 자라 낟알(씨)을 남기고 시들어.'},
 {id:'persimmon',group:'plant',name:'감나무',art:'sortPersimmon',bin:'many',clue:'사과나무와 같은 무리야.',why:'감나무는 사과나무처럼 같은 줄기에서 해마다 열매가 열려.'},
 {id:'sunflower',group:'plant',name:'해바라기',art:'sortSunflower',bin:'once',clue:'키가 커도, 꽃판 가득 무엇이 남을까?',why:'해바라기는 한 해 살고 꽃판에 씨를 잔뜩 남겨.'},
];
