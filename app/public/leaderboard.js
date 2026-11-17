// Globale Rangliste (Supabase/PostgREST). Rangfolge: erreichtes Level, dann Punkte, dann wer früher dort war.
import {LEADERBOARD} from "./leaderboard-config.js?v=1";
export function createLeaderboard(config=LEADERBOARD){
 const url=(config.url||"").replace(/\/$/,""),key=config.anonKey||"",configured=!!(url&&key);
 const headers=extra=>({apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json",...extra});
 const cols="player_id,name,best_score,best_level,updated_at";
 async function req(path,{method="GET",body,prefer}={}){
  const r=await fetch(url+"/rest/v1/"+path,{method,headers:headers(prefer?{Prefer:prefer}:{}),body:body?JSON.stringify(body):undefined});
  if(!r.ok)throw Error("Rangliste "+r.status);
  const range=r.headers.get("content-range"),count=range&&range.includes("/")?Number(range.split("/")[1]):null;
  const text=await r.text();return{data:text?JSON.parse(text):null,count};
 }
 // Filter für «besser als dieser Eintrag» bzw. «schlechter als dieser Eintrag».
 const better=e=>`or=(best_level.gt.${e.best_level},and(best_level.eq.${e.best_level},best_score.gt.${e.best_score}),and(best_level.eq.${e.best_level},best_score.eq.${e.best_score},updated_at.lt.${encodeURIComponent(e.updated_at)}))`;
 const worse=e=>`or=(best_level.lt.${e.best_level},and(best_level.eq.${e.best_level},best_score.lt.${e.best_score}),and(best_level.eq.${e.best_level},best_score.eq.${e.best_score},updated_at.gt.${encodeURIComponent(e.updated_at)}))`;
 return{
  configured,
  async submit(id,name,score,level,coins){if(!configured)return;await req("rpc/submit_score",{method:"POST",body:{p_id:id,p_name:name,p_score:Math.floor(score),p_level:level,p_coins:coins}});},
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
