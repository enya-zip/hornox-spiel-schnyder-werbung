// Level 7 «Hörnliweg» (Schwarzsee → Hörnlihütte): realistische Hindernisse und Kulisse am Bergweg.
// Natürliche Farben: grauer Gneis/Granit, Geröll, verwittertes Holz, verzinktes Metall, Altschnee.
// Lokales System: Laufrichtung +z, eine Spur ist 2,5 m breit.
export function createHornli(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const rock=[.5,.49,.47],rockDark=[.38,.37,.36],rockLight=[.62,.6,.57],lichen=[.55,.56,.42],wood=[.52,.4,.28],woodOld=[.45,.38,.3],metal=[.6,.63,.66],metalDark=[.36,.38,.4],snow=[.92,.94,.97],grass=[.5,.56,.32];

 // ---------- Hindernisse ----------
 // Kleiner Geröllhaufen (drüberspringen).
 function scree(k=0){for(let j=0;j<9;j++){const x=((j*37+k*13)%11)/11*1.8-.9,z=((j*53+k*7)%9)/9*1.2-.6,s=.18+((j+k)%4)*.07;a('rock',x,s*.5,z,s*1.4,s,s*1.2,j%3?rock:rockDark,0,j+k);}a('rock',0,.25,0,.7,.45,.6,rockLight,0,k);}
 // Grösserer Felsblock (drüberspringen).
 function rockBig(k=0){a('rock',0,.45,0,1.25,.9,1.05,rock,0,k*.7);a('rock',.35,.75,.1,.6,.4,.55,rockLight,0,k);a('sphere',-.3,.92,-.15,.35,.05,.3,lichen);}
 // Holzstück quer über den Weg (drüberspringen).
 function woodPiece(k=0){a('cylinder',0,.18,0,.17,7.6,.17,woodOld,0,((k%3)-1)*.06,PI/2);for(const x of[-3.8,3.8])a('cylinder',x,.18,0,.15,.03,.15,[.7,.6,.45],0,0,PI/2);}
 // Niedrige Holzabsperrung für eine Spur (drüberspringen).
 function woodBarrier(){for(const x of[-1,1])a('box',x,.42,0,.12,.84,.12,woodOld);a('box',0,.62,0,2.3,.14,.08,wood);a('box',0,.32,0,2.3,.12,.08,wood);for(const x of[-.6,0,.6])a('box',x,.62,.05,.25,.1,.01,[.85,.25,.2]);}
 // Holzgeländer quer über den ganzen Weg (drüberspringen).
 function woodRail(){for(const x of[-3.9,-1.3,1.3,3.9])a('cylinder',x,.5,0,.09,1,.09,woodOld);a('cylinder',0,.92,0,.07,8,.07,wood,0,0,PI/2);a('cylinder',0,.52,0,.06,8,.06,wood,0,0,PI/2);}
 // Grosse Felsformation, die eine Spur blockiert (Spur wechseln).
 function rockFace(k=0){a('rock',0,1.3,0,1.45,2.6,1.4,rockDark,0,k);a('rock',.4,2.4,.2,1,1.3,1,rock,0,k+1);a('rock',-.5,.6,.5,.8,.7,.7,rockLight,0,k+2);a('sphere',.2,2.95,0,.6,.06,.5,lichen);}
 // Felsvorsprung, der von der Seite in eine Spur ragt (Spur wechseln).
 function ledge(k=0,side=1){push(side*.6,0,0);a('rock',0,1.1,0,1.9,2.2,1.2,rock,0,k);a('rock',-side*.6,1.6,0,1.2,1,1,rockDark,0,k+2);pop();}
 // Schweizer Wanderwegweiser (gelb) – blockiert eine Spur.
 function signpost(k=0){a('cylinder',0,1.1,0,.07,2.2,.07,[.6,.6,.62]);for(const [y,dir] of[[1.95,1],[1.65,-1],[1.35,1]]){push(dir*.35,y,0);a('box',0,0,0,.95,.22,.04,[.97,.8,.1]);a('box',dir*.55,0,0,.18,.18,.04,[.97,.8,.1],0,0,PI/4);a('box',0,0,.025,.7,.05,.005,[.15,.15,.12]);pop();}a('rock',0,.12,0,.45,.25,.4,rockDark,0,k);}
 // Quer verlaufender Holzbalken (ducken).
 function beamLow(){for(const x of[-4,4])a('cylinder',x,.95,0,.13,1.9,.13,woodOld);a('cylinder',0,1.48,0,.17,8.4,.17,wood,0,0,PI/2);}
 // Niedriger Felsüberhang (ducken): Felsdach über den Weg, auf einer Seite in der Wand verankert.
 function overhang(k=0){a('rock',-4.4,1.1,0,.9,2.2,.9,rockDark,0,k);a('rock',4.4,1,0,.8,2,.8,rock,0,k+1);a('rock',0,1.78,0,8.6,.3,.8,rock,0,k*.3);a('rock',-1,1.66,.05,1.6,.16,.6,rockDark,0,k);}
 // Kleines Schneefeld in einer Spur (rutschig).
 function snowPatch(k=0){a('cylinder',0,.04,0,1.2,.08,1.6,snow,0,k);a('cylinder',.3,.07,.2,.7,.06,.9,[.98,.99,1],0,k);a('sphere',-.5,.1,-.6,.3,.08,.25,[.85,.88,.92]);}

 // ---------- Kulisse ----------
 // Felswand am Wegrand (Gneis mit Schichtung und Flechten).
 function cliff(k=0,h=9){const layers=4;for(let j=0;j<layers;j++){const y=j*h/layers,w=3.2-j*.35+((k+j)%3)*.3;a('rock',((k+j)%3-1)*.4,y+h/layers/2,0,w,h/layers*1.15,3.4,j%2?rock:rockDark,0,k+j);}
  a('sphere',.6,h*.45,1.2,.6,.08,.5,lichen);if(k%3===0)a('rock',0,h+.4,0,1.6,1,1.8,rockLight,0,k);}
 // Abbruchkante zum Abgrund: Felskante mit Blick in die Tiefe.
 function edge(k=0){a('rock',-.4,-.05,0,1.2,.35,2.4,rockDark,0,k);a('box',3.5,-.08,0,6,.04,8.02,[.08,.09,.11]);a('box',8,-.06,0,4,.04,8.02,[.12,.14,.17]);if(k%2)a('rock',0,-.1,1.6,.5,.25,.4,rock,0,k+1);}
 // Abhang neben dem Holzsteg: die Felskante bricht zur Stegseite hin ab, darunter dunkle Tiefe
 // mit winzigem Geröll weit unten – so ist sofort klar, dass man nur auf dem Holz laufen kann.
 function abyss(k=0,toward=1,outer=0){const w=2.5+outer;a('box',-toward*outer/2,.03,0,w,.02,8.02,[.035,.04,.055]);
  for(let i=0;i<4;i++){const c=.32-i*.07;a('box',toward*(1.1-i*.28),.035,0,.3,.02,8.02,[c,c*.98,c*.95]);}
  for(let j=-1;j<=1;j++)a('rock',toward*1.05,-.02,j*2.6+((k+j)%3-1)*.3,.55,.28,1.5,rockDark,0,k+j,0,toward*.55);
  for(let j=0;j<5;j++)a('rock',-toward*((j*.37+k*.13)%1.6),.04,((j*29+k*7)%15)/15*7-3.5,.06,.03,.05,[.18,.19,.22],0,j+k);}
 // Grasbüschel (spärliche Vegetation).
 function tuft(k=0){for(let j=0;j<5;j++){const ang=j*1.3+k,h=.18+(j%3)*.07;a('box',Math.cos(ang)*.1,h/2,Math.sin(ang)*.1,.03,h,.03,j%2?grass:[.62,.62,.38],Math.sin(ang)*.3,0,-Math.cos(ang)*.3);}}
 // Steine auf dem Schotterweg.
 function pebbles(k=0){for(let j=0;j<6;j++){const x=((j*41+k*17)%23)/23*7.6-3.8,z=((j*29+k*11)%19)/19*7.6-3.8,sz=.06+((j+k)%3)*.05;a('rock',x,sz*.4,z,sz*1.4,sz*.8,sz*1.2,j%2?rock:rockLight,0,j+k);}}
 // Altschnee zwischen Felsen.
 function snowRest(k=0){a('cylinder',0,.06,0,1.6+(k%3)*.5,.12,1+(k%2)*.6,snow,0,k);a('rock',.9,.3,.4,.6,.5,.5,rockDark,0,k);}
 // Holzgeländer am Wegrand (Abschnitt 2).
 function sideRail(){a('cylinder',0,.55,0,.07,1.1,.07,woodOld);a('cylinder',0,1,1.9,.05,3.8,.05,wood,PI/2);}
 // Hörnlihütte (3260 m): Steinbau mit flachem Dach, Fensterreihen und Schweizer Fahne.
 function hut(){a('box',0,3.2,0,16,6.4,9,[.66,.64,.6]);a('box',0,6.6,0,16.6,.5,9.6,[.4,.38,.36]);a('box',-5,8.2,0,5,3,6,[.62,.6,.56]);a('box',-5,9.9,0,5.4,.4,6.4,[.4,.38,.36]);
  for(let fl=0;fl<2;fl++)for(let j=-3;j<=3;j++)a('box',j*2,1.8+fl*2.6,4.55,.8,1,.05,[.25,.3,.35]);for(let j=-3;j<=3;j++)a('box',j*2,1.8,4.58,.95,.12,.02,[.75,.2,.15]);
  a('cylinder',6.5,8,2,.06,3.4,.06,[.85,.85,.85]);a('box',7.1,9.2,2,1.2,.8,.03,[.85,.1,.1]);a('box',7.1,9.2,2.02,.6,.18,.01,[1,1,1]);a('box',7.1,9.2,2.02,.18,.6,.01,[1,1,1]);
  a('rock',0,-.6,0,20,1.6,12,rock,0,1);}
 // ---------- Schöne Alpenwelt (Landschafts-Highlight) ----------
 // Gletscherzunge am Berghang (Abschnitt 5).
 function glacier(k=0){for(let j=0;j<5;j++){a('rock',j*1.2-2.4,2+j*1.6,-j*3,7-j*.8,2.2,6,j%2?[.86,.92,.96]:[.78,.88,.94],0,k+j);}for(let j=0;j<4;j++)a('box',j*1.5-2.2,3.2+j*1.6,-j*3+1.5,.08,.1,3.5,[.45,.62,.72],0,.3);}
 // Wolkenbank / Bergnebel (weiche Billboards).
 function cloud(size=12,k=0){for(let j=0;j<6;j++)a('sphere',((j*37+k)%9-4)*size*.16,((j*13+k)%5)*size*.035,((j*7+k)%5-2)*size*.1,size*(.35+(j%3)*.1),size*(.16+(j%2)*.06),size*(.3+(j%2)*.1),[.97,.98,1,49]);}
 // ---------- Der felsige Aufstieg (Abschnitt 3) ----------
 const slate=[.47,.4,.34],slateDark=[.34,.3,.27],slateLight=[.6,.54,.47];
 // Lose Steine: breiter Haufen aus Schieferplatten in einer Spur (ausweichen – zu breit und wacklig zum Springen).
 function looseRocks(k=0){for(let j=0;j<11;j++){const x=((j*37+k*13)%11)/11*2-1,z=((j*53+k*7)%9)/9*1.6-.8,sz=.25+((j+k)%4)*.1;a('rock',x,sz*.45,z,sz*1.8,sz*.6,sz*1.3,j%3?slate:slateDark,((j%3)-1)*.25,j+k);}a('rock',0,.6,0,1,.7,.8,slateLight,.2,k);for(let j=0;j<3;j++)a('rock',-.6+j*.6,1.05,.1,.35,.18,.3,slate,.4,k+j);}
 // Holzgeländer in einer Spur (Spur wechseln): Pfosten mit zwei Latten, verwittert.
 function railLane(){for(const x of[-1.1,0,1.1])a('cylinder',x,.6,0,.08,1.2,.08,woodOld);for(const y of[.55,1.08])a('cylinder',0,y,0,.06,2.4,.06,wood,0,0,PI/2);a('box',0,.85,.06,.5,.18,.02,[.97,.8,.1]);}
 // Schmaler Holzsteg für eine Spur über einer Rinne: Bohlen, Querträger, Pfosten mit Seil.
 function boardwalk(k=0){for(let j=-2;j<=2;j++)a('box',0,.12,j*.5,2.2,.08,.44,(j+k)%2?[.56,.42,.28]:[.5,.38,.25]);for(const x of[-1,1])a('box',x,.02,0,.14,.12,2.5,[.38,.28,.18]);for(const x of[-1.15,1.15]){a('cylinder',x,.55,0,.06,.9,.06,woodOld);a('cylinder',x,.95,0,.02,2.5,.02,[.75,.68,.5],PI/2);}}
 // Brauner Schieferhang (wie auf dem Foto): geschichtete, schräge Platten.
 function slateSlope(k=0,h=4,side=1){for(let j=0;j<6;j++){const y=j*h/6,x=side*(j*.9),w=2.6+((k+j)%3)*.6;a('rock',x,y+.3,((j*7+k)%5-2)*.5,w,.55,2.8,j%2?slate:slateDark,0,k+j,side*.35);}
  if(k%2)a('rock',side*1.2,.25,1,.9,.3,.7,slateLight,.3,k);}
 // Natürliche Steinstufe quer über den Weg (flache Felsplatten, nur Optik).
 function stoneStep(k=0){for(let j=-1;j<=1;j++){const w=2.3+((k+j)%3)*.15;a('rock',j*2.5+((k+j)%3-1)*.15,.05,((k*3+j)%3-1)*.15,w,.12,.75,(k+j)%2?rockLight:rock,0,k+j);}}
 // Moränenblock mit Flechten (Start am Schwarzsee).
 function moraine(k=0){a('rock',0,.5,0,1.6+(k%3)*.4,1,1.3,(k%2)?rock:rockLight,0,k);a('sphere',.2,.95+(k%3)*.1,.1,.5,.05,.4,lichen);if(k%3===0)a('rock',.9,.2,.6,.6,.35,.5,rockDark,0,k+2);}
 // Wolkenfahne (wie am echten Matterhorn): weiche, ausgefranste Kugeln.
 function banner(size=60,k=0){for(let j=0;j<7;j++)a('sphere',j*size*.18,Math.sin(j*1.3+k)*size*.06,((j*5+k)%3-1)*size*.05,size*(.22-j*.018),size*(.13-j*.01),size*(.18-j*.015),[.98,.99,1,49]);}
 return{stoneStep,moraine,banner,looseRocks,railLane,boardwalk,slateSlope,glacier,cloud,abyss,scree,rockBig,woodPiece,woodBarrier,woodRail,rockFace,ledge,signpost,beamLow,overhang,snowPatch,cliff,edge,tuft,pebbles,snowRest,sideRail,hut};
}
