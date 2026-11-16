# AGENTS.md

本文件写给接手本项目的 AI Agent 或开发者。开始修改前，请先按顺序阅读：

0. `docs/HANDOFF.md` —— **交接总览，先读这份**（当前版本现状、v0.7.0 四项改动位置、迁移规则、坑与红线）
0b. `docs/handoff.json` —— 上面这份的**机器可读版**，需要结构化字段（页面清单、实现位置映射、枚举、迁移规则、红线）时直接解析它
1. `README.md`
2. `docs/ARCHITECTURE.md`
3. `docs/DATA_MODEL.md`
4. `docs/TESTING.md`

## 项目定位

这是一个面向工艺开发工程师的本地单机工作台，不是云端多租户系统。

- 运行形态：Electron Windows 桌面应用
- 数据形态：本地 JSON 文件
- 用户形态：一人一机或一人一个 Windows 账号
- 设计原则：离线优先、数据本地、操作可追溯、界面偏专业工具风

## 常用命令

```bash
npm install
npm run dev          # Vite + Electron
npm run dev:web      # 仅网页预览，数据走 localStorage
npm run build        # tsc -b && vite build
npm run package      # Windows NSIS 安装包
```

当前打包输出目录由 `package.json` 的 `build.directories.output` 决定，当前是 `release/`（已在 `.gitignore` 中忽略）。切换版本改目录时注意同步此说明，避免旧安装包混淆。

图标文件已包含在仓库中：`build/icon.ico`、`build/icon.png`、`build/icon-512.png`、`public/icon.png`。如需重新生成（例如替换图标或图标损坏），运行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/generate-icon.ps1
```

## 架构约束

### 1. 渲染层不能直接访问 Node

渲染层只能通过 `window.workbench` 调用主进程能力：

- 文件读写、备份、Excel 对话框
- AI 请求
- RSS 抓取
- 桌面通知
- 打开数据目录

新增主进程能力时，必须同时改这三处：

1. `electron/main.cjs`：新增 `ipcMain.handle(...)`
2. `electron/preload.cjs`：通过 `contextBridge` 暴露方法
3. `src/types.ts`：补充 `WorkbenchApi` 类型

如果网页预览也需要可用，再在 `src/services/storage.ts` 中补浏览器兜底。

### 2. 新增 StoreData 字段必须同步四处

数据模型在 `src/types.ts` 的 `StoreData`。新增字段时，至少同步：

1. `src/types.ts`：字段和类型
2. `src/constants.ts`：`createEmptyStore()`
3. `src/services/storage.ts`：`normalizeStore()`
4. `electron/main.cjs`：`defaultStore`

否则旧数据文件加载时会出现字段缺失。

### 3. 新增页面必须同步四处

1. `src/components/AppLayout.tsx`：`PageKey`、`PAGE_META`、`MENU_ITEMS`
2. `src/App.tsx`：导入页面并加入条件渲染
3. `src/pages/`：新增页面组件
4. `src/styles.css`：页面样式

页面标题区已经统一由 `AppLayout` 渲染，页面组件不要再自己画顶部标题栏。

### 4. 数据保存链路

```text
页面操作
  → useAppStore().mutate()
  → 更新内存状态
  → window.workbench.saveStore(next)
  → 主进程临时文件 + rename
  → 每日备份
```

不要绕过 `AppStore` 直接写 JSON；不要在渲染层使用 `fs`。

### 5. AI 与资讯

- AI 请求统一走 `src/services/ai.ts`，最终由主进程 `ai:chat` 发出。
- 不要把 API Key 写进源码、日志或错误提示。
- 储能资讯抓取走主进程 `news:fetch`，渲染层不直接请求 RSS，避免 CORS。
- RAG 检索逻辑在 `src/services/news.ts` 的 `retrieveArticles()`，当前是 BM25，不依赖向量模型。
- 不要把“附带工作台摘要”默认打开；涉及把本地数据发送给外部 AI，必须保持用户主动开启。

### 6. UI 约定

- 组件库：Ant Design 6。
- 页面内容外层使用 `page-stack`，卡片使用 `panel-card` / `stat-card`。
- 左右内边距与标题栏保持一致：桌面 32px，窄屏 22px。
- 左侧导航固定，右侧 `.app-content` 独立滚动；不要改回整页滚动。
- 新增颜色尽量复用 `src/styles.css` 中已有色板，不要引入第三套视觉体系。
- 表格长内容优先使用 `table-subtext`、`text-muted`、`text-danger` 等现有类。

## 编码约定

- 使用 TypeScript，不使用 `any` 逃避类型检查。
- 日期统一用 `dayjs`；存储日期用 `YYYY-MM-DD`，时间戳用 ISO 字符串。
- ID 统一用 `src/utils/id.ts` 的 `uid()`。
- 错误处理要给出中文可操作提示，不要只 `console.error`。
- 不要提交 `node_modules`、`dist`、`release/`、`release-*`、用户数据文件、日志和 API Key。
- 不要删除用户已经手动修改过的文件内容，先读再改。

## 已知问题

- Ant Design 6 的 `List` 组件仍有弃用提示，迁移到 `Listy` 前可暂时忽略。
- Electron 开发模式会出现 CSP 安全警告，属于已知项。
- 安装包未签名，Windows SmartScreen 可能拦截。
- 9:00 推送依赖应用运行；应用完全退出时不会后台推送。
- 资讯默认源是必应 RSS，公司网络受限时需在「设置 → 资讯」换源。
- 无自动更新机制，新版本需手动下载安装。
- 多人共用同一 Windows 账号时共享同一份数据文件。
- `settings.aiApiKey` 已改为系统凭据库（safeStorage）加密存储，读取兼容旧明文；网页预览（`npm run dev:web`）没有 Electron 主进程，无法保存 API Key。

## 测试与 CI（已具备）

- 单元测试：`npm test`（vitest，26 个用例），覆盖 `storage.test.ts`（数据归一化 + v0.7.0 迁移路径）与 `toefl.test.ts`（选题算法）。
- CI：`.github/workflows/release.yml`，推送 `v*` 标签或手动触发，在 windows-latest 上自动安装依赖 → 构建 → 跑测试 → 打包 NSIS 安装版 + 便携版 → 发布到 GitHub Releases。
- 新增业务逻辑（尤其是迁移、算法、校验）应补对应 `.test.ts`，CI 会一并跑。

## 完成定义

提交前至少完成：

1. `npx tsc --noEmit` 通过
2. `npm test` 通过
3. `npm run build` 通过
4. 手工验证新增页面/功能的增删改查和刷新后数据保留
5. 如果涉及打包：`npm run package` 成功，并启动 `release/win-unpacked/工艺工作台.exe` 验证
6. 不引入新的控制台运行时错误
7. 不把测试数据、API Key、用户数据文件带进提交

详细验收步骤见 `docs/TESTING.md`。
