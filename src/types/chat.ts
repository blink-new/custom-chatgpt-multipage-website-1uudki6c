export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  conversationId: string
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  userId: string
  messageCount: number
}

export interface ApiSettings {
  id: string
  userId: string
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
}