import { useState } from 'react';
import { useTaskContext } from '../context/TaskContext';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { Plus } from 'lucide-react';
import { Button } from '../components/Button';
import type { Task } from '../types';

export const Future = () => {
  const {
    getTasksForTab,
    getDoneTasksForTab,
    toggleTaskDone,
    createTask,
    updateTask,
    deleteTask,
    deleteRecurringTasks,
    moveTaskToTab,
  } = useTaskContext();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const tasks = getTasksForTab('future');
  const doneTasks = getDoneTasksForTab('future');

  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleSubmit = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData);
    }
  };

  const handleDelete = async (id: string) => {
    const task = tasks.find(t => t.id === id) || doneTasks.find(t => t.id === id);
    if (task?.recurrence && !task.recurrenceParentId) {
      await deleteRecurringTasks(task.id);
    }
    await deleteTask(id);
  };

  const handleDuplicate = async (task: Task) => {
    await createTask({
      ...task,
      title: `${task.title} (copy)`,
      done: false,
    });
  };

  const handleMoveToToday = async (id: string) => {
    await moveTaskToTab(id, 'today');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          Future Tasks
          {tasks.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {tasks.length}
            </span>
          )}
        </h2>
        <Button onClick={handleAddTask} size="sm" className="gap-1">
          <Plus className="w-4 h-4" />
          Add
        </Button>
      </div>

      <TaskList
        tasks={tasks}
        doneTasks={doneTasks}
        tab="future"
        onToggle={toggleTaskDone}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
        onMoveToTab={handleMoveToToday}
        onAddTask={handleAddTask}
        draggable={true}
      />

      <TaskForm
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditingTask(null); }}
        onSubmit={handleSubmit}
        initialTask={editingTask}
      />
    </div>
  );
};