import { useState, useCallback } from 'react';
import type { Task, Tab } from '../types';
import { TaskRow } from './TaskRow';
import { Plus, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface TaskListProps {
  tasks: Task[];
  doneTasks: Task[];
  tab: Tab;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onMoveToTab: (id: string, tab: Tab) => void;
  onAddTask: () => void;
  showDone?: boolean;
  emptyMessage?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const TaskList = ({
  tasks,
  doneTasks,
  tab,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveToTab,
  onAddTask,
  showDone = false,
  emptyMessage,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TaskListProps) => {
  const [showCompleted, setShowCompleted] = useState(showDone);

  const handleDrop = useCallback((e: React.DragEvent, targetTask: Task) => {
    if (onDrop) {
      onDrop(e, targetTask);
    }
  }, [onDrop]);

  if (tasks.length === 0 && doneTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
          {tab === 'today' ? 'No tasks for today' : 'No future tasks'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
          {emptyMessage || (tab === 'today' 
            ? 'Add your first task to get started!' 
            : 'Tasks you want to remember for later will appear here.')
          }
        </p>
        <button
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100dvh-13rem)]">
      <div className="space-y-2">
      {tasks.length > 0 && (
        <>
          <div className="flex items-center justify-between px-2 pb-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {tab === 'today' ? 'Today' : 'Future'} ({tasks.length})
            </h4>
          </div>
          <div className="space-y-1">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onMoveToTab={onMoveToTab}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={handleDrop}
                onDragEnd={onDragEnd}
              />
            ))}
          </div>
        </>
      )}

      {(doneTasks.length > 0 || showCompleted) && (
        <details className={clsx('group', showCompleted && 'open')}>
          <summary className="flex items-center justify-between px-2 py-2 cursor-pointer list-none">
            <span className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({doneTasks.length})
            </span>
            <span className="transition-transform group-open:rotate-180">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </summary>
          <div className="space-y-1 pb-2 animate-slide-down">
            {doneTasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                onMoveToTab={onMoveToTab}
                draggable={false}
              />
            ))}
          </div>
        </details>
      )}

      {tasks.length === 0 && doneTasks.length > 0 && !showCompleted && (
        <button
          onClick={() => setShowCompleted(true)}
          className="w-full py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
        >
          Show completed tasks
        </button>
      )}
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={onAddTask}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>
    </div>
  );
};