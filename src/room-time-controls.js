// Time slider and time-stop buttons under a room that runs on a timeline (seed days, care days, seasons, animal ages).
// Split out of game-app.js (E2); both read the field only.
import {roomPhase} from './field-flow.js';
import {careTimeLabels} from './field-model.js';
import {btn} from './field-dialogs.js';

export function rangeControl(field){const c=field.active,q=field.chapters[c],p=roomPhase(field);let value,max,label,type;
 if(c===1&&p==='grow'){value=q.rounds[q.round].day;max=7;label='씨앗 관찰 날짜';type='seed-day';}
 if(c===2&&p==='care-after'){value=q.cases[q.case].day;max=2;label='돌봄 뒤 시간';type='care-day';}
 if(c===3&&['seasons','plant-identity'].includes(p)){value=q.season;max=4;label='식물 관찰 계절';type='season';}
 if(c===3&&p==='animals')return `<div class="row time-sliders">${([0,3].every(n=>q.animals.butterfly.photos.includes(n))?['dog']:['butterfly','dog']).map(a=>`<label>${a==='butterfly'?'나비':'개'}<input type="range" data-time="animal-time" data-animal="${a}" aria-label="${a==='butterfly'?'나비':'개'}의 시간" min="0" max="${a==='butterfly'?3:2}" value="${q.animals[a].step}"></label>`).join('')}</div>`;
 return type?`<label class="time-slider">${label}<input type="range" data-time="${type}" min="0" max="${max}" value="${value}" aria-label="${label}"></label>`:'';
}
export function timeStops(field){const p=roomPhase(field),q=field.chapters[field.active];
 const stops=p==='grow'?[[0,'0일'],[3,'중간'],[7,'마지막']]:p==='care-after'?careTimeLabels(q.cases[q.case]).map((label,n)=>[n,label]):['seasons','plant-identity'].includes(p)?[[0,'첫봄'],[1,'여름'],[2,'가을'],[3,'겨울'],[4,'다음 봄']]:[];
 const type=p==='grow'?'seed-day':p==='care-after'?'care-day':'season',value=p==='grow'?q.rounds[q.round].day:p==='care-after'?q.cases[q.case].day:q.season;
 return stops.length?`<div class="time-stops" aria-label="시간 바로 이동">${stops.map(([n,label])=>{const recorded=p==='grow'?q.rounds[q.round].photos.some(d=>n===0?d===0:n===3?d>=2&&d<=4:d>=6):p==='care-after'?q.cases[q.case].photos.includes(n):['apple-'+n,'balsam-'+n].every(id=>q.plantPhotos.includes(id));return btn((recorded?'✓ ':'')+label,'time-stop',`data-type="${type}" data-value="${n}" aria-pressed="${n===value}"`);}).join('')}</div>`:'';
}
