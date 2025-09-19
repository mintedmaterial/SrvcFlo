"use client"

import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleEnter = () => {
    router.push('/agents')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/80">
          ServiceFlow AI Agent UI
        </h1>
        <p className="text-xl mb-8">Modern AI Agent Interface</p>
        <button
          onClick={handleEnter}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition-colors text-lg hover:shadow-lg"
        >
          Enter ServiceFlow →
        </button>
      </div>
    </div>
  )
}
