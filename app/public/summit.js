// Level 10 (Matterhorn): Steinbock, Krähe und die zwei neuen Power-ups
// Kletterausrüstung und Schneeschuhe – aus einfachen Formen gebaut.
export function createSummit(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const fur=[.55,.43,.31],furDark=[.36,.27,.19],belly=[.80,.72,.60],horn=[.42,.36,.28],hoof=[.12,.10,.09],eye=[.05,.05,.05];
 const black=[.07,.07,.09],sheen=[.16,.17,.24],beak=[.20,.19,.17];

 // Steinbock. jump: 0..1 Sprungphase (für angezogene Beine), time für leichte Bewegung.
 function ibex(time,jump=0,id=0){
  const tuck=Math.sin(Math.min(1,jump)*PI)*.35,breathe=Math.sin(time*2+id)*.015;
  a('sphere',0,1.05+breathe,0,.42,.42,.78,fur);
  a('sphere',0,.92+breathe,.05,.34,.30,.62,belly);
  a('sphere',0,1.18,-.55,.30,.30,.34,fur);
  // Hals und Kopf
  a('cylinder',0,1.42,.55,.15,.55,.15,fur,-.55);
  a('sphere',0,1.72,.78,.18,.19,.27,fur);
  a('sphere',0,1.64,.98,.11,.10,.13,furDark);
  a('sphere',0,1.52,.86,.07,.12,.06,furDark); // Bart
  for(const side of[-1,1]){
   a('sphere',side*.13,1.78,.88,.03,.03,.03,eye);
   a('sphere',side*.16,1.86,.68,.04,.09,.03,fur,0,0,side*.8); // Ohr
   // Grosse, nach hinten gebogene Hörner aus Segmenten
   for(let k=0;k<7;k++){const t=k/6,ang=-.2-t*2.3,rad=.55;a('sphere',side*(.08+t*.06),1.88+Math.sin(-ang)*rad*.55,.70+Math.cos(ang)*rad*.55-.30,.07-t*.03,.07-t*.03,.09-t*.03,horn);}
  }
  // Beine (beim Sprung angezogen)
  for(const [x,z]of[[-.2,.48],[.2,.48],[-.2,-.5],[.2,-.5]]){
   const swing=jump>0?0:Math.sin(time*1.2+x+z)*.03;
   a('cylinder',x,.42+tuck*.5,z+(z>0?tuck*.3:-tuck*.3),.07,.78-tuck,.07,furDark,(z>0?-1:1)*tuck+swing);
   a('box',x,.05+tuck*.85,z+(z>0?tuck*.45:-tuck*.45),.09,.08,.11,hoof);
  }
  a('sphere',0,1.22,-.82,.07,.12,.06,furDark); // Schwanz
 }

 // Krähe mit schlagenden Flügeln.
 function crow(time,id=0){
  const flap=Math.sin(time*14+id)*.75,bob=Math.sin(time*7+id)*.08;
  push(0,bob,0);
  a('sphere',0,0,0,.24,.22,.42,black);
  a('sphere',0,.1,.36,.17,.17,.18,black);
  a('cone',0,.07,.58,.06,.2,.06,beak,PI/2);
  for(const side of[-1,1]){
   a('sphere',side*.09,.16,.47,.03,.03,.03,[.85,.8,.3]);
   push(side*.18,.05,0,0,0,side*flap);
   a('box',side*.42,0,0,.82,.035,.38,black);
   a('box',side*.78,-.02,-.05,.36,.03,.28,sheen);
   pop();
  }
  a('box',0,-.02,-.5,.22,.03,.32,black,-.15);
  for(const side of[-1,1])a('cylinder',side*.07,-.24,.05,.02,.2,.02,beak);
  // Gestohlene Münze im Schnabel
  a('cylinder',0,.02,.72,.09,.025,.09,[1,.74,.24,9],PI/2);
  pop();
 }

 // Power-up-Symbole, schweben wie die anderen Pickups.
 function pickup(kind,time,id){
  const y=1.6+Math.sin(time*2.4+id)*.10;push(0,y,0,0,time*1.2+id);
  const ring=kind==='climbGear'?[1,.55,.15,49]:[.55,.85,1,49];
  a('ring',0,0,0,.66,.66,.13,ring);a('ring',0,0,0,.74,.74,.07,ring,0,PI/2);
  if(kind==='climbGear'){
   // Seilrolle, Karabiner und Helm
   for(let k=0;k<3;k++)a('ring',0,-.08+k*.07,0,.30-k*.03,.30-k*.03,.06,[.92,.36,.18],PI/2);
   a('ring',.30,.12,.05,.13,.2,.05,[.82,.85,.88,49]);
   a('sphere',-.05,.3,0,.24,.17,.26,[.96,.82,.15]);a('box',-.05,.2,0,.5,.03,.5,[.96,.82,.15]);
  }else{
   // Zwei Schneeschuhe
   for(const x of[-.16,.16]){a('ring',x,0,0,.14,.32,.05,[.28,.22,.16],PI/2,0,x>0?.12:-.12);a('box',x,0,0,.2,.02,.48,[.78,.86,.92],0,x>0?.12:-.12);a('box',x,.05,.02,.16,.06,.14,[.15,.35,.6],0,x>0?.12:-.12);}
  }
  pop();
 }

 // Sichtbarer Effekt um Hornox, solange ein Level-10-Power-up aktiv ist.
 function aura(s,time){
  if(s.climb>0){const blink=s.climb<40&&Math.sin(time*18)>0;if(!blink)for(const y of[.35,1.0,1.65])a('ring',0,y,0,.95,.95,.025,[1,.55,.15,49],PI/2,0,time*.8+y);}
  if(s.shoes>0){for(let i=0;i<4;i++){const t=time*3+i*PI/2;a('sphere',Math.cos(t)*.55,.08,Math.sin(t)*.55,.12,.06,.12,[.9,.96,1,49]);}}
 }
 // Schneeschuh unter einem Fuss: Holzrahmen, Bespannung und Riemen.
 function snowshoe(){
  a('ring',0,0,0,.3,.6,.07,[.30,.22,.14],PI/2);
  a('box',0,-.01,0,.46,.03,.98,[.86,.92,.97]);
  for(const z of[-.28,0,.28])a('box',0,.01,z,.54,.035,.045,[.30,.22,.14]);
  a('box',0,.09,.03,.3,.08,.2,[.15,.35,.6]);
 }
 return{ibex,crow,pickup,aura,snowshoe};
}
