import React, { useState } from 'react'
import { Message } from '../../types/chat'
import { Button } from '../ui/button'
import { Copy, RotateCcw, ThumbsUp, ThumbsDown, User, Bot } from 'lucide-react'
import { useToast } from '../../hooks/use-toast'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
  isStreaming?: boolean
}

export function ChatMessage({ message, onRegenerate, isStreaming }: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: 'Copied to clipboard',
        description: 'Message content has been copied',
      })
    } catch (error) {
      console.error('Failed to copy:', error)
      toast({
        title: 'Copy failed',
        description: 'Failed to copy message content',
        variant: 'destructive'
      })
    }
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
  }

  return (
    <div
      className={`group flex gap-4 p-6 ${
        message.role === 'assistant' ? 'bg-gray-50' : 'bg-white'
      } hover:bg-gray-50 transition-colors`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          message.role === 'user' 
            ? 'bg-blue-600 text-white' 
            : 'bg-[#10a37f] text-white'
        }`}>
          {message.role === 'user' ? (
            <User size={16} />
          ) : (
            <Bot size={16} />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-semibold text-sm">
            {message.role === 'user' ? 'You' : 'ChatGPT'}
          </span>
          {message.role === 'assistant' && (
            <span className="text-xs text-gray-500">
              {new Date(message.createdAt).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="prose prose-sm max-w-none">
          {isStreaming ? (
            <div className="flex items-center gap-2">
              <span 
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(message.content) 
                }} 
              />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          ) : (
            <div 
              dangerouslySetInnerHTML={{ 
                __html: formatContent(message.content) 
              }} 
            />
          )}
        </div>

        {/* Token Usage (for assistant messages) */}
        {message.role === 'assistant' && (message.promptTokens > 0 || message.completionTokens > 0) && (
          <div className="mt-2 text-xs text-gray-500">
            Tokens: {message.promptTokens + message.completionTokens} 
            ({message.promptTokens} prompt + {message.completionTokens} completion)
          </div>
        )}

        {/* Action Buttons */}
        {message.role === 'assistant' && !isStreaming && (
          <div className={`flex items-center gap-2 mt-3 transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <Copy size={14} />
            </Button>
            
            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRegenerate}
                className="h-8 px-2 text-gray-500 hover:text-gray-700"
              >
                <RotateCcw size={14} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <ThumbsUp size={14} />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-gray-500 hover:text-gray-700"
            >
              <ThumbsDown size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}