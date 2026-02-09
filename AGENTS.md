# AGENTS.md - OpenCode Channels Plugin

## Overview

TypeScript plugin for OpenCode that connects to messaging channels (Telegram/Slack/Discord) for remote permission handling, notifications, and session control.

**Tech Stack**: TypeScript, Node.js 20+, Bun, tsup, Zod

---

## Build & Development Commands

```bash
# Install dependencies
bun install

# Build (ESM output to dist/)
bun run build

# Watch mode (development)
bun run dev

# Type check only (no emit)
bun run typecheck
```

### CI Verification

```bash
# Full CI check sequence
bun install --frozen-lockfile && bun run typecheck && bun run build

# Verify CLI works
node dist/cli.js --help
```

### Testing

**No tests exist.** When adding tests, use bun's built-in test runner:

```bash
# Future test command (not yet configured)
bun test
bun test src/channels/telegram.test.ts  # Single file
```

---

## Project Structure

```
src/
  index.ts              # Main plugin entry, exports ChannelsPlugin
  cli.ts                # CLI commands (install/init/uninstall)
  types.ts              # Core type definitions
  config/
    schema.ts           # Zod schemas for configuration
  channels/
    base.ts             # Abstract BaseChannel class
    telegram.ts         # Telegram implementation
  handlers/
    permission.ts       # Permission request handling
    notification.ts     # Notification dispatch
    remote.ts           # Remote command controller
  state/
    state.ts            # Persistent state management
    pending.ts          # Pending permissions store
```

---

## Code Style Guidelines

### TypeScript Configuration

- Target: ES2022
- Module: ESNext with bundler resolution
- Strict mode enabled with these additional checks:
  - `noUnusedLocals`, `noUnusedParameters`
  - `noImplicitReturns`, `noFallthroughCasesInSwitch`

### Import Conventions

```typescript
// External packages first, then internal (no blank line required)
import { z } from "zod";
import { Command } from "commander";
import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin";

// Local imports MUST use .js extension (ESM requirement)
import { parseConfig, type ChannelsConfig } from "./config/schema.js";
import type { Channel, PermissionRequest } from "../types.js";

// Use `type` keyword for type-only imports
import type { TelegramConfig } from "../config/schema.js";
```

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables/functions | camelCase | `handleUpdate`, `pendingStore` |
| Classes | PascalCase | `TelegramChannel`, `PermissionHandler` |
| Types/Interfaces | PascalCase | `ChannelMessage`, `PendingPermission` |
| Constants | SCREAMING_SNAKE | `PLUGIN_NAME`, `CONFIG_TEMPLATE` |
| Private fields | no prefix | `private config`, `private client` |
| Schema variables | PascalCase + Schema suffix | `TelegramConfigSchema` |

### Type Definitions

```typescript
// Use Zod for schema validation with inferred types
export const TelegramConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  parseMode: z.enum(["Markdown", "HTML"]).optional().default("Markdown"),
});

export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;

// Use union types for constrained values
export type PermissionDecision = "once" | "always" | "reject";

// Use interface for object shapes
export interface ChannelMessage {
  text: string;
  parseMode?: "Markdown" | "HTML";
  buttons?: MessageButton[];
}
```

### Class Patterns

```typescript
// Abstract base class with protected members
export abstract class BaseChannel implements Channel {
  abstract name: string;
  protected responseCallbacks: ResponseCallback[] = [];

  abstract send(message: ChannelMessage): Promise<void>;

  protected notifyResponse(messageId: string, response: string): void {
    for (const callback of this.responseCallbacks) {
      callback(messageId, response);
    }
  }
}

// Concrete implementation
export class TelegramChannel extends BaseChannel {
  name = "telegram";
  private config: TelegramConfig;

  constructor(config: TelegramConfig, stateStore?: ChannelsStateStore) {
    super();
    this.config = config;
  }
}
```

### Error Handling

```typescript
// Critical errors: throw with descriptive message
if (!config.telegram) {
  throw new Error("Telegram config required when defaultChannel is telegram");
}

// Non-critical operations: silent catch with empty block
try {
  await fetch(`${this.baseUrl}/answerCallbackQuery`, { ... });
} catch {
  // Ignore errors for callback answers
}

// Recoverable errors: log and continue
} catch (error) {
  console.error("[TelegramChannel] Polling error:", error);
  await this.sleep(5000);
}
```

### Async/Await Patterns

```typescript
// Fire-and-forget async calls: use void operator
channel.onMessage((message) => {
  void remoteController.handleIncoming(message);
});

// All async methods return Promise<void> or Promise<T>
async handlePermissionEvent(permission: Permission): Promise<void> {
  // ...
}
```

### Formatting

- 2 space indentation
- Double quotes for strings
- Semicolons required
- Trailing commas in multiline objects/arrays
- No blank line between import groups (single block)
- Blank line before return statements in multi-line functions

---

## Plugin Architecture

The plugin follows OpenCode's plugin interface:

```typescript
const ChannelsPlugin: Plugin = async (input: PluginInput): Promise<Hooks> => {
  // Setup and return hooks
  return {
    event: async ({ event }) => {
      // Handle events
    },
  };
};

export default ChannelsPlugin;
```

### Key Components

1. **Channel**: Abstract interface for messaging platforms
2. **PermissionHandler**: Forwards permission requests, handles responses
3. **NotificationHandler**: Sends notifications based on config
4. **RemoteController**: Processes incoming Telegram commands
5. **StateStore**: Persists runtime state to disk

---

## Common Patterns

### Configuration Loading

```typescript
function loadConfigFromFile(): Record<string, unknown> | null {
  const paths = [
    join(process.cwd(), ".opencode", "channels.json"),
    join(homedir(), ".config", "opencode", "channels.json"),
  ];
  for (const configPath of paths) {
    if (existsSync(configPath)) {
      try {
        return JSON.parse(readFileSync(configPath, "utf-8"));
      } catch {
        continue;
      }
    }
  }
  return null;
}
```

### Console Logging

```typescript
// Use [PluginName] prefix for all console logs
console.log("[ChannelsPlugin] Loaded config from ${configPath}");
console.error("[TelegramChannel] Polling error:", error);
```

---

## Dependencies

**Runtime:**
- `commander`: CLI argument parsing
- `zod`: Schema validation

**Peer:**
- `@opencode-ai/plugin`: OpenCode plugin interface

**Dev:**
- `@opencode-ai/plugin`, `@types/node`, `tsup`, `typescript`
