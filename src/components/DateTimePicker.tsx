import { useState, useEffect, useRef, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameDay,
  isSameMonth,
  isBefore,
  startOfDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Modal } from './Modal';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date, time: Date) => void;
  initialDate?: Date;
  initialTime?: Date;
  minDate?: Date;
}

// iOS-style weeks start on Monday for most locales (incl. Russian).
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Build the 6-week grid of days for the month that `month` falls in. */
function buildCalendar(month: Date): Date[] {
  const first = startOfMonth(month);
  const last = endOfMonth(month);
  // getDay: 0=Sun..6=Sat -> shift so Monday is 0.
  const leading = (first.getDay() + 6) % 7;
  const days: Date[] = [];
  for (let i = 0; i < leading; i++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 - (leading - i)));
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  // Trailing days to fill 6 rows of 7.
  while (days.length % 7 !== 0) {
    const lastDay = days[days.length - 1];
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
  }
  while (days.length < 42) {
    const lastDay = days[days.length - 1];
    days.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + 1));
  }
  return days;
}

const ITEM_H = 40; // px, height of one wheel row
const VISIBLE = 5; // odd number of visible rows

/** A single iOS-style scrollable wheel column. */
function Wheel({
  values,
  value,
  onChange,
  renderItem,
  ariaLabel,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  renderItem: (v: number) => string;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProgrammatic = useRef(false);

  const pad = ((VISIBLE - 1) / 2) * ITEM_H;

  // Keep the wheel aligned to the selected value when it changes externally.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const index = values.indexOf(value);
    if (index < 0) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 1) {
      isProgrammatic.current = true;
      el.scrollTop = target;
      // release the guard after the scroll settles
      setTimeout(() => (isProgrammatic.current = false), 60);
    }
  }, [value, values]);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el || isProgrammatic.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      const index = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
      const next = values[index];
      if (next !== value) onChange(next);
    }, 90);
  }, [onChange, value, values]);

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="relative overflow-y-scroll scrollbar-hide snap-y snap-mandatory touch-pan-y"
      style={{ height: VISIBLE * ITEM_H, scrollPaddingTop: pad }}
    >
      <div style={{ height: pad }} aria-hidden />
      {values.map(v => {
        const active = v === value;
        return (
          <div
            key={v}
            onClick={() => onChange(v)}
            className={clsx(
              'snap-center flex items-center justify-center tabular-nums cursor-pointer select-none transition-all',
              active
                ? 'text-gray-900 dark:text-gray-50 font-semibold'
                : 'text-gray-400 dark:text-gray-500'
            )}
            style={{ height: ITEM_H, fontSize: active ? 22 : 20 }}
          >
            {renderItem(v)}
          </div>
        );
      })}
      <div style={{ height: pad }} aria-hidden />
    </div>
  );
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export const DateTimePicker = ({
  isOpen,
  onClose,
  onSelect,
  initialDate,
  initialTime,
  minDate = new Date(),
}: DateTimePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate ?? new Date());
  const [viewMonth, setViewMonth] = useState<Date>(startOfMonth(initialDate ?? new Date()));
  const [hour, setHour] = useState(initialTime?.getHours() ?? 9);
  const [minute, setMinute] = useState(initialTime?.getMinutes() ?? 0);

  const minDay = startOfDay(minDate);

  useEffect(() => {
    if (!isOpen) return;
    const base = initialDate ?? new Date();
    setSelectedDate(base);
    setViewMonth(startOfMonth(base));
    setHour(initialTime?.getHours() ?? 9);
    setMinute(initialTime?.getMinutes() ?? 0);
  }, [isOpen, initialDate, initialTime]);

  const days = buildCalendar(viewMonth);
  const canGoPrev = !isBefore(startOfMonth(addMonths(viewMonth, -1)), startOfMonth(minDay));

  const handleConfirm = () => {
    const time = new Date();
    time.setHours(hour, minute, 0, 0);
    onSelect(selectedDate, time);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm" className="overflow-hidden">
      {/* iOS-style header */}
      <div className="flex items-center justify-between -mx-4 -mt-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="text-base text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Reminder</span>
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex items-center gap-1 text-base font-semibold text-primary hover:text-primary-hover transition-colors"
        >
          <Check className="w-4 h-4" />
          Done
        </button>
      </div>

      <div className="pt-4 space-y-5">
        {/* Calendar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {format(viewMonth, 'LLLL yyyy')}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setViewMonth(m => addMonths(m, -1))}
                className="p-1.5 rounded-full text-primary hover:bg-primary/10 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:hover:bg-transparent transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth(m => addMonths(m, 1))}
                className="p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-1">
            {WEEKDAYS.map(d => (
              <div
                key={d}
                className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day, i) => {
              const inMonth = isSameMonth(day, viewMonth);
              const selected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              const disabled = isBefore(day, minDay);
              return (
                <div key={i} className="flex justify-center">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedDate(day)}
                    className={clsx(
                      'w-10 h-10 flex items-center justify-center rounded-full text-[15px] transition-colors',
                      selected && 'bg-primary text-white font-semibold shadow-sm',
                      !selected && isToday && 'text-primary font-semibold',
                      !selected && !isToday && inMonth && 'text-gray-900 dark:text-gray-100',
                      !selected && !inMonth && 'text-gray-300 dark:text-gray-600',
                      !selected && !disabled && 'hover:bg-primary/10',
                      disabled && 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                    )}
                  >
                    {day.getDate()}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time wheels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</span>
            <span className="text-sm font-semibold text-primary tabular-nums">
              {format(new Date(0, 0, 0, hour, minute), 'HH:mm')}
            </span>
          </div>
          <div className="relative rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
            {/* center selection band (sits behind the numbers) */}
            <div
              className="pointer-events-none absolute inset-x-3 top-1/2 -translate-y-1/2 rounded-xl bg-primary/10 z-0"
              style={{ height: ITEM_H }}
              aria-hidden
            />
            {/* fade masks */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 rounded-t-2xl bg-gradient-to-b from-gray-50 dark:from-gray-900/50 to-transparent z-10"
              style={{ height: ITEM_H * 1.5 }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-gray-50 dark:from-gray-900/50 to-transparent z-10"
              style={{ height: ITEM_H * 1.5 }}
              aria-hidden
            />
            <div className="relative z-[1] flex items-center justify-center gap-2 px-6">
              <Wheel
                values={HOURS}
                value={hour}
                onChange={setHour}
                renderItem={v => String(v).padStart(2, '0')}
                ariaLabel="Hour"
              />
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 pb-0.5">:</span>
              <Wheel
                values={MINUTES}
                value={minute}
                onChange={setMinute}
                renderItem={v => String(v).padStart(2, '0')}
                ariaLabel="Minute"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
