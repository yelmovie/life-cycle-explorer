import {createRewardCards} from './reward-cards.js';
import {playSfx} from './game-audio.js';
import {icon} from './ui-icons.js';

// One achievement card per map villain, in region order. Ids are the villain ids in village-encounters.js.
export const REWARD_CARDS=[
 {id:'butterfly',stage:'나비의 숲',title:'나비 한살이 탐정'},
 {id:'seed',stage:'씨앗 연구소',title:'씨앗 싹 틔우기 박사'},
 {id:'care',stage:'햇살 온실',title:'온실 식물 돌봄왕'},
 {id:'season',stage:'사계절 정원',title:'사계절 한살이 기록가'},
 {id:'clock',stage:'생명 시계탑',title:'생명 시계 전설 탐험가'},
];
/** A card is owned once its region's villain has been driven off (three hits). Nothing extra is saved. */
export const ownedRewardCards=hits=>REWARD_CARDS.map(({id})=>hits?.[id]===3);
/** Indexes of the cards a save patch has just won: the villain's count was below three and is three now. */
export const wonRewardCards=(before,patch)=>REWARD_CARDS.flatMap(({id},index)=>before?.[id]!==3&&patch?.[id]===3?[index]:[]);

// Built on first use: tests read the card list without a browser.
let instance;
function rewards(){
 return instance??=createRewardCards({
  setName:'생명 시계 성취 카드',
  cards:REWARD_CARDS.map((card,index)=>({...card,art:`assets/reward-cards/card-${index+1}-${card.id}.webp`,thumb:`assets/reward-cards/thumb-${index+1}-${card.id}.webp`})),
  theme:{accent:'#dfbb64',accent2:'#35634b',glow:'#f5edcf',ink:'#1e4337'},
  particles:['leaf','petal','gear','star'],
  colors:['#ffc35d','#dfbb64','#f5edcf','#e0ead9','#4a7859','#ffffff'],
  emblem:icon('leaf'),
  // The app's effects path: follows the sound switch and the effects level.
  sound:name=>playSfx('card-'+name),
  inertRoot:()=>document.querySelector('#app'),
 });
}

// A card on its way to the header keeps its slot empty until it lands.
const flying=new Set();
let drawn=[];
const shown=hits=>ownedRewardCards(hits).map((owned,index)=>owned&&!flying.has(index));
/** The slot strip that sits just before the sound button. */
export function rewardSlotsHtml(hits){drawn=shown(hits);return rewards().slotsHtml(drawn);}
/** Brings the strip up to date without redrawing the header. It is rebuilt only when a slot has to empty again (a reset). */
export function syncRewardSlots(hits){
 const next=shown(hits);
 if(next.every((owned,index)=>owned===drawn[index]))return;
 const strip=document.querySelector('[data-reward-album]');
 if(drawn.some((owned,index)=>owned&&!next[index])){if(strip)strip.outerHTML=rewards().slotsHtml(next);}
 else rewards().syncSlots(next);
 drawn=next;
}
// Cards whose villain has finished its exit and that have not been put away yet.
let due=0;
/** True from the moment a won card is ready to open until it sits in its slot. The map holds its villains (and the finale) meanwhile. */
export const rewardCardDue=()=>due>0;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
/**
 * The villain for `index` has just taken its third hit. After `delay` (its exit) the card opens from `origin()`.
 * `state()` answers 'open', 'wait' (a dialog covers the map) or 'gone' (the learner left the map: the slot just fills).
 */
export async function winRewardCard(index,{delay,state,origin,hits}){
 flying.add(index);
 let counted=false;
 try{
  await wait(delay);
  due++;counted=true;
  let now;
  while((now=state())==='wait')await wait(400);
  if(now==='open')await rewards().reveal(index,origin(),ownedRewardCards(hits()));
 }finally{if(counted)due--;flying.delete(index);syncRewardSlots(hits());}
}
/** True while a card or the album is on screen. The map treats it like an open dialog. */
export const rewardLayerOpen=()=>!!document.querySelector('.rc-layer');
/** Tells the app when a card or the album comes on screen (true) and when the last one leaves (false). */
export function watchRewardLayer(change){
 let open=false;
 new MutationObserver(()=>{const now=rewardLayerOpen();if(now!==open)change(open=now);}).observe(document.body,{childList:true});
}
