# HookSigntool

## How It Works

HookSigntool hooks the signtool timestamp URL and replaces it with a custom TSA server address.

## Configuration

Edit `hook.ini`:

```ini
[TimeStamp]
TimeStamp=2015-01-01T00:00:00
ServerURL=http://timers.524228.xyz/
```

## Build

Open the project in Visual Studio, select x64/Release, and compile.
