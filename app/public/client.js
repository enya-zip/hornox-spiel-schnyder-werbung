import {INTRO_DURATION,COUNTDOWN_DURATION} from './intro.js?v=17';
import {stages,getStage,DURATION,fogAt,bridgeAt,forestSection,meadowSection,meadowWindows,lakeSection,stoneAt,swampMud,baseSpeed,glacierSection,GUSTS,ridgeNarrow,summitNarrow,SOLVAY_AT} from "./journey.js?v=27";
import {createScene} from "./scene3d.js?v=97";
import {setup,validateAction,applyAction} from "./rules.js?v=54";
import {installControls} from "./controls.js?v=17";
import {createAudio} from "./audio.js?v=23";
import {getZone} from "./scene3d.js?v=97";
import {copy} from "./copy.js?v=60";
import {turnDirection} from "./route.js?v=21";
import {createLeaderboard} from "./leaderboard.js?v=8";
import {LEADERBOARD} from "./leaderboard-config.js?v=4";
const $=id=>document.getElementById(id),q=new URLSearchParams(location.search),app=$("app"),canvas=$("world"),player="guest";
const read=k=>{try{return localStorage.getItem(k);}catch{return null;}},save=(k,v)=>{try{localStorage.setItem(k,String(v));}catch{}};
const today=Number(new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Zurich",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).replaceAll("-",""));
const qs=Number(q.get("challenge")),challengeSeed=Number.isInteger(qs)&&qs>0&&qs<2147483648;let seed=challengeSeed?qs:today;
let route="summit",mode=q.get("mode")==="relaxed"||read("spa.runner.assist")==="1"?"relaxed":"classic";
const target=Math.max(0,Math.min(1000000,Number(q.get("target"))||0));
const browserLang=(navigator.languages||[navigator.language||""]).map(l=>String(l).slice(0,2).toLowerCase()).find(l=>Object.hasOwn(copy,l));
let lang=Object.hasOwn(copy,read("hornox.language.v5"))?read("hornox.language.v5"):browserLang||"de",reduced=read("spa.motion")==="1"||matchMedia("(prefers-reduced-motion: reduce)").matches,contrast=read("spa.contrast")==="1",buttons=read("hornox.buttons.v5")===null?matchMedia("(pointer:coarse)").matches:read("hornox.buttons.v5")==="1",sound=read("hornox.sound.v5")!=="0",music=read("hornox.music.v1")!=="0",tilt=false,tiltPending=false,tiltBase=null,tiltValue=1;
const CELEBRATE=2.8;let celebrateAt=null;   // Gipfel-Jubel: so lange (s) feiert Hornox, bevor das Ergebnis kommt
let state=setup([player]),screen="home",paused=false,loaded=false,scene,last=0,time=0,acc=0,countdown=0,introElapsed=-1,lastCount=-1,renderDistance=0,toastUntil=0,resultSaved=false,fps=60,frames=0,frameTime=0,listening=null;
const defaults={left:"ArrowLeft",right:"ArrowRight",jump:"ArrowUp",duck:"ArrowDown"};let bindings={...defaults};
try{const b=JSON.parse(read("spa.runner.keys"));if(b&&Object.keys(defaults).every(k=>/^(ArrowLeft|ArrowRight|ArrowUp|ArrowDown|Space|Key[A-OQ-Z])$/.test(b[k]))&&new Set(Object.values(b)).size===4)bindings=b;}catch{}
const t=(k,v={})=>{let s=copy[lang][k]||copy.en[k]||k;for(const key in v)s=s.replaceAll("{"+key+"}",v[key]);return s;};
const fmt=n=>new Intl.NumberFormat(({en:"en-GB",de:"de-CH",fr:"fr-CH",ja:"ja-JP",zh:"zh-CN"})[lang]).format(Math.floor(n));
const bestKey=(r=route,m=mode)=>"hornox.v17."+r+"."+m,best=(r=route,m=mode)=>Math.max(0,Number(read(bestKey(r,m)))||0);
const audio=createAudio();audio.setEnabled(sound);audio.setMusic(music);
// Level-Meldung: "Level X geschafft!" + Name und Nummer des nächsten Levels.
let bannerTimer=0;
function levelBanner(stage){const b=$("level-banner");$("level-done").textContent=t("levelDone",{done:stage});$("level-name").textContent=t(stages[stage].key);$("level-next").textContent=t("levelNext",{next:stage+1});b.hidden=false;b.classList.add("visible");clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>{b.classList.remove("visible");bannerTimer=setTimeout(()=>{b.hidden=true;},400);},3200);}
// Warnt einmal pro Krähe, sobald sie aus den Wolken auftaucht (etwa 2,6 s vor Hornox).
let crowsSeen=new Set();
function crowWarnings(){const fog=fogAt(state.elapsed);if(fog>0&&!crowsSeen.has("fog"+Math.floor(state.elapsed/30))){crowsSeen.add("fog"+Math.floor(state.elapsed/30));toast(t("fogWarn"),2.6);}if(bridgeAt(state.elapsed+2)&&!crowsSeen.has("bridge")){crowsSeen.add("bridge");toast(t("bridgeWarn"),3);}for(const o of state.objects){if((o.kind==="beaverLog"||o.kind==="gull")&&!o.resolved&&!crowsSeen.has(o.id)&&(o.d-state.distance)/Math.max(1,state.speed+(o.approach||0))<2.6){crowsSeen.add(o.id);toast(t(o.kind==="gull"?"gullWarn":"beaverWarn"),1.8);continue;}if(o.kind!=="crow"||o.resolved||crowsSeen.has(o.id))continue;const gap=(o.d-state.distance)/Math.max(1,state.speed+(o.approach||0));if(gap>2.6)continue;crowsSeen.add(o.id);if(o.double&&o.lane!==Math.min(...state.objects.filter(q=>q.kind==="crow"&&q.double&&!q.resolved).map(q=>q.lane)))continue;crowAlert(o.double);}}
// Grosse Warnung: «Achtung Angriff!» (1 Krähe) oder «Achtung Doppelangriff!» (2 Krähen).
function crowAlert(double){bigAlert(t(double?"crowDouble":"crowAttack"));}
function bigAlert(text){const n=$("power-callout");n.textContent=text;n.classList.add("alert");n.getAnimations().forEach(a=>a.cancel());const anim=n.animate([{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.08)",offset:.15},{opacity:1,transform:"translate(-50%,0) scale(1)",offset:.8},{opacity:0,transform:"translate(-50%,-8px) scale(1)"}],{duration:1700,easing:"ease-out"});anim.onfinish=()=>n.classList.remove("alert");audio.play("bump",.7,.35);}
// Fischer-Bubble (Level 3): Profilbild unten links zeigt den Zustand des Fischers.
// 1 entspannt · 2 hat dich entdeckt (ab 10 Fischen) · 3 wütend, verfolgt dich · 4 sehr wütend, kommt näher.
// Steigt sofort an, beruhigt sich nach der Flucht langsam wieder (ca. 0,35 Stufen pro Sekunde).
let fisherMood=1,fisherEscaped=false,fisherLast=0;
function fisherBubble(){
 const b=$("fisher-bubble"),now=performance.now()/1000,dt=Math.min(.25,Math.max(0,now-(fisherLast||now)));fisherLast=now;
 {const bino=screen==="play"&&state.bino>0;$("fog-layer").style.opacity=screen==="play"?String(fogAt(state.elapsed)*(bino?.12:.92)):"0";$("bino-layer").hidden=!bino;}
 // Wildschwein-Verfolgung (Level 4) nutzt dieselbe Bubble mit eigenem Porträt.
 if(screen==="play"&&state.phase==="playing"&&state.boar>0){const gap=state.boarGap||14,mood=gap<6?4:3;b.hidden=false;b.dataset.who="boar";b.dataset.mood=mood;b.classList.toggle("near",mood===4);b.classList.toggle("attack",false);b.classList.toggle("flash",gap<5);b.classList.toggle("with-touch",!$("touch-controls").hidden);
  $("fb-state").textContent=t(mood===4?"boarClose":state.elapsed>=337.5?"boarRaceTitle":"boarChase");$("fb-note").textContent=t("boarNote",{s:Math.ceil(state.boar/20)});$("fb-meter").style.width=Math.round(Math.max(0,Math.min(1,1-(gap-3)/13))*100)+"%";return;}
 if(screen==="play"&&state.phase==="playing"&&state.dog>0){const gap=state.dogGap||14,mood=gap<6?4:3;b.hidden=false;b.dataset.who="bees";b.dataset.mood=mood;b.classList.toggle("near",mood===4);b.classList.toggle("attack",false);b.classList.toggle("flash",gap<5);b.classList.toggle("with-touch",!$("touch-controls").hidden);
  $("fb-state").textContent=t(mood===4?"beesClose":"beesChase");$("fb-note").textContent=t("beesNote",{m:Math.max(0,Math.ceil(300-(state.distance-(state.beeNest||state.distance))))});$("fb-meter").style.width=Math.round(Math.max(0,Math.min(1,1-(gap-3)/13))*100)+"%";return;}
 b.dataset.who="fisher";
 const angry=state.angry||0,fish=state.fish||0;if(angry>0)fisherEscaped=false;
 const gap=state.chaseGap||16,attacking=angry>30&&((state.nextCastTick-state.tick)<10||state.objects.some(o=>o.kind==="hook"&&o.landTick&&state.tick<o.landTick)),target=angry>0?(gap<7||attacking?4:3):fisherEscaped?1:fish>=10?2:1;
 if(!paused)fisherMood=target>=fisherMood?target:Math.max(target,fisherMood-.35*dt);
 const cooling=!angry&&fisherMood>target+.02,show=screen==="play"&&state.phase==="playing"&&(getStage(state.elapsed)===2||angry>0||cooling);
 b.hidden=!show;if(!show)return;
 const mood=Math.max(1,Math.min(4,Math.round(fisherMood)));b.dataset.mood=mood;b.classList.toggle("near",mood===4);b.classList.toggle("attack",attacking);b.classList.toggle("flash",angry>0&&gap<6);b.classList.toggle("with-touch",!$("touch-controls").hidden);
 $("fb-state").textContent=t(["fbCalm","fbNoticed","fbAngry","fbFurious"][mood-1]);
 let note,meter;
 if(angry>0){note=t(attacking?"fbNoteAttack":"fbNoteChase",{s:Math.ceil(angry/20)});meter=1-(gap-4)/12;}
 else if(cooling){note=t("fbNoteCooling");meter=(fisherMood-1)/3;}
 else if(fish<10&&!fisherEscaped){note=t("fbNoteCalm",{n:fish});meter=fish/10;}
 else if(fish<20&&!fisherEscaped){note=t("fbNoteNoticed",{n:fish});meter=(fish-10)/10;}
 else{note=t("fbNoteRelaxed",{n:fish});meter=0;}
 $("fb-note").textContent=note;$("fb-meter").style.width=Math.round(Math.max(0,Math.min(1,meter))*100)+"%";
}
function hideLevelBanner(){clearTimeout(bannerTimer);$("level-banner").classList.remove("visible");$("level-banner").hidden=true;}
function toast(value,seconds=1.8){$("toast").textContent=value;$("toast").classList.add("visible");toastUntil=time+seconds;}
function updateCopy(){
 document.documentElement.lang=lang;document.querySelectorAll("[data-i18n]").forEach(e=>e.textContent=t(e.dataset.i18n));document.querySelectorAll("[data-label]").forEach(e=>e.setAttribute("aria-label",t(e.dataset.label)));
 $("language").value=lang;$("quick-buttons").classList.toggle("off",!buttons);$("quick-buttons").setAttribute("aria-pressed",String(buttons));$("quick-sound").classList.toggle("muted",!sound);$("quick-sound").setAttribute("aria-label",t(sound?"soundOn":"soundOff"));$("quick-sound").setAttribute("aria-pressed",String(sound));
 $("start").querySelector("span").textContent=t(loaded?"start":"loading");$("best-score").textContent=best()?fmt(best()):"—";
 $("challenge").hidden=!q.has("challenge");$("challenge").textContent=t("challenge",{score:fmt(target)});
 document.querySelectorAll("[data-route]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.route===route)));
 $("sound-toggle").checked=sound;$("music-toggle").checked=music;$("music-toggle").disabled=!sound;$("assist-toggle").checked=mode==="relaxed";$("reduce-toggle").checked=reduced;$("contrast-toggle").checked=contrast;$("buttons-toggle").checked=buttons;
 $("tilt-toggle").textContent=t(tilt?"deactivate":"activate");$("tilt-status").textContent=t(tilt?"tiltOn":"tiltHelp");
 app.classList.toggle("reduced",reduced);app.classList.toggle("high-contrast",contrast);
 for(const [key,value]of Object.entries(bindings)){const b=$("bind-"+key);b.textContent=t(key)+" "+value.replace("ArrowLeft","←").replace("ArrowRight","→").replace("ArrowUp","↑").replace("ArrowDown","↓").replace("Key","").replace("Space","␣");b.setAttribute("aria-label",t(key)+": "+value);}
 updateMenu();if(screen==="result")resultCopy();hud();
}
function setScreen(next){if(next!=="result"){hideBoard();if($("name-dialog").open&&!run.saving)$("name-dialog").close();}$("splash").hidden=true;app.dataset.front="menu";screen=next;app.dataset.screen=next;$("home").hidden=next!=="home";$("hud").hidden=next==="home";$("result").hidden=next!=="result";$("pause-overlay").hidden=true;$("touch-controls").hidden=next!=="play"||!buttons;paused=false;}
function dispatch(action){if(!validateAction(state,player,action).ok)return false;state=applyAction(state,player,action);processEvents();return true;}
function inTurn(){return state.nextTurn>0&&state.nextTurn-state.distance<=state.speed*1.6&&state.nextTurn>state.distance;}
function input(kind){
 if(screen!=="play"||paused||introElapsed>=0||countdown>0||document.querySelector("dialog[open]"))return;
 if(kind==="left"||kind==="right"){
  const dir=kind==="left"?-1:1;
  // In der Kurve: nur die richtige Richtung nimmt die Kurve (einmal). Alles andere wechselt die Spur.
  const need=turnDirection(state.seed,state.summitTurn,state.turnIndex);
  if(inTurn()&&state.turnChoice!==need&&dir===need)dispatch({type:"turn",direction:dir});
  else if(!tilt)dispatch({type:"steer",lane:Math.max(0,Math.min(2,Math.round(state.target)+dir))});
 }else if(kind==="power"&&state.climbReady>0&&!(state.climb>0))dispatch({type:"climb"});
 else dispatch({type:kind});
}
// TEST-CHEAT: ?level=N in der Adresse startet direkt im Level N (1–10).
// Beispiel: https://…/?level=7 – Bestwerte werden dabei nicht gespeichert.
// Level direkt wählen kann nur der Admin (Einstellungen → Admin-Zugang). «?level=» in der Adresse gilt nicht mehr.
const urlLevel=1;let testLevel=1;
function skipToLevel(){
 if(testLevel<=1||state.phase!=="playing")return;
 const tick=stages[testLevel-1].start*20,relaxed=state.mode==="relaxed";let distance=0;
 for(let i=1;i<=tick;i++)distance+=baseSpeed(i*.05,relaxed)*.05;
 let turnIndex=0,heading=0;
 while(260+turnIndex*680<=distance){heading+=turnDirection(state.seed,0,turnIndex)*Math.PI/2;turnIndex++;}
 const elapsed=tick*.05;
 state={...state,tick,elapsed,distance,score:Math.floor(distance),turnIndex,turns:turnIndex,heading,nextTurn:260+turnIndex*680,turnChoice:0,
  nextRow:distance+30,row:Math.floor(distance/24),checkpoints:Math.floor(elapsed/120),nextHeartAt:elapsed+20,objects:[],events:[]};
 renderDistance=distance;introElapsed=INTRO_DURATION;
}
let runBest=0,bestAnnounced=false;
function start(){
 if(!loaded)return;if(run.saving)return;$("name-dialog").open&&$("name-dialog").close();hideBoard();runBest=best();bestAnnounced=false;countToken=0;watchBoard(false);hideLevelBanner();crowsSeen=new Set();forestSec=0;forestSounds.clear();meadowSec=0;meadowSounds.clear();lakeSec=0;lakeSounds.clear();fisherMood=1;fisherEscaped=false;$("power-callout").getAnimations().forEach(a=>a.cancel());$("power-callout").textContent="";$("heart-feedback").hidden=true;state=setup([player]);if(!challengeSeed)seed=1+Math.floor(Math.random()*2147483646);/* jede Runde anders: Strecke, Kurven, Hindernisse – Herausforderungs-Links behalten ihren Startwert */dispatch({type:"start",seed,mode,route});setScreen("play");acc=0;renderDistance=0;countdown=0;introElapsed=0;lastCount=-1;resultSaved=false;tiltBase=null;$("countdown").hidden=true;$("countdown").textContent="";
 audio.unlock().catch(()=>{});audio.setActive(true);controls.reset();scene?.resetEffects();$("feedback-label").textContent="";celebrateAt=null;highSeen.clear();skipToLevel();hud();
}
function home(){if(run.saving)return;introElapsed=-1;hideLevelBanner();audio.setChase(false);$("power-callout").getAnimations().forEach(a=>a.cancel());$("power-callout").textContent="";$("heart-feedback").hidden=true;audio.setActive(true);scene?.resetEffects();$("feedback-label").textContent="";state=setup([player]);setScreen("home");selectMenu("run");countdown=0;renderDistance=0;$("countdown").hidden=true;$("turn-cue").hidden=true;$("tutorial").hidden=true;$("powerup").hidden=true;$("resort-arrival").hidden=true;updateCopy();}
function pause(value=true){if(screen!=="play")return;paused=value;acc=0;$("pause-overlay").hidden=!value;if(value){audio.setActive(false);$("resume").focus();}else {audio.unlock().catch(()=>{});audio.setActive(true);}}
function openDialog(id){if(screen==="play"&&!paused)pause(true);$(id).showModal();}
// Ergebnis-Seite: Titel, Punkte, Statistik (Level, Strecke, Münzen, Bestleistung) und Ranglistenplatz.
let recordInfo={isNew:false,previous:0},countToken=0;
function resultCopy(){
 const won=state.phase==="won",test=testLevel>1,level=Math.min(stages.length,getStage(state.elapsed)+1),top=best();
 $("result-title").textContent=won?t("won"):t("gameOver");
 $("result-kicker").textContent=won?t("wonKicker"):"HORNOX RUN";
 if(!countToken)$("result-score").textContent=fmt(state.score);
 const badge=$("result-badge");badge.hidden=!recordInfo.isNew;badge.textContent=t("recordBadge");$("result").classList.toggle("is-record",recordInfo.isNew);
 $("stat-level").textContent=t("levelsOf",{n:level,total:stages.length})+" · "+t(stages[level-1].key).split(" · ")[0];
 $("stat-distance").textContent=fmt(state.distance)+" m";$("stat-coins").textContent=fmt(state.coins||0);$("stat-best").textContent=top?fmt(top):"—";
 $("result-note").textContent=won?t("wonText",{coins:fmt(state.coins||0)}):test?t("testRunNote",{n:testLevel}):!recordInfo.isNew&&top>state.score?t("recordGap",{n:fmt(top-Math.floor(state.score))}):t("lostText",{distance:fmt(state.distance),coins:fmt(state.coins||0)});

}
// Punktestand zählt beim Game Over kurz hoch (ohne Animation bei «Weniger Kamerabewegung»).
function countUp(){const node=$("result-score"),end=Math.floor(state.score),token=++countToken,t0=performance.now(),dur=reduced?0:900;
 const step=now=>{if(token!==countToken)return;const u=dur?Math.min(1,(now-t0)/dur):1;node.textContent=fmt(end*(1-Math.pow(1-u,3)));if(u<1)requestAnimationFrame(step);else countToken=0;};requestAnimationFrame(step);}
// Rangliste: die 10 besten Läufe auf diesem Gerät. Test-Läufe (?level=N) zählen mit und sind markiert,
// verändern aber den offiziellen Bestwert nicht.
// ---------- Globale Rangliste (für alle Spieler gleich, online gespeichert) ----------
// Ablauf: Game Over → «Weiter zur Rangliste» → Name + E-Mail → speichern → Rangliste mit eigenem Platz.
const board=createLeaderboard();
const newId=()=>crypto.randomUUID?crypto.randomUUID():"10000000-1000-4000-8000-100000000000".replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
let playerId=(()=>{let id=read("hornox.player.id");if(!id){id=newId();save("hornox.player.id",id);}return id;})();
let playerName=read("hornox.player.name")||"",playerEmail=read("hornox.player.email")||"",boardTimer=0,viewTimer=0;
// Pro Lauf eine eigene ID: wird derselbe Lauf mehrmals gesendet (Doppelklick, Netzwerk), speichert die Datenbank ihn nur einmal.
let run={id:null,saved:null,saving:false},viewLimit=50;
const medal=r=>r===1?"🥇":r===2?"🥈":r===3?"🥉":"";
const validEmail=v=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)&&v.length<=254;
const runLevel=()=>Math.min(stages.length,getStage(state.elapsed)+1);
function boardRow(e,isMe){const li=document.createElement("li"),n=document.createElement("b"),main=document.createElement("div"),who=document.createElement("strong"),info=document.createElement("small"),pts=document.createElement("span");
 const rank=Number(e.rank);if(isMe)li.className="me";n.textContent=(medal(rank)?medal(rank)+" ":"")+rank+".";who.textContent=e.name+(isMe?" · "+t("you"):"");
 info.textContent=t("levelsReached",{n:e.best_level,total:stages.length});pts.className="pts";pts.textContent=fmt(e.best_score);main.append(who,info);li.append(n,main,pts);return li;}
const emptyRow=text=>Object.assign(document.createElement("li"),{className:"empty",textContent:text});
const boardError=err=>err?.offline?t("globalOffline"):err?.network?t("globalNetwork"):t("globalError");

// Rekorde-Tab im Startmenü: Top 10 + eigener Platz (mit Nachbarn), aktualisiert sich alle 8 Sekunden.
async function refreshBoard(){
 if(!board.configured){$("global-status").textContent=t("globalOffline");$("global-list").replaceChildren();$("global-me").hidden=true;return;}
 try{const [top,me]=await Promise.all([board.top(50,0,playerId),board.standing(playerId)]);
  $("global-status").textContent=me?.total||top.length?t("globalCount",{n:fmt(me?.total||top.length)}):"";
  $("global-list").replaceChildren(...(top.length?top.map(e=>boardRow(e,e.is_me)):[emptyRow(t("globalEmpty"))]));
  const box=$("global-me");if(me?.rank>50){const around=await board.top(3,me.rank-2,playerId),ol=document.createElement("ol");ol.append(...around.map(e=>boardRow(e,e.is_me)));box.replaceChildren(Object.assign(document.createElement("p"),{className:"sep",textContent:"⋯"}),ol);box.hidden=false;}else box.hidden=true;
 }catch(err){$("global-status").textContent=boardError(err);}
}
function watchBoard(on){clearInterval(boardTimer);boardTimer=0;if(on){refreshBoard();boardTimer=setInterval(()=>{if(!document.hidden)refreshBoard();},8000);}}

// Eingabefenster: Name und E-Mail (beide Pflicht), danach speichern und Rangliste zeigen.
function openSave(){
 const d=$("name-dialog");$("name-input").value=playerName;$("email-input").value=playerEmail;$("name-error").hidden=true;
 for(const id of["name-input","email-input"])$(id).removeAttribute("aria-invalid");
 $("save-summary").textContent=t("saveSummary",{score:fmt(state.score),n:runLevel(),total:stages.length});
 const terms=$("terms-link");terms.hidden=!LEADERBOARD.termsUrl;if(LEADERBOARD.termsUrl)terms.href=LEADERBOARD.termsUrl;
 setSaving(false);d.showModal();(playerName?$("email-input"):$("name-input")).focus();
}
function setSaving(on){run.saving=on;const b=$("save-button");b.disabled=on;b.classList.toggle("busy",on);b.querySelector("span").textContent=t(on?"saving":"saveButton");$("to-board").disabled=on;}
function formError(msg,field){const e=$("name-error");e.textContent=msg;e.hidden=false;for(const id of["name-input","email-input"])$(id).toggleAttribute("aria-invalid",id===field);if(field)$(field).focus();}
$("name-later").onclick=()=>{if(!run.saving)$("name-dialog").close();};
$("name-dialog").addEventListener("cancel",e=>{if(run.saving)e.preventDefault();});
$("name-form").onsubmit=async e=>{e.preventDefault();if(run.saving)return;
 const name=$("name-input").value.trim().slice(0,20),email=$("email-input").value.trim().toLowerCase();
 if(!name)return formError(t("nameMissing"),"name-input");
 if(!email)return formError(t("emailMissing"),"email-input");
 if(!validEmail(email))return formError(t("emailInvalid"),"email-input");
 $("name-error").hidden=true;setSaving(true);
 try{const st=await board.saveRun({id:playerId,runId:run.id,name,email,score:state.score,level:runLevel(),coins:state.coins||0});
  if(!st||!st.rank)throw Error("rank");
  playerName=name;playerEmail=email;save("hornox.player.name",name);save("hornox.player.email",email);
  // Gleiche E-Mail auf einem anderen Gerät: die Datenbank führt die Läufe unter einer Spieler-ID zusammen.
  if(st.player_id&&st.player_id!==playerId){playerId=st.player_id;save("hornox.player.id",playerId);}
  run.saved={...st,score:Math.floor(state.score),level:runLevel(),at:new Date()};setSaving(false);$("name-dialog").close();showBoard();
 }catch(err){setSaving(false);formError(err?.detail==="invalid email"?t("emailInvalid"):err?.detail==="name required"?t("nameMissing"):t("saveError")+" "+boardError(err));}
};

// Ranglisten-Ansicht nach dem Speichern: alle Spieler nach Punkten, eigener Eintrag hervorgehoben.
function showBoard(){$("board-view").hidden=false;viewLimit=50;renderBoardView(true);clearInterval(viewTimer);viewTimer=setInterval(()=>{if(!document.hidden&&!$("board-view").hidden)renderBoardView(false);},8000);$("board-again").focus();}
function hideBoard(){clearInterval(viewTimer);viewTimer=0;$("board-view").hidden=true;}
async function renderBoardView(scroll){
 const test=testLevel>1,sv=run.saved;
 $("board-title").textContent=sv?t(sv.rank===1?"boardFirst":"boardPlace",{n:fmt(sv.rank)}):t("globalTitleShort");
 $("board-sub").textContent=sv?t(Number(sv.total)===1?"boardOf1":"boardOf",{total:fmt(sv.total)}):test?t("globalTestRun"):"";
 $("board-saved").hidden=!sv;if(sv)$("board-saved").textContent="✓ "+t("boardSaved",{score:fmt(sv.score),n:sv.level,total:stages.length,date:sv.at.toLocaleString(({en:"en-GB",de:"de-CH",fr:"fr-CH",ja:"ja-JP",zh:"zh-CN"})[lang],{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"})});
 if(!board.configured){$("board-status").textContent=t("globalOffline");$("board-list").replaceChildren();$("board-more").hidden=true;return;}
 if(scroll)$("board-status").textContent=t("boardLoading");
 try{const [list,me]=await Promise.all([board.top(viewLimit+1,0,playerId),board.standing(playerId)]);
  const more=list.length>viewLimit,rows=list.slice(0,viewLimit).map(e=>boardRow(e,e.is_me));
  if(me?.rank>viewLimit){const around=await board.top(3,me.rank-2,playerId);rows.push(Object.assign(document.createElement("li"),{className:"sep",textContent:"⋯"}),...around.map(e=>boardRow(e,e.is_me)));}
  $("board-list").replaceChildren(...(rows.length?rows:[emptyRow(t("globalEmpty"))]));$("board-more").hidden=!more;
  if(me?.rank&&sv&&me.rank!==sv.rank){sv.rank=me.rank;sv.total=me.total;$("board-title").textContent=t(sv.rank===1?"boardFirst":"boardPlace",{n:fmt(sv.rank)});$("board-sub").textContent=t(Number(sv.total)===1?"boardOf1":"boardOf",{total:fmt(sv.total)});}
  else if(sv&&me?.total){sv.total=me.total;$("board-sub").textContent=t(Number(sv.total)===1?"boardOf1":"boardOf",{total:fmt(sv.total)});}
  $("board-status").textContent=t("boardLive");
  if(scroll)$("board-list").querySelector("li.me")?.scrollIntoView({block:"center"});
 }catch(err){$("board-status").textContent=boardError(err);}
}
$("board-more").onclick=()=>{viewLimit+=50;renderBoardView(false);};
$("board-back").onclick=()=>{hideBoard();$("to-board").focus();};
$("board-again").onclick=()=>start();
// «Weiter zur Rangliste»: einmal speichern, danach direkt zur Rangliste. Trainingsläufe (Start ab Level 2+) zählen nicht.
$("to-board").onclick=()=>{if(run.saving)return;if(run.saved||testLevel>1)showBoard();else openSave();};
function finish(){if(resultSaved)return;resultSaved=true;run={id:newId(),saved:null,saving:false};audio.setChase(false);audio.setActive(false);
 const previous=best(state.route,state.mode);recordInfo={previous,isNew:testLevel<=1&&Math.floor(state.score)>previous&&state.score>0};if(recordInfo.isNew)save(bestKey(state.route,state.mode),Math.floor(state.score));
 setScreen("result");$("turn-cue").hidden=true;$("tutorial").hidden=true;$("resort-arrival").hidden=true;$("powerup").hidden=true;$("fisher-bubble").hidden=true;countToken=0;resultCopy();countUp();if(recordInfo.isNew)audio.play("pickup",1.7,.8);$("again").focus();}
function heartFeedback(gained){const node=$('heart-feedback');node.querySelector('span').textContent=t(gained?'heartGain':'heartFull');node.hidden=false;node.getAnimations().forEach(a=>a.cancel());const target=$('lives').getBoundingClientRect(),x=target.left+target.width/2-innerWidth/2,y=target.top+target.height/2-innerHeight*.40;node.animate(reduced?[{opacity:1},{opacity:1,offset:.75},{opacity:0}]:[{opacity:0,transform:'translate(-50%,-50%) scale(.6)'},{opacity:1,transform:'translate(-50%,-50%) scale(1.15)',offset:.18},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.60},{opacity:0,transform:`translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) scale(.22)`}],{duration:reduced?1000:1350,fill:'forwards'});audio.play('pickup',1.6,.85);}
// Level-Sammelobjekte und Bergladen: Symbol je Zone, Laden-Dialog am Ende jedes Levels.
const ITEM_ICON={3:"🗺️",6:"🍞",7:"🐟",8:"🌰",1:"🌼",9:"🐸",4:"🦯",0:"⛏️",10:"🔦",5:"🇨🇭"};
const itemIcon=()=>ITEM_ICON[getZone(state.elapsed)]??"🪙",itemName=()=>t("itemName"+getZone(state.elapsed));
function renderShop(){
 const n=state.items||0,ic=itemIcon();$("shop-level").textContent=t(stages[Math.min(9,Math.floor(state.elapsed/90))].key);
 $("shop-text").textContent=t("shopText",{n,icon:ic,name:itemName()});$("shop-cost5").textContent="5 "+ic;$("shop-cost10").textContent="10 "+ic;
 for(const offer of[5,10])$("shop-buy"+offer).disabled=!validateAction(state,player,{type:"shop",offer}).ok;
 $("shop-note").textContent=state.lives>=5?t("shopFull"):n<5?t("shopNeed",{n:5-n,icon:ic}):t("shopNote");
}
function openShop(){if($("shop-dialog").open)return;renderShop();$("shop-dialog").showModal();$("shop-buy5").disabled?$("shop-leave").focus():$("shop-buy5").focus();}
function closeShop(){if(state.shop)dispatch({type:"shopClose"});if($("shop-dialog").open)$("shop-dialog").close();}
function buy(offer){if(!dispatch({type:"shop",offer}))return;audio.play("pickup",1.7,.9);heartFeedback(true);renderShop();if($("shop-buy5").disabled&&$("shop-buy10").disabled)$("shop-leave").focus();}
$("shop-buy5").onclick=()=>buy(5);$("shop-buy10").onclick=()=>buy(10);$("shop-leave").onclick=closeShop;$("shop-dialog").addEventListener("close",()=>{if(state.shop)dispatch({type:"shopClose"});});
// Level 8–10: Abschnitts-Hinweise, Windböen, schmale Gratstellen, Solvayhütte und Gipfel-Endspurt.
const highSeen=new Set();
let climbHintAt=-99;
function highAmbience(){
 if(screen==="play"&&!paused&&state.phase==="playing"&&state.climbReady>0&&!(state.climb>0)&&time-climbHintAt>6){climbHintAt=time;toast(t("climbHint"),2.4);}
 if(paused||screen!=="play"||state.phase!=="playing")return;const el=state.elapsed,once=(k,f)=>{if(!highSeen.has(k)){highSeen.add(k);f();}};
 const gs=glacierSection(el);if(gs)once("g"+gs,()=>toast(t("glacierSec"+gs),3));
 for(const [fn,z,key] of[[ridgeNarrow,10,"ridgeNarrow"],[summitNarrow,5,"summitNarrow"]]){const n=fn(el+3);if(n>=0&&fn(el+3.2)===n&&fn(el)<0)once(key+Math.floor(el),()=>{bigAlert(t(key+(n===0?"L":"R")));audio.play("pickup",.7,.6);});}
 if(el>=720&&el<722)once("ridge",()=>toast(t("ridgeIntro"),3.2));
 if(el>=SOLVAY_AT-2&&el<SOLVAY_AT)once("solvay",()=>toast(t("solvayHut"),3));
 if(el>=810&&el<812)once("summit",()=>toast(t("summitIntro"),3.2));
 if(el>=889&&el<891)once("final",()=>bigAlert(t("summitFinal")));
}
function processEvents(){
 for(const e of state.events){scene?.emit(e,state);if(["jump","duck","land","pickup","bump"].includes(e.kind))audio.play(e.kind,e.kind==="pickup"?1+(state.chain%8)*.035:1);
 if(e.kind==="pickup"&&!reduced){$("coins").getAnimations().forEach(a=>a.cancel());$("coins").animate([{transform:"scale(1.35)",color:"#ffe6a2"},{transform:"scale(1)",color:"#fff6dc"}],{duration:240});}
 if(["clear","nearMiss","combo"].includes(e.kind)){const label=$("feedback-label");label.textContent=t(e.kind==="clear"?"nice":e.kind==="nearMiss"?"nearMiss":"comboCall",{n:state.multiplier});label.getAnimations().forEach(a=>a.cancel());label.animate(reduced?[{opacity:1},{opacity:0}]:[{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.08)",offset:.2},{opacity:1,transform:"translate(-50%,-6px) scale(1)",offset:.7},{opacity:0,transform:"translate(-50%,-22px) scale(1)"}],{duration:1000,fill:"forwards"});audio.play("pickup",e.kind==="combo"?1.5:1.25,.6);}
 if(e.kind==="doubleJump"){audio.play("jump",1.3,.8);toast(t("doubleJump"),.8);}
 if(e.kind==="powerReady"){toast(t("powerReady"),2.8);audio.play("pickup",1.8,.7);}
 if(e.kind==="powerStart"){const n=$("power-callout");n.textContent=t("powerName");n.getAnimations().forEach(a=>a.cancel());n.animate([{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.05)",offset:.18},{opacity:1,offset:.72},{opacity:0,transform:"translate(-50%,-14px) scale(1)"}],{duration:1500,fill:"forwards"});audio.play("jump",.72,.8);audio.play("pickup",1.5,.7);}
 if(e.kind==="climbStart"){const n=$("power-callout");n.textContent=t("climbName");n.getAnimations().forEach(a=>a.cancel());n.animate([{opacity:0,transform:"translate(-50%,12px) scale(.8)"},{opacity:1,transform:"translate(-50%,0) scale(1.05)",offset:.18},{opacity:1,transform:"translate(-50%,0) scale(1)",offset:.75},{opacity:0,transform:"translate(-50%,-8px) scale(1)"}],{duration:1400,easing:"ease-out"});toast(t("climbOn"),2.4);audio.play("pickup",1.2,.8);}
 if(e.kind==="powerClear")audio.play("pickup",1.3,.55);
 if(e.kind==="powerPickup"){toast(t(e.power),2.5);audio.play("pickup",1.6,.8);if(e.power==="pickupBoost")bigAlert("💰 2×");if(e.power==="pickupClimb"){bigAlert(t("climbHint"));climbHintAt=time;}}
 if(e.kind==="heart")heartFeedback(e.gained);if(e.kind==="world"&&e.gained)heartFeedback(true);
 if(e.kind==="luckSaved"){bigAlert("🍀 "+t("luckSaved",{n:e.lost}));audio.play("pickup",1.3,.8);}
 if(e.kind==="gustWarn"){bigAlert(t(e.dir>0?"gustRight":"gustLeft"));audio.play("pickup",.6,.7);}
 if(e.kind==="gust")audio.play("bump",.7,.5);
 if(e.kind==="world"){levelBanner(e.stage);setTimeout(()=>{if(screen==="play")toast(t("itemIntro",{icon:itemIcon(),name:itemName()}),3.2);},2600);}
 if(e.kind==="token"||e.kind==="fishCatch"){if(e.kind==="token")audio.play("pickup",1.5,.7);/* gleicher Ton wie beim Fisch */if(!reduced){$("items").getAnimations().forEach(a=>a.cancel());$("items").animate([{transform:"scale(1.4)"},{transform:"scale(1)"}],{duration:260});}}
 if(e.kind==="shopOpen")openShop();   // beim Eintreten in den Laden immer sofort öffnen
 if(e.kind==="bump")toast(t(["serac","ropeTeam","snowBridge","fixRope","rockStep"].includes(e.object)?e.object+"Bump":e.object==="sheep"?"sheepBump":e.object==="fish"?"fishBump":e.object==="beaverLog"?"beaverBump":e.object==="tongue"||e.object==="frog"?"tongueBump":e.object==="floatLog"?"floatLogBump":e.object==="hook"?"hookBump":e.object==="fenceTall"?"fenceTallBump":["rockFace","ledge"].includes(e.object)?"rockBump":e.object==="looseRocks"?"looseBump":e.object==="railLane"?"railBump":e.object==="signpost"?"signBump":["metalStrut","beamLow","overhang"].includes(e.object)?"duckBump":e.object==="ridgeGap"?"abyssBump":e.object==="fence"||e.object==="fenceLow"?"fenceBump":"bump"));else if(e.kind==="checkpoint")toast(t("checkpoint"),2.5);else if(e.kind==="arrival"){$("toast").classList.remove("visible");toastUntil=0;}else if(e.kind==="magnet")toast(t("magnet"),2.3);else if(e.kind==="fishCatch")audio.play("pickup",1.5,.7);else if(e.kind==="fisherNotice"){toast(t("fisherNotice"),3.2);audio.play("pickup",.8,.7);}else if(e.kind==="gull"){toast(t(e.lost>0?"gullSteal":"gullEmpty",{n:e.lost}),2.4);audio.play("bump",1.6,.6);}else if(e.kind==="fisherAngry"){bigAlert(t("fisherAngry"));toast(t("fisherHint"),3);}else if(e.kind==="splash"){toast(t("splash"),2.6);audio.synth("splash",1);}else if(e.kind==="slip"){toast(t("slip"),1.6);audio.play("duck",.8,.6);}else if(e.kind==="mudStuck"){toast(t("mudStuck"),2);audio.synth("stream",1);try{navigator.vibrate?.(80);}catch{}}else if(e.kind==="beeBuzz"){toast(t("beeBuzz"),2.6);audio.synth("buzz",1);}else if(e.kind==="honey"){toast(t("honeyTaken",{n:e.points}),2.4);audio.play("pickup",1.3,.8);audio.synth("buzz",1.4);}else if(e.kind==="beesAppear"){bigAlert(t("beesAlert"));setTimeout(()=>toast(t("beesHint"),3.2),900);audio.synth("buzz",1.4);}else if(e.kind==="beeSting"){const f=$("hit-flash");f.getAnimations().forEach(a=>a.cancel());f.animate([{opacity:.75},{opacity:0}],{duration:650,easing:"ease-out"});toast(t(e.hurt?"beeSting":"beeStingSlow"),2.6);audio.synth("buzz",1.4);try{navigator.vibrate?.(160);}catch{}}else if(e.kind==="beesQuit"){toast(t(e.escaped?"beesEscaped":"beesQuit"),2.8);if(e.escaped)audio.play("pickup",1.6,.7);}else if(e.kind==="meadowPickup"){toast(t("pick_"+e.item,{n:e.points}),1.6);audio.play(e.item==="goldBell"?"pickup":"pickup",e.item==="edelweiss"?2.4:e.item==="goldBell"?1.2:1.7,.9);if(e.item==="goldBell")audio.synth("cowbell",.8);}else if(e.kind==="boarGrunt"){toast(t("boarGrunt"),2.6);audio.synth("grunt",.7);}else if(e.kind==="boarAppear"){bigAlert(t("boarAlert"));toast(t("boarHint"),3);audio.synth("grunt",1.2);}else if(e.kind==="boarRace"){bigAlert(t("boarRaceAlert"));toast(t("boarRaceHint"),3);audio.synth("grunt",1.3);}else if(e.kind==="boarRam"){const f=$("hit-flash");f.getAnimations().forEach(a=>a.cancel());f.animate([{opacity:.75},{opacity:0}],{duration:650,easing:"ease-out"});toast(t("boarRam"),2.4);audio.play("bump",.8,.9);try{navigator.vibrate?.(160);}catch{}}else if(e.kind==="boarQuit")toast(t("boarQuit"),2.6);else if(e.kind==="mushroom"){toast(t("mushroom"),1.6);audio.play("pickup",2,.8);}else if(e.kind==="fisherCast")audio.play("jump",.55,.55);else if(e.kind==="hooked"){const f=$("hit-flash");f.getAnimations().forEach(a=>a.cancel());f.animate([{opacity:.75},{opacity:0}],{duration:650,easing:"ease-out"});try{navigator.vibrate?.(140);}catch{}}else if(e.kind==="fisherQuit"){fisherEscaped=true;toast(t("fisherQuit"),2.6);audio.play("pickup",1.1,.8);}else if(e.kind==="crow"){toast(t(e.lost>0?"crowHit":"crowHitEmpty",{n:e.lost}),2.4);audio.play("bump",1.4,.8);}else if(e.kind==="shieldHit")toast(t("shieldHit"));else if(e.kind==="missedTurn")toast(t("turnMiss"));}
}
// Level 4 «Furi · Waldpfad»: Abschnitts-Hinweise, heller/dunkler Wald und Waldgeräusche.
let forestSec=0,nextChirp=0,nextWind=0,nextGrunt=0,nextHoof=0,nextWater=0;const forestSounds=new Set();
function forestAmbience(){
 const sec=screen==="play"&&state.phase==="playing"?forestSection(state.elapsed):0,now=performance.now()/1000;
 $("forest-shade").dataset.sec=String(sec);
 if(sec!==forestSec){if(sec>0)toast(t("forestSec"+sec),3.2);forestSec=sec;}
 audio.setChase(screen==="play"&&state.phase==="playing"&&!paused&&(state.boar>0||state.dog>0));
 if(!sec||paused)return;
 if(now>nextChirp){nextChirp=now+(sec===2||sec===4?4.5:2.2)+Math.random()*2.5;audio.synth("chirp",.9);}
 if(now>nextWind){nextWind=now+6+Math.random()*4;audio.synth("wind",sec===4?1.3:.9);}
 if(state.boar>0&&now>nextGrunt){nextGrunt=now+(state.boarGap<6?1.6:3.2);audio.synth("grunt",state.boarGap<6?1:.6);}
 if(state.boar>0&&now>nextHoof){nextHoof=now+(state.boarGap<6?.24:.34);audio.synth("hoof",Math.max(.35,Math.min(1.1,1.4-(state.boarGap||14)/14)));}
 if((bridgeAt(state.elapsed)||sec===3)&&now>nextWater){nextWater=now+2.8;audio.synth("water",bridgeAt(state.elapsed)?1.2:.6);}
 for(const o of state.objects){const gap=(o.d-state.distance)/Math.max(1,state.speed);if(forestSounds.has(o.id))continue;
  if(o.kind==="plankGap"&&gap<1.05){forestSounds.add(o.id);audio.synth("plank",1);}
  else if(o.kind==="fallingBranch"&&gap<1.0){forestSounds.add(o.id);audio.synth("crack",1);}
  else if(o.kind==="stream"&&gap<2){forestSounds.add(o.id);audio.synth("stream",1);}}
 if(forestSounds.size>200)forestSounds.clear();
}
// Level 5 «Alpweiden»: Abschnitte, Morgenlicht, Uhrzeit, Challenge-Ankündigungen und Wiesengeräusche.
let meadowSec=0,nextBird=0,nextMeadowWind=0,nextBell=0,nextStep=0,nextBark=0,nextPaws=0;const meadowSounds=new Set();
function meadowAmbience(){
 const sec=screen==="play"&&state.phase==="playing"?meadowSection(state.elapsed):0,now=performance.now()/1000,el=state.elapsed;
 $("meadow-light").dataset.sec=String(sec);
 if(sec!==meadowSec){if(sec>0)toast(t("meadowSec"+sec),3.2);meadowSec=sec;}
 if(!sec||paused)return;
 const ahead=(w,lead)=>el>=w[0]-lead&&el<w[0]-lead+.25;
 if(now>nextBird){nextBird=now+(sec===1?1.6:3)+Math.random()*2;audio.synth("chirp",.8);}
 if(now>nextMeadowWind){nextMeadowWind=now+7+Math.random()*4;audio.synth("wind",.6);}
 if(now>nextStep){nextStep=now+.3;audio.synth("step",.6);}
 if(state.dog>0&&now>nextBark){nextBark=now+(state.dogGap<6?.45:1.1);audio.synth("buzz",Math.max(.35,Math.min(1.1,1.3-(state.dogGap||14)/14)));}
 for(const o of state.objects){if(meadowSounds.has(o.id))continue;const gap=(o.d-state.distance)/Math.max(1,state.speed);
  if(o.kind==="fenceTall"&&gap<2.4){meadowSounds.add(o.id);if(!meadowSounds.has("tallHint")){meadowSounds.add("tallHint");toast(t("fenceTallHint"),2.8);}}}
 if(meadowSounds.size>300)meadowSounds.clear();
}
// Level 6 «Schwarzsee»: Abschnitte, Steinpfad- und Froschwarnungen, Seegeräusche.
let lakeSec=0,nextLakeWater=0,nextBuzz=0,nextLakeBird=0;const lakeSounds=new Set();
function lakeAmbience(){
 // Level 6 Sumpfgebiet: Meldung beim Wechsel Wasser ↔ Schlammebene, Wasser- und Vogelgeräusche.
 const sec=screen==="play"&&state.phase==="playing"?lakeSection(state.elapsed):0,now=performance.now()/1000,el=state.elapsed;
 if(sec!==lakeSec){if(sec===1)toast(t("swampStart"),3.4);lakeSec=sec;}
 if(!sec||paused)return;
 const mudSoon=swampMud(el+1.6)&&!swampMud(el),waterSoon=!swampMud(el+1.2)&&swampMud(el)&&el+1.2<540;
 if(mudSoon&&!lakeSounds.has("mud"+Math.floor(el/21))){lakeSounds.add("mud"+Math.floor(el/21));bigAlert(t("mudAlert"));toast(t("mudHint"),3);}
 if(waterSoon&&!lakeSounds.has("water"+Math.floor(el/21))){lakeSounds.add("water"+Math.floor(el/21));toast(t("waterHint"),2.8);}
 if(now>nextLakeWater){nextLakeWater=now+(swampMud(el)?4:2.6)+Math.random()*2;audio.synth(swampMud(el)?"stream":"water",.5);}
 if(now>nextLakeBird){nextLakeBird=now+4+Math.random()*4;audio.synth("chirp",.5);}
 if(lakeSounds.size>300)lakeSounds.clear();
}
// Level 7 Hörnliweg: Meldung zu jedem der fünf Abschnitte und vor der Metallbrücke.
let hornliSec=0;function hornliAmbience(){const el=state.elapsed,sec=screen==="play"&&state.phase==="playing"&&el>=540&&el<630?1+Math.min(4,Math.floor((el-540)/18)):0;
 if(sec!==hornliSec){if(sec>0)toast(t("hornliSec"+sec),3.4);hornliSec=sec;}
 if(sec===3&&!paused)for(const w of[581,589])if(el>=w-4.5&&el<w-4.25&&!lakeSounds.has("bridge"+w)){lakeSounds.add("bridge"+w);bigAlert(t("bridgeAlert7"));toast(t("bridgeHint7"),2.6);}}
function hud(){if(screen==="play"&&state.phase==="playing")crowWarnings();fisherBubble();forestAmbience();meadowAmbience();lakeAmbience();hornliAmbience();highAmbience();
 $("score").textContent=fmt(state.score);$("coins").textContent=state.coins;{const ic=itemIcon();$("items").hidden=false;if($("items-icon").textContent!==ic)$("items-icon").textContent=ic;$("items-count").textContent=state.items||0;$("items").title=itemName();}$("combo").textContent=state.multiplier>1?"×"+state.multiplier:"";
 $("distance").textContent=Math.floor(state.elapsed/60)+":"+String(Math.floor(state.elapsed%60)).padStart(2,"0")+" / 15:00 · "+(getStage(state.elapsed)+1)+"/10";
 $("stage").textContent=t(stages[getStage(state.elapsed)].key).toUpperCase();
 $("progress").style.width=(Math.min(100,state.elapsed/DURATION*100))+"%";
 const lifeKey=lang+':'+state.lives+':'+state.maxLives;if($('lives').dataset.value!==lifeKey){$('lives').dataset.value=lifeKey;$('lives-label').textContent=t('heart');document.querySelectorAll('#life-hearts svg').forEach((heart,i)=>{heart.classList.toggle('empty',i>=state.lives);if(i>=3)heart.toggleAttribute('hidden',i>=state.lives);});$('lives').setAttribute('aria-label',t('heart')+': '+state.lives+' / '+Math.max(3,state.lives));}

 const active=screen==="play",intro=introElapsed>=0;app.classList.toggle("intro-active",intro);$("intro-caption").hidden=!intro;$("intro-caption").querySelector("span").textContent=t("introCaption");$("tutorial").hidden=!active||intro||state.distance>70||countdown>0;
 const rem=state.nextTurn-state.distance,show=active&&state.nextTurn>0&&rem<state.speed*2.8&&state.elapsed<892&&!(state.elapsed>=578&&state.elapsed<592.5);
 $("turn-cue").hidden=!show;
 if(show){const direction=turnDirection(state.seed,state.summitTurn,state.turnIndex),ready=state.turnChoice===direction;$("turn-arrow").textContent=direction<0?"↰":"↱";$("turn-label").textContent=t(direction<0?"turnLeft":"turnRight");$("turn-distance").textContent=ready?t("turnReady"):inTurn()?t("turnNow"):Math.ceil(rem)+" m";$("turn-cue").classList.toggle("now",inTurn()&&!ready);$("turn-cue").classList.toggle("accepted",ready);}
 const power=[state.magnet>0?t("magnetShort",{n:Math.ceil(state.magnet/20)}):"",state.shield?t("shieldShort"):"",state.springs>0?t("springsShort",{n:Math.ceil(state.springs/20)}):"",state.luck?t("cloverShort"):"",state.bino>0?t("binoShort",{n:Math.ceil(state.bino/20)}):"",state.coinBoost>0?t("boostShort",{n:Math.ceil(state.coinBoost/20)}):"",state.shoes>0?t("shoesShort",{n:Math.ceil(state.shoes/20)}):"",!state.angry&&(state.fish>0||getStage(state.elapsed)===2)?t("fishShort",{n:state.fish||0}):"",getStage(state.elapsed)===3?t("forestShort",{c:state.coins||0}):"",getStage(state.elapsed)===4?t("meadowShort",{h:"0"+Math.floor(state.elapsed/60),m:String(Math.floor(state.elapsed%60)).padStart(2,"0")}):""].filter(Boolean).join(" · ");
 $("powerup").hidden=!active||!power;$("powerup").textContent=power;

 $("resort-arrival").hidden=true;
 $("touch-controls").hidden=!active||!buttons||intro||countdown>0;
 const gear=state.climbReady>0||state.climb>0,charged=gear?state.climbReady>0:state.powerCharge>=30,on=gear?state.climb>0:state.powerTicks>0,pb=$("rush-button");pb.classList.toggle('climb',gear);pb.hidden=!active||intro||countdown>0;pb.disabled=paused||!charged||on;pb.classList.toggle('ready',charged&&!on);pb.classList.toggle('running',on);pb.style.setProperty('--charge',(gear?(on?state.climb/200:1):on?state.powerTicks/120:state.powerCharge/30)*100+'%');$('rush-value').textContent=on?Math.ceil((gear?state.climb:state.powerTicks)/20)+'s':charged?t('powerTap'):state.powerCharge+'/30';$('rush-name').textContent=t(gear?'climbName':'powerName');pb.setAttribute('aria-label',gear?(on?t('climbActiveAria',{n:Math.ceil(state.climb/20)}):t('climbReadyAria')):on?t('powerActive',{n:Math.ceil(state.powerTicks/20)}):charged?t('powerReady'):t('powerCharge',{n:state.powerCharge}));$('rush-key').textContent=matchMedia('(pointer:coarse)').matches?'':t('keyHint',{k:powerKey().replace('Key','')});
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

  else{acc+=dt;while(acc>=.05&&state.phase==="playing"&&!$("shop-dialog").open){if(tilt)dispatch({type:"steer",lane:tiltValue});dispatch({type:"step"});acc-=.05;}if(!bestAnnounced&&runBest>0&&testLevel<=1&&state.score>runBest&&state.phase==="playing"){bestAnnounced=true;toast(t("newBestRun"),2.4);audio.play("pickup",1.9,.7);}if(state.phase!=="playing"){if(state.phase==="won"&&!resultSaved){if(celebrateAt===null){celebrateAt=time;audio.play("pickup",1.8,.9);setTimeout(()=>audio.play("pickup",2.1,.8),260);setTimeout(()=>audio.play("pickup",2.4,.8),520);toast(t("summitReached"),2.6);}if(time-celebrateAt>=CELEBRATE)finish();}else finish();};}
 }
 if(loaded&&screen==='play'&&!paused&&introElapsed<0&&countdown<=0){
  qualityCooldown=Math.max(0,qualityCooldown-dt);qualityLowTime=fps<43?qualityLowTime+dt:Math.max(0,qualityLowTime-dt*2);qualityHighTime=fps>56?qualityHighTime+dt:0;
  if(qualityCooldown===0&&qualityLowTime>3&&renderScale>.85){renderScale=Math.max(.85,renderScale-.15);qualityLowTime=0;qualityCooldown=5;resize();}
  else if(qualityCooldown===0&&qualityHighTime>12&&renderScale<1.5){renderScale=Math.min(1.5,renderScale+.10);qualityHighTime=0;qualityCooldown=12;resize();}
 }
 if(loaded&&screen!=="home"){if(screen==="play"&&!paused&&introElapsed<0&&countdown<=0)renderDistance=state.distance+acc*state.speed;else renderDistance=state.distance;
  scene.render(state,{distance:renderDistance,time,delta:dt,active:screen!=="home",paused:paused||introElapsed>=0||countdown>0,reduced,screen,introTime:introElapsed>=0?introElapsed:null,waiting:countdown>0,celebrate:celebrateAt===null?null:Math.min(1,(time-celebrateAt)/CELEBRATE)});
 }
 if(time-lastHudTime>=.05){hud();lastHudTime=time;}if(time>toastUntil)$("toast").classList.remove("visible");requestAnimationFrame(loop);
}

let menuTab="run";
function selectMenu(tab){menuTab=tab;watchBoard(tab==="records");for(const name of ["run","route","records"]){$("menu-"+name).hidden=name!==tab;const button=document.querySelector('[data-menu="'+name+'"]');if(name===tab)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}app.dataset.menuTab=tab;updateMenu();}
function updateMenu(){
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
 
 const key=lang;if($('route-stages').dataset.lang!==key){$('route-stages').dataset.lang=key;$('route-stages').replaceChildren(...stages.map((stage,i)=>{const li=document.createElement('li'),n=document.createElement('b'),label=document.createElement('span'),time=document.createElement('small');n.textContent=String(i+1).padStart(2,'0');label.textContent=t(stage.key).split(' · ')[0];time.textContent=Math.floor(stage.start/60)+':'+String(stage.start%60).padStart(2,'0');const go=document.createElement('button');go.type='button';go.className='stage-go';go.textContent='▶';go.setAttribute('aria-label',t('playLevel',{n:i+1}));go.onclick=()=>{if(!adminPw)return;testLevel=i+1;start();};li.append(n,label,time,go);return li}));}
}
function enterMenu(){app.dataset.front="menu";$('splash').hidden=true;selectMenu('run');audio.unlock().catch(()=>{});audio.setActive(true);$('start').disabled?$('how').focus():$('start').focus();}
$('enter-game').onclick=enterMenu;document.querySelectorAll('[data-menu]').forEach(b=>b.onclick=()=>selectMenu(b.dataset.menu));
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;save('spa.runner.assist',mode==='relaxed'?1:0);updateCopy();});

$("rush-button").onpointerdown=e=>{e.preventDefault();input("power");};$("rush-button").onclick=e=>{if(e.detail===0)input("power");};
$("start").onclick=()=>{testLevel=1;start();};
// ---------- Admin-Zugang (Passwort wird in der Datenbank geprüft, nur im Speicher dieses Tabs gehalten) ----------
let adminPw="",adminEntries=[];
const adminFmtDate=v=>{try{return v?new Date(v).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";}catch{return v||"";}};
function setAdmin(pw){adminPw=pw;app.classList.toggle("is-admin",!!pw);}
$("admin-open").onclick=()=>{$("settings-dialog").close();if(adminPw){openAdminPanel();return;}$("admin-password").value="";$("admin-error").hidden=true;$("admin-login").showModal();$("admin-password").focus();};
$("admin-form").onsubmit=async e=>{e.preventDefault();const pw=$("admin-password").value,btn=$("admin-submit"),err=$("admin-error");if(!pw){err.textContent=t("adminWrong");err.hidden=false;return;}
 btn.disabled=true;err.hidden=true;btn.querySelector("span").textContent=t("adminChecking");
 try{if(await board.adminCheck(pw)){setAdmin(pw);$("admin-password").value="";$("admin-login").close();openAdminPanel();}else{err.textContent=t("adminWrong");err.hidden=false;$("admin-password").select();}}
 catch(x){err.textContent=boardError(x);err.hidden=false;}
 finally{btn.disabled=false;btn.querySelector("span").textContent=t("adminLogin");}};
function adminTab(tab){document.querySelectorAll("[data-admin-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.adminTab===tab)));$("admin-board").hidden=tab!=="board";$("admin-levels").hidden=tab!=="levels";}
document.querySelectorAll("[data-admin-tab]").forEach(b=>b.onclick=()=>adminTab(b.dataset.adminTab));
function openAdminPanel(){if(screen==="play"&&!paused)pause(true);adminTab("board");renderAdminLevels();if(!$("admin-panel").open)$("admin-panel").showModal();loadAdmin();}
async function loadAdmin(){$("admin-status").textContent=t("boardLoading");$("admin-refresh").disabled=true;
 try{adminEntries=await board.adminEntries(adminPw);$("admin-count").textContent=t("adminCount",{n:fmt(adminEntries.length)});$("admin-status").textContent="";
  $("admin-list").replaceChildren(...(adminEntries.length?adminEntries.map(e=>{const li=document.createElement("li"),n=document.createElement("b"),main=document.createElement("div"),who=document.createElement("strong"),mail=document.createElement("span"),info=document.createElement("small"),pts=document.createElement("span");
   n.textContent=(medal(Number(e.rank))?medal(Number(e.rank))+" ":"")+e.rank+".";who.textContent=e.name;mail.className="mail";mail.textContent=e.email||"—";info.textContent=t("levelsReached",{n:e.best_level,total:stages.length})+" · "+t("adminRuns",{n:e.runs})+" · "+adminFmtDate(e.last_played||e.last_record);pts.className="pts";pts.textContent=fmt(e.best_score);main.append(who,mail,info);li.append(n,main,pts);return li;}):[emptyRow(t("globalEmpty"))]));}
 catch(x){if(x?.status===401||x?.status===403){setAdmin("");$("admin-panel").close();$("admin-error").textContent=t("adminWrong");$("admin-error").hidden=false;$("admin-login").showModal();}else $("admin-status").textContent=boardError(x);}
 finally{$("admin-refresh").disabled=false;}}
function renderAdminLevels(){$("admin-level-grid").replaceChildren(...stages.map((stage,i)=>{const li=document.createElement("li"),b=document.createElement("button");b.type="button";b.className="admin-level";const n=document.createElement("b");n.textContent=String(i+1).padStart(2,"0");const name=document.createElement("span");name.textContent=t(stage.key).split(" · ")[0];b.append(n,name);
 b.onclick=()=>{if(!adminPw)return;$("admin-panel").close();testLevel=i+1;start();};li.append(b);return li;}));}
function adminCsv(name,head,rows){const esc=v=>{const x=String(v??"");return /[";\n\r]/.test(x)||/^[=+\-@]/.test(x)?'"'+(/^[=+\-@]/.test(x)?"'":"")+x.replace(/"/g,'""')+'"':x;};
 const blob=new Blob(["\ufeff"+[head,...rows].map(r=>r.map(esc).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name+"-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$("admin-refresh").onclick=loadAdmin;
$("admin-csv").onclick=()=>adminCsv("hornox-rangliste",["Platz","Name","E-Mail","Punkte","Level","Läufe","Bestleistung am","Letztes Spiel"],adminEntries.map(e=>[e.rank,e.name,e.email||"",e.best_score,e.best_level,e.runs,adminFmtDate(e.last_record),adminFmtDate(e.last_played)]));
$("admin-csv-runs").onclick=async()=>{const b=$("admin-csv-runs");b.disabled=true;try{const runs=await board.adminRuns(adminPw);adminCsv("hornox-alle-laeufe",["Datum und Uhrzeit","Name","E-Mail","Punkte","Level","Münzen"],runs.map(r=>[adminFmtDate(r.played_at),r.name,r.email||"",r.score,r.level,r.coins]));}catch(x){$("admin-status").textContent=boardError(x);}finally{b.disabled=false;}};
$("admin-logout").onclick=()=>{setAdmin("");adminEntries=[];$("admin-list").replaceChildren();$("admin-panel").close();};
$("again").onclick=start;$("restart").onclick=start;$("resume").onclick=()=>pause(false);$("pause-button").onclick=()=>pause(true);document.querySelectorAll(".go-home").forEach(b=>b.onclick=home);
$("settings").onclick=()=>openDialog("settings-dialog");$("pause-settings").onclick=()=>openDialog("settings-dialog");$("how").onclick=()=>openDialog("help-dialog");document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>b.closest("dialog").close());
$("language").onchange=e=>{lang=e.target.value;save("hornox.language.v5",lang);updateCopy();};
document.querySelectorAll("[data-route]").forEach(b=>b.onclick=()=>{route=b.dataset.route;updateCopy();});
$("retry-load").onclick=()=>location.reload();
function toggleSound(value){sound=value;save("hornox.sound.v5",value?1:0);audio.setEnabled(value);if(value)audio.unlock().catch(()=>{});updateCopy();}
$("sound-toggle").onchange=e=>toggleSound(e.target.checked);
$("music-toggle").onchange=e=>{music=e.target.checked;save("hornox.music.v1",music?1:0);audio.setMusic(music);updateCopy();};$("quick-sound").onclick=()=>toggleSound(!sound);
// Steuerknöpfe (← ↑ ↓ →) direkt im Spiel ein-/ausblenden – wischen funktioniert immer.
$("quick-buttons").onclick=()=>{buttons=!buttons;save("hornox.buttons.v5",buttons?1:0);updateCopy();toast(t(buttons?"buttonsShown":"buttonsHidden"),2.2);};
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
 if(e.code==="Enter"&&screen==="result"&&!e.repeat){if(document.activeElement?.tagName!=="BUTTON"&&document.activeElement?.tagName!=="A"){e.preventDefault();start();}return;}
 if(e.repeat)return;
 if(e.code===powerKey()&&screen==="play"){e.preventDefault();input("power");return;}
 const action=Object.keys(bindings).find(k=>bindings[k]===e.code)||({KeyA:"left",KeyD:"right",KeyW:"jump",Space:"jump",KeyS:"duck"})[e.code];
 if(action){e.preventDefault();input(action);}
});
const controls=installControls(app,{enabled:()=>screen==="play"&&!paused&&introElapsed<0&&countdown<=0&&!document.querySelector("dialog[open]"),onAction:input});
document.querySelectorAll("[data-action]").forEach(b=>{b.onpointerdown=e=>{e.preventDefault();input(b.dataset.action);};b.onclick=e=>{if(e.detail===0)input(b.dataset.action);};});
window.addEventListener("blur",()=>{if(screen==="play")pause(true);});document.addEventListener("visibilitychange",()=>{if(document.hidden&&screen==="play")pause(true);});
window.addEventListener("resize",resize);canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();pause(true);toast(t("graphicsLost"),999);});
$("share").onclick=async()=>{const url=new URL(location.pathname,location.origin);url.searchParams.set("challenge",state.seed);url.searchParams.set("route",state.route);url.searchParams.set("mode",state.mode);url.searchParams.set("target",state.score);url.searchParams.set("v","12");const data={title:"Hornox Run · Zermatt",text:t("shareText",{score:fmt(state.score)}),url:url.href};try{if(navigator.share){await navigator.share(data);return;}await navigator.clipboard.writeText(url.href);toast(t("copied"));}catch(e){if(e.name==="AbortError")return;$("copy-link-wrap").hidden=false;$("copy-link").value=url.href;$("copy-link").select();}};
$("embedded-help").hidden=window.top===window;
updateCopy();
try{scene=createScene(canvas);resize();scene.ready.then(()=>{loaded=true;$("start").disabled=false;$("asset-status").textContent="";updateCopy();}).catch(fail);}catch(e){fail(e);}
function fail(e){console.error("Hornox graphics",e);$("asset-status").textContent=t("loadError");$("retry-load").hidden=false;$("start").querySelector("span").textContent=t("loadError");}
requestAnimationFrame(loop);
if(q.has("debug"))window.__hornox=window.__spa={start,level:n=>{testLevel=n;start();},pause,home,input,action:dispatch,getState:()=>JSON.parse(JSON.stringify(state)),getMetrics:()=>({...scene?.metrics(),fps,renderScale,screen,paused,loaded,tilt,introElapsed,countdown,stage:getStage(state.elapsed),front:app.dataset.front,menuTab,audio:audio.metrics()}),advance(n=1){for(let i=0;i<n&&state.phase==="playing";i++)dispatch({type:"step"});renderDistance=state.distance;hud();},setState(p){state={...state,...p};renderDistance=state.distance;hud();},setIntro(n){introElapsed=n;countdown=0;hud();},setCountdown(n){introElapsed=-1;countdown=n;$("countdown").textContent=n>0?String(Math.ceil(n)):"";$("countdown").hidden=n<=0;}};

