'use strict';
function watch(s,root,key){const apply=()=>{const mode=s.plugin.settings.pieThemes?.[key]||'auto';const theme=mode==='auto'?(s.doc.body.classList.contains('theme-dark')?'dark':'light'):mode;if(root.dataset.pieTheme!==theme){root.dataset.pieTheme=theme;root.dispatchEvent(new s.win.CustomEvent('cdt-pie-theme'));}};apply();const observer=new s.win.MutationObserver(apply);observer.observe(s.doc.body,{attributes:true,attributeFilter:['class']});return()=>observer.disconnect();}
function closeOthers(s,except){for(const pie of [s.quickTools?.pie,s.brushPie,s.eraserPie,s.detailPie,s.colorUI?.pie])if(pie&&pie!==except)pie.close();}
module.exports={watch,closeOthers};
