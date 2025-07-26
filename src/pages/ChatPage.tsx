import React, { useState, useEffect, useRef } from 'react'
import { ChatMessage } from '../components/chat/ChatMessage'
import { ChatInput } from '../components/chat/ChatInput'
import { ChatSidebar } from '../components/chat/ChatSidebar'
import { ScrollArea } from '../components/ui/scroll-area'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Settings } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { blink } from '../blink/client'
import { Message, Conversation, ApiSettings } from '../types/chat'
import { toast } from '../hooks/use-toast'

export function ChatPage() {
  const location = useLocation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string>()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [apiSettings, setApiSettings] = useState<ApiSettings | null>(null)
  const [user, setUser] = useState(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Handle conversation from history page
  useEffect(() => {
    if (location.state?.conversationId) {
      setCurrentConversationId(location.state.conversationId)
    }
  }, [location.state])

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Load API settings and conversations
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        // Load API settings
        const settings = await blink.db.apiSettings.list({
          where: { userId: user.id },
          limit: 1
        })
        if (settings.length > 0) {
          setApiSettings(settings[0])
        }

        // Load conversations
        const convs = await blink.db.conversations.list({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' }
        })
        setConversations(convs)

        // Load messages for current conversation
        if (currentConversationId) {
          const msgs = await blink.db.messages.list({
            where: { conversationId: currentConversationId },
            orderBy: { timestamp: 'asc' }
          })
          setMessages(msgs)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [user?.id, currentConversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const createNewConversation = async () => {
    if (!user?.id) return

    try {
      const newConversation = await blink.db.conversations.create({
        id: `conv_${Date.now()}`,
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user.id,
        messageCount: 0
      })

      setConversations(prev => [newConversation, ...prev])
      setCurrentConversationId(newConversation.id)
      setMessages([])
    } catch (error) {
      console.error('Error creating conversation:', error)
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      })
    }
  }

  const selectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId)
    try {
      const msgs = await blink.db.messages.list({
        where: { conversationId },
        orderBy: { timestamp: 'asc' }
      })
      setMessages(msgs)
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      // Delete all messages in the conversation
      const msgs = await blink.db.messages.list({
        where: { conversationId }
      })
      for (const msg of msgs) {
        await blink.db.messages.delete(msg.id)
      }

      // Delete the conversation
      await blink.db.conversations.delete(conversationId)

      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (currentConversationId === conversationId) {
        setCurrentConversationId(undefined)
        setMessages([])
      }

      toast({
        title: "Conversation deleted",
        description: "The conversation has been permanently deleted."
      })
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      })
    }
  }

  const sendMessage = async (content: string) => {
    if (!user?.id || !apiSettings?.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in settings first.",
        variant: "destructive"
      })
      return
    }

    let conversationId = currentConversationId

    // Create new conversation if none exists
    if (!conversationId) {
      try {
        const newConversation = await blink.db.conversations.create({
          id: `conv_${Date.now()}`,
          title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          userId: user.id,
          messageCount: 0
        })

        setConversations(prev => [newConversation, ...prev])
        setCurrentConversationId(newConversation.id)
        conversationId = newConversation.id
      } catch (error) {
        console.error('Error creating conversation:', error)
        return
      }
    }

    // Add user message
    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content,
      timestamp: Date.now(),
      conversationId: conversationId!
    }

    try {
      await blink.db.messages.create(userMessage)
      setMessages(prev => [...prev, userMessage])

      // Add assistant message placeholder
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        conversationId: conversationId!
      }

      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(true)

      // Stream AI response using OpenAI API
      let fullResponse = ''
      const { streamOpenAIResponse } = await import('../services/openai')
      
      await streamOpenAIResponse(
        messages.concat(userMessage).map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        apiSettings.apiKey,
        apiSettings.model || 'gpt-4o-mini',
        apiSettings.temperature || 0.7,
        apiSettings.maxTokens || 2000,
        (chunk) => {
          fullResponse += chunk
          setMessages(prev => 
            prev.map(m => 
              m.id === assistantMessage.id 
                ? { ...m, content: fullResponse }
                : m
            )
          )
        }
      )

      // Save final assistant message
      await blink.db.messages.create({
        ...assistantMessage,
        content: fullResponse
      })

      // Update conversation
      await blink.db.conversations.update(conversationId!, {
        updatedAt: Date.now(),
        messageCount: messages.length + 2
      })

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please check your API key.",
        variant: "destructive"
      })
      
      // Remove failed assistant message
      setMessages(prev => prev.filter(m => m.id !== `msg_${Date.now()}_assistant`))
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!apiSettings?.apiKey) {
    return (
      <div className="flex h-screen">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                You need to configure your OpenAI API key before you can start chatting.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Link to="/settings">
                <Button>Configure API Key</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      <ChatSidebar
        conversations={conversations}
        currentConversationId={currentConversationId}
        onNewChat={createNewConversation}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
      />
      <div className="flex-1 flex flex-col">
        <ScrollArea ref={scrollAreaRef} className="flex-1">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Start a conversation</h2>
                  <p className="text-muted-foreground">
                    Type a message below to begin chatting with your AI assistant.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRegenerate={() => {
                    // TODO: Implement regenerate functionality
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
        <ChatInput
          onSendMessage={sendMessage}
          isLoading={isLoading}
          disabled={!apiSettings?.apiKey}
        />
      </div>
    </div>
  )
}