import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import { Send, Square, Paperclip } from 'lucide-react'

interface ChatInputProps {
  onSendMessage: (message: string) => void
  disabled?: boolean
  placeholder?: string
  onStop?: () => void
  isStreaming?: boolean
}

export function ChatInput({ 
  onSendMessage, 
  disabled = false, 
  placeholder = "Message ChatGPT...",
  onStop,
  isStreaming = false
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !disabled) {
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

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-3 p-4 bg-white border border-gray-300 rounded-2xl shadow-sm focus-within:border-gray-400 transition-colors">
          {/* Attachment Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0"
            disabled={disabled}
          >
            <Paperclip size={18} />
          </Button>

          {/* Text Input */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 resize-none border-none outline-none bg-transparent text-gray-900 placeholder-gray-500 min-h-[24px] max-h-[200px] py-0"
            rows={1}
          />

          {/* Send/Stop Button */}
          {isStreaming ? (
            <Button
              type="button"
              onClick={onStop}
              size="sm"
              className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex-shrink-0"
            >
              <Square size={16} />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              size="sm"
              className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
                message.trim() && !disabled
                  ? 'bg-[#10a37f] hover:bg-[#0d8f6b] text-white'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={16} />
            </Button>
          )}
        </div>
      </form>

      {/* Footer Text */}
      <div className="text-center text-xs text-gray-500 mt-2">
        ChatGPT can make mistakes. Check important info.
      </div>
    </div>
  )
}