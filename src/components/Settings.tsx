import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useNotificationContext } from '../context/NotificationContext';
import { useTaskContext } from '../context/TaskContext';
import { Button } from '../components/Button';
import { Textarea } from '../components/Input';
import { Modal } from '../components/Modal';
import { Sun, Moon, Monitor, Bell, Download, Upload, Trash2, Shield } from 'lucide-react';
import { clsx } from 'clsx';

export const Settings = () => {
  const { settings, loading: settingsLoading, updateSettings } = useSettings();
  const { permission, requesting, requestPermission, testNotification } = useNotificationContext();
  const { exportData, importData, clearAll } = useTaskContext();
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) return;
    
    setImportError('');
    try {
      await importData(importJson);
      setShowImportModal(false);
      setImportJson('');
    } catch (err) {
      setImportError('Invalid backup file. Please check the format.');
      console.error('Import failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('This will delete ALL tasks and settings. This cannot be undone. Are you sure?')) {
      return;
    }
    
    if (!confirm('Last chance! All your data will be permanently deleted. Continue?')) {
      return;
    }
    
    setClearing(true);
    try {
      await clearAll();
    } catch (err) {
      console.error('Clear failed:', err);
      alert('Failed to clear data');
    } finally {
      setClearing(false);
    }
  };

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: <Sun className="w-5 h-5" /> },
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="w-5 h-5" /> },
    { value: 'system' as const, label: 'System', icon: <Monitor className="w-5 h-5" /> },
  ];

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="max-w-md mx-auto px-4 py-6 pb-24 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

        <section className="card p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sun className="w-5 h-5 text-warning" />
            Appearance
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => updateSettings({ theme: option.value })}
                className={clsx(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  settings.theme === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Notifications
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Local Notifications</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get reminded about your tasks
                  </p>
                </div>
              </div>
              {permission.granted ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success-light text-success dark:bg-success/20 dark:text-success">
                  Enabled
                </span>
              ) : permission.denied ? (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Blocked
                </span>
              ) : (
                <Button variant="outline" size="sm" onClick={requestPermission} disabled={requesting}>
                  {requesting ? 'Enabling...' : 'Enable'}
                </Button>
              )}
            </div>
            
            {permission.granted && (
              <Button variant="outline" onClick={testNotification} className="w-full justify-start">
                <Bell className="w-4 h-4" />
                Send Test Notification
              </Button>
            )}
            
            {!permission.granted && !permission.denied && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You'll be asked for permission when you enable notifications.
              </p>
            )}
          </div>
        </section>

        <section className="card p-4 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-success" />
            Data & Privacy
          </h2>
          <div className="space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              All your data is stored locally on this device. No data is sent to any server.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleExport} disabled={exporting} className="w-full justify-center">
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="w-full justify-center">
                <Upload className="w-4 h-4" />
                Import Data
              </Button>
            </div>
          </div>
        </section>

        <section className="card p-4 space-y-4 border-danger/20">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-danger" />
            Danger Zone
          </h2>
          <Button variant="danger" onClick={handleClearAll} disabled={clearing} className="w-full justify-center">
            <Trash2 className="w-4 h-4" />
            {clearing ? 'Clearing...' : 'Delete All Data'}
          </Button>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            This will permanently delete all tasks and settings.
          </p>
        </section>

        <section className="card p-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">About</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Habit Tracker v1.0.0</p>
            <p>A progressive web app for habit tracking</p>
            <p className="pt-2">Built with React, TypeScript, Vite, and IndexedDB</p>
          </div>
        </section>
      </div>

      <Modal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportJson(''); setImportError(''); }}
        title="Import Data"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Paste the JSON from a previous export to restore your data. This will replace all current data.
          </p>
          <Textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder="Paste JSON here..."
            rows={8}
            className="font-mono text-xs"
          />
          {importError && (
            <p className="text-sm text-danger">{importError}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowImportModal(false); setImportJson(''); setImportError(''); }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleImport}>
              Import
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};