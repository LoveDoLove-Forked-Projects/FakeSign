/**
 * Timestamp Worker - Main Entry Point
 * Hono-based RFC 3161 & Authenticode Timestamp Server
 * Deployed on Cloudflare Workers
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import {
  generateRFC3161Response,
  generateAuthenticodeResponse,
  isRFC3161Request,
  parseTimeStampRequest,
  TSAContext
} from './timestamp/responder';
import {
  importPrivateKey,
  importRSAPrivateKeyWithHash,
  extractCertFields,
  base64ToBytes,
  bytesToBase64,
  KeyType
} from './crypto/keys';
import { indexHTML } from './pages/index';

type HonoEnv = { Bindings: Env };

const app = new Hono<HonoEnv>();

// CORS support
app.use('*', cors());

// Index page
app.get('/', (c) => {
  return c.html(indexHTML);
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Info endpoint
app.get('/info', (c) => {
  const allowFakeTime = c.env.TSA_FAKE === 'true';
  const keyType = (c.env.TSA_TYPE || 'RSA') as KeyType;
  return c.json({
    service: 'Timestamp Authority',
    version: '1.0.0',
    keyType,
    allowFakeTime,
    supportedHashAlgorithms: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'SM3'],
    supportedKeyTypes: ['RSA2048', 'RSA3072', 'RSA4096', 'EC-P256', 'EC-P384', 'EC-P521', 'SM2'],
    protocols: ['RFC 3161', 'Authenticode'],
    usage: {
      realTime: 'POST /',
      fakeTime: 'POST /{yyyy-MM-ddTHH:mm:ss}',
      example: 'signtool sign /tr http://your-domain/ /td SHA256 file.exe'
    }
  });
});

/**
 * Initialize TSA context from environment
 */
async function initTSAContext(env: Env, hashAlg = 'SHA-256'): Promise<TSAContext> {
  const certPEM = env.TSA_CERT;
  const keyPEM = env.TSA_KEYS;
  const keyType = (env.TSA_TYPE || 'RSA') as KeyType;

  // Parse certificate
  const certB64 = certPEM
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\s+/g, '');
  const certDER = base64ToBytes(certB64);

  // Extract issuer and serial from certificate
  const { issuerDER, serialDER } = extractCertFields(certDER);

  // Import private key
  let privateKey: CryptoKey;
  if (keyType === 'RSA') {
    privateKey = await importRSAPrivateKeyWithHash(keyPEM, hashAlg);
  } else {
    privateKey = await importPrivateKey(keyPEM, keyType);
  }

  return {
    privateKey,
    keyType,
    certDER,
    issuerDER,
    serialDER,
    config: {
      certPEM,
      keyPEM,
      keyType,
      allowFakeTime: env.TSA_FAKE === 'true'
    }
  };
}

/**
 * Parse fake time from URL path
 */
function parseFakeTime(path: string, allowFakeTime: boolean): Date {
  if (!allowFakeTime) return new Date();

  // Remove leading slash
  const dateStr = path.replace(/^\/+/, '');
  if (!dateStr) return new Date();

  // Try to parse yyyy-MM-ddTHH:mm:ss format
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    const date = new Date(Date.UTC(
      parseInt(year), parseInt(month) - 1, parseInt(day),
      parseInt(hour), parseInt(minute), parseInt(second)
    ));
    if (!isNaN(date.getTime())) return date;
  }

  return new Date();
}

// Timestamp endpoint - handles both RFC 3161 and Authenticode
// POST / - use current time
// POST /{datetime} - use fake time (if allowed)
app.post('/*', async (c) => {
  try {
    const allowFakeTime = c.env.TSA_FAKE === 'true';
    const path = c.req.path;

    // Parse sign time from URL
    const signTime = parseFakeTime(path, allowFakeTime);

    // Read request body
    const body = await c.req.arrayBuffer();
    const contentType = c.req.header('Content-Type') || '';
    let requestData: Uint8Array;

    console.log('[TSA] Content-Type:', contentType, 'Body length:', body.byteLength);

    // Authenticode uses application/octet-stream with the body being 
    // a base64-encoded PKCS#7 SignedData, or form-urlencoded
    let isAuthenticode = false;
    const bodyBytes = new Uint8Array(body);
    const bodyText = new TextDecoder().decode(bodyBytes);

    // Check if it's URL-encoded form data (Authenticode legacy format)
    if (contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('application/octet-stream')) {
      // Legacy Authenticode: body is base64 PKCS#7
      // Match C# behavior: keep only valid base64 characters (A-Z, a-z, 0-9, +, /, =)
      let cleaned = '';
      for (let i = 0; i < bodyBytes.length; i++) {
        const ch = bodyBytes[i];
        // Keep only printable ASCII that's valid in base64
        if ((ch >= 65 && ch <= 90) ||  // A-Z
            (ch >= 97 && ch <= 122) || // a-z
            (ch >= 48 && ch <= 57) ||  // 0-9
            ch === 43 || ch === 47 || ch === 61) { // + / =
          cleaned += String.fromCharCode(ch);
        }
      }
      console.log('[TSA] Cleaned base64 length:', cleaned.length, 'first 20:', cleaned.substring(0, 20));
      try {
        requestData = base64ToBytes(cleaned);
        isAuthenticode = true;
        console.log('[TSA] Detected Authenticode, decoded length:', requestData.length);
      } catch (e: any) {
        requestData = bodyBytes;
        console.log('[TSA] Failed to base64 decode:', e.message);
      }
    } else if (contentType.includes('timestamp-query') || contentType.includes('timestamp-request')) {
      // RFC 3161 binary request
      requestData = bodyBytes;
      console.log('[TSA] Detected RFC 3161 (content-type)');
    } else {
      // Auto-detect: try RFC 3161 first
      requestData = bodyBytes;
      if (!isRFC3161Request(requestData)) {
        // Try base64 decode
        const cleaned = bodyText.replace(/\s+/g, '');
        if (/^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 0) {
          try {
            const decoded = base64ToBytes(cleaned);
            if (decoded.length > 0) {
              requestData = decoded;
              isAuthenticode = !isRFC3161Request(decoded);
              console.log('[TSA] Auto-detected:', isAuthenticode ? 'Authenticode' : 'RFC3161 (base64)');
            }
          } catch {
            // Not base64
          }
        }
      } else {
        console.log('[TSA] Auto-detected: RFC 3161 (binary)');
      }
    }

    console.log('[TSA] isAuthenticode:', isAuthenticode, 'requestData[0..4]:', 
      Array.from(requestData.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join(' '));

    // Determine hash algorithm from request for proper key initialization
    let hashAlg = 'SHA-256';
    if (!isAuthenticode && isRFC3161Request(requestData)) {
      // Try to extract hash alg from request
      const tsReq = parseTimeStampRequest(requestData);
      if (tsReq) {
        hashAlg = tsReq.messageImprint.hashAlgorithm;
      }
    } else {
      hashAlg = 'SHA-1'; // Authenticode uses SHA-1
    }

    // Initialize context
    const ctx = await initTSAContext(c.env, hashAlg);

    if (isAuthenticode) {
      // Authenticode timestamp response
      const response = await generateAuthenticodeResponse(requestData, signTime, ctx);
      const responseBase64 = bytesToBase64(response);
      return new Response(responseBase64, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Cache-Control': 'no-cache',
        }
      });
    } else {
      // RFC 3161 timestamp response
      const response = await generateRFC3161Response(requestData, signTime, ctx);
      return new Response(response, {
        headers: {
          'Content-Type': 'application/timestamp-reply',
          'Cache-Control': 'no-cache',
        }
      });
    }
  } catch (err: any) {
    console.error('Timestamp error:', err);
    return c.json({ error: 'Internal server error', message: err.message }, 500);
  }
});

export default app;
