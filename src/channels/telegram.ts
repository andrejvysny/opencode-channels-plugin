import type { TelegramConfig } from "../config/schema.js";
import type { ChannelMessage, PermissionRequest } from "../types.js";
import { BaseChannel } from "./base.js";

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    reply_to_message?: { message_id: number };
  };
  callback_query?: {
    id: string;
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

interface TelegramResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export class TelegramChannel extends BaseChannel {
  name = "telegram";
  private config: TelegramConfig;
  private baseUrl: string;
  private lastUpdateId = 0;
  private pollingActive = false;
  private pollAbortController: AbortController | null = null;
  private pendingMessageIds: Map<string, number> = new Map();

  constructor(config: TelegramConfig) {
    super();
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async start(): Promise<void> {
    this.pollingActive = true;
    this.poll();
  }

  async stop(): Promise<void> {
    this.pollingActive = false;
    if (this.pollAbortController) {
      this.pollAbortController.abort();
      this.pollAbortController = null;
    }
  }

  private async poll(): Promise<void> {
    while (this.pollingActive) {
      try {
        this.pollAbortController = new AbortController();
        const updates = await this.getUpdates();

        for (const update of updates) {
          this.lastUpdateId = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          break;
        }
        console.error("[TelegramChannel] Polling error:", error);
        await this.sleep(5000);
      }
    }
  }

  private async getUpdates(): Promise<TelegramUpdate[]> {
    const url = `${this.baseUrl}/getUpdates?offset=${this.lastUpdateId}&timeout=30`;
    const response = await fetch(url, {
      signal: this.pollAbortController?.signal,
    });
    const data = (await response.json()) as TelegramResponse<TelegramUpdate[]>;

    if (!data.ok) {
      throw new Error(data.description || "Failed to get updates");
    }

    return data.result || [];
  }

  private async handleUpdate(update: TelegramUpdate): Promise<void> {
    if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query);
      return;
    }

    if (update.message?.text && update.message.reply_to_message) {
      const replyToId = update.message.reply_to_message.message_id.toString();
      const requestId = this.findRequestIdByMessageId(replyToId);

      if (requestId) {
        const response = this.parseResponse(update.message.text);
        this.notifyResponse(requestId, response);
      }
    }
  }

  private async handleCallbackQuery(query: {
    id: string;
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  }): Promise<void> {
    if (!query.message || !query.data) return;

    const messageId = query.message.message_id.toString();
    const requestId = this.findRequestIdByMessageId(messageId);

    if (requestId) {
      const response = this.parseResponse(query.data);
      this.notifyResponse(requestId, response);

      await this.answerCallbackQuery(query.id, `Response: ${response}`);
    }
  }

  private findRequestIdByMessageId(messageId: string): string | null {
    for (const [reqId, msgId] of this.pendingMessageIds) {
      if (msgId.toString() === messageId) {
        return reqId;
      }
    }
    return null;
  }

  private async answerCallbackQuery(
    queryId: string,
    text: string
  ): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: queryId, text }),
      });
    } catch {
      // Ignore errors for callback answers
    }
  }

  async send(message: ChannelMessage): Promise<void> {
    const body: Record<string, unknown> = {
      chat_id: this.config.chatId,
      text: message.text,
      parse_mode: message.parseMode || this.config.parseMode,
    };

    if (message.buttons?.length) {
      body.reply_markup = {
        inline_keyboard: [
          message.buttons.map((btn) => ({
            text: btn.text,
            callback_data: btn.callbackData,
          })),
        ],
      };
    }

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as TelegramResponse<unknown>;
    if (!data.ok) {
      throw new Error(data.description || "Failed to send message");
    }
  }

  async sendPermissionRequest(request: PermissionRequest): Promise<string> {
    const text = this.formatPermissionMessage(request);

    const body = {
      chat_id: this.config.chatId,
      text,
      parse_mode: this.config.parseMode,
      reply_markup: {
        inline_keyboard: [
          [
            { text: "✅ Allow", callback_data: "allow" },
            { text: "❌ Deny", callback_data: "deny" },
          ],
        ],
      },
    };

    const response = await fetch(`${this.baseUrl}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as TelegramResponse<{
      message_id: number;
    }>;
    if (!data.ok || !data.result) {
      throw new Error(data.description || "Failed to send permission request");
    }

    const messageId = data.result.message_id;
    this.pendingMessageIds.set(request.id, messageId);

    return request.id;
  }

  async updateMessage(messageId: string, content: string): Promise<void> {
    const telegramMsgId = this.pendingMessageIds.get(messageId);
    if (!telegramMsgId) return;

    try {
      await fetch(`${this.baseUrl}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          message_id: telegramMsgId,
          text: content,
          parse_mode: this.config.parseMode,
        }),
      });
    } catch {
      // Ignore errors for message updates
    }

    this.pendingMessageIds.delete(messageId);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
