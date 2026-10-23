# 发布检查清单（每次更新版本号时逐项核对）

> 目的：版本号必须全仓库一致。改版本号 = 改 **package.json**（唯一源头），然后按下面清单同步其余位置。

## 需要同步版本号的位置

| # | 位置 | 内容 | 当前值（v0.5.6） | 怎么改 |
|---|---|---|---|---|
| 1 | `package.json` | `"version": "0.5.6"` | ✅ 已是最新 | **唯一源头**，先改这里 |
| 2 | `package-lock.json` | 顶部 `"version"` **两处**（顶层 + `packages[""]`） | 已同步 0.5.6 | 随 package.json 改（跑 `npm install` 也会自动更新） |
| 3 | `docs/ROADMAP.md` | 「已完成版本」表新增一行 | 含 0.5.4 | 发版后补记一行 |
| 4 | `README.md` | 当前版本 | 已改为"以 tag 为准" | **无需再改**（不再写死版本号） |
| 5 | `push-to-github.bat` | 推送标签 | 自动识别最新 tag | **无需再改**（脚本自动 `git tag --sort=-version:refname`） |
| 6 | `electron/main.cjs` | `app.getVersion()` | 运行时读 package.json | **无需再改**（自动跟随） |

## 每次发布新版本的操作顺序

1. 改 `package.json` 的 `version`（如 `0.5.1` → `0.6.0`）
2. 改 `package-lock.json` 顶部两处版本号（或用 `npm install` 自动同步）
3. 更新 `docs/ROADMAP.md`：在「已完成版本」表加一行，记录本次变化
4. 跑 `npm run build` + `npm test` 确认无回归
5. `git add -A && git commit -m "vX.Y.Z: 说明"`
6. `git tag vX.Y.Z`
7. 打包源码 zip（含 .git + push-to-github.bat）上传云盘
8. 用户下载解压 → 双击 `push-to-github.bat` 推送 → GitHub Actions 自动打包发布
9. 从镜像拉取安装版 + 便携版 exe 传云盘交付

## 已自动化的版本号（无需手动）

- `electron/main.cjs` 的 `app.getVersion()` → 运行时从 package.json 读取，应用内"关于"显示的版本永远正确
- `push-to-github.bat` → 自动识别仓库最新 tag，永远推最新版
- `README.md` → 不再写死版本，指向 GitHub Releases

## 版本号与 Git 的关系

- **tag 必须与 package.json 版本一致**：`git tag v0.5.1` 对应 `package.json version: 0.5.1`
- GitHub Actions 的 `release.yml` 以推送 `v*` 标签为触发条件，打包出的 exe 文件名与 tag 一致
- 便携版/安装版 exe 的 `productName` 固定为"工艺工作台"，文件名带版本号（如 `0.5.1.exe`、`Setup.0.5.1.exe`）
