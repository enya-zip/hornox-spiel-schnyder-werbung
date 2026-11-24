// Level 8–10 (Gletscher, Hörnligrat, Matterhorn): Hindernisse, Kulisse und Gipfel-Finale aus einfachen Formen.
// Lokales System: Laufrichtung +z, eine Spur ist 2,5 m breit, y = 0 ist der Boden.
export function createHeights(r){
 const a=r.add,push=r.push,pop=r.pop,PI=Math.PI;
 const ice=[.62,.85,.95,20],iceDeep=[.42,.7,.86,20],snow=[.95,.97,1],snowShade=[.82,.88,.95],rock=[.42,.41,.4],rockDark=[.3,.29,.29],rockLight=[.55,.53,.51],
  wood=[.5,.36,.22],metal=[.62,.64,.68],rope=[.85,.28,.12],dark=[.03,.05,.08];
 const clamp=v=>Math.max(0,Math.min(1,v));

 // ---------- Level 8: Gletscher ----------
 // Spalte unter einer Spur (Leiter- oder Schneebrücken-Untergrund).
 function crack(width=2.3){a('box',0,.02,0,width,.02,2.3,dark);a('box',0,.025,0,width*.9,.02,1.7,[.05,.2,.3]);for(const s of[-1,1])a('box',0,.06,s*1.2,width,.12,.18,snowShade);}
 // Alu-Leiter über eine Spalte (begehbar).
 function ladder(){crack(2.3);for(const x of[-.55,.55])a('box',x,.12,0,.08,.08,3.2,metal);for(let k=-6;k<=6;k++)a('box',0,.12,k*.25,1.1,.05,.06,metal);for(const z of[-1.6,1.6])for(const x of[-.55,.55])a('cylinder',x,.25,z,.04,.4,.04,metal);}
 // Schneebrücke: liegt über der Spalte und bricht ein, sobald Hornox nahe ist (near: 0 intakt … 1 eingestürzt).
 function snowBridge(width,near,time,id){crack(width);const n=Math.max(2,Math.round(width/1.1));
  for(let k=0;k<n;k++){const x=(k-(n-1)/2)*width/n,delay=((k*37+id)%5)*.06,f=clamp((near-delay)/(1-delay)),y=.18-f*f*3.2;
   if(f<.98){a('rock',x,y,0,width/n*.98,.32,2.1,snow,f*1.4*(k%2?1:-1),id+k*.7);a('rock',x,y+.12,.3,width/n*.6,.12,1.2,snowShade,0,id+k);}
   if(f>0&&f<.9)for(let j=0;j<3;j++)a('sphere',x+(j-1)*.3,y+.4+f*j*.3,(j-1)*.4,.12,.12,.12,[1,1,1,49]);}
 }
 // Sérac (Eisturm) am Spurrand: kippt in die Spur (tilt 0 … 1). side = Seite, auf der er steht.
 function serac(tilt,side,id){push(side*1.1,0,0,0,0,0);push(0,0,0,0,0,side*tilt*.62);   // kippt nur in die eigene Spur
  a('rock',0,1.6,0,1.1,3.2,1.3,ice,0,id);a('rock',side*-.1,3.3,.1,.85,.8,1,snow,0,id+1);a('rock',side*.2,.9,.4,.65,1.4,.55,iceDeep,0,id+2);pop();
  if(tilt>.85){for(let j=0;j<5;j++)a('rock',side*(-1.5+j*-.35),.2,((j*29+id)%7-3)*.2,.4,.3,.35,ice,0,id+j);}
  pop();}
 // Seilschaft: drei Bergsteiger (Helm, Rucksack), mit einem roten Seil verbunden. walk = Laufzyklus.
 function climber(walk,variant){const c=[[.85,.2,.15],[.15,.4,.75],[.95,.65,.1]][variant%3],sw=Math.sin(walk)*.35;
  for(const s of[-1,1]){a('cylinder',s*.11,.45,s*sw*.15,.07,.9,.07,[.2,.22,.28],s*sw);a('box',s*.11,.04,.08+s*sw*.3,.12,.08,.26,[.15,.12,.1]);}
  a('sphere',0,1.15,0,.24,.42,.18,c);a('box',0,1.2,-.22,.36,.5,.2,[.3,.32,.28]);a('sphere',0,1.68,0,.13,.15,.13,[.93,.76,.62]);
  a('sphere',0,1.76,0,.15,.1,.16,[.95,.95,.95]);for(const s of[-1,1])a('cylinder',s*.28,1.15,.05,.05,.6,.05,c,-.3-s*sw*.4);
  a('cylinder',.32,1,.2,.025,1.3,.025,metal,.2);}
 function ropeTeam(time,id){const walk=time*7+id;for(let k=0;k<3;k++){push(((k*13+id)%3-1)*.15,0,-k*1.6);climber(walk+k*1.3,id+k);pop();}
  for(let k=0;k<2;k++){const z0=-k*1.6-.1,z1=z0-1.4;a('cylinder',0,1.05-Math.abs(Math.sin(time*2+k))*.05,(z0+z1)/2,.02,1.5,.02,rope,PI/2);}}
 // Gletscher-Kulisse: Eisturm, Spaltenzone, Gletschertor.
 function iceTower(h,id){a('rock',0,h/2,0,2.4,h,2.2,ice,0,id);a('rock',.4,h*.8,.3,1.5,h*.5,1.4,iceDeep,0,id+1);a('rock',0,h+.3,0,2.2,.7,2,snow,0,id+2);}
 function crevasseField(id){for(let k=0;k<3;k++){const z=(k-1)*2.4+((id*7+k)%3)*.3;a('box',((id+k)%3-1)*.6,.02,z,6+(k%2)*2,.02,.5,dark,0,.2*((k%2)?1:-1));a('box',0,.06,z+.35,6.5,.1,.2,snowShade,0,.2*((k%2)?1:-1));}}
 // Schneefahne für Windböen (seitlich wehende Schneekörner). dir = -1 links, 1 rechts.
 function drift(time,dir,strength){for(let k=0;k<14;k++){const ph=(time*1.6+k*.37)%1,x=dir*(-6+ph*12),y=.3+((k*7)%5)*.35+Math.sin(time*3+k)*.1,z=((k*11)%9-4)*1.1;a('sphere',x,y,z,.08+strength*.1,.05,.05+strength*.25,[1,1,1,49]);}}

 // ---------- Level 9 / 10: Grat ----------
 // Abgrund neben dem Grat: Felskante, dunkle Tiefe, weit unten Dunst. side = Richtung nach aussen.
 function ridgeEdge(side,id,len=8){
  for(let j=-1;j<=1;j++)a('rock',side*.2,-.05,j*2.6+((id+j)%3-1)*.3,.9,.4,1.7,(id+j)%2?rock:rockDark,0,id+j,-side*.5);
  const bands=[[.6,[.2,.21,.24]],[1.6,[.12,.13,.17]],[4,[.07,.08,.12]],[12,[.05,.07,.11]]];let x=.6;
  for(const [w,c] of bands){a('box',side*(x+w/2),.0,0,w,.02,len+.04,c);x+=w;}
  a('box',side*(x+30),.0,0,60,.02,len+.04,[.62,.68,.76]);   // Wolkenmeer tief unten
  if(id%3===0)a('sphere',side*(x+14+(id%5)*3),.05,0,7,.3,4,[.86,.9,.95,49]);
 }
 // Fixseil-Pfosten am Gratrand (Eisenstange mit Öse) – Seil zum nächsten Pfosten.
 function ropePost(len){a('cylinder',0,.55,0,.04,1.1,.04,metal);a('ring',0,1.08,0,.07,.07,.025,metal,PI/2);a('cylinder',0,1.02,len/2,.022,len,.022,rope,PI/2);}
 // Fixseil quer über den Weg (ducken): zwei Eisenstangen und ein gespanntes Seil auf Brusthöhe.
 function fixRope(){for(const s of[-1,1]){a('cylinder',s*4.2,.95,0,.05,1.9,.05,metal);a('rock',s*4.2,.1,0,.5,.25,.5,rockDark,0,s);}a('cylinder',0,1.62,0,.05,8.4,.05,rope,0,0,PI/2);for(let k=-3;k<=3;k++)a('ring',k*1.2,1.62,0,.07,.07,.02,metal,0,PI/2);}
 // Felsstufe (springen): Gneisplatte, eine Spur oder ganze Breite.
 function rockStep(width,id){const n=Math.max(1,Math.round(width/2.4));for(let k=0;k<n;k++){const x=(k-(n-1)/2)*width/n;a('rock',x,.32,0,width/n*1.02,.64,1.3,k%2?rock:rockLight,0,id+k);a('box',x,.66,.1,width/n*.8,.04,.9,snow);}}
 // Steinschlag-Brocken mit Staubwolke.
 function falling(time,id){a('rock',0,.75,0,1,1,.9,rockDark,time*3,id);for(let j=0;j<3;j++)a('sphere',((j*7)%3-1)*.4,.2+j*.15,-.6-j*.2,.3,.2,.3,[.7,.68,.64,49]);}
 // Solvayhütte (4003 m): kleine Notbiwak-Holzhütte auf einem Felsabsatz.
 function solvay(){a('rock',0,-1.5,0,6,3.2,5,rock,0,1);a('rock',0,-4,0,4.5,4,4,rockDark,0,2);
  a('box',0,1.2,0,3.4,2.4,2.8,[.62,.44,.26]);for(let k=0;k<5;k++)a('box',0,.3+k*.5,1.41,3.4,.05,.02,[.45,.32,.18]);
  for(const s of[-1,1])a('box',s*.9,2.75,0,1.95,.12,3.2,[.62,.62,.66],0,0,-s*.5);a('box',0,1,1.42,.7,1.3,.05,[.35,.22,.12]);a('box',1,1.5,1.42,.5,.4,.05,[.7,.85,.95,49]);
  a('box',0,3.3,1.2,1.4,.35,.06,[.97,.95,.88]);a('box',0,3.3,1.24,1.1,.12,.02,[.8,.15,.15]);
  a('cylinder',2.2,2,0,.04,4,.04,metal);a('box',2.55,3.6,0,.6,.4,.02,[.85,.1,.12]);a('box',2.55,3.6,.015,.12,.3,.01,[1,1,1]);a('box',2.55,3.6,.015,.3,.12,.01,[1,1,1]);}
 // Schneegrat-Kante (Wechte) für Level 10.
 function cornice(side,id){a('rock',side*.5,.15,0,1.6,.45,2.8,snow,0,id,-side*.25);a('rock',side*1.4,-.2,0,1.2,.35,2.4,snowShade,0,id+1,-side*.6);}
 // Felsaufschwung neben dem Weg (Gipfelflanke).
 function outcrop(h,id){a('rock',0,h/2-.3,0,2.6,h,2.2,(id%2)?rock:rockDark,0,id);a('rock',.4,h-.1,.2,1.6,.5,1.4,snow,0,id+1);a('rock',-.9,.3,.6,1,.8,.9,rockLight,0,id+2);}

 // ---------- Gipfel-Finale ----------
 function summitCross(time){a('rock',0,.2,0,3,.6,2.6,snow,0,3);a('box',0,2.1,0,.18,4,.18,[.75,.76,.8]);a('box',0,3.2,0,1.8,.16,.16,[.75,.76,.8]);
  for(const y of[2.6,3.7])a('sphere',0,y,.1,.12,.12,.06,[1,.85,.3,9]);for(let k=0;k<4;k++)a('box',0,2.6+k*.35,.1,.32,.06,.02,[.9,.9,.9]);}
 // Schweizer Flagge an einem Stock; wave = Zeit.
 function flag(time){a('cylinder',0,1.1,0,.04,2.2,.04,[.85,.85,.88]);for(let k=0;k<4;k++){const w=Math.sin(time*6-k*.8)*.08*k;a('box',.12+k*.18,1.95,w,.18,.62,.03,[.86,.1,.12]);}a('box',.4,1.95,.03,.1,.36,.01,[1,1,1]);a('box',.4,1.95,.03,.34,.1,.01,[1,1,1]);}
 // Konfetti und Sterne um Hornox (u = 0 … 1 Verlauf).
 function confetti(time,u){const cols=[[1,.8,.2],[.9,.2,.25],[.3,.6,1],[.4,.85,.4],[1,1,1]];
  for(let k=0;k<46;k++){const ang=k*2.4,rad=.6+((k*13)%7)*.35,up=Math.min(1,u*2.2),y=.6+up*(3+((k*5)%4))-Math.max(0,u-.45)*((k%3)+2)*2.4,spin=time*6+k;
   if(y<0)continue;a(k%4===0?'sphere':'box',Math.cos(ang)*rad*(.4+u),y,Math.sin(ang)*rad*(.4+u),.09,.09,.02,k%4===0?[1,.86,.35,9]:cols[k%5],spin,spin*.7);}}
 return{ladder,snowBridge,serac,ropeTeam,iceTower,crevasseField,drift,ridgeEdge,ropePost,fixRope,rockStep,falling,solvay,cornice,outcrop,summitCross,flag,confetti,crack};
}
