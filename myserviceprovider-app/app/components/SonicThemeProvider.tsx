'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SonicTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  glowColor: string;
  matrixEnabled: boolean;
  animationSpeed: number;
}

interface SonicThemeContextType {
  theme: SonicTheme;
  setTheme: (theme: Partial<SonicTheme>) => void;
  toggleMatrix: () => void;
  applyGlow: (element: string) => string;
  getGradient: (direction?: string) => string;
}

const defaultTheme: SonicTheme = {
  primaryColor: '#00D4FF', // Sonic electric blue
  secondaryColor: '#0099CC', // Sonic secondary blue
  accentColor: '#00FFFF', // Cyan accent
  backgroundColor: '#000011', // Deep space blue
  textColor: '#FFFFFF', // White text
  glowColor: '#00D4FF', // Blue glow
  matrixEnabled: true,
  animationSpeed: 1
};

const SonicThemeContext = createContext<SonicThemeContextType | undefined>(undefined);

interface SonicThemeProviderProps {
  children: ReactNode;
}

export function SonicThemeProvider({ children }: SonicThemeProviderProps) {
  const [theme, setThemeState] = useState<SonicTheme>(defaultTheme);

  const setTheme = (newTheme: Partial<SonicTheme>) => {
    setThemeState(prev => ({ ...prev, ...newTheme }));
  };

  const toggleMatrix = () => {
    setTheme({ matrixEnabled: !theme.matrixEnabled });
  };

  const applyGlow = (element: string = 'default') => {
    const glowIntensity = theme.matrixEnabled ? '10px' : '5px';
    return `drop-shadow(0 0 ${glowIntensity} ${theme.glowColor})`;
  };

  const getGradient = (direction: string = 'to right') => {
    return `linear-gradient(${direction}, ${theme.primaryColor}, ${theme.secondaryColor}, ${theme.accentColor})`;
  };

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    root.style.setProperty('--sonic-primary', theme.primaryColor);
    root.style.setProperty('--sonic-secondary', theme.secondaryColor);
    root.style.setProperty('--sonic-accent', theme.accentColor);
    root.style.setProperty('--sonic-background', theme.backgroundColor);
    root.style.setProperty('--sonic-text', theme.textColor);
    root.style.setProperty('--sonic-glow', theme.glowColor);
    root.style.setProperty('--sonic-gradient', getGradient());
    root.style.setProperty('--sonic-glow-filter', applyGlow());
    
    // Animation speed
    root.style.setProperty('--sonic-animation-speed', `${theme.animationSpeed}s`);
    
  }, [theme]);

  const value: SonicThemeContextType = {
    theme,
    setTheme,
    toggleMatrix,
    applyGlow,
    getGradient
  };

  return (
    <SonicThemeContext.Provider value={value}>
      <div 
        className="min-h-screen transition-all duration-500"
        style={{
          background: `linear-gradient(135deg, ${theme.backgroundColor} 0%, #001122 50%, #000011 100%)`,
          color: theme.textColor
        }}
      >
        {children}
      </div>
    </SonicThemeContext.Provider>
  );
}

export function useSonicTheme() {
  const context = useContext(SonicThemeContext);
  if (context === undefined) {
    throw new Error('useSonicTheme must be used within a SonicThemeProvider');
  }
  return context;
}

// Sonic-styled component wrappers
export function SonicButton({ 
  children, 
  variant = 'primary', 
  glowing = false,
  className = '',
  ...props 
}: any) {
  const { theme, applyGlow } = useSonicTheme();
  
  const baseClasses = 'px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105';
  
  const variantClasses = {
    primary: `bg-gradient-to-r from-[${theme.primaryColor}] to-[${theme.secondaryColor}] text-white hover:shadow-lg`,
    secondary: `border-2 border-[${theme.primaryColor}] text-[${theme.primaryColor}] hover:bg-[${theme.primaryColor}] hover:text-white`,
    accent: `bg-[${theme.accentColor}] text-black hover:shadow-lg`
  };
  
  const glowStyle = glowing ? { filter: applyGlow() } : {};
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={glowStyle}
      {...props}
    >
      {children}
    </button>
  );
}

export function SonicCard({ 
  children, 
  glowing = false, 
  className = '',
  ...props 
}: any) {
  const { theme, applyGlow } = useSonicTheme();
  
  const glowStyle = glowing ? { 
    filter: applyGlow(),
    boxShadow: `0 0 20px ${theme.glowColor}40`
  } : {};
  
  return (
    <div
      className={`backdrop-blur-sm border rounded-xl p-6 transition-all duration-300 hover:scale-102 ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.primaryColor}10, ${theme.secondaryColor}10)`,
        borderColor: `${theme.primaryColor}50`,
        ...glowStyle
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function SonicText({ 
  children, 
  variant = 'body', 
  glowing = false,
  className = '',
  ...props 
}: any) {
  const { theme, applyGlow } = useSonicTheme();
  
  const variantClasses = {
    title: 'text-4xl font-bold mb-4',
    subtitle: 'text-2xl font-semibold mb-2',
    body: 'text-base',
    caption: 'text-sm opacity-75'
  };
  
  const glowStyle = glowing ? { 
    filter: applyGlow(),
    textShadow: `0 0 10px ${theme.glowColor}`
  } : {};
  
  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={{
        color: theme.textColor,
        ...glowStyle
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Animated Sonic logo component
export function SonicLogo({ size = 48, animated = true }: { size?: number; animated?: boolean }) {
  const { theme } = useSonicTheme();
  
  return (
    <div 
      className={`relative ${animated ? 'animate-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, ${theme.primaryColor}, ${theme.accentColor}, ${theme.secondaryColor}, ${theme.primaryColor})`,
          filter: 'blur(2px)'
        }}
      />
      <div
        className="absolute inset-1 rounded-full flex items-center justify-center font-bold text-white"
        style={{
          background: theme.backgroundColor,
          fontSize: size * 0.3
        }}
      >
        S
      </div>
    </div>
  );
}

// Particle effect component
export function SonicParticles() {
  const { theme } = useSonicTheme();
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full animate-ping"
          style={{
            background: theme.accentColor,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}