# 工艺工作台（Process Workbench）

面向工艺开发工程师的本地桌面工作台，覆盖工作驾驶舱、现场问题闭环、工艺文件、周报、个人知识库、储能资讯与 AI 助手。

- 当前版本：`0.3.1`
- 应用形态：Windows 桌面 EXE（Electron）
- 数据形态：本地 JSON 文件，单机离线优先
- 技术栈：Electron 44 + React 19 + TypeScript 7 + Vite 8 + Ant Design 6

## 已实现功能

| 模块 | 能力 |
|---|---|
| 工作驾驶舱 | 今日待办、超期问题、文件到期、问题状态分布、最近问题、AI 助手、个人信息 |
| 储能资讯 | 每日 9:00 自动生成昨日日报、历史推送、RSS 配置、RAG 资讯问答 |
| 待办事项 | 增删改查、优先级、截止日、关联问题/文件/知识 |
| 现场问题闭环 | 问题台账、分级、状态流、5Why、临时/永久措施、跟催记录、关闭、沉淀案例 |
| 工艺文件台账 | 文件登记、版本、受控状态、复审到期提醒、Excel 导入导出 |
| 周报与复盘 | 按周自动汇总、编辑、保存历史周报、导出 Excel |
| 个人知识库 | 案例/标准/模板/经验、标签、关联问题、Excel 批量导入导出 |
| 设置 | 个人信息、文件提醒天数、AI 模型、数据备份/恢复、数据目录 |

## 交接方式

其他 AI Agent 直接克隆本仓库即可，源码、文档和图标都在仓库根目录，不需要下载或解压 zip。

```bash
git clone https://github.com/Basir8452-hub/process-workbench.git
```

## 快速开始

### 环境要求

- Windows 10/11 x64
- Node.js 20+，推荐 Node.js 24
- npm 10+
- 打包需要 Windows 环境

当前开发机的 Node.js 是免安装版本，路径为：

```text
%LOCALAPPDATA%\TraeTools\node-v24.20.0-win-x64
```

如果命令行找不到 `node`/`npm`，先把上面的目录加入当前终端 `PATH`：

```powershell
$env:Path = "$env:LOCALAPPDATA\TraeTools\node-v24.20.0-win-x64;" + $env:Path
```

### 安装与运行

```bash
npm install
npm run dev        # Vite + Electron 开发模式
npm run dev:web    # 只启动网页预览（使用 localStorage 兜底）
npm run build      # TypeScript 检查 + 前端构建
npm run package    # 构建并生成 Windows NSIS 安装包
```

打包产物默认输出到 `release-v7/`：

```text
release-v7/工艺工作台 Setup 0.3.1.exe
release-v7/win-unpacked/工艺工作台.exe
```

## 目录结构

```text
工作台/
├─ electron/
│  ├─ main.cjs          # 主进程：窗口、数据文件、备份、对话框、AI 代理、RSS、通知
│  └─ preload.cjs       # contextBridge，向渲染层暴露 window.workbench
├─ src/
│  ├─ pages/            # 8 个业务页面
│  ├─ components/       # 布局、标签、图表、AI 对话、MarkdownLite
│  ├─ services/         # storage / ai / news
│  ├─ store/            # AppStore 全局状态与持久化
│  ├─ hooks/            # useNewsScheduler 等
│  ├─ utils/            # 日期、ID、Excel
│  ├─ types.ts          # 数据模型与 IPC 类型
│  ├─ constants.ts      # 标签、颜色、默认资讯源、空数据
│  └─ styles.css        # 全局样式与页面样式
├─ build/               # icon.ico / icon.png / icon-512.png（由脚本生成）
├─ public/              # 侧边栏品牌图标（由脚本生成）
├─ scripts/             # generate-icon.ps1 等辅助脚本
├─ docs/                # 交接文档与示例数据
├─ package.json
└─ index.html
```

### 图标资源

仓库已包含以下图标文件：

```text
build/icon.ico
build/icon.png
build/icon-512.png
public/icon.png
```

如果需要重新生成（例如替换图标或图标损坏），运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-icon.ps1
```

## 数据与备份

数据文件由 Electron 主进程写入 `app.getPath('userData')`：

```text
Windows: %APPDATA%\<应用名>\workbench-data.json
```

实际路径可在应用“设置 → 数据与备份”中查看和复制。

- 每次保存会先写临时文件，再重命名替换，避免写入中断损坏原文件。
- 每天第一次保存会自动备份到 `backups/workbench-YYYY-MM-DD.json`，最多保留 30 份。
- 设置页支持立即备份、导出全部数据、导入数据。
- 数据按 Windows 用户隔离；同一个 Windows 账号下共享同一份数据。

> 注意：`settings.aiApiKey` 目前以明文保存在本地 JSON 中。不要把用户数据文件提交到 Git 或发给外部 Agent。

## AI 与 RAG

- AI 对话使用兼容 OpenAI 的 `/chat/completions` 接口，由主进程代理请求，避免渲染层 CORS。
- 支持 DeepSeek、OpenAI、通义千问、Moonshot、Ollama 本地等快捷配置。
- 储能资讯采用“RSS 抓取 → 本地文章库 → BM25 检索 → 拼接 Prompt → AI 生成”的轻量 RAG。
- 检索在本地完成；只有生成摘要或回答时，才把选中的资讯片段发送给配置的 AI。
- 没有配置 AI 时，资讯仍会抓取并生成原文摘要。

## 已知限制

- 应用完全退出时不会在后台运行；9:00 自动推送依赖应用处于运行状态，或在 9:00 后首次启动时补生成。
- 安装包未做代码签名，首次运行可能触发 Windows SmartScreen。
- 目前没有自动化测试和 CI。
- 数据为本地明文 JSON；多人共用 Windows 账号时会共享同一份数据。
- Ant Design 6 的 `List` 组件仍有弃用警告，不影响功能。
- 仓库中的 `release*` 是历史打包产物，不应提交到 Git。

## 交接阅读顺序

1. [AGENTS.md](AGENTS.md)
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. [docs/DATA_MODEL.md](docs/DATA_MODEL.md)
4. [docs/TESTING.md](docs/TESTING.md)
5. [docs/ROADMAP.md](docs/ROADMAP.md)
6. [docs/AGENT_PROMPT.md](docs/AGENT_PROMPT.md)
