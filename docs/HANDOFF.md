# 交接文档（v0.7.0）

> 写给接手本项目的下一位 AI Agent 或开发者。读完这一份，你就具备继续开发所需的全部上下文；细节再按需查本文末尾的「延伸阅读」。
>
> 生成时间：2026-11-16 ｜ 对应版本：`0.7.0`（tag `v0.7.0`）｜ 仓库：`Basir8452-hub/process-workbench`

---

## 1. 一句话概括

面向工艺开发工程师的**单机离线** Windows 桌面工作台：Electron 44 + React 19 + TypeScript 7 + Vite 8 + Ant Design 6，数据存本地 JSON 文件，无服务端、无数据库、无多租户。

三条不可动的底线：

1. **数据本地**：不上云、不引云端数据库。
2. **离线优先**：断网时除 AI 摘要与资讯抓取外，其余功能全部可用。
3. **数据不可丢**：任何改动都要保证旧 `workbench-data.json` 能正常加载（靠迁移层兜底，见 §5）。

---

## 2. 现状快照

| 项 | 值 |
|---|---|
| 版本 | `0.7.0` |
| 最近 tag | `v0.7.0` |
| 页面 | 10 个（驾驶舱/储能资讯/待办/现场问题/文件台账/周报/知识库/扩展/托福/设置） |
| 测试 | 26 个用例，2 个测试文件，全绿 |
| 构建 | `tsc -b && vite build` 通过 |
| CI | GitHub Actions：推 `v*` 标签自动打包并发布 Releases |
| 打包产物 | `Setup.x.y.z.exe`（安装版）、`x.y.z.exe`（便携版） |

命令：

```bash
npm install
npm run dev          # Vite + Electron
npm run dev:web      # 只跑网页预览（数据走 localStorage，不碰真实数据文件）
npm test             # vitest
npm run build        # 类型检查 + 构建
npm run package      # Windows NSIS 安装包
```

> 打包必须在 Windows 上做（`electron-builder --win`）。Linux 沙箱里只能跑 build/test，出不了 exe。

---

## 3. 架构速览

```text
Renderer (React + antd)
  pages / components / AppStore / services
        │ window.workbench.*
Preload (electron/preload.cjs) —— contextBridge 白名单
        │ IPC
Main (electron/main.cjs) —— 窗口、数据文件、备份、对话框、AI 代理、RSS
        │
  本地文件系统：workbench-data.json + backups/*.json
```

改主进程能力必须同步三处：`electron/main.cjs`（`ipcMain.handle`）→ `electron/preload.cjs`（`contextBridge`）→ `src/types.ts`（`WorkbenchApi` 类型）。网页预览要可用的话，再补 `src/services/storage.ts` 的 localStorage 兜底。

数据流：页面 → `useAppStore().mutate()` → 内存更新 → `saveStore` → 主进程「临时文件 + rename」原子写 → 每日备份。**不要绕过 AppStore 直接写文件。**

---

## 4. v0.7.0 四项改动的实现位置（最重要）

这是本次版本的全部业务改动，后续接手最容易在这里出问题。

### 4.1 问题全生命周期管理

| 能力 | 位置 |
|---|---|
| 新增字段 `batchNo` / `rootCauseCategory` | `src/types.ts` 的 `Issue`、`RootCauseCategory` |
| 根因类别中文标签与选项 | `src/constants.ts` 的 `ROOT_CAUSE_CATEGORY_LABELS` / `ROOT_CAUSE_CATEGORY_OPTIONS` |
| 关闭前双校验（`rootCause` + `rootCauseCategory`） | `src/pages/Issues.tsx` 的 `validateClose()` 与 `setStatus()` |
| 纠正措施自动派待办 | `Issues.tsx` 的 `ensureCorrectiveTask()`；严重度映射 `severityToPriority()`（stop/batch→high，normal→medium） |
| 表单联动提示（关闭态才提示必选） | `Issues.tsx` 的 `Form.useWatch('status', issueForm)` |

关键规则：**建问题时就填了永久措施且状态非 closed**，也会自动派待办；已有未完成关联待办时不重复派。`linkedType='issue'` + `linkedId` 作为关联锚点。

### 4.2 失效模式知识库（FMEA 轻量版）

| 能力 | 位置 |
|---|---|
| 关闭自动沉淀 | `Issues.tsx` 的 `buildKnowledge()`；`setStatus()` 内按 `sourceIssueId` 去重（同一问题只沉淀一次） |
| 手动沉淀按钮 | `Issues.tsx` 详情/表格操作区 |
| 同类失效检索 | `Issues.tsx` 的 `searchRelated()`：标题分词（长度 ≥2）→ 在 `title + blocksToText(blocks) + tags` 中模糊匹配 → Drawer 展示前 8 条 |

沉淀出的知识是 `type='case'`，`tags` 自动带 `批次:xxx`、`根因:xxx` 前缀，正文是一条 text 块，含现象/临时措施/根因/根因类别/永久措施/验证结果。

### 4.3 文件台账改「归档」定位

- 字段变更：删 `process` / `line` / `effectiveDate` / `reviewDate`，改 `tags: string[]`。
- 旧数据迁移：`src/constants.ts` 的 `documentLegacyToTags()`，转成「工序:xxx」「产线:xxx」前缀标签。
- 页面：`src/pages/Documents.tsx` 整页重写——标签 `Select mode="tags"` + 标签多选筛选（`tagFilter: string[]`），统计卡改为「文件总数/受控/草稿·审批中/作废归档」。
- Excel：`src/utils/excel.ts` 的 `DOC_HEADERS` 8 列 = 文件编号/名称/类型/版本/状态/标签/路径/备注；导入兼容旧的「工序段」「产线」列并转成标签。
- **连带影响**：`Dashboard.tsx`、`Report.tsx`、`AiChat.tsx`、`excel.ts` 中原「文件复审到期」业务逻辑（`expiringDocs`）已全部移除，改这几个文件时不要再引用 `expiringDocs`。注意 `src/utils/date.ts` 里的 `daysUntil` / `isWithinDays` 是**通用日期工具、仍然保留**（`daysUntil` 被 `isOverdue`/`isDueToday`/`isDueSoon`/`dueLabel` 使用，别误删）。

### 4.4 知识库多格式混排

- 类型：`ContentBlock = text | image | table`（`src/types.ts`）。
- 存储：`KnowledgeItem.blocks: ContentBlock[]`，旧的 `content: string` 已移除。
- 互转：`src/utils/knowledge.ts` 的 `blocksToText()` / `blocksToExcerpt()`——Excel 导入导出、卡片摘要、案例沉淀、同类检索都走这两个函数。**给知识库加任何「导出/预览」能力时，务必走 blocksToText，不要假设有 content 字段。**
- 页面：`src/pages/Knowledge.tsx` 整页重写，含块编辑器（text 草稿 / 图片 dataURL ≤2MB / 表格弹窗）与块渲染器 `BlockView` / `BlockTable`。
- 图片存 base64 dataURL 在 JSON 里，**注意体积**：单图 ≤2MB，多图会让 `workbench-data.json` 迅速变大。

---

## 5. 数据模型与迁移（改数据前必读）

完整字段表见 `docs/DATA_MODEL.md`，这里只给改数据时必须知道的规矩。

### 5.1 新增 StoreData 字段必须同步四处

1. `src/types.ts` —— 字段与类型
2. `src/constants.ts` —— `createEmptyStore()`
3. `src/services/storage.ts` —— `normalizeStore()`
4. `electron/main.cjs` —— `defaultStore`

漏任何一处，旧数据加载时字段就是缺失的。

### 5.2 迁移层现状

`version` 仍是 1，但**已有运行期迁移器**：`migrateStore()` 在 `normalizeStore()` 末尾无条件调用，每次加载都跑一遍。当前三条规则：

| 旧 | 新 | 函数 |
|---|---|---|
| `doc.process` / `doc.line` | `tags` 加「工序:」「产线:」 | `documentLegacyToTags()` |
| `knowledge.content` | `blocks: [text 块]` | `knowledgeContentToBlocks()` |
| `issue` 缺 `batchNo` / `rootCauseCategory` | 补 `undefined` | `normalizeStore()` 内显式映射 |

两条迁移都**幂等**（目标字段已有非空值就原样保留）。`src/services/storage.test.ts` 有 4 个用例专门覆盖，**改迁移逻辑必须同步改这 4 个用例**。

### 5.3 数据文件位置

```text
%APPDATA%\<应用名>\workbench-data.json
%APPDATA%\<应用名>\backups\workbench-YYYY-MM-DD.json   # 最多 30 份
```

真实路径在应用「设置 → 数据与备份」里可直接查看复制。调试时先手动「立即备份」再动手。

---

## 6. 常见改动路径（照着做不会漏）

### 加一个页面

1. `src/components/AppLayout.tsx`：`PageKey` 加 key、`PAGE_META` 加标题/图标、`MENU_ITEMS` 加菜单项
2. `src/App.tsx`：import（懒加载）+ 条件渲染
3. `src/pages/`：新建页面组件
4. `src/styles.css`：页面样式

页面顶部标题栏由 `AppLayout` 统一渲染，**页面组件不要再自己画一遍**。

### 加一个主进程能力

`electron/main.cjs` 加 `ipcMain.handle` → `electron/preload.cjs` 暴露 → `src/types.ts` 补 `WorkbenchApi` 类型 → 需要网页预览可用就补 `storage.ts` 兜底。

### 改 Excel 导入导出

全部在 `src/utils/excel.ts`，解析与生成都在渲染层用 `xlsx`（SheetJS）完成，主进程只管文件选择与落盘。加列要同时改「表头数组 + 行映射 + 解析函数 + 模板行」四处，否则导入会对不齐。

---

## 7. 坑与红线

### 已踩过的坑（别重犯）

- **沙箱 → Windows 交付**：Agent 跑在 Linux 沙箱，写不了用户 D 盘。交付方式是打包 zip（**必须含 `.git`**，否则用户双击 `push-to-github.bat` 会报 not a git repository）上传云盘。
- **zip 里的 `.git/config` origin 必须是真实地址** `https://github.com/Basir8452-hub/process-workbench.git`。用镜像克隆时 origin 会指向 `gh-proxy.com`，打包前务必 `git remote set-url origin <真实地址>` 并用 `unzip -p <zip> .git/config` 验证。否则用户 push 会去连镜像、弹 Git Credential Manager 卡死。
- **打包 zip 不能排除 `.git/objects`**，会丢 git 对象导致 not a git repository。
- Zip 排除项固定为：`node_modules`、`dist`、`release*`、`*.log`。

### 编码红线

- 不用 `any` 逃类型；日期用 `dayjs`（存储 `YYYY-MM-DD`，时间戳 ISO）；ID 用 `uid()`。
- 错误提示写中文可操作话术，不要只 `console.error`。
- AI Key 绝不进源码/日志/提交；`aiApiKey` 是本地明文，正式多人使用前应改系统凭据库。
- 不要提交 `node_modules` / `dist` / `release*` / 用户数据文件 / 日志 / API Key。
- 不要未经确认就重构 `AppStore` 与 RAG（`services/news.ts` 的 BM25 逻辑）。
- **需求流转约定**：用户提的新想法先写进 `docs/ROADMAP.md` 的候选清单，讨论确认后再实现——「描述得很具体」不等于「授权直接开发」。

### 已知限制（不是 bug，别当 bug 修）

- 应用完全退出不后台运行，9:00 日报靠运行中或 9:00 后首次启动补生成。
- 资讯默认必应 RSS，公司网络受限需在设置里换源。
- 安装包未代码签名，SmartScreen 可能提示。
- 无自动更新，新版本手动下载。
- 多人共用同一 Windows 账号 → 共享同一份数据。

---

## 8. 发布流程（照 `docs/RELEASE_CHECKLIST.md` 逐项走）

1. 改 `package.json` 的 `version`（唯一源头）
2. `npm version x.y.z --no-git-tag-version` 可一次同步 `package.json` + `package-lock.json` 三处
3. 更新 `docs/ROADMAP.md` 已完成版本表
4. `npx tsc --noEmit` + `npm test` + `npm run build` 三关全过
5. `git commit` → `git tag vX.Y.Z`
6. 打包 zip（含 `.git`、`.npmrc`，origin 校验）→ 上传云盘 → 用户解压后双击 `push-to-github.bat`
7. Actions 出包后从 Releases 拉 `Setup.x.y.z.exe` 与 `x.y.z.exe` 回传

低于三关任何一项没过，**不要**打 tag。

---

## 9. 验证清单（接手后第一次改动前先跑一遍）

```bash
npx tsc --noEmit          # 必须 0 错误
npm test                  # 必须 26 passed（若非 26，说明用例被改过，看是否合理）
npm run build             # 必须成功
```

手工要点（详见 `docs/TESTING.md`）：改问题相关 → 重点验「关闭前必填拦截」「关一次只沉淀一条」「待办不重复派」；改台账 → 重点验「旧数据迁移后标签正确」；改知识库 → 重点验「旧 content 数据能正常显示」「图片体积」。

---

## 10. 延伸阅读

| 文档 | 什么时候看 |
|---|---|
| `README.md` | 项目定位、功能全貌、环境与命令 |
| `AGENTS.md` | 架构约束、编码约定、完成定义 |
| `docs/ARCHITECTURE.md` | 进程职责、IPC 契约、RAG 流程、构建打包 |
| `docs/handoff.json` | 本文的**机器可读版**（schemaVersion 1.0）：版本/技术栈/页面清单/测试用例/四项改动实现位置映射/数据模型与迁移/枚举/Excel 列/交付红线/已知限制/候选改进，结构化字段可直接解析 |
| `docs/DATA_MODEL.md` | 全部实体字段、迁移规则、容量限制 |
| `docs/TESTING.md` | 手工验收步骤 |
| `docs/ROADMAP.md` | 已完成版本史 + 待办候选（含 5 项已知问题转来的改进项） |
| `docs/RELEASE_CHECKLIST.md` | 发版逐项核对 |
| `docs/AGENT_PROMPT.md` | 给新 Agent 的启动提示词模板 |
| `docs/sample/workbench-data.sample.json` | 最小演示数据（已对齐 v0.7.0 结构，可导入验证） |

---

## 11. 下一步建议

`docs/ROADMAP.md` 里 5 项候选（后台推送、多源 RSS、代码签名、自动更新、多用户隔离）都还没做，任选其一前先与用户讨论确认范围。若用户要新功能，按「先写 ROADMAP → 讨论确认 → 再动手」的既有约定推进。
