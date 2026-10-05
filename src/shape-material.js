'use strict';
const {materialDefaults}=require('./materials');
const defaults={...materialDefaults,opacity:1,density:1,hardness:1,roundness:1,angle:0,spacing:.08};
const clone=x=>JSON.parse(JSON.stringify(x));
function ensure(st){for(const[k,v]of Object.entries(defaults))if(st[k]===undefined)st[k]=clone(v);return st;}
function open(fig,kind){const s=fig.s,st=ensure(s.plugin.settings.shapeStyle),u=Object.create(s.brushUI);
 Object.defineProperty(u,'p',{value:st});u.modals=s.brushUI.modals;
 u.save=()=>{if(fig.pending){for(const k of Object.keys(defaults))fig.pending[k]=clone(st[k]);fig.preview();}fig.save();};
 const fields={hardness:['경도',0,100,100],roundness:['두께 / 원형도',5,100,100],angle:['각도',-180,180,1],tipScale:['끝 모양 배율',10,300,100],density:['브러시 농도',0,100,100],spacing:['브러시 끝 간격',1,100,100],textureDensity:['종이 재질 농도',0,100,100],textureScale:['재질 확대율',10,300,100],textureAngle:['재질 회전각',-180,180,1]};
 u.field=(parent,key)=>{const[label,min,max,f]=fields[key];fig.field(parent,label,Math.round(st[key]*f),min,max,v=>{st[key]=v/f;u.save();});};
 u.exposedCheck=(parent,label,key)=>u.check(parent,label,st,key);
 const material=new (require('./material-ui').MaterialUI)(u),m=u.modal(kind==='tip'?'도형 브러시 끝':'도형 질감');
 const refresh=()=>{m.contentEl.replaceChildren();material[kind](m.contentEl,refresh);if(kind==='tip')u.field(m.contentEl,'spacing');u.btn(m.contentEl,'닫기',()=>m.close());};refresh();
}
module.exports={defaults,ensure,open};
