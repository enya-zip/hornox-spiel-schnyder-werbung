// Level 6 «Schwarzsee»: Frösche mit Schleuderzunge, Fliegenschwärme, treibende Baumstämme, Trittsteine
// und Seerosen – farbenfroh und verspielt, aus einfachen Formen gebaut.
export function createBlackLake(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const green=[.3,.78,.25],greenDark=[.16,.5,.16],belly=[.95,.92,.55],pink=[1,.42,.55],water=[.1,.36,.5,26],foam=[.85,.95,1,49];

 // Frosch (Maul zeigt in +z). crouch 0..1 = duckt sich zum Sprung/Zungenschuss, throat = aufgeblähter Kehlsack,
 // tongue = Zungenlänge in Metern (0 = im Maul), flyOnTip = gefangene Fliege an der Zungenspitze.
 function frog(time,id=0,crouch=0,throat=0,tongue=0,flyOnTip=false){
  const breathe=.04*Math.sin(time*3+id),sq=1-crouch*.18;
  push(0,0,0,0,0,0,1);
  a('sphere',0,.42*sq,0,.55,.4*sq+breathe,.62,green);a('sphere',0,.32*sq,.12,.46,.28*sq,.5,belly);
  for(const [x,z] of[[.3,-.15],[-.25,.2],[.05,-.35]])a('sphere',x,.68*sq,z,.09,.04,.1,greenDark);
  // Kehlsack pulsiert vor dem Zungenschuss
  a('sphere',0,.3*sq,.48,.24+throat*.18,.18+throat*.16,.2+throat*.12,[1,.95,.65]);
  // Glubschaugen
  for(const s of[-1,1]){a('sphere',s*.24,.8*sq,.3,.17,.17,.17,green);a('sphere',s*.25,.84*sq,.38,.13,.13,.1,[1,1,1]);a('sphere',s*.25,.85*sq,.46,.06,.07,.04,[.05,.05,.05]);}
  a('box',0,.5*sq,.6,.5,.03,.04,greenDark);   // Maul
  // Beine: hinten gefaltet, vorne abgestützt
  for(const s of[-1,1]){a('sphere',s*.48,.22,-.25,.22,.17,.36,green);a('sphere',s*.6,.06,.1,.12,.05,.28,greenDark);a('cylinder',s*.3,.15,.42,.06,.3,.06,green,.3);a('sphere',s*.32,.03,.55,.1,.03,.12,greenDark);}
  // Zunge
  if(tongue>.05){push(0,.48*sq,.6,0,0,0);a('cylinder',0,0,tongue/2,.07,tongue,.07,pink,PI/2);a('sphere',0,0,tongue,.16,.13,.16,[1,.3,.45]);if(flyOnTip){a('sphere',0,.08,tongue+.05,.06,.05,.08,[.1,.1,.12]);}pop();}
  pop();
 }
 // Einzelne Fliege mit flatternden Flügeln.
 function fly(time,id){const f=Math.sin(time*60+id)*.6;a('sphere',0,0,0,.07,.06,.11,[.12,.12,.14]);a('sphere',0,.02,.1,.05,.05,.05,[.6,.1,.1]);for(const s of[-1,1])a('box',s*.06,.03,0,.09,.005,.05,[.85,.92,1,49],0,0,s*f);}
 // Schwarm von Fliegen, die unregelmässig herumschwirren (um den lokalen Ursprung).
 function swarm(time,k,n=6,spread=1.2){for(let j=0;j<n;j++){const t=time*(1.3+j*.17)+k*2.1+j*1.7;push(Math.sin(t*1.7+j)*spread+Math.sin(t*4.3)*.15,1.1+Math.sin(t*2.3+j*.9)*.45,Math.cos(t*1.3+j*2)*spread*.8,0,t*3,0);fly(time,j+k);pop();}}
 // Treibender Baumstamm quer über den Weg (drüberspringen), mit Wellenringen.
 function floatLog(time,id){const bob=Math.sin(time*2.2+id)*.06,roll=Math.sin(time*1.4+id)*.08;a('box',0,.02,0,8.8,.04,1.6,water);push(0,.32+bob,0,roll,0,0);a('cylinder',0,0,0,.36,8.4,.36,[.48,.33,.2],0,0,PI/2);for(const x of[-4.2,4.2])a('cylinder',x,0,0,.33,.04,.33,[.78,.6,.4],0,0,PI/2);a('sphere',-1.6,.3,0,.3,.15,.25,[.32,.55,.22]);a('cylinder',1.4,.28,.1,.04,.5,.04,[.45,.3,.18],.5,0,.6);pop();for(const x of[-3,0,3])a('ring',x,.05,.85,.45+Math.abs(Math.sin(time*2+x))*.25,.2,.02,foam,PI/2);}
 // Flacher Trittstein mit Moos.
 function stone(k){a('cylinder',0,.08,0,1.35,.24,1.05,[.55,.58,.6]);a('sphere',(k%3-1)*.4,.2,(k%2?.2:-.2),.5,.08,.35,[.36,.6,.26]);}
 // Seerose mit Blüte.
 function lily(time,k){a('cylinder',0,.03,0,.7,.02,.7,[.25,.6,.25]);if(k%2===0){for(let j=0;j<6;j++){const t=j*PI/3;a('sphere',Math.cos(t)*.14,.1,Math.sin(t)*.14,.1,.05,.06,k%4?[1,.75,.85]:[1,1,.96],0,-t,0);}a('sphere',0,.12,0,.06,.05,.06,[1,.85,.2]);}}
 // Ufer-Schilf.
 function reeds(k){for(let j=0;j<5;j++){const h=.9+((k+j)%3)*.3;a('cylinder',(j-2)*.14,h/2,(j%2)*.15,.02,h,.02,[.35,.55,.24]);if(j%2===0)a('cylinder',(j-2)*.14,h,(j%2)*.15,.05,.22,.05,[.45,.28,.14]);}}
 // Laufstrecke auf dem Wasser: Floss aus Brettern mit Seilbindung (quer über alle drei Spuren).
 function raft(time,k){const bob=Math.sin(time*1.8+k)*.04;push(0,bob,0,Math.sin(time*1.3+k)*.015,0,0);for(let j=0;j<3;j++)a('box',0,.1,(j-1)*.74,8.4,.16,.68,[[.62,.44,.26],[.55,.38,.22],[.66,.48,.3]][(((k+j)%3)+3)%3]);for(const x of[-3.6,0,3.6])a('box',x,.2,0,.12,.04,2.3,[.85,.78,.6]);pop();}
 // Bündel aus Baumstämmen (längs zur Laufrichtung), auf dem man läuft.
 function logRaft(time,k){const bob=Math.sin(time*1.6+k)*.05;push(0,bob,0);for(const x of[-3.4,-2.2,-1,.2,1.4,2.6,3.6])a('cylinder',x,.14,0,.34,2.35,.34,[[.5,.34,.2],[.45,.3,.18]][(Math.round(x*5)+k)&1],PI/2);for(const z of[-.8,.8])a('box',0,.42,z,8.2,.05,.1,[.85,.78,.6]);pop();}
 // Runde Holzplattform auf Schwimmern.
 function platform(time,k){const bob=Math.sin(time*2+k)*.05;push(0,bob,0);a('cylinder',0,.08,0,4.4,.2,1.3,[.58,.42,.25]);for(let j=-3;j<=3;j++)a('box',j*1.2,.19,0,.05,.02,2.4,[.42,.3,.18]);for(const x of[-3.8,3.8])a('cylinder',x,-.05,0,.35,.3,.35,[.9,.3,.25]);pop();}
 // Luftblasen und Ringe, wo ein Frosch unter Wasser lauert.
 function bubbles(time,k){for(let j=0;j<4;j++){const ph=(time*1.5+j*.25+k)%1;a('sphere',Math.sin(j*2.1+k)*.3,ph*.4,Math.cos(j*1.7)*.3,.06+ph*.04,.06+ph*.04,.06+ph*.04,[.85,.95,1,49]);}a('ring',0,.03,0,.5+((time*.8+k)%1)*.6,.5+((time*.8+k)%1)*.6,.02,[.85,.95,1,49],PI/2);}
 // Spritzer beim Auftauchen.
 function splash(u){if(u<=0||u>=1)return;for(let j=0;j<8;j++){const t=j*PI/4,r=.4+u*1.2,y=Math.sin(u*PI)*1.1;a('sphere',Math.cos(t)*r,y*(.6+(j%3)*.25),Math.sin(t)*r,.12*(1-u)+.03,.16*(1-u)+.03,.12*(1-u)+.03,[.88,.96,1,49]);}a('ring',0,.04,0,.6+u*1.6,.6+u*1.6,.03,[.9,.97,1,49],PI/2);}
 // ---------- Sumpfgebiet (neu) ----------
 // Treibende Holzbalken für eine Spur (2,4 m breit): mehrere Stämme, leicht verdreht, mit Wasserkränzen.
 function beam(time,k){const bob=Math.sin(time*1.7+k)*.04;push(0,bob,0);for(let j=0;j<3;j++){const z=(j-1)*.62,tw=((k*7+j*3)%5-2)*.06,len=2.2+((k+j)%3)*.18,c=[[.62,.48,.32],[.55,.42,.28],[.68,.55,.38]][((k+j)%3+3)%3];
   a('cylinder',((j+k)%3-1)*.08,.12,z,.24,len,.24,c,0,tw,PI/2);for(const x of[-len/2,len/2])a('cylinder',x+((j+k)%3-1)*.08,.12,z,.21,.03,.21,[.82,.7,.5],0,tw,PI/2);}
  pop();a('ring',0,.03,0,1.15,.75,.012,[.55,.7,.75,26],PI/2);}
 // Versunkene Steinplatte für eine Spur: flacher, nasser Fels knapp über dem Wasser.
 function slab(k){const r=((k*13)%5)*.04;a('cylinder',0,.06,0,1.05+r,.16,.85+r*.6,[.62,.64,.63],0,k*.7);a('cylinder',.15,.15,-.1,.7,.04,.55,[.74,.76,.75],0,k);a('sphere',-.4,.1,.3,.25,.06,.18,[.5,.53,.52]);a('ring',0,.03,0,1.2,.98,.012,[.55,.7,.75,26],PI/2);}
 // Goldenes Schilf (Sumpf) – dichter Büschel mit wolligen Rispen.
 function reedBed(time,k,n=9){a('sphere',0,.25,0,1.3,.45,.9,[.6,.48,.26]);a('sphere',.5,.4,.2,.8,.5,.6,[.7,.56,.3]);n=Math.round(n*1.8);for(let j=0;j<n;j++){const x=((j*37+k*11)%19)/19*2.4-1.2,z=((j*53+k*7)%17)/17*1.6-.8,h=1.3+((j+k)%4)*.22,sw=Math.sin(time*1.3+j+k)*.06,c=(j+k)%3?[.78,.6,.32]:[.66,.5,.26];
   a('cylinder',x,h/2,z,.025,h,.025,c,sw,0,sw*.6);a('sphere',x+sw*h,h+.08,z,.07,.2,.07,[.86,.74,.5],sw);}}
 // Schlammpfütze für eine Spur: glänzend dunkelbraun mit Blasen.
 function mudPuddle(time,id){push(0,.14,0);a('cylinder',0,.0,0,1.2,.04,1,[.47,.35,.22]);a('cylinder',0,.03,0,1.05,.04,.86,[.17,.11,.06]);a('cylinder',0,.06,0,.8,.01,.62,[.42,.34,.24,26]);
  for(let j=0;j<3;j++){const ph=(time*.9+j*.33+id*.17)%1;a('sphere',Math.sin(j*2.3+id)*.45,.07+ph*.08,Math.cos(j*1.7+id)*.35,.05+ph*.07,.04+ph*.05,.05+ph*.07,[.4,.3,.18]);}
  a('ring',0,.08,0,.5+((time*.6+id)%1)*.4,.42+((time*.6+id)%1)*.3,.015,[.5,.4,.26],PI/2);pop();}
 return{beam,slab,reedBed,mudPuddle,frog,fly,swarm,floatLog,stone,lily,reeds,raft,logRaft,platform,bubbles,splash};
}
