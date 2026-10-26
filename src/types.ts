export type ID = string

export type Priority = 'high' | 'medium' | 'low'

export interface Task {
  id: ID
  title: string
  priority: Priority
  dueDate?: string
  done: boolean
  linkedType?: 'issue' | 'document' | 'knowledge'
  linkedId?: ID
  notes?: string
  createdAt: string
  completedAt?: string
  /** 最近一次进度反馈（纯文本，一句话说明当前进展） */
  progress?: string
  /** 最近一次进度反馈时间（ISO 字符串） */
  progressAt?: string
}

export type IssueSeverity = 'stop' | 'batch' | 'normal'
export type IssueStatus = 'new' | 'analyzing' | 'action' | 'verifying' | 'closed' | 'onhold'
/** 根因类别（关闭前必填） */
export type RootCauseCategory =
  | 'man'
  | 'machine'
  | 'material'
  | 'method'
  | 'measure'
  | 'environment'
  | 'management'
  | 'design'
  | 'other'

export interface Issue {
  id: ID
  code: string
  title: string
  product?: string
  line?: string
  process?: string
  /** 批次号（v0.7.0 新增） */
  batchNo?: string
  severity: IssueSeverity
  status: IssueStatus
  owner?: string
  department?: string
  foundDate: string
  dueDate?: string
  closedDate?: string
  description?: string
  containment?: string
  rootCause?: string
  /** 根因类别（v0.7.0 新增，关闭前必填） */
  rootCauseCategory?: RootCauseCategory
  permanentAction?: string
  verification?: string
  isRepeat?: boolean
  createdAt: string
  updatedAt: string
}

export interface IssueLog {
  id: ID
  issueId: ID
  date: string
  action: string
  owner?: string
  note?: string
  createdAt: string
}

export type DocumentStatus = 'draft' | 'reviewing' | 'controlled' | 'obsolete'

export interface ProcessDocument {
  id: ID
  code: string
  name: string
  type: string
  version: string
  /** 归档标签（原工序/产线字段迁移而来，如「工序:焊接」「产线:SMT-01」） */
  tags: string[]
  status: DocumentStatus
  filePath?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/** 知识内容块：同一卡片内多格式混排 */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; dataUrl: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export type KnowledgeType = 'case' | 'standard' | 'template' | 'experience'

export interface KnowledgeItem {
  id: ID
  title: string
  type: KnowledgeType
  tags: string[]
  /** 内容块数组（v0.7.0 起）；旧数据 content 字符串自动迁移为单个 text 块 */
  blocks: ContentBlock[]
  sourceIssueId?: ID
  createdAt: string
  updatedAt: string
}

export interface WeeklyReport {
  id: ID
  startDate: string
  endDate: string
  highlights: string
  nextPlan: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  ownerName?: string
  department?: string
  expiryWarningDays?: number
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
  aiSystemPrompt?: string
  newsEnabled?: boolean
  newsPushTime?: string
  newsFeeds?: string[]
  newsMaxArticles?: number
  newsRetentionDays?: number
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  baseUrl: string
  apiKey?: string
  model: string
  messages: AiChatMessage[]
  temperature?: number
}

export interface AiChatResult {
  ok: boolean
  content?: string
  error?: string
}

export interface NewsFeedItem {
  title: string
  link: string
  summary: string
  source: string
  publishedAt: string
}

export interface NewsFetchResult {
  ok: boolean
  items: NewsFeedItem[]
  errors: string[]
}

export interface NewsArticle {
  id: ID
  title: string
  summary: string
  link: string
  source: string
  publishedAt: string
  fetchedAt: string
  digestDate: string
}

export type NewsDigestStatus = 'success' | 'fallback' | 'failed'

export interface NewsDigest {
  id: ID
  date: string
  title: string
  summary: string
  highlights: string[]
  articleIds: ID[]
  status: NewsDigestStatus
  error?: string
  createdAt: string
  updatedAt: string
}

export type ToeflQuestionType = 'vocab' | 'grammar' | 'sentence' | 'reading'

export interface ToeflQuestion {
  id: ID
  type: ToeflQuestionType
  /** 阅读题短文，其他题型为空 */
  passage?: string
  prompt: string
  options: string[]
  answerIndex: number
  explanation: string
}

export interface ToeflQuestionAnswer {
  questionId: ID
  selectedIndex: number | null
  correct: boolean | null
}

export interface ToeflDailyRecord {
  id: ID
  date: string
  answers: ToeflQuestionAnswer[]
  startedAt: string
  updatedAt: string
}

export interface StoreData {
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

export interface AppInfo {
  dataPath: string
  backupPath: string
  userDataPath: string
  version: string
}

export interface SaveResult {
  ok: boolean
  path?: string
  message?: string
}

export interface FileResult {
  canceled: boolean
  path?: string
  message?: string
}

export interface ImportStoreResult {
  canceled: boolean
  data?: StoreData
  path?: string
}

export interface ExcelOpenResult {
  canceled: boolean
  buffer?: ArrayBuffer
  name?: string
}

export interface WorkbenchApi {
  loadStore: () => Promise<StoreData>
  saveStore: (data: StoreData) => Promise<SaveResult>
  backupStore: () => Promise<SaveResult>
  exportStore: () => Promise<FileResult>
  importStore: () => Promise<ImportStoreResult>
  saveExcel: (buffer: ArrayBuffer, defaultName: string) => Promise<FileResult>
  openExcel: () => Promise<ExcelOpenResult>
  getAppInfo: () => Promise<AppInfo>
  openDataFolder: (kind: 'data' | 'backup') => Promise<SaveResult>
  aiChat: (request: AiChatRequest) => Promise<AiChatResult>
  aiEncryptKey: (plain: string) => Promise<string | null>
  aiDecryptKey: (encoded: string) => Promise<string | null>
  fetchNewsFeeds: (feedUrls: string[]) => Promise<NewsFetchResult>
  notify: (payload: { title: string; body: string }) => Promise<{ ok: boolean }>
}

declare global {
  interface Window {
    workbench?: WorkbenchApi
  }
}
