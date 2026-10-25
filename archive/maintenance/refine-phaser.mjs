import {readFileSync,writeFileSync} from 'node:fs';
const update=(file,pairs)=>{let t=readFileSync(file,'utf8');for(const[a,b]of pairs){if(!t.includes(a))throw Error('Missing patch target in '+file+': '+a.slice(0,60));t=t.replace(a,b);}writeFileSync(file,t);};
update('game-app.js',[
 ["const tasks=", "const phaseTasks=['관찰한 특징을 그림과 문장으로 남겨 줘.','두 모습의 달라진 점과 다음 세대를 연결해.','알아볼 조건 하나만 바꾸고 결과를 예상해.','결과를 설명하고 한 조건을 바꿔 다시 실험해.','물과 빛 중 한 조건을 바꾸고 변화를 예상해.','필요한 돌봄을 하고 시간이 흐른 뒤의 변화를 기록해.','개체 표식을 따라 겨울과 다음 봄의 식물을 비교해.','새 장미 자료에도 같은 판단 기준을 적용해.','기록에 설명을 붙이고 친구에게 보여 줄 이야기를 완성해.','교실이나 주변에서 직접 이어갈 관찰을 약속해.'];\nconst tasks="],
 ["':tasks[n];", "':(p?phaseTasks[n]:tasks[n]);"],
 ["<button id=\"next\" class=\"primary\">다음</button>","<button id=\"phase-back\" class=\"icon-button\" aria-label=\"앞 탐구 도구로 돌아가기\" hidden>↶</button><button id=\"next\" class=\"primary\">다음</button>"],
 ["$('#next').disabled=false;let h='';", "$('#next').disabled=false;$('#phase-back').hidden=map||!p;let h='';"],
 ["$('#controls').innerHTML=h;", "$('#controls').innerHTML=h;$('#status').textContent=($('#scene-note').textContent||$('#status').textContent);"],
 ["$('#next').onclick=next;", "$('#next').onclick=next;$('#phase-back').onclick=()=>{s.phase[s.mission]=0;ui.play=false;refresh();};"],
 ["function bookEdit(){", "function loadRecordPreview(r){const image=$('#modal .record-preview img');if(!image)return;image.dataset.record=r.id;recordImage(r,s).then(data=>{if(image.isConnected&&image.dataset.record===r.id)image.src=data;}).catch(()=>toast('기록 그림을 다시 불러와 줘.'));}\nfunction bookEdit(){"],
 ["false,'gold'):''));}\nfunction loadRecordPreview", "false,'gold'):''));loadRecordPreview(r);}\nfunction loadRecordPreview"],
 ["<p class=\"small\">초등 3학년 생물의 한살이", "<p class=\"small\"><a href=\"vendor/PHASER-LICENSE.md\" target=\"_blank\" rel=\"noopener\">Phaser 3.90.0 · MIT 라이선스</a></p><p class=\"small\">초등 3학년 생물의 한살이"],
 ["s.screen='map';refresh();modal(n===9?", "s.screen=n===9?'mission':'map';refresh();modal(n===9?"]
]);
update('game-scenes.js',[
 ["this.pic('winter',440,140,118);this.pic('appleSpring',580,140,118);this.text(800,140,'장미 관찰 카드\\n같은 줄기에서 다음 봄에 새잎',20);", "this.text(640,138,'장미 관찰 카드\\n지난해와 같은 줄기의 표식 R-01\\n겨울을 지나 다음 봄에 새잎이 났어',22);"],
 ["this.pic(id==='butterfly'?'adult':id,x+(j-1)*70,415,100);", "if(id==='rose')this.text(x+(j-1)*70,415,'✿',54,'#bd6582');else this.pic(id==='butterfly'?'adult':id,x+(j-1)*70,415,100);"]
]);
writeFileSync('game.css',readFileSync('game.css','utf8')+'\n#scene-note{display:none}.footer #status{flex:1;max-width:none}.footer #phase-back{min-width:48px}.footer button[hidden]{display:none}\n');
