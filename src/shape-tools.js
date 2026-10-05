'use strict';
const names={line:'선',rectangle:'사각형',ellipse:'타원','arrow-angle':'꺾인 화살표','arrow-curve':'곡선 화살표'};
function ensure(q){q.shapeTools??=Object.entries(names).map(([id,name])=>({id,name,style:{...q.shapeStyle,kind:id}}));if(!q.shapeTools.some(t=>t.id===q.selectedShape))q.selectedShape=q.shapeStyle?.kind||'rectangle';return q.shapeTools;}
function choose(s,id){const q=s.plugin.settings,all=ensure(q),t=all.find(t=>t.id===id);if(!t)return;s.figures.confirm();const old=all.find(t=>t.id===q.selectedShape);if(old)old.style={...q.shapeStyle};q.selectedShape=id;q.shapeStyle={...t.style};s.selectTool('shape');s.plugin.saveData(q);}
function remember(q){const t=ensure(q).find(t=>t.id===q.selectedShape);if(t)t.style={...q.shapeStyle};}
function duplicate(s,id){const q=s.plugin.settings;remember(q);const t=ensure(q).find(t=>t.id===id);if(!t)return;const copy={id:require('./storage').randomUUID(),name:t.name+' 복사',style:JSON.parse(JSON.stringify(t.style))};q.shapeTools.splice(q.shapeTools.indexOf(t)+1,0,copy);q.shapeOrder??=[];const at=q.shapeOrder.indexOf(id);q.shapeOrder.splice(at<0?q.shapeOrder.length:at+1,0,copy.id);choose(s,copy.id);}
module.exports={names,ensure,choose,remember,duplicate};
