import type { Tab } from '../types';
import { Calendar, Archive, Clock } from 'lucide-react';
import { clsx } from 'clsx';

interface TabBarProps {
  activeTab: Tab | 'history';
  onTabChange: (tab: Tab | 'history') => void;
  todayCount: number;
  futureCount: number;
}

export const TabBar = ({ activeTab, onTabChange, todayCount, futureCount }: TabBarProps) => {
  return (
    <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-md mx-auto">
        <div className="flex h-12">
          <button
            onClick={() => onTabChange('today')}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative',
              activeTab === 'today'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            )}
            aria-current={activeTab === 'today' ? 'page' : undefined}
          >
            <div className="relative">
              <Calendar className="w-5 h-5" />
              {todayCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
                  {todayCount > 9 ? '9+' : todayCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Today</span>
          </button>
          
          <button
            onClick={() => onTabChange('future')}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative',
              activeTab === 'future'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            )}
            aria-current={activeTab === 'future' ? 'page' : undefined}
          >
            <div className="relative">
              <Archive className="w-5 h-5" />
              {futureCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-danger text-white text-[9px] font-semibold flex items-center justify-center">
                  {futureCount > 9 ? '9+' : futureCount}
                </span>
              )}
            </div>
            <span className="text-xs font-medium">Future</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={clsx(
              'flex-1 flex flex-col items-center justify-center gap-1 transition-all relative',
              activeTab === 'history'
                ? 'text-primary'
                : 'text-gray-500 dark:text-gray-400'
            )}
            aria-current={activeTab === 'history' ? 'page' : undefined}
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">History</span>
          </button>
        </div>
      </div>
    </div>
  );
};