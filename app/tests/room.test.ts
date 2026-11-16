import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";
async function open(room: string) {
 const res=await SELF.fetch("https://game.test/ws/"+room,{headers:{Upgrade:"websocket"}});
 expect(res.status).toBe(101);const ws=res.webSocket;if(!ws)throw new Error("no socket");ws.accept();
 const frames:any[]=[];ws.addEventListener("message",(e:MessageEvent)=>{if(e.data!=="__pong")try{frames.push(JSON.parse(String(e.data)));}catch{}});
 const next=async(pred:(f:any)=>boolean)=>{for(let n=0;n<100;n++){const found=frames.find(pred);if(found)return found;await scheduler.wait(10);}throw new Error("frame timeout");};
 return {ws,frames,next,send:(m:unknown)=>ws.send(JSON.stringify(m))};
}
const unique=()=>crypto.randomUUID();
describe("Ab ins Spa rooms",()=>{
 it("starts with one guest and preserves the shared rules on reconnect",async()=>{
  const room=unique(),a=await open(room);a.send({type:"join",playerId:"guest"});
  const joined=await a.next(f=>f.type==="state");expect(joined.status).toBe("playing");expect(joined.meta.game).toBe("Ab ins Spa! · Hornox Run");expect(joined.view.phase).toBe("ready");
  a.frames.length=0;a.send({type:"action",action:{type:"start",seed:123,mode:"classic"}});
  await a.next(f=>f.view?.phase==="playing");a.frames.length=0;
  a.send({type:"action",action:{type:"steer",lane:2}});await a.next(f=>f.view?.target===2);a.ws.close();
  const b=await open(room);b.send({type:"join",playerId:"guest"});const restored=await b.next(f=>f.type==="state");
  expect(restored.view.target).toBe(2);expect(restored.view.seed).toBe(123);b.ws.close();
 });
 it("refuses a spectator move or reset",async()=>{
  const room=unique(),a=await open(room),b=await open(room);
  a.send({type:"join",playerId:"player"});await a.next(f=>f.type==="state");
  b.send({type:"join",playerId:"watcher"});const watching=await b.next(f=>f.type==="state");
  expect(watching.seats).toEqual(["player"]);expect(watching.view.spectator).toBe(true);
  b.frames.length=0;b.send({type:"action",action:{type:"start",seed:1,mode:"classic"}});expect((await b.next(f=>f.type==="error")).error).toBe("spectators cannot act");
  b.frames.length=0;b.send({type:"reset"});expect((await b.next(f=>f.type==="error")).error).toBe("spectators cannot reset");
  a.ws.close();b.ws.close();
 });
 it("rejects invalid controls and resets to the ready screen",async()=>{
  const a=await open(unique());a.send({type:"join",playerId:"p"});await a.next(f=>f.type==="state");
  a.frames.length=0;a.send({type:"action",action:{type:"start",seed:55,mode:"relaxed"}});await a.next(f=>f.view?.phase==="playing");
  a.frames.length=0;a.send({type:"action",action:{type:"steer",lane:99}});expect((await a.next(f=>f.type==="error")).error).toBe("lane");
  a.frames.length=0;a.send({type:"reset"});const fresh=await a.next(f=>f.view?.phase==="ready");expect(fresh.view.tick).toBe(0);a.ws.close();
 });
 it("keeps guests in different rooms separate",async()=>{
  const a=await open(unique()),b=await open(unique());a.send({type:"join",playerId:"a"});b.send({type:"join",playerId:"b"});
  expect((await a.next(f=>f.type==="state")).seats).toEqual(["a"]);expect((await b.next(f=>f.type==="state")).seats).toEqual(["b"]);a.ws.close();b.ws.close();
 });
 it("rejects malformed and oversized messages",async()=>{
  const a=await open(unique());a.ws.send("not json");expect((await a.next(f=>f.type==="error")).error).toBe("invalid json");
  a.frames.length=0;a.send({type:"join",playerId:"p"});await a.next(f=>f.type==="state");
  a.frames.length=0;a.send({type:"action",action:{blob:"x".repeat(20000)}});expect((await a.next(f=>f.type==="error")).error).toBe("message too large");a.ws.close();
 });
});
