$ErrorActionPreference = 'Stop'
$env:PSModulePath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\Modules'
Import-Module Microsoft.PowerShell.Security
$statePath = Join-Path $env:LOCALAPPDATA 'CanvasBackend'
if (-not (Test-Path -LiteralPath (Join-Path $statePath 'secret.dpapi'))) { throw 'Save the key in setup-windows-backend.ps1 first.' }
$launcher = Join-Path $PSScriptRoot 'start-windows-backend.ps1'
$startup = [Environment]::GetFolderPath('Startup')
$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut((Join-Path $startup 'Canvas Backend.lnk'))
$link.TargetPath = Join-Path $env:WINDIR 'System32\WindowsPowerShell\v1.0\powershell.exe'
$link.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$launcher+'"'
$link.WorkingDirectory = Split-Path -Parent $PSScriptRoot
$link.WindowStyle = 7
$link.Description = 'Run the authenticated Canvas backend after Windows sign-in.'
$link.Save()
Start-Process -FilePath $link.TargetPath -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',('"'+$launcher+'"')) -WindowStyle Hidden
