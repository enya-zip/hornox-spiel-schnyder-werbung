import {gearGeometry} from "./gear.js?v=17";
import {identity,multiply,compose} from "./engine3d.js?v=25";
const components={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array};
function trs(o,t,q,s){const[x,y,z,w]=q,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2;o[0]=(1-yy-zz)*s[0];o[1]=(xy+wz)*s[0];o[2]=(xz-wy)*s[0];o[3]=0;o[4]=(xy-wz)*s[1];o[5]=(1-xx-zz)*s[1];o[6]=(yz+wx)*s[1];o[7]=0;o[8]=(xz+wy)*s[2];o[9]=(yz-wx)*s[2];o[10]=(1-xx-yy)*s[2];o[11]=0;o[12]=t[0];o[13]=t[1];o[14]=t[2];o[15]=1;}
function rotateX(q,a){const x=q[0],y=q[1],z=q[2],w=q[3],s=Math.sin(a/2),c=Math.cos(a/2);q[0]=c*x+s*w;q[1]=c*y-s*z;q[2]=c*z+s*y;q[3]=c*w-s*x;}
function link(gl,vs,fs){const p=gl.createProgram();for(const[type,source]of[[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));gl.attachShader(p,s);}gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
async function parse(url){const response=await fetch(url);if(!response.ok)throw Error("Model "+response.status);const bytes=await response.arrayBuffer(),dv=new DataView(bytes);if(dv.getUint32(0,true)!==0x46546c67)throw Error("Invalid GLB");let json,bin;for(let o=12;o<bytes.byteLength;){const n=dv.getUint32(o,true),t=dv.getUint32(o+4,true);if(t===0x4e4f534a)json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,o+8,n)));else if(t===0x004e4942)bin=bytes.slice(o+8,o+8+n);o+=8+n;}if(!json||!bin)throw Error("Incomplete GLB");
 function accessor(i){const a=json.accessors[i],v=json.bufferViews[a.bufferView],T=types[a.componentType],n=components[a.type],size=T.BYTES_PER_ELEMENT,offset=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||n*size;if(a.sparse)throw Error("Sparse mesh accessor");if(stride===n*size&&offset%size===0)return new T(bin,offset,a.count*n);const result=new T(a.count*n),view=new DataView(bin),get={5120:"getInt8",5121:"getUint8",5122:"getInt16",5123:"getUint16",5125:"getUint32",5126:"getFloat32"}[a.componentType];for(let row=0;row<a.count;row++)for(let col=0;col<n;col++)result[row*n+col]=view[get](offset+row*stride+col*size,true);return result;}
 return{json,bin,accessor};
}
const visitorJackets=[[.18,.42,.50],[.74,.22,.15],[.24,.38,.27],[.43,.28,.48],[.70,.58,.38]];
const visitorHair=[[.24,.15,.10],[.46,.30,.14],[.72,.73,.73],[.11,.10,.095]];
const visitorTrousers=[[.38,.46,.50],[.61,.56,.43],[.32,.39,.29],[.43,.37,.35]];
const VS=String.raw`#version 300 es
precision highp float;layout(location=0)in vec3 position;layout(location=1)in vec3 normal;layout(location=2)in vec2 uv;layout(location=3)in vec4 joint;layout(location=4)in vec4 weight;
layout(std140)uniform Skin{mat4 bones[128];};
uniform bool walking;uniform float walkTime;uniform int poseStyle;
uniform bool skinned;uniform mat4 model;uniform mat4 vp;uniform mat4 lightVP;
out vec2 vUV;out vec3 vNormal;out vec3 vWorld;out vec4 vLight;out vec3 vRest;out vec3 vRestNormal;uniform vec4 restBounds;
void main(){mat4 skin=mat4(1.);if(skinned)skin=weight.x*bones[int(joint.x)]+weight.y*bones[int(joint.y)]+weight.z*bones[int(joint.z)]+weight.w*bones[int(joint.w)];
vec3 pos=position,norm=normal;
if(walking){
 vec3 q=(pos-restBounds.xyz)/restBounds.w,rest=q;float side=q.z<0.?-1.:1.;float gait=sin(walkTime+side*.08);
 float kneeAngle=poseStyle==4?(side>0.?-max(0.,gait)*.35:0.):-max(0.,-side*gait)*.48;
 vec3 kneePivot=vec3(0.,.25,side*.065);mat3 kneeTurn=mat3(cos(kneeAngle),sin(kneeAngle),0.,-sin(kneeAngle),cos(kneeAngle),0.,0.,0.,1.);
 float legRegion=1.-smoothstep(.14,.22,rest.y)*smoothstep(.13,.20,abs(rest.z));float knee=(1.-smoothstep(.18,.27,rest.y))*legRegion;q=mix(q,kneePivot+kneeTurn*(q-kneePivot),knee);norm=normalize(mix(norm,kneeTurn*norm,knee));
 float angle=poseStyle==4?(side>0.?-max(0.,gait)*.32:0.):side*gait*.29;vec3 pivot=vec3(0.,.46,side*.065);float leg=(1.-smoothstep(.40,.49,q.y))*legRegion;
 mat3 turn=mat3(cos(angle),sin(angle),0.,-sin(angle),cos(angle),0.,0.,0.,1.);
 q=mix(q,pivot+turn*(q-pivot),leg);norm=normalize(mix(norm,turn*norm,leg));
 float arm=smoothstep(.20,.30,rest.y)*smoothstep(.13,.19,abs(rest.z))*smoothstep(-.15,-.105,rest.x)*(1.-smoothstep(.76,.86,rest.y));
 angle=poseStyle==1?1.55:poseStyle==2?(side>0.?1.90:.35):poseStyle==3?.95:poseStyle==4?1.05:poseStyle==5?(side>0.?1.95:-side*gait*.20):poseStyle==6?(side>0.?.95:-side*gait*.22):poseStyle==7?(side>0.?1.85:-side*gait*.18):poseStyle==8?(side>0.?1.05:-side*gait*.18):-side*gait*.27;
 pivot=vec3(0.,.73,side*.18);turn=mat3(cos(angle),sin(angle),0.,-sin(angle),cos(angle),0.,0.,0.,1.);
 q=mix(q,pivot+turn*(q-pivot),arm);norm=normalize(mix(norm,turn*norm,arm));
 float hand=smoothstep(.20,.30,rest.y)*smoothstep(.18,.25,abs(rest.z))*(1.-smoothstep(.53,.66,rest.y));
 vec3 handAnchor=pivot+turn*(vec3(0.,.47,side*.26)-pivot),handTarget=handAnchor;
 if(poseStyle==1)handTarget=vec3(.33,.75,side*.085);
 if(poseStyle==3)handTarget=vec3(.28,.60,side*.14);
 if(poseStyle==4)handTarget=vec3(.28,.64,side*.15);
 if(poseStyle==5&&side>0.)handTarget=vec3(.27,.84,.24+sin(walkTime*1.25)*.018);
 if(poseStyle==6&&side>0.)handTarget=vec3(.22,.67,.17);
 if(poseStyle==7&&side>0.)handTarget=vec3(.16,.78,.15);
 if(poseStyle==8&&side>0.)handTarget=vec3(.14,.59,.22);
 q+=(handTarget-handAnchor)*hand;


 pos=q*restBounds.w+restBounds.xyz;
}
vec4 w=model*skin*vec4(pos,1.);vRest=(position-restBounds.xyz)/restBounds.w;vRestNormal=normal;vWorld=w.xyz;vNormal=normalize(mat3(model)*mat3(skin)*norm);vUV=uv;vLight=lightVP*w;gl_Position=vp*w;}`;
const FS=String.raw`#version 300 es
precision highp float;in vec2 vUV;in vec3 vNormal;in vec3 vWorld;in vec4 vLight;in vec3 vRest;in vec3 vRestNormal;
uniform sampler2D logoMap;uniform bool branded;uniform bool tourist;uniform vec3 jacketTint;uniform vec3 hairTint;uniform vec3 trouserTint;
uniform sampler2D baseMap;uniform sampler2D normalMap;uniform sampler2D shadowMap;uniform vec4 baseFactor;uniform vec3 eye;uniform vec3 fog;uniform bool hasNormal;uniform bool shadowed;uniform float roughness;
out vec4 colour;
void main(){vec4 tex=texture(baseMap,vUV)*baseFactor;if(tex.a<.1)discard;
if(tourist&&vRest.y>.36&&vRest.y<.85&&tex.r>tex.g*1.30&&tex.r>tex.b*1.25){float l=max(.12,tex.r);tex.rgb=jacketTint*l*1.35;}
if(tourist){
 float neutral=1.-smoothstep(.10,.35,max(tex.r,max(tex.g,tex.b))-min(tex.r,min(tex.g,tex.b)));
 float hair=smoothstep(.90,.94,vRest.y)*neutral;
 tex.rgb=mix(tex.rgb,hairTint*max(.35,dot(tex.rgb,vec3(.33)))*1.9,hair);
 if(vRest.y>.14&&vRest.y<.43&&abs(vRest.z)<.145){float light=max(.14,dot(tex.rgb,vec3(.33)));tex.rgb=mix(tex.rgb,trouserTint*light*1.9,.83);}
}
if(branded&&tex.b>tex.r*1.22&&tex.g>tex.r*1.1){float lum=dot(tex.rgb,vec3(.2,.65,.15));tex.rgb=vec3(.43,.48,.37)*lum*1.4;
}
if(branded&&vRest.z<-.11&&vRest.y>.43&&vRest.y<.82&&abs(vRest.x)<.18){
 float l=clamp(dot(tex.rgb,vec3(.2,.65,.15)),.045,.30);
 if(tex.r>.45&&tex.g>.45&&tex.b>.4)l=.18;
 tex.rgb=vec3(.76,.83,.65)*l;

}
vec3 n=normalize(vNormal);
if(hasNormal){vec3 q1=dFdx(vWorld),q2=dFdy(vWorld);vec2 st1=dFdx(vUV),st2=dFdy(vUV);vec3 t=normalize(q1*st2.t-q2*st1.t),b=-normalize(cross(n,t));n=normalize(mat3(t,b,n)*(texture(normalMap,vUV).xyz*2.-1.));}
vec3 lightDir=normalize(vec3(-.55,.85,.4)),v=normalize(eye-vWorld),h=normalize(v+lightDir);float ndl=max(0.,dot(n,lightDir)),shade=1.;vec3 sp=vLight.xyz/vLight.w*.5+.5;
if(shadowed&&sp.x>0.&&sp.x<1.&&sp.y>0.&&sp.y<1.&&sp.z<1.)shade=sp.z-.0012>texture(shadowMap,sp.xy).r?.68:1.;
float spec=pow(max(0.,dot(n,h)),mix(55.,8.,roughness))*.12;float rim=pow(1.-max(0.,dot(n,v)),3.)*.10;
vec3 lit=tex.rgb*(vec3(.50,.55,.62)+vec3(1.,.87,.68)*ndl*.62*shade)+vec3(1.,.87,.65)*spec+vec3(.42,.59,.66)*rim;
float haze=smoothstep(650.,3500.,length(eye-vWorld))*.26;colour=vec4(mix(lit,vec3(.50,.67,.76),haze),1.);}`;
const depthFS="#version 300 es\nprecision highp float;void main(){}";
export async function createActor(gl,url,jumpUrl=null,options={}){let red=0;
 const asset=await parse(url),{json,bin,accessor}=asset;
 if((json.extensionsRequired||[]).some(x=>x.includes("draco")))throw Error("Compressed model requires conversion");
 const program=link(gl,VS,FS),depth=link(gl,VS,depthFS),boneBuffer=gl.createBuffer();gl.bindBuffer(gl.UNIFORM_BUFFER,boneBuffer);gl.bufferData(gl.UNIFORM_BUFFER,128*64,gl.DYNAMIC_DRAW);for(const p of[program,depth]){const i=gl.getUniformBlockIndex(p,"Skin");if(i!==gl.INVALID_INDEX)gl.uniformBlockBinding(p,i,1);}
 const unis=p=>Object.fromEntries(["model","vp","lightVP","skinned","baseMap","normalMap","shadowMap","baseFactor","eye","fog","hasNormal","roughness","shadowed","logoMap","branded","restBounds","walking","walkTime","poseStyle","tourist","jacketTint","hairTint","trouserTint"].map(k=>[k,gl.getUniformLocation(p,k)])),u=unis(program),du=unis(depth);
 const white=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,white);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
 let logo=white;if(options.brand){const im=await createImageBitmap(await(await fetch('assets/hornox-pack-brand.png?v=17')).blob(),{premultiplyAlpha:'none'});logo=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,logo);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);im.close();}
 const images=await Promise.all((json.images||[]).map(async im=>{let blob;if(im.bufferView!==undefined){const v=json.bufferViews[im.bufferView];blob=new Blob([new Uint8Array(bin,v.byteOffset||0,v.byteLength)],{type:im.mimeType});}else blob=await(await fetch(new URL(im.uri,new URL(url,location.href)))).blob();const image=await createImageBitmap(blob,{premultiplyAlpha:"none",colorSpaceConversion:"none"}),tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);image.close();return tex;}));
 const texture=i=>i===undefined?white:images[json.textures[i].source]||white;
 const nodes=(json.nodes||[]).map(n=>({...n,parent:-1,baseT:new Float32Array(n.translation||[0,0,0]),baseQ:new Float32Array(n.rotation||[0,0,0,1]),baseS:new Float32Array(n.scale||[1,1,1]),t:new Float32Array(n.translation||[0,0,0]),q:new Float32Array(n.rotation||[0,0,0,1]),s:new Float32Array(n.scale||[1,1,1]),local:new Float32Array(16),world:new Float32Array(16)}));
 nodes.forEach((n,i)=>(n.children||[]).forEach(c=>nodes[c].parent=i));
 const order=[];function visit(i){order.push(i);for(const c of nodes[i].children||[])visit(c);}nodes.forEach((n,i)=>{if(n.parent<0)visit(i);});
 function worlds(){for(const i of order){const n=nodes[i];if(n.matrix)n.local.set(n.matrix);else trs(n.local,n.t,n.q,n.s);if(n.parent<0)n.world.set(n.local);else multiply(n.world,nodes[n.parent].world,n.local);}}
 worlds();
 if(options.brand&&json.skins?.length){for(const mesh of json.meshes)for(const pr of mesh.primitives){const pos=accessor(pr.attributes.POSITION),w=accessor(pr.attributes.WEIGHTS_0),j=accessor(pr.attributes.JOINTS_0);for(let i=0;i<pos.length/3;i++){if(pos[i*3+2]<-.14&&pos[i*3+1]>.77&&pos[i*3+1]<1.46&&Math.abs(pos[i*3])<.30){w.set([1,0,0,0],i*4);j.set([1,0,0,0],i*4);}}}}
 const dataBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,dataBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Uint8Array(bin),gl.STATIC_DRAW);
 gl.bindVertexArray(null);const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint8Array(bin),gl.STATIC_DRAW);
 const primitives=[],bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangleCount=0;
 for(let ni=0;ni<nodes.length;ni++){const node=nodes[ni];if(node.mesh===undefined)continue;for(const prim of json.meshes[node.mesh].primitives){
  if(prim.extensions?.KHR_draco_mesh_compression)throw Error("Draco compression unsupported");
  const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,dataBuffer);
  for(const[name,loc]of[["POSITION",0],["NORMAL",1],["TEXCOORD_0",2],["JOINTS_0",3],["WEIGHTS_0",4]]){const ai=prim.attributes[name];if(ai===undefined){gl.disableVertexAttribArray(loc);if(loc===4)gl.vertexAttrib4f(loc,1,0,0,0);else if(loc===1)gl.vertexAttrib3f(loc,0,1,0);continue;}const a=json.accessors[ai],v=json.bufferViews[a.bufferView];gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,components[a.type],a.componentType,!!a.normalized,v.byteStride||0,(v.byteOffset||0)+(a.byteOffset||0));}
  let count,offset=0,indexType;if(prim.indices!==undefined){const a=json.accessors[prim.indices],v=json.bufferViews[a.bufferView];gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);count=a.count;offset=(v.byteOffset||0)+(a.byteOffset||0);indexType=a.componentType;}else count=json.accessors[prim.attributes.POSITION].count;
  const material=json.materials?.[prim.material]||{},pbr=material.pbrMetallicRoughness||{};
  primitives.push({vao,count,offset,indexType,node:ni,skin:node.skin,base:texture(pbr.baseColorTexture?.index),normal:texture(material.normalTexture?.index),hasNormal:!!material.normalTexture,factor:new Float32Array(pbr.baseColorFactor||[1,1,1,1]),roughness:pbr.roughnessFactor??.85});triangleCount+=count/3;
  const positions=accessor(prim.attributes.POSITION),m=node.skin===undefined?node.world:identity(new Float32Array(16));for(let j=0;j<positions.length;j+=3){const x=positions[j],y=positions[j+1],z=positions[j+2];for(let k=0;k<3;k++){const v=m[k]*x+m[4+k]*y+m[8+k]*z+m[12+k];bounds.min[k]=Math.min(bounds.min[k],v);bounds.max[k]=Math.max(bounds.max[k],v);}}
 }}
 const skins=(json.skins||[]).map(s=>({joints:s.joints,inverse:null,palette:new Float32Array(128*16)}));
 for(let i=0;i<skins.length;i++){skins[i].inverse=json.skins[i].inverseBindMatrices===undefined?null:accessor(json.skins[i].inverseBindMatrices);if(skins[i].joints.length>128)throw Error("Skeleton too large");}
 function clip(data,index=0){const a=data.json.animations?.[index];if(!a)return null;let duration=0;const channels=[];for(const c of a.channels){if(data!==asset&&c.target.path!=="rotation")continue;const nodeName=data.json.nodes[c.target.node].name,ni=data===asset?c.target.node:nodes.findIndex(n=>n.name===nodeName);if(ni<0)continue;const sampler=a.samplers[c.sampler],times=data.accessor(sampler.input),values=data.accessor(sampler.output);duration=Math.max(duration,times[times.length-1]);channels.push({node:ni,path:c.target.path,times,values,interpolation:sampler.interpolation||"LINEAR"});}return{duration,channels};}
 const clips={run:clip(asset),jump:null};if(jumpUrl){try{clips.jump=clip(await parse(jumpUrl));}catch(e){console.warn("Jump clip",e.message);}}
 const hips=nodes.findIndex(n=>/(hips|pelvis)/i.test(n.name||"")),baseY=bounds.min[1],scale=(options.height||3.15)/(bounds.max[1]-bounds.min[1]),centerX=(bounds.min[0]+bounds.max[0])/2,centerZ=(bounds.min[2]+bounds.max[2])/2;
 let gear=[],brandLabel;const gearModel=new Float32Array(16),gearPose=new Float32Array(16),gearBase=new Float32Array(16);let gearSwing=0,gearNod=0;
 if(options.brand){
  const im=await createImageBitmap(await(await fetch('assets/hornox-mug.jpg?v=17')).blob());const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);im.close();
  brandLabel=gl.createVertexArray();gl.bindVertexArray(brandLabel);const labelBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,labelBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-.5,0,0,0,0,-1,1,1, -.5,1,0,0,0,-1,1,0, .5,1,0,0,0,-1,0,0, -.5,0,0,0,0,-1,1,1, .5,1,0,0,0,-1,0,0, .5,0,0,0,0,-1,0,1]),gl.STATIC_DRAW);
  for(const[loc,size,offset]of[[0,3,0],[1,3,12],[2,2,24]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);}gl.disableVertexAttribArray(3);gl.disableVertexAttribArray(4);
  gear=gearGeometry().map(g=>{const vao=gl.createVertexArray();gl.bindVertexArray(vao);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,g.data,gl.STATIC_DRAW);for(const[loc,size,offset]of[[0,3,0],[1,3,12],[2,2,24]]){gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);}gl.disableVertexAttribArray(3);gl.disableVertexAttribArray(4);return{vao,count:g.data.length/8,texture:g.texture?texture:white,colour:g.colour};});
 }
 const placement=new Float32Array(16),model=new Float32Array(16),temp=new Float32Array(16),offset=new Float32Array(16);compose(offset,-centerX,-baseY,-centerZ);
 const sample=(c,time)=>{const n=nodes[c.node],out=c.path==="translation"?n.t:c.path==="rotation"?n.q:c.path==="scale"?n.s:null;if(!out)return;const times=c.times,values=c.values,stride=out.length;let lo=0,hi=times.length-1;while(lo+1<hi){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid;else hi=mid;}const next=Math.min(lo+1,times.length-1),f=c.interpolation==="STEP"?0:Math.max(0,Math.min(1,(time-times[lo])/(times[next]-times[lo]||1)));let sign=1;if(stride===4){let dot=0;for(let k=0;k<4;k++)dot+=values[lo*4+k]*values[next*4+k];if(dot<0)sign=-1;}for(let k=0;k<stride;k++)out[k]=values[lo*stride+k]*(1-f)+values[next*stride+k]*f*sign;if(stride===4){const length=Math.hypot(...out)||1;for(let k=0;k<4;k++)out[k]/=length;}};
 const dynamicSkeleton=!!(clips.run||clips.jump||skins.length);
 let animationName="run",poseJump=0,poseDuck=0,walkTime=0,poseStyle=0,jacketTint=visitorJackets[0],hairTint=visitorHair[0],trouserTint=visitorTrousers[0];
 function update({distance=0,time=0,jump=0,duck=0,home=false,x=0,y=0,z=0,heading=0,lean=0,impact=0,variant=0,heightScale=1,style=0}){
  walkTime=time*4.6+variant*1.7;poseStyle=style;const look=Math.abs(variant);jacketTint=visitorJackets[look%5];hairTint=visitorHair[look%4];trouserTint=visitorTrousers[(look+1)%4];
  if(dynamicSkeleton)for(const n of nodes){n.t.set(n.baseT);n.q.set(n.baseQ);n.s.set(n.baseS);}
  const selected=jump>0&&clips.jump?clips.jump:clips.run;
  animationName=jump>0?"jump":duck>0?"slide":home?"idle":"run";poseJump=jump;poseDuck=duck;
  if(selected){const phase=home?.35:jump>0&&clips.jump?(18-jump)/18:(distance*.12)%1;for(const c of selected.channels)sample(c,Math.min(selected.duration-.0001,phase*selected.duration));}
  if(hips>=0){nodes[hips].t[0]=nodes[hips].baseT[0];nodes[hips].t[2]=nodes[hips].baseT[2];if(jump>0)nodes[hips].t[1]=nodes[hips].baseT[1];}
  if(duck>0){for(const n of nodes){const name=n.name||"";if(/UpLeg/i.test(name))rotateX(n.q,-.65);else if(/Leg/i.test(name)&&!/Up/i.test(name))rotateX(n.q,.95);else if(/spine/i.test(name))rotateX(n.q,.18);}}
  gearSwing=(home?Math.sin(time*.8)*.025:Math.sin(distance*.12*Math.PI*2)*.10)+(duck>0?.12:0);gearNod=jump>0?.12:Math.sin(time*4)*.035;
  if(dynamicSkeleton)worlds();
  for(const skin of skins)for(let j=0;j<skin.joints.length;j++){if(skin.inverse){temp.set(skin.inverse.subarray(j*16,j*16+16));multiply(model,nodes[skin.joints[j]].world,temp);}else model.set(nodes[skin.joints[j]].world);skin.palette.set(model,j*16);}
  const squash=1-Math.min(.07,impact*.07);compose(temp,x,y-(duck>0?.66:0),z,scale*heightScale/Math.sqrt(squash),scale*heightScale*squash,scale*heightScale/Math.sqrt(squash),duck>0?.30:0,heading,lean);multiply(placement,temp,offset);
 }
 function draw(pass,context){
  const shadow=pass==="shadow",p=shadow?depth:program,uniform=shadow?du:u;gl.useProgram(p);gl.uniform1i(uniform.walking,!!options.walk);gl.uniform1f(uniform.walkTime,walkTime);gl.uniform1i(uniform.poseStyle,poseStyle);gl.uniform4f(uniform.restBounds,centerX,baseY,centerZ,bounds.max[1]-bounds.min[1]);gl.uniformMatrix4fv(uniform.vp,false,context.vp);gl.uniformMatrix4fv(uniform.lightVP,false,context.lightVP);gl.bindBufferBase(gl.UNIFORM_BUFFER,1,boneBuffer);
  if(!shadow){gl.uniform1i(u.tourist,!!options.walk);gl.uniform3fv(u.jacketTint,jacketTint);gl.uniform3fv(u.hairTint,hairTint);gl.uniform3fv(u.trouserTint,trouserTint);gl.uniform3fv(u.eye,context.eye);gl.uniform3fv(u.fog,context.fog);gl.uniform1i(u.shadowed,!context.software);gl.uniform1i(u.shadowMap,0);gl.uniform1i(u.baseMap,3);gl.uniform1i(u.normalMap,4);gl.uniform1i(u.logoMap,7);gl.activeTexture(gl.TEXTURE7);gl.bindTexture(gl.TEXTURE_2D,logo);gl.uniform1i(u.branded,!!options.brand);gl.uniform4f(u.restBounds,centerX,baseY,centerZ,bounds.max[1]-bounds.min[1]);}
  for(const prim of primitives){const sk=skins[prim.skin];if(sk){gl.bindBuffer(gl.UNIFORM_BUFFER,boneBuffer);gl.bufferSubData(gl.UNIFORM_BUFFER,0,sk.palette);model.set(placement);}else multiply(model,placement,nodes[prim.node].world);
   gl.uniformMatrix4fv(uniform.model,false,model);gl.uniform1i(uniform.skinned,!!sk);
   if(!shadow){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,prim.base);gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,prim.normal);gl.uniform4fv(u.baseFactor,red>0?[prim.factor[0]*(1+.5*red),prim.factor[1]*(1-.62*red),prim.factor[2]*(1-.62*red),prim.factor[3]]:prim.factor);gl.uniform1i(u.hasNormal,prim.hasNormal&&!context.software);gl.uniform1f(u.roughness,prim.roughness);}
   gl.bindVertexArray(prim.vao);if(prim.indexType)gl.drawElements(gl.TRIANGLES,prim.count,prim.indexType,prim.offset);else gl.drawArrays(gl.TRIANGLES,0,prim.count);
  }
  if(gear.length){
   const unit=(bounds.max[1]-bounds.min[1])/1.8;
   compose(gearPose,centerX-.265*unit,baseY+1.23*unit,centerZ-.29*unit,unit,unit,unit,gearNod,0,gearSwing);
   if(skins.length){gearBase.set(skins[0].palette.subarray(16,32));multiply(gearModel,placement,gearBase);}else gearModel.set(placement);
   multiply(model,gearModel,gearPose);gl.uniformMatrix4fv(uniform.model,false,model);gl.uniform1i(uniform.skinned,false);
   if(!shadow){gl.uniform1i(u.branded,false);gl.uniform1i(u.hasNormal,false);gl.uniform1f(u.roughness,.4);}
   for(const g of gear){if(!shadow){gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,g.texture);gl.uniform4fv(u.baseFactor,red>0?[g.colour[0]*(1+.5*red),g.colour[1]*(1-.62*red),g.colour[2]*(1-.62*red),g.colour[3]]:g.colour);}gl.bindVertexArray(g.vao);gl.drawArrays(gl.TRIANGLES,0,g.count);}
   if(!shadow&&brandLabel){compose(gearPose,centerX,baseY+.89*unit,centerZ-.405*unit,.34*unit,.40*unit,1);multiply(model,gearModel,gearPose);gl.uniformMatrix4fv(uniform.model,false,model);gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,logo);gl.uniform4fv(u.baseFactor,new Float32Array([1,1,1,1]));gl.bindVertexArray(brandLabel);gl.drawArrays(gl.TRIANGLES,0,6);}
  }
 }
 update({});
 // Weltposition eines Knochens (z. B. für Schneeschuhe an den Füssen).
  const jointTemp=new Float32Array(16);function joint(name){const n=nodes.find(q=>q.name===name);if(!n)return null;multiply(jointTemp,placement,n.world);return[jointTemp[12],jointTemp[13],jointTemp[14]];}
  // setRed(0..1): färbt die Figur rot (z. B. nach einem Bienenstich).
  return{setRed(v){red=Math.max(0,Math.min(1,v||0));},update,draw,joint,metrics:()=>({heroTriangles:triangleCount,dynamicSkeleton,joints:skins.reduce((n,s)=>n+s.joints.length,0),clips:Object.keys(clips).filter(k=>clips[k]),animation:animationName,poseJump,poseDuck,primitives:primitives.length,gearParts:gear.length,brandLabel:!!brandLabel,gearSwing}),bounds,names:nodes.map(n=>n.name)};
}

