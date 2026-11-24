import {createAlpine} from './alpine.js?v=17';
import {createPowerups} from './powerups.js?v=17';
import {createSummit} from './summit.js?v=3';
import {createLake} from './lake.js?v=5';
import {createEncounters} from './encounters.js?v=20';
import {createSpecials} from './specials.js?v=17';
import {introFrame} from './intro.js?v=17';
import {createArchitecture} from './world3d.js?v=17';
import {createRenderer} from './engine3d.js?v=21';
import {createActor} from './actor.js?v=23';
import {createEffects} from './effects.js?v=17';
import {createPath} from './route.js?v=21';
import {getZone,bridgeAt,fogAt,forestSection,meadowSection,lakeSection,stoneAt,swampMud} from './journey.js?v=26';
import {createBlackLake} from './blacklake.js?v=11';
import {createMeadow} from './meadow.js?v=7';
import {createForest} from './forest.js?v=5';
export {getZone};
const PI=Math.PI,C={ice:[.74,.87,.9,10],grass:[.44,.58,.30,11],gravel:[.7,.63,.48,12],cobble:[.65,.66,.61,13],snow:[.86,.92,.94,2],rock:[.48,.52,.53,1],wood:[.32,.22,.15,4],gold:[1,.74,.24,9],dark:[.12,.2,.23],fir:[1,1,1,7],red:[.85,.16,.19],flower:[.97,.85,.40]};
export function createScene(canvas){
 const r=createRenderer(canvas),a=r.add,push=r.push,pop=r.pop,fx=createEffects(r),arch=createArchitecture(r),special=createSpecials(r),encounters=createEncounters(r),alpine=createAlpine(r),powerups=createPowerups(r),summit=createSummit(r),lake=createLake(r),forest=createForest(r),meadow=createMeadow(r),blacklake=createBlackLake(r);let actor,showcase,npc={},path,key='',origin={x:0,z:0,h:0},lane=1,cam=0,jump=0,lastD=0,anim=0,visibleActor,instances=[],zone=3,trackD=0,grade=0,streetBuildings=[],cinematic=null,cinematicMetrics=null,rushFov=0,tossed=[],touristGroups=[],flamingoInstances=0;const placementCache=new Map(),clearCache=new Map();let visualSubtick=0,mtn=null,mtnFade=0;
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
  for(let i=0;i<points.length-1;i++){const w=points[i],z=getZone(Math.max(0,elapsed+(w-d)/speed));if(z===9)continue;/* Schwarzsee: kein Weg, nur Wasser */const wd=z===7?3.3:4.15,e=edges(w,wd),f=edges(points[i+1],wd),out=batches[[4,6,7,8,9,10].includes(z)?1:z===5?0:z];for(const p of[e[0],f[0],e[1],e[1],f[0],f[1]])out.push(...p,0,1,0,1,1,1);}
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
  // Schwarzsee: das Matterhorn steht immer gut sichtbar im Hintergrund, egal wohin der Weg abbiegt.
  if(zone===9)a('matterhorn',Math.sin(cam)*2700+Math.cos(cam)*380,-45,-Math.cos(cam)*2700+Math.sin(cam)*380,560,980,620,[1,1,1,29],0,.18-cam);
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
 // Level 4: morsche Holzbrücke über einen Bergbach (Bretter, Geländer, Wasser und Steine darunter).
 function bridge(d,elapsed,speed){
  for(let w=Math.floor((d-30)/1.4)*1.4;w<d+320;w+=1.4){const t=Math.max(0,elapsed+(w-d)/speed);if(!bridgeAt(t)||getZone(t)!==8)continue;const k=Math.round(w/1.4);
   at(w,0);forest.plank(k);if(k%4===0)forest.rail();pop();
   if(k%6===0)for(const side of[-1,1]){at(w,side*11);a('box',0,-.12,0,13,.1,8.6,[.12,.34,.4,26]);if(k%12===0)a('rock',side*-2,-.05,1,1.1,.4,.9,C.rock,0,k);pop();}
  }
 }
 // Level 4: Schweizer Bergwald – dichte Tannen in drei Reihen, Herbstbäume, Moosfelsen, Berghütten,
 // Wasserfälle, Sonnenstrahlen im hellen Wald und Nebelschwaden im tiefen Wald.
 function forestScenery(d,elapsed,speed){
  for(let w=Math.floor((d-24)/9)*9;w<d+420;w+=9){const t=Math.max(0,elapsed+(w-d)/speed);if(getZone(t)!==8)continue;const k=Math.round(w/9),sec=forestSection(t),dark=sec===2||sec===4,onBridge=bridgeAt(t);
   for(const side of[-1,1]){
    const near=point(w,side*(7.4+(k%3)*.9));
    if(!onBridge&&clear(near.x,near.z,1.6,w)){tree(near.x,near.z,(dark?1.15:.95)+(k%4)*.12,near.y);}
    if(w<d+320&&k%2===0){const mid=point(w+4,side*((onBridge?18:14)+(k%4)*1.5));if(clear(mid.x,mid.z,2.5,w))tree(mid.x,mid.z,1.3+(k%3)*.25,mid.y);}
    if(k%3===0){const far=point(w+2,side*(24+(k%5)*2));if(clear(far.x,far.z,3,w))tree(far.x,far.z,1.7+(k%4)*.3,far.y);}
    if(!onBridge&&k%5===(side>0?2:3)){const mr=point(w+3,side*5.6);if(clear(mr.x,mr.z,.8,w)){at(w+3,side*5.6);forest.mossRock(.7+(k%3)*.2,k);pop();}}
    if(k%41===(side>0?7:27)){const hp=point(w,side*17);if(clear(hp.x,hp.z,7,w)){at(w,side*17);push(0,0,0,0,side<0?PI/2:-PI/2);alpine.chalet(k%3);pop();pop();}}
    if(k%31===(side>0?13:24)&&w>d+60){const wp=point(w,side*30);if(clear(wp.x,wp.z,8,w)){at(w,side*30);push(0,0,0,0,side<0?PI/2:-PI/2);forest.waterfall(anim);pop();pop();}}
    if(!dark&&k%7===3&&w<d+200){at(w,side*9.5);forest.sunRay();pop();}
    if(dark&&k%4===1&&w<d+250){at(w,side*11);forest.wisp(anim,k);pop();}
   }
  }
 }
 // Level 5: offene Alpweiden am Morgen – bunte Wildblumen, Zäune und Gatter, Schafherden, Kühe mit Glocken,
 // Alphütten, Bäche (in der steilen Alp mit Holzbrücken), Morgentau, Morgennebel und vereinzelte Lärchen.
 function meadowScenery(d,elapsed,speed){
  let sheepCount=0;
  for(let w=Math.floor((d-24)/8)*8;w<d+420;w+=8){const t=Math.max(0,elapsed+(w-d)/speed);if(getZone(t)!==1)continue;const k=Math.round(w/8),sec=meadowSection(t);
   if(sec===3&&k%11===5&&w>d-10){at(w,0);meadow.footbridge(anim);pop();continue;}
   for(const side of[-1,1]){
    if(w<d+300){for(const off of[5.4,9+(k%3)*2,15+(k%4)*2.5]){const f=point(w+(off%3),side*off);if(clear(f.x,f.z,1.4,w)){push(f.x,f.y,f.z);meadow.flowerPatch(anim,k*3+off|0,off<6?5:8);pop();}}}
    if(w<d+80&&sec<=2&&k%2===0){const dw=point(w+2,side*5);push(dw.x,dw.y,dw.z);meadow.dew(anim,k);pop();}
    const fp=point(w,side*6.4);if(clear(fp.x,fp.z,.6,w)){at(w,side*6.4);meadow.sideFence();pop();}
    /* Alpweiden: keine Schafe und keine Kühe (Wunsch Kunde) – nur Wiese, Blumen, Zäune und Hütten */
    if(k%23===(side>0?7:18)){const hp=point(w,side*19);if(clear(hp.x,hp.z,6,w)){at(w,side*19);push(0,0,0,0,side<0?PI/2:-PI/2,0,.85);alpine.chalet(k%3);pop();pop();}}
    if(k%17===(side>0?11:3)){const tp=point(w,side*34);if(clear(tp.x,tp.z,3,w))tree(tp.x,tp.z,1.1,tp.y);}
    if(k%31<5&&side>0){const bp=point(w,side*22);if(clear(bp.x,bp.z,2,w)){at(w,side*22);meadow.brook(anim);pop();}}
   }
  }
 }
 // Level 6: Schwarzsee – die ganze Welt liegt auf dem Wasser. Die Strecke besteht aus Flössen, Baumstamm-Bündeln,
 // Plattformen und (im Steinpfad) Trittsteinen; rundherum nur Wasser, Seerosen, Schilfinseln, Fliegen und Frösche,
 // in der Ferne eine Kapelleninsel, das Matterhorn und die Berge von Zermatt.
 function lakeScenery9(d,elapsed,speed){
  // Level 6 «Schwarzsee» – Sumpfgebiet: Wasser mit Holzbalken und versunkenen Steinen (alle 5 s Wechsel),
  // alle 15 s eine Schlammebene. Ufer mit goldenem Schilf, Berge und Kapelle im Hintergrund.
  const gaps=curObjects.filter(o=>o.kind==='waterGap');
  for(let w=Math.floor((d-30)/6)*6;w<d+430;w+=6){const t=Math.max(0,elapsed+(w-d)/speed);if(getZone(t)!==9)continue;const k=Math.round(w/6),mud=swampMud(t);
   const h=path.frame(w).h,sx=grade*(.55*Math.cos(h)-.83*Math.sin(h)),sz=grade*(-.55*Math.sin(h)-.83*Math.cos(h));
   // Wasserfläche quer über die ganze Breite (folgt der Geländeneigung)
   at(w,0);push(0,0,0,Math.atan(-sz),0,Math.atan(sx));a('box',0,-.1,0,130,.12,6.02,[.38,.5,.26,26]);if(mud)a('box',0,.04,0,9.4,.2,6.02,[.36,.26,.15]);pop();pop();
   if(mud){if(k%2===0)for(const x of[-3.4,3.4]){at(w+1.5,x);a('sphere',0,.12,0,.5,.06,.4,[.29,.2,.11]);pop();}}
   else{
    // Laufstrecke: je Spur ein Balken oder eine Steinplatte alle 2,4 m – Lücken nur bei echten Wasserlücken
    const stones=Math.floor((t-450)/5)%2===1;
    if(w<d+190)for(let j=0;j<6;j+=2.4){const sw=w+j,n=Math.round(sw/2.4);
     for(const l of[0,1,2]){if(gaps.some(g=>(g.lane<0||g.lane===l)&&Math.abs(g.d-sw)<3.7))continue;at(sw,(l-1)*2.5);push(0,0,0,0,((n*3+l)%5-2)*.05);if(stones)blacklake.slab(n*3+l);else blacklake.beam(anim,n*3+l);pop();pop();}}
   }
   for(const side of[-1,1]){
    // Entengrütze: unregelmässige, flache Flecken auf dem Wasser
    if(w<d+220){const ox=side*(5.2+((k*7)%5)*.9);at(w+((k*3)%5),ox);a('cylinder',0,-.02,0,1.4+(k%3)*.5,.02,.9+(k%2)*.6,[.5,.62,.28],0,k);pop();}
    // Sumpfwald: Erlen im Wasser, grüne Seggen-Bulte und umgestürzte Äste (wie auf dem Foto)
    if(w<d+240){for(const off of[5.6,8.4]){if((k+(off>6?1:0))%2)continue;at(w+(off%3),side*off);blacklake.sedge(anim,k*3+off|0,w<d+90?12:7);pop();}}
    if(w<d+380&&k%2===(side>0?0:1)){const tp=point(w,side*(9.5+(k%3)*2.6));if(clear(tp.x,tp.z,1.5,w)){at(w,side*(9.5+(k%3)*2.6));blacklake.swampTree(anim,k);pop();}}
    if(w<d+380&&k%3===(side>0?1:2)){at(w+3,side*(15+(k%4)*3));blacklake.swampTree(anim,k+7);pop();}
    if(w<d+200&&k%7===(side>0?3:5)){at(w,side*7.2);push(0,0,0,0,side*.6);blacklake.fallenBranch(k);pop();pop();}
    if(w<d+200&&k%13===(side>0?4:10)){at(w,side*6.8);push(0,0,0,0,side>0?-PI/2:PI/2);blacklake.lurk(anim,k);pop();pop();}
    if(k%9===(side>0?2:6)&&w<d+300){at(w,side*(14+(k%3)*2));a('rock',0,.05,0,1.4,.5,1.1,C.rock,0,k);pop();}
    if(k%60===(side>0?17:47)){const cp=point(w,side*55);if(clear(cp.x,cp.z,8,w)){at(w,side*55);a('rock',0,-.3,0,9,1.6,7,[.4,.45,.35],0,k);a('sphere',0,.6,0,6,.8,5,[.32,.55,.24]);push(0,1,0,0,-side*PI/2);alpine.chapel();pop();pop();}}
   }
  }
 }

 function environment(d,elapsed,speed){zone=getZone(elapsed);landscape(d,elapsed);road(d,elapsed,speed);street(d,elapsed,speed);lakeside(d,elapsed,speed);bridge(d,elapsed,speed);forestScenery(d,elapsed,speed);meadowScenery(d,elapsed,speed);lakeScenery9(d,elapsed,speed);
  const start=Math.floor((d-22)/14)*14;
  for(let w=start;w<d+430;w+=14){const z=getZone(Math.max(0,elapsed+(w-d)/speed)),index=Math.floor(w/14),side=index%2?1:-1,off=side*(7.7+(Math.abs(index)%3)*1.4),p=point(w,off);
   if([1,2,3,8,9].includes(z)||z===7&&side<0||!clear(p.x,p.z,1.8,w))continue;
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
 let stingT=-99,beeNest=null,crocAttack=null,curObjects=[],tongueDrawn=new Set(),dogVis=40,dogLane=1,speedNow=16,flyingFish=[],tickNow=0,chaser=null,chaseVis=40,chaseLane=1,reelT=-9,fogNow=0,boarVis=40,boarLane=1,rammed=new Set();
 function obstacle(o,d,time,toss=null){if(!toss&&(rammed.has(o.id)||fogNow>0&&o.d-d>180-140*fogNow))return;const od=o.d-(toss?0:(o.approach||0)*visualSubtick);if(!toss&&(od<d-8||od>d+180||(o.resolved&&['coin','magnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom','herb','cheese','goldBell','edelweiss'].includes(o.kind))))return;const off=(o.lane<0?0:(o.lane-1)*2.5)+(toss?.side||0),p=point(od,off),rise=toss?.y||0;
  if(['pedestrian','hiker','photographers','influencer','lostTourists','scooter','skiers','snowboarders'].includes(o.kind)){visitors(o,p,time,toss);if(o.kind!=='scooter')return;}
  if(o.kind==='ibex'&&!toss){
   // Steinbock galoppiert von links oder rechts auf die Piste und bleibt dann stehen (Spur kommt aus den Regeln).
   const dir=o.dir||1,waiting=dir>0?o.lane<=-2.59:o.lane>=4.59,moving=!waiting&&Math.abs(o.lane-o.target)>.01,hop=moving?Math.abs(Math.sin(time*7+o.id))*.45:0,q=point(od,(o.lane-1)*2.5);
   push(q.x,q.y+hop,q.z,0,-q.h);push(0,0,0,0,moving||waiting?-dir*PI/2:0);/* Kopf in Laufrichtung */summit.ibex(time,moving?.35+.3*Math.sin(time*14):0,o.id);pop();pop();return;}
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
    push(q.x,q.y+y,q.z,0,-q.h);push(0,0,0,0,-PI/2,0);/* Kopf in Sprungrichtung (nach rechts) */push(0,0,0,(u-.5)*1.2,0,0);lake.biter(time,o.id,1.1);pop();pop();pop();return;}
   push(q.x,q.y+.4+Math.abs(Math.sin(time*9+o.id))*.25,q.z,0,-q.h+o.id);push(0,0,0,0,0,PI/2);lake.biter(time,o.id,.95);pop();pop();return;}
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
  if(o.kind==='plankGap'&&!toss){
   // Morsches Brett: hat zuerst Risse, bricht etwa 1 s vor Hornox weg und hinterlässt ein Loch.
   const gapT=(od-d)/Math.max(1,speedNow),brk=Math.max(0,Math.min(1,(1.05-gapT)/.45));at(od,(o.lane-1)*2.5);forest.brokenPlank(brk,time,o.id);pop();return;}
  if(o.kind==='floatLog'){at(od,0,rise);if(toss)push(0,0,0,0,toss.spin,toss.lean);blacklake.floatLog(time,o.id);if(toss)pop();pop();return;}
  if(o.kind==='mudPuddle'){at(od,(o.lane-1)*2.5,0);blacklake.mudPuddle(time,o.id);pop();return;}
  if(o.kind==='waterGap'&&!toss){at(od,0);for(const x of(o.lane<0?[-2.5,0,2.5]:[(o.lane-1)*2.5])){a('box',x,.0,0,2.45,.03,6.4,[.05,.18,.24,26]);for(const z of[-3.1,3.1])a('box',x,.05,z,2.4,.05,.28,[.9,.97,1,49]);for(let k=0;k<3;k++){const ph=(time*.8+k*.33+o.id*.1)%1;a('ring',x+(k-1)*.6,.04,(k-1)*1.6,.3+ph*.6,.3+ph*.6,.015,[.8,.92,1,49],PI/2);}}if(o.lane<0&&o.id%2===0){push(((o.id>>1)%3-1)*2.5,0,0,0,PI/2+(o.id%4?.3:-.3));blacklake.lurk(time,o.id);pop();}pop();return;}
  if(o.kind==='tongue'&&!toss){
   // Frosch sitzt neben der Strecke: Kehlsack bläht sich (Warnung), dann schiesst die Zunge über 1–2 Spuren und zieht sich zurück.
   if(tongueDrawn.has(o.attackId))return;tongueDrawn.add(o.attackId);
   const side=o.side||-1,lanes=curObjects.filter(q=>q.kind==='tongue'&&q.attackId===o.attackId).map(q=>q.lane),far=side<0?Math.max(...lanes):Math.min(...lanes),frogOff=side*5.2,tipOff=(far-1)*2.5-side*1.1,len=Math.abs(tipOff-frogOff)-1;
   const gapT=(od-d)/Math.max(1,speedNow),warn=Math.max(0,Math.min(1,(1.5-gapT)/1.1)),shoot=gapT<.35&&gapT>-.65?(gapT>.05?1-(gapT-.05)/.3:gapT>-.3?1:Math.max(0,1-(-.3-gapT)/.35)):0;
   // Auftauchen: unter Wasser nur Blasen und Augen, ~1,7 s vorher springt der Frosch mit Spritzer aus dem See.
   const emerge=Math.max(0,Math.min(1,(1.75-gapT)/.25)),fp=point(od,frogOff);push(fp.x,fp.y,fp.z,0,-fp.h);
   if(emerge<1)blacklake.bubbles(time,o.id);if(emerge>0){a('cylinder',0,.03,0,1.15,.03,1.15,[.25,.6,.25]);}
   push(0,.06-(1-emerge)*1.05,0,0,-side*PI/2,0,1.6);blacklake.frog(time,o.id,warn*(gapT>.35?1:.3),warn*(.5+.5*Math.sin(time*14)),len/1.6*shoot,gapT<=.05&&shoot>0);pop();
   blacklake.splash((1.75-gapT)/.5);pop();
   // Fliege über der Spur, bis die Zunge sie schnappt
   // Ziel-Fliegen schwirren schon ~3 s vorher gross sichtbar über den bedrohten Spuren; darunter ein Warnring
   // (gelb, ab dem Auftauchen des Frosches rot blinkend). So sieht man, auf welcher Spur die Zunge kommt.
   if(gapT<3&&gapT>-.4)for(const l of lanes){const tp=point(od,(l-1)*2.5),hot=gapT<1.75,pulse=hot?.5+.5*Math.abs(Math.sin(time*10)):.6;
    push(tp.x,tp.y,tp.z,0,-tp.h);a('ring',0,.62,0,1.15,1.15,.1,hot?[1,.15+.25*(1-pulse),.15,49]:[1,.85,.25,49],PI/2);a('ring',0,.64,0,.75,.75,.06,hot?[1,.4,.35,49]:[1,.95,.6,49],PI/2,0,time*3);pop();
    if(gapT>.05||l!==far){push(tp.x+Math.sin(time*7+o.id+l)*.45,tp.y+1.3+Math.sin(time*9+l)*.3,tp.z+Math.cos(time*6+l)*.35,0,time*4,0,3.2);blacklake.fly(time,o.id+l);pop();}}
   return;}
  if(o.kind==='honey'){const side=o.lane===0?-1:1;at(od,side*5.8);push(0,0,0,0,side>0?PI:0,0,1.15);meadow.nestTree(time,o.id);pop();pop();if(!o.resolved){at(od,(o.lane-1)*2.5);meadow.honeyPot(time,o.id);pop();}return;}
  if(o.kind==='fenceLow'||o.kind==='fenceTall'){at(od,(o.lane-1)*2.5,rise);if(toss)push(0,0,0,0,toss.spin,toss.lean);meadow[o.kind](o.id);if(toss)pop();pop();return;}
  if(['fence','gate','haystack','trough','ditch','woodstack','hayBale'].includes(o.kind)){
   // Level 5: Weide-Hindernisse.
   at(od,o.lane<0?0:(o.lane-1)*2.5,rise);if(toss)push(0,0,0,0,toss.spin,toss.lean);meadow[o.kind](time);if(toss)pop();pop();return;}
  if(['sheepCross','sheepStop','goat','cow','cowWalk','chicken','hayRoll'].includes(o.kind)){
   // Level 5: Schafe, Ziegen, Kühe, Hühner und rollende Heuballen bewegen sich quer zur Strecke (Spur aus den Regeln).
   const dir=o.dir||1,moving=o.v&&Math.abs(o.lane-(o.target??o.lane))>.01,q=point(od,(o.lane-1)*2.5),face=o.kind==='cow'?-PI/2:-dir*PI/2;/* Kopf (+z) zeigt in Laufrichtung: nach rechts = -PI/2 */
   if(o.kind==='sheepCross'||o.kind==='sheepStop'){if(npc.sheep){instances.push({actor:npc.sheep,pose:{x:q.x,y:q.y+rise+(moving?Math.abs(Math.sin(time*9+o.id))*.08:0),z:q.z,heading:-PI/2-q.h+face+(toss?.spin||0),distance:moving?time*4:0,home:!moving,lean:toss?toss.lean:0}});}return;}
   push(q.x,q.y+rise,q.z,0,-q.h);if(toss)push(0,0,0,0,toss.spin,toss.lean);push(0,0,0,0,face);
   if(o.kind==='goat'){const span=Math.abs((o.target??1)-(dir>0?-2.6:4.6))||1,u=moving?1-Math.abs(o.lane-(o.target??1))/span:0;meadow.goat(time,o.id,moving?u:0);}
   else if(o.kind==='cow'||o.kind==='cowWalk')meadow.cow(time,o.id,o.kind==='cowWalk'&&moving);
   else if(o.kind==='chicken'){push(0,0,0,0,0,0,1.5);meadow.chicken(time,o.id);pop();}
   else{pop();push(0,0,0,0,0);meadow.hayBale(-o.lane*3.05);}
   pop();if(toss)pop();pop();return;}
  if(['roots','sign','trunk','highLog','stream'].includes(o.kind)){
   // Level 4: Waldhindernisse.
   at(od,o.lane<0?0:(o.lane-1)*2.5,rise);if(toss)push(0,0,0,0,toss.spin,toss.lean);forest[o.kind](time);if(toss)pop();pop();return;}
  if(o.kind==='boarCross'){
   // Wildschweine rennen quer über den Weg (Spur kommt aus den Regeln).
   const q=point(od,(o.lane-1)*2.5);push(q.x,q.y+rise,q.z,0,-q.h);if(toss)push(0,0,0,0,toss.spin,toss.lean);push(0,0,0,0,(o.dir||1)*PI/2);/* Kopf in Laufrichtung (im Spiel geprüft) */
   push(0,0,0,0,0,0,.72);forest.boar(time,o.id);pop();
   pop();if(toss)pop();pop();return;}
  if(o.kind==='fallingBranch'&&!toss){
   // Ast wackelt oben (Schatten auf der Spur warnt) und fällt etwa 1 s vor Hornox herunter.
   const gapT=(od-d)/Math.max(1,speedNow),drop=Math.max(0,Math.min(1,(.95-gapT)/.35));at(od,(o.lane-1)*2.5);forest.fallingBranch(drop,time);pop();return;}
  if(o.kind==='hook'&&!toss){
   // Angelhaken: fliegt im Bogen von der Angelspitze zur Zielspur (roter Zielring als Warnung).
   if(o.resolved)return;const land=point(od,o.lane<0?0:(o.lane-1)*2.5),fly=o.landTick?Math.max(0,Math.min(1,(tickNow-o.castTick)/(o.landTick-o.castTick))):1,tip=chaser?.tip||[land.x,land.y+6,land.z],pulse=.85+.25*Math.abs(Math.sin(time*9));
   push(land.x,land.y,land.z,0,-land.h);if(o.lane<0)a('box',0,.05,0,8.4*pulse,.02,.32,[1,.18,.12,49]);else a('ring',0,.06,0,.8*pulse,.8*pulse,.07,[1,.18,.12,49],PI/2);pop();
   if(o.attack==='high'){const y=1.7+(1-fly)*5;push(land.x,land.y,land.z,0,-land.h);a('cylinder',0,y,0,.03,8.6,.03,[.95,.95,.9,49],0,0,PI/2);for(const x of[-2.5,0,2.5]){push(x,y-.55,0);lake.hook(time,o.id+x);pop();}pop();lake.line(...tip,land.x,land.y+y,land.z,.4);return;}
   if(fly<1){const hx=tip[0]+(land.x-tip[0])*fly,hy=tip[1]+(land.y+1.3-tip[1])*fly+Math.sin(fly*PI)*3,hz=tip[2]+(land.z-tip[2])*fly;lake.line(...tip,hx,hy,hz,.2);push(hx,hy-1.25,hz);lake.hook(time,o.id);pop();return;}
   push(land.x,land.y,land.z);lake.hook(time,o.id);pop();lake.line(...tip,land.x,land.y+1.35,land.z,.25);return;}
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
  else if(o.kind==='coin'){if(o.biome===8)forest.nut(time,o.id);else if(o.biome===1)meadow.flower(time,o.id);else special.coin(time,o.id);}
  else if(['herb','cheese','goldBell','edelweiss'].includes(o.kind)){if(o.high)push(0,1.5,0);meadow[o.kind](time,o.id);if(o.high)pop();}
  else if(o.kind==='mushroom')forest.mushroom(time,o.id);
  else if(['magnet','shieldOrb','coinBoost','rushCharge'].includes(o.kind))powerups.pickup(o.kind,time,o.id);
  else if(o.kind==='climbGear'||o.kind==='snowshoes')summit.pickup(o.kind,time,o.id);
  else if(o.kind==='fishCatch')lake.pickup(time,o.id);
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
 return{ready,resize:r.resize,emit(e,s){if(!path)path=createPath(s.seed);fx.emit(e,s,path);if(e.kind==='fishCatch')flyingFish.push(anim);if(e.kind==='hooked')reelT=anim;if(e.kind==='beeSting')stingT=anim;if(e.kind==='splash')crocAttack={t:anim,d:s.distance+1.5,lane:Math.round(s.x)};if(e.kind==='beesAppear')beeNest={d:e.nest??s.distance,side:e.side||1,t:anim};
  if(e.kind==='powerClear'&&!['crevasse','ridgeGap','manhole','rope','branch','iceArch'].includes(e.object)){
   if(tossed.length>=12)tossed.shift();tossed.push({o:{id:e.id||0,kind:e.object,lane:e.lane,d:e.d??s.distance},time:anim,side:e.lane===0?-1:e.lane===2?1:(e.id%2?-1:1)});
  }
 },resetEffects(){fx.reset();tossed=[];rushFov=0;flyingFish=[];chaseVis=40;chaser=null;reelT=-9;boarVis=40;dogVis=40;stingT=-99;beeNest=null;crocAttack=null;rammed=new Set();},
 render(s,{distance,time,delta,active,paused,reduced,screen,introTime=null,waiting=false}){if(!actor)return;const d=active?distance:0,newKey=s.seed+':summit';if(key!==newKey){key=newKey;placementCache.clear();clearCache.clear();path=createPath(s.seed,'summit');cam=0;}
  const mobile=canvas.width/canvas.height<.9;cinematic=introTime===null?null:introFrame(introTime,mobile,reduced);cinematicMetrics=cinematic?{time:introTime,heroZ:cinematic.z,doorOpen:cinematic.doorOpen,orbitDegrees:cinematic.orbitDegrees,eye:cinematic.eye,target:cinematic.target}:null;
  trackD=d;speedNow=s.speed||16;const stage=getZone(active?s.elapsed:0);const phase=active?s.elapsed:0,ease=(a,b)=>{const t=Math.max(0,Math.min(1,(phase-a)/(b-a)));return t*t*(3-2*t);};grade=.025*ease(90,110)+.015*ease(180,200)+.015*ease(360,380)+.035*ease(540,560)-.015*ease(630,650)+.035*ease(720,740)-.11*ease(785,812);visualSubtick=active&&!paused?Math.max(0,Math.min(.05,(d-s.distance)/Math.max(1,s.speed))):0;
  if(path.setSummit(active?s.summitTurn:0)){placementCache.clear();clearCache.clear();}
  if(!active||!s.summitTurn)mtn=null;else if(!mtn){const relaxed=s.mode==='relaxed',base=(relaxed?14:19)+(relaxed?6:8),dEnd=s.distance+Math.max(0,900-s.elapsed)*base,dStart=s.distance+(810-s.elapsed)*base,top=path.frame(dEnd);mtn={x:top.x,z:top.z,k:.22,p:40,R:Math.max(200,(dEnd-dStart)*.5)};}
  mtnFade=ease(785,812);
  const p=path.frame(d);origin=p;if(Math.abs(d-lastD)>50)cam=p.h;lastD=d;cam+=(p.h-cam)*Math.min(1,delta*(reduced?40:7));lane+=(s.x-lane)*Math.min(1,delta*28);if(!paused&&screen!=='result')anim+=delta;
  jump+=((s.jumpY||0)-jump)*Math.min(1,delta*28);instances=[];touristGroups=[];flamingoInstances=0;r.begin();r.setOrigin(p.x,p.z);r.setHoles(active?s.objects.filter(o=>o.kind==='manhole'&&o.d>d-10&&o.d<d+180).map(o=>{const q=point(o.d,(o.lane-1)*2.5);return[q.x,q.z,.81];}):[]);curObjects=active?s.objects:[];r.setEnvironment(active?s.elapsed:0,s.speed||16,p.h);environment(d,active?s.elapsed:0,s.speed||16);special.snow(anim,reduced,1-Math.max(0,Math.min(1,((active?s.elapsed:0)-84)/6)),cam);tickNow=(s.tick||0)+visualSubtick*20;chaser=null;tongueDrawn=new Set();fogNow=active?fogAt(s.elapsed):0;
  if(active&&(s.boar>0||boarVis<30)){
   // Wildschwein rennt hinter Hornox her, rammt dabei die passierten Hindernisse aus dem Weg und kommt näher.
   const goal=s.boar>0?(s.boarGap||14):40;boarVis+=(goal-boarVis)*Math.min(1,delta*(goal>boarVis?.8:2.5));boarLane+=(lane-boarLane)*Math.min(1,delta*3);
   if(boarVis<30){const back=1.4+Math.max(0,boarVis-3)*.4,off=(boarLane-1)*2.5+(Math.abs(boarLane-lane)<.5?1.2:0),q=point(d-back,off);
    push(q.x,q.y,q.z,0,PI-q.h,0,.78);forest.boar(anim,1);forest.dust(anim);pop();
    for(const o of s.objects){if(rammed.has(o.id)||o.powerCleared||['coin','magnet','heart','shieldOrb','coinBoost','rushCharge','climbGear','snowshoes','fishCatch','mushroom','honey','plankGap','crevasse','ridgeGap','manhole','hook','stream'].includes(o.kind))continue;
     const od=o.d-(o.approach||0)*visualSubtick;if(od<d-back+1.4&&od>d-back-3){rammed.add(o.id);if(tossed.length>=12)tossed.shift();tossed.push({o:{id:o.id,kind:o.kind,lane:o.lane,d:o.d},time:anim,side:o.lane===0?-1:o.lane===2?1:(o.id%2?-1:1)});}}
   }
  }
  if(active&&npc.hiker&&(s.angry>0||chaseVis<30)){
   // Wütender Fischer rennt direkt hinter Hornox auf der Strecke und folgt seiner Spur mit kurzer Verzögerung.
   const goal=s.angry>30?s.chaseGap:40;chaseVis+=(goal-chaseVis)*Math.min(1,delta*(goal>chaseVis?.9:2.2));chaseLane+=(lane-chaseLane)*Math.min(1,delta*2.5);
   if(chaseVis<30){const back=2.6+Math.max(0,chaseVis-4)*.6,off=(chaseLane-1)*2.5,q=point(d-back,off),wind=s.angry>30?Math.max(0,Math.min(1,1-(s.nextCastTick-tickNow)/10)):0,flying=s.objects.some(o=>o.kind==='hook'&&o.landTick&&tickNow<o.landTick),reel=anim-reelT<.6;
    const swing=flying?-.55:reel?.9:wind*1.25,bob=Math.abs(Math.sin(anim*11))*.12,tq=point(d-back+1.7-swing*.6,off+.35);
    instances.push({actor:npc.hiker,pose:{x:q.x,y:q.y+bob,z:q.z,heading:PI/2-q.h,time:anim*2.7,variant:7,heightScale:1.05,style:0,lean:-.16}});
    push(q.x,q.y+bob,q.z,0,PI-q.h);lake.rod(swing);push(0,2.38*1.05,0);lake.hat();pop();pop();
    chaser={tip:[tq.x,tq.y+bob+3.05+swing*.35,tq.z]};
    // Nach einem Treffer zieht er die Angel mit der Schnur zurück.
    if(reel){const u=(anim-reelT)/.6,hx=Math.cos(cam)*(lane-1)*2.5,hz=Math.sin(cam)*(lane-1)*2.5,ex=hx+(chaser.tip[0]-hx)*u,ey=1.5+(chaser.tip[1]-1.5)*u,ez=hz+(chaser.tip[2]-hz)*u;lake.line(...chaser.tip,ex,ey,ez,.3);push(ex,ey,ez);lake.hook(anim,1);pop();}
   }
  }
  // Level 5: Beim Angriff steht vorne am Weg ein Baum mit Bienennest; der Schwarm fliegt aus dem Nest
  // heraus und folgt dann Hornox. Je näher er ist, desto enger schwirren die Bienen um seinen Kopf.
  if(beeNest&&d>=beeNest.d+340)beeNest=null;
  if(active&&(s.dog>0||dogVis<30)){
   const goal=s.dog>0?(s.dogGap||14):40;dogVis+=(goal-dogVis)*Math.min(1,delta*(goal>dogVis?.8:2.5));dogLane+=(lane-dogLane)*Math.min(1,delta*3.2);
   const fly=beeNest?Math.min(1,Math.max(0,(anim-beeNest.t)/2.4)):1,emerging=s.dog>0&&fly<1;
   if(dogVis<30||emerging){const back=Math.max(.6,(Math.min(dogVis,30)-3)*.55),spread=.5+Math.min(1.4,back*.12),q=point(d-back,(dogLane-1)*2.5);
    let cx=q.x,cy=q.y+1.9,cz=q.z;
    if(emerging){const h=point(beeNest.d,beeNest.side*(5.8-1.3)),hx=h.x+Math.cos(h.h)*0,e=fly*fly*(3-2*fly),hive=[h.x-Math.sin(-h.h)*0,h.y+2.55,h.z];cx=hive[0]+(cx-hive[0])*e;cy=hive[1]+(cy-hive[1])*e+Math.sin(fly*PI)*1.2;cz=hive[2]+(cz-hive[2])*e;}
    const sp=emerging?.25+fly*spread:spread;push(cx,cy,cz,0,PI-q.h);
    for(let j=0;j<9;j++){const t=anim*(2.2+j*.31)+j*1.9;push(Math.sin(t*1.7+j)*sp,Math.sin(t*2.6+j*.7)*.45*(emerging?fly:1),Math.cos(t*1.3+j)*sp*.8,0,t*2.4,0,.8);meadow.bee(anim,j);pop();}pop();}
  }
  if(active&&crocAttack){const u=(anim-crocAttack.t)/1.6;if(u>1)crocAttack=null;else{const rise=Math.min(1,u*4)*(u>.8?(1-u)/.2:1),open=u<.35?u/.35:u<.5?1-(u-.35)/.15*.9:.1+.1*Math.sin(u*30);at(d+6,(crocAttack.lane-1)*2.5+.4);push(0,0,0,0,PI-.3,0,1.7);blacklake.croc(anim,open,rise,1);fx&&a('ring',0,.05,0,1.2+u*2.5,1.2+u*2.5,.03,[.9,.97,1,49],PI/2);pop();pop();}}
  // Nach einem Bienenstich wird Hornox für drei Sekunden rot (pulsierend, dann verblassend).
  if(actor){const age=anim-stingT;actor.setRed(age>=0&&age<3?(1-age/3)*(.75+.25*Math.sin(age*14)):0);}
  if(active)for(const o of s.objects)obstacle(o,d,anim);
  tossed=tossed.filter(t=>anim-t.time<1.1);if(active)for(const t of tossed){const age=Math.max(0,anim-t.time),u=age/1.1;obstacle(t.o,d,anim,{side:t.side*(u*7),y:Math.sin(u*PI)*2.6,spin:reduced?0:t.side*u*2.4,lean:reduced?0:t.side*u*.65});}
  // Der Fischer erscheint nicht am Ufer; wütend rennt er hinter Hornox her (siehe vor der Hindernis-Schleife). Zustand zusätzlich als Bubble unten links (client.js).
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
