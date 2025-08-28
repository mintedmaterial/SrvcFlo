'use client';

import { useEffect, useRef, useState } from 'react';

interface MatrixChar {
  x: number;
  y: number;
  char: string;
  speed: number;
  opacity: number;
  isSonic?: boolean;
}

interface MatrixBackgroundProps {
  density?: number;
  speed?: number;
  sonicMode?: boolean;
  interactive?: boolean;
}

export function MatrixBackground({ 
  density = 0.8, 
  speed = 1, 
  sonicMode = true,
  interactive = true 
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const charactersRef = useRef<MatrixChar[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(true);

  // Matrix characters with Sonic-themed additions
  const matrixChars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
  const sonicChars = 'SONICLABSDEFIBLOCKCHAIN⚡🚀⚙️🔗💎';
  const binaryChars = '01';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // Initialize characters
    const initializeCharacters = () => {
      charactersRef.current = [];
      for (let i = 0; i < columns * density; i++) {
        charactersRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          char: getRandomChar(),
          speed: (Math.random() * 3 + 1) * speed,
          opacity: Math.random() * 0.8 + 0.2,
          isSonic: sonicMode && Math.random() < 0.1 // 10% chance for Sonic chars
        });
      }
    };

    const getRandomChar = () => {
      if (sonicMode && Math.random() < 0.15) {
        return sonicChars[Math.floor(Math.random() * sonicChars.length)];
      }
      return Math.random() < 0.7 
        ? binaryChars[Math.floor(Math.random() * binaryChars.length)]
        : matrixChars[Math.floor(Math.random() * matrixChars.length)];
    };

    const getCharColor = (char: MatrixChar) => {
      if (char.isSonic || sonicChars.includes(char.char)) {
        // Sonic colors: electric blue to cyan
        const colors = ['#00D4FF', '#0099CC', '#0066FF', '#00FFFF', '#33CCFF'];
        return colors[Math.floor(Math.random() * colors.length)];
      }
      
      // Classic Matrix green with variations
      const greenShades = ['#00FF41', '#00CC33', '#009900', '#00FF00', '#33FF33'];
      return greenShades[Math.floor(Math.random() * greenShades.length)];
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY
      };

      // Add particle effects near mouse
      if (Math.random() < 0.3) {
        charactersRef.current.push({
          x: e.clientX + (Math.random() - 0.5) * 100,
          y: e.clientY + (Math.random() - 0.5) * 100,
          char: getRandomChar(),
          speed: (Math.random() * 2 + 1) * speed,
          opacity: 1,
          isSonic: sonicMode && Math.random() < 0.3
        });
      }
    };

    const animate = () => {
      if (!isVisible) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas with slight trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw characters
      ctx.font = `${fontSize}px 'Courier New', monospace`;
      ctx.textAlign = 'center';

      charactersRef.current.forEach((char, index) => {
        // Update position
        char.y += char.speed;
        char.opacity -= 0.002;

        // Reset character if it goes off screen or fades out
        if (char.y > canvas.height + fontSize || char.opacity <= 0) {
          char.y = -fontSize;
          char.x = Math.random() * canvas.width;
          char.opacity = Math.random() * 0.8 + 0.2;
          char.char = getRandomChar();
          char.isSonic = sonicMode && Math.random() < 0.1;
        }

        // Interactive mouse effects
        if (interactive) {
          const dx = char.x - mouseRef.current.x;
          const dy = char.y - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            char.opacity = Math.min(1, char.opacity + 0.02);
            char.speed = Math.max(0.5, char.speed - 0.1);
          } else {
            char.speed = Math.min((Math.random() * 3 + 1) * speed, char.speed + 0.05);
          }
        }

        // Draw character with glow effect for Sonic chars
        const color = getCharColor(char);
        
        if (char.isSonic || sonicChars.includes(char.char)) {
          // Glow effect for Sonic characters
          ctx.shadowColor = color;
          ctx.shadowBlur = 10;
          ctx.fillStyle = color;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = color;
        }
        
        ctx.globalAlpha = char.opacity;
        ctx.fillText(char.char, char.x, char.y);
        
        // Add extra glow for special Sonic symbols
        if (char.char === '⚡' || char.char === '🚀') {
          ctx.shadowBlur = 20;
          ctx.fillText(char.char, char.x, char.y);
        }
      });

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Remove excess characters to maintain performance
      if (charactersRef.current.length > columns * density * 2) {
        charactersRef.current.splice(columns * density, charactersRef.current.length - columns * density);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    initializeCharacters();
    
    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    animationRef.current = requestAnimationFrame(animate);

    // Visibility change handler
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [density, speed, sonicMode, interactive, isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: 'linear-gradient(135deg, #000000 0%, #001122 50%, #000011 100%)',
      }}
    />
  );
}

// Sonic-themed Matrix variant
export function SonicMatrixBackground() {
  return (
    <MatrixBackground
      density={1.2}
      speed={1.5}
      sonicMode={true}
      interactive={true}
    />
  );
}

// Subtle background variant for UI overlays
export function MatrixOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <MatrixBackground
        density={0.3}
        speed={0.5}
        sonicMode={true}
        interactive={false}
      />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}