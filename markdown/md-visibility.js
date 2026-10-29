'use strict';
const {setIcon,Notice}=require('obsidian');
class MdVisibility{
 constructor(s){this.s=s;this.group=s.element('div','mdt-visibility',s.mdUi);this.button=s.button(this.group,'eye','MD 필기 숨기기',()=>this.toggle());this.button.dataset.tooltipPosition='left';this.apply();}
 hidden(){return !this.s.drawing&&this.s.owner.data.notes[this.s.file.path]?.inkHidden===true;}
 toggle(){const s=this.s;if(s.drawing||!s.ready)return;const meta=s.owner.data.notes[s.file.path];meta.inkHidden=!meta.inkHidden;for(const other of s.owner.sessions.values())if(other.file.path===s.file.path){other.visibility?.apply();other.scheduleRender();}s.owner.persist().catch(e=>new Notice('필기 표시 설정 저장 실패: '+e.message));}
 apply(){const s=this.s,hidden=this.hidden();s.host.classList.toggle('cdt-artwork-hidden',hidden);this.group.hidden=s.drawing;const label=hidden?'MD 필기 표시':'MD 필기 숨기기';this.button.title=label;this.button.setAttribute('aria-label',label);this.button.setAttribute('aria-pressed',String(!hidden));setIcon(this.button,hidden?'eye-off':'eye');}
 destroy(){this.group.remove();this.s.host.classList.remove('cdt-artwork-hidden');}
}
module.exports={MdVisibility};
