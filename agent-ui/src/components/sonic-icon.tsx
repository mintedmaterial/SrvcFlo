"use client"

import React from 'react'

interface SonicLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

export const SonicLogo: React.FC<SonicLogoProps> = ({ 
  size = 32, 
  showText = true, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className="rounded-full bg-gradient-to-br from-sonic-gold to-sonic-gold/60 flex items-center justify-center text-black font-bold"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        S
      </div>
      {showText && (
        <span className="text-white font-bold text-xl">Sonic</span>
      )}
    </div>
  )
}

export default SonicLogo