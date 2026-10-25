// Shared, dependency-free validation for the discovery missions and save files.
const unique=a=>[...new Set(Array.isArray(a)?a:[])];
const object=a=>a&&typeof a==='object'&&!Array.isArray(a)?a:{};
const list=(a,allowed)=>unique(a).filter(x=>allowed.includes(x));
const words=a=>typeof a==='string'?a.trim().slice(0,180):'';
export const DISCOVERY_TYPES=['observation','retry','care'];
export const DISCOVERY_PLAN=['same-view','regular','leave-growing'];
export const questionValid=text=>words(text).length>=8&&new Set(words(text).replace(/\s/g,'')).size>=4;

function cleanEntry(c,step,raw,records){
 const e=object(raw);
 if(c===0)return {target:e.target===(step===0?'larva':'adult')?e.target:'',confirmed:e.confirmed===true};
 if(c===1)return step===0?{aWarm:e.aWarm===true,verified:e.verified===true}:{checks:list(e.checks,['water','temperature','time']),decision:e.decision==='observe'?'observe':''};
 if(c===2)return step===0?{checked:list(e.checked,['water','light']),decision:e.decision==='keep'?'keep':''}:{spot:e.spot==='new-leaf'?'new-leaf':'',note:e.note===true};
 if(c===3)return step===0?{mark:e.mark==='A-01'?'A-01':'',confirmed:e.confirmed===true}:{plan:list(e.plan,DISCOVERY_PLAN),confirmed:e.confirmed===true};
 if(step===0){const stamps={};for(const type of DISCOVERY_TYPES){const id=object(e.stamps)[type];if(records.some(r=>r.id===id&&r.fieldEvidence?.type===type))stamps[type]=id;}return {stamps};}
 return {question:words(e.question)};
}
export function discoveryStepDone(c,step,e,records=[]){
 if(!e)return false;
 if(c===0)return e.target===(step===0?'larva':'adult')&&e.confirmed===true;
 if(c===1)return step===0?e.aWarm===true&&e.verified===true:['water','temperature','time'].every(x=>e.checks?.includes(x))&&e.decision==='observe';
 if(c===2)return step===0?['water','light'].every(x=>e.checked?.includes(x))&&e.decision==='keep':e.spot==='new-leaf'&&e.note===true;
 if(c===3)return step===0?e.mark==='A-01'&&e.confirmed===true:DISCOVERY_PLAN.every(x=>e.plan?.includes(x))&&e.confirmed===true;
 return step===0?DISCOVERY_TYPES.every(type=>records.some(r=>r.id===e.stamps?.[type]&&r.fieldEvidence?.type===type)):questionValid(e.question);
}
export function normalizeDiscovery(c,raw,records=[]){
 if(!Number.isInteger(c)||c<0||c>4||!Array.isArray(raw))return [];
 const clean=[];
 for(let step=0;step<Math.min(raw.length,2);step++){
  if(!raw[step]||typeof raw[step]!=='object'||Array.isArray(raw[step]))break;
  const e=cleanEntry(c,step,raw[step],records);clean.push(e);
  if(!discoveryStepDone(c,step,e,records))break;
 }
 return clean;
}
