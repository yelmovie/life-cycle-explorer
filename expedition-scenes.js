import {CLUES,SEED_CASES,CARE_CASES,GARDEN_CASES,FINAL_CASES,REQUESTS,questSolved,questRecords,questProgress} from './expedition.js';
import {seedLevel} from './inquiry-core.js';

const ink='#244f40';
function tag(w,x,y,text,size=22){return w.text(x,y,text,size).setBackgroundColor('#fff9e9ed').setPadding(12,8);}
function shadow(w,x,y,width=190){w.add.ellipse(x,y,width,24,0x254e3c,.15);}
function target(w,x,y,width,height,id,onClick){w.drop(x,y,width,height,id);if(onClick)w.click(x,y,width,height,onClick);}
function selected(w,ob,id){ob.on('pointerdown',()=>w.emit('quest-select',id));return ob;}

// The handle rotates without starting a timer: moving it changes the observed time.
export function timeDial(w,key,x,y,value,max,event){
  const image=w.pic(key,x,y,170).setInteractive({useHandCursor:true});
  const pointer=w.add.graphics();
  const draw=n=>{pointer.clear().lineStyle(5,0x305e49);const a=n/max*Math.PI*2-Math.PI/2;pointer.lineBetween(x,y,x+Math.cos(a)*43,y+Math.sin(a)*43);};
  let next=value;draw(value);w.input.setDraggable(image);
  image.on('drag',p=>{const angle=(Math.atan2(p.y-y,p.x-x)+Math.PI*2.5)%(Math.PI*2);next=Math.round(angle/(Math.PI*2)*max);draw(next);});
  image.on('dragend',()=>w.emit(event,next));
  tag(w,x,y+113,event==='season'?['봄','여름','가을','겨울','다음 봄'][value]:max===7?`${value}일`:`${['돌본 직후','며칠 뒤','더 며칠 뒤'][value]}`,20);
}

function recordPreview(w,context,r,x,y){
  const preview=w.pic(r.art,x,y,165,105),token=w.renderToken;
  context.recordImage(r,w.s).then(data=>{
    if(w.renderToken!==token)return;
    const key='quest-'+r.id+'-'+token;w.recordTextures??=[];w.recordTextures.push(key);
    w.textures.once('addtexture-'+key,()=>{if(w.renderToken===token&&preview.active){preview.setTexture(key);preview.setScale(Math.min(165/preview.width,105/preview.height));}});
    w.textures.addBase64(key,data);
  }).catch(()=>w.emit('toast','기록 그림을 다시 불러와 줘.'));
}

export function renderQuest(w,context){
  const s=w.s,e=s.expedition,c=e.active,request=REQUESTS[c];
  const [count,total]=questProgress(s,c);tag(w,1120,82,`의뢰 ${count}/${total}`,20);
  if(questSolved(s,c)){
    shadow(w,815,470,300);w.pic(request.art,815,300,300);tag(w,810,510,request.reward+' 획득 준비!',27);
    w.pic('guideStory',310,350,310);tag(w,365,117,'함께 해결했어!',28);
    w.text(800,125,'네 관찰과 실험 덕분에\n숲의 시간이 이어졌어.',27);
    return;
  }
  const guide=c===1?'guideTime':c===2?'guideCare':'guideStory';
  w.pic(guide,114,386,190,285);
  if(c===0){
    ['egg','larva','pupa','adult'].forEach((id,i)=>{const x=320+i*260;shadow(w,x,316);w.pic(id,x,220,190,165);tag(w,x,333,({egg:'알',larva:'애벌레',pupa:'번데기',adult:'어른벌레'})[id]);target(w,x,240,235,240,id,()=>w.emit('quest-apply',id));});
    CLUES.forEach((clue,i)=>{const x=320+i*260,done=e.clues[clue.id]===clue.target;
      const card=w.add.container(x,480,[w.add.rectangle(0,0,230,145,done?0xe0eed6:0xfff8e5,.98).setStrokeStyle(3,done?0x528358:0xd8b66d),w.text(0,-12,(done?'✓ ':'')+clue.text,21).setWordWrapWidth(205),w.text(0,48,done?'단서 연결 완료':'끌어서 모습에 놓기',17)]).setSize(230,145);
      if(!done)selected(w,w.draggable(card,'quest-drop',{type:'match',id:clue.id}),clue.id);
    });
  }
  if(c===1){
    const i=e.seeds.findIndex(q=>!q.recorded),q=e.seeds[i],problem=SEED_CASES[i];tag(w,650,105,`${i+1}/2 · ${problem.name}`,26);
    [problem.before,q.after].forEach((conditions,j)=>{const x=440+j*410,level=q.running?seedLevel(conditions,q.day):0;
      shadow(w,x,400,230);w.pic('pot'+level,x,275,260,260);tag(w,x,432,(j?'새 씨앗':'처음 조건')+' · 물 '+(conditions.water?'있음':'없음')+'\n온도 '+(conditions.warm?'따뜻함':'차가움'),21);
      if(j&&!q.running)target(w,x,285,300,280,'after');
    });
    if(!q.running){
      [['water','watercan','물 주기'],['warm','lamp','따뜻하게']].forEach(([key,art,label],j)=>{const x=520+j*240;w.draggable(w.pic(art,x,535,90),'quest-drop',{type:'seed-adjust',key});tag(w,x+105,535,label,19);});
    }else timeDial(w,'timeWheel',1135,335,q.day,7,'quest-seed-time');
  }
  if(c===2){
    const i=e.care.findIndex(q=>!q.recorded),q=e.care[i],problem=CARE_CASES[i];tag(w,640,100,`${i+1}/2 · ${problem.name}`,26);
    shadow(w,650,435,300);w.pic(q.tool&&q.day===2?'pot3':problem.art,650,285,320,300);
    w.text(650,465,q.tool?['돌본 직후 · 아직 같은 모습','새잎이 자라는 중','새잎을 눌러 변화를 기록해'][q.day]:problem.clue,21).setWordWrapWidth(390);
    // Both drop and inspect share the plant's visible image, with no overlay blocking drops.
    target(w,650,285,370,320,'plant',()=>w.emit('quest-care-record'));
    [['water','moistureSensor','물 재기'],['light','lightSensor','빛 재기']].forEach(([key,art,label],j)=>{
      const x=325,y=220+j*190;w.draggable(w.pic('plantSensor',x,y,105),'quest-drop',{type:'care-measure',key});tag(w,x,y+78,label+(q.measured.includes(key)?' ✓':''),20);
    });
    [['water','watercan','물 주기'],['light','lamp','빛 돌려주기']].forEach(([key,art,label],j)=>{const x=955,y=200+j*190;w.draggable(w.pic(art,x,y,110),'quest-drop',{type:'care-tool',key});tag(w,x,y+78,label,20);});
    if(q.tool)timeDial(w,'timeWheel',1130,355,q.day,2,'quest-care-time');
    const water=q.measured.includes('water')?(problem.cause==='water'?'부족':'알맞음'):'?';
    const light=q.measured.includes('light')?(problem.cause==='light'?'부족':'충분'):'?';
    tag(w,650,550,`${q.tool?'처음 잰 조건':'관찰 센서'} · 물 ${water} / 빛 ${light}`,22);
  }
  if(c===3){
    [['live','새끼로 태어났어'],['same','겨울을 지낸 같은 개체'],['new','씨앗에서 새로 태어났어']].forEach(([id,name],i)=>{
      const x=345+i*355;w.add.ellipse(x,440,325,150,0xe4edcf,.95).setStrokeStyle(3,0x7b9d65);w.text(x,445,name,22).setWordWrapWidth(290);target(w,x,440,325,150,id,()=>w.emit('quest-apply',id));
    });
    GARDEN_CASES.forEach((problem,i)=>{const x=345+i*355,done=e.garden[problem.id]===problem.target;
      shadow(w,x,246);const picture=w.pic(problem.art,x,180,160,145);tag(w,x,298,(done?'✓ ':'')+problem.text,20).setWordWrapWidth(280);
      if(!done)selected(w,w.draggable(picture,'quest-drop',{type:'garden-match',id:problem.id}),problem.id);
    });
  }
  if(c===4){
    FINAL_CASES.forEach((problem,i)=>{const x=345+i*355,done=!!e.final[problem.id];w.add.rectangle(x,205,325,185,0xfff8e5,.97).setStrokeStyle(3,done?0x4d8456:0xc9b476);w.text(x,200,(done?'✓ ':'')+problem.text,23).setWordWrapWidth(285);target(w,x,205,325,185,problem.id,()=>w.emit('quest-apply',problem.id));});
    const bank=questRecords(s),page=Math.max(0,Math.min(context.ui.questPage||0,Math.ceil(bank.length/3)-1));
    bank.slice(page*3,page*3+3).forEach((r,i)=>{const x=345+i*355;w.add.rectangle(x,450,300,215,0xfffdf1,.96).setStrokeStyle(2,0xc7d6b5);recordPreview(w,context,r,x,410);tag(w,x,508,r.title,20).setWordWrapWidth(270);
      const card=w.add.rectangle(x,450,300,215,0xffffff,0);selected(w,w.draggable(card,'quest-drop',{type:'record-match',id:r.id}),r.id);
    });
    if(!bank.length)w.text(740,425,'기록함에 관찰·재실험·돌봄 증거를 먼저 남겨 줘.',25);
  }
}
