const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const b=await chromium.connectOverCDP('http://127.0.0.1:9287');
 const p=b.contexts()[0].pages().find(p=>p.url().startsWith('app://'));
 const result=await p.evaluate(()=>{
  const c=document.createElement('canvas');c.width=c.height=12;
  const x=c.getContext('2d');x.fillStyle='#ff0000';x.fillRect(0,0,12,12);
  x.globalCompositeOperation='destination-out';x.fillRect(0,0,4,4);
  const erased=x.getImageData(1,1,1,1).data[3]===0;
  const preserved=x.getImageData(8,8,1,1).data[3]===255;
  x.globalCompositeOperation='source-over';x.save();x.beginPath();x.rect(4,4,4,4);x.clip();x.fillStyle='#0000ff';x.fillRect(0,0,12,12);x.restore();
  const clipped=x.getImageData(5,5,1,1).data[2]===255&&x.getImageData(10,10,1,1).data[0]===255;
  return {title:document.title,eraserPrimitive:erased&&preserved,regionMaskPrimitive:clipped,EyeDropper:typeof window.EyeDropper,secureContext:window.isSecureContext,pressureProperty:'pressure' in PointerEvent.prototype,tiltProperty:'tiltX' in PointerEvent.prototype,note:'Detached 12x12 canvas only. No vault writes. Primitive tests are not product UI verification. EyeDropper selection and physical pen not tested.'};
 });
 fs.writeFileSync('planning/capability-evidence.json',JSON.stringify(result,null,2));console.log(result);await b.close();
})().catch(e=>{console.error(e);process.exitCode=1});
