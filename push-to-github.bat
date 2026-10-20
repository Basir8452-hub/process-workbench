@echo off
REM ============================================
REM  Process Workbench - One-click push to GitHub
REM  Double-click this file. It pushes code to the
REM  main branch and pushes tag v0.5.0. Then
REM  GitHub Actions will build the exe and publish
REM  it to Releases automatically.
REM ============================================
cd /d "%~dp0"

echo ============================================
echo  Pushing code and version tag to GitHub...
echo ============================================
echo.

echo [1/2] Pushing code to main branch...
git push origin main
if errorlevel 1 (
    echo.
    echo [FAILED] Push code failed. Take a screenshot of this window and send it to me.
    goto :end
)

echo.
echo [2/2] Pushing version tag v0.5.0...
git push origin v0.5.0
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
