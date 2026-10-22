import type { Task } from '../types';

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const getNotificationPermissionState = (): { granted: boolean; denied: boolean } => {
  if (!('Notification' in window)) {
    return { granted: false, denied: true };
  }
  
  return {
    granted: Notification.permission === 'granted',
    denied: Notification.permission === 'denied',
  };
};

const scheduledTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const scheduleNotification = (task: Task): void => {
  if (!task.reminderAt || task.done) return;
  
  const now = Date.now();
  const delay = task.reminderAt - now;
  
  if (delay <= 0) return;
  
  const existingTimeout = scheduledTimeouts.get(task.id);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  const timeoutId = setTimeout(() => {
    showNotification(task);
    scheduledTimeouts.delete(task.id);
  }, delay);
  
  scheduledTimeouts.set(task.id, timeoutId);
};

export const cancelNotification = (taskId: string): void => {
  const timeoutId = scheduledTimeouts.get(taskId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledTimeouts.delete(taskId);
  }
};

export const scheduleAllNotifications = (tasks: Task[]): void => {
  clearAllNotifications();
  
  const now = Date.now();
  const upcomingTasks = tasks.filter(
    task => task.reminderAt && !task.done && task.reminderAt > now
  );
  
  upcomingTasks.forEach(task => scheduleNotification(task));
};

export const clearAllNotifications = (): void => {
  scheduledTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
  scheduledTimeouts.clear();
};

export const rescheduleNotifications = (tasks: Task[]): void => {
  scheduleAllNotifications(tasks);
};

const showNotification = (task: Task): void => {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  
  const notification = new Notification(task.title, {
    body: task.description || 'Time to complete this task!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: task.id,
    requireInteraction: true,
    data: { taskId: task.id },
  });
  
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
  
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
};

export const testNotification = async (): Promise<void> => {
  const granted = await requestNotificationPermission();
  if (granted) {
    new Notification('Test Notification', {
      body: 'Notifications are working!',
      icon: '/icon-192.png',
    });
  }
};