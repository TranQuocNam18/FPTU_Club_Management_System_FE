import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

let connection: HubConnection | null = null;
let operation: Promise<void> = Promise.resolve();
let latestToken = '';
export type RealtimeState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
const stateListeners = new Set<(state: RealtimeState) => void>();
let realtimeState: RealtimeState = 'disconnected';
const signalRUrl = import.meta.env.VITE_SIGNALR_URL
  ?? 'http://localhost:5000/gateway/hubs/notification';

function publishState(state: RealtimeState) {
  realtimeState = state;
  stateListeners.forEach((listener) => listener(state));
}

export function subscribeRealtimeState(listener: (state: RealtimeState) => void) {
  stateListeners.add(listener);
  listener(realtimeState);
  return () => {
    stateListeners.delete(listener);
  };
}

export const getSignalRConnection = (token: string): HubConnection => {
  latestToken = token;
  if (connection) return connection;

  connection = new HubConnectionBuilder()
    .withUrl(signalRUrl, {
      accessTokenFactory: () => latestToken,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Information)
    .build();

  connection.onreconnecting(() => publishState('reconnecting'));
  connection.onreconnected(() => publishState('connected'));
  connection.onclose(() => publishState('disconnected'));

  return connection;
};

export const startSignalR = (token: string): Promise<void> => {
  operation = operation.then(async () => {
    const conn = getSignalRConnection(token);
    if (conn.state === 'Disconnected') {
      try {
        publishState('connecting');
        await conn.start();
        publishState('connected');
        console.log('SignalR Notification Hub connected.');
      } catch (error) {
        publishState('disconnected');
        console.warn('SignalR is temporarily unavailable; REST notifications remain active.', error);
      }
    }
  });
  return operation;
};

export const stopSignalR = (): Promise<void> => {
  operation = operation.then(async () => {
    if (connection) {
      try {
        await connection.stop();
      } catch (error) {
        console.warn('SignalR cleanup did not complete normally.', error);
      }
      connection = null;
      latestToken = '';
      publishState('disconnected');
    }
  });
  return operation;
};
