export async function* streamAIResponse(
  url: string,
  body: unknown
): AsyncGenerator<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'AI request failed')
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('No response body')

  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') return
        try {
          const parsed = JSON.parse(data)
          if (parsed.content) yield parsed.content
        } catch {
          // skip malformed chunks
        }
      }
    }
  }
}
