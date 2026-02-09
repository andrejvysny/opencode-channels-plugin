import type { PluginInput } from "@opencode-ai/plugin";
import type { Channel, ChannelIncomingMessage } from "../types.js";
import { ChannelsStateStore } from "../state/state.js";

export class RemoteController {
  private channel: Channel;
  private client: PluginInput["client"];
  private stateStore: ChannelsStateStore;
  private directory: string;
  private enabled: boolean;

  constructor(
    channel: Channel,
    client: PluginInput["client"],
    stateStore: ChannelsStateStore,
    directory: string,
    enabled: boolean
  ) {
    this.channel = channel;
    this.client = client;
    this.stateStore = stateStore;
    this.directory = directory;
    this.enabled = enabled;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.stateStore.setEnabled(enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async handleIncoming(message: ChannelIncomingMessage): Promise<void> {
    const text = message.text.trim();
    if (!this.enabled) return;
    if (!text) return;

    if (text.startsWith("/")) {
      await this.handleCommand(text.slice(1));
      return;
    }

    const sessionId = this.stateStore.getActiveSessionId();
    if (!sessionId) {
      await this.channel.send({
        text: "No active session. Use `/list` then `/use <sessionId>`.",
        parseMode: "Markdown",
      });
      return;
    }

    try {
      await this.client.session.prompt({
        path: { id: sessionId },
        query: { directory: this.directory },
        body: {
          parts: [
            {
              type: "text",
              text,
            },
          ],
        },
      });
    } catch (error) {
      await this.channel.send({
        text: `❌ Failed to send message: ${String(error)}`,
        parseMode: "Markdown",
      });
    }
  }

  private async handleCommand(raw: string): Promise<void> {
    const [command, ...args] = raw.trim().split(/\s+/);
    switch (command) {
      case "help":
        await this.channel.send({
          text: [
            "*Commands*",
            "",
            "`/list` - list recent sessions",
            "`/use <sessionId>` - set active session",
            "`/status` - show current status",
          ].join("\n"),
          parseMode: "Markdown",
        });
        return;
      case "status":
        await this.channel.send({
          text: this.formatStatus(),
          parseMode: "Markdown",
        });
        return;
      case "list":
        await this.sendSessionList();
        return;
      case "use":
        if (!args.length) {
          await this.channel.send({
            text: "Usage: `/use <sessionId>`",
            parseMode: "Markdown",
          });
          return;
        }
        await this.setActiveSession(args[0]);
        return;
      default:
        await this.channel.send({
          text: "Unknown command. Use `/help`.",
          parseMode: "Markdown",
        });
        return;
    }
  }

  private formatStatus(): string {
    const sessionId = this.stateStore.getActiveSessionId();
    return [
      "*Channels Status*",
      "",
      `Enabled: \`${this.enabled ? "yes" : "no"}\``,
      `Active session: \`${sessionId ?? "none"}\``,
    ].join("\n");
  }

  private async sendSessionList(): Promise<void> {
    const result = await this.client.session.list({
      query: { directory: this.directory },
    });
    const sessions = result.data ?? [];
    const sorted = sessions.sort((a, b) => b.time.updated - a.time.updated);
    const top = sorted.slice(0, 5);
    if (top.length === 0) {
      await this.channel.send({
        text: "No sessions found.",
        parseMode: "Markdown",
      });
      return;
    }
    const lines = ["*Recent Sessions*"];
    const active = this.stateStore.getActiveSessionId();
    for (const session of top) {
      const suffix = active === session.id ? " (active)" : "";
      lines.push(
        `\`${session.id.slice(0, 8)}\` - ${session.title || "Untitled"}${suffix}`
      );
    }
    lines.push("", "Use `/use <sessionId>` to select.");
    await this.channel.send({ text: lines.join("\n"), parseMode: "Markdown" });
  }

  private async setActiveSession(sessionIdPrefix: string): Promise<void> {
    const result = await this.client.session.list({
      query: { directory: this.directory },
    });
    const sessions = result.data ?? [];
    const matches = sessions.filter((session) =>
      session.id.startsWith(sessionIdPrefix)
    );
    if (matches.length === 0) {
      await this.channel.send({
        text: "Session not found. Use `/list` to see recent sessions.",
        parseMode: "Markdown",
      });
      return;
    }
    if (matches.length > 1) {
      await this.channel.send({
        text: "Multiple matches. Use a longer session ID prefix.",
        parseMode: "Markdown",
      });
      return;
    }
    const session = matches[0];
    this.stateStore.setActiveSessionId(session.id);
    await this.channel.send({
      text: `Active session set to \`${session.id.slice(0, 8)}\``,
      parseMode: "Markdown",
    });
  }
}
