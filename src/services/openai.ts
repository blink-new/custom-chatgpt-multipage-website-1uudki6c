interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OpenAIStreamResponse {
  choices: Array<{
    delta: {
      content?: string
    }
  }>
}

export async function streamOpenAIResponse(
  messages: OpenAIMessage[],
  apiKey: string,
  model: string = 'gpt-4o-mini',
  temperature: number = 0.7,
  maxTokens: number = 2000,
  onChunk: (chunk: string) => void
): Promise<void> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to get response from OpenAI')
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('Failed to read response stream')
  }

  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed: OpenAIStreamResponse = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
          } catch (e) {
            // Skip invalid JSON lines
            continue
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}