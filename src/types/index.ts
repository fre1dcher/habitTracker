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
  /** Set when the task was moved to History (archived at midnight). */
  archivedAt?: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  autoGenerateRecurring: boolean;
  recurringLookaheadDays: number;
  lastArchiveDate?: number;
  /** Seasonal "spooky" Halloween theme (easter egg). */
  halloween?: boolean;
}

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
}

export type TaskFormData = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'> & {
  id?: string;
};