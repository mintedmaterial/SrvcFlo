# Visual Design: Sonic + Matrix Styling Guide

## Design Analysis from Reference Images

### Sonic Website Aesthetic
- **Background**: Deep dark theme (#0a0a0a to #1a1a1a)
- **Primary Colors**: 
  - Sonic Blue: #0066FF (primary brand)
  - Electric Orange: #FF8C00 (accent)
  - Pure White: #FFFFFF (text)
- **Typography**: Clean, modern sans-serif
- **Layout**: Minimal, card-based design
- **Effects**: Subtle gradients, clean shadows

### Matrix Digital Rain Effect
- **Animation**: Vertical falling green characters
- **Characters**: Japanese katakana, numbers, symbols
- **Colors**: Bright green (#00FF00) on black background
- **Speed**: Variable falling speeds for depth
- **Interaction**: Mouse movement affects particle direction

### Shadow Trading Interface
- **Dark Theme**: Deep black/brown gradients
- **Accent Colors**: Warm orange (#FFA500)
- **UI Elements**: Rounded corners, glowing effects
- **Layout**: Dashboard-style with multiple panels

## Combined Design System for ServiceFlow AI

### Color Palette
```css
:root {
  /* Primary Colors */
  --sonic-blue: #0066FF;
  --matrix-green: #00FF41;
  --electric-orange: #FF8C00;
  
  /* Background Gradients */
  --bg-primary: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
  --bg-secondary: linear-gradient(45deg, #000000 0%, #0d1421 100%);
  
  /* Text Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #B0B0B0;
  --text-accent: #00FF41;
  
  /* Interactive Elements */
  --button-primary: linear-gradient(135deg, #0066FF 0%, #004ACC 100%);
  --button-secondary: linear-gradient(135deg, #FF8C00 0%, #CC7000 100%);
  --border-glow: rgba(0, 255, 65, 0.5);
}
```

### Typography System
```css
/* Font Stack */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.typography {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* Heading Styles */
.h1-sonic { 
  font-size: 3.5rem; 
  font-weight: 700; 
  background: linear-gradient(135deg, #0066FF, #00FF41);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.h2-matrix { 
  font-size: 2.5rem; 
  font-weight: 600; 
  color: var(--matrix-green);
  text-shadow: 0 0 10px rgba(0, 255, 65, 0.5);
}
```

### Matrix Background Component
```javascript
// Matrix Rain Effect for React
export const MatrixRain = ({ mouseX, mouseY }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Matrix characters
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(0);
    
    const draw = () => {
      // Semi-transparent black background for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Matrix green text
      ctx.fillStyle = '#00FF41';
      ctx.font = `${fontSize}px monospace`;
      
      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Mouse interaction - deflect characters
        const mouseInfluence = Math.abs(mouseX - (i * fontSize)) < 100 ? 2 : 1;
        
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += mouseInfluence;
      }
    };
    
    const interval = setInterval(draw, 33); // ~30 FPS
    return () => clearInterval(interval);
  }, [mouseX, mouseY]);
  
  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
```

### Interactive Particle System
```javascript
// Mouse-responsive particle system
export const InteractiveParticles = () => {
  const [particles, setParticles] = useState([]);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    setMouse({ x: e.clientX, y: e.clientY });
    
    // Create particles on mouse movement
    const newParticles = Array(5).fill().map(() => ({
      id: Date.now() + Math.random(),
      x: e.clientX + (Math.random() - 0.5) * 20,
      y: e.clientY + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      decay: 0.02
    }));
    
    setParticles(prev => [...prev, ...newParticles].slice(-50));
  };
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-10"
      onMouseMove={handleMouseMove}
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-matrix-green rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            opacity: particle.life,
            boxShadow: `0 0 ${particle.life * 10}px var(--matrix-green)`
          }}
        />
      ))}
    </div>
  );
};
```

### Component Styling Examples

#### Sonic-style Button Component
```jsx
export const SonicButton = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = "px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105";
  
  const variants = {
    primary: "bg-gradient-to-r from-sonic-blue to-blue-600 hover:shadow-lg hover:shadow-blue-500/25",
    secondary: "bg-gradient-to-r from-orange-500 to-orange-600 hover:shadow-lg hover:shadow-orange-500/25",
    matrix: "bg-transparent border-2 border-matrix-green text-matrix-green hover:bg-matrix-green hover:text-black hover:shadow-lg hover:shadow-green-500/25"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### iNFT Agent Card Component
```jsx
export const AgentCard = ({ agent }) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-black border border-gray-800 hover:border-matrix-green transition-all duration-300 group">
      {/* Matrix overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity">
        <MatrixRain mouseX={0} mouseY={0} />
      </div>
      
      {/* Card content */}
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{agent.name}</h3>
          <div className="text-matrix-green font-mono text-sm">
            #{agent.tokenId}
          </div>
        </div>
        
        <div className="space-y-2 text-gray-300">
          <p>Type: {agent.type}</p>
          <p>Generations: {agent.generationCount}</p>
          <p>FLOAI Balance: {agent.floaiBalance}</p>
        </div>
        
        <div className="mt-4 flex gap-2">
          <SonicButton variant="primary" size="sm">
            Configure
          </SonicButton>
          <SonicButton variant="matrix" size="sm">
            Generate
          </SonicButton>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-matrix-green/10 to-transparent"></div>
      </div>
    </div>
  );
};
```

### Dashboard Layout
```jsx
export const DashboardLayout = ({ children }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-blue-900 relative overflow-hidden"
      onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
    >
      {/* Matrix background */}
      <MatrixRain mouseX={mousePos.x} mouseY={mousePos.y} />
      
      {/* Interactive particles */}
      <InteractiveParticles />
      
      {/* Main content */}
      <div className="relative z-20">
        <Navigation />
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </div>
      
      {/* Ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div 
          className="absolute w-96 h-96 bg-sonic-blue/20 rounded-full blur-3xl"
          style={{
            left: mousePos.x - 192,
            top: mousePos.y - 192,
            transition: 'all 0.3s ease-out'
          }}
        />
      </div>
    </div>
  );
};
```

### CSS Animations
```css
/* Glow pulse animation */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 5px var(--matrix-green); }
  50% { box-shadow: 0 0 20px var(--matrix-green), 0 0 30px var(--matrix-green); }
}

/* Matrix flicker */
@keyframes matrix-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* Sonic wave */
@keyframes sonic-wave {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}

.glow-text {
  animation: glow-pulse 2s infinite;
}

.matrix-text {
  animation: matrix-flicker 0.1s infinite;
}

.sonic-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 2px solid var(--sonic-blue);
  border-radius: inherit;
  animation: sonic-wave 1.5s infinite;
}
```

## Implementation Strategy

### Phase 1: Core Styling
1. Implement base color system and typography
2. Create Matrix background component
3. Style main navigation and layout

### Phase 2: Interactive Elements
1. Add mouse-responsive particle system
2. Implement glow and hover effects
3. Create animated button components

### Phase 3: Advanced Effects
1. GPU-accelerated Matrix rain
2. WebGL particle systems
3. Advanced lighting effects

### Performance Considerations
- Use `requestAnimationFrame` for smooth animations
- Implement particle pooling for performance
- Use CSS transforms for hardware acceleration
- Debounce mouse events to prevent performance issues