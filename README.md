# FakeSign - 自建时间戳服务实现伪签名驱动证书

# Drivers Signing with Self-Sign Fake Timestamp Servers

<p align="center">
  <img src="Pictures/20241114143520.png" alt="FakeSign" width="640">
</p>

<p align="center">
  <a href="https://fakesign.pages.dev">📖 文档站</a> ·
  <a href="https://test.certs.us.kg/">🔑 申请证书</a> ·
  <a href="Argument/DISCLAIMER.md">⚠️ 免责声明</a>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/PIKACHUIM/FakeSign/releases"><img src="https://img.shields.io/github/v/release/PIKACHUIM/FakeSign" alt="Release"></a>
</p>

---

## 项目背景 | Background

购买代码签名证书非常昂贵，EV 代码签名证书一年需要几千元，且需要公司认证。对于个人开发者或驱动调试需求，这极不划算。

微软于 **2019 年 7 月**暂停了 EV 交叉驱动签名证书 CA 的签发，意味着此后不能直接使用 EV 代码签名，需要 WHQL 认证。但在此之前签发的证书仍可直接签署驱动完成认证。

本项目通过**自建时间戳服务器**，配合这些证书，将签名时间戳伪造到证书有效期内，从而实现驱动签名认证。

Purchasing a code signing certificate is very expensive. Microsoft suspended EV cross-driver signing certificate CA issuance in July 2019. Certificates issued before that date can still sign drivers directly. This project uses a self-built timestamp server to forge timestamps within the certificate's validity period, achieving driver signing authentication.

## 可用时间戳服务 | Available TSA Servers

| 地址 / URL | 状态 |
|---|---|
| `http://timers.dns.navy/` | ✅ Active |
| `http://timers.524228.xyz/` | ✅ Active |
| `http://timers.us.kg/` | ✅ Active |

## 快速开始 | Quick Start

### 1. 安装信任证书

下载并运行 [数字证书安装工具](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/PikachuTestCert.exe)，按提示完成安装。

```cmd
REM 静默安装（管理员权限）
PikachuTestCert.exe /VERYSILENT
```

### 2. 获取签名证书

获取 EV 代码签名证书（本项目 **不提供任何证书**，可参考 [FuckCertVerifyTime](https://github.com/wanttobeno/FuckCertVerifyTime)）

### 3. 签名驱动文件

#### 方式一：使用 signtool 命令行

```cmd
REM RFC 3161 时间戳签名（SHA-256，推荐）
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T00:00:00" /td sha256 /v driver.sys

REM Authenticode 时间戳签名（SHA-1，旧版兼容）
signtool sign /f cert.pfx /p password ^
  /t "http://timers.524228.xyz/2015-01-01T00:00:00" /v driver.sys
```

#### 方式二：使用亚洲诚信签名工具

1. 下载 [亚洲诚信签名工具](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/TimestampClient.zip)
2. 修改 `hook.ini`：
   ```ini
   [TimeStamp]
   TimeStamp=2015-01-01T08:00:00
   ServerURL=http://timers.524228.xyz/
   ```
3. 打开 DSignTool.exe → 规则管理 → 添加 → 勾选「将时间戳添加到数据中」→ 选中「定义的时间戳」
4. 数字签名 → 拖入文件 → 选择「双签名」或「SHA1」→ 驱动模式

### 4. 生成 CAT 并签名

```cmd
REM 修改系统时间（需 >= DriverVer 时间）
date 2015/01/01 && time 08:00:00

REM 生成 CAT（需安装 WDK）
inf2cat /v /os:Vista_X86,Vista_X64,7_X86,7_X64,8_X86,8_X64,6_3_X86,6_3_X64,10_X86,10_X64 /driver:.

REM 签名 CAT（时间 >= CAT 创建时间）
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T09:00:00" /td sha256 /v driver.cat
```

> ⚠️ **签名时间顺序**：`DriverVer时间` ≤ `SYS签名时间` ≤ `CAT创建时间` ≤ `CAT签名时间`

## 时间戳 URL 格式 | Timestamp URL Format

```
http://<服务器地址>/<yyyy-MM-ddTHH:mm:ss>
```

- 省略时间部分则使用服务器当前时间
- 时间为 UTC 格式

## 实现原理 | Principles

### 微软内核模式驱动代码签名要求

![签名要求](https://github.com/PIKACHUIM/FakeSign/raw/main/Pictures/20230425155145.jpg)

| 适用于 | Win Vista/7 + Secure Boot Win8+ | Win8/8.1/10 (1507-1511) + Secure Boot | Win10 1607+ + Secure Boot |
|:---|:---|:---|:---|
| **架构** | 仅 64 位，32 位不需要签名 | 64 位、32 位 | 64 位、32 位 |
| **签名算法** | SHA2 | SHA2 | SHA2 |
| **证书** | 代码完整性信任的标准根 | 代码完整性信任的标准根 | Microsoft 根证书颁发机构 2010 |

### 伪造签名原理

![伪造签名原理](https://github.com/PIKACHUIM/FakeSign/raw/main/Pictures/20230425160222.jpg)

Windows 驱动签名验证时会检查时间戳，只要时间戳表明签名在证书有效期内完成，即视为合法。通过自建时间戳服务器返回任意时间的时间戳响应，即可绕过证书过期验证。

**自建伪造时间戳服务器需要：**

> - 自建 CA 证书（CA=TRUE，密钥用法=Certificate Signing, Off-line CRL Signing, CRL Signing，增强型密钥用法=2.5.29.32.0）
> - 自签时间戳签名证书（密钥用途=Digital Signature，增强型密钥用法=时间戳，OCSP-URL，CRL-URL）
> - 设置 CRL 地址（推荐 Nginx，把 CRL 文件放入对应地址），或者设置 OCSP 服务器（OpenSSL OCSP）
> - 搭建并启动时间戳响应服务器（RFC 3161 以及 Authenticode 格式，需要同时支持 SHA1+SHA256）

您可以直接前往 [皮卡丘公共服务测试根证书](https://test.certs.us.kg/) 一键申请时间戳证书，无需自建。

### 禁用内核驱动强制签名方法

**Windows 10 1607 之后 (UEFI + Secure Boot)：**
- 无法开启测试模式，*不能通过修改 BCD 解决*，**可以使用 EFIGuard**
- 每次开机进入高级模式 → 选择禁用内核驱动强制签名

**Windows 10 1607 之前，或关闭 Secure Boot：**
```shell
bcdedit /set {default} testsigning on
bcdedit /set nointegritychecks on
bcdedit /set testsigning on
bcdedit /debug ON
bcdedit /bootdebug ON
```

## 自建时间服务 | Deploy TSA Server

> 一般情况无需自建 TSA 服务，直接使用公共时间戳服务即可。如有需要，前往 [皮卡丘测试证书在线服务](https://test.certs.us.kg/) 申请证书。

### 方式一：Cloudflare Workers（推荐）

编辑 `TSWorker/wrangler.toml` 配置证书和密钥，然后部署：

```bash
cd TSWorker && npm install && npm run deploy
```

### 方式二：直接修改配置文件运行

```json
{
  "listen_path": "/TSA/",
  "listen_addr": "localhost",
  "listen_port": "1003",
  "server_urls": "http://test.timer.us.kg/",
  "server_cert": "TSA.crt",
  "server_keys": "TSA.key",
  "server_fake": "true"
}
```

### 方式三：Windows 部署

1. 生成 CA 和时间戳证书，参考 [XCA 自制 CA 证书并签发时间戳证书](https://code.52pika.cn/index.php/archives/330/)
2. 放置证书文件（**TSA.crt** 证书 Base64 编码、**TSA.key** 密钥 Base64 编码）到运行目录
3. 以管理员权限运行 `TimeStamping.exe`

### 方式四：Docker

```bash
docker build -t tsa-server ./DockerUI
docker run -p 80:80 tsa-server
```

### 方式五：Ubuntu + Wine（不推荐）

```shell
sudo dpkg --add-architecture i386
sudo apt-get install wine mono-complete winetricks wine32 winbind
sudo winetricks dotnet45
wine TimeStamping.exe
```

## 构建签名工具 | Build Sign Tool

### 修改 hook.ini 文件（推荐）

```ini
[TimeStamp]
TimeStamp=2015-01-01T00:00:00
ServerURL=http://localhost:1003/TSA/
```

### 编译 HookSigntool

1. 下载项目：
   ```shell
   git clone https://github.com/PIKACHUIM/FakeSign.git
   ```

2. 编辑 `SignTool/Hooktool/main.cpp`，取消注释并修改地址：
   ```c++
   wcscat(buf, L"http://你的地址:端口/路径/");
   ```

3. 使用 Visual Studio 编译，输出 `SignTool/Hooktool/bin/Debug`

### VS 编译时间戳服务器

1. 编辑 `TimeTool/TimeStamping/Program.cs`：
   ```c#
   static readonly string supportFake = @"true";  // true=伪造时间, false=真实时间
   ```

2. 使用 Visual Studio 打开 `TimeTool/TimeStamping.sln` 编译，输出 `TimeTool/TimeStamping/bin/Debug`

## 项目结构 | Project Structure

```
├── TSWorker/      # Cloudflare Workers 时间戳服务 (TypeScript + Hono)
├── TimeTool/      # Windows 本地时间戳服务器 (C# .NET + BouncyCastle)
├── SignTool/      # HookSigntool 签名工具 (C++)
├── DockerUI/      # Docker 容器部署方案
├── Releases/      # 预编译工具下载
├── docs/          # VitePress 文档站源码
└── Pictures/      # 文档图片资源
```

## 支持的协议与算法 | Supported Protocols

| 类别 | 支持内容 |
|------|---------|
| 时间戳协议 | RFC 3161 (`/tr`)、Authenticode (`/t`) |
| 摘要算法 | SHA-1、SHA-256、SHA-384、SHA-512、SM3 |
| 签名算法 | RSA 2048/3072/4096、ECC P-256/P-384/P-521、SM2 |

## 免责声明 | Disclaimers

**本文涉及网络安全实验，阅读本文表示您已经阅读、完全理解并承诺遵守下列条款的全部内容：**

<details>
<summary><strong>《自建时间戳服务器实现伪签名驱动证书》免责声明 - 简体中文</strong></summary>

1. **术语解释**
   - "实验内容"：包括本项目所提供的技术（包括但不限于代码、文件、步骤）及其衍生内容
   - "作者"：本实验技术的提供者，包括本文档创建人、网站提供者及其他协助者
   - "使用者"：使用本实验提供的技术及其衍生内容的主体

2. **实验目的**
   - 本实验**旨在**提供网络安全技术的实践学习和技术研究
   - 本实验**仅供**个人或团体进行非商业性质的技术探索

3. **使用限制**
   - 您**必须**承诺仅用于实验和安全技术测试，不用于需保密或重要生产环境
   - 您**不得**用于任何违反法律法规的活动，包括但不限于犯罪行为、欺诈、破坏计算机信息系统等

4. **法律合规**
   - 您**必须**遵守《中华人民共和国网络安全法》，不得使用本项目技术进行违法犯罪活动
   - 您**必须**遵守《中华人民共和国刑法》第286条第1款，不得破坏计算机信息系统
   - 您**必须**遵守《中华人民共和国电子签名法》第32条，不得伪造、冒用、盗用他人电子签名
   - 您**必须**遵守所在国家和地区的法律法规

5. **免责条款**
   - 本实验**仅**供技术测试之用，不对使用者的行为负责
   - 作者不对任何直接或间接损失承担责任（包括但不限于利润损失、数据损失、业务中断等）
   - 使用者需自行承担使用风险

**您如果违反上述条款，您将完全独立承担所有法律责任和后果。**

</details>

<details>
<summary><strong>"Drivers Signing with Self-Sign Fake Timestamp Servers" Disclaimer - English</strong></summary>

1. **Purpose**: This project is for network security technical research and learning only.
2. **Restrictions**: Must only be used for experiments and security testing. Must NOT be used for any activities violating laws and regulations, including but not limited to criminal behavior, fraud, or damage to computer systems.
3. **Legal Compliance**: You must comply with all applicable laws in your jurisdiction, including cybersecurity laws and electronic signature laws.
4. **Liability**: The author is not responsible for user behavior or any direct/indirect damages arising from use of this project.
5. **Violations**: If you violate any of the above terms, you bear full and independent legal responsibility for all consequences.

Please carefully read and understand the above terms before using this project.

</details>

## 更多文档 | Documentation

| 文档 | 说明 |
|------|------|
| [📖 文档站](https://fakesign.pages.dev) | 完整在线文档（中英文） |
| [驱动签名详细教程](docs/zh/guide/driver-signing.md) | 完整步骤与 inf2cat 版本对照表 |
| [部署 TSA 服务](docs/zh/guide/deploy-tsa.md) | 自建时间戳服务器详细教程 |
| [技术原理](docs/zh/guide/principles.md) | 伪造签名的工作原理详解 |
| [开发指南](docs/zh/dev/build.md) | 编译构建与二次开发 |

## 参考资料 | References

> [1] [时间戳签名库以及本地Demo服务器](https://www.52pojie.cn/thread-908684-1-1.html) - JemmyloveJenny，吾爱破解
>
> [2] [亚洲诚信数字签名工具修改版](https://www.52pojie.cn/thread-1027420-1-1.html) - JemmyloveJenny，吾爱破解
>
> [3] [关于Windows驱动签名认证的大致总结](https://www.bilibili.com/read/cv17812616) - ANY_LNK，BiliBili
>
> [4] [数字证书伪造与利用](https://www.bilibili.com/read/cv9802857/) - MIAIONE，BiliBili

## License

[MIT](LICENSE)
