import { useState, useEffect, useRef } from 'react';
import type { Task, Tab, Priority, RecurrenceRule } from '../types';
import { Button } from './Button';
import { Input, Label, Textarea } from './Input';
import { Modal } from './Modal';
import { Tag, Bell, Repeat, X } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<void>;
  initialTask?: Task | null;
  submitting?: boolean;
  defaultTab?: Tab;
}

const PRIORITIES: { value: Priority; label: string; icon: React.ReactNode }[] = [
  { value: 'high', label: 'High', icon: <span className="w-2 h-2 rounded-full bg-danger" /> },
  { value: 'medium', label: 'Medium', icon: <span className="w-2 h-2 rounded-full bg-warning" /> },
  { value: 'low', label: 'Low', icon: <span className="w-2 h-2 rounded-full bg-success" /> },
];

const TABS: { value: Tab; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'future', label: 'Future' },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export const TaskForm = ({ isOpen, onClose, onSubmit, initialTask, submitting, defaultTab = 'today' }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [reminderAt, setReminderAt] = useState<number | null>(null);
  const [reminderDate, setReminderDate] = useState<string>('');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceRule | null>(null);
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialTask) {
        setTitle(initialTask.title);
        setDescription(initialTask.description || '');
        setPriority(initialTask.priority);
        setTags(initialTask.tags || []);
        setTab(initialTask.tab);
        
        if (initialTask.reminderAt) {
          const date = new Date(initialTask.reminderAt);
          setReminderDate(format(date, 'yyyy-MM-dd'));
          setReminderTime(format(date, 'HH:mm'));
          setReminderAt(initialTask.reminderAt);
        } else {
          setReminderDate('');
          setReminderTime('');
          setReminderAt(null);
        }
        
        if (initialTask.recurrence) {
          setRecurrence(initialTask.recurrence);
          setShowRecurrence(true);
          setRecurrenceFreq(initialTask.recurrence.freq);
          setRecurrenceInterval(initialTask.recurrence.interval);
          setRecurrenceDays(initialTask.recurrence.byDay || []);
          setRecurrenceEndDate(initialTask.recurrence.endDate ? format(new Date(initialTask.recurrence.endDate), 'yyyy-MM-dd') : '');
        } else {
          setRecurrence(null);
          setShowRecurrence(false);
          setRecurrenceFreq('daily');
          setRecurrenceInterval(1);
          setRecurrenceDays([]);
          setRecurrenceEndDate('');
        }
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setTags([]);
        setTab(defaultTab);
        setReminderDate('');
        setReminderTime('');
        setReminderAt(null);
        setRecurrence(null);
        setShowRecurrence(false);
        setRecurrenceFreq('daily');
        setRecurrenceInterval(1);
        setRecurrenceDays([]);
        setRecurrenceEndDate('');
      }
      
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTask, defaultTab]);

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTags = tagInput.split(',').map(t => t.trim()).filter(t => t);
      // Filter duplicates within input and against existing tags
      const uniqueNewTags = [...new Set(newTags)].filter(tag => !tags.includes(tag));
      uniqueNewTags.forEach(tag => {
        setTags(prev => [...prev, tag]);
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleReminderChange = () => {
    if (reminderDate && reminderTime) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const date = new Date(reminderDate);
      date.setHours(hours, minutes, 0, 0);
      setReminderAt(date.getTime());
    } else {
      setReminderAt(null);
    }
  };

  useEffect(() => {
    handleReminderChange();
  }, [reminderDate, reminderTime]);

  const handleRecurrenceChange = () => {
    if (!showRecurrence) {
      setRecurrence(null);
      return;
    }
    
    const rule: RecurrenceRule = {
      freq: recurrenceFreq,
      interval: recurrenceInterval,
    };
    
    if (recurrenceFreq === 'weekly' && recurrenceDays.length > 0) {
      rule.byDay = recurrenceDays;
    }
    
    if (recurrenceEndDate) {
      const endDate = new Date(recurrenceEndDate);
      endDate.setHours(23, 59, 59, 999);
      rule.endDate = endDate.getTime();
    }
    
    setRecurrence(rule);
  };

  useEffect(() => {
    handleRecurrenceChange();
  }, [showRecurrence, recurrenceFreq, recurrenceInterval, recurrenceDays, recurrenceEndDate]);

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      titleInputRef.current?.focus();
      return;
    }
    
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      done: false,
      tab,
      priority,
      tags,
      reminderAt: reminderAt || undefined,
      recurrence: recurrence || undefined,
    });
    
    onClose();
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Add Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide pr-2">
        <div>
          <Label htmlFor="title">Title *</Label>
          <Input
            ref={titleInputRef}
            id="title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Add details..."
            rows={3}
          />
        </div>

        <div>
          <Label>Priority</Label>
          <div className="flex gap-2">
            {PRIORITIES.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition-all',
                  priority === p.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {p.icon}
                <span className="capitalize">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Tab</Label>
          <div className="flex gap-2">
            {TABS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTab(t.value)}
                className={clsx(
                  'flex-1 py-2.5 rounded-lg border-2 font-medium transition-all',
                  tab === t.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {!initialTask && (
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2 min-h-[32px]">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm">
                  <Tag className="w-3 h-3 text-gray-500" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label={`Remove tag ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add tags (comma separated)"
                className="w-auto flex-1 min-w-[150px]"
              />
            </div>
          </div>
        )}

        <div>
          <Label className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Reminder
          </Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Input
              type="date"
              value={reminderDate}
              onChange={e => setReminderDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            <Input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
            />
          </div>
          {reminderAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Will notify at {format(new Date(reminderAt), 'MMM d, yyyy HH:mm')}
            </p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-2 cursor-pointer">
            <Repeat className="w-5 h-5" />
            Recurring task
            <input
              type="checkbox"
              checked={showRecurrence}
              onChange={e => setShowRecurrence(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
          </Label>
          
          {showRecurrence && (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <Label>Frequency</Label>
                <select
                  value={recurrenceFreq}
                  onChange={e => setRecurrenceFreq(e.target.value as 'daily' | 'weekly' | 'monthly')}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Every</Label>
                <Input
                  type="number"
                  value={recurrenceInterval}
                  onChange={e => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  max={365}
                />
              </div>
              
              {recurrenceFreq === 'weekly' && (
                <div>
                  <Label>Days of week</Label>
                  <div className="flex gap-2 flex-wrap">
                    {dayLabels.map((day, index) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={clsx(
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          recurrenceDays.includes(index)
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        )}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="recurrence-end">End date (optional)</Label>
                <Input
                  id="recurrence-end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={e => setRecurrenceEndDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !title.trim()}>
            {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};