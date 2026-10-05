'use strict';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function hsvToHex(h,s,v){h=((h%360)+360)%360;const c=v*s,x=c*(1-Math.abs(h/60%2-1)),m=v-c,rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return '#'+rgb.map(n=>Math.round(clamp(n+m)*255).toString(16).padStart(2,'0')).join('');}
function hexToHsv(hex){const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),v=Math.max(r,g,b),m=Math.min(r,g,b),d=v-m;let h=!d?0:v===r?60*((g-b)/d%6):v===g?60*((b-r)/d+2):60*((r-g)/d+4);return[(h+360)%360,v?d/v:0,v];}
module.exports={clamp,hsvToHex,hexToHsv};
