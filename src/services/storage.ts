import { createEmptyStore, migrateStore } from '../constants'
import type {
  AppInfo,
  ContentBlock,
  ExcelOpenResult,
  FileResult,
  ImportStoreResult,
  NewsFeedItem,
  NewsFetchResult,
  RootCauseCategory,
  SaveResult,
  StoreData,
} from '../types'

const LOCAL_KEY = 'process-workbench:data'
const LOCAL_BACKUP_PREFIX = 'process-workbench:backup:'

export function normalizeStore(input: Partial<StoreData> | null | undefined): StoreData {
  const empty = createEmptyStore()
  if (!input || typeof input !== 'object') return empty
  const raw: StoreData = {
    version: input.version ?? 1,
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    issues: Array.isArray(input.issues)
      ? input.issues.map((issue) => ({
          ...issue,
          batchNo: (issue as { batchNo?: string }).batchNo ?? undefined,
          rootCauseCategory: (issue as { rootCauseCategory?: RootCauseCategory })
            .rootCauseCategory ?? undefined,
        }))
      : [],
    issueLogs: Array.isArray(input.issueLogs) ? input.issueLogs : [],
    documents: Array.isArray(input.documents) ? input.documents : [],
    knowledge: Array.isArray(input.knowledge)
      ? input.knowledge.map((item) => ({
          ...item,
          blocks: Array.isArray((item as { blocks?: ContentBlock[] }).blocks)
            ? (item as { blocks: ContentBlock[] }).blocks
            : [],
        }))
      : [],
    reports: Array.isArray(input.reports) ? input.reports : [],
    newsArticles: Array.isArray(input.newsArticles) ? input.newsArticles : [],
    newsDigests: Array.isArray(input.newsDigests) ? input.newsDigests : [],
    toeflRecords: Array.isArray(input.toeflRecords) ? input.toeflRecords : [],
    settings: { ...empty.settings, ...(input.settings ?? {}) },
  }
  return migrateStore(raw)
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      resolve(input.files?.[0] ?? null)
    }
    input.click()
  })
}

export async function loadStore(): Promise<StoreData> {
  if (window.workbench) {
    return normalizeStore(await window.workbench.loadStore())
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return normalizeStore(raw ? JSON.parse(raw) : null)
  } catch {
    return createEmptyStore()
  }
}

export async function saveStore(data: StoreData): Promise<SaveResult> {
  if (window.workbench) {
    return window.workbench.saveStore(data)
  }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
  return { ok: true }
}

export async function backupStore(): Promise<SaveResult> {
  if (window.workbench) {
    return window.workbench.backupStore()
  }
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return { ok: false, message: '暂无可备份数据' }
    const key = `${LOCAL_BACKUP_PREFIX}${Date.now()}`
    localStorage.setItem(key, raw)
    const keys = Object.keys(localStorage)
      .filter((item) => item.startsWith(LOCAL_BACKUP_PREFIX))
      .sort()
    while (keys.length > 10) {
      const oldest = keys.shift()
      if (oldest) localStorage.removeItem(oldest)
    }
    return { ok: true, path: '浏览器本地存储' }
  } catch {
    return { ok: false, message: '备份失败' }
  }
}

export async function exportStore(): Promise<FileResult> {
  if (window.workbench) {
    return window.workbench.exportStore()
  }
  const data = await loadStore()
  const stamp = new Date().toISOString().slice(0, 10)
  downloadBlob(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    `工艺工作台备份-${stamp}.json`,
  )
  return { canceled: false, path: `工艺工作台备份-${stamp}.json` }
}

export async function importStore(): Promise<ImportStoreResult> {
  if (window.workbench) {
    return window.workbench.importStore()
  }
  const file = await pickFile('.json,application/json')
  if (!file) return { canceled: true }
  const text = await file.text()
  const parsed = JSON.parse(text) as Partial<StoreData>
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.issues)) {
    throw new Error('文件格式不正确，缺少必要的数据结构')
  }
  return { canceled: false, data: normalizeStore(parsed), path: file.name }
}

export async function saveExcel(buffer: ArrayBuffer, defaultName: string): Promise<FileResult> {
  if (window.workbench) {
    return window.workbench.saveExcel(buffer, defaultName)
  }
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    defaultName,
  )
  return { canceled: false, path: defaultName }
}

export async function openExcel(): Promise<ExcelOpenResult> {
  if (window.workbench) {
    return window.workbench.openExcel()
  }
  const file = await pickFile('.xlsx,.xls')
  if (!file) return { canceled: true }
  return { canceled: false, buffer: await file.arrayBuffer(), name: file.name }
}

export async function getAppInfo(): Promise<AppInfo> {
  if (window.workbench) {
    return window.workbench.getAppInfo()
  }
  return {
    dataPath: '浏览器 localStorage',
    backupPath: '浏览器 localStorage',
    userDataPath: '浏览器 localStorage',
    version: '0.1.0',
  }
}

export async function openDataFolder(kind: 'data' | 'backup'): Promise<SaveResult> {
  if (window.workbench) {
    return window.workbench.openDataFolder(kind)
  }
  return { ok: true, path: kind === 'backup' ? '浏览器备份' : '浏览器数据' }
}

export async function fetchNewsFeeds(feedUrls: string[]): Promise<NewsFetchResult> {
  if (window.workbench?.fetchNewsFeeds) {
    return window.workbench.fetchNewsFeeds(feedUrls)
  }

  const items: NewsFeedItem[] = []
  const errors: string[] = []
  for (const url of feedUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const xml = await response.text()
      const doc = new DOMParser().parseFromString(xml, 'text/xml')
      const nodes = Array.from(doc.getElementsByTagName('item'))
      for (const node of nodes) {
        const sourceNode = node.getElementsByTagName('News:Source')[0]
        items.push({
          title: node.getElementsByTagName('title')[0]?.textContent?.trim() ?? '',
          link: node.getElementsByTagName('link')[0]?.textContent?.trim() ?? '',
          summary:
            node.getElementsByTagName('description')[0]?.textContent?.trim() ?? '',
          source: sourceNode?.textContent?.trim() ?? '',
          publishedAt: node.getElementsByTagName('pubDate')[0]?.textContent?.trim() ?? '',
        })
      }
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  return { ok: items.length > 0, items, errors }
}

export async function showNotification(payload: {
  title: string
  body: string
}): Promise<{ ok: boolean }> {
  if (window.workbench?.notify) {
    return window.workbench.notify(payload)
  }
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(payload.title, { body: payload.body })
        return { ok: true }
      }
      if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          new Notification(payload.title, { body: payload.body })
          return { ok: true }
        }
      }
    }
  } catch {
    // 浏览器通知不可用时忽略
  }
  return { ok: false }
}
