// Small authored Walser-style hamlets and alpine landmarks, shared through instance prefabs.
export function createAlpine(r){const a=r.add,push=r.push,pop=r.pop,wood=[.25,.16,.10,23],stone=[.49,.48,.43,24],roof=[.26,.28,.28,27],glass=[.27,.43,.46,26];
 function chalet(variant=0){r.prefab('alpine-chalet-'+variant,()=>{
  const w=variant%2?5.6:6.3;a('box',0,.42,0,w,.84,4.7,stone);a('box',0,2.38,0,w,3.1,4.7,wood);
  for(const side of[-1,1])a('box',side*w*.245,4.56,0,w*.56,.20,5.5,roof,0,0,-side*.44);
  for(let y=1.0;y<3.85;y+=.25)a('box',0,y,2.36,w,.035,.06,[.14,.09,.06,23]);
  for(const x of[-1.9,0,1.9])for(const y of[1.72,3.12]){a('box',x,y,2.405,.76,.88,.08,glass);for(const dx of[-.44,.44])a('box',x+dx,y,2.43,.085,1.05,.09,[.67,.61,.43,23]);for(const dy of[-.49,.49])a('box',x,y+dy,2.43,.96,.07,.09,[.67,.61,.43,23]);a('box',x,y,2.46,.045,.88,.08,[.76,.72,.58]);}
  for(const side of[-1,1])for(const z of[-1.35,1.25])for(const y of[1.72,3.12]){a('box',side*(w/2+.035),y,z,.08,.88,.76,glass);for(const dz of[-.44,.44])a('box',side*(w/2+.07),y,z+dz,.10,1.03,.08,[.67,.61,.43,23]);for(const dy of[-.49,.49])a('box',side*(w/2+.07),y+dy,z,.10,.07,.95,[.67,.61,.43,23]);}
  a('box',0,.93,2.44,.85,1.70,.15,[.15,.12,.085,23]);a('sphere',.25,1.0,2.55,.035,.035,.035,[.85,.66,.27,9]);
  a('box',0,2.45,2.82,w+.25,.15,1.0,wood);a('box',0,2.92,3.28,w+.2,.12,.10,wood);for(let x=-w/2;x<=w/2;x+=.45)a('box',x,2.69,3.27,.075,.55,.075,wood);
  a('box',1.7,4.94,-.6,.52,1.15,.55,stone);a('box',1.7,5.55,-.6,.67,.12,.68,roof);
 });}
 function chapel(){r.prefab('blatten-chapel',()=>{a('box',0,1.65,0,3.7,3.3,5.0,[.87,.83,.71,22]);for(const side of[-1,1])a('box',side*.94,3.8,0,2.2,.15,5.55,roof,0,0,-side*.54);a('box',0,1.05,2.55,.9,2.1,.10,wood);a('box',0,4.85,-1.7,.95,1.9,.95,[.84,.81,.71,22]);a('cone',0,6.1,-1.7,.75,1.2,.75,roof);a('box',0,6.95,-1.7,.09,.85,.09,wood);a('box',0,7.12,-1.7,.55,.085,.085,wood);});}
 function lake(time){a('cylinder',0,.04,0,19,.06,12,[.08,.27,.34,26]);for(let i=0;i<16;i++){const t=i*Math.PI/8;a('rock',Math.sin(t)*19,-.10,Math.cos(t)*12,1.6,.38,1.2,stone,0,i);}for(let i=0;i<3;i++)a('ring',2+i*3,.085,0,2.1,2.1,.05,[.32,.51,.53],Math.PI/2,0,time*.02);}
 function bridge(){r.prefab('furi-side-bridge',()=>{a('box',0,.2,0,2.7,.24,12,wood);for(const side of[-1,1]){a('box',side*1.35,1.1,0,.09,.09,12,wood);for(let z=-6;z<=6;z+=1.5)a('box',side*1.35,.7,z,.10,1.25,.10,wood);}});}
 return{chalet,chapel,lake,bridge};}
