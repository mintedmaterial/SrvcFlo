'use client'

import { useState } from 'react'
import { TextArea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import Icon from '@/components/ui/icon'
import { usePlaygroundStore } from '@/lib/store'

const ChatInput = () => {
  const { chatInputRef, addMessage, isStreaming } = usePlaygroundStore()
  const [inputMessage, setInputMessage] = useState('')

  const handleSubmit = async () => {
    if (!inputMessage.trim()) return

    const currentMessage = inputMessage
    setInputMessage('')

    try {
      addMessage({
        role: 'user',
        content: currentMessage.trim(),
        created_at: new Date().toISOString(),
      })
      
      // TODO: Replace with actual streaming response
      setTimeout(() => {
        addMessage({
          role: 'agent',
          content: `Echo: ${currentMessage}`,
          created_at: new Date().toISOString(),
        })
      }, 1000)
    } catch (error) {
      console.error('Error in handleSubmit:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === 'Enter' &&
      !e.nativeEvent.isComposing &&
      !e.shiftKey &&
      !isStreaming
    ) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="relative mx-auto mb-1 flex w-full max-w-2xl items-end justify-center gap-x-2">
      <TextArea
        placeholder="Ask anything"
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full border border-input bg-background px-4 text-sm focus:border-ring"
        ref={chatInputRef}
      />
      <Button
        onClick={handleSubmit}
        disabled={!inputMessage.trim() || isStreaming}
        size="icon"
        className="rounded-xl"
      >
        <Icon type="send" size="sm" />
      </Button>
    </div>
  )
}

export default ChatInput