export const KEY = 'life-clock-lab.mvp.1';
export const missions = [
 ['생명 스캔 시작','변화의 단서를 찾아보자','관찰'],['시간 기록 복원','서로 다른 순간을 나란히','관찰'],
 ['실험 설계 테이블','한 가지 조건만 바꿔보자','발아'],['7일 시간 가속','흙 속에서는 무슨 일이?','발아'],
 ['스마트 온실 복구','자라기 좋은 환경을 찾아서','성장'],['성장 결과 분석','기록에서 근거를 찾아보자','성장'],
 ['생명 파일 조사','같은 질문, 다른 한살이','다양성'],['생명 패턴 분석','나만의 분류 기준을 찾아서','다양성'],
 ['생명 기록 제작소','발견을 한 편의 이야기로','기록'],['생명 시계 재가동','우리의 기록으로 다시 시작','기록']
];
export const stages = ['나비 관찰숲','씨앗 실험터','햇살 온실','한살이 도서관','생명 시계탑'];
export const bugs = ['알','애벌레','번데기','어른벌레'];
export const evidence = ['잎에 붙은 작고 길쭉한 알','초록색 몸과 여러 마디','몸을 감싼 번데기 껍질','흰 날개와 검은 무늬'];
export const species = {
 butterfly:{name:'배추흰나비',kind:'animal',type:'egg',steps:['알','애벌레','번데기','어른벌레 → 알'],fact:'알에서 깨어나 애벌레와 번데기를 거쳐 어른벌레가 돼.'},
 frog:{name:'개구리',kind:'animal',type:'egg',steps:['알','올챙이','다리가 나온 올챙이','개구리 → 알'],fact:'물속의 알에서 올챙이가 깨어나 개구리로 자라.'},
 chicken:{name:'닭',kind:'animal',type:'egg',steps:['알','병아리','자라는 닭','다 자란 닭 → 알'],fact:'알에서 병아리가 깨어나 닭으로 자라.'},
 dog:{name:'개',kind:'animal',type:'live',steps:['태어난 강아지','어린 강아지','자라는 개','다 자란 개 → 새끼'],fact:'어미가 새끼를 낳고, 강아지가 자라 어른 개가 돼.'},
 balsam:{name:'봉숭아',kind:'plant',type:'annual',steps:['씨','싹과 잎','꽃과 열매','씨를 남기고 한살이 마침'],fact:'한 해 동안 자라 꽃과 열매를 맺고 씨를 남긴 뒤 죽어.'},
 apple:{name:'사과나무',kind:'plant',type:'perennial',steps:['씨','어린나무','여러 해 자란 나무','꽃과 열매 맺기를 여러 해 반복'],fact:'여러 해 살아가며, 다 자라면 해마다 꽃과 열매를 맺어.'}
};
export const categories = {egg:'알을 낳는 동물',live:'새끼를 낳는 동물',annual:'한해살이식물',perennial:'여러해살이식물'};
export function freshState(){ return {version:1,screen:'home',completed:[],pins:[],note:'',comparison:{left:0,right:3,note:''},seed:{question:'water',a:{water:true,warm:true},b:{water:true,warm:true}},seedRun:null,day:0,snapshots:[],seedConclusion:'',green:{question:'light',a:{water:true,light:true},b:{water:true,light:true},sensors:[]},greenRun:null,analysis:{claim:'',condition:'',observation:''},pair:['butterfly','dog'],pairStep:0,comparisons:[],classification:{},reasons:{},transfer:'',artifact:{title:'',summary:'',scenes:[]},rings:[],character:'student',motion:false,sound:true,adminUnlocked:false,navigationHistory:[]}; }
export function validExperiment(e,keys){const differences=keys.filter(k=>e.a[k]!==e.b[k]);return differences.length===1&&differences[0]===e.question;}
export function experimentIssue(e,keys){
 if(!validExperiment(e,keys))return 'difference';
 return keys.some(k=>k!==e.question&&(!e.a[k]||!e.b[k]))?'baseline':null;
}
export function seedLevel(c,day){return c.water&&c.warm ? Math.min(3,Math.floor(day/2)) : 0;}
export function growthLevel(c,day){return Math.max(1,Math.round((c.water&&c.light?day:c.water?day*.3:day*.15)+1));}
export function ready(s,n){
 switch(n){
 case 0:return s.pins.length>=3&&s.note.trim().length>=3;
 case 1:return s.comparison.left!==s.comparison.right&&s.comparison.note.trim().length>=5;
 case 2:return experimentIssue(s.seed,['water','warm'])===null;
 case 3:{if(!s.seedRun)return false;const a=seedLevel(s.seedRun.a,7),b=seedLevel(s.seedRun.b,7);if(a===b)return false;const winner=a>b?'a':'b';return s.snapshots.length>=2&&s.snapshots.some(d=>d>=6)&&s.seedConclusion===winner;}
 case 4:return s.green.sensors.length===2&&experimentIssue(s.green,['water','light'])===null;
 case 5:{if(!s.greenRun)return false;const e=s.greenRun,a=growthLevel(e.a,7),b=growthLevel(e.b,7);if(a===b)return false;const winner=a>b?'a':'b';return s.analysis.claim===winner&&s.analysis.condition===e.question&&s.analysis.observation===winner;}
 case 6:return ['animal','plant'].every(kind=>s.comparisons.some(c=>c.kind===kind&&c.notes.length>=2));
 case 7:return Object.entries(species).every(([id,x])=>s.classification[id]===x.type&&s.reasons[id]===id)&&s.transfer==='perennial';
 case 8:return s.artifact.title.trim().length>0&&s.artifact.summary.trim().length>=5&&s.artifact.scenes.length>=3&&s.artifact.scenes.filter(x=>x.caption.trim().length>=3).length>=2;
 case 9:return s.completed.slice().filter(n=>n<9).length===9&&s.rings.length===5&&ready(s,8);
 default:return false;
 }
}
export function canEnter(s,n){return Number.isInteger(n)&&n>=0&&n<10&&(s.adminUnlocked===true||n===0||s.completed.includes(n-1));}
export function complete(s,n){if(!ready(s,n))return false;if(!s.completed.includes(n))s.completed.push(n);if(n===2)s.seedRun=structuredClone(s.seed);if(n===4)s.greenRun=structuredClone(s.green);return true;}
function restoreFields(defaults,value){
 if(Array.isArray(defaults))return Array.isArray(value)?value:defaults;
 if(defaults===null)return value&&typeof value==='object'&&!Array.isArray(value)?value:null;
 if(typeof defaults==='object')return Object.fromEntries(Object.entries(defaults).map(([key,fallback])=>[key,restoreFields(fallback,value?.[key])]));
 return typeof value===typeof defaults?value:defaults;
}
function restoreRun(value,keys){
 return value&&keys.includes(value.question)&&['a','b'].every(slot=>keys.every(key=>typeof value[slot]?.[key]==='boolean'))?structuredClone(value):null;
}
const uniqueNumbers=(value,min,max)=>[...new Set(value.filter(n=>Number.isInteger(n)&&n>=min&&n<=max))];
export function restore(raw){try {
 const x=JSON.parse(raw);if(x?.version!==1||!Array.isArray(x.completed)||!Array.isArray(x.artifact?.scenes))return freshState();
 const s=restoreFields(freshState(),x);
 s.completed=uniqueNumbers(s.completed,0,9);s.pins=uniqueNumbers(s.pins,0,3);s.snapshots=uniqueNumbers(s.snapshots,0,7).sort((a,b)=>a-b);s.rings=uniqueNumbers(s.rings,0,4);
 s.screen=x.screen;s.day=Math.max(0,Math.min(7,Math.floor(s.day)));s.pairStep=Math.max(0,Math.min(3,Math.floor(s.pairStep)));
 s.navigationHistory=s.navigationHistory.filter(n=>['home','map'].includes(n)||Number.isInteger(n)&&n>=0&&n<=9).slice(-50);
 s.seed.question=['water','warm'].includes(s.seed.question)?s.seed.question:'water';s.green.question=['water','light'].includes(s.green.question)?s.green.question:'light';
 s.seedRun=restoreRun(x.seedRun,['water','warm']);s.greenRun=restoreRun(x.greenRun,['water','light']);
 s.green.sensors=[...new Set(s.green.sensors.filter(id=>['water','light'].includes(id)))];
 s.pair=[0,1].map(i=>Object.hasOwn(species,s.pair[i])?s.pair[i]:['butterfly','dog'][i]);
 s.classification=Object.fromEntries(Object.keys(species).filter(id=>Object.hasOwn(categories,x.classification?.[id])).map(id=>[id,x.classification[id]]));
 s.reasons=Object.fromEntries(Object.keys(species).filter(id=>Object.hasOwn(species,x.reasons?.[id])).map(id=>[id,x.reasons[id]]));
 s.comparisons=s.comparisons.filter(c=>c&&Array.isArray(c.ids)&&c.ids.length===2&&c.ids.every(id=>Object.hasOwn(species,id))&&c.ids[0]!==c.ids[1]&&species[c.ids[0]].kind===species[c.ids[1]].kind&&Array.isArray(c.notes)).map(c=>({ids:[...c.ids],kind:species[c.ids[0]].kind,notes:c.notes.filter((n,i,a)=>n&&Number.isInteger(n.step)&&n.step>=0&&n.step<=3&&typeof n.text==='string'&&a.findIndex(item=>item?.step===n.step)===i)}));
 s.artifact.scenes=s.artifact.scenes.filter(a=>a&&typeof a.id==='string'&&typeof a.label==='string'&&typeof a.source==='string'&&['bug','seed','green','pair'].includes(a.kind)).map(a=>({...a,caption:typeof a.caption==='string'?a.caption:'',stage:Number.isInteger(a.stage)?a.stage:0,run:restoreRun(a.run,['water','warm'])})).filter(a=>a.kind!=='pair'||Array.isArray(a.ids)&&a.ids.length===2&&a.ids.every(id=>Object.hasOwn(species,id))).slice(0,6);
 if(!(['home','map'].includes(s.screen)||Number.isInteger(s.screen)&&s.screen>=0&&s.screen<=9&&canEnter(s,s.screen)))s.screen='home';
 return s;
 }catch{return freshState();}
}
