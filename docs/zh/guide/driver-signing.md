# 驱动签名

## 完整驱动签名流程

### 1. 修改 INF 文件

将 `DriverVer` 的日期修改到签名证书的有效期内：

```inf
DriverVer = 01/01/2015,1.0.1.0
```

### 2. 签名 SYS/DLL 文件

签名时间需 **≥ DriverVer 时间**：

```cmd
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T08:00:00" /td sha256 ^
  driver.sys
```

### 3. 修改系统时间

```cmd
date 2015/01/01 && time 08:00:00
```

### 4. 生成 CAT 文件

需要安装 [Windows 驱动程序工具包 (WDK)](https://learn.microsoft.com/zh-cn/windows-hardware/drivers/download-the-wdk)。

**x86 + x64：**
```cmd
inf2cat /v /os:Vista_X86,Vista_X64,7_X86,7_X64,8_X86,8_X64,6_3_X86,6_3_X64,10_X86,10_X64 /driver:.
```

**完整平台：**
```cmd
inf2cat /v /os:Vista_X86,Vista_X64,7_X86,7_X64,8_X86,8_X64,6_3_X86,6_3_X64,10_X86,10_X64,10_AU_X86,10_AU_X64,10_RS2_X86,10_RS2_X64,10_RS3_X86,10_RS3_X64,10_RS4_X86,10_RS4_X64,10_RS5_X86,10_RS5_X64,10_19H1_X86,10_19H1_X64,10_VB_X86,10_VB_X64,10_CO_X64,10_NI_X64,Server10_X64,SERVER2016_X64,ServerRS5_X64 /driver:.
```

### 5. 签名 CAT 文件

签名时间需 **≥ CAT 创建时间**：

```cmd
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T09:00:00" /td sha256 ^
  driver.cat
```

## 禁用驱动强制签名

### 开启安全启动的系统（Win10 1607+）

- 使用 EFIGuard 或类似工具
- 开机进入高级模式 → 禁用内核驱动强制签名

### 未开启安全启动的系统

```cmd
bcdedit /set testsigning on
bcdedit /set nointegritychecks on
```

## Windows 驱动签名要求

| 系统版本 | 架构 | 签名要求 |
|---------|------|---------|
| Vista / Win7 | 64位 | 嵌入文件或目录文件签名 |
| Win8 / 8.1 / 10 (1507-1511) | 32/64位 | SHA-2 签名 |
| Win10 1607+ (安全启动) | 32/64位 | 微软根证书颁发机构签名 |
