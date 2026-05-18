/**
 * RFC 3161 Timestamp Protocol Implementation
 * Generates TimeStampResponse from TimeStampRequest
 */

import { OIDs, HashAlgorithmOIDs, OIDToHashAlgorithm, getSignatureAlgorithmOID } from '../asn1/oids';
import {
  ASN1Writer, ASN1Reader, ASN1_TAG,
  buildSequence, buildSet, concatBytes, parseOID
} from '../asn1/der';
import {
  TSAKeyPair, signData, computeDigest, generateSerialNumber,
  bytesToBase64, base64ToBytes, importRSAPrivateKeyWithHash,
  KeyType
} from '../crypto/keys';

export interface TimestampConfig {
  certPEM: string;
  keyPEM: string;
  keyType: KeyType;
  allowFakeTime: boolean;
}

export interface TSAContext {
  privateKey: CryptoKey;
  keyType: KeyType;
  certDER: Uint8Array;
  issuerDER: Uint8Array;
  serialDER: Uint8Array;
  config: TimestampConfig;
}

/**
 * Parse RFC 3161 TimeStampRequest
 */
export function parseTimeStampRequest(data: Uint8Array): {
  version: number;
  messageImprint: { hashAlgorithm: string; hashedMessage: Uint8Array };
  reqPolicy?: string;
  nonce?: Uint8Array;
  certReq?: boolean;
} | null {
  try {
    const reader = new ASN1Reader(data);
    const root = reader.parse();
    if (root.tag !== ASN1_TAG.SEQUENCE || !root.children) return null;

    const children = root.children;
    let idx = 0;

    // version INTEGER
    const version = children[idx].value[0];
    idx++;

    // messageImprint SEQUENCE { algorithm, hash }
    const mi = children[idx];
    if (!mi.children || mi.children.length < 2) return null;

    const algSeq = mi.children[0];
    let hashOID: string;
    if (algSeq.children && algSeq.children.length > 0) {
      hashOID = parseOID(algSeq.children[0].value);
    } else {
      hashOID = parseOID(algSeq.value);
    }

    const hashAlg = OIDToHashAlgorithm[hashOID] || 'SHA-256';
    const hashedMessage = mi.children[1].value;
    idx++;

    let reqPolicy: string | undefined;
    let nonce: Uint8Array | undefined;
    let certReq: boolean | undefined;

    while (idx < children.length) {
      const node = children[idx];
      if (node.tag === ASN1_TAG.OID) {
        reqPolicy = parseOID(node.value);
      } else if (node.tag === ASN1_TAG.INTEGER) {
        nonce = node.value;
      } else if (node.tag === ASN1_TAG.BOOLEAN) {
        certReq = node.value[0] !== 0;
      }
      idx++;
    }

    return { version, messageImprint: { hashAlgorithm: hashAlg, hashedMessage }, reqPolicy, nonce, certReq };
  } catch {
    return null;
  }
}

/**
 * Build AlgorithmIdentifier ASN.1 structure
 */
function buildAlgorithmIdentifier(oid: string, withNull = true): Uint8Array {
  const w = new ASN1Writer();
  w.writeOID(oid);
  if (withNull) w.writeNull();
  const content = w.getBuffer();
  return buildSequence(content);
}

/**
 * Build MessageImprint structure
 */
function buildMessageImprint(hashAlgOID: string, hash: Uint8Array): Uint8Array {
  const algId = buildAlgorithmIdentifier(hashAlgOID);
  const w = new ASN1Writer();
  w.writeOctetString(hash);
  const hashTLV = w.getBuffer();
  return buildSequence(concatBytes(algId, hashTLV));
}

/**
 * Build TSTInfo structure (RFC 3161 Section 2.4.2)
 */
function buildTSTInfo(
  hashAlgOID: string,
  messageHash: Uint8Array,
  serial: Uint8Array,
  signTime: Date,
  nonce?: Uint8Array,
  policyOID = OIDs.id_tsaPolicy
): Uint8Array {
  const w = new ASN1Writer();

  // version INTEGER (1)
  w.writeInteger(1);

  // policy OBJECT IDENTIFIER
  w.writeOID(policyOID);

  // messageImprint MessageImprint
  const mi = buildMessageImprint(hashAlgOID, messageHash);
  w.writeRaw(mi);

  // serialNumber INTEGER
  w.writeInteger(serial);

  // genTime GeneralizedTime
  w.writeGeneralizedTime(signTime);

  // Add nonce if present
  if (nonce) {
    w.writeInteger(nonce);
  }

  const content = w.getBuffer();
  return buildSequence(content);
}

/**
 * Build SignedAttributes for CMS signature
 */
function buildSignedAttributes(
  contentType: string,
  signTime: Date,
  messageDigest: Uint8Array
): Uint8Array {
  // Content Type attribute
  const ctW = new ASN1Writer();
  ctW.writeOID(OIDs.id_contentType);
  const ctOidW = new ASN1Writer();
  ctOidW.writeOID(contentType);
  const ctAttr = buildSequence(concatBytes(ctW.getBuffer(), buildSet(ctOidW.getBuffer())));

  // Signing Time attribute
  const stW = new ASN1Writer();
  stW.writeOID(OIDs.id_signingTime);
  const stTimeW = new ASN1Writer();
  stTimeW.writeUTCTime(signTime);
  const stAttr = buildSequence(concatBytes(stW.getBuffer(), buildSet(stTimeW.getBuffer())));

  // Message Digest attribute
  const mdW = new ASN1Writer();
  mdW.writeOID(OIDs.id_messageDigest);
  const mdValW = new ASN1Writer();
  mdValW.writeOctetString(messageDigest);
  const mdAttr = buildSequence(concatBytes(mdW.getBuffer(), buildSet(mdValW.getBuffer())));

  return concatBytes(ctAttr, stAttr, mdAttr);
}

/**
 * Build CMS SignedData wrapping TSTInfo
 */
async function buildSignedData(
  tstInfo: Uint8Array,
  ctx: TSAContext,
  hashAlg: string,
  signTime: Date
): Promise<Uint8Array> {
  const hashAlgOID = HashAlgorithmOIDs[hashAlg] || OIDs.id_sha256;
  const sigAlgOID = getSignatureAlgorithmOID(ctx.keyType, hashAlg);

  // Digest of TSTInfo
  const tstInfoDigest = await computeDigest(tstInfo, hashAlg === 'SM3' ? 'SHA-256' : hashAlg);

  // Build SignedAttributes
  const signedAttrsContent = buildSignedAttributes(OIDs.id_ct_TSTInfo, signTime, tstInfoDigest);
  const signedAttrsSet = buildSet(signedAttrsContent);

  // For signing, use SET encoding (tag 0x31)
  const dataToSign = signedAttrsSet;

  // Sign the attributes
  const signature = await signData(dataToSign, ctx.privateKey, ctx.keyType, hashAlg);

  // Build SignerInfo
  const signerInfo = buildSignerInfo(
    ctx.issuerDER, ctx.serialDER, hashAlgOID, sigAlgOID,
    signedAttrsContent, signature
  );

  // Build full SignedData
  const digestAlgSet = buildSet(buildAlgorithmIdentifier(hashAlgOID));

  // EncapsulatedContentInfo
  const eciOidW = new ASN1Writer();
  eciOidW.writeOID(OIDs.id_ct_TSTInfo);
  const eciContentW = new ASN1Writer();
  eciContentW.writeOctetString(tstInfo);
  const eciExplicit = buildExplicitTag(0, eciContentW.getBuffer());
  const eci = buildSequence(concatBytes(eciOidW.getBuffer(), eciExplicit));

  // Certificates [0] IMPLICIT
  const certsExplicit = buildExplicitTag(0, ctx.certDER);

  // SignerInfos SET
  const signerInfoSet = buildSet(signerInfo);

  // SignedData SEQUENCE
  // version MUST be 3 when eContentType is not id-data (RFC 5652 §5.1)
  const versionW = new ASN1Writer();
  versionW.writeInteger(3);
  const signedData = buildSequence(concatBytes(
    versionW.getBuffer(),
    digestAlgSet,
    eci,
    certsExplicit,
    signerInfoSet
  ));

  // ContentInfo wrapper
  const ciOidW = new ASN1Writer();
  ciOidW.writeOID(OIDs.id_signedData);
  const ciContent = buildExplicitTag(0, signedData);
  return buildSequence(concatBytes(ciOidW.getBuffer(), ciContent));
}

/**
 * Build SignerInfo structure
 */
function buildSignerInfo(
  issuerDER: Uint8Array,
  serialDER: Uint8Array,
  hashAlgOID: string,
  sigAlgOID: string,
  signedAttrsContent: Uint8Array,
  signature: Uint8Array
): Uint8Array {
  const w = new ASN1Writer();

  // version
  w.writeInteger(1);

  // issuerAndSerialNumber
  const iasn = buildSequence(concatBytes(issuerDER, serialDER));
  w.writeRaw(iasn);

  // digestAlgorithm
  const digestAlg = buildAlgorithmIdentifier(hashAlgOID);
  w.writeRaw(digestAlg);

  // signedAttrs [0] IMPLICIT
  const implicitAttrs = buildImplicitTag(0, signedAttrsContent);
  w.writeRaw(implicitAttrs);

  // signatureAlgorithm
  const sigAlg = buildAlgorithmIdentifier(sigAlgOID);
  w.writeRaw(sigAlg);

  // signature OCTET STRING (CMS uses OCTET STRING, not BIT STRING)
  w.writeOctetString(signature);

  return buildSequence(w.getBuffer());
}

function buildExplicitTag(tagNum: number, content: Uint8Array): Uint8Array {
  const w = new ASN1Writer();
  w.writeExplicitTag(tagNum, content);
  return w.getBuffer();
}

function buildImplicitTag(tagNum: number, content: Uint8Array): Uint8Array {
  const tag = 0xa0 | tagNum;
  const w = new ASN1Writer();
  w.writeTLV(tag, content);
  return w.getBuffer();
}

/**
 * Generate RFC 3161 TimeStampResponse
 */
export async function generateRFC3161Response(
  request: Uint8Array,
  signTime: Date,
  ctx: TSAContext
): Promise<Uint8Array> {
  const tsReq = parseTimeStampRequest(request);
  if (!tsReq) {
    return buildFailureResponse(2, 'Bad request format');
  }

  const hashAlg = tsReq.messageImprint.hashAlgorithm;
  const hashAlgOID = HashAlgorithmOIDs[hashAlg] || OIDs.id_sha256;
  const serial = generateSerialNumber();

  // Build TSTInfo
  const tstInfo = buildTSTInfo(
    hashAlgOID,
    tsReq.messageImprint.hashedMessage,
    serial,
    signTime,
    tsReq.nonce
  );

  // Build SignedData containing TSTInfo
  const signedData = await buildSignedData(tstInfo, ctx, hashAlg, signTime);

  // Build TimeStampResponse
  // PKIStatusInfo: status = granted (0)
  const statusW = new ASN1Writer();
  statusW.writeInteger(0);
  const statusInfo = buildSequence(statusW.getBuffer());

  // Full response
  return buildSequence(concatBytes(statusInfo, signedData));
}

/**
 * Generate Authenticode timestamp response
 * Follows the same logic as the C# implementation:
 * 1. Parse request PKCS#7, extract the encapsulated content (octets/digest)
 * 2. Build a new CMS SignedData with those octets as encapsulated content
 */
export async function generateAuthenticodeResponse(
  request: Uint8Array,
  signTime: Date,
  ctx: TSAContext
): Promise<Uint8Array> {
  // Extract octets from the request PKCS#7 structure
  // Structure: ContentInfo { OID, [0] SignedData { ver, digestAlgs, ECI { OID, [0] { OCTET_STRING } }, ... } }
  const octets = extractAuthenticodeOctets(request);

  console.log('[TSA-Auth] request length:', request.length, 'extracted octets length:', octets.length);
  console.log('[TSA-Auth] octets[0..8]:', Array.from(octets.slice(0, 8)).map(b => b.toString(16).padStart(2, '0')).join(' '));
  console.log('[TSA-Auth] octets === request?', octets.length === request.length);

  const hashAlg = 'SHA-1'; // Authenticode uses SHA-1
  const hashAlgOID = OIDs.id_sha1;
  const sigAlgOID = getSignatureAlgorithmOID(ctx.keyType, hashAlg);

  // Compute digest of the octets (content to be signed)
  const contentDigest = await computeDigest(octets, 'SHA-1');

  // Build SignedAttributes (contentType + signingTime + messageDigest)
  const signedAttrsContent = buildSignedAttributes(OIDs.id_data, signTime, contentDigest);
  const signedAttrsSet = buildSet(signedAttrsContent);

  // Sign the SET-encoded signedAttrs
  const signature = await signData(signedAttrsSet, ctx.privateKey, ctx.keyType, hashAlg);

  // Build SignerInfo
  const signerInfo = buildSignerInfo(
    ctx.issuerDER, ctx.serialDER, hashAlgOID, sigAlgOID,
    signedAttrsContent, signature
  );

  // Build SignedData
  const digestAlgSet = buildSet(buildAlgorithmIdentifier(hashAlgOID));

  // EncapsulatedContentInfo (id-data, encapsulating the octets)
  const eciOidW = new ASN1Writer();
  eciOidW.writeOID(OIDs.id_data);
  const eciContentW = new ASN1Writer();
  eciContentW.writeOctetString(octets);
  const eciExplicit = buildExplicitTag(0, eciContentW.getBuffer());
  const eci = buildSequence(concatBytes(eciOidW.getBuffer(), eciExplicit));

  // Certificates [0]
  const certsExplicit = buildExplicitTag(0, ctx.certDER);

  // SignerInfos SET
  const signerInfoSet = buildSet(signerInfo);

  // SignedData SEQUENCE
  const versionW = new ASN1Writer();
  versionW.writeInteger(1);
  const signedData = buildSequence(concatBytes(
    versionW.getBuffer(),
    digestAlgSet,
    eci,
    certsExplicit,
    signerInfoSet
  ));

  // ContentInfo wrapper
  const ciOidW = new ASN1Writer();
  ciOidW.writeOID(OIDs.id_signedData);
  const ciContent = buildExplicitTag(0, signedData);
  return buildSequence(concatBytes(ciOidW.getBuffer(), ciContent));
}

/**
 * Extract the encapsulated content octets from an Authenticode timestamp request.
 *
 * Microsoft Authenticode format (SPC_TIME_STAMP_REQUEST):
 *   SEQUENCE {
 *     OID 1.3.6.1.4.1.311.3.2.1
 *     SEQUENCE {                   -- ContentInfo
 *       OID 1.2.840.113549.1.7.1  -- id-data
 *       [0] { OCTET_STRING }      -- the signature bytes
 *     }
 *   }
 *
 * Standard PKCS#7:
 *   SEQUENCE { OID(signedData), [0] SignedData { ver, algSet, ECI, ... } }
 */
function extractAuthenticodeOctets(request: Uint8Array): Uint8Array {
  try {
    const reader = new ASN1Reader(request);
    const root = reader.parse();
    if (!root.children || root.children.length < 2) return request;

    const firstChild = root.children[0];
    if (firstChild.tag !== ASN1_TAG.OID) return request;

    const oid = parseOID(firstChild.value);
    console.log('[TSA-Auth] Top-level OID:', oid);

    // Microsoft SPC Timestamp Request: 1.3.6.1.4.1.311.3.2.1
    if (oid === '1.3.6.1.4.1.311.3.2.1') {
      const contentInfo = root.children[1]; // Inner ContentInfo SEQUENCE
      if (!contentInfo.children || contentInfo.children.length < 2) return request;

      // contentInfo.children[0] = OID (id-data)
      // contentInfo.children[1] = [0] { OCTET_STRING(signature bytes) }
      const explicitTag = contentInfo.children[1];
      if (!explicitTag.children || explicitTag.children.length < 1) return request;

      const octetString = explicitTag.children[0];
      console.log('[TSA-Auth] Extracted SPC octets, length:', octetString.value.length);
      return octetString.value;
    }

    // Standard PKCS#7 SignedData: 1.2.840.113549.1.7.2
    if (oid === '1.2.840.113549.1.7.2') {
      const a0 = root.children[1];
      if (!a0.children || a0.children.length < 1) return request;
      const signedData = a0.children[0];
      if (!signedData.children || signedData.children.length < 3) return request;
      const eci = signedData.children[2];
      if (!eci.children || eci.children.length < 2) return request;
      const eciContent = eci.children[1];
      if (!eciContent.children || eciContent.children.length < 1) return request;
      const octetString = eciContent.children[0];
      console.log('[TSA-Auth] Extracted PKCS7 octets, length:', octetString.value.length);
      return octetString.value;
    }

    console.log('[TSA-Auth] Unknown OID:', oid);
    return request;
  } catch (e: any) {
    console.log('[TSA-Auth] Parse error:', e.message);
    return request;
  }
}

/**
 * Build a failure response
 */
function buildFailureResponse(status: number, statusString: string): Uint8Array {
  const w = new ASN1Writer();
  w.writeInteger(status);
  const statusInfo = buildSequence(w.getBuffer());
  return buildSequence(statusInfo);
}

/**
 * Detect if request is RFC 3161 or Authenticode
 */
export function isRFC3161Request(data: Uint8Array): boolean {
  try {
    const reader = new ASN1Reader(data);
    const root = reader.parse();
    if (root.tag !== ASN1_TAG.SEQUENCE || !root.children) return false;
    // RFC 3161 starts with version (INTEGER) then messageImprint (SEQUENCE)
    const firstChild = root.children[0];
    return firstChild.tag === ASN1_TAG.INTEGER;
  } catch {
    return false;
  }
}
