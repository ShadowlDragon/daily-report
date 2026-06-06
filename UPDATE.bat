@echo off
title DOR Updater

cd /d "%~dp0"

echo.
echo Updating DOR...
echo.

set "GIT=portable-git\PortableGit\bin\git.exe"
set "BACKUP=.runtime_backup"

if not exist "%GIT%" (
    echo Git not found.
    pause
    exit /b 1
)

echo Closing running server...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo Backing up runtime files...

if exist "%BACKUP%" rmdir /s /q "%BACKUP%"
mkdir "%BACKUP%"

if exist "node.exe" copy "node.exe" "%BACKUP%\node.exe" >nul
if exist "node_modules" robocopy "node_modules" "%BACKUP%\node_modules" /E >nul
if exist ".cache" robocopy ".cache" "%BACKUP%\.cache" /E >nul
if exist "portable-git" robocopy "portable-git" "%BACKUP%\portable-git" /E >nul
if exist "config.json" copy "config.json" "%BACKUP%\config.json" >nul
if exist "reports" robocopy "reports" "%BACKUP%\reports" /E >nul

echo Trusting repository...
"%GIT%" config --global --add safe.directory "%CD%"

echo Fetching latest update...
"%GIT%" fetch origin

if errorlevel 1 (
    echo Fetch failed.
    pause
    exit /b 1
)

echo Resetting local files...
"%GIT%" reset --hard origin/main

if errorlevel 1 (
    echo Reset failed.
    pause
    exit /b 1
)

echo Restoring runtime files...

if exist "%BACKUP%\node.exe" copy "%BACKUP%\node.exe" "node.exe" >nul
if exist "%BACKUP%\node_modules" robocopy "%BACKUP%\node_modules" "node_modules" /E >nul
if exist "%BACKUP%\.cache" robocopy "%BACKUP%\.cache" ".cache" /E >nul
if exist "%BACKUP%\portable-git" robocopy "%BACKUP%\portable-git" "portable-git" /E >nul
if exist "%BACKUP%\config.json" copy "%BACKUP%\config.json" "config.json" >nul
if exist "%BACKUP%\reports" robocopy "%BACKUP%\reports" "reports" /E >nul

rmdir /s /q "%BACKUP%"

echo.
echo Update complete.
echo Starting DOR server...
echo.

if exist "start.bat" (
    start "DOR Server" "%~dp0start.bat"
) else (
    echo start.bat not found.
    pause
    exit /b 1
)

exit /b 0