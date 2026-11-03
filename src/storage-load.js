'use strict';
const {decode}=require('./storage');
const pending=new WeakMap();
// Only disk reads are asynchronous. Use the same checksum/schema validation,
// and share one in-flight load so two views cannot create different records.
function loadAsync(store,id,sourcePath,expected=false){
 if(store.closed)return Promise.reject(Error('저장 종료 처리'));
 if(store.records.has(id))return Promise.resolve(store.records.get(id));
 let jobs=pending.get(store);if(!jobs)pending.set(store,jobs=new Map());
 if(jobs.has(id))return jobs.get(id);
 const file=store.file(id),io=store.io.promises||require('node:fs').promises;
 const read=async path=>{try{return await io.readFile(path,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
 const work=(async()=>{let raw=await read(file);if(raw===null)raw=await read(file+'.pending');
  if(store.closed)throw Error('저장 종료 처리');
  if(store.records.has(id))return store.records.get(id);
  if(raw===null&&expected)throw Error('연결된 그림 파일을 찾을 수 없습니다. 원본 연결을 유지합니다.');
  const data=raw===null?{format:'canvas-drawing',version:1,id,revision:0,sourcePath,strokes:[]}:decode(raw,id);
  const record={data,dirty:false,error:null,undo:[],redo:[]};store.records.set(id,record);return record;
 })();jobs.set(id,work);work.then(()=>jobs.delete(id),()=>jobs.delete(id));return work;
}
module.exports={loadAsync};
