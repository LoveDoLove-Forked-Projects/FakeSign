/**
 * ASN.1 OID constants and utility functions for timestamp services
 */

// OID definitions
export const OIDs = {
  // Content Types
  id_data: '1.2.840.113549.1.7.1',
  id_signedData: '1.2.840.113549.1.7.2',
  id_ct_TSTInfo: '1.2.840.113549.1.9.16.1.4',

  // Attributes
  id_contentType: '1.2.840.113549.1.9.3',
  id_messageDigest: '1.2.840.113549.1.9.4',
  id_signingTime: '1.2.840.113549.1.9.5',
  id_smimeCapabilities: '1.2.840.113549.1.9.15',
  id_signingCertificateV2: '1.2.840.113549.1.9.16.2.47',

  // Hash Algorithms
  id_sha1: '1.3.14.3.2.26',
  id_sha256: '2.16.840.1.101.3.4.2.1',
  id_sha384: '2.16.840.1.101.3.4.2.2',
  id_sha512: '2.16.840.1.101.3.4.2.3',
  id_sm3: '1.2.156.10197.1.401',
  id_md5: '1.2.840.113549.2.5',

  // Signature Algorithms
  id_rsaEncryption: '1.2.840.113549.1.1.1',
  id_sha1WithRSA: '1.2.840.113549.1.1.5',
  id_sha256WithRSA: '1.2.840.113549.1.1.11',
  id_sha384WithRSA: '1.2.840.113549.1.1.12',
  id_sha512WithRSA: '1.2.840.113549.1.1.13',
  id_ecdsaWithSHA256: '1.2.840.10045.4.3.2',
  id_ecdsaWithSHA384: '1.2.840.10045.4.3.3',
  id_ecdsaWithSHA512: '1.2.840.10045.4.3.4',
  id_ecPublicKey: '1.2.840.10045.2.1',
  id_sm2WithSM3: '1.2.156.10197.1.501',
  id_sm2: '1.2.156.10197.1.301',

  // ECC Named Curves
  id_prime256v1: '1.2.840.10045.3.1.7',
  id_secp384r1: '1.3.132.0.34',
  id_secp521r1: '1.3.132.0.35',

  // TSA Policy
  id_tsaPolicy: '1.3.6.1.4.1.13762.3',
} as const;

// Hash algorithm name to OID mapping
export const HashAlgorithmOIDs: Record<string, string> = {
  'SHA-1': OIDs.id_sha1,
  'SHA-256': OIDs.id_sha256,
  'SHA-384': OIDs.id_sha384,
  'SHA-512': OIDs.id_sha512,
  'SM3': OIDs.id_sm3,
};

// OID to hash algorithm name mapping
export const OIDToHashAlgorithm: Record<string, string> = {
  [OIDs.id_sha1]: 'SHA-1',
  [OIDs.id_sha256]: 'SHA-256',
  [OIDs.id_sha384]: 'SHA-384',
  [OIDs.id_sha512]: 'SHA-512',
  [OIDs.id_sm3]: 'SM3',
  [OIDs.id_md5]: 'MD5',
};

// Signature algorithm selection based on key type and hash
export function getSignatureAlgorithmOID(keyType: string, hashAlg: string): string {
  if (keyType === 'SM2') return OIDs.id_sm2WithSM3;
  if (keyType.startsWith('EC')) {
    switch (hashAlg) {
      case 'SHA-384': return OIDs.id_ecdsaWithSHA384;
      case 'SHA-512': return OIDs.id_ecdsaWithSHA512;
      default: return OIDs.id_ecdsaWithSHA256;
    }
  }
  // RSA
  switch (hashAlg) {
    case 'SHA-1': return OIDs.id_sha1WithRSA;
    case 'SHA-384': return OIDs.id_sha384WithRSA;
    case 'SHA-512': return OIDs.id_sha512WithRSA;
    default: return OIDs.id_sha256WithRSA;
  }
}

// Get WebCrypto algorithm name for signing
export function getWebCryptoSignAlgorithm(keyType: string, hashAlg: string): AlgorithmIdentifier | RsaPssParams | EcdsaParams {
  if (keyType.startsWith('EC') || keyType === 'SM2') {
    return { name: 'ECDSA', hash: hashAlg === 'SM3' ? 'SHA-256' : hashAlg } as EcdsaParams;
  }
  return { name: 'RSASSA-PKCS1-v1_5' } as AlgorithmIdentifier;
}
