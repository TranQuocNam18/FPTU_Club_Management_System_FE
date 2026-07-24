import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { API_BASE_URL } from '../api/axios';
import { useAuthStore } from '../stores/authStore';

let connection: HubConnection | null = null;
const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL ?? `${API_BASE_URL}/gateway/hubs/notification`;

type ReconnectCallback = () => void;
const reconnectListeners: Set<ReconnectCallback> = new Set();

export const registerOnReconnectedListener = (callback: ReconnectCallback): (() => void) => {
  reconnectListeners.add(callback);
  return () => {
    reconnectListeners.delete(callback);
  };
};

export const getSignalRConnection = (): HubConnection => {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      accessTokenFactory: () => {
        const storeToken = useAuthStore.getState().accessToken;
        return storeToken ?? '';
      },
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build();

  connection.onreconnecting((error) => {
    console.warn('[SignalR] Connection lost. Reconnecting...', error);
  });

  connection.onreconnected((connectionId) => {
    console.log('[SignalR] Reconnected successfully. Connection ID:', connectionId);
    // Trigger REST reconciliation for missed notifications
    reconnectListeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('[SignalR] Error in reconnect listener:', err);
      }
    });
  });

  connection.onclose((error) => {
    console.warn('[SignalR] Connection closed.', error);
  });

  return connection;
};

export const startSignalR = async (): Promise<HubConnection | null> => {
  const token = useAuthStore.getState().accessToken;
  if (!token) {
    console.warn('[SignalR] Cannot start SignalR: No access token available.');
    return null;
  }

  const conn = getSignalRConnection();
  if (conn.state === HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log('[SignalR] Notification Hub connected successfully.');
    } catch (err) {
      console.error('[SignalR] Initial connection failed. Automatic retry will handle reconnection:', err);
    }
  }
  return conn;
};

export const stopSignalR = async () => {
  if (connection) {
    try {
      if (connection.state !== HubConnectionState.Disconnected) {
        await connection.stop();
        console.log('[SignalR] Notification Hub disconnected cleanly.');
      }
    } catch (err) {
      console.error('[SignalR] Error stopping connection:', err);
    }
    connection = null;
  }
};
