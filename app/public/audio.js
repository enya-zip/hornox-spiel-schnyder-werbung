export function createAudio(){
 const urls={music:"assets/hornox-alpine-party-210s.mp3",jump:"assets/jump-funny.mp3",duck:"assets/slide.mp3",pickup:"assets/cowbell-coin.mp3",land:"assets/land.mp3",bump:"assets/bonk-funny.mp3"};
 let context,master,musicNode,musicGain,enabled=true,active=false,foreground=!document.hidden,readyPromise=null,resuming=null,musicOffset=0,musicStarted=0;
 const buffers={},stats={played:0,last:"",musicStarts:0};let noiseBuffer=null;
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
  // Level 4: Waldgeräusche direkt im Browser erzeugt (keine Audiodateien nötig).
  synth(kind,volume=1){
   if(!wanted()||context?.state!=="running")return;const ctx=context,t=ctx.currentTime,out=ctx.createGain();out.gain.value=volume;out.connect(master);
   if(!noiseBuffer||noiseBuffer.sampleRate!==ctx.sampleRate){noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
   const ramp=(g,start,peak,attack,decay)=>{g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(peak,start+attack);g.gain.exponentialRampToValueAtTime(.0001,start+attack+decay);};
   const noise=(start,dur,type,freq,q=1)=>{const n=ctx.createBufferSource();n.buffer=noiseBuffer;const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();n.connect(f).connect(g).connect(out);n.start(start,Math.random());n.stop(start+dur);return{g,f};};
   if(kind==="chirp"){const n=2+Math.floor(Math.random()*3),base=2600+Math.random()*1800;for(let i=0;i<n;i++){const st=t+i*.13,o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(base,st);o.frequency.exponentialRampToValueAtTime(base*1.35,st+.06);o.frequency.exponentialRampToValueAtTime(base*.9,st+.1);ramp(g,st,.08,.015,.1);o.connect(g).connect(out);o.start(st);o.stop(st+.13);}}
   else if(kind==="wind"){const{g,f}=noise(t,3.4,"bandpass",320,.6);ramp(g,t,.16,1.3,1.9);f.frequency.setValueAtTime(300,t);f.frequency.linearRampToValueAtTime(620,t+1.6);f.frequency.linearRampToValueAtTime(320,t+3.3);}
   else if(kind==="stream"){const{g}=noise(t,2.6,"bandpass",1500,1.2);ramp(g,t,.1,.6,1.8);}
   else if(kind==="grunt"){for(let i=0;i<3;i++){const st=t+i*.22,o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.setValueAtTime(115-i*10,st);o.frequency.exponentialRampToValueAtTime(62,st+.18);lp.type="lowpass";lp.frequency.value=520;ramp(g,st,.5,.03,.17);o.connect(lp).connect(g).connect(out);o.start(st);o.stop(st+.22);const nz=noise(st,.2,"lowpass",700);ramp(nz.g,st,.22,.02,.16);}}
   else if(kind==="crack"){for(let i=0;i<2;i++){const st=t+i*.07,nz=noise(st,.1,"highpass",1800);nz.g.gain.setValueAtTime(.55,st);nz.g.gain.exponentialRampToValueAtTime(.0001,st+.09);}}
   setTimeout(()=>out.disconnect(),4500);stats.played++;stats.last=kind;
  },
  metrics(){return{...stats,audioVersion:18,musicDuration:buffers.music?.duration||0,musicTrack:"alpine-party-210s",enabled,active,ready:!!buffers.music,context:context?.state||"locked",foreground,musicPlaying:!!musicNode&&context?.state==="running"&&wanted(),musicOffset:buffers.music?(musicOffset+(musicNode?Math.max(0,context.currentTime-musicStarted):0))%buffers.music.duration:0};}
 };
}
