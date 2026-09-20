@if /i "%~1"=="hidden" goto :run
@start "" /B wscript.exe //nologo //B "%~dp0scripts\silent-run-setup.vbs"
@exit /b
:run
@wscript.exe //nologo //B "%~dp0scripts\silent-run-setup.vbs"
@exit /b
