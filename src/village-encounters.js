import {mountMapEncounters,normalizeMapHits} from './map-encounters.js';

// This copy ships with its own map so offline play needs no cross-project request.
const STAGES = [
  ["butterfly", "flip", "알부터 나비까지 순서를 맞혔어? 첫 장을 뒤로 빼 놨는데!", "다음엔 번데기를 내 금고라고 우겨야겠군!", "앗, 섞어 둔 그림이 돌아갔어!", "번데기 다음 장까지 펼쳐져!", "흥, 나비의 한살이 책은 돌려줄게!"],
  ["seed", "label", "씨앗이 싹트는 단서를 찾았어? 표찰만 숨기면 될 줄 알았지!", "다음엔 씨앗 표찰에 ‘비밀’이라고 쓰겠어!", "앗, 표찰 뒤쪽이 보였어!", "씨앗 기록까지 되찾았잖아!", "쳇, 씨앗 표찰은 제자리에 둘게!"],
  ["care", "dial", "기르는 조건을 비교해 냈어? 내 온실 시계를 멈춰 놨단 말이야!", "다음엔 내 시계에만 급수 버튼을 달겠어!", "앗, 온실 시계가 다시 째깍!", "기르기 기록까지 남아 있었네!", "흥, 온실은 돌려줄게. 시계는 나중에 보자!"],
  ["season", "arrow", "계절이 바뀌는 순서를 읽었어? 가을을 몰래 한 칸 밀어 뒀는데!", "내 달력에는 내가 좋아하는 계절만 넣을 거야!", "앗, 돌려 놓은 계절판이 멈췄어!", "계절 기록이 줄을 맞췄잖아!", "쳇, 계절판을 제자리로 돌려둘게!"],
  ["clock", "gear", "다섯 기록을 시계에 맞췄어? 톱니 하나 빼면 못 찾을 줄 알았지!", "이번엔 시계탑을 내 알람시계로 쓸 거야!", "앗, 빠진 톱니가 굴러가!", "태엽이 다시 돌아가잖아!", "흥, 탑은 가져. 나는 늦잠이나 잘래!"],
];
const palette = '#ffc35d';
const art = {
  left: new URL('../assets/field/map-villain-left-v2.webp', import.meta.url).href,
  right: new URL('../assets/field/map-villain-right-v2.webp', import.meta.url).href,
  frames: 6,
};
const reactions = [
  new URL('../assets/field/map-hero-reaction-v2.webp', import.meta.url).href,
  new URL('../assets/field/map-ally-reaction-v2.webp', import.meta.url).href,
];
const sizes = [81, 63];

export function normalizeVillageEncounters(value,legacy) {
  // Old releases stored numeric slots; retain valid previous strikes/defeats.
  const previous=Object.fromEntries(STAGES.map(([id],i)=>[id,
    Number.isInteger(legacy?.[i])&&legacy[i]>=1&&legacy[i]<=3?legacy[i]:0]));
  return {...normalizeMapHits(previous,STAGES.map(([id])=>id)),...normalizeMapHits(value,STAGES.map(([id])=>id))};
}

export function mountVillageEncounters({host,stages,progress,onSave,blocked,reduced,tone,actors,clearIndex}) {
  const points=stages.flatMap((stage,i)=>{
    if(!stage||!STAGES[i])return [];
    const [id,prop,first,again,hitOne,hitTwo,finish]=STAGES[i];
    return [{id,prop,lines:[first,again],hit:[hitOne,hitTwo],finish,speaker:"태엽 도깨비",...stage}];
  });
  if(!points.some(({id})=>(progress?.[id]||0)<3))return null;
  const runtime=mountMapEncounters({requiredFoes:5,host,stages:points,progress,onSave,blocked,reduced,tone,art,palette,clearStage:()=>STAGES[clearIndex]?.[0],
    reach:88,contact:25});
  const layer=host.querySelector('.map-encounter-layer');
  const poses=reactions.map((src,i)=>{
    const el=document.createElement('span');
    el.className='map-encounter-reaction';el.hidden=true;el.setAttribute('aria-hidden','true');
    el.dataset.actor=i?'ally':'hero';
    const sheet=new Image();sheet.src=src;
    Object.assign(el.style,{position:'absolute',left:'0',top:'0',pointerEvents:'none',backgroundImage:`url("${src}")`,
      backgroundRepeat:'no-repeat',backgroundSize:`${i?400:800}% 100%`,
      filter:'drop-shadow(0 1px 1px #15232870)',zIndex:'1'});
    layer.append(el);return {el,sheet};
  });
  const setOriginal=actors.map(actor=>{
    let previous=true;
    return visible=>{
      if(!actor||visible===previous)return;previous=visible;
      if(typeof actor==='function')actor(visible);else actor.style.opacity=visible?'':'0';
    };
  });
  return {
    update(input){
      const events=runtime.update(input);
      for(const [i,key] of ['hero','ally'].entries()){
        const {el,sheet}=poses[i],state=events[key],point=state&&input[key]&&input.project(input[key]);
        const visible=Boolean(point&&state&&sheet.naturalWidth&&!blocked?.());
        setOriginal[i]?.(!visible);el.hidden=!visible;
        if(!visible){delete el.dataset.pose;continue;}
        el.dataset.pose=state.kind;
        const scale=input.scale??1,size=Math.max(29,Math.min(140,sizes[i]*scale));
        const frame=state.frame+(i===0&&state.kind==='hurt'?4:0);
        Object.assign(el.style,{width:`${size}px`,height:`${size}px`,backgroundPosition:`${frame/(i?3:7)*100}% 50%`,
          transform:`translate(${point.x+state.dx*scale-size/2}px,${point.y-size}px) scaleX(${state.direction===1?-1:1})`});
      }
    },
    destroy(){setOriginal.forEach(show=>show(true));runtime.destroy();},
  };
}
