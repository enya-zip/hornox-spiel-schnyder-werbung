// Level-Sammelobjekte für den Bergladen: in jedem Level ein Gegenstand, der zum Thema passt.
// Zone → Gegenstand (Level 3 «Zum See» sammelt Fische, siehe lake.js):
//  3 Zermatt: Wanderkarte · 6 Blatten: Walliser Roggenbrot · 8 Füri: Waldnüsse · 1 Alpweiden: Blume
//  9 Schwarzsee: Frosch · 4 Hörnliweg: Wanderstock · 0 Gletscher: Eispickel · 10 Hörnligrat: Stirnlampe
//  5 Matterhorn: Gipfelfahne (Schweizer Flagge)
// Alle schweben über der Spur, drehen sich und haben einen weichen Leuchtring (wie der Fisch in Level 3).
export function createTokens(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const glow=c=>a('ring',0,.06,0,.8,.8,.05,[...c,49],PI/2);
 const wood=[.55,.38,.22],woodDark=[.36,.24,.13],metal=[.72,.74,.78],metalDark=[.38,.4,.44],red=[.86,.1,.12],white=[1,1,1];
 // 01 Wanderkarte: dreifach gefaltet, Papier mit Wald, See und roter Wanderroute.
 function trailMap(){for(let k=-1;k<=1;k++){push(k*.2,0,0,0,0,k*.32);a('box',0,0,0,.2,.32,.02,[.96,.93,.82]);a('box',.02,.06,.012,.12,.1,.005,[.45,.68,.38]);a('box',-.04,-.08,.012,.1,.07,.005,[.45,.7,.9]);pop();}
  for(let k=0;k<5;k++)a('box',-.28+k*.14,-.02+Math.sin(k*1.7)*.07,.03,.12,.025,.006,[.85,.15,.12],0,0,Math.sin(k*2.1)*.6);a('box',0,.2,.02,.56,.05,.01,[.25,.45,.3]);}
 // 02 Walliser Roggenbrot: dunkler, runder, flacher Laib mit hellen Rissen und Mehl.
 function ryeBread(){a('sphere',0,0,0,.36,.2,.36,[.42,.26,.14]);a('sphere',0,.06,0,.3,.14,.3,[.5,.32,.17]);
  for(let k=0;k<5;k++){const t=k*PI*2/5;a('box',Math.cos(t)*.16,.17,Math.sin(t)*.16,.16,.02,.03,[.78,.62,.42],0,-t);}for(let k=0;k<6;k++)a('sphere',Math.cos(k*2.3)*.2,.15,Math.sin(k*1.9)*.2,.04,.01,.04,[.95,.93,.88]);}
 // 04 Waldnüsse: Haselnüsse mit grüner Hülle und eine Baumnuss an einem Zweig.
 function forestNuts(){a('cylinder',0,.18,0,.025,.5,.025,woodDark,0,0,1.2);
  for(const [x,y,z] of[[-.14,0,0],[.06,-.04,.1],[.12,.04,-.08]]){a('sphere',x,y,z,.11,.12,.11,[.62,.38,.18]);a('sphere',x,y+.06,z,.1,.05,.1,[.8,.62,.4]);for(let k=0;k<4;k++)a('sphere',x+Math.cos(k*1.6)*.08,y+.1,z+Math.sin(k*1.6)*.08,.07,.03,.05,[.45,.65,.25],0,k*1.6);}
  a('sphere',-.02,-.16,-.1,.13,.12,.13,[.55,.42,.28]);for(let k=0;k<4;k++)a('box',-.02,-.16,-.1,.27,.02,.02,[.42,.3,.18],0,k*.8);
  for(const s of[-1,1])a('sphere',s*.24,.22,.02,.16,.02,.08,[.35,.6,.22],0,s*.4,s*.3);}
 // 05 Blume (Alpenblume mit Stiel und Blatt).
 function alpineFlower(id){const c=[[.98,.98,.95],[.95,.55,.75],[.55,.5,.95],[1,.85,.25]][Math.abs(id)%4];for(let k=0;k<8;k++){const t=k*PI/4;a('sphere',Math.cos(t)*.22,0,Math.sin(t)*.22,.15,.04,.08,c,0,-t);}a('sphere',0,.03,0,.1,.08,.1,[1,.75,.15]);a('cylinder',0,-.4,0,.025,.7,.025,[.3,.55,.22]);a('sphere',.1,-.45,0,.12,.03,.05,[.35,.6,.25],0,0,.5);}
 // 06 Frosch zum Einsammeln: klein und freundlich, auf einem Seerosenblatt (die grossen Frösche mit Zunge sitzen im Wasser).
 function smallFrog(){a('cylinder',0,-.2,0,.38,.02,.38,[.25,.6,.25]);a('sphere',0,-.06,0,.24,.16,.26,[.35,.8,.3]);a('sphere',0,-.1,.08,.2,.1,.2,[.95,.92,.6]);
  for(const s of[-1,1]){a('sphere',s*.11,.08,.12,.08,.08,.08,[.35,.8,.3]);a('sphere',s*.12,.1,.18,.05,.05,.04,white);a('sphere',s*.12,.1,.21,.025,.03,.02,[.05,.05,.05]);a('sphere',s*.2,-.16,-.1,.1,.06,.14,[.25,.6,.2]);}
  a('box',0,-.02,.24,.16,.015,.02,[.18,.45,.15]);}
 // 07 Wanderstock: Holzstock mit Lederschlaufe, Griff und Metallspitze.
 function walkingStick(){push(0,0,0,0,0,.35);a('cylinder',0,0,0,.035,1.15,.035,wood);a('cylinder',0,.5,0,.05,.18,.05,woodDark);a('ring',0,.58,.04,.08,.12,.02,[.6,.3,.15],0,0,.2);
  a('cone',0,-.62,0,.03,.1,.03,metal,PI);for(let k=0;k<3;k++)a('box',0,-.25+k*.25,.035,.04,.015,.005,woodDark);pop();}
 // 08 Eispickel: Schaft, Metallkopf mit Haue und Schaufel, Handschlaufe.
 function iceAxe(){push(0,0,0,0,0,.3);a('cylinder',0,-.05,0,.035,1,.035,[.2,.35,.7]);a('cone',0,-.6,0,.035,.12,.035,metal,PI);
  a('box',0,.47,0,.62,.08,.06,metal);a('box',-.3,.43,0,.12,.06,.05,metalDark,0,0,-.4);a('box',.28,.47,0,.14,.04,.16,metal);a('ring',0,.1,.04,.07,.14,.02,[.95,.6,.1]);pop();}
 // 09 Stirnlampe: Kopfband, Lampengehäuse und leuchtendes Licht.
 function headlamp(){a('ring',0,0,0,.24,.24,.07,[.9,.3,.1]);a('ring',0,0,0,.21,.21,.05,[.15,.15,.18]);
  a('box',0,0,.24,.18,.13,.1,[.2,.2,.24]);a('cylinder',0,0,.3,.06,.03,.06,[1,.98,.75,9],PI/2);a('cone',0,0,.55,.18,.45,.18,[1,.97,.7,49],-PI/2);}
 // 10 Gipfelfahne: Schweizer Flagge (rotes Quadrat, weisses Kreuz) an einem Stock, weht im Wind.
 function summitFlag(time){a('cylinder',-.28,-.1,0,.025,.95,.025,[.85,.85,.88]);a('sphere',-.28,.38,0,.04,.04,.04,[1,.8,.3,9]);
  push(.02,.18,0,0,Math.sin(time*5)*.12,0);a('box',0,0,0,.56,.56,.03,red);a('box',0,0,.018,.34,.1,.01,white);a('box',0,0,.018,.1,.34,.01,white);a('box',0,0,-.018,.34,.1,.01,white);a('box',0,0,-.018,.1,.34,.01,white);pop();}
 // Nur der Gegenstand (ohne Leuchtring/Schweben) – auch für den Flug in den Rucksack.
 function item(zone,time,id){if(zone===3)trailMap();else if(zone===6)ryeBread();else if(zone===8)forestNuts();else if(zone===1)alpineFlower(id);else if(zone===9)smallFrog();
  else if(zone===4)walkingStick();else if(zone===0)iceAxe();else if(zone===10)headlamp();else summitFlag(time);}
 function token(zone,time,id){
  const bob=1.1+Math.sin(time*3+id)*.1,spin=time*1.8+id;
  glow(zone===0||zone===10?[.6,.85,1]:zone===9?[.45,.95,.5]:zone===4?[.9,.7,.4]:zone===6?[1,.7,.35]:zone===8?[.8,.6,.35]:zone===1?[1,.85,.95]:zone===5?[1,.4,.4]:[1,.85,.35]);
  push(0,bob,0,0,spin,0,1.5);item(zone,time,id);pop();
 }
 // Bergladen über dem Weg: Hornox läuft durch das offene Tor hinein (dann öffnet sich der Laden) und hinten wieder hinaus.
 // Lokales System: Eingang bei z=0, Laufrichtung +z. Hohe, offene Halle (Dach erst ab 6,8 m), damit die Kamera
 // (rund 5 m hoch) beim Hineinlaufen nicht durch Decke oder Giebel fährt und man die Regale links und rechts sieht.
 function shop(time){
  const wood=[.56,.4,.25],dark=[.38,.26,.15],light=[.7,.54,.36],stone=[.55,.53,.5],D=8,W=12,H=6.4;
  for(const s of[-1,1]){const xw=s*(W/2-.5);
   a('box',xw,.45,D/2,1,.9,D,stone);a('box',xw,(H+.9)/2,D/2,.9,H-.9,D,wood);
   for(let k=0;k<7;k++)a('box',s*(W/2-.98),1.3+k*.75,D/2,.05,.07,D,dark);
   // Regale mit Waren: Herzen, Honig- und Beerengläser, Kristalle, Kisten
   for(const [y,kind] of[[1.25,0],[2.15,1],[3.05,2]]){a('box',s*(W/2-1.4),y,D/2,.7,.08,D-1.2,light);
    for(let j=0;j<6;j++){const z=1+j*1.2,x=s*(W/2-1.4);
     if(kind===0){a('sphere',x-.08,y+.22,z-.1,.13,.13,.1,[.9,.15,.2]);a('sphere',x+.08,y+.22,z-.1,.13,.13,.1,[.9,.15,.2]);a('cone',x,y+.08,z-.1,.18,.16,.1,[.9,.15,.2],Math.PI);}
     else if(kind===1)a('cylinder',x,y+.2,z,.14,.32,.14,[[1,.75,.2],[.75,.1,.2],[.45,.7,.95]][j%3]);
     else a('cone',x,y+.22,z,.1,.36,.1,[.85,.92,1,49]);}}
   for(let j=0;j<4;j++)a('box',s*(W/2-1.5),.4,1.4+j*1.8,.6,.6,.6,j%2?dark:wood);
   // Torpfosten vorne und hinten
   for(const z of[0,D])a('box',s*(W/2-1),H/2,z,.4,H,.4,dark);}
  // Dach hoch oben: Firstbalken, zwei Schrägen, Giebel nur oberhalb der Kamera
  for(const z of[0,D])a('box',0,H+.2,z,W,.4,.35,dark);
  for(const s of[-1,1]){push(s*W/4,H+1.35,D/2);a('box',0,0,0,W/2+1.4,.25,D+1.4,[.32,.22,.14],0,0,-s*.4);pop();}
  for(const z of[0,D])for(let k=0;k<4;k++)a('box',0,H+.55+k*.45,z,(W-1)*(1-k/4.4),.45,.2,wood);
  for(let k=1;k<4;k++)a('box',0,H+.15,k*D/4,W-1,.2,.2,dark);   // Querbalken
  // Holzboden durch den Laden
  for(let k=0;k<14;k++)a('box',0,.04,.3+k*.56,W-2.2,.06,.48,k%2?light:wood);
  // Rot-weisse Markise über dem Eingang und Laternen
  for(let k=0;k<11;k++)a('box',-4.95+k*.99,H-.15,-.55,.99,.08,1.2,k%2?[.96,.96,.93]:[.82,.13,.13],-.3);
  const sway=Math.sin(time*2)*.06;for(const s of[-1,1]){a('cylinder',s*4.2,H-.9+sway,.4,.03,.6,.03,dark);a('sphere',s*4.2,H-1.3+sway,.4,.18,.24,.18,[1,.82,.35,9]);}
  // Grosses Ladenschild über dem Tor: «SHOP» in Block-Buchstaben (5×7 Pixel), links ein Herz, rechts ein Korb.
  push(0,H+.05,-1.25);a('box',0,0,.03,6.2,1.9,.1,dark);a('box',0,0,0,5.9,1.6,.14,[.97,.93,.82]);
  const px=.15,font={S:['01111','10000','10000','01110','00001','00001','11110'],H:['10001','10001','10001','11111','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000']};
  // Die Halle wird um 180° gedreht gezeichnet: x gespiegelt, damit «SHOP» von vorne richtig lesbar ist.
  [...'SHOP'].forEach((ch,i)=>{const x0=-1.62+i*.92;font[ch].forEach((row,r)=>{let c=0;while(c<5){if(row[c]!=='1'){c++;continue;}let e=c;while(e<5&&row[e]==='1')e++;a('box',-(x0+(c+e-1)/2*px),.45-r*px,-.09,(e-c)*px-.015,px*.92,.05,[.78,.12,.14]);c=e;}});});   // zusammenhängende Pixel = ein Kästchen
  for(const s of[-1,1])a('sphere',2.45+s*.13,.12,-.1,.18,.18,.05,[.88,.12,.18]);a('cone',2.45,-.12,-.1,.27,.24,.05,[.88,.12,.18],Math.PI);
  a('box',-2.45,-.1,-.1,.6,.36,.04,[.75,.5,.25]);for(let k=0;k<3;k++)a('sphere',-2.25-k*.2,.12,-.12,.1,.1,.05,[[1,.78,.2],[.9,.3,.25],[.4,.7,.95]][k]);
  pop();
  // Blumenkästen und Fässer vor dem Eingang
  for(const s of[-1,1]){a('cylinder',s*6.9,.5,.4,.42,1,.42,wood);a('cylinder',s*6.9,.5,.4,.44,.08,.44,dark);a('box',s*6.9,1.12,1.4,.9,.3,.35,dark);for(let k=0;k<3;k++)a('sphere',s*6.9-.3+k*.3,1.35,1.4,.14,.14,.14,k%2?[.9,.2,.3]:[1,.85,.3]);}
 }
 return{token,item,shop};
}
