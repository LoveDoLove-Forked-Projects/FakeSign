---
layout: home
hero:
  name: FakeSign
  text: 自建时间戳驱动签名
  tagline: 利用伪造时间戳实现 Windows 驱动签名认证
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/quick-start
    - theme: alt
      text: 技术原理
      link: /zh/guide/principles
    - theme: alt
      text: GitHub
      link: https://github.com/PIKACHUIM/FakeSign

features:
  - icon: 🕐
    title: 时间戳伪造
    details: 自建 RFC 3161 / Authenticode 时间戳服务，支持自定义签名时间
  - icon: 🔐
    title: 多算法支持
    details: 支持 RSA / ECC / SM2 密钥，SHA-1 / SHA-256 / SHA-384 / SHA-512 / SM3 摘要
  - icon: ☁️
    title: 边缘部署
    details: 基于 Cloudflare Workers，全球低延迟，零冷启动
  - icon: 🛡️
    title: 驱动签名
    details: 支持 Windows 内核驱动签名，兼容安全启动
---
