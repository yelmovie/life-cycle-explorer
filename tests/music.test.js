import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initAudio,updateAudio,setMusicTheme,pauseAudio,resumeAudio,duckMusic,audioState,dispose,playSfx,MUSIC_TRACKS} from '../src/game-audio.js';
import {createDialogs} from '../src/field-dialogs.js';
import {initialField} from '../src/field-model.js';

const flush=()=>new Promise(resolve=>setImmediate(resolve));
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);
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
  createOscillator(){const node={frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){},stop(when){this.stopped=true;if(when===undefined)this.cut=true;}};this.oscillators.push(node);return node;}
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
  // When the ending theme runs out with the screen still open, the main theme carries on at 0.45 of its level (no silence).
  player.paused=true;player.dispatchEvent(new Event('ended'));updateAudio({bgm:true,sfx:true,volume:.4});await initAudio({bgm:true,sfx:true,volume:.4});await flush();
  assert.equal(player.src,MUSIC_TRACKS.main.src);assert.equal(player.loop,true);assert.equal(player.paused,false);
  assert.equal(audioState().endingTail,true);near(audioState().level,.42*.45);
  // Asking for the ending again on the same screen does not restart it.
  const tailCount=player.playCount;setMusicTheme('ending');await flush();assert.equal(player.src,MUSIC_TRACKS.main.src);assert.equal(player.playCount,tailCount);
  player.currentTime=31;setMusicTheme('main');await flush();assert.equal(player.src,MUSIC_TRACKS.main.src);assert.equal(player.loop,true);assert.equal(player.paused,false);
  assert.equal(player.currentTime,31);assert.equal(audioState().endingTail,false);near(audioState().level,.42);
 }finally{e.restore();}
});

test('배경음 토글·음량은 재생 위치와 효과음 크기를 보존한다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0],context=e.contexts[0],effects=context.gains[1].gain.value;
  player.currentTime=17;updateAudio({bgm:true,sfx:true,volume:.8});assert.equal(player.currentTime,17);near(context.gains[0].gain.value,.84);assert.equal(context.gains[1].gain.value,effects);
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

test('기본 설정의 배경음은 대사(0.7)의 0.3배이고 크기 100%에서도 1을 넘지 않는다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const music=e.contexts[0].gains[0].gain;
  near(music.value,.21);near(music.value/.7,.3);
  updateAudio({bgm:true,sfx:true,volume:1});assert.equal(music.value,1);
 }finally{e.restore();}
});

test('대사 동안 배경음은 멈추지 않고 1/4로 줄며 효과음은 계속 난다. 이름표가 모두 빠져야 되돌아온다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0],context=e.contexts[0],music=context.gains[0].gain,effects=context.gains[1].gain.value;
  player.currentTime=9;const guide=duckMusic('guide');
  assert.equal(player.paused,false);assert.equal(player.currentTime,9);assert.equal(context.state,'running');near(music.value,.21*.25);
  assert.equal(playSfx('click'),true);assert.equal(context.gains[1].gain.value,effects);
  const villain=duckMusic('voice');assert.deepEqual(audioState().ducks,['guide','voice']);
  guide();near(music.value,.21*.25);guide();assert.deepEqual(audioState().ducks,['voice']);
  updateAudio({bgm:true,sfx:true,volume:.4});near(music.value,.42*.25);
  villain();near(music.value,.42);assert.deepEqual(audioState().ducks,[]);assert.equal(player.playCount,1);
 }finally{e.restore();}
});

test('영상 멈춤도 이름표라 하나가 끝나도 다른 영상이 남아 있으면 멈춘 채로 있고, 대사 줄임과 섞이지 않는다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const player=e.players[0],music=e.contexts[0].gains[0].gain;
  const cinema=pauseAudio('cinema'),concept=pauseAudio('concept');assert.equal(player.paused,true);
  const voice=duckMusic('voice');voice();assert.equal(player.paused,true);
  cinema();await flush();assert.equal(player.paused,true);assert.equal(playSfx('click'),false);assert.deepEqual(audioState().pauses,['concept']);
  cinema();concept();await flush();assert.equal(player.paused,false);near(music.value,.21);
  const film=pauseAudio('cinema'),line=duckMusic('voice');resumeAudio();await flush();
  assert.equal(player.paused,false);near(music.value,.21*.25);film();line();near(music.value,.21);
 }finally{e.restore();}
});

test('지도 파이널 창은 열릴 때와 닫힐 때 map-finale 이벤트로 알린다',async()=>{
 const source=await readFile(new URL('../src/map-finale.js',import.meta.url),'utf8'),app=await readFile(new URL('../src/game-app.js',import.meta.url),'utf8');
 assert.match(source,/new CustomEvent\('map-finale',\{detail:\{open\}\}\)\);announce\(true\)/);
 assert.match(source,/addEventListener\('close',\(\)=>\{video\.pause\(\);dialog\.remove\(\);announce\(false\);\}/);
 assert.match(source,/video\.muted=true/);
 assert.match(app,/addEventListener\('map-finale',event=>audio\.setMusicTheme\(event\.detail\?\.open\?'ending':'main'\)\)/);
 assert.doesNotMatch(app,/holdingMusic|pauseAudio\(\);return audio\.resumeAudio/);
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

test('지도 공격은 한 번 누를 때 휘두름·명중을 한 묶음으로 내고 효과음을 끄면 내지 않는다',async()=>{
 const e=environment();try{
  await initAudio({bgm:false,sfx:true,volume:.2});const context=e.contexts[0];
  const before=context.oscillators.length;assert.equal(playSfx('map-strike-1'),true);
  assert.equal(context.oscillators.length-before,2);
  const third=context.oscillators.length;assert.equal(playSfx('map-strike-3'),true);
  assert.equal(context.oscillators.length-third,7);
  for(const kind of ['map-bump','map-appear','map-victory'])assert.equal(playSfx(kind),true);
  updateAudio({bgm:false,sfx:false,volume:.2});assert.equal(playSfx('map-strike-2'),false);
 }finally{e.restore();}
});

test('효과음 갈래: UI 소리와 발자국은 전투·보상 소리를 끊지 않고, 전투·보상은 최대 4개까지 겹친다',async()=>{
 const e=environment();try{
  await initAudio({bgm:true,sfx:true,volume:.2});await flush();const context=e.contexts[0];
  const made=()=>context.oscillators.length,since=start=>context.oscillators.slice(start);
  let mark=made();playSfx('map-strike-3');const strike=since(mark);assert.ok(strike.length>0);
  mark=made();playSfx('card-complete');const jingle=since(mark);
  mark=made();playSfx('click');const click=since(mark);
  for(let i=0;i<6;i++)playSfx('step');
  playSfx('select');
  assert.ok(strike.every(node=>!node.cut),'strike survives UI and footsteps');
  assert.ok(jingle.every(node=>!node.cut),'card jingle survives UI and footsteps');
  assert.ok(click.every(node=>node.cut),'a new UI cue replaces the previous UI cue');
  assert.ok(audioState().effects.step>0);
  mark=made();playSfx('stage-unlock');assert.ok(since(mark).length>0);
  playSfx('map-appear');playSfx('map-bump');
  assert.ok(strike.every(node=>node.cut),'the oldest of five combat cues gives way');
  assert.ok(jingle.every(node=>!node.cut));
  updateAudio({bgm:true,sfx:false,volume:.2});assert.deepEqual(audioState().effects,{ui:0,step:0,combat:0});
 }finally{e.restore();}
});
