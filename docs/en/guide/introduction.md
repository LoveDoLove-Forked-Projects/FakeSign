# Introduction

## Background

Code signing certificates are expensive — EV certificates cost thousands per year. For individual developers or driver testing, this is impractical.

Microsoft suspended EV cross-signing certificate CA issuance in July 2019. Certificates issued before that date can still be used for driver signing. By using a self-built timestamp server with these certificates, we can forge signing timestamps to achieve driver authentication.

## How It Works

1. Obtain a valid EV code signing certificate (within its validity period)
2. Set up a self-hosted timestamp server (TSA)
3. Sign drivers with a custom timestamp URL, setting the time within the certificate's validity
4. Windows validates the timestamp and confirms the signature was made during the certificate's validity

## Components

| Module | Description | Stack |
|--------|-------------|-------|
| **TSWorker** | Cloudflare Workers TSA service | TypeScript / Hono |
| **TimeTool** | Windows local TSA server | C# / .NET / BouncyCastle |
| **SignTool** | Hook signing tool | C++ |
| **DockerUI** | Docker deployment | Mono / Ubuntu |

## Supported Protocols & Algorithms

**Timestamp Protocols:** RFC 3161, Microsoft Authenticode

**Hash Algorithms:** SHA-1, SHA-256, SHA-384, SHA-512, SM3

**Signing Algorithms:** RSA 2048/3072/4096, ECC P-256/P-384/P-521, SM2

## Public TSA Servers

| URL | Status |
|-----|--------|
| `http://timers.dns.navy/` | ✅ Active |
| `http://timers.524228.xyz/` | ✅ Active |
| `http://timers.us.kg/` | ✅ Active |
