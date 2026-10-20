# 工艺工作台（Process Workbench）

这是一个私有交接仓库，包含工艺开发工程师个人工作台的完整源码、文档和图标资源。

## 源码位置

完整源码在仓库根目录的：

```text
process-workbench-source-v0.3.1.zip
```

下载并解压后得到 `process-workbench/` 目录，其中包含：

- `README.md`：项目说明、启动和打包命令
- `AGENTS.md`：给接任 AI Agent 的架构约束和开发约定
- `docs/ARCHITECTURE.md`：架构、IPC、AI/RAG 流程
- `docs/DATA_MODEL.md`：数据模型和字段说明
- `docs/TESTING.md`：测试与验收清单
- `docs/ROADMAP.md`：已完成版本、已知问题和后续优先级
- `docs/AGENT_PROMPT.md`：可直接复制给其他 AI Agent 的启动提示词
- `docs/sample/`：匿名示例数据

## 快速开始

```bash
# 1. 解压 process-workbench-source-v0.3.1.zip
# 2. 进入 process-workbench 目录
npm install
npm run dev
```

如果 `build/icon.ico`、`build/icon.png` 或 `public/icon.png` 不存在，先运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-icon.ps1
```

打包 Windows 安装包：

```bash
npm run package
```

## 注意事项

- 数据文件 `workbench-data.json` 和 `settings.aiApiKey` 不应提交到仓库。
- 安装包未做代码签名，Windows SmartScreen 可能提示。
- 应用完全退出时不会后台运行，9:00 资讯推送依赖应用运行或在启动后补生成。
- 详细交接说明以 zip 内的 `README.md` 和 `AGENTS.md` 为准。
