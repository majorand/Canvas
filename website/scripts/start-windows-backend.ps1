$ErrorActionPreference = 'Stop'
$env:PSModulePath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\Modules'
Import-Module Microsoft.PowerShell.Security
$statePath = Join-Path $env:LOCALAPPDATA 'CanvasBackend'
$websitePath = Split-Path -Parent $PSScriptRoot
$mutex = New-Object System.Threading.Mutex($false,'Local\CanvasBackend-Majorand')
if (-not $mutex.WaitOne(0)) { exit 0 }
try {
  $PID | Set-Content -LiteralPath (Join-Path $statePath 'backend-supervisor.pid')
  $secretPath = Join-Path $statePath 'secret.dpapi'
  if (-not (Test-Path -LiteralPath $secretPath)) { throw 'Run setup-windows-backend.mjs first.' }
  $config = Get-Content -LiteralPath (Join-Path $statePath 'config.json') -Raw | ConvertFrom-Json
  $env:SUPABASE_URL = $config.supabaseUrl
  $env:SITE_OWNER_EMAIL = $config.ownerEmail
  $env:AUTH_SITE_URL = 'https://majorand.github.io/Canvas/'
  $env:HOST = '127.0.0.1'
  $env:PORT = '3030'
  $env:VERIFY_TLS_DISTRUST = '1'
  $env:ALLOWED_ORIGINS = 'https://majorand.github.io'
  $nodePath = Join-Path $statePath 'node.exe'
  while ($true) {
    foreach ($name in @('backend.stdout.log','backend.stderr.log')) {
      $logPath = Join-Path $statePath $name
      if ((Test-Path -LiteralPath $logPath) -and (Get-Item -LiteralPath $logPath).Length -gt 1048576) { Move-Item -LiteralPath $logPath -Destination ($logPath+'.previous') -Force }
    }
    $secure = Get-Content -LiteralPath $secretPath | ConvertTo-SecureString
    $env:SUPABASE_SECRET_KEY = (New-Object System.Net.NetworkCredential('', $secure)).Password
    try {
      $child = Start-Process -FilePath $nodePath -ArgumentList @('server.mjs') -WorkingDirectory $websitePath -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $statePath 'backend.stdout.log') -RedirectStandardError (Join-Path $statePath 'backend.stderr.log')
    } finally { Remove-Item Env:SUPABASE_SECRET_KEY -ErrorAction SilentlyContinue }
    $child.Id | Set-Content -LiteralPath (Join-Path $statePath 'backend.pid')
    $child.WaitForExit()
    Start-Sleep -Seconds 5
  }
} finally { $mutex.ReleaseMutex(); $mutex.Dispose() }

