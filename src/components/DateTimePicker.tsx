import { useState, useEffect, useRef } from 'react';
import { DayPicker, type Matcher } from 'react-day-picker';
import { format } from 'date-fns';
import { ChevronLeft, Clock } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import 'react-day-picker/style.css';

interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date, time: Date) => void;
  initialDate?: Date;
  initialTime?: Date;
  minDate?: Date;
}

export const DateTimePicker = ({ 
  isOpen, 
  onClose, 
  onSelect, 
  initialDate, 
  initialTime,
  minDate = new Date()
}: DateTimePickerProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [hour, setHour] = useState(initialTime?.getHours() || 9);
  const [minute, setMinute] = useState(initialTime?.getMinutes() || 0);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);

  // Create a matcher for dates before minDate
  const disabledDates: Matcher = { before: minDate };

  useEffect(() => {
    if (isOpen) {
      if (initialDate) {
        setSelectedDate(initialDate);
      }
      if (initialTime) {
        setHour(initialTime.getHours());
        setMinute(initialTime.getMinutes());
      }
      setShowTimePicker(false);
    }
  }, [isOpen, initialDate, initialTime]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setShowTimePicker(true);
    }
  };

  const handleTimeSelect = () => {
    const timeDate = new Date();
    timeDate.setHours(hour, minute, 0, 0);
    onSelect(selectedDate!, timeDate);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Date & Time"
      size="md"
    >
      <div className="space-y-6">
        {!showTimePicker ? (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select a date</p>
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={disabledDates}
              numberOfMonths={2}
              classNames={{
                root: 'w-full',
                month: 'space-y-2',
                month_caption: 'flex items-center justify-between py-2',
                caption_label: 'text-lg font-medium',
                nav: 'flex items-center justify-between',
                button_previous: 'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                button_next: 'p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800',
                month_grid: 'w-full border-collapse',
                day: 'w-9 h-9 p-0 text-sm',
                day_button: 'w-full h-full flex items-center justify-center rounded-full hover:bg-primary/10 text-gray-900 dark:text-gray-100',
                selected: 'bg-primary text-white',
                today: 'font-semibold text-primary',
                outside: 'text-gray-300 dark:text-gray-600',
                disabled: 'text-gray-200 dark:text-gray-700 cursor-not-allowed',
              }}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d, yyyy') : 'Select time'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="relative">
                <input
                  ref={hourInputRef}
                  type="number"
                  min={0}
                  max={23}
                  value={hour}
                  onChange={e => setHour(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-16 px-3 py-2 text-center text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500">Hour</span>
              </div>
              <span className="text-2xl font-bold text-gray-400">:</span>
              <div className="relative">
                <input
                  ref={minuteInputRef}
                  type="number"
                  min={0}
                  max={59}
                  value={minute}
                  onChange={e => setMinute(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-16 px-3 py-2 text-center text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs text-gray-500">Minute</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="ghost" onClick={() => setShowTimePicker(false)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button variant="primary" onClick={handleTimeSelect}>
                <Clock className="w-4 h-4 mr-1" />
                Set Time
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};