'use strict';
const {setIcon}=require('obsidian');
class CanvasVisibility{
 constructor(s){this.s=s;const controls=s.host.querySelector('.canvas-controls');if(!controls)return;this.group=s.element('div','canvas-control-group mod-raised cdt-visibility-control',controls);this.button=s.button(this.group,'eye','드로잉 숨기기',()=>this.toggle());this.button.classList.add('canvas-control-item');this.button.dataset.tooltipPosition='left';this.apply();}
 hidden(){return !!this.s.plugin.settings.hiddenCanvasDrawings?.[this.s.record.data.id];}
 toggle(){const s=this.s;if(s.drawing)return;const q=s.plugin.settings;q.hiddenCanvasDrawings??={};if(this.hidden())delete q.hiddenCanvasDrawings[s.record.data.id];else q.hiddenCanvasDrawings[s.record.data.id]=true;for(const session of s.plugin.sessions.values())session.visibility?.apply();s.plugin.saveData(q);}
 apply(){const s=this.s,hidden=!s.drawing&&this.hidden();s.host.classList.toggle('cdt-artwork-hidden',hidden);if(!this.button)return;this.group.hidden=s.drawing;const label=hidden?'드로잉 표시':'드로잉 숨기기';this.button.title=label;this.button.setAttribute('aria-label',label);this.button.setAttribute('aria-pressed',String(!hidden));setIcon(this.button,hidden?'eye-off':'eye');}
 destroy(){this.group?.remove();this.s.host.classList.remove('cdt-artwork-hidden');}
}
module.exports={CanvasVisibility};
