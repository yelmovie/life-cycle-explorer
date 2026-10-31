import {reducedMotion} from './game-motion.js';

// Looking and setting-up pages can play themselves; pages where the learner
// picks an answer never do. The prediction in 'design' stays the learner's.
const PHASES={0:['search'],1:['prepare','design']};
export function autoPlayable(f,phase){
 const c=f.active,q=f.chapters[c];
 if(!PHASES[c]?.includes(phase))return false;
 if(c===1&&phase==='design'){const r=q.rounds[q.round];return !r.b[r.variable];}
 return true;
}
// A room registers how to play its page. Every refresh re-renders the room,
// so a step that changes the page continues from the new state by itself.
export function autoPlayRoom(v,ctx,start){v.autoPlay=start;if(ctx.ui.autoPlay)start();}
// Steps wait long enough to be seen and are dropped when autoplay was stopped.
export const autoStep=(v,ctx,delay,fn)=>v.time.delayedCall(delay,()=>{if(ctx.ui.autoPlay)fn();});
// Carry a tool to its target as a hand would, then apply the step.
export function autoCarry(v,ctx,target,x,y,fn){
 target.setDepth?.(60);
 v.tweens.add({targets:target,x,y,duration:reducedMotion(ctx.s.settings)?1:700,ease:'Sine.easeInOut',onComplete:()=>{if(ctx.ui.autoPlay)fn();else v.refresh();}});
}
