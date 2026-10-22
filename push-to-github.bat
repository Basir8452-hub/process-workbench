@echo off
REM ============================================
REM  Process Workbench - One-click push to GitHub
REM  Double-click this file. It pushes code to the
REM  main branch and pushes the latest version tag.
REM  Then GitHub Actions will build the exe and
REM  publish it to Releases automatically.
REM ============================================
cd /d "%~dp0"

echo ============================================
echo  Pushing code and latest version tag to GitHub...
echo ============================================
echo.

REM Check this folder is a git repository first
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo [ERROR] This folder is NOT a git repository.
    echo The .git folder is missing, so version tags
    echo cannot be found.
    echo.
    echo FIX: Re-download the source zip from Feishu
    echo and unzip it into a NEW folder, then run
    echo this script again.
    goto :end
)

REM Detect the latest tag automatically (e.g. v0.5.1)
set LATEST_TAG=
for /f "delims=" %%t in ('git tag --sort=-version:refname') do if not defined LATEST_TAG set "LATEST_TAG=%%t"

if not defined LATEST_TAG (
    echo [ERROR] No git tag found in this repository.
    echo Please make sure this folder is the unpacked repo.
    goto :end
)

echo Latest tag detected: %LATEST_TAG%
echo.

echo [1/2] Pushing code to main branch...
git push origin main
if errorlevel 1 (
    echo.
    echo [FAILED] Push code failed. Take a screenshot of this window and send it to me.
    goto :end
)

echo.
echo [2/2] Pushing version tag %LATEST_TAG%...
git push origin %LATEST_TAG%
if errorlevel 1 (
    echo.
    echo [FAILED] Push tag failed. Take a screenshot of this window and send it to me.
    goto :end
)

echo.
echo ============================================
echo  All pushed successfully!
echo  Check build progress at:
echo  https://github.com/Basir8452-hub/process-workbench/actions
echo  Download the exe from Releases when done:
echo  https://github.com/Basir8452-hub/process-workbench/releases
echo ============================================

:end
echo.
pause
