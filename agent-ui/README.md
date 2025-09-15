# ServiceFlow AI Agent UI

A modern chat interface for ServiceFlow AI backend agents, built with Next.js 15 and TypeScript.

## Features

- 🤖 **Multi-Agent Support** - Chat with multiple specialized AI agents
- 🔄 **Real-time Connection Status** - Monitor agent availability and connection health
- 💬 **Rich Chat Interface** - Beautiful, responsive chat experience with message history
- 🎨 **ServiceFlow AI Branding** - Integrated with animated backgrounds and professional styling
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🚀 **Fast Performance** - Built with Next.js 15 and optimized for speed

## Quick Start

### Prerequisites

- Node.js 18.17 or later
- Agno Playground server running on port 7777

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd agent-ui
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` to configure your endpoints:
   ```env
   NEXT_PUBLIC_AGENT_ENDPOINT=http://localhost:7777
   NEXT_PUBLIC_APP_NAME=ServiceFlow AI Agent UI
   ```

4. **Start the Agno Playground server:**
   ```bash
   cd Agents
   python playground.py
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Agents

The UI automatically connects to agents running in your Agno Playground:

- **Content Creation Agent** - Autonomous content and social media management
- **Google Services Manager** - Gmail and Calendar automation
- **Facebook Page Manager** - Facebook posting and management
- **Contractor Assistant** - Building codes and construction knowledge
- **Cloudflare Agent** - Deployment and infrastructure management

## Project Structure

```
src/
├── app/                    # Next.js 15 app router pages
├── components/             # React components
│   ├── chat/              # Chat-specific components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and clients
└── types/                 # TypeScript type definitions
```

## Configuration

### Environment Variables

- `NEXT_PUBLIC_AGENT_ENDPOINT` - Playground server endpoint (default: http://localhost:7777)
- `NEXT_PUBLIC_APP_NAME` - Application name
- `NEXT_PUBLIC_MAIN_APP_URL` - Main ServiceFlow app URL
- `NEXT_PUBLIC_AGENT_UI_URL` - Agent UI URL (for production)

### Agent Connection

The UI connects to your Agno Playground server and automatically discovers available agents. Make sure your playground server is running and accessible at the configured endpoint.

## Deployment

### GitHub Pages

The repository includes automated GitHub Pages deployment:

1. **Enable GitHub Pages** in your repository settings
2. **Push to main branch** - deployment happens automatically
3. **Custom domain** (optional) - configure in repository settings

### Manual Deployment

```bash
npm run build
npm run export
```

The static files will be generated in the `out/` directory.

## Integration with Main App

The Agent UI integrates with the main ServiceFlow app:

- Team members can access the Agent UI from the admin panel
- Authentication is handled via wallet connection
- Redirects are configured for both development and production environments

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript checks

### Adding New Agents

1. **Add agent to playground.py** in your Agents directory
2. **Restart playground server** - the UI will automatically detect the new agent
3. **Optional: Add custom styling** for agent types in the UI components

## Troubleshooting

### Connection Issues

- Ensure the playground server is running on port 7777
- Check firewall settings and CORS configuration
- Verify the `NEXT_PUBLIC_AGENT_ENDPOINT` environment variable

### Build Issues

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Node.js version: `node --version` (requires 18.17+)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with the playground server
5. Submit a pull request

## License

This project is part of ServiceFlow AI and follows the same licensing terms.

## Support

For support with the Agent UI:
- Check the Agno documentation
- Review playground server logs
- Contact the ServiceFlow AI team