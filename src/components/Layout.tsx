import { TabBar } from './TabBar';
import type { ReactNode } from 'react';

interface LayoutProps {
  activeTab: 'today' | 'future';
  onTabChange: (tab: 'today' | 'future') => void;
  todayCount: number;
  futureCount: number;
  children: ReactNode;
}

export const Layout = ({ activeTab, onTabChange, todayCount, futureCount, children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {activeTab === 'today' ? 'Today' : 'Future'}
          </h1>
        </div>
      </header>
      
      <TabBar
        activeTab={activeTab}
        onTabChange={onTabChange}
        todayCount={todayCount}
        futureCount={futureCount}
      />
      
      <main className="max-w-md mx-auto px-4 pt-4 pb-24">
        {children}
      </main>
    </div>
  );
};