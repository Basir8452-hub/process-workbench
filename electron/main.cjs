const { app, BrowserWindow, ipcMain, dialog, shell, Notification, safeStorage } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const fsp = fs.promises

const isDev = !app.isPackaged
let mainWindow = null

const defaultStore = {
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
  settings: {},
}

function getDataFile() {
  return path.join(app.getPath('userData'), 'workbench-data.json')
}

function getBackupDir() {
  return path.join(app.getPath('userData'), 'backups')
}

function dateKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function stamp(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${dateKey(date)}-${hh}${mm}${ss}`
}

async function ensureDir(dir) {
  await fsp.mkdir(dir, { recursive: true })
}

async function readStore() {
  const file = getDataFile()
  try {
    const raw = await fsp.readFile(file, 'utf8')
    const parsed = JSON.parse(raw)
    return { ...defaultStore, ...parsed }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('读取数据失败:', error)
      const corrupt = `${file}.corrupt-${stamp()}`
      try {
        await fsp.copyFile(file, corrupt)
      } catch (_) {}
    }
    return { ...defaultStore }
  }
}

async function dailyBackup() {
  const file = getDataFile()
  if (!fs.existsSync(file)) return
  const dir = getBackupDir()
  await ensureDir(dir)
  const target = path.join(dir, `workbench-${dateKey()}.json`)
  if (!fs.existsSync(target)) {
    await fsp.copyFile(file, target)
  }
  const files = (await fsp.readdir(dir))
    .filter((name) => name.startsWith('workbench-') && name.endsWith('.json'))
    .sort()
  while (files.length > 30) {
    const old = files.shift()
    await fsp.unlink(path.join(dir, old)).catch(() => {})
  }
}

async function writeStore(data) {
  const file = getDataFile()
  await ensureDir(path.dirname(file))
  await dailyBackup()
  const temp = `${file}.tmp`
  await fsp.writeFile(temp, JSON.stringify(data, null, 2), 'utf8')
  await fsp.rename(temp, file)
  return { ok: true, path: file }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 700,
    title: '工艺工作台',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    backgroundColor: '#f4f6fb',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
}

ipcMain.handle('store:load', async () => readStore())

ipcMain.handle('store:save', async (_event, data) => writeStore(data))

ipcMain.handle('store:backup', async () => {
  const file = getDataFile()
  if (!fs.existsSync(file)) return { ok: false, message: '暂无可备份数据' }
  const dir = getBackupDir()
  await ensureDir(dir)
  const target = path.join(dir, `workbench-${stamp()}.json`)
  await fsp.copyFile(file, target)
  return { ok: true, path: target }
})

ipcMain.handle('store:export', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出工作台数据',
    defaultPath: `工艺工作台备份-${dateKey()}.json`,
    filters: [{ name: 'JSON 数据', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePath) return { canceled: true }
  const data = await readStore()
  await fsp.writeFile(result.filePath, JSON.stringify(data, null, 2), 'utf8')
  return { canceled: false, path: result.filePath }
})

ipcMain.handle('store:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '导入工作台数据',
    properties: ['openFile'],
    filters: [{ name: 'JSON 数据', extensions: ['json'] }],
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  const raw = await fsp.readFile(result.filePaths[0], 'utf8')
  const data = JSON.parse(raw)
  if (!data || typeof data !== 'object' || !Array.isArray(data.issues)) {
    throw new Error('文件格式不正确，缺少必要的数据结构')
  }
  return { canceled: false, data: { ...defaultStore, ...data }, path: result.filePaths[0] }
})

ipcMain.handle('excel:save', async (_event, buffer, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '导出 Excel',
    defaultPath: defaultName || `导出-${dateKey()}.xlsx`,
    filters: [{ name: 'Excel 工作簿', extensions: ['xlsx'] }],
  })
  if (result.canceled || !result.filePath) return { canceled: true }
  await fsp.writeFile(result.filePath, Buffer.from(buffer))
  return { canceled: false, path: result.filePath }
})

ipcMain.handle('excel:open', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 Excel 文件',
    properties: ['openFile'],
    filters: [{ name: 'Excel 工作簿', extensions: ['xlsx', 'xls'] }],
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  const buffer = await fsp.readFile(result.filePaths[0])
  return {
    canceled: false,
    buffer,
    name: path.basename(result.filePaths[0]),
  }
})

ipcMain.handle('app:info', async () => ({
  dataPath: getDataFile(),
  backupPath: getBackupDir(),
  userDataPath: app.getPath('userData'),
  version: app.getVersion(),
}))

ipcMain.handle('app:open-folder', async (_event, kind) => {
  const target = kind === 'backup' ? getBackupDir() : app.getPath('userData')
  await ensureDir(target)
  await shell.openPath(target)
  return { ok: true, path: target }
})

function buildChatEndpoint(baseUrl) {
  const trimmed = String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
}

/** 用系统凭据库（safeStorage）加密 API Key，返回 base64 密文；不可用时返回 null */
function encryptSecret(plain) {
  const value = String(plain || '')
  if (!value) return null
  try {
    if (!safeStorage.isEncryptionAvailable()) return null
    return safeStorage.encryptString(value).toString('base64')
  } catch (_) {
    return null
  }
}

/** 解密 safeStorage 密文；不可用时返回 null */
function decryptSecret(encoded) {
  if (!encoded) return null
  try {
    if (!safeStorage.isEncryptionAvailable()) return null
    return safeStorage.decryptString(Buffer.from(String(encoded), 'base64'))
  } catch (_) {
    return null
  }
}

ipcMain.handle('ai:encrypt-key', async (_event, plain) => encryptSecret(plain))

ipcMain.handle('ai:decrypt-key', async (_event, encoded) => decryptSecret(encoded))

ipcMain.handle('ai:chat', async (_event, request) => {
  let baseUrl = String(request?.baseUrl || '').trim()
  // apiKey 优先按 safeStorage 密文解密；解不开（留空/旧明文/本地模型）则原样使用
  const apiKey = decryptSecret(request?.apiKey) ?? String(request?.apiKey || '').trim()
  const model = String(request?.model || '').trim()
  const messages = Array.isArray(request?.messages) ? request.messages : []

  if (!baseUrl || !model) {
    return { ok: false, error: '请先在设置中填写 AI 接口地址和模型名称' }
  }
  if (messages.length === 0) {
    return { ok: false, error: '消息不能为空' }
  }
  if (!/^https?:\/\//i.test(baseUrl)) {
    baseUrl = `https://${baseUrl}`
  }

  const endpoint = buildChatEndpoint(baseUrl)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 90000)

  try {
    const headers = { 'Content-Type': 'application/json' }
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: messages.map((item) => ({
          role: item.role,
          content: String(item.content ?? ''),
        })),
        temperature: typeof request?.temperature === 'number' ? request.temperature : 0.3,
        stream: false,
      }),
      signal: controller.signal,
    })

    const text = await response.text()
    if (!response.ok) {
      return { ok: false, error: `接口返回 ${response.status}：${text.slice(0, 300)}` }
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (_) {
      return { ok: false, error: '接口返回的不是有效 JSON，请检查接口地址' }
    }

    let content = data?.choices?.[0]?.message?.content
    if (Array.isArray(content)) {
      content = content
        .map((part) => (typeof part === 'string' ? part : part?.text ?? ''))
        .join('')
    }
    if (!content || typeof content !== 'string') {
      return { ok: false, error: '接口返回内容为空，请检查模型名称或接口地址' }
    }

    return { ok: true, content }
  } catch (error) {
    const text =
      error?.name === 'AbortError'
        ? '请求超时（90 秒），请检查网络或接口地址'
        : `请求失败：${error?.message ?? error}`
    return { ok: false, error: text }
  } finally {
    clearTimeout(timer)
  }
})

function decodeXml(text) {
  return String(text || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractTag(xml, tag) {
  const regex = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = String(xml).match(regex)
  return match ? decodeXml(match[1]) : ''
}

function resolveNewsLink(link) {
  try {
    const url = new URL(link)
    if (url.hostname.includes('bing.com') && url.pathname.includes('/news/apiclick.aspx')) {
      const target = url.searchParams.get('url')
      if (target) return target
    }
    return link
  } catch (_) {
    return link
  }
}

function parseRssItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml))) {
    const raw = match[1]
    const title = extractTag(raw, 'title')
    const link = resolveNewsLink(extractTag(raw, 'link'))
    if (!title) continue
    items.push({
      title,
      link,
      summary: extractTag(raw, 'description').slice(0, 600),
      source: extractTag(raw, 'News:Source') || extractTag(raw, 'source') || '未知来源',
      publishedAt: extractTag(raw, 'pubDate'),
    })
  }
  return items
}

ipcMain.handle('news:fetch', async (_event, feedUrls) => {
  const urls = Array.isArray(feedUrls) ? feedUrls.filter(Boolean) : []
  const items = []
  const errors = []
  const seen = new Set()

  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(20000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const xml = await response.text()
        for (const item of parseRssItems(xml)) {
          const key = `${item.title.trim().toLowerCase()}|${item.link}`
          if (seen.has(key)) continue
          seen.add(key)
          items.push(item)
        }
      } catch (error) {
        errors.push(`${url}: ${error?.message ?? error}`)
      }
    }),
  )

  return { ok: items.length > 0, items, errors }
})

ipcMain.handle('app:notify', async (_event, payload) => {
  if (!Notification.isSupported()) return { ok: false }
  try {
    new Notification({
      title: String(payload?.title || '工艺工作台'),
      body: String(payload?.body || ''),
    }).show()
    return { ok: true }
  } catch (_) {
    return { ok: false }
  }
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
