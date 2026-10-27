'use strict';
const {keyOf}=require('./keyboard-keys');
function picker(s,e){
 if(!s.drawing||e.target?.closest?.('input,textarea,select,[contenteditable=true],.modal'))return false;
 const key=keyOf(e),q=s.plugin.settings.shortcuts;
 const action=key===q.brush?()=>s.toggleBrushPie():key===q.eraser?()=>s.toggleEraserPie():null;
 if(!action)return false;e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)action();return true;
}
module.exports={picker};
