/**
 * Environment bindings for Cloudflare Workers
 */
export interface Env {
  // Base64 encoded PEM certificate
  TSA_CERT: string;
  // Base64 encoded PEM private key
  TSA_KEYS: string;
  // Key type: RSA, EC-P256, EC-P384, EC-P521, SM2
  TSA_TYPE?: string;
  // Whether to allow fake time: "true" or "false"
  TSA_FAKE?: string;
}
