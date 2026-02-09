import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join, dirname } from "path";
import type { PendingPermission } from "../types.js";

export interface ChannelsState {
  enabled?: boolean;
  activeSessionId?: string;
  channels?: {
    telegram?: {
      lastUpdateId?: number;
    };
  };
  pendingPermissions?: PendingPermission[];
}

function getDefaultStatePath(): string {
  return join(homedir(), ".config", "opencode", "channels-state.json");
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

export class ChannelsStateStore {
  private statePath: string;
  private state: ChannelsState = {};

  constructor(statePath?: string) {
    this.statePath = statePath ?? getDefaultStatePath();
    this.state = this.load();
  }

  getState(): ChannelsState {
    return { ...this.state };
  }

  setEnabled(enabled: boolean): void {
    this.state.enabled = enabled;
    this.save();
  }

  isEnabled(defaultValue: boolean = false): boolean {
    if (typeof this.state.enabled === "boolean") {
      return this.state.enabled;
    }
    return defaultValue;
  }

  setActiveSessionId(sessionId?: string): void {
    if (sessionId) {
      this.state.activeSessionId = sessionId;
    } else {
      delete this.state.activeSessionId;
    }
    this.save();
  }

  getActiveSessionId(): string | undefined {
    return this.state.activeSessionId;
  }

  setTelegramLastUpdateId(lastUpdateId: number): void {
    if (!this.state.channels) this.state.channels = {};
    if (!this.state.channels.telegram) this.state.channels.telegram = {};
    this.state.channels.telegram.lastUpdateId = lastUpdateId;
    this.save();
  }

  getTelegramLastUpdateId(): number | undefined {
    return this.state.channels?.telegram?.lastUpdateId;
  }

  setPendingPermissions(pending: PendingPermission[]): void {
    this.state.pendingPermissions = pending;
    this.save();
  }

  getPendingPermissions(): PendingPermission[] {
    return this.state.pendingPermissions ?? [];
  }

  private load(): ChannelsState {
    if (!existsSync(this.statePath)) {
      return {};
    }
    try {
      const raw = readFileSync(this.statePath, "utf-8");
      return JSON.parse(raw) as ChannelsState;
    } catch {
      return {};
    }
  }

  private save(): void {
    const dir = dirname(this.statePath);
    ensureDir(dir);
    writeFileSync(this.statePath, JSON.stringify(this.state, null, 2) + "\n");
  }
}
