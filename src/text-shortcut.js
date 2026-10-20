'use strict';
const {keyOf}=require('./keyboard-keys');
function ensure(q){q.shortcuts??={};if(q.shortcuts.text===undefined){const used=[...Object.values(q.shortcuts),...(q.presets||[]).map(p=>p.shortcut),...Object.values(q.toolShortcuts||{})];q.shortcuts.text=used.includes('T')?'':'T';}}
function handle(s,e){const key=s.plugin.settings.shortcuts.text;
 if(!key||!s.ready||s.disposed||!s.isActive()||s.view.file!==s.file||e.isComposing||e.keyCode===229||keyOf(e)!==key)return false;
 if(e.target?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),.modal,.search-input-container')||s.doc.activeElement?.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"]),.modal'))return false;
 e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)s.textItems.activate();return true;
}
module.exports={ensure,handle};
