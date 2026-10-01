const fs = require('fs');
const path = require('path');
const vault = 'C:/Users/tlatn/AppData/Local/Temp/CanvasDrawingSandbox-20260927';
const canvasPath = path.join(vault, 'Large-PoC.canvas');
const dataPath = path.join(vault, 'Large-PoC.canvas.drawing-poc.json');
if (fs.existsSync(canvasPath) || fs.existsSync(dataPath)) throw new Error('Large fixture already exists');

const nodes = [];
for (let row = 0; row < 10; row++) {
  for (let col = 0; col < 15; col++) {
    nodes.push({id:`card-${row}-${col}`,type:'text',text:`Performance card ${row + 1}-${col + 1}`,x:col*360,y:row*240,width:300,height:180});
  }
}
nodes.push({id:'image',type:'file',file:'Test image.svg',x:5400,y:0,width:300,height:200});
const strokes=[];
for(let i=0;i<1500;i++){
  const x=(i*113)%5550;
  const y=(i*71)%2400;
  const points=[];
  for(let j=0;j<12;j++)points.push([x+j*8,y+Math.sin(j/2+i)*13]);
  strokes.push(points);
}
fs.writeFileSync(canvasPath,JSON.stringify({nodes,edges:[]}));
fs.writeFileSync(dataPath,JSON.stringify({version:1,strokes}));
console.log(JSON.stringify({canvasPath,nodeCount:nodes.length,dataPath,strokeCount:strokes.length,canvasBytes:fs.statSync(canvasPath).size,drawingBytes:fs.statSync(dataPath).size},null,2));
