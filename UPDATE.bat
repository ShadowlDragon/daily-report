@echo off
title DOR Updater

cd /d "%~dp0"

echo.
echo ==================================
echo        DOR UPDATE
echo ==================================
echo.

if not exist ".git" (
    echo ERROR: .git folder not found
    pause
    exit /b
)

set GIT=portable-git\PortableGit\bin\git.exe

if not exist "%GIT%" (
    echo ERROR: Git not found
    pause
    exit /b
)

echo Using Git:
echo %GIT%
echo.

"%GIT%" pull

echo.
echo ==================================
echo UPDATE COMPLETE
echo ==================================
echo.

pause