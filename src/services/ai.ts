import type { AiChatRequest, AiChatResult } from '../types'

function buildEndpoint(baseUrl: string): string {
  let trimmed = baseUrl.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(trimmed)) trimmed = `https://${trimmed}`
  if (/\/chat\/completions$/i.test(trimmed)) return trimmed
  return `${trimmed}/chat/completions`
}

export async function chatWithAI(request: AiChatRequest): Promise<AiChatResult> {
  if (window.workbench?.aiChat) {
    return window.workbench.aiChat(request)
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (request.apiKey?.trim()) {
      headers.Authorization = `Bearer ${request.apiKey.trim()}`
    }
    const controller = new AbortController()
    const timer = window.setTimeout(() => controller.abort(), 90000)
    try {
      const response = await fetch(buildEndpoint(request.baseUrl), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.3,
          stream: false,
        }),
        signal: controller.signal,
      })
      const text = await response.text()
      if (!response.ok) {
        return { ok: false, error: `接口返回 ${response.status}：${text.slice(0, 300)}` }
      }
      const data = JSON.parse(text)
      const content = data?.choices?.[0]?.message?.content
      if (typeof content !== 'string' || !content) {
        return { ok: false, error: '接口返回内容为空，请检查模型名称或接口地址' }
      }
      return { ok: true, content }
    } finally {
      window.clearTimeout(timer)
    }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? '请求超时（90 秒），请检查网络或接口地址'
        : `请求失败：${error instanceof Error ? error.message : String(error)}`
    return { ok: false, error: message }
  }
}
