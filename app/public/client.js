import {INTRO_DURATION,COUNTDOWN_DURATION} from './intro.js?v=17';
import {stages,getStage,DURATION} from "./journey.js?v=17";
import {createScene} from "./scene3d.js?v=21";
import {setup,validateAction,applyAction} from "./rules.js?v=21";
import {installControls} from "./controls.js?v=17";
import {createAudio} from "./audio.js?v=18";
import {getZone} from "./scene3d.js?v=21";
import {copy} from "./copy.js?v=19";
import {turnDirection} from "./route.js?v=21";
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search),app=$("app"),canvas=$("world"),player="guest";
const read=k=>{try{return localStorage.getItem(k);}catch{return null;}},save=(k,v)=>{try{localStorage.setItem(k,String(v));}catch{}};
const today=Number(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("-",""));
const qs=Number(q.get("challenge"));let seed=Number.isInteger(qs)&&qs>0&&qs<2147483648?qs:today;
let route="summit",mode=q.get("mode")==="relaxed"||read("spa.runner.assist")==="1"?"relaxed":"classic";
const target=Math.max(0,Math.min(1000000,Number(q.get("target"))||0));
let lang=Object.hasOwn(copy,read("hornox.language.v5"))?read("hornox.language.v5"):"en",reduced=read("spa.motion")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches,contrast=read("spa.contrast")==="1",buttons=read("hornox.buttons.v5")===null?matchMedia("(pointer:coarse)").matches:read("hornox.buttons.v5")==="1",sound=read("hornox.sound.v5")!=="0",tilt=false,tiltPending=false,tiltBase=null,tiltValue=1;
let state=setup([player]),screen="home",paused=false,loaded=false,scene,last=0,time=0,acc=0,countdown=0,introElapsed=-1,lastCount=-1,renderDistance=0,toastUntil=0,resultSaved=false,fps=60,frames=0,frameTime=0,listening=null;
const defaults={left:"ArrowLeft",right:"ArrowRight",jump:"ArrowUp",duck:"ArrowDown"};let bindings={...defaults};
try{const b=JSON.parse(read("spa.runner.keys"));if(b&&Object.keys(defaults).every(k=>/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Space|Key[A-OQ-Z])$/.test(b[k]))&&new Set(Object.values(b)).size===4)bindings=b;}catch{}
const t=(k,v={})=>{let s=copy[lang][k]||copy.en[k]||k;for(const key in v)s=s.replaceAll("{"+key+"}",v[key]);return s;};
const fmt=n=>new Intl.NumberFormat(({en:"en-GB",de:"de-CH",fr:"fr-CH",ja:"ja-JP",zh:"zh-CN"})[lang]).format(Math.floor(n));
const bestKey=(r=route,m=mode)=>"hornox.v17."+r+"."+m,best=(r=route,m=mode)=>Math.max(0,Number(read(bestKey(r,m)))||0);
const audio=createAudio();audio.setEnabled(sound);
function toast(value,seconds=1.8){$("toast").textContent=value;$("toast").classList.add("visible");toastUntil=time+seconds;}
function updateCopy(){
 document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));document.querySelectorAll("[data-label]").forEach(e=>e.setAttribute("aria-label",t(e.dataset.label)));
 $("language").value=lang;$("quick-sound").textContent=sound?"♪":"♪̸";$("quick-sound").setAttribute("aria-label",t(sound?"soundOn":"soundOff"));$("quick-sound").setAttribute("aria-pressed",String(sound));
 $("start").querySelector("span").textContent=t(loaded?"start":"loading");$("best-score").textContent=best()?fmt(best()):"—";
 $("challenge").hidden=!q.has("challenge");$("challenge").textContent=t("challenge",{score:fmt(target)});
 document.querySelectorAll("[data-route]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.route===route)));
 $("sound-toggle").checked=sound;$("assist-toggle").checked=mode==="relaxed";$("reduce-toggle").checked=reduced;$("contrast-toggle").checked=contrast;$("buttons-toggle").checked=buttons;
 $("tilt-toggle").textContent=t(tilt?"deactivate":"activate");$("tilt-status").textContent=t(tilt?"tiltOn":"tiltHelp");
 app.classList.toggle("reduced",reduced);app.classList.toggle("high-contrast",contrast);
 for(const [key,value]of Object.entries(bindings)){const b=$("bind-"+key);b.textContent=t(key)+" "+value.replace("ArrowLeft","←").replace("ArrowRight","→").replace("ArrowUp","↑").replace("ArrowDown","↓").replace("Key","").replace("Space","␣");b.setAttribute("aria-label",t(key)+": "+value);}
 updateMenu();if(screen==="result")resultCopy();hud();
}
function setScreen(next){$("splash").hidden=true;app.dataset.front="menu";screen=next;app.dataset.screen=next;$("home").hidden=next!=="home";$("hud").hidden=next==="home";$("result").hidden=next!=="result";$("pause-overlay").hidden=true;$("touch-controls").hidden=next!=="play"||!buttons;paused=false;}
function dispatch(action){if(!validateAction(state,player,action).ok)return false;state=applyAction(state,player,action);processEvents();return true;}
function inTurn(){return state.nextTurn>0&&state.nextTurn-state.distance<=state.speed*1.6&&state.nextTurn>state.distance;}
function input(kind){
 if(screen!=="play"||paused||introElapsed>=0||countdown>0||document.querySelector("dialog[open]"))return;
 if(kind==="left"||kind==="right"){
  const dir=kind==="left"?-1:1;
  if(inTurn())dispatch({type:"turn",direction:dir});
  else if(!tilt)dispatch({type:"steer",lane:Math.max(0,Math.min(2,Math.round(state.target)+dir))});
 }else dispatch({type:kind});
}
// TEST-CHEAT: ?level=N in der Adresse startet direkt im Level N (1–10).
// Beispiel: https://…/?level=7 – Bestwerte werden dabei nicht gespeichert.
const testLevel=Math.max(1,Math.min(stages.length,Math.floor(Number(q.get("level"))||1)));
function skipToLevel(){
 if(testLevel<=1||state.phase!=="playing")return;
 const tick=stages[testLevel-1].start*20,relaxed=state.mode==="relaxed";let distance=0;
 for(let i=1;i<=tick;i++)distance+=((relaxed?14:19)+Math.min(relaxed?6:8,i*.05/42))*.05;
 let turnIndex=0,heading=0;
 while(260+turnIndex*680<=distance){heading+=turnDirection(state.seed,0,turnIndex)*Math.PI/2;turnIndex++;}
 const elapsed=tick*.05;
 state={...state,tick,elapsed,distance,score:Math.floor(distance),turnIndex,turns:turnIndex,heading,nextTurn:260+turnIndex*680,turnChoice:0,
  nextRow:distance+30,row:Math.floor(distance/24),checkpoints:Math.floor(elapsed/120),nextHeartAt:elapsed+20,objects:[],events:[]};
 renderDistance=distance;introElapsed=INTRO_DURATION;
}
function start(){
 if(!loaded)return;$("power-callout").getAnimations().forEach(a=>a.cancel());$("power-callout").textContent="";$("heart-feedback").hidden=true;state=setup([player]);dispatch({type:"start",seed,mode,route});setScreen("play");acc=0;renderDistance=0;countdown=0;introElapsed=0;lastCount=-1;resultSaved=false;tiltBase=null;$("countdown").hidden=true;$("countdown").textContent="";
 audio.unlock().catch(()=>{});audio.setActive(true);controls.reset();scene?.resetEffects();$("feedback-label").textContent="";skipToLevel();hud();
}
function home(){introElapsed=-1;$("power-callout").getAnimations().forEach(a=>a.cancel());$("power-callout").textContent="";$("heart-feedback").hidden=true;audio.setActive(true);scene?.resetEffects();$("feedback-label").textContent="";state=setup([player]);setScreen("home");selectMenu("run");countdown=0;renderDistance=0;$("countdown").hidden=true;$("turn-cue").hidden=true;$("tutorial").hidden=true;$("powerup").hidden=true;$("resort-arrival").hidden=true;updateCopy();}
function pause(value=true){if(screen!=="play")return;paused=value;acc=0;$("pause-overlay").hidden=!value;if(value){audio.setActive(false);$("resume").focus();}else {audio.unlock().catch(()=>{});audio.setActive(true);}}
function openDialog(id){if(screen==="play"&&!paused)pause(true);$(id).showModal();}
function resultCopy(){
 $("result-title").textContent=t(state.phase==="won"?"won":"lost");$("result-kicker").textContent=state.phase==="won"?t("wonKicker"):state.score>=best()?t("record"):"HORNOX RUN";
 $("result-score").textContent=fmt(state.score);$("result-details").textContent=fmt(state.distance)+" m · "+fmt(state.coins)+" "+t("coins");
 $("result-note").textContent=t(state.phase==="won"?"wonText":"lostText",{distance:fmt(state.distance),coins:fmt(state.coins)});
}
function finish(){if(resultSaved)return;resultSaved=true;audio.setActive(false);if(testLevel<=1&&state.score>best(state.route,state.mode))save(bestKey(state.route,state.mode),state.score);setScreen("result");$("turn-cue").hidden=true;$("tutorial").hidden=true;$("resort-arrival").hidden=true;resultCopy();$("again").focus();}
function heartFeedback(gained){const node=$('heart-feedback');node.querySelector('span').textContent=t(gained?'heartGain':'heartFull');node.hidden=false;node.getAnimations().forEach(a=>a.cancel());const target=$('lives').getBoundingClientRect(),x=target.left+target.width/2-innerWidth/2,y=target.top+target.height/2-innerHeight*.40;node.animate(reduced?[{opacity:1},{opacity:1,offset:.75},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-50%) scale(.6)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.15)',offset:.18},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.60},{opacity:0,transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(.22)`}],{duration:reduced?1000:1350,fill:'forwards'});audio.play('pickup',1.6,.85);}
function processEvents(){
 for(const e of state.events){scene?.emit(e,state);if(["jump","duck","land","pickup","bump"].includes(e.kind))audio.play(e.kind,e.kind==="pickup"?1+(state.chain%8)*.035:1);
 if(e.kind==="pickup"&&!reduced){$("coins").getAnimations().forEach(a=>a.cancel());$("coins").animate([{transform:"scale(1.35)",color:"#ffe6a2"},{transform:"scale(1)",color:"#fff6dc"}],{duration:240});}
 if(["clear","nearMiss","combo"].includes(e.kind)){const label=$("feedback-label");label.textContent=t(e.kind==="clear"?"nice":e.kind==="nearMiss"?"nearMiss":"comboCall",{n:state.multiplier});label.getAnimations().forEach(a=>a.cancel());label.animate(reduced?[{opacity:1},{opacity:0}]:[{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.08)",offset:.2},{opacity:1,transform:"translate(-50%,-6px) scale(1)",offset:.7},{opacity:0,transform:"translate(-50%,-22px) scale(1)"}],{duration:1000,fill:"forwards"});audio.play("pickup",e.kind==="combo"?1.5:1.25,.6);}
 if(e.kind==="doubleJump"){audio.play("jump",1.3,.8);toast(t("doubleJump"),.8);}
 if(e.kind==="powerReady"){toast(t("powerReady"),2.8);audio.play("pickup",1.8,.7);}
 if(e.kind==="powerStart"){const n=$("power-callout");n.textContent=t("powerName");n.getAnimations().forEach(a=>a.cancel());n.animate([{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.05)",offset:.18},{opacity:1,offset:.72},{opacity:0,transform:"translate(-50%,-14px) scale(1)"}],{duration:1500,fill:"forwards"});audio.play("jump",.72,.8);audio.play("pickup",1.5,.7);}
 if(e.kind==="powerClear")audio.play("pickup",1.3,.55);
 if(e.kind==="powerPickup"){toast(t(e.power),2.5);audio.play("pickup",1.6,.8);}
 if(e.kind==="heart")heartFeedback(e.gained);if(e.kind==="world"&&e.gained)heartFeedback(true);
 if(e.kind==="world")toast(t("newWorld",{world:t(stages[e.stage].key)}),2);
 if(e.kind==="bump")toast(t(e.object==="sheep"?"sheepBump":"bump"));else if(e.kind==="checkpoint")toast(t("checkpoint"),2.5);else if(e.kind==="arrival"){$("toast").classList.remove("visible");toastUntil=0;}else if(e.kind==="magnet")toast(t("magnet"),2.3);else if(e.kind==="shieldHit")toast(t("shieldHit"));else if(e.kind==="missedTurn")toast(t("turnMiss"));}
}
function hud(){
 $("score").textContent=fmt(state.score);$("coins").textContent=state.coins;$("combo").textContent=state.multiplier>1?"×"+state.multiplier:"";
 $("distance").textContent=Math.floor(state.elapsed/60)+":"+String(Math.floor(state.elapsed%60)).padStart(2,"0")+" / 15:00 · "+(getStage(state.elapsed)+1)+"/10";
 $("stage").textContent=t(stages[getStage(state.elapsed)].key).toUpperCase();
 $("progress").style.width=(Math.min(100,state.elapsed/DURATION*100))+"%";
 const lifeKey=lang+':'+state.lives+':'+state.maxLives;if($('lives').dataset.value!==lifeKey){$('lives').dataset.value=lifeKey;$('lives-label').textContent=t('heart');document.querySelectorAll('#life-hearts svg').forEach((heart,i)=>heart.classList.toggle('empty',i>=state.lives));$('lives').setAttribute('aria-label',t('heart')+': '+state.lives+' / 3');}

 const active=screen==="play",intro=introElapsed>=0;app.classList.toggle("intro-active",intro);$("intro-caption").hidden=!intro;$("intro-caption").querySelector("span").textContent=t("introCaption");$("tutorial").hidden=!active||intro||state.distance>70||countdown>0;
 const rem=state.nextTurn-state.distance,show=active&&state.nextTurn>0&&rem<state.speed*2.8&&state.elapsed<892;
 $("turn-cue").hidden=!show;
 if(show){const direction=turnDirection(state.seed,state.summitTurn,state.turnIndex),ready=state.turnChoice===direction;$("turn-arrow").textContent=direction<0?"↰":"↱";$("turn-label").textContent=t(direction<0?"turnLeft":"turnRight");$("turn-distance").textContent=ready?t("turnReady"):inTurn()?t("turnNow"):Math.ceil(rem)+" m";$("turn-cue").classList.toggle("now",inTurn()&&!ready);$("turn-cue").classList.toggle("accepted",ready);}
 const power=[state.magnet>0?t("magnetShort",{n:Math.ceil(state.magnet/20)}):"",state.shield?t("shieldShort"):"",state.coinBoost>0?t("boostShort",{n:Math.ceil(state.coinBoost/20)}):""].filter(Boolean).join(" · ");
 $("powerup").hidden=!active||!power;$("powerup").textContent=power;

 $("resort-arrival").hidden=true;
 $("touch-controls").hidden=!active||!buttons||intro||countdown>0;
 const charged=state.powerCharge>=30,on=state.powerTicks>0,pb=$("rush-button");pb.hidden=!active||intro||countdown>0;pb.disabled=paused||!charged||on;pb.classList.toggle('ready',charged&&!on);pb.classList.toggle('running',on);pb.style.setProperty('--charge',(on?state.powerTicks/120:state.powerCharge/30)*100+'%');$('rush-value').textContent=on?Math.ceil(state.powerTicks/20)+'s':charged?t('powerTap'):state.powerCharge+'/30';$('rush-name').textContent=t('powerName');pb.setAttribute('aria-label',on?t('powerActive',{n:Math.ceil(state.powerTicks/20)}):charged?t('powerReady'):t('powerCharge',{n:state.powerCharge}));$('rush-key').textContent=matchMedia('(pointer:coarse)').matches?'':powerKey().replace('Key','');
}
function powerKey(){return ["KeyE","KeyQ","KeyF","KeyX","KeyC"].find(k=>!Object.values(bindings).includes(k));}
let renderScale=1.35,qualityLowTime=0,qualityHighTime=0,qualityCooldown=0;
function resize(){scene?.resize(innerWidth,innerHeight,Math.min(renderScale,devicePixelRatio||1));}
let lastHudTime=-1;
function loop(ms){
 const dt=Math.min(.1,(ms-last)/1000||.016);last=ms;time+=dt;frameTime+=dt;frames++;if(frameTime>.6){fps=frames/frameTime;frameTime=0;frames=0;}
 if(loaded&&screen==="play"&&!paused&&!document.querySelector("dialog[open]")){
  if(introElapsed>=0){introElapsed+=dt;if(introElapsed>=INTRO_DURATION){introElapsed=-1;countdown=COUNTDOWN_DURATION;lastCount=3;$("countdown").hidden=false;$("countdown").textContent="3";audio.play('pickup',.9,.55);}}
  else if(countdown>0){countdown=Math.max(0,countdown-dt);const n=Math.ceil(countdown);if(n!==lastCount){lastCount=n;audio.play('pickup',n?1.2-n*.1:1.6,n?.55:.8);}$("countdown").textContent=n||t("go");if(countdown<=0)$("countdown").hidden=true;}

  else{acc+=dt;while(acc>=.05&&state.phase==="playing"){if(tilt)dispatch({type:"steer",lane:tiltValue});dispatch({type:"step"});acc-=.05;}if(state.phase!=="playing")finish();}
 }
 if(loaded&&screen==='play'&&!paused&&introElapsed<0&&countdown<=0){
  qualityCooldown=Math.max(0,qualityCooldown-dt);qualityLowTime=fps<43?qualityLowTime+dt:Math.max(0,qualityLowTime-dt*2);qualityHighTime=fps>56?qualityHighTime+dt:0;
  if(qualityCooldown===0&&qualityLowTime>3&&renderScale>.85){renderScale=Math.max(.85,renderScale-.15);qualityLowTime=0;qualityCooldown=5;resize();}
  else if(qualityCooldown===0&&qualityHighTime>12&&renderScale<1.5){renderScale=Math.min(1.5,renderScale+.10);qualityHighTime=0;qualityCooldown=12;resize();}
 }
 if(loaded&&screen!=="home"){if(screen==="play"&&!paused&&introElapsed<0&&countdown<=0)renderDistance=state.distance+acc*state.speed;else renderDistance=state.distance;
  scene.render(state,{distance:renderDistance,time,delta:dt,active:screen!=="home",paused:paused||introElapsed>=0||countdown>0,reduced,screen,introTime:introElapsed>=0?introElapsed:null,waiting:countdown>0});
 }
 if(time-lastHudTime>=.05){hud();lastHudTime=time;}if(time>toastUntil)$("toast").classList.remove("visible");requestAnimationFrame(loop);
}

let menuTab="run";
function selectMenu(tab){menuTab=tab;for(const name of ["run","route","records"]){$("menu-"+name).hidden=name!==tab;const button=document.querySelector('[data-menu="'+name+'"]');if(name===tab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}app.dataset.menuTab=tab;updateMenu();}
function updateMenu(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 $('record-classic').textContent=best('summit','classic')?fmt(best('summit','classic')):'—';$('record-relaxed').textContent=best('summit','relaxed')?fmt(best('summit','relaxed')):'—';
 const key=lang;if($('route-stages').dataset.lang!==key){$('route-stages').dataset.lang=key;$('route-stages').replaceChildren(...stages.map((stage,i)=>{const li=document.createElement('li'),n=document.createElement('b'),label=document.createElement('span'),time=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');label.textContent=t(stage.key).split(' · ')[0];time.textContent=Math.floor(stage.start/60)+':'+String(stage.start%60).padStart(2,'0');li.append(n,label,time);return li}));}
}
function enterMenu(){app.dataset.front="menu";$('splash').hidden=true;selectMenu('run');audio.unlock().catch(()=>{});audio.setActive(true);$('start').disabled?$('how').focus():$('start').focus();}
$('enter-game').onclick=enterMenu;document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>selectMenu(b.dataset.menu));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;save('spa.runner.assist',mode==='relaxed'?1:0);updateCopy();});

$("rush-button").onpointerdown=e=>{e.preventDefault();input("power");};$("rush-button").onclick=e=>{if(e.detail===0)input("power");};
$("start").onclick=start;$("again").onclick=start;$("restart").onclick=start;$("resume").onclick=()=>pause(false);$("pause-button").onclick=()=>pause(true);document.querySelectorAll(".go-home").forEach(b=>b.onclick=home);
$("settings").onclick=()=>openDialog("settings-dialog");$("pause-settings").onclick=()=>openDialog("settings-dialog");$("how").onclick=()=>openDialog("help-dialog");document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$("language").onchange=e=>{lang=e.target.value;save("hornox.language.v5",lang);updateCopy();};
document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>{route=b.dataset.route;updateCopy();});
$("retry-load").onclick=()=>location.reload();
function toggleSound(value){sound=value;save("hornox.sound.v5",value?1:0);audio.setEnabled(value);if(value)audio.unlock().catch(()=>{});updateCopy();}
$("sound-toggle").onchange=e=>toggleSound(e.target.checked);$("quick-sound").onclick=()=>toggleSound(!sound);
$("assist-toggle").onchange=e=>{mode=e.target.checked?"relaxed":"classic";save("spa.runner.assist",mode==="relaxed"?1:0);updateCopy();};
$("reduce-toggle").onchange=e=>{reduced=e.target.checked;save("spa.motion",reduced?1:0);updateCopy();};
$("contrast-toggle").onchange=e=>{contrast=e.target.checked;save("spa.contrast",contrast?1:0);updateCopy();};
$("buttons-toggle").onchange=e=>{buttons=e.target.checked;save("hornox.buttons.v5",buttons?1:0);updateCopy();};
$("tilt-toggle").onclick=async()=>{if(tilt){tilt=false;updateCopy();return;}try{if(typeof DeviceOrientationEvent==="undefined")throw Error();if(typeof DeviceOrientationEvent.requestPermission==="function"&&await DeviceOrientationEvent.requestPermission()!=="granted")throw Error();tiltPending=true;tiltBase=null;tiltValue=1;$("tilt-status").textContent=t("tiltWait");setTimeout(()=>{if(tiltPending){tiltPending=false;$("tilt-status").textContent=t("tiltDenied");}},5000);}catch{$("tilt-status").textContent=t("tiltDenied");}};
window.addEventListener("deviceorientation",e=>{if((!tilt&&!tiltPending)||!Number.isFinite(e.gamma))return;if(tiltPending){tiltPending=false;tilt=true;updateCopy();}const angle=screenOrientation(),raw=Math.abs(angle)===90?(e.beta||0)*(angle===90?1:-1):e.gamma;if(tiltBase===null)tiltBase=raw;const delta=raw-tiltBase;tiltValue=Math.max(0,Math.min(2,1+(Math.abs(delta)<2?0:delta/20)));});
function screenOrientation(){return window.screen.orientation?.angle||window.orientation||0;}
window.addEventListener("orientationchange",()=>{tiltBase=null;resize();});
document.querySelectorAll("[data-bind]").forEach(b=>b.onclick=()=>{listening=b.dataset.bind;document.querySelectorAll("[data-bind]").forEach(x=>x.classList.toggle("listening",x===b));b.textContent=t("pressKey");});
$("keys-reset").onclick=()=>{bindings={...defaults};save("spa.runner.keys",JSON.stringify(bindings));listening=null;updateCopy();};
window.addEventListener("keydown",e=>{
 if(listening){e.preventDefault();if(e.code==="Escape"){listening=null;updateCopy();return;}if(!/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Space|Key[A-OQ-Z])$/.test(e.code))return;const other=Object.keys(bindings).find(k=>bindings[k]===e.code);if(other)bindings[other]=bindings[listening];bindings[listening]=e.code;listening=null;document.querySelectorAll("[data-bind]").forEach(b=>b.classList.remove("listening"));save("spa.runner.keys",JSON.stringify(bindings));updateCopy();return;}
 if(document.querySelector("dialog[open]"))return;
 if(e.code==="Escape"||e.code==="KeyP"){if(screen==="play"){e.preventDefault();pause(!paused);}return;}
 if(e.code==="Enter"&&screen==="home"){e.preventDefault();if(app.dataset.front==="cover")enterMenu();else if(document.activeElement?.tagName!=="BUTTON")start();else document.activeElement.click();return;}
 if(e.repeat)return;
 if(e.code===powerKey()&&screen==="play"){e.preventDefault();input("power");return;}
 const action=Object.keys(bindings).find(k=>bindings[k]===e.code)||({KeyA:"left",KeyD:"right",KeyW:"jump",Space:"jump",KeyS:"duck"})[e.code];
 if(action){e.preventDefault();input(action);}
});
const controls=installControls(app,{enabled:()=>screen==="play"&&!paused&&introElapsed<0&&countdown<=0&&!document.querySelector("dialog[open]"),onAction:input});
document.querySelectorAll("[data-action]").forEach(b=>{b.onpointerdown=e=>{e.preventDefault();input(b.dataset.action);};b.onclick=e=>{if(e.detail===0)input(b.dataset.action);};});
window.addEventListener("blur",()=>{if(screen==="play")pause(true);});document.addEventListener("visibilitychange",()=>{if(document.hidden&&screen==="play")pause(true);});
window.addEventListener("resize",resize);canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();pause(true);toast(t("graphicsLost"),999);});
$("share").onclick=async()=>{const url=new URL(location.origin);url.searchParams.set("challenge",state.seed);url.searchParams.set("route",state.route);url.searchParams.set("mode",state.mode);url.searchParams.set("target",state.score);url.searchParams.set("v","12");const data={title:"Hornox Run · Zermatt",text:t("shareText",{score:fmt(state.score)}),url:url.href};try{if(navigator.share){await navigator.share(data);return;}await navigator.clipboard.writeText(url.href);toast(t("copied"));}catch(e){if(e.name==="AbortError")return;$("copy-link-wrap").hidden=false;$("copy-link").value=url.href;$("copy-link").select();}};
$("embedded-help").hidden=window.top===window;
updateCopy();
try{scene=createScene(canvas);resize();scene.ready.then(()=>{loaded=true;$("start").disabled=false;$("asset-status").textContent="";updateCopy();}).catch(fail);}catch(e){fail(e);}
function fail(e){console.error("Hornox graphics",e);$("asset-status").textContent=t("loadError");$("retry-load").hidden=false;$("start").querySelector("span").textContent=t("loadError");}
requestAnimationFrame(loop);
if(q.has("debug"))window.__hornox=window.__spa={start,pause,home,input,action:dispatch,getState:()=>JSON.parse(JSON.stringify(state)),getMetrics:()=>({...scene?.metrics(),fps,renderScale,screen,paused,loaded,tilt,introElapsed,countdown,stage:getStage(state.elapsed),front:app.dataset.front,menuTab,audio:audio.metrics()}),advance(n=1){for(let i=0;i<n&&state.phase==="playing";i++)dispatch({type:"step"});renderDistance=state.distance;hud();},setState(p){state={...state,...p};renderDistance=state.distance;hud();},setIntro(n){introElapsed=n;countdown=0;hud();},setCountdown(n){introElapsed=-1;countdown=n;$("countdown").textContent=n>0?String(Math.ceil(n)):"";$("countdown").hidden=n<=0;}};

