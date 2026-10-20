function cleanInline(text: string): string {
  return text.replace(/\*\*/g, '').replace(/`/g, '').trim()
}

export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  const lines = String(text || '').split('\n')

  return (
    <div className={className}>
      {lines.map((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={index} className="md-gap" />
        if (/^#{1,4}\s+/.test(trimmed)) {
          return (
            <div key={index} className="md-heading">
              {cleanInline(trimmed.replace(/^#{1,4}\s+/, ''))}
            </div>
          )
        }
        if (/^[-*]\s+/.test(trimmed)) {
          return (
            <div key={index} className="md-bullet">
              • {cleanInline(trimmed.replace(/^[-*]\s+/, ''))}
            </div>
          )
        }
        if (/^\d+[.)]\s+/.test(trimmed)) {
          return (
            <div key={index} className="md-bullet">
              {cleanInline(trimmed)}
            </div>
          )
        }
        return (
          <div key={index} className="md-line">
            {cleanInline(trimmed)}
          </div>
        )
      })}
    </div>
  )
}
