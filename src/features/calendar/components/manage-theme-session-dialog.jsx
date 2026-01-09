import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';
import { ChevronDownIcon, PlusIcon, TrashIcon, CheckIcon } from '../../../components/ui/icon';

/**
 * Manage Theme Block Dialog Component
 * Dialog for viewing and editing an existing learning block
 *
 * Features:
 * - Title and description editing
 * - Time selection (required)
 * - Repeat options
 * - Task management (create new, add from existing)
 */
const ManageThemeBlockDialog = ({
  open,
  onOpenChange,
  date,
  block,
  onSave,
  onDelete,
  availableBlocks = 4,
  availableSlots, // Legacy alias
  // Task sources
  availableTasks = [],      // To-Dos
  themeLists = [],          // Themenlisten
}) => {
  // Support legacy prop name
  const maxBlocks = availableSlots ?? availableBlocks;
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Time settings (always required)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  // Repeat settings
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatCount, setRepeatCount] = useState(20);
  const [customDays, setCustomDays] = useState([1, 3, 5]);

  // Tasks for this block
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskSource, setShowTaskSource] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedThemeListId, setSelectedThemeListId] = useState(null);

  // Dropdown states
  const [isRepeatTypeOpen, setIsRepeatTypeOpen] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load block data when dialog opens
  useEffect(() => {
    if (open && block) {
      setTitle(block.title || '');
      setDescription(block.description || '');
      setStartTime(block.startTime || '09:00');
      setEndTime(block.endTime || '11:00');
      setRepeatEnabled(block.repeatEnabled || false);
      setRepeatType(block.repeatType || 'weekly');
      setRepeatCount(block.repeatCount || 20);
      setCustomDays(block.customDays || [1, 3, 5]);
      setTasks(block.tasks || []);
      setNewTaskText('');
      setShowTaskSource(false);
      setSelectedSource(null);
      setSelectedThemeListId(null);
      setIsRepeatTypeOpen(false);
      setShowDeleteConfirm(false);
    }
  }, [open, block]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Repeat type options
  const repeatTypeOptions = [
    { id: 'daily', name: 'Täglich' },
    { id: 'weekly', name: 'Wöchentlich' },
    { id: 'monthly', name: 'Monatlich' },
    { id: 'custom', name: 'Benutzerdefiniert' },
  ];

  // Weekday options
  const weekdayOptions = [
    { id: 0, short: 'So', name: 'Sonntag' },
    { id: 1, short: 'Mo', name: 'Montag' },
    { id: 2, short: 'Di', name: 'Dienstag' },
    { id: 3, short: 'Mi', name: 'Mittwoch' },
    { id: 4, short: 'Do', name: 'Donnerstag' },
    { id: 5, short: 'Fr', name: 'Freitag' },
    { id: 6, short: 'Sa', name: 'Samstag' },
  ];

  // Get available tasks from selected source
  const sourceTaskOptions = useMemo(() => {
    if (selectedSource === 'todos') {
      return availableTasks.filter(t => !tasks.some(bt => bt.sourceId === t.id));
    }
    if (selectedSource === 'themenliste' && selectedThemeListId) {
      const list = themeLists.find(l => l.id === selectedThemeListId);
      if (!list) return [];
      // Flatten all aufgaben from the hierarchical structure
      const aufgaben = [];
      list.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          k.themen?.forEach(t => {
            t.aufgaben?.forEach(a => {
              if (!tasks.some(bt => bt.sourceId === a.id)) {
                aufgaben.push({
                  id: a.id,
                  text: a.title,
                  source: 'themenliste',
                  thema: t.title,
                  kapitel: k.title,
                });
              }
            });
          });
        });
      });
      return aufgaben;
    }
    return [];
  }, [selectedSource, selectedThemeListId, availableTasks, themeLists, tasks]);

  // Toggle custom day
  const toggleCustomDay = (dayId) => {
    setCustomDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId].sort((a, b) => a - b);
      }
    });
  };

  // Add new task (created in dialog)
  const handleAddNewTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `new-task-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      isNew: true,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
  };

  // Add existing task from source
  const handleAddExistingTask = (sourceTask) => {
    const newTask = {
      id: `assigned-${Date.now()}`,
      sourceId: sourceTask.id,
      text: sourceTask.text || sourceTask.title,
      completed: sourceTask.completed || false,
      source: selectedSource,
      sourceDetails: sourceTask,
    };
    setTasks(prev => [...prev, newTask]);
  };

  // Remove task
  const handleRemoveTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Toggle task completion
  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ));
  };

  // Check if form is valid
  const isFormValid = () => {
    return title.trim().length > 0;
  };

  // Calculate duration and start hour
  const calculateDuration = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return Math.max(0.5, (endMinutes - startMinutes) / 60);
  };

  const calculateStartHour = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    return startH + startM / 60;
  };

  // Save handler (keep dialog open)
  const handleSave = () => {
    if (!isFormValid() || !date || !onSave) return;

    const blockData = {
      ...block,
      title: title.trim(),
      blockType: 'lernblock',
      description: description.trim(),
      hasTime: true,
      startTime,
      endTime,
      startHour: calculateStartHour(),
      duration: calculateDuration(),
      repeatEnabled,
      repeatType: repeatEnabled ? repeatType : null,
      repeatCount: repeatEnabled ? repeatCount : null,
      customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
      tasks: tasks.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        sourceId: t.sourceId,
        source: t.source,
      })),
    };

    onSave(date, blockData);
  };

  // Save and close handler
  const handleSaveAndClose = () => {
    handleSave();
    onOpenChange(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (onDelete && block) {
      onDelete(date, block.id);
      onOpenChange(false);
    }
  };

  // Discard handler
  const handleDiscard = () => {
    onOpenChange(false);
  };

  const getRepeatTypeName = () => {
    return repeatTypeOptions.find(opt => opt.id === repeatType)?.name || 'Wöchentlich';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Lernblock bearbeiten</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-5">
          {/* Titel */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Vorlesung Mathe, Lerngruppe..."
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              autoFocus
            />
          </div>

          {/* Beschreibung */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Notizen..."
              rows={2}
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm resize-none"
            />
          </div>

          {/* Uhrzeit */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">
              Uhrzeit <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">Von</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-neutral-600">Bis</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Wiederholung */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <span className="text-sm font-medium text-neutral-900">Termin wiederholen</span>
            </label>

            {repeatEnabled && (
              <div className="space-y-4 pl-8">
                <div className="space-y-2">
                  <label className="text-sm text-neutral-600">Wiederholung</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsRepeatTypeOpen(!isRepeatTypeOpen)}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-left"
                    >
                      <span className="text-sm text-neutral-900">{getRepeatTypeName()}</span>
                      <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isRepeatTypeOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isRepeatTypeOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                        {repeatTypeOptions.map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => { setRepeatType(opt.id); setIsRepeatTypeOpen(false); }}
                            className={`w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                              repeatType === opt.id ? 'bg-neutral-100 font-medium' : ''
                            }`}
                          >
                            {opt.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {repeatType === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-sm text-neutral-600">An diesen Tagen</label>
                    <div className="flex flex-wrap gap-2">
                      {weekdayOptions.map(day => (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleCustomDay(day.id)}
                          className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                            customDays.includes(day.id) ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {day.short}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm text-neutral-600">Anzahl Wiederholungen</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      className="w-24 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm text-center"
                    />
                    <span className="text-sm text-neutral-600">mal</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Aufgaben */}
          <div className="space-y-3 pt-2 border-t border-neutral-200">
            <label className="text-sm font-medium text-neutral-900">Aufgaben</label>

            {/* Task List */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg group">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                      {task.text}
                    </span>
                    {task.source && (
                      <span className="text-xs text-neutral-400 bg-neutral-200 px-2 py-0.5 rounded">
                        {task.source === 'todos' ? 'To-Do' : task.source === 'themenliste' ? 'Themenliste' : 'Lernplan'}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Task */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNewTask()}
                placeholder="Neue Aufgabe eingeben..."
                className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
              />
              <button
                type="button"
                onClick={handleAddNewTask}
                disabled={!newTaskText.trim()}
                className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hinzufügen
              </button>
            </div>

            {/* Add from existing sources */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowTaskSource(!showTaskSource)}
                className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900"
              >
                <PlusIcon size={14} />
                <span>Aus vorhandenen Aufgaben hinzufügen</span>
              </button>

              {showTaskSource && (
                <div className="p-4 bg-neutral-50 rounded-lg space-y-3">
                  {/* Source Selection */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setSelectedSource('todos'); setSelectedThemeListId(null); }}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        selectedSource === 'todos' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      To-Dos ({availableTasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedSource('themenliste'); }}
                      className={`px-3 py-1.5 rounded-lg text-sm ${
                        selectedSource === 'themenliste' ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      Themenlisten ({themeLists.length})
                    </button>
                  </div>

                  {/* Themenliste Selection */}
                  {selectedSource === 'themenliste' && themeLists.length > 0 && (
                    <select
                      value={selectedThemeListId || ''}
                      onChange={(e) => setSelectedThemeListId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm"
                    >
                      <option value="">Themenliste wählen...</option>
                      {themeLists.map(list => (
                        <option key={list.id} value={list.id}>{list.name}</option>
                      ))}
                    </select>
                  )}

                  {/* Task Options */}
                  {sourceTaskOptions.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {sourceTaskOptions.map(task => (
                        <button
                          key={task.id}
                          type="button"
                          onClick={() => handleAddExistingTask(task)}
                          className="w-full flex items-center gap-2 p-2 text-left text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100"
                        >
                          <PlusIcon size={12} className="text-neutral-400" />
                          <span className="flex-1 truncate">{task.text || task.title}</span>
                          {task.thema && (
                            <span className="text-xs text-neutral-400 truncate max-w-[100px]">{task.thema}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : selectedSource && (
                    <p className="text-sm text-neutral-500 text-center py-2">
                      {selectedSource === 'themenliste' && !selectedThemeListId
                        ? 'Bitte eine Themenliste wählen'
                        : 'Keine verfügbaren Aufgaben'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={handleDiscard}>
              Abbrechen
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Wirklich löschen?</span>
                <Button
                  variant="default"
                  onClick={handleDelete}
                  className="text-red-600 hover:bg-red-50"
                >
                  Ja, löschen
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Nein
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="gap-2 text-red-600 hover:bg-red-50"
              >
                <TrashIcon size={16} />
                Löschen
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              onClick={handleSave}
              disabled={!isFormValid()}
            >
              Speichern
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveAndClose}
              disabled={!isFormValid()}
              className="gap-2"
            >
              Fertig
              <CheckIcon size={16} />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageThemeBlockDialog;
