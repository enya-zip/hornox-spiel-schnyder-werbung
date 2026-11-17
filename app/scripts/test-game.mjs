import{introFrame,INTRO_DURATION,COUNTDOWN_DURATION}from'../public/intro.js';
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
function bot(seed,seconds=1260){let s=start(seed,'relaxed');while(s.phase==='playing'&&s.elapsed<seconds){if(s.nextTurn-s.distance<s.speed*1.3)s=action(s,{type:'turn',direction:turnDirection(s.seed,s.summitTurn,s.turnIndex)});const ahead=s.objects.filter(o=>!o.resolved&&o.d-(o.front||0)>s.distance&&o.d-(o.front||0)-s.distance<(s.speed+(o.approach||0))*1.3);const bad=ahead.filter(o=>['carriage','scooter','skiers','snowboarders','influencer','lostTourists','snowman','flamingo','manhole','electric','photographers','bike','hiker','pedestrian','sheep','marmot','iceBlock','crevasse','luggage','trolley','planter','cafe','awning','boulder','rockfall','lowRock','ridgeGap','hook','fish','ibex','crow','gull','trunk','fallingBranch','sign','deer','boarCross','squirrelHop','bigMushroom','woodpile','branchPile','roots'].includes(o.kind));const coin=ahead.find(o=>o.kind==='coin');let lane=coin?.lane??s.target;const blocked=l=>bad.some(o=>Math.abs((o.target??o.real??o.lane)-l)<(o.hitWidth||.38));if(blocked(lane))lane=[0,1,2].find(l=>!blocked(l))??s.target;s=action(s,{type:'steer',lane});const close=ahead.filter(o=>o.d-s.distance<(s.speed+(o.approach||0))*.38&&(o.lane===-1||Math.abs(o.lane-s.x)<.4)).sort((a,b)=>a.d-b.d)[0];if(close&&!s.jump&&!s.duck){if(['iceArch','branch','awning','rope'].includes(close.kind)||close.kind==='hook'&&close.attack==='high'||close.kind==='highLog')s=action(s,{type:'duck'});else if(['iceBlock','log','barrier','crevasse','ridgeGap','lowRock','beaverLog','plankGap','stream','log'].includes(close.kind))s=action(s,{type:'jump'});}s=action(s,{type:'step'});assert(s.objects.length<100);}return s;}
check('full 15-minute journey reaches the summit with bounded state',()=>{const s=bot(20261029);assert.equal(s.phase,'won',JSON.stringify({elapsed:s.elapsed,reason:s.failReason}));assert.equal(s.elapsed,900);assert.equal(s.arrivals,0);assert(s.coins>100);console.log('RUN',JSON.stringify({elapsed:s.elapsed,distance:Math.floor(s.distance),coins:s.coins,arrivals:s.arrivals,turns:s.turns}));});
check('environment-specific hazards remain appropriate and every variant is reachable',()=>{
 const profiles={
  3:['snowman','luggage','trolley','planter','electric','photographers','manhole','carriage','scooter','skiers','snowboarders','influencer','lostTourists','pedestrian','bike'],
  6:['hiker','marmot','sheep','log','branch','bike'],7:['fish','beaverLog','gull'],8:['roots','log','boulder','sign','trunk'],1:['hiker','marmot','sheep','log','branch','bike'],
  9:['hiker','lowRock','ridgeGap','rope','rockfall','boulder'],4:['hiker','lowRock','ridgeGap','rope','rockfall','boulder'],10:['hiker','lowRock','ridgeGap','rope','rockfall','boulder'],0:['iceBlock','crevasse','iceArch'],5:['iceBlock','crevasse','iceArch','crow','ibex']};
 for(const [elapsed,z]of [[30,3],[110,6],[200,7],[276,8],[390,1],[480,9],[570,4],[660,0],[750,10],[840,5]]){const found=new Set();for(let seed=1;seed<90;seed++){
  const state={...start(seed),flamingoSpawned:true,tick:elapsed*20,elapsed,distance:1000,nextRow:1030,nextTurn:99999,row:20,nextFishAt:seed%3===0?0:9999};
  for(const o of action(state,{type:'step'}).objects){if(['coin','magnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom'].includes(o.kind))continue;assert.equal(o.biome,z);assert(profiles[z].includes(o.kind),'wrong biome: '+o.kind);found.add(o.kind);}
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
  for(const o of s.objects){if(['coin','magnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom'].includes(o.kind))continue;if(!rows.has(o.rowId))rows.set(o.rowId,[]);rows.get(o.rowId).push(o);if(o.approach>0){incoming++;assert(Math.abs((o.d-(o.front||0)-s.distance)/(s.speed+o.approach)-(o.encounter-s.distance)/s.speed)<.00001);}}
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
check('periodic heart rows use a clear lane and stay away from corner hazards',()=>{let found=0;for(let seed=1;seed<40;seed++)for(const elapsed of[45,110,200,290,390,480,570,660,750,840]){const s=action({...start(seed),elapsed,tick:elapsed*20,distance:1100,nextRow:1120,nextTurn:99999,row:20,nextHeartAt:0},{type:'step'});for(const h of s.objects.filter(o=>o.kind==='heart')){found++;const hazards=s.objects.filter(o=>o.rowId===h.rowId&&!['coin','magnet','heart','shieldOrb','coinBoost','rushCharge'].includes(o.kind));assert(hazards.every(o=>{const lane=o.real??o.target??o.lane;return Math.abs(lane-h.lane)>=(o.hitWidth||.38)&&lane!==-1;}));const nearest=260+Math.max(0,Math.round((h.encounter-11-260)/680))*680;assert(Math.abs(h.encounter-11-nearest)>80);assert(s.nextHeartAt>elapsed+50);}}assert(found>100);});
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
check('one flamingo per full run, survives world changes, resets on a new run',()=>{
 for(const seed of[1,123,20261029,9876]){
  let s=start(seed),found=new Set();
  for(let i=0;i<18000;i++){
   s=action({...s,invulnerable:30,shield:30,nextTurn:999999},{type:'step'});
   for(const o of s.objects)if(o.kind==='flamingo'){found.add(o.id);assert([2,3].includes(o.biome));}
  }
  assert.equal(s.phase,'won');assert.equal(found.size,1);assert(s.flamingoSpawned);assert.equal(start(seed).flamingoSpawned,false);
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
 for(const kind of['magnet','shieldOrb','coinBoost','rushCharge']){const s=action({...start(),powerTicks:60,distance:100,nextRow:99999,nextTurn:99999,objects:[{id:1,kind,lane:0,d:106}]},{type:'step'});assert(s.objects.some(o=>o.kind===kind));assert(!s.events.some(e=>e.kind==='powerClear'));}
});
check('all four collectible power-ups spawn in safe lanes',()=>{
 const found=new Set();for(let row=9;row<100;row++)for(let seed=1;seed<20;seed++){
  const s=action({...start(seed),flamingoSpawned:true,elapsed:120,tick:2400,distance:1000,nextRow:1030,nextTurn:99999,row},{type:'step'});
  for(const p of s.objects.filter(o=>['magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind))){found.add(p.kind);assert(s.objects.filter(o=>o.rowId===p.rowId&&!['coin','heart','magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind)).every(o=>o.lane===-1||Math.abs(o.lane-p.lane)>=(o.hitWidth||.38)));}
 }assert.equal(found.size,4);
});
check('mountain bikes are materially more frequent below the alpine rock stages',()=>{
 let bikes=0,rows=0;for(let seed=1;seed<80;seed++){
  const s=action({...start(seed),flamingoSpawned:true,elapsed:120,tick:2400,distance:1000,nextRow:1030,nextTurn:99999,row:30},{type:'step'});
  const hazards=s.objects.filter(o=>!['coin','heart','magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind));bikes+=hazards.filter(o=>o.kind==='bike').length;rows+=new Set(hazards.map(o=>o.rowId)).size;
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
check('level 3: fish every 10 s, beavers and seagulls, at least 3 s between lake hazards, nothing else on the trail',()=>{for(let seed=1;seed<=12;seed++){let s={...start(seed),tick:3600,elapsed:180,distance:3800,nextRow:3830,nextTurn:999999,row:200};const seen=new Set();let last=-1e9,count=0;
 while(s.phase==='playing'&&s.elapsed<269){s=action({...s,lives:999,invulnerable:1},{type:'step'});for(const o of s.objects){if(o.kind!=='fish'||seen.has(o.id))continue;seen.add(o.id);const t=s.elapsed+(o.d-s.distance)/s.speed;assert(t-last>=9.9,'gap '+(t-last));last=t;count++;}for(const o of s.objects)if(o.biome===7)assert(['fish','beaverLog','gull','coin','fishCatch','heart','magnet','shieldOrb','coinBoost','rushCharge','hook'].includes(o.kind),o.kind);}assert(count>=6&&count<=9,'count '+count);}});
check('level 4: grunts, boar hunt from the gorge to the end, race mode, bridge, forest obstacles and lucky mushrooms',()=>{
 let g={...start(),tick:6099,elapsed:304.95,distance:7600,nextRow:1e9,nextTurn:1e9,objects:[]};g=action(g,{type:'step'});assert(g.events.some(e=>e.kind==='boarGrunt'));assert.equal(g.boar,0);
 let s={...start(),tick:6539,elapsed:326.95,distance:8200,nextRow:1e9,nextTurn:1e9,checkpoints:2,objects:[]};s=action(s,{type:'step'});assert.equal(s.boar,660);assert(s.events.some(e=>e.kind==='boarAppear'));
 let clean=s,rams=0;for(let k=0;k<180;k++){clean=action({...clean,nextRow:1e9},{type:'step'});if(clean.events.some(e=>e.kind==='boarRam'))rams++;}assert.equal(rams,0);
 const drift=(st,n)=>{let x={...st,boarGap:12,boarBump:st.tick};for(let k=0;k<n;k++)x=action({...x,nextRow:1e9},{type:'step'});return x.boarGap;};
 const normal=drift({...s,elapsed:330,tick:6600},40),race=drift({...s,elapsed:340,tick:6800},40);assert(race<normal);
 const jumped=action({...s,boarGap:8,x:1,target:1,jump:10,objects:[{id:1,kind:'log',lane:-1,d:s.distance+.9}]},{type:'step'});assert(jumped.boarGap>8.5);
 const rammed=action({...s,shield:0,boarGap:3.01,lives:3},{type:'step'});assert(rammed.events.some(e=>e.kind==='boarRam'));assert.equal(rammed.lives,2);assert.equal(rammed.boarGap,12);assert(rammed.invulnerable>=45);
 const both=action({...s,shield:0,boarGap:5,lives:3,x:1,target:1,objects:[{id:1,kind:'boulder',lane:1,d:s.distance+.9}]},{type:'step'});assert(both.events.some(e=>e.kind==='boarRam'));assert.equal(both.lives,2);
 let bridge=0;for(let seed=1;seed<30;seed++){const b=action({...start(seed),tick:6400,elapsed:320,distance:8000,nextRow:8030,nextTurn:99999,row:30},{type:'step'});const onBridge=b.objects.filter(o=>320+(o.encounter-b.distance)/b.speed<326.5);const gaps=onBridge.filter(o=>o.kind==='plankGap');bridge+=gaps.length;for(const row of new Set(gaps.map(o=>o.rowId)))assert(new Set(gaps.filter(o=>o.rowId===row).map(o=>o.lane)).size<3);for(const o of onBridge)if(!['coin','mushroom','heart','magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind))assert.equal(o.kind,'plankGap');}
 assert(bridge>10);assert.equal(collision('plankGap').lives,2);assert.equal(collision('plankGap',{jump:10}).lives,3);
 assert.equal(collision('trunk',{jump:10}).lives,2);assert.equal(collision('fallingBranch',{jump:10}).lives,2);assert.equal(collision('highLog',{lane:-1,duck:9}).lives,3);assert.equal(collision('highLog',{lane:-1,jump:10}).lives,2);
 assert.equal(collision('stream',{lane:-1,jump:10}).lives,3);assert.equal(collision('roots',{jump:10}).lives,3);assert.equal(collision('boarCross',{lane:0}).lives,3);assert.equal(collision('sign',{jump:10}).lives,2);
 const pick=kind=>action({...start(),distance:100,nextRow:10000,x:1,objects:[{id:1,kind,lane:1,d:100.9}]},{type:'step'});
 assert(pick('mushroom').events.some(e=>e.kind==='mushroom'));
 // Nur die gewünschten Waldobjekte erscheinen im ganzen Level
 const allowed=['roots','log','highLog','boulder','trunk','stream','sign','boarCross','fallingBranch','plankGap','coin','mushroom','heart','magnet','shieldOrb','coinBoost','rushCharge'];
 for(let seed=1;seed<8;seed++){let r={...start(seed),tick:5400,elapsed:270,distance:6800,nextRow:6830,nextTurn:1e9,row:40};while(r.elapsed<358){r=action({...r,lives:9,invulnerable:1},{type:'step'});for(const o of r.objects)if(o.biome===8)assert(allowed.includes(o.kind),o.kind);}}
});
console.log(`${checks} rule checks passed`);
