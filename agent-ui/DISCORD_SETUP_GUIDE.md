# Discord Bot Setup Guide for ServiceFlow AI

## ❌ Current Issue
The Discord bot is not responding because `DISCORD_BOT_TOKEN` is missing from your `.env` file.

## 🔧 Fix Steps

### 1. Create Discord Application & Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name it "ServiceFlow AI" or similar
4. Go to "Bot" section in left sidebar
5. Click "Add Bot"
6. Copy the **Bot Token** (keep this secret!)

### 2. Configure Bot Permissions

In the Discord Developer Portal:

1. Go to "Bot" section
2. Enable these **Privileged Gateway Intents**:
   - ✅ Message Content Intent
   - ✅ Server Members Intent (optional)
   - ✅ Presence Intent (optional)

3. Go to "OAuth2" → "URL Generator"
4. Select these **Scopes**:
   - ✅ bot
   - ✅ applications.commands

5. Select these **Bot Permissions**:
   - ✅ Send Messages
   - ✅ Read Message History
   - ✅ Create Public Threads
   - ✅ Use Slash Commands
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Mention Everyone

6. Copy the generated URL and invite bot to your Discord server

### 3. Add Bot Token to Environment

Add this line to your `.env` file:

```bash
# Discord Bot Integration
DISCORD_BOT_TOKEN=your_bot_token_here
```

**Your .env file should include:**
```bash
OPENAI_API_KEY=sk-proj-...
DISCORD_BOT_TOKEN=your_discord_bot_token
```

### 4. Test Discord Integration

Run this test to verify setup:
```bash
cd C:\Users\PC\ServiceApp\agent-ui
python test_discord_integration.py
```

### 5. Start Playground with Discord

```bash
cd C:\Users\PC\ServiceApp\agent-ui\Agents
python playground.py
```

The playground will:
- ✅ Start the main agent playground
- ✅ Launch Discord bot in background thread
- ✅ Show "Discord service started" message

## 🤖 Testing Discord Commands

Once the bot is online, test in your Discord server:

### Registration Test
```
@sonickid1 /register 0x0f4cbe532e34e4dfcb648adf145010b38ed5e8e8
```

### Other Commands
```
@sonickid1 /help
@sonickid1 /status
@sonickid1 /finance What are the best Sonic DEX opportunities?
```

## 🔍 Troubleshooting

### Bot Not Responding
1. ✅ Check bot token is correct in `.env`
2. ✅ Verify bot has permissions in Discord server
3. ✅ Check console logs for errors
4. ✅ Ensure bot shows as "Online" in Discord

### Bot Shows Offline
- Discord token might be invalid
- Bot wasn't invited with correct permissions
- Firewall blocking connections

### Commands Not Working
- Bot needs "Use Slash Commands" permission
- Wait 1-2 minutes for Discord to sync commands
- Try `/help` command first

## 📁 File Structure

```
agent-ui/
├── Agents/
│   ├── discord_agent_integration.py    # Main Discord integration
│   ├── playground.py                   # Updated with Discord startup
│   └── unified_user_manager.py         # User registration system
├── test_discord_integration.py         # Test script
└── DISCORD_SETUP_GUIDE.md             # This file
```

## ✅ Expected Behavior

When working correctly:

1. **Playground Startup** shows:
   ```
   🤖 Discord bot token found - Starting Discord service...
   🤖 Discord service started in background thread
   ```

2. **Discord Bot** shows online in server member list

3. **Commands Work**:
   - `/register [wallet] [social_id]` → Registration success
   - `/help` → Shows available commands
   - `/finance [question]` → Sonic DeFi analysis

## 🚀 Next Steps

After Discord is working:
1. Test all agent commands (`/finance`, `/research`, `/dalle`)
2. Verify user registration creates accounts properly
3. Check agent responses are formatted correctly

---

**🔐 Security Note:** Never commit your Discord bot token to git! Keep it in `.env` file only.