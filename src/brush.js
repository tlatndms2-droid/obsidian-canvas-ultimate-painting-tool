'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const clone=x=>x===null||typeof x!=='object'?x:Array.isArray(x)?x.map(clone):Object.fromEntries(Object.entries(x).map(([k,v])=>[k,clone(v)]));
const linear=()=>[[0,0],[1,1]];
function slopes(a){const d=a.slice(1).map((p,i)=>(p[1]-a[i][1])/(p[0]-a[i][0]));return a.map((p,i)=>{if(!i)return d[0];if(i===a.length-1)return d[i-1];if(d[i-1]*d[i]<=0)return 0;const h=p[0]-a[i-1][0],j=a[i+1][0]-p[0],w1=2*j+h,w2=j+2*h;return(w1+w2)/(w1/d[i-1]+w2/d[i]);});}
function curveAt(x,a){if(x<=a[0][0])return a[0][1];if(x>=a.at(-1)[0])return a.at(-1)[1];let i=a.findIndex(p=>p[0]>=x),m=slopes(a),h=a[i][0]-a[i-1][0],t=(x-a[i-1][0])/h;return clamp((2*t**3-3*t*t+1)*a[i-1][1]+(t**3-2*t*t+t)*h*m[i-1]+(-2*t**3+3*t*t)*a[i][1]+(t**3-t*t)*h*m[i]);}
function validCurve(a){return Array.isArray(a)&&a.length>=2&&a.length<=16&&a[0][0]===0&&a.at(-1)[0]===1&&a.every((p,i)=>Array.isArray(p)&&p.length===2&&p.every(v=>Number.isFinite(v)&&v>=0&&v<=1)&&(!i||p[0]>a[i-1][0]));}
const {materialDefaults,builtins}=require('./materials');
const defaults={...materialDefaults,size:24,opacity:1,density:1,hardness:1,mix:false,mixType:'blend',mixSource:'current',paintAmount:.5,colorStretch:.5,roundness:1,angle:0,spacing:.12,stabilization:0,tilt:false,scatter:false,particleSize:.3,particleCount:5,spread:1,blend:'source-over'};
function preset(id,name,tool,values={}){const p={id,name,tool,pinned:false,shortcut:'',quick:['size','opacity'],...clone(defaults),...values};for(const kind of ['size','opacity','density'])p[kind+'Dynamics']=values[kind+'Dynamics']||{enabled:tool==='brush'&&kind==='size',min:kind==='size'?.05:0,strength:1,curve:linear()};return p;}
function upgrade(settings){
 require('./brush-snap').ensure(settings);
 if(!settings.presets){settings.presets=[preset('basic','기본 펜','brush',Object.fromEntries(Object.keys(defaults).filter(k=>k in settings).map(k=>[k,settings[k]]))),preset('pressure','필압 펜','brush',{size:28,sizeDynamics:{enabled:true,min:.03,strength:1,curve:linear()}}),preset('soft','부드러운 브러시','brush',{size:70,hardness:0,density:.3}),preset('flat','납작한 펜','brush',{size:36,roundness:.25,angle:-35,tilt:true}),preset('eraser','원형 지우개','eraser',{size:settings.eraserSize||32})];settings.selectedBrush='basic';settings.selectedEraser='eraser';}
 if(!settings.eraserExtrasVersion){for(const [id,name,values]of [['eraser-soft','부드러운 지우개',{size:90,hardness:0,density:.5}],['eraser-flat','납작한 지우개',{size:55,roundness:.25,angle:-30}],['eraser-pressure','필압 지우개',{size:40}]]){if(!settings.presets.some(p=>p.id===id)){settings.presets.push(preset(id,name,'eraser',{...values,sizeDynamics:{enabled:true,min:.05,strength:1,curve:linear()}}));}}settings.eraserExtrasVersion=1;}
 if(!settings.textureEraserVersion){if(!settings.presets.some(p=>p.id==='eraser-texture'))settings.presets.push(preset('eraser-texture','질감 지우개','eraser',{size:80,hardness:.8,texture:true,textureAsset:clone(builtins().find(a=>a.kind==='texture')),textureDensity:1,textureMode:'multiply',sizeDynamics:{enabled:true,min:.05,strength:1,curve:linear()}}));settings.textureEraserVersion=1;}
 settings.library??=builtins();settings.globalCurve??=linear();settings.inputMode??='automatic';settings.penButton??='eraser';settings.cursorMode??='both';settings.cursorPressure??=true;
 for(const p of settings.presets){if(!['blend','running','smear'].includes(p.mixType))p.mixType='blend';for(const [k,v] of Object.entries(materialDefaults))if(p[k]===undefined)p[k]=clone(v);p.defaults??=clone(Object.fromEntries(Object.entries(p).filter(([k])=>!['id','name','tool','pinned','shortcut','defaults'].includes(k))))}
 return settings;
}
function selected(settings,tool){return settings.presets.find(p=>p.id===settings[tool==='eraser'?'selectedEraser':'selectedBrush']&&p.tool===tool)||settings.presets.find(p=>p.tool===tool);}
function response(p,kind,pressure){const d=p[kind+'Dynamics'];return d?.enabled?(1-d.strength)+d.strength*(d.min+(1-d.min)*curveAt(pressure,d.curve)):1;}
function inputPoint(x,y,event,p,settings){
 const isPen=event.pointerType==='pen'&&settings.inputMode!=='mouse';
 const pressure=isPen?curveAt(clamp(event.pressure??1),settings.globalCurve):1;
 // Mouse remains full pressure, independent of tablet calibration.
 const size=isPen?response(p,'size',pressure):1,opacity=isPen?response(p,'opacity',pressure):1,density=isPen?response(p,'density',pressure):1;
 const tx=event.tiltX||0,ty=event.tiltY||0,angle=isPen&&p.tilt&&(tx||ty)?Math.atan2(ty,tx)*180/Math.PI:0;
 return [x,y,size,opacity,density,angle];
}
class Stabilizer {
 constructor(amount){this.amount=clamp(amount);this.last=null;this.time=null;}
 add(p,time){if(!this.last||!this.amount){this.last=p;this.time=time;return p;}const dt=clamp(time-this.time,1,50),a=1-Math.exp(-dt/(this.amount*45));const out=p.slice();out[0]=this.last[0]+(p[0]-this.last[0])*a;out[1]=this.last[1]+(p[1]-this.last[1])*a;this.last=out;this.time=time;return out;}
}
module.exports={clamp,clone,linear,slopes,curveAt,validCurve,defaults,preset,upgrade,selected,response,inputPoint,Stabilizer};
