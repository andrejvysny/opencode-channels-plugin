import type {
  Channel,
  ChannelMessage,
  PermissionRequest,
  ResponseCallback,
} from "../types.js";

export abstract class BaseChannel implements Channel {
  abstract name: string;
  protected responseCallbacks: ResponseCallback[] = [];

  abstract send(message: ChannelMessage): Promise<void>;
  abstract sendPermissionRequest(request: PermissionRequest): Promise<string>;
  abstract updateMessage(messageId: string, content: string): Promise<void>;
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  onResponse(callback: ResponseCallback): void {
    this.responseCallbacks.push(callback);
  }

  protected notifyResponse(messageId: string, response: string): void {
    for (const callback of this.responseCallbacks) {
      callback(messageId, response);
    }
  }

  protected formatPermissionMessage(request: PermissionRequest): string {
    const argsStr =
      typeof request.args === "string"
        ? request.args
        : JSON.stringify(request.args, null, 2);

    const truncatedArgs =
      argsStr.length > 500 ? argsStr.slice(0, 500) + "..." : argsStr;

    return [
      "🔔 *Permission Required*",
      "",
      `*Tool:* \`${request.tool}\``,
      "",
      "```",
      truncatedArgs,
      "```",
      "",
      "_Reply: ✅ allow | ❌ deny | custom text_",
    ].join("\n");
  }

  protected parseResponse(text: string): string {
    const normalized = text.toLowerCase().trim();

    if (
      normalized === "allow" ||
      normalized === "yes" ||
      normalized === "y" ||
      normalized === "✅"
    ) {
      return "allow";
    }

    if (
      normalized === "deny" ||
      normalized === "no" ||
      normalized === "n" ||
      normalized === "❌"
    ) {
      return "deny";
    }

    return text.trim();
  }
}
