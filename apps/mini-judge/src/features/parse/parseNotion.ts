export async function parseNotion(notionUrl: string): Promise<string> {
  const res = await fetch(notionUrl, {
    headers: { Accept: 'text/html' },
  })

  if (!res.ok) throw new Error(`Notion 페이지 fetch 실패 (${res.status})`)

  const html = await res.text()
  const doc = new DOMParser().parseFromString(html, 'text/html')

  // Notion public page: extract text from content blocks
  const selectors = [
    '[class*="notion-page-content"]',
    '[class*="notion-text-block"]',
    '[class*="notion-header-block"]',
    '[class*="notion-sub_header-block"]',
    'article',
    'main',
  ]

  for (const sel of selectors) {
    const el = doc.querySelector(sel)
    if (el) {
      const text = el.textContent?.trim()
      if (text && text.length > 50) return text
    }
  }

  // last resort: body text
  const bodyText = doc.body?.textContent?.trim()
  if (bodyText && bodyText.length > 50) return bodyText

  throw new Error('Notion 페이지에서 텍스트를 추출하지 못했습니다')
}
