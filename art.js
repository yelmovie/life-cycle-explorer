import {ASSETS,illustration,plantArtwork} from './assets.js';
export function specimen(stage){return illustration(['egg','caterpillar','chrysalis','butterfly'][Math.max(0,Math.min(3,stage))]);}
export function plant(level=3,roots=true){return plantArtwork(level,roots);}
export function speciesArt(id){return illustration(id);}
export const mapPoints = [[.20,.56],[.39,.37],[.61,.53],[.77,.30],[.82,.72]];
export function drawMap(canvas){
 const c=canvas.getContext('2d');const W=640,H=360;canvas.width=W;canvas.height=H;c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)};
 const poly=(pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 rect(0,0,W,H,'#acc6ac');for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8)rect(x,y,8,8,['#6c9865','#729e69','#7ba26b','#80a971'][(x*7+y*11)%31%4]);
 poly([[0,35],[110,60],[210,20],[400,60],[550,5],[640,30],[640,0],[0,0]],'#4c7b58');
 poly([[320,0],[349,0],[335,60],[367,105],[348,172],[385,234],[368,303],[410,360],[359,360],[331,295],[348,232],[314,180],[334,110],[303,58]],'#e7d7a3');
 poly([[330,0],[346,0],[329,64],[356,113],[334,170],[370,235],[354,300],[393,360],[377,360],[339,300],[355,235],[319,173],[342,112],[314,58]],'#65a7a4');
 c.strokeStyle='#dccc99';c.lineWidth=15;c.lineJoin='round';c.beginPath();mapPoints.forEach(([x,y],i)=>i?c.lineTo(x*W,y*H):c.moveTo(x*W,y*H));c.stroke();
 function tree(x,y,k=1){rect(x-3,y,7,18,'#5f6741');poly([[x,y-48*k],[x-23*k,y-6],[x+23*k,y-6]],'#365f42');poly([[x,y-50*k],[x-17*k,y-18],[x+17*k,y-18]],'#4b7e4b');poly([[x,y-46*k],[x-10*k,y-28],[x+11*k,y-28]],'#759851');rect(x+2,y+11,13,4,'#527e50');}
 for(let i=0;i<72;i++){let x=(i*137+15)%W,y=(i*73+40)%H;if(mapPoints.some(([px,py])=>Math.hypot(x-px*W,(y-py*H)*1.4)<65)||Math.abs(x-340)<42)continue;tree(x,y,.65+(i%3)*.15);}
 mapPoints.forEach(([px,py],i)=>{const x=px*W,y=py*H;poly([[x-32,y],[x,y-17],[x+32,y],[x,y+17]],'#557444');poly([[x-24,y-6],[x,y-18],[x+24,y-6],[x,y+6]],'#b5c580');if(i===0){tree(x,y-5,.8);rect(x-25,y,9,5,'#f4d283');}else{const height=i===4?54:30;poly([[x-21,y-12],[x,y],[x,y-height],[x-21,y-height-12]],'#e0c692');poly([[x,y],[x+23,y-12],[x+23,y-height-12],[x,y-height]],'#b29165');poly([[x-27,y-height-10],[x-2,y-height-29],[x+28,y-height-10],[x,y-height+6]],i===2?'#7cab96':'#7b7650');rect(x+6,y-23,9,15,'#486850');if(i===4){rect(x-9,y-49,15,15,'#f4dea1');rect(x-2,y-46,2,6,'#805f35');}}});
 for(let i=0;i<110;i++){const x=(i*71)%W,y=(i*97)%H;rect(x,y,2,2,i%3?'#c6d193':'#f5e6ab');}
 const image=new Image();image.onload=()=>{if(canvas.isConnected){c.clearRect(0,0,W,H);c.drawImage(image,0,0,W,H);}};image.src=ASSETS.forestMap;
}
