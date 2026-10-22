import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeProvider';
import { Layout } from './components/Layout';
import { Today } from './pages/Today';
import { Future } from './pages/Future';
import { SettingsPage } from './pages/Settings';
import { useTaskContext } from './context/TaskContext';

const AppRoutes = () => {
  const location = useLocation();
  const { getTasksForTab } = useTaskContext();
  
  const todayTasks = getTasksForTab('today');
  const futureTasks = getTasksForTab('future');
  
  return (
    <Layout
      activeTab={(location.pathname === '/future' || location.pathname === '/settings') ? 'future' : 'today'}
      onTabChange={(tab) => {
        if (tab === 'today') {
          window.location.href = '/';
        } else {
          window.location.href = '/future';
        }
      }}
      todayCount={todayTasks.length}
      futureCount={futureTasks.length}
    >
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/future" element={<Future />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <ThemeProvider>
          <TaskProvider>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </TaskProvider>
        </ThemeProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}