# ============================================================
#  工艺工作台 一键打包 + 发布（PowerShell 主脚本）
#  由 build-release.bat 调用；也可在 PowerShell 里直接运行：
#    powershell -ExecutionPolicy Bypass -File .\build-release.ps1
#  所有输出同时写入 build.log（脚本同目录），窗口关闭也能查。
# ============================================================
param()

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 日志（Start-Transcript 失败不阻断，仅记录）
try {
    Start-Transcript -Path (Join-Path $PSScriptRoot 'build.log') -Force | Out-Null
} catch {
    Write-Host '(提示：无法写入 build.log，继续执行)' -ForegroundColor DarkGray
}

function Exit-WithPause {
    param([string]$msg, [int]$code = 1)
    Write-Host $msg -ForegroundColor Red
    Stop-Transcript 2>$null
    Read-Host '按回车键关闭窗口...'
    exit $code
}

Write-Host ''
Write-Host '============================================' -ForegroundColor Cyan
Write-Host '  工艺工作台 一键打包 + 发布' -ForegroundColor Cyan
Write-Host '============================================' -ForegroundColor Cyan
Write-Host ''

# 0. 检查 Git 与 Node
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Exit-WithPause '[错误] 未安装 Git，请先安装 https://git-scm.com/download/win'
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Exit-WithPause '[错误] 未安装 Node.js，请先安装 https://nodejs.org 的 LTS 版'
}

# 1. 读取版本号（package.json）
try {
    $json = Get-Content -Raw -Encoding UTF8 'package.json' | ConvertFrom-Json
    $ver = $json.version
} catch {
    Exit-WithPause '[错误] 无法读取 package.json 版本号，请确认文件存在且格式正确'
}
Write-Host ("[1/5] 当前版本：v{0}" -f $ver) -ForegroundColor Yellow

# 2. 安装依赖（npmmirror 镜像加速）
Write-Host '[2/5] 安装依赖（首次需几分钟，之后秒过）...' -ForegroundColor Yellow
npm ci --registry=https://registry.npmmirror.com
if ($LASTEXITCODE -ne 0) { Exit-WithPause '[错误] npm ci 失败，请检查网络后重试' }

# 3. 构建 + 打包（构建一次，产出 NSIS 安装版 + 便携版）
Write-Host '[3/5] 构建并打包 exe（约 1-3 分钟）...' -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Exit-WithPause '[错误] 构建失败，详见上方日志' }
npx electron-builder --win nsis --publish never
if ($LASTEXITCODE -ne 0) { Exit-WithPause '[错误] 安装版打包失败，详见上方日志' }
npx electron-builder --win portable --publish never
if ($LASTEXITCODE -ne 0) { Exit-WithPause '[错误] 便携版打包失败，详见上方日志' }

# 4. 提交 + 打标签 + 推送（触发 GitHub Actions 自动发布）
Write-Host ("[4/5] 提交并推送 v{0} 到 GitHub..." -f $ver) -ForegroundColor Yellow
git add -A
git commit -m "release: v$ver" 2>$null | Out-Null
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '=============== 推送失败，需要 GitHub 访问令牌 ===============' -ForegroundColor Red
    Write-Host '1. 浏览器登录 GitHub，访问：' -ForegroundColor Yellow
    Write-Host '   https://github.com/settings/tokens'
    Write-Host '2. Generate new token，勾选 repo 权限，过期选 No expiration' -ForegroundColor Yellow
    Write-Host '3. 回到本窗口，执行：git credential-manager github login' -ForegroundColor Yellow
    Write-Host '   （按提示用浏览器登录一次，之后自动记住）'
    Write-Host '4. 重新双击 build-release.bat 即可' -ForegroundColor Yellow
    Write-Host '==============================================================' -ForegroundColor Red
    Exit-WithPause ''
}
git tag "v$ver" 2>$null
git push origin "v$ver"
if ($LASTEXITCODE -ne 0) { Exit-WithPause '[错误] 标签推送失败，详见上方日志' }

# 5. 完成
Stop-Transcript 2>$null
Write-Host ''
Write-Host '============================================' -ForegroundColor Green
Write-Host ('  [完成] 已打包并推送 v{0}' -f $ver) -ForegroundColor Green
Write-Host ("  本地 exe 在：{0}\release\" -f $PSScriptRoot) -ForegroundColor Green
Write-Host '  云端自动打包发布中，稍后到 Releases 页下载：' -ForegroundColor Green
Write-Host '  https://github.com/Basir8452-hub/process-workbench/releases' -ForegroundColor Green
Write-Host '============================================' -ForegroundColor Green
Write-Host ''
Read-Host '按回车键关闭窗口...'
