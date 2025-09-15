"use client"

import BackgroundPaths from "@/components/background-path"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  const handleEnter = () => {
    router.push('/agents')
  }

  return (
    <BackgroundPaths
      title="ServiceFlow AI Agent UI"
      onEnter={handleEnter}
    />
  )
}