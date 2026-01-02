import { useState, useMemo, useCallback } from 'react';
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import AufgabenFilterDialog from './aufgaben-filter-dialog';
import { useCalendar } from '../../contexts/calendar-context';

// Status colors
const STATUS_COLORS = {
  unerledigt: 'bg-yellow-100 text-yellow-800',
  erledigt: 'bg-green-100 text-green-800'
};

// Subject colors based on Rechtsgebiet
const SUBJECT_COLORS = {
  'zivilrecht': 'bg-primary-100 border-primary-200',
  'strafrecht': 'bg-red-100 border-red-200',
  'oeffentliches-recht': 'bg-green-100 border-green-200',
  'querschnitt': 'bg-purple-100 border-purple-200',
  // Display names
  'Zivilrecht': 'bg-primary-100 border-primary-200',
  'Strafrecht': 'bg-red-100 border-red-200',
  'Öffentliches Recht': 'bg-green-100 border-green-200',
  'Querschnittsrecht': 'bg-purple-100 border-purple-200'
};

// Subject display names
const SUBJECT_NAMES = {
  'zivilrecht': 'Zivilrecht',
  'strafrecht': 'Strafrecht',
  'oeffentliches-recht': 'Öffentliches Recht',
  'querschnitt': 'Querschnittsrecht'
};

// Priority display
const PRIORITY_DISPLAY = {
  low: '',
  medium: '!',
  high: '!!'
};

const PRIORITY_COLORS = {
  low: 'text-neutral-400',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

// Default filter state
const DEFAULT_FILTERS = {
  faecher: [],
  status: 'standard',
  wichtigkeit: [],
  zeitrahmen: 'alle',
  datumVon: '',
  datumBis: ''
};

/**
 * AufgabenContent component
 * Main content area for tasks administration
 * Now connected to CalendarContext for real data
 */
const AufgabenContent = ({ className = '' }) => {
  const { tasksByDate, addTask, updateTask, deleteTask, toggleTaskComplete } = useCalendar();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Edit/Create dialog state
  const [editingTask, setEditingTask] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    subject: 'zivilrecht',
    priority: 'medium',
    lernplanthema: '',
    lernblock: ''
  });

  // Flatten tasksByDate into array with date info
  const allTasks = useMemo(() => {
    const tasks = [];
    Object.entries(tasksByDate || {}).forEach(([dateKey, dayTasks]) => {
      dayTasks.forEach(task => {
        tasks.push({
          ...task,
          date: dateKey,
          status: task.completed ? 'erledigt' : 'unerledigt'
        });
      });
    });
    return tasks;
  }, [tasksByDate]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...allTasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(query) ||
        t.subject?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.lernplanthema?.toLowerCase().includes(query)
      );
    }

    // Fächer filter
    if (filters.faecher.length > 0) {
      result = result.filter(t => {
        const subject = SUBJECT_NAMES[t.subject] || t.subject;
        return filters.faecher.includes(subject);
      });
    }

    // Status filter
    if (filters.status !== 'standard') {
      result = result.filter(t => t.status === filters.status);
    }

    // Wichtigkeit filter
    if (filters.wichtigkeit.length > 0) {
      result = result.filter(t => filters.wichtigkeit.includes(t.priority));
    }

    // Zeitrahmen filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filters.zeitrahmen === 'vergangen') {
      result = result.filter(t => new Date(t.date) < today);
    } else if (filters.zeitrahmen === 'zukuenftig') {
      result = result.filter(t => new Date(t.date) >= today);
    } else if (filters.zeitrahmen === 'benutzerdefiniert') {
      if (filters.datumVon) {
        result = result.filter(t => new Date(t.date) >= new Date(filters.datumVon));
      }
      if (filters.datumBis) {
        result = result.filter(t => new Date(t.date) <= new Date(filters.datumBis));
      }
    }

    // Sort: unerledigt tasks first, then by date
    result.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'unerledigt' ? -1 : 1;
      }
      return new Date(b.date) - new Date(a.date);
    });

    return result;
  }, [allTasks, searchQuery, filters]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const day = date.getDate();
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${day}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Handle toggle task completion
  const handleToggleComplete = useCallback(async (task) => {
    await toggleTaskComplete(task.date, task.id);
  }, [toggleTaskComplete]);

  // Handle delete task
  const handleDeleteTask = useCallback(async (task) => {
    if (confirm('Aufgabe wirklich löschen?')) {
      await deleteTask(task.date, task.id);
    }
  }, [deleteTask]);

  // Handle create new task
  const handleCreateTask = useCallback(async () => {
    if (!newTask.title.trim()) return;

    await addTask(newTaskDate, {
      ...newTask,
      completed: false
    });

    // Reset form
    setNewTask({
      title: '',
      description: '',
      subject: 'zivilrecht',
      priority: 'medium',
      lernplanthema: '',
      lernblock: ''
    });
    setIsCreating(false);
  }, [addTask, newTaskDate, newTask]);

  // Handle update task
  const handleUpdateTask = useCallback(async () => {
    if (!editingTask || !editingTask.title.trim()) return;

    await updateTask(editingTask.date, editingTask.id, {
      title: editingTask.title,
      description: editingTask.description,
      subject: editingTask.subject,
      priority: editingTask.priority,
      lernplanthema: editingTask.lernplanthema,
      lernblock: editingTask.lernblock
    });

    setEditingTask(null);
  }, [updateTask, editingTask]);

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Container Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900">Aufgaben</h3>
        <div className="flex items-center gap-2">
          {/* Add Task Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1 px-2 py-1 text-sm text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={14} />
            Neue Aufgabe
          </button>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-56 px-2 py-1 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="p-2 text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            title="Filter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Task Form */}
      {isCreating && (
        <div className="px-3 py-3 bg-neutral-50 border-b border-neutral-200">
          <div className="grid grid-cols-6 gap-2">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Aufgabentitel"
              className="col-span-2 px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              autoFocus
            />
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
            <select
              value={newTask.subject}
              onChange={(e) => setNewTask(prev => ({ ...prev, subject: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="zivilrecht">Zivilrecht</option>
              <option value="strafrecht">Strafrecht</option>
              <option value="oeffentliches-recht">Öffentliches Recht</option>
              <option value="querschnitt">Querschnittsrecht</option>
            </select>
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
              className="px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            >
              <option value="low">Niedrig</option>
              <option value="medium">Mittel</option>
              <option value="high">Hoch</option>
            </select>
            <div className="flex gap-1">
              <button
                onClick={handleCreateTask}
                className="flex-1 px-2 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                <Check size={14} className="mx-auto" />
              </button>
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 px-2 py-1.5 text-sm text-neutral-600 bg-neutral-200 rounded-lg hover:bg-neutral-300"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
          </div>
          <input
            type="text"
            value={newTask.description}
            onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Beschreibung (optional)"
            className="w-full mt-2 px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
          />
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="w-[5%] px-2 py-2"></th>
              <th className="w-[12%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Fach
              </th>
              <th className="w-[22%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Aufgabe
              </th>
              <th className="w-[15%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Lernplanthema
              </th>
              <th className="w-[6%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Prio
              </th>
              <th className="w-[10%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-[18%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="w-[12%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-neutral-50 transition-colors"
              >
                {/* Checkbox */}
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.completed
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-neutral-300 hover:border-primary-500'
                    }`}
                  >
                    {task.completed && <Check size={12} />}
                  </button>
                </td>
                {/* Subject */}
                <td className="px-3 py-2 truncate">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded border ${SUBJECT_COLORS[task.subject] || 'bg-neutral-100 border-neutral-200'}`}>
                    {SUBJECT_NAMES[task.subject] || task.subject || '-'}
                  </span>
                </td>
                {/* Title & Description */}
                <td className="px-3 py-2">
                  <div className="truncate">
                    <p className={`text-sm font-medium truncate ${task.completed ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-neutral-500 truncate">{task.description}</p>
                    )}
                  </div>
                </td>
                {/* Lernplanthema */}
                <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                  {task.lernplanthema || '-'}
                </td>
                {/* Priority */}
                <td className="px-3 py-2 text-center">
                  <span className={`text-sm font-bold ${PRIORITY_COLORS[task.priority] || ''}`}>
                    {PRIORITY_DISPLAY[task.priority] || ''}
                  </span>
                </td>
                {/* Status */}
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_COLORS[task.status] || 'bg-neutral-100 text-neutral-800'}`}>
                    {task.status}
                  </span>
                </td>
                {/* Date */}
                <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                  {formatDate(task.date)}
                </td>
                {/* Actions */}
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setEditingTask(task)}
                      className="p-1 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Bearbeiten"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-1 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Löschen"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-sm text-neutral-500">
                  {allTasks.length === 0
                    ? 'Noch keine Aufgaben vorhanden. Klicke auf "Neue Aufgabe" um eine zu erstellen.'
                    : 'Keine Aufgaben gefunden'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Total */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border-t border-neutral-200">
        <span className="text-sm font-medium text-neutral-700">Total</span>
        <span className="text-sm text-neutral-600">{filteredTasks.length} Aufgaben</span>
      </div>

      {/* Filter Dialog */}
      <AufgabenFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApply={setFilters}
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">Aufgabe bearbeiten</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={editingTask.title}
                onChange={(e) => setEditingTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Titel"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <textarea
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Beschreibung"
                rows={2}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={editingTask.subject || 'zivilrecht'}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, subject: e.target.value }))}
                  className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="zivilrecht">Zivilrecht</option>
                  <option value="strafrecht">Strafrecht</option>
                  <option value="oeffentliches-recht">Öffentliches Recht</option>
                  <option value="querschnitt">Querschnittsrecht</option>
                </select>
                <select
                  value={editingTask.priority || 'medium'}
                  onChange={(e) => setEditingTask(prev => ({ ...prev, priority: e.target.value }))}
                  className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                >
                  <option value="low">Niedrige Priorität</option>
                  <option value="medium">Mittlere Priorität</option>
                  <option value="high">Hohe Priorität</option>
                </select>
              </div>
              <input
                type="text"
                value={editingTask.lernplanthema || ''}
                onChange={(e) => setEditingTask(prev => ({ ...prev, lernplanthema: e.target.value }))}
                placeholder="Lernplanthema (optional)"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 px-4 py-2 text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpdateTask}
                className="flex-1 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AufgabenContent;
