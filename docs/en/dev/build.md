# Build

## TSWorker (Cloudflare Workers)

```bash
cd TSWorker
npm install
npm run dev      # Local development
npm run deploy   # Deploy to Cloudflare
```

## TimeTool (Windows TSA Server)

Requires Visual Studio 2019+ with .NET Framework 4.8.

```bash
msbuild TimeTool/TimeStamping.sln /p:Configuration=Release
```

## SignTool (HookSigntool)

Edit `SignTool/Hooktool/main.cpp` to set your server URL, then build with Visual Studio.
