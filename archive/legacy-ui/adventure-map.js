import { ART, art, CHAPTER_NAMES } from './adventure-assets.js';

// Waypoints follow the painted paths; water, trees and buildings are never walkable.
const POINTS=[[.20,.78],[.25,.63],[.28,.55],[.25,.50],[.17,.48],[.31,.48],[.34,.42],[.40,.37],[.395,.30],[.38,.26],[.45,.41],[.49,.44],[.55,.49],[.62,.47],[.65,.55],[.70,.54],[.76,.54],[.78,.43],[.80,.32],[.79,.24],[.72,.19],[.69,.13],[.63,.15],[.59,.15],[.56,.18],[.51,.21],[.47,.26],[.39,.58],[.47,.74],[.51,.79],[.59,.78],[.68,.76],[.76,.66],[.85,.68]];
const EDGES=[[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[7,8],[8,9],[7,10],[10,11],[11,12],[12,13],[13,14],[14,15],[15,16],[16,17],[17,18],[18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,7],[2,27],[27,28],[28,29],[29,30],[30,31],[31,32],[32,33],[32,16]];
const DOORS=[4,9,13,19,33];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const nearest=p=>POINTS.reduce((best,q,i)=>dist(q,p)<dist(POINTS[best],p)?i:best,0);
function route(a,b){
  const costs=POINTS.map(()=>Infinity),previous=[],open=new Set(POINTS.map((_,i)=>i)); costs[a]=0;
  while(open.size){const u=[...open].reduce((x,y)=>costs[x]<costs[y]?x:y);open.delete(u);if(u===b)break;
    EDGES.forEach(([x,y])=>{const v=x===u?y:y===u?x:null;if(v===null||!open.has(v))return;const next=costs[u]+dist(POINTS[u],POINTS[v]);if(next<costs[v]){costs[v]=next;previous[v]=u;}});
  } const out=[b];while(out[0]!==a&&previous[out[0]]!==undefined)out.unshift(previous[out[0]]);return out;
}
export function mapMarkup(s){
 const cleared=Math.floor(s.completed.length/2);
 return `<section class="world-shell"><div class="world" tabindex="0" aria-label="탐험 지도. 장소를 선택하면 길을 따라 걸어가요. 방향키로도 이동할 수 있어요.">
 <img class="world-art" src="${ART.forestMap}" alt="나비의 숲, 씨앗 연구소, 온실, 사계절 정원, 시계탑을 잇는 숲길" draggable="false"><div class="world-shade" style="opacity:${Math.max(0,.26-cleared*.052)}" aria-hidden="true"></div>
 ${DOORS.map((n,i)=>`<button class="place ${i<cleared?'restored':''} ${i>cleared?'locked':''}" data-door="${i}" style="left:${POINTS[n][0]*100}%;top:${POINTS[n][1]*100}%" aria-label="${CHAPTER_NAMES[i]}까지 걸어가기"><span class="place-number">${i<cleared?'✓':i+1}</span><strong>${CHAPTER_NAMES[i]}</strong><small>${i<cleared?'빛을 되찾았어':i===cleared?'지금 탐험할 곳':'앞 구역의 빛이 필요해'}</small></button>`).join('')}
 <div class="world-avatar" aria-hidden="true"><span class="walk-sprite"></span><span class="avatar-label">지훈 & 잎새</span></div><div class="destination" hidden></div>
 </div><div class="map-conversation">${art('ipsae','','map-ipsae')}<div><strong>잎새의 길 안내</strong><p id="map-hint">장소를 누르면 지훈이가 길을 따라 걸어가. 도착하면 함께 탐험하자!</p></div><button class="primary" id="enter-place" disabled>먼저 장소로 이동해 줘</button></div></section>`;
}
export function mountMap(root,s,{save,enter,notify}){
 const world=root.querySelector('.world'),avatar=root.querySelector('.world-avatar'),sprite=root.querySelector('.walk-sprite'),hint=root.querySelector('#map-hint'),enterButton=root.querySelector('#enter-place');
 let position=[s.avatar.x,s.avatar.y],current=nearest(position),active=true,frame=0,walking=false,arrived=-1,raf=0;
 position=[...POINTS[current]];
 function paint(){avatar.style.left=position[0]*100+'%';avatar.style.top=position[1]*100+'%';}
 function arrival(){walking=false;s.avatar={x:position[0],y:position[1]};save();arrived=DOORS.indexOf(current);const unlocked=arrived>=0&&arrived<=Math.floor(s.completed.length/2);
 enterButton.disabled=!unlocked;enterButton.textContent=arrived<0?'장소 입구까지 걸어가 줘':unlocked?`${CHAPTER_NAMES[arrived]} 들어가기`:'앞 구역에서 빛을 되찾아 줘';
 if(arrived>=0)hint.textContent=unlocked?`${CHAPTER_NAMES[arrived]}에 도착했어! 안에서 해결할 문제가 기다리고 있어.`:'아직 길의 빛이 약해. 앞 구역의 두 탐험을 마치면 이곳에 들어갈 수 있어.';sprite.style.backgroundPosition='0% 0%';}
 function walkTo(target){if(!active)return;cancelAnimationFrame(raf);const path=route(nearest(position),target).map(n=>({n,p:POINTS[n]}));walking=true;enterButton.disabled=true;hint.textContent='숲길을 따라 가는 중이야…';let last=0;
  function tick(now){if(!active)return;const dt=Math.min((now-last)/1000||.016,.04);last=now;const next=path[0];if(!next){arrival();return;}const dx=next.p[0]-position[0],dy=next.p[1]-position[1],length=Math.hypot(dx,dy);const speed=s.settings.reducedMotion?2:.16;
   if(length<speed*dt){position=[...next.p];current=next.n;path.shift();}else{position[0]+=dx/length*speed*dt;position[1]+=dy/length*speed*dt;}
   const row=Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0;frame=(frame+dt*8)%4;sprite.style.backgroundPosition=`${Math.floor(frame)*100/3}% ${row*100/3}%`;paint();raf=requestAnimationFrame(tick);
  }raf=requestAnimationFrame(tick);
 }
 world.querySelectorAll('[data-door]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();walkTo(DOORS[+button.dataset.door]);}));
 world.addEventListener('click',e=>{if(e.target.closest('button'))return;const r=world.getBoundingClientRect();walkTo(nearest([(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height]));});
 world.addEventListener('keydown',e=>{const keys={ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1],ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0]};const vector=keys[e.key];if(!vector||e.target.closest('button'))return;e.preventDefault();if(walking)return;const neighbors=EDGES.flatMap(([a,b])=>a===current?[b]:b===current?[a]:[]);const target=neighbors.map(n=>({n,d:[POINTS[n][0]-position[0],POINTS[n][1]-position[1]]})).map(x=>({...x,score:(x.d[0]*vector[0]+x.d[1]*vector[1])/Math.hypot(...x.d)})).sort((a,b)=>b.score-a.score)[0];if(target&&target.score>.1)walkTo(target.n);});
 enterButton.addEventListener('click',()=>{if(arrived>=0&&!enterButton.disabled)enter(arrived);});paint();arrival();
 return ()=>{active=false;cancelAnimationFrame(raf);};
}
