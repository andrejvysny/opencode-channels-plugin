export interface ChannelMessage {
  text: string;
  parseMode?: "Markdown" | "HTML";
  buttons?: MessageButton[];
}

export interface MessageButton {
  text: string;
  callbackData: string;
}

export interface PermissionRequest {
  id: string;
  sessionId: string;
  tool: string;
  args: unknown;
  description?: string;
  timestamp: number;
}

export interface PendingRequest {
  id: string;
  sessionId: string;
  messageId: string;
  tool: string;
  args: unknown;
  timestamp: number;
  resolver: (response: PermissionResponse) => void;
  rejecter: (error: Error) => void;
}

export type PermissionResponse = "allow" | "deny" | string;

export type ResponseCallback = (
  messageId: string,
  response: PermissionResponse
) => void;

export interface Channel {
  name: string;
  send(message: ChannelMessage): Promise<void>;
  sendPermissionRequest(request: PermissionRequest): Promise<string>;
  updateMessage(messageId: string, content: string): Promise<void>;
  onResponse(callback: ResponseCallback): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface NotificationEvent {
  type: "complete" | "error" | "idle";
  sessionId?: string;
  message: string;
  details?: string;
}
