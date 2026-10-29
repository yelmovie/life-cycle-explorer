import {SORT_CARDS} from './field-content.js';
import {initialField,FIELD_FORMS,fieldRecords} from './field-model.js';

// Sample writing reads like a child's notebook, so teachers see what learners will produce.
const SAMPLE_CAPTIONS={
 'field-observation-egg':'돋보기로 보니 알에 세로 줄무늬가 있었어. 생각보다 훨씬 작았어!',
 'field-seed-water':'물을 준 화분 B에서만 싹이 났어. 씨앗도 물이 필요한가 봐.',
 'field-care-water':'축 처진 잎이 물을 주고 이틀 뒤에 다시 쫙 펴졌어. 신기했어!',
 'field-animal-butterfly':'알 → 애벌레 → 번데기 → 나비! 모습이 완전히 달라져서 깜짝 놀랐어.',
};
// A caterpillar doodle: a bumpy body line, a round head and little legs.
const SAMPLE_DRAWING=[
 Array.from({length:21},(_,i)=>[.15+i*.03,.5-Math.abs(Math.sin(i*Math.PI/4))*.08]),
 Array.from({length:13},(_,i)=>[.82+Math.cos(i*Math.PI/6)*.06,.46+Math.sin(i*Math.PI/6)*.07]),
 ...[.24,.36,.48,.6,.72].map(x=>[[x,.53],[x-.02,.6]]),
];
// Examples exist only in the teacher's in-memory copy. No completed chapters,
// rewards or snapshots are fabricated in the student's persisted notebook.
export function previewFieldForPhase(source,chapter,phase){
 if(source.preview!==true)throw new Error('교사 시연에서만 활동 단계를 열 수 있어.');
 const f=initialField();f.preview=true;f.previewSample=true;f.active=chapter;
 const [a,b,c,d,e]=f.chapters;
 a.inspected=Object.fromEntries(FIELD_FORMS.map(id=>[id,[0,1]]));a.drawing=SAMPLE_DRAWING;a.note='애벌레 몸에는 마디가 여러 개 있고, 짧은 다리가 꼬물꼬물 보여.';a.order=[...FIELD_FORMS];a.generation='next-egg';
 for(const r of b.rounds){r.prepared={a:{soil:true,seeds:3},b:{soil:true,seeds:3}};r.prediction='both';r.b={water:true,warm:true};r.run={variable:r.variable,prepared:structuredClone(r.prepared),prediction:r.prediction,a:{water:r.variable!=='water',warm:r.variable!=='warm'},b:{water:true,warm:true}};r.day=7;r.photos=[0,3,7];r.reason=r.variable;r.report={result:'b',expectation:'changed'};}
 for(const r of c.cases){r.measured=['water','light'];r.symptom=r.variable==='water'?'dry':'pale';r.tool=r.variable;r.day=2;r.photos=[0,2];}
 d.animals={butterfly:{step:3,photos:[0,3]},dog:{step:2,photos:[0,2]}};d.generation='different';d.tags=['apple','balsam'];d.season=4;d.seasonCompared=true;d.plantPhotos=['apple','balsam'].flatMap(id=>[0,3,4].map(n=>id+'-'+n));d.classifications={apple:'same',balsam:'new'};d.transfers=Object.fromEntries(SORT_CARDS.map(c=>[c.id,c.bin]));
 e.records=['field-observation-egg','field-seed-water','field-care-water','field-animal-butterfly'];e.towerRun=true;e.title='꼬물꼬물 작은 생명들의 시간 여행';e.summary='나비는 알, 애벌레, 번데기를 거쳐 모습이 완전히 바뀌고, 씨앗은 물이 있어야 싹이 튼다는 걸 알게 됐어.';e.captions={...SAMPLE_CAPTIONS};e.matches={observation:e.records[0],retry:e.records[1],care:e.records[2]};e.plan={subject:'우리 반 화분의 강낭콩',when:'매주 월요일 아침',what:'잎이 몇 장인지 세고 키를 재서 그림으로 남기기'};
 if(phase==='discovery')f.discoveryVisit=chapter;
 if(chapter===0){
  if(phase==='search')f.chapters[0]=initialField().chapters[0];
  else if(phase==='draw'){a.drawing=[];a.note='';}
  else if(phase==='film')a.order=['pupa','egg','adult','larva'];
  else if(phase==='generation')a.generation='';
 }else if(chapter===1&&phase!=='discovery'){
  const r=b.rounds[0];b.rounds[1]=initialField().chapters[1].rounds[1];
  if(phase==='prepare')b.rounds[0]=initialField().chapters[1].rounds[0];
  else if(phase==='design'){r.run=null;r.photos=[];r.reason='';r.prediction='';}
  else if(phase==='grow'){r.day=0;r.photos=[];r.reason='';}
  else if(phase==='reason')r.reason='';
 }else if(chapter===2&&phase!=='discovery'){
  const r=c.cases[0];c.cases[1]=initialField().chapters[2].cases[1];
  if(phase==='measure')c.cases[0]=initialField().chapters[2].cases[0];
  else if(phase==='symptom'){r.symptom='';r.photos=[];r.tool='';r.day=0;}
  else if(phase==='care-before'){r.photos=[];r.tool='';r.day=0;}
  else if(phase==='care'){r.photos=[0];r.tool='';r.day=0;}
  else if(phase==='care-after'){r.photos=[0];r.day=1;}
 }else if(chapter===3){
  if(phase==='animals'){f.chapters[3]=initialField().chapters[3];f.chapters[3].animals.butterfly.photos=[0,3];f.chapters[3].animals.dog.photos=[0];}
  else if(phase==='animal-birth')d.generation='';
  else if(phase==='tags'){d.tags=[];d.plantPhotos=[];d.season=0;}
  else if(phase==='seasons'){d.plantPhotos=['apple-0','balsam-0'];d.season=0;d.seasonCompared=false;d.classifications={};d.transfers={};}
  else if(phase==='plant-identity'){d.classifications={};d.transfers={};}
  else if(phase==='transfer')d.transfers={};
 }else if(chapter===4){
  const empty={subject:'',when:'',what:''};
  if(phase==='tower-slots')Object.assign(e,{records:[],matches:{},title:'',summary:'',towerRun:false,plan:empty});
  else if(phase==='tower-evidence')Object.assign(e,{matches:{},title:'',summary:'',towerRun:false,plan:empty});
  else if(phase==='tower-note')Object.assign(e,{title:'',summary:'',towerRun:false,plan:empty});
  else if(phase==='tower-run')Object.assign(e,{towerRun:false,plan:empty});
  else if(phase==='plan')e.plan={subject:'',when:'',what:''};
 }
 // Fail immediately if a later code change disconnects sample evidence.
 if(chapter===4&&phase!=='tower-slots'&&!e.records.every(id=>fieldRecords(f).some(r=>r.id===id)))throw new Error('시연용 증거를 준비하지 못했어.');
 return f;
}
