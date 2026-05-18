# TSA Worker Development

## Architecture

```
TSWorker/src/
├── index.ts              # Hono routes
├── types.ts              # Type definitions
├── asn1/                 # ASN.1 DER codec
├── crypto/               # Key import & signing
├── timestamp/            # Response generation
└── pages/                # Index page HTML
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TSA_CERT` | Yes | PEM certificate |
| `TSA_KEYS` | Yes | PEM private key |
| `TSA_KEYS_TYPE` | No | Key type (default: RSA) |
| `TSA_FAKE` | No | Allow fake time (default: false) |

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service page |
| GET | `/info` | Configuration JSON |
| POST | `/` | Timestamp (real time) |
| POST | `/{datetime}` | Timestamp (custom time) |

## Local Development

```bash
cd TSWorker && npm install && npm run dev
```
