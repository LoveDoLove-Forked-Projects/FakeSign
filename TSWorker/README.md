# Timestamp Worker

基于 [Hono](https://hono.dev) 框架的 RFC 3161 & Authenticode 时间戳签名服务，部署在 [Cloudflare Workers](https://workers.cloudflare.com) 上。

## 功能特性

- **双协议支持**：RFC 3161 时间戳协议 + Microsoft Authenticode 时间戳协议
- **多摘要算法**：SHA-1、SHA-256、SHA-384、SHA-512、SM3
- **多签名算法**：RSA (2048/3072/4096)、ECC (P-256/P-384/P-521)、SM2
- **自定义时间**：支持通过 URL 路径指定签名时间（可配置是否允许）
- **边缘计算**：部署在 Cloudflare Workers 全球边缘网络，零冷启动
- **自动协议识别**：自动区分 RFC 3161 和 Authenticode 请求格式

## 快速开始

### 安装依赖

```bash
cd TimeStampWorker
npm install
```

### 本地开发

```bash
npm run dev
```

### 部署

```bash
npm run deploy
```

## 环境变量配置

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `TSA_CERT` | 是 | PEM 格式的 TSA 证书 |
| `TSA_KEYS` | 是 | PEM 格式的私钥（PKCS#8） |
| `TSA_TYPE` | 否 | 密钥类型：`RSA`、`EC-P256`、`EC-P384`、`EC-P521`、`SM2`（默认 `RSA`） |
| `TSA_FAKE` | 否 | 是否允许自定义时间：`true` 或 `false`（默认 `false`） |

### Wrangler 配置示例

在 `wrangler.toml` 中配置环境变量，或使用 Cloudflare Dashboard 设置 Secrets：

```toml
[vars]
TSA_TYPE = "RSA"
TSA_FAKE = "true"

# 证书和私钥建议使用 wrangler secret 设置
# wrangler secret put TSA_CERT
# wrangler secret put TSA_KEYS
```

## API 接口

### GET /

服务介绍页面。

### GET /info

返回服务配置信息（JSON）。

### GET /health

健康检查端点。

### POST /

使用当前真实时间进行时间戳签名。

- **RFC 3161**：请求体为二进制 DER 编码的 `TimeStampRequest`
- **Authenticode**：请求体为 Base64 编码的 PKCS#7 SignedData

### POST /{datetime}

使用指定时间进行时间戳签名（需 `TSA_FAKE=true`）。

- **时间格式**：`yyyy-MM-ddTHH:mm:ss`（UTC）
- **示例**：`POST /2020-01-01T00:00:00`

## 使用示例

### signtool (RFC 3161)

```cmd
REM 使用真实时间
signtool sign /tr http://your-domain/ /td SHA256 /fd SHA256 /f cert.pfx file.exe

REM 使用自定义时间
signtool sign /tr http://your-domain/2020-01-01T00:00:00 /td SHA256 /fd SHA256 /f cert.pfx file.exe
```

### signtool (Authenticode)

```cmd
REM Legacy Authenticode 时间戳
signtool sign /t http://your-domain/ /f cert.pfx file.exe

REM 使用自定义时间
signtool sign /t http://your-domain/2020-06-15T12:00:00 /f cert.pfx file.exe
```

### cURL

```bash
# RFC 3161 请求
curl -X POST -H "Content-Type: application/timestamp-query" \
     --data-binary @request.tsq http://your-domain/ \
     -o response.tsr
```

## 项目结构

```
TimeStampWorker/
├── src/
│   ├── index.ts              # Hono 路由入口
│   ├── types.ts              # 类型定义
│   ├── asn1/
│   │   ├── der.ts            # ASN.1 DER 编解码
│   │   └── oids.ts           # OID 常量定义
│   ├── crypto/
│   │   └── keys.ts           # 加密操作（签名、密钥导入）
│   ├── timestamp/
│   │   └── responder.ts      # 时间戳响应生成器
│   └── pages/
│       └── index.ts          # INDEX 页面 HTML
├── package.json
├── tsconfig.json
├── wrangler.toml
└── README.md
```

## 协议说明

### RFC 3161 工作流程

1. 客户端发送 `TimeStampRequest`（包含消息摘要）
2. 服务器构建 `TSTInfo`（包含时间、序列号、策略 OID）
3. 使用 CMS SignedData 包装 TSTInfo
4. 返回 `TimeStampResponse`

### Authenticode 工作流程

1. 客户端发送 Base64 编码的 PKCS#7 SignedData
2. 服务器计算请求摘要
3. 构建包含签名时间属性的 CMS SignedData
4. 返回 Base64 编码的响应

## 与原项目关系

本项目是 [DriverSigner](https://github.com/ArcticLampyrid/DriverSigner) 项目中 `TimeTool/` (C# .NET) 时间戳服务的 Cloudflare Workers 重新实现，保持了相同的 API 请求/响应格式和虚假时间戳功能。

## License

MIT
