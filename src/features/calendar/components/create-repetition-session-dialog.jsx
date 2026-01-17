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
import { PlusIcon, TrashIcon, ChevronDownIcon } from '../../../components/ui/icon';
import { useStudiengang } from '../../../contexts/studiengang-context';
import { getAllSubjects, getRechtsgebietColor } from '../../../utils/rechtsgebiet-colors';

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

/**
 * Create Repetition Block Dialog Component
 * Form for creating a new repetition learning block
 *
 * @param {string} mode - 'session' for time-based (Week/Dashboard), 'block' for position-based (Month)
 */
const CreateRepetitionBlockDialog = ({
  open,
  onOpenChange,
  date,
  onSave,
  availableBlocks = 4,
  mode = 'session', // PRD §3.1: 'session' = Uhrzeiten (Woche/Startseite), 'block' = Block-Größe (Monatsansicht)
  // T4.1: Initial time values from drag-to-select
  initialStartTime,
  initialEndTime,
}) => {
  const maxBlocks = availableBlocks;

  // W5: Get studiengang context for subject selection
  const { isJura } = useStudiengang();
  const subjects = useMemo(() => getAllSubjects(isJura), [isJura]);

  // W5: Rechtsgebiet/Fach selection
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState(null);
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);

  const [allocationSize, setAllocationSize] = useState(1); // For allocation mode (Month)
  const [sessionBlockSize, setSessionBlockSize] = useState(2); // For session mode (Week)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Time settings
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');

  // Repeat settings
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatCount, setRepeatCount] = useState(20);
  const [customDays, setCustomDays] = useState([1, 3, 5]);
  const [isRepeatTypeOpen, setIsRepeatTypeOpen] = useState(false);
  // TICKET-10: Repeat end mode (count OR date)
  const [repeatEndMode, setRepeatEndMode] = useState('count');
  const [repeatEndDate, setRepeatEndDate] = useState('');

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(0);

  // Format date for display (e.g., "Montag, 1. August 2025")
  const formatDate = (date) => {
    if (!date) return '';

    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${weekday}, ${day}. ${month} ${year}`;
  };

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAllocationSize(Math.min(1, maxBlocks)); // Reset block size for allocation mode
      setSessionBlockSize(Math.min(2, maxBlocks));
      setTitle('');
      setDescription('');
      // T4.1: Use initial time values if provided (from drag-to-select)
      setStartTime(initialStartTime || '09:00');
      setEndTime(initialEndTime || '11:00');
      setRepeatEnabled(false);
      setRepeatType('weekly');
      setRepeatCount(20);
      setCustomDays([1, 3, 5]);
      setIsRepeatTypeOpen(false);
      setTasks([]);
      setNewTaskText('');
      setNewTaskDifficulty(0);
      // W5: Reset rechtsgebiet selection
      setSelectedRechtsgebiet(null);
      setIsRechtsgebietOpen(false);
    }
  }, [open, maxBlocks, initialStartTime, initialEndTime]);

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

  // Get repeat type name
  const getRepeatTypeName = () => {
    return repeatTypeOptions.find(opt => opt.id === repeatType)?.name || 'Wöchentlich';
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

  // Add new task
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;

    const newTask = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      difficulty: newTaskDifficulty,
      completed: false
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskDifficulty(0);
  };

  // Toggle task completion
  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  // Update task difficulty
  const handleUpdateTaskDifficulty = (taskId, newDifficulty) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, difficulty: newDifficulty } : task
    ));
  };

  // Render difficulty indicator (clickable exclamation marks)
  const DifficultySelector = ({ value, onChange }) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value >= 1 ? 0 : 1)}
        className={`text-lg font-bold transition-colors ${value >= 1 ? 'text-orange-500' : 'text-neutral-300'}`}
      >
        !
      </button>
      <button
        type="button"
        onClick={() => onChange(value >= 2 ? 1 : 2)}
        className={`text-lg font-bold transition-colors ${value >= 2 ? 'text-red-500' : 'text-neutral-300'}`}
      >
        !
      </button>
    </div>
  );

  const handleSave = () => {
    if (date && onSave) {
      const baseData = {
        title: title || 'Wiederholung',
        blockType: 'repetition',
        description,
        tasks,
        progress: '0/1',
        // W5: Include rechtsgebiet for coloring
        rechtsgebiet: selectedRechtsgebiet,
        // Repeat settings
        repeatEnabled,
        repeatType: repeatEnabled ? repeatType : null,
        repeatCount: repeatEnabled && repeatEndMode === 'count' ? repeatCount : null,
        repeatEndMode: repeatEnabled ? repeatEndMode : null,
        repeatEndDate: repeatEnabled && repeatEndMode === 'date' ? repeatEndDate : null,
        customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
      };

      // Add mode-specific data
      if (mode === 'session') {
        // Session mode: time-based (Week/Dashboard)
        Object.assign(baseData, {
          blockSize: sessionBlockSize,
          hasTime: true,
          startTime,
          endTime,
          startHour: calculateStartHour(),
          duration: calculateDuration(),
        });
      } else {
        // Allocation mode: position-based (Month)
        Object.assign(baseData, {
          blockSize: allocationSize,
          hasTime: false,
          isFromLernplan: false, // Manually created block
        });
      }

      onSave(date, baseData);
    }
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Neuen Wiederholungsblock hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Block-Größe Field - Only in block mode (Month view) */}
          {mode === 'block' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900">
                Block-Größe <span className="text-xs text-neutral-500">({maxBlocks} Block{maxBlocks !== 1 ? 's' : ''} verfügbar)</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setAllocationSize(size)}
                    disabled={size > maxBlocks}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      allocationSize === size
                        ? 'bg-neutral-900 text-white'
                        : size > maxBlocks
                          ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    {size} Block{size !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Titel Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel eintragen..."
              className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Beschreibung Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eintragen..."
              rows={3}
              className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
            />
          </div>

          {/* W5: Fach/Rechtsgebiet Selection */}
          {subjects.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-900">
                {isJura ? 'Rechtsgebiet' : 'Fach'}
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRechtsgebietOpen(!isRechtsgebietOpen)}
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 text-left"
                >
                  <div className="flex items-center gap-2">
                    {selectedRechtsgebiet && (
                      <span className={`w-3 h-3 rounded-full ${getRechtsgebietColor(selectedRechtsgebiet).solid}`} />
                    )}
                    <span className="text-sm text-neutral-900">
                      {selectedRechtsgebiet
                        ? subjects.find(s => s.id === selectedRechtsgebiet)?.name || 'Auswählen...'
                        : `${isJura ? 'Rechtsgebiet' : 'Fach'} auswählen...`}
                    </span>
                  </div>
                  <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isRechtsgebietOpen ? 'rotate-180' : ''}`} />
                </button>
                {isRechtsgebietOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Option to clear selection */}
                    <button
                      type="button"
                      onClick={() => { setSelectedRechtsgebiet(null); setIsRechtsgebietOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg ${
                        !selectedRechtsgebiet ? 'bg-neutral-100 font-medium' : ''
                      }`}
                    >
                      <span className="text-neutral-500">Kein {isJura ? 'Rechtsgebiet' : 'Fach'}</span>
                    </button>
                    {subjects.map(subject => {
                      const colors = getRechtsgebietColor(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => { setSelectedRechtsgebiet(subject.id); setIsRechtsgebietOpen(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 last:rounded-b-lg flex items-center gap-2 ${
                            selectedRechtsgebiet === subject.id ? 'bg-neutral-100 font-medium' : ''
                          }`}
                        >
                          <span className={`w-3 h-3 rounded-full ${colors.solid}`} />
                          <span>{subject.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Uhrzeit - Only in session mode (Week/Dashboard) */}
          {mode === 'session' && (
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

          {/* Aufgaben Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-neutral-900">Aufgaben</label>

            {/* Existing Tasks */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="group flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-400"
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                      {task.text}
                    </span>
                    <DifficultySelector
                      value={task.difficulty}
                      onChange={(newDifficulty) => handleUpdateTaskDifficulty(task.id, newDifficulty)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Task */}
            <div className="group flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg">
              <input
                type="checkbox"
                disabled
                className="w-4 h-4 rounded border-neutral-300 opacity-50"
              />
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                placeholder="Neue Aufgabe eingeben..."
                className="flex-1 text-sm bg-transparent border-none focus:outline-none"
              />
              <DifficultySelector value={newTaskDifficulty} onChange={setNewTaskDifficulty} />
              {newTaskText.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setNewTaskText('');
                    setNewTaskDifficulty(0);
                  }}
                  className="p-1 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <TrashIcon size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
                className="p-1 text-neutral-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="justify-between">
          <Button
            variant="default"
            onClick={handleDiscard}
          >
            Verwerfen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRepetitionBlockDialog;
