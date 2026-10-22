import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)
dayjs.locale('zh-cn')

export const DATE_FORMAT = 'YYYY-MM-DD'

export function today(): string {
  return dayjs().format(DATE_FORMAT)
}

export function formatDate(value?: string): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : value
}

export function formatDateTime(value?: string): string {
  if (!value) return '-'
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm') : value
}

export function daysUntil(value?: string): number | null {
  if (!value) return null
  const parsed = dayjs(value).startOf('day')
  if (!parsed.isValid()) return null
  return parsed.diff(dayjs().startOf('day'), 'day')
}

export function isOverdue(value?: string): boolean {
  const days = daysUntil(value)
  return days !== null && days < 0
}

export function isDueToday(value?: string): boolean {
  return daysUntil(value) === 0
}

export function isDueSoon(value?: string, days = 3): boolean {
  const remaining = daysUntil(value)
  return remaining !== null && remaining >= 0 && remaining <= days
}

export function isWithinDays(value: string | undefined, days: number): boolean {
  const remaining = daysUntil(value)
  return remaining !== null && remaining >= 0 && remaining <= days
}

export function dueLabel(value?: string): string {
  const remaining = daysUntil(value)
  if (remaining === null) return '无截止日'
  if (remaining < 0) return `逾期 ${Math.abs(remaining)} 天`
  if (remaining === 0) return '今天到期'
  if (remaining === 1) return '明天到期'
  return `${remaining} 天后到期`
}

export function currentWeekRange(): [string, string] {
  const start = dayjs().startOf('isoWeek')
  const end = dayjs().endOf('isoWeek')
  return [start.format(DATE_FORMAT), end.format(DATE_FORMAT)]
}

export function isInRange(value: string | undefined, start: string, end: string): boolean {
  if (!value) return false
  const date = dayjs(value)
  if (!date.isValid()) return false
  return (
    (date.isAfter(dayjs(start).startOf('day')) || date.isSame(dayjs(start).startOf('day'))) &&
    (date.isBefore(dayjs(end).endOf('day')) || date.isSame(dayjs(end).endOf('day')))
  )
}

export function weekdayLabel(): string {
  return dayjs().format('dddd')
}

export function monthLabel(): string {
  return dayjs().format('YYYY年M月')
}
