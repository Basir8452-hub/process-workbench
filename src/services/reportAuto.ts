import dayjs from 'dayjs'
import type { DailyReportDraft, ID, Priority, StoreData, Task } from '../types'
import { DATE_FORMAT, isWithinDays } from '../utils/date'

/** 自动提取的待办候选项（来自日报「明日工作计划」/ 周报「下周工作计划」） */
export interface TaskCandidate {
  /** 归一化标题，用于去重与忽略 */
  key: string
  title: string
  source: 'daily' | 'weekly'
  sourceLabel: string
  sourceDate: string
  dueDate?: string
  priority: Priority
}

/** 建议标记完成的任务 */
export interface CompletionSuggestion {
  taskId: ID
  task: Task
  reason: string
}

/** 自动提取时间窗口：最近 30 天的日报 + 最近 8 份周报 */
const DAILY_WINDOW_DAYS = 30
const WEEKLY_LIMIT = 8
const MAX_CANDIDATES = 20
const MIN_TITLE_LENGTH = 4
const MAX_TITLE_LENGTH = 80

const BULLET_PREFIX =
  /^\s*(?:[-*•·—>]|\(?\d+[).、]|[（(]?[一二三四五六七八九十]+[）).、]|[a-zA-Z][).])\s*/

/** 归一化标题：去空白与标点、转小写，用于去重匹配 */
export function normalizeTitle(title: string): string {
  return title
    .replace(/[\s　]+/g, '')
    .replace(/[。；;，,、.:：\-—()（）\[\]【】“”"'']/g, '')
    .toLowerCase()
}

/** 把计划文本拆成条目：按换行与分号切分，去掉序号与首尾标点 */
export function splitPlanItems(text?: string): string[] {
  if (!text) return []
  return text
    .replace(/\r\n?/g, '\n')
    .split(/[\n；;]+/)
    .map((raw) => raw.replace(/^[\s　]*/, '').replace(BULLET_PREFIX, '').trim())
    .map((item) => item.replace(/^[。；;，,、]+/, '').replace(/[。；;，,、\s]+$/, '').trim())
    .filter((item) => {
      if (item.length < MIN_TITLE_LENGTH || item.length > MAX_TITLE_LENGTH) return false
      return /[\u4e00-\u9fa5A-Za-z0-9]/.test(item)
    })
}

/** 从日报/周报的计划字段提取待确认待办 */
export function extractTaskCandidates(store: StoreData): TaskCandidate[] {
  const dismissed = new Set((store.settings.dismissedTaskSuggestions ?? []).map(normalizeTitle))
  const existing = new Set(store.tasks.map((task) => normalizeTitle(task.title)))
  const seen = new Set<string>()
  const candidates: TaskCandidate[] = []

  const push = (candidate: TaskCandidate) => {
    if (seen.has(candidate.key) || existing.has(candidate.key) || dismissed.has(candidate.key)) return
    if (candidates.length >= MAX_CANDIDATES) return
    seen.add(candidate.key)
    candidates.push(candidate)
  }

  const since = dayjs().subtract(DAILY_WINDOW_DAYS, 'day').startOf('day')
  const dailyReports = [...store.dailyReports].sort((a, b) => (a.date < b.date ? 1 : -1))
  dailyReports.forEach((report) => {
    const date = dayjs(report.date)
    if (!date.isValid() || date.isBefore(since)) return
    splitPlanItems(report.nextPlan).forEach((title) => {
      push({
        key: normalizeTitle(title),
        title,
        source: 'daily',
        sourceLabel: `${report.date} 日报 · 明日工作计划`,
        sourceDate: report.date,
        dueDate: date.add(1, 'day').format(DATE_FORMAT),
        priority: 'medium',
      })
    })
  })

  const weeklyReports = [...store.reports]
    .sort((a, b) => (a.endDate < b.endDate ? 1 : -1))
    .slice(0, WEEKLY_LIMIT)
  weeklyReports.forEach((report) => {
    splitPlanItems(report.nextPlan).forEach((title) => {
      push({
        key: normalizeTitle(title),
        title,
        source: 'weekly',
        sourceLabel: `${report.startDate} ~ ${report.endDate} 周报 · 下周工作计划`,
        sourceDate: report.endDate,
        dueDate: dayjs(report.endDate).isValid()
          ? dayjs(report.endDate).add(7, 'day').format(DATE_FORMAT)
          : undefined,
        priority: 'medium',
      })
    })
  })

  return candidates
}

/** 报告进展中已经体现的未完成待办 → 建议标记完成 */
export function suggestCompletions(store: StoreData): CompletionSuggestion[] {
  const records = [
    ...store.dailyReports.map((report) => ({
      date: report.date,
      highlights: report.highlights,
      label: `${report.date} 日报`,
    })),
    ...store.reports.map((report) => ({
      date: report.endDate,
      highlights: report.highlights,
      label: `${report.startDate} ~ ${report.endDate} 周报`,
    })),
  ]
    .filter((record) => normalizeTitle(record.highlights).length > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return store.tasks
    .filter((task) => !task.done)
    .flatMap((task) => {
      const key = normalizeTitle(task.title)
      if (key.length < MIN_TITLE_LENGTH) return []
      const createdDate = (task.createdAt ?? '').slice(0, 10)
      const hit = records.find(
        (record) => normalizeTitle(record.highlights).includes(key) && (!createdDate || record.date >= createdDate),
      )
      return hit ? [{ taskId: task.id, task, reason: `进展已在「${hit.label}」中体现` }] : []
    })
}

/** 按当日记录自动汇总日报初稿 */
export function summarizeDailyDraft(store: StoreData, date: string): DailyReportDraft {
  const target = dayjs(date).isValid() ? dayjs(date) : dayjs()
  const dayKey = target.format(DATE_FORMAT)
  const onDay = (value?: string) => !!value && dayjs(value).isValid() && dayjs(value).format(DATE_FORMAT) === dayKey

  const highlights: string[] = []
  store.tasks.forEach((task) => {
    if (task.done && onDay(task.completedAt)) highlights.push(`完成待办：${task.title}`)
    else if (!task.done && task.progress && onDay(task.progressAt)) {
      highlights.push(`推进待办：${task.title}（${task.progress}）`)
    }
  })
  store.issues.forEach((issue) => {
    if (onDay(issue.closedDate)) highlights.push(`关闭问题：${issue.code} ${issue.title}`)
    else if (onDay(issue.foundDate)) highlights.push(`新增问题：${issue.code} ${issue.title}`)
  })
  store.issueLogs.forEach((log) => {
    if (!onDay(log.date)) return
    const issue = store.issues.find((item) => item.id === log.issueId)
    highlights.push(`问题推进：${issue ? `${issue.code} ` : ''}${log.action}`)
  })

  const nextPlan: string[] = []
  store.tasks.forEach((task) => {
    if (task.done) return
    if (task.dueDate && isWithinDays(task.dueDate, 1)) {
      nextPlan.push(`处理待办：${task.title}（${task.dueDate} 到期）`)
    }
  })
  store.issues.forEach((issue) => {
    if (issue.status === 'closed' || issue.status === 'onhold') return
    if (issue.dueDate && isWithinDays(issue.dueDate, 3)) {
      nextPlan.push(`推进问题：${issue.code} ${issue.title}（${issue.dueDate} 到期）`)
    }
  })

  return {
    date: dayKey,
    highlights: highlights.join('；'),
    nextPlan: nextPlan.join('；'),
    support: '',
  }
}
