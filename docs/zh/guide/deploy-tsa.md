# 自建服务

::: tip
一般情况下直接使用公共时间戳服务即可。只有在需要自定义证书或私有部署时才需要自建。
:::

## 方式一：Cloudflare Workers（推荐）

基于 TypeScript + Hono 的 Serverless 部署方案。

### 配置

编辑 `TSWorker/wrangler.toml`：

```toml
[vars]
TSA_FAKE = "true"
TSA_CERT = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
TSA_KEYS = "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
# TSA_KEYS_TYPE = "RSA"  # 可选: RSA, EC-P256, EC-P384, EC-P521, SM2
```

### 部署

```bash
cd TSWorker
npm install
npm run deploy
```

## 方式二：Windows 本地服务

### 配置

编辑 `config.json`：

```json
{
  "listen_path": "/",
  "listen_addr": "localhost",
  "listen_port": "1003",
  "server_cert": "TSA.crt",
  "server_keys": "TSA.key",
  "server_fake": "true"
}
```

### 运行

```cmd
TimeStamping.exe
```

## 方式三：Docker

```bash
docker build -t tsa-server ./DockerUI
docker run -p 80:80 tsa-server
```

## 获取 TSA 证书

前往 [皮卡丘公共服务测试根证书](https://testca.524228.xyz/) 在线申请时间戳证书，或使用 XCA 自行签发。

证书要求：
- 密钥用途：Digital Signature
- 增强型密钥用法：时间戳 (1.3.6.1.5.5.7.3.8)
- 配置 CRL 或 OCSP 地址
