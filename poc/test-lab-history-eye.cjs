const{chromium}=require('playwright');const fs=require('fs');const {PNG}=require('pngjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function drag(p,a,b){await p.mouse.move(...a);await p.mouse.down();await p.mouse.move(...b,{steps:10});await p.mouse.up();await wait(450)}
(async()=>{const b=await chromium.connectOverCDP('http://127.0.0.1:9287');const p=b.contexts()[0].pages().find(p=>p.url().startsWith('app://'));const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.evaluate(async()=>{const f=await app.vault.create('History-Final-'+Date.now()+'.canvas',JSON.stringify({nodes:[{id:'lab-card',type:'text',x:-320,y:-100,width:260,height:180,text:'카드와 그림 되돌리기 확인',color:'4'},{id:'lab-image',type:'file',file:'Lab-green.svg',x:100,y:-100,width:240,height:160}],edges:[]}));await app.workspace.getLeaf(false).openFile(f)});await p.waitForTimeout(800);await p.locator('.drawing-lab-options summary').evaluate(e=>e.parentElement.open=false);
const state=()=>p.evaluate(()=>{const q=app.plugins.plugins['canvas-drawing-integration-poc'],c=app.workspace.activeLeaf.view.canvas,n=c.nodes.get('lab-card');return{strokes:q.strokes.length,color:q.color,card:[n.x,n.y],history:c.history.current,entries:c.history.data.length,picked:q.lastPicked}});
const box=id=>p.evaluate(id=>{const r=app.workspace.activeLeaf.view.canvas.nodes.get(id).nodeEl.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}},id);
const click=label=>p.locator('.canvas-drawing-poc-controls button').filter({hasText:new RegExp('^'+label+'$')}).click();
const screenPixel=async(x,y)=>{const png=PNG.sync.read(await p.screenshot({clip:{x:Math.floor(x),y:Math.floor(y),width:1,height:1}}));return '#'+[...png.data].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')};
const initial=await state();if(initial.strokes!==0)throw Error('Fixture already has strokes; preserve and use a fresh fixture');
let card=await box('lab-card');await click('그리기');await drag(p,[card.x+35,card.y+85],[card.x+155,card.y+85]);const first=await state();
await click('선택');await drag(p,[card.x+30,card.y+30],[card.x+90,card.y+70]);const moved=await state();
card=await box('lab-card');await click('그리기');await drag(p,[card.x+35,card.y+125],[card.x+165,card.y+125]);const second=await state();
const undos=[],redos=[];for(let i=0;i<3;i++){await click('되돌리기');await wait(180);undos.push(await state())}for(let i=0;i<3;i++){await click('다시 실행');await wait(180);redos.push(await state())}
const eye={};const image=await box('lab-image');await click('스포이드');await p.mouse.click(image.x+image.w/2,image.y+image.h/2);await wait(500);eye.image=await state();
card=await box('lab-card');await click('스포이드');await p.mouse.click(card.x+card.w-25,card.y+card.h-25);await wait(500);eye.card=await state();
// First stroke stays at the original Canvas position despite moving its card.
const spot=await p.evaluate(()=>{const q=app.plugins.plugins['canvas-drawing-integration-poc'],s=q.strokes[0],r=q.canvas.getBoundingClientRect(),scale=r.width/q.canvas.offsetWidth;const m=s[Math.floor(s.length/2)];return{x:r.x+m[0]*scale,y:r.y+m[1]*scale}});
eye.drawingReference=await screenPixel(spot.x,spot.y);await click('스포이드');await p.mouse.click(spot.x,spot.y);await wait(500);eye.drawing=await state();
const assertions={undoLastStroke:undos[0].strokes===1,undoCard:JSON.stringify(undos[1].card)===JSON.stringify(initial.card),undoFirstStroke:undos[2].strokes===0,redoAll:redos[2].strokes===2&&JSON.stringify(redos[2].card)===JSON.stringify(moved.card),imageColor:eye.image.color==='#229966',drawingColor:eye.drawing.color===eye.drawingReference};
const result={initial,first,moved,second,undos,redos,eye,assertions,errors};fs.writeFileSync('poc/evidence/lab-history-eye.json',JSON.stringify(result,null,2));await p.screenshot({path:'poc/evidence/lab-history-eye.png'});console.log(JSON.stringify(result,null,2));await b.close();if(Object.values(assertions).includes(false)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
