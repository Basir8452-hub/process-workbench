import type {
  ContentBlock,
  DocumentStatus,
  IssueSeverity,
  IssueStatus,
  KnowledgeItem,
  KnowledgeType,
  Priority,
  ProcessDocument,
  RootCauseCategory,
  StoreData,
} from './types'

export const APP_NAME = '工艺工作台'

export const DEFAULT_NEWS_PUSH_TIME = '09:00'

export const DEFAULT_NEWS_FEEDS = [
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD%20%E6%94%BF%E7%AD%96&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD%20%E9%A1%B9%E7%9B%AE&format=rss&setlang=zh-cn',
]

export const DEFAULT_NEWS_QUERY =
  '储能 政策 市场 项目 订单 技术 产品 企业 产能 价格 出海'

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#64748b',
}

export const ISSUE_SEVERITY_LABELS: Record<IssueSeverity, string> = {
  stop: '停线',
  batch: '批量',
  normal: '一般',
}

export const ISSUE_SEVERITY_COLORS: Record<IssueSeverity, string> = {
  stop: '#dc2626',
  batch: '#ea580c',
  normal: '#2563eb',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  new: '新建',
  analyzing: '分析中',
  action: '措施中',
  verifying: '验证中',
  closed: '已关闭',
  onhold: '挂起',
}

export const ISSUE_STATUS_COLORS: Record<IssueStatus, string> = {
  new: '#64748b',
  analyzing: '#7c3aed',
  action: '#2563eb',
  verifying: '#0891b2',
  closed: '#16a34a',
  onhold: '#94a3b8',
}

export const ISSUE_STATUS_FLOW: IssueStatus[] = ['new', 'analyzing', 'action', 'verifying', 'closed']

export const ROOT_CAUSE_CATEGORY_LABELS: Record<RootCauseCategory, string> = {
  man: '人（操作/技能/意识）',
  machine: '机（设备/工装/刀具）',
  material: '料（来料/物料）',
  method: '法（工艺/方法/标准）',
  measure: '测（量具/检测/监控）',
  environment: '环（环境/温湿度/洁净度）',
  management: '管理（流程/培训/监督）',
  design: '设计（产品/工艺设计缺陷）',
  other: '其他',
}

export const ROOT_CAUSE_CATEGORY_OPTIONS = (
  Object.keys(ROOT_CAUSE_CATEGORY_LABELS) as RootCauseCategory[]
).map((value) => ({ value, label: ROOT_CAUSE_CATEGORY_LABELS[value] }))

export const DOC_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: '草稿',
  reviewing: '审批中',
  controlled: '受控',
  obsolete: '作废',
}

export const DOC_STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: '#64748b',
  reviewing: '#d97706',
  controlled: '#16a34a',
  obsolete: '#94a3b8',
}

export const DOC_TYPES = [
  'SOP',
  'PFMEA',
  '控制计划',
  '工艺流程图',
  '参数表',
  '工装夹具',
  '防错清单',
  '其他',
]

export const KNOWLEDGE_TYPE_LABELS: Record<KnowledgeType, string> = {
  case: '问题案例',
  standard: '标准规范',
  template: '模板',
  experience: '经验总结',
}

export const KNOWLEDGE_TYPE_COLORS: Record<KnowledgeType, string> = {
  case: '#dc2626',
  standard: '#2563eb',
  template: '#7c3aed',
  experience: '#0f766e',
}

export const PRIORITY_OPTIONS = (Object.keys(PRIORITY_LABELS) as Priority[]).map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

export const ISSUE_SEVERITY_OPTIONS = (Object.keys(ISSUE_SEVERITY_LABELS) as IssueSeverity[]).map(
  (value) => ({ value, label: ISSUE_SEVERITY_LABELS[value] }),
)

export const ISSUE_STATUS_OPTIONS = (Object.keys(ISSUE_STATUS_LABELS) as IssueStatus[]).map(
  (value) => ({ value, label: ISSUE_STATUS_LABELS[value] }),
)

export const DOC_STATUS_OPTIONS = (Object.keys(DOC_STATUS_LABELS) as DocumentStatus[]).map(
  (value) => ({ value, label: DOC_STATUS_LABELS[value] }),
)

export const DOC_TYPE_OPTIONS = DOC_TYPES.map((value) => ({ value, label: value }))

export const KNOWLEDGE_TYPE_OPTIONS = (Object.keys(KNOWLEDGE_TYPE_LABELS) as KnowledgeType[]).map(
  (value) => ({ value, label: KNOWLEDGE_TYPE_LABELS[value] }),
)

export function createEmptyStore(): StoreData {
  return {
    version: 1,
    tasks: [],
    issues: [],
    issueLogs: [],
    documents: [],
    knowledge: [],
    reports: [],
    newsArticles: [],
    newsDigests: [],
    toeflRecords: [],
    settings: {
      expiryWarningDays: 30,
    },
  }
}

/** 旧知识条目 content 字符串 → blocks 单 text 块 */
export function knowledgeContentToBlocks(content?: string): ContentBlock[] {
  const text = (content ?? '').trim()
  return text ? [{ type: 'text', text }] : []
}

/** 旧文件台账 process/line 字段 → 归档标签（工序:xxx / 产线:xxx） */
export function documentLegacyToTags(doc: {
  process?: string
  line?: string
  tags?: string[]
}): string[] {
  const tags = Array.isArray(doc.tags) ? [...doc.tags] : []
  if (doc.process?.trim()) tags.push(`工序:${doc.process.trim()}`)
  if (doc.line?.trim()) tags.push(`产线:${doc.line.trim()}`)
  return [...new Set(tags.filter(Boolean))]
}

/** 数据迁移：兼容 v0.6.0 及更早的持久化数据 */
export function migrateStore(input: StoreData): StoreData {
  return {
    ...input,
    documents: (input.documents ?? []).map((doc) => {
      const legacy = doc as ProcessDocument & { process?: string; line?: string }
      if (Array.isArray(legacy.tags) && legacy.tags.length > 0) return legacy
      return { ...legacy, tags: documentLegacyToTags(legacy) }
    }),
    knowledge: (input.knowledge ?? []).map((item) => {
      const legacy = item as KnowledgeItem & { content?: string }
      if (Array.isArray(legacy.blocks) && legacy.blocks.length > 0) return legacy
      return { ...legacy, blocks: knowledgeContentToBlocks(legacy.content) }
    }),
  }
}
