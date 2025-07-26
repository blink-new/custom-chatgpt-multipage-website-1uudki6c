import React from 'react'
import { Button } from '../ui/button'
import { ScrollArea } from '../ui/scroll-area'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import { Conversation } from '../../types/chat'

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversationId?: string
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function ChatSidebar({
  conversations,
  currentConversationId,
  onNewChat,
  onSelectConversation,
  onDeleteConversation
}: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/10">
      <div className="p-4">
        <Button onClick={onNewChat} className="w-full justify-start">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group flex items-center gap-2 rounded-lg p-2 hover:bg-muted/50 cursor-pointer ${
                currentConversationId === conversation.id ? 'bg-muted' : ''
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <MessageSquare className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1 truncate text-sm">
                {conversation.title}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteConversation(conversation.id)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}