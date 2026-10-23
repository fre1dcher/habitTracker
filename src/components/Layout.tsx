import { TabBar } from './TabBar';
import type { ReactNode } from 'react';
import type { Tab } from '../types';

interface LayoutProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  todayCount: number;
  futureCount: number;
  children: ReactNode;
}

export const Layout = ({ activeTab, onTabChange, todayCount, futureCount, children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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