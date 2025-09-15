"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

function FloatingIcons({ direction }: { direction: number }) {
  const [windowWidth, setWindowWidth] = useState(1200) // Default width for SSR

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth)

      const handleResize = () => setWindowWidth(window.innerWidth)
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Agent-themed icons for ServiceFlow AI
  const icons = [
    // AI/Bot icons (using Unicode or data URLs)
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuNDUgOC41OUwyMCA2TDE3IDEwSDI0VjE0SDE3TDIwIDE4TDEzLjQ1IDE1LjQxTDEyIDIyTDEwLjU1IDE1LjQxTDQgMThMNyAxNEgwVjEwSDdMNCA2TDEwLjU1IDguNTlMMTIgMloiIGZpbGw9IiMzNGQ5OTkiLz4KPC9zdmc+", alt: "AI Spark" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iNCIgZmlsbD0iIzEwYjk4MSIvPgo8cGF0aCBkPSJtMTMgMTAtMyAzLTItMiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4=", alt: "Check" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDEyYzAgNC45NzEtNC4wMjkgOS05IDlzLTktNC4wMjktOS05IDQuMDI5LTkgOS05IDkgNC4wMjkgOSA5WiIgZmlsbD0iIzA2MjU0MiIvPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00IiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==", alt: "Success" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iNCIgZmlsbD0iIzA2MjU0MiIvPgo8cGF0aCBkPSJNOSA5aDYiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTkgMTJoNiIgc3Ryb2tlPSIjMTBiOTgxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNOSAxNWgzIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==", alt: "Document" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDE0IDEwVjE0SDE0TDE0IDE0TDEwIDE0VjEwTDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMWI4NTE5Ii8+Cjwvc3ZnPg==", alt: "Star" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIgZmlsbD0iIzA1NGQ0MSIvPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00IiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPg==", alt: "Circle Check" },
    // Add more ServiceFlow/AI themed icons
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTQuNjIgOC42MkwyMiAxMUwxNS4zOCAxMy4zOEwxMiAyMkw4LjYyIDEzLjM4TDIgMTFMOS4zOCA4LjYyTDEyIDJaIiBmaWxsPSIjMTU5NDNhIi8+Cjwvc3ZnPg==", alt: "Diamond" },
    { src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iNCIgZmlsbD0iIzEwYjk4MSIvPgo8cGF0aCBkPSJtMTIgMS05IDEwaDQuNWw0LjUtNC41TDEyIDFaIiBmaWxsPSIjMTU5NDNhIi8+Cjwvc3ZnPg==", alt: "Pulse" },
  ]

  const floatingIcons = Array.from({ length: 16 }, (_, i) => {
    const icon = icons[i % icons.length]
    const size = 16 + (i % 4) * 6 // Smaller sizes for subtlety
    const opacity = 0.08 + (i % 5) * 0.03 // Lower opacity for background effect
    const duration = 20 + (i % 8) * 5 // Slower movement

    return {
      id: i,
      ...icon,
      size,
      opacity,
      duration,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      delay: Math.random() * 15,
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
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
            y: [0, -30, 30, 0],
            rotate: [0, 180, 360],
            scale: [0.8, 1.1, 0.8],
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
              opacity: [icon.opacity * 0.3, icon.opacity, icon.opacity * 0.3],
            }}
            transition={{
              duration: 6 + Math.random() * 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <Image
              src={icon.src}
              alt={icon.alt}
              width={icon.size}
              height={icon.size}
              className="rounded-full filter grayscale-0"
              style={{ opacity: icon.opacity }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

export function BackgroundPaths({ className = "" }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <FloatingIcons direction={1} />
      <FloatingIcons direction={-1} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-transparent pointer-events-none" />
    </div>
  )
}