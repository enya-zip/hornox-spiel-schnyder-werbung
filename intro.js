export const INTRO_DURATION=5.4;
export const COUNTDOWN_DURATION=3;
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
// Deterministic choreography. Coordinates share the actual game world.
export function introFrame(seconds,mobile=true,reduced=false){
 const t=Math.max(0,Math.min(INTRO_DURATION,seconds)),exit=smooth((t-.45)/2.2),orbit=smooth((t-1.6)/3.8),z=13.75*(1-exit),angle=Math.PI*(1-orbit),endRadius=mobile?10.3:9.5,radius=25+(endRadius-25)*orbit;
 const endHeight=mobile?5.1:4.7,aim=smooth((orbit-.78)/.22);
 let eye=[Math.sin(angle)*radius,6.2+(endHeight-6.2)*orbit+Math.sin(orbit*Math.PI)*4.7,z+Math.cos(angle)*radius],target=[0,4.8-3.0*smooth(orbit*2)-.55*aim,z-11*aim];
 if(t===INTRO_DURATION){eye=[0,endHeight,endRadius];target=[0,1.25,-11];}
 if(reduced){eye=t<3?[0,6.2,-11.25]:[0,endHeight,endRadius];target=t<3?[0,4.8,10]:[0,1.25,-11];}
 return{z,runDistance:(13.75-z)/.52,walking:t>.45&&t<2.65,doorOpen:smooth(t/.45)*(1-smooth((t-3)/1.0)),eye,target,orbitDegrees:180*orbit};
}
