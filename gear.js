// Smooth enamel mug and steel carabiner. Coordinates are relative to the bag loop.
export function gearGeometry(){
 const body=[],metal=[],dark=[];const add=(out,p,n,u=0,v=0)=>out.push(...p,...n,u,v);
 const quad=(out,p,n,uv)=>{for(const i of[0,1,2,0,2,3])add(out,p[i],n[i],...(uv?.[i]||[0,0]));};
 const N=48,cx=-.065,cz=-.035,r=.10,top=-.135,bottom=-.35;
 for(let i=0;i<N;i++){
  const t=i/N*Math.PI*2-Math.PI,t2=(i+1)/N*Math.PI*2-Math.PI;
  const p=(a,y,radius=r)=>[cx+Math.sin(a)*radius,y,cz-Math.cos(a)*radius],n=a=>[Math.sin(a),0,-Math.cos(a)];
  quad(body,[p(t,bottom),p(t2,bottom),p(t2,top),p(t,top)],[n(t),n(t2),n(t2),n(t)],[[i/N,1],[(i+1)/N,1],[(i+1)/N,0],[i/N,0]]);
  quad(body,[p(t,top),p(t2,top),p(t2,top,.087),p(t,top,.087)],Array(4).fill([0,1,0]));
  quad(body,[p(t,top,.087),p(t2,top,.087),p(t2,bottom+.02,.087),p(t,bottom+.02,.087)],[n(t).map(v=>-v),n(t2).map(v=>-v),n(t2).map(v=>-v),n(t).map(v=>-v)]);
  for(const q of[[cx,bottom,cz],p(t,bottom),p(t2,bottom)])add(body,q,[0,-1,0]);
  for(const q of[[cx,bottom+.02,cz],p(t2,bottom+.02,.087),p(t,bottom+.02,.087)])add(body,q,[0,1,0]);
 }
 function ring(out,x,y,z,rx,ry,tube){for(let i=0;i<40;i++)for(let j=0;j<8;j++){
  const p=(a,b)=>[x+(rx+tube*Math.cos(b))*Math.cos(a),y+(ry+tube*Math.cos(b))*Math.sin(a),z+tube*Math.sin(b)],n=(a,b)=>[Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)];
  const a=i/40*Math.PI*2,b=j/8*Math.PI*2,c=(i+1)/40*Math.PI*2,d=(j+1)/8*Math.PI*2;
  quad(out,[p(a,b),p(c,b),p(c,d),p(a,d)],[n(a,b),n(c,b),n(c,d),n(a,d)]);
 }}
 ring(body,.038,-.198,cz,.059,.070,.013);
 ring(metal,0,-.052,0,.036,.073,.008);
 ring(dark,0,.024,0,.019,.031,.006);
 return[{data:new Float32Array(body),colour:[1,1,1,1],texture:true},{data:new Float32Array(metal),colour:[.66,.70,.67,1]},{data:new Float32Array(dark),colour:[.12,.15,.11,1]}];
}
