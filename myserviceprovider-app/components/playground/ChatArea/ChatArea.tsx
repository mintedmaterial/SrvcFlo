'use client'

import ChatInput from './ChatInput'
import MessageArea from './MessageArea'
import LogoLinkCards from './LogoLinkCards'

const ChatArea = () => {
  return (
    <main className="relative m-1.5 flex flex-grow flex-col rounded-xl bg-background">
      {/* Logo and Link Cards Section */}
      <div className="flex flex-col items-center w-full pt-4 pb-2">
        <LogoLinkCards />
      </div>
      <MessageArea />
      <div className="sticky bottom-0 ml-9 px-4 pb-2">
        <ChatInput />
      </div>
    </main>
  )
}

export default ChatArea
