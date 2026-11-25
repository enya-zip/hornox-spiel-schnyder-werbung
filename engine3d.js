import {worldGeometry} from './world3d.js?v=17';
// Small dependency-free WebGL2 renderer. Geometry and instance buffers are reused.
const PI=Math.PI;
export function identity(o){o.fill(0);o[0]=o[5]=o[10]=o[15]=1;return o;}
export function multiply(o,a,b){for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
export function compose(o,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0){
 const a=Math.cos(rx),b=Math.sin(rx),c=Math.cos(ry),d=Math.sin(ry),e=Math.cos(rz),f=Math.sin(rz);
 o[0]=c*e*sx;o[1]=(a*f+b*d*e)*sx;o[2]=(b*f-a*d*e)*sx;o[3]=0;
 o[4]=-c*f*sy;o[5]=(a*e-b*d*f)*sy;o[6]=(b*e+a*d*f)*sy;o[7]=0;
 o[8]=d*sz;o[9]=-b*c*sz;o[10]=a*c*sz;o[11]=0;o[12]=x;o[13]=y;o[14]=z;o[15]=1;return o;
}
function lookAt(o,ex,ey,ez,tx,ty,tz){
 let zx=ex-tx,zy=ey-ty,zz=ez-tz,l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
 let xx=zz,xy=0,xz=-zx;l=Math.hypot(xx,xz);xx/=l;xz/=l;
 const yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;
 o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
 o[12]=-(xx*ex+xz*ez);o[13]=-(yx*ex+yy*ey+yz*ez);o[14]=-(zx*ex+zy*ey+zz*ez);o[15]=1;return o;
}
function perspective(o,fov,aspect,near,far){o.fill(0);const f=1/Math.tan(fov/2);o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);o[11]=-1;o[14]=2*far*near/(near-far);return o;}
function ortho(o,l,r,b,t,n,f){identity(o);o[0]=2/(r-l);o[5]=2/(t-b);o[10]=-2/(f-n);o[12]=-(r+l)/(r-l);o[13]=-(t+b)/(t-b);o[14]=-(f+n)/(f-n);return o;}
function shader(gl,type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
export function program(gl,vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl,gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl,gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
const vertex=String.raw`#version 300 es
precision highp float;
layout(location=0) in vec3 position;
layout(location=1) in vec3 normal;
layout(location=2) in vec3 tint;
layout(location=3) in mat4 model;
layout(location=7) in vec4 colour;
uniform mat4 vp;
uniform mat4 lightVP;
out vec3 vNormal;out vec3 vWorld;out vec3 vColour;out vec4 vLight;out vec2 vUV;flat out float vMaterial;flat out vec2 vScale;
void main(){vec4 world=model*vec4(position,1.0);vWorld=world.xyz;vUV=vec2(position.x+.5,position.y);
vec3 scales=vec3(dot(model[0].xyz,model[0].xyz),dot(model[1].xyz,model[1].xyz),dot(model[2].xyz,model[2].xyz));
vScale=vec2(length(model[0].xyz),length(model[1].xyz));vNormal=normalize(mat3(model)*(normal/max(scales,vec3(.00001))));vColour=colour.rgb*tint;vMaterial=colour.a;if(colour.a>51.5&&colour.a<52.5){vUV=tint.xy;vColour=vec3(.035,.19,.115);}vLight=lightVP*world;gl_Position=vp*world;}`;
const fragment=String.raw`#version 300 es
precision highp float;
in vec3 vNormal;in vec3 vWorld;in vec3 vColour;in vec4 vLight;in vec2 vUV;flat in float vMaterial;flat in vec2 vScale;
uniform sampler2D shadowMap;uniform vec3 eye;uniform vec3 fog;uniform float travel;uniform float detail;uniform sampler2D firMap;uniform sampler2D stoneMap;uniform sampler2D surfaceMap;uniform sampler2D facadeMap;uniform sampler2D signMap;uniform sampler2D collectionMap;uniform vec3 holes[8];uniform int holeCount;uniform float signAspects[16];uniform vec3 worldOrigin;
uniform float environmentTime;uniform float environmentSpeed;uniform vec2 forward;
out vec4 outColour;
vec3 surface(float k,vec2 p){float scale=k==0.?17.:k==1.?10.:k==2.?7.:5.;vec2 quadrant=vec2(mod(k,2.),1.-floor(k/2.));vec2 uv=abs(fract(p/scale*.5)*2.-1.);vec3 sampleColour=textureGrad(surfaceMap,(quadrant+mix(vec2(.008),vec2(.992),uv))*.5,dFdx(p)/scale*.5,dFdy(p)/scale*.5).rgb;vec3 average=k==0.?vec3(.70,.84,.88):k==1.?vec3(.34,.40,.20):k==2.?vec3(.48,.42,.30):vec3(.52,.53,.50);return mix(sampleColour,average,smoothstep(.4,2.5,length(fwidth(p))));}
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
vec3 paving(vec2 p){vec2 q=p*4.;q.x+=mod(floor(q.y),2.)*.5;vec2 f=fract(q);float edge=min(min(f.x,1.-f.x),min(f.y,1.-f.y));float grain=noise(p*84.);float tile=hash(floor(q));vec3 stone=mix(vec3(.47,.49,.48),vec3(.58,.58,.55),tile);float aa=max(fwidth(q.x),fwidth(q.y));vec3 result=mix(vec3(.36,.38,.37),stone*(.97+.04*grain),smoothstep(.018-aa*.3,.065+aa*.3,edge));return mix(result,vec3(.51,.52,.50),smoothstep(.35,1.,aa));}
vec3 landscape(bool ground,vec2 p){float t=max(0.,environmentTime+clamp(dot(vWorld.xz,forward),-18.,250.)/environmentSpeed*2.);float meadow=ground?1.:2.;vec3 ice=surface(0.,p);if(ground)ice=mix(ice,vec3(.90,.95,.97),.65);vec3 rock=surface(2.,p)*vec3(.70,.74,.76);
 float fine=1.-smoothstep(.15,.7,length(fwidth(p*20.)));vec3 asphalt=vec3(.34,.36,.36)*(.98+(noise(p*20.)-.5)*.08*fine),town=asphalt;
 if(t<84.)return town;if(t<96.)return mix(town,surface(meadow,p),smoothstep(84.,96.,t));
 vec3 field=surface(meadow,p);if(t>=174.&&t<354.)field*=vec3(.84,.91,.82);
 if(t<444.)return field;if(t<456.)return mix(field,rock,smoothstep(444.,456.,t));if(t<528.)return rock;vec3 sparse=mix(rock,surface(meadow,p)*vec3(.82,.86,.62),.38);vec3 scree=rock*vec3(1.04,.94,.82);vec3 slate=rock*vec3(1.08,.88,.7);if(t<540.)return mix(rock,sparse,smoothstep(528.,540.,t));if(t<556.)return sparse;if(t<562.)return mix(sparse,scree,smoothstep(556.,562.,t));if(t<574.)return scree;if(t<580.)return mix(scree,slate,smoothstep(574.,580.,t));if(t<592.)return slate;if(t<598.)return mix(slate,rock,smoothstep(592.,598.,t));if(t<624.)return rock;if(t<636.)return mix(rock,ice,smoothstep(624.,636.,t));
 if(t<714.)return ice;if(t<726.)return mix(ice,mix(rock,ice,.38),smoothstep(714.,726.,t));if(t<804.)return mix(rock,ice,.38);return mix(mix(rock,ice,.38),vec3(.88,.94,.96),smoothstep(804.,816.,t));}


void main(){
 if(vMaterial>53.5&&vMaterial<54.5){float alpha=1.-smoothstep(.12,.5,length(vUV-.5));if(alpha<.02)discard;outColour=vec4(.94,.97,1.,alpha*.85);return;}
 float winter=1.-smoothstep(84.,90.,environmentTime);
 if(vMaterial>17.5&&vMaterial<19.5){for(int i=0;i<8;i++){if(i>=holeCount)break;if(distance(vWorld.xz,holes[i].xy)<holes[i].z)discard;}}
 if(vMaterial>27.5&&vMaterial<28.5){vec3 ray=normalize(vWorld-eye);float h=clamp(ray.y,0.,1.);vec3 sky=mix(vec3(.62,.78,.87),vec3(.16,.42,.65),pow(h,.45));vec2 p=ray.xz/max(.12,ray.y)*1.8;float cloud=noise(p)*.56+noise(p*2.1)*.29+noise(p*4.5)*.15;float clouds=smoothstep(.59,.76,cloud)*smoothstep(.03,.20,ray.y)*.60;sky=mix(sky,vec3(.96,.95,.90),clouds);float sun=pow(max(0.,dot(ray,normalize(vec3(-.55,.85,.4)))),120.);sky=mix(sky,sky*.80+vec3(.12,.13,.14),winter*.70);outColour=vec4(sky+vec3(.22,.15,.06)*sun,1.);return;}
 if(vMaterial>7.5&&vMaterial<8.5){float opacity=(1.-smoothstep(.08,.5,length(vUV-.5)))*.30;if(opacity<.01)discard;outColour=vec4(.10,.15,.16,opacity);return;}
 vec3 albedo=vColour;bool tree=vMaterial>6.5&&vMaterial<7.5;
 if(tree){vec4 leaf=texture(firMap,vUV);if(leaf.a<.48)discard;albedo=leaf.rgb;}
 vec3 n=normalize(vNormal),sun=normalize(vec3(-.55,.85,.4));float diffuse=max(0.,dot(n,sun));
 vec3 sp=vLight.xyz/vLight.w*.5+.5;float shade=1.;
 if(detail>.5&&sp.x>0.&&sp.x<1.&&sp.y>0.&&sp.y<1.&&sp.z<1.){float occ=0.;vec2 px=1./vec2(textureSize(shadowMap,0));for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){float depth=texture(shadowMap,sp.xy+vec2(x,y)*px).r;occ+=sp.z-.0015>depth?1.:0.;}shade=1.-occ*.035;}
 vec2 worldUV=(vWorld.xz+worldOrigin.xz);
 if(vMaterial>2.5&&vMaterial<3.5)albedo=texture(stoneMap,worldUV/9.).rgb;
 if(vMaterial>9.5&&vMaterial<13.5){float k=floor(vMaterial+.1)-10.;vec2 quadrant=vec2(mod(k,2.),1.-floor(k/2.));vec2 uv=abs(fract(worldUV/(k==0.?17.:k==1.?10.:k==2.?7.:5.)*.5)*2.-1.);albedo=textureGrad(surfaceMap,(quadrant+mix(vec2(.008),vec2(.992),uv))*.5,dFdx(worldUV)*.025,dFdy(worldUV)*.025).rgb;}
 if(vMaterial>13.5&&vMaterial<17.5){float k=floor(vMaterial+.1)-14.;vec2 quadrant=vec2(mod(k,2.),1.-floor(k/2.));albedo=texture(facadeMap,(quadrant+mix(vec2(.007),vec2(.993),vUV))*.5).rgb;}
 if(vMaterial>17.5&&vMaterial<19.5)albedo=landscape(vMaterial<18.5,worldUV)*(vMaterial<18.5?vColour:vec3(1.));
 if(vMaterial>19.5&&vMaterial<20.5){albedo=mix(surface(0.,worldUV),vec3(.59,.83,.93),.55);}
 if(vMaterial>20.5&&vMaterial<21.5){float edge=pow(abs(vUV.y-.5)*2.,2.);albedo=mix(vec3(.004,.025,.045),vec3(.035,.28,.40),edge);}
 if(vMaterial>28.5&&vMaterial<29.5){vec2 uv=abs(n.y)>.7?worldUV:abs(n.x)>.6?vWorld.zy:vWorld.xy;float crag=noise(uv*.035)*.50+noise(uv*.11)*.30+noise(uv*.34)*.20;float strata=sin(vWorld.y*.15+noise(uv*.018)*9.);albedo*=.78+crag*.34+strata*.035;if(environmentTime>600.){float snow=smoothstep(600.,690.,environmentTime)*smoothstep(.15,.65,n.y);albedo=mix(albedo,vec3(.84,.89,.91),snow*.85);}}
 // Physical surface detail without photographic facades.
 vec3 absoluteWorld=vWorld+worldOrigin;vec2 facadeUV=abs(n.y)>.65?worldUV:abs(n.z)>.5?absoluteWorld.xy:absoluteWorld.zy;float surfaceDetail=1.-smoothstep(.10,.65,length(fwidth(facadeUV*12.)));
 if(vMaterial>21.5&&vMaterial<22.5)albedo*=.99+(noise(facadeUV*12.)-.5)*.04*surfaceDetail;
 if(vMaterial>22.5&&vMaterial<23.5){float aa=fwidth(facadeUV.y*5.);float plank=1.-smoothstep(.02,.04+aa,abs(fract(facadeUV.y*5.)-.5));albedo*=.84+.12*noise(vec2(facadeUV.x*.8,facadeUV.y*3.))+.05*(noise(vec2(facadeUV.x*1.5,facadeUV.y*12.))-.5)*surfaceDetail-.10*plank*(1.-smoothstep(.15,.9,aa));}
 if(vMaterial>23.5&&vMaterial<24.5){vec2 p=facadeUV*2.5;p.x+=mod(floor(p.y),2.)*.5;vec2 f=fract(p);float aa=max(fwidth(p.x),fwidth(p.y));float joint=smoothstep(.02,.08+aa,min(min(f.x,1.-f.x),min(f.y,1.-f.y)));albedo*=mix(.88,.77+.14*hash(floor(p))+.09*joint,1.-smoothstep(.15,1.,aa));}
 if(vMaterial>25.5&&vMaterial<26.5){float reflection=pow(1.-abs(dot(n,normalize(eye-vWorld))),3.);albedo=mix(albedo,vec3(.66,.78,.81),.20+reflection*.55);}
 if(vMaterial>26.5&&vMaterial<27.5){vec2 p=facadeUV*5.;albedo*=.93+(noise(p*3.)-.5)*.08*surfaceDetail;}
 if(vMaterial>29.5&&vMaterial<46.){int k=int(floor(vMaterial))-30;vec2 cell=vec2(float(k%4),3.-floor(float(k)/4.));float panel=vScale.x/vScale.y,aspect=signAspects[k];vec2 uv=(vUV-.5)*vec2(max(1.,panel/aspect),max(1.,aspect/panel))+.5;albedo=k==10?vec3(.87,.86,.80):vec3(.055,.070,.067);if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThanEqual(uv,vec2(1.)))){vec4 tex=texture(signMap,(cell+mix(vec2(.012),vec2(.988),uv))*.25);albedo=mix(albedo,tex.rgb,tex.a);}}
 if(vMaterial>46.5&&vMaterial<47.5)albedo=vColour*1.22;
 if(vMaterial>47.5&&vMaterial<48.5){float stripes=sin(absoluteWorld.y*1.5+absoluteWorld.x*.2)*.04;float reflection=pow(1.-abs(dot(n,normalize(eye-vWorld))),3.);albedo=mix(vColour+vec3(.07,.05,.025)+stripes,vec3(.34,.48,.51),.12+reflection*.35);}
 if(winter>0.){
  float snowMask=0.;
  if(vMaterial>17.5&&vMaterial<19.5){float lateral=dot(vWorld.xz,vec2(forward.y,-forward.x));float track=1.-smoothstep(.14,.50,abs(abs(lateral)-1.1));snowMask=.92-track*.28;}
  else if(vMaterial>21.5&&vMaterial<29.5)snowMask=smoothstep(.28,.77,n.y);
  vec3 snow=vec3(.86,.92,.97)*(.96+.04*noise(worldUV*1.6));albedo=mix(albedo,snow,snowMask*winter);
 }
 float sky=.64+.10*n.y;vec3 light=vec3(sky*.83,sky*.94,sky)+vec3(1.,.90,.75)*diffuse*.50*shade;
 vec3 c=albedo*light;if(vMaterial>29.5&&vMaterial<48.5)c=mix(c,albedo*1.10,.80);if(tree)c=albedo*(.85+diffuse*.15);
 if(vMaterial>8.5&&vMaterial<9.5){vec3 h=normalize(sun+normalize(eye-vWorld));c+=pow(max(0.,dot(n,h)),32.)*vec3(.6,.4,.12);}
 if(vMaterial>49.5&&vMaterial<50.5){
  // Same original Collection image mark on both faces, embossed in gold, not printed white.
  vec2 uv=(vUV-.5)*vec2(1.60,1.27)+.5;float mask=0.,edge=0.;
  if(all(greaterThan(uv,vec2(.01)))&&all(lessThan(uv,vec2(.99)))){
   float e=max(.008,length(fwidth(uv))*.55);mask=texture(collectionMap,uv).a;
   edge=texture(collectionMap,uv+vec2(-e,e)).a-texture(collectionMap,uv+vec2(e,-e)).a;
  }
  vec3 h=normalize(sun+normalize(eye-vWorld));float metal=pow(max(0.,dot(n,h)),38.);
  c=vec3(.84,.46,.075)*light+vec3(.18,.17,.06)*mask+edge*vec3(.50,.37,.15)+metal*vec3(.8,.6,.22);
 }
 if(vMaterial>50.5&&vMaterial<51.5){float core=pow(abs(dot(n,normalize(eye-vWorld))),3.);c=mix(vColour,vec3(.92,.99,1.),core*.90)*1.35;}
 if(vMaterial>51.5&&vMaterial<52.5){
  vec2 markUV=vec2((vUV.x-.5)*2.5+.5,1.-(vUV.y-.24)*2.);float mark=0.;
  if(all(greaterThanEqual(markUV,vec2(0.)))&&all(lessThanEqual(markUV,vec2(1.))))mark=texture(collectionMap,markUV).a;
  vec3 fabric=mix(vec3(.035,.19,.115),vec3(.96,.92,.77),mark);
  float silk=pow(abs(dot(n,normalize(sun+normalize(eye-vWorld)))),15.);c=fabric*(.88+.30*abs(dot(n,sun)))+vec3(.04,.09,.055)*silk;
 }
 if(vMaterial>48.5&&vMaterial<49.5){vec3 h=normalize(sun+normalize(eye-vWorld));c+=pow(max(0.,dot(n,h)),40.)*vec3(.8,.47,.48)+albedo*.13;}
 float dist=length(eye.xz-vWorld.xz);float haze=smoothstep(650.,3500.,dist)*.26;c=mix(c,vec3(.50,.67,.76),haze);outColour=vec4(c,1.);
}`;
const depthVS=String.raw`#version 300 es
precision highp float;layout(location=0)in vec3 position;layout(location=3)in mat4 model;layout(location=7)in vec4 colour;uniform mat4 vp;out vec2 uv;flat out float material;void main(){uv=vec2(position.x+.5,position.y);material=colour.a;gl_Position=vp*model*vec4(position,1.);}`;
const depthFS=String.raw`#version 300 es
precision highp float;in vec2 uv;flat in float material;uniform sampler2D firMap;void main(){if(material>53.5&&material<54.5)discard;if(material>6.5&&material<7.5&&texture(firMap,uv).a<.45)discard;}`;
function geometry(low=false){
 const out={cape:new Float32Array(9*2400),pavement:new Float32Array(9*6000),terrain:new Float32Array(9*12000),road0:new Float32Array(9*6000),road1:new Float32Array(9*6000),road2:new Float32Array(9*6000),road3:new Float32Array(9*6000)};
 function make(name,fn){const a=[];const vert=(p,n,c=1)=>a.push(p[0],p[1],p[2],n[0],n[1],n[2],...(Array.isArray(c)?c:[c,c,c]));
 const tri=(p,q,r,c=1)=>{let ax=q[0]-p[0],ay=q[1]-p[1],az=q[2]-p[2],bx=r[0]-p[0],by=r[1]-p[1],bz=r[2]-p[2];let n=[ay*bz-az*by,az*bx-ax*bz,ax*by-ay*bx],l=Math.hypot(...n);n=n.map(v=>v/(l||1));vert(p,n,c);vert(q,n,c);vert(r,n,c);};fn(vert,tri);out[name]=new Float32Array(a);}
 make("spark",(_,t)=>{for(let i=0;i<10;i++){const a=i*PI/5,b=(i+1)*PI/5,r=i%2?.42:1,q=(i+1)%2?.42:1;t([0,0,0],[Math.cos(a)*r,Math.sin(a)*r,0],[Math.cos(b)*q,Math.sin(b)*q,0]);}});
 make("cylinder",(v)=>{const n=20;for(let i=0;i<n;i++){const a=i*2*PI/n,b=(i+1)*2*PI/n;const pa=[Math.cos(a),-.5,Math.sin(a)],pb=[Math.cos(b),-.5,Math.sin(b)],pc=[Math.cos(b),.5,Math.sin(b)],pd=[Math.cos(a),.5,Math.sin(a)];for(const [p,k]of[[pa,a],[pb,b],[pc,b],[pa,a],[pc,b],[pd,a]])v(p,[Math.cos(k),0,Math.sin(k)]);for(const y of[-.5,.5])for(const p of[[0,y,0],[Math.cos(a),y,Math.sin(a)],[Math.cos(b),y,Math.sin(b)]])v(p,[0,Math.sign(y),0]);}});
 make("crack",(_,t)=>{for(let i=0;i<12;i++){const x=i/12-.5,n=(i+1)/12-.5,lo=j=>.08+Math.sin(j*9.3)*.055,hi=j=>.92+Math.cos(j*7.1)*.06;const a=[x,lo(i),0],b=[n,lo(i+1),0],c=[n,hi(i+1),0],d=[x,hi(i),0];t(a,b,c);t(a,c,d);}});
 make("box",(_,t)=>{const v=[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,.5,-.5],[-.5,.5,-.5],[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5]];for(const f of[[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]){t(v[f[0]],v[f[1]],v[f[2]]);t(v[f[0]],v[f[2]],v[f[3]]);}});
 make("sphere",(v)=>{const lat=low?5:9,lon=low?8:14;const p=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=p(y*PI/lat,x*2*PI/lon),b=p((y+1)*PI/lat,x*2*PI/lon),c=p((y+1)*PI/lat,(x+1)*2*PI/lon),d=p(y*PI/lat,(x+1)*2*PI/lon);for(const q of[a,b,c,a,c,d])v(q,q);}});
 make("cone",(_,t)=>{for(let i=0;i<10;i++){const a=i*2*PI/10,b=(i+1)*2*PI/10,p=[Math.cos(a),0,Math.sin(a)],q=[Math.cos(b),0,Math.sin(b)];t(p,[0,1,0],q);t(q,[0,0,0],p);}});
 make("pine",(_,t)=>{const n=low?10:18;const p=(u,j)=>{const ang=j*PI*2/n;const scallop=1+(j%2?-.18:.08)*(1-u);return[Math.cos(ang)*(1-u)*scallop,u,Math.sin(ang)*(1-u)*scallop];};const paint=(a,b,c)=>{const h=(a[1]+b[1]+c[1])/3,ang=Math.atan2(a[2],a[0]);const snow=h>.35+Math.sin(ang*3.1)*.12;const col=snow?[.91,.96,.95]:[.12,.31,.24];t(a,b,c,col);};for(let k=0;k<4;k++)for(let j=0;j<n;j++){const a=p(k/4,j),b=p(k/4,j+1),c=p((k+1)/4,j+1),d=p((k+1)/4,j);paint(a,d,c);paint(a,c,b);}});
 make("rock",(v)=>{const lat=low?10:14,lon=low?14:20;const p=(a,b)=>{const x=Math.sin(a)*Math.cos(b),y=Math.cos(a),z=Math.sin(a)*Math.sin(b),r=1+.10*Math.sin(x*8+y*5)+.06*Math.cos(z*9-x*6);return[[x*r,y*r,z*r],[x,y,z]];};for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=p(i*PI/lat,j*2*PI/lon),b=p((i+1)*PI/lat,j*2*PI/lon),c=p((i+1)*PI/lat,(j+1)*2*PI/lon),d=p(i*PI/lat,(j+1)*2*PI/lon);for(const q of[a,b,c,a,c,d])v(q[0],q[1]);}});
 make("billboard",(v)=>{for(const p of[[-.5,0,0],[.5,0,0],[.5,1,0],[-.5,0,0],[.5,1,0],[-.5,1,0]])v(p,[0,0,1]);});
 make("peak",(_,t)=>{
 const count=low?8:16,rings=low?4:7,point=(ring,j)=>{const u=ring/rings,angle=j*2*PI/count;const square=1/Math.max(Math.abs(Math.cos(angle)),Math.abs(Math.sin(angle)));const ridge=1+Math.sin(j*13.7+ring*.4)*.11*(1-u);const radius=(1-u)*square*ridge;return[Math.cos(angle)*radius+u*.18,u,Math.sin(angle)*radius-u*.10];};
 const paint=(a,b,c)=>{const h=(a[1]+b[1]+c[1])/3;const snowy=h>.47+Math.sin(a[0]*7+a[2]*5)*.11;const col=snowy?[.94,.98,1]:[.40+h*.10,.45+h*.10,.47+h*.12];t(a,b,c,col);};
 for(let k=0;k<rings;k++)for(let j=0;j<count;j++){const a=point(k,j),b=point(k,j+1),c=point(k+1,j+1),d=point(k+1,j);paint(a,d,c);paint(a,c,b);}
 });
 make("roof",(_,t)=>{const a=[-.6,0,-.5],b=[.6,0,-.5],c=[0,.55,-.5],d=[-.6,0,.5],e=[.6,0,.5],f=[0,.55,.5];t(a,c,b);t(d,e,f);t(a,d,f);t(a,f,c);t(b,c,f);t(b,f,e);});
 make("ring",(v)=>{const sides=low?14:22,tubes=low?4:6;const p=(a,b)=>[(1+.095*Math.cos(b))*Math.cos(a),(1+.095*Math.cos(b))*Math.sin(a),.095*Math.sin(b)];const n=(a,b)=>[Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b)];for(let i=0;i<sides;i++)for(let j=0;j<tubes;j++){const a=i*2*PI/sides,b=j*2*PI/tubes,c=(i+1)*2*PI/sides,d=(j+1)*2*PI/tubes;for(const pair of[[a,b],[c,b],[c,d],[a,b],[c,d],[a,d]])v(p(...pair),n(...pair));}});
 make("horn",(v)=>{const p=(u,a)=>{const x=1.2*Math.sin(u*1.9),y=u*1.5,z=-u*.27,r=.27*Math.pow(1-u,.82)+.008;return[x+r*Math.cos(a),y+r*Math.sin(a),z+r*Math.sin(a)*.7];};for(let i=0;i<14;i++)for(let j=0;j<8;j++){const u=i/14,w=(i+1)/14,a=j*PI/4,b=(j+1)*PI/4;for(const q of[[u,a],[w,a],[w,b],[u,a],[w,b],[u,b]])v(p(...q),[Math.cos(q[1]),Math.sin(q[1]),Math.sin(q[1])*.7],q[0]>.75?.32:1);}});
 out.sky=out.sphere;Object.assign(out,worldGeometry());return out;
}
export function createRenderer(canvas){
 const gl=canvas.getContext("webgl2",{alpha:true,antialias:true,powerPreference:"high-performance"});
 if(!gl)throw Error("WEBGL_UNAVAILABLE");
 const info=gl.getExtension("WEBGL_debug_renderer_info"),software=!!(info&&/SwiftShader|llvmpipe/i.test(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)))&&!new URLSearchParams(location.search).has("native");
 const main=program(gl,vertex,fragment),depth=program(gl,depthVS,depthFS),meshes={};
 let droppedInstances=0,calls=0,triangles=0,width=0,height=0,extra=null,environmentTime=0,environmentSpeed=16,environmentHeading=0;const worldOrigin=new Float32Array(3);const shadowSize=software?256:1024;
 for(const[name,data]of Object.entries(geometry(software))){
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);const vertices=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,36,i*12);}
  const capacity=name==="box"?24576:["sphere","cylinder","billboard","blossom","roundedBox","rock","cone","ring"].includes(name)?4096:256;const instances=gl.createBuffer(),array=new Float32Array(capacity*20);gl.bindBuffer(gl.ARRAY_BUFFER,instances);gl.bufferData(gl.ARRAY_BUFFER,array.byteLength,gl.DYNAMIC_DRAW);
  for(let i=0;i<5;i++){gl.enableVertexAttribArray(3+i);gl.vertexAttribPointer(3+i,4,gl.FLOAT,false,80,i*16);gl.vertexAttribDivisor(3+i,1);}
  meshes[name]={vao,buffer:vertices,instances,array,capacity,count:0,vertices:data.length/9};
 }
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowSize,shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,texture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error("Shadow framebuffer unavailable");
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16),lv=new Float32Array(16),lp=new Float32Array(16),lightVP=new Float32Array(16),eye=new Float32Array(3),fog=new Float32Array([.68,.77,.80]);
 const uniforms={holes:gl.getUniformLocation(main,"holes[0]"),holeCount:gl.getUniformLocation(main,"holeCount"),collection:gl.getUniformLocation(main,"collectionMap"),signAspects:gl.getUniformLocation(main,"signAspects[0]"),sign:gl.getUniformLocation(main,"signMap"),environmentTime:gl.getUniformLocation(main,"environmentTime"),environmentSpeed:gl.getUniformLocation(main,"environmentSpeed"),forward:gl.getUniformLocation(main,"forward"),surface:gl.getUniformLocation(main,"surfaceMap"),facade:gl.getUniformLocation(main,"facadeMap"),origin:gl.getUniformLocation(main,"worldOrigin"),fir:gl.getUniformLocation(main,"firMap"),stone:gl.getUniformLocation(main,"stoneMap"),depthFir:gl.getUniformLocation(depth,"firMap"),vp:gl.getUniformLocation(main,"vp"),light:gl.getUniformLocation(main,"lightVP"),travel:gl.getUniformLocation(main,"travel"),detail:gl.getUniformLocation(main,"detail"),eye:gl.getUniformLocation(main,"eye"),fog:gl.getUniformLocation(main,"fog"),map:gl.getUniformLocation(main,"shadowMap"),depth:gl.getUniformLocation(depth,"vp")};
 let holeCount=0;const holes=new Float32Array(24);
 const textures={},signAspects=new Float32Array(16).fill(1);
 async function loadTexture(name,url){const im=new Image();im.src=url;await im.decode();const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,["fir","collection"].includes(name)?gl.CLAMP_TO_EDGE:gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,["fir","collection"].includes(name)?gl.CLAMP_TO_EDGE:gl.REPEAT);const ext=gl.getExtension("EXT_texture_filter_anisotropic");if(ext)gl.texParameterf(gl.TEXTURE_2D,ext.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));textures[name]=t;}
 async function loadSigns(){
  const c=document.createElement('canvas');c.width=c.height=2048;const g=c.getContext('2d');
  const files=['alpen-resort.svg','hornox.svg','the-dude.svg','peakfine.svg','phoenix.svg','la-perle.svg','patricia.png'];
  const positive=new Image();positive.src='assets/logo-blue.png';await positive.decode();
  const logos=await Promise.all(files.map(async f=>{const im=new Image();im.src='assets/brand-'+f;await im.decode();return im;}));
  for(let i=0;i<16;i++){
   const x=i%4*512,y=Math.floor(i/4)*512;g.fillStyle=i===10?'#dedccc':'#0e1211';g.fillRect(x,y,512,512);
   if(i<7){const im=logos[i];signAspects[i]=im.naturalWidth/im.naturalHeight;g.drawImage(im,x+20,y+20,472,472);}
   else if(i===10){signAspects[i]=positive.naturalWidth/positive.naturalHeight;g.drawImage(positive,x+20,y+20,472,472);}
   else if(i===9){g.fillStyle='#e9e5d5';g.beginPath();g.arc(x+256,y+256,236,0,Math.PI*2);g.fill();g.strokeStyle='#272c2d';g.lineWidth=12;g.stroke();for(let j=0;j<12;j++){g.save();g.translate(x+256,y+256);g.rotate(j*Math.PI/6);g.fillStyle='#272c2d';g.fillRect(-5,-213,10,31);g.restore();}g.beginPath();g.moveTo(x+256,y+256);g.lineTo(x+256,y+103);g.moveTo(x+256,y+256);g.lineTo(x+360,y+298);g.stroke();}
   else{g.fillStyle='#fff3d4';g.textAlign='center';g.textBaseline='middle';g.font='bold 52px Arial';g.fillText(i===8?'MATTERHORN':i===11?'E-TAXI':'ZERMATT',x+256,y+260,465);signAspects[i]=i===11?2.8:1;}
  }
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,c);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);textures.sign=t;
 }
 const ready=Promise.all([loadTexture("collection","assets/collection-mark.png"),loadSigns(),loadTexture("stone","assets/stone.jpg"),loadTexture("surface","assets/surfaces.jpg")]);
 function bindTextures(){gl.activeTexture(gl.TEXTURE9);gl.bindTexture(gl.TEXTURE_2D,textures.collection);gl.activeTexture(gl.TEXTURE8);gl.bindTexture(gl.TEXTURE_2D,textures.sign);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,textures.fir||null);gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,textures.stone);gl.activeTexture(gl.TEXTURE5);gl.bindTexture(gl.TEXTURE_2D,textures.surface);gl.activeTexture(gl.TEXTURE6);gl.bindTexture(gl.TEXTURE_2D,textures.facade||null);}
 const context={vp,lightVP,eye,fog,software};
 const local=new Float32Array(16),result=new Float32Array(16),stack=Array.from({length:16},()=>new Float32Array(16));let level=0;identity(stack[0]);
 const add=(name,x,y,z,sx,sy,sz,colour,rx=0,ry=0,rz=0)=>{const m=meshes[name];if(m.count>=m.capacity){droppedInstances++;return;}compose(local,x,y,z,sx,sy,sz,rx,ry,rz);multiply(result,stack[level],local);let offset=m.count++*20;m.array.set(result,offset);m.array[offset+16]=colour[0];m.array[offset+17]=colour[1];m.array[offset+18]=colour[2];m.array[offset+19]=colour[3]||0;};
 function push(x=0,y=0,z=0,rx=0,ry=0,rz=0,scale=1){compose(local,x,y,z,scale,scale,scale,rx,ry,rz);multiply(stack[level+1],stack[level],local);level++;}
 function pop(){level=Math.max(0,level-1);}
 const prefabs=new Map();
 function prefab(key,build){
  let batches=prefabs.get(key);
  if(!batches){
   const oldLevel=level,saved=stack.slice(0,level+1).map(m=>new Float32Array(m)),counts={};for(const[n,m]of Object.entries(meshes))counts[n]=m.count;
   level=0;identity(stack[0]);build();batches=[];
   for(const[n,m]of Object.entries(meshes)){if(m.count>counts[n])batches.push([n,m.array.slice(counts[n]*20,m.count*20)]);m.count=counts[n];}
   saved.forEach((m,i)=>stack[i].set(m));level=oldLevel;prefabs.set(key,batches);
  }
  for(const[n,data]of batches){const m=meshes[n];for(let i=0;i<data.length;i+=20){if(m.count>=m.capacity){droppedInstances++;continue;}
   // Multiply the cached affine transform by the current parent directly into its GPU buffer.
   const o=m.count++*20,a=stack[level];for(let c=0;c<4;c++)for(let row=0;row<4;row++)m.array[o+c*4+row]=a[row]*data[i+c*4]+a[4+row]*data[i+c*4+1]+a[8+row]*data[i+c*4+2]+a[12+row]*data[i+c*4+3];
   for(let k=16;k<20;k++)m.array[o+k]=data[i+k];
  }}
 }
 function drawBatches(shadow=false){for(const [name,m] of Object.entries(meshes))if(m.count&&!(shadow&&["sky","mountain","matterhorn"].includes(name))){gl.bindVertexArray(m.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,m.vertices,m.count);calls++;triangles+=m.vertices/3*m.count;}}
 return {gl,software,ready,add,push,pop,prefab,setGeometry(name,data,mat){const m=meshes[name];m.vertices=data.length/9;gl.bindBuffer(gl.ARRAY_BUFFER,m.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,(data instanceof Float32Array?data:new Float32Array(data)));if(data.length)add(name,0,0,0,1,1,1,[1,1,1,mat]);},setExtra(fn){extra=fn;},setHoles(list){holeCount=Math.min(8,list.length);holes.fill(0);list.slice(0,8).forEach((p,i)=>holes.set(p,i*3));},setEnvironment(time,speed,heading){environmentTime=time;environmentSpeed=speed;environmentHeading=heading;},setOrigin(x,z){worldOrigin[0]=x;worldOrigin[2]=z;},begin(){droppedInstances=0;level=0;identity(stack[0]);for(const m of Object.values(meshes))m.count=0;},
 resize(w,h,dpr=1){if(software)dpr=Math.min(dpr,Math.sqrt(220000/(w*h)));width=Math.round(w*dpr);height=Math.round(h*dpr);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}},
 render(ex,ey,ez,tx,ty,tz,fov=.91,distance=0){
  if(gl.isContextLost())return;calls=0;triangles=0;eye[0]=ex;eye[1]=ey;eye[2]=ez;
  perspective(projection,fov,width/height,.3,8000);lookAt(view,ex,ey,ez,tx,ty,tz);multiply(vp,projection,view);
  lookAt(lv,-27,43,20,0,0,0);
  // Anchor the shadow texel grid to absolute world space instead of the moving runner.
  for(const [row,span]of [[0,58],[1,70]]){const originInLight=lv[row]*worldOrigin[0]+lv[8+row]*worldOrigin[2],unit=span/shadowSize;lv[12+row]=Math.round((lv[12+row]-originInLight)/unit)*unit+originInLight;}
  ortho(lp,-29,29,-35,35,.1,125);multiply(lightVP,lp,lv);
  for(const m of Object.values(meshes))if(m.count){gl.bindBuffer(gl.ARRAY_BUFFER,m.instances);gl.bufferSubData(gl.ARRAY_BUFFER,0,m.array,0,m.count*20);}
  if(!software){gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,shadowSize,shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(depth);gl.uniformMatrix4fv(uniforms.depth,false,lightVP);bindTextures();gl.uniform1i(uniforms.depthFir,1);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,2);drawBatches(true);if(extra){context.vp=lightVP;extra("shadow",context);context.vp=vp;}gl.disable(gl.POLYGON_OFFSET_FILL);}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,width,height);gl.clearColor(.48,.69,.82,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(main);gl.uniform1i(uniforms.holeCount,holeCount);gl.uniform3fv(uniforms.holes,holes);gl.uniform1f(uniforms.environmentTime,environmentTime);gl.uniform1f(uniforms.environmentSpeed,environmentSpeed);gl.uniform2f(uniforms.forward,Math.sin(environmentHeading),-Math.cos(environmentHeading));gl.uniformMatrix4fv(uniforms.vp,false,vp);gl.uniformMatrix4fv(uniforms.light,false,lightVP);gl.uniform3fv(uniforms.eye,eye);gl.uniform3fv(uniforms.fog,fog);gl.uniform1f(uniforms.travel,distance*.52);gl.uniform1f(uniforms.detail,software?0:1);gl.uniform3fv(uniforms.origin,worldOrigin);bindTextures();gl.uniform1i(uniforms.fir,1);gl.uniform1i(uniforms.stone,2);gl.uniform1i(uniforms.surface,5);gl.uniform1i(uniforms.facade,6);gl.uniform1i(uniforms.sign,8);gl.uniform1i(uniforms.collection,9);gl.uniform1fv(uniforms.signAspects,signAspects);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(uniforms.map,0);drawBatches();if(extra)extra("main",context);
 },
 metrics(){return{renderer:"WebGL2",environmentVersion:17,holeCount,winter:1-Math.max(0,Math.min(1,(environmentTime-84)/6)),prefabCount:prefabs.size,background:"3d",droppedInstances,sceneryInstances:Object.values(meshes).reduce((n,m)=>n+m.count,0),software,drawCalls:calls,triangles:triangles/(software?1:2),width,height,contextLost:gl.isContextLost()};}
 };
}

