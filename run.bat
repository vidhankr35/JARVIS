
@echo off
title J.A.R.V.I.S. Launcher
echo Initializing J.A.R.V.I.S. boot sequence...
:: Try python first, then python3
where python >nul 2>nul
if %errorlevel%==0 (
    python start.py
) else (
    python3 start.py
)
pause
