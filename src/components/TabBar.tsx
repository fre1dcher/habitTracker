import type { Tab } from '../types';
import { Calendar, Archive } from 'lucide-react';
import { clsx } from 'clsx';

interface TabBarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  todayCount: number;
  futureCount: number;
}

export const TabBar = ({ activeTab, onTabChange, todayCount, futureCount }: TabBarProps) => {
  return (
    <div className="sticky top-16 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-md mx-auto">
        <div className="flex h-12">
          <button
            onClick={() => onTabChange('today')}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all',
              activeTab === 'today'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            )}
            aria-current={activeTab === 'today' ? 'page' : undefined}
          >
            <Calendar className={clsx('w-5 h-5', activeTab === 'today' && 'fill-current')} />
            <span className="text-xs font-medium">Today</span>
            {todayCount > 0 && (
              <span className={clsx(
                'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                activeTab === 'today'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                {todayCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => onTabChange('future')}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all',
              activeTab === 'future'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            )}
            aria-current={activeTab === 'future' ? 'page' : undefined}
          >
            <Archive className={clsx('w-5 h-5', activeTab === 'future' && 'fill-current')} />
            <span className="text-xs font-medium">Future</span>
            {futureCount > 0 && (
              <span className={clsx(
                'px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
                activeTab === 'future'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                {futureCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};