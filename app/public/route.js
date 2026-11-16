// Same corner schedule as pure game rules; cached world transforms are rendering only.
export function createPath(seed,route="journey"){
 const nodes=[{d:0,x:0,z:0,h:0}];
 function direction(index){return ((seed+index*13)%5)<2?-1:1;}
 function frame(distance,out={}){
  if(distance<0){out.x=0;out.z=-distance*.5;out.h=0;return out;}
  const d=Math.max(0,distance),index=d<260?0:Math.floor((d-260)/680)+1;
  const limit=index;
  while(nodes.length<=limit){const i=nodes.length,prev=nodes[i-1],end=260+(i-1)*680,len=(end-prev.d)*.50;nodes.push({d:end,x:prev.x+Math.sin(prev.h)*len,z:prev.z-Math.cos(prev.h)*len,h:prev.h+direction(i-1)*Math.PI/2});}
  const n=nodes[limit],f=(d-n.d)*.50;out.x=n.x+Math.sin(n.h)*f;out.z=n.z-Math.cos(n.h)*f;out.h=n.h;return out;
 }
 return{frame,direction};
}

