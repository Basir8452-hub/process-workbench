import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isoWeek from 'dayjs/plugin/isoWeek'
import {
  WEEKLY_MAIL_CC,
  WEEKLY_MAIL_SUBJECT_TEMPLATE,
  WEEKLY_MAIL_TO,
} from '../constants'
import type { DailyReport, WeeklyReport } from '../types'
import { DATE_FORMAT } from './date'

dayjs.extend(isoWeek)
dayjs.locale('zh-cn')

export interface ReportIdentity {
  ownerName?: string
  department?: string
}

/** 日报表（飞书）日期格式：YYYY/M/D */
export function tableDate(value?: string): string {
  const parsed = dayjs(value)
  return parsed.isValid() ? `${parsed.year()}/${parsed.month() + 1}/${parsed.date()}` : value ?? ''
}

/** ISO 周数 */
export function isoWeekNumber(value?: string): number {
  const parsed = value ? dayjs(value) : dayjs()
  return (parsed.isValid() ? parsed : dayjs()).isoWeek()
}

export function identityLabel(identity: ReportIdentity): string {
  const name = identity.ownerName?.trim() || '未设置姓名'
  const department = identity.department?.trim()
  return department ? `${name}（${department}）` : name
}

/** 多行文本压成单行（用「；」连接）便于粘贴进表格单元格 */
function oneLine(value?: string): string {
  const text = (value ?? '').replace(/\r\n/g, '\n').trim()
  if (!text) return ''
  return text
    .split('\n')
    .map((line) => line.trim().replace(/[；;]\s*$/, ''))
    .filter(Boolean)
    .join('；')
}

function block(value?: string): string {
  return (value ?? '').replace(/\r\n/g, '\n').trim() || '（无）'
}

/** 日报复制内容：制表符分隔的一行，粘贴进飞书表格可直接分列 */
export function buildDailyCopyText(report: DailyReport): string {
  return [
    tableDate(report.date),
    oneLine(report.highlights),
    oneLine(report.nextPlan),
    oneLine(report.support),
  ].join('\t')
}

/** 日报导出（Markdown / 纯文本共用） */
export function buildDailyText(report: DailyReport, identity: ReportIdentity): string {
  const owner = identity.ownerName?.trim()
  const department = identity.department?.trim()
  return [
    `# 日报 ${tableDate(report.date)}`,
    '',
    owner ? `姓名：${owner}` : '',
    department ? `部门：${department}` : '',
    '',
    '## 今日工作重点',
    block(report.highlights),
    '',
    '## 明日工作计划',
    block(report.nextPlan),
    '',
    '## 需要支持',
    block(report.support),
    '',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

export interface WeeklyMail {
  subject: string
  to: string[]
  cc: string[]
  body: string
}

/** 周报邮件：主题 + 收件人 + 正文（对齐固定口径） */
export function buildWeeklyMail(report: WeeklyReport, identity: ReportIdentity): WeeklyMail {
  const anchor = report.endDate || report.startDate
  const subject = WEEKLY_MAIL_SUBJECT_TEMPLATE.replace('{week}', String(isoWeekNumber(anchor))).replace(
    '{date}',
    dayjs(anchor).isValid() ? dayjs(anchor).format('YYYYMMDD') : '',
  )
  const owner = identity.ownerName?.trim()
  const department = identity.department?.trim()
  const body = [
    '各位领导、同事：',
    '',
    `以下为本周（${report.startDate} 至 ${report.endDate}）工作进展：`,
    '',
    '一、本周工作重点',
    block(report.highlights),
    '',
    '二、下周工作计划',
    block(report.nextPlan),
    '',
    owner || '',
    department || '',
    dayjs().format(DATE_FORMAT),
    '',
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return { subject, to: [...WEEKLY_MAIL_TO], cc: [...WEEKLY_MAIL_CC], body }
}

/** 周报复制内容：含主题与 To/CC 的完整邮件文本 */
export function buildWeeklyCopyText(mail: WeeklyMail): string {
  return [
    `To: ${mail.to.join('; ')}`,
    `Cc: ${mail.cc.join('; ')}`,
    `Subject: ${mail.subject}`,
    '',
    mail.body,
  ].join('\n')
}

function base64Utf8(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

/** 周报导出（.eml，可直接用 Outlook 打开） */
export function buildWeeklyEml(mail: WeeklyMail): string {
  return [
    `To: ${mail.to.join('; ')}`,
    `Cc: ${mail.cc.join('; ')}`,
    `Subject: =?UTF-8?B?${base64Utf8(mail.subject)}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    mail.body,
  ].join('\r\n')
}
