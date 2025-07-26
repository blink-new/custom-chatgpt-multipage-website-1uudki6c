import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Trash2, MessageSquare, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { blink } from '../blink/client'
import { Conversation } from '../types/chat'
import { toast } from '../hooks/use-toast'

export function HistoryPage() {
  const [user, setUser] = useState(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Auth state management
  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
    })
    return unsubscribe
  }, [])

  // Load conversations
  useEffect(() => {
    if (!user?.id) return

    const loadConversations = async () => {
      setIsLoading(true)
      try {
        const convs = await blink.db.conversations.list({
          where: { userId: user.id },
          orderBy: { updatedAt: 'desc' }
        })
        setConversations(convs)
      } catch (error) {
        console.error('Error loading conversations:', error)
        toast({
          title: "Error",
          description: "Failed to load conversation history.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [user?.id])

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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Chat History</h1>
        <p className="text-muted-foreground mt-2">
          Browse and manage your previous conversations.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No conversations yet</h2>
          <p className="text-muted-foreground mb-6">
            Start your first conversation to see it appear here.
          </p>
          <Link to="/chat">
            <Button>Start Chatting</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">
                      {conversation.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.messageCount} messages
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/chat`} state={{ conversationId: conversation.id }}>
                      <Button variant="outline" size="sm">
                        Continue
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteConversation(conversation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}