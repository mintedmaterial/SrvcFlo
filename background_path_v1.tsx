"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useEffect, useState } from "react"

function FloatingIcons({ direction }: { direction: number }) {
  const [windowWidth, setWindowWidth] = useState(1200) // Default width for SSR

  useEffect(() => {
    setWindowWidth(window.innerWidth)

    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const icons = [
    { src: "https://dexscreener.com/favicon.png", alt: "DexScreener" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/shadow-exchange.png", alt: "Shadow Exchange" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/wagmi.png", alt: "Wagmi" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/metropolis.png", alt: "Metropolis" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/beets.png", alt: "Beets" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/equalizer.png", alt: "Equalizer" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/fat-finger.png", alt: "Fat Finger" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/spookyswap.png", alt: "SpookySwap" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/defive.png", alt: "DeFive" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/zkswap.png", alt: "ZKSwap" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/sonic-market.png", alt: "Sonic Market" },
    { src: "https://dd.dexscreener.com/ds-data/dexes/sonic-swap.png", alt: "Sonic Swap" },
    { src: "/images/openocean-icon.png", alt: "OpenOcean" },
    { src: "/images/paintswap.png", alt: "PaintSwap" },
    {
      src: "https://dd.dexscreener.com/ds-data/tokens/sonic/0xe51ee9868c1f0d6cd968a8b8c8376dc2991bfe44.png?key=50f8b4",
      alt: "Token 1",
    },
    {
      src: "https://dd.dexscreener.com/ds-data/tokens/sonic/0x9fdbc3f8abc05fa8f3ad3c17d2f806c1230c4564.png?size=lg&key=c9601a",
      alt: "Token 2",
    },
    {
      src: "https://dd.dexscreener.com/ds-data/tokens/sonic/0xb098afc30fce67f1926e735db6fdadfe433e61db.png?key=430ae8",
      alt: "Token 3",
    },
  ]

  const floatingIcons = Array.from({ length: 24 }, (_, i) => {
    const icon = icons[i % icons.length]
    const size = 20 + (i % 4) * 8 // Sizes between 20px and 44px
    const opacity = 0.15 + (i % 5) * 0.05 // Opacity between 0.15 and 0.35
    const duration = 15 + (i % 8) * 3 // Duration between 15s and 36s

    return {
      id: i,
      ...icon,
      size,
      opacity,
      duration,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      delay: Math.random() * 10,
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {floatingIcons.map((icon) => (
        <motion.div
          key={icon.id}
          className="absolute"
          style={{
            left: `${icon.initialX}%`,
            top: `${icon.initialY}%`,
          }}
          initial={{
            x: direction > 0 ? -100 : windowWidth + 100,
            y: 0,
            rotate: 0,
            scale: 0.8,
          }}
          animate={{
            x: direction > 0 ? windowWidth + 100 : -100,
            y: [0, -50, 50, 0],
            rotate: [0, 180, 360],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: icon.duration,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
            delay: icon.delay,
          }}
        >
          <motion.div
            animate={{
              opacity: [icon.opacity * 0.5, icon.opacity, icon.opacity * 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={icon.size}
              height={icon.size}
              className="rounded-full"
              style={{
                filter: "brightness(0.7) saturate(0.8)",
              }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export default function BackgroundPaths({
  title = "ServiceFlow AI",
  onEnter,
}: {
  title?: string
  onEnter?: () => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    onEnter?.()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Floating Icons Background */}
      <FloatingIcons direction={1} />
      <FloatingIcons direction={-1} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-transparent to-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 50 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {title}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            The future of AI-powered blockchain generation is here
          </p>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.8 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          >
            <Button
              onClick={handleEnter}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-lg"
            >
              Enter Platform
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}