# TSA Worker 开发

## 架构概述

TSWorker 是基于 Hono 框架的时间戳签名服务，部署在 Cloudflare Workers 上。

```
TSWorker/src/
├── index.ts              # 路由入口
├── types.ts              # 类型定义
├── asn1/
│   ├── der.ts            # ASN.1 DER 编解码
│   └── oids.ts           # OID 常量
├── crypto/
│   └── keys.ts           # 密钥导入与签名
├── timestamp/
│   └── responder.ts      # 时间戳响应生成
└── pages/
    └── index.ts          # 首页 HTML
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `TSA_CERT` | ✅ | PEM 格式证书 |
| `TSA_KEYS` | ✅ | PEM 格式私钥 |
| `TSA_KEYS_TYPE` | ❌ | 密钥类型 (默认 RSA) |
| `TSA_FAKE` | ❌ | 允许伪造时间 (默认 false) |

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 服务首页 |
| GET | `/info` | 配置信息 |
| GET | `/health` | 健康检查 |
| POST | `/` | 时间戳签名（真实时间） |
| POST | `/{datetime}` | 时间戳签名（自定义时间） |

## 本地开发

```bash
cd TSWorker
npm install
npm run dev
```

访问 `http://localhost:8787`
