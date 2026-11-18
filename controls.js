// The game owns gestures over its full surface, including visual overlays.
export function installControls(root,{enabled,onAction}){
 const useTouch="ontouchstart" in window&&typeof TouchEvent!=="undefined";
 const blocked=el=>el instanceof Element&&!!el.closest("button,a,input,select,textarea,dialog,[role=button]");
 const eligible=e=>enabled()&&root.contains(e.target)&&!blocked(e.target);
 let gesture=null;
 const stop=e=>{if(e.cancelable)e.preventDefault();};
 function begin(id,x,y){gesture={id,x,y,fired:false};}
 function move(id,x,y){
  if(!gesture||gesture.id!==id||gesture.fired)return;
  const dx=x-gesture.x,dy=y-gesture.y,ax=Math.abs(dx),ay=Math.abs(dy);
  if(Math.max(ax,ay)<18||Math.max(ax,ay)<Math.min(ax,ay)*1.18)return;
  gesture.fired=true;onAction(ax>ay?(dx<0?"left":"right"):(dy<0?"jump":"duck"));
 }
 function touchStart(e){
  if(!eligible(e))return;stop(e);
  if(e.touches.length!==1){gesture=null;return;}
  const t=e.changedTouches[0];begin(t.identifier,t.clientX,t.clientY);
 }
 function touchMove(e){
  if(!gesture){if(eligible(e))stop(e);return;}stop(e);
  if(!enabled()||e.touches.length!==1){gesture=null;return;}
  const t=Array.from(e.touches).find(t=>t.identifier===gesture.id);if(t)move(t.identifier,t.clientX,t.clientY);
 }
 function touchEnd(e){if(!gesture)return;stop(e);const t=Array.from(e.changedTouches).find(t=>t.identifier===gesture.id);if(t){if(enabled())move(t.identifier,t.clientX,t.clientY);gesture=null;}}
 // Explicit passive:false is essential on iOS and Chromium's document listeners.
 if(useTouch){
  document.addEventListener("touchstart",touchStart,{capture:true,passive:false});
  document.addEventListener("touchmove",touchMove,{capture:true,passive:false});
  document.addEventListener("touchend",touchEnd,{capture:true,passive:false});
  document.addEventListener("touchcancel",()=>gesture=null,{capture:true,passive:false});
 }
 root.addEventListener("pointerdown",e=>{
  if(useTouch&&e.pointerType==="touch"||!eligible(e)||e.button>0)return;
  stop(e);begin(e.pointerId,e.clientX,e.clientY);try{root.setPointerCapture(e.pointerId);}catch{}
 });
 root.addEventListener("pointermove",e=>{if(useTouch&&e.pointerType==="touch"||!gesture)return;stop(e);if(enabled())move(e.pointerId,e.clientX,e.clientY);else gesture=null;});
 root.addEventListener("pointerup",e=>{if(useTouch&&e.pointerType==="touch"||!gesture)return;stop(e);if(enabled())move(e.pointerId,e.clientX,e.clientY);gesture=null;});
 root.addEventListener("pointercancel",()=>gesture=null);
 root.addEventListener("lostpointercapture",()=>gesture=null);
 root.addEventListener("contextmenu",e=>{if(enabled())stop(e);});
 root.addEventListener("dragstart",e=>{if(enabled())stop(e);});
 root.addEventListener("wheel",e=>{if(eligible(e))stop(e);},{passive:false});
 window.addEventListener("blur",()=>gesture=null);
 return{reset(){gesture=null;}};
}

