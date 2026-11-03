'use strict';
// Intercept the application's and active Canvas's hotkey scopes in place.
// This survives Obsidian replacing the active scope when switching tabs.
class DrawingKeyboard{
 constructor(plugin){this.plugin=plugin;this.handled=new WeakSet();this.scopes=new Map();this.wrap(plugin.app.scope);}
 activeSession(){const leaf=this.plugin.app.workspace.activeLeaf;return this.plugin.sessions.get(leaf)||this.plugin.markdown?.sessions.get(leaf);}
 session(){const s=this.activeSession();return s?.drawing&&s.ready&&!s.disposed?s:null;}
 wrap(scope){if(!scope||this.scopes.has(scope))return;const old=scope.handleKey,owner=this;const wrapped=function(event,...args){const s=owner.activeSession();if(!s?.drawing&&s?.ready&&[owner.plugin.settings.shortcuts.drawing].includes(require('./keyboard-keys').keyOf(event))&&!event.target?.closest?.('input,textarea,select,[contenteditable=true],.modal')){owner.handled.add(event);s.keyDown(event,true);return false;}if(owner.session())return owner.route(event);return old.call(this,event,...args)};this.scopes.set(scope,{old,wrapped});scope.handleKey=wrapped;}
 update(){for(const s of [...this.plugin.sessions.values(),...(this.plugin.markdown?.sessions.values()||[])])this.wrap(s.leaf?.view?.scope||s.view.scope);}
 route(e){const s=this.session();if(!s)return;if(this.handled.has(e))return false;this.handled.add(e);
 if(e.key==='Escape'&&s.layerUI?.penDragCancel){s.layerUI.penDragCancel();e.preventDefault();e.stopImmediatePropagation();return false;}
 if(require('./pie-input').picker(s,e))return false;
 // A popup owns its close shortcut even while its number/HEX field has focus.
 // Other dialogs retain the existing input and shortcut-capture protection.
 for(const pie of [s.detailPie,s.brushPie,s.eraserPie,s.quickTools?.pie,s.colorUI?.pie]){
  if(pie?.root?.contains(e.target)&&pie.key(e))return false;
 }
 if(s.cm&&mdUndo(s,e))return false;
 const input=e.target?.closest?.('input,textarea,select,[contenteditable=true]'),modal=e.target?.closest?.('.modal');
 if(input?.getAttribute('aria-label')==='단축키 입력')return true;
 if(input||modal){const edit=(e.ctrlKey||e.metaKey)&&!e.altKey&&['KeyA','KeyC','KeyV','KeyX','KeyZ','KeyY'].includes(e.code);if(edit||(!e.ctrlKey&&!e.metaKey&&!e.altKey))return true;e.preventDefault();return false;}
 if(s.cm&&mdCommand(s,e))return false;
 s.keyDown(e,true);
 e.preventDefault();return false;
 }
 destroy(){for(const[scope,{old,wrapped}]of this.scopes)if(scope.handleKey===wrapped)scope.handleKey=old;this.scopes.clear();}
}
function mdUndo(s,e){if(!s.drawing||!(e.ctrlKey||e.metaKey)||e.altKey||!(e.code==='KeyZ'||e.key?.toLowerCase()==='z'))return false;const field=e.target?.closest?.('input,textarea,select,[contenteditable=true],.modal');if(field&&!s.cm.contentDOM?.contains(field))return false;s.undoDrawing(!!e.shiftKey);e.preventDefault();e.stopImmediatePropagation();return true;}
function mdCommand(s,e){const owner=s.owner,app=owner?.app;if(!app?.hotkeyManager||!app.commands)return false;const prefix=owner.manifest.id+':'+(owner.integratedDrawing?'md-':'');const eventKey=require('./keyboard-keys').keyOf(e);for(const name of ['toggle-ink','toggle-brush-pie','toggle-eraser-pie','toggle-brush-details','toggle-color-pie','toggle-pie','toggle-navigator']){const id=prefix+name,keys=app.hotkeyManager.getHotkeys(id)??app.hotkeyManager.getDefaultHotkeys(id)??[];for(const hotkey of keys){const modifiers=hotkey.modifiers.map(m=>m==='Mod'?(process.platform==='darwin'?'Meta':'Ctrl'):m),key=['Ctrl','Alt','Shift','Meta'].filter(m=>modifiers.includes(m)).concat(hotkey.key.length===1?hotkey.key.toUpperCase():hotkey.key).join('+');if(key===eventKey){if(!e.repeat)app.commands.executeCommandById(id);e.preventDefault();e.stopImmediatePropagation();return true;}}}return false;}
module.exports={DrawingKeyboard,mdUndo,mdCommand};
