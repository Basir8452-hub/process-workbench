@echo off
REM ============================================================
REM  工艺工作台 一键打包 + 发布（启动器）
REM  双击本文件即可；全部逻辑在 build-release.ps1，
REM  运行日志写入同目录 build.log。
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

REM 用当前窗口运行 PowerShell 主脚本（不新开窗口，保证能看到输出）
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0build-release.ps1"

REM 兜底：即使 PowerShell 意外闪退也停住让用户看到信息
echo.
echo 脚本已结束（如需查看完整日志，请打开同目录下的 build.log）
pause
