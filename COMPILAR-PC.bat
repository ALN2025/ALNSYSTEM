@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Meu Controle - Compilar PC
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ============================================
echo   MEU CONTROLE - Compilar versao PC
echo ============================================
echo.
echo Pasta: %~dp0
echo Fecha o app se estiver aberto. Aguarde...
echo Atualiza dist\ e gera release\win-unpacked\
echo Log: logs\pc-build.log
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado.
  echo Instale de https://nodejs.org e tente novamente.
  goto :fim_erro
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-pc.ps1"
set "BUILD_ERR=!ERRORLEVEL!"

echo.
if !BUILD_ERR! neq 0 (
  echo [ERRO] Compilacao falhou. Abra logs\pc-build.log
  goto :fim_erro
)

if exist "%~dp0dist\index.html" (
  echo [OK] App web atualizado em dist\
)
if exist "%~dp0Meu-Controle-PC.exe" (
  echo [OK] Executavel: %~dp0Meu-Controle-PC.exe
) else if exist "%~dp0release\Meu-Controle-PC.exe" (
  echo [OK] Executavel: %~dp0release\Meu-Controle-PC.exe
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
