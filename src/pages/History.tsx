import { useState, useEffect } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { TaskRow } from '../components/TaskRow';
import { Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { Tab } from '../types';

export const History = () => {
  const { tasks, deleteTask, moveTaskToTab } = useTaskContext();
  
  const [groupedTasks, setGroupedTasks] = useState<Record<string, typeof tasks>>({});

  useEffect(() => {
    const doneTasks = tasks.filter(t => t.done);
    const grouped: Record<string, typeof tasks> = {};
    
    doneTasks.forEach(task => {
      const date = new Date(task.updatedAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    
    setGroupedTasks(grouped);
  }, [tasks]);

  const handleDelete = async (id: string) => {
    await deleteTask(id);
  };

  const handleRestore = async (id: string, tab: Tab) => {
    await moveTaskToTab(id, tab);
  };

  const dates = Object.keys(groupedTasks).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No history yet</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
          Completed tasks will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {dates.map(dateKey => {
          const dayTasks = groupedTasks[dateKey];
          const date = new Date(dateKey);
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          
          return (
            <div key={dateKey} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h3 className={clsx(
                  'text-xs font-semibold uppercase tracking-wider',
                  isToday ? 'text-primary' : 'text-gray-500 dark:text-gray-400'
                )}>
                  {isToday ? 'Today' : format(date, 'EEEE, MMM d, yyyy')}
                </h3>
                <span className="text-xs text-gray-400">{dayTasks.length} tasks</span>
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
                    onMoveToTab={handleRestore}
                    draggable={false}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};