'use strict';
const {DrawingStore}=require('./storage');
const {snapshot}=require('./history-state');
const fs=require('node:fs');
const workerCode='__CDT_STORAGE_WORKER__';
class AsyncDrawingStore extends DrawingStore{
 constructor(root){super(root);this.jobs=new Map();this.nextJob=0;this.closed=false;this.generation=0;this.sequence=Promise.resolve();this.workerUrl=URL.createObjectURL(new Blob([workerCode],{type:'text/javascript'}));this.startWorker();}
 startWorker(){this.workerFault=false;this.worker=new Worker(this.workerUrl);this.worker.onmessage=e=>{const j=this.jobs.get(e.data.id);if(j){this.jobs.delete(e.data.id);e.data.error?j.reject(Error(e.data.error)):j.resolve(e.data);}};this.worker.onerror=e=>{e.preventDefault?.();this.workerFault=true;this.worker.terminate();for(const j of this.jobs.values())j.reject(Error(e.message));this.jobs.clear();};}
 prepare(data,previousRaw){return new Promise((resolve,reject)=>{if(this.closed){reject(Error('저장 종료 처리'));return;}if(this.workerFault)this.startWorker();const id=++this.nextJob;this.jobs.set(id,{resolve,reject});try{this.worker.postMessage({id,data,previousRaw});}catch(e){this.jobs.delete(id);reject(e);}});}
 flush(record){if(this.closed)return Promise.resolve(super.flush(record));if(record.saving)return record.saving;if(!record.dirty)return Promise.resolve(true);
  const data={...record.data,...snapshot(record.data)},generation=this.generation;
  const job=this.sequence.catch(()=>{}).then(()=>this.save(record,data,generation));this.sequence=job;
  record.saving=job.then(ok=>{record.saving=null;if((ok||generation!==this.generation)&&record.dirty&&!this.closed)return this.flush(record);return ok;});return record.saving;
 }
 async save(record,data,generation){if(this.closed||generation!==this.generation)return false;const target=this.file(data.id),read=async file=>{try{return await fs.promises.readFile(file,'utf8')}catch(e){if(e.code==='ENOENT')return null;throw e;}};
  try{await fs.promises.mkdir(this.root,{recursive:true});const previousRaw=await read(target);const result=await this.prepare(data,previousRaw);if(this.closed||generation!==this.generation)return false;
   if(await read(target)!==previousRaw)throw Error('저장 중 외부 변경을 발견했습니다. 원본을 보호합니다.');
   if(previousRaw){if(result.previousVersion<data.version){const backup=target+'.v'+result.previousVersion+'.bak';if(await read(backup)===null)await this.atomicAsync(backup,previousRaw,undefined,generation);}await this.atomicAsync(target+'.bak',previousRaw,undefined,generation);}
   await this.atomicAsync(target,result.raw,previousRaw,generation);if(this.closed||generation!==this.generation)return false;this.writeCount++;record.error=null;if(record.data.revision===data.revision)record.dirty=false;return true;
  }catch(e){if(!this.closed&&generation===this.generation)record.error=e.message;return false;}
 }
 async atomicAsync(target,raw,expected,generation=this.generation){const temporary=target+'.async-'+(++this.nextJob)+'.pending';let fd;try{fd=await fs.promises.open(temporary,'w');await fd.writeFile(raw,'utf8');await fd.sync();await fd.close();fd=null;if(!this.closed&&generation===this.generation){if(expected!==undefined){let current=null;try{current=fs.readFileSync(target,'utf8')}catch(e){if(e.code!=='ENOENT')throw e;}if(current!==expected)throw Error('저장 직전 외부 변경을 발견했습니다. 원본을 보호합니다.');}fs.renameSync(temporary,target);}}finally{if(fd)await fd.close();try{await fs.promises.unlink(temporary)}catch(e){if(e.code!=='ENOENT')throw e;}}}
 async flushAll(){return (await Promise.all([...this.records.values()].map(r=>this.flush(r)))).every(Boolean);}
 checkpoint(){this.generation++;let ok=true;for(const r of this.records.values())ok=super.flush(r)&&ok;return ok;}
 close(){this.closed=true;this.generation++;this.worker.terminate();URL.revokeObjectURL(this.workerUrl);for(const j of this.jobs.values())j.reject(Error('저장 종료 처리'));this.jobs.clear();let ok=true;for(const r of this.records.values())ok=super.flush(r)&&ok;return ok;}
}
module.exports={AsyncDrawingStore};
