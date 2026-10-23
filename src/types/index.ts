export type Tab = 'today' | 'future' | 'history';

export type Priority = 'low' | 'medium' | 'high';

export interface RecurrenceRule {
  freq: 'daily' | 'weekly' | 'monthly';
  interval: number;
  byDay?: number[];
  endDate?: number;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  tab: Tab;
  priority: Priority;
  tags: string[];
  description?: string;
  reminderAt?: number;
  recurrence?: RecurrenceRule;
  recurrenceParentId?: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  autoGenerateRecurring: boolean;
  recurringLookaheadDays: number;
  lastArchiveDate?: number;
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> & {
  id?: string;
};