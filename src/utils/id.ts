import dayjs from 'dayjs'

export function uid(prefix = 'id'): string {
  const cryptoApi = globalThis.crypto
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}_${cryptoApi.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function nextIssueCode(existingCodes: string[]): string {
  const prefix = `Q-${dayjs().format('YYYYMMDD')}-`
  const numbers = existingCodes
    .filter((code) => code.startsWith(prefix))
    .map((code) => Number.parseInt(code.slice(prefix.length), 10))
    .filter((value) => Number.isFinite(value))
  const next = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  return `${prefix}${String(next).padStart(3, '0')}`
}
