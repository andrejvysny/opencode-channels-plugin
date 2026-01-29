import type { PendingRequest, PermissionResponse } from "../types.js";

export class PendingRequestsStore {
  private requests: Map<string, PendingRequest> = new Map();
  private timeoutMs: number;

  constructor(timeoutMs: number = 300_000) {
    this.timeoutMs = timeoutMs;
  }

  add(request: Omit<PendingRequest, "resolver" | "rejecter">): Promise<PermissionResponse> {
    return new Promise((resolve, reject) => {
      const pending: PendingRequest = {
        ...request,
        resolver: resolve,
        rejecter: reject,
      };

      this.requests.set(request.id, pending);

      setTimeout(() => {
        if (this.requests.has(request.id)) {
          this.requests.delete(request.id);
          reject(new Error(`Permission request timeout: ${request.id}`));
        }
      }, this.timeoutMs);
    });
  }

  resolve(id: string, response: PermissionResponse): boolean {
    const request = this.requests.get(id);
    if (!request) return false;

    this.requests.delete(id);
    request.resolver(response);
    return true;
  }

  reject(id: string, error: Error): boolean {
    const request = this.requests.get(id);
    if (!request) return false;

    this.requests.delete(id);
    request.rejecter(error);
    return true;
  }

  get(id: string): PendingRequest | undefined {
    return this.requests.get(id);
  }

  has(id: string): boolean {
    return this.requests.has(id);
  }

  getAll(): PendingRequest[] {
    return Array.from(this.requests.values());
  }

  clear(): void {
    for (const request of this.requests.values()) {
      request.rejecter(new Error("Store cleared"));
    }
    this.requests.clear();
  }

  setTimeoutMs(ms: number): void {
    this.timeoutMs = ms;
  }
}

export const pendingRequests = new PendingRequestsStore();
