@echo off

cd /d %~dp0

echo.
echo Updating DOR...
echo.

portable-git\PortableGit\bin\git.exe pull

echo.
echo Update complete.
echo.

pause