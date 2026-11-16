// Hand-authored, instanced 3D props and a small reusable cloth surface.
const PI=Math.PI;
export function createSpecials(r){
 const a=r.add,push=r.push,pop=r.pop,dark=[.075,.10,.11,25],chrome=[.68,.74,.76,25],gold=[1,.72,.20,9];
 const cloth=new Float32Array(14*24*6*9);let capeVertices=0;
 function tube(p,q,width,colour){const dx=q[0]-p[0],dy=q[1]-p[1],dz=q[2]-p[2],len=Math.hypot(dx,dy,dz);a('cylinder',(p[0]+q[0])*.5,(p[1]+q[1])*.5,(p[2]+q[2])*.5,width,len,width,colour,Math.atan2(dz,dy),0,Math.atan2(-dx,Math.hypot(dy,dz)));}
 function electric(time,id){
  const paint=id%2?[.10,.34,.33,25]:[.70,.13,.16,25];
  // Compact, upright Zermatt hotel shuttle: short nose, panoramic cabin and roof luggage.
  r.prefab('electric-'+id%2,()=>{
   a('roundedBox',0,.72,0,1.85,.88,2.85,paint);a('roundedBox',0,1.52,-.10,1.80,1.35,2.50,paint);
   a('box',0,1.65,1.165,1.57,.80,.045,[.15,.28,.32,26]);
   a('box',0,1.65,-1.365,1.55,.80,.04,[.14,.27,.30,26]);
   a('roundedBox',0,2.25,-.09,1.94,.16,2.64,[.88,.87,.79,25]);
   a('roundedBox',0,.44,1.46,1.92,.20,.19,dark);a('roundedBox',0,.44,-1.46,1.92,.20,.19,dark);
   for(const side of[-1,1]){
    for(const z of[-.65,.50]){a('box',side*.91,1.65,z,.035,.8,.92,[.17,.31,.34,26]);a('box',side*.94,1.12,z,.025,.045,.20,chrome);}
    a('box',side*.91,1.62,-.1,.06,1.12,.06,paint);
    a('roundedBox',side*.61,.88,1.438,.40,.23,.065,[1,.90,.56,47]);a('roundedBox',side*.65,.86,-1.44,.22,.20,.04,[1,.14,.10,47]);
    tube([side*.91,1.65,1.0],[side*1.05,1.64,1.17],.035,dark);a('roundedBox',side*1.04,1.65,1.20,.15,.21,.12,dark);
    a('box',side*.77,2.40,-.10,.055,.055,1.85,chrome);
   }
   a('roundedBox',0,2.47,-.44,1.15,.35,.72,[.31,.37,.29,23]);a('box',0,2.65,-.44,.05,.03,.76,[.73,.71,.58]);
   a('box',0,2.37,.76,.68,.23,.09,[.88,.80,.46,47]);a('billboard',0,2.29,.811,.62,.16,1,[1,1,1,41]);
   for(const x of[-.30,0,.30])a('box',x,.64,1.455,.15,.025,.03,chrome);
   a('box',0,.47,1.57,.49,.11,.025,[.90,.91,.85]);
   // Small steering wheel and driver visible within the front glazing.
   a('sphere',-.43,1.70,1.20,.13,.15,.035,[.61,.39,.26]);
  });
  for(const side of[-1,1])for(const z of[-.93,.92]){
   push(side*.87,.39,z,0,0,PI/2);a('cylinder',0,0,0,.35,.24,.35,dark);a('cylinder',0,side<0?.135:-.135,0,.21,.025,.21,chrome);
   for(let i=0;i<5;i++){const v=i*PI*2/5+time*6;a('box',Math.cos(v)*.13,side<0?.155:-.155,Math.sin(v)*.13,.10,.025,.045,dark,0,-v);}pop();
  }
 }
 function person(x,z,k,time,photo=true){
  const skin=[[.72,.46,.30],[.40,.25,.17],[.91,.68,.51]][k],coat=[[.14,.34,.47],[.70,.16,.19],[.83,.73,.51]][k],trousers=[.16,.20,.23];
  push(x,0,z,0,(k-1)*.32,0,k===1?.91:1);
  const gait=time*4.6+k*2,breath=Math.abs(Math.sin(gait))*.045;
  for(const side of[-1,1]){const stride=Math.sin(gait)*side*.32,lift=Math.max(0,Math.cos(gait)*side)*.14;const foot=[side*.18,.20+lift,stride],knee=[side*.17,.60+lift*.4,stride*.55+.10];tube([side*.16,1.03+breath,0],knee,.13,trousers);tube(knee,foot,.115,trousers);a('roundedBox',foot[0],.13+lift,foot[2]+.07,.30,.22,.48,[.14,.13,.12,25]);}
  a('sphere',0,1.39+breath,0,.37,.50,.23,coat);a('sphere',0,1.82+breath,0,.12,.16,.13,skin);
  a('sphere',0,2.06+breath,0,.225,.28,.22,skin);a('sphere',0,2.22+breath,-.035,.23,.15,.22,k===1?[.17,.12,.08]:[.30,.20,.12]);
  for(const side of[-1,1]){a('sphere',side*.10,2.10+breath,.199,.035,.028,.021,[.06,.08,.09]);a('sphere',side*.228,2.06+breath,0,.042,.065,.045,skin);}
  a('sphere',0,2.035+breath,.228,.045,.053,.055,skin);
  // Walking gait remains independent from the camera pose.
  if(photo){
  for(const side of[-1,1]){tube([side*.30,1.65+breath,0],[side*.43,1.48+breath,.24],.10,coat);tube([side*.43,1.48+breath,.24],[side*.17,1.98+breath,.43],.085,coat);a('sphere',side*.17,1.98+breath,.43,.08,.10,.08,skin);}
  if(k===1){a('roundedBox',0,2.08+breath,.47,.16,.30,.055,[.08,.10,.12,25]);a('box',0,2.08+breath,.505,.12,.23,.012,[.35,.58,.67,26]);a('sphere',.04,2.19+breath,.507,.026,.026,.014,dark);}
  else{a('roundedBox',0,2.01+breath,.47,.35,.22,.17,dark);a('cylinder',0,2.01+breath,.60,.08,.12,.08,[.22,.30,.32,26],PI/2);a('sphere',.13,2.10+breath,.56,.032,.025,.02,[.90,.91,.86]);}
  }else for(const side of[-1,1]){const swing=-Math.sin(gait)*side*.24;const hand=[side*.40,1.00+breath,swing];tube([side*.30,1.65+breath,0],[side*.40,1.32+breath,swing*.5],.10,coat);tube([side*.40,1.32+breath,swing*.5],hand,.085,coat);a('sphere',...hand,.08,.11,.08,skin);}
  a('box',0,1.40+breath,.237,.022,.63,.013,[.65,.66,.61,25]);for(const side of[-1,1])a('box',side*.20,1.25+breath,.20,.15,.022,.022,[.12,.14,.14]);
  // Travel bag and shoulder strap, kept behind the camera silhouette.
  a('roundedBox',.33,1.02,-.02,.23,.34,.25,[.34,.28,.19,23]);tube([-.19,1.76,-.23],[.30,1.07,-.24],.025,[.12,.11,.09]);
  pop();
 }
 function walker(time,id){person(0,0,Math.abs(id)%3,time,false);}
 function photographers(time){person(-.49,.16,0,time);person(.48,-.16,1,time);person(.04,-.95,2,time);}
 function coin(time,id){
  push(0,1.03+Math.sin(time*3+id)*.08,0,0,time*1.7+id);
  a('cylinder',0,0,0,.235,.07,.235,gold,PI/2);
  for(const side of[-1,1]){push(0,0,side*.039,0,side<0?PI:0);a('coinFace',0,-.214,.002,.428,.428,1,[1,.70,.2,50]);a('ring',0,0,.006,.218,.218,.07,[1,.86,.44,9]);pop();}
  // Reeding around the edge, instanced with the same tiny geometry.
  for(let i=0;i<24;i++){const p=i*PI/12;a('box',Math.cos(p)*.235,Math.sin(p)*.235,0,.015,.011,.067,[.85,.49,.10,9],0,0,p);}
  pop();
 }
 function rush(time,reduced,amount=1){
  const t=reduced?0:time*9;
  const point=(u,v)=>[u*(.52+v*.52)+Math.sin(t*.65-v*3)*v*.08,2.57-v*1.58+Math.sin(t+v*9+u*3)*v*.17,.49+v*1.20+Math.sin(t*.85-v*8+u*4)*v*.20];
  let count=0;
  const vertex=(u,v)=>{const p=point(u,v),du=point(u+.004,v),dv=point(u,v+.004),a=du.map((x,i)=>x-p[i]),b=dv.map((x,i)=>x-p[i]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],l=Math.hypot(...n);for(const x of[...p,...n.map(x=>x/l),u*.5+.5,v,1])cloth[count++]=x;};
  for(let i=0;i<14;i++)for(let j=0;j<24;j++){const u=i/7-1,w=(i+1)/7-1,v=j/24,q=(j+1)/24;for(const [x,y]of[[u,v],[w,v],[w,q],[u,v],[w,q],[u,q]])vertex(x,y);}
  r.setGeometry('cape',cloth,52);capeVertices=count/9;
  for(let i=0;i<14;i++)tube(point(i/7-1,1),point((i+1)/7-1,1),.022,gold);
  for(const side of[-1,1]){a('sphere',side*.49,2.57,.45,.095,.07,.075,gold);tube([side*.49,2.57,.45],[side*.45,2.50,-.12],.045,[.035,.16,.10]);}
  // Continuous blue-white lightning, not screen flashes. Reduced motion keeps a static aura.
  for(let k=0;k<4;k++){
   const angle=k*PI/2+(reduced?.4:time*.8),radius=1.03;
   let previous=null;
   for(let j=0;j<7;j++){
    const aa=angle+Math.sin(j*3.2+k+time*(reduced?0:2.4))*.18,rr=radius+Math.sin(j*4.1+k)*.15;
    const p=[Math.cos(aa)*rr,.22+j*.48,Math.sin(aa)*rr];
    if(previous){tube(previous,p,.032,[.15,.67,1,51]);}if(j===3){const q=[p[0]*1.36,p[1]+.30,p[2]*1.36];tube(p,q,.019,[.37,.77,1,51]);tube(q,[q[0]*1.13,q[1]+.24,q[2]*1.13],.010,[.62,.88,1,51]);}previous=p;
   }
  }
  a('auraRing',0,.12,0,1.38,1.38,1,[.15,.70,1,51],PI/2);
  if(!reduced)for(let k=0;k<10;k++){const angle=k*2.4,offset=(time*2+k*.17)%1;a('cylinder',Math.cos(angle)*(1.5+offset),.3+(k%4)*.7,1+offset*4,.012,.8+offset*1.2,.012,[.63,.85,1,51],PI/2);}
 }
 function manhole(){
  a('wellWall',0,.035,0,.81,2.5,.81,[.17,.20,.21,25]);a('cylinder',0,-2.40,0,.80,.02,.80,[.012,.025,.035]);
  a('auraRing',0,.065,0,.85,.85,2.8,[.38,.42,.43,25],PI/2);
  // Hinged iron lid, visibly open, with a recessed rim and grating.
  push(0,.76,-.88,1.12);a('cylinder',0,0,0,.76,.10,.76,[.27,.31,.32,25]);
  for(let j=-2;j<=2;j++)for(let k=-2;k<=2;k++)if(j*j+k*k<7)a('box',j*.20,.06,k*.20,.13,.025,.08,[.09,.12,.13]);pop();
 }
 function snow(time,reduced,weight,heading=0){if(weight<=0)return;const count=Math.floor((reduced?35:150)*weight);for(let i=0;i<count;i++){const x=Math.sin(i*127.1)*15+Math.sin(time*.35+i)*.6,y=((i*1.73-time*(reduced?.22:1.3))%11+11)%11,z=-38+(i*7.17)%48,size=.025+(i%5)*.009;a('billboard',x,y,z,size*2,size*2,1,[.92,.96,1,54],0,-heading);}}
 return{electric,photographers,walker,manhole,snow,coin,rush,metrics:()=>({capeVertices})};
}
