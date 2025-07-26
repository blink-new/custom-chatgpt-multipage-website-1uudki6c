import React from 'react'
import { Button } from '../ui/button'
import { Copy, RotateCcw, User, Bot } from 'lucide-react'
import { Message } from '../../types/chat'
import ReactMarkdown from 'react-markdown'
import { toast } from '../../hooks/use-toast'

interface ChatMessageProps {
  message: Message
  onRegenerate?: () => void
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user'

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied to your clipboard.",
      })
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy message to clipboard.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`group flex gap-4 p-4 ${isUser ? 'bg-muted/50' : 'bg-background'}`}>
      <div className="flex-shrink-0">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      </div>
      <div className="flex-1 space-y-2">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown>{message.content}</ReactMarkdown>
          )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className="h-6 px-2 text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          {!isUser && onRegenerate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRegenerate}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}