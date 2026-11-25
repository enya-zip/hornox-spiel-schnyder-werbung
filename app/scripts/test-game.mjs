import{introFrame,INTRO_DURATION,COUNTDOWN_DURATION}from'../public/intro.js';
import*as J from'../public/journey.js';
import assert from 'node:assert/strict';import{readFileSync}from'node:fs';import*as g from '../src/logic.js';import{createPath,turnDirection}from'../public/route.js';import{copy}from'../public/copy.js';
let checks=0;const check=(name,f)=>{f();console.log('PASS',name);checks++;};const start=(seed=123,mode='classic')=>g.applyAction(g.setup(['p']),'p',{type:'start',seed,mode,route:'summit'});const action=(s,a)=>g.applyAction(s,'p',a);
check('six pure exports and single-player contract',()=>{assert.deepEqual(Object.keys(g).sort(),['meta','setup','applyAction','validateAction','isGameOver','viewFor'].sort());assert.equal(g.meta.maxPlayers,1);});
check('input validation rejects spectators, time skips, invalid values and old modes',()=>{const s=start();for(const a of[null,[],{},{type:'steer',lane:3},{type:'steer',lane:NaN},{type:'step',ticks:50},{type:'bank'},{type:'turn',direction:1}])assert.equal(g.validateAction(s,'p',a).ok,false);assert.equal(g.validateAction(s,'other',{type:'step'}).ok,false);assert.equal(g.validateAction(g.setup(['p']),'p',{type:'start',seed:1,mode:'classic',route:'journey'}).ok,false);});
check('deterministic, immutable simulation and copied public views',()=>{const s=start();const old=JSON.stringify(s);assert.deepEqual(action(s,{type:'step'}),action(s,{type:'step'}));assert.equal(JSON.stringify(s),old);const v=g.viewFor(s,'spectator');assert(v.spectator);assert.notEqual(v.objects,s.objects);});
function collision(kind,{jump=0,duck=0,lane=1,approach=0}={}){let s={...start(),distance:100,nextRow:10000,x:1,target:1,jump,duck,objects:[{id:1,kind,lane,d:100.9,approach}]};return action(s,{type:'step'});}
check('small coins score and count; approaching objects collide in relative motion',()=>{assert.equal(collision('coin',{approach:6}).coins,1);assert.equal(collision('bike',{approach:6}).lives,2);assert.equal(collision('bike',{lane:0,approach:6}).lives,3);});
check('jump and slide have distinct collision semantics',()=>{for(const kind of['iceBlock','log','barrier','crevasse'])assert.equal(collision(kind,{jump:10,approach:6}).lives,3);assert.equal(collision('iceArch',{duck:10,approach:6}).lives,3);assert.equal(collision('iceArch',{jump:10,approach:6}).lives,2);assert.equal(collision('sheep',{jump:10,approach:6}).lives,3);});
check('jump buffer and landing emit the matching audio events',()=>{let s={...start(),jump:3};s=action(s,{type:'duck'});assert.equal(s.queued,'duck');for(let i=0;i<3;i++)s=action(s,{type:'step'});assert.equal(s.duck,16);assert(s.events.some(e=>e.kind==='land'));assert(s.events.some(e=>e.kind==='duck'));});
check('turns share exact path schedule and missed turns cost a life',()=>{let s={...start(),distance:259.8,nextRow:10000};const path=createPath(s.seed);assert(Math.hypot(path.frame(260).x-path.frame(259.999).x,path.frame(260).z-path.frame(259.999).z)<.001);let right=action(s,{type:'turn',direction:path.direction(0)});right=action(right,{type:'step'});assert.equal(right.turns,1);assert.equal(right.nextTurn,940);assert.equal(action(s,{type:'step'}).lives,2);});
check('summit is won after exactly 15 active minutes, with no further steps',()=>{const s={...start(),tick:17999,elapsed:899.95,distance:100,nextTurn:10000,nextRow:10000,checkpoints:7};const out=action(s,{type:'step'});assert.equal(out.elapsed,900);assert.equal(out.phase,'won');assert.equal(g.isGameOver(out).over,true);assert.equal(g.isGameOver(out).winner,'p');assert(out.events.some(e=>e.kind==='summit'));assert(out.score>=2000);assert.equal(action(out,{type:'step'}),out);});
check('all five locales have complete UI keys and no obsolete theme',()=>{assert.deepEqual(Object.keys(copy),['en','de','fr','ja','zh']);for(const l of Object.values(copy)){assert.deepEqual(Object.keys(l).sort(),Object.keys(copy.en).sort());assert(Object.values(l).every(v=>typeof v==='string'&&v.length));assert(!/onsen|wellness|ab ins spa/i.test(JSON.stringify(l)));}});
function bot(seed,seconds=1260){let s=start(seed,'relaxed');while(s.phase==='playing'&&s.elapsed<seconds){if(s.nextTurn-s.distance<s.speed*1.3)s=action(s,{type:'turn',direction:turnDirection(s.seed,s.summitTurn,s.turnIndex)});const ahead=s.objects.filter(o=>!o.resolved&&o.d-(o.front||0)>s.distance&&o.d-(o.front||0)-s.distance<(s.speed+(o.approach||0))*1.3);const bad=ahead.filter(o=>['carriage','scooter','skiers','snowboarders','influencer','lostTourists','snowman','flamingo','manhole','electric','photographers','bike','hiker','pedestrian','sheep','marmot','iceBlock','crevasse','luggage','trolley','planter','cafe','awning','boulder','rockfall','lowRock','ridgeGap','hook','fish','ibex','crow','gull','trunk','fallingBranch','sign','deer','boarCross','squirrelHop','bigMushroom','woodpile','branchPile','roots','hayBale','haystack','cow','cowWalk','hayRoll','sheepCross','sheepStop','goat','chicken','trough','woodstack','tongue','fenceTall','rockFace','ledge','signpost','rockBig','scree','woodBarrier','mudPuddle','snowPatch','looseRocks','railLane','serac','rockStep','snowBridge','frog'].includes(o.kind));const coin=ahead.find(o=>o.kind==='coin');let lane=coin?.lane??s.target;const blocked=l=>bad.some(o=>Math.abs((o.target??o.real??o.lane)-l)<(o.hitWidth||.38));if(blocked(lane))lane=[0,1,2].find(l=>!blocked(l))??s.target;s=action(s,{type:'steer',lane});const close=ahead.filter(o=>o.d-s.distance<(s.speed+(o.approach||0))*.38&&(o.lane===-1||Math.abs(o.lane-s.x)<.4)).sort((a,b)=>a.d-b.d)[0];if(close&&!s.jump&&!s.duck){if(['iceArch','branch','awning','rope','fixRope'].includes(close.kind)||close.kind==='hook'&&close.attack==='high'||close.kind==='highLog'||close.kind==='gate'||['metalStrut','beamLow','overhang'].includes(close.kind))s=action(s,{type:'duck'});else if(['iceBlock','log','barrier','crevasse','ridgeGap','lowRock','beaverLog','plankGap','stream','log','fence','ditch','floatLog','waterGap','fenceLow','woodPiece','woodRail','metalBarrier','rockStep','snowBridge','fishBucket','rodAcross'].includes(close.kind))s=action(s,{type:'jump'});}s=action(s,{type:'step'});assert(s.objects.length<100);}return s;}
check('full 15-minute journey reaches the summit with bounded state',()=>{const s=bot(20261029);assert.equal(s.phase,'won',JSON.stringify({elapsed:s.elapsed,reason:s.failReason}));assert.equal(s.elapsed,900);assert.equal(s.arrivals,0);assert(s.coins>100);console.log('RUN',JSON.stringify({elapsed:s.elapsed,distance:Math.floor(s.distance),coins:s.coins,arrivals:s.arrivals,turns:s.turns}));});
check('environment-specific hazards remain appropriate and every variant is reachable',()=>{
 const profiles={
  3:['snowman','luggage','trolley','planter','electric','photographers','manhole','carriage','scooter','skiers','snowboarders','influencer','lostTourists','pedestrian','bike'],
  6:['hiker','marmot','sheep','log','branch','bike'],7:['fish','beaverLog','gull'],8:['roots','log','boulder','sign','trunk'],1:['fence','fenceLow'],
  9:['waterGap','frog'],4:['woodRail','beamLow','ledge','woodBarrier','rockFace','hiker'],10:['ropeTeam','lowRock','ridgeGap','rope','rockfall','boulder'],0:['iceBlock','crevasse','iceArch','snowBridge'],5:['rockStep','fixRope','rockfall','crow','ibex']};
 for(const [elapsed,z]of [[30,3],[110,6],[200,7],[276,8],[364,1],[455,9],[570,4],[660,0],[760,10],[830,5]]){const found=new Set();for(let seed=1;seed<90;seed++){
  const state={...start(seed),flamingoSpawned:true,tick:elapsed*20,elapsed,distance:1000,nextRow:1030,nextTurn:99999,row:20,nextFishAt:seed%3===0?0:9999};
  for(const o of action(state,{type:'step'}).objects){if(['token','coin','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom','herb','cheese','goldBell','edelweiss','honey'].includes(o.kind))continue;assert.equal(o.biome,z);assert(profiles[z].includes(o.kind),'wrong biome: '+o.kind);found.add(o.kind);}
 }assert.deepEqual([...found].sort(),profiles[z].sort());}
});
check('walkers, photo groups, bikes and wildlife approach with each simulation step',()=>{const s={...start(),nextRow:9999,objects:['hiker','pedestrian','photographers','bike','sheep'].map((kind,id)=>({id,kind,d:150,lane:0,approach:2.4}))};const out=action(s,{type:'step'});for(const o of out.objects)assert.equal(o.d,149.88);});
check('all new hazards support intended jump, duck or dodge collision rules',()=>{for(const kind of ['iceArch','branch','awning','rope']){assert.equal(collision(kind,{duck:9,approach:6}).lives,3);assert.equal(collision(kind,{jump:9,approach:6}).lives,2);}for(const kind of ['skiers','snowboarders','scooter','electric','photographers','hiker','pedestrian','marmot','sheep','bike','cafe','luggage','trolley','planter','boulder','rockfall']){assert.equal(collision(kind,{lane:0,approach:6}).lives,3);assert.equal(collision(kind,{jump:9,approach:6}).lives,3);}});
check('coin series and successful jumps emit joyful feedback events',()=>{let s={...start(),chain:7,distance:100,nextRow:9999,objects:[{id:1,kind:'coin',lane:1,d:100.4}]};s=action(s,{type:'step'});assert(s.events.some(e=>e.kind==='combo'));assert.equal(s.multiplier,2);assert(collision('crevasse',{jump:10,approach:6}).events.some(e=>e.kind==='clear'));});
check('server and browser use identical rules',()=>assert.equal(readFileSync(new URL('../src/logic.js',import.meta.url),'utf8'),readFileSync(new URL('../public/rules.js',import.meta.url),'utf8')));
check('ten environments appear in the requested order at the exact active-time boundaries',()=>{
 for(const [seconds,z] of [[90,6],[180,7],[270,8],[360,1],[450,9],[540,4],[630,0],[720,10],[810,5]]){
  const before={...start(),tick:seconds*20-2,elapsed:seconds-.1,distance:100,nextRow:99999,nextTurn:99999,lives:2};
  const near=action(before,{type:'step'});assert(!near.events.some(e=>e.kind==='world'));
  const after=action(near,{type:'step'});assert(after.events.some(e=>e.kind==='world'&&e.zone===z));assert.equal(after.lives,3);assert(after.score>=250);
 }
});
check('dense rows retain an open lane or one consistent jump/slide action',()=>{
 let paired=0,incoming=0;
 for(let seed=1;seed<=50;seed++)for(const elapsed of [30,110,200,290,390,480,570,660,750,840]){
  const initial={...start(seed),flamingoSpawned:true,tick:elapsed*20,elapsed,distance:1100,nextRow:1120,nextTurn:99999,row:20};
  const s=action(initial,{type:'step'}),rows=new Map();
  for(const o of s.objects){if(['token','coin','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom','herb','cheese','goldBell','edelweiss','honey'].includes(o.kind))continue;if(!rows.has(o.rowId))rows.set(o.rowId,[]);rows.get(o.rowId).push(o);if(o.approach>0){incoming++;assert(Math.abs((o.d-(o.front||0)-s.distance)/(s.speed+o.approach)-(o.encounter-s.distance)/s.speed)<.00001);}}
  for(const obstacles of rows.values()){
   if(obstacles.some(o=>o.lane===-1)){assert.equal(obstacles.length,1);continue;}
   assert([0,1,2].some(l=>obstacles.every(o=>Math.abs(o.lane-l)>=(o.hitWidth||.38))),'a safe lane remains');if(obstacles.length===2)paired++;
  }
 }
 assert(paired>300);assert(incoming>250);console.log('PATTERNS',JSON.stringify({paired,incoming}));
});
check('incoming threats and walkers move at their intended speeds',()=>{
 const seen=new Map();for(let seed=1;seed<50;seed++)for(const elapsed of [30,160,300]){
  const s=action({...start(seed),flamingoSpawned:true,tick:elapsed*20,elapsed,distance:1000,nextRow:1030,nextTurn:99999,row:20},{type:'step'});
  for(const o of s.objects)seen.set(o.kind,o.approach);
 }
 for(const [kind,min]of [['bike',8],['marmot',3.8],['sheep',2.8],['trolley',4.5],['luggage',2]])assert(seen.get(kind)>=min,kind);
 assert.equal(seen.get('hiker'),2.4);assert.equal(seen.get('pedestrian'),2.4);
});
check('new mountain gaps and low rocks can be jumped, while boulders must be dodged',()=>{for(const kind of ['ridgeGap','lowRock'])assert.equal(collision(kind,{jump:10,approach:6}).lives,3);assert.equal(collision('boulder',{jump:10,approach:6}).lives,3);});
check('three lives in both modes and each unprotected impact removes one',()=>{for(const mode of['classic','relaxed']){const s=start(123,mode);assert.equal(s.lives,3);assert.equal(s.maxLives,3);}assert.equal(collision('bike').lives,2);});
function heart(lives=2,lane=1,magnet=0){return action({...start(),lives,magnet,distance:100,nextRow:99999,objects:[{id:71,kind:'heart',lane,d:100.4}]},{type:'step'});}
check('a heart restores exactly one life, is removed and cannot be collected twice',()=>{const s=heart();assert.equal(s.lives,3);assert.equal(s.hearts,1);assert.equal(s.objects.length,0);assert(s.events.some(e=>e.kind==='heart'&&e.gained));const next=action(s,{type:'step'});assert.equal(next.hearts,1);assert.equal(next.lives,3);assert(!next.events.some(e=>e.kind==='heart'));});
check('hearts cap at three lives, rewarding fifty points when already full',()=>{const s=heart(3);assert.equal(s.lives,3);assert.equal(s.score,50);assert(s.events.some(e=>e.kind==='heart'&&!e.gained&&e.points===50));});
check('hearts in other lanes do not heal or harm and are not drawn by coin magnets',()=>{for(const magnet of[0,100]){const s=heart(1,0,magnet);assert.equal(s.lives,1);assert.equal(s.hearts,0);assert(!s.events.some(e=>e.kind==='heart'));}});
check('periodic heart rows use a clear lane and stay away from corner hazards',()=>{let found=0;for(let seed=1;seed<40;seed++)for(const elapsed of[45,110,200,290,390,480,570,660,750,840]){const s=action({...start(seed),elapsed,tick:elapsed*20,distance:1100,nextRow:1120,nextTurn:99999,row:20,nextHeartAt:0},{type:'step'});for(const h of s.objects.filter(o=>o.kind==='heart')){found++;const hazards=s.objects.filter(o=>o.rowId===h.rowId&&!['token','coin','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind));assert(hazards.every(o=>{const lane=o.real??o.target??o.lane;return Math.abs(lane-h.lane)>=(o.hitWidth||.38)&&lane!==-1;}));const nearest=260+Math.max(0,Math.round((h.encounter-11-260)/680))*680;assert(Math.abs(h.encounter-11-nearest)>80);assert(s.nextHeartAt>elapsed+50);}}assert(found>100);});
check('zero lives ends the run even if a heart or world transition occurs in that tick',()=>{const base={...start(),lives:1,elapsed:89.95,tick:1799,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind:'bike',lane:1,d:100.2},{id:2,kind:'heart',lane:1,d:100.3}]};const s=action(base,{type:'step'});assert.equal(s.phase,'lost');assert.equal(s.lives,0);assert.equal(s.hearts,0);});
check('Horn Rush requires thirty collected coins and cannot retrigger while active',()=>{let s={...start(),nextRow:99999,nextTurn:99999};assert.equal(g.validateAction(s,'p',{type:'power'}).ok,false);for(let i=0;i<30;i++){s={...s,objects:[{id:i,kind:'coin',d:s.distance+.4,lane:1}]};s=action(s,{type:'step'});}assert.equal(s.powerCharge,30);assert(s.events.some(e=>e.kind==='powerReady'));s=action(s,{type:'power'});assert.equal(s.powerTicks,120);assert.equal(s.powerCharge,0);assert.equal(s.powerUses,1);assert.equal(g.validateAction(s,'p',{type:'power'}).ok,false);});
check('Rush lasts exactly six active seconds and ends with a short safe handover',()=>{let s=action({...start(),powerCharge:30,nextRow:99999,nextTurn:99999},{type:'power'});for(let i=0;i<119;i++)s=action(s,{type:'step'});assert.equal(s.powerTicks,1);s=action(s,{type:'step'});assert.equal(s.powerTicks,0);assert.equal(s.invulnerable,20);assert(s.events.some(e=>e.kind==='powerEnd'));});
check('Rush protects against every biome hazard and clears contacted obstacles once',()=>{for(const kind of['bike','hiker','marmot','sheep','trolley','iceBlock','iceArch','crevasse','ridgeGap','rope','log','branch','barrier','boulder']){const s=action({...start(),powerTicks:100,distance:100,nextRow:99999,objects:[{id:1,kind,lane:1,d:100.4}]},{type:'step'});assert.equal(s.lives,3,kind);assert.equal(s.objects.length,0,kind);assert(s.events.some(e=>e.kind==='powerClear'),kind);}});
check('Rush attracts coins without recharging itself and handles route corners',()=>{let s=action({...start(),powerTicks:100,powerCharge:0,distance:100,nextRow:99999,objects:[{id:1,kind:'coin',lane:0,d:100.4}]},{type:'step'});assert.equal(s.coins,1);assert.equal(s.powerCharge,0);s=action({...s,distance:259.8,objects:[],nextTurn:260,turnChoice:0},{type:'step'});assert.equal(s.lives,3);assert.equal(s.turns,1);});
check('photo entrance choreography exits the doorway then orbits exactly 180 degrees',()=>{assert.equal(COUNTDOWN_DURATION,3);const start=introFrame(0),out=introFrame(2.65),end=introFrame(INTRO_DURATION);assert.equal(start.z,13.75);assert.equal(start.doorOpen,0);assert.equal(start.orbitDegrees,0);assert.equal(out.z,0);assert.equal(end.orbitDegrees,180);assert(Math.abs(end.eye[0])<.00001);assert.equal(end.eye[2],10.3);assert.deepEqual(end.target,[0,1.25,-11]);for(let t=0;t<=INTRO_DURATION;t+=.1){const pose=introFrame(t);assert(pose.eye.every(Number.isFinite));assert(pose.eye[2]<12);assert(pose.z>=0&&pose.z<=13.75);}assert.deepEqual(introFrame(INTRO_DURATION,false).eye,[0,4.7,9.5]);});


check('Rush ramps to 155 percent speed, settles before expiry, and never changes the 900-second target',()=>{let s=action({...start(),powerCharge:30,nextRow:99999,nextTurn:99999},{type:'power'});const speeds=[];for(let i=0;i<120;i++){s=action(s,{type:'step'});speeds.push(s.speed);}assert(speeds[15]>27);assert(speeds[119]<21);assert(s.distance>150);assert.equal(s.elapsed,6);s=action(s,{type:'step'});assert(s.speed<20);});
check('Shockwave clears three lanes once, retains distant hazards and provides knockback origins',()=>{let s={...start(),powerTicks:100,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:11,kind:'electric',lane:0,d:109},{id:12,kind:'photographers',lane:2,d:110},{id:13,kind:'bike',lane:1,d:140},{id:14,kind:'heart',lane:0,d:108}]};s=action(s,{type:'step'});const e=s.events.filter(e=>e.kind==='powerClear');assert.equal(e.length,2);assert(e.every(e=>e.id&&e.d>100));assert(s.objects.some(o=>o.kind==='heart'));assert(s.objects.some(o=>o.id===13));s=action(s,{type:'step'});assert(!s.events.some(e=>e.kind==='powerClear'));});
check('Electric vehicles and photo groups approach and require dodging without power',()=>{for(const kind of['electric','photographers']){assert.equal(collision(kind).lives,2);assert.equal(collision(kind,{lane:0}).lives,3);assert.equal(collision(kind,{jump:9}).lives,3);assert.equal(collision(kind,{duck:9}).lives,2);}const s=action({...start(),nextRow:99999,objects:[{id:1,kind:'electric',lane:0,d:50,approach:7},{id:2,kind:'photographers',lane:2,d:50,approach:2.4}]},{type:'step'});assert.equal(s.objects[0].d,49.65);assert.equal(s.objects[1].d,49.88);});



check('double jump preserves height, gains a second impulse, rejects a third and resets at landing',()=>{let s=action({...start(),nextRow:99999,nextTurn:99999},{type:'jump'});for(let i=0;i<7;i++)s=action(s,{type:'step'});const y=s.jumpY;assert(y>.8);s=action(s,{type:'jump'});assert.equal(s.jumpY,y);assert.equal(s.jumpCount,2);assert.equal(s.jump,18);assert(s.events.some(e=>e.kind==='doubleJump'));assert.equal(g.validateAction(s,'p',{type:'jump'}).ok,false);for(let i=0;i<6;i++)s=action(s,{type:'step'});assert(s.jumpY>1.4);for(let i=0;i<12;i++)s=action(s,{type:'step'});assert.equal(s.jumpY,0);assert.equal(s.jumpCount,0);assert.equal(g.validateAction(s,'p',{type:'jump'}).ok,true);});
check('open manholes cause one-life falls, can be jumped/dodged, and cannot defeat the rush',()=>{let s=collision('manhole');assert.equal(s.lives,2);assert.equal(s.fallTicks,20);assert(s.events.some(e=>e.kind==='fall'));assert.equal(collision('manhole',{jump:9}).lives,3);assert.equal(collision('manhole',{lane:0}).lives,3);s=action({...start(),powerTicks:100,distance:100,nextRow:99999,objects:[{id:1,kind:'manhole',lane:1,d:101}]},{type:'step'});assert.equal(s.lives,3);assert.equal(s.fallTicks,0);});


check('carriage hits either occupied lane at the horses, leaving the third lane clear',()=>{
 for(const center of[.5,1.5])for(const lane of[0,1,2]){
  const s=action({...start(),x:lane,target:lane,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind:'carriage',lane:center,d:105.7,front:5,hitWidth:.91,approach:4.2}]},{type:'step'});
  assert.equal(s.lives,Math.abs(lane-center)<.91?2:3);
 }
});
check('new moving encounters require dodging and rush clears each safely',()=>{
 for(const kind of['carriage','scooter','skiers','snowboarders','influencer','lostTourists','snowman','flamingo']){
  assert.equal(collision(kind).lives,2,kind);assert.equal(collision(kind,{lane:0}).lives,3,kind);
  assert.equal(collision(kind,{jump:9}).lives,3,kind);
  const s=action({...start(),powerTicks:60,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind,lane:1,d:108}]},{type:'step'});assert.equal(s.lives,3);assert(s.events.some(e=>e.kind==='powerClear'));
 }
});
check('no flamingo any more (removed from level 1)',()=>{
 for(const seed of[1,123,20261029,9876]){
  let s=start(seed),found=new Set();
  for(let i=0;i<18000;i++){
   s=action({...s,invulnerable:30,shield:30,nextTurn:999999},{type:'step'});
   for(const o of s.objects)if(o.kind==='flamingo'){found.add(o.id);assert([2,3].includes(o.biome));}
  }
  assert.equal(s.phase,'won');assert.equal(found.size,0);
 }
});


check('new pickups do not damage the player, refresh timers and trigger clear feedback',()=>{
 for(const [kind,field,value]of[['magnet','magnet',160],['shieldOrb','shield',1],['coinBoost','coinBoost',200],['rushCharge','powerCharge',15]]){
  const s=collision(kind);assert.equal(s.lives,3,kind);assert.equal(s[field],value,kind);assert.equal(s.objects.length,0);assert(s.events.some(e=>['magnet','powerPickup'].includes(e.kind)));
 }
});
check('gold fever doubles collected coins and score, but expires after exactly ten active seconds',()=>{
 const s=action({...start(),coinBoost:100,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind:'coin',lane:1,d:100.4}]},{type:'step'});assert.equal(s.coins,2);assert.equal(s.powerCharge,2);assert(s.events.some(e=>e.kind==='pickup'&&e.points===20));
 let q={...collision('coinBoost'),nextRow:99999,nextTurn:99999};for(let i=0;i<200;i++)q=action(q,{type:'step'});assert.equal(q.coinBoost,0);
});
check('shield absorbs exactly one hazard and a spark caps Rush energy at thirty',()=>{
 let s=collision('shieldOrb');s={...s,objects:[{id:2,kind:'bike',lane:1,d:s.distance+.3}],nextRow:99999};s=action(s,{type:'step'});assert.equal(s.lives,3);assert.equal(s.shield,0);assert(s.events.some(e=>e.kind==='shieldHit'));
 s=action({...start(),powerCharge:22,distance:100,nextRow:99999,objects:[{id:1,kind:'rushCharge',lane:1,d:100.3}]},{type:'step'});assert.equal(s.powerCharge,30);assert(s.events.some(e=>e.kind==='powerReady'));
});
check('Rush preserves collectible power-ups and each is collectible only once',()=>{
 for(const kind of['magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet']){const s=action({...start(),powerTicks:60,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind,lane:0,d:106}]},{type:'step'});assert(s.objects.some(o=>o.kind===kind));assert(!s.events.some(e=>e.kind==='powerClear'));}
});
check('all six collectible power-ups spawn in safe lanes (magnet, springs, shield, clover, gold rush, rush charge)',()=>{
 const found=new Set();for(let row=9;row<120;row++)for(let seed=1;seed<20;seed++){
  const s=action({...start(seed),flamingoSpawned:true,elapsed:120,tick:2400,distance:1000,nextRow:1030,nextTurn:99999,row},{type:'step'});
  for(const p of s.objects.filter(o=>['magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind))){found.add(p.kind);assert(s.objects.filter(o=>o.rowId===p.rowId&&!['coin','token','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind)).every(o=>o.lane===-1||Math.abs(o.lane-p.lane)>=(o.hitWidth||.38)));}
 }assert.equal(found.size,6);
});
check('mountain bikes are materially more frequent below the alpine rock stages',()=>{
 let bikes=0,rows=0;for(let seed=1;seed<80;seed++){
  const s=action({...start(seed),flamingoSpawned:true,elapsed:120,tick:2400,distance:1000,nextRow:1030,nextTurn:99999,row:30},{type:'step'});
  const hazards=s.objects.filter(o=>!['coin','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind));bikes+=hazards.filter(o=>o.kind==='bike').length;rows+=new Set(hazards.map(o=>o.rowId)).size;
 }assert(bikes/rows>.30);console.log('BIKES_PER_ROW',bikes/rows);
});

check('level 10: climbing gear is packed and put on with E, snowshoes speed up, crows cost a life and coins, ibex crosses lanes',()=>{
 const gear=action({...start(),distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'climbGear',lane:1,d:100.9}]},{type:'step'});assert.equal(gear.climbReady,1);assert.equal(gear.climb,0);
 assert.equal(g.validateAction(start(),'p',{type:'climb'}).ok,false);const on=action(gear,{type:'climb'});assert.equal(on.climb,200);assert.equal(on.climbReady,0);
 const safe=action({...start(),climb:100,distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'boulder',lane:1,d:100.9}]},{type:'step'});assert.equal(safe.lives,3);
 const shoes=action({...start(),distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'snowshoes',lane:1,d:100.9}]},{type:'step'});assert.equal(shoes.shoes,200);
 const base=action({...start(),distance:100,nextRow:10000,objects:[]},{type:'step'}),fast=action({...start(),shoes:50,slow:10,distance:100,nextRow:10000,objects:[]},{type:'step'});assert(Math.abs(fast.speed/base.speed-1.2)<1e-9);
 const crow=(attack,extra={})=>action({...start(),coins:25,distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'crow',attack,lane:1,d:100.9}],...extra},{type:'step'});
 const hit=crow('dive');assert.equal(hit.coins,15);assert.equal(hit.lives,2);assert(hit.events.some(e=>e.kind==='crow'&&e.lost===10));
 assert.equal(crow('dive',{jump:9}).lives,2);assert.equal(crow('dive',{x:0,target:0}).lives,3);assert.equal(crow('snatch',{jump:9}).lives,3);assert.equal(crow('snatch').lives,2);
 const feint=action({...start(),distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'crow',attack:'feint',lane:1,real:2,d:110}]},{type:'step'});assert.equal(feint.objects[0].lane,2);assert.equal(feint.objects[0].fake,1);
 let s={...start(),distance:100,nextRow:10000,nextTurn:99999,x:0,target:0,objects:[{id:1,kind:'ibex',target:1,lane:-2.6,d:160,approach:0}]};const lanes=[];for(let k=0;k<60&&s.objects.length;k++){s=action(s,{type:'step'});if(s.objects[0])lanes.push(s.objects[0].lane);}
 assert(lanes[0]<0);for(let k=1;k<lanes.length;k++)assert(lanes[k]>=lanes[k-1]);
 let r={...start(),distance:100,nextRow:10000,nextTurn:99999,x:0,target:0,objects:[{id:1,kind:'ibex',target:0,dir:-1,lane:4.6,d:200,approach:0}]};const back=[];for(let k=0;k<200&&r.objects.length;k++){r=action(r,{type:'step'});if(r.objects[0])back.push({lane:r.objects[0].lane,gap:(r.objects[0].d-r.distance)/r.speed});}
 assert(back[0].lane>2);for(let k=1;k<back.length;k++)assert(back[k].lane<=back[k-1].lane);assert(back.filter(b=>b.gap<1.2).every(b=>b.lane===0));
});
check('level 10: at least 8 seconds between crow attacks',()=>{for(let seed=1;seed<=12;seed++){let s={...start(seed),tick:16200,elapsed:810,distance:20000,nextRow:20030,nextTurn:999999,row:900};const seen=new Set();let last=-1e9,count=0;
 while(s.phase==='playing'&&s.elapsed<899){s=action({...s,lives:999,invulnerable:1},{type:'step'});for(const o of s.objects){if(o.kind!=='crow'||seen.has(o.id))continue;seen.add(o.id);const t=s.elapsed+(o.d-s.distance)/(s.speed+o.approach);if(o.double&&t-last<.5)continue;assert(t-last>=8,'gap '+(t-last));last=t;count++;}}assert(count>=3&&count<=11);}});
check('level 3: fish leap from the lake, five caught fish make the fisherman angry for 20 s, his hooks must be dodged',()=>{
 let f={...start(),distance:100,nextRow:10000,nextTurn:99999,x:0,target:0,objects:[{id:1,kind:'fish',target:2,lane:-2.4,d:160,approach:0}]};const lanes=[];for(let k=0;k<80&&f.objects.length;k++){f=action(f,{type:'step'});if(f.objects[0])lanes.push(f.objects[0].lane);}
 assert(lanes[0]<0);assert(lanes.includes(2));for(let k=1;k<lanes.length;k++)assert(lanes[k]>=lanes[k-1]);
 assert.equal(collision('fish').lives,2);assert.equal(collision('fish',{jump:9}).lives,3);
 const notice=action({...start(),fish:9,distance:100,nextRow:10000,nextTurn:99999,x:1,target:1,objects:[{id:1,kind:'fishCatch',lane:1,d:100.9}]},{type:'step'});assert.equal(notice.fish,10);assert.equal(notice.angry,0);assert(notice.events.some(e=>e.kind==='fisherNotice'));
 let s={...start(),fish:19,distance:100,nextRow:10000,nextTurn:99999,x:1,target:1,objects:[{id:1,kind:'fishCatch',lane:1,d:100.9}]};s=action(s,{type:'step'});
 assert.equal(s.angry,400);assert.equal(s.fish,20);assert(s.events.some(e=>e.kind==='fisherAngry'));
 const gull=action({...start(),fish:7,distance:100,nextRow:10000,x:1,objects:[{id:1,kind:'gull',lane:1,d:100.9}]},{type:'step'});assert.equal(gull.fish,4);assert.equal(gull.lives,3);
 assert.equal(action({...start(),fish:7,distance:100,nextRow:10000,x:0,target:0,objects:[{id:1,kind:'gull',lane:1,d:100.9}]},{type:'step'}).fish,7);
 assert.equal(collision('beaverLog',{lane:-1}).lives,2);assert.equal(collision('beaverLog',{lane:-1,jump:10}).lives,3);
 assert(Math.abs(s.chaseGap-13)<.05);
 // Verfolgung: unregelmässige Angriffe, Fischer gibt nach 20 s auf
 let casts=[],quit=false,hit=0,minGap=99;for(let k=0;k<420;k++){s=action({...s,lives:3,nextRow:s.distance+1e6,nextTurn:s.distance+1e6},{type:'step'});for(const e of s.events){if(e.kind==='fisherCast')casts.push(s.tick);if(e.kind==='fisherQuit')quit=true;if(e.kind==='hooked')hit++;}if(s.angry)minGap=Math.min(minGap,s.chaseGap);}
 assert(casts.length>=5,'casts '+casts.length);const gaps=casts.slice(1).map((t,k)=>t-casts[k]);assert(new Set(gaps).size>1,'gleicher Rhythmus');assert(quit);assert.equal(s.angry,0);assert(hit>=1);assert(minGap<13);
 const base={...start(),angry:200,chaseGap:10,nextCastTick:1e9,lastBumpTick:0,distance:100,nextRow:10000,nextTurn:99999,x:1,target:1};
 // Treffer kostet genau ein Leben, schützt danach, und zwei Haken desselben Angriffs treffen nur einmal
 const two=action({...base,objects:[{id:1,kind:'hook',attack:'double',attackId:7,lane:1,d:100.9},{id:2,kind:'hook',attack:'double',attackId:7,lane:1,d:100.95}]},{type:'step'});
 assert.equal(two.lives,2);assert(two.invulnerable>=45);assert(two.events.some(e=>e.kind==='hooked'));assert(two.objects.filter(o=>o.kind==='hook').every(o=>o.resolved));
 // Ausweichen: Spurwechsel oder Springen bei Haken am Boden, Ducken bei der Schnur auf Kopfhöhe
 assert.equal(action({...base,x:0,target:0,objects:[{id:1,kind:'hook',attack:'low',attackId:1,lane:1,d:100.9}]},{type:'step'}).lives,3);
 assert.equal(action({...base,jump:9,objects:[{id:1,kind:'hook',attack:'low',attackId:1,lane:1,d:100.9}]},{type:'step'}).lives,3);
 assert.equal(action({...base,objects:[{id:1,kind:'hook',attack:'high',attackId:1,lane:-1,d:100.9}]},{type:'step'}).lives,2);
 assert.equal(action({...base,duck:9,objects:[{id:1,kind:'hook',attack:'high',attackId:1,lane:-1,d:100.9}]},{type:'step'}).lives,3);
 // Abstand: Hindernis-Treffer lässt ihn aufholen, fehlerfreies Laufen bringt Abstand
 const bumped=action({...base,lastBumpTick:base.tick,objects:[{id:1,kind:'boulder',lane:1,d:100.9}]},{type:'step'});assert(bumped.chaseGap<9);
 let clean={...base,lastBumpTick:-1000,objects:[]};for(let k=0;k<40;k++)clean=action(clean,{type:'step'});assert(clean.chaseGap>10);
});
check('level 3: fish every 10 s, beavers, seagulls, fish buckets and fishing rods, at least 3 s between lake hazards',()=>{for(let seed=1;seed<=12;seed++){let s={...start(seed),tick:3600,elapsed:180,distance:3800,nextRow:3830,nextTurn:999999,row:200};const seen=new Set();let last=-1e9,count=0;
 while(s.phase==='playing'&&s.elapsed<269){s=action({...s,lives:999,invulnerable:1},{type:'step'});for(const o of s.objects){if(o.kind!=='fish'||seen.has(o.id))continue;seen.add(o.id);const t=s.elapsed+(o.d-s.distance)/s.speed;assert(t-last>=9.9,'gap '+(t-last));last=t;count++;}for(const o of s.objects)if(o.biome===7)assert(['fish','beaverLog','gull','fishBucket','rodAcross','coin','fishCatch','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','hook'].includes(o.kind),o.kind);}assert(count>=6&&count<=9,'count '+count);}});
check('level 4: grunts, boar hunt from the gorge to the end, race mode, bridge, forest obstacles, no mushrooms',()=>{
 let g={...start(),tick:6099,elapsed:304.95,distance:7600,nextRow:1e9,nextTurn:1e9,objects:[]};g=action(g,{type:'step'});assert(g.events.some(e=>e.kind==='boarGrunt'));assert.equal(g.boar,0);
 let s={...start(),tick:6539,elapsed:326.95,distance:8200,nextRow:1e9,nextTurn:1e9,checkpoints:2,objects:[]};s=action(s,{type:'step'});assert.equal(s.boar,660);assert(s.events.some(e=>e.kind==='boarAppear'));
 let clean=s,rams=0;for(let k=0;k<180;k++){clean=action({...clean,nextRow:1e9},{type:'step'});if(clean.events.some(e=>e.kind==='boarRam'))rams++;}assert.equal(rams,0);
 const drift=(st,n)=>{let x={...st,boarGap:12,boarBump:st.tick};for(let k=0;k<n;k++)x=action({...x,nextRow:1e9},{type:'step'});return x.boarGap;};
 const normal=drift({...s,elapsed:330,tick:6600},40),race=drift({...s,elapsed:340,tick:6800},40);assert(race<normal);
 const jumped=action({...s,boarGap:8,x:1,target:1,jump:10,objects:[{id:1,kind:'log',lane:-1,d:s.distance+.9}]},{type:'step'});assert(jumped.boarGap>8.5);
 const rammed=action({...s,shield:0,boarGap:3.01,lives:3},{type:'step'});assert(rammed.events.some(e=>e.kind==='boarRam'));assert.equal(rammed.lives,2);assert.equal(rammed.boarGap,12);assert(rammed.invulnerable>=45);
 const both=action({...s,shield:0,boarGap:5,lives:3,x:1,target:1,objects:[{id:1,kind:'boulder',lane:1,d:s.distance+.9}]},{type:'step'});assert(both.events.some(e=>e.kind==='boarRam'));assert.equal(both.lives,2);
 let bridge=0;for(let seed=1;seed<30;seed++){const b=action({...start(seed),tick:6400,elapsed:320,distance:8000,nextRow:8030,nextTurn:99999,row:30},{type:'step'});const onBridge=b.objects.filter(o=>320+(o.encounter-b.distance)/b.speed<326.5);const gaps=onBridge.filter(o=>o.kind==='plankGap');bridge+=gaps.length;for(const row of new Set(gaps.map(o=>o.rowId)))assert(new Set(gaps.filter(o=>o.rowId===row).map(o=>o.lane)).size<3);for(const o of onBridge)if(!['token','coin','mushroom','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind))assert.equal(o.kind,'plankGap');}
 assert(bridge>10);assert.equal(collision('plankGap').lives,2);assert.equal(collision('plankGap',{jump:10}).lives,3);
 assert.equal(collision('trunk',{jump:10}).lives,2);assert.equal(collision('fallingBranch',{jump:10}).lives,2);assert.equal(collision('highLog',{lane:-1,duck:9}).lives,3);assert.equal(collision('highLog',{lane:-1,jump:10}).lives,2);
 assert.equal(collision('stream',{lane:-1,jump:10}).lives,3);assert.equal(collision('roots',{jump:10}).lives,3);assert.equal(collision('boarCross',{lane:0}).lives,3);assert.equal(collision('sign',{jump:10}).lives,2);
 const pick=kind=>action({...start(),distance:100,nextRow:10000,x:1,objects:[{id:1,kind,lane:1,d:100.9}]},{type:'step'});
 for(let seed=1;seed<12;seed++){let s=action({...start(seed),tick:5600,elapsed:280,distance:7000,nextRow:7030,nextTurn:99999,row:30},{type:'step'});for(let i=0;i<600&&s.phase==='playing';i++)s=action({...s,lives:3},{type:'step'});assert(!s.objects.some(o=>o.kind==='mushroom'),'no lucky mushrooms in Furi');}
 // Nur die gewünschten Waldobjekte erscheinen im ganzen Level
 const allowed=['token','roots','log','highLog','boulder','trunk','stream','sign','boarCross','fallingBranch','plankGap','coin','mushroom','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'];
 for(let seed=1;seed<8;seed++){let r={...start(seed),tick:5400,elapsed:270,distance:6800,nextRow:6830,nextTurn:1e9,row:40};while(r.elapsed<358){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===8)assert(allowed.includes(o.kind),o.kind);}}
});
check('level 5 Alpweiden: only wooden fences (jump or find the passage), bees chase and sting, alpine collectibles',()=>{
 const allowed=['token','fence','fenceLow','fenceTall','coin','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','herb','cheese','goldBell','edelweiss','honey'];
 const seen=new Set();let tallRows=0;for(let seed=1;seed<10;seed++){let r={...start(seed),tick:7200,elapsed:360,distance:9000,nextRow:9030,nextTurn:1e9,row:50};while(r.elapsed<448){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===1){assert(allowed.includes(o.kind),'nicht erlaubt: '+o.kind);seen.add(o.kind);}
  // Hohe Zäune: immer mindestens eine Spur frei (Durchgang)
  const rows=new Map();for(const o of r.objects)if(o.kind==='fenceTall'||o.kind==='fence'||o.kind==='fenceLow')rows.set(o.d,[...(rows.get(o.d)||[]),o]);
  for(const list of rows.values())if(list.some(o=>o.kind==='fenceTall')){tallRows++;assert(new Set(list.filter(o=>o.kind==='fenceTall').map(o=>o.lane)).size<3,'kein Durchgang');assert(!list.some(o=>o.lane<0),'voller Zaun bei hohem Zaun');}}}
 for(const k of['fence','fenceLow','fenceTall','herb','cheese','goldBell','honey'])assert(seen.has(k),'fehlt: '+k);assert(tallRows>0);
 // Ausweichregeln: niedrige Zäune überspringen, hoher Zaun nicht
 assert.equal(collision('fence',{lane:-1,jump:10}).lives,3);assert.equal(collision('fenceLow',{jump:10}).lives,3);assert.equal(collision('fenceTall',{jump:10}).lives,2);assert.equal(collision('fenceLow',{}).lives,2);
 // Bienen: nur nach Honig. Honig = +150 und Schwarm startet am Nest
 let calm={...start(),tick:7840,elapsed:392,distance:9800,checkpoints:3,nextRow:1e9,nextTurn:1e9,objects:[]};for(let k=0;k<200;k++)calm=action(calm,{type:'step'});assert.equal(calm.dog,0,'ohne Honig keine Bienen');
 const h=action({...start(),tick:7840,elapsed:392,distance:9800,checkpoints:3,nextRow:1e9,nextTurn:1e9,x:0,target:0,objects:[{id:1,kind:'honey',lane:0,d:9800.9}]},{type:'step'});
 assert(h.events.some(e=>e.kind==='honey'));assert(h.events.some(e=>e.kind==='beesAppear'));assert(h.dog>0);assert.equal(h.beeNest,9800.9);
 // Erster Stich: langsamer, kein Leben weg; zweiter Stich: ein Leben
 const s1=action({...h,shield:0,dogGap:3.01,lives:3,invulnerable:0},{type:'step'});assert(s1.events.some(e=>e.kind==='beeSting'));assert.equal(s1.lives,3);assert(s1.slow>20);assert.equal(s1.beeStings,1);
 const s2=action({...s1,dogGap:3.01,invulnerable:0},{type:'step'});assert(s2.events.some(e=>e.kind==='beeSting'&&e.hurt));assert.equal(s2.lives,2);
 // Entkommen: sauber weglaufen, nach gut 300 m vom Nest geben die Bienen auf – ohne Stich
 let run=h,stings=0,escaped=false;for(let k=0;k<400&&!escaped;k++){run=action({...run,nextRow:1e9},{type:'step'});if(run.events.some(e=>e.kind==='beeSting'))stings++;if(run.events.some(e=>e.kind==='beesQuit'&&e.escaped))escaped=true;}
 assert(escaped,'entkommen');assert.equal(stings,0);assert.equal(run.dog,0);assert(run.distance-h.beeNest>300);
 // Anstossen lässt die Bienen aufholen
 const bumped=action({...h,objects:[{id:5,kind:'fenceTall',lane:0,d:h.distance+.9}],x:0,target:0,invulnerable:0},{type:'step'});assert(bumped.dogGap<h.dogGap-3);

});
check('level 6 Schwarzsee: swamp – jump between beams and sunken stones, every 15 s a mud plain with puddles',()=>{
 const allowed=['token','waterGap','mudPuddle','frog','coin','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'];const seen=new Set();
 for(let seed=1;seed<10;seed++){let r={...start(seed),tick:9000,elapsed:450,distance:11500,nextRow:11530,nextTurn:1e9,row:70};while(r.elapsed<538){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===9){assert(allowed.includes(o.kind),o.kind);seen.add(o.kind);
  const t=450+(o.encounter!==undefined?0:0);
  if(o.kind==='waterGap'&&o.lane>=0){const same=r.objects.filter(q=>q.kind==='waterGap'&&q.rowId===o.rowId&&q.lane>=0);assert(new Set(same.map(q=>q.lane)).size<3,'Lücken sperren alle Spuren');}}}}
 for(const k of['waterGap','mudPuddle','frog'])assert(seen.has(k),'fehlt: '+k);
 // Zeitplan: 15 s Wasser, dann 6 s Schlamm – auf dem Wasser keine Pfützen, im Schlamm keine Wasserlücken
 const kindsAt=t=>{const r=action({...start(4),tick:t*20,elapsed:t,distance:12000,nextRow:12030,nextTurn:1e9,row:80},{type:'step'});return r.objects.filter(o=>o.biome===9&&t+(o.encounter-12000)/r.speed<t+1.2).map(o=>o.kind);};
 for(const t of[452,475,495])assert(!kindsAt(t).includes('mudPuddle'),'Pfütze auf dem Wasser bei '+t);
 let mudRows=0;for(const t of[466,487,508,529]){const k=kindsAt(t);assert(!k.includes('waterGap'),'Wasserlücke im Schlamm bei '+t);if(k.includes('mudPuddle'))mudRows++;}assert(mudRows>=2);
 // Ins Wasser fallen kostet ein Leben (mit Sturz), springen rettet; Lücke in einer Spur: Spur wechseln rettet
 const fall=collision('waterGap',{lane:-1});assert.equal(fall.lives,2);assert(fall.fallTicks>0);assert(fall.events.some(e=>e.kind==='splash'));assert.equal(collision('waterGap',{lane:-1,jump:10}).lives,3);
 assert.equal(collision('waterGap',{lane:0}).lives,3);
 // Schlammpfütze: hineinlaufen = stecken bleiben (stark gebremst), aber kein Leben weg; springen = frei
 const stuck=collision('mudPuddle');assert.equal(stuck.lives,3);assert(stuck.events.some(e=>e.kind==='mudStuck'));assert(stuck.slow>20);
 const slowRun=action({...stuck,objects:[],nextRow:1e9},{type:'step'}),normal=action({...start(),distance:100,nextRow:1e9,objects:[]},{type:'step'});assert(slowRun.speed<normal.speed*.5,'stark gebremst');
 const free=collision('mudPuddle',{jump:10});assert.equal(free.lives,3);assert(!free.events.some(e=>e.kind==='mudStuck'));
});
check('level 7 Hörnliweg: five sections, realistic jump/duck/lane obstacles, wooden walkways and slippery snow',()=>{
 const kindsIn=(t0,t1)=>{const seen=new Set();for(let seed=1;seed<12;seed++){let r={...start(seed),tick:t0*20,elapsed:t0,distance:14000,nextRow:14030,nextTurn:1e9,row:90};while(r.elapsed<t1){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===4&&!['coin','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind))seen.add(o.kind);}}return seen;};
 const s1=kindsIn(541,556),s2=kindsIn(559,574),s4=kindsIn(595,610);
 for(const k of['scree','rockBig','woodPiece','signpost'])assert(s1.has(k),'Abschnitt 1 fehlt '+k);
 for(const k of['woodRail','beamLow','ledge','woodBarrier'])assert(s2.has(k),'Abschnitt 2 fehlt '+k);
 assert(s4.has('snowPatch')&&!s1.has('snowPatch'),'Schnee nur oben');
 // Schmaler Holzsteg: zuerst nur die Mitte, später nur rechts begehbar
 const steg=t=>action({...start(3),tick:t*20,elapsed:t,distance:14600,nextRow:14630,nextTurn:1e9,row:95},{type:'step'}).objects.filter(o=>o.biome===4&&o.kind==='ridgeGap');
 {const a=steg(582),b=steg(589.5);assert(a.length>=2&&a.every(o=>o.lane!==1));assert(b.length>=2&&b.every(o=>o.lane!==2));}
 // Felsiger Aufstieg: keine Metallteile mehr, dafür lose Steine und Holzgeländer in einer Spur
 const s3=kindsIn(574,580.5);for(const k of['metalStrut','metalBarrier'])assert(!s3.has(k),'Metall im Aufstieg: '+k);assert(s3.has('looseRocks')||s3.has('railLane')||s3.has('rockBig'));const pre=kindsIn(577,580.5);for(const k of['railLane','woodRail','woodBarrier'])assert(!pre.has(k),'Zaun vor dem Holzsteg: '+k);
 assert.equal(collision('looseRocks',{jump:10}).lives,2);assert.equal(collision('looseRocks',{lane:0}).lives,3);assert.equal(collision('railLane',{jump:10}).lives,2);assert.equal(collision('railLane',{lane:2}).lives,3);
 // Ausweichen: springen / ducken / Spur wechseln
 assert.equal(collision('rockBig',{jump:10}).lives,3);assert.equal(collision('woodRail',{lane:-1,jump:10}).lives,3);
 assert.equal(collision('beamLow',{lane:-1,jump:10}).lives,2);assert.equal(collision('overhang',{lane:-1,duck:9}).lives,3);assert.equal(collision('beamLow',{lane:-1,duck:9}).lives,3);
 assert.equal(collision('rockFace',{jump:10}).lives,2);assert.equal(collision('ledge',{jump:10}).lives,2);assert.equal(collision('signpost',{lane:0}).lives,3);
 // Schneefeld: rutschig, kein Leben weg
 const sl=collision('snowPatch');assert.equal(sl.lives,3);assert(sl.events.some(e=>e.kind==='slip'));assert(sl.slow>0);
});
check('level collectibles and mountain shop: 5 items = 1 life, 10 items = 2 lives, leftovers carry over',()=>{
 // In jedem Level ausser Level 3 (Fische) gibt es Sammelobjekte; Fische zählen ebenfalls.
 for(const [el,z] of [[30,3],[400,1],[560,4]]){let r={...start(5),tick:el*20,elapsed:el,distance:9000,nextRow:9030,nextTurn:1e9,row:40};let n=0;while(r.elapsed<el+25){r=action({...r,lives:9,invulnerable:1},{type:'step'});n=Math.max(n,r.objects.filter(o=>o.kind==='token').length);}assert(n>0,'kein Sammelobjekt in Zone '+z);}
 let r={...start(),tick:20*84.4,elapsed:84.4,distance:1500,nextRow:99999,nextTurn:99999,items:12,lives:2};
 for(let i=0;i<6&&!r.shop;i++)r=action(r,{type:'step'});assert(r.shop===1);assert(r.events.some(e=>e.kind==='shopOpen')||r.shopSeen===1);
 assert.equal(g.validateAction({...r,items:4},'p',{type:'shop',offer:5}).ok,false);
 r=action(r,{type:'shop',offer:10});assert.equal(r.lives,4);assert.equal(r.items,2);
 assert.equal(g.validateAction(r,'p',{type:'shop',offer:10}).ok,false);   // nicht mehr als 5 Leben
 r=action(r,{type:'shopClose'});assert.equal(r.shop,0);
 for(let i=0;i<200;i++)r=action(r,{type:'step'});assert.equal(r.shop,0);assert.equal(r.items,2);   // Rest wird mitgenommen, Laden nur einmal pro Level
 let q={...start(),tick:20*86,elapsed:86,distance:1500,nextRow:99999,nextTurn:99999,shop:1,shopSeen:1};for(let i=0;i<120;i++)q=action(q,{type:'step'});assert.equal(q.shop,0);   // schliesst beim Levelwechsel
 const st={...start(),tick:20*582,elapsed:582,distance:10300,nextRow:10320,nextTurn:1e9,row:60};let w=st;for(let i=0;i<40;i++){w=action({...w,lives:9,invulnerable:1},{type:'step'});}
 for(const o of w.objects)if(['coin','token'].includes(o.kind)&&o.encounter){const t=582+(o.encounter-st.distance)/st.speed;}
});
check('late levels get faster: speed rises from level 7 to ~31 in level 10 (relaxed stays gentle), rows stay >= 0.78 s apart',()=>{
 const speedAt=(el,mode)=>{let r={...start(1,mode),tick:el*20,elapsed:el,distance:5000,nextRow:1e9,nextTurn:1e9};r=action(r,{type:'step'});return r.speed;};
 const c=[500,600,660,750,840,899].map(t=>speedAt(t,'classic'));for(let i=1;i<c.length;i++)assert(c[i]>c[i-1]);assert(Math.abs(c[5]-31)<.3,'L10 '+c[5]);assert(speedAt(899,'relaxed')<22);
 for(const t of[100,600,899])for(const m of['classic','relaxed'])assert(Math.abs(speedAt(t,m)-J.baseSpeed(t+.05,m==='relaxed'))<.01,'journey.baseSpeed = rules');
 let r={...start(3),tick:880*20,elapsed:880,distance:20000,nextRow:20030,nextTurn:1e9,row:50};const ds=[];for(let i=0;i<200;i++){r=action({...r,lives:9,invulnerable:1},{type:'step'});}
 const byRow=new Map();for(const o of r.objects)byRow.set(o.rowId,Math.min(byRow.get(o.rowId)??1e9,o.encounter-(['coin','token','heart'].includes(o.kind)?99:0)));const rows=[...new Set([...byRow.entries()].filter(([,v])=>v<1e8).map(([k])=>k))].sort((a,b)=>a-b).map(id=>Math.min(...r.objects.filter(o=>o.rowId===id&&!['coin','token','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(o.kind)).map(o=>o.encounter))).filter(Number.isFinite);for(let i=1;i<rows.length;i++)if(rows[i]-rows[i-1]>1)ds.push(rows[i]-rows[i-1]);assert(Math.min(...ds)>=r.speed*.74,'Reihenabstand');
});
check('level 8 glacier: five sections, collapsing snow bridges, ladders, seracs, wind gusts and a rope team',()=>{
 for(const [t,sec] of[[629,0],[631,1],[650,2],[670,3],[690,4],[710,5],[719.9,5],[720,0]])assert.equal(J.glacierSection(t),sec);
 const kinds=(t0,t1)=>{const seen=new Map();for(let seed=1;seed<14;seed++){let r={...start(seed),tick:t0*20,elapsed:t0,distance:12000,nextRow:12030,nextTurn:1e9,row:40};while(r.elapsed<t1){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===0)seen.set(o.kind+(o.bridgeLane!==undefined?'+ladder':''),o);}}return seen;};
 const s1=kinds(630,646),s2=kinds(648,664),s3=kinds(666,682),s5=kinds(702,716);
 assert(s1.has('crevasse+ladder'),'Leitern im Abschnitt 1');assert(s2.has('snowBridge'),'Schneebrücken');assert(s3.has('serac'),'Séracs');assert(s5.has('ropeTeam'),'Seilschaft');
 const lad=s1.get('crevasse+ladder');assert(lad.bridgeLane!==lad.lane);
 // Schneebrücke: springen; Sérac und Seilschaft: Spur wechseln
 const hit=(kind,o={})=>{let s={...start(),distance:100,nextRow:10000,x:1,target:1,objects:[{id:1,kind,lane:1,d:100.9,approach:0}],...o};return action(s,{type:'step'}).lives;};
 assert.equal(hit('snowBridge'),2);assert.equal(hit('snowBridge',{jump:10}),3);assert.equal(hit('serac',{jump:10}),2);assert.equal(hit('ropeTeam'),2);assert.equal(hit('ropeTeam',{jump:10}),3);   // Seilschaft = Wanderer wie Level 1: springen oder ausweichen
 // Windböe: Warnung 1,5 s vorher, dann eine Spur zur Seite (vom Rand immer nach innen)
 let w={...start(),tick:Math.round((J.GUSTS[0]-1.6)*20),elapsed:J.GUSTS[0]-1.6,distance:13000,nextRow:1e9,nextTurn:1e9,x:0,target:0};const ev=[];
 for(let i=0;i<40;i++){w=action(w,{type:'step'});ev.push(...w.events);}
 assert(ev.some(e=>e.kind==='gustWarn'));const gust=ev.find(e=>e.kind==='gust');assert(gust&&gust.dir===1&&w.target===1,'Böe schiebt nach innen');
});
check('level 9 ridge and level 10 summit: narrow sections keep coins off the abyss, rope teams instead of hikers, free final run to the cross',()=>{
 for(const [fn,t0,t1,z] of[[J.ridgeNarrow,726,800,10],[J.summitNarrow,832,890,5]])for(let seed=1;seed<10;seed++){let r={...start(seed),tick:t0*20,elapsed:t0,distance:16000,nextRow:16030,nextTurn:1e9,row:40};
  while(r.elapsed<t1){r=action({...r,lives:9,invulnerable:5,slow:0},{type:'step'});for(const o of r.objects){if(o.biome!==z||o.resolved)continue;const at=r.elapsed+(o.encounter-r.distance)/J.baseSpeed(r.elapsed,false),n=fn(at);
   if(n>=0&&fn(at-.3)===n&&fn(at+.3)===n&&['coin','token','heart'].includes(o.kind))assert.notEqual(o.lane,n,'Münze über dem Abgrund');assert(o.kind!=='hiker','keine Wanderer am Grat');}}}
 let r={...start(4),tick:880*20,elapsed:880,distance:20000,nextRow:20030,nextTurn:1e9,row:50};const late=[];
 while(r.phase==='playing'){r=action({...r,lives:9,invulnerable:5,slow:0},{type:'step'});for(const o of r.objects){if(o.resolved)continue;const at=r.elapsed+(o.encounter-r.distance)/J.baseSpeed(r.elapsed,false);if(at>892.3&&!['coin','token','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes'].includes(o.kind))late.push(o.kind);}}
 assert.equal(r.phase,'won');assert.deepEqual(late,[],'letzte 8 s ohne Hindernisse');
});
check('level 6 frogs replace the crocodiles: tongue out every 2 s for 0.5 s, only an outstretched tongue costs a life, frogs are out of sync',()=>{
 // Treffer nur, wenn die Zunge beim Vorbeilaufen draussen ist (Tick 0–9 von 40); Springen rettet; andere Spur rettet
 const frogHit=(tick,o={})=>{let s={...start(),tick:tick-1,distance:100,nextRow:10000,x:1,target:1,objects:[{id:1,kind:'frog',lane:1,d:100.9,approach:0,side:1,phase:0}],...o};return action(s,{type:'step'});};
 let outCount=0;for(let t=0;t<40;t++){const r=frogHit(400+t);if(r.lives===2){outCount++;assert(r.events.some(e=>e.kind==='bump'&&e.object==='frog'));}}
 assert.equal(outCount,10,'Zunge genau 0,5 s von 2 s draussen');
 assert.equal(frogHit(400,{jump:10}).lives,3,'über die Zunge springen');assert.equal(frogHit(400,{x:0,target:0}).lives,3,'andere Spur');
 // Frösche im Level: nur im Schwarzsee, nie in allen Spuren, nicht alle im Gleichtakt
 const phases=new Set();let frogs=0;
 for(let seed=1;seed<10;seed++){let r={...start(seed),tick:9000,elapsed:450,distance:11500,nextRow:11530,nextTurn:1e9,row:70};const seen=new Set();
  while(r.elapsed<538){r=action({...r,lives:9,invulnerable:5,slow:0},{type:'step'});for(const o of r.objects){if(o.kind!=='frog'||seen.has(o.id))continue;seen.add(o.id);frogs++;phases.add(o.phase);assert.equal(o.biome,9);
   const row=r.objects.filter(q=>q.rowId===o.rowId&&!['coin','token','heart','magnet','springs','clover','binoculars','guard','slowmo','itemMagnet','shieldOrb','coinBoost','rushCharge','springs','clover','binoculars','guard','slowmo','itemMagnet'].includes(q.kind));assert(new Set(row.map(q=>q.lane)).size<3,'freie Spur');
   assert(!r.objects.some(q=>q.kind==='coin'&&q.rowId===o.rowId&&row.some(f=>f.lane===q.lane)),'Münzen nicht in der Zungenspur');}}}
 assert(frogs>=40,'genug Frösche: '+frogs);assert(phases.size>=6,'verschiedene Takte: '+phases.size);
 for(let seed=1;seed<30;seed++){let r={...start(seed),tick:300*20,elapsed:300,distance:7000,nextRow:7030,nextTurn:1e9,row:40};for(let i=0;i<200;i++)r=action({...r,lives:9,invulnerable:5},{type:'step'});assert(!r.objects.some(o=>o.kind==='frog'),'keine Frösche ausserhalb des Schwarzsees');}
});
check('level collectibles are picked up exactly like the fish in level 3: into the backpack, no extra points',()=>{
 const pick=kind=>{let s={...start(),distance:100,nextRow:10000,x:1,target:1,items:0,objects:[{id:1,kind,lane:1,d:100.9,approach:0,biome:kind==='token'?3:7}]};const before=s.score;const r=action(s,{type:'step'});return{items:r.items,points:r.score-before,ev:r.events.map(e=>e.kind)};};
 const tk=pick('token'),fi=pick('fishCatch');assert.equal(tk.items,1);assert.equal(fi.items,1);assert.equal(tk.points,fi.points,'gleiche Punkte wie ein Fisch');assert(tk.ev.includes('token')&&fi.ev.includes('fishCatch'));
 // In jedem Level ausser Level 3 erscheint das Level-Sammelobjekt, in Level 3 weiterhin die Fische
 for(const [el,z] of[[20,3],[110,6],[200,7],[300,8],[380,1],[470,9],[560,4],[650,0],[740,10],[830,5]]){let r={...start(6),tick:el*20,elapsed:el,distance:4000+el*20,nextRow:4030+el*20,nextTurn:1e9,row:40};const kinds=new Set();
  for(let i=0;i<500;i++){r=action({...r,lives:9,invulnerable:5,slow:0,shopSeen:20},{type:'step'});for(const o of r.objects)if(o.biome===z)kinds.add(o.kind);}
  if(z===7){assert(kinds.has('fishCatch'));assert(!kinds.has('token'));}else assert(kinds.has('token'),'kein Sammelobjekt in Zone '+z);}
});
check('level 3 lake: fish buckets (jump) and a fishing rod across two lanes (jump or take the free lane)',()=>{
 const seen=new Map();for(let seed=1;seed<16;seed++){let r={...start(seed),tick:185*20,elapsed:185,distance:5000,nextRow:5030,nextTurn:1e9,row:40};
  while(r.elapsed<265){r=action({...r,lives:9,invulnerable:5,slow:0},{type:'step'});for(const o of r.objects)if(['fishBucket','rodAcross'].includes(o.kind)&&!seen.has(o.id)){seen.set(o.id,o);assert.equal(o.biome,7);
   if(o.kind==='rodAcross'){const row=r.objects.filter(q=>q.rowId===o.rowId&&q.kind==='rodAcross').map(q=>q.lane).sort();assert.equal(row.length,2);assert.equal(row[1]-row[0],1,'zwei benachbarte Spuren');
    assert(!r.objects.some(q=>q.kind==='coin'&&q.rowId===o.rowId&&row.includes(q.lane)),'Münzen in der freien Spur');}}}}
 const kinds=new Set([...seen.values()].map(o=>o.kind));assert(kinds.has('fishBucket')&&kinds.has('rodAcross'));
 for(const kind of['fishBucket','rodAcross']){assert.equal(collision(kind).lives,2);assert.equal(collision(kind,{jump:10}).lives,3);}
});
check('gadgets: protection bubble 10 s (no lives lost), slow motion 6 s, backpack magnet 10 s (items from every lane)',()=>{
 const pick=kind=>action({...start(),distance:100,nextRow:10000,x:1,target:1,objects:[{id:1,kind,lane:1,d:100.9,approach:0}]},{type:'step'});
 const g=pick('guard');assert.equal(g.guard,200);assert(g.events.some(e=>e.power==='pickupGuard'));
 let s={...g,distance:200,nextRow:10000,objects:[{id:2,kind:'boulder',lane:1,d:200.9,approach:0}],invulnerable:0};s=action(s,{type:'step'});assert.equal(s.lives,3,'Schutzblase schützt');assert(s.events.some(e=>e.kind==='guardBlock'));
 let t={...start(),guard:1,distance:200,nextRow:10000,x:1,target:1,objects:[{id:3,kind:'boulder',lane:1,d:200.9,approach:0}]};t=action(t,{type:'step'});assert.equal(t.lives,2,'nach 10 s vorbei');
 const z=pick('slowmo');assert.equal(z.slowmo,120);const fast=action({...start(),distance:100,nextRow:10000},{type:'step'}),slow=action({...start(),slowmo:50,distance:100,nextRow:10000},{type:'step'});assert(Math.abs(slow.speed/fast.speed-.65)<.01,'Zeitlupe');
 const m=pick('itemMagnet');assert.equal(m.itemMagnet,200);const far=action({...m,distance:300,nextRow:10000,x:0,target:0,items:0,objects:[{id:4,kind:'token',lane:2,d:300.9,approach:0,biome:3}]},{type:'step'});assert.equal(far.items,1,'Gegenstand aus der anderen Spur');
});
check('springs (10 s higher and longer jumps), lucky clover (next hit costs 10 coins instead of a life), binoculars before the Furi fog',()=>{
 const pick=kind=>action({...start(),distance:100,nextRow:10000,x:1,target:1,objects:[{id:1,kind,lane:1,d:100.9,approach:0}]},{type:'step'});
 const sp=pick('springs');assert.equal(sp.springs,200);assert(sp.events.some(e=>e.power==='pickupSprings'));
 let j=action(sp,{type:'jump'});assert.equal(j.jump,24);let maxH=0,air=0;for(let i=0;i<30;i++){j=action({...j,nextRow:1e9},{type:'step'});if(j.jumpY>0)air++;maxH=Math.max(maxH,j.jumpY);}
 let n=action(start(),{type:'jump'});let maxN=0,airN=0;for(let i=0;i<30;i++){n=action({...n,nextRow:1e9},{type:'step'});if(n.jumpY>0)airN++;maxN=Math.max(maxN,n.jumpY);}
 assert(maxH>maxN*1.3,'höher');assert(air>airN+4,'länger in der Luft');
 const cl=pick('clover');assert.equal(cl.luck,1);let h={...cl,coins:25,distance:200,nextRow:10000,objects:[{id:2,kind:'boulder',lane:1,d:200.9,approach:0}]};h=action(h,{type:'step'});
 assert.equal(h.lives,3,'Klee rettet das Leben');assert.equal(h.coins,15,'kostet 10 Münzen');assert.equal(h.luck,0);assert(h.events.some(e=>e.kind==='luckSaved'));
 const bi=pick('binoculars');assert.equal(bi.bino,200);
 for(let seed=1;seed<6;seed++){let r={...start(seed),tick:290*20,elapsed:290,distance:6500,nextRow:6530,nextTurn:1e9,row:40};const seen=[];while(r.elapsed<346){r=action({...r,lives:9,invulnerable:5,slow:0},{type:'step'});for(const o of r.objects)if(o.kind==='binoculars'&&!seen.includes(o.id))seen.push(o.id);}assert.equal(seen.length,2,'je ein Fernglas vor den zwei Nebelbänken');}
});
console.log(`${checks} rule checks passed`);
