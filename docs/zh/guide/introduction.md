# 项目介绍

## 背景

购买代码签名证书非常昂贵，EV 代码签名证书一年需要几千元。对于个人开发者或驱动调试需求，这极不划算。

微软于 2019 年 7 月暂停了 EV 交叉驱动签名证书 CA 的签发。在此之前签发的证书仍可用于驱动签名认证。利用自建时间戳服务器，配合这些证书，可以通过伪造签名时间来实现驱动签名。

## 工作原理

1. 获取有效期内的 EV 代码签名证书
2. 搭建自建时间戳服务器（TSA）
3. 签名时指定自定义时间戳 URL，将时间设置在证书有效期内
4. Windows 验证签名时检查时间戳，确认签名在证书有效期内完成

## 项目组成

| 模块 | 说明 | 技术栈 |
|------|------|--------|
| **TSWorker** | Cloudflare Workers 时间戳服务 | TypeScript / Hono |
| **TimeTool** | Windows 本地时间戳服务器 | C# / .NET / BouncyCastle |
| **SignTool** | Hook 签名工具 | C++ |
| **DockerUI** | Docker 容器部署 | Mono / Ubuntu |

## 支持的协议与算法

**时间戳协议：**
- RFC 3161 (signtool `/tr`)
- Microsoft Authenticode (signtool `/t`)

**摘要算法：** SHA-1, SHA-256, SHA-384, SHA-512, SM3

**签名算法：** RSA 2048/3072/4096, ECC P-256/P-384/P-521, SM2

## 可用公共服务

| 时间戳地址 | 状态 |
|---|---|
| `http://timers.dns.navy/` | ✅ 可用 |
| `http://timers.524228.xyz/` | ✅ 可用 |
| `http://timers.us.kg/` | ✅ 可用 |
