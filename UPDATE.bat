@echo off
title DOR Updater

cd /d "%~dp0"

echo.
echo Updating DOR...
echo.

set GIT=portable-git\PortableGit\bin\git.exe

if not exist "%GIT%" (

    echo Git not found.
    pause
    exit /b
)

"%GIT%" fetch origin

"%GIT%" reset --hard origin/main

"%GIT%" clean -fd ^
-e node_modules ^
-e .cache ^
-e portable-git

echo.
echo Update complete.
echo.

pause