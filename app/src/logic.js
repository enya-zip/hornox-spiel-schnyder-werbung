export const meta={game:"Hornox Run · Zermatt",minPlayers:1,maxPlayers:1};
export function setup(players){
 return{version:17,player:players[0]||"guest",phase:"ready",mode:"classic",route:"summit",
 tick:0,elapsed:0,distance:0,speed:18,x:1,target:1,lives:3,maxLives:3,jump:0,jumpCount:0,jumpBase:0,jumpY:0,fallTicks:0,duck:0,queued:"",buffer:0,
 flamingoSpawned:false,coins:0,powerCharge:0,powerTicks:0,powerUses:0,hearts:0,nextHeartAt:40,score:0,chain:0,bestChain:0,multiplier:1,shield:0,magnet:0,coinBoost:0,climb:0,climbReady:0,shoes:0,nextCrowAt:0,nextFishAt:0,fish:0,angry:0,checkpoints:0,arrivals:0,
 turnIndex:0,nextTurn:260,turnChoice:0,summitTurn:0,heading:0,turns:0,failReason:"",
 seed:20261029,rng:20261029,nextId:1,nextRow:30,row:0,invulnerable:0,slow:0,objects:[],events:[]};
}
export function validateAction(s,p,a){
 if(!s||s.player!==p)return{ok:false,error:"player"};
 if(!a||typeof a!=="object"||Array.isArray(a))return{ok:false,error:"action"};
 if(a.type==="start"){
  if(s.phase!=="ready")return{ok:false,error:"started"};
  if(!Number.isInteger(a.seed)||a.seed<1||a.seed>2147483647)return{ok:false,error:"seed"};
  if(!["classic","relaxed"].includes(a.mode))return{ok:false,error:"mode"};
  if(a.route!==undefined&&a.route!=="summit")return{ok:false,error:"route"};
  return{ok:true};
 }
 if(s.phase!=="playing")return{ok:false,error:"finished"};
 if(a.type==="climb")return s.climbReady>0&&!(s.climb>0)?{ok:true}:{ok:false,error:"climb-not-ready"};
 if(a.type==="power")return s.powerCharge>=30&&s.powerTicks===0?{ok:true}:{ok:false,error:"power-not-ready"};
 if(a.type==="steer")return Number.isFinite(a.lane)&&a.lane>=0&&a.lane<=2?{ok:true}:{ok:false,error:"lane"};
 if(a.type==="turn")return(a.direction===-1||a.direction===1)&&s.nextTurn-s.distance<=s.speed*1.6&&s.nextTurn>s.distance?{ok:true}:{ok:false,error:"turn-window"};
 if(a.type==='jump')return !s.fallTicks&&s.duck<=3&&(!s.jump||(s.jumpCount||1)<2)?{ok:true}:{ok:false,error:'busy'};
 if(a.type==='duck')return !s.fallTicks&&s.jump<=3&&s.duck<=3?{ok:true}:{ok:false,error:'busy'};
 if(a.type==="step"&&Object.keys(a).length===1)return{ok:true};
 return{ok:false,error:"action"};
}
function random(n){return(n*1664525+1013904223)>>>0;}
function stage(t){return Math.min(9,Math.floor(Math.max(0,t)/90));}
function zone(t){return [3,6,7,8,1,9,4,0,10,5][stage(t)];}
const pickups=['coin','heart','magnet','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch'];
// Level 10: ab summitTurn wechseln die Kurven immer ab (Zickzack zum Gipfel).
function turnDir(seed,summitTurn,i){const base=k=>((seed+k*13)%5)<2?-1:1;return !summitTurn||i<summitTurn?base(i):base(summitTurn-1)*((i-summitTurn)%2?1:-1);}
export function applyAction(s,p,a){
 if(!validateAction(s,p,a).ok)return s;
 if(a.type==="start"){const maxLives=3;return{...setup([p]),phase:"playing",mode:a.mode,maxLives,lives:maxLives,seed:a.seed,rng:a.seed,speed:a.mode==="relaxed"?14:19};}
 // Kletterausrüstung wird mit E / Power-Button angezogen.
 if(a.type==="climb")return{...s,climbReady:0,climb:200,events:[{kind:"climbStart"}]};
 if(a.type==="power")return{...s,powerCharge:0,powerTicks:120,powerUses:s.powerUses+1,slow:0,events:[{kind:"powerStart"}]};
 if(a.type==="steer")return{...s,target:a.lane,events:[]};
 if(a.type==="turn")return{...s,turnChoice:a.direction,events:[{kind:"turnReady",direction:a.direction}]};
 if(a.type==='jump'&&s.jump>0){const h=(s.jumpBase||0)*(s.jump/18)+Math.sin((18-s.jump)/18*Math.PI)*(s.jumpCount===2?1.15:1);return{...s,jump:18,jumpCount:2,jumpBase:h,jumpY:h,queued:'',buffer:0,events:[{kind:'doubleJump'}]};}
 if(a.type==="jump"||a.type==="duck"){
  if(s.jump||s.duck)return{...s,queued:a.type,buffer:4,events:[]};
  return{...s,jump:a.type==="jump"?18:0,jumpCount:a.type==="jump"?1:0,jumpBase:0,jumpY:0,duck:a.type==="duck"?16:0,events:[{kind:a.type}]};
 }
 const tick=s.tick+1,elapsed=tick*.05,events=[];
 const x=s.x+Math.max(-.4,Math.min(.4,s.target-s.x));
 let jump=Math.max(0,s.jump-1),duck=Math.max(0,s.duck-1),buffer=Math.max(0,s.buffer-1),queued=s.queued;
 let jumpCount=jump?(s.jumpCount||1):0,jumpBase=jump?(s.jumpBase||0):0,fallTicks=Math.max(0,(s.fallTicks||0)-1);
 if(s.jump===1)events.push({kind:"land"});
 if(!jump&&!duck&&queued&&buffer>0){jump=queued==="jump"?18:0;jumpCount=jump?1:0;jumpBase=0;duck=queued==="duck"?16:0;events.push({kind:queued});queued="";buffer=0;}
 if(!buffer)queued="";
 const rushRamp=s.powerTicks>0?Math.min(1,(121-s.powerTicks)/7,s.powerTicks/12):0;
 const speed=(1+.55*rushRamp)*((s.mode==="relaxed"?14:19)+Math.min(s.mode==="relaxed"?6:8,elapsed/42))*(s.slow>0&&!(s.shoes>0)?.7:1)*(s.shoes>0?1.2:1),distance=s.distance+speed*.05;
 let height=jump?jumpBase*(jump/18)+Math.sin((18-jump)/18*Math.PI)*(jumpCount===2?1.15:1):0;
 let powerCharge=s.powerCharge,powerTicks=Math.max(0,s.powerTicks-1);const powering=s.powerTicks>0;
 let flamingoSpawned=s.flamingoSpawned||false;
 let hearts=s.hearts||0,nextHeartAt=s.nextHeartAt??40;
 let lives=s.lives,score=s.score+Math.floor(distance)-Math.floor(s.distance),coins=s.coins,chain=s.chain,bestChain=s.bestChain,multiplier=s.multiplier;
 let shield=s.shield,magnet=Math.max(0,s.magnet-1),coinBoost=Math.max(0,(s.coinBoost||0)-1),climb=Math.max(0,(s.climb||0)-1),climbReady=s.climbReady||0,nextCrowAt=s.nextCrowAt||0,nextFishAt=s.nextFishAt||0,fish=s.fish||0,angry=Math.max(0,(s.angry||0)-1),shoes=Math.max(0,(s.shoes||0)-1),invulnerable=Math.max(0,s.invulnerable-1),slow=Math.max(0,s.slow-1);
 let rng=s.rng,nextId=s.nextId,nextRow=s.nextRow,row=s.row,checkpoints=s.checkpoints,arrivals=s.arrivals;
 let summitTurn=s.summitTurn||0,turnIndex=s.turnIndex,nextTurn=s.nextTurn,turnChoice=s.turnChoice,heading=s.heading,turns=s.turns,failReason=s.failReason;
 if(s.powerTicks===1){invulnerable=Math.max(invulnerable,20);events.push({kind:"powerEnd"});}
 const objects=[];
 for(const old of s.objects){
  const item={...old};item.d-=(item.approach||0)*.05;
  // Steinbock kommt von links oder rechts auf die Piste und bleibt etwa 1,2 s vor Hornox auf einer Spur stehen.
  if(item.kind==='ibex'&&!item.resolved){const dir=item.dir||1,move=1.4*Math.max(0,(item.d-distance)/speed-1.2);item.lane=dir>0?Math.max(-2.6,item.target-move):Math.min(4.6,item.target+move);}
  // Level 3: Fisch springt links aus dem See und landet genau dann auf seiner Spur, wenn Hornox dort ankommt.
  if(item.kind==='fish'&&!item.resolved&&item.target!==undefined)item.lane=Math.min(item.target,Math.max(-2.4,item.target-3.2*(item.d-distance)/speed));
  // Scheinangriff: Die Krähe zielt erst auf eine Spur und wechselt kurz vor Hornox auf die andere.
  if(item.kind==='crow'&&item.attack==='feint'&&!item.swerved&&(item.d-distance)/speed<.8){item.fake=item.lane;item.lane=item.real;item.swerved=true;}
  // The active shockwave clears all three lanes just ahead of Hornox, once per object.
  if(powering&&!item.resolved&&!pickups.includes(item.kind)&&item.d>distance-2&&item.d<=distance+11){
   item.resolved=true;item.powerCleared=true;score+=25;
   events.push({kind:'powerClear',object:item.kind,lane:item.lane,d:item.d,id:item.id,points:25});
  }
  if(!item.resolved&&old.d-(old.front||0)>s.distance&&item.d-(item.front||0)<=distance){
   item.resolved=true;
   const aligned=item.lane===-1||Math.abs(x-item.lane)<(item.kind==="coin"?.5:item.hitWidth||.38);
   if(item.kind==="coin"){
    if(aligned||magnet>0||powering){const value=coinBoost>0?2:1;coins+=value;if(!powering&&powerCharge<30){powerCharge=Math.min(30,powerCharge+value);if(powerCharge===30)events.push({kind:"powerReady"});}chain++;bestChain=Math.max(bestChain,chain);multiplier=Math.min(4,1+Math.floor(chain/8));score+=10*multiplier*value;events.push({kind:"pickup",points:10*multiplier*value,lane:item.lane});if(chain%8===0)events.push({kind:"combo",multiplier});}
    else{chain=0;multiplier=1;}
   }else if(item.kind==="heart"){
    if(aligned&&lives>0){const gained=lives<s.maxLives;hearts++;if(gained)lives++;else score+=50;events.push({kind:"heart",gained,lives,lane:item.lane,points:gained?0:50});}
   }else if(item.kind==="magnet"){
    if(aligned){magnet=160;events.push({kind:"magnet"});}
   }else if(item.kind==='shieldOrb'){
    if(aligned){if(shield)score+=50;shield=1;events.push({kind:'powerPickup',power:'pickupShield'});}
   }else if(item.kind==='coinBoost'){
    if(aligned){coinBoost=200;events.push({kind:'powerPickup',power:'pickupBoost'});}
   }else if(item.kind==='fishCatch'){
    // Level 3: Fische sammeln. Ab 5 Fischen wird der Fischer wütend und jagt Hornox 20 Sekunden lang.
    if(aligned){fish++;events.push({kind:'fishCatch',fish});if(fish>=5&&!angry){fish=0;angry=400;events.push({kind:'fisherAngry'});}}
   }else if(item.kind==='climbGear'){
    // Level 10: Kletterausrüstung wird eingepackt und später mit E / Button angezogen.
    if(aligned){climbReady=1;events.push({kind:'powerPickup',power:'pickupClimb'});}
   }else if(item.kind==='snowshoes'){
    // Level 10: Schneeschuhe – 10 Sekunden schneller und kein Abbremsen nach Treffern.
    if(aligned){shoes=200;slow=0;events.push({kind:'powerPickup',power:'pickupShoes'});}
   }else if(item.kind==='rushCharge'){
    if(aligned){const before=powerCharge;powerCharge=Math.min(30,powerCharge+15);if(before===30)score+=100;events.push({kind:'powerPickup',power:'pickupCharge'});if(before<30&&powerCharge===30)events.push({kind:'powerReady'});}
   }else if(aligned&&powering){score+=25;events.push({kind:"powerClear",object:item.kind,lane:item.lane,d:item.d,id:item.id,points:25});item.powerCleared=true;
   }else if(aligned){
    const safe=item.kind==="hook"?false:item.kind==="crow"?(item.attack==="snatch"&&height>.4):["iceArch","branch","awning","rope"].includes(item.kind)?duck>0:["crevasse","ridgeGap","manhole"].includes(item.kind)?height>.5:height>.4;
    if(!safe&&!invulnerable&&!climb){
     // Krähe: kostet kein Leben, klaut aber bis zu 10 Münzen.
     if(shield){shield=0;invulnerable=25;events.push({kind:"shieldHit"});}
     else if(item.kind==='crow'){const lost=Math.min(coins,10);coins-=lost;lives--;chain=0;multiplier=1;invulnerable=30;slow=12;failReason='crow';events.push({kind:'crow',lost,attack:item.attack});}
     else{lives--;chain=0;multiplier=1;score=Math.max(0,score-40);invulnerable=30;slow=12;failReason=item.kind;events.push({kind:"bump",object:item.kind});if(item.kind==='manhole'){fallTicks=20;jump=0;jumpCount=0;jumpBase=0;height=0;events.push({kind:'fall'});}}
    }else if(safe||climb){score+=10;events.push({kind:"clear",object:item.kind,points:10});}
   }else if(item.lane>=0&&Math.abs(x-item.lane)<.95&&!invulnerable){score+=10;events.push({kind:"nearMiss",object:item.kind,points:10});}
  }
  if(!item.powerCleared&&item.d>distance-10&&!(item.resolved&&pickups.includes(item.kind)))objects.push(item);
 }
 while(nextRow<distance+165){
  const d=nextRow;rng=random(rng);let safe=(rng>>>16)%3;rng=random(rng);
  const arrivalTime=elapsed+(d-distance)/speed,z=zone(arrivalTime),variant=(rng>>>16)%8;
  const add=(kind,lane,offset=0,extra=null)=>{
   const pace=s.mode==="relaxed"?.75:1;
   const approach=(["pedestrian","photographers","hiker","influencer","lostTourists","skiers","snowboarders"].includes(kind)?2.4:kind==="carriage"?4.2:kind==="scooter"?6.5:kind==="electric"?7:kind==="rockfall"?3.5:kind==="bike"?8+Math.min(2,elapsed/120):kind==="marmot"?3.8:kind==="sheep"?2.8:kind==="trolley"?4.5:kind==="luggage"?2:kind==="crow"?6:0)*pace;
   // Give incoming actors a lead so the entire row reaches the runner together.
   // This preserves the open lane and prevents faster NPCs overtaking jump/slide rows.
   const lead=Math.max(0,(d+offset-distance)/speed)*approach;
   const front=kind==='carriage'?5:0;
   objects.push({id:nextId++,kind,lane,d:d+offset+lead+front,front,hitWidth:kind==='carriage'?.91:.38,formation:row%2,bornTick:tick,resolved:false,biome:z,approach,rowId:row,encounter:d+offset,...(kind==='ibex'?{target:lane,dir:(rng&1024)?1:-1,lane:(rng&1024)?-2.6:4.6}:kind==='fish'?{target:lane,lane:-2.4}:{}),...extra});
  };
  let pattern=row<2?8:row===2?0:row===3?1:row===4?2:variant;
  const nearest=260+Math.max(0,Math.round((d-260)/680))*680;
  // Short breathing room at corners and biome boundaries; no long empty stretches.
  if(Math.abs(d-nearest)<Math.max(48,speed*2.2)||[90,180,270,360,450,540,630,720,810].some(t=>Math.abs(arrivalTime-t)<2.5)||arrivalTime>893)pattern=8;
  if([2,3].includes(z)&&pattern===6)safe=(rng&1)?0:2;
  const one=(safe+1)%3,two=(safe+2)%3,busy=row>=(s.mode==="relaxed"?12:5);
  if(!flamingoSpawned&&arrivalTime>=65&&[2,3].includes(z)&&pattern!==8){add('flamingo',one);flamingoSpawned=true;}
  else if(z===5){
   // Level 10 (Matterhorn): Steinböcke springen auf die Piste, Krähen klauen Münzen.
   if(pattern===0){add("iceBlock",one);if(busy)add("crevasse",two);}
   else if(pattern===1)add("crevasse",-1);
   // Krähen-Angriffe: Sturzflug (Spur wechseln), Münzenklau (springen),
   // Scheinangriff (nicht zu früh reagieren) und Doppelangriff (zwei Krähen).
   // Krähen: zwischen zwei Angriffen liegen mindestens 8 Sekunden (plus 0–4 s Zufall).
   else if(pattern===2)add("iceArch",-1);
   else if(pattern===3){add("ibex",one);if(busy)add("iceBlock",two);}
   else if(pattern===4){add("crevasse",one);if(busy)add("iceArch",two);}
   else if((pattern===5||pattern===7)&&arrivalTime>=nextCrowAt){
    nextCrowAt=arrivalTime+8+((rng>>>20)%5);const kind=(rng>>>8)%4;
    if(kind===0)add("crow",one,0,{attack:"snatch"});
    else if(kind===1)add("crow",safe,0,{attack:"feint",real:one});
    else if(kind===2&&busy){add("crow",one,0,{attack:"dive",double:true});add("crow",two,0,{attack:"dive",double:true});}
    else add("crow",one,0,{attack:"dive"});
   }
   else if(pattern===5){add("iceBlock",one);if(busy)add("ibex",two);}
   else if(pattern===6){add("iceArch",two);if(busy)add("crevasse",one);}
   else if(pattern===7){add("ibex",one);if(busy)add("crevasse",two);}
  }else if(z===0){
   if(pattern===0){add("iceBlock",one);if(busy)add("crevasse",two);}
   else if(pattern===1)add("crevasse",-1);
   else if(pattern===2)add("iceArch",-1);
   else if(pattern===3){add("crevasse",one);if(busy)add("iceBlock",two);}
   else if(pattern===4){add("crevasse",one);if(busy)add("iceArch",two);}
   else if(pattern===5||pattern===7){add("iceBlock",one);if(busy)add("iceBlock",two);}
   else if(pattern===6){add("iceArch",two);if(busy)add("crevasse",one);}
  }else if(z===7){
   // Level 3 (Zum See): schmaler Wanderweg am See, springende Fische.
   // Springende Fische: zwischen zwei Fisch-Sprüngen liegen mindestens 6 Sekunden (plus 0–3 s Zufall).
   const fishOk=arrivalTime>=nextFishAt,leap=lane=>{add("fish",lane);nextFishAt=arrivalTime+6+((rng>>>20)%4);};
   if(pattern===0){add("hiker",one);if(busy)add("marmot",two);}
   else if(pattern===1)add("log",-1);
   else if(pattern===2)add("branch",-1);
   else if(pattern===3){if(fishOk)leap(one);else add("marmot",one);if(busy)add("hiker",two);}
   else if(pattern===4){add("bike",one);if(busy)add("hiker",two);}
   else if(pattern===5){if(fishOk)leap(one);else add("hiker",one);if(busy)add("marmot",two);}
   else if(pattern===6){add("marmot",two);if(busy)add("hiker",one);}
   else if(pattern===7){if(fishOk)leap(one);else add("bike",one);if(busy)add("bike",two,2);}
  }else if([1,6,8].includes(z)){
   if(pattern===0){add("hiker",one);if(busy)add("sheep",two);}
   else if(pattern===1)add("log",-1);
   else if(pattern===2)add("branch",-1);
   else if(pattern===3){add("marmot",one);if(busy)add("sheep",two);}
   else if(pattern===4){add("bike",one);if(busy)add("hiker",two);}
   else if(pattern===5){add("bike",one);if(busy)add("marmot",two);}
   else if(pattern===6){add("marmot",two);if(busy)add("sheep",one);}
   else if(pattern===7){add("bike",one);if(busy)add("bike",two,2);}
  }else if(z===2){
   if(pattern===0){add("photographers",one);if(busy)add("electric",two);}
   else if(pattern===1)add("barrier",-1);
   else if(pattern===2){add("awning",two);if(busy)add("cafe",one);}
   else if(pattern===3){add("scooter",one);if(busy)add("lostTourists",two);}
   else if(pattern===7){add("electric",one);if(busy)add("influencer",two);}
   else if(pattern===4){add("manhole",one);if(busy)add("bike",two);}
   else if(pattern===5){add("pedestrian",one);if(busy)add("cafe",two);}
   else if(pattern===6)add("carriage",(one+two)/2);
  }else if([4,9,10].includes(z)){
   if(pattern===0){add("hiker",one);if(busy)add("lowRock",two);}
   else if(pattern===1)add("ridgeGap",-1);
   else if(pattern===2)add("rope",-1);
   else if(pattern===3||pattern===7){add("rockfall",one);if(busy)add("boulder",two);}
   else if(pattern===4){add("lowRock",one);if(busy)add("boulder",two);}
   else if(pattern===5){add("hiker",one);if(busy)add("rockfall",two);}
   else if(pattern===6){add("boulder",two);if(busy)add("ridgeGap",one);}
  }else{
   if(pattern===0){add("snowman",one);if(busy)add("luggage",two);}
   else if(pattern===4){add("scooter",one);if(busy)add("bike",two);}
   else if(pattern===1){add("trolley",one);if(busy)add("luggage",two);}
   else if(pattern===5){add("bike",one);if(busy)add("photographers",two);}
   else if(pattern===2){add((rng&512)?"snowboarders":"lostTourists",two);if(busy)add(row%2?"pedestrian":"influencer",one);}
   else if(pattern===6)add("carriage",(one+two)/2);
   else if(pattern===3){add((rng&256)?"skiers":"planter",one);if(busy)add("luggage",two);}
   else if(pattern===7){add("manhole",one);if(busy)add("electric",two);}
  }
  const heartDue=arrivalTime>=nextHeartAt&&arrivalTime<885&&pattern!==1&&pattern!==2&&Math.abs(d-nearest)>Math.max(80,speed*3);
  if(heartDue){add("heart",safe,11);nextHeartAt=arrivalTime+52+((rng>>>24)%22);}
  for(const offset of(heartDue?[5,17]:[5,9,13,17]))add("coin",safe,offset);
  // Level 3: jede zweite Reihe ein Fisch zum Sammeln, damit der Fischer nach rund 10–15 s wütend wird.
  if(z===7&&row%2===1&&!heartDue)add("fishCatch",safe,22);
  if(row>8&&row%17===8&&pattern!==8)add(z===5?['climbGear','snowshoes'][Math.floor(row/17)%2]:['magnet','shieldOrb','coinBoost','rushCharge'][Math.floor(row/17)%4],safe,-8);
  row++;nextRow+=s.mode==="relaxed"?Math.max(34,38-elapsed/120):Math.max(23,26-elapsed/110);
 }
 // Wütender Fischer: wirft alle 3 s die Angel auf Hornox' Spur (jedes zweite Mal auf zwei Spuren).
 if(angry>40&&angry%60===0){const lane=Math.max(0,Math.min(2,Math.round(s.target))),cast=Math.floor(angry/60)%2;const lanes=cast?[lane,lane===2?1:lane+1]:[lane];for(const l of lanes)objects.push({id:nextId++,kind:'hook',lane:l,d:distance+speed*1.5,front:0,hitWidth:.42,formation:0,bornTick:tick,resolved:false,biome:7,approach:0,rowId:-1,encounter:distance+speed*1.5});events.push({kind:'fisherCast',lanes});}
 if(s.angry===1)events.push({kind:'fisherQuit'});
 if(!summitTurn&&elapsed>=785)summitTurn=Math.floor((distance+440)/680)+1;
 if(distance>=nextTurn&&elapsed<892){
  const direction=turnDir(s.seed,summitTurn,turnIndex);
  if(turnChoice!==direction&&!powering){if(shield)shield=0;else lives--;slow=16;invulnerable=30;failReason="turn";events.push({kind:"missedTurn"});}
  else{score+=75;turns++;events.push({kind:"turn",direction});}
  heading+=direction*Math.PI/2;turnIndex++;nextTurn=260+turnIndex*680;turnChoice=0;
 }
 if(Math.floor(elapsed/120)>checkpoints){checkpoints=Math.floor(elapsed/120);shield=1;score+=150;events.push({kind:"checkpoint"});}
 if(stage(elapsed)!==stage(s.elapsed)){
  const nextStage=stage(elapsed);
  const gained=lives>0&&lives<s.maxLives;if(gained)lives++;score+=250;events.push({kind:"world",zone:zone(elapsed),stage:nextStage,gained});
 }
 const phase=lives<=0?"lost":elapsed>=900?"won":"playing";
 if(phase==="won"){score+=2000;events.push({kind:"summit",points:2000});}
 return{...s,phase,tick,elapsed,distance,speed,x,lives,jump,jumpCount,jumpBase,jumpY:height,fallTicks,duck,queued,buffer,coins,flamingoSpawned,powerCharge,powerTicks,hearts,nextHeartAt,score,chain,bestChain,multiplier,shield,magnet,coinBoost,climb,climbReady,shoes,nextCrowAt,nextFishAt,fish,angry,checkpoints,arrivals,turnIndex,nextTurn,turnChoice,summitTurn,heading,turns,failReason,invulnerable,slow,rng,nextId,nextRow,row,objects,events};
}
export function isGameOver(s){return ["lost","won"].includes(s.phase)?{over:true,winner:s.phase==="won"?s.player:null,score:s.score,coins:s.coins,distance:Math.floor(s.distance),arrivals:s.arrivals}:{over:false};}
export function viewFor(s,p){return{...s,objects:s.objects.map(o=>({...o})),events:s.events.map(e=>({...e})),spectator:p!==s.player};}

