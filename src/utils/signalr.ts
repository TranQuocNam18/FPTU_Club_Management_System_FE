import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_BASE_URL } from '../api/axios';

let connection: HubConnection | null = null;
const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL ?? `${API_BASE_URL}/gateway/hubs/notification`;

export const getSignalRConnection = (token: string): HubConnection => {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  return connection;
};

export const startSignalR = async (token: string) => {
  const conn = getSignalRConnection(token);
  if (conn.state === 'Disconnected') {
    try {
      await conn.start();
      console.log('SignalR Notification Hub connected.');
    } catch (err) {
      console.error('Error starting SignalR connection:', err);
    }
  }
};

export const stopSignalR = async () => {
  if (connection) {
    try {
      await connection.stop();
      console.log('SignalR Notification Hub disconnected.');
    } catch (err) {
      console.error('Error stopping SignalR connection:', err);
    }
    connection = null;
  }
};
