import { useState, useEffect, useCallback } from 'react';
import type { Task, Tab } from '../types';
import {
  getAllTasks,
  addTask,
  updateTask,
  deleteTask,
  deleteTasksByParent,
  clearAllTasks,
  exportData,
  importData,
} from '../db';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const loadedTasks = await getAllTasks();
      setTasks(loadedTasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>): Promise<Task> => {
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      order: Date.now(),
    };
    
    await addTask(newTask);
    setTasks(prev => [...prev, newTask]);
    return newTask;
  }, []);

  const updateTaskById = useCallback(async (id: string, updates: Partial<Task>): Promise<Task | null> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    
    const updated = { ...task, ...updates, updatedAt: Date.now() };
    await updateTask(updated);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [tasks]);

  const toggleTaskDone = useCallback(async (id: string): Promise<Task | null> => {
    const task = tasks.find(t => t.id === id);
    if (!task) return null;
    
    const updated = { ...task, done: !task.done, updatedAt: Date.now() };
    await updateTask(updated);
    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  }, [tasks]);

  const removeTask = useCallback(async (id: string): Promise<void> => {
    await deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const removeRecurringTasks = useCallback(async (parentId: string): Promise<void> => {
    await deleteTasksByParent(parentId);
    setTasks(prev => prev.filter(t => t.recurrenceParentId !== parentId));
  }, []);

  const moveTaskToTab = useCallback(async (id: string, tab: Tab): Promise<Task | null> => {
    return updateTaskById(id, { tab });
  }, [updateTaskById]);

  const reorderTasks = useCallback(async (taskIds: string[]): Promise<void> => {
    const updates = taskIds.map((id, index) => ({
      id,
      order: index,
      updatedAt: Date.now(),
    }));
    
    const db = await import('../db').then(m => m.getDB());
    if (db) {
      const tx = db.transaction('tasks', 'readwrite');
      await Promise.all(updates.map(u => tx.store.put({ ...tasks.find(t => t.id === u.id)!, ...u })));
      await tx.done;
    }
    
    setTasks(prev => {
      const taskMap = new Map(prev.map(t => [t.id, t]));
      return taskIds.map((id, index) => ({ ...taskMap.get(id)!, order: index }));
    });
  }, [tasks]);

  const clearAll = useCallback(async (): Promise<void> => {
    await clearAllTasks();
    setTasks([]);
  }, []);

  const exportAll = useCallback(async (): Promise<string> => {
    return exportData();
  }, []);

  const importAll = useCallback(async (json: string): Promise<void> => {
    await importData(json);
    await loadTasks();
  }, [loadTasks]);

  const getTasksForTab = useCallback((tab: Tab, showDone: boolean = false): Task[] => {
    return tasks
      .filter(t => t.tab === tab)
      .filter(t => showDone || !t.done)
      .sort((a, b) => a.order - b.order);
  }, [tasks]);

  const getDoneTasksForTab = useCallback((tab: Tab): Task[] => {
    return tasks
      .filter(t => t.tab === tab && t.done)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask: updateTaskById,
    toggleTaskDone,
    deleteTask: removeTask,
    deleteRecurringTasks: removeRecurringTasks,
    moveTaskToTab,
    reorderTasks,
    clearAll,
    exportData: exportAll,
    importData: importAll,
    getTasksForTab,
    getDoneTasksForTab,
  };
};