// Globale Rangliste (Supabase). Alle Zugriffe laufen über Datenbank-Funktionen (supabase/leaderboard.sql):
//  save_run         Name + E-Mail + Punkte + Level speichern, liefert den neuen Platz
//  leaderboard_top  Rangliste lesen (Platz, Name, Punkte, Level) – sortiert nach Punkten
//  player_standing  eigener Platz
// E-Mail-Adressen können damit nicht gelesen werden; das geht nur für eingeloggte Admins.
import {LEADERBOARD} from "./leaderboard-config.js?v=3";
export function createLeaderboard(config=LEADERBOARD){
 const url=(config.url||"").replace(/\/$/,""),key=config.anonKey||"",configured=!!(url&&key);
 async function rpc(fn,body={},token){
  if(!configured){const e=Error("offline");e.offline=true;throw e;}
  let r;
  // Neue Supabase-Schlüssel (sb_publishable_…) gehören nur in «apikey»; alte anon-Schlüssel (eyJ…) sind JWTs
  // und dürfen zusätzlich als Bearer gesendet werden. Ein Admin-Login sendet sein eigenes Token.
  const bearer=token||(key.startsWith("eyJ")?key:null);
  const headers={apikey:key,"Content-Type":"application/json"};if(bearer)headers.Authorization="Bearer "+bearer;
  try{r=await fetch(url+"/rest/v1/rpc/"+fn,{method:"POST",headers,body:JSON.stringify(body)});}
  catch(x){const e=Error("network");e.network=true;throw e;}
  if(!r.ok){const e=Error("Rangliste "+r.status);e.status=r.status;try{const j=await r.json();e.detail=j.message||"";}catch{}throw e;}
  const text=await r.text();return text?JSON.parse(text):null;
 }
 const one=v=>Array.isArray(v)?v[0]||null:v;
 return{
  configured,
  // Lauf speichern. runId verhindert doppelte Einträge, falls der Knopf mehrfach gedrückt wird.
  async saveRun({id,runId,name,email,score,level,coins}){return one(await rpc("save_run",{p_id:id,p_run:runId,p_name:name,p_email:email,p_score:Math.floor(score),p_level:level,p_coins:coins||0}));},
  async top(limit=50,offset=0,me=null){return(await rpc("leaderboard_top",{p_limit:limit,p_offset:offset,p_me:me}))||[];},
  async standing(id){return one(await rpc("player_standing",{p_id:id}));},
  async rename(id,name){await rpc("rename_player",{p_id:id,p_name:name});},
  // Admin: Anmeldung über Supabase Auth (E-Mail + Passwort) und Listen mit E-Mail-Adressen.
  async login(email,password){if(!configured)throw Error("offline");const r=await fetch(url+"/auth/v1/token?grant_type=password",{method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify({email,password})});const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token){const e=Error("login");e.status=r.status;throw e;}return{token:j.access_token,email:j.user?.email||email,expires:Date.now()+(j.expires_in||3600)*1000};},
  async adminEntries(token){return(await rpc("admin_entries",{},token))||[];},
  async adminRuns(token){return(await rpc("admin_runs",{},token))||[];}
 };
}
