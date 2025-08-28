# Technical Stack

## Application Framework
- **Backend:** Python 3.12+ with Agno framework for multi-agent systems
- **Frontend:** Next.js 14.0.4 with TypeScript for type safety
- **Agent Runtime:** Agno playground with MCP (Model Context Protocol) integration

## Database System
- **Primary:** MongoDB 6.3.0 for user data, agent configurations, and analytics
- **Secondary:** SQLite for local agent storage and caching
- **Blockchain Data:** Direct smart contract interaction via RPC

## JavaScript Framework
- **Framework:** Next.js 14 with React 18.3.1
- **State Management:** React hooks with Zustand for global state
- **Build System:** Next.js built-in build system with TypeScript support

## Import Strategy
- **Type:** Node.js modules with ES6 imports
- **Package Manager:** npm with package-lock.json for dependency locking

## CSS Framework
- **Framework:** Tailwind CSS 3.3.0 with utility-first approach
- **Animations:** tailwindcss-animate 1.0.7 for smooth transitions
- **Theming:** next-themes 0.2.1 for cyberpunk dark mode support

## UI Component Library
- **Primary:** shadcn/ui with Radix UI components
- **Icons:** lucide-react 0.454.0 for consistent iconography
- **Styling:** class-variance-authority for component variants

## Fonts Provider
- **Provider:** Next.js built-in font optimization
- **Fonts:** System fonts with fallback to web-safe fonts
- **Custom:** Cyberpunk/matrix-style fonts for branding

## Icon Library
- **Primary:** Lucide React for general UI icons
- **Crypto:** Custom SVG icons for blockchain/crypto elements
- **Brand:** Custom ServiceFlow AI iconography

## Application Hosting
- **Frontend:** Cloudflare Pages with Workers for edge computing
- **Backend Agents:** Multi-deployment (MCP/Cloudflare + Streamlit/Netlify)
- **Agent-UI:** Local development with planned cloud deployment

## Database Hosting
- **MongoDB:** MongoDB Atlas for production scalability
- **SQLite:** Local file system for development and agent caching
- **Blockchain:** Sonic Network RPC endpoints

## Asset Hosting
- **Static Assets:** Cloudflare R2 buckets for images, videos, and generated content
- **CDN:** Cloudflare CDN for global asset delivery
- **IPFS:** Future integration for decentralized storage

## Deployment Solution
- **Frontend:** Cloudflare Workers + Pages with wrangler CLI
- **Backend:** Docker containers with environment-specific configurations
- **Smart Contracts:** Hardhat with Sonic Network deployment

## Blockchain Stack
- **Network:** Sonic Blockchain (testnet/mainnet)
- **Web3 Integration:** wagmi 2.16.0 + viem 2.33.1 for type-safe interactions
- **Wallet Connection:** Web3Auth 10.0.4 + RainbowKit 2.2.8 for multi-wallet support
- **Contract Interaction:** thirdweb 5.77.0 for simplified contract interactions

## AI & ML Integration
- **Models:** OpenAI GPT-4, Groq, Google Gemini with multi-provider support
- **Image Generation:** OpenAI DALL-E, Stable Diffusion via APIs
- **Video Generation:** Kimi/Veo integration for AI video creation
- **Agent Framework:** Agno framework for intelligent agent orchestration

## Development Tools
- **Language:** TypeScript 5.x for type safety across frontend and backend
- **Testing:** Built-in Next.js testing with Jest integration
- **Linting:** ESLint with Next.js configuration
- **Version Control:** Git with automated deployment pipelines

## Code Repository URL
- **Primary:** GitHub repository (private)
- **Deployment:** Automated CI/CD with Cloudflare integration
- **Documentation:** Agent OS structure with comprehensive docs