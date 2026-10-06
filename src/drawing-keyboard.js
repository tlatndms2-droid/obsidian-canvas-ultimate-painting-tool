'use strict';
// Intercept the application's and active Canvas's hotkey scopes in place.
// This survives Obsidian replacing the active scope when switching tabs.
class DrawingKeyboard{
 constructor(plugin){this.plugin=plugin;this.handled=new WeakSet();this.scopes=new Map();this.wrap(plugin.app.scope);}
 session(){const s=this.plugin.sessions.get(this.plugin.app.workspace.activeLeaf);return s?.drawing&&s.ready&&!s.disposed?s:null;}
 wrap(scope){if(!scope||this.scopes.has(scope))return;const old=scope.handleKey,owner=this;const wrapped=function(event,...args){const s=owner.plugin.sessions.get(owner.plugin.app.workspace.activeLeaf);if(!s?.drawing&&s?.ready&&require('./keyboard-keys').keyOf(event)===owner.plugin.settings.shortcuts.drawing&&!event.target?.closest?.('input,textarea,select,[contenteditable=true],.modal')){owner.handled.add(event);s.keyDown(event,true);return false;}if(owner.session())return owner.route(event);return old.call(this,event,...args)};this.scopes.set(scope,{old,wrapped});scope.handleKey=wrapped;}
 update(){for(const s of this.plugin.sessions.values())this.wrap(s.view.scope);}
 route(e){const s=this.session();if(!s)return;if(this.handled.has(e))return false;this.handled.add(e);
 const input=e.target?.closest?.('input,textarea,select,[contenteditable=true]'),modal=e.target?.closest?.('.modal');
 if(input?.getAttribute('aria-label')==='단축키 입력')return true;
 if(input||modal){const edit=(e.ctrlKey||e.metaKey)&&!e.altKey&&['KeyA','KeyC','KeyV','KeyX','KeyZ','KeyY'].includes(e.code);if(edit||(!e.ctrlKey&&!e.metaKey&&!e.altKey))return true;e.preventDefault();return false;}
 s.keyDown(e,true);
 e.preventDefault();return false;
 }
 destroy(){for(const[scope,{old,wrapped}]of this.scopes)if(scope.handleKey===wrapped)scope.handleKey=old;this.scopes.clear();}
}
module.exports={DrawingKeyboard};
