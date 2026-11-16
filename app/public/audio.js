export function createAudio(){
 const urls={music:"/assets/hornox-alpine-party-210s.mp3",jump:"/assets/jump-funny.mp3",duck:"/assets/slide.mp3",pickup:"/assets/cowbell-coin.mp3",land:"/assets/land.mp3",bump:"/assets/bonk-funny.mp3"};
 let context,master,musicNode,musicGain,enabled=true,active=false,foreground=!document.hidden,readyPromise=null,resuming=null,musicOffset=0,musicStarted=0;
 const buffers={},stats={played:0,last:"",musicStarts:0};
 const files=Promise.all(Object.entries(urls).map(async([k,url])=>{const r=await fetch(url);if(!r.ok)throw Error(url);return[k,await r.arrayBuffer()];})).catch(e=>{console.warn("Audio preload",e.message);return[];});
 const wanted=()=>enabled&&active&&foreground&&!document.hidden;
 function stopMusic(){
  if(!musicNode)return;
  if(buffers.music)musicOffset=(musicOffset+Math.max(0,context.currentTime-musicStarted))%buffers.music.duration;
  const old=musicNode,gain=musicGain;musicNode=null;musicGain=null;
  try{old.stop();}catch{}old.disconnect();gain?.disconnect();
 }
 function sync(){
  if(!wanted()||context?.state!=="running"){stopMusic();return;}
  if(!buffers.music||musicNode)return;
  const node=context.createBufferSource(),gain=context.createGain();
  node.buffer=buffers.music;node.loop=true;gain.gain.value=.60;node.connect(gain).connect(master);
  musicNode=node;musicGain=gain;musicStarted=context.currentTime;node.start(0,musicOffset%node.buffer.duration);stats.musicStarts++;
  node.onended=()=>{node.disconnect();gain.disconnect();if(musicNode===node){musicNode=null;musicGain=null;}};
 }
 function ensureContext(){
  if(context&&context.state!=="closed")return true;
  stopMusic();const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  const ctx=new C();context=ctx;resuming=null;master=ctx.createGain();master.gain.value=enabled?.65:0;
  const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-6;limiter.knee.value=2;limiter.ratio.value=20;limiter.attack.value=.003;limiter.release.value=.12;master.connect(limiter).connect(ctx.destination);
  ctx.onstatechange=()=>{
   if(context!==ctx)return;
   sync();
   // Safari reports an app/phone interruption as "interrupted", not "suspended".
   if(wanted()&&ctx.state!=="running"&&!resuming)wake();
  };
  readyPromise=files.then(async values=>{for(const[k,b]of values){if(!buffers[k])buffers[k]=await ctx.decodeAudioData(b.slice(0));}if(context===ctx)sync();}).catch(e=>console.warn("Audio",e.message));
  return true;
 }
 function wake(gesture=false){
  if(!foreground||document.hidden||!enabled||(!active&&!gesture))return Promise.resolve();
  if(!context||context.state==="closed"){if(!ensureContext())return Promise.resolve();}
  const ctx=context;
  if(ctx.state==="running"){sync();return Promise.resolve();}
  // A previous resume may remain pending behind autoplay policy. A fresh gesture
  // must still call resume synchronously, rather than await that old promise.
  if(resuming&&!gesture)return resuming.promise;
  const ticket={promise:null};resuming=ticket;
  try{ticket.promise=Promise.resolve(ctx.resume()).then(()=>{if(context===ctx)sync();}).catch(()=>{}).finally(()=>{if(resuming===ticket)resuming=null;});}
  catch{if(resuming===ticket)resuming=null;ticket.promise=Promise.resolve();}
  return ticket.promise;
 }
 async function unlock(){
  foreground=!document.hidden;if(!foreground||!enabled||!ensureContext())return;
  const resumed=wake(true);await readyPromise;await resumed;sync();
 }
 function background(){
  foreground=false;stopMusic();
  const ctx=context;
  // Release the audio device while away; reacquire it on return/Continue.
  if(ctx&&ctx.state!=="closed")Promise.resolve(ctx.suspend()).catch(()=>{}).finally(()=>{if(context===ctx&&wanted())wake();});
 }
 function foregrounded(){foreground=!document.hidden;if(wanted())wake();else sync();}
 document.addEventListener("visibilitychange",()=>{if(document.hidden)background();else foregrounded();});
 window.addEventListener("blur",background);window.addEventListener("pagehide",background);
 window.addEventListener("focus",foregrounded);window.addEventListener("pageshow",foregrounded);
 // Retry in the actual user gesture if the browser blocked automatic recovery.
 const gesture=()=>{if(enabled&&active&&!document.hidden&&(!foreground||context?.state!=="running"))unlock().catch(()=>{});};
 for(const type of["pointerdown","touchend","keydown"])document.addEventListener(type,gesture,{capture:true,passive:true});
 return{
  unlock,setEnabled(value){enabled=!!value;if(master&&context.state!=="closed")master.gain.setTargetAtTime(enabled?.65:0,context.currentTime,.03);sync();if(wanted())wake();},
  setActive(value){active=!!value;sync();if(wanted()&&context)wake();},
  play(name,rate=1,volume=1){if(!wanted()||context?.state!=="running"||!buffers[name])return;const source=context.createBufferSource();source.buffer=buffers[name];source.playbackRate.value=rate;const gain=context.createGain();gain.gain.value=(name==="pickup"?.48:.8)*volume;source.connect(gain).connect(master);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();stats.played++;stats.last=name;},
  metrics(){return{...stats,audioVersion:18,musicDuration:buffers.music?.duration||0,musicTrack:"alpine-party-210s",enabled,active,ready:!!buffers.music,context:context?.state||"locked",foreground,musicPlaying:!!musicNode&&context?.state==="running"&&wanted(),musicOffset:buffers.music?(musicOffset+(musicNode?Math.max(0,context.currentTime-musicStarted):0))%buffers.music.duration:0};}
 };
}
