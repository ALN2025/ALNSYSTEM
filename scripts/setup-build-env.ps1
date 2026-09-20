# Ambiente compartilhado para build APK / PC (paths com espaco, Node, JDK, Android SDK)

function Add-BuildPath {
    param([string[]]$Segments)
    foreach ($seg in $Segments) {
        if ($seg -and (Test-Path $seg) -and ($env:Path -notlike "*$seg*")) {
            $env:Path = "$seg;$env:Path"
        }
    }
}

$nodeDir = 'C:\Program Files\nodejs'
Add-BuildPath @($nodeDir)

function Find-JavaHome {
    $patterns = @(
        'C:\Program Files\Microsoft\jdk-*',
        'C:\Program Files\Eclipse Adoptium\jdk-17*',
        'C:\Program Files\Java\jdk-17*',
        'C:\Program Files\Java\jdk-21*'
    )
    foreach ($pattern in $patterns) {
        $found = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue |
            Sort-Object Name -Descending |
            Select-Object -First 1
        if ($found -and (Test-Path (Join-Path $found.FullName 'bin\java.exe'))) {
            return $found.FullName
        }
    }
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
        return $env:JAVA_HOME
    }
    return $null
}

function Find-AndroidSdk {
    $candidates = @(
        $env:ANDROID_HOME,
        $env:ANDROID_SDK_ROOT,
        (Join-Path $env:LOCALAPPDATA 'Android\Sdk'),
        (Join-Path $env:USERPROFILE 'AppData\Local\Android\Sdk'),
        'C:\Android\Sdk'
    ) | Where-Object { $_ -and $_.Trim() }

    foreach ($sdk in $candidates) {
        if (Test-Path (Join-Path $sdk 'platform-tools\adb.exe')) {
            return $sdk
        }
    }
    return $null
}

function Write-BuildLog {
    param([string]$Message)
    if (Get-Command Write-Log -ErrorAction SilentlyContinue) {
        Write-Log $Message
    } else {
        Write-Host $Message
    }
}

function Test-ProtectedProcess {
    param([string]$ProcessName, [string]$CommandLine)

    # Nunca encerrar IDEs, terminais ou editores (Cursor mostra "meu controle" no titulo da pasta!)
    $protected = @(
        'Cursor', 'Code', 'devenv', 'WindowsTerminal', 'wt', 'powershell', 'pwsh',
        'cmd', 'node', 'npm', 'npx', 'conhost', 'explorer'
    )
    if ($ProcessName -in $protected) { return $true }
    if ($CommandLine -match 'cursor|Cursor|vscode|Visual Studio Code|\.cursor\\') { return $true }
    return $false
}

function Stop-MeuControleProcesses {
    param([string]$ProjectRoot)

    $releaseExe = Join-Path $ProjectRoot 'release\win-unpacked\Meu Controle.exe'
    $mainJs = Join-Path $ProjectRoot 'desktop\main.js'
    $mainJsAlt = $mainJs -replace '\\', '/'
    $projectRootAlt = $ProjectRoot -replace '\\', '/'

    # 1) Executaveis empacotados pelo nome exato do processo
    foreach ($procName in @('Meu Controle', 'Meu-Controle-PC')) {
        Get-Process -ErrorAction SilentlyContinue |
            Where-Object { $_.ProcessName -eq $procName } |
            ForEach-Object {
                Write-BuildLog "Encerrando $procName (PID $($_.Id))"
                Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            }
    }

    # 2) So encerra processos cuja linha de comando aponta para ESTE projeto
    #    NAO usa titulo da janela (Cursor aberto na pasta "meu controle" seria fechado!)
    try {
        Get-CimInstance Win32_Process -ErrorAction Stop |
            ForEach-Object {
                $name = $_.Name
                $cmd = $_.CommandLine
                if (Test-ProtectedProcess -ProcessName ($name -replace '\.exe$', '') -CommandLine $cmd) {
                    return
                }

                $isPackaged = $cmd -and (
                    ($cmd -like "*$releaseExe*") -or
                    ($cmd -like "*win-unpacked*Meu Controle.exe*") -or
                    ($cmd -like "*Meu-Controle-PC.exe*")
                )
                $isDevElectron = $cmd -and (
                    ($name -eq 'electron.exe') -and
                    (($cmd -like "*$mainJs*") -or ($cmd -like "*$mainJsAlt*"))
                )
                $isDevFromProject = $cmd -and (
                    ($name -eq 'electron.exe') -and
                    ($cmd -like "*$projectRootAlt*desktop/main.js*")
                )

                if ($isPackaged -or $isDevElectron -or $isDevFromProject) {
                    Write-BuildLog "Encerrando processo do app (PID $($_.ProcessId), $name)"
                    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                }
            }
    } catch {
        Write-BuildLog "AVISO: nao foi possivel inspecionar processos ($($_.Exception.Message))"
    }
}

function Stop-GradleForProject {
    param([string]$ProjectRoot)

    $androidDir = Join-Path $ProjectRoot 'android'
    $gradlew = Join-Path $androidDir 'gradlew.bat'
    if (-not (Test-Path $gradlew)) { return }

    Write-BuildLog 'Parando Gradle daemon (libera pasta android)...'
    Push-Location -LiteralPath $androidDir
    try {
        & .\gradlew.bat --stop 2>&1 | ForEach-Object { Write-BuildLog "$_" }
    } catch {
        Write-BuildLog "AVISO: gradlew --stop: $($_.Exception.Message)"
    } finally {
        Pop-Location
    }

    Start-Sleep -Seconds 3
}

function Initialize-BuildEnvironment {
    $java = Find-JavaHome
    if ($java) {
        $env:JAVA_HOME = $java
        Add-BuildPath @((Join-Path $java 'bin'))
        Write-BuildLog "JAVA_HOME: $java"
    } else {
        Write-BuildLog 'AVISO: JDK 17+ nao encontrado. Instale: https://learn.microsoft.com/java/openjdk/download'
    }

    $sdk = Find-AndroidSdk
    if ($sdk) {
        $env:ANDROID_HOME = $sdk
        $env:ANDROID_SDK_ROOT = $sdk
        Write-BuildLog "Android SDK: $sdk"
    }

    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
        throw 'Node.js nao encontrado. Instale de https://nodejs.org e reinicie o .bat'
    }
    Write-BuildLog "Node: $(node -v) | npm: $(npm -v)"
}
