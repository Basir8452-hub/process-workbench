# 给接任 AI Agent 的启动提示词

> 仓库已包含完整源码，直接 clone 即可，不需要下载或解压 zip。

把下面这段连同仓库一起交给新的 AI Agent，替换 `<任务>` 和 `<验收标准>` 后即可使用。

```text
你接手一个名为“工艺工作台”的 Windows 本地桌面应用，继续开发新功能。

项目位置：<仓库路径>
技术栈：Electron 44 + React 19 + TypeScript 7 + Vite 8 + Ant Design 6 + 本地 JSON 存储。

开始前必须按顺序阅读：
1. README.md
2. AGENTS.md
3. docs/ARCHITECTURE.md
4. docs/DATA_MODEL.md
5. docs/TESTING.md

开发命令：
- npm install
- npm run dev        # Electron 开发模式
- npm run dev:web    # 仅网页预览，数据走 localStorage
- npm run build
- npm run package    # Windows NSIS 安装包

架构约束：
- 渲染层不能直接访问 Node，只能调用 window.workbench。
- 主进程能力在 electron/main.cjs；通过 electron/preload.cjs 暴露；类型在 src/types.ts 的 WorkbenchApi。
- 数据模型在 src/types.ts。新增 StoreData 字段时，必须同步：
  src/constants.ts 的 createEmptyStore、
  src/services/storage.ts 的 normalizeStore、
  electron/main.cjs 的 defaultStore。
- 新增页面时，必须同步 AppLayout.tsx 的 PageKey / PAGE_META / MENU_ITEMS，以及 App.tsx 的页面渲染。
- 数据保存统一走 useAppStore().mutate()，不要绕过 AppStore 直接写文件。
- AI 请求走 src/services/ai.ts；RSS 抓取走主进程 news:fetch；RAG 检索在 src/services/news.ts。
- 不要提交 node_modules、dist、release-*、用户数据文件、日志和 API Key。
- 不要在未确认需求前大规模重构数据层或 UI 架构。

本次任务：
<在这里写清楚要新增/修改的功能、页面、交互和边界>

验收标准：
<在这里写清楚必须满足的行为、数据保存、异常场景和打包验证>

完成后请：
1. 运行 npx tsc --noEmit
2. 运行 npm run build
3. 按 docs/TESTING.md 做相关手工验收
4. 如果涉及交付 EXE，运行 npm run package 并启动 release-*/win-unpacked/工艺工作台.exe 验证
5. 汇报改动文件、验证结果和仍存在的风险
```

## 任务描述建议

为了让接任 Agent 更可靠，任务描述里尽量写清楚：

- 要改哪个页面/模块
- 数据结构是否新增字段
- 是否需要 Excel 导入导出
- 是否需要 AI/RAG
- 是否需要打包验证
- 哪些行为不能改变（例如现有数据兼容、左侧导航固定、数据本地保存）

## 不要交给 Agent 的内容

- 真实 API Key
- 真实用户数据 `workbench-data.json`
- 公司内部敏感文件
- `node_modules`、`dist`、`release-*` 等构建产物
