import { createContext, useContext, useReducer, type ReactNode, useEffect, useRef } from 'react';
import type { Task, Tab } from '../types';
import { getAllTasks, addTask, deleteTask as dbDeleteTask, deleteTasksByParent, clearAllTasks } from '../db';
import { scheduleAllNotifications, clearAllNotifications } from '../utils/notifications';
import { createNextRecurringTask } from '../utils/recurrence';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'DELETE_RECURRING'; payload: string }
  | { type: 'REORDER_TASKS'; payload: { id: string; order: number }[] };

const initialState: TaskState = {
  tasks: [],
  loading: true,
  error: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, loading: false };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    case 'DELETE_RECURRING':
      return { ...state, tasks: state.tasks.filter(t => t.recurrenceParentId !== action.payload) };
    case 'REORDER_TASKS':
      const orderMap = new Map(action.payload.map(({ id, order }) => [id, order]));
      return {
        ...state,
        tasks: state.tasks.map(t => orderMap.has(t.id) ? { ...t, order: orderMap.get(t.id)! } : t),
      };
    default:
      return state;
  }
}

interface TaskContextValue extends TaskState {
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task | null>;
  toggleTaskDone: (id: string) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  deleteRecurringTasks: (parentId: string) => Promise<void>;
  moveTaskToTab: (id: string, tab: Tab) => Promise<Task | null>;
  archiveCompletedTasks: () => Promise<void>;
  reorderTasks: (taskOrders: { id: string; order: number }[]) => Promise<void>;
  clearAll: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  getTasksForTab: (tab: Tab, showDone?: boolean) => Task[];
  getDoneTasksForTab: (tab: Tab) => Task[];
  getUpcomingReminders: () => Promise<Task[]>;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const tasks = await getAllTasks();
      dispatch({ type: 'SET_TASKS', payload: tasks });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      console.error(err);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: Date.now(),
    };
    await addTask(newTask);
    dispatch({ type: 'ADD_TASK', payload: newTask });
    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return null;
    
    const updated = { ...task, ...updates, updatedAt: Date.now() };
    await addTask(updated);
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    return updated;
  };

  const toggleTaskDone = async (id: string): Promise<Task | null> => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return null;
    
    const updated = { ...task, done: !task.done, updatedAt: Date.now() };
    await addTask(updated);
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    
    if (updated.done && updated.recurrence && updated.reminderAt) {
      const nextTask = createNextRecurringTask(updated);
      if (nextTask) {
        await addTask(nextTask);
        dispatch({ type: 'ADD_TASK', payload: nextTask });
      }
    }
    
    return updated;
  };

  const deleteTask = async (id: string): Promise<void> => {
    await dbDeleteTask(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const deleteRecurringTasks = async (parentId: string): Promise<void> => {
    await deleteTasksByParent(parentId);
    dispatch({ type: 'DELETE_RECURRING', payload: parentId });
  };

  const moveTaskToTab = async (id: string, tab: Tab): Promise<Task | null> => {
    return updateTask(id, { tab });
  };

  const reorderTasks = async (taskOrders: { id: string; order: number }[]): Promise<void> => {
    dispatch({ type: 'REORDER_TASKS', payload: taskOrders });
    
    const db = await import('../db').then(m => m.getDB());
    if (db) {
      const tx = db.transaction('tasks', 'readwrite');
      await Promise.all(
        taskOrders.map(({ id, order }) => {
          const task = state.tasks.find(t => t.id === id);
          if (task) {
            return tx.store.put({ ...task, order, updatedAt: Date.now() });
          }
        })
      );
      await tx.done;
    }
  };

  const clearAll = async (): Promise<void> => {
    await clearAllTasks();
    dispatch({ type: 'SET_TASKS', payload: [] });
  };

  const exportData = async (): Promise<string> => {
    return exportData();
  };

  const importData = async (json: string): Promise<void> => {
    await importData(json);
    await loadTasks();
  };

  const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

  // Keep a live reference to the latest tasks so the midnight timer below
  // always archives the current list (avoids stale closures).
  const tasksRef = useRef(state.tasks);
  tasksRef.current = state.tasks;

  // Move tasks that were completed on a previous day into History.
  // Tasks completed *today* stay in the "Completed" section until midnight.
  const archiveCompletedTasks = async (): Promise<void> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const cutoff = todayStart.getTime();

    const toArchive = tasksRef.current.filter(
      t => t.done && t.tab !== 'history' && t.updatedAt < cutoff
    );
    if (toArchive.length === 0) return;

    const archivedAt = Date.now();
    const archivedIds = new Set(toArchive.map(t => t.id));

    const db = await import('../db').then(m => m.getDB());
    if (db) {
      const tx = db.transaction('tasks', 'readwrite');
      await Promise.all(
        toArchive.map(t => tx.store.put({ ...t, tab: 'history' as const, archivedAt }))
      );
      await tx.done;
    }

    dispatch({
      type: 'SET_TASKS',
      payload: tasksRef.current.map(t =>
        archivedIds.has(t.id) ? { ...t, tab: 'history' as const, archivedAt } : t
      ),
    });
  };

  const getTasksForTab = (tab: Tab, showDone: boolean = false): Task[] => {
    return state.tasks
      .filter(t => t.tab === tab)
      .filter(t => showDone || !t.done)
      .sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.order - b.order;
      });
  };

  const getDoneTasksForTab = (tab: Tab): Task[] => {
    return state.tasks
      .filter(t => t.tab === tab && t.done)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  };

  const getUpcoming = async (): Promise<Task[]> => {
    const db = await import('../db').then(m => m.getDB());
    if (!db) return [];
    const now = Date.now();
    const tasks = await db.getAllFromIndex('tasks', 'by-reminder', IDBKeyRange.lowerBound(now));
    return tasks
      .filter(task => !task.done)
      .sort((a, b) => (a.reminderAt || 0) - (b.reminderAt || 0))
      .slice(0, 50);
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Archive yesterday's completed tasks on load, then again at every midnight
  // while the app stays open.
  useEffect(() => {
    if (state.loading) return;

    archiveCompletedTasks();

    let timer: ReturnType<typeof setTimeout>;
    const scheduleMidnight = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setHours(24, 0, 1, 0); // 00:00:01 next day
      timer = setTimeout(async () => {
        await archiveCompletedTasks();
        scheduleMidnight();
      }, nextMidnight.getTime() - now.getTime());
    };
    scheduleMidnight();

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.loading]);

  useEffect(() => {
    if (!state.loading && state.tasks.length > 0) {
      scheduleAllNotifications(state.tasks);
    }
    return () => clearAllNotifications();
  }, [state.tasks, state.loading]);

  const value: TaskContextValue = {
    ...state,
    loadTasks,
    createTask,
    updateTask,
    toggleTaskDone,
    deleteTask,
    deleteRecurringTasks,
    moveTaskToTab,
    archiveCompletedTasks,
    reorderTasks,
    clearAll,
    exportData,
    importData,
    getTasksForTab,
    getDoneTasksForTab,
    getUpcomingReminders: getUpcoming,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTaskContext = (): TaskContextValue => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};