# 数据模型

数据模型定义在 `src/types.ts`，当前没有独立数据库，所有业务数据保存在一个 JSON 文档中。

## 1. 顶层结构

```ts
interface StoreData {
  version: number
  tasks: Task[]
  issues: Issue[]
  issueLogs: IssueLog[]
  documents: ProcessDocument[]
  knowledge: KnowledgeItem[]
  reports: WeeklyReport[]
  newsArticles: NewsArticle[]
  newsDigests: NewsDigest[]
  toeflRecords: ToeflDailyRecord[]
  settings: AppSettings
}
```

示例文件：[docs/sample/workbench-data.sample.json](./sample/workbench-data.sample.json)

## 2. 实体字段

### Task 待办

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `title` | string | 待办内容 |
| `priority` | `high \| medium \| low` | 优先级 |
| `dueDate` | string? | 截止日 `YYYY-MM-DD` |
| `done` | boolean | 是否完成 |
| `linkedType` | `issue \| document \| knowledge`? | 关联对象类型 |
| `linkedId` | string? | 关联对象 ID |
| `notes` | string? | 备注 |
| `createdAt` | string | ISO 时间 |
| `completedAt` | string? | 完成时间 ISO |

### Issue 现场问题

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `code` | string | 问题编号，例如 `Q-20261020-001` |
| `title` | string | 问题标题 |
| `product` | string? | 产品/机型 |
| `line` | string? | 产线 |
| `process` | string? | 工序段 |
| `batchNo` | string? | 批次号（v0.7.0 新增） |
| `severity` | `stop \| batch \| normal` | 停线/批量/一般 |
| `status` | `new \| analyzing \| action \| verifying \| closed \| onhold` | 状态 |
| `owner` | string? | 责任人 |
| `department` | string? | 责任部门 |
| `foundDate` | string | 发现日期 |
| `dueDate` | string? | 要求关闭日期 |
| `closedDate` | string? | 实际关闭日期 |
| `description` | string? | 问题描述 |
| `containment` | string? | 临时措施 |
| `rootCause` | string? | 根因/5Why |
| `rootCauseCategory` | `RootCauseCategory`? | 根因类别（v0.7.0 新增，**状态转 closed 前必填**） |
| `permanentAction` | string? | 永久措施 |
| `verification` | string? | 验证结果 |
| `isRepeat` | boolean? | 是否重复问题 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

`RootCauseCategory` 取值：`man`（人）/ `machine`（机）/ `material`（料）/ `method`（法）/ `measure`（测）/ `environment`（环）/ `management`（管理）/ `design`（设计）/ `other`（其他）。中文标签见 `ROOT_CAUSE_CATEGORY_LABELS`。

**关闭问题的两条硬约束**（`src/pages/Issues.tsx` 的 `validateClose` 与 `setStatus`）：

1. `rootCause` 非空且 `rootCauseCategory` 已选，否则拒绝关闭并提示。
2. 关闭时自动沉淀一条知识（`sourceIssueId` 去重，同一问题只沉淀一次）；`permanentAction` 非空且无未完成关联待办时，自动生成 `【纠正】` 待办（优先级映射：`stop`/`batch` → `high`，`normal` → `medium`）。

### IssueLog 跟催记录

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `issueId` | string | 关联问题 ID |
| `date` | string | 记录日期 |
| `action` | string | 动作 |
| `owner` | string? | 责任人 |
| `note` | string? | 备注 |
| `createdAt` | string | ISO 时间 |

### ProcessDocument 工艺文件

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `code` | string | 文件编号 |
| `name` | string | 文件名称 |
| `type` | string | SOP/PFMEA/控制计划等 |
| `version` | string | 版本 |
| `tags` | string[] | 归档标签（v0.7.0 起；原 `process`/`line` 已移除，旧数据迁为「工序:xxx」「产线:xxx」） |
| `status` | `draft \| reviewing \| controlled \| obsolete` | 状态 |
| `filePath` | string? | 文件路径 |
| `notes` | string? | 备注 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

> v0.7.0 已移除 `process`、`line`、`effectiveDate`、`reviewDate` 四个字段，改为标签化的归档定位。旧数据迁移见 `documentLegacyToTags()`。

### KnowledgeItem 知识库

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `title` | string | 标题 |
| `type` | `case \| standard \| template \| experience` | 类型 |
| `tags` | string[] | 标签 |
| `blocks` | `ContentBlock[]` | 内容块数组（v0.7.0 起；旧 `content` 字符串自动迁移为单个 text 块） |
| `sourceIssueId` | string? | 来源问题 ID（关闭自动沉淀时写入，用于去重） |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

`ContentBlock` 是联合类型，同一卡片内可混排：

```ts
type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; dataUrl: string }   // base64 数据 URL，单图 ≤ 2MB
  | { type: 'table'; headers: string[]; rows: string[][] }
```

块与纯文本互转用 `src/utils/knowledge.ts` 的 `blocksToText()` / `blocksToExcerpt()`（Excel 导入导出、卡片摘要、案例沉淀均走这两个函数）。

### ToeflDailyRecord 托福练习记录

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `date` | string | 练习日期 `YYYY-MM-DD`（同日固定选题，异日重新洗牌） |
| `answers` | `ToeflQuestionAnswer[]` | 当日作答记录（`questionId` / `selectedIndex` / `correct`） |
| `startedAt` | string | 开始时间 ISO |
| `updatedAt` | string | 更新时间 ISO |

题库本体是静态数据 `src/data/toeflQuestions.ts`（120 题，词汇/语法/句子/阅读各 30），不入 `StoreData`。选题算法在 `src/services/toefl.ts`：`mulberry32` 种子 PRNG + Fisher-Yates 洗牌，种子取日期，保证同日选题固定、异日随机。

### WeeklyReport 周报

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `startDate` | string | 周期开始 |
| `endDate` | string | 周期结束 |
| `highlights` | string | 本周重点 |
| `nextPlan` | string | 下周计划 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

### NewsArticle 资讯文章

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `title` | string | 标题 |
| `summary` | string | 摘要/描述，最多约 600 字 |
| `link` | string | 原文链接 |
| `source` | string | 来源 |
| `publishedAt` | string | 发布时间 ISO |
| `fetchedAt` | string | 抓取时间 ISO |
| `digestDate` | string | 所属推送日期 |

### NewsDigest 资讯日报

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `date` | string | 目标日期（通常为昨天） |
| `title` | string | 日报标题 |
| `summary` | string | AI 摘要或原文摘要 |
| `highlights` | string[] | 重点速览 |
| `articleIds` | string[] | 本期文章 ID |
| `status` | `success \| fallback \| failed` | 生成状态 |
| `error` | string? | 失败/降级原因 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

### AppSettings 设置

| 字段 | 类型 | 说明 |
|---|---|---|
| `ownerName` | string? | 姓名 |
| `department` | string? | 部门/岗位 |
| `expiryWarningDays` | number? | 文件到期提醒天数，默认 30 |
| `aiBaseUrl` | string? | OpenAI 兼容接口地址 |
| `aiApiKey` | string? | API Key（safeStorage base64 密文，兼容旧明文） |
| `aiModel` | string? | 模型名称 |
| `aiSystemPrompt` | string? | 自定义系统提示词 |
| `newsEnabled` | boolean? | 是否开启自动推送 |
| `newsPushTime` | string? | 推送时间 `HH:mm`，默认 `09:00` |
| `newsFeeds` | string[]? | RSS 源列表 |
| `newsMaxArticles` | number? | 每期最多条数，默认 8 |
| `newsRetentionDays` | number? | 资讯保留天数，默认 90 |

## 3. 数据位置

```text
app.getPath('userData')/workbench-data.json
app.getPath('userData')/backups/workbench-YYYY-MM-DD.json
```

Windows 默认在 `%APPDATA%\<应用名>` 下，按 Windows 用户隔离。

## 4. 新增字段检查清单

新增 `StoreData` 字段时，必须同步：

1. `src/types.ts`
2. `src/constants.ts` → `createEmptyStore()`
3. `src/services/storage.ts` → `normalizeStore()`
4. `electron/main.cjs` → `defaultStore`

如果是新实体，还需要：

- 对应的页面、表单、Excel 导入导出
- 删除/关联清理逻辑
- 示例数据和测试

## 5. 数据迁移

`version` 仍为 1，但已有运行期迁移器：`src/constants.ts` 的 `migrateStore()`，在 `normalizeStore()` 末尾无条件调用（每次加载数据都会跑一遍）。

当前迁移规则（v0.7.0）：

| 旧结构 | 新结构 | 实现 |
|---|---|---|
| `ProcessDocument.process` / `line` | `tags: string[]`，前缀「工序:」「产线:」 | `documentLegacyToTags()` |
| `KnowledgeItem.content: string` | `blocks: [{ type: 'text', text }]` | `knowledgeContentToBlocks()` |
| `Issue` 缺 `batchNo` / `rootCauseCategory` | 补 `undefined` | `normalizeStore()` 内显式映射 |

两条迁移都是**幂等**的：若目标字段已存在且非空，原样保留、不重复转换。已用 `src/services/storage.test.ts` 4 个用例覆盖（旧字段迁移、已有 tags 不重复迁移、content 转单块、issues 补默认值）。

后续建议：

- 引入显式 `schemaVersion`，让迁移按版本号分步执行，而不是每次都全量跑
- 保留最近一次迁移前备份
- 数据量大时迁移到 SQLite：`tasks` / `issues` / `issue_logs` / `documents` / `knowledge` / `reports` / `news_articles` / `news_digests` / `toefl_records` / `settings`（单行 JSON 或 key-value）

## 6. 容量与清理

- 资讯文章最多保留 2000 条（`applyNewsResult` 截断）。
- 日报最多保留 365 期。
- 默认按 `newsRetentionDays` 清理。
- 本地备份最多保留 30 份。
