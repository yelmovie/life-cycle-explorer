// Original, locally synthesized music and feedback: no audio downloads or autoplay.
export const DEFAULT_AUDIO = Object.freeze({bgm:false,sfx:true,volume:.2});
const SFX_GAIN=.16;
const MELODY=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,83,81,77,74,77,79,76,72,76,74,71,67,71,72,null,67,null];
const BASS=[48,53,55,48,53,48,55,48];
const EFFECTS={
  click:[[76,.06],[79,.09]], select:[[72,.06],[76,.1]],
  place:[[67,.07],[72,.08],[76,.12]], drop:[[67,.07],[72,.08],[76,.12]],
  inspect:[[79,.09],[84,.13]], photo:[[84,.025],[79,.035]],
  success:[[72,.1],[76,.1],[79,.1],[84,.25]], reward:[[67,.1],[72,.1],[76,.1],[79,.1],[84,.32]],
  error:[[60,.13],[62,.17]], retry:[[60,.13],[62,.17]], bump:[[60,.13],[62,.17]],
};
let context=null, musicGain=null,effectsGain=null,settings={...DEFAULT_AUDIO};
let timer=null,nextNote=0,step=0,paused=false,unavailable=false,installed=false;
const musicNodes=new Set(), effectNodes=new Set();
const audioConstructor=()=>globalThis.AudioContext||globalThis.webkitAudioContext;
const hidden=()=>typeof document!=='undefined'&&document.hidden;
const midi=value=>440*Math.pow(2,(value-69)/12);

export function isAudioAvailable(){return !unavailable&&typeof audioConstructor()==='function';}
export function normaliseAudio(input={}) {
  const v=Number(input.volume??DEFAULT_AUDIO.volume);
  return {bgm:input.bgm===true,sfx:input.sfx!==false,volume:Number.isFinite(v)?Math.max(0,Math.min(1,v)):DEFAULT_AUDIO.volume};
}
function stopNodes(nodes){for(const node of nodes){try{node.stop();}catch{}try{node.disconnect();}catch{}}nodes.clear();}
function stopMusic(){if(timer!==null){clearInterval(timer);timer=null;}stopNodes(musicNodes);}
function note(pitch,time,length,gain,type,nodes,level=.55){
  if(!context||pitch===null)return;
  const oscillator=context.createOscillator(),envelope=context.createGain();
  oscillator.type=type;oscillator.frequency.setValueAtTime(midi(pitch),time);
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.exponentialRampToValueAtTime(level,time+.018);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+length);
  oscillator.connect(envelope);envelope.connect(gain);nodes.add(oscillator);
  oscillator.onended=()=>{nodes.delete(oscillator);oscillator.disconnect();envelope.disconnect();};
  oscillator.start(time);oscillator.stop(time+length+.025);
}
function scheduleMusic(){
  if(!context||context.state!=='running'||!settings.bgm||paused||hidden())return;
  const horizon=context.currentTime+.32;
  if(nextNote<context.currentTime)nextNote=context.currentTime+.05;
  while(nextNote<horizon){
    note(MELODY[step%MELODY.length],nextNote,.48,musicGain,'sine',musicNodes,.43);
    if(step%4===0)note(BASS[Math.floor(step/4)%BASS.length],nextNote,1.65,musicGain,'sine',musicNodes,.25);
    nextNote+=.42;step++;
  }
}
function syncMusic(){
  if(!context)return;
  musicGain.gain.setTargetAtTime(SFX_GAIN*.7*settings.volume,context.currentTime,.06);
  effectsGain.gain.setValueAtTime(settings.sfx?SFX_GAIN:0,context.currentTime);
  if(!settings.sfx)stopNodes(effectNodes);
  if(!settings.bgm||paused||hidden()||context.state!=='running'){stopMusic();return;}
  if(timer!==null)return;
  nextNote=context.currentTime+.05;scheduleMusic();timer=setInterval(scheduleMusic,120);
}
function visibilityChanged(){
  if(!context)return;
  if(hidden()){stopMusic();stopNodes(effectNodes);void context.suspend().catch(()=>{});}
  else if(!paused)void context.resume().then(syncMusic).catch(()=>{});
}

/** Call from a real pointer/keyboard gesture. Repeated calls reuse one context. */
export async function initAudio(input=settings){
  settings=normaliseAudio(input);
  if(!isAudioAvailable())return false;
  try{
    if(!context){
      const Context=audioConstructor();context=new Context();
      musicGain=context.createGain();effectsGain=context.createGain();
      musicGain.gain.value=0;effectsGain.gain.value=SFX_GAIN;
      musicGain.connect(context.destination);effectsGain.connect(context.destination);
      if(typeof document!=='undefined'&&!installed){document.addEventListener('visibilitychange',visibilityChanged);installed=true;}
    }
    if(!hidden()&&!paused&&context.state==='suspended')await context.resume();
    syncMusic();return context.state==='running';
  }catch{unavailable=true;stopMusic();return false;}
}
export function updateAudio(input={}){settings=normaliseAudio(input);syncMusic();return {...settings};}
export function playSfx(kind='click'){
  if(!context||context.state!=='running'||!settings.sfx||paused||hidden())return false;
  stopNodes(effectNodes);
  let when=context.currentTime+.005;
  for(const [pitch,duration] of EFFECTS[kind]||EFFECTS.click){note(pitch,when,duration,effectsGain,'sine',effectNodes,.72);when+=duration*.8;}
  return true;
}
/** Pauses all synthesis while a story/video is open. */
export function pauseAudio(){paused=true;stopMusic();stopNodes(effectNodes);if(context)void context.suspend().catch(()=>{});}
export function resumeAudio(){paused=false;if(context&&!hidden())void context.resume().then(syncMusic).catch(()=>{});}
export function dispose(){
  stopMusic();stopNodes(effectNodes);
  if(installed&&typeof document!=='undefined')document.removeEventListener('visibilitychange',visibilityChanged);
  installed=false;const old=context;context=null;musicGain=null;effectsGain=null;step=0;paused=false;
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
}
