'use strict';
const {Notice}=require('obsidian');
let windowsFonts;
function systemFonts(refresh){
 if(refresh)windowsFonts=null;
 return windowsFonts??=new Promise((resolve,reject)=>{
  const command="[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); Add-Type -AssemblyName System.Drawing; $cdtFonts=New-Object System.Drawing.Text.InstalledFontCollection; @($cdtFonts.Families | ForEach-Object { [pscustomobject]@{family=$_.GetName(1033);label=$_.GetName(1042)} }) | ConvertTo-Json -Compress";
  require('node:child_process').execFile('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{windowsHide:true,encoding:'utf8',timeout:20000,maxBuffer:4*1024*1024},(error,output)=>{if(error){windowsFonts=null;reject(error);}else try{resolve(JSON.parse(output.replace(/^\uFEFF/,'')));}catch(e){windowsFonts=null;reject(e);}});
 });
}
async function installedFonts(win,refresh=false){
 if(!refresh&&win.__cdtFontEntries)return win.__cdtFontEntries;
 const entries=new Map();let error;
 if(typeof win.queryLocalFonts==='function')try{for(const f of await win.queryLocalFonts())entries.set(f.family,{family:f.family,label:f.family});}catch(e){error=e;}
 if(process.platform==='win32')try{for(const f of await systemFonts(refresh))entries.set(f.family,f);}catch(e){error=e;}
 if(!entries.size)throw error||Error('설치 폰트 조회를 지원하지 않습니다.');
 return win.__cdtFontEntries=[...entries.values()].filter(f=>f.family).sort((a,b)=>a.label.localeCompare(b.label,'ko'));
}
function fontControl(s,parent,current,change){
 const row=s.element('label','cdt-text-field',parent);s.element('span','',row,'폰트');const select=s.element('select','',row);select.setAttribute('aria-label','폰트');
 const populate=entries=>{const value=select.value||current;select.replaceChildren();const fonts=[{family:'',label:'Obsidian 기본'},...entries];if(value&&!fonts.some(f=>f.family===value))fonts.push({family:value,label:value});for(const f of fonts){const o=s.element('option','',select,f.label);o.value=f.family;o.title=f.family;}select.value=value;};
 populate(s.win.__cdtFontEntries||[]);select.onchange=()=>change(select.value);
 const load=async refresh=>{try{const names=await installedFonts(s.win,refresh);if(select.isConnected)populate(names);}catch(error){new Notice('설치 폰트 목록: '+error.message);}};
 s.button(row,'refresh-cw','설치 폰트 새로고침',()=>load(true));load(false);
}
module.exports={installedFonts,fontControl};
