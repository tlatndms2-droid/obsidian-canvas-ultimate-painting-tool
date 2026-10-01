const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const vault='C:/Users/tlatn/AppData/Local/Temp/CanvasDrawingSandbox-20260927';
const out='planning/minimum-check-evidence';
async function drag(p,a,b){await p.mouse.move(...a);await p.mouse.down();await p.mouse.move(...b,{steps:8});await p.mouse.up();}
(async()=>{
 const b=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const p=b.contexts()[0].pages().find(x=>x.url().startsWith('app://'));
 const title=await p.title();if(!title.includes('CanvasDrawingSandbox-20260927'))throw new Error('Wrong Sandbox');
 fs.mkdirSync(out,{recursive:true});
 const hashes={};for(const f of ['.obsidian/workspace.json','.obsidian/plugins/canvas-drawing-integration-poc/data.json']){
  const src=path.join(vault,f);if(fs.existsSync(src)){const data=fs.readFileSync(src);fs.writeFileSync(path.join(out,path.basename(f)+'.before'),data);hashes[f]=crypto.createHash('sha256').update(data).digest('hex');}
 }
 const pluginHashes={};for(const f of ['main.js','manifest.json','styles.css']){
  const hash=x=>crypto.createHash('sha256').update(fs.readFileSync(x)).digest('hex');
  pluginHashes[f]={source:hash('poc/plugin/'+f),installed:hash(path.join(vault,'.obsidian/plugins/canvas-drawing-integration-poc',f))};
  if(pluginHashes[f].source!==pluginHashes[f].installed)throw new Error('Plugin mismatch '+f);
 }
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const primitives=await p.evaluate(()=>{
  const make=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
  const modes={};for(const mode of ['multiply','screen','overlay','darken','lighten','color-dodge','color-burn','difference']){
   const c=make(8,8),x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,8,8);x.globalCompositeOperation=mode;const accepted=x.globalCompositeOperation===mode;x.fillStyle='#0000ff';x.fillRect(0,0,8,8);modes[mode]={accepted,pixel:[...x.getImageData(2,2,1,1).data]};
  }
  const c=make(480,140),x=c.getContext('2d');x.fillStyle='#f5f3ef';x.fillRect(0,0,480,140);x.fillStyle='#235de5';x.fillRect(30,40,420,75);
  let color=[230,55,55];for(let i=30;i<450;i+=3){const old=x.getImageData(i,75,1,1).data;color=color.map((v,k)=>v*.94+old[k]*.06);x.fillStyle=`rgb(${color.map(Math.round).join(',')})`;x.beginPath();x.arc(i,75,16,0,Math.PI*2);x.fill();}
  const mixMid=[...x.getImageData(160,75,1,1).data];
  return {modes,mixMid,mixImage:c.toDataURL(),mixConclusion:'Toy RGB pickup example only. Not pigment simulation, not approved quality, not layer policy or performance proof.'};
 });
 fs.writeFileSync(out+'/mix-example.png',Buffer.from(primitives.mixImage.split(',')[1],'base64'));delete primitives.mixImage;
 const eyedropper=await p.evaluate(()=>({exists:typeof EyeDropper==='function',secure:isSecureContext}));
 await p.evaluate(()=>{
  const btn=document.createElement('button');btn.id='minimum-eye-check';btn.textContent='시험 스포이드';btn.style.cssText='position:fixed;z-index:999999;top:10px;left:420px;background:white;color:black';
  btn.onclick=()=>{window.__minimumEye={started:true};const ctl=new AbortController();setTimeout(()=>ctl.abort(),1000);new EyeDropper().open({signal:ctl.signal}).then(r=>window.__minimumEye={selected:r}).catch(e=>window.__minimumEye={error:e.name,message:e.message});};document.body.append(btn);
 });
 await p.locator('#minimum-eye-check').click();await p.waitForTimeout(1300);eyedropper.activation=await p.evaluate(()=>window.__minimumEye);await p.evaluate(()=>{document.getElementById('minimum-eye-check')?.remove();delete window.__minimumEye});
 const fixture='Minimum-Undo-'+Date.now()+'.canvas';
 await p.evaluate(async name=>{const f=await app.vault.create(name,JSON.stringify({nodes:[{id:'minimum-note',type:'text',x:-150,y:-70,width:300,height:140,text:'Undo verification card'}],edges:[]}));await app.workspace.getLeaf(false).openFile(f)},fixture);
 await p.waitForTimeout(900);
 const snapshot=()=>p.evaluate(()=>{const q=app.plugins.plugins['canvas-drawing-integration-poc'],v=app.workspace.activeLeaf.view;const node=v.canvas.getData().nodes.find(n=>n.id==='minimum-note');return{strokes:q.strokes.length,node:{x:node.x,y:node.y},historyKeys:Object.keys(v.canvas.history),file:v.file.path}});
 const getCard=()=>p.evaluate(()=>{const el=app.workspace.activeLeaf.view.containerEl.querySelector('.canvas-node');const r=el.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}});
 const start=await snapshot();let card=await getCard();
 await p.locator('.canvas-drawing-poc-controls button').filter({hasText:'그리기'}).click();await drag(p,[card.x+40,card.y+70],[card.x+160,card.y+90]);await p.waitForTimeout(350);const first=await snapshot();
 await p.locator('.canvas-drawing-poc-controls button').filter({hasText:'선택'}).click();await drag(p,[card.x+30,card.y+30],[card.x+90,card.y+70]);await p.waitForTimeout(500);const moved=await snapshot();
 card=await getCard();await p.locator('.canvas-drawing-poc-controls button').filter({hasText:'그리기'}).click();await drag(p,[card.x+40,card.y+110],[card.x+180,card.y+125]);await p.waitForTimeout(450);const second=await snapshot();
 await p.keyboard.press('Control+z');await p.waitForTimeout(400);const undo=await snapshot();await p.screenshot({path:out+'/undo.png'});
 const result={title,fixture,backupHashes:hashes,pluginHashes,primitives,eyedropper,undoSequence:{start,first,moved,second,undo},errors,notRun:['ABR import: no .abr in project','Physical pen pressure/tilt: no device input','Large canvas optimization: deferred by agreement','Full native Undo integration: no adapter implemented','Actual EyeDropper pixel selection: not performed']};
 fs.writeFileSync(out+'/results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
