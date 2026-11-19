// ElevenLabs voice lines (2026-11-18, docs/VOICE-FILL-20261118.json): exact on-screen text -> assets/audio/<file>.mp3.
// Narration and Jihoon = ElevenLabs "taemin" (same voice as the friends dialogue); map villain = ElevenLabs "Man Bo". Text not in this table stays silent.
export const VOICE_LINES={
 "멈춘 시간을 이어 줄 탐험가를 기다리고 있어.":"jihoon-intro-card",
 "숲의 생명 시계가 멈췄어. 나비의 모습도, 씨앗의 시간도 기록에서 떨어져 나갔어. 네가 관찰하고 실험한 기록으로 다섯 장소를 이어 줘. 첫 숲을 도우면 시간 손잡이를 받아. 씨앗이 자라는 시간을 직접 돌려 볼 수 있어. 끝에는 네 발견을 담은 이야기와 탐험 기록증을 가져갈 수 있어. 도토가 길을 도와줄 거야.":"jihoon-opening",
 "이 기록에는 네가 관찰하고 비교하며 설명한 활동이 담겨 있어. 관찰 근거와 설명의 연결은 선생님과 함께 확인해 보자. 다시 탐사할 때는 다른 특징을 기록하거나, 다른 기록으로 새 이야기를 만들어 봐.":"jihoon-ending",
 "알에서 깨어난 애벌레가 먹이를 먹으며 자라.":"jihoon-concept-butterfly-0",
 "번데기를 거쳐 날개가 있는 어른벌레가 돼.":"jihoon-concept-butterfly-1",
 "어른벌레가 낳은 알은 다음 세대의 새 생명이야.":"jihoon-concept-butterfly-2",
 "같은 씨앗과 흙에서 조건 하나만 바꿔 비교해.":"jihoon-concept-seed-0",
 "물과 알맞은 온도가 갖춰지면 싹이 터.":"jihoon-concept-seed-1",
 "발아 조건을 비교할 때 다른 조건은 같게 유지해.":"jihoon-concept-seed-2",
 "잎이 달라졌다면 흙 속 물과 받은 빛을 함께 살펴봐.":"jihoon-concept-care-0",
 "부족한 조건에 맞춰 물이나 빛을 도와줘.":"jihoon-concept-care-1",
 "시간이 지난 뒤 새잎과 돌봄 전 사진을 비교해.":"jihoon-concept-care-2",
 "나비와 개는 태어난 모습과 자라는 과정이 달라.":"jihoon-concept-seasons-0",
 "겨울을 지난 사과나무는 작년 그 나무야. 줄기가 이어져 있어.":"jihoon-concept-seasons-1",
 "봉선화가 남긴 씨앗에서 자란 새싹은 다음 세대야.":"jihoon-concept-seasons-2",
 "자세히 관찰하고, 조건을 바꾸고, 변화를 기록해.":"jihoon-concept-evidence-0",
 "사진 기록을 이어 무엇을 알아냈는지 설명해.":"jihoon-concept-evidence-1",
 "실제 생물도 여러 날 관찰하며 내 생각을 확인해.":"jihoon-concept-evidence-2",
 "알부터 나비까지 순서를 맞혔어? 첫 장을 뒤로 빼 놨는데!":"goblin-butterfly-0",
 "다음엔 번데기를 내 금고라고 우겨야겠군!":"goblin-butterfly-1",
 "앗, 섞어 둔 그림이 돌아갔어!":"goblin-butterfly-2",
 "번데기 다음 장까지 펼쳐져!":"goblin-butterfly-3",
 "흥, 나비의 한살이 책은 돌려줄게!":"goblin-butterfly-4",
 "씨앗이 싹트는 단서를 찾았어? 표찰만 숨기면 될 줄 알았지!":"goblin-seed-0",
 "다음엔 씨앗 표찰에 ‘비밀’이라고 쓰겠어!":"goblin-seed-1",
 "앗, 표찰 뒤쪽이 보였어!":"goblin-seed-2",
 "씨앗 기록까지 되찾았잖아!":"goblin-seed-3",
 "쳇, 씨앗 표찰은 제자리에 둘게!":"goblin-seed-4",
 "기르는 조건을 비교해 냈어? 내 온실 시계를 멈춰 놨단 말이야!":"goblin-care-0",
 "다음엔 내 시계에만 급수 버튼을 달겠어!":"goblin-care-1",
 "앗, 온실 시계가 다시 째깍!":"goblin-care-2",
 "기르기 기록까지 남아 있었네!":"goblin-care-3",
 "흥, 온실은 돌려줄게. 시계는 나중에 보자!":"goblin-care-4",
 "계절이 바뀌는 순서를 읽었어? 가을을 몰래 한 칸 밀어 뒀는데!":"goblin-season-0",
 "내 달력에는 내가 좋아하는 계절만 넣을 거야!":"goblin-season-1",
 "앗, 돌려놓은 계절판이 멈췄어!":"goblin-season-2",
 "계절 기록이 줄을 맞췄잖아!":"goblin-season-3",
 "쳇, 계절판을 제자리로 돌려둘게!":"goblin-season-4",
 "다섯 기록을 시계에 맞췄어? 톱니 하나 빼면 못 찾을 줄 알았지!":"goblin-clock-0",
 "이번엔 시계탑을 내 알람시계로 쓸 거야!":"goblin-clock-1",
 "앗, 빠진 톱니가 굴러가!":"goblin-clock-2",
 "태엽이 다시 돌아가잖아!":"goblin-clock-3",
 "흥, 탑은 가져. 나는 늦잠이나 잘래!":"goblin-clock-4"
};
export const voiceSrc=text=>{const key=VOICE_LINES[String(text??'').replace(/\s+/g,' ').trim()];return key?`assets/audio/${key}.mp3`:null;};
let player=null,release=null,options={enabled:()=>true,hold:()=>()=>{}};
// game-app.js supplies the effects switch and the same music duck the Doto hint voice uses.
export function configureVoice(next){options={...options,...next};}
export function stopVoice(){
 const current=player;player=null;
 if(current){current.onended=current.onerror=null;current.pause();current.removeAttribute('src');current.load();}
 release?.();release=null;
}
// hold:false inside films and concept clips, which already pause the music themselves.
// Returns whether a line started. onEnd runs when the lines finish or fail to play, not when stopped or replaced.
export function speakTexts(texts,{hold=true,onEnd=()=>{}}={}){
 const queue=texts.map(voiceSrc).filter(Boolean);
 stopVoice();
 if(!queue.length||!options.enabled()||globalThis.document?.hidden||typeof Audio==='undefined')return false;
 if(hold)release=options.hold();
 const fail=audio=>{if(player===audio){stopVoice();onEnd();}};
 const next=()=>{
  const src=queue.shift();if(!src){stopVoice();onEnd();return;}
  const audio=player=new Audio(src);audio.volume=.7;
  audio.onended=()=>{if(player===audio)next();};audio.onerror=()=>fail(audio);
  try{void audio.play()?.catch(()=>fail(audio));}catch{fail(audio);}
 };
 next();
 return true;
}
// A new dialog (modal-dismiss) or a real close stops the voice; a late close event from the previous dialog does not.
export function installVoiceStop(modal){
 modal.addEventListener('modal-dismiss',stopVoice);
 modal.addEventListener('close',()=>{if(!modal.open)stopVoice();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();});
 globalThis.addEventListener?.('pagehide',stopVoice);
}
export const speakParagraphs=(root,selector)=>speakTexts([[...root.querySelectorAll(selector)].map(p=>p.textContent).join(' ')]);
