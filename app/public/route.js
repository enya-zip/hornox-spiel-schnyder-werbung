// Level 10: ab summitTurn wechseln die Kurven immer ab (identisch zu rules.js).
export function turnDirection(seed,summitTurn,i){const base=k=>((seed+k*13)%5)<2?-1:1;return !summitTurn||i<summitTurn?base(i):base(summitTurn-1)*((i-summitTurn)%2?1:-1);}
// Same corner schedule as pure game rules; cached world transforms are rendering only.
export function createPath(seed,route="journey"){
 const nodes=[{d:0,x:0,z:0,h:0}];let summitTurn=0;
 function direction(index){return turnDirection(seed,summitTurn,index);}
 // Sobald die Regeln den Zickzack-Start kennen, werden spätere Kurven neu berechnet.
 function setSummit(t){t=t||0;if(t===summitTurn)return false;summitTurn=t;nodes.length=Math.min(nodes.length,Math.max(1,t+1));return true;}
 function frame(distance,out={}){
  if(distance<0){out.x=0;out.z=-distance*.5;out.h=0;return out;}
  const d=Math.max(0,distance),index=d<260?0:Math.floor((d-260)/680)+1;
  const limit=index;
  while(nodes.length<=limit){const i=nodes.length,prev=nodes[i-1],end=260+(i-1)*680,len=(end-prev.d)*.50;nodes.push({d:end,x:prev.x+Math.sin(prev.h)*len,z:prev.z-Math.cos(prev.h)*len,h:prev.h+direction(i-1)*Math.PI/2});}
  const n=nodes[limit],f=(d-n.d)*.50;out.x=n.x+Math.sin(n.h)*f;out.z=n.z-Math.cos(n.h)*f;out.h=n.h;return out;
 }
 return{frame,direction,setSummit};
}

