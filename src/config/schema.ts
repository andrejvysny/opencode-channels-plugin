import { z } from "zod";

export const TelegramConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  chatId: z.string().min(1, "Chat ID is required"),
  parseMode: z.enum(["Markdown", "HTML"]).optional().default("Markdown"),
});

export const SlackConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  channelId: z.string().min(1, "Channel ID is required"),
  appToken: z.string().optional(),
});

export const DiscordConfigSchema = z.object({
  botToken: z.string().min(1, "Bot token is required"),
  channelId: z.string().min(1, "Channel ID is required"),
});

export const NotificationsConfigSchema = z.object({
  onPermission: z.boolean().default(true),
  onComplete: z.boolean().default(true),
  onError: z.boolean().default(true),
  onIdle: z.boolean().default(false),
});

export const ChannelsConfigSchema = z.object({
  enabled: z.boolean().default(true),
  defaultChannel: z.enum(["telegram", "slack", "discord"]).default("telegram"),
  telegram: TelegramConfigSchema.optional(),
  slack: SlackConfigSchema.optional(),
  discord: DiscordConfigSchema.optional(),
  notifications: NotificationsConfigSchema.default({}),
  timeout: z.number().min(10).max(3600).default(300),
});

export type TelegramConfig = z.infer<typeof TelegramConfigSchema>;
export type SlackConfig = z.infer<typeof SlackConfigSchema>;
export type DiscordConfig = z.infer<typeof DiscordConfigSchema>;
export type NotificationsConfig = z.infer<typeof NotificationsConfigSchema>;
export type ChannelsConfig = z.infer<typeof ChannelsConfigSchema>;

export function parseConfig(raw: unknown): ChannelsConfig {
  return ChannelsConfigSchema.parse(raw);
}

export function validateConfig(raw: unknown): {
  success: boolean;
  data?: ChannelsConfig;
  error?: z.ZodError;
} {
  const result = ChannelsConfigSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
