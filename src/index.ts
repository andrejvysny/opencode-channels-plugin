import { parseConfig, type ChannelsConfig } from "./config/schema.js";
import { TelegramChannel } from "./channels/telegram.js";
import { PermissionHandler } from "./handlers/permission.js";
import { NotificationHandler } from "./handlers/notification.js";
import { PendingRequestsStore } from "./state/pending.js";
import type { Channel } from "./types.js";
import type { Plugin, PluginInput, Hooks } from "@opencode-ai/plugin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

function loadConfigFromFile(): Record<string, unknown> | null {
  const paths = [
    join(process.cwd(), ".opencode", "channels.json"),
    join(homedir(), ".config", "opencode", "channels.json"),
  ];

  for (const configPath of paths) {
    if (existsSync(configPath)) {
      try {
        const content = readFileSync(configPath, "utf-8");
        console.log(`[ChannelsPlugin] Loaded config from ${configPath}`);
        return JSON.parse(content);
      } catch {
        continue;
      }
    }
  }
  return null;
}

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

const ChannelsPlugin: Plugin = async (_input: PluginInput): Promise<Hooks> => {
  const rawConfig = loadConfigFromFile();

  if (!rawConfig) {
    console.log("[ChannelsPlugin] No config found, plugin disabled");
    return {};
  }

  const config = parseConfig(rawConfig);

  if (!config.enabled) {
    console.log("[ChannelsPlugin] Plugin disabled in config");
    return {};
  }

  const channel = createChannel(config);
  const pendingStore = new PendingRequestsStore(config.timeout * 1000);
  const permissionHandler = new PermissionHandler(channel, pendingStore);
  // TODO: Use notificationHandler for session events when OpenCode supports them
  void new NotificationHandler(channel, config.notifications);

  await channel.start();
  console.log(`[ChannelsPlugin] Started with ${config.defaultChannel} channel`);

  const hooks: Hooks = {};

  // Hook: permission.ask - intercept permission requests
  if (config.notifications.onPermission) {
    hooks["permission.ask"] = async (input, output) => {
      try {
        const response = await permissionHandler.handlePermissionRequest(
          input.title || input.type,
          input.metadata,
          input.sessionID
        );

        if (response === "allow") {
          output.status = "allow";
        } else if (response === "deny") {
          output.status = "deny";
        }
      } catch (error) {
        console.error("[ChannelsPlugin] Permission request failed:", error);
      }
    };
  }

  return hooks;
};

export default ChannelsPlugin;

// Re-export types and utilities
export { parseConfig, validateConfig } from "./config/schema.js";
export type { ChannelsConfig } from "./config/schema.js";
export type { Channel, PermissionRequest, NotificationEvent } from "./types.js";
