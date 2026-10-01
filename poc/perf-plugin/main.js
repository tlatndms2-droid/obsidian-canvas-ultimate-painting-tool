var LabDeps = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x2) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x2, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x2)(function(x2) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x2 + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // poc/abr-tools/node_modules/kaitai-struct/KaitaiStream.js
  var require_KaitaiStream = __commonJS({
    "poc/abr-tools/node_modules/kaitai-struct/KaitaiStream.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define(factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.KaitaiStream = factory());
      })(exports, (function() {
        "use strict";
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        function __extends(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        }
        typeof SuppressedError === "function" ? SuppressedError : function(error, suppressed, message) {
          var e = new Error(message);
          return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
        };
        var KaitaiStream2 = (
          /** @class */
          (function() {
            function KaitaiStream3(arrayBuffer, byteOffset) {
              this._byteLength = 0;
              this._byteOffset = 0;
              this.bits = 0;
              this.bitsLeft = 0;
              this._byteOffset = byteOffset || 0;
              if (arrayBuffer instanceof ArrayBuffer) {
                this.buffer = arrayBuffer;
              } else if (typeof arrayBuffer == "object") {
                this.dataView = arrayBuffer;
                if (byteOffset) {
                  this._byteOffset += byteOffset;
                }
              } else {
                this.buffer = new ArrayBuffer(arrayBuffer || 1);
              }
              this.pos = 0;
              this.alignToByte();
            }
            Object.defineProperty(KaitaiStream3.prototype, "buffer", {
              /**
               * Gets the backing ArrayBuffer of the KaitaiStream object.
               *
               * @returns The backing ArrayBuffer.
               */
              get: function() {
                this._trimAlloc();
                return this._buffer;
              },
              /**
               * Sets the backing ArrayBuffer of the KaitaiStream object and updates the
               * DataView to point to the new buffer.
               */
              set: function(v) {
                this._buffer = v;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._buffer.byteLength;
              },
              enumerable: false,
              configurable: true
            });
            Object.defineProperty(KaitaiStream3.prototype, "byteOffset", {
              /**
               * Gets the byteOffset of the KaitaiStream object.
               *
               * @returns The byteOffset.
               */
              get: function() {
                return this._byteOffset;
              },
              /**
               * Sets the byteOffset of the KaitaiStream object and updates the DataView to
               * point to the new byteOffset.
               */
              set: function(v) {
                this._byteOffset = v;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._buffer.byteLength;
              },
              enumerable: false,
              configurable: true
            });
            Object.defineProperty(KaitaiStream3.prototype, "dataView", {
              /**
               * Gets the backing DataView of the KaitaiStream object.
               *
               * @returns The backing DataView.
               */
              get: function() {
                return this._dataView;
              },
              /**
               * Sets the backing DataView of the KaitaiStream object and updates the buffer
               * and byteOffset to point to the DataView values.
               */
              set: function(v) {
                this._byteOffset = v.byteOffset;
                this._buffer = v.buffer;
                this._dataView = new DataView(this._buffer, this._byteOffset);
                this._byteLength = this._byteOffset + v.byteLength;
              },
              enumerable: false,
              configurable: true
            });
            KaitaiStream3.prototype._trimAlloc = function() {
              if (this._byteLength === this._buffer.byteLength) {
                return;
              }
              var buf = new ArrayBuffer(this._byteLength);
              var dst = new Uint8Array(buf);
              var src = new Uint8Array(this._buffer, 0, dst.length);
              dst.set(src);
              this.buffer = buf;
            };
            KaitaiStream3.prototype.isEof = function() {
              return this.pos >= this.size && this.bitsLeft === 0;
            };
            KaitaiStream3.prototype.seek = function(pos) {
              var npos = Math.max(0, Math.min(this.size, pos));
              this.pos = isNaN(npos) || !isFinite(npos) ? 0 : npos;
            };
            Object.defineProperty(KaitaiStream3.prototype, "size", {
              /**
               * Returns the byte length of the KaitaiStream object.
               *
               * @returns The byte length.
               */
              get: function() {
                return this._byteLength - this._byteOffset;
              },
              enumerable: false,
              configurable: true
            });
            KaitaiStream3.prototype.readS1 = function() {
              this.ensureBytesLeft(1);
              var v = this._dataView.getInt8(this.pos);
              this.pos += 1;
              return v;
            };
            KaitaiStream3.prototype.readS2be = function() {
              this.ensureBytesLeft(2);
              var v = this._dataView.getInt16(this.pos);
              this.pos += 2;
              return v;
            };
            KaitaiStream3.prototype.readS4be = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getInt32(this.pos);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readS8be = function() {
              this.ensureBytesLeft(8);
              var v1 = this.readU4be();
              var v2 = this.readU4be();
              if ((v1 & 2147483648) !== 0) {
                return -(4294967296 * (v1 ^ 4294967295) + (v2 ^ 4294967295)) - 1;
              } else {
                return 4294967296 * v1 + v2;
              }
            };
            KaitaiStream3.prototype.readS2le = function() {
              this.ensureBytesLeft(2);
              var v = this._dataView.getInt16(this.pos, true);
              this.pos += 2;
              return v;
            };
            KaitaiStream3.prototype.readS4le = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getInt32(this.pos, true);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readS8le = function() {
              this.ensureBytesLeft(8);
              var v1 = this.readU4le();
              var v2 = this.readU4le();
              if ((v2 & 2147483648) !== 0) {
                return -(4294967296 * (v2 ^ 4294967295) + (v1 ^ 4294967295)) - 1;
              } else {
                return 4294967296 * v2 + v1;
              }
            };
            KaitaiStream3.prototype.readU1 = function() {
              this.ensureBytesLeft(1);
              var v = this._dataView.getUint8(this.pos);
              this.pos += 1;
              return v;
            };
            KaitaiStream3.prototype.readU2be = function() {
              this.ensureBytesLeft(2);
              var v = this._dataView.getUint16(this.pos);
              this.pos += 2;
              return v;
            };
            KaitaiStream3.prototype.readU4be = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getUint32(this.pos);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readU8be = function() {
              this.ensureBytesLeft(8);
              var v1 = this.readU4be();
              var v2 = this.readU4be();
              return 4294967296 * v1 + v2;
            };
            KaitaiStream3.prototype.readU2le = function() {
              this.ensureBytesLeft(2);
              var v = this._dataView.getUint16(this.pos, true);
              this.pos += 2;
              return v;
            };
            KaitaiStream3.prototype.readU4le = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getUint32(this.pos, true);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readU8le = function() {
              this.ensureBytesLeft(8);
              var v1 = this.readU4le();
              var v2 = this.readU4le();
              return 4294967296 * v2 + v1;
            };
            KaitaiStream3.prototype.readF4be = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getFloat32(this.pos);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readF8be = function() {
              this.ensureBytesLeft(8);
              var v = this._dataView.getFloat64(this.pos);
              this.pos += 8;
              return v;
            };
            KaitaiStream3.prototype.readF4le = function() {
              this.ensureBytesLeft(4);
              var v = this._dataView.getFloat32(this.pos, true);
              this.pos += 4;
              return v;
            };
            KaitaiStream3.prototype.readF8le = function() {
              this.ensureBytesLeft(8);
              var v = this._dataView.getFloat64(this.pos, true);
              this.pos += 8;
              return v;
            };
            KaitaiStream3.prototype.alignToByte = function() {
              this.bitsLeft = 0;
              this.bits = 0;
            };
            KaitaiStream3.prototype.readBitsIntBe = function(n) {
              if (n > 32) {
                throw new RangeError("readBitsIntBe: the maximum supported bit length is 32 (tried to read " + n + " bits)");
              }
              var res = 0;
              var bitsNeeded = n - this.bitsLeft;
              this.bitsLeft = -bitsNeeded & 7;
              if (bitsNeeded > 0) {
                var bytesNeeded = (bitsNeeded - 1 >> 3) + 1;
                var buf = this.readBytes(bytesNeeded);
                for (var i2 = 0; i2 < bytesNeeded; i2++) {
                  res = res << 8 | buf[i2];
                }
                var newBits = res;
                res = res >>> this.bitsLeft | this.bits << bitsNeeded;
                this.bits = newBits;
              } else {
                res = this.bits >>> -bitsNeeded;
              }
              var mask = (1 << this.bitsLeft) - 1;
              this.bits &= mask;
              return res >>> 0;
            };
            KaitaiStream3.prototype.readBitsInt = function(n) {
              return this.readBitsIntBe(n);
            };
            KaitaiStream3.prototype.readBitsIntLe = function(n) {
              if (n > 32) {
                throw new RangeError("readBitsIntLe: the maximum supported bit length is 32 (tried to read " + n + " bits)");
              }
              var res = 0;
              var bitsNeeded = n - this.bitsLeft;
              if (bitsNeeded > 0) {
                var bytesNeeded = (bitsNeeded - 1 >> 3) + 1;
                var buf = this.readBytes(bytesNeeded);
                for (var i2 = 0; i2 < bytesNeeded; i2++) {
                  res |= buf[i2] << i2 * 8;
                }
                var newBits = bitsNeeded < 32 ? res >>> bitsNeeded : 0;
                res = res << this.bitsLeft | this.bits;
                this.bits = newBits;
              } else {
                res = this.bits;
                this.bits >>>= n;
              }
              this.bitsLeft = -bitsNeeded & 7;
              if (n < 32) {
                var mask = (1 << n) - 1;
                res &= mask;
              } else {
                res >>>= 0;
              }
              return res;
            };
            KaitaiStream3.prototype.readBytes = function(len) {
              return this.mapUint8Array(len);
            };
            KaitaiStream3.prototype.readBytesFull = function() {
              return this.mapUint8Array(this.size - this.pos);
            };
            KaitaiStream3.prototype.readBytesTerm = function(terminator, include, consume, eosError) {
              var blen = this.size - this.pos;
              var u82 = new Uint8Array(this._buffer, this._byteOffset + this.pos);
              var i2;
              for (i2 = 0; i2 < blen && u82[i2] !== terminator; i2++)
                ;
              if (i2 === blen) {
                if (eosError) {
                  throw new Error("End of stream reached, but no terminator " + terminator + " found");
                } else {
                  return this.mapUint8Array(i2);
                }
              } else {
                var arr = void 0;
                if (include) {
                  arr = this.mapUint8Array(i2 + 1);
                } else {
                  arr = this.mapUint8Array(i2);
                }
                if (consume) {
                  this.pos += 1;
                }
                return arr;
              }
            };
            KaitaiStream3.prototype.readBytesTermMulti = function(terminator, include, consume, eosError) {
              var unitSize = terminator.length;
              var data = new Uint8Array(this._buffer, this._byteOffset + this.pos, this.size - this.pos);
              var res = KaitaiStream3.bytesTerminateMulti(data, terminator, true);
              this.pos += res.length;
              var termFound = res.length !== 0 && res.length % unitSize === 0 && KaitaiStream3.byteArrayCompare(new Uint8Array(res.buffer, res.length - unitSize), terminator) === 0;
              if (termFound) {
                if (!include) {
                  res = new Uint8Array(res.buffer, res.byteOffset, res.length - unitSize);
                }
                if (!consume) {
                  this.pos -= unitSize;
                }
              } else if (eosError) {
                throw new Error("End of stream reached, but no terminator " + terminator + " found");
              }
              return res;
            };
            KaitaiStream3.prototype.ensureFixedContents = function(expected) {
              var actual = this.readBytes(expected.length);
              if (actual.length !== expected.length) {
                throw new KaitaiStream3.UnexpectedDataError(expected, actual);
              }
              var actLen = actual.length;
              for (var i2 = 0; i2 < actLen; i2++) {
                if (actual[i2] !== expected[i2]) {
                  throw new KaitaiStream3.UnexpectedDataError(expected, actual);
                }
              }
              return actual;
            };
            KaitaiStream3.bytesStripRight = function(data, padByte) {
              var newLen = data.length;
              while (data[newLen - 1] === padByte) {
                newLen--;
              }
              return data.slice(0, newLen);
            };
            KaitaiStream3.bytesTerminate = function(data, term, include) {
              var newLen = 0;
              var maxLen = data.length;
              while (newLen < maxLen && data[newLen] !== term) {
                newLen++;
              }
              if (include && newLen < maxLen)
                newLen++;
              return data.slice(0, newLen);
            };
            KaitaiStream3.bytesTerminateMulti = function(data, term, include) {
              var unitSize = term.length;
              if (unitSize === 0) {
                return new Uint8Array();
              }
              var len = data.length;
              var iTerm = 0;
              for (var iData = 0; iData < len; ) {
                if (data[iData] !== term[iTerm]) {
                  iData += unitSize - iTerm;
                  iTerm = 0;
                  continue;
                }
                iData++;
                iTerm++;
                if (iTerm === unitSize) {
                  return data.slice(0, iData - (include ? 0 : unitSize));
                }
              }
              return data.slice();
            };
            KaitaiStream3.bytesToStr = function(arr, encoding) {
              if (encoding == null || encoding.toLowerCase() === "ascii") {
                return KaitaiStream3.createStringFromArray(arr);
              } else {
                if (typeof TextDecoder === "function") {
                  return new TextDecoder(encoding).decode(arr);
                } else {
                  switch (encoding.toLowerCase()) {
                    case "utf8":
                    case "utf-8":
                    case "ucs2":
                    case "ucs-2":
                    case "utf16le":
                    case "utf-16le":
                      return Buffer.from(arr).toString(encoding);
                    default:
                      if (typeof KaitaiStream3.iconvlite === "undefined")
                        KaitaiStream3.iconvlite = __require("iconv-lite");
                      return KaitaiStream3.iconvlite.decode(arr, encoding);
                  }
                }
              }
            };
            KaitaiStream3.processXorOne = function(data, key) {
              var r = new Uint8Array(data.length);
              var dl = data.length;
              for (var i2 = 0; i2 < dl; i2++)
                r[i2] = data[i2] ^ key;
              return r;
            };
            KaitaiStream3.processXorMany = function(data, key) {
              var dl = data.length;
              var r = new Uint8Array(dl);
              var kl = key.length;
              var ki = 0;
              for (var i2 = 0; i2 < dl; i2++) {
                r[i2] = data[i2] ^ key[ki];
                ki++;
                if (ki >= kl)
                  ki = 0;
              }
              return r;
            };
            KaitaiStream3.processRotateLeft = function(data, amount, groupSize) {
              if (groupSize !== 1)
                throw new RangeError("unable to rotate group of " + groupSize + " bytes yet");
              var mask = groupSize * 8 - 1;
              var antiAmount = -amount & mask;
              var r = new Uint8Array(data.length);
              for (var i2 = 0; i2 < data.length; i2++)
                r[i2] = data[i2] << amount & 255 | data[i2] >> antiAmount;
              return r;
            };
            KaitaiStream3.processZlib = function(buf) {
              if (typeof __require !== "undefined") {
                if (typeof KaitaiStream3.zlib === "undefined")
                  KaitaiStream3.zlib = __require("zlib");
                var r = KaitaiStream3.zlib.inflateSync(Buffer.from(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)));
                return new Uint8Array(r.buffer, r.byteOffset, r.length);
              } else {
                if (typeof KaitaiStream3.zlib === "undefined" && typeof KaitaiStream3.depUrls.zlib !== "undefined") {
                  importScripts(KaitaiStream3.depUrls.zlib);
                  KaitaiStream3.zlib = pako;
                }
                return KaitaiStream3.zlib.inflate(buf);
              }
            };
            KaitaiStream3.mod = function(a, b) {
              if (b <= 0)
                throw new RangeError("mod divisor <= 0");
              var r = a % b;
              if (r < 0)
                r += b;
              return r;
            };
            KaitaiStream3.arrayMin = function(arr) {
              var min = arr[0];
              var x2;
              for (var i2 = 1, n = arr.length; i2 < n; ++i2) {
                x2 = arr[i2];
                if (x2 < min)
                  min = x2;
              }
              return min;
            };
            KaitaiStream3.arrayMax = function(arr) {
              var max = arr[0];
              var x2;
              for (var i2 = 1, n = arr.length; i2 < n; ++i2) {
                x2 = arr[i2];
                if (x2 > max)
                  max = x2;
              }
              return max;
            };
            KaitaiStream3.byteArrayCompare = function(a, b) {
              if (a === b)
                return 0;
              var al = a.length;
              var bl = b.length;
              var minLen = al < bl ? al : bl;
              for (var i2 = 0; i2 < minLen; i2++) {
                var cmp = a[i2] - b[i2];
                if (cmp !== 0)
                  return cmp;
              }
              if (al === bl) {
                return 0;
              } else {
                return al - bl;
              }
            };
            KaitaiStream3.prototype.ensureBytesLeft = function(length) {
              if (this.pos + length > this.size) {
                throw new KaitaiStream3.EOFError(length, this.size - this.pos);
              }
            };
            KaitaiStream3.prototype.mapUint8Array = function(length) {
              length |= 0;
              this.ensureBytesLeft(length);
              var arr = new Uint8Array(this._buffer, this.byteOffset + this.pos, length);
              this.pos += length;
              return arr;
            };
            KaitaiStream3.createStringFromArray = function(array) {
              var chunk_size = 32768;
              var chunks = [];
              for (var i2 = 0; i2 < array.length; i2 += chunk_size) {
                var chunk = array.subarray(i2, i2 + chunk_size);
                chunks.push(String.fromCharCode.apply(null, chunk));
              }
              return chunks.join("");
            };
            KaitaiStream3.depUrls = {
              // processZlib uses this and expected a link to a copy of pako.
              // specifically the pako_inflate.min.js script at:
              // https://raw.githubusercontent.com/nodeca/pako/master/dist/pako_inflate.min.js
              zlib: void 0
            };
            KaitaiStream3.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
            KaitaiStream3.EOFError = /** @class */
            (function(_super) {
              __extends(EOFError, _super);
              function EOFError(bytesReq, bytesAvail) {
                var _this = _super.call(this, "requested " + bytesReq + " bytes, but only " + bytesAvail + " bytes available") || this;
                _this.name = "EOFError";
                Object.setPrototypeOf(_this, KaitaiStream3.EOFError.prototype);
                _this.bytesReq = bytesReq;
                _this.bytesAvail = bytesAvail;
                return _this;
              }
              return EOFError;
            })(Error);
            KaitaiStream3.UnexpectedDataError = /** @class */
            (function(_super) {
              __extends(UnexpectedDataError, _super);
              function UnexpectedDataError(expected, actual) {
                var _this = _super.call(this, "expected [" + expected + "], but got [" + actual + "]") || this;
                _this.name = "UnexpectedDataError";
                Object.setPrototypeOf(_this, KaitaiStream3.UnexpectedDataError.prototype);
                _this.expected = expected;
                _this.actual = actual;
                return _this;
              }
              return UnexpectedDataError;
            })(Error);
            KaitaiStream3.UndecidedEndiannessError = /** @class */
            (function(_super) {
              __extends(UndecidedEndiannessError, _super);
              function UndecidedEndiannessError() {
                var _this = _super.call(this) || this;
                _this.name = "UndecidedEndiannessError";
                Object.setPrototypeOf(_this, KaitaiStream3.UndecidedEndiannessError.prototype);
                return _this;
              }
              return UndecidedEndiannessError;
            })(Error);
            KaitaiStream3.ValidationNotEqualError = /** @class */
            (function(_super) {
              __extends(ValidationNotEqualError, _super);
              function ValidationNotEqualError(expected, actual) {
                var _this = _super.call(this, "not equal, expected [" + expected + "], but got [" + actual + "]") || this;
                _this.name = "ValidationNotEqualError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationNotEqualError.prototype);
                _this.expected = expected;
                _this.actual = actual;
                return _this;
              }
              return ValidationNotEqualError;
            })(Error);
            KaitaiStream3.ValidationLessThanError = /** @class */
            (function(_super) {
              __extends(ValidationLessThanError, _super);
              function ValidationLessThanError(min, actual) {
                var _this = _super.call(this, "not in range, min [" + min + "], but got [" + actual + "]") || this;
                _this.name = "ValidationLessThanError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationLessThanError.prototype);
                _this.min = min;
                _this.actual = actual;
                return _this;
              }
              return ValidationLessThanError;
            })(Error);
            KaitaiStream3.ValidationGreaterThanError = /** @class */
            (function(_super) {
              __extends(ValidationGreaterThanError, _super);
              function ValidationGreaterThanError(max, actual) {
                var _this = _super.call(this, "not in range, max [" + max + "], but got [" + actual + "]") || this;
                _this.name = "ValidationGreaterThanError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationGreaterThanError.prototype);
                _this.max = max;
                _this.actual = actual;
                return _this;
              }
              return ValidationGreaterThanError;
            })(Error);
            KaitaiStream3.ValidationNotAnyOfError = /** @class */
            (function(_super) {
              __extends(ValidationNotAnyOfError, _super);
              function ValidationNotAnyOfError(actual) {
                var _this = _super.call(this, "not any of the list, got [" + actual + "]") || this;
                _this.name = "ValidationNotAnyOfError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationNotAnyOfError.prototype);
                _this.actual = actual;
                return _this;
              }
              return ValidationNotAnyOfError;
            })(Error);
            KaitaiStream3.ValidationNotInEnumError = /** @class */
            (function(_super) {
              __extends(ValidationNotInEnumError, _super);
              function ValidationNotInEnumError(actual) {
                var _this = _super.call(this, "not in the enum, got [" + actual + "]") || this;
                _this.name = "ValidationNotInEnumError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationNotInEnumError.prototype);
                _this.actual = actual;
                return _this;
              }
              return ValidationNotInEnumError;
            })(Error);
            KaitaiStream3.ValidationExprError = /** @class */
            (function(_super) {
              __extends(ValidationExprError, _super);
              function ValidationExprError(actual) {
                var _this = _super.call(this, "not matching the expression, got [" + actual + "]") || this;
                _this.name = "ValidationExprError";
                Object.setPrototypeOf(_this, KaitaiStream3.ValidationExprError.prototype);
                _this.actual = actual;
                return _this;
              }
              return ValidationExprError;
            })(Error);
            return KaitaiStream3;
          })()
        );
        return KaitaiStream2;
      }));
    }
  });

  // poc/abr-tools/vendor/Abr.js
  var require_Abr = __commonJS({
    "poc/abr-tools/vendor/Abr.js"(exports, module) {
      (function(root, factory) {
        if (typeof define === "function" && define.amd) {
          define(["kaitai-struct/KaitaiStream"], factory);
        } else if (typeof module === "object" && module.exports) {
          module.exports = factory(require_KaitaiStream());
        } else {
          root.Abr = factory(root.KaitaiStream);
        }
      })(typeof self !== "undefined" ? self : exports, function(KaitaiStream2) {
        var Abr2 = (function() {
          Abr3.Tag = Object.freeze({
            TAG_8BIM: 943868237,
            943868237: "TAG_8BIM"
          });
          Abr3.Subtag = Object.freeze({
            DESC: 1684370275,
            PATT: 1885434996,
            PHRY: 1885893241,
            SAMP: 1935764848,
            1684370275: "DESC",
            1885434996: "PATT",
            1885893241: "PHRY",
            1935764848: "SAMP"
          });
          Abr3.DescriptorType = Object.freeze({
            DESCRIPTOR: 1331849827,
            STRING: 1413830740,
            UNIT_FLOAT: 1433302086,
            LIST: 1449938035,
            BOOLEAN: 1651470188,
            DOUBLE: 1685026146,
            ENUMERATED: 1701737837,
            INTEGER: 1819242087,
            ALIAS: 2540464499,
            1331849827: "DESCRIPTOR",
            1413830740: "STRING",
            1433302086: "UNIT_FLOAT",
            1449938035: "LIST",
            1651470188: "BOOLEAN",
            1685026146: "DOUBLE",
            1701737837: "ENUMERATED",
            1819242087: "INTEGER",
            2540464499: "ALIAS"
          });
          Abr3.FloatUnit = Object.freeze({
            ANGLE: 591490663,
            NONE: 592342629,
            PERCENT: 592474723,
            PIXELS: 592476268,
            DISTANCE: 592604276,
            DENSITY: 592606060,
            591490663: "ANGLE",
            592342629: "NONE",
            592474723: "PERCENT",
            592476268: "PIXELS",
            592604276: "DISTANCE",
            592606060: "DENSITY"
          });
          function Abr3(_io, _parent, _root) {
            this._io = _io;
            this._parent = _parent;
            this._root = _root || this;
            this._read();
          }
          Abr3.prototype._read = function() {
            this.header = new Header(this._io, this, this._root);
            this.sections = [];
            var i2 = 0;
            while (!this._io.isEof()) {
              this.sections.push(new Section(this._io, this, this._root));
              i2++;
            }
          };
          var Channel = Abr3.Channel = (function() {
            function Channel2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            Channel2.prototype._read = function() {
              this.isWritten = this._io.readU4be();
              if (this.isWritten > 0) {
                this.length = this._io.readU4be();
              }
              if (this.isWritten > 0 && this.length > 0) {
                this.unusedDepth = this._io.readU4be();
              }
              if (this.isWritten > 0 && this.length > 0) {
                this.imageData = new ImageData(this._io, this, this._root);
              }
            };
            return Channel2;
          })();
          var DescriptorList = Abr3.DescriptorList = (function() {
            function DescriptorList2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            DescriptorList2.prototype._read = function() {
              this.itemCount = this._io.readU4be();
              this.items = [];
              for (var i2 = 0; i2 < this.itemCount; i2++) {
                this.items.push(new TypedValue(this._io, this, this._root));
              }
            };
            return DescriptorList2;
          })();
          var ImageData = Abr3.ImageData = (function() {
            function ImageData2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            ImageData2.prototype._read = function() {
              this.top = this._io.readU4be();
              this.left = this._io.readU4be();
              this.bottom = this._io.readU4be();
              this.right = this._io.readU4be();
              this.depth = this._io.readU2be();
              this.compression = this._io.readU1();
              this.bitmap = this._io.readBytesFull();
            };
            return ImageData2;
          })();
          var TypedValue = Abr3.TypedValue = (function() {
            function TypedValue2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            TypedValue2.prototype._read = function() {
              this.type = this._io.readU4be();
              switch (this.type) {
                case Abr3.DescriptorType.STRING:
                  this.value = new UnicodeString(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.UNIT_FLOAT:
                  this.value = new UnitFloatValue(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.ENUMERATED:
                  this.value = new EnumeratedValue(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.INTEGER:
                  this.value = this._io.readS4be();
                  break;
                case Abr3.DescriptorType.LIST:
                  this.value = new DescriptorList(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.ALIAS:
                  this.value = new AliasValue(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.BOOLEAN:
                  this.value = this._io.readU1();
                  break;
                case Abr3.DescriptorType.DESCRIPTOR:
                  this.value = new Descriptor(this._io, this, this._root);
                  break;
                case Abr3.DescriptorType.DOUBLE:
                  this.value = this._io.readF8be();
                  break;
              }
            };
            return TypedValue2;
          })();
          var CompactString = Abr3.CompactString = (function() {
            function CompactString2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            CompactString2.prototype._read = function() {
              this.strLen = this._io.readU4be();
              this.text = KaitaiStream2.bytesToStr(this._io.readBytes(this.strLen > 0 ? this.strLen : 4), "ascii");
            };
            return CompactString2;
          })();
          var Descriptor = Abr3.Descriptor = (function() {
            function Descriptor2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            Descriptor2.prototype._read = function() {
              this.className = new UnicodeString(this._io, this, this._root);
              this.classId = new CompactString(this._io, this, this._root);
              this.itemCount = this._io.readU4be();
              this.keyedItems = [];
              for (var i2 = 0; i2 < this.itemCount; i2++) {
                this.keyedItems.push(new KeyedItem(this._io, this, this._root));
              }
            };
            return Descriptor2;
          })();
          var Section = Abr3.Section = (function() {
            function Section2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            Section2.prototype._read = function() {
              this.tag = this._io.readU4be();
              this.subtag = this._io.readU4be();
              this.bodyLen = this._io.readU4be();
              switch (this.subtag) {
                case Abr3.Subtag.SAMP:
                  this._raw_body = this._io.readBytes(this.bodyLen);
                  var _io__raw_body = new KaitaiStream2(this._raw_body);
                  this.body = new SamplesSectionBody(_io__raw_body, this, this._root);
                  break;
                case Abr3.Subtag.DESC:
                  this._raw_body = this._io.readBytes(this.bodyLen);
                  var _io__raw_body = new KaitaiStream2(this._raw_body);
                  this.body = new DescriptorsSectionBody(_io__raw_body, this, this._root);
                  break;
                case Abr3.Subtag.PHRY:
                  this._raw_body = this._io.readBytes(this.bodyLen);
                  var _io__raw_body = new KaitaiStream2(this._raw_body);
                  this.body = new HierarchiesSectionBody(_io__raw_body, this, this._root);
                  break;
                default:
                  this.body = this._io.readBytes(this.bodyLen);
                  break;
              }
              if (!this._io.isEof()) {
                this.padding = this._io.readBytes(KaitaiStream2.mod(-this.bodyLen, 4));
              }
            };
            return Section2;
          })();
          var SamplesSectionBody = Abr3.SamplesSectionBody = (function() {
            function SamplesSectionBody2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            SamplesSectionBody2.prototype._read = function() {
              this.samples = [];
              var i2 = 0;
              while (!this._io.isEof()) {
                this.samples.push(new Sample(this._io, this, this._root));
                i2++;
              }
            };
            return SamplesSectionBody2;
          })();
          var KeyedItem = Abr3.KeyedItem = (function() {
            function KeyedItem2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            KeyedItem2.prototype._read = function() {
              this.key = new CompactString(this._io, this, this._root);
              this.item = new TypedValue(this._io, this, this._root);
            };
            return KeyedItem2;
          })();
          var PascalStringU4 = Abr3.PascalStringU4 = (function() {
            function PascalStringU42(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            PascalStringU42.prototype._read = function() {
              this.strLen = this._io.readU4be();
              this.text = KaitaiStream2.bytesToStr(this._io.readBytes(this.strLen), "ascii");
            };
            return PascalStringU42;
          })();
          var SampleData = Abr3.SampleData = (function() {
            function SampleData2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            SampleData2.prototype._read = function() {
              this.idLen = this._io.readU1();
              this.brushId = this._io.readBytes(this.idLen);
              if (this._root.header.subversion == 2) {
                this.bodyV62 = new V62(this._io, this, this._root);
              }
              if (this._root.header.subversion == 1) {
                this.bodyV61 = new V61(this._io, this, this._root);
              }
            };
            return SampleData2;
          })();
          var V62 = Abr3.V62 = (function() {
            function V622(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            V622.prototype._read = function() {
              this.metaLen = this._io.readU2be();
              this.metaA = this._io.readU2be();
              this.version = this._io.readU4be();
              this.length = this._io.readU4be();
              this.bounds = this._io.readBytes(16);
              this.numChannels = this._io.readU4be();
              this.channels = [];
              for (var i2 = 0; i2 < this.numChannels; i2++) {
                this.channels.push(new Channel(this._io, this, this._root));
              }
            };
            return V622;
          })();
          var HierarchiesSectionBody = Abr3.HierarchiesSectionBody = (function() {
            function HierarchiesSectionBody2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            HierarchiesSectionBody2.prototype._read = function() {
              this.unknownData = this._io.readBytesFull();
            };
            return HierarchiesSectionBody2;
          })();
          var EnumeratedValue = Abr3.EnumeratedValue = (function() {
            function EnumeratedValue2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            EnumeratedValue2.prototype._read = function() {
              this.type = new CompactString(this._io, this, this._root);
              this.enum = new CompactString(this._io, this, this._root);
            };
            return EnumeratedValue2;
          })();
          var Sample = Abr3.Sample = (function() {
            function Sample2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            Sample2.prototype._read = function() {
              this.sampleLen = this._io.readU4be();
              this._raw_data = this._io.readBytes(this.sampleLen);
              var _io__raw_data = new KaitaiStream2(this._raw_data);
              this.data = new SampleData(_io__raw_data, this, this._root);
              this.padding = this._io.readBytes(KaitaiStream2.mod(-this.sampleLen, 4));
            };
            return Sample2;
          })();
          var Header = Abr3.Header = (function() {
            function Header2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            Header2.prototype._read = function() {
              this.version = this._io.readU2be();
              this.subversion = this._io.readU2be();
            };
            return Header2;
          })();
          var UnicodeString = Abr3.UnicodeString = (function() {
            function UnicodeString2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            UnicodeString2.prototype._read = function() {
              this.utf16CharCount = this._io.readU4be();
              this.text = KaitaiStream2.bytesToStr(this._io.readBytes(this.utf16CharCount * 2), "UTF-16BE");
            };
            return UnicodeString2;
          })();
          var DescriptorsSectionBody = Abr3.DescriptorsSectionBody = (function() {
            function DescriptorsSectionBody2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            DescriptorsSectionBody2.prototype._read = function() {
              this.unknown = this._io.readBytes(18);
              this.itemCount = this._io.readU4be();
              this.keyedItems = [];
              for (var i2 = 0; i2 < this.itemCount; i2++) {
                this.keyedItems.push(new KeyedItem(this._io, this, this._root));
              }
            };
            return DescriptorsSectionBody2;
          })();
          var AliasValue = Abr3.AliasValue = (function() {
            function AliasValue2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            AliasValue2.prototype._read = function() {
              this.length = this._io.readU4be();
              this.data = this._io.readBytes(this.length);
            };
            return AliasValue2;
          })();
          var V61 = Abr3.V61 = (function() {
            function V612(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            V612.prototype._read = function() {
              this.unknown = this._io.readBytes(10);
              this.imageData = new ImageData(this._io, this, this._root);
            };
            return V612;
          })();
          var UnitFloatValue = Abr3.UnitFloatValue = (function() {
            function UnitFloatValue2(_io, _parent, _root) {
              this._io = _io;
              this._parent = _parent;
              this._root = _root || this;
              this._read();
            }
            UnitFloatValue2.prototype._read = function() {
              this.unit = this._io.readU4be();
              this.value = this._io.readF8be();
            };
            return UnitFloatValue2;
          })();
          return Abr3;
        })();
        return Abr2;
      });
    }
  });

  // poc/abr-tools/node_modules/spectral.js/spectral.js
  var require_spectral = __commonJS({
    "poc/abr-tools/node_modules/spectral.js/spectral.js"(exports, module) {
      (function(global, factory) {
        typeof exports === "object" && typeof module !== "undefined" ? factory(exports) : typeof define === "function" && define.amd ? define(["exports"], factory) : (global = global || self, factory(global.spectral = {}));
      })(exports, function(exports2) {
        "use strict";
        const SIZE = 38;
        const GAMMA = 2.4;
        class Color {
          /**
           * Create a Color instance.
           *
           * The constructor accepts either:
           * - A single string value (interpreted as a CSS color: hex or rgb).
           * - A single array:
           *   - If its length equals SIZE, it is assumed to be the R values.
           *   - Otherwise, it is assumed to be an sRGB array.
           *
           * @constructor
           * @param {...(string|number[])} args - A single color string or an array of numbers.
           */
          constructor(...args) {
            if (args.length === 1) {
              if (typeof args[0] === "string") {
                this.sRGB = parse(args[0]).slice(0, 3);
                this.lRGB = sRGB_to_lRGB(this.sRGB);
                this.R = lRGB_to_R(this.lRGB);
                this.XYZ = R_to_XYZ(this.R);
              }
              if (Array.isArray(args[0])) {
                if (args[0].length === SIZE) {
                  this.R = args[0];
                  this.XYZ = R_to_XYZ(this.R);
                  this.lRGB = XYZ_to_lRGB(this.XYZ);
                  this.sRGB = lRGB_to_sRGB(this.lRGB);
                } else {
                  this.sRGB = args[0];
                  this.lRGB = sRGB_to_lRGB(this.sRGB);
                  this.R = lRGB_to_R(this.lRGB);
                  this.XYZ = R_to_XYZ(this.R);
                }
              }
            }
          }
          /**
           * Gets the OKLab color space representation.
           *
           * @type {number[]}
           * @readonly
           */
          get OKLab() {
            return this._OKLab ??= XYZ_to_OKLab(this.XYZ);
          }
          /**
           * Gets the OKLCh color space representation.
           *
           * @type {number[]}
           * @readonly
           */
          get OKLCh() {
            return this._OKLCh ??= OKLab_to_OKLCh(this.OKLab);
          }
          /**
           * Gets the array of KS values computed from R.
           *
           * @type {number[]}
           * @readonly
           */
          get KS() {
            return this._KS ??= this.R.map((r) => KS(r));
          }
          /**
           * Gets the luminance value.
           *
           * The value is at least Number.EPSILON.
           *
           * @type {number}
           * @readonly
           */
          get luminance() {
            return this._luminance ??= Math.max(Number.EPSILON, this.XYZ[1]);
          }
          /**
           * Gets the tinting strength.
           *
           * Default value is 1.
           *
           * @type {number}
           */
          get tintingStrength() {
            return this._tintingStrength ??= 1;
          }
          /**
           * Sets the tinting strength.
           *
           * @param {number} ts - The new tinting strength.
           */
          set tintingStrength(ts) {
            this._tintingStrength = ts;
          }
          /**
           * Determines whether the color is in gamut based on its linear RGB values.
           *
           * @param {Object} [options={}] - Options for gamut checking.
           * @param {number} [options.epsilon=0] - The tolerance for checking.
           * @return {boolean} True if in gamut; otherwise, false.
           */
          inGamut = ({ epsilon = 0 } = {}) => {
            return inGamut(this.lRGB, epsilon);
          };
          /**
           * Maps the color to a valid gamut using a specified method.
           *
           * @param {Object} [options={}] - Options for gamut mapping.
           * @param {string} [options.method='map'] - Method to use ('clip' or 'map').
           * @return {Color} A new Color instance that is in gamut.
           * @throws {TypeError} If the specified method is unknown.
           */
          toGamut = ({ method = "map" } = {}) => {
            switch (method.toLowerCase()) {
              case "clip":
                return new Color(this.sRGB.map((x2) => utils.clamp(x2, 0, 255)));
              case "map":
                return gamutMap(this);
              default:
                throw new TypeError(`Unknown method: '${method}'`);
            }
          };
          /**
           * Converts the color to a string representation.
           *
           * The color is first mapped into the gamut before converting.
           *
           * @param {Object} [options={}] - Options for conversion.
           * @param {string} [options.format='hex'] - Output format. Currently supports 'hex'.
           * @param {string} [options.method='map'] - Gamut mapping method ('clip' or 'map').
           * @return {string} The color as a string.
           * @throws {TypeError} If the specified method is unknown.
           * @throws {TypeError} If the specified format is unknown.
           */
          toString = ({ format = "hex", method = "map" } = {}) => {
            let sRGB;
            if (!this.inGamut()) {
              switch (method.toLowerCase()) {
                case "clip":
                  sRGB = this.sRGB.map((x2) => utils.clamp(x2, 0, 255));
                  break;
                case "map":
                  sRGB = gamutMap(this).sRGB;
                  break;
                default:
                  throw new TypeError(`Unknown method: '${method}'`);
              }
            } else {
              sRGB = this.sRGB;
            }
            switch (format.toLowerCase()) {
              case "hex":
                return `#${sRGB.map((x2) => x2.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
              case "rgb":
                return `rgb(${sRGB.join(", ")})`;
              default:
                throw new TypeError(`Unknown format: '${format}'`);
            }
          };
        }
        const inGamut = (lRGB, { epsilon = 0 } = {}) => {
          return lRGB.every((x2) => x2 >= -epsilon && x2 <= 1 + epsilon);
        };
        const deltaEOK = (OKLab1, OKLab2) => {
          let [L1, a1, b1] = OKLab1;
          let [L2, a2, b2] = OKLab2;
          return ((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2) ** 0.5;
        };
        const gamutMap = (color, { jnd = 0.03, e = 1e-4 } = {}) => {
          let L = color.OKLCh[0];
          if (L >= 1) {
            return new Color([255, 255, 255]);
          }
          if (L <= 0) {
            return new Color([0, 0, 0]);
          }
          if (inGamut(color.lRGB)) return color;
          let h = color.OKLCh[2];
          let min = 0;
          let max = color.OKLCh[1];
          let min_inGamut = true;
          let current = color.lRGB;
          let clipped = lRGB_to_OKLab(current.map((x2) => utils.clamp(x2)));
          let E = deltaEOK(clipped, lRGB_to_OKLab(current));
          if (E < jnd) {
            return new Color(lRGB_to_sRGB(XYZ_to_lRGB(OKLab_to_XYZ(clipped))));
          }
          while (max - min > e) {
            const chroma = (min + max) / 2;
            let OKLab = OKLCh_to_OKLab([L, chroma, h]);
            let XYZ = OKLab_to_XYZ(OKLab);
            current = XYZ_to_lRGB(XYZ);
            if (min_inGamut && inGamut(current)) {
              min = chroma;
            } else {
              clipped = lRGB_to_OKLab(current.map((x2) => utils.clamp(x2)));
              E = deltaEOK(clipped, OKLab);
              if (E < jnd) {
                if (jnd - E < e) {
                  break;
                } else {
                  min_inGamut = false;
                  min = chroma;
                }
              } else {
                max = chroma;
              }
            }
          }
          return new Color(lRGB_to_sRGB(XYZ_to_lRGB(OKLab_to_XYZ(clipped))));
        };
        const KS = (R) => {
          return (1 - R) ** 2 / (2 * R);
        };
        const KM = (KS2) => {
          return 1 + KS2 - (KS2 ** 2 + 2 * KS2) ** 0.5;
        };
        const mix = (...colors) => {
          let R = new Array(SIZE);
          for (let i2 = 0; i2 < SIZE; i2++) {
            let ksMix = 0, totalConcentration = 0;
            for (let [color, factor] of colors) {
              let concentration = factor ** 2 * color.tintingStrength ** 2 * color.luminance;
              totalConcentration += concentration;
              ksMix += color.KS[i2] * concentration;
            }
            R[i2] = KM(ksMix / totalConcentration);
          }
          return new Color(R);
        };
        const palette = (a, b, size) => {
          let p = new Array(size);
          for (let i2 = 0; i2 < size; i2++) {
            p[i2] = mix([a, size - 1 - i2], [b, i2]);
          }
          return p;
        };
        const gradient = (t, ...colors) => {
          let a = null, b = null;
          for (const [color, pos] of colors) {
            if (pos <= t && (!a || pos > a[1])) a = [color, pos];
            if (pos >= t && (!b || pos < b[1])) b = [color, pos];
          }
          if (!a) return b[0];
          if (!b) return a[0];
          if (a[1] === b[1]) return a[0];
          const factor = (t - a[1]) / (b[1] - a[1]);
          return mix([a[0], 1 - factor], [b[0], factor]);
        };
        const uncompand = (x2) => {
          return x2 > 0.04045 ? ((x2 + 0.055) / 1.055) ** GAMMA : x2 / 12.92;
        };
        const compand = (x2) => {
          return x2 > 31308e-7 ? 1.055 * x2 ** (1 / GAMMA) - 0.055 : x2 * 12.92;
        };
        const sRGB_to_lRGB = (sRGB) => {
          return sRGB.map((x2) => uncompand(x2 / 255));
        };
        const lRGB_to_sRGB = (lRGB) => {
          return lRGB.map((x2) => Math.round(compand(x2) * 255));
        };
        const XYZ_to_lRGB = (XYZ) => {
          return utils.mulMatVec(CONVERSION.XYZ_RGB, XYZ);
        };
        const lRGB_to_XYZ = (lRGB) => {
          return utils.mulMatVec(CONVERSION.RGB_XYZ, lRGB);
        };
        const lRGB_to_OKLab = (lRGB) => {
          return XYZ_to_OKLab(lRGB_to_XYZ(lRGB));
        };
        const XYZ_to_OKLab = (XYZ) => {
          let lms = utils.mulMatVec(CONVERSION.XYZ_LMS, XYZ).map((x2) => Math.cbrt(x2));
          return utils.mulMatVec(CONVERSION.LMS_LAB, lms);
        };
        const OKLab_to_XYZ = (OKLab) => {
          let lms = utils.mulMatVec(CONVERSION.LAB_LMS, OKLab).map((x2) => x2 ** 3);
          return utils.mulMatVec(CONVERSION.LMS_XYZ, lms);
        };
        const OKLab_to_OKLCh = (OKLab) => {
          let [L, a, b] = OKLab;
          const C = (a * a + b * b) ** 0.5;
          const h = Math.atan2(b, a) * 180 / Math.PI;
          return [L, C, h >= 0 ? h : h + 360];
        };
        const OKLCh_to_OKLab = (OKLCh) => {
          let [L, C, h] = OKLCh;
          let a = C * Math.cos(h * Math.PI / 180);
          let b = C * Math.sin(h * Math.PI / 180);
          return [L, a, b];
        };
        const R_to_XYZ = (R) => {
          return utils.mulMatVec(CIE.CMF, R);
        };
        const lRGB_to_R = (lRGB) => {
          let w = Math.min(...lRGB);
          lRGB = [lRGB[0] - w, lRGB[1] - w, lRGB[2] - w];
          let c = Math.min(lRGB[1], lRGB[2]);
          let m = Math.min(lRGB[0], lRGB[2]);
          let y = Math.min(lRGB[0], lRGB[1]);
          let r = Math.max(0, Math.min(lRGB[0] - lRGB[2], lRGB[0] - lRGB[1]));
          let g = Math.max(0, Math.min(lRGB[1] - lRGB[2], lRGB[1] - lRGB[0]));
          let b = Math.max(0, Math.min(lRGB[2] - lRGB[1], lRGB[2] - lRGB[0]));
          const R = new Array(SIZE);
          for (let i2 = 0; i2 < SIZE; i2++) {
            R[i2] = Math.max(
              Number.EPSILON,
              w * BASE_SPECTRA.W[i2] + c * BASE_SPECTRA.C[i2] + m * BASE_SPECTRA.M[i2] + y * BASE_SPECTRA.Y[i2] + r * BASE_SPECTRA.R[i2] + g * BASE_SPECTRA.G[i2] + b * BASE_SPECTRA.B[i2]
            );
          }
          return R;
        };
        const utils = {
          /**
           * Linear interpolation between two values.
           *
           * @param {number} a - Start value.
           * @param {number} b - End value.
           * @param {number} t - Interpolation factor in [0,1].
           * @return {number} The interpolated value.
           */
          lerp: (a, b, t) => a + (b - a) * t,
          /**
           * Clamps a value between a minimum and maximum.
           *
           * @param {number} x - The value to clamp.
           * @param {number} [min=0] - Minimum allowed value.
           * @param {number} [max=1] - Maximum allowed value.
           * @return {number} The clamped value.
           */
          clamp: (x2, min = 0, max = 1) => Math.min(Math.max(x2, min), max),
          /**
           * Calculates the dot product between two arrays of numbers.
           *
           * @param {number[]} a - First vector.
           * @param {number[]} b - Second vector.
           * @return {number} The dot product.
           */
          dot: (a, b) => a.reduce((acc, val, i2) => acc + val * b[i2], 0),
          /**
           * Multiplies a matrix with a vector.
           *
           * @param {number[][]} m - The matrix.
           * @param {number[]} v - The vector.
           * @return {number[]} The resulting vector.
           */
          mulMatVec: (m, v) => m.map((row) => utils.dot(row, v))
        };
        const parse = (str) => {
          if (str[0] === "#") {
            str = str.length === 4 ? str.replace(/./g, (m) => m + m).slice(1) : str.slice(1);
            return [
              parseInt(str.substring(0, 2), 16),
              parseInt(str.substring(2, 4), 16),
              parseInt(str.substring(4, 6), 16),
              str.length === 8 ? parseInt(str.substring(6, 8), 16) / 255 : 1
            ];
          } else if (str.startsWith("rgb")) {
            return str.slice(str.indexOf("(") + 1, -1).split(",").map((v, i2) => i2 < 3 && v.includes("%") ? Math.round(parseFloat(v) * 2.55) : parseFloat(v));
          }
          return NaN;
        };
        const BASE_SPECTRA = Object.freeze({
          W: [
            1.00116072718764,
            1.00116065159728,
            1.00116031922747,
            1.00115867270789,
            1.00115259844552,
            1.00113252528998,
            1.00108500663327,
            1.00099687889453,
            1.00086525152274,
            1.0006962900094,
            1.00050496114888,
            1.00030808187992,
            1.00011966602013,
            0.999952765968407,
            0.999821836899297,
            0.999738609557593,
            0.999709551639612,
            0.999731930210627,
            0.999799436346195,
            0.999900330316671,
            1.00002040652611,
            1.00014478793658,
            1.00025997903412,
            1.00035579697089,
            1.00042753780269,
            1.00047623344888,
            1.00050720967508,
            1.00052519156373,
            1.00053509606896,
            1.00054022097482,
            1.00054272816784,
            1.00054389569087,
            1.00054448212151,
            1.00054476959992,
            1.00054489887762,
            1.00054496254689,
            1.00054498927058,
            1.000544996993
          ],
          C: [
            0.970585001322962,
            0.970592498143425,
            0.970625348729891,
            0.970786806119017,
            0.971368673228248,
            0.973163230621252,
            0.976740223158765,
            0.981587605491377,
            0.986280265652949,
            0.989949147689134,
            0.99249270153842,
            0.994145680405256,
            0.995183975033212,
            0.995756750110818,
            0.99591281828671,
            0.995606157834528,
            0.994597600961854,
            0.99221571549237,
            0.986236452783249,
            0.967943337264541,
            0.891285004244943,
            0.536202477862053,
            0.154108119001878,
            0.0574575093228929,
            0.0315349873107007,
            0.0222633920086335,
            0.0182022841492439,
            0.016299055973264,
            0.0153656239334613,
            0.0149111568733976,
            0.0146954339898235,
            0.0145964146717719,
            0.0145470156699655,
            0.0145228771899495,
            0.0145120341118965,
            0.0145066940939832,
            0.0145044507314479,
            0.0145038009464639
          ],
          M: [
            0.990673557319988,
            0.990671524961979,
            0.990662582353421,
            0.990618107644795,
            0.99045148087871,
            0.989871081400204,
            0.98828660875964,
            0.984290692797504,
            0.973934905625306,
            0.941817838460145,
            0.817390326195156,
            0.432472805065729,
            0.13845397825887,
            0.0537347216940033,
            0.0292174996673231,
            0.021313651750859,
            0.0201349530181136,
            0.0241323096280662,
            0.0372236145223627,
            0.0760506552706601,
            0.205375471942399,
            0.541268903460439,
            0.815841685086486,
            0.912817704123976,
            0.946339830166962,
            0.959927696331991,
            0.966260595230312,
            0.969325970058424,
            0.970854536721399,
            0.971605066528128,
            0.971962769757392,
            0.972127272274509,
            0.972209417745812,
            0.972249577678424,
            0.972267621998742,
            0.97227650946215,
            0.972280243306874,
            0.97228132482656
          ],
          Y: [
            0.0210523371789306,
            0.0210564627517414,
            0.0210746178695038,
            0.0211649058448753,
            0.0215027957272504,
            0.0226738799041561,
            0.0258235649693629,
            0.0334879385639851,
            0.0519069663740307,
            0.100749014833473,
            0.239129899706847,
            0.534804312272748,
            0.79780757864303,
            0.911449894067384,
            0.953797963004507,
            0.971241615465429,
            0.979303123807588,
            0.983380119507575,
            0.985461246567755,
            0.986435046976605,
            0.986738250670141,
            0.986617882445032,
            0.986277776758643,
            0.985860592444056,
            0.98547492767621,
            0.985176934765558,
            0.984971574014181,
            0.984846303415712,
            0.984775351811199,
            0.984738066625265,
            0.984719648311765,
            0.984711023391939,
            0.984706683300676,
            0.984704554393091,
            0.98470359630937,
            0.984703124077552,
            0.98470292561509,
            0.984702868122795
          ],
          R: [
            0.0315605737777207,
            0.0315520718330149,
            0.0315148215513658,
            0.0313318044982702,
            0.0306729857725527,
            0.0286480476989607,
            0.0246450407045709,
            0.0192960753663651,
            0.0142066612220556,
            0.0102942608878609,
            0.0076191460521811,
            0.005898041083542,
            0.0048233247781713,
            0.0042298748350633,
            0.0040599171299341,
            0.0043533695594676,
            0.0053434425970201,
            0.0076917201010463,
            0.0135969795736536,
            0.0316975442661115,
            0.107861196355249,
            0.463812603168704,
            0.847055405272011,
            0.943185409393918,
            0.968862150696558,
            0.978030667473603,
            0.982043643854306,
            0.983923623718707,
            0.984845484154382,
            0.985294275814596,
            0.985507295219825,
            0.985605071539837,
            0.985653849933578,
            0.985677685033883,
            0.985688391806122,
            0.985693664690031,
            0.985695879848205,
            0.985696521463762
          ],
          G: [
            0.0095560747554212,
            0.0095581580120851,
            0.0095673245444588,
            0.0096129126297349,
            0.0097837090401843,
            0.010378622705871,
            0.0120026452378567,
            0.0160977721473922,
            0.026706190223168,
            0.0595555440185881,
            0.186039826532826,
            0.570579820116159,
            0.861467768400292,
            0.945879089767658,
            0.970465486474305,
            0.97841363028445,
            0.979589031411224,
            0.975533536908632,
            0.962288755397813,
            0.92312157451312,
            0.793434018943111,
            0.459270135902429,
            0.185574103666303,
            0.0881774959955372,
            0.05436302287667,
            0.0406288447060719,
            0.034221520431697,
            0.0311185790956966,
            0.0295708898336134,
            0.0288108739348928,
            0.0284486271324597,
            0.0282820301724731,
            0.0281988376490237,
            0.0281581655342037,
            0.0281398910216386,
            0.0281308901665811,
            0.0281271086805816,
            0.0281260133612096
          ],
          B: [
            0.979404752502014,
            0.97940070684313,
            0.979382903470261,
            0.979294364945594,
            0.97896301460857,
            0.977814466694043,
            0.974724321133836,
            0.967198482343973,
            0.949079657530575,
            0.900850128940977,
            0.76315044546224,
            0.465922171649319,
            0.201263280451005,
            0.0877524413419623,
            0.0457176793291679,
            0.0284706050521843,
            0.020527176756985,
            0.0165302792310211,
            0.0145135107212858,
            0.0136003508637687,
            0.0133604258769571,
            0.013548894314568,
            0.0139594356366992,
            0.014443425575357,
            0.0148854440621406,
            0.0152254296999746,
            0.0154592848180209,
            0.0156018026485961,
            0.0156824871281936,
            0.0157248764360615,
            0.0157458108784121,
            0.0157556123350225,
            0.0157605443964911,
            0.0157629637515278,
            0.0157640525629106,
            0.015764589232951,
            0.0157648147772649,
            0.0157648801149616
          ]
        });
        const CIE = Object.freeze({
          CMF: [
            [
              646919989576e-16,
              2194098998132e-16,
              0.0011205743509343,
              0.0037666134117111,
              0.011880553603799,
              0.0232864424191771,
              0.0345594181969747,
              0.0372237901162006,
              0.0324183761091486,
              0.021233205609381,
              0.0104909907685421,
              0.0032958375797931,
              5070351633801e-16,
              9486742057141e-16,
              0.0062737180998318,
              0.0168646241897775,
              0.028689649025981,
              0.0426748124691731,
              0.0562547481311377,
              0.0694703972677158,
              0.0830531516998291,
              0.0861260963002257,
              0.0904661376847769,
              0.0850038650591277,
              0.0709066691074488,
              0.0506288916373645,
              0.035473961885264,
              0.0214682102597065,
              0.0125164567619117,
              0.0068045816390165,
              0.0034645657946526,
              0.0014976097506959,
              769700480928e-15,
              4073680581315e-16,
              1690104031614e-16,
              952245150365e-16,
              490309872958e-16,
              199961492222e-16
            ],
            [
              1844289444e-15,
              62053235865e-16,
              310096046799e-16,
              1047483849269e-16,
              3536405299538e-16,
              9514714056444e-16,
              0.0022822631748318,
              0.004207329043473,
              0.0066887983719014,
              0.0098883960193565,
              0.0152494514496311,
              0.0214183109449723,
              0.0334229301575068,
              0.0513100134918512,
              0.070402083939949,
              0.0878387072603517,
              0.0942490536184085,
              0.0979566702718931,
              0.0941521856862608,
              0.0867810237486753,
              0.0788565338632013,
              0.0635267026203555,
              0.05374141675682,
              0.042646064357412,
              0.0316173492792708,
              0.020885205921391,
              0.0138601101360152,
              0.0081026402038399,
              0.004630102258803,
              0.0024913800051319,
              0.0012593033677378,
              541646522168e-15,
              2779528920067e-16,
              1471080673854e-16,
              610327472927e-16,
              343873229523e-16,
              177059860053e-16,
              7220974913e-15
            ],
            [
              305017147638e-15,
              0.0010368066663574,
              0.0053131363323992,
              0.0179543925899536,
              0.0570775815345485,
              0.113651618936287,
              0.17335872618355,
              0.196206575558657,
              0.186082370706296,
              0.139950475383207,
              0.0891745294268649,
              0.0478962113517075,
              0.0281456253957952,
              0.0161376622950514,
              0.0077591019215214,
              0.0042961483736618,
              0.0020055092122156,
              8614711098802e-16,
              3690387177652e-16,
              1914287288574e-16,
              1495555858975e-16,
              923109285104e-16,
              681349182337e-16,
              288263655696e-16,
              157671820553e-16,
              39406041027e-16,
              1584012587e-15,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0,
              0
            ]
          ]
        });
        const CONVERSION = Object.freeze({
          //sRGB <-> XYZ conversion matrices
          RGB_XYZ: [
            [0.41239079926595934, 0.357584339383878, 0.1804807884018343],
            [0.21263900587151027, 0.715168678767756, 0.07219231536073371],
            [0.01933081871559182, 0.11919477979462598, 0.9505321522496607]
          ],
          XYZ_RGB: [
            [3.2409699419045226, -1.537383177570094, -0.4986107602930034],
            [-0.9692436362808796, 1.8759675015077202, 0.04155505740717559],
            [0.05563007969699366, -0.20397695888897652, 1.0569715142428786]
          ],
          // OKLab conversion matrices
          XYZ_LMS: [
            [0.819022437996703, 0.3619062600528904, -0.1288737815209879],
            [0.0329836539323885, 0.9292868615863434, 0.0361446663506424],
            [0.0481771893596242, 0.2642395317527308, 0.6335478284694309]
          ],
          LMS_XYZ: [
            [1.2268798758459243, -0.5578149944602171, 0.2813910456659647],
            [-0.0405757452148008, 1.112286803280317, -0.0717110580655164],
            [-0.0763729366746601, -0.4214933324022432, 1.5869240198367816]
          ],
          LMS_LAB: [
            [0.210454268309314, 0.7936177747023054, -0.0040720430116193],
            [1.9779985324311684, -2.42859224204858, 0.450593709617411],
            [0.0259040424655478, 0.7827717124575296, -0.8086757549230774]
          ],
          LAB_LMS: [
            [1, 0.3963377773761749, 0.2158037573099136],
            [1, -0.1055613458156586, -0.0638541728258133],
            [1, -0.0894841775298119, -1.2914855480194092]
          ]
        });
        exports2.Color = Color;
        exports2.mix = mix;
        exports2.palette = palette;
        exports2.gradient = gradient;
      });
    }
  });

  // poc/abr-tools/entry.js
  var entry_exports = {};
  __export(entry_exports, {
    AbrBrushFile: () => AbrBrushFile,
    spectral: () => spectral
  });

  // poc/abr-tools/vendor/AbrBrushFile.js
  var import_KaitaiStream = __toESM(require_KaitaiStream());
  var import_Abr = __toESM(require_Abr());

  // poc/abr-tools/node_modules/fflate/esm/index.mjs
  var import_module = __require("module");
  var require2 = (0, import_module.createRequire)("/");
  var _a;
  var Worker;
  var isMarkedAsUntransferable;
  try {
    _a = require2("worker_threads"), Worker = _a.Worker, isMarkedAsUntransferable = _a.isMarkedAsUntransferable;
  } catch (e) {
  }
  var u8 = Uint8Array;
  var u16 = Uint16Array;
  var i32 = Int32Array;
  var fleb = new u8([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    2,
    2,
    2,
    2,
    3,
    3,
    3,
    3,
    4,
    4,
    4,
    4,
    5,
    5,
    5,
    5,
    0,
    /* unused */
    0,
    0,
    /* impossible */
    0
  ]);
  var fdeb = new u8([
    0,
    0,
    0,
    0,
    1,
    1,
    2,
    2,
    3,
    3,
    4,
    4,
    5,
    5,
    6,
    6,
    7,
    7,
    8,
    8,
    9,
    9,
    10,
    10,
    11,
    11,
    12,
    12,
    13,
    13,
    /* unused */
    0,
    0
  ]);
  var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var freb = function(eb, start) {
    var b = new u16(31);
    for (var i2 = 0; i2 < 31; ++i2) {
      b[i2] = start += 1 << eb[i2 - 1];
    }
    var r = new i32(b[30]);
    for (var i2 = 1; i2 < 30; ++i2) {
      for (var j = b[i2]; j < b[i2 + 1]; ++j) {
        r[j] = j - b[i2] << 5 | i2;
      }
    }
    return { b, r };
  };
  var _a = freb(fleb, 2);
  var fl = _a.b;
  var revfl = _a.r;
  fl[28] = 258, revfl[258] = 28;
  var _b = freb(fdeb, 0);
  var fd = _b.b;
  var revfd = _b.r;
  var rev = new u16(32768);
  for (i = 0; i < 32768; ++i) {
    x = (i & 43690) >> 1 | (i & 21845) << 1;
    x = (x & 52428) >> 2 | (x & 13107) << 2;
    x = (x & 61680) >> 4 | (x & 3855) << 4;
    rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
  }
  var x;
  var i;
  var hMap = (function(cd, mb, r) {
    var s = cd.length;
    var i2 = 0;
    var l = new u16(mb);
    for (; i2 < s; ++i2) {
      if (cd[i2])
        ++l[cd[i2] - 1];
    }
    var le = new u16(mb);
    for (i2 = 1; i2 < mb; ++i2) {
      le[i2] = le[i2 - 1] + l[i2 - 1] << 1;
    }
    var co;
    if (r) {
      co = new u16(1 << mb);
      var rvb = 15 - mb;
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          var sv = i2 << 4 | cd[i2];
          var r_1 = mb - cd[i2];
          var v = le[cd[i2] - 1]++ << r_1;
          for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
            co[rev[v] >> rvb] = sv;
          }
        }
      }
    } else {
      co = new u16(s);
      for (i2 = 0; i2 < s; ++i2) {
        if (cd[i2]) {
          co[i2] = rev[le[cd[i2] - 1]++] >> 15 - cd[i2];
        }
      }
    }
    return co;
  });
  var flt = new u8(288);
  for (i = 0; i < 144; ++i)
    flt[i] = 8;
  var i;
  for (i = 144; i < 256; ++i)
    flt[i] = 9;
  var i;
  for (i = 256; i < 280; ++i)
    flt[i] = 7;
  var i;
  for (i = 280; i < 288; ++i)
    flt[i] = 8;
  var i;
  var fdt = new u8(32);
  for (i = 0; i < 32; ++i)
    fdt[i] = 5;
  var i;
  var flm = /* @__PURE__ */ hMap(flt, 9, 0);
  var fdm = /* @__PURE__ */ hMap(fdt, 5, 0);
  var shft = function(p) {
    return (p + 7) / 8 | 0;
  };
  var slc = function(v, s, e) {
    if (s == null || s < 0)
      s = 0;
    if (e == null || e > v.length)
      e = v.length;
    return new u8(v.subarray(s, e));
  };
  var wbits = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
  };
  var wbits16 = function(d, p, v) {
    v <<= p & 7;
    var o = p / 8 | 0;
    d[o] |= v;
    d[o + 1] |= v >> 8;
    d[o + 2] |= v >> 16;
  };
  var hTree = function(d, mb) {
    var t = [];
    for (var i2 = 0; i2 < d.length; ++i2) {
      if (d[i2])
        t.push({ s: i2, f: d[i2] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
      return { t: et, l: 0 };
    if (s == 1) {
      var v = new u8(t[0].s + 1);
      v[t[0].s] = 1;
      return { t: v, l: 1 };
    }
    t.sort(function(a, b) {
      return a.f - b.f;
    });
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i22 = 2;
    t[0] = { s: -1, f: l.f + r.f, l, r };
    while (i1 != s - 1) {
      l = t[t[i0].f < t[i22].f ? i0++ : i22++];
      r = t[i0 != i1 && t[i0].f < t[i22].f ? i0++ : i22++];
      t[i1++] = { s: -1, f: l.f + r.f, l, r };
    }
    var maxSym = t2[0].s;
    for (var i2 = 1; i2 < s; ++i2) {
      if (t2[i2].s > maxSym)
        maxSym = t2[i2].s;
    }
    var tr = new u16(maxSym + 1);
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
      var i2 = 0, dt = 0;
      var lft = mbt - mb, cst = 1 << lft;
      t2.sort(function(a, b) {
        return tr[b.s] - tr[a.s] || a.f - b.f;
      });
      for (; i2 < s; ++i2) {
        var i2_1 = t2[i2].s;
        if (tr[i2_1] > mb) {
          dt += cst - (1 << mbt - tr[i2_1]);
          tr[i2_1] = mb;
        } else
          break;
      }
      dt >>= lft;
      while (dt > 0) {
        var i2_2 = t2[i2].s;
        if (tr[i2_2] < mb)
          dt -= 1 << mb - tr[i2_2]++ - 1;
        else
          ++i2;
      }
      for (; i2 >= 0 && dt; --i2) {
        var i2_3 = t2[i2].s;
        if (tr[i2_3] == mb) {
          --tr[i2_3];
          ++dt;
        }
      }
      mbt = mb;
    }
    return { t: new u8(tr), l: mbt };
  };
  var ln = function(n, l, d) {
    return n.s == -1 ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1)) : l[n.s] = d;
  };
  var lc = function(c) {
    var s = c.length;
    while (s && !c[--s])
      ;
    var cl = new u16(++s);
    var cli = 0, cln = c[0], cls = 1;
    var w = function(v) {
      cl[cli++] = v;
    };
    for (var i2 = 1; i2 <= s; ++i2) {
      if (c[i2] == cln && i2 != s)
        ++cls;
      else {
        if (!cln && cls > 2) {
          for (; cls > 138; cls -= 138)
            w(32754);
          if (cls > 2) {
            w(cls > 10 ? cls - 11 << 5 | 28690 : cls - 3 << 5 | 12305);
            cls = 0;
          }
        } else if (cls > 3) {
          w(cln), --cls;
          for (; cls > 6; cls -= 6)
            w(8304);
          if (cls > 2)
            w(cls - 3 << 5 | 8208), cls = 0;
        }
        while (cls--)
          w(cln);
        cls = 1;
        cln = c[i2];
      }
    }
    return { c: cl.subarray(0, cli), n: s };
  };
  var clen = function(cf, cl) {
    var l = 0;
    for (var i2 = 0; i2 < cl.length; ++i2)
      l += cf[i2] * cl[i2];
    return l;
  };
  var wfblk = function(out, pos, dat) {
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i2 = 0; i2 < s; ++i2)
      out[o + i2 + 4] = dat[i2];
    return (o + 4 + s) * 8;
  };
  var wblk = function(dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a2 = hTree(lf, 15), dlt = _a2.t, mlb = _a2.l;
    var _b2 = hTree(df, 15), ddt = _b2.t, mdb = _b2.l;
    var _c = lc(dlt), lclt = _c.c, nlc = _c.n;
    var _d = lc(ddt), lcdt = _d.c, ndc = _d.n;
    var lcfreq = new u16(19);
    for (var i2 = 0; i2 < lclt.length; ++i2)
      ++lcfreq[lclt[i2] & 31];
    for (var i2 = 0; i2 < lcdt.length; ++i2)
      ++lcfreq[lcdt[i2] & 31];
    var _e = hTree(lcfreq, 7), lct = _e.t, mlcb = _e.l;
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
      ;
    var flen = bl + 5 << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + 2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18];
    if (bs >= 0 && flen <= ftlen && flen <= dtlen)
      return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
      lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
      var llm = hMap(lct, mlcb, 0);
      wbits(out, p, nlc - 257);
      wbits(out, p + 5, ndc - 1);
      wbits(out, p + 10, nlcc - 4);
      p += 14;
      for (var i2 = 0; i2 < nlcc; ++i2)
        wbits(out, p + 3 * i2, lct[clim[i2]]);
      p += 3 * nlcc;
      var lcts = [lclt, lcdt];
      for (var it = 0; it < 2; ++it) {
        var clct = lcts[it];
        for (var i2 = 0; i2 < clct.length; ++i2) {
          var len = clct[i2] & 31;
          wbits(out, p, llm[len]), p += lct[len];
          if (len > 15)
            wbits(out, p, clct[i2] >> 5 & 127), p += clct[i2] >> 12;
        }
      }
    } else {
      lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i2 = 0; i2 < li; ++i2) {
      var sym = syms[i2];
      if (sym > 255) {
        var len = sym >> 18 & 31;
        wbits16(out, p, lm[len + 257]), p += ll[len + 257];
        if (len > 7)
          wbits(out, p, sym >> 23 & 31), p += fleb[len];
        var dst = sym & 31;
        wbits16(out, p, dm[dst]), p += dl[dst];
        if (dst > 3)
          wbits16(out, p, sym >> 5 & 8191), p += fdeb[dst];
      } else {
        wbits16(out, p, lm[sym]), p += ll[sym];
      }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
  };
  var deo = /* @__PURE__ */ new i32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
  var et = /* @__PURE__ */ new u8(0);
  var dflt = function(dat, lvl, plvl, pre, post, st) {
    var s = st.z || dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7e3)) + post);
    var w = o.subarray(pre, o.length - post);
    var lst = st.l;
    var pos = (st.r || 0) & 7;
    if (lvl) {
      if (pos)
        w[0] = st.r >> 3;
      var opt = deo[lvl - 1];
      var n = opt >> 13, c = opt & 8191;
      var msk_1 = (1 << plvl) - 1;
      var prev = st.p || new u16(32768), head = st.h || new u16(msk_1 + 1);
      var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
      var hsh = function(i3) {
        return (dat[i3] ^ dat[i3 + 1] << bs1_1 ^ dat[i3 + 2] << bs2_1) & msk_1;
      };
      var syms = new i32(25e3);
      var lf = new u16(288), df = new u16(32);
      var lc_1 = 0, eb = 0, i2 = st.i || 0, li = 0, wi = st.w || 0, bs = 0;
      for (; i2 + 2 < s; ++i2) {
        var hv = hsh(i2);
        var imod = i2 & 32767, pimod = head[hv];
        prev[imod] = pimod;
        head[hv] = imod;
        if (wi <= i2) {
          var rem = s - i2;
          if ((lc_1 > 7e3 || li > 24576) && (rem > 423 || !lst)) {
            pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i2 - bs, pos);
            li = lc_1 = eb = 0, bs = i2;
            for (var j = 0; j < 286; ++j)
              lf[j] = 0;
            for (var j = 0; j < 30; ++j)
              df[j] = 0;
          }
          var l = 2, d = 0, ch_1 = c, dif = imod - pimod & 32767;
          if (rem > 2 && hv == hsh(i2 - dif)) {
            var maxn = Math.min(n, rem) - 1;
            var maxd = Math.min(32767, i2);
            var ml = Math.min(258, rem);
            while (dif <= maxd && --ch_1 && imod != pimod) {
              if (dat[i2 + l] == dat[i2 + l - dif]) {
                var nl = 0;
                for (; nl < ml && dat[i2 + nl] == dat[i2 + nl - dif]; ++nl)
                  ;
                if (nl > l) {
                  l = nl, d = dif;
                  if (nl > maxn)
                    break;
                  var mmd = Math.min(dif, nl - 2);
                  var md = 0;
                  for (var j = 0; j < mmd; ++j) {
                    var ti = i2 - dif + j & 32767;
                    var pti = prev[ti];
                    var cd = ti - pti & 32767;
                    if (cd > md)
                      md = cd, pimod = ti;
                  }
                }
              }
              imod = pimod, pimod = prev[imod];
              dif += imod - pimod & 32767;
            }
          }
          if (d) {
            syms[li++] = 268435456 | revfl[l] << 18 | revfd[d];
            var lin = revfl[l] & 31, din = revfd[d] & 31;
            eb += fleb[lin] + fdeb[din];
            ++lf[257 + lin];
            ++df[din];
            wi = i2 + l;
            ++lc_1;
          } else {
            syms[li++] = dat[i2];
            ++lf[dat[i2]];
          }
        }
      }
      for (i2 = Math.max(i2, wi); i2 < s; ++i2) {
        syms[li++] = dat[i2];
        ++lf[dat[i2]];
      }
      pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i2 - bs, pos);
      if (!lst) {
        st.r = pos & 7 | w[pos / 8 | 0] << 3;
        pos -= 7;
        st.h = head, st.p = prev, st.i = i2, st.w = wi;
      }
    } else {
      for (var i2 = st.w || 0; i2 < s + lst; i2 += 65535) {
        var e = i2 + 65535;
        if (e >= s) {
          w[pos / 8 | 0] = lst;
          e = s;
        }
        pos = wfblk(w, pos + 1, dat.subarray(i2, e));
      }
      st.i = s;
    }
    return slc(o, 0, pre + shft(pos) + post);
  };
  var adler = function() {
    var a = 1, b = 0;
    return {
      p: function(d) {
        var n = a, m = b;
        var l = d.length | 0;
        for (var i2 = 0; i2 != l; ) {
          var e = Math.min(i2 + 2655, l);
          for (; i2 < e; ++i2)
            m += n += d[i2];
          n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
        }
        a = n, b = m;
      },
      d: function() {
        a %= 65521, b %= 65521;
        return (a & 255) << 24 | (a & 65280) << 8 | (b & 255) << 8 | b >> 8;
      }
    };
  };
  var dopt = function(dat, opt, pre, post, st) {
    if (!st) {
      st = { l: 1 };
      if (opt.dictionary) {
        var dict = opt.dictionary.subarray(-32768);
        var newDat = new u8(dict.length + dat.length);
        newDat.set(dict);
        newDat.set(dat, dict.length);
        dat = newDat;
        st.w = dict.length;
      }
    }
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? st.l ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : 20 : 12 + opt.mem, pre, post, st);
  };
  var wbytes = function(d, b, v) {
    for (; v; ++b)
      d[b] = v, v >>>= 8;
  };
  var zlh = function(c, o) {
    var lv = o.level, fl2 = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
    c[0] = 120, c[1] = fl2 << 6 | (o.dictionary && 32);
    c[1] |= 31 - (c[0] << 8 | c[1]) % 31;
    if (o.dictionary) {
      var h = adler();
      h.p(o.dictionary);
      wbytes(c, 2, h.d());
    }
  };
  function zlibSync(data, opts) {
    if (!opts)
      opts = {};
    var a = adler();
    a.p(data);
    var d = dopt(data, opts, opts.dictionary ? 6 : 2, 4);
    return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
  }
  var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
  var tds = 0;
  try {
    td.decode(et, { stream: true });
    tds = 1;
  } catch (e) {
  }

  // poc/abr-tools/node_modules/iobuffer/lib/text.js
  function decode(bytes, encoding = "utf8") {
    const decoder = new TextDecoder(encoding);
    return decoder.decode(bytes);
  }
  var encoder = new TextEncoder();
  function encode(str) {
    return encoder.encode(str);
  }

  // poc/abr-tools/node_modules/iobuffer/lib/iobuffer.js
  var defaultByteLength = 1024 * 8;
  var hostBigEndian = (() => {
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    return !((view[0] = 1) & array[0]);
  })();
  var typedArrays = {
    int8: globalThis.Int8Array,
    uint8: globalThis.Uint8Array,
    int16: globalThis.Int16Array,
    uint16: globalThis.Uint16Array,
    int32: globalThis.Int32Array,
    uint32: globalThis.Uint32Array,
    uint64: globalThis.BigUint64Array,
    int64: globalThis.BigInt64Array,
    float32: globalThis.Float32Array,
    float64: globalThis.Float64Array
  };
  var IOBuffer = class _IOBuffer {
    /**
     * Reference to the internal ArrayBuffer object.
     */
    buffer;
    /**
     * Byte length of the internal ArrayBuffer.
     */
    byteLength;
    /**
     * Byte offset of the internal ArrayBuffer.
     */
    byteOffset;
    /**
     * Byte length of the internal ArrayBuffer.
     */
    length;
    /**
     * The current offset of the buffer's pointer.
     */
    offset;
    lastWrittenByte;
    littleEndian;
    _data;
    _mark;
    _marks;
    /**
     * Create a new IOBuffer.
     * @param data - The data to construct the IOBuffer with.
     * If data is a number, it will be the new buffer's length<br>
     * If data is `undefined`, the buffer will be initialized with a default length of 8Kb<br>
     * If data is an ArrayBuffer, SharedArrayBuffer, an ArrayBufferView (Typed Array), an IOBuffer instance,
     * or a Node.js Buffer, a view will be created over the underlying ArrayBuffer.
     * @param options - An object for the options.
     * @returns A new IOBuffer instance.
     */
    constructor(data = defaultByteLength, options = {}) {
      let dataIsGiven = false;
      if (typeof data === "number") {
        data = new ArrayBuffer(data);
      } else {
        dataIsGiven = true;
        this.lastWrittenByte = data.byteLength;
      }
      const offset = options.offset ? options.offset >>> 0 : 0;
      const byteLength = data.byteLength - offset;
      let dvOffset = offset;
      if (ArrayBuffer.isView(data) || data instanceof _IOBuffer) {
        if (data.byteLength !== data.buffer.byteLength) {
          dvOffset = data.byteOffset + offset;
        }
        data = data.buffer;
      }
      if (dataIsGiven) {
        this.lastWrittenByte = byteLength;
      } else {
        this.lastWrittenByte = 0;
      }
      this.buffer = data;
      this.length = byteLength;
      this.byteLength = byteLength;
      this.byteOffset = dvOffset;
      this.offset = 0;
      this.littleEndian = true;
      this._data = new DataView(this.buffer, dvOffset, byteLength);
      this._mark = 0;
      this._marks = [];
    }
    /**
     * Checks if the memory allocated to the buffer is sufficient to store more
     * bytes after the offset.
     * @param byteLength - The needed memory in bytes.
     * @returns `true` if there is sufficient space and `false` otherwise.
     */
    available(byteLength = 1) {
      return this.offset + byteLength <= this.length;
    }
    /**
     * Check if little-endian mode is used for reading and writing multi-byte
     * values.
     * @returns `true` if little-endian mode is used, `false` otherwise.
     */
    isLittleEndian() {
      return this.littleEndian;
    }
    /**
     * Set little-endian mode for reading and writing multi-byte values.
     * @returns This.
     */
    setLittleEndian() {
      this.littleEndian = true;
      return this;
    }
    /**
     * Check if big-endian mode is used for reading and writing multi-byte values.
     * @returns `true` if big-endian mode is used, `false` otherwise.
     */
    isBigEndian() {
      return !this.littleEndian;
    }
    /**
     * Switches to big-endian mode for reading and writing multi-byte values.
     * @returns This.
     */
    setBigEndian() {
      this.littleEndian = false;
      return this;
    }
    /**
     * Move the pointer n bytes forward.
     * @param n - Number of bytes to skip.
     * @returns This.
     */
    skip(n = 1) {
      this.offset += n;
      return this;
    }
    /**
     * Move the pointer n bytes backward.
     * @param n - Number of bytes to move back.
     * @returns This.
     */
    back(n = 1) {
      this.offset -= n;
      return this;
    }
    /**
     * Move the pointer to the given offset.
     * @param offset - The offset to move to.
     * @returns This.
     */
    seek(offset) {
      this.offset = offset;
      return this;
    }
    /**
     * Store the current pointer offset.
     * @see {@link IOBuffer#reset}
     * @returns This.
     */
    mark() {
      this._mark = this.offset;
      return this;
    }
    /**
     * Move the pointer back to the last pointer offset set by mark.
     * @see {@link IOBuffer#mark}
     * @returns This.
     */
    reset() {
      this.offset = this._mark;
      return this;
    }
    /**
     * Push the current pointer offset to the mark stack.
     * @see {@link IOBuffer#popMark}
     * @returns This.
     */
    pushMark() {
      this._marks.push(this.offset);
      return this;
    }
    /**
     * Pop the last pointer offset from the mark stack, and set the current
     * pointer offset to the popped value.
     * @see {@link IOBuffer#pushMark}
     * @returns This.
     */
    popMark() {
      const offset = this._marks.pop();
      if (offset === void 0) {
        throw new Error("Mark stack empty");
      }
      this.seek(offset);
      return this;
    }
    /**
     * Move the pointer offset back to 0.
     * @returns This.
     */
    rewind() {
      this.offset = 0;
      return this;
    }
    /**
     * Make sure the buffer has sufficient memory to write a given byteLength at
     * the current pointer offset.
     * If the buffer's memory is insufficient, this method will create a new
     * buffer (a copy) with a length that is twice (byteLength + current offset).
     * @param byteLength - The needed memory in bytes.
     * @returns This.
     */
    ensureAvailable(byteLength = 1) {
      if (!this.available(byteLength)) {
        const lengthNeeded = this.offset + byteLength;
        const newLength = lengthNeeded * 2;
        const newArray = new Uint8Array(newLength);
        newArray.set(new Uint8Array(this.buffer));
        this.buffer = newArray.buffer;
        this.length = newLength;
        this.byteLength = newLength;
        this._data = new DataView(this.buffer);
      }
      return this;
    }
    /**
     * Read a byte and return false if the byte's value is 0, or true otherwise.
     * Moves pointer forward by one byte.
     * @returns The read boolean.
     */
    readBoolean() {
      return this.readUint8() !== 0;
    }
    /**
     * Read a signed 8-bit integer and move pointer forward by 1 byte.
     * @returns The read byte.
     */
    readInt8() {
      return this._data.getInt8(this.offset++);
    }
    /**
     * Read an unsigned 8-bit integer and move pointer forward by 1 byte.
     * @returns The read byte.
     */
    readUint8() {
      return this._data.getUint8(this.offset++);
    }
    /**
     * Alias for {@link IOBuffer#readUint8}.
     * @returns The read byte.
     */
    readByte() {
      return this.readUint8();
    }
    /**
     * Read `n` bytes and move pointer forward by `n` bytes.
     * @param n - Number of bytes to read.
     * @returns The read bytes.
     */
    readBytes(n = 1) {
      return this.readArray(n, "uint8");
    }
    /**
     * Creates an array of corresponding to the type `type` and size `size`.
     * For example, type `uint8` will create a `Uint8Array`.
     * @param size - size of the resulting array
     * @param type - number type of elements to read
     * @returns The read array.
     */
    readArray(size, type) {
      const bytes = typedArrays[type].BYTES_PER_ELEMENT * size;
      const offset = this.byteOffset + this.offset;
      const slice = this.buffer.slice(offset, offset + bytes);
      if (this.littleEndian === hostBigEndian && type !== "uint8" && type !== "int8") {
        const slice2 = new Uint8Array(this.buffer.slice(offset, offset + bytes));
        slice2.reverse();
        const returnArray2 = new typedArrays[type](slice2.buffer);
        this.offset += bytes;
        returnArray2.reverse();
        return returnArray2;
      }
      const returnArray = new typedArrays[type](slice);
      this.offset += bytes;
      return returnArray;
    }
    /**
     * Read a 16-bit signed integer and move pointer forward by 2 bytes.
     * @returns The read value.
     */
    readInt16() {
      const value = this._data.getInt16(this.offset, this.littleEndian);
      this.offset += 2;
      return value;
    }
    /**
     * Read a 16-bit unsigned integer and move pointer forward by 2 bytes.
     * @returns The read value.
     */
    readUint16() {
      const value = this._data.getUint16(this.offset, this.littleEndian);
      this.offset += 2;
      return value;
    }
    /**
     * Read a 32-bit signed integer and move pointer forward by 4 bytes.
     * @returns The read value.
     */
    readInt32() {
      const value = this._data.getInt32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    }
    /**
     * Read a 32-bit unsigned integer and move pointer forward by 4 bytes.
     * @returns The read value.
     */
    readUint32() {
      const value = this._data.getUint32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    }
    /**
     * Read a 32-bit floating number and move pointer forward by 4 bytes.
     * @returns The read value.
     */
    readFloat32() {
      const value = this._data.getFloat32(this.offset, this.littleEndian);
      this.offset += 4;
      return value;
    }
    /**
     * Read a 64-bit floating number and move pointer forward by 8 bytes.
     * @returns The read value.
     */
    readFloat64() {
      const value = this._data.getFloat64(this.offset, this.littleEndian);
      this.offset += 8;
      return value;
    }
    /**
     * Read a 64-bit signed integer number and move pointer forward by 8 bytes.
     * @returns The read value.
     */
    readBigInt64() {
      const value = this._data.getBigInt64(this.offset, this.littleEndian);
      this.offset += 8;
      return value;
    }
    /**
     * Read a 64-bit unsigned integer number and move pointer forward by 8 bytes.
     * @returns The read value.
     */
    readBigUint64() {
      const value = this._data.getBigUint64(this.offset, this.littleEndian);
      this.offset += 8;
      return value;
    }
    /**
     * Read a 1-byte ASCII character and move pointer forward by 1 byte.
     * @returns The read character.
     */
    readChar() {
      return String.fromCharCode(this.readInt8());
    }
    /**
     * Read `n` 1-byte ASCII characters and move pointer forward by `n` bytes.
     * @param n - Number of characters to read.
     * @returns The read characters.
     */
    readChars(n = 1) {
      let result = "";
      for (let i2 = 0; i2 < n; i2++) {
        result += this.readChar();
      }
      return result;
    }
    /**
     * Read the next `n` bytes, return a UTF-8 decoded string and move pointer
     * forward by `n` bytes.
     * @param n - Number of bytes to read.
     * @returns The decoded string.
     */
    readUtf8(n = 1) {
      return decode(this.readBytes(n));
    }
    /**
     * Read the next `n` bytes, return a string decoded with `encoding` and move pointer
     * forward by `n` bytes.
     * If no encoding is passed, the function is equivalent to @see {@link IOBuffer#readUtf8}
     * @param n - Number of bytes to read.
     * @param encoding - The encoding to use. Default is 'utf8'.
     * @returns The decoded string.
     */
    decodeText(n = 1, encoding = "utf8") {
      return decode(this.readBytes(n), encoding);
    }
    /**
     * Write 0xff if the passed value is truthy, 0x00 otherwise and move pointer
     * forward by 1 byte.
     * @param value - The value to write.
     * @returns This.
     */
    writeBoolean(value) {
      this.writeUint8(value ? 255 : 0);
      return this;
    }
    /**
     * Write `value` as an 8-bit signed integer and move pointer forward by 1 byte.
     * @param value - The value to write.
     * @returns This.
     */
    writeInt8(value) {
      this.ensureAvailable(1);
      this._data.setInt8(this.offset++, value);
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as an 8-bit unsigned integer and move pointer forward by 1
     * byte.
     * @param value - The value to write.
     * @returns This.
     */
    writeUint8(value) {
      this.ensureAvailable(1);
      this._data.setUint8(this.offset++, value);
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * An alias for {@link IOBuffer#writeUint8}.
     * @param value - The value to write.
     * @returns This.
     */
    writeByte(value) {
      return this.writeUint8(value);
    }
    /**
     * Write all elements of `bytes` as uint8 values and move pointer forward by
     * `bytes.length` bytes.
     * @param bytes - The array of bytes to write.
     * @returns This.
     */
    writeBytes(bytes) {
      this.ensureAvailable(bytes.length);
      for (let i2 = 0; i2 < bytes.length; i2++) {
        this._data.setUint8(this.offset++, bytes[i2]);
      }
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 16-bit signed integer and move pointer forward by 2
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeInt16(value) {
      this.ensureAvailable(2);
      this._data.setInt16(this.offset, value, this.littleEndian);
      this.offset += 2;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 16-bit unsigned integer and move pointer forward by 2
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeUint16(value) {
      this.ensureAvailable(2);
      this._data.setUint16(this.offset, value, this.littleEndian);
      this.offset += 2;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 32-bit signed integer and move pointer forward by 4
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeInt32(value) {
      this.ensureAvailable(4);
      this._data.setInt32(this.offset, value, this.littleEndian);
      this.offset += 4;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 32-bit unsigned integer and move pointer forward by 4
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeUint32(value) {
      this.ensureAvailable(4);
      this._data.setUint32(this.offset, value, this.littleEndian);
      this.offset += 4;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 32-bit floating number and move pointer forward by 4
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeFloat32(value) {
      this.ensureAvailable(4);
      this._data.setFloat32(this.offset, value, this.littleEndian);
      this.offset += 4;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 64-bit floating number and move pointer forward by 8
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeFloat64(value) {
      this.ensureAvailable(8);
      this._data.setFloat64(this.offset, value, this.littleEndian);
      this.offset += 8;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 64-bit signed bigint and move pointer forward by 8
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeBigInt64(value) {
      this.ensureAvailable(8);
      this._data.setBigInt64(this.offset, value, this.littleEndian);
      this.offset += 8;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write `value` as a 64-bit unsigned bigint and move pointer forward by 8
     * bytes.
     * @param value - The value to write.
     * @returns This.
     */
    writeBigUint64(value) {
      this.ensureAvailable(8);
      this._data.setBigUint64(this.offset, value, this.littleEndian);
      this.offset += 8;
      this._updateLastWrittenByte();
      return this;
    }
    /**
     * Write the charCode of `str`'s first character as an 8-bit unsigned integer
     * and move pointer forward by 1 byte.
     * @param str - The character to write.
     * @returns This.
     */
    writeChar(str) {
      return this.writeUint8(str.charCodeAt(0));
    }
    /**
     * Write the charCodes of all `str`'s characters as 8-bit unsigned integers
     * and move pointer forward by `str.length` bytes.
     * @param str - The characters to write.
     * @returns This.
     */
    writeChars(str) {
      for (let i2 = 0; i2 < str.length; i2++) {
        this.writeUint8(str.charCodeAt(i2));
      }
      return this;
    }
    /**
     * UTF-8 encode and write `str` to the current pointer offset and move pointer
     * forward according to the encoded length.
     * @param str - The string to write.
     * @returns This.
     */
    writeUtf8(str) {
      return this.writeBytes(encode(str));
    }
    /**
     * Export a Uint8Array view of the internal buffer.
     * The view starts at the byte offset and its length
     * is calculated to stop at the last written byte or the original length.
     * @returns A new Uint8Array view.
     */
    toArray() {
      return new Uint8Array(this.buffer, this.byteOffset, this.lastWrittenByte);
    }
    /**
     *  Get the total number of bytes written so far, regardless of the current offset.
     * @returns - Total number of bytes.
     */
    getWrittenByteLength() {
      return this.lastWrittenByte - this.byteOffset;
    }
    /**
     * Update the last written byte offset
     * @private
     */
    _updateLastWrittenByte() {
      if (this.offset > this.lastWrittenByte) {
        this.lastWrittenByte = this.offset;
      }
    }
  };

  // poc/abr-tools/node_modules/fast-png/lib/helpers/crc.js
  var crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 3988292384 ^ c >>> 1;
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c;
  }
  var initialCrc = 4294967295;
  function updateCrc(currentCrc, data, length) {
    let c = currentCrc;
    for (let n = 0; n < length; n++) {
      c = crcTable[(c ^ data[n]) & 255] ^ c >>> 8;
    }
    return c;
  }
  function crc(data, length) {
    return (updateCrc(initialCrc, data, length) ^ initialCrc) >>> 0;
  }
  function writeCrc(buffer, length) {
    buffer.writeUint32(crc(new Uint8Array(buffer.buffer, buffer.byteOffset + buffer.offset - length, length), length));
  }

  // poc/abr-tools/node_modules/fast-png/lib/helpers/decode_interlace_adam7.js
  var uint16 = new Uint16Array([255]);
  var uint8 = new Uint8Array(uint16.buffer);
  var osIsLittleEndian = uint8[0] === 255;

  // poc/abr-tools/node_modules/fast-png/lib/helpers/decode_interlace_null.js
  var uint162 = new Uint16Array([255]);
  var uint82 = new Uint8Array(uint162.buffer);
  var osIsLittleEndian2 = uint82[0] === 255;
  var empty = new Uint8Array(0);

  // poc/abr-tools/node_modules/fast-png/lib/helpers/signature.js
  var pngSignature = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
  function writeSignature(buffer) {
    buffer.writeBytes(pngSignature);
  }

  // poc/abr-tools/node_modules/fast-png/lib/helpers/text.js
  var textChunkName = "tEXt";
  var NULL = 0;
  var latin1Decoder = new TextDecoder("latin1");
  function validateKeyword(keyword) {
    validateLatin1(keyword);
    if (keyword.length === 0 || keyword.length > 79) {
      throw new Error("keyword length must be between 1 and 79");
    }
  }
  var latin1Regex = /^[\u0000-\u00FF]*$/;
  function validateLatin1(text) {
    if (!latin1Regex.test(text)) {
      throw new Error("invalid latin1 text");
    }
  }
  function encodetEXt(buffer, keyword, text) {
    validateKeyword(keyword);
    validateLatin1(text);
    const length = keyword.length + 1 + text.length;
    buffer.writeUint32(length);
    buffer.writeChars(textChunkName);
    buffer.writeChars(keyword);
    buffer.writeByte(NULL);
    buffer.writeChars(text);
    writeCrc(buffer, length + 4);
  }

  // poc/abr-tools/node_modules/fast-png/lib/internal_types.js
  var ColorType = {
    UNKNOWN: -1,
    GREYSCALE: 0,
    TRUECOLOUR: 2,
    INDEXED_COLOUR: 3,
    GREYSCALE_ALPHA: 4,
    TRUECOLOUR_ALPHA: 6
  };
  var CompressionMethod = {
    UNKNOWN: -1,
    DEFLATE: 0
  };
  var FilterMethod = {
    UNKNOWN: -1,
    ADAPTIVE: 0
  };
  var InterlaceMethod = {
    UNKNOWN: -1,
    NO_INTERLACE: 0,
    ADAM7: 1
  };

  // poc/abr-tools/node_modules/fast-png/lib/png_encoder.js
  var defaultZlibOptions = {
    level: 3
  };
  var PngEncoder = class extends IOBuffer {
    _png;
    _zlibOptions;
    _colorType;
    _interlaceMethod;
    constructor(data, options = {}) {
      super();
      this._colorType = ColorType.UNKNOWN;
      this._zlibOptions = { ...defaultZlibOptions, ...options.zlib };
      this._png = this._checkData(data);
      this._interlaceMethod = (options.interlace === "Adam7" ? InterlaceMethod.ADAM7 : InterlaceMethod.NO_INTERLACE) ?? InterlaceMethod.NO_INTERLACE;
      this.setBigEndian();
    }
    encode() {
      writeSignature(this);
      this.encodeIHDR();
      if (this._png.palette) {
        this.encodePLTE();
        if (this._png.palette[0].length === 4) {
          this.encodeTRNS();
        }
      }
      this.encodeData();
      if (this._png.text) {
        for (const [keyword, text] of Object.entries(this._png.text)) {
          encodetEXt(this, keyword, text);
        }
      }
      this.encodeIEND();
      return this.toArray();
    }
    // https://www.w3.org/TR/PNG/#11IHDR
    encodeIHDR() {
      this.writeUint32(13);
      this.writeChars("IHDR");
      this.writeUint32(this._png.width);
      this.writeUint32(this._png.height);
      this.writeByte(this._png.depth);
      this.writeByte(this._colorType);
      this.writeByte(CompressionMethod.DEFLATE);
      this.writeByte(FilterMethod.ADAPTIVE);
      this.writeByte(this._interlaceMethod);
      writeCrc(this, 17);
    }
    // https://www.w3.org/TR/PNG/#11IEND
    encodeIEND() {
      this.writeUint32(0);
      this.writeChars("IEND");
      writeCrc(this, 4);
    }
    encodePLTE() {
      const paletteLength = this._png.palette?.length * 3;
      this.writeUint32(paletteLength);
      this.writeChars("PLTE");
      for (const color of this._png.palette) {
        this.writeByte(color[0]);
        this.writeByte(color[1]);
        this.writeByte(color[2]);
      }
      writeCrc(this, 4 + paletteLength);
    }
    encodeTRNS() {
      const alpha = this._png.palette.filter((color) => {
        return color.at(-1) !== 255;
      });
      this.writeUint32(alpha.length);
      this.writeChars("tRNS");
      for (const el of alpha) {
        this.writeByte(el.at(-1));
      }
      writeCrc(this, 4 + alpha.length);
    }
    // https://www.w3.org/TR/PNG/#11IDAT
    encodeIDAT(data) {
      this.writeUint32(data.length);
      this.writeChars("IDAT");
      this.writeBytes(data);
      writeCrc(this, data.length + 4);
    }
    encodeData() {
      const { width, height, channels, depth, data } = this._png;
      const slotsPerLine = depth <= 8 ? Math.ceil(width * depth / 8) * channels : Math.ceil(width * depth / 8 * channels / 2);
      const newData = new IOBuffer().setBigEndian();
      let offset = 0;
      if (this._interlaceMethod === InterlaceMethod.NO_INTERLACE) {
        for (let i2 = 0; i2 < height; i2++) {
          newData.writeByte(0);
          if (depth === 16) {
            offset = writeDataUint16(data, newData, slotsPerLine, offset);
          } else {
            offset = writeDataBytes(data, newData, slotsPerLine, offset);
          }
        }
      } else if (this._interlaceMethod === InterlaceMethod.ADAM7) {
        offset = writeDataInterlaced(this._png, data, newData, offset);
      }
      const buffer = newData.toArray();
      const compressed = zlibSync(buffer, this._zlibOptions);
      this.encodeIDAT(compressed);
    }
    _checkData(data) {
      const { colorType, channels, depth } = getColorType(data, data.palette);
      const png = {
        width: checkInteger(data.width, "width"),
        height: checkInteger(data.height, "height"),
        channels,
        data: data.data,
        depth,
        text: data.text,
        palette: data.palette
      };
      this._colorType = colorType;
      const expectedSize = depth < 8 ? Math.ceil(png.width * depth / 8) * png.height * channels : png.width * png.height * channels;
      if (png.data.length !== expectedSize) {
        throw new RangeError(`wrong data size. Found ${png.data.length}, expected ${expectedSize}`);
      }
      return png;
    }
  };
  function checkInteger(value, name) {
    if (Number.isInteger(value) && value > 0) {
      return value;
    }
    throw new TypeError(`${name} must be a positive integer`);
  }
  function getColorType(data, palette) {
    const { channels = 4, depth = 8 } = data;
    if (channels !== 4 && channels !== 3 && channels !== 2 && channels !== 1) {
      throw new RangeError(`unsupported number of channels: ${channels}`);
    }
    const returnValue = {
      channels,
      depth,
      colorType: ColorType.UNKNOWN
    };
    switch (channels) {
      case 4:
        returnValue.colorType = ColorType.TRUECOLOUR_ALPHA;
        break;
      case 3:
        returnValue.colorType = ColorType.TRUECOLOUR;
        break;
      case 1:
        if (palette) {
          returnValue.colorType = ColorType.INDEXED_COLOUR;
        } else {
          returnValue.colorType = ColorType.GREYSCALE;
        }
        break;
      case 2:
        returnValue.colorType = ColorType.GREYSCALE_ALPHA;
        break;
      default:
        throw new Error("unsupported number of channels");
    }
    return returnValue;
  }
  function writeDataBytes(data, newData, slotsPerLine, offset) {
    for (let j = 0; j < slotsPerLine; j++) {
      newData.writeByte(data[offset++]);
    }
    return offset;
  }
  function writeDataInterlaced(imageData, data, newData, offset) {
    const passes = [
      { x: 0, y: 0, xStep: 8, yStep: 8 },
      { x: 4, y: 0, xStep: 8, yStep: 8 },
      { x: 0, y: 4, xStep: 4, yStep: 8 },
      { x: 2, y: 0, xStep: 4, yStep: 4 },
      { x: 0, y: 2, xStep: 2, yStep: 4 },
      { x: 1, y: 0, xStep: 2, yStep: 2 },
      { x: 0, y: 1, xStep: 1, yStep: 2 }
    ];
    const { width, height, channels, depth } = imageData;
    let pixelSize;
    if (depth === 16) {
      pixelSize = channels * depth / 8 / 2;
    } else {
      pixelSize = channels * depth / 8;
    }
    for (let passIndex = 0; passIndex < 7; passIndex++) {
      const pass = passes[passIndex];
      const passWidth = Math.floor((width - pass.x + pass.xStep - 1) / pass.xStep);
      const passHeight = Math.floor((height - pass.y + pass.yStep - 1) / pass.yStep);
      if (passWidth <= 0 || passHeight <= 0)
        continue;
      const passLineBytes = passWidth * pixelSize;
      for (let y = 0; y < passHeight; y++) {
        const imageY = pass.y + y * pass.yStep;
        const rawScanline = depth <= 8 ? new Uint8Array(passLineBytes) : new Uint16Array(passLineBytes);
        let rawOffset = 0;
        for (let x2 = 0; x2 < passWidth; x2++) {
          const imageX = pass.x + x2 * pass.xStep;
          if (imageX < width && imageY < height) {
            const srcPos = (imageY * width + imageX) * pixelSize;
            for (let i2 = 0; i2 < pixelSize; i2++) {
              rawScanline[rawOffset++] = data[srcPos + i2];
            }
          }
        }
        newData.writeByte(0);
        if (depth === 8) {
          newData.writeBytes(rawScanline);
        } else if (depth === 16) {
          for (const value of rawScanline) {
            newData.writeByte(value >> 8 & 255);
            newData.writeByte(value & 255);
          }
        }
      }
    }
    return offset;
  }
  function writeDataUint16(data, newData, slotsPerLine, offset) {
    for (let j = 0; j < slotsPerLine; j++) {
      newData.writeUint16(data[offset++]);
    }
    return offset;
  }

  // poc/abr-tools/node_modules/fast-png/lib/index.js
  function encodePng(png, options) {
    const encoder2 = new PngEncoder(png, options);
    return encoder2.encode();
  }

  // poc/abr-tools/vendor/BitmapDecoder.ts
  function decodePackedBitmap(data, depthBits, width, height) {
    const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const unpackedBytes = new Uint8Array(width * height * depthBits / 8);
    let offset = 0;
    const lineSizes = [];
    for (let lineNo = 0; lineNo < height; lineNo++) {
      lineSizes[lineNo] = dataView.getUint16(offset);
      offset += 2;
    }
    let outOffset = 0;
    for (let lineNo = 0; lineNo < height; lineNo++) {
      const endOfLine = offset + lineSizes[lineNo];
      while (offset < endOfLine) {
        let headerByte = dataView.getInt8(offset);
        offset += 1;
        if (headerByte >= 0) {
          const copyCount = headerByte + 1;
          for (let i2 = 0; i2 < copyCount; i2++) {
            unpackedBytes[outOffset + i2] = dataView.getUint8(offset + i2);
          }
          offset += copyCount;
          outOffset += copyCount;
        } else if (headerByte > -128) {
          const copyCount = 1 - headerByte;
          const repeatedByte = dataView.getUint8(offset);
          for (let i2 = 0; i2 < copyCount; i2++) {
            unpackedBytes[outOffset + i2] = repeatedByte;
          }
          offset += 1;
          outOffset += copyCount;
        }
      }
    }
    return unpackedBytes;
  }
  function decodeToPNG({ data, isCompressed, depthBits, width, height }) {
    let decoded = isCompressed ? decodePackedBitmap(data, depthBits, width, height) : data;
    const expectedSize = width * height * depthBits / 8;
    if (decoded.byteLength > expectedSize) {
      decoded = new Uint8Array(decoded.buffer, decoded.byteOffset, expectedSize);
    }
    if (depthBits === 16) {
      decoded = new Uint16Array(decoded.buffer, decoded.byteOffset, width * height);
    }
    try {
      return encodePng({
        width,
        height,
        data: decoded,
        depth: depthBits,
        channels: 1
      });
    } catch (e) {
      console.log(`error encoding PNG: w=${width} h=${height} compressed=${isCompressed} depth=${depthBits}`, e.stack);
      throw e;
    }
  }

  // poc/abr-tools/vendor/AbrBrushFile.js
  var AbrBrushFile = class {
    constructor(data) {
      try {
        this.abr = new import_Abr.default(new import_KaitaiStream.default(data));
      } catch (e) {
        const headerView = new DataView(data, 0, 4);
        const version = headerView.getUint16(0);
        const subversion = headerView.getUint16(0);
        if (version < 6 || version > 10) {
          throw new Error(
            `unsupported ABR version (or not a ABR file): version ${version}.${subversion}`
          );
        }
        throw new Error(
          `error parsing file structure [v${version}.${subversion}]: ${e.message}`
        );
      }
      this.samples = [];
      this.samplesById = /* @__PURE__ */ new Map();
      this.brushDataById = /* @__PURE__ */ new Map();
      this.version = this.abr.header.version;
      this.subversion = this.abr.header.subversion;
      for (const section of this.abr.sections) {
        if (section.body instanceof import_Abr.default.SamplesSectionBody) {
          const samplesData = section.body.samples;
          for (let i2 = 0; i2 < samplesData.length; i2++) {
            const sampleData = samplesData[i2].data;
            let imageData;
            if (sampleData.bodyV61) {
              imageData = sampleData.bodyV61.imageData;
            } else {
              imageData = sampleData.bodyV62.channels.filter((channel) => channel.imageData)[0]?.imageData;
            }
            const sample = new AbrSampleBrush(
              sampleData.brushId,
              imageData,
              i2
            );
            this.samplesById.set(sample.brushId, sample);
            this.samples.push(sample);
          }
        }
        if (section.body instanceof import_Abr.default.DescriptorsSectionBody) {
          const parsed = this.parseDescriptor(section.body);
          for (const brushData of parsed.Brsh || []) {
            const brushId = brushData.Brsh.sampledData;
            this.brushDataById.set(brushId, brushData);
          }
        }
      }
      for (const [brushId, sample] of this.samplesById.entries()) {
        const brushData = this.brushDataById.get(brushId);
        if (brushData) {
          sample.setBrushData(brushData);
        }
      }
    }
    parseDescriptor(descriptor) {
      const obj = {};
      for (const keyedItem of descriptor.keyedItems) {
        const key = keyedItem.key.text;
        obj[key] = this.parseValue(keyedItem.item);
      }
      return obj;
    }
    cleanString(text) {
      return text.replace(/(\u0000|\x00)+$/g, "");
    }
    parseValue(typedValue) {
      const value = typedValue.value;
      if (typeof value === "number") {
        return value;
      } else if (value instanceof import_Abr.default.UnicodeString || value instanceof import_Abr.default.PascalStringU4 || value instanceof import_Abr.default.CompactString) {
        return this.cleanString(value.text);
      } else if (value instanceof import_Abr.default.DescriptorList) {
        return value.items.map((typedValue2) => this.parseValue(typedValue2));
      } else if (value instanceof import_Abr.default.Descriptor) {
        return this.parseDescriptor(value);
      } else if (value instanceof import_Abr.default.UnitFloatValue) {
        return value.value;
      } else if (value instanceof import_Abr.default.EnumeratedValue) {
        return this.cleanString(value.enum.text);
      }
      return value;
    }
    cleanup() {
      for (const sample of this.samples) {
        sample.cleanup();
      }
    }
  };
  var ASCII_DECODER = new TextDecoder("ASCII");
  var AbrSampleBrush = class {
    constructor(brushId, imageData, index) {
      this.brushData = {};
      this.brushName = void 0;
      this.brushId = ASCII_DECODER.decode(brushId);
      this.index = index;
      this.depthBits = imageData.depth;
      this.width = imageData.right - imageData.left;
      this.height = imageData.bottom - imageData.top;
      this.isCompressed = imageData.compression === 1;
      this.encodedBitmap = imageData.bitmap;
    }
    setBrushData(data) {
      this.brushData = data;
      this.brushName = data["Nm  "];
    }
    getDecodeOptions() {
      return {
        data: this.encodedBitmap,
        isCompressed: this.isCompressed,
        depthBits: this.depthBits,
        width: this.width,
        height: this.height
      };
    }
    createPNG() {
      this.pngData = decodeToPNG(this.getDecodeOptions());
      return this.pngData;
    }
    getOrCreatePNG() {
      if (!this.pngData) {
        this.createPNG();
      }
      return this.pngData;
    }
    createBlobURL() {
      this.createPNG();
      this.url = URL.createObjectURL(
        new Blob([this.pngData], { type: "image/png" })
      );
      return this.url;
    }
    cleanup() {
      if (this.url) {
        URL.revokeObjectURL(this.url);
        this.url = null;
      }
    }
  };

  // poc/abr-tools/entry.js
  var spectral = __toESM(require_spectral());
  return __toCommonJS(entry_exports);
})();

const { Plugin } = require('obsidian');

const Base = class CanvasDrawingIntegrationPoc extends Plugin {
  async onload() {
    this.mode = 'select';
    this.strokes = [];
    this.strokeBounds = [];
    this.active = null;
    this.host = null;
    this.filePath = null;
    this.loadSerial = 0;
    this.deletedPaths = new Set();
    this.spaceHeld = false;
    this.saveTimer = null;
    this.onKeyDown = (event) => { if (event.code === 'Space') this.spaceHeld = true; };
    this.onKeyUp = (event) => { if (event.code === 'Space') this.spaceHeld = false; };
    this.registerDomEvent(window, 'keydown', this.onKeyDown, true);
    this.registerDomEvent(window, 'keyup', this.onKeyUp, true);
    this.registerEvent(this.app.workspace.on('active-leaf-change', () => this.sync()));
    this.registerEvent(this.app.workspace.on('layout-change', () => this.sync()));
    this.registerEvent(this.app.vault.on('delete', (file) => this.onCanvasDeleted(file).catch(console.error)));
    this.registerEvent(this.app.vault.on('create', (file) => this.onCanvasCreated(file).catch(console.error)));
    this.registerInterval(window.setInterval(() => this.sync(), 500));
    this.sync();
  }

  onunload() {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.save().catch(console.error);
    this.detach();
  }

  async sync() {
    const leaf = this.app.workspace.activeLeaf;
    const view = leaf?.view;
    const file = view?.file;
    const wrapper = view?.containerEl?.querySelector('.canvas-wrapper');
    const canvas = wrapper?.querySelector('.canvas');
    if (view?.getViewType?.() !== 'canvas' || !file || !wrapper || !canvas) {
      if (this.host) this.detach();
      return;
    }
    if (this.deletedPaths.has(file.path)) return;
    if (this.host === wrapper && this.canvas === canvas && this.filePath === file.path) return;
    await this.save();
    this.detach();
    this.host = wrapper;
    this.canvas = canvas;
    this.filePath = file.path;
    this.mode = 'select';
    this.strokes = [];
    this.strokeBounds = [];
    this.attach();
    await this.loadStrokes(file.path);
  }

  attach() {
    const controls = document.createElement('div');
    controls.className = 'canvas-drawing-poc-controls';
    controls.setAttribute('aria-label', 'Canvas drawing PoC tools');
    const selectButton = document.createElement('button');
    selectButton.textContent = '선택';
    const drawButton = document.createElement('button');
    drawButton.textContent = '그리기';
    controls.append(selectButton, drawButton);
    this.host.append(controls);
    this.controls = controls;
    this.selectButton = selectButton;
    this.drawButton = drawButton;
    selectButton.addEventListener('click', () => this.setMode('select'));
    drawButton.addEventListener('click', () => this.setMode('draw'));
    this.setMode('select');

    const raster = document.createElement('canvas');
    raster.className = 'canvas-drawing-poc-raster';
    raster.setAttribute('aria-label', '시험 그림');
    this.host.append(raster);
    this.raster = raster;
    this.transformObserver = new MutationObserver(() => {
      if (this.renderPending) return;
      this.renderPending = true;
      requestAnimationFrame(() => { this.renderPending = false; this.render(); });
    });
    this.transformObserver.observe(this.canvas, { attributes: true, attributeFilter: ['style'] });
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(this.host);

    this.pointerDown = (event) => this.handlePointerDown(event);
    this.pointerMove = (event) => this.handlePointerMove(event);
    this.pointerUp = (event) => this.handlePointerUp(event);
    this.host.addEventListener('pointerdown', this.pointerDown, true);
    window.addEventListener('pointermove', this.pointerMove, true);
    window.addEventListener('pointerup', this.pointerUp, true);
    window.addEventListener('pointercancel', this.pointerUp, true);
  }

  detach() {
    if (this.host) this.host.removeEventListener('pointerdown', this.pointerDown, true);
    if (this.pointerMove) window.removeEventListener('pointermove', this.pointerMove, true);
    if (this.pointerUp) {
      window.removeEventListener('pointerup', this.pointerUp, true);
      window.removeEventListener('pointercancel', this.pointerUp, true);
    }
    this.controls?.remove();
    this.raster?.remove();
    this.transformObserver?.disconnect();
    this.resizeObserver?.disconnect();
    this.transformObserver = null;
    this.resizeObserver = null;
    this.controls = this.raster = this.host = this.canvas = null;
    this.active = null;
  }

  setMode(mode) {
    this.mode = mode;
    this.selectButton?.classList.toggle('is-active', mode === 'select');
    this.drawButton?.classList.toggle('is-active', mode === 'draw');
    if (this.host) this.host.style.cursor = mode === 'draw' ? 'crosshair' : '';
  }

  toCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = rect.width / this.canvas.offsetWidth;
    const sy = rect.height / this.canvas.offsetHeight;
    return [Math.round((event.clientX - rect.left) / sx * 100) / 100, Math.round((event.clientY - rect.top) / sy * 100) / 100];
  }

  handlePointerDown(event) {
    if (this.mode !== 'draw' || this.spaceHeld || event.button !== 0 || event.target.closest('.canvas-drawing-poc-controls, .canvas-controls, .canvas-card-menu, .view-header')) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active = { pointerId: event.pointerId, points: [this.toCanvasPoint(event)] };
    this.strokes.push(this.active.points);
    this.strokeBounds.push(this.getBounds(this.active.points));
    this.render();
  }

  handlePointerMove(event) {
    if (!this.active || event.pointerId !== this.active.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active.points.push(this.toCanvasPoint(event));
    this.strokeBounds[this.strokeBounds.length - 1] = this.getBounds(this.active.points);
    this.render();
  }

  handlePointerUp(event) {
    if (!this.active || event.pointerId !== this.active.pointerId) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.active.points.push(this.toCanvasPoint(event));
    this.strokeBounds[this.strokeBounds.length - 1] = this.getBounds(this.active.points);
    this.active = null;
    this.queueSave();
    this.render();
  }

  render() {
    if (!this.raster) return;
    const canvasRect = this.canvas.getBoundingClientRect();
    const hostRect = this.host.getBoundingClientRect();
    const scale = canvasRect.width / this.canvas.offsetWidth;
    if (!Number.isFinite(scale) || scale <= 0 || !hostRect.width || !hostRect.height) return;
    const dpr = window.devicePixelRatio || 1;
    const width = Math.ceil(hostRect.width * dpr);
    const height = Math.ceil(hostRect.height * dpr);
    if (this.raster.width !== width || this.raster.height !== height) {
      this.raster.width = width;
      this.raster.height = height;
    }
    const context = this.raster.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    context.setTransform(scale * dpr, 0, 0, scale * dpr, (canvasRect.left - hostRect.left) * dpr, (canvasRect.top - hostRect.top) * dpr);
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#dd3c84';
    const margin = 100 / scale;
    const visible = {
      left: (hostRect.left - canvasRect.left) / scale - margin,
      top: (hostRect.top - canvasRect.top) / scale - margin,
      right: (hostRect.right - canvasRect.left) / scale + margin,
      bottom: (hostRect.bottom - canvasRect.top) / scale + margin,
    };
    let rendered = 0;
    for (let index = 0; index < this.strokes.length; index++) {
      const points = this.strokes[index];
      if (!points.length) continue;
      const bounds = this.strokeBounds[index] || this.getBounds(points);
      if (bounds.right < visible.left || bounds.left > visible.right || bounds.bottom < visible.top || bounds.top > visible.bottom) continue;
      context.beginPath();
      context.moveTo(points[0][0], points[0][1]);
      for (let j = 1; j < points.length; j++) context.lineTo(points[j][0], points[j][1]);
      context.stroke();
      rendered++;
    }
    this.renderedStrokeCount = rendered;
  }

  getBounds(points) {
    const xs = points.map(point => point[0]);
    const ys = points.map(point => point[1]);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  }

  dataPath(path) { return `${path}.drawing-poc.json`; }

  async onCanvasDeleted(file) {
    if (!file.path.endsWith('.canvas')) return;
    const path = file.path;
    this.deletedPaths.add(path);
    if (this.filePath === path) {
      if (this.saveTimer) window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
      await this.save();
      this.detach();
      this.filePath = null;
    }
    const dataPath = this.dataPath(path);
    if (!await this.app.vault.adapter.exists(dataPath)) return;
    const trashedCanvas = `.trash/${path}`;
    for (let attempt = 0; attempt < 10 && !await this.app.vault.adapter.exists(trashedCanvas); attempt++) {
      await new Promise(resolve => window.setTimeout(resolve, 100));
    }
    if (!await this.app.vault.adapter.exists(trashedCanvas)) return;
    const trashedData = `.trash/${dataPath}`;
    if (await this.app.vault.adapter.exists(trashedData)) throw new Error(`PoC trash companion collision: ${trashedData}`);
    await this.app.vault.adapter.rename(dataPath, trashedData);
  }

  async onCanvasCreated(file) {
    if (!file.path.endsWith('.canvas')) return;
    const path = file.path;
    const dataPath = this.dataPath(path);
    const trashedData = `.trash/${dataPath}`;
    if (await this.app.vault.adapter.exists(trashedData) && !await this.app.vault.adapter.exists(dataPath)) {
      await this.app.vault.adapter.rename(trashedData, dataPath);
    }
    this.deletedPaths.delete(path);
    this.sync();
  }

  async loadStrokes(path) {
    const serial = ++this.loadSerial;
    try {
      const dataPath = this.dataPath(path);
      if (!await this.app.vault.adapter.exists(dataPath)) return;
      const parsed = JSON.parse(await this.app.vault.adapter.read(dataPath));
      if (serial === this.loadSerial && this.filePath === path && Array.isArray(parsed.strokes)) {
        this.strokes = parsed.strokes;
        this.strokeBounds = this.strokes.map(points => this.getBounds(points));
        this.render();
      }
    } catch (error) { console.error('Canvas drawing PoC load failed', error); }
  }

  queueSave() {
    if (this.saveTimer) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => { this.saveTimer = null; this.save().catch(console.error); }, 300);
  }

  async save() {
    if (!this.filePath || !this.strokes.length) return;
    const path = this.dataPath(this.filePath);
    await this.app.vault.adapter.write(path, JSON.stringify({ version: 1, strokes: this.strokes }));
  }
};

const clone = value => JSON.parse(JSON.stringify(value));

module.exports = class DrawingLab extends Base {
  async sync(){if(this.syncBusy)return;this.syncBusy=true;try{await super.sync()}finally{this.syncBusy=false}}
  async onload() {
    this.color = '#d53c83'; this.size = 12; this.opacity = 1;
    this.mixing=false;this.mixStrength=.5;this.mixScope='current';this.pressureEnabled=true;this.minSize=.1;this.spacing=.15;this.stabilization=0;this.roundness=1;this.angle=0;this.hardness=1;this.scatter=0;this.flow=1;
    this.layers=[{id:'one',name:'Layer 1',visible:true,locked:false,opacity:1,blend:'source-over'},{id:'two',name:'Layer 2',visible:true,locked:false,opacity:1,blend:'source-over'}];this.activeLayer='one';this.tips=[];this.tipId='';this.tipImages=new Map();
    this.penProof={events:0,min:1,max:0,tiltX:0,tiltY:0};this.historyBindings = new Map();
    await super.onload();
  }

  attach() {
    this.layers=[{id:'one',name:'Layer 1',visible:true,locked:false,opacity:1,blend:'source-over'},{id:'two',name:'Layer 2',visible:true,locked:false,opacity:1,blend:'source-over'}];this.activeLayer='one';this.penProof={events:0,min:1,max:0,tiltX:0,tiltY:0};
    super.attach();
    this.controls.classList.add('drawing-lab');
    const add = (label, fn) => { const b=document.createElement('button');b.textContent=label;b.onclick=fn;this.controls.append(b);return b; };
    this.colorInput=document.createElement('input');this.colorInput.type='color';this.colorInput.value=this.color;
    this.colorInput.setAttribute('aria-label','붓 색');this.colorInput.oninput=()=>this.color=this.colorInput.value;this.controls.append(this.colorInput);
    this.sizeInput=document.createElement('input');this.sizeInput.type='range';this.sizeInput.min='1';this.sizeInput.max='80';this.sizeInput.value=String(this.size);
    this.sizeInput.setAttribute('aria-label','붓 크기');this.sizeInput.oninput=()=>this.size=Number(this.sizeInput.value);this.controls.append(this.sizeInput);
    this.eyeButton=add('스포이드',()=>this.setMode('eye'));
    add('되돌리기',()=>this.obCanvas?.undo());add('다시 실행',()=>this.obCanvas?.redo());
    this.status=document.createElement('div');this.status.className='drawing-lab-status';this.status.textContent='실험실 0.0.3 · 그림 → 카드 이동 → 그림 → 되돌리기를 시험하세요.';this.host.append(this.status);
    this.obCanvas=this.app.workspace.activeLeaf.view.canvas;
    this.installHistory(this.obCanvas);
    this.attachOptions();
  }

  detach() { this.tintCache?.clear();this.tintPixels=0; this.options?.remove();this.options=null;this.status?.remove();this.status=null;super.detach(); }

  setMode(mode) { super.setMode(mode);this.eyeButton?.classList.toggle('is-active',mode==='eye'); }

  snapshot() { return {layers:clone(this.layers),strokes:this.strokes.map(s=>({points:s.map(p=>[...p]),style:clone(s.style||{color:'#dd3c84',size:5,opacity:1,layer:'one'})}))}; }
  restore(data) {const items=Array.isArray(data)?data:(data?.strokes||[]);if(data?.layers)this.layers=clone(data.layers);this.strokes=items.map(s=>{const p=s.points.map(p=>[...p]);p.style=clone(s.style);return p});this.strokeBounds=this.strokes.map(s=>this.getBounds(s));this.render(); }

  attachOptions(){
    const panel=document.createElement('details');panel.className='drawing-lab-options';panel.open=true;const summary=document.createElement('summary');summary.textContent='브러시 · 레이어 시험';panel.append(summary);this.host.append(panel);this.options=panel;
    const label=(text,el)=>{const l=document.createElement('label');l.append(text,el);panel.append(l);return el};
    const range=(text,key,min,max,step)=>{const i=document.createElement('input');i.type='range';i.min=min;i.max=max;i.step=step;i.value=this[key];i.setAttribute('aria-label',text);i.oninput=()=>{this[key]=Number(i.value);this.status.textContent=text+': '+i.value};return label(text,i)};
    const check=(text,key)=>{const i=document.createElement('input');i.type='checkbox';i.checked=this[key];i.setAttribute('aria-label',text);i.onchange=()=>this[key]=i.checked;return label(text,i)};
    check('색 혼합 켜기','mixing');range('색 혼합 강도','mixStrength',0,1,.05);const scope=document.createElement('select');scope.setAttribute('aria-label','혼합 참조');scope.innerHTML='<option value="current">현재 레이어 색만</option><option value="visible">보이는 그림 레이어 색</option>';scope.value=this.mixScope;scope.onchange=()=>this.mixScope=scope.value;label('혼합 참조',scope);
    check('필압으로 굵기','pressureEnabled');range('최소 굵기 비율','minSize',.01,1,.01);range('불투명도','opacity',.05,1,.05);range('브러시 간격','spacing',.05,2,.05);range('손떨림 보정','stabilization',0,.9,.1);range('둥근 정도','roundness',.1,1,.1);range('각도','angle',0,180,5);range('가장자리 선명도','hardness',.1,1,.1);range('흩뿌림','scatter',0,1,.1);range('물감 흐름','flow',.1,1,.1);
    this.penInfo=document.createElement('div');this.penInfo.className='lab-pen-info';this.penInfo.textContent='실제 펜으로 그리면 필압·기울기가 여기에 표시됩니다.';summary.after(this.penInfo);
    const layer=document.createElement('select');layer.setAttribute('aria-label','현재 레이어');layer.innerHTML=this.layers.map(l=>'<option value="'+l.id+'">'+l.name+'</option>').join('');layer.value=this.activeLayer;layer.onchange=()=>{this.activeLayer=layer.value;this.updateLayerControls()};label('현재 레이어',layer);
    const blend=document.createElement('select');blend.setAttribute('aria-label','레이어 혼합');for(const mode of ['source-over','multiply','screen','overlay','darken','lighten','difference']){const o=document.createElement('option');o.value=mode;o.textContent=mode;blend.append(o)}blend.onchange=()=>this.editLayer({blend:blend.value});label('레이어 혼합',blend);this.blendInput=blend;
    const visible=document.createElement('input');visible.type='checkbox';visible.setAttribute('aria-label','레이어 표시');visible.onchange=()=>this.editLayer({visible:visible.checked});label('레이어 표시',visible);this.visibleInput=visible;
    const locked=document.createElement('input');locked.type='checkbox';locked.setAttribute('aria-label','레이어 잠금');locked.onchange=()=>this.editLayer({locked:locked.checked});label('레이어 잠금',locked);this.lockedInput=locked;
    const alpha=document.createElement('input');alpha.type='range';alpha.min='0';alpha.max='1';alpha.step='.05';alpha.setAttribute('aria-label','레이어 불투명도');alpha.onchange=()=>this.editLayer({opacity:Number(alpha.value)});label('레이어 불투명도',alpha);this.layerAlphaInput=alpha;
    const input=document.createElement('input');input.type='file';input.accept='.abr';input.setAttribute('aria-label','ABR 가져오기');input.onchange=async()=>{try{const f=input.files[0];if(f)await this.importAbr(await f.arrayBuffer(),f.name)}catch(e){this.status.textContent='ABR 오류: '+e.message;console.error(e)}};label('ABR 가져오기',input);
    this.tipSelect=document.createElement('select');this.tipSelect.setAttribute('aria-label','브러시 팁');this.tipSelect.onchange=()=>this.tipId=this.tipSelect.value;label('브러시 팁',this.tipSelect);this.updateTips();this.updateLayerControls();
  }
  editLayer(values){Object.assign(this.layers.find(l=>l.id===this.activeLayer),values);this.obCanvas.pushHistory(this.obCanvas.getData());this.render();this.queueSave();}
  updateLayerControls(){const l=this.layers.find(l=>l.id===this.activeLayer)||this.layers[0];if(this.blendInput){this.blendInput.value=l.blend;this.visibleInput.checked=l.visible;this.lockedInput.checked=l.locked;this.layerAlphaInput.value=l.opacity}}
  updateTips(){if(!this.tipSelect)return;this.tipSelect.replaceChildren();const basic=document.createElement('option');basic.value='';basic.textContent='기본 원형';this.tipSelect.append(basic);for(const t of this.tips){const o=document.createElement('option');o.value=t.id;o.textContent=t.name;this.tipSelect.append(o)}this.tipSelect.value=this.tipId;}
  async importAbr(buffer,name){
    if(buffer.byteLength>32*1024*1024)throw Error('시험 버전: 32 MB 이하 파일을 사용하세요');
    const abr=new LabDeps.AbrBrushFile(buffer);const imported=[];
    for(const sample of abr.samples){if(sample.width>4096||sample.height>4096)continue;const bytes=sample.getOrCreatePNG();const img=new Image();img.src='data:image/png;base64,'+Buffer.from(bytes).toString('base64');await img.decode();const c=document.createElement('canvas');c.width=sample.width;c.height=sample.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(img,0,0);const pixels=x.getImageData(0,0,c.width,c.height);for(let i=0;i<pixels.data.length;i+=4){const alpha=pixels.data[i];pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=255;pixels.data[i+3]=alpha}x.putImageData(pixels,0,0);const tip={id:name+':'+sample.index,name:sample.brushName||name+' '+sample.index,width:sample.width,height:sample.height,png:c.toDataURL(),settings:sample.brushData};imported.push(tip);this.tipImages.set(tip.id,c)}
    this.tips=this.tips.filter(t=>!imported.some(n=>n.id===t.id)).concat(imported);this.tipId=imported[0]?.id||'';this.updateTips();this.lastImport={file:name,version:abr.version,subversion:abr.subversion,count:imported.length,limit:'팁과 이름 변환. Dynamics·Dual Brush 등의 설정은 원본 자료 보존만 하며 아직 자동 적용하지 않음.'};this.status.textContent=imported.length+'개 팁 가져옴 · 이름/팁 사용 가능 · 고급 설정 자동 변환은 후속 확인';this.queueSave();
  }
  toCanvasPoint(event){let p=super.toCanvasPoint(event);if(this.active&&this.stabilization){const prev=this.active.points[this.active.points.length-1];p=p.map((v,i)=>v*(1-this.stabilization)+prev[i]*this.stabilization)}const pressure=event.pointerType==='pen'?event.pressure:1;const info={type:event.pointerType,pressure:pressure,tiltX:event.tiltX||0,tiltY:event.tiltY||0,trusted:event.isTrusted};this.lastPen=info;if(info.type==='pen'&&info.trusted&&pressure>0){this.penProof.events++;this.penProof.min=Math.min(this.penProof.min,pressure);this.penProof.max=Math.max(this.penProof.max,pressure);this.penProof.tiltX=Math.max(this.penProof.tiltX,Math.abs(info.tiltX));this.penProof.tiltY=Math.max(this.penProof.tiltY,Math.abs(info.tiltY))}if(this.penInfo)this.penInfo.textContent=info.type+' · 필압 '+pressure.toFixed(3)+' · 기울기 '+info.tiltX+'/'+info.tiltY+(info.trusted?'':' · 자동 시험');return [...p,pressure,event.tiltX||0,event.tiltY||0];}
  sampleMix(event){if(!this.mixing||!this.raster)return this.color;const surface=this.mixReference||(this.mixScope==='current'?this.layerSurfaces?.get(this.activeLayer):this.raster);if(!surface)return this.color;const r=this.host.getBoundingClientRect(),d=devicePixelRatio||1,x=Math.floor((event.clientX-r.x)*d),y=Math.floor((event.clientY-r.y)*d);if(x<0||y<0||x>=surface.width||y>=surface.height)return this.color;const px=surface.getContext('2d').getImageData(x,y,1,1).data;if(!px[3])return this.color;const picked='#'+[...px].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');return LabDeps.spectral.mix([new LabDeps.spectral.Color(this.color),1-this.mixStrength],[new LabDeps.spectral.Color(picked),this.mixStrength]).toString();}

  installHistory(c) {
    if(this.historyBindings.has(c))return;
    const push=c.history.push,replace=c.history.replace,apply=c.applyHistory;
    const plugin=this;
    for(const entry of c.history.data)entry.__drawingLab=[];
    c.history.push=function(data){const next={...data,__drawingLab:plugin.filePath===c.view.file?.path?plugin.snapshot():[]};return push.call(this,next)};
    c.history.replace=function(data){const next={...data,__drawingLab:plugin.filePath===c.view.file?.path?plugin.snapshot():[]};return replace.call(this,next)};
    c.applyHistory=function(data){const {__drawingLab,...native}=data;apply.call(c,native);if(plugin.filePath===c.view.file?.path){plugin.restore(__drawingLab||[]);plugin.queueSave();if(plugin.status)plugin.status.textContent='되돌리기/다시 실행 · 그림 '+plugin.strokes.length+'개'}};
    this.historyBindings.set(c,{push,replace,apply});
  }

  handlePointerDown(event) {
    if(this.loadingDrawing)return;
    if(this.mode==='eye'&&event.button===0&&!event.target.closest('.canvas-drawing-poc-controls,.canvas-controls,.drawing-lab-status')){
      event.preventDefault();event.stopImmediatePropagation();
      this.pickScreenColor(event.clientX,event.clientY).catch(e=>{if(this.status)this.status.textContent='색 선택 오류: '+e.message;console.error(e)});return;
    }
    if(event.target.closest('.drawing-lab-options'))return;
    if(this.mode==='draw'&&this.layers.find(l=>l.id===this.activeLayer)?.locked){event.preventDefault();event.stopImmediatePropagation();this.status.textContent='현재 레이어가 잠겨 있습니다';return}
    if(this.mode==='draw'&&this.mixing){const source=this.mixScope==='current'?this.layerSurfaces?.get(this.activeLayer):this.raster;this.mixReference=document.createElement('canvas');this.mixReference.width=source?.width||1;this.mixReference.height=source?.height||1;if(source)this.mixReference.getContext('2d',{willReadFrequently:true}).drawImage(source,0,0)}
    const mixed=this.mode==='draw'?this.sampleMix(event):this.color;
    if(this.mode==='draw'&&!this.spaceHeld&&event.button===0&&!event.target.closest('.canvas-drawing-poc-controls,.canvas-controls'))this.obCanvas?.requestPushHistory?.run();
    super.handlePointerDown(event);
    if(this.active){this.active.points.style={color:this.color,size:this.size,opacity:this.opacity,layer:this.activeLayer,colors:[mixed],pressure:this.pressureEnabled,minSize:this.minSize,tipId:this.tipId,spacing:this.spacing,roundness:this.roundness,angle:this.angle,hardness:this.hardness,scatter:this.scatter,flow:this.flow};this.render();}
  }

  handlePointerMove(event){if(this.active)this.active.points.style.colors.push(this.sampleMix(event));super.handlePointerMove(event);}

  handlePointerUp(event) {
    const wasActive=!!this.active;super.handlePointerUp(event);
    this.mixReference=null;
    if(wasActive&&!this.active){this.obCanvas.pushHistory(this.obCanvas.getData());if(this.status)this.status.textContent='그림 '+this.strokes.length+'개 · Canvas와 같은 되돌리기 순서';}
  }

  async pickScreenColor(x,y) {
    const remote=require('@electron/remote');
    const picture=await remote.getCurrentWebContents().capturePage({x:Math.floor(x),y:Math.floor(y),width:1,height:1});
    if(picture.isEmpty())throw new Error('화면 캡처가 비어 있습니다');
    const img=new Image();img.src=picture.toDataURL();await img.decode();
    const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const ctx=c.getContext('2d');ctx.drawImage(img,0,0);
    const rgb=ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data;
    this.color='#'+[...rgb].slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('');this.colorInput.value=this.color;
    this.lastPicked={x,y,color:this.color};this.setMode('draw');if(this.status)this.status.textContent='화면에서 선택한 색: '+this.color+' · 이 색으로 그려보세요.';
  }

  render() {
    if(!this.raster)return;
    const cr=this.canvas.getBoundingClientRect(),hr=this.host.getBoundingClientRect(),scale=cr.width/this.canvas.offsetWidth,dpr=devicePixelRatio||1;
    if(!scale||!hr.width||!hr.height)return;
    const w=Math.ceil(hr.width*dpr),h=Math.ceil(hr.height*dpr);if(this.raster.width!==w||this.raster.height!==h){this.raster.width=w;this.raster.height=h}
    const ctx=this.raster.getContext('2d');ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(scale*dpr,0,0,scale*dpr,(cr.left-hr.left)*dpr,(cr.top-hr.top)*dpr);ctx.lineCap='round';ctx.lineJoin='round';
    let count=0;this.layerSurfaces=this.layerSurfaces||new Map();for(const layer of this.layers){let surface=this.layerSurfaces.get(layer.id);if(!surface){surface=document.createElement('canvas');this.layerSurfaces.set(layer.id,surface)}if(surface.width!==w||surface.height!==h){surface.width=w;surface.height=h}const lx=surface.getContext('2d',{willReadFrequently:true});lx.setTransform(1,0,0,1,0,0);lx.clearRect(0,0,w,h);lx.setTransform(scale*dpr,0,0,scale*dpr,(cr.left-hr.left)*dpr,(cr.top-hr.top)*dpr);
      for(const s of this.strokes){if(!s.length)continue;const st=s.style||{color:'#dd3c84',size:5,opacity:1};if((st.layer||'one')!==layer.id)continue;const bb=this.getBounds(s);if(cr.left+bb.right*scale<hr.left-100||cr.left+bb.left*scale>hr.right+100||cr.top+bb.bottom*scale<hr.top-100||cr.top+bb.top*scale>hr.bottom+100)continue;this.paintStroke(lx,s,st);count++}
      if(layer.visible){ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation=layer.blend;ctx.globalAlpha=layer.opacity;ctx.drawImage(surface,0,0)}}ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;this.renderedStrokeCount=count;
  }

  // Reuse the exact full-resolution colored mask. Keep a bounded FIFO cache;
  // source object identity also invalidates entries after a brush is reimported.
  coloredTip(tip,color){
    this.tintCache ||= new Map();this.tintPixels ||= 0;
    let colors=this.tintCache.get(tip);if(colors?.has(color))return colors.get(color);
    const mask=document.createElement('canvas');mask.width=tip.width;mask.height=tip.height;
    const mx=mask.getContext('2d');mx.drawImage(tip,0,0);mx.globalCompositeOperation='source-in';mx.fillStyle=color;mx.fillRect(0,0,mask.width,mask.height);
    const pixels=mask.width*mask.height;
    while(this.tintPixels+pixels>16000000&&this.tintCache.size){
      const [oldTip,oldColors]=this.tintCache.entries().next().value;
      const oldColor=oldColors.keys().next().value;const oldMask=oldColors.get(oldColor);
      this.tintPixels-=oldMask.width*oldMask.height;oldColors.delete(oldColor);
      if(!oldColors.size)this.tintCache.delete(oldTip);
    }
    if(pixels<=16000000){colors=this.tintCache.get(tip)||new Map();colors.set(color,mask);this.tintCache.set(tip,colors);this.tintPixels+=pixels;}
    return mask;
  }
  paintStroke(ctx,s,st){
    const spacing=Math.max(.5,st.size*(st.spacing||.15));let remaining=0;let stampIndex=0;
    const stamp=(x,y,pressure,color)=>{const size=st.size*(st.pressure?Math.max(st.minSize||.1,pressure??1):1);const jitter=st.scatter||0;x+=Math.sin(stampIndex*12.98)*size*jitter;y+=Math.cos(stampIndex*9.23)*size*jitter;stampIndex++;ctx.save();ctx.translate(x,y);ctx.rotate((st.angle||0)*Math.PI/180);ctx.scale(1,st.roundness||1);ctx.globalAlpha=st.opacity*(st.flow||1);const tip=this.tipImages.get(st.tipId);if(tip){const mask=this.coloredTip(tip,color);ctx.drawImage(mask,-size/2,-size*tip.height/tip.width/2,size,size*tip.height/tip.width)}else{const r=size/2;if((st.hardness??1)<1){const g=ctx.createRadialGradient(0,0,r*st.hardness,0,0,r);g.addColorStop(0,color);g.addColorStop(1,color+'00');ctx.fillStyle=g}else ctx.fillStyle=color;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill()}ctx.restore()};
    stamp(s[0][0],s[0][1],s[0][2],st.colors?.[0]||st.color);for(let i=1;i<s.length;i++){const a=s[i-1],b=s[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)continue;let pos=spacing-remaining;for(;pos<=length;pos+=spacing){const t=pos/length;stamp(a[0]+dx*t,a[1]+dy*t,(a[2]??1)*(1-t)+(b[2]??1)*t,st.colors?.[i]||st.color)}remaining=(remaining+length)%spacing}
  }

  async loadStrokes(path) {
    this.loadingDrawing=true;try{
    const serial=++this.loadSerial;const name=this.dataPath(path);if(!await this.app.vault.adapter.exists(name))return;
    const data=JSON.parse(await this.app.vault.adapter.read(name));if(serial!==this.loadSerial||this.filePath!==path)return;
    if(data.tips){this.tips=data.tips;for(const tip of this.tips){const image=new Image();image.src=tip.png;await image.decode();this.tipImages.set(tip.id,image)}this.updateTips()}
    if(data.penProof)this.penProof=data.penProof;if(data.labStrokes)this.restore(data.labStrokes);else {this.strokes=data.strokes||[];this.strokeBounds=this.strokes.map(s=>this.getBounds(s));this.render()}this.updateLayerControls();
    const c=this.obCanvas;if(c)for(const entry of c.history.data)entry.__drawingLab=this.snapshot();
    }finally{this.loadingDrawing=false}
  }
  async save() { if(!this.filePath||this.loadingDrawing)return;await this.app.vault.adapter.write(this.dataPath(this.filePath),JSON.stringify({version:2,strokes:this.strokes.map(s=>s.map(p=>[...p])),labStrokes:this.snapshot(),tips:this.tips,penProof:this.penProof})); }

  onunload(){for(const[c,old]of this.historyBindings){c.history.push=old.push;c.history.replace=old.replace;c.applyHistory=old.apply;for(const entry of c.history.data)delete entry.__drawingLab;}this.historyBindings.clear();super.onunload();}
};
