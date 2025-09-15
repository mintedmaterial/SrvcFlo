"use client"

import { useState, useEffect } from "react"
import { ChatArea } from "@/components/playground/ChatArea"
import { Sidebar } from "@/components/playground/Sidebar"
import BackgroundPaths from "@/components/background-path"

export default function AgentsPage() {
  const [isIdle, setIsIdle] = useState(false)
  const [idleTimer, setIdleTimer] = useState<NodeJS.Timeout | null>(null)

  // Idle detection - show background after 5 minutes of inactivity
  useEffect(() => {
    const IDLE_TIME = 5 * 60 * 1000 // 5 minutes

    const resetIdleTimer = () => {
      setIsIdle(false)
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
      const newTimer = setTimeout(() => {
        setIsIdle(true)
      }, IDLE_TIME)
      setIdleTimer(newTimer)
    }

    // Events that reset idle timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, true)
    })

    // Initialize timer
    resetIdleTimer()

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer, true)
      })
      if (idleTimer) {
        clearTimeout(idleTimer)
      }
    }
  }, [idleTimer])

  return (
    <div className="relative flex h-screen bg-neutral-950 overflow-hidden">
      {/* ServiceFlow Background Animation - Only shown when idle */}
      {isIdle && (
        <div className="fixed inset-0 z-30">
          <BackgroundPaths
            title="ServiceFlow AI Agent UI - Idle"
            onEnter={() => setIsIdle(false)}
          />
        </div>
      )}

      {/* Main UI */}
      <div className="relative z-20 flex h-screen w-full">
        {/* Sidebar with enhanced backdrop */}
        <div className="relative">
          <div className="absolute inset-0 bg-neutral-900/90 backdrop-blur-md" />
          <div className="relative z-10">
            <Sidebar />
          </div>
        </div>

        {/* Main Content with enhanced backdrop */}
        <div className="flex flex-1 flex-col relative">
          <div className="absolute inset-0 bg-neutral-950/80" />
          <div className="relative z-10 flex flex-1 flex-col">
            {/* Chat Interface */}
            <div className="flex-1 overflow-hidden">
              <ChatArea />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}