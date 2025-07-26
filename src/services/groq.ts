import { blink } from '../blink/client'

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface StreamChunk {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string
  }>
}

export class GroqService {
  private readonly baseUrl = 'https://api.groq.com/openai/v1'
  private readonly systemPrompt = `You are a helpful, multilingual assistant powered by Groq's Llama 3.3 70B. Provide concise, accurate responses for general queries, coding assistance, and reasoning tasks. Support 8 languages (English, German, French, Italian, Portuguese, Hindi, Spanish, Thai). Use JSON mode for structured outputs when requested.`

  async chat(
    messages: GroqMessage[],
    model: string = 'llama-3.3-70b-versatile',
    temperature: number = 0.6,
    maxTokens: number = 2048
  ): Promise<GroqResponse> {
    try {
      const response = await blink.data.fetch({
        url: `${this.baseUrl}/chat/completions`,
        method: 'POST',
        headers: {
          'Authorization': 'Bearer {{GROQ_API_KEY}}',
          'Content-Type': 'application/json'
        },
        body: {
          model,
          messages: [
            { role: 'system', content: this.systemPrompt },
            ...messages
          ],
          temperature,
          max_tokens: maxTokens,
          stream: false
        }
      })

      if (response.status !== 200) {
        throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(response.body)}`)
      }

      return response.body as GroqResponse
    } catch (error) {
      console.error('Groq API error:', error)
      throw new Error('Failed to get response from AI. Please try again.')
    }
  }

  async streamChat(
    messages: GroqMessage[],
    onChunk: (chunk: string) => void,
    model: string = 'llama-3.3-70b-versatile',
    temperature: number = 0.6,
    maxTokens: number = 2048
  ): Promise<{ usage: { prompt_tokens: number; completion_tokens: number } }> {
    try {
      // For now, we'll simulate streaming by using the regular API and chunking the response
      const response = await this.chat(messages, model, temperature, maxTokens)
      const content = response.choices[0]?.message?.content || ''
      
      // Simulate streaming by sending chunks
      const words = content.split(' ')
      for (let i = 0; i < words.length; i++) {
        const chunk = i === 0 ? words[i] : ' ' + words[i]
        onChunk(chunk)
        // Small delay to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      return {
        usage: {
          prompt_tokens: response.usage.prompt_tokens,
          completion_tokens: response.usage.completion_tokens
        }
      }
    } catch (error) {
      console.error('Groq streaming error:', error)
      throw error
    }
  }

  getAvailableModels() {
    return [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        description: 'Most capable model with 128K context'
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        description: 'Faster responses, good for simple queries'
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        description: 'Good balance of speed and capability'
      }
    ]
  }
}

export const groqService = new GroqService()