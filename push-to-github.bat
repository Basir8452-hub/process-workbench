@echo off
REM ============================================================
REM  工艺工作台 一键推送 GitHub（v0.5.0）
REM  双击本文件即可：推送代码到 main + 推送 v0.5.0 标签，
REM  推送成功后 GitHub 会自动打包 exe 并发布到 Releases。
REM ============================================================
chcp 65001 >nul
cd /d "%~dp0"

echo ============================================
echo  开始推送代码和版本标签到 GitHub...
echo ============================================
echo.

echo [1/2] 推送代码到 main 分支...
git push origin main
if errorlevel 1 (
    echo.
    echo [失败] 推送代码失败，请截图本窗口内容发给我。
    echo 常见原因：Git 未安装 / 未登录 / 网络问题。
    goto :end
)

echo.
echo [2/2] 推送版本标签 v0.5.0...
git push origin v0.5.0
if errorlevel 1 (
    echo.
    echo [失败] 推送标签失败，请截图本窗口内容发给我。
    goto :end
)

echo.
echo ============================================
echo  全部推送成功！
echo  打开下面地址即可看到自动打包进度：
echo  https://github.com/Basir8452-hub/process-workbench/actions
echo  打包完成后，Releases 页面即可下载 exe：
echo  https://github.com/Basir8452-hub/process-workbench/releases
echo ============================================

:end
echo.
pause
