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
 // Metallbarriere quer über den Weg (drüberspringen).
 function metalBarrier(){for(const x of[-3.6,0,3.6]){a('cylinder',x,.48,0,.06,.96,.06,metalDark);a('box',x,.03,0,.3,.06,.3,metalDark);}a('cylinder',0,.92,0,.05,7.4,.05,metal,0,0,PI/2);a('box',0,.6,0,7.4,.3,.03,[.75,.7,.25]);for(let j=-3;j<=3;j++)a('box',j*1.05,.6,.02,.45,.3,.005,[.15,.15,.15],0,0,.6);}
 // Grosse Felsformation, die eine Spur blockiert (Spur wechseln).
 function rockFace(k=0){a('rock',0,1.3,0,1.45,2.6,1.4,rockDark,0,k);a('rock',.4,2.4,.2,1,1.3,1,rock,0,k+1);a('rock',-.5,.6,.5,.8,.7,.7,rockLight,0,k+2);a('sphere',.2,2.95,0,.6,.06,.5,lichen);}
 // Felsvorsprung, der von der Seite in eine Spur ragt (Spur wechseln).
 function ledge(k=0,side=1){push(side*.6,0,0);a('rock',0,1.1,0,1.9,2.2,1.2,rock,0,k);a('rock',-side*.6,1.6,0,1.2,1,1,rockDark,0,k+2);pop();}
 // Schweizer Wanderwegweiser (gelb) – blockiert eine Spur.
 function signpost(k=0){a('cylinder',0,1.1,0,.07,2.2,.07,[.6,.6,.62]);for(const [y,dir] of[[1.95,1],[1.65,-1],[1.35,1]]){push(dir*.35,y,0);a('box',0,0,0,.95,.22,.04,[.97,.8,.1]);a('box',dir*.55,0,0,.18,.18,.04,[.97,.8,.1],0,0,PI/4);a('box',0,0,.025,.7,.05,.005,[.15,.15,.12]);pop();}a('rock',0,.12,0,.45,.25,.4,rockDark,0,k);}
 // Niedrige Metallstrebe über dem Weg (ducken).
 function metalStrut(){for(const x of[-4,4]){a('cylinder',x,.9,0,.08,1.8,.08,metalDark);}a('box',0,1.42,0,8.2,.14,.14,metal);a('box',0,1.42,0,8.2,.03,.16,[.9,.75,.15]);for(let j=-3;j<=3;j+=2)a('box',j,1.43,.08,.5,.12,.005,[.12,.12,.12],0,0,.6);}
 // Quer verlaufender Holzbalken (ducken).
 function beamLow(){for(const x of[-4,4])a('cylinder',x,.95,0,.13,1.9,.13,woodOld);a('cylinder',0,1.48,0,.17,8.4,.17,wood,0,0,PI/2);}
 // Niedriger Felsüberhang (ducken): Felsdach über den Weg, auf einer Seite in der Wand verankert.
 function overhang(k=0){a('rock',-4.6,1.4,0,1.6,2.8,1.4,rockDark,0,k);a('rock',4.6,1.2,0,1.4,2.4,1.3,rock,0,k+1);a('rock',0,1.85,0,9,.6,1.4,rock,0,k*.3);a('rock',-1,1.62,.1,2.5,.35,1,rockDark,0,k);for(let j=0;j<4;j++)a('cone',-2.5+j*1.6,1.52,0,.08,.25,.08,rockDark,PI);}
 // Kleines Schneefeld in einer Spur (rutschig).
 function snowPatch(k=0){a('cylinder',0,.04,0,1.2,.08,1.6,snow,0,k);a('cylinder',.3,.07,.2,.7,.06,.9,[.98,.99,1],0,k);a('sphere',-.5,.1,-.6,.3,.08,.25,[.85,.88,.92]);}

 // ---------- Kulisse ----------
 // Felswand am Wegrand (Gneis mit Schichtung und Flechten).
 function cliff(k=0,h=9){const layers=4;for(let j=0;j<layers;j++){const y=j*h/layers,w=3.2-j*.35+((k+j)%3)*.3;a('rock',((k+j)%3-1)*.4,y+h/layers/2,0,w,h/layers*1.15,3.4,j%2?rock:rockDark,0,k+j);}
  a('sphere',.6,h*.45,1.2,.6,.08,.5,lichen);if(k%3===0)a('rock',0,h+.4,0,1.6,1,1.8,rockLight,0,k);}
 // Abbruchkante zum Abgrund: Felskante mit Blick in die Tiefe.
 function edge(k=0){a('rock',-.4,-.05,0,1.2,.35,2.4,rockDark,0,k);a('box',3.5,-.08,0,6,.04,8.02,[.08,.09,.11]);a('box',8,-.06,0,4,.04,8.02,[.12,.14,.17]);if(k%2)a('rock',0,-.1,1.6,.5,.25,.4,rock,0,k+1);}
 // Abgrund unter einer Spur (Metallbrücke): dunkle Tiefe mit Felskante.
 function abyss(k=0){a('box',0,.03,0,2.5,.02,8.02,[.06,.07,.09]);a('box',0,.035,0,2.1,.02,8.02,[.03,.035,.05]);}
 // Grasbüschel (spärliche Vegetation).
 function tuft(k=0){for(let j=0;j<5;j++){const ang=j*1.3+k,h=.18+(j%3)*.07;a('box',Math.cos(ang)*.1,h/2,Math.sin(ang)*.1,.03,h,.03,j%2?grass:[.62,.62,.38],Math.sin(ang)*.3,0,-Math.cos(ang)*.3);}}
 // Steine auf dem Schotterweg.
 function pebbles(k=0){for(let j=0;j<6;j++){const x=((j*41+k*17)%23)/23*7.6-3.8,z=((j*29+k*11)%19)/19*7.6-3.8,sz=.06+((j+k)%3)*.05;a('rock',x,sz*.4,z,sz*1.4,sz*.8,sz*1.2,j%2?rock:rockLight,0,j+k);}}
 // Altschnee zwischen Felsen.
 function snowRest(k=0){a('cylinder',0,.06,0,1.6+(k%3)*.5,.12,1+(k%2)*.6,snow,0,k);a('rock',.9,.3,.4,.6,.5,.5,rockDark,0,k);}
 // Metalltreppe: Gitterstufe quer über den Weg mit Seitenwangen.
 function stairStep(k=0){a('box',0,.06,0,8,.08,1.1,metal);for(let j=-3;j<=3;j++)a('box',j*1.1,.11,0,.04,.02,1.05,metalDark);for(const x of[-4.1,4.1]){a('box',x,.35,0,.08,.6,1.1,metalDark);if(k%2===0)a('cylinder',x,1,0,.035,1.3,.035,metal);}a('cylinder',-4.1,1.6,0,.03,1.2,.03,metal,PI/2);a('cylinder',4.1,1.6,0,.03,1.2,.03,metal,PI/2);}
 // Metallbrücke: schmaler Steg (eine Spur) mit Geländer.
 function bridgeDeck(){a('box',0,0,0,2.3,.1,2.5,metal);for(let j=-1;j<=1;j++)a('box',j*.7,.06,0,.04,.02,2.45,metalDark);for(const x of[-1.2,1.2]){a('cylinder',x,.55,0,.04,1.1,.04,metalDark);a('cylinder',x,1.1,0,.035,2.5,.035,metal,PI/2);a('cylinder',x,.6,0,.025,2.5,.025,metal,PI/2);}a('box',0,-.35,0,.2,.6,.2,metalDark);}
 // Holzgeländer am Wegrand (Abschnitt 2).
 function sideRail(){a('cylinder',0,.55,0,.07,1.1,.07,woodOld);a('cylinder',0,1,1.9,.05,3.8,.05,wood,PI/2);}
 // Hörnlihütte (3260 m): Steinbau mit flachem Dach, Fensterreihen und Schweizer Fahne.
 function hut(){a('box',0,3.2,0,16,6.4,9,[.66,.64,.6]);a('box',0,6.6,0,16.6,.5,9.6,[.4,.38,.36]);a('box',-5,8.2,0,5,3,6,[.62,.6,.56]);a('box',-5,9.9,0,5.4,.4,6.4,[.4,.38,.36]);
  for(let fl=0;fl<2;fl++)for(let j=-3;j<=3;j++)a('box',j*2,1.8+fl*2.6,4.55,.8,1,.05,[.25,.3,.35]);for(let j=-3;j<=3;j++)a('box',j*2,1.8,4.58,.95,.12,.02,[.75,.2,.15]);
  a('cylinder',6.5,8,2,.06,3.4,.06,[.85,.85,.85]);a('box',7.1,9.2,2,1.2,.8,.03,[.85,.1,.1]);a('box',7.1,9.2,2.02,.6,.18,.01,[1,1,1]);a('box',7.1,9.2,2.02,.18,.6,.01,[1,1,1]);
  a('rock',0,-.6,0,20,1.6,12,rock,0,1);}
 // ---------- Schöne Alpenwelt (Landschafts-Highlight) ----------
 // Türkisfarbener Bergsee (Abschnitt 2): Wasser, helle Uferzone, Lichtreflexe und gespiegelte Gipfel.
 function lake(time,k,shore=false){a('box',0,.06,0,11.2,.06,8.1,shore?[.36,.7,.68,26]:[.14,.56,.62,26]);
  const ph=(time*.15+k*.07)%1;a('box',-3+ph*6,.1,((k%3)-1)*2.4,3,.01,.06,[.85,.97,1,49]);}
 // Spiegelbild eines Bergs im See: dunkleres, umgedrehtes Dreieck aus flachen Quadern.
 function reflection(h=18,w=16,snowy=true){for(let j=0;j<6;j++){const f=j/6,ww=w*(1-f);a('box',0,.095,f*h*.55,ww,.005,h*.55/6+.02,j<2&&snowy?[.62,.8,.84,26]:[.1,.36,.4,26]);}}
 // Gletscherzunge am Berghang (Abschnitt 5).
 function glacier(k=0){for(let j=0;j<5;j++){a('rock',j*1.2-2.4,2+j*1.6,-j*3,7-j*.8,2.2,6,j%2?[.86,.92,.96]:[.78,.88,.94],0,k+j);}for(let j=0;j<4;j++)a('box',j*1.5-2.2,3.2+j*1.6,-j*3+1.5,.08,.1,3.5,[.45,.62,.72],0,.3);}
 // Wolkenbank / Bergnebel (weiche Billboards).
 function cloud(size=12,k=0){for(let j=0;j<6;j++)a('sphere',((j*37+k)%9-4)*size*.16,((j*13+k)%5)*size*.035,((j*7+k)%5-2)*size*.1,size*(.35+(j%3)*.1),size*(.16+(j%2)*.06),size*(.3+(j%2)*.1),[.97,.98,1,49]);}
 // Moosige Felswand mit Wasserfall und Becken (Abschnitt 3).
 function fallWall(time,k){a('rock',0,4.5,0,6,9,3.4,[.46,.48,.44],0,k);a('rock',-2.6,2.5,.8,2.6,5,2.4,[.4,.44,.38],0,k+1);a('sphere',-1,6.8,1.5,1.8,.3,1,[.34,.5,.26]);a('sphere',2,3.2,1.6,1.5,.25,.9,[.38,.54,.28]);
  a('box',.6,4.5,1.75,1.4,9,.2,[.78,.93,1,49]);for(let j=0;j<5;j++){const ph=(time*1.9+j*.2)%1;a('box',.6+((j%3)-1)*.35,9-ph*9,1.9,.25,.7,.04,[.96,.99,1,49]);}
  a('cylinder',.6,.03,3.3,2.6,.08,1.8,[.2,.6,.64,26]);for(let j=0;j<4;j++){const ph=(time*2+j*.3)%1;a('sphere',.6+Math.cos(j*1.7)*1.1*ph,.25+ph*.6,2.3+Math.sin(j)*.5,.25+ph*.3,.18,.25+ph*.3,[.96,.99,1,49]);}}
 // Kleine Berghütte aus Holz und Stein.
 function stoneHut(k=0){a('box',0,1,0,4.2,2,3.4,[.62,.6,.56]);a('box',0,2.6,0,4.2,1.2,3.4,[.5,.34,.2]);a('box',0,3.4,-.9,4.8,.18,2.3,[.35,.32,.3],.62);a('box',0,3.4,.9,4.8,.18,2.3,[.35,.32,.3],-.62);
  a('box',-.9,1.1,1.72,.7,.8,.04,[.25,.3,.35]);a('box',.9,1.1,1.72,.7,.8,.04,[.25,.3,.35]);a('box',0,2.6,1.72,.8,.6,.04,[.25,.3,.35]);for(const x of[-.9,.9])a('box',x,.65,1.75,.8,.14,.04,[.8,.25,.2]);a('box',1.4,3.9,0,.4,.9,.4,[.55,.53,.5]);}
 return{lake,reflection,glacier,cloud,fallWall,stoneHut,abyss,scree,rockBig,woodPiece,woodBarrier,woodRail,metalBarrier,rockFace,ledge,signpost,metalStrut,beamLow,overhang,snowPatch,cliff,edge,tuft,pebbles,snowRest,stairStep,bridgeDeck,sideRail,hut};
}
