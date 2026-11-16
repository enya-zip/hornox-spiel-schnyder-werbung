export function createPowerups(r){const a=r.add,push=r.push,pop=r.pop,PI=Math.PI,gold=[1,.73,.20,9],mint=[.23,.85,.75,49],blue=[.31,.69,.84,49];
 function pickup(kind,time,id){const y=1.6+Math.sin(time*2.4+id)*.10;push(0,y,0,0,Math.sin(time+id)*.20);
  const c=kind==='shieldOrb'?blue:kind==='rushCharge'?[.73,.43,1,49]:kind==='coinBoost'?gold:mint;a('ring',0,0,0,.62,.62,.15,c);a('ring',0,0,0,.70,.70,.08,c,0,PI/2);
  if(kind==='shieldOrb'){a('roundedBox',0,.02,0,.60,.67,.16,[.13,.36,.61,25],0,0,PI/4);a('box',0,.06,.12,.08,.46,.05,[.92,.97,1,49]);a('box',0,.10,.12,.35,.08,.05,[.92,.97,1,49]);}
  else if(kind==='coinBoost'){for(const x of[-.19,.19]){a('cylinder',x,0,0,.22,.09,.22,gold,PI/2);a('ring',x,0,.06,.15,.15,.10,[1,.92,.55,9]);}for(const sign of[-1,1])a('box',0,0,.14,.075,.42,.04,[1,.96,.78,49],0,0,sign*PI/4);}
  else if(kind==='rushCharge'){for(const [x,y,rz]of[[.10,.22,-.5],[0,0,1.05],[-.10,-.22,-.5]])a('box',x,y,.04,.14,.40,.10,[1,.92,.62,49],0,0,rz);}
  else{for(let i=0;i<=8;i++){const t=PI+i*PI/8;a('sphere',Math.cos(t)*.28,Math.sin(t)*.28+.12,0,.085,.085,.10,mint);}for(const x of[-.28,.28])a('box',x,.23,0,.16,.27,.17,[.94,.97,1,49]);}
  pop();}
 function aura(s,time){if(s.shield){for(const y of[.18,1.15])a('ring',0,y,0,.88,.88,.018,blue,PI/2,0,time*.5);}if(s.coinBoost>0||s.magnet>0){for(let i=0;i<3;i++){const t=time*1.7+i*PI*2/3;a('sphere',Math.cos(t)*.95,.75+Math.sin(t)*.18,Math.sin(t)*.70,.08,.08,.035,s.coinBoost>0?gold:mint,0,t);}}}
 return{pickup,aura};}
