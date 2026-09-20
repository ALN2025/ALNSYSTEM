@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Meu Controle - Compilar APK (Celular)
cd /d "%~dp0"

REM Node.js no PATH (duplo-clique no Explorer nao herda PATH completo)
if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ============================================
echo   MEU CONTROLE - Compilar APK para celular
echo ============================================
echo.
echo Pasta: %~dp0
echo Isso pode levar 10 a 30 minutos na 1a vez.
echo O APK sera salvo em: Meu-Controle.apk
echo Log: logs\apk-build.log
echo.
echo Dica: feche Android Studio antes de compilar.
echo Se der erro EBUSY na pasta android, nao abra a pasta android no Explorer.
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale de https://nodejs.org e tente novamente.
  goto :fim_erro
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-apk.ps1"
set "BUILD_ERR=!ERRORLEVEL!"

echo.
if !BUILD_ERR! neq 0 (
  echo [ERRO] Compilacao falhou. Abra logs\apk-build.log
  goto :fim_erro
)

if exist "%~dp0Meu-Controle.apk" (
  echo [OK] APK pronto: %~dp0Meu-Controle.apk
) else if exist "%~dp0release\Meu-Controle.apk" (
  echo [OK] APK pronto: %~dp0release\Meu-Controle.apk
) else (
  echo [AVISO] Script terminou, mas APK nao encontrado. Veja logs\apk-build.log
)

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b 0

:fim_erro
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
exit /b 1
