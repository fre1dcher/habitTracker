import type { Task, Tab } from '../types';
import { CheckCircle2, MoreVertical, Bell, Repeat, Calendar, ChevronDown, Trash2, Pencil, Copy, ArrowRightLeft } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useState } from 'react';

interface TaskRowProps {
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (task: Task) => void;
  onMoveToTab: (id: string, tab: Tab) => void;
  onDragStart?: (e: React.DragEvent, task: Task) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, task: Task) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  draggable?: boolean;
  /** History rows are read-only: the menu offers only "Delete". */
  historyMode?: boolean;
}

const PRIORITY_COLORS = {
  high: 'bg-danger-light text-danger dark:bg-danger/20 dark:text-danger border-danger/20',
  medium: 'bg-warning-light text-warning dark:bg-warning/20 dark:text-warning border-warning/20',
  low: 'bg-success-light text-success dark:bg-success/20 dark:text-success border-success/20',
};

const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const TAG_COLORS = [
  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
];

const getTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash) + tag.charCodeAt(i);
    hash |= 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
};

export const TaskRow = ({
  task,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveToTab,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  draggable = false,
  historyMode = false,
}: TaskRowProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart?.(e, task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== task.id) {
      onDrop?.(e, task);
    }
    setIsDragging(false);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  const formatReminder = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (taskDate.getTime() === today.getTime()) {
      return `Today ${format(date, 'HH:mm')}`;
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (taskDate.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${format(date, 'HH:mm')}`;
    }
    
    return format(date, 'MMM d, HH:mm');
  };

  return (
    <div
      className={clsx(
        'group relative flex items-center gap-3 p-4 card transition-all duration-200',
        task.done && 'opacity-60',
        isDragging && 'opacity-50 rotate-1 shadow-lg',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
    >
      <button
        onClick={() => !historyMode && onToggle(task.id)}
        disabled={historyMode}
        className={clsx(
          'flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all',
          task.done
            ? 'bg-success border-success text-white'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 text-transparent',
          historyMode && 'cursor-default'
        )}
        aria-label={task.done ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.done && <CheckCircle2 className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <h3 className={clsx(
            'flex-1 text-base font-medium break-words transition-colors',
            task.done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'
          )}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={clsx(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              PRIORITY_COLORS[task.priority]
            )}>
              {PRIORITY_LABELS[task.priority]}
            </span>
            
            {task.tags?.map(tag => (
              <span key={tag} className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                getTagColor(tag)
              )}>
                {tag}
              </span>
            ))}
            
            {task.reminderAt && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                <Bell className="w-3 h-3" />
                {formatReminder(task.reminderAt)}
              </span>
            )}
            
            {task.recurrence && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                <Repeat className="w-3 h-3" />
                {task.recurrence.freq.charAt(0).toUpperCase() + task.recurrence.freq.slice(1)}
              </span>
            )}
            
            {task.recurrenceParentId && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <Calendar className="w-3 h-3" />
                Recurring
              </span>
            )}
          </div>
        </div>
        
        {task.description && (
          <div className="mt-1">
            <p className={clsx(
              showFullDescription ? 'mt-1 text-sm break-words whitespace-pre-wrap' : 'mt-1 text-sm line-clamp-2 break-words',
              task.done ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
            )}>
              {task.description}
            </p>
            {task.description.length > 100 && (
              <button
                type="button"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-1 text-sm text-primary hover:underline flex items-center gap-1"
              >
                {showFullDescription ? (
                  <>
                    <ChevronDown className="w-4 h-4 rotate-180" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show more
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="More options"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
        
        {showMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
              {!historyMode && (
                <>
                  <button
                    onClick={() => { onEdit(task); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDuplicate(task); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => { onMoveToTab(task.id, task.tab === 'today' ? 'future' : 'today'); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Move to {task.tab === 'today' ? 'Future' : 'Today'}
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                </>
              )}
              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/10"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};