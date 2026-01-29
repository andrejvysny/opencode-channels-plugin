import { parseConfig, type ChannelsConfig } from "./config/schema.js";
import { TelegramChannel } from "./channels/telegram.js";
import { PermissionHandler } from "./handlers/permission.js";
import { NotificationHandler } from "./handlers/notification.js";
import { PendingRequestsStore } from "./state/pending.js";
import type { Channel } from "./types.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

export interface PluginContext {
  config?: Record<string, unknown>;
  hooks?: {
    on(event: string, handler: (...args: unknown[]) => unknown): void;
  };
}

function loadConfigFromFile(): Record<string, unknown> | null {
  const paths = [
    join(process.cwd(), ".opencode", "channels.json"),
    join(homedir(), ".config", "opencode", "channels.json"),
  ];

  for (const configPath of paths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        return JSON.parse(content);
      } catch {
        continue;
      }
    }
  }
  return null;
}

let channel: Channel | null = null;
let permissionHandler: PermissionHandler | null = null;
let notificationHandler: NotificationHandler | null = null;
let pendingStore: PendingRequestsStore | null = null;

function createChannel(config: ChannelsConfig): Channel {
  switch (config.defaultChannel) {
    case "telegram":
      if (!config.telegram) {
        throw new Error("Telegram config required when defaultChannel is telegram");
      }
      return new TelegramChannel(config.telegram);

    case "slack":
      throw new Error("Slack channel not yet implemented");

    case "discord":
      throw new Error("Discord channel not yet implemented");

    default:
      throw new Error(`Unknown channel: ${config.defaultChannel}`);
  }
}

export async function activate(context: PluginContext): Promise<void> {
  const rawConfig = context.config ?? loadConfigFromFile();
  if (!rawConfig) {
    console.log("[ChannelsPlugin] No config found, plugin disabled");
    return;
  }
  const config = parseConfig(rawConfig);

  if (!config.enabled) {
    console.log("[ChannelsPlugin] Plugin disabled");
    return;
  }

  channel = createChannel(config);
  pendingStore = new PendingRequestsStore(config.timeout * 1000);
  permissionHandler = new PermissionHandler(channel, pendingStore);
  notificationHandler = new NotificationHandler(channel, config.notifications);

  await channel.start();
  console.log(`[ChannelsPlugin] Started with ${config.defaultChannel} channel`);

  // Skip hooks registration if hooks not available
  if (!context.hooks) {
    console.log("[ChannelsPlugin] Hooks not available, running in notification-only mode");
    return;
  }

  // Hook: permission.ask - intercept permission requests
  if (config.notifications.onPermission) {
    context.hooks.on("permission.ask", async (event: unknown) => {
      const { tool, args, sessionId } = event as {
        tool: string;
        args: unknown;
        sessionId: string;
      };

      try {
        const response = await permissionHandler!.handlePermissionRequest(
          tool,
          args,
          sessionId
        );
        return { handled: true, response };
      } catch (error) {
        console.error("[ChannelsPlugin] Permission request failed:", error);
        return { handled: false };
      }
    });
  }

  // Hook: session.complete - notify on task completion
  if (config.notifications.onComplete) {
    context.hooks.on("session.complete", async (event: unknown) => {
      const { sessionId, summary } = event as {
        sessionId: string;
        summary?: string;
      };
      await notificationHandler!.notifyComplete(sessionId, summary);
    });
  }

  // Hook: session.error - notify on errors
  if (config.notifications.onError) {
    context.hooks.on("session.error", async (event: unknown) => {
      const { sessionId, error } = event as {
        sessionId: string;
        error: string;
      };
      await notificationHandler!.notifyError(sessionId, error);
    });
  }

  // Hook: session.idle - notify on idle state
  if (config.notifications.onIdle) {
    context.hooks.on("session.idle", async (event: unknown) => {
      const { sessionId } = event as { sessionId: string };
      await notificationHandler!.notifyIdle(sessionId);
    });
  }
}

export async function deactivate(): Promise<void> {
  if (pendingStore) {
    pendingStore.clear();
    pendingStore = null;
  }

  if (channel) {
    await channel.stop();
    channel = null;
  }

  permissionHandler = null;
  notificationHandler = null;

  console.log("[ChannelsPlugin] Deactivated");
}

// Re-export types and utilities
export { parseConfig, validateConfig } from "./config/schema.js";
export type { ChannelsConfig } from "./config/schema.js";
export type { Channel, PermissionRequest, NotificationEvent } from "./types.js";
