# MCP Tool Runtime Testing Guide

A practical reference for running local MCP tests against the OptiContext Worker.

---

## Quick Start (cold start to a working test)

### 1. Disable Supabase Auth production mode

In `worker/.dev.vars`, ensure `SUPABASE_JWT_SECRET` is empty or commented out:

```
# SUPABASE_JWT_SECRET=
```

This lets you authenticate with `X-Admin-Secret` alone instead of requiring a Supabase JWT. Restore the value after testing.

### 2. Start the worker (background job)

```powershell
$job = Start-Job -ScriptBlock {
  Set-Location "C:\path\to\opticontext\worker"
  cmd /c "npx wrangler dev --ip 127.0.0.1 --port 8787 2>&1"
}
```

### 3. Wait for ready

```powershell
for ($i=0; $i -lt 20; $i++) {
  Start-Sleep 1
  try {
    $h = Invoke-RestMethod http://127.0.0.1:8787/health -TimeoutSec 2
    if ($h.status -eq "ok") { break }
  } catch {}
}
```

### 4. Register test agent + get API key

```powershell
$r = Invoke-RestMethod http://127.0.0.1:8787/admin/agents -Method Post `
  -Headers @{"Content-Type"="application/json";"X-OptiContext-Admin"="1";"X-Admin-Secret"="YOUR_ADMIN_SECRET"} `
  -Body '{"agent_id":"testagent","display_name":"Test","allowed_tools":["intellisearch","voicebridge","deepdoc","memorycore","guide"],"tier":"standard"}'
$key = $r.key
```

### 5. Call any MCP tool

```powershell
$hdr = @{"Content-Type"="application/json";"Authorization"="Bearer $key"}
$body = '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"opticontext_search","arguments":{"query":"hamlet","mode":"fast","max_results":2}},"id":1}'
$r = Invoke-RestMethod http://127.0.0.1:8787/mcp -Method Post -Headers $hdr -Body $body -TimeoutSec 30
Write-Output $r.result.content[0].text
```

### 6. Stop the worker

```powershell
taskkill /F /IM workerd.exe
```

---

## Key Gotchas (learned the hard way)

### SUPABASE_JWT_SECRET

- Must be **empty/commented out** (`# SUPABASE_JWT_SECRET=`) for dev mode.
- Empty = dev mode (X-Admin-Secret works standalone).
- Populated = production mode (X-Admin-Secret alone is rejected; Supabase JWT required).
- Restore the value after testing so the file is clean for production deployment.

### Worker lifecycle

- Use **`Start-Job` + `cmd /c`** for background worker. `Start-Process` and Node.js `spawn` have compatibility issues on Windows (ENOENT, EINVAL).
- Agent keys are **ephemeral** in local dev mode — lost on every worker restart.
- Worker usually starts in 6-10 seconds. The health-check wait loop handles this.
- Kill with **`taskkill /F /IM workerd.exe`** — `Get-Process | Stop-Process` often misses the `workerd` child process.

### PowerShell 5.1 limitations

- **`?.` (null-conditional operator) is NOT supported** — use explicit `if ($var) { ... }` checks.
- **`2>nul` and `>nul` fail** with "FileStream was asked to open a device that was not a file". Redirect to a file instead.
- **Backtick-n in -replace does NOT create newlines** — it creates literal backslash-n in the file. Use the edit tool instead.
- **`Invoke-WebRequest`** with `-UseBasicParsing` for raw headers/status; **`Invoke-RestMethod`** for automatic JSON parsing.

### Node.js on Windows

- `spawn("npx", ...)` fails with **ENOENT** even when npx is in PATH.
- `spawn("wrangler.cmd", ...)` fails with **EINVAL**.
- **Always use `spawn("cmd", ["/c", "npx wrangler ..."])`** to run .cmd scripts.
- **`.dev.vars` overrides process env** — you cannot bypass production mode by setting env vars in the parent process. You must edit the file.

### MCP request format

Tool calls require nested `name` + `arguments` under `params`:
```json
{"method":"tools/call","params":{"name":"opticontext_search","arguments":{"query":"...","mode":"fast"}}}
```

Other methods use flat params:
```json
{"method":"tools/list","params":{}}
{"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}
```

### Checking tool content

Always output the **actual response text**, not just byte counts:

```powershell
# WRONG - hides the actual result:
Write-Output "OK: $($r.result.content[0].text.Length) bytes"

# RIGHT - shows the real content:
Write-Output $r.result.content[0].text
```

---

## Common Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 403 | `Forbidden` | Admin API hit in production mode (SUPABASE_JWT_SECRET active) |
| 401 | `AUTH_ERROR` | Request to `/mcp` without valid Bearer token |
| 401 | `Invalid API key` | Key revoked, expired from KV, or never registered |
| 413 | `Request body too large` | Body exceeds 1MB (JSON) or 2GB (upload) limit |
| 404 | `Not Found` | Unknown route path |

---

## Required setup per test

1. Ensure `SUPABASE_JWT_SECRET` is empty in `.dev.vars`
2. Start worker via `Start-Job`
3. Wait for health check
4. Register agent via `/admin/agents` POST
5. Use returned key for all MCP calls
6. Kill worker via `taskkill`
7. Restore `SUPABASE_JWT_SECRET` in `.dev.vars`
