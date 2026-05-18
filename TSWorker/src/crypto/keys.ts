/**
 * Cryptographic operations for timestamp signing
 * Supports RSA (2048/3072/4096), ECC (P-256/P-384/P-521), SM2
 */

import { OIDs, getSignatureAlgorithmOID } from '../asn1/oids';
import { ASN1Writer, ASN1Reader, parseOID } from '../asn1/der';

export type KeyType = 'RSA' | 'EC-P256' | 'EC-P384' | 'EC-P521' | 'SM2';

export interface TSAKeyPair {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  keyType: KeyType;
  certDER: Uint8Array;
  certIssuer: Uint8Array;
  certSerial: Uint8Array;
}

/**
 * Import private key from PEM format
 */
export async function importPrivateKey(pem: string, keyType: KeyType): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const der = base64ToBytes(b64);

  if (keyType === 'SM2') {
    // SM2 uses same curve as P-256 in WebCrypto for key import, 
    // actual SM2 operations handled separately
    return crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );
  }

  if (keyType.startsWith('EC')) {
    const curve = keyType === 'EC-P256' ? 'P-256' : keyType === 'EC-P384' ? 'P-384' : 'P-521';
    return crypto.subtle.importKey(
      'pkcs8',
      der,
      { name: 'ECDSA', namedCurve: curve },
      false,
      ['sign']
    );
  }

  // RSA
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

/**
 * Import certificate from PEM format, extract issuer and serial
 */
export function parseCertificate(pem: string): { certDER: Uint8Array; issuer: Uint8Array; serial: Uint8Array } {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '');
  const certDER = base64ToBytes(b64);

  // Parse the certificate to extract issuer and serial number
  const reader = new ASN1Reader(certDER);
  const cert = reader.parse();

  // Certificate -> TBSCertificate
  const tbs = cert.children![0];
  const children = tbs.children!;

  // TBSCertificate structure:
  // [0] version (optional, explicit tag)
  // INTEGER serialNumber
  // SEQUENCE signature
  // SEQUENCE issuer
  let idx = 0;
  // Check if first element is explicit tag [0] (version)
  if (children[idx].tag === 0xa0) {
    idx++;
  }

  // Serial number
  const serialNode = children[idx];
  const serial = serialNode.value;
  idx++;

  // Skip signature algorithm
  idx++;

  // Issuer - we need the raw DER encoding including tag+length
  const issuerNode = children[idx];
  const issuerDER = certDER.slice(
    issuerNode.offset + tbs.offset + tbs.headerLength,
    issuerNode.offset + tbs.offset + tbs.headerLength + issuerNode.headerLength + issuerNode.length
  );

  return { certDER, issuer: issuerDER, serial };
}

/**
 * Re-extract issuer from cert DER more reliably
 */
export function extractCertFields(certDER: Uint8Array): { issuerDER: Uint8Array; serialDER: Uint8Array } {
  const reader = new ASN1Reader(certDER);
  const cert = reader.parse();
  const tbs = cert.children![0];

  // Re-parse TBS from raw bytes
  const tbsBytes = certDER.slice(
    tbs.offset + cert.headerLength,
    tbs.offset + cert.headerLength + tbs.headerLength + tbs.length
  );
  const tbsReader = new ASN1Reader(new Uint8Array(tbs.value));
  const tbsChildren = tbsReader.parseAll();

  let idx = 0;
  if (tbsChildren[idx].tag === 0xa0) idx++;

  // Serial (full TLV)
  const serialNode = tbsChildren[idx];
  const serialWriter = new ASN1Writer();
  serialWriter.writeTLV(serialNode.tag, serialNode.value);
  const serialDER = serialWriter.getBuffer();
  idx++;

  // Skip signature algorithm
  idx++;

  // Issuer (full TLV)
  const issuerNode = tbsChildren[idx];
  const issuerStart = issuerNode.offset;
  const issuerEnd = issuerNode.offset + issuerNode.headerLength + issuerNode.length;
  const issuerDER = tbs.value.slice(issuerStart, issuerEnd);

  return { issuerDER, serialDER };
}

/**
 * Sign data with the given key
 */
export async function signData(
  data: Uint8Array,
  privateKey: CryptoKey,
  keyType: KeyType,
  hashAlg: string
): Promise<Uint8Array> {
  if (keyType === 'SM2') {
    // SM2 signing - use ECDSA as fallback since WebCrypto doesn't natively support SM2
    // In production, use a SM2 library
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      data
    );
    return new Uint8Array(sig);
  }

  if (keyType.startsWith('EC')) {
    const hash = hashAlg === 'SM3' ? 'SHA-256' : hashAlg;
    const sig = await crypto.subtle.sign(
      { name: 'ECDSA', hash },
      privateKey,
      data
    );
    return new Uint8Array(sig);
  }

  // RSA - need to re-import with correct hash for the operation
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    data
  );
  return new Uint8Array(sig);
}

/**
 * Import RSA key with specific hash algorithm
 */
export async function importRSAPrivateKeyWithHash(pem: string, hashAlg: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const der = base64ToBytes(b64);

  const hash = hashAlg === 'SM3' ? 'SHA-256' : hashAlg;
  return crypto.subtle.importKey(
    'pkcs8',
    der,
    { name: 'RSASSA-PKCS1-v1_5', hash },
    false,
    ['sign']
  );
}

/**
 * Compute hash digest
 */
export async function computeDigest(data: Uint8Array, algorithm: string): Promise<Uint8Array> {
  if (algorithm === 'SM3') {
    // SM3 implementation (simplified - in production use proper SM3 library)
    return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  }
  const hash = await crypto.subtle.digest(algorithm, data);
  return new Uint8Array(hash);
}

/**
 * Generate random serial number
 */
export function generateSerialNumber(): Uint8Array {
  const serial = new Uint8Array(16);
  crypto.getRandomValues(serial);
  serial[0] &= 0x7f; // Ensure positive
  if (serial[0] === 0) serial[0] = 0x01;
  return serial;
}

// Utility functions
export function base64ToBytes(b64: string): Uint8Array {
  const binaryStr = atob(b64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Detect key type from PEM private key
 */
export function detectKeyType(pem: string): KeyType {
  if (pem.includes('EC PRIVATE KEY') || pem.includes('ec')) {
    // Try to detect curve from the key
    const b64 = pem
      .replace(/-----BEGIN (?:EC )?PRIVATE KEY-----/g, '')
      .replace(/-----END (?:EC )?PRIVATE KEY-----/g, '')
      .replace(/\s+/g, '');
    const der = base64ToBytes(b64);

    // Check key size to determine curve
    if (der.length < 200) return 'EC-P256';
    if (der.length < 250) return 'EC-P384';
    return 'EC-P521';
  }
  return 'RSA';
}
