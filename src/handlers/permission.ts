import type { Channel, PermissionRequest, PermissionResponse } from "../types.js";
import { PendingRequestsStore } from "../state/pending.js";

export class PermissionHandler {
  private channel: Channel;
  private pendingStore: PendingRequestsStore;

  constructor(channel: Channel, pendingStore: PendingRequestsStore) {
    this.channel = channel;
    this.pendingStore = pendingStore;

    this.channel.onResponse((messageId, response) => {
      this.handleResponse(messageId, response);
    });
  }

  async handlePermissionRequest(
    tool: string,
    args: unknown,
    sessionId: string
  ): Promise<PermissionResponse> {
    const request: PermissionRequest = {
      id: this.generateId(),
      sessionId,
      tool,
      args,
      timestamp: Date.now(),
    };

    const messageId = await this.channel.sendPermissionRequest(request);

    const responsePromise = this.pendingStore.add({
      id: request.id,
      sessionId,
      messageId,
      tool,
      args,
      timestamp: request.timestamp,
    });

    try {
      const response = await responsePromise;

      await this.channel.updateMessage(
        request.id,
        `✅ *Permission ${response === "allow" ? "Granted" : response === "deny" ? "Denied" : "Responded"}*\n\nTool: \`${tool}\`\nResponse: ${response}`
      );

      return response;
    } catch (error) {
      await this.channel.updateMessage(
        request.id,
        `⏱️ *Permission Timeout*\n\nTool: \`${tool}\`\nNo response received.`
      );
      throw error;
    }
  }

  private handleResponse(requestId: string, response: PermissionResponse): void {
    this.pendingStore.resolve(requestId, response);
  }

  private generateId(): string {
    return `perm_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
