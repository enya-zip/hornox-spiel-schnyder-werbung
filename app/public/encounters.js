// Authored scene details; textured visitors are shared GLB instances managed by scene3d.
const PI=Math.PI;
export function createEncounters(r){
 const a=r.add,push=r.push,pop=r.pop,dark=[.045,.06,.065],gold=[.72,.52,.21,9],leather=[.105,.065,.035],white=[.91,.94,.95];
 function tube(p,q,w,c){const d=q.map((v,i)=>v-p[i]),len=Math.hypot(...d);a('cylinder',...(p.map((v,i)=>(v+q[i])*.5)),w,len,w,c,Math.atan2(d[2],d[1]),0,Math.atan2(-d[0],Math.hypot(d[1],d[2])));}
 function curve(points,w,c){for(let i=1;i<points.length;i++)tube(points[i-1],points[i],w,c);for(const p of points.slice(1,-1))a('sphere',...p,w,w,w,c);}
 function horse(time,side){
  push(side*.72,Math.abs(Math.sin(time*5+side))*.022,1.18);const coat=side<0?[.31,.15,.075]:[.42,.24,.12];
  a('sphere',0,1.25,0,.34,.43,.80,coat);a('sphere',0,1.40,.48,.30,.37,.33,coat);a('sphere',0,1.27,-.52,.34,.37,.37,coat);
  a('sphere',0,1.69,.64,.25,.58,.29,coat,-.40);a('sphere',0,2.04,.94,.20,.29,.35,coat,-.19);
  a('roundedBox',0,1.94,1.23,.31,.30,.34,[.27,.17,.11]);
  for(const sign of[-1,1]){
   a('cone',sign*.115,2.28,.84,.075,.28,.065,coat,-.10,0,sign*-.22);
   a('sphere',sign*.178,2.11,1.00,.043,.045,.045,[.015,.012,.01]);a('sphere',sign*.192,2.12,1.017,.011,.014,.012,white);
   a('sphere',sign*.115,1.98,1.385,.043,.034,.014,[.055,.033,.025]);
   for(const fore of[-1,1]){const t=time*5+sign*(fore===1?1:-1)*PI*.5,swing=Math.sin(t)*.24,lift=Math.max(0,Math.cos(t))*.14;
    const hip=[sign*.245,1.17,fore*.52],knee=[sign*.24,.68+lift*.25,fore*.52+swing*.6],hoof=[sign*.24,.13+lift,fore*.52+swing];
    tube(hip,knee,.085,coat);a('sphere',...knee,.09,.105,.10,coat);tube(knee,hoof,.052,coat);a('roundedBox',hoof[0],hoof[1],hoof[2]+.025,.16,.17,.22,[.07,.055,.045]);
   }
   curve([[sign*.21,2.18,.95],[sign*.22,1.98,1.14],[sign*.18,1.88,1.30]],.022,leather);
   a('ring',sign*.21,1.96,1.22,.055,.055,.25,gold,0,PI/2);
   curve([[sign*.32,1.6,.35],[sign*.36,1.2,.38],[sign*.29,1.02,.35]],.04,leather);
   tube([sign*.17,1.93,1.20],[side>0?-.72:.72,1.65,-1.9],.014,leather);
  }
  for(let i=0;i<8;i++)a('sphere',0,1.45+i*.10,.37+i*.063,.075,.14,.09,[.075,.045,.025]);
  curve([[0,1.48,-.69],[.03,1.27,-.92],[Math.sin(time*2)*.10,.73,-1.01]],.065,[.09,.055,.03]);
  a('box',0,1.64,.08,.56,.065,.39,leather);a('sphere',0,1.72,.12,.055,.06,.055,gold);
  pop();
 }
 function carriage(time){
  horse(time,-1);horse(time,1);
  r.prefab('noble-carriage',()=>{
   a('roundedBox',0,.72,-1.66,2.40,.64,2.60,[.055,.13,.095,25]);
   a('roundedBox',0,1.02,-1.77,2.27,.32,2.35,[.17,.045,.055]);
   // Deep burgundy seating, tall curved back and delicate brass piping.
   a('roundedBox',0,1.22,-2.36,1.98,.35,.70,[.26,.055,.07]);a('roundedBox',0,1.63,-2.65,2.0,.90,.21,[.19,.035,.045],-.10);
   for(const side of[-1,1]){a('roundedBox',side*1.10,1.31,-1.85,.15,.48,1.91,[.055,.13,.095,25]);tube([side*1.13,1.58,-2.67],[side*1.13,1.58,-.94],.025,gold);tube([side*.97,.71,-.45],[side*.97,1.05,1.48],.045,leather);
    a('cylinder',side*1.10,1.55,-.66,.025,.59,.025,gold);a('roundedBox',side*1.10,1.80,-.66,.17,.28,.18,[.95,.75,.37,47]);
    for(const z of[-2.6,-.8]){tube([side*.99,.49,z-.28],[side*.99,.36,z],.035,dark);tube([side*.99,.36,z],[side*.99,.49,z+.28],.035,dark);}
    a('box',side*1.30,.36,-1.66,.43,.07,.80,dark);
   }
   a('roundedBox',0,1.37,-.57,1.76,.20,.58,leather);a('box',0,1.12,-.27,1.76,.08,.55,dark);
   tube([-1.12,1.07,-2.97],[1.12,1.07,-2.97],.025,gold);
   // The hood is raised behind the passenger bench.
   a('sphere',0,1.97,-2.61,1.09,.48,.36,[.045,.07,.065]);a('box',0,1.76,-2.37,2.1,.045,.035,gold);
  });
  for(const side of[-1,1])for(const z of[-2.5,-.75]){
   push(side*1.26,.50,z,0,PI/2);a('ring',0,0,0,.47,.47,.65,[.05,.055,.055]);a('auraRing',0,0,side*.065,.40,.40,1,gold);
   for(let i=0;i<12;i++){const v=i*PI/6+time*3.5;tube([0,0,0],[Math.cos(v)*.42,Math.sin(v)*.42,0],.013,gold);}a('sphere',0,0,0,.08,.08,.10,gold);pop();
  }
 }
 function scooter(time){
  for(const [x,z]of[[-.42,.25],[.42,-1.00]]){push(x,0,z);
   a('roundedBox',0,.20,-.05,.25,.09,1.0,[.13,.25,.23,25]);tube([0,.23,.37],[0,1.42,.44],.033,[.48,.55,.54,25]);tube([-.28,1.45,.44],[.28,1.45,.44],.033,dark);
   for(const zz of[-.43,.42]){a('cylinder',0,.13,zz,.13,.10,.13,dark,0,0,PI/2);a('cylinder',.058,.13,zz,.07,.012,.07,[.64,.67,.64,25],0,0,PI/2);}
   for(const zz of[-.43,.42])for(let k=0;k<3;k++){const t=time*13+k*PI/3;tube([.064,.13+Math.sin(t)*.085,zz+Math.cos(t)*.085],[.064,.13-Math.sin(t)*.085,zz-Math.cos(t)*.085],.007,white);}
   for(const side of[-1,1])a('cylinder',side*.24,1.45,.44,.04,.13,.04,dark,0,0,PI/2);a('sphere',0,1.26,.48,.035,.045,.025,[.94,.91,.65,47]);pop();
  }
 }
 function accessory(style,variant,time){
  if([4,7,8].includes(style)){
   const colour=variant%2?[.80,.24,.10]:[.055,.32,.39];
   a('sphere',0,2.22,0,.235,.18,.235,colour);
   a('roundedBox',0,2.15,.235,.34,.095,.10,[.10,.20,.24,26]);
   for(const side of[-1,1])tube([side*.19,2.20,.02],[side*.12,1.98,.10],.013,dark);
  }
  if(style===7){
   // A bound pair of shaped skis sits lengthwise on the shoulder, inside the lane.
   push(-.32,1.79,0,-.08);
   for(const x of[-.085,.085]){
    a('roundedBox',x,0,0,.14,.055,2.65,variant%2?[.85,.20,.11]:[.045,.37,.48]);
    a('roundedBox',x,.045,1.35,.14,.055,.26,white,-.38);
    a('box',x,.031,.78,.105,.009,.50,white);
    for(const z of[-.22,.25])a('roundedBox',x,.075,z,.11,.10,.18,dark);
   }
   a('box',0,.065,-.65,.33,.035,.09,dark);pop();
   for(const x of[.30,.36]){tube([x,.15,.06],[x,1.35,.30],.014,[.62,.67,.70,25]);a('ring',x,.22,.075,.06,.06,.35,dark,PI/2);}
  }
  if(style===8){
   // Rounded snowboard carried under the arm, with visible bindings.
   push(-.48,1.02,.02,0,0,-.12);
   const colour=variant%2?[.84,.39,.085]:[.13,.41,.34];
   a('roundedBox',0,0,0,.30,1.57,.075,colour);
   a('sphere',0,.76,0,.15,.20,.039,colour);a('sphere',0,-.76,0,.15,.20,.039,colour);
   for(const y of[-.30,.30]){a('roundedBox',0,y,.07,.22,.16,.13,dark);a('box',0,y+.08,.145,.18,.04,.03,white);}
   a('box',0,.54,.041,.21,.13,.008,white,0,0,.25);pop();
  }
  if(style===6){
   push(-.40,1.64,.53);a('cylinder',0,0,0,.075,.18,.075,[.92,.87,.74]);a('cylinder',0,.097,0,.084,.027,.084,[.10,.14,.12]);a('cylinder',0,-.01,0,.076,.065,.076,[.18,.35,.24]);pop();
  }
  if(![4,7,8].includes(style)&&variant%3===1){a('sphere',0,2.20,0,.22,.14,.22,variant%2?[.25,.09,.13]:[.10,.23,.19]);a('sphere',0,2.34,0,.055,.065,.055,[.7,.61,.46]);}
  if(![4,7,8].includes(style)&&variant%3===2){for(const x of[-.09,.09])a('roundedBox',x,2.13,.31,.14,.055,.035,[.05,.07,.075,26]);tube([-.04,2.13,.33],[.04,2.13,.33],.012,gold);for(const side of[-1,1])tube([side*.155,2.13,.31],[side*.16,2.11,.05],.012,dark);}
  if(style===2){const hand=[-.48,1.96,.62],tip=[-.57,2.54,1.00];tube(hand,tip,.018,[.40,.43,.44,25]);a('roundedBox',tip[0],tip[1]+.10,tip[2],.16,.28,.045,[.50,.20,.22,25]);a('box',tip[0],tip[1]+.1,tip[2]-.026,.125,.225,.008,[.34,.57,.67,47]);for(const x of[-.035,.025])a('sphere',tip[0]+x,tip[1]+.19,tip[2]+.026,.018,.018,.008,dark);}
  if(style===1){a('roundedBox',0,1.78,.79,.30,.21,.16,dark);a('cylinder',0,1.78,.91,.075,.13,.075,[.15,.24,.28,26],PI/2);tube([-.35,1.85,.62],[-.13,1.78,.80],.025,dark);tube([.35,1.85,.62],[.13,1.78,.80],.025,dark);}
  if(style===3){push(0,1.36,.66,.62);a('box',0,0,0,.67,.43,.016,[.90,.86,.69]);for(let k=0;k<4;k++)a('box',(k-1.5)*.14,0,.013,.013,.38,.006,[.28,.47,.36],0,0,.3);a('box',0,0,.018,.60,.018,.006,[.64,.23,.18],0,0,-.20);pop();}
 }
 function snowman(time){
  const snow=[.93,.96,1];a('sphere',0,.54,0,.57,.58,.56,snow);a('sphere',0,1.24,0,.40,.43,.40,snow);a('sphere',0,1.80,0,.29,.30,.29,snow);
  a('cylinder',0,2.06,0,.37,.06,.37,dark);a('cylinder',0,2.23,0,.25,.30,.25,dark);a('cylinder',0,2.12,0,.254,.07,.254,[.50,.10,.12]);
  for(const x of[-.10,.10])a('sphere',x,1.87,.27,.035,.035,.024,dark);a('cone',0,1.77,.28,.058,.24,.055,[.96,.38,.055],PI/2);
  for(const y of[.97,1.20,1.41])a('sphere',0,y,.38,.043,.043,.025,dark);a('ring',0,1.58,0,.31,.31,.55,[.51,.095,.12],PI/2);a('box',.18,1.32,.35,.13,.47,.05,[.51,.095,.12],0,0,-.17);
  for(const side of[-1,1]){curve([[side*.32,1.3,0],[side*.65,1.43,0],[side*.90,1.65,.06]],.026,[.27,.16,.09]);tube([side*.66,1.44,0],[side*.88,1.42,.1],.018,[.27,.16,.09]);}
 }
 function flamingo(time){
  const pink=[.97,.35,.48],rose=[.84,.20,.36];
  a('sphere',0,1.25,0,.30,.35,.48,pink);a('sphere',-.24,1.28,-.04,.09,.24,.37,rose);a('sphere',.24,1.28,-.04,.09,.24,.37,rose);
  curve([[0,1.39,.29],[0,1.68,.22],[0,1.93,.36],[0,2.13,.46]],.082,pink);a('sphere',0,2.14,.49,.13,.15,.16,pink);
  a('sphere',0,2.10,.67,.085,.07,.14,[.95,.81,.73]);a('sphere',0,2.04,.77,.062,.115,.065,[.055,.055,.06]);
  for(const side of[-1,1]){a('sphere',side*.11,2.17,.54,.023,.025,.02,[.96,.90,.67]);a('sphere',side*.127,2.17,.548,.009,.012,.008,dark);const lift=Math.max(0,Math.sin(time*2+side*PI))*.18;curve([[side*.12,1.05,0],[side*.12,.53+lift,-.12],[side*.12,.05+lift,.07]],.023,[.83,.33,.35]);for(let toe=-1;toe<=1;toe++)tube([side*.12,.045+lift,.07],[side*.12+toe*.08,.03+lift,.25],.016,[.83,.33,.35]);}
  a('ring',0,1.78,.27,.095,.095,.30,[.045,.23,.14],PI/2);a('box',.06,1.55,.33,.065,.32,.02,[.045,.23,.14],0,0,.15);
 }
 return{carriage,scooter,accessory,snowman,flamingo};
}
