// Local deterministic motion graphics: project artwork + SVG → sharp → FFmpeg.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ART} from '../game-assets.js';
import {lightRecoveryLeaves} from '../field-record-art.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url),sharp=require(process.env.SHARP_MODULE||'C:/Users/bongb/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const ffmpeg=process.env.FFMPEG||'D:/tools/ffmpeg/ffmpeg.exe',out=path.join(root,'assets/concepts'),FPS=24,DURATION=12;
await mkdir(out,{recursive:true});
const keys=['egg','larva','pupa','adult','leaf','pot0','pot1','pot2','pot3','dry','pale','watercan','lamp','appleSpring','appleSummer','winter','balsam','balsamDry','balsamSprout','balsamSeeds','puppy','dogYoung','dog','magnifier','camera','book'];
// librsvg's embedded-image loader accepts PNG reliably across Windows builds.
const images={};for(const key of keys)images[key]='data:image/png;base64,'+(await sharp(await readFile(path.join(root,ART[key]))).resize({width:300,height:300,fit:'inside'}).png().toBuffer()).toString('base64');
const clamp=n=>Math.max(0,Math.min(1,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const pic=(key,x,y,w,h=w,alpha=1)=>`<image xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="${images[key]}" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" opacity="${alpha}"/>`;
const circle=(x,y,r,fill,opacity=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" opacity="${opacity}"/>`;
const arrow=(x1,y1,x2,y2,p=1)=>`<path d="M${x1} ${y1} L${x1+(x2-x1)*p} ${y1+(y2-y1)*p}" fill="none" stroke="#c79d45" stroke-width="5" stroke-linecap="round" marker-end="url(#arrow)"/>`;
const card=(x,y,w,h,body)=>`<rect x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="24" fill="#fffbed" stroke="#d4c292" stroke-width="3"/>${body}`;
const base=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><radialGradient id="bg"><stop stop-color="#fbf5de"/><stop offset="1" stop-color="#cfdfbb"/></radialGradient><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0 0L6 3L0 6" fill="none" stroke="#c79d45" stroke-width="1.6"/></marker></defs><rect width="960" height="540" fill="url(#bg)"/><ellipse cx="480" cy="400" rx="410" ry="58" fill="#527355" opacity=".08"/>${body}</svg>`;
const drop=(x,y)=>`<path d="M${x} ${y-15}Q${x-23} ${y+13} ${x} ${y+23}Q${x+23} ${y+13} ${x} ${y-15}" fill="#66a9c1"/>`;
function butterfly(t){let b='';const positions=[160,365,575,790],ids=['egg','larva','pupa','adult'];
 for(let i=0;i<4;i++){const a=ease((t-i*1.25)/.8);b+=circle(positions[i],230,80,'#fffbed',.6)+pic(ids[i],positions[i],230-(1-a)*45,150*a,150*a,a);if(i<3)b+=arrow(positions[i]+83,235,positions[i+1]-88,235,ease((t-1.5-i*1.25)/.9));}
 const p=ease((t-8)/2);b+=`<path d="M790 330Q790 405 570 405" fill="none" stroke="#c79d45" stroke-width="4" opacity="${p}" marker-end="url(#arrow)"/>`+circle(490,385,58,'#fffbed',p)+pic('egg',490,385,100,100,p);return b;}
function seed(t){let b='';const phase=t<4?0:t<8?1:2,p=ease((t-4)/3),g=Math.min(3,Math.floor(p*4));
 for(let i=0;i<3;i++){const x=205+i*275;b+=card(x,265,230,310,pic(i===2?'pot'+g:'pot0',x,285,185));b+=circle(x-55,140,25,i===0?'#e5d8bf':'#b7d7e4')+(i?drop(x-55,136):`<path d="M${x-72} 123l34 34m0-34l-34 34" stroke="#9b5946" stroke-width="5"/>`);b+=circle(x+55,140,25,i===1?'#d8e4e9':'#edcc72');if(i===1)b+=`<path d="M${x+40} 125l30 30m0-30l-30 30" stroke="#537d91" stroke-width="5"/>`;}
 if(phase===2)b+=arrow(780,405,780,345,ease((t-8)/1));return b;}
function care(t){const p=ease((t-4)/3);let b='';for(let i=0;i<2;i++){
 const x=275+i*410;
 // Existing elongated stems do not shrink when more light reaches the plant.
 // Only the new leaf model fades in; the original pale plant stays in place.
 const leaves=lightRecoveryLeaves(x-120,150,240,p);
 const plant=i?pic('pale',x,270,240,240)+leaves:pic('dry',x,270,240,240,1-p)+pic('pot3',x,270,240,240,p);
 b+=card(x,270,340,350,plant)+pic(i?'lamp':'watercan',x-80+80*ease((t-1.5)/2),120,95);
 if(t>4)b+=arrow(x,395,x,340,ease((t-4)/1));
 }return b;}
function seasons(t){if(t<4){const p=ease(t/3),animal=Math.min(2,Math.floor(p*3));return pic(['egg','larva','pupa','adult'][Math.min(3,Math.floor(p*4))],280,245,220)+pic(['puppy','dogYoung','dog'][animal],685,255,240)+arrow(220,400,730,400,p);}
 const s=Math.min(4,Math.floor((t-4)/1.35)),tree=['appleSpring','appleSummer','appleSummer','winter','appleSpring'][s],plant=['balsamSprout','balsam','balsamSeeds','balsamDry','balsamSprout'][s];let b=card(280,255,330,350,pic(tree,280,250,255))+card(685,255,330,350,pic(plant,685,270,245));
 b+=`<path d="M255 345v-65" stroke="#f5b95c" stroke-width="8"/><rect x="240" y="305" width="30" height="23" rx="4" fill="#f5b95c"/>`;
 // balsamSeeds is a whole seed-bearing plant, not an isolated seed sprite.
 // Use a small seed diagram here so no extra mature plant appears below the new one.
 if(s>=2)b+=[[-15,0],[-5,5],[7,1],[17,6]].map(([dx,dy])=>circle(685+dx,390+dy,4,'#775339')).join('');if(s===4)b+=arrow(685,405,685,320)+circle(755,180,24,'#dfbb64');return b;}
function evidence(t){let b='';const ids=['magnifier','pot3','camera'],p=ease((t-4)/2);for(let i=0;i<3;i++){const x=240+i*240,y=230+Math.sin(t*1.5+i)*5;b+=card(x,y,190,210,pic(ids[i],x,y,145));if(i<2)b+=arrow(x+100,230,x+135,230,ease((t-3-i)/1));}b+=pic('book',480,390,160,120,p);if(t>8)b+=`<path d="M430 403l30 24 65-62" fill="none" stroke="#35634b" stroke-width="8" stroke-linecap="round" opacity="${ease(t-8)}"/>`;return b;}
const clips={butterfly,seed,care,seasons,evidence},selected=process.argv[2];
for(const[id,draw]of Object.entries(clips)){if(selected&&selected!==id)continue;
 // Keep the last playable files intact if rendering is interrupted.
 const pending=ext=>path.join(out,id+'.rendering.'+ext);
 const args=['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s','960x540','-r',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','24','-pix_fmt','yuv420p','-movflags','+faststart',pending('mp4')];
 const child=spawn(ffmpeg,args,{stdio:['pipe','ignore','pipe'],windowsHide:true});let err='';child.stderr.on('data',b=>err+=b);const completion=once(child,'close');child.stdin.on('error',()=>{});
 for(let f=0;f<FPS*DURATION;f++){const frame=await sharp(Buffer.from(base(draw(Math.min(f/FPS,10.8))))).ensureAlpha().raw().toBuffer();if(!child.stdin.write(frame))await once(child.stdin,'drain');}
 child.stdin.end();const[code]=await completion;if(code)throw new Error(err);
 await sharp(Buffer.from(base(draw(10.8)))).webp({quality:88}).toFile(pending('webp'));
 const webm=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',pending('mp4'),'-an','-c:v','libvpx-vp9','-b:v','0','-crf','36','-deadline','good','-cpu-used','4',pending('webm')],{stdio:'ignore',windowsHide:true});if((await once(webm,'close'))[0])throw new Error('WebM encoding failed');
 for(const ext of ['mp4','webm','webp'])await rename(pending(ext),path.join(out,id+'.'+ext));
 console.log(`Rendered ${id}: ${DURATION}s, 960×540, ${FPS}fps (MP4 / WebM / poster)`);
}
await writeFile(path.join(out,'README.txt'),'Original motion design, project artwork. Render: node scripts/render-concepts.mjs. Silent 12-second clips; captions are in field-concepts.js.\n');
