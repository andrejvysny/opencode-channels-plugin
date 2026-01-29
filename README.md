# OpenCode Channels Plugin

Connect OpenCode to messaging channels (Telegram/Slack/Discord) for remote permission handling and notifications.

## Features

- **Permission Requests** - Forward permission prompts to messaging channel, receive user response
- **Task Completion** - Notify when agent finishes
- **Error Alerts** - Ping user on errors/blocks
- **Session Status** - Notify on idle/paused states

## Installation

### Quick Install (Recommended)

```bash
npx opencode-channels-plugin install
# or
bunx opencode-channels-plugin install
```

This will:
1. Add plugin to `~/.config/opencode/opencode.json`
2. Create config template at `~/.config/opencode/channels.json`

### CLI Commands

| Command | Description |
|---------|-------------|
| `install` | Add plugin to opencode.json + create config template |
| `install -p` | Install to project-local `.opencode/` directory |
| `init` | Create config template only |
| `uninstall` | Remove plugin from opencode.json |

### Manual Install

```bash
bun install opencode-channels-plugin
```

Or build from source:
```bash
bun install
bun run build
```

## Configuration

Create `~/.config/opencode/channels.json`:

```json
{
  "enabled": true,
  "defaultChannel": "telegram",
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN",
    "chatId": "YOUR_CHAT_ID",
    "parseMode": "Markdown"
  },
  "notifications": {
    "onPermission": true,
    "onComplete": true,
    "onError": true,
    "onIdle": false
  },
  "timeout": 300
}
```

### Telegram Setup

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)
3. Add bot token and chat ID to config

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable plugin |
| `defaultChannel` | string | `"telegram"` | Channel to use |
| `timeout` | number | `300` | Permission response timeout (seconds) |

### Notification Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `onPermission` | boolean | `true` | Forward permission requests |
| `onComplete` | boolean | `true` | Notify on task completion |
| `onError` | boolean | `true` | Alert on errors |
| `onIdle` | boolean | `false` | Notify on idle state |

## Usage

Once configured, the plugin automatically:

1. Forwards permission requests to your Telegram chat
2. Waits for your response (✅ Allow / ❌ Deny / custom text)
3. Sends notifications based on your config

### Permission Request Format

```
🔔 Permission Required

Tool: bash
Command: npm install express

Reply: ✅ allow | ❌ deny | custom text
```

### Responding

- Click **✅ Allow** or **❌ Deny** buttons
- Or reply with: `allow`, `yes`, `y`, `deny`, `no`, `n`
- Or type custom response text

## Channels

| Channel | Status |
|---------|--------|
| Telegram | ✅ Implemented |
| Slack | 🔜 Planned |
| Discord | 🔜 Planned |

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev

# Type check
bun run typecheck
```

## License

MIT
