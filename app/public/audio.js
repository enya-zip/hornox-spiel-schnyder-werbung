export function createAudio(){
 const urls={music:"assets/hornox-alpine-party-210s.mp3",jump:"assets/jump-funny.mp3",duck:"assets/slide.mp3",pickup:"assets/cowbell-coin.mp3",land:"assets/land.mp3",bump:"assets/bonk-funny.mp3"};
 let context,master,musicNode,musicGain,enabled=true,active=false,foreground=!document.hidden,readyPromise=null,resuming=null,musicOffset=0,musicStarted=0;
 const buffers={},stats={played:0,last:"",musicStarts:0};let noiseBuffer=null,chaseOn=false,chaseTimer=null,chaseNext=0,chaseStep=0;
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
  node.buffer=buffers.music;node.loop=true;gain.gain.value=chaseOn?.2:.60;node.connect(gain).connect(master);
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
 function noiseSource(ctx){if(!noiseBuffer||noiseBuffer.sampleRate!==ctx.sampleRate){noiseBuffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}const n=ctx.createBufferSource();n.buffer=noiseBuffer;return n;}
 // Spannende Verfolgungsmusik (Level 4): 150 BPM, Bass-Ostinato in a-Moll, Kick und Hi-Hat, im Browser erzeugt.
 function chaseTick(){
  if(!chaseOn||!wanted()||context?.state!=="running")return;const ctx=context,step8=60/150/2,notes=[45,45,48,45,52,45,50,45,45,45,48,45,53,52,50,48];
  while(chaseNext<ctx.currentTime+.3){const t=Math.max(chaseNext,ctx.currentTime),step=chaseStep%16,out=ctx.createGain();out.gain.value=.5;out.connect(master);
   if(step%4===0||step===10){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(.8,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g).connect(out);o.start(t);o.stop(t+.26);}
   if(step%2===1){const n=noiseSource(ctx),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type="highpass";f.frequency.value=7000;g.gain.setValueAtTime(.14,t);g.gain.exponentialRampToValueAtTime(.0001,t+.05);n.connect(f).connect(g).connect(out);n.start(t,Math.random());n.stop(t+.06);}
   {const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type="sawtooth";o.frequency.value=440*Math.pow(2,(notes[step]-69)/12);f.type="lowpass";f.frequency.value=650;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.2,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.17);o.connect(f).connect(g).connect(out);o.start(t);o.stop(t+.18);}
   setTimeout(()=>out.disconnect(),1500);chaseNext+=step8;chaseStep++;}
 }
 return{
  unlock,
  setChase(on){on=!!on&&enabled;if(on===chaseOn)return;chaseOn=on;if(musicGain&&context)musicGain.gain.setTargetAtTime(on?.2:.6,context.currentTime,.4);clearInterval(chaseTimer);chaseTimer=null;if(on&&context){chaseNext=context.currentTime+.05;chaseStep=0;chaseTimer=setInterval(chaseTick,80);}},setEnabled(value){enabled=!!value;if(master&&context.state!=="closed")master.gain.setTargetAtTime(enabled?.65:0,context.currentTime,.03);sync();if(wanted())wake();},
  setActive(value){active=!!value;sync();if(wanted()&&context)wake();},
  play(name,rate=1,volume=1){if(!wanted()||context?.state!=="running"||!buffers[name])return;const source=context.createBufferSource();source.buffer=buffers[name];source.playbackRate.value=rate;const gain=context.createGain();gain.gain.value=(name==="pickup"?.48:.8)*volume;source.connect(gain).connect(master);source.onended=()=>{source.disconnect();gain.disconnect();};source.start();stats.played++;stats.last=name;},
  // Level 4: Waldgeräusche direkt im Browser erzeugt (keine Audiodateien nötig).
  synth(kind,volume=1){
   if(!wanted()||context?.state!=="running")return;const ctx=context,t=ctx.currentTime,out=ctx.createGain();out.gain.value=volume;out.connect(master);
   const ramp=(g,start,peak,attack,decay)=>{g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(peak,start+attack);g.gain.exponentialRampToValueAtTime(.0001,start+attack+decay);};
   const noise=(start,dur,type,freq,q=1)=>{const n=noiseSource(ctx);const f=ctx.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=q;const g=ctx.createGain();n.connect(f).connect(g).connect(out);n.start(start,Math.random());n.stop(start+dur);return{g,f};};
   if(kind==="chirp"){const n=2+Math.floor(Math.random()*3),base=2600+Math.random()*1800;for(let i=0;i<n;i++){const st=t+i*.13,o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.setValueAtTime(base,st);o.frequency.exponentialRampToValueAtTime(base*1.35,st+.06);o.frequency.exponentialRampToValueAtTime(base*.9,st+.1);ramp(g,st,.08,.015,.1);o.connect(g).connect(out);o.start(st);o.stop(st+.13);}}
   else if(kind==="wind"){const{g,f}=noise(t,3.4,"bandpass",320,.6);ramp(g,t,.16,1.3,1.9);f.frequency.setValueAtTime(300,t);f.frequency.linearRampToValueAtTime(620,t+1.6);f.frequency.linearRampToValueAtTime(320,t+3.3);}
   else if(kind==="stream"){const{g}=noise(t,2.6,"bandpass",1500,1.2);ramp(g,t,.1,.6,1.8);}
   else if(kind==="grunt"){for(let i=0;i<3;i++){const st=t+i*.22,o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.setValueAtTime(115-i*10,st);o.frequency.exponentialRampToValueAtTime(62,st+.18);lp.type="lowpass";lp.frequency.value=520;ramp(g,st,.5,.03,.17);o.connect(lp).connect(g).connect(out);o.start(st);o.stop(st+.22);const nz=noise(st,.2,"lowpass",700);ramp(nz.g,st,.22,.02,.16);}}
   else if(kind==="water"){const a=noise(t,3.2,"bandpass",700,.5);ramp(a.g,t,.16,.8,2.2);const b=noise(t,3.2,"highpass",3500);ramp(b.g,t,.05,.8,2.2);}
   else if(kind==="hoof"){for(let i=0;i<2;i++){const st=t+i*.09,o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(95,st);o.frequency.exponentialRampToValueAtTime(48,st+.07);ramp(g,st,.45,.005,.08);o.connect(g).connect(out);o.start(st);o.stop(st+.1);const n=noise(st,.06,"lowpass",500);ramp(n.g,st,.18,.003,.05);}}
   else if(kind==="plank"){const n=noise(t,.12,"bandpass",900,2);ramp(n.g,t,.6,.003,.1);const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(140,t+.03);o.frequency.exponentialRampToValueAtTime(55,t+.3);ramp(g,t+.03,.5,.01,.3);o.connect(g).connect(out);o.start(t+.03);o.stop(t+.36);for(let i=1;i<3;i++){const st=t+i*.06,c=noise(st,.05,"highpass",2200);ramp(c.g,st,.35,.002,.04);}}
   else if(kind==="cowbell"){for(const [f,d,v] of[[540,1.4,.22],[1290,.9,.12],[2010,.6,.07],[3300,.3,.04]]){const o=ctx.createOscillator(),g=ctx.createGain();o.type="sine";o.frequency.value=f*(.97+Math.random()*.06);ramp(g,t,v,.004,d);o.connect(g).connect(out);o.start(t);o.stop(t+d+.05);}}
   else if(kind==="bleat"||kind==="goat"){const goat=kind==="goat",o=ctx.createOscillator(),lfo=ctx.createOscillator(),lg=ctx.createGain(),f=ctx.createBiquadFilter(),g=ctx.createGain(),base=goat?400:270,len=goat?.5:.7;o.type="sawtooth";o.frequency.setValueAtTime(base,t);o.frequency.linearRampToValueAtTime(base*.85,t+len);lfo.frequency.value=goat?12:7;lg.gain.value=base*.06;lfo.connect(lg).connect(o.frequency);f.type="bandpass";f.frequency.value=goat?1400:1050;f.Q.value=2;ramp(g,t,.35,.05,len);o.connect(f).connect(g).connect(out);o.start(t);lfo.start(t);o.stop(t+len+.1);lfo.stop(t+len+.1);}
   else if(kind==="bark"){for(let i=0;i<2;i++){const st=t+i*.2,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type="square";o.frequency.setValueAtTime(560,st);o.frequency.exponentialRampToValueAtTime(320,st+.11);f.type="lowpass";f.frequency.value=1900;ramp(g,st,.3,.008,.12);o.connect(f).connect(g).connect(out);o.start(st);o.stop(st+.15);const n=noise(st,.1,"bandpass",1200,1.5);ramp(n.g,st,.25,.005,.08);}}
   else if(kind==="paws"){for(let i=0;i<3;i++){const st=t+i*.07,n=noise(st,.05,"lowpass",900);ramp(n.g,st,.2,.003,.04);}}
   else if(kind==="step"){const n=noise(t,.08,"bandpass",2600,.8);ramp(n.g,t,.06,.01,.06);}
   else if(kind==="croak"){for(let i=0;i<2;i++){const st=t+i*.16,o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain(),am=ctx.createOscillator(),ag=ctx.createGain();o.type="sawtooth";o.frequency.setValueAtTime(190-i*20,st);o.frequency.linearRampToValueAtTime(150,st+.12);f.type="bandpass";f.frequency.value=700;f.Q.value=3;am.frequency.value=38;ag.gain.value=.5;am.connect(ag).connect(g.gain);ramp(g,st,.5,.01,.12);o.connect(f).connect(g).connect(out);o.start(st);am.start(st);o.stop(st+.15);am.stop(st+.15);}}
   else if(kind==="thwip"){const n=noise(t,.16,"bandpass",1800,2);n.f.frequency.setValueAtTime(900,t);n.f.frequency.exponentialRampToValueAtTime(4200,t+.12);ramp(n.g,t,.4,.005,.12);const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(400,t);o.frequency.exponentialRampToValueAtTime(1400,t+.1);ramp(g,t,.15,.005,.1);o.connect(g).connect(out);o.start(t);o.stop(t+.13);}
   else if(kind==="splash"){const n=noise(t,.7,"lowpass",1100);ramp(n.g,t,.7,.01,.6);for(let i=0;i<4;i++){const st=t+.1+i*.08,o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(500+i*120,st);o.frequency.exponentialRampToValueAtTime(1100+i*150,st+.06);ramp(g,st,.12,.004,.06);o.connect(g).connect(out);o.start(st);o.stop(st+.08);}}
   else if(kind==="buzz"){const o=ctx.createOscillator(),g=ctx.createGain(),am=ctx.createOscillator(),ag=ctx.createGain();o.type="sawtooth";o.frequency.value=220+Math.random()*60;am.frequency.value=28;ag.gain.value=.03;am.connect(ag).connect(g.gain);ramp(g,t,.05,.15,.6);const f=ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=1600;o.connect(f).connect(g).connect(out);o.start(t);am.start(t);o.stop(t+.8);am.stop(t+.8);}
   else if(kind==="crack"){for(let i=0;i<2;i++){const st=t+i*.07,nz=noise(st,.1,"highpass",1800);nz.g.gain.setValueAtTime(.55,st);nz.g.gain.exponentialRampToValueAtTime(.0001,st+.09);}}
   setTimeout(()=>out.disconnect(),4500);stats.played++;stats.last=kind;
  },
  metrics(){return{...stats,audioVersion:18,musicDuration:buffers.music?.duration||0,musicTrack:"alpine-party-210s",enabled,active,ready:!!buffers.music,context:context?.state||"locked",foreground,musicPlaying:!!musicNode&&context?.state==="running"&&wanted(),musicOffset:buffers.music?(musicOffset+(musicNode?Math.max(0,context.currentTime-musicStarted):0))%buffers.music.duration:0};}
 };
}
