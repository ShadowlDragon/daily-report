@echo off
title DOR Updater

cd /d "%~dp0"

echo.
echo Updating DOR...
echo.

set "GIT=portable-git\PortableGit\bin\git.exe"

if not exist "%GIT%" (
    echo Git not found.
    pause
    exit /b 1
)

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

echo Cleaning extra files...
"%GIT%" clean -fd -e node_modules -e .cache -e portable-git -e node.exe -e config.json -e reports

echo.
echo Update complete.
echo.

pause