import {createAlpine} from './alpine.js?v=17';
import {createPowerups} from './powerups.js?v=17';
import {createSummit} from './summit.js?v=3';
import {createLake} from './lake.js?v=5';
import {createEncounters} from './encounters.js?v=20';
import {createSpecials} from './specials.js?v=17';
import {introFrame} from './intro.js?v=17';
import {createArchitecture} from './world3d.js?v=17';
import {createRenderer} from './engine3d.js?v=21';
import {createActor} from './actor.js?v=22';
import {createEffects} from './effects.js?v=17';
import {createPath} from './route.js?v=21';
import {getZone} from './journey.js?v=17';
export {getZone};
const PI=Math.PI,C={ice:[.74,.87,.9,10],grass:[.44,.58,.30,11],gravel:[.7,.63,.48,12],cobble:[.65,.66,.61,13],snow:[.86,.92,.94,2],rock:[.48,.52,.53,1],wood:[.32,.22,.15,4],gold:[1,.74,.24,9],dark:[.12,.2,.23],fir:[1,1,1,7],red:[.85,.16,.19],flower:[.97,.85,.40]};
export function createScene(canvas){
 const r=createRenderer(canvas),a=r.add,push=r.push,pop=r.pop,fx=createEffects(r),arch=createArchitecture(r),special=createSpecials(r),encounters=createEncounters(r),alpine=createAlpine(r),powerups=createPowerups(r),summit=createSummit(r),lake=createLake(r);let actor,showcase,npc={},path,key='',origin={x:0,z:0,h:0},lane=1,cam=0,jump=0,lastD=0,anim=0,visibleActor,instances=[],zone=3,trackD=0,grade=0,streetBuildings=[],cinematic=null,cinematicMetrics=null,rushFov=0,tossed=[],touristGroups=[],flamingoInstances=0;const placementCache=new Map(),clearCache=new Map();let visualSubtick=0,mtn=null,mtnFade=0;
 const ready=Promise.all([r.ready,createActor(r.gl,'assets/hornox-run.glb','assets/hornox-jump.glb',{brand:true}),createActor(r.gl,'assets/hornox-showcase.glb',null,{brand:true}),...['sheep','marmot','hiker','bike'].map((name,i)=>createActor(r.gl,'assets/'+(name==='hiker'?'hiker-standing':name)+'.glb',null,{height:[1.5,.85,2.35,2.4][i],walk:name==='hiker'}))]).then(([,run,still,...models])=>{actor=run;showcase=still;['sheep','marmot','hiker','bike'].forEach((n,i)=>npc[n]=models[i]);visibleActor=still;r.setExtra((pass,ctx)=>{for(const ins of instances){ins.actor.update(ins.pose);ins.actor.draw(pass,ctx);}visibleActor.draw(pass,ctx);});});
 // Level 10: pyramidenförmiger Gipfel (wie das Matterhorn). Der Zickzack-Weg verläuft nur in zwei
 // Richtungen auf den Gipfel zu, daher steigt er mit der L1-Distanz gleichmässig bis zur Spitze an.
 // Der Bergfuss ist weich gerundet (Breite 300), damit die grobe Bodenfläche nie über dem Weg liegt.
 function peak(X,Z){if(!mtn)return 0;const l=Math.abs(X-mtn.x)+Math.abs(Z-mtn.z),t=mtn.R-Math.max(l,mtn.p),W=300,f=t>=W?t:t<=-W?0:(t+W)*(t+W)/(4*W);return mtnFade*mtn.k*f;}
 function groundY(x,z){return grade*(x*.55-z*.83)+(mtn?peak(x+origin.x,z+origin.z)-peak(origin.x,origin.z):0);}
 function at(d,offset=0,y=0){const p=path.frame(d);const x=p.x-origin.x+Math.cos(p.h)*offset,z=p.z-origin.z+Math.sin(p.h)*offset;push(x,y+groundY(x,z),z,0,-p.h);return p;}
 function point(d,offset=0){const p=path.frame(d);const x=p.x-origin.x+Math.cos(p.h)*offset,z=p.z-origin.z+Math.sin(p.h)*offset;return{x,y:groundY(x,z),z,h:p.h};}
 function tree(x,z,size,y=0){a('cylinder',x,y+2.5*size,z,.12*size,5*size,.12*size,C.wood);a('spruce',x,y+.8*size,z,2.3*size,8.1*size,2.3*size,[1,1,1]);}
 function clear(x,z,radius,anchor){const key=anchor+':'+Math.round((x+origin.x)*10)+':'+Math.round((z+origin.z)*10)+':'+radius;if(clearCache.has(key))return clearCache.get(key);let valid=true;for(let q=Math.floor((anchor-720)/8)*8;q<anchor+720;q+=8){const p=point(q);if(Math.hypot(p.x-x,p.z-z)<5+radius){valid=false;break;}}if(clearCache.size>4096)clearCache.delete(clearCache.keys().next().value);clearCache.set(key,valid);return valid;}
 function fitsStreet(w,side,off,variant){
  const key=w+':'+side+':'+off+':'+variant;if(placementCache.has(key))return placementCache.get(key);
  const frame=path.frame(w),px=frame.x+Math.cos(frame.h)*off,pz=frame.z+Math.sin(frame.h)*off,width=12.2;
  for(let q=Math.floor((w-720)/4)*4;q<w+720;q+=4){const v=path.frame(q),dx=v.x-px,dz=v.z-pz,along=dx*Math.sin(frame.h)-dz*Math.cos(frame.h),outward=(dx*Math.cos(frame.h)+dz*Math.sin(frame.h))*side;if(Math.abs(along)<width*.5+4.4&&outward>-5.8&&outward<12.5){placementCache.set(key,false);return false;}}
  placementCache.set(key,true);return true;
 }
 function road(d,elapsed,speed){
  const ds=[];for(let w=Math.floor((d-32)/8)*8;w<d+650;w+=8)ds.push(w);
  const i=Math.max(0,Math.floor((d-260)/680));for(let j=i;j<i+4;j++){const v=260+j*680;if(v>ds[0]&&v<ds[ds.length-1])ds.push(v);}ds.sort((a,b)=>a-b);const points=[...new Set(ds)],batches=[[],[],[],[]],terrain=[],pavement=[];
  const edges=(w,width=4.15)=>{const p=point(w),before=path.frame(w-.01).h,after=path.frame(w+.01).h;let nx=Math.cos(before)+Math.cos(after),nz=Math.sin(before)+Math.sin(after);const denom=1+Math.cos(before-after);nx=nx/denom*width;nz=nz/denom*width;return[[p.x-nx,groundY(p.x-nx,p.z-nz),p.z-nz],[p.x+nx,groundY(p.x+nx,p.z+nz),p.z+nz]];};
  for(let i=0;i<points.length-1;i++){const w=points[i],z=getZone(Math.max(0,elapsed+(w-d)/speed)),wd=z===7?3.3:4.15,e=edges(w,wd),f=edges(points[i+1],wd),out=batches[[4,6,7,8,9,10].includes(z)?1:z===5?0:z];for(const p of[e[0],f[0],e[1],e[1],f[0],f[1]])out.push(...p,0,1,0,1,1,1);}
  for(let i=0;i<points.length-1;i++)if([2,3].includes(getZone(Math.max(0,elapsed+(points[i]-d)/speed)))){const inner=edges(points[i],4.17),outer=edges(points[i],6.30),nextInner=edges(points[i+1],4.17),nextOuter=edges(points[i+1],6.30);for(let side=0;side<2;side++){const quad=[inner[side],outer[side],nextOuter[side],nextInner[side]].map(p=>[p[0],p[1]+.075,p[2]]);for(const j of[0,1,2,0,2,3])pavement.push(...quad[j],0,1,0,.60,.61,.57);const lo=[inner[side],nextInner[side]],hi=lo.map(p=>[p[0],p[1]+.075,p[2]]);for(const p of[lo[0],hi[0],hi[1],lo[0],hi[1],lo[1]])pavement.push(...p,0,1,0,.85,.86,.84);}}
  r.setGeometry('pavement',pavement,24);
  const cell=mtn?90:grade===0?3600:300,gx=mtn?Math.floor((origin.x-mtn.x-1800)/cell)*cell+mtn.x-origin.x:-1800,gz=mtn?Math.floor((origin.z-mtn.z-1800)/cell)*cell+mtn.z-origin.z:-1800;for(let x=gx;x<gx+3600;x+=cell)for(let z=gz;z<gz+3600;z+=cell){const v=(xx,zz)=>[xx,groundY(xx,zz)-(mtn?1.1:.27),zz];const a=v(x,z),b=v(x+cell,z),c=v(x+cell,z+cell),e=v(x,z+cell);if(!mtn){for(const p of[a,e,c,a,c,b])terrain.push(...p,0,1,0,1,1,1);continue;}
   // Bergflanken: echte Flächennormalen für Licht/Schatten, unten Fels, oben Schnee.
   for(const tri of[[a,e,c],[a,c,b]]){const[p0,p1,p2]=tri,ux=p1[0]-p0[0],uy=p1[1]-p0[1],uz=p1[2]-p0[2],vx=p2[0]-p0[0],vy=p2[1]-p0[1],vz=p2[2]-p0[2];let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;let nl=Math.hypot(nx,ny,nz)||1;if(ny<0)nl*=-1;nx/=nl;ny/=nl;nz/=nl;
    const cx=(p0[0]+p1[0]+p2[0])/3+origin.x,cz=(p0[2]+p1[2]+p2[2])/3+origin.z,top=mtn.k*(mtn.R-mtn.p)*mtnFade||1,h=peak(cx,cz)/top,snow=Math.max(0,Math.min(1,(h-.45)/.3)),col=[.46+.54*snow,.43+.57*snow,.41+.59*snow];
    for(const q of tri)terrain.push(...q,nx,ny,nz,...col);}}
  r.setGeometry('terrain',terrain,18);batches.forEach((b,i)=>r.setGeometry('road'+i,b,19));
 }
 function flowers(x,z,w,y=0){push(x,y,z);for(let k=0;k<5;k++){const sx=Math.sin(w+k*7)*.7,sz=Math.cos(w+k*11)*.7,h=.15+(k%3)*.1;a('box',sx,h/2,sz,.018,h,.018,[.22,.38,.18]);a('sphere',sx,h,sz,.065,.035,.065,k%2?C.flower:[.86,.89,.97]);}pop();}
 function landscape(d,elapsed){
  // One sky and solid mountains, all rendered through the same camera and depth buffer.
  a('sky',0,0,0,5000,5000,5000,[1,1,1,28]);
  const shiftX=origin.x*.023,shiftZ=origin.z*.023;
  for(let k=0;k<12;k++){const ang=k*PI/6+.13,rad=2100+(k%3)*150;a('mountain',Math.sin(ang)*rad-shiftX,-55,Math.cos(ang)*rad-shiftZ,950+(k%3)*110,480+(k%4)*65,950,[1,1,1,29],0,ang*.3);}
  a('matterhorn',-220-shiftX,-45,-3200-shiftZ,510,850,580,[1,1,1,29],0,.18);
  // Opaque ground meets the mountain feet; there is no horizon alpha mask.

 }
 function street(d,elapsed,speed){streetBuildings=[];
  const ct=72,relaxed=speed<19,cd=(relaxed?14:19)*ct+ct*ct/84;
  const start=Math.floor((d-40)/26)*26;
  for(let w=start;w<d+460;w+=26){
   const ahead=(w-d)/speed,t=Math.max(0,elapsed+ahead),z=getZone(t);if(z!==2&&z!==3)continue;
   const index=Math.round(w/26),detail=Math.abs(w-d)<105;
   for(const side of[-1,1]){
    // Continuous pavement mesh above follows road corners without overlapping slabs.
    if(w<205&&side<0||w<105&&side>0||side<0&&Math.abs(w-cd)<36)continue;
    const bw=w+(side>0?13:0),off=side*(z===2?7.0:8.5),p=point(bw,off);
    const variant=(Math.abs(index)*3+(side>0?2:0))%7;if(!fitsStreet(bw,side,off,variant))continue;
    push(p.x,p.y,p.z,0,(side<0?PI/2:-PI/2)-p.h);streetBuildings.push({id:bw+':'+side,w:bw,brand:(Math.abs(index)+(side>0?3:0))%7});r.prefab('building-'+variant+'-'+(Math.abs(index)+(side>0?3:0))%7+'-'+detail,()=>arch.building(variant,detail,!detail,(Math.abs(index)+(side>0?3:0))%7));pop();
    if(index%3===0&&w<d+270){at(w+10,side*5.8);arch.lamp();if(index%6===0){push(side*.8,0,-1.2);arch.flag(anim);pop();}pop();}
   }
  }
  // Alpen Resort is a unique landmark at the start, not a repeating hotel prop.
  if(d<90){
   // The photographed entrance faces the initial running direction; camera can orbit it.
   const back=point(0);push(back.x,back.y,back.z+13,0,PI);arch.hotel(true,cinematic?.doorOpen||0);arch.entranceTerrace();pop();
  }
  // The village church is passed once toward the end of Bahnhofstrasse.
  if(elapsed>55&&elapsed<90&&Math.abs(cd-d)<280){const p=point(cd,-11);const center=point(cd,-18);if(clear(center.x,center.z,8,cd)){push(p.x,p.y,p.z,0,PI/2-p.h);arch.church();pop();}}
 }
 // Level 3: See links vom schmalen Wanderweg, mit Ufersteinen und Schilf.
 function lakeside(d,elapsed,speed){
  for(let w=Math.floor((d-40)/10)*10;w<d+440;w+=10){
   if(getZone(Math.max(0,elapsed+(w-d)/speed))!==7)continue;const k=Math.floor(w/10);
   // Wasserplatten folgen der Geländeneigung, damit keine Stufen/Streifen entstehen.
   const h=path.frame(w).h,sx=grade*(.55*Math.cos(h)-.83*Math.sin(h)),sz=grade*(-.55*Math.sin(h)-.83*Math.cos(h)),tilt=()=>push(0,0,0,Math.atan(-sz),0,Math.atan(sx));
   const c=point(w,-17.5);if(clear(c.x,c.z,9.5,w)){at(w,-17.5);tilt();a('box',0,-.14,0,25,.12,10.02,[.08,.27,.34,26]);pop();pop();}
   const f=point(w,-43);if(clear(f.x,f.z,13,w)){at(w,-43);tilt();a('box',0,-.15,0,27,.12,10.02,[.08,.27,.34,26]);pop();pop();}
   if(k%2===0){at(w,-5.1);a('rock',0,-.12,0,.9,.36,1.3,C.rock,0,w);pop();}
   if(k%3===1&&w<d+220){at(w,-4.3);for(let j=0;j<5;j++){const h=.8+((k+j)%3)*.25;a('cylinder',(j-2)*.13,h/2,(j%2)*.15,.02,h,.02,[.36,.5,.24]);if(j%2===0)a('cylinder',(j-2)*.13,h,(j%2)*.15,.05,.2,.05,[.42,.27,.14]);}pop();}
  }
 }
 function environment(d,elapsed,speed){zone=getZone(elapsed);landscape(d,elapsed);road(d,elapsed,speed);street(d,elapsed,speed);lakeside(d,elapsed,speed);
  const start=Math.floor((d-22)/14)*14;
  for(let w=start;w<d+430;w+=14){const z=getZone(Math.max(0,elapsed+(w-d)/speed)),index=Math.floor(w/14),side=index%2?1:-1,off=side*(7.7+(Math.abs(index)%3)*1.4),p=point(w,off);
   if([2,3].includes(z)||z===7&&side<0||!clear(p.x,p.z,1.8,w))continue;
   if(z===0||z===5){at(w,off);a('rock',0,-.16,0,2.2,.45,3.5,C.snow,0,w*.2);if(index%3===0){a('box',0,1,0,.06,2,.06,C.wood);a('box',0,1.8,0,.09,.22,.09,C.red);}pop();}
   else if([1,6,7,8].includes(z)){if(index%3===0||z===8)tree(p.x,p.z,.65+(Math.abs(index)%4)*.12,p.y);if([6,7].includes(z)&&index%3===0){at(w,side*(z===6?10:13));push(0,0,0,0,side<0?PI/2:-PI/2,0,z===7?.83:1);alpine.chalet(Math.abs(index)%3);pop();pop();}if(z===6&&index%23===0){at(w,side*19);alpine.chapel();pop();}if(z===8&&index%29===0){at(w,side*14);alpine.bridge();pop();}if(w<d+150){flowers(p.x,p.z,w,p.y);const f=point(w,side*4.65);flowers(f.x,f.z,w+2,f.y);}at(w,side*4.9);a('box',0,.65,0,.1,1.3,.1,C.wood);a('box',0,1.03,0,.07,.07,5,C.wood);a('box',0,.60,0,.07,.07,5,C.wood);pop();if(index%7===0&&w<d+150){const q=point(w,side*7);instances.push({actor:npc.sheep,pose:{x:q.x,y:q.y,z:q.z,heading:side*PI/2,home:true}});}}
   else if([4,9,10].includes(z)){at(w,off);a('rock',0,-.25,0,1.8,.8,2.5,C.rock,0,w*.3);if(index%3===0){a('box',0,.65,0,.10,1.6,.1,C.wood);a('box',0,1.35,0,.16,.23,.16,C.red);}pop();if(z!==10&&index%5===0)tree(p.x,p.z,.38,p.y);if(z===9&&index%31===0){const lp=point(w,side*42);if(clear(lp.x,lp.z,23,w)){at(w,side*42);const h=path.frame(w).h,sx=grade*(.55*Math.cos(h)-.83*Math.sin(h)),sz=grade*(-.55*Math.sin(h)-.83*Math.cos(h));push(0,0,0,Math.atan(-sz),0,Math.atan(sx));alpine.lake(anim);pop();pop();}}if(z===10&&index%3===0){at(w,off);a('rock',0,.24,0,1.9,.33,2.6,C.snow);pop();}}
  }
  if(elapsed>=720){for(let w=Math.floor((d-10)/12)*12;w<d+390;w+=12){for(const side of[-1,1]){at(w,side*4.8);a('cylinder',0,.62,0,.035,1.25,.035,C.dark);a('cylinder',0,1.1,0,.018,6,.018,[.69,.46,.24],PI/2);pop();}}
   if(elapsed>880){const finish=d+Math.max(0,900-elapsed)*speed;at(finish);a('rock',0,-.3,-3,4.5,.7,3.5,C.snow);a('box',-3,2,-3,.24,4,.24,C.wood);a('box',-3,2.9,-3,2,.22,.22,C.wood);push(3,0,-3);arch.flag(anim);pop();pop();}
  }
 }
 function sideForHotel(){return -1;}
 function luggage(x,z,colour=[.27,.47,.38],large=false){push(x,0,z);const h=large?1.45:1.1;a('box',0,h/2+.1,0,.82,h,.6,colour);for(const side of[-1,1]){a('sphere',side*.28,.12,.21,.11,.11,.11,C.dark);a('box',side*.19,h+.3,0,.055,.45,.055,C.dark);}a('box',0,h+.52,0,.43,.06,.06,C.dark);a('box',0,h*.55,.315,.06,h*.8,.035,[.72,.69,.54]);pop();}
 function visitors(o,p,time,toss){
  const style=({photographers:1,influencer:2,lostTourists:3,scooter:4,skiers:7,snowboarders:8})[o.kind]||0;
  const file=o.formation===1&&style!==4, count=o.kind==='photographers'?3:2;
  const poses=[];touristGroups.push({kind:o.kind,count,formation:file?'file':'pair',poses});
  for(let k=0;k<count;k++){
   const lx=style===4?(k===0?-.42:.42):file?(k%2===0?-.10:.10):(k%2===0?-.46:.46);
   const lz=style===4?(k===0?.25:-1):file?-k*1.18:k===2?-1.30:-k*.22;
   const variant=(o.id||0)+k,scale=[1,.94,1.035,.97][variant%4],poseStyle=style===2?(k===0?2:5):style===3?(k===0?3:0):style===1?(k===1?5:1):style===0&&o.kind==='pedestrian'&&k===1?6:style;poses.push(poseStyle);
   const pace=time*(.94+(variant%4)*.035),sway=style===4?0:Math.sin(pace*4.6+variant*1.7)*.014,h=p.h-(toss?.spin||0);
   const x=p.x+Math.cos(h)*lx-Math.sin(h)*lz,z=p.z+Math.sin(h)*lx+Math.cos(h)*lz;
   const y=p.y+(toss?.y||0)+(style===4?.13:Math.abs(Math.sin(pace*9.2+variant*1.7))*.018);
   instances.push({actor:npc.hiker,pose:{x,y,z,heading:-PI/2-h,lean:(toss?.lean||0)+sway,time:pace,variant,heightScale:style===4?.83:scale,style:poseStyle}});
   push(x,y,z,0,-h,(toss?.lean||0)+sway,style===4?.83:scale);encounters.accessory(poseStyle,variant,pace);pop();
  }
 }
 let speedNow=16,flyingFish=[];
 function obstacle(o,d,time,toss=null){const od=o.d-(toss?0:(o.approach||0)*visualSubtick);if(!toss&&(od<d-8||od>d+180||(o.resolved&&['coin','magnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch'].includes(o.kind))))return;const off=(o.lane<0?0:(o.lane-1)*2.5)+(toss?.side||0),p=point(od,off),rise=toss?.y||0;
  if(['pedestrian','hiker','photographers','influencer','lostTourists','scooter','skiers','snowboarders'].includes(o.kind)){visitors(o,p,time,toss);if(o.kind!=='scooter')return;}
  if(o.kind==='ibex'&&!toss){
   // Steinbock galoppiert von links oder rechts auf die Piste und bleibt dann stehen (Spur kommt aus den Regeln).
   const dir=o.dir||1,waiting=dir>0?o.lane<=-2.59:o.lane>=4.59,moving=!waiting&&Math.abs(o.lane-o.target)>.01,hop=moving?Math.abs(Math.sin(time*7+o.id))*.45:0,q=point(od,(o.lane-1)*2.5);
   push(q.x,q.y+hop,q.z,0,-q.h);push(0,0,0,0,moving||waiting?dir*PI/2:0);summit.ibex(time,moving?.35+.3*Math.sin(time*14):0,o.id);pop();pop();return;}
  if(o.kind==='crow'){
   // Krähe taucht oben aus den Wolken auf und stösst auf Hornox herab.
   const gapT=Math.max(0,(od-d)/Math.max(1,speedNow+(o.approach||0)));if(!toss&&gapT>3.2)return;
   let lane=o.lane;if(o.attack==='feint'){const fake=o.swerved?o.fake:o.lane,real=o.real,u=Math.max(0,Math.min(1,(.8-gapT)/.3));lane=fake+(real-fake)*u*u*(3-2*u);}
   const low=o.attack==='snatch'?.55:1.35,y=low+Math.max(0,gapT-.7)*7.5,q=point(od,(lane-1)*2.5);
   if(gapT>2.7&&!toss)for(let k=0;k<5;k++)a('sphere',q.x+Math.sin(k*2.1)*1.2,q.y+y+.4+Math.cos(k*1.7)*.4,q.z,1.1-k*.12,.55,1.1-k*.12,[.97,.98,1,49]);
   push(q.x,q.y+y+(toss?toss.y||0:0),q.z,0,-q.h);if(toss)push(0,0,0,0,toss.spin,toss.lean);push(0,0,0,gapT>.7?.55:0,0);summit.crow(time,o.id);pop();if(toss)pop();pop();return;}
  if(o.kind==='fish'&&!toss){
   // Gefährlicher Springfisch: Erst schiesst eine Wasserfontäne aus dem See (Vorwarnung),
   // dann springt der grüne Zähnefisch im Bogen auf seine Spur und zieht eine Wasserspur nach.
   const target=o.target??1,span=target+2.4,u=Math.max(0,Math.min(1,(o.lane+2.4)/span)),q=point(od,(o.lane-1)*2.5),src=point(od,-3.4*2.5+2.5);
   const gapT=(od-d)/Math.max(1,speedNow),leapT=span/3.2,pre=Math.max(0,Math.min(1,(leapT+.8-gapT)/.8));
   if(u<=0){if(od-d<160){push(src.x,src.y-.05,src.z);lake.fountain(time,pre*4,o.id);pop();}return;}
   if(u<.75){push(src.x,src.y-.05,src.z);lake.fountain(time,4*(1-u/.75),o.id);pop();}
   if(u<1){const y=.55+Math.sin(u*PI)*2.6;for(let k=1;k<6;k++){const uu=Math.max(0,u-k*.05),tq=point(od,(-2.4+uu*span-1)*2.5);a('sphere',tq.x,tq.y+.55+Math.sin(uu*PI)*2.6,tq.z,.12-k*.015,.12-k*.015,.12-k*.015,[.8,.93,1,49]);}
    push(q.x,q.y+y,q.z,0,-q.h);push(0,0,0,0,PI/2,0);push(0,0,0,(u-.5)*1.2,0,0);lake.biter(time,o.id,1.6);pop();pop();pop();return;}
   push(q.x,q.y+.4+Math.abs(Math.sin(time*9+o.id))*.25,q.z,0,-q.h+o.id);push(0,0,0,0,0,PI/2);lake.biter(time,o.id,1.35);pop();pop();return;}
  if(o.kind==='beaverLog'&&!toss){
   // Biber rollt einen Baumstamm vom Seeufer quer über den ganzen Weg (drüberspringen!).
   const gapT=(od-d)/Math.max(1,speedNow),u=Math.max(0,Math.min(1,(2.6-gapT)/1.1)),e=u*u*(3-2*u),lat=-9.5*(1-e),q=point(od,lat);
   push(q.x,q.y,q.z,0,-q.h);a('cylinder',0,.42,0,.36,8.2,.36,C.wood,0,0,PI/2);for(const x of[-4.1,4.1])a('cylinder',x,.42,0,.37,.06,.37,[.62,.47,.3],0,0,PI/2);pop();
   const b=point(od,-6.4-(1-e)*1.5);push(b.x,b.y,b.z,0,-q.h-PI/2);lake.beaver(time,u>0&&u<1?1:0);pop();return;}
  if(o.kind==='gull'){
   // Möwe stösst über dem See herab und will Fische aus dem Rucksack stehlen.
   const gapT=Math.max(0,(od-d)/Math.max(1,speedNow+(o.approach||0)));if(!toss&&gapT>3.2)return;
   const y=1.45+Math.max(0,gapT-.7)*6.5,lat=(o.lane-1)*2.5-Math.max(0,gapT-1.2)*4,q=point(od,lat);
   push(q.x,q.y+y+(toss?toss.y||0:0),q.z,0,-q.h);if(toss)push(0,0,0,0,toss.spin,toss.lean);push(0,0,0,gapT>.7?.5:0,0);lake.gull(time,o.id);pop();if(toss)pop();pop();return;}
  if(o.kind==='flamingo')flamingoInstances++;
  const model=o.kind==='scooter'?null:o.kind;
  if(npc[model]){const animal=['marmot','sheep'].includes(o.kind),idle=model==='hiker';instances.push({actor:npc[model],pose:{x:p.x,z:p.z,y:p.y+rise+(animal?Math.abs(Math.sin(time*(model==='marmot'?10:6)+o.id))*(model==='marmot'?.14:.05):0),heading:(toss?.spin||0)-PI/2-p.h+(idle?Math.sin(time*.7+o.id)*.035:0),distance:idle?0:time*3,home:idle,lean:toss?toss.lean:animal?Math.sin(time*7+o.id)*.025:0}});return;}
  at(od,off,rise);if(toss)push(0,0,0,0,toss.spin,toss.lean);
  if(o.kind==='manhole')special.manhole();
  else if(o.kind==='carriage')encounters.carriage(time);
  else if(o.kind==='scooter')encounters.scooter(time);
  else if(o.kind==='snowman')encounters.snowman(time);
  else if(o.kind==='flamingo')encounters.flamingo(time);
  else if(o.kind==='electric')special.electric(time,o.id);
  else if(o.kind==='heart'){a('heart',0,2.12+Math.sin(time*3+o.id)*.12,0,.62,.62,.62,[1,.12,.27,49],0,Math.sin(time*1.4+o.id)*.35);a('ring',0,.08,0,.55,.55,.045,[1,.35,.45,49],PI/2);}
  else if(o.kind==='coin')special.coin(time,o.id);
  else if(['magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind))powerups.pickup(o.kind,time,o.id);
  else if(o.kind==='climbGear'||o.kind==='snowshoes')summit.pickup(o.kind,time,o.id);
  else if(o.kind==='fishCatch')lake.pickup(time,o.id);
  else if(o.kind==='hook')lake.hook(time,o.id);
  else if(o.kind==='ibex')summit.ibex(time,0,o.id);
  else if(o.kind==='crevasse'||o.kind==='ridgeGap'){const width=o.lane<0?8.3:2.3;a('crack',0,.025,1.15,width,2.3,1,o.kind==='ridgeGap'?[.10,.09,.07]:[.02,.12,.19,21],-PI/2);for(let i=0;i<7;i++)for(const side of[-1,1]){const x=(i/6-.5)*width,z=side*(1.03+Math.sin(i*5.2+o.id)*.1);a('rock',x,.03,z,width/14,.09,.16,o.kind==='ridgeGap'?C.rock:[.66,.88,.97,20],0,i);}}
  else if(['lowRock','rockfall','boulder'].includes(o.kind)){const small=o.kind==='lowRock';a('rock',0,small?.42:.8,0,small?.8:1,small?.62:1.1,.8,C.rock,o.kind==='rockfall'?time*2:0,o.id*.7);}
  else if(o.kind==='rope'){for(const side of[-1,1])a('cylinder',side*4.3,1.5,0,.06,3,.06,C.wood);a('cylinder',0,2.25,0,.07,8.6,.07,[.69,.46,.24],0,0,PI/2);}
  else if(o.kind==='iceBlock'){a('rock',0,.5,0,.82,.74,.76,[.55,.82,.93,20],0,o.id*.7);a('rock',.24,.95,-.1,.36,.25,.42,C.snow);}
  else if(o.kind==='iceArch'){const width=o.lane<0?8.2:2.25;for(const side of[-1,1]){a('rock',side*(width*.5+.2),1.2,-.15,.65,1.7,.9,[.57,.83,.94,20],0,side*.4);}for(let i=-3;i<=3;i++){const x=i*width/6,y=2.62+.25*(1-Math.abs(i)/3);a('rock',x,y,0,width/7,.52,.85,[.65,.87,.97,20],0,i*.2);if(i%2===0)a('cone',x,y-.42,.25,.09,.28,.09,[.65,.87,.97,20],PI);}}
  else if(o.kind==='log'){a('cylinder',0,.42,0,.36,8.2,.36,C.wood,0,0,PI/2);for(const x of[-3.6,-1.6,1.5,3.6])a('cylinder',x,.42,0,.37,.08,.37,[.24,.16,.10],0,0,PI/2);a('cylinder',-1,.73,0,.12,.9,.12,C.wood,0,0,-.6);}
  else if(o.kind==='branch'){a('cylinder',4.5,2.5,-.2,.30,6,.30,C.wood,0,0,.18);a('cylinder',0,2.46,0,.18,8.8,.18,C.wood,0,0,PI/2+.025);for(let i=-2;i<=2;i++){a('cylinder',i*1.5,2.61,.13,.055,1.3,.055,C.wood,.9,0,-.7);a('sphere',i*1.5,2.68,.27,.9,.30,.58,[.17,.31,.19]);a('sphere',i*1.5+.35,2.9,-.1,.6,.22,.42,[.25,.38,.22]);}}
  else if(o.kind==='barrier'){a('box',0,.84,0,8.1,.37,.18,[.92,.91,.82]);for(let i=-5;i<=5;i++)a('box',i*.75,.84,.10,.34,.38,.022,C.red,0,0,-.35);for(const side of[-1,1]){a('box',side*3.7,.4,0,.12,.8,.12,C.dark);a('box',side*3.7,.07,0,.65,.14,.65,C.dark);}}
  else if(o.kind==='awning'){a('box',0,2.3,0,2.3,.15,2.1,[.96,.88,.7],-.1);for(let i=-2;i<=2;i++)a('box',i*.46,2.32,0,.22,.19,2.1,C.red,-.1);a('box',0,2.08,1.04,2.3,.37,.06,[.92,.79,.59]);for(const side of[-1,1])a('cylinder',side*1.15,1.15,-.8,.04,2.3,.04,C.dark);}
  else if(o.kind==='cafe'){a('cylinder',0,.97,0,.73,.12,.73,C.wood);a('cylinder',0,.46,0,.06,.92,.06,C.dark);a('box',0,.08,0,1,.09,.09,C.dark);a('box',0,.08,0,.09,.09,1,C.dark);a('cylinder',.25,1.1,0,.10,.16,.10,[.94,.91,.79]);a('sphere',-.25,1.13,0,.12,.17,.12,C.red);}
  else if(o.kind==='luggage')luggage(0,0);
  else if(o.kind==='trolley'){a('box',0,.22,0,1.5,.16,1.2,C.dark);for(const side of[-1,1]){a('cylinder',side*.67,1.1,-.5,.045,1.8,.045,[.8,.64,.35]);for(const z of[-.4,.4])a('sphere',side*.6,.15,z,.14,.14,.14,C.dark);}a('cylinder',0,2,-.5,.045,1.35,.045,[.8,.64,.35],0,0,PI/2);luggage(-.28,.1,[.4,.2,.15]);luggage(.32,-.1,[.19,.38,.44],true);}
  else if(o.kind==='planter'){a('cylinder',0,.46,0,.67,.9,.67,[.55,.36,.24]);a('sphere',0,1.02,0,.65,.4,.65,[.22,.38,.18]);for(let i=0;i<7;i++)a('sphere',Math.sin(i*7)*.5,1.2,Math.cos(i*7)*.5,.13,.11,.13,C.red);}
  if(toss)pop();pop();
 }
 return{ready,resize:r.resize,emit(e,s){if(!path)path=createPath(s.seed);fx.emit(e,s,path);if(e.kind==='fishCatch')flyingFish.push(anim);
  if(e.kind==='powerClear'&&!['crevasse','ridgeGap','manhole','rope','branch','iceArch'].includes(e.object)){
   if(tossed.length>=12)tossed.shift();tossed.push({o:{id:e.id||0,kind:e.object,lane:e.lane,d:e.d??s.distance},time:anim,side:e.lane===0?-1:e.lane===2?1:(e.id%2?-1:1)});
  }
 },resetEffects(){fx.reset();tossed=[];rushFov=0;flyingFish=[];},
 render(s,{distance,time,delta,active,paused,reduced,screen,introTime=null,waiting=false}){if(!actor)return;const d=active?distance:0,newKey=s.seed+':summit';if(key!==newKey){key=newKey;placementCache.clear();clearCache.clear();path=createPath(s.seed,'summit');cam=0;}
  const mobile=canvas.width/canvas.height<.9;cinematic=introTime===null?null:introFrame(introTime,mobile,reduced);cinematicMetrics=cinematic?{time:introTime,heroZ:cinematic.z,doorOpen:cinematic.doorOpen,orbitDegrees:cinematic.orbitDegrees,eye:cinematic.eye,target:cinematic.target}:null;
  trackD=d;speedNow=s.speed||16;const stage=getZone(active?s.elapsed:0);const phase=active?s.elapsed:0,ease=(a,b)=>{const t=Math.max(0,Math.min(1,(phase-a)/(b-a)));return t*t*(3-2*t);};grade=.025*ease(90,110)+.015*ease(180,200)+.015*ease(360,380)+.035*ease(540,560)-.015*ease(630,650)+.035*ease(720,740)-.11*ease(785,812);visualSubtick=active&&!paused?Math.max(0,Math.min(.05,(d-s.distance)/Math.max(1,s.speed))):0;
  if(path.setSummit(active?s.summitTurn:0)){placementCache.clear();clearCache.clear();}
  if(!active||!s.summitTurn)mtn=null;else if(!mtn){const relaxed=s.mode==='relaxed',base=(relaxed?14:19)+(relaxed?6:8),dEnd=s.distance+Math.max(0,900-s.elapsed)*base,dStart=s.distance+(810-s.elapsed)*base,top=path.frame(dEnd);mtn={x:top.x,z:top.z,k:.22,p:40,R:Math.max(200,(dEnd-dStart)*.5)};}
  mtnFade=ease(785,812);
  const p=path.frame(d);origin=p;if(Math.abs(d-lastD)>50)cam=p.h;lastD=d;cam+=(p.h-cam)*Math.min(1,delta*(reduced?40:7));lane+=(s.x-lane)*Math.min(1,delta*28);if(!paused&&screen!=='result')anim+=delta;
  jump+=((s.jumpY||0)-jump)*Math.min(1,delta*28);instances=[];touristGroups=[];flamingoInstances=0;r.begin();r.setOrigin(p.x,p.z);r.setHoles(active?s.objects.filter(o=>o.kind==='manhole'&&o.d>d-10&&o.d<d+180).map(o=>{const q=point(o.d,(o.lane-1)*2.5);return[q.x,q.z,.81];}):[]);r.setEnvironment(active?s.elapsed:0,s.speed||16,p.h);environment(d,active?s.elapsed:0,s.speed||16);special.snow(anim,reduced,1-Math.max(0,Math.min(1,((active?s.elapsed:0)-84)/6)),cam);if(active)for(const o of s.objects)obstacle(o,d,anim);
  tossed=tossed.filter(t=>anim-t.time<1.1);if(active)for(const t of tossed){const age=Math.max(0,anim-t.time),u=age/1.1;obstacle(t.o,d,anim,{side:t.side*(u*7),y:Math.sin(u*PI)*2.6,spin:reduced?0:t.side*u*2.4,lean:reduced?0:t.side*u*.65});}
  if(active&&!s.angry&&(s.fish||0)>=10&&getZone(s.elapsed)===7&&npc.hiker){
   // Ab 10 Fischen: Der Fischer steht am Ufer, schaut Hornox nach und hat ein gelbes «!» über dem Kopf.
   const q=point(d+15,-4.3);instances.push({actor:npc.hiker,pose:{x:q.x,y:q.y,z:q.z,heading:-PI/2-q.h,time:anim*.6,variant:7,heightScale:1.05,style:0,home:true}});
   push(q.x,q.y,q.z,0,-q.h);lake.rod(.2+Math.sin(anim*1.3)*.1);push(0,2.38*1.05,0);lake.hat();pop();push(0,3.05+Math.abs(Math.sin(anim*4))*.12,0,0,anim*2);lake.alert([1,.8,.1]);pop();pop();
  }
  if(active&&s.angry>0&&npc.hiker){
   // Wütender Fischer rennt hinter Hornox her und wirft die Angel; am Ende läuft er seitlich davon.
   const leaving=s.angry<40,u=leaving?(40-s.angry)/40:0,fd=d-4.4-u*3,fo=(lane-1)*2.5+1.9+u*16,q=point(fd,fo),swing=Math.max(0,Math.sin(anim*2.1))*.8;
   instances.push({actor:npc.hiker,pose:{x:q.x,y:q.y,z:q.z,heading:PI/2-q.h,time:anim*1.7,variant:7,heightScale:1.05,style:0}});
   push(q.x,q.y,q.z,0,PI-q.h);lake.rod(swing);push(0,2.38*1.05,0);lake.hat();pop();if(!leaving){push(0,3.05,0,0,anim*2);lake.alert([.9,.12,.1]);pop();}pop();
   const hk=s.objects.filter(o=>o.kind==='hook'&&!o.resolved).sort((x,y)=>y.bornTick-x.bornTick)[0];
   if(hk&&!leaving){const tip=point(fd+1.9,fo+.3),hp=point(hk.d,(hk.lane-1)*2.5);lake.line(tip.x,tip.y+3.05-swing*.6,tip.z,hp.x,hp.y+1.25,hp.z,1.4);}
  }
  if(active&&s.elapsed<892&&s.nextTurn-d<100&&s.nextTurn>d){at(s.nextTurn,-path.direction(s.turnIndex)*5);a('box',0,1.4,0,.13,2.8,.13,C.wood);a('box',0,2.5,0,1.5,.7,.16,C.gold);pop();}
  const offset=active?(lane-1)*2.5:0,ax=Math.cos(p.h)*offset,az=cinematic?cinematic.z:Math.sin(p.h)*offset,powered=s.powerTicks>0,lift=(powered?.28:0)-(s.fallTicks?Math.sin((20-s.fallTicks)/20*PI)*2.7:0);
  a('billboard',ax,groundY(ax,az)+.025,az,2.2,1.5,1,[.1,.16,.17,8],-PI/2);
  visibleActor=active?actor:showcase;visibleActor.update({distance:cinematic?cinematic.runDistance:active?d:0,time:anim,jump:active?s.jump:0,duck:active?s.duck:0,home:!active||waiting||!!cinematic&&!cinematic.walking,x:ax,y:active?groundY(ax,az)+jump*2.2+lift:0,z:az,heading:active?PI-cam:PI,impact:fx.impact(),lean:reduced?0:(s.target-lane)*-.1+fx.wobble()});
  if(active&&(s.fish||0)>0&&visibleActor===actor&&actor.joint){
   // Gesammelte Fische stecken sichtbar im Wanderrucksack (je 4 Fische ein Fisch mehr, max. 6).
   const sp=actor.joint('Spine02');if(sp){const bx=-Math.sin(cam),bz=Math.cos(cam),n=Math.min(6,Math.ceil(s.fish/4));
    for(let k=0;k<n;k++){const side=(k-(n-1)/2)*.2;push(sp[0]+bx*.42+Math.cos(cam)*side,sp[1]+.42+(k%2)*.06,sp[2]+bz*.42+Math.sin(cam)*side,0,-cam+PI/2);push(0,0,0,PI/2-.25+Math.sin(anim*6+k)*.08,0,0);lake.fish(anim,k,.85);pop();pop();}
    // Frisch gefangene Fische fliegen im Bogen in den Rucksack.
    flyingFish=flyingFish.filter(t=>anim-t<.5);for(const t of flyingFish){const u=(anim-t)/.5,x0=ax+Math.sin(cam)*3,z0=az-Math.cos(cam)*3,x1=sp[0]+bx*.42,y1=sp[1]+.4,z1=sp[2]+bz*.42;push(x0+(x1-x0)*u,1.4+(y1-1.4)*u+Math.sin(u*PI)*1.4,z0+(z1-z0)*u,0,anim*9);lake.fish(anim,9,.7);pop();}
   }}
  if(active&&s.shoes>0&&visibleActor===actor&&actor.joint){for(const side of['Left','Right']){const f=actor.joint(side+'Foot'),t=actor.joint(side+'ToeBase');if(!f||!t)continue;const cx=(f[0]+t[0])/2,cz=(f[2]+t[2])/2,cy=Math.min(f[1],t[1]),yaw=Math.atan2(t[0]-f[0],t[2]-f[2]);push(cx,cy-.06,cz,0,yaw);summit.snowshoe();pop();}}
  if(active&&(s.shield||s.coinBoost>0||s.magnet>0||s.climb>0||s.shoes>0)){push(ax,groundY(ax,az)+jump*2.2+lift,az,0,-cam);powerups.aura(s,anim);summit.aura(s,anim);pop();}
  rushFov+=((powered?1:0)-rushFov)*Math.min(1,delta*5);if(powered){push(ax,groundY(ax,az)+jump*2.2+lift,az,0,-cam);special.rush(anim,reduced,rushFov);pop();}
  const follow=active?offset*.35:0,dist=mobile?10.3:9.5,ex=-Math.sin(cam)*dist+Math.cos(cam)*follow,ez=Math.cos(cam)*dist+Math.sin(cam)*follow;
  fx.render(delta,p,{paused:paused||screen!=="play"||!!cinematic,reduced,state:s,path});
  if(cinematic)r.render(...cinematic.eye,...cinematic.target,mobile?.98:.82,d);
  else if(!active)r.render(0,5.0,-13,0,3.9,7,mobile?.98:.82,0);
  else{const tx=Math.sin(cam)*11+Math.cos(cam)*follow,tz=-Math.cos(cam)*11+Math.sin(cam)*follow;r.render(ex,(mobile?5.1:4.7)+Math.max(0,groundY(ex,ez)),ez,tx,1.25+groundY(tx,tz)*.8,tz,(mobile?.98:.82)+(reduced?0:rushFov*.085),d);}

 },metrics(){return{...r.metrics(),...special.metrics(),tossedObjects:tossed.length,touristGroups,touristCount:touristGroups.reduce((n,g)=>n+g.count,0),flamingoInstances,rushFov,jumpHeight:jump,walkingPhase:anim*4.6,...visibleActor?.metrics(),cinematic:cinematicMetrics,ready:!!actor,heading:cam,zone,streetBuildings,visualSubtick,terrainCell:mtn?90:grade===0?3600:300,mountain:mtn&&{...mtn,fade:mtnFade},placementCacheSize:placementCache.size,clearanceCacheSize:clearCache.size,npcInstances:instances.length,particles:fx.count()};}};
}
