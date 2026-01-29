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
import { PlusIcon, MinusIcon, TrashIcon, CheckIcon, ChevronDownIcon } from '../../../components/ui/icon';
import { useStudiengang } from '../../../contexts/studiengang-context';
import { getAllSubjects, getRechtsgebietColor } from '../../../utils/rechtsgebiet-colors';
import { validateTimeRange } from '../../../utils/time-validation';

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
 * Manage Repetition Block Dialog Component
 * Dialog for viewing and editing an existing repetition learning block
 */
const ManageRepetitionBlockDialog = ({
  open,
  onOpenChange,
  date,
  block,
  onSave,
  onDelete,
  availableBlocks = 4,
}) => {
  const maxBlocks = availableBlocks;

  // W5: Get studiengang context for subject selection
  const { isJura } = useStudiengang();
  const subjects = useMemo(() => getAllSubjects(isJura), [isJura]);

  // Form state
  const [blockSize, setBlockSize] = useState(2);
  // W5: Rechtsgebiet/Fach selection
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState(null);
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Time settings
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [timeError, setTimeError] = useState(null);

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

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load block data when dialog opens
  useEffect(() => {
    if (open && block) {
      setBlockSize(block.blockSize || 2);
      setTitle(block.title || '');
      setDescription(block.description || '');
      // Load time settings
      setStartTime(block.startTime || '09:00');
      setEndTime(block.endTime || '11:00');
      // Load repeat settings
      setRepeatEnabled(block.repeatEnabled || false);
      setRepeatType(block.repeatType || 'weekly');
      setRepeatCount(block.repeatCount || 20);
      setCustomDays(block.customDays || [1, 3, 5]);
      // TICKET-10: Load repeat end mode and date
      setRepeatEndMode(block.repeatEndMode || 'count');
      setRepeatEndDate(block.repeatEndDate || '');
      setIsRepeatTypeOpen(false);
      // Load tasks
      setTasks(block.tasks || []);
      setNewTaskText('');
      setNewTaskDifficulty(0);
      setShowDeleteConfirm(false);
      // W5: Load rechtsgebiet from block
      setSelectedRechtsgebiet(block.rechtsgebiet || null);
      setIsRechtsgebietOpen(false);
      setTimeError(null);
    }
  }, [open, block]);

  // Validate time range when start/end time changes
  useEffect(() => {
    const validation = validateTimeRange(startTime, endTime);
    setTimeError(validation.valid ? null : validation.error);
  }, [startTime, endTime]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

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

  // Task handlers
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      difficulty: newTaskDifficulty,
      completed: false,
      priority: 'none'
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskDifficulty(0);
  };

  const handleToggleTask = (taskId) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleUpdateTaskDifficulty = (taskId, newDifficulty) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, difficulty: newDifficulty } : task
    ));
  };

  // Difficulty selector component
  const DifficultySelector = ({ value, onChange }) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value >= 1 ? 0 : 1)}
        className={`text-xl font-semibold transition-colors ${value >= 1 ? 'text-neutral-900' : 'text-neutral-300'}`}
      >
        !
      </button>
      <button
        type="button"
        onClick={() => onChange(value >= 2 ? 1 : 2)}
        className={`text-xl font-semibold transition-colors ${value >= 2 ? 'text-neutral-900' : 'text-neutral-300'}`}
      >
        !
      </button>
    </div>
  );

  // Save and close handler
  const handleSaveAndClose = () => {
    if (!date || !onSave || timeError) return;
    onSave(date, {
      ...block,
      title: title || 'Wiederholung',
      blockType: 'repetition',
      blockSize,
      description,
      // W5: Include rechtsgebiet for coloring
      rechtsgebiet: selectedRechtsgebiet,
      tasks,
      // Time settings
      hasTime: true,
      startTime,
      endTime,
      startHour: calculateStartHour(),
      duration: calculateDuration(),
      // Repeat settings
      repeatEnabled,
      repeatType: repeatEnabled ? repeatType : null,
      repeatCount: repeatEnabled && repeatEndMode === 'count' ? repeatCount : null,
      repeatEndMode: repeatEnabled ? repeatEndMode : null,
      repeatEndDate: repeatEnabled && repeatEndMode === 'date' ? repeatEndDate : null,
      customDays: repeatEnabled && repeatType === 'custom' ? customDays : null,
    });
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

  // Calculate total available blocks (current block size + free blocks)
  const totalAvailableBlocks = (block?.blockSize || 0) + maxBlocks;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-[942px] max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle className="text-lg font-light">Wiederholungsblock verwalten</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Two Column Layout */}
          <div className="flex gap-7">
            {/* Left Column - Form Fields */}
            <div className="flex-1 space-y-4">
              {/* Blockgröße */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-900">Blockgröße</label>
                <div className="inline-flex">
                  <button
                    type="button"
                    onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                    disabled={blockSize <= 1}
                    className="w-9 h-9 bg-white rounded-l-lg shadow-sm border border-neutral-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <MinusIcon size={16} className="text-neutral-900" />
                  </button>
                  <div className="h-9 px-4 py-2 bg-white shadow-sm border-t border-b border-neutral-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-neutral-900">{blockSize}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockSize(Math.min(totalAvailableBlocks, blockSize + 1))}
                    disabled={blockSize >= totalAvailableBlocks}
                    className="w-9 h-9 bg-white rounded-r-lg shadow-sm border border-neutral-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <PlusIcon size={16} className="text-neutral-900" />
                  </button>
                </div>
              </div>

              {/* Titel */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-900">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titel eintragen..."
                  className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm"
                />
              </div>

              {/* Beschreibung */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-900">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung eintragen..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white rounded-lg shadow-sm border border-neutral-200 text-sm resize-none"
                />
              </div>

              {/* W5: Fach/Rechtsgebiet Selection */}
              {subjects.length > 0 && (
                <div className="space-y-3">
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
                      step="900"
                      className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-600">Bis</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      step="900"
                      className="px-3 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 text-sm"
                    />
                  </div>
                </div>
                {timeError && (
                  <p className="text-sm text-red-500 mt-1">{timeError}</p>
                )}
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
            </div>

            {/* Right Column - Tasks */}
            <div className="flex-1 py-2.5 space-y-3">
              <label className="text-sm font-medium text-neutral-900">Aufgaben</label>

              {/* Task List */}
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2.5">
                    <div className="flex-1 max-w-[578px] p-2.5 rounded-lg border border-neutral-200 flex justify-between items-center">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-4 h-4 mt-0.5 rounded border-neutral-300"
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-sm font-medium ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
                            {task.text}
                          </span>
                        </div>
                      </div>
                      <DifficultySelector
                        value={task.difficulty}
                        onChange={(d) => handleUpdateTaskDifficulty(task.id, d)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-neutral-400 hover:text-red-500"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}

                {/* Add Task Button */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 max-w-[578px] p-2.5 rounded-lg border border-neutral-200 flex items-center gap-2">
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
                      placeholder="Neue Aufgabe..."
                      className="flex-1 text-sm bg-transparent border-none focus:outline-none"
                    />
                    <DifficultySelector value={newTaskDifficulty} onChange={setNewTaskDifficulty} />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskText.trim()}
                    className="h-8 px-3 py-2 bg-white rounded-lg shadow-sm border border-neutral-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <PlusIcon size={16} className="text-neutral-900" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={handleDiscard} className="rounded-3xl">
              Änderungen verwerfen
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Wirklich löschen?</span>
                <Button
                  variant="default"
                  onClick={handleDelete}
                  className="rounded-3xl text-red-600 hover:bg-red-50"
                >
                  Ja, löschen
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-3xl"
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-3xl gap-2"
              >
                Wiederholungsblock löschen
                <TrashIcon size={16} />
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSaveAndClose}
            disabled={!!timeError}
            className="rounded-3xl gap-2"
          >
            Fertig
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageRepetitionBlockDialog;
