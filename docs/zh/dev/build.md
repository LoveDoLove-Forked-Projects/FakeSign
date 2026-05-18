# 编译构建

## TSWorker（Cloudflare Workers 时间戳服务）

```bash
cd TSWorker
npm install
npm run dev      # 本地开发
npm run deploy   # 部署到 Cloudflare
```

技术栈：TypeScript + Hono + Cloudflare Workers

## TimeTool（Windows 时间戳服务器）

### 环境要求

- Visual Studio 2019+
- .NET Framework 4.8

### 编译

```bash
cd TimeTool
# 使用 Visual Studio 打开 TimeStamping.sln
# 或命令行：
msbuild TimeStamping.sln /p:Configuration=Release
```

输出目录：`TimeTool/TimeStamping/bin/Release/`

## SignTool（HookSigntool）

### 修改配置

编辑 `SignTool/Hooktool/main.cpp`，修改时间戳服务器地址：

```cpp
wcscat(buf, L"http://your-server/path/");
```

### 编译

使用 Visual Studio 打开项目，选择 Release 配置编译。
