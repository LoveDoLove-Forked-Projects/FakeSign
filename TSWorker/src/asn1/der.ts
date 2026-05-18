/**
 * ASN.1 DER encoding/decoding utilities
 * Implements minimal ASN.1 DER codec for timestamp protocol
 */

export const ASN1_TAG = {
  BOOLEAN: 0x01,
  INTEGER: 0x02,
  BIT_STRING: 0x03,
  OCTET_STRING: 0x04,
  NULL: 0x05,
  OID: 0x06,
  UTF8_STRING: 0x0c,
  PRINTABLE_STRING: 0x13,
  IA5_STRING: 0x16,
  UTC_TIME: 0x17,
  GENERALIZED_TIME: 0x18,
  SEQUENCE: 0x30,
  SET: 0x31,
  CONTEXT_0: 0xa0,
  CONTEXT_1: 0xa1,
  CONTEXT_2: 0xa2,
  CONTEXT_3: 0xa3,
} as const;

export class ASN1Writer {
  private buffer: number[] = [];

  getBuffer(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  writeRaw(data: Uint8Array | number[]): void {
    for (const b of data) this.buffer.push(b);
  }

  private writeLength(length: number): void {
    if (length < 0x80) {
      this.buffer.push(length);
    } else if (length < 0x100) {
      this.buffer.push(0x81, length);
    } else if (length < 0x10000) {
      this.buffer.push(0x82, (length >> 8) & 0xff, length & 0xff);
    } else if (length < 0x1000000) {
      this.buffer.push(0x83, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
    } else {
      this.buffer.push(0x84, (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff);
    }
  }

  writeTLV(tag: number, content: Uint8Array | number[]): void {
    this.buffer.push(tag);
    this.writeLength(content.length);
    this.writeRaw(content);
  }

  writeSequence(content: Uint8Array): void {
    this.writeTLV(ASN1_TAG.SEQUENCE, content);
  }

  writeSet(content: Uint8Array): void {
    this.writeTLV(ASN1_TAG.SET, content);
  }

  writeOID(oid: string): void {
    const parts = oid.split('.').map(Number);
    const encoded: number[] = [];
    encoded.push(parts[0] * 40 + parts[1]);
    for (let i = 2; i < parts.length; i++) {
      let value = parts[i];
      if (value < 128) {
        encoded.push(value);
      } else {
        const bytes: number[] = [];
        bytes.push(value & 0x7f);
        value >>= 7;
        while (value > 0) {
          bytes.push((value & 0x7f) | 0x80);
          value >>= 7;
        }
        encoded.push(...bytes.reverse());
      }
    }
    this.writeTLV(ASN1_TAG.OID, encoded);
  }

  writeInteger(value: Uint8Array | number): void {
    if (typeof value === 'number') {
      const bytes: number[] = [];
      if (value === 0) {
        bytes.push(0);
      } else {
        let v = value;
        while (v > 0) {
          bytes.unshift(v & 0xff);
          v >>= 8;
        }
        if (bytes[0] & 0x80) bytes.unshift(0);
      }
      this.writeTLV(ASN1_TAG.INTEGER, bytes);
    } else {
      const bytes: number[] = [...value];
      if (bytes.length > 0 && bytes[0] & 0x80) bytes.unshift(0);
      this.writeTLV(ASN1_TAG.INTEGER, bytes);
    }
  }

  writeOctetString(data: Uint8Array): void {
    this.writeTLV(ASN1_TAG.OCTET_STRING, data);
  }

  writeBitString(data: Uint8Array): void {
    const content = new Uint8Array(data.length + 1);
    content[0] = 0; // unused bits
    content.set(data, 1);
    this.writeTLV(ASN1_TAG.BIT_STRING, content);
  }

  writeNull(): void {
    this.buffer.push(ASN1_TAG.NULL, 0x00);
  }

  writeBoolean(value: boolean): void {
    this.writeTLV(ASN1_TAG.BOOLEAN, [value ? 0xff : 0x00]);
  }

  writeUTCTime(date: Date): void {
    const str = formatUTCTime(date);
    const bytes = new TextEncoder().encode(str);
    this.writeTLV(ASN1_TAG.UTC_TIME, bytes);
  }

  writeGeneralizedTime(date: Date): void {
    const str = formatGeneralizedTime(date);
    const bytes = new TextEncoder().encode(str);
    this.writeTLV(ASN1_TAG.GENERALIZED_TIME, bytes);
  }

  writeContextTag(tagNum: number, content: Uint8Array, constructed = true): void {
    const tag = 0xa0 | tagNum | (constructed ? 0x20 : 0x00);
    this.writeTLV(tag & 0xff, content);
  }

  writeExplicitTag(tagNum: number, content: Uint8Array): void {
    this.writeTLV(0xa0 | tagNum, content);
  }
}

export interface ASN1Node {
  tag: number;
  length: number;
  value: Uint8Array;
  children?: ASN1Node[];
  offset: number;
  headerLength: number;
}

export class ASN1Reader {
  private data: Uint8Array;
  private pos: number;

  constructor(data: Uint8Array) {
    this.data = data;
    this.pos = 0;
  }

  parse(): ASN1Node {
    return this.readNode();
  }

  parseAll(): ASN1Node[] {
    const nodes: ASN1Node[] = [];
    while (this.pos < this.data.length) {
      nodes.push(this.readNode());
    }
    return nodes;
  }

  private readNode(): ASN1Node {
    const offset = this.pos;
    const tag = this.data[this.pos++];
    const { length, headerLen } = this.readLength();
    const totalHeaderLength = this.pos - offset;
    const value = this.data.slice(this.pos, this.pos + length);
    this.pos += length;

    const node: ASN1Node = { tag, length, value, offset, headerLength: totalHeaderLength };

    // Parse constructed types
    if (tag & 0x20 || tag === ASN1_TAG.SEQUENCE || tag === ASN1_TAG.SET ||
        (tag >= 0xa0 && tag <= 0xaf)) {
      try {
        const childReader = new ASN1Reader(value);
        node.children = childReader.parseAll();
      } catch {
        // Not constructed, keep as raw value
      }
    }

    return node;
  }

  private readLength(): { length: number; headerLen: number } {
    const first = this.data[this.pos++];
    if (first < 0x80) {
      return { length: first, headerLen: 1 };
    }
    const numBytes = first & 0x7f;
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
      length = (length << 8) | this.data[this.pos++];
    }
    return { length, headerLen: 1 + numBytes };
  }
}

export function parseOID(data: Uint8Array): string {
  const parts: number[] = [];
  parts.push(Math.floor(data[0] / 40));
  parts.push(data[0] % 40);

  let value = 0;
  for (let i = 1; i < data.length; i++) {
    value = (value << 7) | (data[i] & 0x7f);
    if (!(data[i] & 0x80)) {
      parts.push(value);
      value = 0;
    }
  }
  return parts.join('.');
}

function formatUTCTime(date: Date): string {
  const y = date.getUTCFullYear() % 100;
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  const min = date.getUTCMinutes();
  const s = date.getUTCSeconds();
  return `${pad2(y)}${pad2(m)}${pad2(d)}${pad2(h)}${pad2(min)}${pad2(s)}Z`;
}

function formatGeneralizedTime(date: Date): string {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const h = date.getUTCHours();
  const min = date.getUTCMinutes();
  const s = date.getUTCSeconds();
  return `${y}${pad2(m)}${pad2(d)}${pad2(h)}${pad2(min)}${pad2(s)}Z`;
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Build a full TLV from tag and content
export function buildTLV(tag: number, content: Uint8Array): Uint8Array {
  const w = new ASN1Writer();
  w.writeTLV(tag, content);
  return w.getBuffer();
}

export function buildSequence(...items: Uint8Array[]): Uint8Array {
  const totalLen = items.reduce((s, i) => s + i.length, 0);
  const content = new Uint8Array(totalLen);
  let offset = 0;
  for (const item of items) {
    content.set(item, offset);
    offset += item.length;
  }
  const w = new ASN1Writer();
  w.writeSequence(content);
  return w.getBuffer();
}

export function buildSet(...items: Uint8Array[]): Uint8Array {
  const totalLen = items.reduce((s, i) => s + i.length, 0);
  const content = new Uint8Array(totalLen);
  let offset = 0;
  for (const item of items) {
    content.set(item, offset);
    offset += item.length;
  }
  const w = new ASN1Writer();
  w.writeSet(content);
  return w.getBuffer();
}

export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLen = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}
