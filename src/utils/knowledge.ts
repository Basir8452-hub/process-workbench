import type { ContentBlock } from '../types'

/** 内容块 → 纯文本（Excel 导入导出、摘要、案例沉淀时使用） */
export function blocksToText(blocks: ContentBlock[] | undefined): string {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .map((block) => {
      if (block.type === 'text') return block.text
      if (block.type === 'image') return '[图片]'
      if (block.type === 'table') {
        const header = block.headers.join(' | ')
        const body = block.rows.map((row) => row.join(' | ')).join('\n')
        return `${header}${body ? `\n${body}` : ''}`
      }
      return ''
    })
    .filter((text) => text.trim())
    .join('\n\n')
}

/** 内容块 → 纯文本摘要（卡片预览） */
export function blocksToExcerpt(blocks: ContentBlock[] | undefined, max = 120): string {
  const text = blocksToText(blocks).replace(/\s+/g, ' ').trim()
  if (!text) return ''
  return text.length > max ? `${text.slice(0, max)}…` : text
}
