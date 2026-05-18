# Driver Signing

## Complete Driver Signing Process

### 1. Modify INF File

Set `DriverVer` date within the signing certificate's validity:

```inf
DriverVer = 01/01/2015,1.0.1.0
```

### 2. Sign SYS/DLL Files

Signing time must be **≥ DriverVer time**:

```cmd
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T08:00:00" /td sha256 ^
  driver.sys
```

### 3. Set System Time

```cmd
date 2015/01/01 && time 08:00:00
```

### 4. Generate CAT File

Requires [Windows Driver Kit (WDK)](https://learn.microsoft.com/en-us/windows-hardware/drivers/download-the-wdk).

```cmd
inf2cat /v /os:Vista_X86,Vista_X64,7_X86,7_X64,8_X86,8_X64,6_3_X86,6_3_X64,10_X86,10_X64 /driver:.
```

### 5. Sign CAT File

Signing time must be **≥ CAT creation time**:

```cmd
signtool sign /f cert.pfx /p password /fd sha256 ^
  /tr "http://timers.524228.xyz/2015-01-01T09:00:00" /td sha256 ^
  driver.cat
```

## Disable Driver Signature Enforcement

### With Secure Boot (Win10 1607+)

- Use EFIGuard or similar tools
- Boot to Advanced Options → Disable Driver Signature Enforcement

### Without Secure Boot

```cmd
bcdedit /set testsigning on
bcdedit /set nointegritychecks on
```
