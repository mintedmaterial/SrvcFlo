"use client"

import dynamic from 'next/dynamic'

const AIGenerationV2 = dynamic(
  () => import('@/components/ai-generation-v2').then(mod => ({ default: mod.AIGenerationV2 })),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading AI Generation...</div>
      </div>
    )
  }
)

export default function GeneratePage() {
  return (
    <div className="pt-16">
      <AIGenerationV2 />
    </div>
  )
}