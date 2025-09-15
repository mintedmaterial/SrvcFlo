'use client'

import type { PlaygroundChatMessage } from '@/types/playground'

interface MessageListProps {
  messages: PlaygroundChatMessage[]
}

const Messages = ({ messages }: MessageListProps) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm">Send a message to begin chatting with the agent</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message, index) => {
        const key = `${message.role}-${message.created_at}-${index}`

        return (
          <div key={key} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <div className="text-sm font-medium mb-1 capitalize">{message.role}</div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Messages