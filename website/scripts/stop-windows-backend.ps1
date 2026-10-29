$ErrorActionPreference = 'Stop'
$env:PSModulePath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\Modules'
Import-Module Microsoft.PowerShell.Security
$statePath = Join-Path $env:LOCALAPPDATA 'CanvasBackend'
# Stop only the specific processes registered by the Canvas launcher.
foreach ($record in @(@{File='backend-supervisor.pid';Pattern='start-windows-backend.ps1'},@{File='backend.pid';Pattern='server.mjs'})) {
  $pidPath = Join-Path $statePath $record.File
  if (Test-Path -LiteralPath $pidPath) {
    $canvasPid = [int](Get-Content -LiteralPath $pidPath)
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$canvasPid" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine.Contains($record.Pattern)) { Stop-Process -Id $canvasPid -ErrorAction SilentlyContinue }
  }
}
