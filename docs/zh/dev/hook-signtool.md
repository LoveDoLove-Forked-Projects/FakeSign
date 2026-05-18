# HookSigntool

## 原理

HookSigntool 通过 Hook Windows signtool 的时间戳请求 URL，将其替换为自建时间戳服务器地址，从而实现自定义时间戳签名。

## 配置方式

### 方式一：修改 hook.ini（推荐）

```ini
[TimeStamp]
TimeStamp=2015-01-01T00:00:00
ServerURL=http://timers.524228.xyz/
```

### 方式二：修改源码

编辑 `SignTool/Hooktool/main.cpp`：

```cpp
wcscat(buf, L"http://your-server/2015-01-01T00:00:00");
```

## 编译

- 使用 Visual Studio 打开项目
- 选择 x64 / Release 配置
- 编译输出到 `bin/Release/`
