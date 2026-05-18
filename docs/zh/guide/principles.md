# 技术原理

## 核心思路

Windows 驱动签名验证的核心逻辑是：**签名时间在证书有效期内即为合法**。

通过搭建自建时间戳服务器，我们可以返回任意时间的时间戳响应，使得签名看起来是在证书有效期内完成的。

![原理图](https://github.com/PIKACHUIM/FakeSign/raw/main/Pictures/20230425160222.jpg)

## 时间戳协议

### RFC 3161

标准的时间戳协议，signtool 使用 `/tr` 参数调用：

1. 客户端发送 `TimeStampRequest`（包含文件哈希）
2. 服务器生成 `TSTInfo`（包含时间、序列号等）
3. 用 CMS SignedData 包装并签名
4. 返回 `TimeStampResponse`

### Authenticode

微软旧版时间戳协议，signtool 使用 `/t` 参数调用：

1. 客户端发送 Base64 编码的签名数据
2. 服务器提取签名内容
3. 生成包含签名时间的 CMS SignedData
4. 返回 Base64 编码的响应

## 自建 TSA 的要求

1. **TSA 证书**：需要包含时间戳增强型密钥用法 (EKU)
2. **CRL/OCSP**：证书需要有效的撤销检查地址
3. **签名算法**：至少支持 SHA-1 和 SHA-256

## 为什么能绕过验证

微软在 2019 年 7 月之前签发的 EV 交叉签名证书具备直接签署驱动的能力。只要时间戳表明签名是在证书有效期内完成的，Windows 就会接受该签名。

::: danger 注意
此技术仅供安全研究和驱动开发调试使用，不得用于任何非法目的。
:::
