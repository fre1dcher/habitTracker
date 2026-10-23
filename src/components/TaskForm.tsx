import { useState, useEffect, useRef } from 'react';
import type { Task, Tab, Priority, RecurrenceRule } from '../types';
import { Button } from './Button';
import { Input, Label, Textarea } from './Input';
import { Modal } from './Modal';
import { DateTimePicker } from './DateTimePicker';
import { Bell, Repeat } from 'lucide-react';
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
  const [tab, setTab] = useState<Tab>(defaultTab);
  const [reminderAt, setReminderAt] = useState<number | null>(null);
  const [reminderDateTime, setReminderDateTime] = useState<Date | null>(null);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
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
        setTab(initialTask.tab);
        
        if (initialTask.reminderAt) {
          const date = new Date(initialTask.reminderAt);
          setReminderDateTime(date);
          setReminderAt(initialTask.reminderAt);
        } else {
          setReminderDateTime(null);
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
        setTab(defaultTab);
        setReminderDateTime(null);
        setReminderAt(null);
        setRecurrence(null);
        setShowRecurrence(false);
        setRecurrenceFreq('daily');
        setRecurrenceInterval(1);
        setRecurrenceDays([]);
        setRecurrenceEndDate('');
        setShowDateTimePicker(false);
      }
      
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialTask, defaultTab]);

  const toggleDay = (day: number) => {
    setRecurrenceDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleDateTimeSelect = (date: Date, time: Date) => {
    const combined = new Date(date);
    combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
    setReminderDateTime(combined);
    setReminderAt(combined.getTime());
    setShowDateTimePicker(false);
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
      tags: [],
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
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
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

        <div>
          <Label className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Reminder tag
          </Label>
          <div className="space-y-2 mt-2">
            <button
              type="button"
              onClick={() => setShowDateTimePicker(true)}
              className={clsx(
                'w-full px-4 py-2.5 rounded-lg border text-left transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                reminderDateTime
                  ? 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
              )}
            >
              {reminderDateTime ? (
                <span className="text-gray-900 dark:text-gray-100">
                  {format(reminderDateTime, 'MMM d, yyyy HH:mm')}
                </span>
              ) : (
                <span className="text-gray-400">Select date & time</span>
              )}
            </button>
            {reminderDateTime && (
              <button
                type="button"
                onClick={() => { setReminderDateTime(null); setReminderAt(null); setShowDateTimePicker(false); }}
                className="text-sm text-danger hover:underline"
              >
                Clear reminder
              </button>
            )}
          </div>
        </div>

        <DateTimePicker
          isOpen={showDateTimePicker}
          onClose={() => setShowDateTimePicker(false)}
          onSelect={handleDateTimeSelect}
          initialDate={reminderDateTime || undefined}
          initialTime={reminderDateTime || undefined}
          minDate={new Date()}
        />

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

        <div className="sticky bottom-0 flex gap-3 pt-4 pb-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting || !title.trim()} className="flex-1">
            {submitting ? 'Saving...' : initialTask ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};