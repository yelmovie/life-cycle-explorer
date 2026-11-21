// Browser back stays inside the game (B13, 2026-11-21). While the learner is past the title screen or has a window
// open, one extra history entry sits on top. Back then closes the window, or goes room → map → title; on the title
// with nothing open the guard is taken away, so the next back leaves the page as usual. Saving is untouched.
const GUARD='lifeClockBack';
export function installBackGuard({needed,back}){
 let skip=false;
 const onGuard=()=>history.state?.[GUARD]===true;
 function sync(){
  if(needed()){if(!onGuard())history.pushState({...(history.state||{}),[GUARD]:true},'');}
  else if(onGuard()&&!skip){skip=true;history.back();}
 }
 addEventListener('popstate',()=>{
  if(skip){skip=false;return;}
  // Forward onto the guard entry: nothing to undo; sync() removes it again if it is not needed.
  if(onGuard()){setTimeout(sync,0);return;}
  back();setTimeout(sync,0);
 });
 return sync;
}
