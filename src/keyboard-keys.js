'use strict';
// Store physical key codes, retaining existing letter/digit shortcut names.
const validKey=k=>typeof k==='string'&&k.length<160&&/^(Ctrl\+)?(Alt\+)?(Shift\+)?(Meta\+)?[A-Za-z0-9][A-Za-z0-9_-]*$/.test(k);
function keyOf(e){let code=e.code||e.key;if(!code||['Unidentified','Dead','Process'].includes(code))return '';code=code.replace(/^Key(?=[A-Z]$)|^Digit(?=[0-9]$)/,'');return [e.ctrlKey&&!/^Control/.test(code)?'Ctrl':'',e.altKey&&!/^Alt/.test(code)?'Alt':'',e.shiftKey&&!/^Shift/.test(code)?'Shift':'',e.metaKey&&!/^Meta/.test(code)?'Meta':'',code].filter(Boolean).join('+');}
module.exports={validKey,keyOf};
