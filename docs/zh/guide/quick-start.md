# 快速开始

## 前置准备

1. Windows 系统 (7/8/10/11)
2. EV 代码签名证书（本项目 **不提供任何证书**）
3. [数字证书安装工具](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/PikachuTestCert.exe)

## 步骤一：安装信任证书

下载并运行 [数字证书安装工具](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/PikachuTestCert.exe)，按提示完成安装。

静默安装：
```cmd
PikachuTestCert.exe /VERYSILENT   # 完全静默（需管理员权限）
PikachuTestCert.exe /SILENT       # 仅隐藏确认对话框
```

## 步骤二：签名文件

### 使用 signtool（推荐）

**RFC 3161 时间戳（SHA-256）：**
```cmd
signtool sign /f cert.pfx /p password /fd sha256 /tr "http://timers.524228.xyz/2015-01-01T00:00:00" /td sha256 file.sys
```

**Authenticode 时间戳（SHA-1）：**
```cmd
signtool sign /f cert.pfx /p password /t "http://timers.524228.xyz/2015-01-01T00:00:00" file.sys
```

### 使用亚洲诚信签名工具

下载 [亚洲诚信签名工具](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/TimestampClient.zip)，配置 `hook.ini`：

```ini
[TimeStamp]
TimeStamp=2015-01-01T08:00:00
ServerURL=http://timers.524228.xyz/
```

## 时间戳 URL 格式

```
http://<服务器地址>/<yyyy-MM-ddTHH:mm:ss>
```

- 省略时间部分则使用当前真实时间
- 时间格式为 UTC

## 注意事项

::: warning 签名时间顺序
驱动版本时间 ≤ sys/dll签名时间 ≤ CAT创建时间 ≤ CAT签名时间
:::

::: tip 无需自建服务
一般情况下直接使用公共时间戳服务即可，无需自建。
:::
