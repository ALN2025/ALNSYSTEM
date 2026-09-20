$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $root

$logDir = Join-Path $root 'logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

$logFile = Join-Path $logDir 'desktop.log'
function Write-Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

function Show-Error($msg) {
    Write-Log "ERRO: $msg"
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
        "$msg`n`nLog: $logFile",
        'A.L.N SYSTEM',
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
}

function Start-HiddenProcess($arguments, $stdout, $stderr) {
    $p = New-Object System.Diagnostics.ProcessStartInfo
    $p.FileName = 'cmd.exe'
    $p.Arguments = $arguments
    $p.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
    $p.CreateNoWindow = $true
    $p.UseShellExecute = $false
    $p.RedirectStandardOutput = $true
    $p.RedirectStandardError = $true
    $p.WorkingDirectory = $root
    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $p
    [void]$proc.Start()
    Start-Job -ScriptBlock {
        param($proc, $stdout, $stderr)
        $out = $proc.StandardOutput.ReadToEnd()
        $err = $proc.StandardError.ReadToEnd()
        if ($out) { Add-Content $stdout $out }
        if ($err) { Add-Content $stderr $err }
    } -ArgumentList $proc, $stdout, $stderr | Out-Null
    return $proc
}

. (Join-Path $root 'scripts\setup-build-env.ps1')

try {
    Write-Log 'Iniciando A.L.N SYSTEM Desktop...'
    Initialize-BuildEnvironment

    if (-not (Test-Path (Join-Path $root 'node_modules'))) {
        Write-Log 'Instalando dependencias (primeira vez)...'
        Start-Process -FilePath 'npm.cmd' -ArgumentList 'install' -WindowStyle Hidden -Wait | Out-Null
    }

    $distIndex = Join-Path $root 'dist\index.html'
    if (-not (Test-Path $distIndex)) {
        Write-Log 'Compilando app web (primeira vez, aguarde)...'
        $buildOut = Join-Path $logDir 'build-web.log'
        $buildErr = Join-Path $logDir 'build-web.err.log'
        $build = Start-HiddenProcess '/c npx expo export --platform web' $buildOut $buildErr
        $build.WaitForExit()
        if ($build.ExitCode -ne 0 -or -not (Test-Path $distIndex)) {
            throw 'Falha ao compilar. Verifique logs\build-web.err.log'
        }
        Write-Log 'Compilacao concluida.'
    }

    Stop-MeuControleProcesses -ProjectRoot $root

    $env:ALN_SILENT = '1'
    Write-Log 'Abrindo janela A.L.N SYSTEM...'

    $elOut = Join-Path $logDir 'electron.out.log'
    $elErr = Join-Path $logDir 'electron.err.log'
    Start-HiddenProcess '/c npx electron desktop/main.js' $elOut $elErr | Out-Null

    Write-Log 'A.L.N SYSTEM Desktop iniciado com sucesso.'
} catch {
    Show-Error $_.Exception.Message
}
