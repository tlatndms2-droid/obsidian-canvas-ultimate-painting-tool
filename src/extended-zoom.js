'use strict';
// Canvas 1.13 clamps its native viewport animation to 200%. Above that range,
// update the same viewport fields/transform and let Canvas render its nodes.
// No global Math patch, screenshot mode, or separate Drawing coordinate system.
const MAX_ZOOM=4; // 1600%; both modes use the same viewport.
function install(s){
 const c=s.canvas,original=c.requestFrame,owned=Object.prototype.hasOwnProperty.call(c,'requestFrame');
 function requestFrame(...args){
  if(!c.screenshotting&&c.viewportChanged&&c.tZoom>1){
   const z=Math.min(MAX_ZOOM,c.tZoom),scale=2**z,oldScale=c.scale||2**c.zoom;
   let x=c.tx,y=c.ty;
   if(c.zoomCenter){x=c.x+c.zoomCenter.x/oldScale-c.zoomCenter.x/scale;y=c.y+c.zoomCenter.y/oldScale-c.zoomCenter.y/scale;}
   c.x=c.tx=x;c.y=c.ty=y;c.zoom=c.tZoom=z;c.scale=scale;
   const {width,height}=c.canvasRect;
   c.canvasEl.style.transform=`translate(${width/2}px, ${height/2}px) scale(${scale}) translate(${-x}px, ${-y}px)`;
   const spacing=c.gridSpacing;
   c.backgroundPatternEl.setAttrs({x:String(width/2-x%spacing*scale),y:String(height/2-y%spacing*scale),width:String(spacing*scale),height:String(spacing*scale)});
   c.wrapperEl.removeClass('mod-zoomed-out','mod-animating');
   c.wrapperEl.setCssProps({'--zoom-multiplier':String(Math.sqrt(1/scale))});
   c.finishViewportAnimation=false;c.wasAnimating=false;c.viewportChanged=false;
   c.menu.render();c.app.workspace.requestSaveLayout();s.scheduleRender();
  }
  return original.apply(c,args);
 }
 c.requestFrame=requestFrame;
 return ()=>{if(c.requestFrame===requestFrame){if(owned)c.requestFrame=original;else delete c.requestFrame;}};
}
module.exports={install,MAX_ZOOM};
