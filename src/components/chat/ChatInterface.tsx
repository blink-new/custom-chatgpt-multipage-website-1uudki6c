import React, { useState, useEffect, useRef, useCallback } from 'react'
import { blink } from '../../blink/client'
import { groqService, GroqMessage } from '../../services/groq'
import { Message, Conversation, User } from '../../types/chat'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { Button } from '../ui/button'
import { PanelLeftClose, PanelLeft, Plus, Settings } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface ChatInterfaceProps {
  user: User
  onSettingsClick: () => void
}

export function ChatInterface({ user, onSettingsClick }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = useCallback(async () => {
    try {
      const result = await blink.db.conversations.list({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      })
      setConversations(result)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }, [user.id])

  const loadMessages = async (conversationId: string) => {
    try {
      const result = await blink.db.messages.list({
        where: { conversationId },
        orderBy: { createdAt: 'asc' }
      })
      setMessages(result)
    } catch (error) {
      console.error('Failed to load messages:', error)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingMessage])

  const createNewConversation = async () => {
    try {
      const newConversation = await blink.db.conversations.create({
        id: `conv_${Date.now()}`,
        userId: user.id,
        title: 'New Chat',
        model: selectedModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      setConversations(prev => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      setMessages([])
      setStreamingMessage('')
    } catch (error) {
      console.error('Failed to create conversation:', error)
      toast({
        title: 'Error',
        description: 'Failed to create new conversation',
        variant: 'destructive'
      })
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setCurrentConversation(conversation)
    setSelectedModel(conversation.model)
    await loadMessages(conversation.id)
    setStreamingMessage('')
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await blink.db.conversations.delete(conversationId)
      await blink.db.messages.list({
        where: { conversationId }
      }).then(messages => {
        messages.forEach(msg => blink.db.messages.delete(msg.id))
      })
      
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive'
      })
    }
  }

  const checkUsageLimits = (user: User): boolean => {
    const limits = {
      free: { messages: 1000, tokens: 50000 },
      basic: { messages: 10000, tokens: 500000 },
      pro: { messages: 50000, tokens: 2500000 }
    }
    
    const userLimits = limits[user.subscriptionTier]
    
    if (user.messageCount >= userLimits.messages) {
      toast({
        title: 'Message Limit Reached',
        description: `You've reached your monthly limit of ${userLimits.messages} messages. Please upgrade your plan.`,
        variant: 'destructive'
      })
      return false
    }
    
    if (user.tokenCount >= userLimits.tokens) {
      toast({
        title: 'Token Limit Reached',
        description: `You've reached your monthly token limit. Please upgrade your plan.`,
        variant: 'destructive'
      })
      return false
    }
    
    return true
  }

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return
    
    if (!checkUsageLimits(user)) return

    let conversation = currentConversation
    
    // Create new conversation if none exists
    if (!conversation) {
      await createNewConversation()
      conversation = currentConversation
      if (!conversation) return
    }

    try {
      setIsLoading(true)
      setIsStreaming(true)
      setStreamingMessage('')

      // Add user message
      const userMessage = await blink.db.messages.create({
        id: `msg_${Date.now()}_user`,
        conversationId: conversation.id,
        userId: user.id,
        role: 'user',
        content,
        promptTokens: 0,
        completionTokens: 0,
        createdAt: new Date().toISOString()
      })

      setMessages(prev => [...prev, userMessage])

      // Update conversation title if it's the first message
      if (messages.length === 0) {
        const title = content.length > 50 ? content.substring(0, 50) + '...' : content
        await blink.db.conversations.update(conversation.id, { 
          title,
          updatedAt: new Date().toISOString()
        })
        setConversations(prev => 
          prev.map(c => c.id === conversation.id ? { ...c, title } : c)
        )
      }

      // Prepare messages for AI
      const allMessages = [...messages, userMessage]
      const groqMessages = allMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }))

      // Stream AI response
      let fullResponse = ''
      const usage = await groqService.streamChat(
        groqMessages,
        (chunk) => {
          fullResponse += chunk
          setStreamingMessage(fullResponse)
        },
        selectedModel
      )

      // Save AI message
      const aiMessage = await blink.db.messages.create({
        id: `msg_${Date.now()}_ai`,
        conversationId: conversation.id,
        userId: user.id,
        role: 'assistant',
        content: fullResponse,
        promptTokens: usage.usage.prompt_tokens,
        completionTokens: usage.usage.completion_tokens,
        createdAt: new Date().toISOString()
      })

      setMessages(prev => [...prev, aiMessage])
      setStreamingMessage('')

      // Update user usage
      await blink.db.users.update(user.id, {
        messageCount: user.messageCount + 1,
        tokenCount: user.tokenCount + usage.usage.total_tokens,
        updatedAt: new Date().toISOString()
      })

      // Log usage
      await blink.db.usageLogs.create({
        id: `usage_${Date.now()}`,
        userId: user.id,
        messageId: aiMessage.id,
        tokensUsed: usage.usage.total_tokens,
        costEstimate: (usage.usage.total_tokens / 1000000) * 0.6, // $0.60 per million tokens
        createdAt: new Date().toISOString()
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      })
      setStreamingMessage('')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  const regenerateMessage = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId)
    if (messageIndex === -1 || messageIndex === 0) return

    const userMessage = messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    // Remove the AI message and regenerate
    const updatedMessages = messages.slice(0, messageIndex)
    setMessages(updatedMessages)

    await sendMessage(userMessage.content)
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden`}>
        <ChatSidebar
          conversations={conversations}
          currentConversation={currentConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          onNewChat={createNewConversation}
          user={user}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
            </Button>
            
            {!currentConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewConversation}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                New Chat
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              {groqService.getAvailableModels().map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
            >
              <Settings size={20} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation && messages.length === 0 && !streamingMessage && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 bg-[#10a37f] rounded-full flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">AI</span>
              </div>
              <h2 className="text-2xl font-semibold mb-2">How can I help you today?</h2>
              <p className="text-gray-600 mb-8">Start a conversation with our AI assistant</p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onRegenerate={message.role === 'assistant' ? () => regenerateMessage(message.id) : undefined}
            />
          ))}

          {streamingMessage && (
            <ChatMessage
              message={{
                id: 'streaming',
                conversationId: currentConversation?.id || '',
                userId: user.id,
                role: 'assistant',
                content: streamingMessage,
                promptTokens: 0,
                completionTokens: 0,
                createdAt: new Date().toISOString()
              }}
              isStreaming={true}
            />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isStreaming}
            placeholder="Message ChatGPT..."
          />
        </div>
      </div>
    </div>
  )
}