// Doto's spoken hints. Split out of game-app.js (E2); the behaviour is unchanged.
// Doto speaks with ElevenLabs "Deok su" (2026-11-18, docs/VOICE-FILL-20261118.json). After the first discovery hints,
// Doto also reads the quoted observation memo shown on the panel.
const DOTO_MEMO={'discovery-0-0':'memo-0','discovery-0-1':'memo-1'};
export function createDotoVoice({bubble,voiceOn,reduced,blocked,villainSpeaking,duckMusic}){
 let player=null,wait=null,duck=null;
 const setMotion=speaking=>{bubble.dataset.speaking=String(speaking&&!reduced());};
 function stop(){
  clearTimeout(wait);wait=null;
  const current=player;player=null;setMotion(false);
  // The music stays on under Doto's voice at a quarter of its level; stopping the line for any reason hands the level back.
  duck?.();duck=null;
  if(!current)return;
  current.onplaying=current.onpause=current.onwaiting=current.onended=current.onerror=null;
  current.pause();current.removeAttribute('src');current.load();
 }
 function speak(key,then=DOTO_MEMO[key],since=Date.now()){
  stop();
  if(!key||!voiceOn()||document.hidden||blocked())return;
  // A villain line that has already started finishes first; Doto waits for it (at most 2 s) instead of talking over it.
  if(villainSpeaking()&&Date.now()-since<2000){wait=setTimeout(()=>speak(key,then,since),150);return;}
  const line=player=new Audio(key.startsWith('memo-')?`assets/audio/doto-memo-el/${key}.mp3`:`assets/audio/doto-hints-el/${key}.mp3`);
  line.volume=.7;duck=duckMusic('guide');
  line.onplaying=()=>{if(player===line)setMotion(true);};
  line.onpause=line.onwaiting=()=>{if(player===line)setMotion(false);};
  const done=()=>{if(player===line)stop();};
  line.onended=()=>{if(player!==line)return;if(then)speak(then,null);else done();};line.onerror=done;
  void line.play().catch(done);
 }
 return {speak,stop,busy:()=>!!player||wait!==null,refreshMotion:()=>setMotion(!!player&&!player.paused&&player.readyState>=3)};
}
