// Local theme recordings and CC0 Kenney/OpenGameArt effects, with synthesized fallbacks.
// voice: character lines, narration, villain lines and concept captions. sfxVolume multiplies every effects lane; 1 keeps
// the level the effects have always had (SFX_GAIN).
export const DEFAULT_AUDIO = Object.freeze({bgm:true,sfx:true,voice:true,volume:.2,sfxVolume:1});
export const MUSIC_TRACKS=Object.freeze({main:{src:'assets/audio/music/main-theme.mp3',loop:true},ending:{src:'assets/audio/music/ending-theme.mp3',loop:false}});
const SFX_GAIN=.16;
const unit=(value,fallback)=>{const v=Number(value??fallback);return Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;};
// Music and voice files are level-matched (about -16.5 LUFS). The default volume .2 puts the music at .21,
// about 0.3 of the .7 voice lines; under a spoken line it drops to a quarter of that.
const MUSIC_LEVEL=1.05,VOICE_DUCK=.25;
// When the 173 s ending theme runs out while the finale or ending screen stays open, the main theme carries on at this share.
// The ending theme fades in over FINALE_FADE seconds so the card-set jingle that leads into the map finale is never drowned out.
const ENDING_TAIL=.45,FINALE_FADE=1.2;
const MELODY=[72,76,79,76,74,77,81,77,71,74,79,74,72,76,79,83,81,77,74,77,79,76,72,76,74,71,67,71,72,null,67,null];
const BASS=[48,53,55,48,53,48,55,48];
const EFFECTS={
  click:[[76,.06],[79,.09]], select:[[72,.06],[76,.1]],
  place:[[67,.07],[72,.08],[76,.12]], drop:[[67,.07],[72,.08],[76,.12]],
  inspect:[[79,.09],[84,.13]], photo:[[84,.025],[79,.035]],
  success:[[72,.1],[76,.1],[79,.1],[84,.25]], reward:[[67,.1],[72,.1],[76,.1],[79,.1],[84,.32]],
  error:[[60,.13],[62,.17]], retry:[[60,.13],[62,.17]], bump:[[60,.13],[62,.17]],
  bell:[[84,.5],[91,.9]], wind:[[96,.03]],
  // Original gentle clockwork tick and forest footstep; no sampled recording required.
  time:[[79,.035],[72,.05],[84,.10]], step:[[43,.035],[48,.045]],
  // Map villain fallbacks when the CC0 samples have not decoded yet.
  'map-swing':[[88,.04]],'map-hit-light':[[82,.055]],'map-hit-heavy':[[68,.06],[53,.11]],
  'map-exit':[[90,.075],[83,.08],[75,.10],[65,.20]],'map-bump':[[83,.035],[49,.12]],
  'map-appear':[[79,.06],[86,.09]],'map-victory':[[72,.1],[76,.1],[79,.1],[84,.3]],
  // Achievement card fallbacks: fly in, reveal (the two rarest use the longer one), land in the slot, full set.
  'card-whoosh':[[91,.05]],'card-reveal':[[76,.08],[84,.2]],'card-epic':[[72,.09],[76,.09],[79,.09],[84,.09],[88,.3]],
  'card-slot':[[88,.05]],'card-complete':[[72,.1],[76,.1],[79,.1],[84,.12],[79,.1],[84,.4]],
  // A new region opening on the map: a soft latch, then a small bell.
  'stage-open':[[79,.05],[84,.08]],'stage-twinkle':[[91,.06],[96,.2]],
};
// One press is one strike: swing on press, impact as the flinch peaks; the third strike also sends the villain off.
const SEQUENCES={
  'map-strike-1':[['map-swing',0],['map-hit-light',.06]],
  'map-strike-2':[['map-swing',0],['map-hit-light',.06,.86]],
  'map-strike-3':[['map-swing',0],['map-hit-heavy',.06],['map-exit',.34]],
  'stage-unlock':[['stage-open',0],['stage-twinkle',.12]],
};
// Per-role loudness on top of the shared effects gain (library files are not peak-matched to the Kenney set).
// Library files sit near -18 to -25 LUFS; the Kenney UI set is near -10 LUFS. Bring combat roughly 3-6 dB under the UI cues.
const LEVELS={'map-swing':2.7,'map-hit-light':2.4,'map-hit-heavy':4,'map-exit':1.7,'map-bump':2.8,'map-appear':1.3,'map-victory':1.9,
 'card-whoosh':2.2,'card-reveal':1.8,'card-epic':1.8,'card-slot':2.4,'card-complete':1.9,
 'stage-open':2,'stage-twinkle':1.6};
const SAMPLES={click:'assets/audio/click.wav',select:'assets/audio/select.wav',place:'assets/audio/place.wav',inspect:'assets/audio/inspect.wav',photo:'assets/audio/photo.wav',success:'assets/audio/success.wav',reward:'assets/audio/reward.wav',error:'assets/audio/error.wav',time:'assets/audio/time.wav',step:'assets/audio/step.wav',bell:'assets/audio/bell.wav',wind:'assets/audio/wind.wav',
 'map-swing':'assets/audio/sfx/map-swing.mp3','map-hit-light':'assets/audio/sfx/map-hit-light.mp3','map-hit-heavy':'assets/audio/sfx/map-hit-heavy.mp3','map-exit':'assets/audio/sfx/map-exit.mp3','map-bump':'assets/audio/sfx/map-bump.mp3','map-appear':'assets/audio/sfx/map-appear.mp3','map-victory':'assets/audio/sfx/map-victory.mp3',
 'card-whoosh':'assets/audio/sfx/card-whoosh.mp3','card-reveal':'assets/audio/sfx/card-reveal.mp3','card-epic':'assets/audio/sfx/card-epic.mp3','card-slot':'assets/audio/sfx/card-slot.mp3','card-complete':'assets/audio/sfx/card-complete.mp3',
 'stage-open':'assets/audio/sfx/stage-open.mp3','stage-twinkle':'assets/audio/sfx/stage-twinkle.mp3'};
const sampleBuffers=new Map();let sampleLoad=null;
async function loadSamples(){
 if(sampleLoad||!context?.decodeAudioData||typeof window==='undefined')return;
 const owner=context;sampleLoad=Promise.allSettled(Object.entries(SAMPLES).map(async([key,url])=>{const response=await fetch(url);if(!response.ok)throw new Error('Sample unavailable');const buffer=await owner.decodeAudioData(await response.arrayBuffer());if(context===owner)sampleBuffers.set(key,buffer);}));
 await sampleLoad;
}
let context=null, musicGain=null,effectsGain=null,settings={...DEFAULT_AUDIO};
let timer=null,nextNote=0,step=0,unavailable=false,installed=false;
// Every film that pauses the audio and every voice that lowers the music holds its own tag; the audio comes back when all are released.
const pauseHolds=new Set(),duckHolds=new Set();
const paused=()=>pauseHolds.size>0;
let musicPlayer=null,playerSource=null,musicTheme='main',endingFinished=false,playPending=false,playEpoch=0,fadeIn=false;
const endingTail=()=>musicTheme==='ending'&&endingFinished;
const musicLevel=()=>Math.min(1,MUSIC_LEVEL*settings.volume)*(duckHolds.size?VOICE_DUCK:1)*(endingTail()?ENDING_TAIL:1);
const failedTracks=new Set();
const effectsLevel=()=>settings.sfx?SFX_GAIN*settings.sfxVolume:0;
// Effects run in three lanes. UI cues (click, answer, drop) cut only the previous UI cue; footsteps keep their own lane;
// combat and reward cues (strikes, villain cues, cards, jingles, region opening) overlap each other, up to four at once,
// and nothing in the other lanes stops them.
const musicNodes=new Set(),uiNodes=new Set(),stepNodes=new Set(),combatCues=[];
const COMBAT_CUES=4;
const laneOf=kind=>kind==='step'?'step':/^(map-|card-|stage-)/.test(kind)?'combat':'ui';
const audioConstructor=()=>globalThis.AudioContext||globalThis.webkitAudioContext;
const hidden=()=>typeof document!=='undefined'&&document.hidden;
const midi=value=>440*Math.pow(2,(value-69)/12);

export function isAudioAvailable(){return !unavailable&&typeof audioConstructor()==='function';}
export function normaliseAudio(input={}) {
  // Before the voice switch existed the voice followed the effects switch, so a missing value inherits it.
  const sfx=input.sfx!==false;
  return {bgm:input.bgm!==false,sfx,voice:typeof input.voice==='boolean'?input.voice:sfx,volume:unit(input.volume,DEFAULT_AUDIO.volume),sfxVolume:unit(input.sfxVolume,DEFAULT_AUDIO.sfxVolume)};
}
function stopNodes(nodes){for(const node of nodes){try{node.stop();}catch{}try{node.disconnect();}catch{}}nodes.clear();}
function stopEffects(){stopNodes(uiNodes);stopNodes(stepNodes);for(const cue of combatCues.splice(0))stopNodes(cue);}
function stopSynthesis(){if(timer!==null){clearInterval(timer);timer=null;}stopNodes(musicNodes);}
function stopMusic(){stopSynthesis();playEpoch++;playPending=false;musicPlayer?.pause();}
function ensureMusicPlayer(){
 if(musicPlayer||typeof Audio!=='function')return musicPlayer;
 const player=musicPlayer=new Audio();player.id='theme-audio';player.hidden=true;player.preload='none';player.setAttribute('aria-hidden','true');
 if(typeof document!=='undefined')document.body?.append(player);
 try{if(context.createMediaElementSource){playerSource=context.createMediaElementSource(player);playerSource.connect(musicGain);}}catch{playerSource=null;}
 player.addEventListener('ended',()=>{if(musicPlayer!==player||musicTheme!=='ending')return;endingFinished=true;syncMusic();});
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
  if(!context||context.state!=='running'||!settings.bgm||paused()||hidden())return;
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
  effectsGain.gain.setValueAtTime(effectsLevel(),context.currentTime);
  if(!settings.sfx)stopEffects();
  if(!settings.bgm||paused()||hidden()||context.state!=='running'){stopMusic();return;}
  const player=ensureMusicPlayer();
  if(player&&!failedTracks.has(musicTheme)){
    // Time constant .06 s: a level change (volume, voice duck) settles in about 0.2 s.
    stopSynthesis();const gain=musicGain.gain,now=context.currentTime;
    if(fadeIn&&typeof gain.linearRampToValueAtTime==='function'){fadeIn=false;gain.cancelScheduledValues?.(now);gain.setValueAtTime(0,now);gain.linearRampToValueAtTime(musicLevel(),now+FINALE_FADE);}
    else gain.setTargetAtTime(musicLevel(),now,.06);
    player.volume=playerSource?1:musicLevel();
    // After the ending theme the same player carries the looping main theme (quieter) until the screen closes.
    const theme=endingTail()?'main':musicTheme;
    if(player.dataset.musicTheme!==theme){const track=MUSIC_TRACKS[theme];player.loop=track.loop;player.dataset.musicTheme=theme;player.src=track.src;}
    if(player.paused&&!playPending){const epoch=++playEpoch;playPending=true;Promise.resolve(player.play()).catch(error=>{if(epoch!==playEpoch||['NotAllowedError','AbortError'].includes(error.name))return;failedTracks.add(musicTheme);syncMusic();}).finally(()=>{if(epoch===playEpoch)playPending=false;});}
    return;
  }
  player?.pause();musicGain.gain.setTargetAtTime(SFX_GAIN*.7*settings.volume*(duckHolds.size?VOICE_DUCK:1),context.currentTime,.06);
  if(timer!==null)return;
  nextNote=context.currentTime+.05;scheduleMusic();timer=setInterval(scheduleMusic,120);
}
/** Switch recordings without creating overlapping players or restarting the same theme. */
export function setMusicTheme(theme){
 if(!Object.hasOwn(MUSIC_TRACKS,theme)||theme===musicTheme)return musicTheme;
 stopMusic();musicTheme=theme;endingFinished=false;fadeIn=theme==='ending';step=0;syncMusic();return musicTheme;
}
function visibilityChanged(){
  if(!context)return;
  if(hidden()){stopMusic();stopEffects();void context.suspend().catch(()=>{});}
  else if(!paused())void context.resume().then(syncMusic).catch(()=>{});
}

/** Call from a real pointer/keyboard gesture. Repeated calls reuse one context. */
export async function initAudio(input=settings){
  settings=normaliseAudio(input);
  if(!isAudioAvailable())return false;
  try{
    if(!context){
      const Context=audioConstructor();context=new Context();
      musicGain=context.createGain();effectsGain=context.createGain();
      musicGain.gain.value=0;effectsGain.gain.value=effectsLevel();
      musicGain.connect(context.destination);effectsGain.connect(context.destination);
      if(typeof document!=='undefined'&&!installed){document.addEventListener('visibilitychange',visibilityChanged);installed=true;}
    }
    if(!hidden()&&!paused()&&context.state==='suspended')await context.resume();
    syncMusic();void loadSamples();return context.state==='running';
  }catch{unavailable=true;stopMusic();return false;}
}
export function updateAudio(input={}){const next=normaliseAudio(input);if(!settings.bgm&&next.bgm&&failedTracks.has(musicTheme)){failedTracks.delete(musicTheme);musicPlayer?.load();}settings=next;syncMusic();return {...settings};}
export function playSfx(kind='click'){
  if(!context||context.state!=='running'||!settings.sfx||paused()||hidden())return false;
  const lane=laneOf(kind);let nodes;
  if(lane==='combat'){
   for(let i=combatCues.length-1;i>=0;i--)if(!combatCues[i].size)combatCues.splice(i,1);
   while(combatCues.length>=COMBAT_CUES)stopNodes(combatCues.shift());
   combatCues.push(nodes=new Set());
  }else{nodes=lane==='step'?stepNodes:uiNodes;stopNodes(nodes);}
  const start=context.currentTime+.005;
  for(const [part,offset,rate] of SEQUENCES[kind]||[[kind,0]])scheduleSfx(part,start+offset,rate,nodes);
  return true;
}
function scheduleSfx(kind,start,rate=1,nodes=uiNodes){
  const buffer=sampleBuffers.get(({drop:'place',retry:'error',bump:'error'})[kind]||kind);
  if(buffer){
    const source=context.createBufferSource(),level=LEVELS[kind];source.buffer=buffer;
    if(rate!==1&&source.playbackRate)source.playbackRate.value=rate;
    const gain=level?context.createGain():null;if(gain){gain.gain.value=level;source.connect(gain);gain.connect(effectsGain);}else source.connect(effectsGain);
    nodes.add(source);source.onended=()=>{nodes.delete(source);source.disconnect();gain?.disconnect();};source.start(start);return;
  }
  let when=start;
  for(const [pitch,duration] of EFFECTS[kind]||EFFECTS.click){note(pitch,when,duration,effectsGain,'sine',nodes,.72);when+=duration*.8;}
}
const resumeIfFree=()=>{if(!paused()&&context&&!hidden())void context.resume().then(syncMusic).catch(()=>{});};
/** Pause both recordings and effects while a film or concept video plays. Returns the release for this hold only. */
export function pauseAudio(reason='video'){
  const hold={reason};pauseHolds.add(hold);stopMusic();stopEffects();if(context)void context.suspend().catch(()=>{});
  return ()=>{if(pauseHolds.delete(hold))resumeIfFree();};
}
/** Drop every pause hold: the dialog that owned the films has closed. Voice ducks keep their own releases. */
export function resumeAudio(){pauseHolds.clear();resumeIfFree();}
/** Lower the music under a spoken line; effects keep playing. Returns the release for this hold only. */
export function duckMusic(reason='voice'){
  const hold={reason};duckHolds.add(hold);syncMusic();
  return ()=>{if(duckHolds.delete(hold))syncMusic();};
}
/** Read-only snapshot for tests and QA probes. */
export function audioState(){return {theme:musicTheme,endingTail:endingTail(),effects:{ui:uiNodes.size,step:stepNodes.size,combat:combatCues.reduce((sum,cue)=>sum+cue.size,0)},pauses:[...pauseHolds].map(hold=>hold.reason),ducks:[...duckHolds].map(hold=>hold.reason),level:musicLevel(),gain:musicGain?.gain.value??null,effectsGain:effectsGain?.gain.value??null,context:context?.state??null};}
export function dispose(){
  stopMusic();stopEffects();
  const player=musicPlayer;musicPlayer=null;playerSource?.disconnect();playerSource=null;if(player){player.removeAttribute('src');player.load();player.remove();}
  musicTheme='main';endingFinished=false;fadeIn=false;failedTracks.clear();
  if(installed&&typeof document!=='undefined')document.removeEventListener('visibilitychange',visibilityChanged);
  installed=false;const old=context;context=null;musicGain=null;effectsGain=null;step=0;pauseHolds.clear();duckHolds.clear();sampleBuffers.clear();sampleLoad=null;
  if(old&&old.state!=='closed')void old.close().catch(()=>{});
}
