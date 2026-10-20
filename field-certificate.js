import {ART} from './game-assets.js';
import {fieldRecords} from './field-model.js';
import {downloadBlob} from './game-records.js';
export async function saveCertificate(field){
 if(field.completed.length!==5)throw new Error('다섯 구역의 탐구를 먼저 마쳐 줘.');
 await document.fonts.ready;
 const q=field.chapters[4],canvas=document.createElement('canvas');canvas.width=1400;const c=canvas.getContext('2d');
 const wrap=(message,size,width=1120)=>{c.font=`${size}px Jua,Malgun Gothic,sans-serif`;const lines=[];let line='';for(const char of message){if(char==='\n'||c.measureText(line+char).width>width){lines.push(line);line=char==='\n'?'':char;}else line+=char;}if(line)lines.push(line);return lines;};
 const paragraphs=[['생명 탐험가의 수행 기록',66], [q.title,44],['나는 관찰한 특징을 기록하고, 조건을 비교하여\n생물에게 필요한 도움을 찾을 수 있어.',38],['관찰한 네 모습 · 물과 온도 비교 실험 두 번\n물과 빛을 잰 식물 돌봄 두 번 · 겨울과 다음 봄 추적',32],[`내가 남긴 증거 ${fieldRecords(field).length}개 · 이야기 사진 ${q.records.length}장`,34],['내가 발견한 것\n'+q.summary,32],['실제로 이어 갈 관찰\n'+q.plan.subject+' · '+q.plan.when+'\n'+q.plan.what,32]];
 const groups=paragraphs.map(([text,size])=>({lines:wrap(text,size),size}));canvas.height=460+groups.reduce((sum,g)=>sum+g.lines.length*(g.size*1.45)+40,0);
 c.fillStyle='#fff9e5';c.fillRect(0,0,canvas.width,canvas.height);c.strokeStyle='#b39855';c.lineWidth=8;c.strokeRect(40,40,1320,canvas.height-80);c.strokeStyle='#3b6749';c.lineWidth=3;c.strokeRect(58,58,1284,canvas.height-116);
 const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('기록증 그림을 불러오지 못했어.'));im.src=ART.core;});c.drawImage(image,570,85,260,260);
 let y=385;c.textAlign='center';c.textBaseline='top';for(const g of groups){c.font=`${g.size}px Jua,Malgun Gothic,sans-serif`;c.fillStyle='#244d39';for(const line of g.lines){c.fillText(line,700,y);y+=g.size*1.45;}y+=40;}
 c.font='24px Jua,Malgun Gothic,sans-serif';c.fillStyle='#64725b';c.fillText('생명 시계 연구실 · 모형 활동의 수행 기록 / 실제 관찰은 나의 약속으로 이어 가요.',700,canvas.height-90);
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(new Error('기록증 저장을 다시 시도해 줘.')),'image/png'));downloadBlob(blob,'생명-탐험가-수행기록증.png');
}
