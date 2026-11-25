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

 // ---------- Tiere (Kopf zeigt in +z) ----------
 // Bein mit Ober- und Unterschenkel; swing = Schwung im Hüftgelenk, das Knie knickt beim Vorschwingen ein.
 function leg(x,y,z,len,th,col,swing,hoofCol,front=true){
  push(x,y,z,swing,0,0);a('cylinder',0,-len*.25,0,th,len*.5,th*.95,col);
  push(0,-len*.5,0,(front?1:-1)*Math.max(0,-swing)*1.1+.05,0,0);a('sphere',0,0,0,th*1.05,th*1.05,th*1.05,col);a('cylinder',0,-len*.24,0,th*.8,len*.48,th*.75,col);a('box',0,-len*.5,front?.03:-.01,th*1.7,th*.9,th*2.1,hoofCol);pop();
  pop();
 }
 // Gang: Diagonalpaare (vorne links + hinten rechts) schwingen gemeinsam.
 const gait=(t,amp,ph)=>Math.sin(t+ph)*amp;

 // Schweizer Fleckvieh-Kuh mit Glocke; walk = Laufphase (0 = steht ruhig).
 function cow(walk=0,id=0,moving=true){
  const white=[.95,.93,.88],red=[.62,.32,.17],pink=[.9,.68,.62],hoof=[.18,.15,.12],t=walk*4.2,amp=moving?.38:.03,nod=moving?Math.sin(t*2)*.05:Math.sin(walk*.8+id)*.08,swish=Math.sin(walk*2.2+id);
  // Rumpf: Brust, Bauch, Becken, Rücken
  a('sphere',0,1.38,.45,.62,.66,.62,white);a('sphere',0,1.3,-.05,.66,.62,.8,white);a('sphere',0,1.38,-.62,.6,.62,.55,red);
  a('sphere',0,1.68,0,.5,.22,1.05,white);a('sphere',.36,1.45,-.1,.32,.4,.5,red);a('sphere',-.3,1.5,.4,.3,.38,.36,red);a('sphere',.2,1.62,.55,.22,.2,.3,red);
  a('sphere',0,.92,-.45,.24,.16,.26,pink);for(const s of[-1,1])a('cylinder',s*.08,.78,-.45,.035,.12,.035,pink);    // Euter
  a('sphere',0,1.05,.65,.26,.3,.32,white);                                                                            // Wamme
  // Hals und Kopf
  push(0,1.55,.95,-.35+nod,0,0);a('cylinder',0,0,.15,.3,.62,.3,white,1.2);
  push(0,.12,.45,.55,0,0);a('sphere',0,0,0,.26,.3,.36,red);a('sphere',0,.02,.2,.2,.26,.3,white);a('sphere',0,-.12,.42,.19,.17,.15,pink);
   for(const s of[-1,1]){a('sphere',s*.07,-.12,.55,.035,.03,.02,[.3,.18,.16]);a('sphere',s*.17,.1,.22,.045,.05,.04,[.08,.06,.05]);a('sphere',s*.3,.16,.02,.16,.07,.09,red,0,0,s*.3);
    push(s*.16,.27,-.02,0,0,s*.9);a('cylinder',0,.08,0,.035,.16,.035,[.94,.9,.8]);a('cone',0,.2,.02,.03,.12,.03,[.94,.9,.8],.5);pop();}
  pop();pop();
  // Glocke am Lederband
  a('ring',0,1.28+nod*.5,1.02,.2,.2,.05,[.35,.22,.12],PI/2.6);a('cone',0,1.02+nod*.5,1.12,.15,.26,.15,[.92,.72,.2],PI);
  // Beine (Diagonalgang)
  leg(-.3,1.08,.62,.95,.11,white,gait(t,amp,0),hoof,true);leg(.3,1.08,.62,.95,.11,white,gait(t,amp,PI),hoof,true);
  leg(-.3,1.12,-.68,.98,.12,white,gait(t,amp,PI),hoof,false);leg(.3,1.12,-.68,.98,.12,white,gait(t,amp,0),hoof,false);
  // Schwanz mit Quaste
  push(0,1.62,-1.05,.35+Math.abs(swish)*.2,0,swish*.4);a('cylinder',0,-.4,0,.03,.8,.03,white);a('sphere',0,-.84,0,.07,.14,.07,[.45,.3,.2]);pop();
 }
 // Gemse-farbene Gebirgsziege mit gebogenen Hörnern und Bart; jump 0..1 Sprungphase.
 function goat(run=0,id=0,jump=0){
  const brown=[.6,.42,.26],dark=[.22,.16,.12],light=[.88,.8,.68],hoof=[.12,.1,.08],t=run*9+id,air=jump>0&&jump<1,hop=air?Math.sin(jump*PI)*.9:0,amp=air?.1:.45;
  push(0,hop,0,air?(jump-.5)*.5:0,0,0);
  a('sphere',0,.95,.22,.3,.34,.36,brown);a('sphere',0,.9,-.15,.29,.3,.45,brown);a('sphere',0,.93,-.48,.27,.29,.3,brown);a('box',0,1.18,-.05,.06,.05,.9,dark);   // Aalstrich
  a('sphere',0,.75,0,.22,.15,.45,light);
  push(0,1.08,.45,-.6,0,0);a('cylinder',0,.18,0,.13,.4,.13,brown);pop();
  push(0,1.38,.62,.2,0,0);a('sphere',0,0,0,.15,.17,.21,brown);a('sphere',0,-.06,.18,.1,.1,.14,brown);a('box',0,.02,.08,.07,.18,.2,dark);a('cone',0,-.2,.16,.04,.16,.04,dark,PI);   // Kopf, Gesichtsstreifen, Bart
   for(const s of[-1,1]){a('sphere',s*.1,.06,.1,.035,.035,.03,[.05,.04,.03]);a('sphere',s*.17,.04,-.02,.1,.04,.05,brown,0,0,s*.4);for(let k=0;k<4;k++){const u=k/3;a('sphere',s*(.06+u*.05),.17+Math.sin(u*2)*.16,-.02-u*.2,.035-u*.008,.05,.035-u*.008,[.3,.26,.2]);}}
  pop();
  leg(-.15,.72,.32,.68,.055,brown,gait(t,amp,0)+(air?-.6:0),hoof,true);leg(.15,.72,.32,.68,.055,brown,gait(t,amp,PI)+(air?-.6:0),hoof,true);
  leg(-.15,.74,-.45,.7,.06,brown,gait(t,amp,PI)+(air?.6:0),hoof,false);leg(.15,.74,-.45,.7,.06,brown,gait(t,amp,0)+(air?.6:0),hoof,false);
  push(0,1.05,-.68,-.8,0,0);a('cylinder',0,.08,0,.04,.16,.03,dark);pop();
  pop();
 }
 // Huhn mit Kamm, Kehllappen, Flügeln und Schwanzfedern.
 function chicken(run=0,id=0){
  const t=run*16+id,bob=Math.abs(Math.sin(t))*.06,cream=[.96,.92,.84],tan=[.85,.62,.36],red=[.88,.14,.12],yel=[.95,.72,.2];
  push(0,bob,0,Math.sin(t)*.06,0,0);
  a('sphere',0,.4,0,.21,.2,.27,cream);a('sphere',0,.36,.1,.17,.18,.18,cream);
  for(const s of[-1,1])a('sphere',s*.17,.43,-.02,.06,.13,.2,tan,.2);
  for(let k=0;k<4;k++)a('sphere',(k-1.5)*.04,.58-k*.03,-.26-k*.02,.04,.14,.06,k%2?[.2,.18,.15]:tan,-.6+k*.1);
  push(0,.58,.17,-.15+Math.sin(t*.5)*.25,0,0);a('sphere',0,0,0,.11,.12,.12,cream);a('box',0,.11,.02,.025,.07,.13,red);a('sphere',0,-.08,.1,.03,.05,.025,red);a('cone',0,-.01,.14,.025,.08,.025,yel,PI/2);for(const s of[-1,1])a('sphere',s*.07,.03,.06,.022,.022,.02,[.05,.05,.05]);pop();
  for(const s of[-1,1]){push(s*.07,.24,0,Math.sin(t+(s>0?PI:0))*.7,0,0);a('cylinder',0,-.1,0,.018,.22,.018,yel);a('box',0,-.21,.04,.07,.012,.09,yel);pop();}
  pop();
 }
 // Grosser weisser Schweizer Schäferhund im Galopp (tiefe Brust, schmale Taille, Stehohren, buschige Rute).
 function dog(run=0){
  const t=run*15,g=Math.sin(t),white=[.97,.96,.93],shade=[.86,.84,.79],nose=[.08,.06,.06],paw=[.84,.8,.74];
  push(0,Math.abs(g)*.12,0,g*.05,0,0);
  a('sphere',0,1.0,.35,.34,.42,.4,white);a('sphere',0,.98,-.05,.27,.3,.48,white);a('sphere',0,.98,-.45,.29,.31,.3,white);a('sphere',0,.78,.2,.22,.16,.36,shade);
  push(0,1.22,.55,-.7,0,0);a('cylinder',0,.18,0,.2,.42,.2,white);pop();
  push(0,1.45,.78,.15+g*.04,0,0);a('sphere',0,0,0,.2,.21,.24,white);a('sphere',0,-.05,.24,.1,.1,.2,white);a('sphere',0,-.04,.44,.055,.05,.05,nose);
   a('box',0,-.15,.32,.07,.025,.16,[.92,.42,.46],.4);for(const s of[-1,1]){a('sphere',s*.1,.06,.16,.035,.035,.03,[.1,.07,.05]);push(s*.11,.2,-.02,-.1,0,s*.18);a('cone',0,.1,0,.075,.24,.04,white);a('cone',0,.09,.012,.04,.16,.015,[.95,.82,.8]);pop();}pop();
  leg(-.16,.82,.42,.78,.07,white,Math.sin(t)*.8,paw,true);leg(.16,.82,.42,.78,.07,white,Math.sin(t+.5)*.8,paw,true);
  leg(-.16,.86,-.5,.82,.08,white,Math.sin(t+PI)*.8,paw,false);leg(.16,.86,-.5,.82,.08,white,Math.sin(t+PI+.5)*.8,paw,false);
  push(0,1.05,-.72,-.6+Math.sin(t*1.2)*.25,0,Math.sin(t*.6)*.25);for(let k=0;k<4;k++)a('sphere',0,-.12-k*.15,-.05-k*.03,.09+k*.012,.12,.09+k*.012,white);pop();
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
 function flowerPatch(time,k,n=7){for(let j=0;j<n;j++){const x=Math.sin(k*1.7+j*2.3)*1.3,z=Math.cos(k*.9+j*1.9)*1.1,h=.18+(j%3)*.08,sway=Math.sin(time*1.6+j+k)*.06;a('cylinder',x,h/2,z,.015,h,.015,[.32,.55,.22],0,0,sway);a('sphere',x+sway*h,h,z,.08,.05,.08,petals[(((j+k)%4)+4)%4]);}}/* k kann negativ sein → Index immer 0..3 */
 // Morgentau: kleine glitzernde Tropfen im Gras.
 function dew(time,k){for(let j=0;j<5;j++){const tw=.5+.5*Math.sin(time*4+j*1.7+k);a('sphere',Math.sin(k+j*2.1)*1.4,.12,Math.cos(k*1.3+j)*1.1,.03*tw+.01,.03*tw+.01,.03*tw+.01,[1,1,1,49]);}}
 // Zaun entlang der Wiese (ein Feld von 8 Einheiten).
 function sideFence(){a('box',0,.55,-4,.12,1.1,.12,woodDark);for(const y of[.4,.8])a('box',0,y,0,.07,.09,8.1,wood);}
 // Bach durch die Wiese mit Steinen.
 function brook(time,len=8){a('box',0,-.08,0,2.2,.06,len,[.2,.48,.55,26]);for(let k=0;k<3;k++){const ph=(time*.9+k*.33)%1;a('box',(k-1)*.5,-.03,-len/2+ph*len,.08,.02,.6,[.85,.95,1,49]);}for(const [x,z] of[[-1.2,-2],[1.25,1.5],[-1.1,3]])a('rock',x,0,z,.4,.18,.35,[.55,.57,.55],0,x+z);}
 // Kleine Holzbrücke über einen Bach (quer zum Weg, rein dekorativ).
 function footbridge(time){a('box',0,-.1,0,30,.05,3,[.2,.48,.55,26]);for(let k=-2;k<=2;k++)a('box',0,.08,k*.55,8.6,.12,.5,k%2?wood:[.55,.4,.24]);for(const x of[-4.4,4.4]){a('box',x,.7,0,.12,1.1,2.8,woodDark);a('box',x,1.25,0,.08,.08,2.8,wood);}for(let k=0;k<4;k++){const ph=(time*1.1+k*.25)%1;a('box',-14+ph*28,-.05,(k%2?.6:-.6),.8,.02,.08,[.85,.95,1,49]);}}
 // Niedriges Zaunstück für eine Spur (drüberspringen oder durch die Lücke daneben).
 function fenceLow(k=0){const lean=((k%3)-1)*.04;for(const x of[-1.15,1.15])a('cylinder',x,.6,0,.09,1.2,.09,woodDark,0,0,lean);for(const y of[.5,.95])a('box',0,y,0,2.5,.11,.09,wood,0,0,lean*.5);a('box',0,.72,.05,2.3,.08,.06,[.58,.42,.26],0,0,-.32);}
 // Hoher Zaun für eine Spur aus senkrechten Ästen (zu hoch zum Springen – Durchgang suchen).
 function fenceTall(k=0){for(const x of[-1.2,1.2])a('cylinder',x,1.25,0,.12,2.5,.12,woodDark,0,0,((k+x*3)%3)*.02);for(let j=0;j<7;j++){const x=-.95+j*.32,h=1.85+((j*7+k)%4)*.12;a('cylinder',x,h/2+.05,0,.055,h,.055,j%2?wood:[.62,.5,.36],0,0,((j+k)%3-1)*.05);}for(const y of[.55,1.55])a('box',0,y,.08,2.55,.1,.08,woodDark);a('box',0,1.05,.1,2.4,.08,.06,wood,0,0,.55);}
 // Biene: gelb-schwarz gestreift mit flatternden Flügeln (Kopf in +z).
 function bee(time,id=0){const f=Math.sin(time*70+id)*.7;a('sphere',0,0,0,.13,.12,.18,[1,.78,.12]);for(const z of[-.06,.05])a('sphere',0,0,z,.135,.125,.035,[.08,.07,.06]);a('sphere',0,.01,.17,.08,.08,.08,[.1,.09,.08]);a('cone',0,0,-.2,.03,.08,.03,[.1,.09,.08],-PI/2);for(const s of[-1,1])a('box',s*.12,.1,0,.2,.01,.11,[.92,.97,1,49],0,0,s*f);}
 // Baum mit hängendem Bienennest an einem Ast und kleinem Bienenhäuschen am Stamm.
 // Das Nest-Loch liegt bei (1.15, 2.55, 0) – dort fliegen die Bienen heraus.
 function nestTree(time,k=0){
  const leaf=[[.24,.5,.2],[.3,.56,.22],[.2,.44,.17]][((k%3)+3)%3];
  a('cylinder',0,1.6,0,.26,3.2,.26,[.42,.3,.2]);
  for(const [x,y,z,r] of[[0,3.6,0,1.6],[-.8,3.1,.4,1.1],[.7,3.3,-.5,1.2],[.2,4.4,.2,1.1]])a('sphere',x,y,z,r,r*.85,r,leaf);
  a('cylinder',.55,2.95,0,.07,1.2,.07,[.42,.3,.2],0,0,-1.1);              // Ast
  a('cylinder',1.15,2.98,0,.015,.2,.015,[.3,.22,.14]);                     // Aufhängung
  for(let j=0;j<4;j++){const y=2.85-j*.16,r=.34-Math.abs(j-1.4)*.07;a('sphere',1.15,y,0,r,.11,r,j%2?[.8,.62,.32]:[.7,.52,.26]);}
  a('sphere',1.15,2.55,.27,.08,.08,.04,[.12,.08,.05]);                     // Flugloch
  push(-.75,0,.35,0,.4);a('box',0,.42,0,.5,.5,.45,[.72,.5,.26]);a('box',0,.74,0,.62,.08,.56,[.55,.25,.15],0,0,.35);a('box',0,.74,0,.62,.08,.56,[.55,.25,.15],0,0,-.35);a('box',0,.3,.23,.22,.04,.02,[.15,.1,.06]);pop();
  for(let j=0;j<3;j++){const t=time*(1.6+j*.4)+j*2+k;push(1.15+Math.sin(t)*.55,2.55+Math.sin(t*1.7)*.3,Math.cos(t)*.55,0,t*2,0,.7);bee(time,j+k);pop();}
 }
 // Honigtopf (Sammelobjekt) mit Holzdeckel, tropfendem Honig und ein paar Bienen.
 function honeyPot(time,id=0){const y=.35+Math.sin(time*3+id)*.06;push(0,y,0,0,time*.8+id);
  a('sphere',0,.32,0,.36,.34,.36,[.86,.55,.18]);a('cylinder',0,.62,0,.24,.1,.24,[.86,.55,.18]);a('cylinder',0,.7,0,.27,.06,.27,[.55,.36,.2]);
  a('box',0,.3,.35,.34,.18,.02,[.98,.92,.7]);a('box',0,.3,.36,.26,.05,.01,[.55,.3,.1]);
  for(const [x,z,h] of[[.2,.18,.22],[-.15,.25,.3],[.05,-.3,.18]])a('sphere',x,.62-h/2,z,.05,h/2,.05,[1,.72,.12,26]);pop();
  a('ring',0,.05,0,.7,.7,.04,[1,.78,.2,49],PI/2);
  for(let j=0;j<2;j++){const t=time*(2+j*.5)+j*3+id;push(Math.sin(t)*.7,1.1+Math.sin(t*1.8)*.25,Math.cos(t)*.7,0,t*2,0,.7);bee(time,j+id);pop();}}
 return{honeyPot,nestTree,fenceLow,fenceTall,bee,fence,gate,hayBale,haystack,trough,ditch,woodstack,cow,goat,chicken,dog,flower,herb,cheese,goldBell,edelweiss,flowerPatch,dew,sideFence,brook,footbridge};
}
