// Level-Sammelobjekte für den Bergladen: in jedem Level ein Gegenstand, der zum Thema passt.
// Zone → Gegenstand (Level 3 «Zum See» sammelt Fische, siehe lake.js):
//  3 Zermatt: Goldmünze · 6 Blatten: buntes Blatt · 8 Füri: Tannenzapfen · 1 Alpweiden: Alpenblume
//  9 Schwarzsee: bunter Seestein · 4 Hörnliweg: wilde Beeren · 0 Gletscher: Eiskristall
//  10 Hörnligrat: Bergkristall · 5 Matterhorn: goldener Gipfelstern
// Alle schweben über der Spur, drehen sich und haben einen weichen Leuchtring – so unterscheiden sie sich von Münzen.
export function createTokens(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const glow=c=>a('ring',0,.06,0,.8,.8,.05,[...c,49],PI/2);
 const leafColors=[[.95,.45,.1],[.85,.18,.12],[.98,.75,.15],[.75,.32,.12]];
 const stoneColors=[[.2,.68,.7],[.55,.35,.75],[.85,.4,.45],[.3,.55,.85]];
 function goldCoin(id){a('cylinder',0,0,0,.36,.09,.36,[1,.78,.22],PI/2);for(const s of[-1,1]){a('ring',0,0,s*.05,.33,.33,.06,[1,.9,.5,9]);star(.14,s*.052,[1,.95,.6]);}}
 function star(size,z,c){for(let k=0;k<5;k++){const t=k*PI*2/5;a('box',Math.sin(t)*size*.45,Math.cos(t)*size*.45,z,size*.32,size*.95,.03,c,0,0,-t);}}
 function leaf(id){const c=leafColors[Math.abs(id)%4];a('sphere',0,0,0,.34,.03,.2,c,0,0,.3);a('sphere',.05,0,.02,.26,.035,.12,c.map(v=>v*.85),0,.5,.3);a('cylinder',0,0,0,.02,.62,.02,[.45,.3,.15],PI/2,0,.3+PI/2);for(const s of[-1,1])a('cylinder',s*.1,0,.03,.012,.22,.012,c.map(v=>v*.7),PI/2,0,s*.9);}
 function pinecone(){for(let j=0;j<6;j++){const y=-.24+j*.1,w=.2-Math.abs(j-2.2)*.035;for(let k=0;k<6;k++){const t=k*PI/3+j*.5;a('sphere',Math.cos(t)*w*.7,y,Math.sin(t)*w*.7,w*.55,.07,w*.55,j%2?[.5,.32,.17]:[.42,.26,.13],Math.sin(t)*.6,0,-Math.cos(t)*.6);}}a('cylinder',0,.36,0,.03,.1,.03,[.35,.24,.12]);}
 function alpineFlower(id){const c=[[.98,.98,.95],[.95,.55,.75],[.55,.5,.95],[1,.85,.25]][Math.abs(id)%4];for(let k=0;k<8;k++){const t=k*PI/4;a('sphere',Math.cos(t)*.22,0,Math.sin(t)*.22,.15,.04,.08,c,0,-t);}a('sphere',0,.03,0,.1,.08,.1,[1,.75,.15]);a('cylinder',0,-.4,0,.025,.7,.025,[.3,.55,.22]);a('sphere',.1,-.45,0,.12,.03,.05,[.35,.6,.25],0,0,.5);}
 function seaStone(id){const c=stoneColors[Math.abs(id)%4];a('sphere',0,0,0,.3,.2,.24,c);a('sphere',-.06,.07,-.05,.12,.06,.09,c.map(v=>Math.min(1,v*1.5)));a('sphere',.08,-.02,.1,.05,.03,.04,[1,1,1,49]);}
 function berries(){const c=[[.75,.08,.15],[.85,.12,.2],[.32,.12,.45]];for(let k=0;k<7;k++){const t=k*1.9,rr=k?.13:0;a('sphere',Math.cos(t)*rr,Math.sin(k*2.3)*.06+(k?0:.04),Math.sin(t)*rr,.1,.1,.1,c[k%3]);}for(const s of[-1,1])a('sphere',s*.2,.12,0,.16,.025,.08,[.3,.55,.22],0,s*.6,s*.4);a('cylinder',0,.16,0,.015,.14,.015,[.4,.3,.15]);}
 function iceCrystal(){a('cone',0,.2,0,.16,.36,.16,[.75,.92,1,49]);a('cone',0,-.2,0,.16,.36,.16,[.75,.92,1,49],PI);for(const s of[-1,1])a('cone',s*.2,0,0,.07,.2,.07,[.85,.96,1,49],0,0,-s*PI/2);a('sphere',0,0,0,.06,.06,.06,[1,1,1,9]);}
 function rockCrystal(){const pts=[[0,0,.12,.5,0],[.13,-.06,.08,.34,.4],[-.12,-.06,.08,.3,-.35],[.04,-.08,.07,.26,.15]];for(const [x,y,w,h,tilt] of pts){a('cylinder',x,y,0,w,h*.6,w,[.88,.9,.95,49],0,0,tilt);a('cone',x-Math.sin(tilt)*h*.42,y+Math.cos(tilt)*h*.42,0,w,h*.28,w,[.95,.97,1,49],0,0,tilt);}a('rock',0,-.24,0,.3,.1,.22,[.45,.43,.42]);}
 function summitStar(){star(.55,0,[1,.82,.2]);star(.42,.02,[1,.95,.55]);a('sphere',0,0,0,.08,.08,.05,[1,1,.85,9]);}
 // zone = Biome des Objekts; Rückgabe false, wenn diese Zone kein eigenes Token hat.
 function token(zone,time,id){
  const bob=1.1+Math.sin(time*3+id)*.1,spin=time*1.8+id;
  glow(zone===0||zone===10?[.6,.85,1]:zone===9?[.4,.9,.85]:zone===4?[1,.45,.5]:zone===6?[1,.6,.25]:zone===8?[.8,.6,.35]:zone===1?[1,.85,.95]:[1,.85,.35]);
  push(0,bob,0,0,spin,0,1.5);
  if(zone===3)goldCoin(id);else if(zone===6)leaf(id);else if(zone===8)pinecone();else if(zone===1)alpineFlower(id);else if(zone===9)seaStone(id);
  else if(zone===4)berries();else if(zone===0)iceCrystal();else if(zone===10)rockCrystal();else summitStar();
  pop();
 }
 // Bergladen am Wegrand: Holzhütte mit rot-weisser Markise, Theke, Herz-Schild und Kisten.
 function shop(time){
  const wood=[.55,.4,.26],dark=[.4,.28,.17];
  a('box',0,1.1,0,3,2.2,1.8,wood);a('box',0,2.35,0,3.4,.18,2.2,dark);
  for(let k=0;k<6;k++)a('box',-1.45+k*.58,2.1,1.15,.58,.08,.7,k%2?[.95,.95,.92]:[.82,.14,.14],-.45);
  a('box',0,.95,1.05,2.6,.12,.5,[.62,.46,.3]);a('box',0,.45,1.0,2.6,.9,.08,dark);
  push(0,2.95,.6);a('box',0,0,0,1.9,.6,.08,[.97,.94,.86]);for(const s of[-1,1])a('sphere',s*.11-.45,.05,.06,.13,.13,.05,[.9,.15,.2]);a('cone',-.45,-.1,.06,.2,.18,.05,[.9,.15,.2],PI);a('box',.35,0,.06,.85,.12,.02,[.25,.2,.15]);pop();
  for(const [x,c] of[[-.8,[1,.8,.2]],[0,[.9,.3,.25]],[.8,[.4,.7,.95]]])a('box',x,1.12,1.05,.4,.22,.3,c);
  a('box',1.9,.3,.9,.6,.6,.6,dark);a('box',2.2,.25,1.5,.5,.5,.5,wood);
  for(const s of[-1,1])a('cylinder',s*1.6,1.2,1.3,.07,2.2,.07,dark);
  const sway=Math.sin(time*2)*.08;a('sphere',-1.6,2.6+sway,1.3,.12,.16,.12,[1,.8,.3,9]);
 }
 return{token,shop};
}
