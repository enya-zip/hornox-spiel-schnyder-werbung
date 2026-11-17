// Level 3 (Zum See): Fische, Angelhaken und die Angel des wütenden Fischers – aus einfachen Formen.
export function createLake(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const scale=[.55,.66,.72],belly=[.86,.88,.84],fin=[.42,.50,.56],eye=[.04,.04,.05],trout=[.78,.42,.38];

 // Forelle; Kopf zeigt in +z. wiggle bewegt die Schwanzflosse.
 function fish(time,id=0,size=1){
  const wiggle=Math.sin(time*16+id)*.45;push(0,0,0,0,0,0,size);
  a('sphere',0,0,0,.2,.24,.62,scale);
  a('sphere',0,-.06,.05,.16,.14,.5,belly);
  a('box',0,.02,0,.21,.05,.5,trout);
  a('sphere',0,.03,.48,.15,.17,.2,scale);
  for(const side of[-1,1]){a('sphere',side*.12,.07,.55,.035,.035,.03,eye);a('box',side*.16,-.08,.2,.16,.02,.14,fin,0,side*.5,side*.4);}
  a('box',0,.25,0,.02,.16,.28,fin,.2);
  push(0,0,-.58,0,wiggle);a('box',0,0,-.14,.03,.36,.24,fin);pop();
  pop();
 }

 // Gefangener Fisch zum Einsammeln: zappelt über der Spur, mit Leuchtring.
 function pickup(time,id){
  const y=1.25+Math.abs(Math.sin(time*5+id))*.35;
  a('ring',0,.06,0,.75,.75,.05,[.45,.8,1,49],PI/2);
  push(0,y,0,0,time*1.6+id,Math.sin(time*9+id)*.5);fish(time,id,1.15);pop();
 }

 // Angelhaken im Boden mit rot-weissem Schwimmer.
 function hook(time,id){
  const bob=Math.sin(time*6+id)*.06;
  a('ring',0,.05,0,.6,.6,.04,[.9,.95,1,49],PI/2,0,time);
  a('cylinder',0,.55,0,.025,1.1,.025,[.72,.74,.78]);
  a('ring',0,.12,.12,.16,.16,.035,[.72,.74,.78],0,PI/2);
  a('sphere',0,1.25+bob,0,.17,.17,.17,[.9,.12,.12]);
  a('sphere',0,1.42+bob,0,.12,.1,.12,[.97,.97,.95]);
 }

 // Angelrute in der Hand des Fischers (lokal: Fischer schaut in +z).
 function rod(swing){
  push(.32,1.25,.15,.9-swing,0,.1);
  a('cylinder',0,1.4,0,.035,2.8,.035,[.35,.24,.14]);
  a('cylinder',0,.15,0,.06,.3,.06,[.12,.12,.13]);
  a('ring',.07,.35,0,.07,.07,.03,[.7,.72,.76],0,PI/2);
  pop();
 }

 // Hut des Fischers.
 function hat(){a('cylinder',0,0,0,.33,.04,.33,[.25,.32,.22]);a('cylinder',0,.1,0,.2,.2,.2,[.25,.32,.22]);a('box',.12,.13,.05,.02,.1,.06,[.85,.6,.2]);}

 // Angelschnur als Kette kleiner Kugeln zwischen zwei Punkten, mit Durchhang.
 function line(x0,y0,z0,x1,y1,z1,sag=1.2){
  for(let i=1;i<18;i++){const t=i/18,y=y0+(y1-y0)*t-Math.sin(t*PI)*sag;a('sphere',x0+(x1-x0)*t,y,z0+(z1-z0)*t,.025,.025,.025,[.92,.92,.88,49]);}
 }
 return{fish,pickup,hook,rod,hat,line};
}
