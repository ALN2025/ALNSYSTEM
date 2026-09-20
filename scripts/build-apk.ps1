$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location -LiteralPath $root

. (Join-Path $root 'scripts\setup-build-env.ps1')

$logDir = Join-Path $root 'logs'
$releaseDir = Join-Path $root 'release'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null

$logFile = Join-Path $logDir 'apk-build.log'
function Write-Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
    Write-Host $line
}

function Show-Msg($msg, $icon) {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show($msg, 'Meu Controle - APK', [System.Windows.Forms.MessageBoxButtons]::OK, $icon) | Out-Null
}

function Test-BuildLock($lockPath) {
    if (-not (Test-Path $lockPath)) { return $false }
    $age = (Get-Date) - (Get-Item $lockPath).LastWriteTime
    if ($age.TotalHours -gt 2) {
        Remove-Item $lockPath -Force -ErrorAction SilentlyContinue
        return $false
    }
    return $true
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

$buildLock = Join-Path $root 'logs\.apk-build.lock'
if (Test-BuildLock $buildLock) {
    throw 'Ja existe uma compilacao APK em andamento. Aguarde terminar ou apague logs\.apk-build.lock'
}
New-Item -ItemType File -Force -Path $buildLock | Out-Null

try {
    Write-Log '=== Build APK Meu Controle ==='
    Initialize-BuildEnvironment

    if (-not (Test-Path (Join-Path $root 'node_modules'))) {
        Invoke-Logged 'Instalando dependencias...' { npm install }
    }

    $apkDest = Join-Path $releaseDir 'Meu-Controle.apk'
    $sdkRoot = Find-AndroidSdk
    $hasSdk = [bool]$sdkRoot
    Write-Log "Android SDK detectado: $hasSdk $(if ($sdkRoot) { "($sdkRoot)" } else { '' })"

    if (-not $env:JAVA_HOME) {
        throw 'JDK 17+ obrigatorio para compilar APK. Instale Microsoft OpenJDK 17.'
    }

    $env:GRADLE_USER_HOME = Join-Path $env:USERPROFILE '.gradle'
    $env:TMP = Join-Path $env:TEMP 'meu-controle-build'
    $env:TEMP = $env:TMP
    New-Item -ItemType Directory -Force -Path $env:GRADLE_USER_HOME | Out-Null
    New-Item -ItemType Directory -Force -Path $env:TMP | Out-Null

    if ($hasSdk) {
        $androidDir = Join-Path $root 'android'
        $gradlew = Join-Path $androidDir 'gradlew.bat'
        $forceClean = $env:ALN_ANDROID_CLEAN -eq '1'

        Stop-GradleForProject -ProjectRoot $root

        if (-not (Test-Path $gradlew)) {
            Invoke-Logged 'Gerando projeto Android (prebuild, 1a vez)...' {
                npx expo prebuild --platform android --no-install
            }
        } elseif ($forceClean) {
            Write-Log 'ALN_ANDROID_CLEAN=1 — regenerando pasta android (feche Android Studio se falhar)...'
            Stop-GradleForProject -ProjectRoot $root
            $prebuildOk = $false
            for ($try = 1; $try -le 3; $try++) {
                try {
                    Invoke-Logged "Prebuild clean (tentativa $try/3)..." {
                        npx expo prebuild --platform android --clean --no-install
                    }
                    $prebuildOk = $true
                    break
                } catch {
                    Write-Log "Prebuild clean falhou: $($_.Exception.Message)"
                    if ($try -lt 3) {
                        Stop-GradleForProject -ProjectRoot $root
                        Start-Sleep -Seconds 3
                    }
                }
            }
            if (-not $prebuildOk) {
                throw 'Nao foi possivel limpar pasta android (EBUSY). Feche Android Studio, Explorer na pasta android, e tente de novo. Ou compile sem clean (nao defina ALN_ANDROID_CLEAN).'
            }
        } else {
            Write-Log 'Projeto android/ ja existe — compilando direto (sem apagar pasta).'
        }

        $rawDir = Join-Path $androidDir 'app\src\main\res\raw'
        $overdueSound = Join-Path $root 'assets\sounds\overdue_alert.wav'
        if (Test-Path $overdueSound) {
            New-Item -ItemType Directory -Force -Path $rawDir | Out-Null
            Copy-Item -LiteralPath $overdueSound -Destination (Join-Path $rawDir 'overdue_alert.wav') -Force
            Write-Log 'Som de atraso copiado para android/app/src/main/res/raw/'
        }

        $gradleProps = Join-Path $root 'android\gradle.properties'
        if (Test-Path $gradleProps) {
            $props = Get-Content $gradleProps -Raw
            if ($props -notmatch 'android\.enableLongPaths') {
                Add-Content $gradleProps "`nandroid.enableLongPaths=true"
            }
        }

        $gradlew = Join-Path $root 'android\gradlew.bat'
        if (-not (Test-Path $gradlew)) { throw 'gradlew.bat nao encontrado apos prebuild.' }

        $autolinkDirs = @(
            (Join-Path $androidDir 'build\generated\autolinking'),
            (Join-Path $androidDir 'app\build\generated\autolinking')
        )
        foreach ($dir in $autolinkDirs) {
            if (Test-Path $dir) {
                Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Log "Cache autolinking removido: $dir"
            }
        }

        # Forca bundle JS novo (evita APK com codigo antigo em cache Gradle)
        $jsCacheDirs = @(
            (Join-Path $androidDir 'app\build\generated\assets'),
            (Join-Path $androidDir 'app\build\intermediates\assets'),
            (Join-Path $androidDir 'app\build\intermediates\compressed_assets')
        )
        foreach ($dir in $jsCacheDirs) {
            if (Test-Path $dir) {
                Remove-Item -LiteralPath $dir -Recurse -Force -ErrorAction SilentlyContinue
                Write-Log "Cache JS removido: $dir"
            }
        }

        Invoke-Logged 'Gerando sons do app...' {
            node (Join-Path $root 'scripts\generate-sounds.js')
        }

        $culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')
        $now = Get-Date
        $builtAtIso = $now.ToString('yyyy-MM-dd HH:mm:ss')
        $builtAtPtBr = $now.ToString('dd/MM/yyyy HH:mm', $culture)
        $buildInfoPath = Join-Path $root 'src\constants\buildInfo.ts'
        @"
/** Atualizado automaticamente pelo COMPILAR-APK.bat */
export const BUILD_INFO = {
  builtAt: '$builtAtIso',
  builtAtPtBr: '$builtAtPtBr',
  label: 'Release local APK',
} as const;

/** Data/hora da compilacao em portugues (ex.: 12/09/2026 17:48). */
export function getBuildDateLabel(): string {
  return BUILD_INFO.builtAtPtBr || BUILD_INFO.builtAt;
}
"@ | Set-Content -Path $buildInfoPath -Encoding UTF8
        Write-Log "Build stamp PT-BR: $builtAtPtBr (aparece em Ajustes)"

        Invoke-Logged 'Compilando APK Release (pode demorar varios minutos)...' {
            Push-Location (Join-Path $root 'android')
            $env:ANDROID_HOME = $sdkRoot
            $env:ANDROID_SDK_ROOT = $sdkRoot
            & .\gradlew.bat assembleRelease --no-daemon
            Pop-Location
        }

        $apkSrc = Get-ChildItem -Path (Join-Path $root 'android\app\build\outputs\apk\release') -Filter '*.apk' -ErrorAction SilentlyContinue | Select-Object -First 1
        if (-not $apkSrc) { throw 'APK nao gerado. Verifique logs\apk-build.log' }

        Copy-Item $apkSrc.FullName $apkDest -Force
        $apkRoot = Join-Path $root 'Meu-Controle.apk'
        Copy-Item $apkSrc.FullName $apkRoot -Force
        Write-Log "APK salvo: $apkDest"
        Write-Log "APK na raiz: $apkRoot"
        Show-Msg "APK compilado com sucesso!`n`n$apkRoot`n`nCopie para o celular e instale." 'Information'
        Start-Process explorer.exe "/select,`"$apkRoot`""
    } else {
        Write-Log 'SDK Android nao encontrado localmente.'
        Write-Log 'Instale Android Studio ou defina ANDROID_HOME apontando para a pasta Sdk.'
        Write-Log 'Tentando EAS Build (nuvem Expo)...'

        Invoke-Logged 'EAS Build (nuvem)...' {
            npx eas-cli build --platform android --profile preview
        }

        Show-Msg "Build na nuvem iniciado.`n`nVeja logs\apk-build.log`n`nSe for a 1a vez: npx eas login" 'Information'
        Start-Process notepad.exe $logFile
    }
} catch {
    Write-Log "ERRO: $($_.Exception.Message)"
    Show-Msg "Erro ao compilar APK:`n$($_.Exception.Message)`n`nVeja: $logFile" 'Error'
    exit 1
} finally {
    if (Test-Path $buildLock) {
        Remove-Item $buildLock -Force -ErrorAction SilentlyContinue
    }
}
