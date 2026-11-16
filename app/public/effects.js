// Lightweight world-space particles: pooled by a hard cap, no extra textures or draw calls.
export function createEffects(r){
 let clock=0,particles=[],rings=[],landing=-10,hit=-10,lastTrail=0,reduced=false;
 const gold=[1,.78,.3,9],snow=[.81,.93,1,2],dust=[.67,.54,.35],mint=[.52,.86,.78,9];
 function burst(p,x,y,count,colour,power=1,kind='spark'){
  for(let i=0;i<count;i++){const a=i*2.399+clock,v=.6+(i%4)*.3;particles.push({x:p.x+Math.cos(p.h)*x+Math.cos(a)*.35,y,z:p.z+Math.sin(p.h)*x+Math.sin(a)*.35,vx:Math.cos(a)*v*power,vy:(.8+(i%5)*.3)*power,vz:Math.sin(a)*v*power,born:clock,life:.8+(i%5)*.12,colour,size:kind==='dust'?.10:.13,kind});}if(particles.length>96)particles.splice(0,particles.length-96);
 }
 return{
  emit(e,s,path){if(reduced)return;const p=path.frame(s.distance),x=((e.lane??s.x)-1)*2.5,z=(s.elapsed<150||s.elapsed>=600?snow:dust);
   if(e.kind==='powerStart'||e.kind==='powerClear')burst(p,x,1.8,e.kind==='powerStart'?30:18,gold,2.0);
   if(e.kind==='heart')burst(p,x,2.7,18,[1,.22,.37,49],1.5,'heart');
   if(e.kind==='pickup')burst(p,x,2.7,8,gold,1.5);
   if(e.kind==='doubleJump')burst(p,x,(s.jumpY||0)*2.2,16,mint,1.2);
   if(e.kind==='jump')burst(p,x,.12,10,z,.7,'dust');
   if(e.kind==='duck')burst(p,x,.1,7,z,.4,'dust');
   if(e.kind==='land'){landing=clock;burst(p,x,.08,15,z,.8,'dust');rings.push({x:p.x+Math.cos(p.h)*x,z:p.z+Math.sin(p.h)*x,born:clock,colour:z});}
   if(e.kind==='bump'){hit=clock;burst(p,x,2.8,8,gold,.7);}
   if(['clear','nearMiss','combo','checkpoint','arrival','summit','world','shieldHit','powerPickup'].includes(e.kind)){burst(p,x,3.1,['arrival','summit'].includes(e.kind)?40:e.kind==='combo'?24:14,e.kind==='nearMiss'?mint:gold,1.6);rings.push({x:p.x+Math.cos(p.h)*x,z:p.z+Math.sin(p.h)*x,born:clock,colour:gold});}
  },
  render(delta,origin,{paused,reduced:less,state,path}){reduced=less;if(less){particles=[];rings=[];return;}if(!paused)clock+=delta;
   if(!paused&&!state.jump&&clock-lastTrail>.15){lastTrail=clock;const p=path.frame(state.distance-1.4);burst(p,(state.x-1)*2.5+Math.sin(state.distance*1.4)*.25,state.powerTicks>0?1.4:.08,state.powerTicks>0?4:state.duck?3:1,state.powerTicks>0?gold:state.elapsed<90||state.elapsed>=630?snow:dust,state.powerTicks>0?.7:.18,state.powerTicks>0?'spark':'dust');}
   particles=particles.filter(p=>clock-p.born<p.life);for(const p of particles){const t=clock-p.born,fade=1-t/p.life,size=p.size*fade,y=Math.max(.03,p.y+p.vy*t-2*t*t);r.add(p.kind==='dust'?'sphere':p.kind==='heart'?'heart':'spark',p.x-origin.x+p.vx*t,y,p.z-origin.z+p.vz*t,size,size,size,p.colour,0,-origin.h,t*3);}
   rings=rings.filter(p=>clock-p.born<.55);for(const p of rings){const t=clock-p.born,size=.25+t*2;r.add('ring',p.x-origin.x,.045,p.z-origin.z,size,size,.03*(1-t/.55),p.colour,Math.PI/2);}
  },reset(){particles=[];rings=[];landing=hit=-10;},count:()=>particles.length,impact:()=>reduced?0:Math.max(0,1-(clock-landing)/.25),wobble:()=>reduced?0:Math.sin((clock-hit)*24)*Math.max(0,1-(clock-hit)/.5)*.1
 };
}
