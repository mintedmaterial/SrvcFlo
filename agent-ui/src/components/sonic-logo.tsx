import Image from "next/image"
import Link from "next/link"

interface SonicLogoProps {
  size?: number
  showText?: boolean
}

export function SonicLogo({ size = 40, showText = true }: SonicLogoProps) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <Image src="/images/quantlogo.png" alt="Sonic AI Quant" width={size} height={size} priority />
      </div>
      {showText && <span className="font-bold text-xl text-white">Sonic AI Quant</span>}
    </Link>
  )
}