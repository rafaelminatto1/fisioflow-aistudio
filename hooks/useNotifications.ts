// hooks/useNotifications.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Notification } from '../types';
import * as notificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      await notificationService.generateRemindersIfNeeded(user);
      const data = await notificationService.getNotifications(userId);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      await notificationService.markAsRead(notificationId, userId);
    },
    [userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await notificationService.markAllAsRead(userId);
  }, [userId]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
};
