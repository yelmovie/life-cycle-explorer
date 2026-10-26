import test from 'node:test';
import assert from 'node:assert/strict';
import {initAudio,updateAudio,setMusicTheme,pauseAudio,resumeAudio,dispose,playSfx,MUSIC_TRACKS} from '../src/game-audio.js';
import {createDialogs} from '../src/field-dialogs.js';
import {initialField} from '../src/field-model.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
function environment(){
 const originals=Object.fromEntries(['Audio','AudioContext','document'].map(key=>[key,globalThis[key]])),players=[],contexts=[];
 class FakeAudio extends EventTarget{
  constructor(){super();this.dataset={};this.paused=true;this.currentTime=0;this.playCount=0;players.push(this);}
  set src(value){this._src=value;this.currentTime=0;}get src(){return this._src;}
  setAttribute(){}removeAttribute(){this._src='';}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  pause(){this.paused=true;}load(){this.loads=(this.loads||0)+1;}remove(){this.removed=true;}
 }
 class FakeContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};this.gains=[];this.oscillators=[];contexts.push(this);}
  createGain(){const node={gain:{value:0,setValueAtTime(value){this.value=value;},setTargetAtTime(value){this.value=value;},exponentialRampToValueAtTime(value){this.value=value;}},connect(){},disconnect(){}};this.gains.push(node);return node;}
  createMediaElementSource(){return {connect(){},disconnect(){}};}
  createOscillator(){const node={frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};this.oscillators.push(node);return node;}
  async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
 }
 const document=new EventTarget();document.hidden=false;document.body={append(){}};
 globalThis.Audio=FakeAudio;globalThis.AudioContext=FakeContext;globalThis.document=document;
 return {players,contexts,document,restore(){dispose();for(const [key,value]of Object.entries(originals))if(value===undefined)delete globalThis[key];else globalThis[key]=value;}};
}

test('음악은 첫 조작 전에는 만들지 않고 메인 곡 하나만 반복 재생한다',async()=>{
 const e=environment();try{
  setMusicTheme('main');assert.equal(e.players.length,0);
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();
  const player=e.players[0];assert.equal(player.src,MUSIC_TRACKS.main.src);assert.equal(player.loop,true);assert.equal(player.paused,false);
  player.currentTime=23;await initAudio({bgm:true,sfx:true,volume:.2});await flush();
  assert.equal(e.players.length,1);assert.equal(e.contexts.length,1);assert.equal(player.playCount,1);assert.equal(player.currentTime,23);
 }finally{e.restore();}
});

test('엔딩으로 바꿀 때 플레이어를 재사용하며 마지막 곡을 반복하지 않는다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0];
  setMusicTheme('ending');await flush();assert.equal(e.players.length,1);assert.equal(player.src,MUSIC_TRACKS.ending.src);assert.equal(player.loop,false);
  const count=player.playCount;player.currentTime=42;setMusicTheme('ending');await flush();assert.equal(player.playCount,count);assert.equal(player.currentTime,42);
  player.paused=true;player.dispatchEvent(new Event('ended'));updateAudio({bgm:true,sfx:true,volume:.4});await initAudio({bgm:true,sfx:true,volume:.4});await flush();
  assert.equal(player.paused,true);assert.equal(player.playCount,count);
  setMusicTheme('main');await flush();assert.equal(player.src,MUSIC_TRACKS.main.src);assert.equal(player.loop,true);assert.equal(player.paused,false);
 }finally{e.restore();}
});

test('배경음 토글·음량은 재생 위치와 효과음 크기를 보존한다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0],context=e.contexts[0],effects=context.gains[1].gain.value;
  player.currentTime=17;updateAudio({bgm:true,sfx:true,volume:.8});assert.equal(player.currentTime,17);assert.equal(context.gains[0].gain.value,.4);assert.equal(context.gains[1].gain.value,effects);
  updateAudio({bgm:false,sfx:true,volume:.8});assert.equal(player.paused,true);assert.equal(playSfx('click'),true);
  updateAudio({bgm:true,sfx:true,volume:.8});await flush();assert.equal(player.currentTime,17);assert.equal(player.paused,false);
 }finally{e.restore();}
});

test('개념 영상과 숨겨진 탭에서는 음악을 멈추고 돌아오면 이어서 재생한다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0];player.currentTime=12;
  pauseAudio();assert.equal(player.paused,true);assert.equal(playSfx('click'),false);
  setMusicTheme('ending');assert.equal(player.paused,true);resumeAudio();await flush();assert.equal(player.src,MUSIC_TRACKS.ending.src);assert.equal(player.paused,false);
  e.document.hidden=true;e.document.dispatchEvent(new Event('visibilitychange'));assert.equal(player.paused,true);
  e.document.hidden=false;e.document.dispatchEvent(new Event('visibilitychange'));await flush();assert.equal(player.paused,false);assert.equal(e.players.length,1);
 }finally{e.restore();}
});

test('음원 오류는 합성 대체로 이어지고 다시 켜면 재시도하며 dispose가 플레이어를 제거한다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0],context=e.contexts[0];
  player.dispatchEvent(new Event('error'));assert.equal(player.paused,true);assert.ok(context.oscillators.length>0);
  updateAudio({bgm:false,sfx:true,volume:.2});updateAudio({bgm:true,sfx:true,volume:.2});await flush();assert.equal(player.paused,false);assert.equal(player.loads,1);
  dispose();assert.equal(player.removed,true);assert.equal(context.state,'closed');
 }finally{e.restore();}
});

test('배경음이 꺼져 있으면 메인·엔딩 파일을 요청하지 않는다',async()=>{
 const e=environment();try{
  await initAudio({bgm:false,sfx:true,volume:.2});setMusicTheme('ending');assert.equal(e.players.length,0);
 }finally{e.restore();}
});

test('엔딩·기록증 창만 파이널 테마를 요청하고 미완료 상태는 엔딩을 열지 않는다',()=>{
 const field=initialField(),shown=[],dialogs=createDialogs({s:{field},dialog:options=>shown.push(options)});
 dialogs.ending();dialogs.certificate();assert.equal(shown.length,0);
 field.completed=[0,1,2,3,4];dialogs.ending();dialogs.certificate();assert.deepEqual(shown.map(options=>options.music),['ending','ending']);
});
