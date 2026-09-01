import { RealtimeEvent, RealtimeConnectionStatus } from '../types';

type RealtimeListener = (event: RealtimeEvent) => void;
type StatusListener = (status: RealtimeConnectionStatus) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private currentTenantId: string | null = null;
  private status: RealtimeConnectionStatus = 'disconnected';
  private reconnectTimeout: any = null;
  private reconnectAttempts = 0;
  private isDestroyed = false;

  public getStatus(): RealtimeConnectionStatus {
    return this.status;
  }

  private setStatus(status: RealtimeConnectionStatus) {
    if (this.status !== status) {
      this.status = status;
      this.statusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (e) {
          console.error('Status listener error:', e);
        }
      });
    }
  }

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public connect(tenantId: string) {
    if (this.currentTenantId === tenantId && (this.ws?.readyState === WebSocket.OPEN || this.eventSource?.readyState === EventSource.OPEN)) {
      return;
    }

    this.disconnect();
    this.isDestroyed = false;
    this.currentTenantId = tenantId;
    this.reconnectAttempts = 0;

    this.connectWebSocket();
  }

  private connectWebSocket() {
    if (this.isDestroyed || !this.currentTenantId) return;

    this.setStatus('connecting');

    try {
      const isHttps = window.location.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${wsProtocol}//${host}/ws?tenantId=${encodeURIComponent(this.currentTenantId)}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          this.emitEvent(data);
        } catch (err) {
          console.warn('Realtime WS parse error:', err);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('Realtime WS connection warning:', err);
      };

      this.ws.onclose = (event) => {
        if (this.isDestroyed) return;
        this.ws = null;
        
        // If WS closes abruptly or fails repeatedly, try SSE fallback
        this.reconnectAttempts++;
        if (this.reconnectAttempts > 2) {
          this.connectSSE();
        } else {
          this.setStatus('connecting');
          this.scheduleReconnect(() => this.connectWebSocket(), 2000);
        }
      };
    } catch (e) {
      console.warn('WebSocket init failed, switching to SSE fallback:', e);
      this.connectSSE();
    }
  }

  private connectSSE() {
    if (this.isDestroyed || !this.currentTenantId) return;
    if (typeof EventSource === 'undefined') return;

    try {
      this.setStatus('fallback_sse');
      const sseUrl = `/api/realtime/events?tenantId=${encodeURIComponent(this.currentTenantId)}`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.setStatus('fallback_sse');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          this.emitEvent(data);
        } catch (err) {
          console.warn('Realtime SSE parse error:', err);
        }
      };

      this.eventSource.onerror = () => {
        if (this.isDestroyed) return;
        this.eventSource?.close();
        this.eventSource = null;
        this.setStatus('disconnected');
        this.scheduleReconnect(() => this.connectWebSocket(), 5000);
      };
    } catch (err) {
      console.warn('SSE fallback failed:', err);
      this.setStatus('disconnected');
    }
  }

  private scheduleReconnect(fn: () => void, delayMs: number) {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isDestroyed && this.currentTenantId) {
        fn();
      }
    }, delayMs);
  }

  private emitEvent(event: RealtimeEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Realtime listener error:', err);
      }
    });
  }

  public notifyDataChange(entity: RealtimeEvent['entity'], action: RealtimeEvent['action'] = 'sync', payload?: any) {
    if (this.currentTenantId) {
      const event: RealtimeEvent = {
        type: 'LOCAL_DATA_MUTATED',
        tenantId: this.currentTenantId,
        entity,
        action,
        payload,
        timestamp: new Date().toISOString(),
      };
      this.emitEvent(event);

      // If WS is open, send to other connected peers
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(event));
        } catch {
          // ignore
        }
      }
    }
  }

  public disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.setStatus('disconnected');
  }
}

export const realtimeService = new RealtimeClient();
