import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Task } from '../types';
import { useTaskContext } from './TaskContext';
import {
  requestNotificationPermission,
  getNotificationPermissionState,
  scheduleAllNotifications,
  clearAllNotifications,
  rescheduleNotifications,
  testNotification,
} from '../utils/notifications';

interface NotificationContextValue {
  permission: { granted: boolean; denied: boolean };
  requesting: boolean;
  requestPermission: () => Promise<void>;
  testNotification: () => Promise<void>;
  reschedule: (tasks: Task[]) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { tasks } = useTaskContext();
  const [permission, setPermission] = useState(getNotificationPermissionState());
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const checkPermission = () => setPermission(getNotificationPermissionState());
    checkPermission();
    
    if ('Notification' in window && Notification.permission === 'default') {
      const handleVisibilityChange = () => {
        if (!document.hidden) checkPermission();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }
  }, []);

  useEffect(() => {
    if (permission.granted) {
      scheduleAllNotifications(tasks);
    }
    return () => clearAllNotifications();
  }, [tasks, permission.granted]);

  const requestPermission = useCallback(async () => {
    setRequesting(true);
    try {
      await requestNotificationPermission();
      setPermission(getNotificationPermissionState());
      if (permission.granted) {
        scheduleAllNotifications(tasks);
      }
    } finally {
      setRequesting(false);
    }
  }, [tasks, permission.granted]);

  const test = useCallback(async () => {
    await testNotification();
  }, []);

  const reschedule = useCallback((currentTasks: Task[]) => {
    if (permission.granted) {
      rescheduleNotifications(currentTasks);
    }
  }, [permission.granted]);

  return (
    <NotificationContext.Provider value={{ permission, requesting, requestPermission, testNotification: test, reschedule }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};