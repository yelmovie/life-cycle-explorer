// Map door signs and Doto's hint button: keep the signs apart, inside the band between the floating
// header and footer, and above a doorway a villain still occupies. Split out of game-app.js (E2); unchanged.
export function layoutMapDoors({app,stage,doors,guide,items,companion,coordinates}){
 const width=stage.clientWidth,area=stage.getBoundingClientRect(),gap=12;
 // Keep doors between the floating header and footer.
 const top=Math.max(0,app.querySelector('.game-header').getBoundingClientRect().bottom-area.top),height=Math.min(stage.clientHeight,app.querySelector('.game-footer').getBoundingClientRect().top-area.top)-top;
 const boxes=items.map(item=>{const button=doors.querySelector(`[data-chapter="${item.chapter}"]`),p=coordinates({...item,w:0,h:0});if(!button||!p)return null;const rect=button.getBoundingClientRect();const patrol=stage.querySelector(`[data-encounter="${['butterfly','seed','care','season','clock'][item.chapter]}"]:not([hidden])`);
  // Keep each sign above its occupied doorway while the patrol is still active.
  const lift=patrol&&patrol.dataset.hit!=='3'?72:0;
  return {button,x:p.left,y:p.top-lift,w:rect.width,h:rect.height};}).filter(Boolean).sort((a,b)=>a.y-b.y);
 const clamp=box=>{box.x=Math.max(gap+box.w/2,Math.min(width-gap-box.w/2,box.x));box.y=Math.max(top+gap+box.h/2,Math.min(top+height-gap-box.h/2,box.y));};
 for(const box of boxes)clamp(box);
 for(let pass=0;pass<5;pass++)for(let i=1;i<boxes.length;i++)for(let j=0;j<i;j++){
  const a=boxes[j],b=boxes[i];if(Math.abs(a.x-b.x)>=(a.w+b.w)/2+gap||Math.abs(a.y-b.y)>=(a.h+b.h)/2+gap)continue;
  const below=a.y+(a.h+b.h)/2+gap;b.y=below+b.h/2+gap<=top+height?below:a.y-(a.h+b.h)/2-gap;clamp(b);
 }
 for(const box of boxes)Object.assign(box.button.style,{left:box.x+'px',top:box.y+'px'});
 const p=companion&&coordinates(companion);
 if(!p||!guide.closest('.map-companion-layer'))return;
 // Keep the button above Doto and clear of place labels even when the camera is near an edge.
 const radius=22,limit=(value,low,high)=>Math.min(Math.max(low,high),Math.max(low,value));
 const spots=[[p.left,p.top-p.h/2-22],[p.left+p.w/2+24,p.top],[p.left-p.w/2-24,p.top],[p.left,p.top+p.h/2+22]]
   .map(([x,y])=>[limit(x,gap+radius,width-gap-radius),limit(y,top+radius,top+height-radius)]);
 const patrolBoxes=[...stage.querySelectorAll('.map-encounter-foe:not([hidden]):not([data-hit="3"]) .map-encounter-body')].map(el=>{const r=el.getBoundingClientRect();return {x:r.left-area.left+r.width/2,y:r.top-area.top+r.height/2,w:r.width,h:r.height};});
 const avoids=(x,y,b)=>Math.abs(x-b.x)>=radius+b.w/2+8||Math.abs(y-b.y)>=radius+b.h/2+8;
 const [x,y]=spots.find(([x,y])=>boxes.every(b=>avoids(x,y,b))&&patrolBoxes.every(b=>avoids(x,y,b)))||spots.find(([x,y])=>boxes.every(b=>avoids(x,y,b)))||spots[0];
 guide.style.left=Math.round(x)+'px';guide.style.top=Math.round(y)+'px';guide.hidden=false;
}
