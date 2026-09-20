$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $root

. (Join-Path $root 'scripts\setup-build-env.ps1')

$logDir = Join-Path $root 'logs'
$releaseDir = Join-Path $root 'release'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

$logFile = Join-Path $logDir 'pc-build.log'
function Write-Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Show-Msg($msg, $icon) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($msg, 'Meu Controle - PC', [System.Windows.Forms.MessageBoxButtons]::OK, $icon) | Out-Null
}

function Invoke-Logged($label, [scriptblock]$Command) {
    Write-Log $label
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & $Command 2>&1 | ForEach-Object {
            $text = "$_"
            Add-Content -Path $logFile -Value $text -Encoding UTF8
            Write-Host $text
        }
        if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
            throw "$label falhou (codigo $LASTEXITCODE)"
        }
    } finally {
        $ErrorActionPreference = $prev
    }
}

try {
    Write-Log '=== Build PC Meu Controle ==='
    Initialize-BuildEnvironment

    Write-Log 'Fechando Meu Controle se estiver aberto (nao encerra Cursor/VS Code)...'
    Stop-MeuControleProcesses -ProjectRoot $root
    Start-Sleep -Seconds 2

    $winUnpacked = Join-Path $releaseDir 'win-unpacked'
    $portableOld = Join-Path $root 'Meu-Controle-PC.exe'
    if (Test-Path -LiteralPath $portableOld) {
        Write-Log 'Removendo Meu-Controle-PC.exe anterior (feche o app se estiver aberto)...'
        Remove-Item -LiteralPath $portableOld -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $winUnpacked) {
        Write-Log 'Removendo build anterior (release\win-unpacked)...'
        for ($try = 1; $try -le 5; $try++) {
            try {
                Remove-Item -LiteralPath $winUnpacked -Recurse -Force -ErrorAction Stop
                break
            } catch {
                if ($try -eq 5) { throw "Nao foi possivel limpar release\win-unpacked. Feche Meu-Controle-PC.exe e tente novamente." }
                Write-Log "Aguardando liberar pasta (tentativa $try/5)..."
                Stop-MeuControleProcesses -ProjectRoot $root
                Start-Sleep -Seconds 2
            }
        }
    }

    if (-not (Test-Path (Join-Path $root 'node_modules'))) {
        Invoke-Logged 'Instalando dependencias...' { npm install }
    }

    Invoke-Logged 'Compilando app web (dist/)...' {
        npx expo export --platform web
    }

    $distIndex = Join-Path $root 'dist\index.html'
    if (-not (Test-Path $distIndex)) {
        throw 'dist\index.html nao encontrado apos compilacao web.'
    }

    Invoke-Logged 'Gerando app Windows (Electron)...' {
        npx electron-builder --config electron-builder.json --win portable --x64
    }

    $portable = Join-Path $releaseDir 'Meu-Controle-PC.exe'
    $portableRoot = Join-Path $root 'Meu-Controle-PC.exe'
    $asar = Join-Path $releaseDir 'win-unpacked\resources\app.asar'

    if (Test-Path -LiteralPath $portable) {
        Copy-Item -LiteralPath $portable -Destination $portableRoot -Force
        Write-Log "App PC: $portable"
        Write-Log "Copia na raiz: $portableRoot"
        Show-Msg "PC compilado com sucesso!`n`nExecutavel:`n$portableRoot`n`nDuplo-clique para abrir." 'Information'
        Start-Process explorer.exe "/select,`"$portableRoot`""
    } elseif (Test-Path -LiteralPath $asar) {
        $legacyExe = Join-Path $releaseDir 'win-unpacked\Meu Controle.exe'
        if (-not (Test-Path -LiteralPath $legacyExe)) {
            $legacyExe = Join-Path $releaseDir 'win-unpacked\electron.exe'
        }
        Write-Log "Portable nao gerado, mas app.asar existe: $legacyExe"
        Show-Msg "Build parcial.`n`nTente abrir:`n$legacyExe`n`nOu rode COMPILAR-PC.bat novamente." 'Information'
        Start-Process explorer.exe (Join-Path $releaseDir 'win-unpacked')
    } else {
        throw 'Build incompleto: Meu-Controle-PC.exe e app.asar nao encontrados.'
    }
} catch {
    Write-Log "ERRO: $($_.Exception.Message)"
    Show-Msg "Erro ao compilar PC:`n$($_.Exception.Message)`n`nVeja: $logFile" 'Error'
    exit 1
}
