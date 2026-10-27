'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist-markdown');
fs.mkdirSync(out,{recursive:true});
require('esbuild').buildSync({absWorkingDir:root,entryPoints:['markdown/main.js'],bundle:true,platform:'node',format:'cjs',external:['obsidian','@codemirror/view','@electron/remote'],outfile:path.join(out,'main.js')});
for(const name of ['manifest.json','styles.css'])fs.copyFileSync(path.join(root,'markdown',name),path.join(out,name));
console.log('Built Markdown addon '+JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))).version);
