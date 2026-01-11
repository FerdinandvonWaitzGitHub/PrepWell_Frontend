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
import { ChevronDownIcon, PlusIcon, TrashIcon } from '../../../components/ui/icon';

/**
 * Create Theme Block Dialog Component
 * Form for creating a new learning block with tasks
 *
 * Features:
 * - Title and description
 * - Time selection (Session mode - Week/Dashboard) OR Block size (Allocation mode - Month)
 * - Repeat options
 * - Task creation and assignment from existing lists
 *
 * PRD §3.1: Two modes (BlockAllocation vs. Session):
 * - mode="session" (default): For Week/Dashboard - uses start/end time (Session)
 * - mode="block": For Month view - uses block size (1-4 positions) (BlockAllocation)
 */
const CreateThemeBlockDialog = ({
  open,
  onOpenChange,
  date,
  onSave,
  availableBlocks = 4,
  availableSlots, // Legacy alias
  mode = 'session', // PRD §3.1: 'session' = Uhrzeiten (Woche/Startseite), 'block' = Block-Größe (Monatsansicht)
  // Task sources
  availableTasks = [],      // To-Dos
  themeLists = [],          // Themenlisten
}) => {
  // Support legacy prop name
  const maxBlocks = availableSlots ?? availableBlocks;

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Time settings (Session mode - Week/Dashboard)
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  // Block size (Allocation mode - Month view)
  const [blockSize, setBlockSize] = useState(1);

  // Repeat settings
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatCount, setRepeatCount] = useState(20);
  const [customDays, setCustomDays] = useState([1, 3, 5]);
  // TICKET-10: Repeat end mode (count OR date)
  const [repeatEndMode, setRepeatEndMode] = useState('count'); // 'count' | 'date'
  const [repeatEndDate, setRepeatEndDate] = useState('');

  // Tasks for this block
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [showTaskSource, setShowTaskSource] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null); // 'todos', 'themenliste'
  const [selectedThemeListId, setSelectedThemeListId] = useState(null);

  // Dropdown states
  const [isRepeatTypeOpen, setIsRepeatTypeOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setStartTime('09:00');
      setEndTime('11:00');
      setBlockSize(1); // BUG-023: Reset block size
      setRepeatEnabled(false);
      setRepeatType('weekly');
      setRepeatCount(20);
      setCustomDays([1, 3, 5]);
      // TICKET-10: Reset repeat end mode
      setRepeatEndMode('count');
      setRepeatEndDate('');
      setTasks([]);
      setNewTaskText('');
      setShowTaskSource(false);
      setSelectedSource(null);
      setSelectedThemeListId(null);
      setIsRepeatTypeOpen(false);
    }
  }, [open]);

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
            // Guard: t could be undefined if array has holes
            t?.aufgaben?.forEach(a => {
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
    // TODO: Add lernplan support
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
      isNew: true, // Created in this dialog
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

  // Save handler
  // PRD §3.1: Different data based on mode (session vs block)
  const handleSave = () => {
    if (!isFormValid() || !date || !onSave) return;

    const baseData = {
      id: `block-${Date.now()}`,
      title: title.trim(),
      blockType: 'lernblock',
      description: description.trim(),
      repeatEnabled,
      repeatType: repeatEnabled ? repeatType : null,
      // TICKET-10: Include repeat end mode and appropriate value
      repeatEndMode: repeatEnabled ? repeatEndMode : null,
      repeatCount: repeatEnabled && repeatEndMode === 'count' ? repeatCount : null,
      repeatEndDate: repeatEnabled && repeatEndMode === 'date' ? repeatEndDate : null,
      customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
      tasks: tasks.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        sourceId: t.sourceId,
        source: t.source,
      })),
    };

    if (mode === 'session') {
      // Session mode: Include time data (for Week/Dashboard)
      Object.assign(baseData, {
        hasTime: true,
        startTime,
        endTime,
        startHour: calculateStartHour(),
        duration: calculateDuration(),
        isFromLernplan: false, // Manually created in Week/Dashboard
      });
    } else {
      // Block mode: Include block size (for Month view)
      Object.assign(baseData, {
        hasTime: false, // No specific time, just position-based
        blockSize: blockSize,
        isFromLernplan: false, // Manually created in Month view
      });
    }

    onSave(date, baseData);
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
          <DialogTitle>Neuen Lernblock erstellen</DialogTitle>
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

          {/* PRD §3.1: Time (Session mode) OR Block Size (Block mode) */}
          {mode === 'session' ? (
            /* Session mode: Time selection for Week/Dashboard */
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
          ) : (
            /* Block mode: Block size selection for Month view */
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900">
                Block-Größe <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setBlockSize(size)}
                    disabled={size > maxBlocks}
                    className={`w-12 h-12 rounded-lg border-2 text-sm font-medium transition-colors ${
                      blockSize === size
                        ? 'bg-neutral-900 text-white border-neutral-900'
                        : size > maxBlocks
                          ? 'bg-neutral-100 text-neutral-300 border-neutral-200 cursor-not-allowed'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                    }`}
                  >
                    {size}
                  </button>
                ))}
                <span className="text-sm text-neutral-500">
                  {blockSize === 1 ? '(2 Stunden)' : `(${blockSize * 2} Stunden)`}
                </span>
              </div>
              {maxBlocks < 4 && (
                <p className="text-xs text-neutral-500">
                  Nur {maxBlocks} Block{maxBlocks > 1 ? 's' : ''} verfügbar an diesem Tag
                </p>
              )}
            </div>
          )}

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

                {/* TICKET-10: Repeat end mode tabs */}
                <div className="space-y-3">
                  <label className="text-sm text-neutral-600">Wiederholen bis</label>
                  {/* Tab buttons */}
                  <div className="flex gap-1 p-1 bg-neutral-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setRepeatEndMode('count')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        repeatEndMode === 'count'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Anzahl
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatEndMode('date')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        repeatEndMode === 'date'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      Enddatum
                    </button>
                  </div>

                  {/* Count input (shown when repeatEndMode is 'count') */}
                  {repeatEndMode === 'count' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                        className="w-24 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm text-center"
                      />
                      <span className="text-sm text-neutral-600">Wiederholungen</span>
                    </div>
                  )}

                  {/* Date picker (shown when repeatEndMode is 'date') */}
                  {repeatEndMode === 'date' && (
                    <div className="flex items-center gap-3">
                      <input
                        type="date"
                        value={repeatEndDate}
                        min={date ? date.toISOString().split('T')[0] : ''}
                        onChange={(e) => setRepeatEndDate(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                      />
                    </div>
                  )}
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
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid()}
          >
            Erstellen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThemeBlockDialog;
