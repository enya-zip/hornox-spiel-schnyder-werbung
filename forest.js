// Level 4 (Furi · Waldpfad): Wildschwein, Haselnüsse, Glückspilze und die morsche Holzbrücke.
export function createForest(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const fur=[.30,.22,.16],dark=[.17,.12,.09],snout=[.62,.45,.38],tusk=[.96,.93,.84];

 // Wildschwein im Galopp (Kopf in +z). run = Laufzeit für die Beinbewegung.
 function boar(run,id=0){
  const g=Math.sin(run*14),bob=Math.abs(g)*.12;push(0,bob,0,Math.sin(run*14)*.05);
  a('sphere',0,1.05,0,.72,.68,1.15,fur);
  a('sphere',0,1.18,-.35,.62,.6,.75,dark);
  for(let k=0;k<7;k++)a('cone',0,1.72-k*.03,.5-k*.22,.07,.32,.12,dark,-.4);   // Borstenkamm
  // Kopf mit Rüssel und Hauern
  a('sphere',0,1.02,1.05,.46,.48,.55,fur);
  a('sphere',0,.88,1.52,.28,.25,.24,snout);
  a('cylinder',0,.86,1.73,.2,.05,.18,[.48,.33,.28],PI/2);
  for(const side of[-1,1]){
   a('sphere',side*.08,.87,1.77,.04,.05,.02,[.18,.1,.08]);
   a('cone',side*.2,.86,1.52,.04,.26,.04,tusk,-.6,0,side*.5);
   a('sphere',side*.22,1.22,1.32,.06,.06,.05,[.55,.05,.04]);           // rote Augen
   a('cone',side*.3,1.48,.92,.12,.32,.08,dark,-.3,0,side*.35);           // Ohren
  }
  // Beine im Galopp
  for(const [x,z,ph] of[[-.38,.65,0],[.38,.65,PI],[-.38,-.6,PI],[.38,-.6,0]]){const sw=Math.sin(run*14+ph)*.6;push(x,.75,z,sw,0,0);a('cylinder',0,-.38,0,.13,.78,.13,dark);a('box',0,-.8,.04,.15,.1,.2,[.08,.06,.05]);pop();}
  push(0,1.3,-1.15,.6+Math.sin(run*20)*.4,0,0);a('cylinder',0,.2,0,.035,.45,.035,dark);pop();
  pop();
 }

 // Staubwolke hinter dem rennenden Wildschwein.
 function dust(time){for(let k=0;k<5;k++){const ph=(time*2.2+k*.2)%1;a('sphere',Math.sin(k*2.3)*.6,.25+ph*.5,-1.2-ph*1.6,.25+ph*.45,.2+ph*.3,.25+ph*.45,[.62,.52,.4,49]);}}

 // Haselnuss (ersetzt in Level 4 die Münze, gleiche Grösse und Höhe).
 function nut(time,id){
  push(0,1.05+Math.sin(time*3+id)*.08,0,0,time*2.2+id);
  a('sphere',0,0,0,.26,.3,.26,[.55,.33,.15]);
  a('sphere',0,-.04,.02,.2,.22,.2,[.67,.43,.2]);
  a('sphere',0,.2,0,.24,.11,.24,[.72,.6,.38]);
  for(let k=0;k<5;k++){const t=k*PI*2/5;a('box',Math.cos(t)*.17,.27,Math.sin(t)*.17,.13,.03,.08,[.42,.6,.24],0,-t,.5);}
  pop();
 }

 // Glückspilz (Fliegenpilz) mit Leuchtring und Glitzern.
 function mushroom(time,id){
  a('ring',0,.06,0,.75,.75,.05,[1,.85,.3,49],PI/2,0,time);
  push(0,.95+Math.sin(time*2.6+id)*.12,0,0,time*1.4+id);
  a('cylinder',0,0,0,.14,.55,.14,[.96,.94,.88]);
  a('sphere',0,.36,0,.46,.3,.46,[.86,.1,.08]);
  for(let k=0;k<7;k++){const t=k*PI*2/7+.3,rr=k%2?.32:.18;a('sphere',Math.cos(t)*rr,.52+(k%2?-.06:.04),Math.sin(t)*rr,.06,.035,.06,[1,1,.97]);}
  pop();
  for(let k=0;k<3;k++){const t=time*2+k*2.1+id;a('sphere',Math.cos(t)*.7,1.2+Math.sin(t*1.7)*.4,Math.sin(t)*.7,.05,.05,.05,[1,.9,.4,49]);}
 }

 // Ein Brett des Brückendecks (quer zur Laufrichtung), leicht unterschiedliche Holzfarben.
 function plank(k){const c=[[.48,.34,.2],[.42,.29,.17],[.52,.38,.23]][((k%3)+3)%3];a('box',0,.07,0,8.6,.14,1.22,c);}
 // Geländerpfosten mit Handlauf über die nächsten 6 Einheiten.
 function rail(){for(const x of[-4.45,4.45]){a('box',x,.75,0,.16,1.4,.16,[.36,.25,.15]);a('box',x,1.35,-1.5,.1,.1,3.1,[.4,.28,.17]);}}

 // Morsches Brett auf einer Spur: break 0 = noch ganz (mit Rissen), 1 = weggebrochen (Loch).
 function brokenPlank(brk,time,id){
  if(brk<1){const fall=brk*brk;push(0,-fall*2.2,0,fall*1.4,0,fall*.8*(id%2?1:-1));a('box',0,.08,0,2.3,.16,1.24,[.36,.25,.15]);for(const x of[-.5,.4])a('box',x,.17,0,.04,.02,1.1,[.12,.08,.05],0,.3);pop();}
  // Loch: dunkler Spalt mit Splittern an den Rändern
  a('box',0,.15,0,2.2*Math.min(1,brk*1.3),.02,1.18,[.04,.06,.07]);
  for(const s of[-1,1])a('box',s*1.1,.16,0,.14,.05,1.2,[.5,.36,.22],0,0,s*.2);
 }
 // ---------- Hindernisse im Wald (lokal: Laufrichtung +z, Spurbreite ca. 2,3) ----------
 const bark=[.36,.25,.16],barkDark=[.25,.17,.11],moss=[.3,.45,.18],leaf=[.2,.36,.17];
 // Grosse Baumwurzeln quer über die Spur (drüberspringen).
 function roots(){for(let k=0;k<4;k++){const x=-.9+k*.6;a('cylinder',x,.12,0,.14,1.3,.14,bark,PI/2,0,(k%2?.4:-.3));a('sphere',x,.1,(k%2?.5:-.5),.18,.12,.18,barkDark);}a('sphere',0,.15,0,.9,.18,.5,moss);}
 function bigMushroom(){a('cylinder',0,.45,0,.22,.9,.22,[.93,.9,.82]);a('sphere',0,.95,0,.75,.42,.75,[.62,.38,.2]);a('sphere',0,.85,0,.7,.2,.7,[.88,.8,.66]);for(let k=0;k<5;k++)a('sphere',Math.cos(k*1.3)*.45,1.25,Math.sin(k*1.3)*.45,.08,.04,.08,[.95,.9,.78]);}
 function branchPile(){for(let k=0;k<6;k++)a('cylinder',(k-2.5)*.25,.18+(k%3)*.13,(k%2?.2:-.2),.06,1.6,.06,k%2?bark:barkDark,0,k*.6,PI/2-.2+k*.15);for(let k=0;k<4;k++)a('sphere',(k-1.5)*.4,.55,0,.3,.18,.3,leaf);}
 function woodpile(){for(let row=0;row<3;row++)for(let k=0;k<4-row;k++)a('cylinder',(k-(3-row)/2)*.48,.25+row*.42,0,.23,1.4,.23,k%2?bark:[.45,.32,.2],PI/2);for(let row=0;row<3;row++)for(let k=0;k<4-row;k++)a('cylinder',(k-(3-row)/2)*.48,.25+row*.42,.71,.19,.02,.19,[.78,.62,.42],PI/2);}
 // Alter Wanderwegweiser (gelbe Schweizer Wegtafeln), ausweichen.
 function sign(){a('cylinder',0,1.25,0,.08,2.5,.08,[.6,.6,.58]);for(const [y,dir] of[[2.15,1],[1.8,-1]]){a('box',dir*.45,y,0,.95,.26,.05,[.98,.8,.1]);a('box',dir*.95,y,0,.14,.18,.05,[.98,.8,.1],0,0,PI/4);a('box',dir*.45,y,.03,.7,.05,.01,[.15,.15,.15]);}a('box',0,2.45,0,.4,.18,.05,[.9,.9,.88]);}
 // Schmaler Baumstamm mitten in der Spur (nur ausweichen).
 function trunk(){a('cylinder',0,2.5,0,.32,5,.32,bark);a('cylinder',0,.15,0,.48,.3,.48,barkDark);a('sphere',0,.35,.25,.25,.15,.2,moss);a('spruce',0,4.2,0,1.6,4.6,1.6,[1,1,1]);}
 // Baumstamm auf zwei Stümpfen auf Kopfhöhe (darunter rutschen).
 function highLog(){for(const x of[-4,4]){a('cylinder',x,.85,0,.4,1.7,.4,barkDark);a('cylinder',x,1.72,0,.42,.05,.42,[.75,.6,.4]);}a('cylinder',0,2.05,0,.38,8.6,.38,bark,0,0,PI/2);for(let k=-3;k<=3;k++)a('sphere',k*1.1,2.4,.1,.22,.12,.18,moss);}
 // Kleiner Gebirgsbach quer über den Weg (drüberspringen).
 function stream(time){a('box',0,.03,0,8.8,.04,1.9,[.16,.42,.5,26]);for(let k=0;k<6;k++){const ph=(time*1.4+k*.17)%1;a('box',-4+ph*8,.07,(k%3-1)*.5,.6,.02,.08,[.85,.95,1,49]);}for(const x of[-3.6,-1.2,1.4,3.5])a('rock',x,.08,(x>0?.7:-.7),.35,.18,.3,[.45,.48,.46],0,x);}
 function deer(run,id=0){const g=Math.sin(run*13+id);push(0,Math.abs(g)*.25,0,g*.08);a('sphere',0,1.3,0,.36,.4,.8,[.62,.4,.22]);a('sphere',0,1.12,0,.28,.24,.6,[.82,.7,.55]);a('cylinder',0,1.75,.65,.12,.6,.12,[.62,.4,.22],-.6);a('sphere',0,2.05,.95,.18,.2,.3,[.62,.4,.22]);a('sphere',0,1.98,1.2,.08,.08,.08,[.1,.08,.06]);for(const s of[-1,1]){a('sphere',s*.12,2.27,.88,.06,.16,.04,[.55,.36,.2]);a('cylinder',s*.08,2.42,.86,.025,.25,.025,[.82,.75,.6],0,0,s*.3);}a('sphere',0,1.5,-.78,.12,.12,.1,[.97,.95,.92]);for(const [x,z,ph] of[[-.2,.5,0],[.2,.5,PI],[-.2,-.55,PI],[.2,-.55,0]]){push(x,1.05,z,Math.sin(run*13+ph+id)*.7,0,0);a('cylinder',0,-.5,0,.06,1,.06,[.5,.32,.18]);pop();}pop();}
 function squirrel(run,id=0,nuts=false){const hop=Math.abs(Math.sin(run*10+id))*.35;push(0,hop,0);const red=[.72,.32,.12];a('sphere',0,.35,0,.2,.22,.32,red);a('sphere',0,.55,.25,.15,.15,.16,red);a('sphere',0,.5,.39,.05,.05,.05,[.15,.1,.08]);for(const s of[-1,1])a('cone',s*.08,.72,.24,.04,.12,.04,red);a('sphere',0,.75,-.3,.2,.4,.18,[.8,.4,.16],-.5);a('sphere',0,.3,.08,.12,.12,.12,[.92,.82,.66]);if(nuts){a('sphere',.18,.42,.18,.16,.16,.16,[.55,.33,.15]);a('sphere',.12,.62,.12,.1,.1,.1,[.67,.43,.2]);}pop();}
 // Fallender Ast: Schatten auf der Spur, dann fällt er von oben (drop 0 = noch oben, 1 = am Boden).
 function fallingBranch(drop,time){a('sphere',0,.04,0,1.2-drop*.3,.02,.7,[.05,.08,.05]);const y=.4+(1-drop)*(1-drop)*7,shake=drop<=0?Math.sin(time*30)*.1:0;push(shake,y,0,0,0,drop*.25);a('cylinder',0,0,0,.16,2.6,.16,bark,0,0,PI/2);for(let k=-2;k<=2;k++){a('cylinder',k*.5,.25,.12,.05,.7,.05,bark,.6,0,.3*k);a('sphere',k*.5,.55,.2,.4,.22,.3,leaf);}pop();}

 function woodPiece(time,id){a('ring',0,.06,0,.6,.6,.04,[.95,.75,.4,49],PI/2);push(0,1.05+Math.sin(time*3+id)*.08,0,0,time*2+id);a('cylinder',0,0,0,.28,.18,.28,[.55,.38,.22],PI/2);a('cylinder',0,0,.095,.24,.01,.24,[.86,.7,.48],PI/2);a('ring',0,0,.1,.12,.12,.01,[.6,.42,.25],PI/2);pop();}
 // ---------- Waldkulisse ----------
 // Herbstbaum mit bunten Blättern.
 function autumnTree(size,k){const cols=[[.9,.45,.1],[.85,.2,.12],[.95,.75,.15],[.7,.35,.1]];a('cylinder',0,1.6*size,0,.18*size,3.2*size,.18*size,bark);for(let j=0;j<4;j++){const c=cols[(k+j)%4];a('sphere',Math.cos(j*1.7)*.8*size,3.3*size+(j%2)*.5*size,Math.sin(j*1.7)*.8*size,1.2*size,1*size,1.2*size,c);}}
 // Moosbewachsener Felsen.
 function mossRock(size,k){a('rock',0,.3*size,0,1.6*size,.9*size,1.3*size,[.42,.44,.42],0,k);a('sphere',0,.75*size,0,1.2*size,.3*size,1*size,moss);}
 // Wasserfall an einer Felswand mit Becken.
 function waterfall(time){a('rock',0,4,0,7,8.5,3,[.4,.42,.4],0,.3);a('box',0,4,1.7,1.8,8,.25,[.75,.9,1,49]);for(let k=0;k<6;k++){const ph=(time*1.8+k*.17)%1;a('box',(k%3-1)*.5,8-ph*8,1.85,.3,.6,.05,[.95,.98,1,49]);}a('cylinder',0,.05,3.6,3.2,.1,2.4,[.16,.42,.5,26]);for(let k=0;k<6;k++){const ph=(time*2+k*.3)%1;a('sphere',Math.cos(k)*1.2*ph,.3+ph*.8,2.4+Math.sin(k)*.6,.25+ph*.3,.2,.25+ph*.3,[.95,.98,1,49]);}}
 // Sonnenstrahl durch die Baumkronen (dünner, heller Lichtstreifen).
 function sunRay(){a('box',0,6,0,.7,13,.25,[1,.93,.65,49],0,0,.35);}
 // Nebelschwade zwischen den Bäumen.
 function wisp(time,k){a('sphere',Math.sin(time*.3+k)*1.5,.9+Math.sin(time*.5+k)*.2,0,3.2,.6,1.6,[.88,.92,.92,49]);}
 return{boar,dust,nut,mushroom,plank,rail,brokenPlank,roots,sign,trunk,highLog,stream,fallingBranch,autumnTree,mossRock,waterfall,sunRay,wisp};
}
