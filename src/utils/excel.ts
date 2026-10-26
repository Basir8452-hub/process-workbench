import * as XLSX from 'xlsx'
import dayjs from 'dayjs'
import {
  DOC_STATUS_LABELS,
  ISSUE_SEVERITY_LABELS,
  ISSUE_STATUS_LABELS,
  KNOWLEDGE_TYPE_LABELS,
  ROOT_CAUSE_CATEGORY_LABELS,
} from '../constants'
import { saveExcel } from '../services/storage'
import type {
  DocumentStatus,
  FileResult,
  Issue,
  IssueSeverity,
  IssueStatus,
  KnowledgeType,
  ProcessDocument,
  RootCauseCategory,
  Task,
} from '../types'
import { formatDate, today } from './date'

function str(value: unknown): string {
  return value === null || value === undefined ? '' : String(value).trim()
}

function toDateString(value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (value instanceof Date) return dayjs(value).format('YYYY-MM-DD')
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (parsed) {
      const month = String(parsed.m).padStart(2, '0')
      const day = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${month}-${day}`
    }
  }
  const text = String(value).trim().replace(/[./]/g, '-')
  const parsed = dayjs(text)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : text
}

function parseSeverity(value: string): IssueSeverity {
  if (value.includes('停线')) return 'stop'
  if (value.includes('批量')) return 'batch'
  return 'normal'
}

function parseIssueStatus(value: string): IssueStatus {
  const entry = Object.entries(ISSUE_STATUS_LABELS).find(([, label]) => label === value)
  return (entry?.[0] as IssueStatus) ?? 'new'
}

function parseDocStatus(value: string): DocumentStatus {
  const entry = Object.entries(DOC_STATUS_LABELS).find(([, label]) => label === value)
  return (entry?.[0] as DocumentStatus) ?? 'draft'
}

function makeSheet(rows: (string | number)[][], widths: number[]): XLSX.WorkSheet {
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = widths.map((wch) => ({ wch }))
  return sheet
}

function writeWorkbook(workbook: XLSX.WorkBook): ArrayBuffer {
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer
}

const ISSUE_HEADERS = [
  '问题编号',
  '问题标题',
  '产品/机型',
  '产线',
  '工序段',
  '批次号',
  '严重度',
  '状态',
  '责任人',
  '责任部门',
  '发现日期',
  '要求关闭日期',
  '关闭日期',
  '问题描述',
  '临时措施',
  '根因分析（5Why）',
  '永久措施',
  '验证结果',
  '根因类别',
  '是否重复问题',
]

function issueRow(issue: Issue): (string | number)[] {
  return [
    issue.code,
    issue.title,
    issue.product ?? '',
    issue.line ?? '',
    issue.process ?? '',
    issue.batchNo ?? '',
    ISSUE_SEVERITY_LABELS[issue.severity],
    ISSUE_STATUS_LABELS[issue.status],
    issue.owner ?? '',
    issue.department ?? '',
    formatDate(issue.foundDate),
    formatDate(issue.dueDate),
    formatDate(issue.closedDate),
    issue.description ?? '',
    issue.containment ?? '',
    issue.rootCause ?? '',
    issue.permanentAction ?? '',
    issue.verification ?? '',
    issue.rootCauseCategory ? ROOT_CAUSE_CATEGORY_LABELS[issue.rootCauseCategory] : '',
    issue.isRepeat ? '是' : '否',
  ]
}

const ISSUE_WIDTHS = [16, 30, 14, 12, 12, 12, 8, 10, 10, 14, 12, 12, 12, 36, 28, 36, 32, 28, 22, 10]

export async function exportIssues(issues: Issue[]): Promise<FileResult> {
  const workbook = XLSX.utils.book_new()
  const sheet = makeSheet([ISSUE_HEADERS, ...issues.map(issueRow)], ISSUE_WIDTHS)
  XLSX.utils.book_append_sheet(workbook, sheet, '问题台账')
  return saveExcel(writeWorkbook(workbook), `问题台账-${today()}.xlsx`)
}

export async function downloadIssueTemplate(): Promise<FileResult> {
  const example = [
    'Q-20260101-001',
    '示例：焊接工序虚焊不良',
    'XX-1000',
    'SMT-01',
    '焊接',
    'B20260101-001',
    '批量',
    '分析中',
    '张三',
    '工艺部',
    '2026-01-01',
    '2026-01-10',
    '',
    '描述问题现象、发生批次和影响范围',
    '已隔离在制品，增加全检',
    '5Why：为什么虚焊……',
    '调整焊接参数并更新 SOP',
    '',
    '法（工艺/方法/标准）',
    '否',
  ]
  const workbook = XLSX.utils.book_new()
  const sheet = makeSheet([ISSUE_HEADERS, example], ISSUE_WIDTHS)
  XLSX.utils.book_append_sheet(workbook, sheet, '问题台账')
  return saveExcel(writeWorkbook(workbook), '问题台账导入模板.xlsx')
}

function parseRootCauseCategory(value: string): RootCauseCategory | undefined {
  const entry = Object.entries(ROOT_CAUSE_CATEGORY_LABELS).find(([, label]) => label === value)
  return entry?.[0] as RootCauseCategory | undefined
}

export async function parseIssueExcel(buffer: ArrayBuffer): Promise<Partial<Issue>[]> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  return rows
    .map((row) => ({
      code: str(row['问题编号']),
      title: str(row['问题标题']),
      product: str(row['产品/机型']) || str(row['产品']),
      line: str(row['产线']),
      process: str(row['工序段']),
      batchNo: str(row['批次号']),
      severity: parseSeverity(str(row['严重度'])),
      status: parseIssueStatus(str(row['状态'])),
      owner: str(row['责任人']),
      department: str(row['责任部门']),
      foundDate: toDateString(row['发现日期']) || today(),
      dueDate: toDateString(row['要求关闭日期']),
      closedDate: toDateString(row['关闭日期']),
      description: str(row['问题描述']),
      containment: str(row['临时措施']),
      rootCause: str(row['根因分析（5Why）']) || str(row['根因分析']),
      permanentAction: str(row['永久措施']),
      verification: str(row['验证结果']),
      rootCauseCategory: parseRootCauseCategory(str(row['根因类别'])),
      isRepeat: str(row['是否重复问题']) === '是',
    }))
    .filter((row) => row.title)
}

const DOC_HEADERS = ['文件编号', '文件名称', '文件类型', '版本', '状态', '标签', '文件路径', '备注']

function docRow(doc: ProcessDocument): (string | number)[] {
  return [
    doc.code,
    doc.name,
    doc.type,
    doc.version,
    DOC_STATUS_LABELS[doc.status],
    doc.tags.join('、'),
    doc.filePath ?? '',
    doc.notes ?? '',
  ]
}

const DOC_WIDTHS = [16, 30, 12, 8, 10, 28, 36, 24]

export async function exportDocuments(documents: ProcessDocument[]): Promise<FileResult> {
  const workbook = XLSX.utils.book_new()
  const sheet = makeSheet([DOC_HEADERS, ...documents.map(docRow)], DOC_WIDTHS)
  XLSX.utils.book_append_sheet(workbook, sheet, '文件台账')
  return saveExcel(writeWorkbook(workbook), `工艺文件台账-${today()}.xlsx`)
}

export async function downloadDocumentTemplate(): Promise<FileResult> {
  const example = [
    'SOP-焊接-001',
    '示例：焊接作业指导书',
    'SOP',
    'A',
    '受控',
    '工序:焊接、产线:SMT-01、储能产品',
    '\\\\共享盘\\工艺文件\\SOP-焊接-001.pdf',
    '变更时需同步培训',
  ]
  const workbook = XLSX.utils.book_new()
  const sheet = makeSheet([DOC_HEADERS, example], DOC_WIDTHS)
  XLSX.utils.book_append_sheet(workbook, sheet, '文件台账')
  return saveExcel(writeWorkbook(workbook), '工艺文件台账导入模板.xlsx')
}

export async function parseDocumentExcel(buffer: ArrayBuffer): Promise<Partial<ProcessDocument>[]> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  return rows
    .map((row) => ({
      code: str(row['文件编号']),
      name: str(row['文件名称']),
      type: str(row['文件类型']) || '其他',
      version: str(row['版本']) || 'A',
      status: parseDocStatus(str(row['状态'])),
      tags: splitTags(
        str(row['标签']) ||
          [str(row['工序段']) ? `工序:${str(row['工序段'])}` : '', str(row['产线']) ? `产线:${str(row['产线'])}` : '']
            .filter(Boolean)
            .join('、'),
      ),
      filePath: str(row['文件路径']),
      notes: str(row['备注']),
    }))
    .filter((row) => row.name)
}

export interface WeeklyReportExportData {
  startDate: string
  endDate: string
  newIssues: Issue[]
  closedIssues: Issue[]
  completedTasks: Task[]
  overdueIssues: Issue[]
  highlights: string
  nextPlan: string
}

export async function exportWeeklyReport(data: WeeklyReportExportData): Promise<FileResult> {
  const workbook = XLSX.utils.book_new()

  const summaryRows: (string | number)[][] = [
    ['工艺工作台周报', ''],
    ['统计周期', `${data.startDate} 至 ${data.endDate}`],
    ['新增问题', data.newIssues.length],
    ['关闭问题', data.closedIssues.length],
    ['完成待办', data.completedTasks.length],
    ['超期未关闭问题', data.overdueIssues.length],
    ['', ''],
    ['本周重点', data.highlights],
    ['下周计划', data.nextPlan],
  ]
  XLSX.utils.book_append_sheet(workbook, makeSheet(summaryRows, [20, 80]), '周报摘要')

  const issueRows = [
    ['问题编号', '问题标题', '产线', '工序段', '严重度', '状态', '责任人', '要求关闭日'],
    ...data.closedIssues.map((issue) => [
      issue.code,
      issue.title,
      issue.line ?? '',
      issue.process ?? '',
      ISSUE_SEVERITY_LABELS[issue.severity],
      ISSUE_STATUS_LABELS[issue.status],
      issue.owner ?? '',
      formatDate(issue.dueDate),
    ]),
  ]
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(issueRows, [16, 30, 12, 12, 8, 10, 10, 12]),
    '本周关闭问题',
  )

  const taskRows = [
    ['待办事项', '优先级', '完成时间', '备注'],
    ...data.completedTasks.map((task) => [
      task.title,
      task.priority === 'high' ? '高' : task.priority === 'medium' ? '中' : '低',
      formatDate(task.completedAt),
      task.notes ?? '',
    ]),
  ]
  XLSX.utils.book_append_sheet(workbook, makeSheet(taskRows, [40, 8, 12, 30]), '本周完成待办')

  const riskRows = [
    ['类型', '名称/编号', '责任人', '截止日期', '状态'],
    ...data.overdueIssues.map((issue) => [
      '超期问题',
      `${issue.code} ${issue.title}`,
      issue.owner ?? '',
      formatDate(issue.dueDate),
      ISSUE_STATUS_LABELS[issue.status],
    ]),
  ]
  XLSX.utils.book_append_sheet(workbook, makeSheet(riskRows, [12, 40, 12, 14, 10]), '风险与到期')

  return saveExcel(writeWorkbook(workbook), `工艺周报-${data.startDate}-${data.endDate}.xlsx`)
}

export interface KnowledgeExportRow {
  title: string
  type: string
  tags: string
  content: string
  sourceIssueCode?: string
  updatedAt: string
}

export async function exportKnowledge(rows: KnowledgeExportRow[]): Promise<FileResult> {
  const workbook = XLSX.utils.book_new()
  const data = [
    ['标题', '类型', '标签', '正文', '关联问题编号', '更新时间'],
    ...rows.map((row) => [
      row.title,
      row.type,
      row.tags,
      row.content,
      row.sourceIssueCode ?? '',
      formatDate(row.updatedAt),
    ]),
  ]
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(data, [30, 12, 24, 60, 18, 12]),
    '知识库',
  )
  return saveExcel(writeWorkbook(workbook), `个人知识库-${today()}.xlsx`)
}

export interface KnowledgeImportRow {
  title: string
  type: KnowledgeType
  tags: string[]
  content: string
  sourceIssueCode?: string
}

function parseKnowledgeType(value: string): KnowledgeType {
  const entry = Object.entries(KNOWLEDGE_TYPE_LABELS).find(([, label]) => label === value)
  if (entry) return entry[0] as KnowledgeType
  if (value.includes('案例')) return 'case'
  if (value.includes('标准') || value.includes('规范')) return 'standard'
  if (value.includes('模板')) return 'template'
  return 'experience'
}

function splitTags(value: string): string[] {
  return value
    .split(/[、,，;；\n]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export async function downloadKnowledgeTemplate(): Promise<FileResult> {
  const workbook = XLSX.utils.book_new()
  const data = [
    ['标题', '类型', '标签', '正文', '关联问题编号'],
    [
      '示例：焊接虚焊排查思路',
      '经验总结',
      '焊接、虚焊、参数',
      '先检查焊接参数，再检查工装定位，最后确认来料可焊性。',
      'Q-20260101-001',
    ],
  ]
  XLSX.utils.book_append_sheet(
    workbook,
    makeSheet(data, [30, 12, 24, 60, 18]),
    '个人知识库',
  )
  return saveExcel(writeWorkbook(workbook), '个人知识库导入模板.xlsx')
}

export async function parseKnowledgeExcel(buffer: ArrayBuffer): Promise<KnowledgeImportRow[]> {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  return rows
    .map((row) => ({
      title: str(row['标题']) || str(row['知识标题']),
      type: parseKnowledgeType(str(row['类型']) || str(row['知识类型'])),
      tags: splitTags(str(row['标签'])),
      content: str(row['正文']) || str(row['内容']),
      sourceIssueCode: str(row['关联问题编号']) || str(row['来源问题编号']),
    }))
    .filter((row) => row.title && row.content)
}

export function knowledgeTypeLabel(value: keyof typeof KNOWLEDGE_TYPE_LABELS): string {
  return KNOWLEDGE_TYPE_LABELS[value]
}
