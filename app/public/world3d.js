// Reference-led architecture: every wall, balcony, roof and window has real depth.
// Alpen Resort official exterior / terrace; Bahnhofstrasse photographs, Tiia Monto.
const PI=Math.PI;
const C={wood:[.26,.16,.105,23],stone:[.53,.51,.45,24],plaster:[.85,.82,.73,22],trim:[.76,.75,.69,22],metal:[.13,.17,.18,25],glass:[.19,.32,.37,26],red:[.47,.12,.13,23],slate:[.29,.33,.34,27],white:[.91,.89,.81,22],leaf:[.20,.32,.15],flower:[.78,.08,.17]};
export function createArchitecture(r){const a=r.add,push=r.push,pop=r.pop;
 function sign(text,x,y,z,w,h){a('billboard',x,y,z,w,h,1,[1,1,1,30+text]);}
 function window(x,y,z,w=1.1,h=1.6,shutters=false,detailed=true){
  a('box',x,y,z,w+.19,h+.20,.15,C.trim);a('box',x,y,z+.09,w,h,.035,C.glass);
  a('box',x,y,z+.12,.055,h,.045,C.wood);a('box',x,y-.16,z+.12,w,.05,.045,C.wood);
  a('box',x,y-h/2-.08,z+.11,w+.35,.12,.30,C.trim);
  if(shutters)for(const s of[-1,1]){a('box',x+s*(w*.76+.13),y,z+.05,w*.40,h,.09,C.red);if(detailed)for(const yy of[-.5,0,.5])a('box',x+s*(w*.76+.13),y+yy*h*.60,z+.104,w*.33,.035,.016,[.27,.09,.08]);}
  if(detailed){a('box',x-w*.32,y,z+.115,w*.17,h*.92,.018,[.72,.72,.64]);a('box',x+w*.32,y,z+.115,w*.17,h*.92,.018,[.72,.72,.64]);}
 }
 function planter(x,y,z,w=1.3,detailed=true){a('box',x,y,z,w,.23,.30,C.wood);a('box',x,y+.16,z,w*.96,.16,.27,C.leaf);for(let i=0;i<(detailed?5:2);i++)a('blossom',x+(i/(detailed?4:1)-.5)*w*.85,y+.24,z+.03,.13,.10,.14,C.flower);}
 function balcony(y,w,z,white=false,detailed=true){a('box',0,y,z,w+.6,.17,1.25,C.trim);a('box',0,y+.88,z+.59,w+.55,.09,.08,C.wood);if(white)a('box',0,y+.42,z+.57,w+.45,.64,.06,[.85,.86,.81,26]);else a('box',0,y+.40,z+.57,w+.45,.65,.08,C.wood);for(let x=-w/2;x<=w/2+.01;x+=detailed?.75:2)a('box',x,y+.48,z+.65,.055,.88,.055,C.wood);}
 function pitchedRoof(w,depth,h,wood=false){a('roof',0,h,-depth/2,w/1.15,3.8,depth+.8,wood?C.wood:C.slate);a('box',0,h,-depth/2,w+.8,.17,depth+.8,C.wood);a('box',-w*.3,h+1.45,-depth*.7,.55,2,.62,C.stone);}
 function hotel(detailed=true,doorOpen=0){
  const w=21,h=13.0,depth=9,stone=[.53,.52,.46,24],cream=[.89,.88,.82,22],wood=[.24,.16,.10,23],glass=[.64,.73,.71,26];
  // Ground-floor opening is a real gap, not a painted door on a solid wall.
  a('box',0,8.3,-4.5,w,9.4,depth,cream);
  for(const side of[-1,1]){a('box',side*6.15,1.8,-4.5,8.7,3.6,9,stone);a('box',side*1.98,1.75,.13,.40,3.5,.46,stone);}
  a('box',0,1.65,-2.5,3.6,3.3,.20,[.09,.13,.12]);a('box',0,-.035,-.9,3.65,.07,3.9,[.45,.47,.43,24]);
  a('box',0,3.35,.12,3.55,.20,.30,[.13,.16,.15,25]);
  for(const side of[-1,1]){const x=side*(.83+doorOpen*1.44);a('box',x,1.65,.14,1.63,3.18,.10,[.17,.23,.23,26]);for(const xx of[-.78,.78])a('box',x+xx,1.65,.21,.055,3.18,.05,[.19,.23,.23,25]);a('box',x,1.65,.22,1.6,.04,.04,[.76,.77,.70]);}
  // Low entrance canopy and restrained original blue hotel wordmark.
  a('box',0,3.52,1.0,8.7,.20,2.6,cream);a('box',0,3.50,2.34,8.7,.50,.22,cream);sign(10,0,3.30,2.47,7.5,.40);
  for(const x of[-7.5,-4.4,4.4,7.5]){a('box',x,1.65,.11,2.5,2.9,.18,[.12,.19,.19,25]);a('box',x,1.65,.22,2.3,2.7,.035,glass);a('box',x,1.65,.26,.055,2.72,.04,cream);}
  // Long pale-glass balconies and dark beams match the supplied entrance photo.
  for(let floor=0;floor<3;floor++){
   const y=5.0+floor*2.8;
   for(const x of[-8,-5.33,-2.66,0,2.66,5.33,8]){a('box',x,y,-.02,2.2,2.1,.15,wood);a('box',x,y,.07,1.98,1.92,.025,[.16,.22,.21,26]);a('box',x,y,.11,.055,1.98,.045,cream);}
   a('box',0,y-1.16,.66,w+.15,.21,1.65,cream);
   a('box',0,y-.60,1.46,w+.18,.93,.075,glass);
   a('box',0,y-.10,1.47,w+.26,.075,.08,[.16,.21,.20,25]);
   for(let x=-10.3;x<10.4;x+=2.57)a('box',x,y-.62,1.51,.055,1.03,.07,[.26,.29,.25,25]);
   for(const x of[-8.9,4.4]){a('box',x,y-.42,1.66,2.0,.72,.18,wood);for(let k=0;k<9;k++)a('box',x-.85+k*.21,y-.42,1.77,.045,.59,.05,cream);planter(x,y+.02,1.73,2.15,true);}
  }
  a('roof',0,h,-4.5,w/1.15,5.0,10.2,wood);a('box',0,h-.05,-4.5,w+1,.20,10.2,wood);
  // Attic balcony, timber gable ribs, roof eaves and flower baskets.
  for(const x of[-2.1,0,2.1])window(x,13.65,.70,1.25,1.3,false,false);
  push(0,0,.25);balcony(12.9,6.6,.35,false,true);pop();for(const x of[-2.5,0,2.5])planter(x,13.92,1.25,1.7,true);
  for(let x=-9;x<=9;x+=1.5)a('box',x,12.85,.7,.16,.25,1.6,wood);
  a('box',0,14.35,.25,.18,2.6,.22,wood);
  // Entrance noticeboard, chalk menu, lanterns and potted shrubs.
  a('box',3.0,2.25,.35,.76,1.2,.14,[.11,.16,.15]);a('box',3.0,2.25,.44,.59,.96,.025,[.73,.71,.59]);
  for(const x of[-2.4,2.4]){a('box',x,.36,1.35,.65,.72,.65,[.21,.25,.22]);a('sphere',x,1.02,1.35,.48,.57,.48,[.23,.34,.17]);a('box',x,2.8,.40,.15,.35,.20,[1,.81,.50,47]);}
  push(3.1,0,2.6,0,-.16);a('box',0,.79,0,.94,1.45,.10,wood,-.12);a('box',0,.85,.10,.77,1.13,.035,[.19,.31,.29]);for(const y of[.55,.74,.93,1.12])a('box',0,y,.14,.53,.025,.02,[.83,.82,.67]);pop();
 }
 function terraceChair(x,z,angle=0,sofa=false){push(x,0,z,0,angle);const w=sofa?1.8:.8;
  a('box',0,.52,0,w,.16,.86,[.69,.63,.52,22]);a('box',0,.97,-.39,w,.87,.13,[.65,.59,.48,22],-.10);
  for(const side of[-1,1]){a('box',side*(w/2+.04),.83,0,.065,.065,1.0,C.wood);for(const zz of[-.36,.36])a('box',side*w*.44,.28,zz,.045,.56,.045,C.metal);}pop();
 }
 function entranceTerrace(){
  a('box',0,-.10,11.5,21,.18,24,[.55,.56,.51,24]);
  for(const side of[-1,1]){
   for(const z of[5.5,11,16.8]){
    const x=side*6.0;a('box',x,.82,z,2.2,.10,1.45,[.54,.42,.27,23]);for(const xx of[-.88,.88])for(const zz of[-.54,.54])a('box',x+xx,.41,z+zz,.06,.82,.06,C.metal);
    terraceChair(x-1.55,z,PI/2);terraceChair(x+1.55,z,-PI/2);
    a('cylinder',x+.28,.99,z,.11,.25,.11,[.90,.88,.78]);a('sphere',x+.28,1.15,z,.13,.10,.13,C.leaf);
    if(z!==11){a('cylinder',x,2.05,z,.055,4.1,.055,[.61,.42,.23,23]);a('squareUmbrella',x,3.73,z,3.0,.65,2.8,[.94,.88,.74,22]);for(const angle of[0,PI/2,PI,PI*1.5]){push(x,3.77,z,0,angle);a('box',0,.12,1.25,.055,.055,2.5,[.61,.42,.23],-.15);pop();}}
   }
   for(const z of[3,8,14,20]){a('box',side*9.8,.50,z,.8,1,1.7,[.23,.28,.23]);a('sphere',side*9.8,1.45,z,.57,.9,1.03,[.24,.35,.16]);}
  }
  terraceChair(4.0,4.0,.1,true);terraceChair(4.1,7.0,.1,true);
  for(const side of[-1,1]){a('box',side*11.0,.60,11.5,.30,1.2,23,C.wood);for(const z of[3,7,11,15,19]){a('box',side*11.0,.87,z,.35,1.75,.18,C.metal);a('sphere',side*12.3,1.05,z,.80,1.2,1.7,[.22,.32,.15]);}for(const z of[6,17]){a('cylinder',side*15,1.8,z,.13,3.6,.13,C.wood);a('spruce',side*15,.8,z,1.6,5.6,1.6,[1,1,1]);}}
  // Flags over the entrance canopy, as in the reference photo.
  for(let k=-2;k<=2;k++){a('cylinder',k*.55,4.4,2.1,.025,2.7,.025,C.metal);a('box',k*.55+.17,5.15,2.1,.34,1.3,.025,k===0?[.83,.68,.30]:[.87,.86,.79]);}
 }
 // Seven actual Zermatt collection businesses; promotional placement in the game street.
 function lightbox(brand,x,y,z,w,h){
  a('box',x,y+h/2,z,w+.13,h+.13,.18,[.075,.085,.082,25]);
  sign(brand,x,y,z+.102,w,h);
  a('box',x,y-.035,z+.11,w,.025,.025,[1,.79,.43,47]);
 }
 function building(variant=0,detailed=true,far=false,brand=0){
  const woods=[[.21,.13,.085,23],[.15,.105,.085,23],[.29,.12,.10,23],[.29,.21,.14,23]],wood=woods[variant%4];
  const timber=variant!==2&&variant!==5,w=[11.8,11.0,12.2,11.6,12.0,11.4,11.8][variant%7],floors=[3,4,4,3,4,3,4][variant%7],h=3.5+floors*2.65,depth=8;
  // Separate upper wall and retail plinth: no coplanar overlapping facade shells.
  a('box',0,(h+3.3)/2,-depth/2,w,h-3.3,depth,timber?wood:variant===2?[.84,.81,.71,22]:[.74,.75,.69,22]);
  a('box',0,1.65,-depth/2,w,3.3,depth,[.43,.42,.37,24]);
  pitchedRoof(w,depth,h,false);
  a('box',0,h-.12,.14,w+.45,.24,.42,wood);
  const cols=variant===2?4:3,shutter=variant===4?[.13,.33,.48,23]:[.43,.12,.13,23];
  for(let f=0;f<floors;f++){
   const y=4.65+f*2.65;
   a('box',0,y-1.22,.09,w,.14,.18,wood);
   for(let k=0;k<cols;k++){
    const x=(k-(cols-1)/2)*w/(cols+.25);
    window(x,y,.10,1.22,1.62,false,false);
    if(!timber||variant===4)for(const side of[-1,1]){a('box',x+side*.96,y,.12,.46,1.64,.12,shutter);a('box',x+side*.96,y-.48,.19,.44,.065,.035,wood);}
   }
   if(timber){
    // Deep, continuous chalet balconies with open vertical timber slats.
    const by=y-1.03;
    a('box',0,by,.64,w+.45,.20,1.52,[.45,.37,.29,23]);
    a('box',0,by+.94,1.37,w+.48,.12,.14,wood);
    a('box',0,by+.18,1.37,w+.45,.11,.12,wood);
    for(let x=-w/2;x<=w/2+.01;x+=(detailed?.46:.92))a('box',x,by+.54,1.37,.24,.71,.11,wood);
    for(const x of[-w*.43,0,w*.43]){a('box',x,by-.32,.68,.13,.65,.9,wood,0,0,.14);planter(x,by+.90,1.48,w*.23,detailed);}
   }else for(let k=0;k<cols;k++)planter((k-(cols-1)/2)*w/(cols+.25),y-.97,.38,1.32,detailed);
  }
  // Exposed rafters and roof gutter with real depth.
  for(let x=-w*.45;x<w*.5;x+=1.35)a('box',x,h-.10,.37,.15,.25,1.25,wood);
  for(const side of[-1,1]){a('cylinder',side*(w/2-.13),h/2,.23,.046,h,.046,[.19,.21,.21,25]);push(side*w/2,0,-4,0,side*PI/2);for(let f=0;f<floors;f++)for(const x of[-2.5,.6])window(x,4.65+f*2.65,.06,1.05,1.65,false,false);pop();}
  // Warm shop glazing, recessed doors, display shelves, thin metal mullions.
  for(let k=-1;k<=1;k++){
   const x=k*w*.305,ww=w*.275;
   a('box',x,1.55,.11,ww,2.75,.18,[.10,.12,.12,25]);
   a('box',x,1.55,.212,ww-.17,2.53,.025,[.32,.25,.16,48]);
   a('box',x,2.71,.25,ww-.23,.07,.04,[1,.83,.51,47]);
   a('box',x,1.52,.26,.045,2.61,.045,[.50,.43,.29,25]);
   a('box',x,.50,.28,ww-.19,.12,.14,wood);
   for(let j=0;j<3;j++){const xx=x+(j-1)*ww*.25;a('box',xx,.76,.275,.34,.42+(j%2)*.22,.06,[.58+j*.09,.41+j*.07,.23+j*.10]);a('box',xx,1.70,.275,.28,.35,.06,[.73,.67,.48]);}
  }
  a('box',0,1.42,.36,1.38,2.74,.20,wood);a('box',0,1.48,.48,1.13,2.42,.035,[.14,.21,.22,26]);a('box',.41,1.32,.54,.045,.48,.055,[.78,.65,.38,25]);
  lightbox(brand,0,3.05,.32,brand===6?2.0:brand===3?4.2:w*.66,brand===6?1.50:.88);
  const awning=variant%3===0?[.44,.13,.14,23]:variant%3===1?[.12,.29,.24,23]:[.78,.71,.55,22];
  // Split awnings leave the central brand visible.
  for(const side of[-1,1]){a('box',side*w*.31,2.93,1.02,w*.29,.12,1.65,awning,.16);a('box',side*w*.31,2.65,1.82,w*.29,.28,.07,awning);}
  // Double-sided projecting sign, recognisable while running along the street.
  a('box',w*.39,4.95,.94,.075,.075,1.9,[.16,.18,.17,25]);
  push(w*.39,0,1.58,0,PI/2);lightbox(brand,0,3.9,0,brand===6?1.12:2.1,brand===6?1.24:1.05);pop();
  push(w*.39,0,1.58,0,-PI/2);lightbox(brand,0,3.9,0,brand===6?1.12:2.1,brand===6?1.24:1.05);pop();
 }
 function hornox(){const w=9,h=10.8; a('box',0,h/2,-3.4,w,h,6.8,C.plaster);a('box',1.4,6.3,.08,4.6,9,.18,C.wood);a('box',0,1.2,.13,w,2.4,.3,C.stone);pitchedRoof(w,6.8,h,true);for(const x of[-4.3,-.9,3.9])a('box',x,6.7,.20,.18,8.2,.19,C.wood);for(const y of[3.4,5.8,8.2,10])window(-2.7,y,.21,.88,1,false,true);sign(0,1.4,8.3,.24,3.8,.95);sign(1,1.4,6.95,.24,3.8,.80);a('box',.5,1.2,.32,3.6,2.4,.16,C.metal);a('box',.5,1.2,.42,3.4,2.2,.035,C.glass);a('roof',.5,2.7,.95,4.3,.6,1.6,C.slate);for(const x of[-2.1,3.4]){a('box',x,.38,1.1,1.4,.76,.70,[.19,.23,.22]);a('sphere',x,1.04,1.1,.52,.68,.45,C.leaf);}}
 function church(){a('box',0,5,-7,10,10,14,C.plaster);a('roof',0,10,-7,9,5.3,15,C.slate);a('box',-4.3,8,1,4.8,16,5,C.stone);a('spire',-4.3,16,1,2.9,11,2.9,C.slate);a('cylinder',-4.3,27.3,1,.04,1.3,.04,C.metal);a('box',-4.3,27.6,1,.8,.07,.07,C.metal);for(const x of[-5.4,-3.3])window(x,14.4,3.57,.68,1.4,false,false);a('billboard',-4.3,10.8,3.57,2.1,2.1,1,[1,1,1,39]);for(const x of[-3,0,3])window(x,5.8,.12,1.25,3,false,false);}
 function lamp(){a('cylinder',0,2.2,0,.045,4.4,.045,C.metal);a('box',.28,4.25,0,.63,.07,.09,C.metal);a('cone',.56,4.05,0,.26,.22,.26,C.metal);a('sphere',.56,4.05,0,.14,.09,.14,[.98,.89,.65]);}
 function flag(time=0){a('cylinder',0,2.8,0,.035,5.6,.035,C.metal);push(.65,4.6,0,0,Math.sin(time*1.4)*.07);a('box',0,0,0,1.24,.92,.035,[.78,.06,.10]);a('box',0,0,.024,.17,.61,.017,C.white);a('box',0,0,.025,.61,.17,.017,C.white);pop();}
 function terrace(){for(const x of[-4,0,4]){push(x,0,3);a('cylinder',0,.70,0,.65,.07,.65,C.wood);a('cylinder',0,.35,0,.045,.7,.045,C.metal);a('cylinder',0,1.55,0,.035,3.1,.035,C.wood);a('umbrella',0,2.75,0,2.1,.65,2.1,[.87,.82,.69]);for(const s of[-1,1]){a('box',s*1,.45,0,.58,.10,.65,C.wood);a('box',s*1.25,.85,0,.10,.8,.65,C.wood);for(const z of[-.24,.24])a('box',s*1,.22,z,.06,.45,.06,C.metal);}pop();}}
 return{hotel,entranceTerrace,hornox,building,church,lamp,flag,terrace,sign,planter};
}
// Dense 3D mountain geometry with smooth normals and rock/snow vertex colours.
export function worldGeometry(){const out={};
 function mesh(name,fn){const data=[];const v=(p,n,c=[1,1,1])=>data.push(...p,...n,...c);const tri=(a,b,c,col)=>{const u=b.map((q,i)=>q-a[i]),w=c.map((q,i)=>q-a[i]),n=[u[1]*w[2]-u[2]*w[1],u[2]*w[0]-u[0]*w[2],u[0]*w[1]-u[1]*w[0]],l=Math.hypot(...n)||1;for(const p of[a,b,c])v(p,n.map(x=>x/l),col);};fn(v,tri);out[name]=new Float32Array(data);}
 const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
 const noise=(x,z)=>{const i=Math.floor(x),j=Math.floor(z),a=x-i,b=z-j,u=a*a*(3-2*a),v=b*b*(3-2*b);return(1-u)*(1-v)*hash(i,j)+u*(1-v)*hash(i+1,j)+(1-u)*v*hash(i,j+1)+u*v*hash(i+1,j+1);};
 for(const name of['mountain','matterhorn'])mesh(name,(v)=>{const n=name==='matterhorn'?64:40;const height=(x,z)=>{if(name==='matterhorn'){const peak=Math.max(0,1-Math.max(Math.abs(x-.12),Math.abs(z+.10))*.94);return Math.pow(peak,1.12)*(1+(.50*noise(x*11,z*11)+.26*noise(x*27,z*27)-.38)*(1-peak)*.36);}const r=Math.sqrt(x*x*.72+z*z);return Math.pow(Math.max(0,1-r),1.35)*(.72+.25*noise(x*5,z*5)+.12*noise(x*14,z*14))+.024*noise(x*30,z*30)*Math.max(0,1-r);};
 const vertex=(i,j)=>{const x=i/n*2-1,z=j/n*2-1,h=height(x,z),e=.004,dx=(height(x+e,z)-height(x-e,z))/(2*e),dz=(height(x,z+e)-height(x,z-e))/(2*e),l=Math.hypot(dx,1,dz),norm=[-dx/l,1/l,-dz/l],snow=name==='matterhorn'?h>.40+noise(x*17,z*17)*.22:h>.64+noise(x*12,z*12)*.10;const col=snow?[.87,.91,.92]:h<.25&&name==='mountain'?[.28,.34,.23]:[.46,.46,.41];const shade=.88+noise(x*75,z*75)*.16;return{p:[x,h,z],n:norm,c:col.map(k=>k*shade)};};
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const a=vertex(i,j),b=vertex(i+1,j),c=vertex(i+1,j+1),d=vertex(i,j+1);for(const p of[a,d,c,a,c,b])v(p.p,p.n,p.c);}});
 mesh('wellWall',(v)=>{for(let i=0;i<48;i++){const a=i*PI/24,b=(i+1)*PI/24;for(const [ang,y]of[[a,0],[b,0],[b,-1],[a,0],[b,-1],[a,-1]])v([Math.cos(ang),y,Math.sin(ang)],[-Math.cos(ang),0,-Math.sin(ang)]);}});
 mesh('coinFace',(v)=>{for(let i=0;i<48;i++){const a=i*PI/24,b=(i+1)*PI/24;for(const p of[[0,.5,0],[Math.cos(a)*.5,.5+Math.sin(a)*.5,0],[Math.cos(b)*.5,.5+Math.sin(b)*.5,0]])v(p,[0,0,1]);}});
 // Rounded solid chassis and camera props; smooth bevels catch the daylight.
 mesh('roundedBox',(v)=>{const R=.12,N=8;for(let axis=0;axis<3;axis++)for(const side of[-1,1]){
  const point=(u,w)=>{const p=[0,0,0];p[axis]=side*.5;p[(axis+1)%3]=u;p[(axis+2)%3]=w;const q=p.map(x=>Math.max(-.5+R,Math.min(.5-R,x))),n=p.map((x,i)=>x-q[i]),l=Math.hypot(...n);return{p:q.map((x,i)=>x+n[i]/l*R),n:n.map(x=>x/l)};};
  for(let i=0;i<N;i++)for(let j=0;j<N;j++){const a=point(i/N-.5,j/N-.5),b=point((i+1)/N-.5,j/N-.5),c=point((i+1)/N-.5,(j+1)/N-.5),d=point(i/N-.5,(j+1)/N-.5);for(const q of[a,b,c,a,c,d])v(q.p,q.n);}
 }});
 mesh('auraRing' ,(v)=>{const p=(a,b)=>[(1+.022*Math.cos(b))*Math.cos(a),(1+.022*Math.cos(b))*Math.sin(a),.022*Math.sin(b)],n=(a,b)=>[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];for(let i=0;i<64;i++)for(let j=0;j<6;j++){const a=i*PI/32,b=j*PI/3,c=(i+1)*PI/32,d=(j+1)*PI/3;for(const q of[[a,b],[c,b],[c,d],[a,b],[c,d],[a,d]])v(p(...q),n(...q));}});
 mesh('squareUmbrella',(_,t)=>{const corners=[[-1,0,-1],[1,0,-1],[1,0,1],[-1,0,1]];for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],m=[(a[0]+b[0])*.5,.10,(a[2]+b[2])*.5];t(a,[0,1,0],m);t(m,[0,1,0],b);t(a,b,[b[0],-.10,b[2]]);t(a,[b[0],-.10,b[2]],[a[0],-.10,a[2]]);}});
 mesh('blossom',(v)=>{const p=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let i=0;i<4;i++)for(let j=0;j<8;j++){const a=p(i*PI/4,j*PI/4),b=p((i+1)*PI/4,j*PI/4),c=p((i+1)*PI/4,(j+1)*PI/4),d=p(i*PI/4,(j+1)*PI/4);for(const q of[a,b,c,a,c,d])v(q,q);}});
 mesh('heart',(v)=>{
  const N=64,R=8;
  const p=(r,t,side)=>[Math.pow(Math.sin(t),3)*.91*r,(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/18*r,side*.31*Math.sqrt(Math.max(0,1-r*r))];
  const emit=(r,t,side)=>{const q=p(r,t,side),n=[q[0]*.40,q[1]*.40,side*Math.max(.04,Math.sqrt(Math.max(0,1-r*r)))],l=Math.hypot(...n);v(q,n.map(x=>x/l));};
  for(const side of[-1,1])for(let k=0;k<R;k++)for(let i=0;i<N;i++){const a=i*PI*2/N,b=(i+1)*PI*2/N,u=k/R,w=(k+1)/R;for(const [r,t]of[[u,a],[w,a],[w,b],[u,a],[w,b],[u,b]])emit(r,t,side);}
 });
 mesh('spruce',(v)=>{for(let tier=0;tier<9;tier++){const base=tier*.087,rad=(1-tier*.085),height=.24,segments=28,rings=4;const p=(u,j)=>{const ang=j*PI*2/segments,r=rad*Math.pow(1-u,.8)*(1+.12*Math.sin(j*8.3+tier*4)+.07*Math.sin(j*4.7));return[Math.cos(ang)*r,base+u*height,Math.sin(ang)*r];};for(let k=0;k<rings;k++)for(let j=0;j<segments;j++){const a=p(k/rings,j),b=p(k/rings,j+1),c=p((k+1)/rings,j+1),d=p((k+1)/rings,j);for(const q of[a,d,c,a,c,b]){const l=Math.hypot(q[0],rad*.65,q[2]);v(q,[q[0]/l,rad*.65/l,q[2]/l],[.14+tier*.006,.26+tier*.008,.14+tier*.003]);}}}});
 mesh('spire',(_,t)=>{for(let i=0;i<4;i++){const a=i*PI/2+PI/4,b=(i+1)*PI/2+PI/4;t([Math.cos(a),0,Math.sin(a)],[0,1,0],[Math.cos(b),0,Math.sin(b)]);}});
 mesh('umbrella',(_,t)=>{for(let i=0;i<16;i++){const a=i*PI/8,b=(i+1)*PI/8;t([Math.cos(a),0,Math.sin(a)],[0,1,0],[Math.cos(b),0,Math.sin(b)],i%2?[.94,.94,.94]:[1,1,1]);}});
 return out;
}
