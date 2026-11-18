import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {initialField} from '../src/field-model.js';

// The earned fixture (.tmp/field-play) was saved before later save fields existed.
// Fill only the missing keys from a fresh field so today's loader accepts it; existing values stay as saved.
function fillMissing(value,shape){
 if(Array.isArray(shape)){if(Array.isArray(value)&&value.length===shape.length)shape.forEach((item,i)=>{value[i]=fillMissing(value[i],item);});return value;}
 if(!shape||typeof shape!=='object')return value;
 if(!value||typeof value!=='object'||Array.isArray(value))return value;
 for(const key of Object.keys(shape))value[key]=Object.hasOwn(value,key)?fillMissing(value[key],shape[key]):structuredClone(shape[key]);
 return value;
}
export async function readEarned(root){
 const state=JSON.parse(await readFile(path.join(root,'.tmp/field-play/earned-state.json'),'utf8'));
 const fresh=initialField();
 // Care cases saved before the before/after comparison existed count as 'legacy', as the field model already allows.
 for(const chapter of [state.field.chapters?.[2],state.field.snapshots?.[2]])for(const task of chapter?.cases??[])if(!Object.hasOwn(task,'comparison'))task.comparison='legacy';
 state.field=fillMissing(state.field,fresh);
 for(const index of Object.keys(state.field.snapshots??{}))state.field.snapshots[index]=fillMissing(state.field.snapshots[index],fresh.chapters[Number(index)]);
 return state;
}
