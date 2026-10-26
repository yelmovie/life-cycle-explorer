// 3D specimens open only inside the observation notebook. The 2D picture stays
// until the first 3D frame is drawn, and stays for good when WebGL, the file or
// reduced motion rules 3D out. Sources and optimisation: assets/models/README.md
export const SPECIMEN_MODELS={
 egg:'assets/models/butterfly-egg.glb',
 larva:'assets/models/butterfly-larva.glb',
 pupa:'assets/models/butterfly-pupa.glb',
 adult:'assets/models/butterfly-adult.glb'
};
// Starting pose per model (radians): the side a child should see first.
const POSES={egg:{x:.15,y:.5},larva:{x:.3,y:1.25},pupa:{x:.1,y:.6},adult:{x:.35,y:.3}};
const ENGINE='./vendor/three-gltf-0.170.0.min.js';
let engine=null;const scenes=new Map();

function webglAvailable(){
 try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}
}
async function loadScene(T,key){
 if(!scenes.has(key))scenes.set(key,new T.GLTFLoader().loadAsync(SPECIMEN_MODELS[key]).then(gltf=>{
  // Centre on the bounding box and fit into a unit sphere so every model
  // shares one camera. Geometry itself is never altered here.
  const root=new T.Group(),model=gltf.scene,box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());
  model.position.sub(centre);root.add(model);root.scale.setScalar(1.8/Math.max(size.x,size.y,size.z));return root;
 }).catch(error=>{scenes.delete(key);throw error;}));
 return scenes.get(key);
}

/** Replaces the picture inside `host` with a model the child can turn by dragging. */
export function mountSpecimen3d(host,key,{signal,reduced=false,label=''}={}){
 if(!host||!SPECIMEN_MODELS[key]||reduced||!webglAvailable())return;
 host.classList.add('specimen-3d-loading');
 (async()=>{
  const T=await(engine||=import(ENGINE));if(signal?.aborted)return;
  const root=await loadScene(T,key);if(signal?.aborted)return;
  const canvas=document.createElement('canvas');
  canvas.className='specimen-3d-canvas';canvas.tabIndex=0;canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label',`${label} 입체 모형. 끌거나 화살표 키로 돌려 볼 수 있어.`);
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,2));
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(30,1,.05,50);camera.position.set(0,0,4.2);
  scene.add(new T.HemisphereLight(0xfffbf0,0x8a9a78,2.1));
  const sun=new T.DirectionalLight(0xffffff,1.6);sun.position.set(2,3,4);scene.add(sun);
  const pose=POSES[key]||{x:0,y:0},turn={x:pose.x,y:pose.y};let spin=true,frame=0;
  scene.add(root);
  const draw=()=>{root.rotation.set(turn.x,turn.y,0);renderer.render(scene,camera);};
  const fit=()=>{const w=host.clientWidth||300,h=host.clientHeight||240;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();draw();};
  const tick=()=>{frame=0;if(signal?.aborted||!spin)return;turn.y+=.006;draw();frame=requestAnimationFrame(tick);};
  const stopSpin=()=>{spin=false;cancelAnimationFrame(frame);};
  let drag=null;
  canvas.addEventListener('pointerdown',e=>{stopSpin();drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);},{signal});
  canvas.addEventListener('pointermove',e=>{
   if(!drag||drag.id!==e.pointerId)return;
   turn.y+=(e.clientX-drag.x)*.012;turn.x=Math.max(-1.2,Math.min(1.2,turn.x+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;draw();
  },{signal});
  const release=e=>{if(drag?.id===e.pointerId)drag=null;};
  canvas.addEventListener('pointerup',release,{signal});canvas.addEventListener('pointercancel',release,{signal});
  canvas.addEventListener('keydown',e=>{
   const step={ArrowLeft:[0,-.25],ArrowRight:[0,.25],ArrowUp:[-.2,0],ArrowDown:[.2,0]}[e.key];if(!step)return;
   e.preventDefault();stopSpin();turn.x=Math.max(-1.2,Math.min(1.2,turn.x+step[0]));turn.y+=step[1];draw();
  },{signal});
  const resize=new ResizeObserver(fit);
  host.append(canvas);fit();resize.observe(host);host.classList.remove('specimen-3d-loading');host.classList.add('specimen-3d-ready');frame=requestAnimationFrame(tick);
  signal?.addEventListener('abort',()=>{stopSpin();resize.disconnect();scene.remove(root);renderer.dispose();renderer.forceContextLoss();canvas.remove();},{once:true});
 })().catch(()=>host.classList.remove('specimen-3d-loading'));
}
