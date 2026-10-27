'use strict';
const {Setting}=require('obsidian');
function size(q){const n=Number(q.pieSize??q.toolPieSize??430);return Number.isFinite(n)?Math.max(240,Math.min(720,n)):430;}
function fit(s){const r=s.host.getBoundingClientRect();return Math.max(160,Math.min(size(s.plugin.settings),r.width-32,r.height-155));}
function settings(plugin,host){host.createEl('h2',{text:'파이 메뉴'});
 new Setting(host).setName('파이 메뉴 크기').setDesc('브러시·지우개·지정 도구·색상·상세 설정에 같은 지름을 적용합니다. MD와 Canvas 공통이며, 화면이 좁으면 함께 줄어듭니다.').addSlider(slider=>{slider.setLimits(240,720,10).setValue(size(plugin.settings)).setDynamicTooltip();slider.sliderEl.setAttribute('aria-label','파이 메뉴 크기');slider.onChange(value=>{plugin.settings.pieSize=value;plugin.saveData(plugin.settings);});});
 for(const [key,name]of [['brush','브러시 파이 메뉴 테마'],['tool','도구 파이 메뉴 테마'],['eraser','지우개 파이 메뉴 테마'],['color','색상 파이 메뉴 테마'],['details','상세 설정 파이 메뉴 테마']])new Setting(host).setName(name).addDropdown(d=>{d.addOptions({auto:'테마 따라가기',light:'화이트 고정',dark:'블랙 고정'}).setValue(plugin.settings.pieThemes?.[key]||'auto');d.selectEl.setAttribute('aria-label',name);d.onChange(value=>{plugin.settings.pieThemes??={};plugin.settings.pieThemes[key]=value;plugin.saveData(plugin.settings);});});
 host.createEl('p',{text:'브러시: B · 지우개: E · 지정 도구: Ctrl+Alt+Q · 색상: Ctrl+Alt+C · 상세 설정: Ctrl+Alt+B. 테마는 각 메뉴마다 따로 선택합니다.',cls:'setting-item-description'});
}
module.exports={settings,size,fit};
