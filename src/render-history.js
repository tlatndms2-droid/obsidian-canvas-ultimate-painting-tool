'use strict';
const {createHash}=require('node:crypto');
// A shared, bounded cache of immutable rendered tiles. Drawing history remains authoritative.
class RenderHistory{
 constructor(limit=64*1024*1024){this.limit=limit;this.bytes=0;this.entries=new Map();}
 key(data,layer,strokes){return createHash('sha256').update(JSON.stringify([data.assets||{},layer.tiles||[],strokes])).digest('hex');}
 get(key){const entry=this.entries.get(key);if(!entry)return null;this.entries.delete(key);this.entries.set(key,entry);return entry.tiles;}
 put(key,tiles){if(this.entries.has(key))return;const bytes=tiles.size*256*256*4;if(bytes>this.limit)return;while(this.entries.size&&(this.bytes+bytes>this.limit||this.entries.size>=50)){const id=this.entries.keys().next().value;this.bytes-=this.entries.get(id).bytes;this.entries.delete(id);}this.entries.set(key,{tiles:new Map(tiles),bytes});this.bytes+=bytes;}
}
module.exports={RenderHistory};
