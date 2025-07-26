export interface User {
  id: string
  email: string
  subscriptionTier: 'free' | 'basic' | 'pro'
  messageCount: number
  tokenCount: number
  createdAt: string
  updatedAt: string
}

export interface Conversation {
  id: string
  userId: string
  title: string
  model: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  userId: string
  role: 'user' | 'assistant'
  content: string
  promptTokens: number
  completionTokens: number
  createdAt: string
}

export interface UsageLog {
  id: string
  userId: string
  messageId?: string
  tokensUsed: number
  costEstimate: number
  createdAt: string
}

export interface SubscriptionTier {
  id: 'free' | 'basic' | 'pro'
  name: string
  price: number
  messagesPerMonth: number
  tokensPerMonth: number
  features: string[]
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    messagesPerMonth: 1000,
    tokensPerMonth: 50000,
    features: [
      '1,000 messages per month',
      'Basic AI responses',
      'Limited chat history',
      'Community support'
    ]
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 10,
    messagesPerMonth: 10000,
    tokensPerMonth: 500000,
    features: [
      '10,000 messages per month',
      'All AI models',
      'Full chat history',
      'Priority support',
      'Export conversations'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 50,
    messagesPerMonth: 50000,
    tokensPerMonth: 2500000,
    features: [
      '50,000 messages per month',
      'All AI models',
      'Unlimited chat history',
      'Priority support',
      'Export conversations',
      'Custom system prompts',
      'Advanced settings'
    ]
  }
]