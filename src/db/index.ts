// @ts-nocheck
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task, Settings, Tab } from '../types';

type TaskIndexKeys = {
  'by-tab': Tab;
  'by-done': boolean;
  'by-reminder': number;
  'by-parent': string;
};

interface HabitTrackerDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: TaskIndexKeys;
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'habit-tracker-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<HabitTrackerDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<HabitTrackerDB>> => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<HabitTrackerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
      taskStore.createIndex('by-tab', 'tab');
      taskStore.createIndex('by-done', 'done');
      taskStore.createIndex('by-reminder', 'reminderAt');
      taskStore.createIndex('by-parent', 'recurrenceParentId');
      
      db.createObjectStore('settings', { keyPath: 'id' });
    },
  });
  
  return dbInstance;
};

export const getDB = (): IDBPDatabase<HabitTrackerDB> | null => dbInstance;

export const closeDB = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

const defaultSettings: Settings = {
  theme: 'system',
  notificationsEnabled: false,
  autoGenerateRecurring: true,
  recurringLookaheadDays: 30,
};

export const getSettings = async (): Promise<Settings> => {
  const db = await initDB();
  const settings = await db.get('settings', 'user-settings');
  return settings || defaultSettings;
};

export const saveSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  const db = await initDB();
  const current = await getSettings();
  const updated = { ...current, ...settings, id: 'user-settings' };
  await db.put('settings', updated);
  return updated;
};

export const getAllTasks = async (): Promise<Task[]> => {
  const db = await initDB();
  return db.getAll('tasks');
};

export const getTasksByTab = async (tab: Tab): Promise<Task[]> => {
  const db = await initDB();
  return db.getAllFromIndex('tasks', 'by-tab', tab);
};

export const getTasksByTabAndDone = async (tab: Tab, done: boolean): Promise<Task[]> => {
  const db = await initDB();
  const allTasks = await db.getAllFromIndex('tasks', 'by-tab', tab);
  return allTasks.filter(task => task.done === done);
};

export const getTask = async (id: string): Promise<Task | undefined> => {
  const db = await initDB();
  return db.get('tasks', id);
};

export const addTask = async (task: Task): Promise<Task> => {
  const db = await initDB();
  await db.put('tasks', task);
  return task;
};

export const updateTask = async (task: Task): Promise<Task> => {
  const db = await initDB();
  const updated = { ...task, updatedAt: Date.now() };
  await db.put('tasks', updated);
  return updated;
};

export const deleteTask = async (id: string): Promise<void> => {
  const db = await initDB();
  await db.delete('tasks', id);
};

export const deleteTasksByParent = async (parentId: string): Promise<void> => {
  const db = await initDB();
  const tasks = await db.getAllFromIndex('tasks', 'by-parent', parentId);
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all(tasks.map(task => tx.store.delete(task.id)));
  await tx.done;
};

export const clearAllTasks = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('tasks');
};

export const getUpcomingReminders = async (limit: number = 50): Promise<Task[]> => {
  const db = await initDB();
  const now = Date.now();
  const tasks = await db.getAllFromIndex('tasks', 'by-reminder', IDBKeyRange.lowerBound(now));
  return tasks
    .filter(task => !task.done)
    .sort((a, b) => (a.reminderAt || 0) - (b.reminderAt || 0))
    .slice(0, limit);
};

export const exportData = async (): Promise<string> => {
  const tasks = await getAllTasks();
  const settings = await getSettings();
  return JSON.stringify({ tasks, settings, exportedAt: Date.now() }, null, 2);
};

export const importData = async (json: string): Promise<void> => {
  const db = await initDB();
  const { tasks, settings } = JSON.parse(json);
  
  const tx = db.transaction(['tasks', 'settings'], 'readwrite');
  await Promise.all([
    tx.objectStore('tasks').clear(),
    tx.objectStore('settings').clear(),
  ]);
  
  await Promise.all(
    tasks.map((task: Task) => tx.objectStore('tasks').put(task))
  );
  
  if (settings) {
    await tx.objectStore('settings').put({ ...settings, id: 'user-settings' });
  }
  
  await tx.done;
};