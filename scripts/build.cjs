'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
function bundle(name,stack=[]) {
  if(stack.includes(name))throw Error('Circular module: '+name);
  const source=fs.readFileSync(path.join(root,'src',name+'.js'),'utf8');
  return source.replace(/require\('\.\/([a-z-]+)'\)/g,(_,dep)=>`(()=>{const module={exports:{}};\n${bundle(dep,[...stack,name])}\nreturn module.exports;})()`);
}
const worker=`const hashes=new Map();const Buffer={from(value){const bytes=typeof value==='string'?Uint8Array.from(atob(value),c=>c.charCodeAt(0)):new Uint8Array(value);bytes.toString=()=>{let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s)};return bytes;}};const require=name=>name==='node:crypto'?{randomUUID:()=>crypto.randomUUID(),createHash:()=>({update(value){this.value=value;return this},digest(){if(!hashes.has(this.value))throw Error('Missing checksum');return hashes.get(this.value)}})}:{};const module={exports:{}};
`+bundle('storage')+`
async function hash(value){if(hashes.has(value))return;const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));hashes.set(value,Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join(''));}
async function assets(data){for(const a of Object.values(data.assets||{})){if(a&&typeof a.mask==='string')await hash(a.kind+':'+a.width+':'+a.height+':'+a.mask);}}
self.onmessage=async({data:job})=>{try{hashes.clear();await assets(job.data);const payload=JSON.stringify(job.data);await hash(payload);let previous=null;if(job.previousRaw){const envelope=JSON.parse(job.previousRaw);await hash(envelope.payload);await assets(JSON.parse(envelope.payload));previous=module.exports.decode(job.previousRaw,job.data.id);if(previous.revision>=job.data.revision)throw Error('다른 창 또는 외부에서 변경된 그림입니다. 덮어쓰기를 중지합니다.');}const raw=module.exports.encode(job.data);postMessage({id:job.id,raw,previousVersion:previous?.version});}catch(e){postMessage({id:job.id,error:e.message});}finally{hashes.clear();}};`;
const main=bundle('main').replace("'__CDT_STORAGE_WORKER__'",JSON.stringify(worker));
new vm.Script(main, {filename:'main.js'});
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) throw Error('Version mismatch');
fs.mkdirSync(path.join(root, 'dist'), {recursive:true});
fs.writeFileSync(path.join(root, 'dist/main.js'), main);
for (const name of ['manifest.json', 'styles.css']) fs.copyFileSync(path.join(root, name), path.join(root, 'dist', name));
console.log(`Built ${manifest.id} ${manifest.version}`);
