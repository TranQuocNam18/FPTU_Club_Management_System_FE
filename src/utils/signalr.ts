import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;

export const getSignalRConnection = (token: string): HubConnection => {
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl('http://localhost:5004/hubs/notification', {
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
