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
              src={icon.src || "/placeholder.svg"}
              alt={icon.alt}
              width={icon.size}
              height={icon.size}
              className="rounded-full filter grayscale hover:grayscale-0 transition-all duration-300"
              style={{ opacity: icon.opacity }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export default function BackgroundPaths({
  title = "ServiceFlow AI Agent-UI",
}: {
  title?: string
}) {
  const words = title.split(" ")

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-neutral-950">
      <div className="absolute inset-0">
        <FloatingIcons direction={1} />
        <FloatingIcons direction={-1} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
            {words.map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                {word.split("").map((letter, letterIndex) => (
                  <motion.span
                    key={`${wordIndex}-${letterIndex}`}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      delay: wordIndex * 0.1 + letterIndex * 0.03,
                      type: "spring",
                      stiffness: 150,
                      damping: 25,
                    }}
                    className="inline-block text-transparent bg-clip-text 
                                        bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600"
                  >
                    {letter}
                  </motion.span>
                ))}
              </span>
            ))}
          </h1>

          <div
            className="inline-block group relative bg-gradient-to-b from-blue-400/10 to-cyan-400/5 
                        p-px rounded-2xl backdrop-blur-lg 
                        overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
          >
            <Button
              variant="ghost"
              className="rounded-[1.15rem] px-8 py-6 text-lg font-semibold backdrop-blur-md 
                            bg-blue-400/10 hover:bg-cyan-400/20 
                            text-cyan-100 transition-all duration-300 
                            group-hover:-translate-y-0.5 border border-cyan-400/20
                            hover:shadow-md hover:shadow-cyan-400/10"
            >
              <span className="opacity-90 group-hover:opacity-100 transition-opacity">Launch Agent Interface</span>
              <span
                className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                transition-all duration-300"
              >
                →
              </span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}