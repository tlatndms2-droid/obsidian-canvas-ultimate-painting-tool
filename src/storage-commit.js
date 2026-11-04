'use strict';
// Electron's renderer Node platform cannot create worker_threads directly.
// Construct the worker in the main process; only final file commits run there.
const workerSource=`
const {parentPort,workerData}=require('node:worker_threads'),fs=require('node:fs');
const gate=new Int32Array(workerData);
parentPort.on('message',job=>{
 let locked=false;
 try{
  while(Atomics.compareExchange(gate,1,0,1)!==0)Atomics.wait(gate,1,1);
  locked=true;
  if(Atomics.load(gate,0)!==job.epoch){parentPort.postMessage({id:job.id,cancelled:true});return;}
  if(job.expected!==undefined){let raw=null;try{raw=fs.readFileSync(job.target,'utf8')}catch(e){if(e.code!=='ENOENT')throw e;}
   if(raw!==job.expected)throw Error('저장 직전 외부 변경을 발견했습니다. 원본을 보호합니다.');}
  fs.renameSync(job.temporary,job.target);
  parentPort.postMessage({id:job.id});
 }catch(e){parentPort.postMessage({id:job.id,error:e.message});}
 finally{if(locked){Atomics.store(gate,1,0);Atomics.notify(gate,1);}}
});`;
function createCommitter(epoch=0){
 const remote=require('@electron/remote');
 const create=remote.require('node:vm').compileFunction(`
 const {Worker}=threads;
 const shared=new SharedArrayBuffer(8),gate=new Int32Array(shared);Atomics.store(gate,0,initialEpoch);
 const worker=new Worker(source,{eval:true,workerData:shared});
 let next=0,dead=false;const jobs=new Map();
 worker.on('message',m=>{const job=jobs.get(m.id);if(!job)return;jobs.delete(m.id);m.error?job.reject(Error(m.error)):job.resolve(!m.cancelled);});
 const fail=e=>{dead=true;for(const job of jobs.values())job.reject(e);jobs.clear();};
 worker.on('error',fail);worker.on('exit',()=>fail(Error('파일 작업 Worker가 종료되었습니다.')));
 function invalidate(){while(Atomics.compareExchange(gate,1,0,1)!==0)Atomics.wait(gate,1,1);try{return Atomics.add(gate,0,1)+1;}finally{Atomics.store(gate,1,0);Atomics.notify(gate,1);}}
 return {
  commit(temporary,target,expected,epoch){return new Promise((resolve,reject)=>{if(dead)return reject(Error('파일 작업 Worker를 사용할 수 없습니다.'));const id=++next;jobs.set(id,{resolve,reject});try{worker.postMessage({id,temporary,target,expected,epoch});}catch(e){jobs.delete(id);reject(e);}});},
  invalidate,
  close(){invalidate();worker.terminate();}
 };
 `,['threads','source','initialEpoch']);
 return create(remote.require('node:worker_threads'),workerSource,epoch);
}
module.exports={createCommitter};


