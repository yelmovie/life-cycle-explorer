// ElevenLabs voice lines (2026-11-18, docs/VOICE-FILL-20261118.json): exact on-screen text -> assets/audio/<file>.mp3.
// Narration and Jihoon = ElevenLabs "taemin" (same voice as the friends dialogue). Text not in this table stays silent.
export const VOICE_LINES={
 "멈춘 시간을 이어 줄 탐험가를 기다리고 있어.":"jihoon-intro-card",
 "숲의 생명 시계가 멈췄어. 나비의 모습도, 씨앗의 시간도 기록에서 떨어져 나갔어. 네가 관찰하고 실험한 기록으로 다섯 장소를 이어 줘. 첫 숲을 도우면 시간 손잡이를 받아. 씨앗이 자라는 시간을 직접 돌려 볼 수 있어. 끝에는 네 발견을 담은 이야기와 탐험 기록증을 가져갈 수 있어. 도토가 길을 도와줄 거야.":"jihoon-opening",
 "이 기록에는 네가 관찰하고 비교하며 설명한 활동이 담겨 있어. 관찰 근거와 설명의 연결은 선생님과 함께 확인해 보자. 다시 탐사할 때는 다른 특징을 기록하거나, 다른 기록으로 새 이야기를 만들어 봐.":"jihoon-ending",
 "알에서 깨어난 애벌레가 먹이를 먹으며 자라.":"jihoon-concept-butterfly-0",
 "어른벌레가 낳은 알은 다음 세대의 새 생명이야.":"jihoon-concept-butterfly-2",
 "같은 씨앗과 흙에서 조건 하나만 바꿔 비교해.":"jihoon-concept-seed-0",
 "물과 알맞은 온도가 갖춰지면 싹이 터.":"jihoon-concept-seed-1",
 "발아 조건을 비교할 때 다른 조건은 같게 유지해.":"jihoon-concept-seed-2"
};
export const voiceSrc=text=>{const key=VOICE_LINES[String(text??'').replace(/\s+/g,' ').trim()];return key?`assets/audio/${key}.mp3`:null;};
let player=null,release=null,options={enabled:()=>true,hold:()=>()=>{}};
// game-app.js supplies the effects switch and the same music pause the Doto hint voice uses.
export function configureVoice(next){options={...options,...next};}
export function stopVoice(){
 const current=player;player=null;
 if(current){current.onended=current.onerror=null;current.pause();current.removeAttribute('src');current.load();}
 release?.();release=null;
}
// hold:false inside films and concept clips, which already hold the music themselves.
export function speakTexts(texts,{hold=true}={}){
 const queue=texts.map(voiceSrc).filter(Boolean);
 stopVoice();
 if(!queue.length||!options.enabled()||globalThis.document?.hidden||typeof Audio==='undefined')return;
 if(hold)release=options.hold();
 const next=()=>{
  const src=queue.shift();if(!src){stopVoice();return;}
  const audio=player=new Audio(src);audio.volume=.7;
  audio.onended=()=>{if(player===audio)next();};audio.onerror=()=>{if(player===audio)stopVoice();};
  try{void audio.play()?.catch(()=>{if(player===audio)stopVoice();});}catch{stopVoice();}
 };
 next();
}
// A new dialog (modal-dismiss) or a real close stops the voice; a late close event from the previous dialog does not.
export function installVoiceStop(modal){
 modal.addEventListener('modal-dismiss',stopVoice);
 modal.addEventListener('close',()=>{if(!modal.open)stopVoice();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();});
 globalThis.addEventListener?.('pagehide',stopVoice);
}
export const speakParagraphs=(root,selector)=>speakTexts([[...root.querySelectorAll(selector)].map(p=>p.textContent).join(' ')]);
