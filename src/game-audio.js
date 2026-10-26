// Local theme recordings and CC0 Kenney effects, with synthesized fallbacks.
export const DEFAULT_AUDIO = Object.freeze({bgm:false,sfx:true,volume:.2});
export const MUSIC_TRACKS=Object.freeze({main:{src:'assets/audio/music/main-theme.mp3',loop:true},ending:{src:'assets/audio/music/ending-theme.mp3',loop:false}});
const SFX_GAIN=.16;
const MUSIC_LEVEL=.5;
const MELODY=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,83,81,77,74,77,79,76,72,76,74,71,67,71,72,null,67,null];
const BASS=[48,53,55,48,53,48,55,48];
const EFFECTS={
  click:[[76,.06],[79,.09]], select:[[72,.06],[76,.1]],
  place:[[67,.07],[72,.08],[76,.12]], drop:[[67,.07],[72,.08],[76,.12]],
  inspect:[[79,.09],[84,.13]], photo:[[84,.025],[79,.035]],
  success:[[72,.1],[76,.1],[79,.1],[84,.25]], reward:[[67,.1],[72,.1],[76,.1],[79,.1],[84,.32]],
  error:[[60,.13],[62,.17]], retry:[[60,.13],[62,.17]], bump:[[60,.13],[62,.17]],
};
const SAMPLES={click:'assets/audio/click.wav',select:'assets/audio/select.wav',place:'assets/audio/place.wav',inspect:'assets/audio/inspect.wav',photo:'assets/audio/photo.wav',success:'assets/audio/success.wav',reward:'assets/audio/reward.wav',error:'assets/audio/error.wav',time:'assets/audio/time.wav',step:'assets/audio/step.wav'};
const sampleBuffers=new Map();let sampleLoad=null;
async function loadSamples(){
 if(sampleLoad||!context?.decodeAudioData||typeof window==='undefined')return;
 const owner=context;sampleLoad=Promise.allSettled(Object.entries(SAMPLES).map(async([key,url])=>{const response=await fetch(url);if(!response.ok)throw new Error('Sample unavailable');const buffer=await owner.decodeAudioData(await response.arrayBuffer());if(context===owner)sampleBuffers.set(key,buffer);}));
 await sampleLoad;
}
let context=null, musicGain=null,effectsGain=null,settings={...DEFAULT_AUDIO};
let timer=null,nextNote=0,step=0,paused=false,unavailable=false,installed=false;
let musicPlayer=null,playerSource=null,musicTheme='main',endingFinished=false,playPending=false,playEpoch=0;
const failedTracks=new Set();
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
function stopSynthesis(){if(timer!==null){clearInterval(timer);timer=null;}stopNodes(musicNodes);}
function stopMusic(){stopSynthesis();playEpoch++;playPending=false;musicPlayer?.pause();}
function ensureMusicPlayer(){
 if(musicPlayer||typeof Audio!=='function')return musicPlayer;
 const player=musicPlayer=new Audio();player.id='theme-audio';player.hidden=true;player.preload='none';player.setAttribute('aria-hidden','true');
 if(typeof document!=='undefined')document.body?.append(player);
 try{if(context.createMediaElementSource){playerSource=context.createMediaElementSource(player);playerSource.connect(musicGain);}}catch{playerSource=null;}
 player.addEventListener('ended',()=>{if(musicPlayer!==player||musicTheme!=='ending')return;endingFinished=true;stopMusic();});
 player.addEventListener('error',()=>{if(musicPlayer!==player)return;failedTracks.add(musicTheme);playEpoch++;playPending=false;syncMusic();});
 return player;
}
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
  effectsGain.gain.setValueAtTime(settings.sfx?SFX_GAIN:0,context.currentTime);
  if(!settings.sfx)stopNodes(effectNodes);
  if(!settings.bgm||paused||hidden()||context.state!=='running'){stopMusic();return;}
  const player=ensureMusicPlayer();
  if(player&&!failedTracks.has(musicTheme)){
    stopSynthesis();musicGain.gain.setTargetAtTime(MUSIC_LEVEL*settings.volume,context.currentTime,.06);player.volume=playerSource?1:MUSIC_LEVEL*settings.volume;
    if(endingFinished&&musicTheme==='ending')return;
    if(player.dataset.musicTheme!==musicTheme){const track=MUSIC_TRACKS[musicTheme];player.loop=track.loop;player.dataset.musicTheme=musicTheme;player.src=track.src;}
    if(player.paused&&!playPending){const epoch=++playEpoch;playPending=true;Promise.resolve(player.play()).catch(error=>{if(epoch!==playEpoch||['NotAllowedError','AbortError'].includes(error.name))return;failedTracks.add(musicTheme);syncMusic();}).finally(()=>{if(epoch===playEpoch)playPending=false;});}
    return;
  }
  player?.pause();musicGain.gain.setTargetAtTime(SFX_GAIN*.7*settings.volume,context.currentTime,.06);
  if(timer!==null)return;
  nextNote=context.currentTime+.05;scheduleMusic();timer=setInterval(scheduleMusic,120);
}
/** Switch recordings without creating overlapping players or restarting the same theme. */
export function setMusicTheme(theme){
 if(!Object.hasOwn(MUSIC_TRACKS,theme)||theme===musicTheme)return musicTheme;
 stopMusic();musicTheme=theme;endingFinished=false;step=0;syncMusic();return musicTheme;
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
    syncMusic();void loadSamples();return context.state==='running';
  }catch{unavailable=true;stopMusic();return false;}
}
export function updateAudio(input={}){const next=normaliseAudio(input);if(!settings.bgm&&next.bgm&&failedTracks.has(musicTheme)){failedTracks.delete(musicTheme);musicPlayer?.load();}settings=next;syncMusic();return {...settings};}
export function playSfx(kind='click'){
  if(!context||context.state!=='running'||!settings.sfx||paused||hidden())return false;
  stopNodes(effectNodes);
  const buffer=sampleBuffers.get(({drop:'place',retry:'error',bump:'error'})[kind]||kind);
  if(buffer){const source=context.createBufferSource();source.buffer=buffer;source.connect(effectsGain);effectNodes.add(source);source.onended=()=>{effectNodes.delete(source);source.disconnect();};source.start();return true;}
  let when=context.currentTime+.005;
  for(const [pitch,duration] of EFFECTS[kind]||EFFECTS.click){note(pitch,when,duration,effectsGain,'sine',effectNodes,.72);when+=duration*.8;}
  return true;
}
/** Pause both recordings and effects while a concept video is open. */
export function pauseAudio(){paused=true;stopMusic();stopNodes(effectNodes);if(context)void context.suspend().catch(()=>{});}
export function resumeAudio(){paused=false;if(context&&!hidden())void context.resume().then(syncMusic).catch(()=>{});}
export function dispose(){
  stopMusic();stopNodes(effectNodes);
  const player=musicPlayer;musicPlayer=null;playerSource?.disconnect();playerSource=null;if(player){player.removeAttribute('src');player.load();player.remove();}
  musicTheme='main';endingFinished=false;failedTracks.clear();
  if(installed&&typeof document!=='undefined')document.removeEventListener('visibilitychange',visibilityChanged);
  installed=false;const old=context;context=null;musicGain=null;effectsGain=null;step=0;paused=false;sampleBuffers.clear();sampleLoad=null;
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
}
