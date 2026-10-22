import { format, isToday, isTomorrow, startOfDay, endOfDay, parseISO, differenceInDays } from 'date-fns';

export const formatDate = (date: Date | number, pattern: string = 'MMM d, yyyy'): string => {
  return format(typeof date === 'number' ? new Date(date) : date, pattern);
};

export const formatTime = (date: Date | number): string => {
  return format(typeof date === 'number' ? new Date(date) : date, 'HH:mm');
};

export const formatDateTime = (date: Date | number): string => {
  return format(typeof date === 'number' ? new Date(date) : date, 'MMM d, yyyy HH:mm');
};

export const isDateToday = (date: Date | number): boolean => {
  return isToday(typeof date === 'number' ? new Date(date) : date);
};

export const isDateTomorrow = (date: Date | number): boolean => {
  return isTomorrow(typeof date === 'number' ? new Date(date) : date);
};

export const getStartOfDay = (date: Date | number): Date => {
  return startOfDay(typeof date === 'number' ? new Date(date) : date);
};

export const getEndOfDay = (date: Date | number): Date => {
  return endOfDay(typeof date === 'number' ? new Date(date) : date);
};

export const parseDateString = (dateStr: string): Date => {
  return parseISO(dateStr);
};

export const getDaysDifference = (from: Date | number, to: Date | number): number => {
  return differenceInDays(
    typeof to === 'number' ? new Date(to) : to,
    typeof from === 'number' ? new Date(from) : from
  );
};

export const getRelativeTimeString = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  
  if (isToday(d)) {
    return `Today at ${formatTime(d)}`;
  }
  
  if (isTomorrow(d)) {
    return `Tomorrow at ${formatTime(d)}`;
  }
  
  const diffDays = differenceInDays(d, now);
  if (diffDays > 0 && diffDays <= 7) {
    return format(d, 'EEEE at HH:mm');
  }
  
  return formatDateTime(d);
};

export const createDateAtTime = (date: Date, hours: number, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
};

export const getTimeString = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const getDateString = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};