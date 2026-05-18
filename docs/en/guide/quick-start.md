# Quick Start

## Prerequisites

1. Windows (7/8/10/11)
2. EV code signing certificate (this project **does not provide certificates**)
3. [Certificate Trust Installer](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/PikachuTestCert.exe)

## Step 1: Install Trust Certificate

Download and run the [Certificate Trust Installer](https://github.com/PIKACHUIM/FakeSign/raw/refs/heads/main/Releases/PikachuTestCert.exe).

Silent install:
```cmd
PikachuTestCert.exe /VERYSILENT   # Fully silent (admin required)
PikachuTestCert.exe /SILENT       # Hide confirmation only
```

## Step 2: Sign Files

### Using signtool

**RFC 3161 (SHA-256):**
```cmd
signtool sign /f cert.pfx /p password /fd sha256 /tr "http://timers.524228.xyz/2015-01-01T00:00:00" /td sha256 file.sys
```

**Authenticode (SHA-1):**
```cmd
signtool sign /f cert.pfx /p password /t "http://timers.524228.xyz/2015-01-01T00:00:00" file.sys
```

## Timestamp URL Format

```
http://<server>/<yyyy-MM-ddTHH:mm:ss>
```

- Omit the datetime to use current real time
- Time format is UTC

## Important Notes

::: warning Signing Time Order
Driver version time ≤ sys/dll signing time ≤ CAT creation time ≤ CAT signing time
:::
