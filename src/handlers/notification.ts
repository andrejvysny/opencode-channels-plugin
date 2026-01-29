import type { Channel, NotificationEvent } from "../types.js";
import type { NotificationsConfig } from "../config/schema.js";

export class NotificationHandler {
  private channel: Channel;
  private config: NotificationsConfig;

  constructor(channel: Channel, config: NotificationsConfig) {
    this.channel = channel;
    this.config = config;
  }

  async notify(event: NotificationEvent): Promise<void> {
    if (!this.shouldNotify(event.type)) {
      return;
    }

    const message = this.formatNotification(event);
    await this.channel.send({ text: message, parseMode: "Markdown" });
  }

  async notifyComplete(sessionId: string, summary?: string): Promise<void> {
    await this.notify({
      type: "complete",
      sessionId,
      message: "Task completed",
      details: summary,
    });
  }

  async notifyError(sessionId: string, error: string): Promise<void> {
    await this.notify({
      type: "error",
      sessionId,
      message: "Error occurred",
      details: error,
    });
  }

  async notifyIdle(sessionId: string): Promise<void> {
    await this.notify({
      type: "idle",
      sessionId,
      message: "Session idle",
    });
  }

  private shouldNotify(type: NotificationEvent["type"]): boolean {
    switch (type) {
      case "complete":
        return this.config.onComplete;
      case "error":
        return this.config.onError;
      case "idle":
        return this.config.onIdle;
      default:
        return false;
    }
  }

  private formatNotification(event: NotificationEvent): string {
    const icon = this.getIcon(event.type);
    const lines = [`${icon} *${event.message}*`];

    if (event.sessionId) {
      lines.push(`Session: \`${event.sessionId.slice(0, 8)}...\``);
    }

    if (event.details) {
      lines.push("", "```", event.details.slice(0, 500), "```");
    }

    return lines.join("\n");
  }

  private getIcon(type: NotificationEvent["type"]): string {
    switch (type) {
      case "complete":
        return "✅";
      case "error":
        return "❌";
      case "idle":
        return "💤";
      default:
        return "📢";
    }
  }
}
