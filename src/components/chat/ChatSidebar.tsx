import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Plus, MessageSquare, Trash2, Edit3, Check, X } from 'lucide-react'
import { Conversation, User, SUBSCRIPTION_TIERS } from '../../types/chat'
import { Badge } from '../ui/badge'

interface ChatSidebarProps {
  conversations: Conversation[]
  currentConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  onDeleteConversation: (conversationId: string) => void
  onNewChat: () => void
  user: User
}

export function ChatSidebar({
  conversations,
  currentConversation,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  user
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = async () => {
    if (editingId && editTitle.trim()) {
      // Update conversation title in database
      // This would be handled by the parent component
      setEditingId(null)
      setEditTitle('')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const currentTier = SUBSCRIPTION_TIERS.find(tier => tier.id === user.subscriptionTier)
  const usagePercentage = currentTier ? (user.messageCount / currentTier.messagesPerMonth) * 100 : 0

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <Button
          onClick={onNewChat}
          className="w-full bg-transparent border border-gray-600 hover:bg-gray-800 text-white flex items-center gap-2"
        >
          <Plus size={16} />
          New chat
        </Button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group relative flex items-center gap-2 p-3 rounded-lg cursor-pointer hover:bg-gray-800 mb-1 ${
              currentConversation?.id === conversation.id ? 'bg-gray-800' : ''
            }`}
            onClick={() => onSelectConversation(conversation)}
          >
            <MessageSquare size={16} className="text-gray-400 flex-shrink-0" />
            
            {editingId === conversation.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit()
                    if (e.key === 'Escape') cancelEdit()
                  }}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    saveEdit()
                  }}
                  className="p-1 h-6 w-6 text-green-400 hover:text-green-300"
                >
                  <Check size={12} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation()
                    cancelEdit()
                  }}
                  className="p-1 h-6 w-6 text-red-400 hover:text-red-300"
                >
                  <X size={12} />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-sm truncate">{conversation.title}</span>
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(conversation)
                    }}
                    className="p-1 h-6 w-6 text-gray-400 hover:text-white"
                  >
                    <Edit3 size={12} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteConversation(conversation.id)
                    }}
                    className="p-1 h-6 w-6 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}

        {conversations.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>

      {/* User Info & Usage */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        {/* Subscription Badge */}
        <div className="flex items-center justify-between">
          <Badge 
            variant={user.subscriptionTier === 'free' ? 'secondary' : 'default'}
            className={`${
              user.subscriptionTier === 'free' 
                ? 'bg-gray-700 text-gray-300' 
                : user.subscriptionTier === 'basic'
                ? 'bg-blue-600 text-white'
                : 'bg-purple-600 text-white'
            }`}
          >
            {currentTier?.name} Plan
          </Badge>
          <span className="text-xs text-gray-400">
            ${currentTier?.price}/mo
          </span>
        </div>

        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            <span>Messages this month</span>
            <span>{user.messageCount.toLocaleString()} / {currentTier?.messagesPerMonth.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${
                usagePercentage > 90 ? 'bg-red-500' : 
                usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {usagePercentage > 80 && (
            <p className="text-xs text-yellow-400">
              {usagePercentage > 95 ? 'Almost at your limit!' : 'Getting close to your limit'}
            </p>
          )}
        </div>

        {/* User Email */}
        <div className="text-xs text-gray-400 truncate">
          {user.email}
        </div>
      </div>
    </div>
  )
}