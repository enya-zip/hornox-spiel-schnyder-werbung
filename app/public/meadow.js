// Level 5 «Alpweiden»: Hindernisse, Tiere, Schäferhund, Sammelobjekte und Wiesenkulisse – aus einfachen Formen.
export function createMeadow(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const wood=[.5,.35,.2],woodDark=[.36,.25,.15],straw=[.86,.72,.38],strawDark=[.7,.56,.26],grass=[.36,.58,.24];

 // ---------- Hindernisse (lokal: Laufrichtung +z) ----------
 // Holzzaun über den ganzen Weg (drüberspringen).
 function fence(){for(const x of[-4.1,-2,0,2,4.1])a('box',x,.55,0,.14,1.1,.14,woodDark);for(const y of[.45,.9])a('box',0,y,0,8.6,.12,.08,wood);}
 // Weidegatter: Balken auf Kopfhöhe mit Schild (darunter rutschen).
 function gate(){for(const x of[-4.3,4.3]){a('box',x,1.2,0,.22,2.4,.22,woodDark);a('cone',x,2.5,0,.18,.25,.18,woodDark);}a('box',0,1.85,0,8.8,.2,.14,wood);a('box',0,2.15,0,8.8,.08,.1,wood);a('box',0,2.05,.09,1.4,.36,.03,[.92,.86,.7]);a('box',0,2.05,.11,1.1,.08,.01,[.55,.2,.12]);}
 // Runder Heuballen; roll = Drehwinkel (rollt quer zur Strecke).
 function hayBale(roll=0){push(0,.82,0,0,0,roll);a('cylinder',0,0,0,.82,1.25,.82,straw,PI/2);for(const z of[-.63,.63])a('cylinder',0,0,z,.8,.02,.8,strawDark,PI/2);for(let k=0;k<3;k++)a('ring',0,0,0,.25+k*.2,.25+k*.2,.03,strawDark,0,0,0);pop();}
 // Hoher Heuhaufen (nicht durchlaufen, nur ausweichen).
 function haystack(){a('cone',0,1.15,0,1.05,2.3,1.05,straw);a('sphere',0,.35,0,1.05,.5,1.05,strawDark);for(let k=0;k<5;k++)a('box',Math.cos(k*1.3)*.5,1.6-k*.18,Math.sin(k*1.3)*.5,.04,.3,.02,[.95,.85,.5],.4,k,.3);}
 // Futtertrog mit Wasser (drüberspringen).
 function trough(){a('box',0,.35,0,1.9,.6,.8,wood);a('box',0,.62,0,1.7,.06,.6,[.3,.55,.65,26]);for(const x of[-.85,.85])a('box',x,.15,0,.12,.3,.9,woodDark);}
 // Wassergraben quer über den Weg (drüberspringen).
 function ditch(time){a('box',0,.02,0,8.8,.04,1.6,[.2,.45,.5,26]);for(const z of[-.85,.85])a('box',0,.06,z,8.8,.1,.12,grass);for(let k=0;k<5;k++){const ph=(time*1.2+k*.21)%1;a('box',-4+ph*8,.05,(k%3-1)*.4,.5,.02,.06,[.85,.95,1,49]);}}
 // Holzstapel (drüberspringen).
 function woodstack(){for(let row=0;row<2;row++)for(let k=0;k<4-row;k++)a('cylinder',(k-(3-row)/2)*.46,.24+row*.4,0,.22,1.2,.22,k%2?wood:[.58,.42,.26],PI/2);}

 // ---------- Tiere (Kopf in +z) ----------
 // Kuh mit Glocke; walk = Laufzeit für Beine und Kopfnicken.
 function cow(walk=0,id=0){
  const white=[.95,.94,.9],brown=[.5,.3,.18],nod=Math.sin(walk*3+id)*.06;
  a('sphere',0,1.35,0,.62,.6,1.15,white);for(const [x,y,z] of[[.4,1.5,.3],[-.35,1.4,-.4],[.2,1.7,-.6],[-.45,1.55,.5]])a('sphere',x,y,z,.32,.3,.36,brown);
  a('sphere',0,1.5+nod,1.2,.34,.36,.42,brown);a('sphere',0,1.38+nod,1.55,.24,.2,.16,[.92,.75,.68]);
  for(const s of[-1,1]){a('cone',s*.28,1.85+nod,1.15,.06,.28,.06,[.95,.92,.82],0,0,s*.9);a('sphere',s*.4,1.6+nod,1.05,.16,.08,.1,brown);a('sphere',s*.14,1.62+nod,1.48,.05,.05,.04,[.05,.05,.05]);}
  a('box',0,1.12+nod,1.05,.1,.08,.12,[.3,.2,.12]);a('cone',0,.96+nod,1.1,.16,.26,.16,[.95,.75,.2],PI);   // Glocke
  for(const [x,z,ph] of[[-.32,.7,0],[.32,.7,PI],[-.32,-.75,PI],[.32,-.75,0]]){push(x,.9,z,Math.sin(walk*5+ph)*.35,0,0);a('cylinder',0,-.45,0,.11,.9,.11,white);a('box',0,-.9,0,.14,.08,.16,[.2,.18,.15]);pop();}
  push(0,1.5,-1.12,.5+Math.sin(walk*4+id)*.4,0,Math.sin(walk*2+id)*.3);a('cylinder',0,-.4,0,.03,.8,.03,white);a('sphere',0,-.82,0,.07,.12,.07,brown);pop();
 }
 // Ziege mit Hörnchen und Bart.
 function goat(run=0,id=0,jump=0){
  const fur=[.92,.9,.84],brown=[.55,.4,.26],hop=jump?Math.sin(Math.min(1,jump)*PI)*.8:0;push(0,hop,0);
  a('sphere',0,.85,0,.34,.36,.62,fur);a('sphere',0,.92,-.2,.3,.3,.4,brown);a('sphere',0,1.18,.6,.2,.22,.26,fur);
  a('sphere',0,1.02,.62,.05,.12,.05,brown);for(const s of[-1,1]){a('cone',s*.08,1.42,.52,.04,.24,.04,[.6,.55,.45],-.5);a('sphere',s*.1,1.26,.78,.035,.035,.03,[.05,.05,.05]);a('sphere',s*.2,1.24,.5,.1,.05,.06,fur);}
  for(const [x,z,ph] of[[-.18,.38,0],[.18,.38,PI],[-.18,-.4,PI],[.18,-.4,0]]){push(x,.55,z,Math.sin(run*10+ph+id)*.5,0,0);a('cylinder',0,-.28,0,.06,.56,.06,fur);pop();}
  pop();
 }
 // Huhn.
 function chicken(run=0,id=0){const bob=Math.abs(Math.sin(run*16+id))*.08;push(0,bob,0);a('sphere',0,.38,0,.22,.22,.28,[.97,.95,.9]);a('sphere',0,.62,.18,.12,.13,.12,[.97,.95,.9]);a('box',0,.76,.18,.03,.08,.12,[.88,.15,.12]);a('cone',0,.6,.32,.03,.08,.03,[.95,.7,.15],PI/2);a('sphere',0,.5,-.28,.1,.16,.06,[.9,.88,.82],-.4);for(const s of[-1,1]){a('cylinder',s*.07,.12,0,.02,.24,.02,[.95,.7,.15],Math.sin(run*16+id+s)*.5);a('sphere',s*.06,.66,.27,.02,.02,.02,[.05,.05,.05]);}pop();}
 // Grosser weisser Schweizer Schäferhund im Galopp.
 function dog(run=0){
  const g=Math.sin(run*15),white=[.97,.96,.93],shade=[.86,.84,.8];push(0,Math.abs(g)*.15,0,g*.06);
  a('sphere',0,.95,0,.36,.38,.8,white);a('sphere',0,1.02,.25,.38,.4,.42,white);
  a('sphere',0,1.32,.82,.26,.27,.32,white);a('sphere',0,1.2,1.12,.13,.12,.22,shade);a('sphere',0,1.22,1.32,.06,.05,.05,[.08,.06,.06]);
  a('box',0,1.06,1.2,.08,.03,.16,[.92,.4,.45],.3);   // Zunge
  for(const s of[-1,1]){a('cone',s*.14,1.62,.78,.08,.3,.06,white,-.1,0,s*.25);a('sphere',s*.11,1.4,1.04,.04,.04,.03,[.05,.05,.05]);}
  for(const [x,z,ph] of[[-.2,.5,0],[.2,.5,PI],[-.2,-.55,PI],[.2,-.55,0]]){push(x,.72,z,Math.sin(run*15+ph)*.75,0,0);a('cylinder',0,-.36,0,.08,.72,.08,white);a('sphere',0,-.72,.04,.09,.06,.12,shade);pop();}
  push(0,1.1,-.75,.9+Math.sin(run*18)*.3,0,Math.sin(run*9)*.3);a('cylinder',0,.3,0,.08,.6,.08,white);a('sphere',0,.6,0,.1,.14,.1,white);pop();
  pop();
 }

 // ---------- Sammelobjekte ----------
 const petals=[[1,.86,.2],[.98,.98,.95],[.35,.55,.95],[.62,.38,.9]];
 // Blume (ersetzt in Level 5 die Münze).
 function flower(time,id){push(0,1.05+Math.sin(time*3+id)*.08,0,0,time*1.8+id);const c=petals[Math.abs(id)%4];for(let k=0;k<6;k++){const t=k*PI/3;a('sphere',Math.cos(t)*.2,0,Math.sin(t)*.2,.14,.05,.14,c);}a('sphere',0,.02,0,.1,.07,.1,[1,.72,.15]);a('cylinder',0,-.35,0,.025,.6,.025,[.3,.55,.22]);pop();}
 function herb(time,id){a('ring',0,.06,0,.65,.65,.04,[.5,.9,.4,49],PI/2);push(0,1.1+Math.sin(time*2.6+id)*.1,0,0,time*1.5+id);for(let k=0;k<5;k++){const t=k*PI*2/5;a('cylinder',Math.cos(t)*.08,0,Math.sin(t)*.08,.025,.7,.025,[.3,.55,.22],Math.cos(t)*.3,0,Math.sin(t)*.3);a('sphere',Math.cos(t)*.18,.32,Math.sin(t)*.18,.09,.06,.09,[.45,.7,.3]);a('sphere',Math.cos(t)*.2,.4,Math.sin(t)*.2,.05,.05,.05,[.65,.4,.85]);}pop();}
 function cheese(time,id){a('ring',0,.06,0,.65,.65,.04,[1,.85,.35,49],PI/2);push(0,1.05+Math.sin(time*2.4+id)*.1,0,0,time*1.6+id);a('cylinder',0,0,0,.42,.3,.42,[.98,.82,.3]);a('cylinder',0,.16,0,.43,.02,.43,[.93,.7,.25]);for(let k=0;k<4;k++)a('sphere',Math.cos(k*1.6)*.42,(k%2?.06:-.05),Math.sin(k*1.6)*.42,.07,.06,.04,[.85,.65,.2]);pop();}
 function goldBell(time,id){a('ring',0,.06,0,.75,.75,.05,[1,.82,.25,49],PI/2,0,time);push(0,1.25+Math.sin(time*2.5+id)*.12,0,0,Math.sin(time*3+id)*.6,Math.sin(time*5+id)*.25);a('box',0,.42,0,.36,.08,.06,[.45,.25,.15]);a('cone',0,.05,0,.3,.6,.3,[1,.78,.2,9],PI);a('sphere',0,-.3,0,.07,.07,.07,[.8,.6,.15]);pop();}
 function edelweiss(time,id){a('ring',0,.06,0,.9,.9,.06,[1,.88,.4,49],PI/2,0,time*1.5);push(0,1.35+Math.sin(time*2+id)*.15,0,0,time*1.2+id);for(let k=0;k<8;k++){const t=k*PI/4;a('sphere',Math.cos(t)*.3,0,Math.sin(t)*.3,.2,.05,.09,[1,.95,.7,49],0,-t,0);}a('sphere',0,.03,0,.14,.08,.14,[1,.8,.2,49]);pop();for(let k=0;k<4;k++){const t=time*2.2+k*1.6;a('sphere',Math.cos(t)*.75,1.35+Math.sin(t*1.4)*.5,Math.sin(t)*.75,.05,.05,.05,[1,.9,.5,49]);}}

 // ---------- Wiesenkulisse ----------
 // Bunte Wildblumen (gelb, weiss, blau, violett) mit leichtem Wiegen im Wind.
 function flowerPatch(time,k,n=7){for(let j=0;j<n;j++){const x=Math.sin(k*1.7+j*2.3)*1.3,z=Math.cos(k*.9+j*1.9)*1.1,h=.18+(j%3)*.08,sway=Math.sin(time*1.6+j+k)*.06;a('cylinder',x,h/2,z,.015,h,.015,[.32,.55,.22],0,0,sway);a('sphere',x+sway*h,h,z,.08,.05,.08,petals[(j+k)%4]);}}
 // Morgentau: kleine glitzernde Tropfen im Gras.
 function dew(time,k){for(let j=0;j<5;j++){const tw=.5+.5*Math.sin(time*4+j*1.7+k);a('sphere',Math.sin(k+j*2.1)*1.4,.12,Math.cos(k*1.3+j)*1.1,.03*tw+.01,.03*tw+.01,.03*tw+.01,[1,1,1,49]);}}
 // Zaun entlang der Wiese (ein Feld von 8 Einheiten).
 function sideFence(){a('box',0,.55,-4,.12,1.1,.12,woodDark);for(const y of[.4,.8])a('box',0,y,0,.07,.09,8.1,wood);}
 // Bach durch die Wiese mit Steinen.
 function brook(time,len=8){a('box',0,-.08,0,2.2,.06,len,[.2,.48,.55,26]);for(let k=0;k<3;k++){const ph=(time*.9+k*.33)%1;a('box',(k-1)*.5,-.03,-len/2+ph*len,.08,.02,.6,[.85,.95,1,49]);}for(const [x,z] of[[-1.2,-2],[1.25,1.5],[-1.1,3]])a('rock',x,0,z,.4,.18,.35,[.55,.57,.55],0,x+z);}
 // Kleine Holzbrücke über einen Bach (quer zum Weg, rein dekorativ).
 function footbridge(time){a('box',0,-.1,0,30,.05,3,[.2,.48,.55,26]);for(let k=-2;k<=2;k++)a('box',0,.08,k*.55,8.6,.12,.5,k%2?wood:[.55,.4,.24]);for(const x of[-4.4,4.4]){a('box',x,.7,0,.12,1.1,2.8,woodDark);a('box',x,1.25,0,.08,.08,2.8,wood);}for(let k=0;k<4;k++){const ph=(time*1.1+k*.25)%1;a('box',-14+ph*28,-.05,(k%2?.6:-.6),.8,.02,.08,[.85,.95,1,49]);}}
 return{fence,gate,hayBale,haystack,trough,ditch,woodstack,cow,goat,chicken,dog,flower,herb,cheese,goldBell,edelweiss,flowerPatch,dew,sideFence,brook,footbridge};
}
