'use strict';
class CursorInput {
 constructor(){this.reset();}
 reset(){this.penTime=-Infinity;this.mouse=null;this.lastEvent=null;}
 accept(e,now){
  if(e===this.lastEvent)return this.lastResult;
  const done=result=>{this.lastEvent=e;this.lastResult=result;return result;};
  if(e.pointerType==='pen'){this.penTime=now;this.mouse=null;return done(true);}
  if(e.pointerType!=='mouse')return done(false);
  // An explicit mouse action takes ownership immediately. Hover needs movement,
  // rather than the stationary mouse coordinates interleaved by tablet input.
  if(e.buttons||e.type==='pointerdown'){this.penTime=-Infinity;this.mouse=null;return done(true);}
  if(now-this.penTime>750)return done(true);
  const previous=this.mouse;this.mouse={x:e.clientX,y:e.clientY};
  if(previous&&Math.hypot(previous.x-e.clientX,previous.y-e.clientY)>=1){this.penTime=-Infinity;return done(true);}
  return done(false);
 }
}
module.exports={CursorInput};
