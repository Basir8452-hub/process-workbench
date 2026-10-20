@echo off
REM ============================================================
REM  工艺工作台 - 一键打包并发布到 GitHub Releases
REM  用法：双击本文件（首次会安装依赖，需几分钟）
REM  依赖：Windows + Node.js 18+（官网 https://nodejs.org 安装 LTS）
REM  前置：Git 凭据（见下方"凭据说明"）
REM
REM  凭据说明（重要）：
REM   Edge 里登录 GitHub 网页 ≠ Git 命令行可用。
REM  本脚本首次会引导你创建 Personal Access Token 并配置到
REM  Windows 凭据管理器（只需一次，之后自动记住）。
REM ============================================================
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================================
echo  工艺工作台 一键打包 + 发布
echo ============================================================
echo.

REM 0. 检查 Git 与 Node
where git >nul 2>nul || (echo [错误] 未安装 Git，请先安装 https://git-scm.com/download/win & pause & exit /b 1)
where node >nul 2>nul || (echo [错误] 未安装 Node.js，请先安装 https://nodejs.org LTS 版 & pause & exit /b 1)

REM 1. 读取 package.json 版本号
for /f "tokens=2 delims=:" %%v in ('findstr /c:""version"" package.json') do set VER=%%v
set VER=%VER: =%
set VER=%VER:"=%
set VER=%VER:,=%
echo [1/5] 当前版本：v%VER%

REM 2. 安装依赖（已配置 npmmirror 镜像，比默认源快）
echo [2/5] 安装依赖（首次需几分钟，之后秒过）...
call npm ci --registry=https://registry.npmmirror.com
if errorlevel 1 (echo [错误] npm ci 失败，请检查网络 & pause & exit /b 1)

REM 3. 构建 + 打包 Windows exe（NSIS 安装版 + 便携版）
echo [3/5] 构建并打包 exe（约 1-3 分钟）...
call npm run build
if errorlevel 1 (echo [错误] 构建失败，详见上方日志 & pause & exit /b 1)
call npm run package
if errorlevel 1 (echo [错误] 打包失败，详见上方日志 & pause & exit /b 1)
call npm run package:portable
if errorlevel 1 (echo [错误] 便携版打包失败 & pause & exit /b 1)

REM 4. 检查/配置 GitHub 凭据（Windows Git Credential Manager）
echo [4/5] 检查 GitHub 推送凭据...
git credential-manager version >nul 2>nul
if errorlevel 1 (
  echo   - 未检测到 Git Credential Manager，尝试安装...
  winget install --id Git.Git -e --silent 2>nul
  git credential-manager version >nul 2>nul || echo   - 提示：请重装 Git 时勾选 "Git Credential Manager" 组件
)
git config --global credential.helper manager 2>nul

REM 5. 提交 + 打标签 + 推送
echo [5/5] 提交并推送 v%VER% 到 GitHub...
git add -A
git commit -m "release: v%VER%" 2>nul || echo （无新提交，直接打标签）
git push origin main
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  [推送失败] 需要 GitHub 访问令牌（Token）
  echo  1. 打开浏览器登录 GitHub，访问：
  echo     https://github.com/settings/tokens
  echo  2. 点 Generate new token，勾选 repo 权限（写仓库），
  echo     过期时间建议选 No expiration
  echo  3. 把生成的 token 复制下来，执行下面命令（按提示输入）：
  echo     git credential-manager github login
  echo     或：git push 时用户名填你的 GitHub 用户名，密码填 token
  echo  4. 然后重新双击本脚本即可
  echo ============================================================
  pause & exit /b 1
)
git tag v%VER% 2>nul
git push origin v%VER%
if errorlevel 1 (echo [错误] 标签推送失败 & pause & exit /b 1)

echo.
echo ============================================================
echo  [完成] 已打包并推送 v%VER%
echo  本地 exe 在：%~dp0release\
echo  云端自动打包发布中，稍后到 Releases 页下载：
echo  https://github.com/Basir8452-hub/process-workbench/releases
echo ============================================================
echo.
pause
