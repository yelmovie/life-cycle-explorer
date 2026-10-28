// Input, stored drafts, submitted writing, restore and export share these limits.
export const TEXT_LIMITS=Object.freeze({observation:180,title:60,summary:300,caption:200,planSubject:200,planWhen:200,planWhat:200,question:180});
export const PLAN_LIMITS=Object.freeze({subject:TEXT_LIMITS.planSubject,when:TEXT_LIMITS.planWhen,what:TEXT_LIMITS.planWhat});
export const preserveText=(value,limit)=>typeof value==='string'?value.slice(0,limit):'';
// Object particle that matches the last syllable: 계절 나침반을 / 관찰 센서를.
export const objectParticle=word=>word+((word.charCodeAt(word.length-1)-0xAC00)%28?'을':'를');
export const meaningfulText=value=>typeof value==='string'?value.trim().length:0;
export function captionText(book,id){return Object.hasOwn(book.drafts?.captions||{},id)?book.drafts.captions[id]:(book.captions[id]||'');}
export function draftValue(book,scope,key,fallback=''){return Object.hasOwn(book.drafts?.[scope]||{},key)?book.drafts[scope][key]:fallback;}
