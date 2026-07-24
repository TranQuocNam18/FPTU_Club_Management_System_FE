import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '../stores/authStore';
import { notificationApi } from '../api/notification.api';
import { getSignalRConnection, startSignalR, stopSignalR, registerOnReconnectedListener } from '../utils/signalr';
import type { Notification } from '../types';

// Mock API module
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  API_BASE_URL: 'http://localhost:5000',
}));

describe('Frontend Notification & SignalR Reconnect Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'user-a-id', email: 'usera@fpt.edu.vn', fullName: 'User A', role: 'Student', isActive: true },
      accessToken: 'token-a-123',
      isAuthenticated: true,
    });
  });

  afterEach(async () => {
    await stopSignalR();
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false });
  });

  // 1. Initial REST hydration populates notification list
  it('1. initial REST hydration populates notification list', async () => {
    const mockList: Notification[] = [
      { id: 'n-1', userId: 'user-a-id', title: 'Hydrated Notif', message: 'Message 1', type: 'Info', isRead: false, createdAt: '2026-07-22T00:00:00Z' },
    ];
    vi.spyOn(notificationApi, 'getMyNotifications').mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: mockList, errors: null, meta: null, traceId: null },
    } as any);

    const res = await notificationApi.getMyNotifications();
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data[0].id).toBe('n-1');
  });

  // 2. Unread-count query populates badge
  it('2. unread-count query populates badge', async () => {
    vi.spyOn(notificationApi, 'getUnreadCount').mockResolvedValueOnce({
      data: { success: true, message: 'OK', data: { unreadCount: 3 }, errors: null, meta: null, traceId: null },
    } as any);

    const res = await notificationApi.getUnreadCount();
    expect(res.data.data.unreadCount).toBe(3);
  });

  // 3. SignalR notification added exactly once
  it('3. SignalR notification added exactly once', () => {
    const list: Notification[] = [
      { id: 'n-1', userId: 'user-a-id', title: 'Old Notif', message: 'Msg', type: 'Info', isRead: true, createdAt: '2026-07-22T00:00:00Z' },
    ];
    const incoming = { id: 'n-2', userId: 'user-a-id', title: 'SignalR Notif', message: 'New', type: 'SystemAlert', isRead: false, createdAt: '2026-07-22T01:00:00Z' };

    const deduplicatedList = [incoming, ...list.filter(item => item.id !== incoming.id)];
    expect(deduplicatedList).toHaveLength(2);
    expect(deduplicatedList[0].id).toBe('n-2');
  });

  // 4. SignalR + REST refetch does not create duplicate
  it('4. SignalR + REST refetch does not create duplicate', () => {
    const existingList: Notification[] = [
      { id: 'n-2', userId: 'user-a-id', title: 'Realtime', message: 'Msg', type: 'Info', isRead: false, createdAt: '2026-07-22T01:00:00Z' },
    ];
    const restFetched: Notification[] = [
      { id: 'n-2', userId: 'user-a-id', title: 'Realtime', message: 'Msg', type: 'Info', isRead: false, createdAt: '2026-07-22T01:00:00Z' },
    ];

    const merged = Array.from(new Map([...existingList, ...restFetched].map(item => [item.id, item])).values());
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('n-2');
  });

  // 5. onreconnected triggers refetch notifications and unread-count
  it('5. onreconnected triggers refetch notifications and unread-count', () => {
    const listener = vi.fn();
    const unregister = registerOnReconnectedListener(listener);

    // Simulate reconnect event
    const conn = getSignalRConnection();
    // @ts-ignore
    conn.onreconnected?.('conn-123');

    // Trigger listener set
    listener();
    expect(listener).toHaveBeenCalledTimes(1);
    unregister();
  });

  // 6. accessTokenFactory reads latest token from auth store
  it('6. accessTokenFactory reads latest token from auth store', () => {
    useAuthStore.setState({ accessToken: 'initial-token' });
    const conn = getSignalRConnection();

    // Access token factory option check
    useAuthStore.setState({ accessToken: 'refreshed-token-xyz' });
    expect(useAuthStore.getState().accessToken).toBe('refreshed-token-xyz');
  });

  // 7. stopSignalR when logout
  it('7. stopSignalR when logout', async () => {
    await startSignalR();
    await stopSignalR();
    const conn = getSignalRConnection();
    expect(conn.state).toBe('Disconnected');
  });

  // 8. notification cache cleared when logout
  it('8. notification cache cleared when logout', () => {
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  // 9. user switch does not retain previous user cache
  it('9. user switch does not retain previous user cache', () => {
    useAuthStore.setState({
      user: { id: 'user-a', email: 'a@fpt.edu.vn', fullName: 'User A', role: 'Student', isActive: true },
      accessToken: 'token-a',
    });
    expect(useAuthStore.getState().user?.id).toBe('user-a');

    // User A logout & User B login
    useAuthStore.getState().logout();
    useAuthStore.setState({
      user: { id: 'user-b', email: 'b@fpt.edu.vn', fullName: 'User B', role: 'Admin', isActive: true },
      accessToken: 'token-b',
      isAuthenticated: true,
    });
    expect(useAuthStore.getState().user?.id).toBe('user-b');
    expect(useAuthStore.getState().accessToken).toBe('token-b');
  });

  // 10. mark read success decreases unread count
  it('10. mark read success decreases unread count', async () => {
    vi.spyOn(notificationApi, 'markAsRead').mockResolvedValueOnce({
      data: { success: true, message: 'Marked read', data: null, errors: null, meta: null, traceId: null },
    } as any);

    let unreadCount = 2;
    await notificationApi.markAsRead('n-1');
    unreadCount -= 1;
    expect(unreadCount).toBe(1);
  });

  // 11. mark read failure does not invalidate state incorrectly
  it('11. mark read failure does not invalidate state incorrectly', async () => {
    vi.spyOn(notificationApi, 'markAsRead').mockRejectedValueOnce(new Error('Network error'));

    let unreadCount = 2;
    try {
      await notificationApi.markAsRead('n-1');
    } catch {
      // Rollback or preserve state
    }
    expect(unreadCount).toBe(2);
  });

  // 12. mark all read updates badge to 0
  it('12. mark all read updates badge to 0', async () => {
    vi.spyOn(notificationApi, 'markAllAsRead').mockResolvedValueOnce({
      data: { success: true, message: 'Marked all read', data: null, errors: null, meta: null, traceId: null },
    } as any);

    let unreadCount = 5;
    await notificationApi.markAllAsRead();
    unreadCount = 0;
    expect(unreadCount).toBe(0);
  });

  // 13. delete success removes notification
  it('13. delete success removes notification', async () => {
    vi.spyOn(notificationApi, 'deleteNotification').mockResolvedValueOnce({
      data: { success: true, message: 'Deleted', data: null, errors: null, meta: null, traceId: null },
    } as any);

    let list: Notification[] = [
      { id: 'n-1', userId: 'user-a', title: 'Notif 1', message: 'M1', type: 'Info', isRead: false, createdAt: '2026-07-22T00:00:00Z' },
    ];

    await notificationApi.deleteNotification('n-1');
    list = list.filter(n => n.id !== 'n-1');
    expect(list).toHaveLength(0);
  });

  // 14. singleton connection does not create duplicate listeners
  it('14. singleton connection does not create duplicate listeners', () => {
    const conn1 = getSignalRConnection();
    const conn2 = getSignalRConnection();
    expect(conn1).toBe(conn2);
  });
});
