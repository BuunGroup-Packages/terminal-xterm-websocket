/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onOpen?: (ws: WebSocket) => void;
  onMessage?: (event: MessageEvent) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onReconnecting?: (attempt: number, maxAttempts: number) => void;
  onMaxRetriesReached?: () => void;
}

export interface UseWebSocketReturn {
  ws: WebSocket | null;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  send: (data: string | ArrayBuffer) => void;
  reconnect: () => void;
  disconnect: () => void;
}

export function useWebSocket(
  url: string,
  options: WebSocketOptions = {}
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(false);

  // Track if initial connection has been made (prevents URL change effect from firing on mount)
  const hasConnectedRef = useRef(false);
  // Track if we're currently connecting (prevents duplicate connections)
  const isConnectingRef = useRef(false);

  // Store latest values in refs
  const urlRef = useRef(url);
  const optionsRef = useRef(options);
  const previousUrlRef = useRef(url);

  // Update refs when values change
  useEffect(() => {
    urlRef.current = url;
  }, [url]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const getReconnectDelay = useCallback((attempt: number) => {
    const { baseDelay = 1000, maxDelay = 30000 } = optionsRef.current;
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    return exponentialDelay + exponentialDelay * 0.25 * Math.random();
  }, []);

  // Ref to hold connect function for self-reference
  const connectFnRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    // Prevent duplicate connections
    if (isConnectingRef.current) {
      console.log('[useWebSocket] Already connecting, skipping');
      return;
    }

    isConnectingRef.current = true;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    console.log('[useWebSocket] Connecting to:', urlRef.current.split('?')[0] + '?token=***');

    const ws = new WebSocket(urlRef.current);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;
    setWsInstance(ws);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      console.log('[useWebSocket] Connected');
      isConnectingRef.current = false;
      hasConnectedRef.current = true;
      setIsConnected(true);
      setIsReconnecting(false);
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
      optionsRef.current.onOpen?.(ws);
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      optionsRef.current.onMessage?.(event);
    };

    ws.onclose = (event) => {
      if (!mountedRef.current) return;

      console.log('[useWebSocket] Closed, code:', event.code);
      isConnectingRef.current = false;
      setIsConnected(false);
      setWsInstance(null);

      // Only call onClose if this wasn't an intentional disconnect
      if (shouldReconnectRef.current) {
        optionsRef.current.onClose?.(event);
      }

      const { maxRetries = 10 } = optionsRef.current;

      // Don't auto-reconnect on certain close codes (e.g., auth failures)
      const noReconnectCodes = [4000, 4001, 4002, 4003];
      if (noReconnectCodes.includes(event.code)) {
        console.log('[useWebSocket] Not reconnecting due to close code:', event.code);
        setIsReconnecting(false);
        return;
      }

      if (shouldReconnectRef.current && reconnectAttemptsRef.current < maxRetries) {
        const delay = getReconnectDelay(reconnectAttemptsRef.current);
        console.log(`[useWebSocket] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxRetries})`);
        setIsReconnecting(true);
        reconnectAttemptsRef.current++;
        setReconnectAttempt(reconnectAttemptsRef.current);
        optionsRef.current.onReconnecting?.(reconnectAttemptsRef.current, maxRetries);

        reconnectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current && shouldReconnectRef.current) {
            connectFnRef.current();
          }
        }, delay);
      } else if (reconnectAttemptsRef.current >= maxRetries) {
        console.log('[useWebSocket] Max retries reached');
        setIsReconnecting(false);
        optionsRef.current.onMaxRetriesReached?.();
      }
    };

    ws.onerror = (event) => {
      if (!mountedRef.current) return;
      console.log('[useWebSocket] Error');
      isConnectingRef.current = false;
      optionsRef.current.onError?.(event);
    };
  }, [getReconnectDelay]);

  const send = useCallback((data: string | ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttemptsRef.current = 0;
    setReconnectAttempt(0);
    isConnectingRef.current = false; // Reset connecting flag
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    isConnectingRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsInstance(null);
    setIsConnected(false);
    setIsReconnecting(false);
  }, []);

  // Update connect ref after it's defined
  connectFnRef.current = connect;

  // Initial connection - runs once on mount
  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;
    hasConnectedRef.current = false;
    isConnectingRef.current = false;

    // Connect immediately (no delay needed)
    connectFnRef.current();

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;
      isConnectingRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []); // Empty deps - only run on mount

  // Reconnect when URL changes (e.g., token refresh)
  // Only triggers AFTER initial connection has been made
  useEffect(() => {
    // Always update previousUrlRef
    const urlChanged = previousUrlRef.current !== url;
    previousUrlRef.current = url;

    // Only reconnect if:
    // 1. URL actually changed
    // 2. We've already made the initial connection
    // 3. Component is still mounted
    if (urlChanged && hasConnectedRef.current && mountedRef.current) {
      console.log('[useWebSocket] URL changed, reconnecting with new token');
      reconnectAttemptsRef.current = 0;
      setReconnectAttempt(0);
      isConnectingRef.current = false; // Reset to allow new connection
      connectFnRef.current();
    }
  }, [url]);

  return {
    ws: wsInstance,
    isConnected,
    isReconnecting,
    reconnectAttempt,
    send,
    reconnect,
    disconnect,
  };
}
