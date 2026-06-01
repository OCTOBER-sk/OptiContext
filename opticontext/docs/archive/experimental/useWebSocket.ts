import { useEffect, useRef, useCallback, useState } from 'react';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url?: string;
  onMessage: (data: string) => void;
  enabled?: boolean;
}

export function useWebSocket({ url, onMessage, enabled = true }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [status, setStatus] = useState<ConnectionStatus>('idle');

  const connect = useCallback(() => {
    if (!url || !enabled) return;

    setStatus('connecting');
    const ws = new WebSocket(url);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      onMessage(event.data);
    };

    ws.onclose = () => {
      setStatus('disconnected');
      wsRef.current = null;
      reconnectTimer.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };

    wsRef.current = ws;
  }, [url, onMessage, enabled]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimer.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('idle');
  }, []);

  useEffect(() => {
    if (enabled && url) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [enabled, url, connect, disconnect]);

  return { status, disconnect, reconnect: connect };
}
