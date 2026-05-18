# Principles

## Core Concept

Windows driver signature verification logic: **a signature is valid if the timestamp falls within the certificate's validity period.**

By hosting a custom timestamp server, we can return arbitrary timestamps, making signatures appear to have been created during the certificate's validity period.

## Timestamp Protocols

### RFC 3161

Standard timestamp protocol, invoked via `signtool /tr`:

1. Client sends `TimeStampRequest` (containing file hash)
2. Server generates `TSTInfo` (time, serial number, policy)
3. Wraps in CMS SignedData and signs
4. Returns `TimeStampResponse`

### Authenticode

Legacy Microsoft protocol, invoked via `signtool /t`:

1. Client sends Base64-encoded signature data
2. Server extracts the signature content
3. Generates CMS SignedData with signing time
4. Returns Base64-encoded response

## TSA Certificate Requirements

- Key Usage: Digital Signature
- Enhanced Key Usage: Time Stamping (1.3.6.1.5.5.7.3.8)
- Valid CRL or OCSP endpoint

::: danger Warning
This technique is for security research and driver development debugging only.
:::
