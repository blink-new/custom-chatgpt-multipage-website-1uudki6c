import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Send, Square } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  onStop?: () => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, isLoading, onStop, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim())
      setMessage('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  return (
    <div className="border-t bg-background p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="min-h-[44px] max-h-32 resize-none pr-12"
            disabled={disabled}
          />
          <div className="absolute right-2 bottom-2">
            {isLoading ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onStop}
                className="h-8 w-8 p-0"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="sm"
                disabled={!message.trim() || disabled}
                className="h-8 w-8 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}