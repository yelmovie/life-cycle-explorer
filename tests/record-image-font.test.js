import test from 'node:test';
import assert from 'node:assert/strict';
import {recordImage} from '../src/game-records.js';

test('record PNG captions wait for NanumSquareNeo and remain outside the SVG image',async()=>{
 const names=['document','Image','FileReader','fetch'],saved=names.map(name=>Object.getOwnPropertyDescriptor(globalThis,name));
 const events=[],captions=[],svgs=[];let loaded=false;
 const ctx={drawImage(){events.push('image');},fillText(text,x,y){assert.equal(loaded,true);captions.push({text,x,y,font:this.font,align:this.textAlign});events.push('caption');}};
 const canvas={getContext:()=>ctx,toDataURL(){events.push('png');return 'data:image/png;base64,test';}};
 try{
  globalThis.document={createElement:()=>canvas,fonts:{async load(font){events.push('font');assert.equal(font,'22px NanumSquareNeo');await Promise.resolve();loaded=true;}}};
  globalThis.Image=class{set src(value){svgs.push(decodeURIComponent(value.split(',').slice(1).join(',')));queueMicrotask(()=>this.onload());}};
  globalThis.FileReader=class{readAsDataURL(){this.result='data:image/png;base64,art';queueMicrotask(()=>this.onload());}};
  globalThis.fetch=async()=>({ok:true,blob:async()=>({})});
  const state={discovery:{drawing:[]}};
  await recordImage({id:'font-test',evidence:{type:'observation',species:'egg'}},state);
  assert.deepEqual(events,['image','font','caption','png']);
  assert.deepEqual(captions,[{text:'내가 확대해서 표시한 부분',x:360,y:460,font:'22px NanumSquareNeo,sans-serif',align:'center'}]);
  assert.doesNotMatch(svgs[0],/<text\b|font-family/);
  events.length=0;captions.length=0;loaded=false;
  await recordImage({id:'font-thumbnail-test',fieldEvidence:{type:'comparison',animal:'butterfly',photos:[0,3]}},state,true);
  assert.deepEqual(events,['image','png']);assert.equal(captions.length,0);assert.equal(canvas.height,380);
 }finally{names.forEach((name,i)=>saved[i]?Object.defineProperty(globalThis,name,saved[i]):delete globalThis[name]);}
});
