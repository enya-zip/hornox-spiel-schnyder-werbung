// Admin-Seite des Gewinnspiels: Login über Supabase Auth, danach Teilnehmerliste mit E-Mail-Adressen.
// Die Daten kommen ausschliesslich aus der Datenbankfunktion admin_entries, die nur für Admins antwortet.
// Die Anmeldung gilt nur in diesem Browser-Tab (sessionStorage) und läuft nach spätestens einer Stunde ab.
import {createLeaderboard} from "./leaderboard.js?v=3";
const $=id=>document.getElementById(id),board=createLeaderboard(),KEY="hornox.admin.session";
let session=null,entries=[];
try{const s=JSON.parse(sessionStorage.getItem(KEY));if(s&&s.token&&s.expires>Date.now()+30000)session=s;}catch{}

const dt=v=>{try{return new Date(v).toLocaleString("de-CH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});}catch{return v||"";}};
const num=n=>new Intl.NumberFormat("de-CH").format(n||0);
function show(view){for(const v of["login","offline","list"])$(v).hidden=v!==view;if(view==="login")$("login-email").focus();}
function logout(msg){session=null;entries=[];try{sessionStorage.removeItem(KEY);}catch{}$("rows").replaceChildren();show("login");if(msg){$("login-error").textContent=msg;$("login-error").hidden=false;}}

function render(){
 const q=$("search").value.trim().toLowerCase(),list=q?entries.filter(e=>(e.name+" "+e.email).toLowerCase().includes(q)):entries;
 $("count").textContent=num(entries.length);$("leader").textContent=entries[0]?entries[0].name:"—";
 if(!list.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=8;td.className="empty";td.textContent=entries.length?"Keine Treffer für diese Suche.":"Noch keine Teilnehmenden mit E-Mail-Adresse.";tr.append(td);$("rows").replaceChildren(tr);return;}
 $("rows").replaceChildren(...list.map(e=>{const tr=document.createElement("tr");if(e.rank<=3)tr.className="top";
  const cells=[[e.rank+".","num"],[e.name],[e.email||"—","email"],[num(e.best_score),"num"],[e.best_level,"num"],[e.runs,"num"],[dt(e.last_record)],[dt(e.last_played)]];
  for(const [v,cls] of cells){const td=document.createElement("td");td.textContent=v;if(cls)td.className=cls;tr.append(td);}return tr;}));
}
async function load(){
 $("list-error").hidden=true;$("refresh").disabled=true;
 try{entries=await board.adminEntries(session.token);$("updated").textContent=new Date().toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"});show("list");render();}
 catch(e){if(e.status===401||e.status===403)logout(e.status===403?"Dieses Konto ist nicht als Admin freigeschaltet.":"Die Anmeldung ist abgelaufen. Bitte erneut anmelden.");else{show("list");$("list-error").textContent="Die Liste konnte nicht geladen werden. Bitte später nochmals versuchen.";$("list-error").hidden=false;}}
 finally{$("refresh").disabled=false;}
}
// CSV mit Semikolon (öffnet in Excel CH/DE direkt richtig) und BOM für Umlaute.
function download(name,head,rows){
 const esc=v=>{const s=String(v??"");return /[";\n\r]/.test(s)||/^[=+\-@]/.test(s)?'"'+(/^[=+\-@]/.test(s)?"'":"")+s.replace(/"/g,'""')+'"':s;};
 const blob=new Blob(["﻿"+[head,...rows].map(r=>r.map(esc).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name+"-"+new Date().toISOString().slice(0,10)+".csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

$("login-form").onsubmit=async e=>{e.preventDefault();const btn=e.submitter||$("login-form").querySelector("button");btn.disabled=true;$("login-error").hidden=true;
 try{session=await board.login($("login-email").value.trim(),$("login-password").value);try{sessionStorage.setItem(KEY,JSON.stringify(session));}catch{}$("login-password").value="";await load();}
 catch(err){$("login-error").textContent=err.status===400||err.status===401?"E-Mail oder Passwort ist falsch.":"Anmeldung zurzeit nicht möglich. Bitte später nochmals versuchen.";$("login-error").hidden=false;}
 finally{btn.disabled=false;}};
const csv=()=>download("hornox-rangliste",["Platz","Name","E-Mail","Punkte","Level","Läufe","Bestleistung am","Letztes Spiel"],entries.map(e=>[e.rank,e.name,e.email||"",e.best_score,e.best_level,e.runs,dt(e.last_record),dt(e.last_played)]));
async function csvRuns(){$("csv-runs").disabled=true;try{const runs=await board.adminRuns(session.token);download("hornox-alle-laeufe",["Datum und Uhrzeit","Name","E-Mail","Punkte","Level","Münzen"],runs.map(r=>[dt(r.played_at),r.name,r.email||"",r.score,r.level,r.coins]));}catch(e){$("list-error").textContent="Die Läufe konnten nicht geladen werden.";$("list-error").hidden=false;}finally{$("csv-runs").disabled=false;}}
$("search").oninput=render;$("refresh").onclick=load;$("csv").onclick=csv;$("csv-runs").onclick=csvRuns;$("logout").onclick=()=>logout();
setInterval(()=>{if(session&&session.expires<Date.now())logout("Die Anmeldung ist abgelaufen. Bitte erneut anmelden.");},30000);

if(!board.configured)show("offline");else if(session)load();else show("login");
