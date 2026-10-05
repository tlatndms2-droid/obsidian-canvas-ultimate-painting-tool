'use strict';
const {keyOf,keyFor}=require('./tool-shortcuts');
class ToolShift {
 constructor(s){this.s=s;}
 down(e){const s=this.s;if(!s.drawing)return false;const key=keyOf(e),q=s.plugin.settings;if(!key)return false;
 let run;const entry=s.quickTools.entries().find(v=>keyFor(q,v.id)===key);
 if(entry&&!Object.values(q.shortcuts).includes(key))run=()=>s.quickTools.choose(entry.id);
 else if(key===q.shortcuts.brush||key===q.shortcuts.eraser)run=()=>s.selectTool(key===q.shortcuts.brush?'brush':'eraser');
 else if(key===q.shortcuts.move)run=()=>s.selectTool('move-layer');
 else if(key===q.shortcuts.shape)run=()=>s.selectTool('shape');
 else if(key===q.shortcuts.selection)run=()=>{q.selectionMethod=s.tool==='rectangle'?'lasso':s.tool==='lasso'?'rectangle':q.selectionMethod; s.selectTool(q.selectionMethod);};
 if(!run)return false;e.preventDefault();e.stopImmediatePropagation();if(e.repeat||this.held)return true;
 this.held={temporary:key===q.shortcuts.move,code:e.code,time:Date.now(),tool:s.tool,brush:q.selectedBrush,eraser:q.selectedEraser,shape:q.shapeStyle.kind,shapeId:q.selectedShape,shapeStyle:{...q.shapeStyle},quick:s.quickTools.opened};run();this.held.time=Date.now();return true;}
 up(e){if(e.code!==this.held?.code)return;const h=this.held;this.held=null;if(Date.now()-h.time<200&&!h.temporary)return;this.restore(h);}
 restore(h=this.held){this.held=null;if(!h)return;const s=this.s,q=s.plugin.settings;s.finishStroke();s.figures.confirm();q.selectedBrush=h.brush;q.selectedEraser=h.eraser;q.selectedShape=h.shapeId;q.shapeStyle={...h.shapeStyle};s.selectTool(h.tool);s.quickTools.opened=h.quick;s.quickTools.render();s.workspaceUI.applyLayout();}
}
module.exports={ToolShift};



