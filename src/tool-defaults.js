'use strict';
const metadata=new Set(['id','name','tool','pinned','shortcut','group','defaults']);
const clone=x=>JSON.parse(JSON.stringify(x));
const settings=p=>clone(Object.fromEntries(Object.entries(p).filter(([k])=>!metadata.has(k))));
function register(p){p.defaults=settings(p);}
function reset(p){const d=settings(p.defaults||{});for(const k of Object.keys(p))if(!metadata.has(k))delete p[k];Object.assign(p,d);}
module.exports={settings,register,reset};
