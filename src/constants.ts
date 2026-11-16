import type {
  ContentBlock,
  DocumentStatus,
  IssueSeverity,
  IssueStatus,
  KnowledgeItem,
  KnowledgeType,
  NewsCategory,
  Priority,
  ProcessDocument,
  RootCauseCategory,
  StoreData,
} from './types'

export const APP_NAME = '工艺工作台'

export const DEFAULT_NEWS_PUSH_TIME = '09:00'

/** 储能资讯默认 RSS：行业 + 海辰视角（海辰储能 / Hithium） */
export const DEFAULT_NEWS_FEEDS = [
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD%20%E6%94%BF%E7%AD%96&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E5%82%A8%E8%83%BD%20%E9%A1%B9%E7%9B%AE&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E6%B5%B7%E8%BE%B0%E5%82%A8%E8%83%BD&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=Hithium&format=rss&setlang=zh-cn',
]

export const DEFAULT_NEWS_QUERY =
  '储能 政策 市场 项目 订单 技术 产品 企业 产能 价格 出海 海辰 海辰储能 Hithium'

/** AI 资讯默认 RSS */
export const DEFAULT_AI_NEWS_FEEDS = [
  'https://www.bing.com/news/search?q=AI%20%E5%A4%A7%E6%A8%A1%E5%9E%8B&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=AI%20%E6%99%BA%E8%83%BD%E4%BD%93&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=%E4%BA%BA%E5%B7%A5%E6%99%BA%E8%83%BD%20%E4%BC%81%E4%B8%9A&format=rss&setlang=zh-cn',
  'https://www.bing.com/news/search?q=AI%20%E5%B7%A5%E4%B8%9A%E5%88%B6%E9%80%A0&format=rss&setlang=zh-cn',
]

export const DEFAULT_AI_NEWS_QUERY =
  'AI 大模型 智能体 Agent 算力 机器人 工业 制造 企业 提效 落地 开源'

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  storage: '储能资讯',
  ai: 'AI 资讯',
}

export const NEWS_CATEGORY_ORDER: NewsCategory[] = ['storage', 'ai']

/** 储能日报主题分区（对齐《一周AI观察》的分区式写法） */
export const STORAGE_NEWS_SECTIONS = [
  '焦点动态',
  '政策与市场',
  '项目与订单',
  '技术与产品',
  '企业与资本',
]

/** AI 日报主题分区（参考《AI共研社·一周AI观察》） */
export const AI_NEWS_SECTIONS = [
  '今日焦点',
  'AI 技术前沿',
  '工业与储能 AI',
  'AI 与企业组织',
]

/** 日报表（飞书）信息：仅用于提示与格式对齐，不直连飞书 */
export const DAILY_REPORT_TABLE_TOKEN = 'JRyusq8LqhVghVtkhmAcL1e3nvb'

export const DAILY_REPORT_COLUMNS = ['日期', '今日工作重点', '明日工作计划', '需要支持']

/** 周报邮件固定参数 */
export const WEEKLY_MAIL_TO = ['lid02@hithium.com', 'tianks@hithium.com', 'yuyf@hithium.com']

export const WEEKLY_MAIL_CC = ['zhaolm@hithium.com']

export const WEEKLY_MAIL_SUBJECT_TEMPLATE =
  '【请阅】系统工艺开发组新员工WK{week}周报进展（{date}）'

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
    dailyReports: [],
    newsArticles: [],
    newsDigests: [],
    toeflRecords: [],
    settings: {
      expiryWarningDays: 30,
      closeToTray: true,
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
