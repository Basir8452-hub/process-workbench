# 架构说明

## 1. 总体结构

```text
┌─────────────────────────────────────────────────────┐
│ Renderer（React + Ant Design）                      │
│  pages / components / AppStore / services           │
│  - 页面交互、表单、图表、AI 对话、RAG 问答          │
└───────────────────────┬─────────────────────────────┘
                        │ window.workbench.*
┌───────────────────────▼─────────────────────────────┐
│ Preload（contextBridge）                            │
│  electron/preload.cjs                               │
│  - 只暴露白名单方法，不暴露 Node / ipcRenderer       │
└───────────────────────┬─────────────────────────────┘
                        │ IPC
┌───────────────────────▼─────────────────────────────┐
│ Main Process（Node.js）                             │
│  electron/main.cjs                                  │
│  - 窗口、数据文件、备份、文件对话框、通知            │
│  - AI 请求代理、RSS 抓取与解析                       │
└───────────────────────┬─────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │ 本地文件系统       │
              │ workbench-data.json│
              │ backups/*.json     │
              └───────────────────┘
```

## 2. 进程职责

### 主进程 `electron/main.cjs`

- 创建 `BrowserWindow`，开发模式加载 `http://127.0.0.1:5173`，生产模式加载 `dist/index.html`。
- 管理本地数据文件：
  - 读取：`store:load`
  - 原子写入：`store:save`（临时文件 + rename）
  - 每日备份：`backups/workbench-YYYY-MM-DD.json`
  - 手动备份、JSON 导出/导入
- 管理 Excel 文件对话框：`excel:open` / `excel:save`
- 代理 AI 请求：`ai:chat`，避免渲染层 CORS，并统一超时与错误处理。
- 抓取 RSS：`news:fetch`，使用主进程 `fetch` + 正则解析 RSS 2.0。
- 桌面通知：`app:notify`。
- 外部链接：`setWindowOpenHandler` 使用系统浏览器打开。

### Preload `electron/preload.cjs`

只暴露以下方法：

```ts
loadStore / saveStore / backupStore / exportStore / importStore
saveExcel / openExcel
getAppInfo / openDataFolder
aiChat / fetchNewsFeeds / notify
```

渲染层不能直接使用 `require`、`fs`、`ipcRenderer`。

### 渲染层 `src/`

- `App.tsx`：页面切换、创建信号、全局资讯定时器。
- `components/AppLayout.tsx`：固定侧边栏、标题栏、内容滚动容器。
- `store/AppStore.tsx`：全局状态、`mutate()`、串行保存队列。
- `services/storage.ts`：`window.workbench` 的封装；网页预览时使用 localStorage 兜底。
- `services/ai.ts`：AI 请求封装；Electron 走 IPC，浏览器走 fetch。
- `services/news.ts`：资讯清洗、去重、BM25 检索、RAG Prompt、摘要生成。
- `hooks/useNewsScheduler.ts`：每日 9:00 自动推送与补生成。

## 3. IPC 契约

| Channel | 请求 | 返回 | 用途 |
|---|---|---|---|
| `store:load` | 无 | `StoreData` | 加载本地数据 |
| `store:save` | `StoreData` | `{ ok, path }` | 原子保存 |
| `store:backup` | 无 | `{ ok, path?, message? }` | 手动备份 |
| `store:export` | 无 | `{ canceled, path? }` | 导出 JSON |
| `store:import` | 无 | `{ canceled, data?, path? }` | 导入 JSON |
| `excel:save` | `buffer, defaultName` | `{ canceled, path? }` | 保存 Excel |
| `excel:open` | 无 | `{ canceled, buffer?, name? }` | 打开 Excel |
| `app:info` | 无 | `{ dataPath, backupPath, userDataPath, version }` | 设置页展示 |
| `app:open-folder` | `'data' \| 'backup'` | `{ ok, path }` | 打开数据/备份目录 |
| `app:notify` | `{ title, body }` | `{ ok }` | 桌面通知 |
| `ai:chat` | `AiChatRequest` | `AiChatResult` | 兼容 OpenAI 的聊天接口 |
| `news:fetch` | `string[]` | `{ ok, items, errors }` | 抓取 RSS 资讯 |

## 4. 数据保存流程

```text
页面调用 mutate(updater)
  → dataRef.current 更新
  → setData(next)
  → saveChain.then(() => saveStore(next))
  → preload invoke('store:save')
  → main writeStore(data)
      → ensureDir
      → dailyBackup()
      → 写 workbench-data.json.tmp
      → rename 为 workbench-data.json
```

保存队列是串行的，避免快速连续操作造成写入竞争。

## 5. AI 对话流程

```text
AiChat 组件
  → chatWithAI(request)
  → window.workbench.aiChat(request)
  → main ipcMain.handle('ai:chat')
  → POST {baseUrl}/chat/completions
  → 读取 choices[0].message.content
  → 返回 { ok, content } 或 { ok:false, error }
```

约定：

- 请求地址兼容 OpenAI Chat Completions。
- `baseUrl` 可以带 `/v1`，也可以直接是完整的 `/chat/completions`。
- 本地模型（如 Ollama）允许 API Key 为空。
- 90 秒超时；错误信息截断后返回。

## 6. 储能资讯与 RAG

### 6.1 抓取

- 默认资讯源：必应资讯 RSS，关键词为“储能”“储能 政策”“储能 项目”。
- 主进程抓取并解析：
  - `<item>` 提取 `title / link / description / pubDate / News:Source`
  - 解析 `bing.com/news/apiclick.aspx` 跳转链接，还原真实 URL
  - 清洗 HTML 与 XML 实体
- 渲染层按标题 + 链接去重，保存为 `NewsArticle`。

### 6.2 自动推送

`useNewsScheduler()`：

- 应用数据加载完成后启动。
- 每分钟检查一次。
- 当前时间 >= `settings.newsPushTime`（默认 09:00）且当日还没有目标日期日报时：
  1. 目标日期 = 昨天
  2. 抓取资讯
  3. 检索并生成日报
  4. 写入 `newsDigests` / `newsArticles`
  5. 发送桌面通知
- 应用 9 点前未启动时，下一次启动会补生成。
- 应用完全退出时不会后台运行。

### 6.3 轻量 RAG

```text
查询
  → 中文二元组 + 英文单词分词
  → BM25 计算相关度
  → 取 Top K（默认日报 8 条、问答 6 条）
  → 拼接来源、日期、摘要
  → 交给 AI 生成带 [编号] 引用的答案
```

实现位置：`src/services/news.ts`。

选择 BM25 的原因：

- 不需要 Embedding 接口或向量库。
- 检索在本地完成，速度快。
- 对中文短资讯足够有效。
- 后续可替换为“Embedding + 向量库”，不影响上层页面。

## 7. Excel 导入导出

- 解析和生成在渲染层用 `xlsx`（SheetJS）完成。
- 主进程只负责文件选择和落盘。
- 导入时自动补全缺失编号、跳过重复标题（知识库）。
- 模板下载通过 `saveExcel` 生成。

## 8. 布局与滚动

- `.app-shell` 固定 `100vh`，整页不滚动。
- 左侧 `.app-sider` 固定。
- 右侧 `.app-content` 独立 `overflow-y: auto`。
- 切换页面时 `AppLayout` 将内容区 scrollTop 重置为 0。
- 标题栏高度 100px，左右 padding 32px。

## 9. 构建与打包

- Vite `base: './'`，保证 `file://` 加载资源。
- `electron-builder` 打包 NSIS：
  - `build/icon.ico` 作为 EXE 图标
  - `build/icon.png` 作为窗口图标，需要包含在 `files` 中
  - `dist/**/*`、`electron/**/*`、`package.json` 进入 asar
- 当前输出目录：`release-v7/`。

## 10. 平台迁移边界

如果迁移到 Tauri / Web / 云端，建议保留：

- `src/pages`、`src/components`、`src/styles.css`
- `src/types.ts`、`src/utils`
- `src/services/news.ts`（BM25 与 RAG）
- `src/store` 的页面状态管理方式

需要替换：

- `electron/main.cjs`、`electron/preload.cjs`
- `src/services/storage.ts` 的 IPC 部分
- `src/services/ai.ts` 的调用方式
- 打包配置

建议把 `window.workbench` 当作平台适配接口：Tauri 用 `invoke` 实现，Web 用 IndexedDB + 服务端 API 实现。

## 11. 安全注意事项

- `contextIsolation: true`、`nodeIntegration: false`。
- 渲染层只能调用白名单 IPC。
- `settings.aiApiKey` 当前是本地明文，后续应迁移到系统凭据库或加密存储。
- 不要把 `workbench-data.json`、API Key、日志提交到 Git。
- AI 上下文摘要默认关闭，避免无意把工厂数据发送给外部模型。
