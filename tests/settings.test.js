import test from 'node:test';
import assert from 'node:assert/strict';
import {renderSettings,renderResetConfirm} from '../src/game-settings.js';
import {DEFAULT_AUDIO,normaliseAudio,initAudio,updateAudio,playSfx,pauseAudio,resumeAudio,dispose} from '../src/game-audio.js';

test('settings keep replay locked until real completion and teacher preview only opens labelled samples',()=>{
  const locked=renderSettings({completed:[0,1,2,3],version:'1.2.3'});
  assert.match(locked.body,/data-action="ending" disabled/);
  assert.match(locked.body,/data-action="certificate" disabled/);
  const preview=renderSettings({completed:[0,1,2,3],teacherPreview:true,version:'1.2.3'});
  assert.match(preview.body,/data-action="ending" data-sample="1">엔딩 다시 보기 \(샘플\)/);
  assert.match(preview.body,/data-action="certificate" data-sample="1">인증서 받기 \(샘플\)/);
  assert.match(locked.body,/v1\.2\.3/);
  assert.match(preview.body,/data-action="teacher-preview" aria-pressed="true"/);
  const finished=renderSettings({completed:[0,1,2,3,4]});
  assert.doesNotMatch(finished.body,/data-action="(?:ending|certificate)" disabled/);
});

test('settings separates sound controls, escapes provided copy and preserves reset cancellation',()=>{
  const {body}=renderSettings({audio:{bgm:false,sfx:true,volume:.35},version:'<script>',audioAvailable:false});
  assert.match(body,/data-action="audio-bgm"[^>]+disabled/);
  assert.match(body,/data-action="audio-sfx"[^>]+disabled/);
  assert.match(body,/id="bgm-volume"[^>]+value="35" disabled/);
  assert.match(body,/&lt;script&gt;/);
  assert.doesNotMatch(body,/<a\s|mailto:|\bhttps?:/);
  assert.match(renderResetConfirm().actions,/data-action="settings" autofocus/);
  assert.match(renderResetConfirm().body,/소리 설정은 그대로 남아요/);
});

test('music and effects are on by default and unavailable browsers can continue without an audio context',async()=>{
  assert.deepEqual(DEFAULT_AUDIO,{bgm:true,sfx:true,volume:.2});
  assert.deepEqual(normaliseAudio({volume:NaN}),{bgm:true,sfx:true,volume:.2});
  assert.equal(await initAudio(),false);
  assert.equal(playSfx('success'),false);
});

test('audio reuses one context, replaces effects and keeps effect volume independent of BGM volume',async()=>{
  let constructed=0;const contexts=[];
  class FakeContext{
    constructor(){constructed++;this.currentTime=0;this.state='running';this.destination={};this.gains=[];this.oscillators=[];contexts.push(this);}
    createGain(){const gain={gain:{value:0,setValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;}},connect(){},disconnect(){}};this.gains.push(gain);return gain;}
    createOscillator(){const oscillator={frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){this.stopped=true;}};this.oscillators.push(oscillator);return oscillator;}
    async resume(){this.state='running';}async suspend(){this.state='suspended';}async close(){this.state='closed';}
  }
  const original=globalThis.AudioContext;globalThis.AudioContext=FakeContext;
  try{
    assert.equal(constructed,0);
    assert.equal(await initAudio({bgm:false,sfx:true,volume:.2}),true);
    await initAudio({bgm:false,sfx:true,volume:.8});
    assert.equal(constructed,1);
    const context=contexts[0],effectGain=context.gains[1].gain.value;
    assert.equal(playSfx('click'),true);
    const first=[...context.oscillators];
    playSfx('success');
    assert.ok(first.every(node=>node.stopped));
    updateAudio({bgm:false,sfx:true,volume:0});
    assert.equal(context.gains[1].gain.value,effectGain);
    pauseAudio();assert.equal(playSfx('click'),false);
    resumeAudio();await Promise.resolve();
    updateAudio({bgm:false,sfx:false,volume:1});assert.equal(playSfx('success'),false);
  }finally{dispose();if(original===undefined)delete globalThis.AudioContext;else globalThis.AudioContext=original;}
});
