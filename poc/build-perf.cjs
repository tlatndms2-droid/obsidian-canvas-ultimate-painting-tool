const fs=require('fs');
fs.writeFileSync('poc/perf-plugin/main.js',fs.readFileSync('poc/perf-plugin/prefix.js','utf8')+fs.readFileSync('poc/perf-plugin/lab.js','utf8'));
