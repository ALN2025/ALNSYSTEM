$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $root

function Write-Log($msg) { Write-Host "LOG: $msg" }

. (Join-Path $root 'scripts\setup-build-env.ps1')
Initialize-BuildEnvironment
Stop-MeuControleProcesses -ProjectRoot $root
Write-Host 'TEST OK'
