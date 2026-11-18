// Globale Rangliste (Supabase/PostgREST). Rangfolge: erreichtes Level, dann Punkte, dann wer früher dort war.
import {LEADERBOARD} from "./leaderboard-config.js?v=2";
export function createLeaderboard(config=LEADERBOARD){
 const url=(config.url||"").replace(/\/$/,""),key=config.anonKey||"",configured=!!(url&&key);
 const headers=extra=>({apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...extra});
 const cols="player_id,name,best_score,best_level,updated_at";
 async function req(path,{method="GET",body,prefer,token}={}){
  const h=headers(prefer?{Prefer:prefer}:{});if(token)h.Authorization="Bearer "+token;
  const r=await fetch(url+"/rest/v1/"+path,{method,headers:h,body:body?JSON.stringify(body):undefined});
  if(!r.ok){const e=Error("Rangliste "+r.status);e.status=r.status;try{e.detail=(await r.json()).message;}catch{}throw e;}
  const range=r.headers.get("content-range"),count=range&&range.includes("/")?Number(range.split("/")[1]):null;
  const text=await r.text();return{data:text?JSON.parse(text):null,count};
 }
 // Filter für «besser als dieser Eintrag» bzw. «schlechter als dieser Eintrag».
 const better=e=>`or=(best_level.gt.${e.best_level},and(best_level.eq.${e.best_level},best_score.gt.${e.best_score}),and(best_level.eq.${e.best_level},best_score.eq.${e.best_score},updated_at.lt.${encodeURIComponent(e.updated_at)}))`;
 const worse=e=>`or=(best_level.lt.${e.best_level},and(best_level.eq.${e.best_level},best_score.lt.${e.best_score}),and(best_level.eq.${e.best_level},best_score.eq.${e.best_score},updated_at.gt.${encodeURIComponent(e.updated_at)}))`;
 return{
  configured,
  async submit(id,name,score,level,coins){if(!configured)return;await req("rpc/submit_score",{method:"POST",body:{p_id:id,p_name:name,p_score:Math.floor(score),p_level:level,p_coins:coins}});},
  // Gewinnspiel: Name + E-Mail speichern. Die E-Mail ist danach für niemanden ausser dem Admin lesbar.
  // Leere E-Mail = Teilnahme zurückziehen.
  async saveContact(id,name,email,consent){if(!configured)throw Error("offline");await req("rpc/save_contact",{method:"POST",body:{p_id:id,p_name:name,p_email:email||"",p_consent:!!consent}});},
  // Admin: Anmeldung über Supabase Auth (E-Mail + Passwort) und Teilnehmerliste.
  async login(email,password){if(!configured)throw Error("offline");const r=await fetch(url+"/auth/v1/token?grant_type=password",{method:"POST",headers:headers(),body:JSON.stringify({email,password})});const j=await r.json().catch(()=>({}));if(!r.ok||!j.access_token){const e=Error("login");e.status=r.status;throw e;}return{token:j.access_token,email:j.user?.email||email,expires:Date.now()+(j.expires_in||3600)*1000};},
  async adminEntries(token){return(await req("rpc/admin_entries",{method:"POST",body:{},token})).data||[];},
  async rename(id,name){if(!configured)return;await req("rpc/rename_player",{method:"POST",body:{p_id:id,p_name:name}});},
  async top(n=10){if(!configured)return[];return(await req(`leaderboard?select=${cols}&order=best_level.desc,best_score.desc,updated_at.asc&limit=${n}`)).data||[];},
  // Eigener Rang mit Gesamtzahl und den Spielern direkt darüber und darunter.
  async standing(id){
   if(!configured)return null;
   const me=(await req(`leaderboard?select=${cols}&player_id=eq.${id}`)).data?.[0];
   const total=(await req(`leaderboard?select=player_id&limit=1`,{prefer:"count=exact"}).catch(()=>({count:null}))).count;
   if(!me)return{rank:null,total,me:null,above:null,below:null};
   const [ahead,above,below]=await Promise.all([
    req(`leaderboard?select=player_id&${better(me)}&limit=1`,{prefer:"count=exact"}),
    req(`leaderboard?select=${cols}&${better(me)}&order=best_level.asc,best_score.asc,updated_at.desc&limit=1`),
    req(`leaderboard?select=${cols}&${worse(me)}&order=best_level.desc,best_score.desc,updated_at.asc&limit=1`)]);
   return{rank:(ahead.count??0)+1,total,me,above:above.data?.[0]||null,below:below.data?.[0]||null};
  }
 };
}
