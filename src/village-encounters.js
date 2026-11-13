import {mountMapEncounters,normalizeMapHits} from './map-encounters.js';

// This copy ships with its own map so offline play needs no cross-project request.
const STAGES = [
  [
    "butterfly",
    "flip",
    "첫 장은 맨 뒤로!",
    "그림 순서를 또 바꿔야지!"
  ],
  [
    "seed",
    "label",
    "이 표찰은 잠깐 쉬는 중!",
    "어느 씨앗 표찰이었지?"
  ],
  [
    "care",
    "dial",
    "시곗바늘은 여기서 멈춰!",
    "이 온실은 잠시 멈출 거야!"
  ],
  [
    "season",
    "arrow",
    "계절도 한 칸 뒤로!",
    "가을을 한 칸 돌려야지!"
  ],
  [
    "clock",
    "gear",
    "톱니 하나면 탑이 멈추지!",
    "태엽이 얼마나 남았을까?"
  ]
];
const hit = ["바늘이 한 칸 밀렸어!", "태엽이 헛돌잖아!"], finish = "톱니는 다시 돌려줄게!";
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

export function mountVillageEncounters({host,stages,progress,onSave,blocked,reduced,tone,actors}) {
  const points=stages.flatMap((stage,i)=>{
    if(!stage||!STAGES[i])return [];
    const [id,prop,first,again]=STAGES[i];
    return [{id,prop,lines:[first,again],hit,finish,...stage}];
  });
  if(!points.some(({id})=>(progress?.[id]||0)<3))return null;
  const runtime=mountMapEncounters({host,stages:points,progress,onSave,blocked,reduced,tone,art,palette,
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
