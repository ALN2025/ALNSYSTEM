@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title Meu Controle - Compilar PC + APK
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" (
  set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo.
echo ============================================
echo   MEU CONTROLE - Compilar PC e APK
echo ============================================
echo.

call "%~dp0COMPILAR-PC.bat"
set "PC_ERR=!ERRORLEVEL!"
if !PC_ERR! neq 0 exit /b !PC_ERR!

echo.
echo --- Iniciando compilacao APK ---
echo.

call "%~dp0COMPILAR-APK.bat"
exit /b !ERRORLEVEL!
