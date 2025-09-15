# Discord Bot Setup Guide

This guide explains how to set up the Discord bot integration for ServiceFlow AI agents.

## Prerequisites

1. **Discord Developer Account**: Create a Discord application at https://discord.com/developers/applications
2. **Bot Token**: Generate a bot token from your Discord application
3. **Python Dependencies**: Install required packages

## Step 1: Create Discord Application

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Name your application (e.g., "ServiceFlow AI Agents")
4. Go to the "Bot" section
5. Click "Add Bot"
6. Copy the bot token (keep this secret!)

## Step 2: Configure Bot Permissions

In the Discord Developer Portal, under "Bot" section:

**Required Permissions:**
- [x] Send Messages
- [x] Use Slash Commands  
- [x] Embed Links
- [x] Read Message History
- [x] Use External Emojis

**OAuth2 URL Generator:**
1. Go to OAuth2 → URL Generator
2. Select "bot" and "applications.commands"
3. Select the permissions above
4. Copy the generated URL to invite the bot to your server

## Step 3: Environment Variables

Add these to your `.env` file:

```bash
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_bot_token_here

# Required for agent functionality
OPENAI_API_KEY=your_openai_key
MONGODB_URI=your_mongodb_connection_string

# Optional integrations
LANGFUSE_SECRET_KEY=your_langfuse_key
LANGFUSE_PUBLIC_KEY=your_langfuse_public_key
```

## Step 4: Install Dependencies

```bash
pip install discord.py
```

Or add to your requirements.txt:
```
discord.py>=2.3.0
```

## Step 5: Start the System

### Option 1: Start with Discord Bot
```bash
cd C:\Users\PC\ServiceApp\agent-ui
python start_with_discord.py
```

### Option 2: Start Discord Bot Only
```bash
cd C:\Users\PC\ServiceApp\agent-ui\Agents
python discord_bot_integration.py
```

## Available Discord Commands

Once the bot is running, users can interact with it using these slash commands:

### Registration
- `/register [wallet_address] [telegram_id] [twitter_id]` - Register for agent access

### Agent Commands
- `/finance [query]` - Sonic Finance Research
- `/dalle [prompt]` - DALLE-3 Image Generation  
- `/research [topic]` - Multi-Agent Research Session
- `/continue [query]` - Continue Research Session
- `/help` - Show all available commands
- `/status` - Check registration status

### Example Usage

```
/register 0x1234567890abcdef1234567890abcdef12345678 123456789
/finance What are the best yield farming opportunities on Sonic?
/research Current Sonic ecosystem DeFi landscape
/continue What are the risks of these DeFi protocols?
```

## Discord Bot Features

### 1. User Registration & Validation
- Users must register with wallet address and at least one social ID
- Integration with unified user management system
- Persistent user sessions

### 2. Agent Integration  
- Direct access to all playground agents through Discord
- Multi-agent research collaboration
- Real-time responses with embeds

### 3. Initialization Notifications
- Bot announces when agents are online
- Sends initialization message to configured channels
- Shows available commands and usage instructions

### 4. Session Management
- Persistent research sessions across Discord interactions
- Users can continue conversations with `/continue`
- Session state management

## Customization

### Channel Configuration
Edit `discord_bot_integration.py` to configure specific channels:

```python
# In send_initialization_message method
ANNOUNCEMENT_CHANNELS = ['general', 'agents', 'ai-bots']
```

### Command Permissions
Add role-based permissions:

```python
@app_commands.describe(...)
@app_commands.default_permissions(manage_messages=True)  # Restrict to mods
async def admin_command(interaction: discord.Interaction):
    # Admin-only functionality
```

### Custom Embeds
Modify embed colors and styling in the command functions.

## Troubleshooting

### Bot Not Responding
1. Check bot token is correct in `.env`
2. Verify bot has required permissions in Discord server
3. Check console for error messages
4. Ensure slash commands are synced (`/help` should work)

### Commands Not Appearing
1. Bot needs "applications.commands" permission
2. Wait a few minutes for Discord to sync commands
3. Check bot is online and connected

### User Registration Issues
1. Verify MongoDB connection
2. Check CloudFlare KV storage configuration
3. Ensure user provides valid wallet address

### Missing Dependencies
```bash
pip install discord.py python-dotenv agno openai
```

## Production Deployment

### Security
- Keep bot token secure (never commit to git)
- Use environment variables for all secrets
- Consider rate limiting for production use

### Monitoring
- Enable logging to track bot usage
- Monitor API usage (OpenAI, DexScreener)
- Set up health checks

### Scaling
- Use Redis for session management across multiple instances
- Implement command queuing for high traffic
- Consider Discord API rate limits

## Support

For help with Discord bot setup:
1. Check the console logs for error messages
2. Verify all environment variables are set
3. Test with `/help` command first
4. Review Discord Developer Portal for permission issues

The bot will automatically announce when agents are initialized and provide usage instructions in your Discord server.