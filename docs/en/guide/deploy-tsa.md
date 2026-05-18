# Deploy TSA Server

## Option 1: Cloudflare Workers (Recommended)

Edit `TSWorker/wrangler.toml`:

```toml
[vars]
TSA_FAKE = "true"
TSA_CERT = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
TSA_KEYS = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

Deploy:
```bash
cd TSWorker && npm install && npm run deploy
```

## Option 2: Windows Local

Edit `config.json`, then run `TimeStamping.exe` as administrator.

## Option 3: Docker

```bash
docker build -t tsa-server ./DockerUI
docker run -p 80:80 tsa-server
```

## Getting a TSA Certificate

Visit [Pikachu Public Test CA](https://testca.524228.xyz/) to obtain a timestamp certificate online.
