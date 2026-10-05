const {test}=require('node:test'),assert=require('node:assert/strict');
const {hsvToHex,hexToHsv}=require('../src/color');
test('Color ring and SV conversions preserve RGB including gray/black and wrap hue',()=>{
 for(const c of ['#ff0000','#00ff00','#0000ff','#ffffff','#000000','#888888','#9bbb99','#586878'])assert.equal(hsvToHex(...hexToHsv(c)),c);
 assert.equal(hsvToHex(360,1,1),'#ff0000');assert.equal(hsvToHex(-120,1,1),'#0000ff');
});
