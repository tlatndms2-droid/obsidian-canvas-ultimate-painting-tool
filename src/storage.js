'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash, randomUUID} = require('node:crypto');
const {validAsset}=require('./materials');
const FORMAT = 'canvas-drawing';
const validId = id => typeof id === 'string' && /^[a-f0-9-]{36}$/.test(id);
const digest = value => createHash('sha256').update(value).digest('hex');

function validate(data, id) {
  if (!data || data.format !== FORMAT || ![1,2,3,4,5,6,7,8,9,10].includes(data.version) || data.id !== id || !validId(id)) throw Error('지원하지 않는 그림 형식입니다. 원본을 보호합니다.');
  if (!Number.isSafeInteger(data.revision) || data.revision < 0 || typeof data.sourcePath !== 'string' || !Array.isArray(data.strokes)) throw Error('손상된 그림 데이터입니다. 원본을 보호합니다.');
  if(data.version>=4){
    const blends=['source-over','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'];
    if(!Array.isArray(data.layers)||!Array.isArray(data.selectedLayers))throw Error('손상된 레이어입니다. 원본을 보호합니다.');
    const ids=new Set(data.layers.map(l=>l.id));if(ids.size!==data.layers.length)throw Error('중복 레이어입니다. 원본을 보호합니다.');
    for(const l of data.layers){if(!validId(l.id)||typeof l.name!=='string'||!['layer','group'].includes(l.type)||!['visible','locked','alphaLock','clip','expanded'].every(k=>typeof l[k]==='boolean')||!Number.isFinite(l.opacity)||l.opacity<0||l.opacity>1||!blends.includes(l.blend)||!Array.isArray(l.tiles)||l.tiles.some(t=>!Number.isInteger(t.x)||!Number.isInteger(t.y)||typeof t.png!=='string'||!t.png.startsWith('data:image/png;base64,')))throw Error('손상된 레이어 속성입니다. 원본을 보호합니다.');
      if(l.offset&&(!Number.isFinite(l.offset.x)||!Number.isFinite(l.offset.y)))throw Error('손상된 레이어 위치입니다. 원본을 보호합니다.');
      if(l.anchor&&(typeof l.anchor.targetId!=='string'||!l.anchor.targetId||![l.anchor.x,l.anchor.y,l.anchor.width,l.anchor.height].every(Number.isFinite)))throw Error('손상된 그림 연결입니다. 원본을 보호합니다.');
      const seen=new Set([l.id]);let parent=l.parent;while(parent){const p=data.layers.find(n=>n.id===parent);if(!p||p.type!=='group'||seen.has(parent))throw Error('잘못된 레이어 그룹입니다. 원본을 보호합니다.');seen.add(parent);parent=p.parent;}
    }
    if(data.selectedLayers.some(id=>!ids.has(id))||data.strokes.some(s=>!data.layers.some(l=>l.id===s.layerId&&l.type==='layer')))throw Error('잘못된 레이어 연결입니다. 원본을 보호합니다.');
  }
  if(data.paper){const p=data.paper;if(typeof p.enabled!=='boolean'||!['plain','fine','rough','watercolor','kraft','custom'].includes(p.preset)||!/^#[0-9a-f]{6}$/i.test(p.color)||!Number.isFinite(p.strength)||p.strength<0||p.strength>100||!Number.isFinite(p.size)||p.size<25||p.size>400||typeof p.image!=='string'||p.image&&!p.image.startsWith('data:image/png;base64,'))throw Error('손상된 배경 용지 설정입니다. 원본을 보호합니다.');}
  if(data.version>=7&&(!data.assets||Object.entries(data.assets).some(([id,a])=>!validAsset(a)||id!==a.id)))throw Error('손상된 소재입니다. 원본을 보호합니다.');
  for (const s of data.strokes) {
    if(s?.selectionClip!==undefined&&(data.version<9||!Array.isArray(s.selectionClip)||!s.selectionClip.length||s.selectionClip.some(r=>!r||!['add','subtract'].includes(r.op)||!Array.isArray(r.points)||r.points.length<3||r.points.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))))throw Error('손상된 선택 범위입니다. 원본을 보호합니다.');
    if(data.version>=7&&s&&((s.tips||[]).some(id=>!data.assets[id]||data.assets[id].kind!=='tip')||(s.textureAsset&&data.assets[s.textureAsset]?.kind!=='texture')))throw Error('소재 연결이 손상되었습니다.');
    if (!s || typeof s.id !== 'string' || typeof s.color !== 'string' || !Number.isFinite(s.size) || s.size <= 0 || !Array.isArray(s.points) || !s.points.length) throw Error('손상된 획입니다. 원본을 보호합니다.');
    if (s.tool && (![2,3,4,5,6,7,8,9,10].includes(data.version) || !['brush','eraser'].includes(s.tool) || !/^#[0-9a-f]{6}$/i.test(s.color) || !['opacity','density','hardness','paintAmount','colorStretch'].every(k=>Number.isFinite(s[k])&&s[k]>=0&&s[k]<=1) || typeof s.mix!=='boolean')) throw Error('지원하지 않는 브러시 설정입니다. 원본을 보호합니다.');
    if(s.points.some(p=>p.length===6)&&(![s.roundness,s.spacing,s.stabilization,s.angle].every(Number.isFinite)||s.roundness<.05||s.roundness>1||s.spacing<.01||s.spacing>1||s.stabilization<0||s.stabilization>1||Math.abs(s.angle)>180||!["source-over","multiply","screen","overlay"].includes(s.blend)))throw Error('손상된 브러시 형상입니다. 원본을 보호합니다.');
    if(data.version>=3&&s.points.some(p=>p.length===6)&&(typeof s.scatter!=='boolean'||!Number.isInteger(s.particleCount)||s.particleCount<1||s.particleCount>16||!Number.isFinite(s.particleSize)||s.particleSize<.05||s.particleSize>1||!Number.isFinite(s.spread)||s.spread<0||s.spread>2))throw Error('손상된 분사 설정입니다. 원본을 보호합니다.');
    if(s.mixType!==undefined&&(data.version<10&&s.mix||!['blend','running','smear'].includes(s.mixType)))throw Error('지원하지 않는 혼합 종류입니다.');
    if(s.mixSource!==undefined&&!['current','visible'].includes(s.mixSource))throw Error('손상된 혼합 설정입니다.');
    if(s.mix&&s.mixSource==='visible'&&(!Array.isArray(s.mixSamples)||s.mixSamples.length!==s.points.length||s.mixSamples.some(a=>!Array.isArray(a)||a.length!==4||a.some(v=>!Number.isFinite(v)||v<0||v>255))))throw Error('손상된 혼합 참고 색입니다.');
    if (!s.points.every(p => Array.isArray(p) && (p.length === 2 || data.version>=3 && p.length===6 && p.slice(2,5).every(v=>v>=0&&v<=1) && Math.abs(p[5])<=180) && p.every(Number.isFinite))) throw Error('손상된 좌표입니다. 원본을 보호합니다.');
  }
  return data;
}
function encode(data) {
  validate(data, data.id);
  const payload = JSON.stringify(data);
  return JSON.stringify({checksum:digest(payload), payload});
}
function decode(raw, id) {
  const envelope = JSON.parse(raw);
  if (typeof envelope.payload !== 'string' || digest(envelope.payload) !== envelope.checksum) throw Error('그림 파일 무결성 검사 실패. 원본을 보호합니다.');
  return validate(JSON.parse(envelope.payload), id);
}

class DrawingStore {
  constructor(vaultRoot, io = fs) {
    this.root = path.join(vaultRoot, '.canvas-drawing', 'documents');
    this.io = io;
    this.records = new Map();
    this.writeCount = 0;
  }
  file(id) {
    if (!validId(id)) throw Error('잘못된 그림 식별자');
    return path.join(this.root, `${id}.json`);
  }
  load(id, sourcePath, expected = false) {
    if (this.records.has(id)) return this.records.get(id);
    const file = this.file(id);
    let data;
    if (this.io.existsSync(file)) data = decode(this.io.readFileSync(file, 'utf8'), id);
    else if (this.io.existsSync(file + '.pending')) data = decode(this.io.readFileSync(file + '.pending', 'utf8'), id);
    else if (expected) throw Error('연결된 그림 파일을 찾을 수 없습니다. 원본 연결을 유지합니다.');
    else data = {format:FORMAT, version:1, id, revision:0, sourcePath, strokes:[]};
    const record = {data, dirty:false, error:null, undo:[], redo:[]};
    this.records.set(id, record);
    return record;
  }
  changed(record) { record.data.revision++; record.dirty = true; }
  flush(record) {
    if (!record.dirty) return true;
    const target = this.file(record.data.id);
    try {
      this.io.mkdirSync(this.root, {recursive:true});
      const raw = encode(record.data);
      // A foreign edit, corrupted file, or newer format must never be replaced.
      if (this.io.existsSync(target)) {
        const previousRaw = this.io.readFileSync(target, 'utf8');
        const previous = decode(previousRaw, record.data.id);
        if (previous.revision >= record.data.revision) throw Error('다른 창 또는 외부에서 변경된 그림입니다. 덮어쓰기를 중지합니다.');
        if(previous.version===1&&record.data.version===2&&!this.io.existsSync(target+'.v1.bak'))this.atomic(target+'.v1.bak',previousRaw);
        if(previous.version<record.data.version&&!this.io.existsSync(target+'.v'+previous.version+'.bak'))this.atomic(target+'.v'+previous.version+'.bak',previousRaw);
        this.atomic(target + '.bak', previousRaw);
      }
      this.atomic(target, raw);
      record.dirty = false; record.error = null; this.writeCount++;
      return true;
    } catch (error) { record.error = error.message; return false; }
  }
  atomic(target, contents) {
    const temporary = target + '.pending';
    const fd = this.io.openSync(temporary, 'w');
    try { this.io.writeFileSync(fd, contents, 'utf8'); this.io.fsyncSync(fd); }
    finally { this.io.closeSync(fd); }
    this.io.renameSync(temporary, target);
  }
  flushAll() { return [...this.records.values()].map(r => this.flush(r)).every(Boolean); }
}
module.exports = {DrawingStore, encode, decode, validId, randomUUID};
