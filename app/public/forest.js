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
 return{boar,dust,nut,mushroom,plank,rail,brokenPlank};
}
