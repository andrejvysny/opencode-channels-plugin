# Development Guide - OpenCode Channels Plugin

This guide covers setting up a development environment for OpenCode plugins, with specific focus on the opencode-channels-plugin.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [OpenCode Plugin Architecture](#opencode-plugin-architecture)
3. [Development Setup](#development-setup)
4. [Local Plugin Development Methods](#local-plugin-development-methods)
5. [Testing Your Plugin](#testing-your-plugin)
6. [Debugging](#debugging)
7. [Publishing](#publishing)
8. [Quick Start Checklist](#quick-start-checklist)

---

## Prerequisites

- **Bun** (v1.0+) - OpenCode uses Bun for plugin installation and execution
- **Node.js** (v20+) - For CLI compatibility
- **OpenCode** installed and configured

```bash
# Verify installations
bun --version
node --version
opencode --version
```

---

## OpenCode Plugin Architecture

### How Plugins Are Loaded

OpenCode supports two plugin loading mechanisms:

1. **Local files** - TypeScript/JavaScript files in plugin directories
2. **npm packages** - Listed in `opencode.json` under `"plugin"` array

### Plugin Load Order

1. Global config: `~/.config/opencode/opencode.json`
2. Project config: `./opencode.json`
3. Global plugins dir: `~/.config/opencode/plugins/`
4. Project plugins dir: `./.opencode/plugins/`

### Plugin Interface

```typescript
import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin";

const MyPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  // input.client - OpenCode SDK client for API calls
  // input.project - Current project information
  // input.directory - Current working directory
  // input.worktree - Git worktree path
  // input.$ - Bun shell API
  // input.serverUrl - OpenCode server URL

  return {
    event: async ({ event }) => {
      // Handle OpenCode events
    },
    // Other hooks...
  };
};

export default MyPlugin;
```

### Available Hooks

| Hook | Description |
|------|-------------|
| `event` | Subscribe to all OpenCode events |
| `config` | Modify configuration at startup |
| `tool` | Add custom tools |
| `auth` | Custom authentication providers |
| `chat.message` | Intercept new messages |
| `chat.params` | Modify LLM parameters |
| `permission.ask` | Custom permission handling |
| `tool.execute.before` | Pre-tool execution hook |
| `tool.execute.after` | Post-tool execution hook |

### Event Types

Key events your plugin can handle:

- `permission.asked`, `permission.updated`, `permission.replied`
- `session.idle`, `session.error`, `session.created`, `session.updated`
- `message.updated`, `message.part.updated`
- `todo.updated`
- `tui.command.execute`
- `file.edited`, `file.watcher.updated`

---

## Development Setup

### 1. Clone and Install

```bash
cd /path/to/opencode-channels-plugin
bun install
```

### 2. Build the Plugin

```bash
# One-time build
bun run build

# Watch mode (recommended for development)
bun run dev
```

### 3. Type Check

```bash
bun run typecheck
```

---

## Local Plugin Development Methods

### Method 1: Local File Plugin (Recommended for Development)

Create a wrapper in the plugins directory:

```bash
# Create global plugins directory
mkdir -p ~/.config/opencode/plugins

# Create a wrapper that imports your local build
cat > ~/.config/opencode/plugins/channels-dev.ts << 'EOF'
// Development wrapper for opencode-channels-plugin
export { default } from "/Users/YOUR_PATH/opencode-channels-plugin/dist/index.js";
EOF
```

**Pros**: Instant updates when you rebuild
**Cons**: Must rebuild after each change

### Method 2: Use package.json Dependencies

Add the local plugin to `~/.config/opencode/package.json`:

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.0",
    "opencode-channels-plugin": "file:/Users/YOUR_PATH/opencode-channels-plugin"
  }
}
```

Then run:
```bash
cd ~/.config/opencode
bun install
```

**Note**: You must run `bun install` after each build to update the cached version.

### Method 3: bun link

```bash
# In your plugin directory
cd /path/to/opencode-channels-plugin
bun link

# In OpenCode config directory
cd ~/.config/opencode
bun link opencode-channels-plugin
```

**Note**: Bun link behavior may differ from npm link. Test after setup.

### Method 4: Direct Cache Replacement (Quick Testing)

For quick testing, replace the cached version directly:

```bash
# Build your plugin
bun run build

# Replace cached version
rm -rf ~/.cache/opencode/node_modules/opencode-channels-plugin
cp -r /path/to/opencode-channels-plugin ~/.cache/opencode/node_modules/
```

**Warning**: OpenCode may overwrite this on next startup if the npm version differs.

---

## Testing Your Plugin

### 1. Verify Plugin Loads

Start OpenCode and check for plugin initialization messages:

```bash
opencode --print-logs --log-level DEBUG
```

Look for:
```
[ChannelsPlugin] Loaded config from /path/to/channels.json
[ChannelsPlugin] Started telegram channel
```

### 2. Test Event Handling

Create a test session and trigger events:

```bash
# In TUI, type commands to trigger events
channels start
channels status
channels stop
```

### 3. Test Permission Forwarding

Execute a command that requires permission and verify Telegram receives it.

### 4. Unit Testing (Future)

No tests exist yet. When adding:

```bash
# Create test files
touch src/__tests__/telegram.test.ts

# Run tests
bun test
bun test src/__tests__/telegram.test.ts  # Single file
```

---

## Debugging

### Enable Debug Logging

```bash
opencode --print-logs --log-level DEBUG
```

### Plugin Console Output

All `console.log` statements from plugins appear in OpenCode's logs. Use the `[PluginName]` prefix convention:

```typescript
console.log("[ChannelsPlugin] Event received:", event.type);
console.error("[TelegramChannel] Polling error:", error);
```

### Structured Logging

Use the client's log API for better integration:

```typescript
await client.app.log({
  service: "channels-plugin",
  level: "info",
  message: "Event processed",
  extra: { eventType: event.type },
});
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Plugin not loading | Check `opencode.json` plugin array or plugins directory |
| Old version running | Clear cache: `rm -rf ~/.cache/opencode/node_modules/YOUR_PLUGIN` |
| Type errors | Ensure `@opencode-ai/plugin` version matches OpenCode's version |
| Events not firing | Verify `runtimeEnabled` flag and notification config |

---

## Publishing

### 1. Version Bump

```bash
# Edit package.json version
bun run build
bun run typecheck
```

### 2. Test Before Publish

```bash
# Verify CLI works
node dist/cli.js --help

# Verify package contents
npm pack --dry-run
```

### 3. Publish to npm

```bash
npm publish --access public
```

### 4. CI/CD

The project includes GitHub Actions:

- **ci.yml**: Runs on PR/push - typecheck, build, CLI test
- **publish.yml**: Publishes to npm on release

---

## Directory Structure Reference

```
~/.config/opencode/
├── opencode.json          # Main OpenCode config (plugins array here)
├── channels.json          # This plugin's config
├── package.json           # Dependencies for local plugins
├── plugins/               # Local plugin files (.ts/.js)
│   └── my-plugin.ts
└── node_modules/          # Installed dependencies

~/.cache/opencode/
├── node_modules/          # Cached npm plugin packages
│   └── opencode-channels-plugin/
└── package.json           # Auto-generated from plugin list
```

---

## Configuration Files

### opencode.json (add plugin)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "opencode-channels-plugin"
  ]
}
```

### channels.json (plugin config)

```json
{
  "enabled": true,
  "autostart": false,
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
    "onIdle": false,
    "onQuestion": true,
    "onProgress": false
  },
  "timeout": 300
}
```

---

## Quick Start Checklist

- [ ] Clone repo and run `bun install`
- [ ] Run `bun run build` to compile
- [ ] Set up local development method (see above)
- [ ] Create `~/.config/opencode/channels.json` with Telegram credentials
- [ ] Add plugin to `~/.config/opencode/opencode.json`
- [ ] Start OpenCode with `--print-logs` to verify
- [ ] Test with `channels start` command in TUI
