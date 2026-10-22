import { useCallback } from 'react';
import type { Task } from '../types';
import { generateRecurringTasks, createNextRecurringTask } from '../utils/recurrence';
import { addTask } from '../db';

export const useRecurrence = () => {
  const generateForTask = useCallback(async (task: Task, lookaheadDays: number = 30): Promise<Task[]> => {
    const recurringTasks = generateRecurringTasks(task, lookaheadDays);
    
    for (const rt of recurringTasks) {
      await addTask(rt);
    }
    
    return recurringTasks;
  }, []);

  const createNext = useCallback(async (completedTask: Task): Promise<Task | null> => {
    const nextTask = createNextRecurringTask(completedTask);
    if (nextTask) {
      await addTask(nextTask);
    }
    return nextTask;
  }, []);

  return {
    generateForTask,
    createNext,
  };
};