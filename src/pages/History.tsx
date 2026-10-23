import { useMemo } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { TaskRow } from '../components/TaskRow';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { format, isToday as isTodayFn, isYesterday } from 'date-fns';

export const History = () => {
  const { tasks, deleteTask } = useTaskContext();

  // Only archived tasks live in History. Group them by the day they were completed.
  const grouped = useMemo(() => {
    const map: Record<string, typeof tasks> = {};
    tasks
      .filter(t => t.tab === 'history')
      .forEach(task => {
        const dateKey = format(new Date(task.updatedAt), 'yyyy-MM-dd');
        (map[dateKey] ||= []).push(task);
      });
    // newest task first within each day
    Object.values(map).forEach(list => list.sort((a, b) => b.updatedAt - a.updatedAt));
    return map;
  }, [tasks]);

  const dates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No history yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
          Completed tasks move here automatically at midnight.
        </p>
      </div>
    );
  }

  const labelFor = (date: Date) => {
    if (isTodayFn(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      {dates.map(dateKey => {
        const dayTasks = grouped[dateKey];
        const date = new Date(dateKey);
        const highlight = isTodayFn(date) || isYesterday(date);

        return (
          <div key={dateKey} className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <h3 className={clsx(
                'text-xs font-semibold uppercase tracking-wider',
                highlight ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
              )}>
                {labelFor(date)}
              </h3>
              <span className="text-xs text-gray-400">
                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>
            <div className="space-y-1">
              {dayTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => {}}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                  onDuplicate={() => {}}
                  onMoveToTab={() => {}}
                  draggable={false}
                  historyMode
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
