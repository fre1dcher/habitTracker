import { useState, useEffect, useCallback } from 'react';
import type { Task } from '../types';
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  scheduleAllNotifications,
  clearAllNotifications,
  rescheduleNotifications,
  testNotification,
} from '../utils/notifications';

export const useNotifications = (tasks: Task[]) => {
  const [permission, setPermission] = useState<{ granted: boolean; denied: boolean }>({
    granted: false,
    denied: false,
  });
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      setPermission(getNotificationPermissionState());
    };
    
    checkPermission();
    
    if ('Notification' in window && Notification.permission === 'default') {
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          checkPermission();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  useEffect(() => {
    if (permission.granted) {
      scheduleAllNotifications(tasks);
    }
    
    return () => {
      clearAllNotifications();
    };
  }, [tasks, permission.granted]);

  const requestPermission = useCallback(async () => {
    setRequesting(true);
    try {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermissionState());
      if (granted) {
        scheduleAllNotifications(tasks);
      }
    } finally {
      setRequesting(false);
    }
  }, [tasks]);

  const test = useCallback(async () => {
    await testNotification();
  }, []);

  const reschedule = useCallback(() => {
    if (permission.granted) {
      rescheduleNotifications(tasks);
    }
  }, [tasks, permission.granted]);

  return {
    permission,
    requesting,
    requestPermission,
    test,
    reschedule,
  };
};