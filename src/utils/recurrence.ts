import type { RecurrenceRule, Task } from '../types';
import { addDays } from 'date-fns';

export const getNextOccurrence = (date: Date, rule: RecurrenceRule): Date | null => {
  const current = new Date(date);
  const endDate = rule.endDate ? new Date(rule.endDate) : null;
  
  let next: Date;
  
  switch (rule.freq) {
    case 'daily':
      next = addDays(current, rule.interval);
      break;
    case 'weekly':
      if (rule.byDay && rule.byDay.length > 0) {
        next = getNextWeeklyOccurrence(current, rule.byDay, rule.interval);
      } else {
        next = addDays(current, 7 * rule.interval);
      }
      break;
    case 'monthly':
      next = addMonths(current, rule.interval);
      break;
    default:
      return null;
  }
  
  if (endDate && next > endDate) {
    return null;
  }
  
  return next;
};

const getNextWeeklyOccurrence = (date: Date, byDay: number[], interval: number): Date => {
  const currentDay = date.getDay();
  const sortedDays = [...byDay].sort((a, b) => a - b);
  
  let nextDay = sortedDays.find(d => d > currentDay);
  
  if (nextDay === undefined) {
    nextDay = sortedDays[0];
    return addDays(date, (7 - currentDay + nextDay) + (interval - 1) * 7);
  }
  
  return addDays(date, nextDay - currentDay);
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
};

export const generateRecurringTasks = (
  parentTask: Task,
  lookaheadDays: number = 30
): Task[] => {
  if (!parentTask.recurrence || !parentTask.reminderAt) {
    return [];
  }
  
  const tasks: Task[] = [];
  const now = new Date();
  const lookaheadEnd = addDays(now, lookaheadDays);
  let currentDate = new Date(parentTask.reminderAt);
  
  while (currentDate < lookaheadEnd) {
    const next = getNextOccurrence(currentDate, parentTask.recurrence);
    if (!next) break;
    
    currentDate = next;
    
    if (currentDate > now && currentDate < lookaheadEnd) {
      tasks.push({
        ...parentTask,
        id: `${parentTask.id}-recurring-${currentDate.getTime()}`,
        recurrenceParentId: parentTask.id,
        reminderAt: currentDate.getTime(),
        createdAt: currentDate.getTime(),
        updatedAt: currentDate.getTime(),
        done: false,
        tab: 'today',
      });
    }
  }
  
  return tasks;
};

export const createNextRecurringTask = (completedTask: Task): Task | null => {
  if (!completedTask.recurrence || !completedTask.reminderAt) {
    return null;
  }
  
  const nextDate = getNextOccurrence(new Date(completedTask.reminderAt), completedTask.recurrence);
  if (!nextDate) return null;
  
  return {
    ...completedTask,
    id: crypto.randomUUID(),
    reminderAt: nextDate.getTime(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    done: false,
    tab: 'today',
    recurrenceParentId: completedTask.recurrenceParentId || completedTask.id,
  };
};