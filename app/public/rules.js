export const meta={game:"Hornox Run · Zermatt",minPlayers:1,maxPlayers:1};
export function setup(players){
 return{version:17,player:players[0]||"guest",phase:"ready",mode:"classic",route:"summit",
 tick:0,elapsed:0,distance:0,speed:18,x:1,target:1,lives:3,maxLives:3,jump:0,jumpCount:0,jumpBase:0,jumpY:0,fallTicks:0,duck:0,queued:"",buffer:0,
 flamingoSpawned:false,coins:0,items:0,shop:0,shopSeen:0,powerCharge:0,powerTicks:0,powerUses:0,hearts:0,nextHeartAt:40,score:0,chain:0,bestChain:0,multiplier:1,shield:0,magnet:0,coinBoost:0,climb:0,climbReady:0,shoes:0,nextCrowAt:0,nextFishAt:0,nextBeaverAt:0,nextGullAt:0,lastHazardAt:0,nextFrogAt:0,fish:0,angry:0,chaseGap:0,nextCastTick:0,lastBumpTick:0,attackSeq:0,boar:0,boarGap:0,boarBump:0,dog:0,dogGap:0,dogBump:0,dogMode:0,scared:0,checkpoints:0,arrivals:0,
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
 // Bergladen am Ende jedes Levels: Sammelobjekte gegen Leben tauschen (5 = 1 Leben, 10 = 2 Leben, höchstens 5 Leben).
 if(a.type==="shop")return s.shop>0&&(a.offer===5||a.offer===10)&&(s.items||0)>=a.offer&&s.lives+(a.offer===10?2:1)<=SHOP_MAX_LIVES?{ok:true}:{ok:false,error:"shop"};
 if(a.type==="shopClose")return s.shop>0?{ok:true}:{ok:false,error:"shop"};
 if(a.type==="climb")return s.climbReady>0&&!(s.climb>0)?{ok:true}:{ok:false,error:"climb-not-ready"};
 if(a.type==="power")return s.powerCharge>=30&&s.powerTicks===0?{ok:true}:{ok:false,error:"power-not-ready"};
 if(a.type==="steer")return Number.isFinite(a.lane)&&a.lane>=0&&a.lane<=2?{ok:true}:{ok:false,error:"lane"};
 if(a.type==="turn")return(a.direction===-1||a.direction===1)&&s.nextTurn-s.distance<=s.speed*1.6&&s.nextTurn>s.distance?{ok:true}:{ok:false,error:"turn-window"};
 if(a.type==='jump')return !s.fallTicks&&s.duck<=3&&(!s.jump||(s.jumpCount||1)<2)?{ok:true}:{ok:false,error:'busy'};
 if(a.type==='duck')return !s.fallTicks&&s.jump<=3&&s.duck<=3?{ok:true}:{ok:false,error:'busy'};
 if(a.type==="step"&&Object.keys(a).length===1)return{ok:true};
 return{ok:false,error:"action"};
}
const SHOP_MAX_LIVES=5,SHOP_AT=84.6;   // Eingang des Bergladens bei Sekunde 84,5 jedes Levels; der Laden öffnet, wenn Hornox drin steht
function random(n){return(n*1664525+1013904223)>>>0;}
function stage(t){return Math.min(9,Math.floor(Math.max(0,t)/90));}
function zone(t){return [3,6,7,8,1,9,4,0,10,5][stage(t)];}
const pickups=['token','coin','heart','magnet','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom','herb','cheese','goldBell','edelweiss','honey'];
// Level 4 (Furi): morsche Holzbrücke über den Bach – in diesen Zeitfenstern brechen Bretter weg.
function bridgeAt(t){return t>=317&&t<327;} // gleiche Zeiten wie in journey.js
// Level 5 «Alpweiden» (6:00–7:30): Abschnitte und Challenge-Fenster (gleich wie in journey.js).
function meadowSection(t){return t<360||t>=450?0:t<382.5?1:t<405?2:t<427.5?3:4;}
const HERD=[388,394],COWS=[398,404],HAY=[409,421];
// Level 6 «Schwarzsee» (7:30–9:00): Abschnitte und Steinpfad-Fenster (gleich wie in journey.js).
function lakeSection(t){return t<450||t>=540?0:t<472.5?1:t<495?2:t<517.5?3:4;}
function stoneAt(t){return t>=474&&t<492||t>=500&&t<508||t>=519&&t<538;}
// Level 7 «Hörnliweg» (9:00–10:30): 5 Abschnitte à 18 s – 1 Schotterweg, 2 enger Bergpfad, 3 Metalltreppen/-brücke,
// 4 Schneefelder, 5 Blick auf Matterhorn und Hörnlihütte. Metallbrücke (nur mittlere Spur begehbar) in Abschnitt 3.
function hornliSection(t){return t<540||t>=630?0:1+Math.min(4,Math.floor((t-540)/18));}
function hornliBridge(t){return t>=581&&t<586||t>=589&&t<592;}
// Schmaler Holzsteg im felsigen Aufstieg: nur eine Spur begehbar – zuerst die Mitte, danach rechts.
function hornliSteg(t){return t>=581&&t<586?1:t>=589&&t<592?2:-1;}
// Level 6: alle 21 s ein Wechsel – 15 s auf dem Wasser (Balken und versunkene Steine), danach 6 s Schlammebene.
function swampMud(t){return t>=450&&t<540&&(t-450)%21>=15;}
// Level 10: ab summitTurn wechseln die Kurven immer ab (Zickzack zum Gipfel).
function turnDir(seed,summitTurn,i){const base=k=>((seed+k*13)%5)<2?-1:1;return !summitTurn||i<summitTurn?base(i):base(summitTurn-1)*((i-summitTurn)%2?1:-1);}
export function applyAction(s,p,a){
 if(!validateAction(s,p,a).ok)return s;
 if(a.type==="start"){const maxLives=3;return{...setup([p]),phase:"playing",mode:a.mode,maxLives,lives:maxLives,seed:a.seed,rng:a.seed,speed:a.mode==="relaxed"?14:19};}
 // Kletterausrüstung wird mit E / Power-Button angezogen.
 if(a.type==="shop"){const gain=a.offer===10?2:1,lives=s.lives+gain,items=s.items-a.offer;return{...s,lives,items,events:[{kind:"shopBuy",offer:a.offer,gain,lives,items}]};}
 if(a.type==="shopClose")return{...s,shop:0,events:[{kind:"shopClose"}]};
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
 const speed=(1+.55*rushRamp)*((s.mode==="relaxed"?14:19)+Math.min(s.mode==="relaxed"?6:8,elapsed/42))*(s.slow>20&&!(s.shoes>0)?.35:s.slow>0&&!(s.shoes>0)?.7:1)*(s.shoes>0?1.2:1),distance=s.distance+speed*.05;
 let height=jump?jumpBase*(jump/18)+Math.sin((18-jump)/18*Math.PI)*(jumpCount===2?1.15:1):0;
 let powerCharge=s.powerCharge,powerTicks=Math.max(0,s.powerTicks-1);const powering=s.powerTicks>0;
 let flamingoSpawned=s.flamingoSpawned||false;
 let items=s.items||0,shop=s.shop||0,shopSeen=s.shopSeen||0;
 let hearts=s.hearts||0,nextHeartAt=s.nextHeartAt??40;
 let lives=s.lives,score=s.score+Math.floor(distance)-Math.floor(s.distance),coins=s.coins,chain=s.chain,bestChain=s.bestChain,multiplier=s.multiplier;
 let shield=s.shield,magnet=Math.max(0,s.magnet-1),coinBoost=Math.max(0,(s.coinBoost||0)-1),climb=Math.max(0,(s.climb||0)-1),climbReady=s.climbReady||0,nextCrowAt=s.nextCrowAt||0,nextFishAt=s.nextFishAt||0,nextBeaverAt=s.nextBeaverAt||0,nextGullAt=s.nextGullAt||0,lastHazardAt=s.lastHazardAt||0,nextFrogAt=s.nextFrogAt||0,chaseGap=s.chaseGap||0,nextCastTick=s.nextCastTick||0,lastBumpTick=s.lastBumpTick||0,attackSeq=s.attackSeq||0,hookedAttack=0,boar=Math.max(0,(s.boar||0)-1),boarGap=s.boarGap||0,boarBump=s.boarBump||0,dog=Math.max(0,(s.dog||0)-1),dogGap=s.dogGap||0,dogBump=s.dogBump||0,dogMode=s.dogMode||0,beeNest=s.beeNest||0,beeStings=s.beeStings||0,honeyNext=s.honeyNext||0,scared=s.scared||0,fish=s.fish||0,angry=Math.max(0,(s.angry||0)-1),shoes=Math.max(0,(s.shoes||0)-1),invulnerable=Math.max(0,s.invulnerable-1),slow=Math.max(0,s.slow-1);
 let rng=s.rng,nextId=s.nextId,nextRow=s.nextRow,row=s.row,checkpoints=s.checkpoints,arrivals=s.arrivals;
 let summitTurn=s.summitTurn||0,turnIndex=s.turnIndex,nextTurn=s.nextTurn,turnChoice=s.turnChoice,heading=s.heading,turns=s.turns,failReason=s.failReason;
 if(s.powerTicks===1){invulnerable=Math.max(invulnerable,20);events.push({kind:"powerEnd"});}
 const objects=[];
 for(const old of s.objects){
  const item={...old};item.d-=(item.approach||0)*.05;
  // Steinbock kommt von links oder rechts auf die Piste und bleibt etwa 1,2 s vor Hornox auf einer Spur stehen.
  if(item.kind==='ibex'&&!item.resolved){const dir=item.dir||1,move=1.4*Math.max(0,(item.d-distance)/speed-1.2);item.lane=dir>0?Math.max(-2.6,item.target-move):Math.min(4.6,item.target+move);}
  // Level 5: Tiere und Heuballen bewegen sich quer zur Strecke (v = Spuren pro Sekunde). «stop» = bleibt rund 1 s vor
  // Hornox auf seiner Spur stehen (Ziegen, stehende Schafe), sonst läuft es weiter und kreuzt genau bei Hornox die Ziel-Spur.
  if(item.v&&!item.resolved&&item.target!==undefined){const g=(item.d-distance)/speed,move=item.v*Math.max(0,item.stop?g-1:g),dir=item.dir||1;item.lane=dir>0?Math.max(-2.6,item.target-move):Math.min(4.6,item.target+move);}
  // Level 4: Wildschweine laufen quer über den Weg und erreichen Hornox auf ihrer Ziel-Spur.
  if(item.kind==='boarCross'&&!item.resolved&&item.target!==undefined)item.lane=Math.max(-2.6,Math.min(4.6,item.target-(item.dir||1)*3.6*(item.d-distance)/speed));
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
   }else if(item.kind==='token'){
    // Level-Sammelobjekt (Münze, Blatt, Tannenzapfen, Blume, Seestein, Beeren, Eiskristall, Bergkristall, Gipfelstern) für den Bergladen.
    if(aligned){items++;score+=50;events.push({kind:'token',items,zone:item.biome,lane:item.lane});}
   }else if(item.kind==='fishCatch'){
    // Level 3: Fische landen im Wanderrucksack. Bei 10 Fischen wird der Fischer aufmerksam,
    // bei 20 Fischen wütend: dann wirft er 20 Sekunden lang die Angel nach Hornox.
    if(aligned){fish++;items++;events.push({kind:'fishCatch',fish,items});if(fish===10)events.push({kind:'fisherNotice'});if(fish===20&&!angry){angry=400;events.push({kind:'fisherAngry'});}}
   }else if(item.kind==='mushroom'){
    // Level 4: Glückspilz = Bonuspunkte.
    if(aligned){score+=250;events.push({kind:'mushroom',points:250,lane:item.lane});}
   }else if(item.kind==='honey'){
    // Level 5: Honig am alten Bienenbaum – +150, aber der Schwarm fliegt aus dem Nest hinterher.
    if(aligned){score+=150;events.push({kind:'honey',points:150});if(!(dog>0)){dog=60*20;dogGap=8;dogBump=tick;dogMode=1;beeStings=0;beeNest=item.d;events.push({kind:'beesAppear',reason:'honey',nest:item.d,side:item.lane===0?-1:1});}}
   }else if(['herb','cheese','goldBell','edelweiss'].includes(item.kind)){
    // Level 5: Alpenkräuter, Käse, goldene Kuhglocken, goldenes Edelweiss. «high» = schwebt über einem Hindernis, nur im Sprung.
    const pts={herb:150,cheese:200,goldBell:400,edelweiss:1000}[item.kind];if(aligned&&(!item.high||height>.4)){score+=pts;events.push({kind:'meadowPickup',item:item.kind,points:pts});}
   }else if(item.kind==='climbGear'){
    // Level 10: Kletterausrüstung wird eingepackt und später mit E / Button angezogen.
    if(aligned){climbReady=1;events.push({kind:'powerPickup',power:'pickupClimb'});}
   }else if(item.kind==='snowshoes'){
    // Level 10: Schneeschuhe – 10 Sekunden schneller und kein Abbremsen nach Treffern.
    if(aligned){shoes=200;slow=0;events.push({kind:'powerPickup',power:'pickupShoes'});}
   }else if(item.kind==='snowPatch'){
    // Level 7: kleines Schneefeld – rutschig: kurz langsamer, kein Leben weg; drüberspringen oder ausweichen.
    if(aligned){if(height>.4||climb||powering||invulnerable){score+=10;events.push({kind:'clear',object:item.kind,points:10});}else{slow=Math.max(slow,18);events.push({kind:'slip'});}}
   }else if(item.kind==='mudPuddle'){
    // Schlammpfütze: drüberspringen oder ausweichen; hineinlaufen = kurz stecken bleiben (stark gebremst), kein Leben weg.
    if(aligned){if(height>.4||climb||powering||invulnerable){score+=10;events.push({kind:'clear',object:item.kind,points:10});}else{slow=Math.max(slow,36);chain=0;multiplier=1;events.push({kind:'mudStuck'});}}
   }else if(item.kind==='rushCharge'){
    if(aligned){const before=powerCharge;powerCharge=Math.min(30,powerCharge+15);if(before===30)score+=100;events.push({kind:'powerPickup',power:'pickupCharge'});if(before<30&&powerCharge===30)events.push({kind:'powerReady'});}
   }else if(aligned&&powering){score+=25;events.push({kind:"powerClear",object:item.kind,lane:item.lane,d:item.d,id:item.id,points:25});item.powerCleared=true;
   }else if(aligned){
    const safe=["trunk","fallingBranch","sign","hayBale","haystack","cow","cowWalk","hayRoll","fenceTall","rockFace","ledge","signpost","looseRocks","railLane"].includes(item.kind)?false:item.kind==="hook"?(item.attack==="high"?duck>0:height>.4):item.kind==="gull"?false:item.kind==="crow"?(item.attack==="snatch"&&height>.4):["iceArch","branch","awning","rope","highLog","gate","metalStrut","beamLow","overhang"].includes(item.kind)?duck>0:["crevasse","ridgeGap","manhole","plankGap","stream","ditch","waterGap"].includes(item.kind)?height>.5:height>.4;
    if(!safe&&!invulnerable&&!climb){
     // Möwe: kostet kein Leben, stiehlt aber bis zu 3 Fische aus dem Rucksack.
     if(item.kind==='gull'){const lost=Math.min(fish,3);fish-=lost;invulnerable=15;events.push({kind:'gull',lost,fish});}
     else if(shield){shield=0;invulnerable=25;events.push({kind:"shieldHit"});}
     else if(item.kind==='crow'){const lost=Math.min(coins,10);coins-=lost;lives--;chain=0;multiplier=1;invulnerable=30;slow=12;failReason='crow';events.push({kind:'crow',lost,attack:item.attack});}
     else{lives--;chain=0;multiplier=1;score=Math.max(0,score-40);invulnerable=item.kind==='hook'?50:30;slow=12;failReason=item.kind;events.push({kind:"bump",object:item.kind});if(item.kind==='hook'){hookedAttack=item.attackId;events.push({kind:'hooked',attack:item.attack});}if(item.kind==='waterGap')events.push({kind:'splash'});if(item.kind==='manhole'||item.kind==='waterGap'){fallTicks=20;jump=0;jumpCount=0;jumpBase=0;height=0;events.push({kind:'fall'});}}
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
   const approach=(["pedestrian","photographers","hiker","influencer","lostTourists","skiers","snowboarders"].includes(kind)?2.4:kind==="carriage"?4.2:kind==="scooter"?6.5:kind==="electric"?7:kind==="rockfall"?3.5:kind==="bike"?8+Math.min(2,elapsed/120):kind==="marmot"?3.8:kind==="sheep"?2.8:kind==="trolley"?4.5:kind==="luggage"?2:kind==="crow"||kind==="gull"?6:0)*pace;
   // Give incoming actors a lead so the entire row reaches the runner together.
   // This preserves the open lane and prevents faster NPCs overtaking jump/slide rows.
   const lead=Math.max(0,(d+offset-distance)/speed)*approach;
   const front=kind==='carriage'?5:0;if(lane===-1)fullRow=true;
   objects.push({id:nextId++,kind,lane,d:d+offset+lead+front,front,hitWidth:kind==='carriage'?.91:.38,formation:row%2,bornTick:tick,resolved:false,biome:z,approach,rowId:row,encounter:d+offset,...(kind==='ibex'?{target:lane,dir:(rng&1024)?1:-1,lane:(rng&1024)?-2.6:4.6}:kind==='fish'?{target:lane,lane:-2.4}:{}),...extra});
  };
  let fullRow=false,pattern=row<2?8:row===2?0:row===3?1:row===4?2:variant;
  const nearest=260+Math.max(0,Math.round((d-260)/680))*680;
  // Short breathing room at corners and biome boundaries; no long empty stretches.
  if(Math.abs(d-nearest)<Math.max(48,speed*2.2)||[90,180,270,360,450,540,630,720,810].some(t=>Math.abs(arrivalTime-t)<2.5||arrivalTime>t-90+SHOP_AT-3&&arrivalTime<t-90+SHOP_AT+2.5)||arrivalTime>893)pattern=8;
  if([2,3].includes(z)&&pattern===6)safe=(rng&1)?0:2;
  if(z===4&&hornliSteg(arrivalTime)>=0)safe=hornliSteg(arrivalTime);   // Münzen nur auf dem Holzsteg, nie über dem Abgrund
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
   // Level 3 (Zum See): schmaler Wanderweg am See.
   // Gefahren am See, nie dichter als 3 s hintereinander:
   // springender Fisch alle 10 s, Biber mit Baumstamm alle 13 s, Möwe alle 11 s. Sonst nichts auf dem Weg.
   const free=pattern!==8&&arrivalTime>=lastHazardAt+3;
   // Der Fisch hat Vorrang (fester 10-s-Takt); zwischen Biber und Möwe entscheidet der Zufall.
   const due=!free?[]:arrivalTime>=nextFishAt?["fish"]:[arrivalTime>=nextBeaverAt&&"beaverLog",arrivalTime>=nextGullAt&&"gull"].filter(Boolean);
   if(due.length){const pick=due[(rng>>>12)%due.length];lastHazardAt=arrivalTime;
    if(pick==="fish"){add("fish",one);nextFishAt=arrivalTime+10;}
    else if(pick==="beaverLog"){add("beaverLog",-1);nextBeaverAt=arrivalTime+13;fullRow=true;}
    else{add("gull",one);nextGullAt=arrivalTime+11;}}
  }else if(z===8&&bridgeAt(arrivalTime)){
   // Auf der Brücke: einzelne Bretter brechen weg (springen oder Spur wechseln), eine Spur bleibt immer frei.
   if(pattern===8){}else if(pattern%3===0&&busy){add("plankGap",one);add("plankGap",two);}else add("plankGap",one);
  }else if(z===8){
   // Level 4 «Furi · Waldpfad» in vier Abschnitten: 1 heller Wald (einfach), 2 tiefer Wald (bewegliche Tiere),
   // 3 Waldschlucht (Bäche, schwierige Sprünge), 4 wilde Waldjagd (Kombinationen).
   const sec=arrivalTime<292.5?1:arrivalTime<315?2:arrivalTime<337.5?3:4,side=(rng&2048)?1:-1,cross=(kind,lane)=>add(kind,lane,0,{target:lane,dir:side,lane:side>0?-2.6:4.6});
   if(pattern===8){}
   else if(sec===1){const k=["roots","log","boulder","sign","roots","trunk","boulder","log"][pattern];add(k,k==="log"?-1:one);}
   else if(sec===2){
    if(pattern===0)cross("boarCross",one);else if(pattern===1)add("highLog",-1);else if(pattern===2){add("roots",one);if(busy)add("boulder",two);}
    else if(pattern===3){add("trunk",one);if(busy)add("sign",two);}else if(pattern===4){add("fallingBranch",one);if(busy)add("roots",two);}else if(pattern===5)add("log",-1);
    else if(pattern===6){cross("boarCross",one);if(busy)add("trunk",two);}else{add("sign",one);if(busy)add("boulder",two);}
   }else if(sec===3){
    if(pattern===0||pattern===4)add("stream",-1);else if(pattern===1){add("fallingBranch",one);if(busy)add("roots",two);}else if(pattern===2)cross("boarCross",one);
    else if(pattern===3)add("log",-1);else if(pattern===5){add("roots",one);add("boulder",two);}else if(pattern===6)add("trunk",one);else add("highLog",-1);
   }else{
    if(pattern===0){add("fallingBranch",one);add("trunk",two);}else if(pattern===1)add("stream",-1);else if(pattern===2){cross("boarCross",one);add("boulder",two);}
    else if(pattern===3)add("highLog",-1);else if(pattern===4){add("fallingBranch",one);add("roots",two);}else if(pattern===5)add("log",-1);
    else if(pattern===6){add("trunk",one);add("sign",two);}else{cross("boarCross",one);add("fallingBranch",two);}
   }
  }else if(z===1){
   // Level 5 «Alpweiden»: nur Holzzäune als Hindernisse.
   //  fence     niedriger Zaun über den ganzen Weg → drüberspringen
   //  fenceTall hoher Zaun in einer Spur → zu hoch, den offenen Durchgang (sichere Spur) nehmen
   //  fenceLow  niedriges Zaunstück in einer Spur → drüberspringen oder durch die Lücke
   // Je weiter das Level, desto mehr Durchgänge muss man suchen. Bienen verfolgen Hornox (siehe unten).
   const sec=meadowSection(arrivalTime),bell=()=>{if(row%3===0)add("goldBell",safe,0,{high:true});};
   if(pattern===8){}
   else if(sec===1){if(pattern===0||pattern===4||pattern===6){add("fence",-1);bell();}else if(pattern===2){add("fenceLow",one);if(busy)add("fenceLow",two);}}
   else if(sec===2){if(pattern===0||pattern===4){add("fence",-1);bell();}else if(pattern===1||pattern===5){add("fenceTall",one);add("fenceTall",two);}else if(pattern===2||pattern===6){add("fenceLow",one);add("fenceLow",two);}}
   else{if(pattern===0||pattern===5){add("fence",-1);bell();}else if(pattern===1||pattern===3||pattern===6){add("fenceTall",one);add("fenceTall",two);}else if(pattern===2){add("fenceLow",one);add("fenceTall",two);}else if(pattern===4)add("fenceLow",one);}
  }else if([6].includes(z)){
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
  }else if(z===9){
   // Level 6 «Schwarzsee» – Sumpfgebiet. Auf dem Wasser springt man von Holzbalken zu versunkenen Steinen:
   // jede zweite Reihe eine Wasserlücke über die ganze Breite (springen), dazwischen manchmal Lücken in zwei
   // Spuren (springen oder in die freie Spur wechseln). Alle 15 s folgt eine Schlammebene mit Schlammpfützen –
   // wer hineinläuft, bleibt kurz stecken (kein Lebensverlust); ausweichen oder drüberspringen.
   if(pattern===8){}
   else if(swampMud(arrivalTime)){if(row%2===0||pattern%3===1){add("mudPuddle",one);if(busy&&pattern%2===0)add("mudPuddle",two);}}
   else if(row%2===0)add("waterGap",-1);
   else if(pattern%3===1&&busy){add("waterGap",one);add("waterGap",two);}
  }else if(z===4){
   // Level 7 «Hörnliweg»: realistische Hindernisse am Bergweg (springen, ducken, Spur wechseln).
   const sec=hornliSection(arrivalTime);
   if(pattern===8){}
   else if(sec===3&&(arrivalTime>=576&&arrivalTime<581||arrivalTime>=586&&arrivalTime<589)){const k=pattern%3;if(k===0){add("rockBig",one);if(busy)add("looseRocks",two);}else if(k===1)add("looseRocks",one);}   // vor den Holzstegen: keine Geländer/Zäune, nur Felsen
   else if(sec===3&&hornliSteg(arrivalTime)>=0){const st=hornliSteg(arrivalTime);for(const l of[0,1,2])if(l!==st)add("ridgeGap",l);}   // schmaler Holzsteg: präzise Spurwahl
   else if(sec===1){const k=pattern%5;if(k===0){add("rockBig",one);if(busy)add("scree",two);}else if(k===1)add("scree",one);else if(k===2){add("woodPiece",-1);}else if(k===3){add("signpost",one);if(busy)add("rockBig",two);}else{add("boulder",one);if(busy)add("hiker",two);}}
   else if(sec===2){const k=pattern%5;if(k===0)add("woodRail",-1);else if(k===1)add("beamLow",-1);else if(k===2){add("ledge",one);if(busy)add("woodBarrier",two);}else if(k===3){add("woodBarrier",one);if(busy)add("rockFace",two);}else add("hiker",one);}
   else if(sec===3){const k=pattern%5;/* Der felsige Aufstieg: Felsbrocken springen, Überhänge ducken, lose Steine ausweichen, Holzgeländer Spur wechseln */if(k===0){add("rockBig",one);if(busy)add("looseRocks",two);}else if(k===1)add("overhang",-1);else if(k===2)add("looseRocks",one);else if(k===3){add("railLane",one);if(busy)add("rockBig",two);}else{add("looseRocks",one);if(busy)add("railLane",two);}}
   else if(sec===4){const k=pattern%5;if(k===0||k===3){add("snowPatch",one);if(busy)add("snowPatch",two);}else if(k===1){add("rockBig",one);if(busy)add("scree",two);}else if(k===2){add("rockBig",one);if(busy)add("scree",two);}else{add("ledge",one);add("snowPatch",two);}}
   else{const k=pattern%5;if(k===0){add("signpost",one);if(busy)add("scree",two);}else if(k===1)add("woodRail",-1);else if(k===2){add("rockBig",one);}else if(k===3)add("beamLow",-1);else{add("hiker",one);if(busy)add("woodBarrier",two);}}
  }else if(z===10){
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
  const heartDue=!fullRow&&arrivalTime>=nextHeartAt&&arrivalTime<885&&pattern!==1&&pattern!==2&&Math.abs(d-nearest)>Math.max(80,speed*3);
  if(heartDue){add("heart",safe,11);nextHeartAt=arrivalTime+52+((rng>>>24)%22);}
  for(const offset of(heartDue?[5,17]:[5,9,13,17]))add("coin",safe,offset);
  // Level 3: jede zweite Reihe ein Fisch zum Sammeln, damit der Fischer nach rund 10–15 s wütend wird.
  if(z===7&&row%2===1&&!heartDue)add("fishCatch",safe,22);
  // Jedes andere Level: ein passendes Sammelobjekt etwa jede vierte Reihe (Level 3 sammelt Fische).
  if(z!==7&&row%6===2&&!heartDue&&arrivalTime<885)add("token",safe,0);
  // Level 4: Glückspilze geben Bonuspunkte (Haselnüsse sind die normalen Münzen).
  // Level 5: Alpenkräuter (selten), Käse, goldene Kuhglocken, goldenes Edelweiss (sehr selten). Blumen = normale Münzen.
  if(z===1&&!heartDue){const sec=meadowSection(arrivalTime);if(sec>=2&&arrivalTime>=honeyNext&&safe!==1&&pattern!==0&&pattern!==4&&pattern!==5){add("honey",safe,22);honeyNext=arrivalTime+18;}/* Honig am alten Bienenbaum */else if(sec>=2&&row%29===14)add("edelweiss",safe,22);else if(row%7===3)add("herb",safe,22);else if(row%11===5)add("cheese",safe,22);else if(row%17===9)add("goldBell",safe,22);}
  if(row>8&&row%17===8&&pattern!==8)add(z===5?['climbGear','snowshoes'][Math.floor(row/17)%2]:['magnet','shieldOrb','coinBoost','rushCharge'][Math.floor(row/17)%4],safe,-8);
  row++;nextRow+=s.mode==="relaxed"?Math.max(34,38-elapsed/120):Math.max(23,26-elapsed/110);
 }
 // Verfolgung durch den wütenden Fischer, direkt hinter Hornox auf der Strecke.
 // chaseGap = Abstand in Streckeneinheiten (4 = fast dran, 16 = weit weg).
 if(hookedAttack)for(const o of objects)if(o.kind==='hook'&&o.attackId===hookedAttack)o.resolved=true;
 if(angry>0){
  if(!(s.angry>0)){chaseGap=13;nextCastTick=tick+50;lastBumpTick=tick;}
  const bumped=events.some(e=>e.kind==='bump'||e.kind==='shieldHit');
  if(bumped){chaseGap-=hookedAttack?-1.5:2.5;lastBumpTick=tick;}   // Treffer durch Hindernis: er holt auf; nach Angeltreffer zieht er die Angel ein und fällt kurz zurück
  else if(slow>0)chaseGap-=.03;                                    // langsamer: er holt auf
  else if(tick-lastBumpTick>80)chaseGap+=.012;                     // 4 s fehlerfrei: Hornox gewinnt Abstand
  chaseGap=Math.max(4,Math.min(16,chaseGap-.006));                 // er kommt grundsätzlich langsam näher
  // Angriff: unregelmässig 2–4 s, mit der Dauer und bei kleinem Abstand häufiger.
  if(angry>30&&tick>=nextCastTick){
   rng=random(rng);const roll=(rng>>>9)%10,attack=roll<5?'low':roll<8?'double':'high',lane=Math.max(0,Math.min(2,Math.round(s.target)));
   const landD=distance+speed*1.45,id=++attackSeq,hook=(l)=>objects.push({id:nextId++,kind:'hook',attack,attackId:id,lane:l,d:landD,front:0,hitWidth:.42,formation:0,bornTick:tick,castTick:tick,landTick:tick+12,resolved:false,biome:7,approach:0,rowId:-1,encounter:landD});
   const lanes=attack==='high'?[-1]:attack==='double'?[lane,lane===2?1:lane+1]:[lane];for(const l of lanes)hook(l);
   events.push({kind:'fisherCast',attack,lanes});
   const progress=(400-angry)/400,near=(chaseGap-4)/12;rng=random(rng);
   nextCastTick=tick+Math.round((40+((rng>>>12)%40))*(1-.35*progress)*(.75+.25*near));
  }
 }else chaseGap=0;
 if(s.angry===1)events.push({kind:'fisherQuit'});
 // Level 4: Das Wildschwein ist zuerst nur zu hören (Grunzen bei 5:05, 5:11 und 5:25),
 // ab 5:27 jagt es Hornox direkt hinter ihm bis zum Levelende; ab 5:37,5 wird es schneller («Wildschwein-Rennen»).
 // boarGap = Abstand (16 = weit, 3 = erwischt). Hindernis-Treffer: es holt auf. Überwundene Hindernisse
 // (gesprungen, geduckt, knapp ausgewichen) und sauberes Laufen bringen Abstand. Der Hornox-Ansturm verscheucht es.
 for(const t of[305,311,325])if(s.elapsed<t&&elapsed>=t)events.push({kind:'boarGrunt'});
 if(!boar&&s.elapsed<327&&elapsed>=327){boar=660;boarGap=14;boarBump=tick;events.push({kind:'boarAppear'});}
 if(boar>0){
  const race=elapsed>=337.5;if(s.elapsed<337.5&&race)events.push({kind:'boarRace'});
  if(events.some(e=>e.kind==='bump'||e.kind==='shieldHit')){boarGap-=3.5;boarBump=tick;}
  else{boarGap+=events.filter(e=>e.kind==='clear').length*.9+events.filter(e=>e.kind==='nearMiss').length*.35;if(tick-boarBump>60)boarGap+=.012;}
  boarGap+=powering?.06:(race?-.036:-.022)*(s.mode==='relaxed'?.55:1);boarGap=Math.min(16,boarGap);
  if(boarGap<=3){boarGap=12;if(!invulnerable&&!climb){if(shield){shield=0;events.push({kind:'shieldHit'});}else{lives--;chain=0;multiplier=1;failReason='boar';}invulnerable=50;}events.push({kind:'boarRam'});}
  if(boar===1)events.push({kind:'boarQuit'});
 }else boarGap=0;
 // Level 5: Bienenschwarm. Nur wer Honig am alten Bienenbaum nimmt, wird verfolgt. Die Bienen folgen höchstens
 // 300 m vom Nest – wer schnell genug wegläuft (sauber springen, nicht anstossen), entkommt. Erster Stich: kurz
 // langsamer (kein Leben weg), jeder weitere Stich in derselben Verfolgung kostet ein Leben.
 if(dog>0){
  if(events.some(e=>e.kind==='bump'||e.kind==='shieldHit')){dogGap-=3.5;dogBump=tick;}
  else{dogGap+=events.filter(e=>e.kind==='clear').length*.9+events.filter(e=>e.kind==='nearMiss').length*.35;if(tick-dogBump>60)dogGap+=.012;}
  dogGap+=powering?.06:-.022*(dogGap<7?1.3:1)*(s.mode==='relaxed'?.55:1)*(slow>0?1.6:1);dogGap=Math.min(16,dogGap);
  if(dogGap<=3){dogGap=10;if(!invulnerable&&!climb){if(shield){shield=0;events.push({kind:'shieldHit'});}else{beeStings++;slow=Math.max(slow,30);if(beeStings>=2){lives--;chain=0;multiplier=1;failReason='bees';}events.push({kind:'beeSting',hurt:beeStings>=2});}invulnerable=40;}}
  if(distance-beeNest>300){dog=0;dogGap=0;dogMode=0;events.push({kind:'beesQuit',escaped:true});}
  else if(dog===1)events.push({kind:'beesQuit'});
 }else dogGap=0;
 if(!summitTurn&&elapsed>=785)summitTurn=Math.floor((distance+440)/680)+1;
 if(distance>=nextTurn&&elapsed<892){
  const direction=turnDir(s.seed,summitTurn,turnIndex);
  if(turnChoice!==direction&&!powering&&!(elapsed>=580&&elapsed<592.5)){/* schmale Holzstege: Hornox biegt automatisch ab */if(shield)shield=0;else lives--;slow=16;invulnerable=30;failReason="turn";events.push({kind:"missedTurn"});}
  else{score+=75;turns++;events.push({kind:"turn",direction});}
  heading+=direction*Math.PI/2;turnIndex++;nextTurn=260+turnIndex*680;turnChoice=0;
 }
 if(Math.floor(elapsed/120)>checkpoints){checkpoints=Math.floor(elapsed/120);shield=1;score+=150;events.push({kind:"checkpoint"});}
 if(stage(elapsed)!==stage(s.elapsed)){
  const nextStage=stage(elapsed);
  const gained=lives>0&&lives<s.maxLives;if(gained)lives++;score+=250;events.push({kind:"world",zone:zone(elapsed),stage:nextStage,gained});
 }
 // Bergladen kurz vor Ende jedes Levels (nicht im letzten Level): öffnet, sobald Hornox hineinläuft; schliesst spätestens beim Levelwechsel.
 {const st=stage(elapsed);if(shop&&shop!==st+1)shop=0;if(st<9&&elapsed>=st*90+SHOP_AT&&shopSeen<st+1&&lives>0){shopSeen=st+1;shop=st+1;events.push({kind:'shopOpen',stage:st,items,lives});}}
 const phase=lives<=0?"lost":elapsed>=900?"won":"playing";
 if(phase==="won"){score+=2000;events.push({kind:"summit",points:2000});}
 return{...s,items,shop,shopSeen,beeNest,beeStings,honeyNext,phase,tick,elapsed,distance,speed,x,lives,jump,jumpCount,jumpBase,jumpY:height,fallTicks,duck,queued,buffer,coins,flamingoSpawned,powerCharge,powerTicks,hearts,nextHeartAt,score,chain,bestChain,multiplier,shield,magnet,coinBoost,climb,climbReady,shoes,nextCrowAt,nextFishAt,nextBeaverAt,nextGullAt,lastHazardAt,nextFrogAt,fish,angry,chaseGap,nextCastTick,lastBumpTick,attackSeq,boar,boarGap,boarBump,dog,dogGap,dogBump,dogMode,scared,checkpoints,arrivals,turnIndex,nextTurn,turnChoice,summitTurn,heading,turns,failReason,invulnerable,slow,rng,nextId,nextRow,row,objects,events};
}
export function isGameOver(s){return ["lost","won"].includes(s.phase)?{over:true,winner:s.phase==="won"?s.player:null,score:s.score,coins:s.coins,distance:Math.floor(s.distance),arrivals:s.arrivals}:{over:false};}
export function viewFor(s,p){return{...s,objects:s.objects.map(o=>({...o})),events:s.events.map(e=>({...e})),spectator:p!==s.player};}

