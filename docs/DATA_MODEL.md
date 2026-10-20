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
| `permanentAction` | string? | 永久措施 |
| `verification` | string? | 验证结果 |
| `isRepeat` | boolean? | 是否重复问题 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

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
| `process` | string? | 工序段 |
| `line` | string? | 产线 |
| `status` | `draft \| reviewing \| controlled \| obsolete` | 状态 |
| `effectiveDate` | string? | 生效日期 |
| `reviewDate` | string? | 下次复审日期 |
| `filePath` | string? | 文件路径 |
| `notes` | string? | 备注 |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

### KnowledgeItem 知识库

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 唯一 ID |
| `title` | string | 标题 |
| `type` | `case \| standard \| template \| experience` | 类型 |
| `tags` | string[] | 标签 |
| `content` | string | 正文 |
| `sourceIssueId` | string? | 来源问题 ID |
| `createdAt` | string | ISO 时间 |
| `updatedAt` | string | ISO 时间 |

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
| `aiApiKey` | string? | API Key（本地明文） |
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

## 5. 数据迁移建议

当前 `version` 固定为 1，没有正式迁移器。未来建议：

- 增加 `schemaVersion`
- 每次加载时执行 `migrateStore(data)`
- 保留最近一次迁移前备份
- 数据量大时迁移到 SQLite：
  - `tasks`
  - `issues`
  - `issue_logs`
  - `documents`
  - `knowledge`
  - `reports`
  - `news_articles`
  - `news_digests`
  - `settings`（单行 JSON 或 key-value）

## 6. 容量与清理

- 资讯文章最多保留 2000 条（`applyNewsResult` 截断）。
- 日报最多保留 365 期。
- 默认按 `newsRetentionDays` 清理。
- 本地备份最多保留 30 份。
