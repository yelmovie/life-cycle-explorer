import {reducedMotion} from './game-motion.js';
import {roomPhase} from './field-flow.js';
import {renderObservationRoom} from './field-observation-scenes.js';
import {renderPlantRoom} from './field-plant-scenes.js';
import {renderStoryRoom,storyRoomAssets} from './field-story-scenes.js';
import {renderQuestRoom,questReady,DISCOVERY_MISSIONS} from './field-quests.js';
import {fieldRecords} from './field-model.js';
import {FIELD_CHAPTERS,FORM_NAMES,FORM_TRAITS} from './field-content.js';

const ROOM_ART=[['fieldClearing','egg','larva','pupa','adult','leaf','observationLens'],['bg2','vessel','soil','seed0','pot0','pot1','pot2','pot3','watercan','lamp','timeWheel'],['bg4','dry','pale','pot3','watercan','lamp','lightSensor','moistureSensor','timeWheel'],['gardenSeasons','egg','larva','pupa','adult','puppy','dogYoung','dog','timeWheel','seasonCompass','appleSpring','appleSummer','apple','winter','balsam','balsamDry','balsamSprout','balsamSeeds','rose'],['bg8',...storyRoomAssets]];
const QUEST_ART=[['leaf','pupa','egg','larva','adult'],['vessel','pot0'],['pot3','pale'],['appleSpring','balsamSprout','storyCamera'],['storyCamera']];
export const fieldRoomAssets=ctx=>[...new Set([...ROOM_ART[ctx.s.field.active],...QUEST_ART[ctx.s.field.active],FIELD_CHAPTERS[ctx.s.field.active].art,'paperCard','rewardRays'])];
const names={water:'물',warm:'온도',light:'빛'}, seasons=['첫봄','여름','가을','겨울','다음 봄'];
export function renderFieldRoom(v,ctx){
 const f=ctx.s.field,c=f.active,q=f.chapters[c],phase=roomPhase(f),act=(type,payload={})=>ctx.emit('act',{type,payload});
 const target=(x,y,w,h,id,label)=>v.drop(x,y,w,h,id,label,()=>ctx.emit('target',id));
 const tool=(key,x,y,kind,data={},label='')=>{const o=v.pic(key,x,y,115);v.draggable(o,kind,data,label||key);return o;};
 const token=(text,x,y,kind,data={},w=155)=>{const plate=v.add.rectangle(0,0,w,68,0xfff7d9).setStrokeStyle(3,0xa88a43),label=v.text(0,0,text,26,w-12);const o=v.add.container(x,y,[plate,label]).setSize(w,68);v.draggable(o,kind,data,text+' 옮기기');return o;};
 const check=(x,y,yes)=>{if(yes)v.text(x,y,'✓',35,50,'#21573b');};
 const plant=(key,x,y,size=290)=>{v.paper(x,417,360,355);v.shadow(x,y+size*.40,size*.65);return v.pic(key,x,y,size,size);};
 const line=(x1,y1,x2,y2)=>v.add.graphics().lineStyle(5,0xffe8a9,.9).lineBetween(x1,y1,x2,y2);
 const tag=(x,y,text)=>v.label(x,y,text,22,250);
 const dayDial=(key,x,y,value,max,type,payload={},labels)=>{v.dial(key,x,y,value,max,'dial',labels);ctx.ui.dial={type,payload};};
 if(phase==='discovery'){renderQuestRoom(v,ctx);return;}
 if(phase==='ready'){
  v.pic(c===4?'guideStory':'guideCare',370,440,370,440);const art=FIELD_CHAPTERS[c].art;
  const rays=v.pic('rewardRays',800,360,520).setAlpha(.85);
  const reward=v.pic(art,800,360,280);v.shadow(800,510,260);
  if(!reducedMotion(ctx.s.settings))v.tweens.add({targets:rays,angle:360,duration:24000,repeat:-1});
  v.label(800,560,FIELD_CHAPTERS[c].reward,38,530);v.text(800,620,FIELD_CHAPTERS[c].use,24,530);
  if(questReady(f,c))v.label(800,678,'✓ '+DISCOVERY_MISSIONS[c].name+' 도장',23,600);
  if(!reducedMotion(ctx.s.settings))v.tweens.add({targets:reward,y:340,duration:1300,yoyo:true,repeat:-1});return;
 }
 if(c===0){renderObservationRoom(v,ctx,phase);return;}
 if(c===1||c===2){renderPlantRoom(v,ctx,phase);return;}
 if(c===3){
  if(phase==='animals'||phase==='animal-birth'){
   const a=q.animals;v.pic(['egg','larva','pupa','adult'][a.butterfly.step],380,340,a.butterfly.step===0?90:235);v.pic(['puppy','dogYoung','dog'][a.dog.step],885,340,255);v.label(380,225,'나비의 시간',28,320);v.label(885,225,'개의 시간',28,320);
   if(phase==='animals'){
    v.dial('timeWheel',380,550,a.butterfly.step,3,'animal-dial-butterfly',['알','애벌레','번데기','어른벌레']);v.dial('timeWheel',885,550,a.dog.step,2,'animal-dial-dog',['갓 태어난 강아지','어린 개','다 자란 개']);
   }else{v.pic('egg',380,590,100/3);v.pic('puppy',885,590,130);target(630,465,220,95,'birth-different','부모와 다른 생명');v.label(630,465,'부모와 다른 생명',24,250);target(630,590,220,85,'birth-same','부모와 같은 몸');v.label(630,590,'부모와 같은 몸',24,230);token('다음 세대',630,290,'birth',{},200);}
   return;
  }
  if(['tags','seasons','plant-identity'].includes(phase)){
   const step=phase==='plant-identity'?4:q.season;const apples=['appleSpring','appleSummer','apple','winter','appleSpring'],balsams=['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'];
   plant(apples[step],420,385,330);plant(balsams[step],845,400,275);target(420,400,310,340,'plant-apple','사과나무 이름표');target(845,400,270,330,'plant-balsam','봉선화 이름표');
   v.label(420,225,'사과나무'+(q.tags.includes('apple')?' · A-01':''),27,340);v.label(845,225,'봉선화'+(q.tags.includes('balsam')?(step===4?' · B-02':' · B-01'):''),27,340);
   if(phase==='tags'){token('A-01',420,620,'tag',{plant:'apple'});token('B-01',845,620,'tag',{plant:'balsam'});}
   if(phase==='seasons'){dayDial('seasonCompass',1090,480,step,4,'season',{},seasons);v.label(650,600,step===3?'봉선화의 씨앗과 사과나무의 줄기를 찾아봐.':step===4?'씨앗에서 새 봉선화가 자랐어.':'이름표를 따라 같은 식물을 찾아봐.',24,760);}
   if(phase==='plant-identity'){token('작년 그 식물',400,640,'identity',{answer:'same'},210);token('새로 자란 식물',855,640,'identity',{answer:'new'},210);v.text(650,555,'다음 봄 · A-01의 줄기 / B-01이 남긴 씨앗',24,800);}
   return;
  }
  if(phase==='transfer'){
   const rose=q.transfers.rose!=='same';if(rose){plant('rose',460,370,270);plant('rose',850,370,270);v.label(460,205,'지난해 장미 R-01',26,350);v.label(850,205,'새봄 장미 R-01',26,350);}else{v.pic('dog',450,370,290);v.pic('puppy',850,390,200);v.label(450,205,'어미 개',27,300);v.label(850,205,'갓 태어난 강아지',27,350);}
   target(650,390,180,190,'transfer','새 자료에 판단 연결');token(rose?'작년 그 식물':'새끼로 태어남',400,625,'transfer',{subject:rose?'rose':'dog',answer:rose?'same':'live'},240);token(rose?'새로 자란 식물':'알에서 태어남',880,625,'transfer',{subject:rose?'rose':'dog',answer:rose?'new':'egg'},240);return;
  }
 }
 if(c===4){renderStoryRoom(v,ctx,phase);return;}
}
