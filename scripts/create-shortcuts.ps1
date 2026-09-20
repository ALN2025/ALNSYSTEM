param([switch]$Silent)
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

& (Join-Path $root 'scripts\build-icons.ps1')

$pcIco = Join-Path $root 'assets\aln-pc.ico'
$apkIco = Join-Path $root 'assets\aln-apk.ico'
$vbs = Join-Path $root 'scripts\silent-run.vbs'

if (-not (Test-Path $pcIco)) { throw 'Icone PC nao encontrado. Rode scripts\build-icons.ps1' }
if (-not (Test-Path $apkIco)) { throw 'Icone APK nao encontrado. Rode scripts\build-icons.ps1' }

function New-AlnShortcut($name, $icon, $mode, $description) {
    $lnkPath = Join-Path $root "$name.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($lnkPath)
    $sc.TargetPath = 'wscript.exe'
    $sc.Arguments = "//nologo //B `"$vbs`" $mode"
    $sc.WorkingDirectory = $root
    $sc.IconLocation = "$icon,0"
    $sc.Description = $description
    $sc.WindowStyle = 7
    $sc.Save()
    Write-Host "Atalho: $lnkPath"
    return $lnkPath
}

$pcLnk = New-AlnShortcut 'ALN-SYSTEM-PC' $pcIco 'pc' 'A.L.N SYSTEM — Abrir no PC (sem CMD)'
$apkLnk = New-AlnShortcut 'ALN-SYSTEM-APK' $apkIco 'apk' 'A.L.N SYSTEM — Compilar APK Android'

$desktop = [Environment]::GetFolderPath('Desktop')
foreach ($src in @($pcLnk, $apkLnk)) {
    $dest = Join-Path $desktop (Split-Path $src -Leaf)
    Copy-Item $src $dest -Force
    Write-Host "Copiado para Area de Trabalho: $dest"
}

Add-Type -AssemblyName System.Windows.Forms
if (-not $Silent) {
    [System.Windows.Forms.MessageBox]::Show(
        "Atalhos criados com icones!`n`nUse os arquivos .lnk (nao o .bat):`n• ALN-SYSTEM-PC.lnk`n• ALN-SYSTEM-APK.lnk`n`nCopias na Area de Trabalho.",
        'A.L.N SYSTEM',
        'OK',
        'Information'
    ) | Out-Null
}
