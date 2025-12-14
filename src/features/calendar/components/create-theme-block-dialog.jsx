import { useState, useEffect } from 'react';
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
import { ChevronDownIcon, PlusIcon, MinusIcon, TrashIcon, CheckIcon } from '../../../components/ui/icon';
import { useUnterrechtsgebiete } from '../../../contexts';

// Fixed law areas (Rechtsgebiete)
const RECHTSGEBIETE = [
  { id: 'zivilrecht', name: 'Zivilrecht' },
  { id: 'oeffentliches-recht', name: 'Öffentliches Recht' },
  { id: 'strafrecht', name: 'Strafrecht' }
];

/**
 * Create Theme Block Dialog Component
 * Form for creating a new theme learning block
 */
const CreateThemeBlockDialog = ({ open, onOpenChange, date, onSave, availableSlots = 3 }) => {
  // Use central Unterrechtsgebiete context
  const {
    getUnterrechtsgebieteByRechtsgebiet,
    addUnterrechtsgebiet,
    deleteUnterrechtsgebiet
  } = useUnterrechtsgebiete();

  // Form state
  const [blockSize, setBlockSize] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState(null);
  const [selectedUnterrechtsgebiet, setSelectedUnterrechtsgebiet] = useState(null);

  // Dropdown states
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);
  const [isUnterrechtsgebietOpen, setIsUnterrechtsgebietOpen] = useState(false);

  // New Unterrechtsgebiet input
  const [isCreatingUnterrechtsgebiet, setIsCreatingUnterrechtsgebiet] = useState(false);
  const [newUnterrechtsgebietName, setNewUnterrechtsgebietName] = useState('');

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(0); // 0, 1, or 2

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setBlockSize(1);
      setTitle('');
      setDescription('');
      setSelectedRechtsgebiet(null);
      setSelectedUnterrechtsgebiet(null);
      setTasks([]);
      setNewTaskText('');
      setNewTaskDifficulty(0);
      setIsCreatingUnterrechtsgebiet(false);
      setDeleteConfirmId(null);
    }
  }, [open]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get current Unterrechtsgebiete for selected Rechtsgebiet
  const getCurrentUnterrechtsgebiete = () => {
    if (!selectedRechtsgebiet) return [];
    return getUnterrechtsgebieteByRechtsgebiet(selectedRechtsgebiet.id);
  };

  // Add new Unterrechtsgebiet
  const handleAddUnterrechtsgebiet = () => {
    if (!newUnterrechtsgebietName.trim() || !selectedRechtsgebiet) return;

    const newItem = {
      id: `urg-${Date.now()}`,
      name: newUnterrechtsgebietName.trim()
    };

    // Use context method to add to central storage
    addUnterrechtsgebiet(selectedRechtsgebiet.id, newItem);

    setNewUnterrechtsgebietName('');
    setIsCreatingUnterrechtsgebiet(false);
    setSelectedUnterrechtsgebiet(newItem);
  };

  // Delete Unterrechtsgebiet
  const handleDeleteUnterrechtsgebiet = (id) => {
    if (!selectedRechtsgebiet) return;

    // Use context method to delete from central storage
    deleteUnterrechtsgebiet(selectedRechtsgebiet.id, id);

    if (selectedUnterrechtsgebiet?.id === id) {
      setSelectedUnterrechtsgebiet(null);
    }
    setDeleteConfirmId(null);
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

  // Check if form is valid
  const isFormValid = () => {
    return selectedRechtsgebiet && selectedUnterrechtsgebiet;
  };

  // Save handler
  const handleSave = () => {
    if (!isFormValid() || !date || !onSave) return;

    onSave(date, {
      title: title || selectedUnterrechtsgebiet?.name || 'Tagesthema',
      blockType: 'theme',
      blockSize,
      description,
      rechtsgebiet: selectedRechtsgebiet,
      unterrechtsgebiet: selectedUnterrechtsgebiet,
      tasks,
      progress: '0/1'
    });

    onOpenChange(false);
  };

  // Discard handler
  const handleDiscard = () => {
    onOpenChange(false);
  };

  // Render difficulty indicator (clickable exclamation marks)
  const DifficultySelector = ({ value, onChange }) => (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(value >= 1 ? 0 : 1)}
        className={`text-lg font-bold transition-colors ${value >= 1 ? 'text-orange-500' : 'text-gray-300'}`}
      >
        !
      </button>
      <button
        type="button"
        onClick={() => onChange(value >= 2 ? 1 : 2)}
        className={`text-lg font-bold transition-colors ${value >= 2 ? 'text-red-500' : 'text-gray-300'}`}
      >
        !
      </button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Neuen Themenblock hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Rechtsgebiet Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Rechtsgebiet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  console.log('Rechtsgebiet clicked, current state:', isRechtsgebietOpen);
                  setIsRechtsgebietOpen(!isRechtsgebietOpen);
                  setIsUnterrechtsgebietOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${selectedRechtsgebiet ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedRechtsgebiet?.name || 'Rechtsgebiet auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isRechtsgebietOpen ? 'rotate-180' : ''}`} />
              </button>

              {isRechtsgebietOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {RECHTSGEBIETE.map(rg => (
                    <button
                      key={rg.id}
                      type="button"
                      onClick={() => {
                        setSelectedRechtsgebiet(rg);
                        setSelectedUnterrechtsgebiet(null);
                        setIsRechtsgebietOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        selectedRechtsgebiet?.id === rg.id ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {rg.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unterrechtsgebiet Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Unterrechtsgebiet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (selectedRechtsgebiet) {
                    setIsUnterrechtsgebietOpen(!isUnterrechtsgebietOpen);
                    setIsRechtsgebietOpen(false);
                  }
                }}
                disabled={!selectedRechtsgebiet}
                className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg transition-colors text-left ${
                  selectedRechtsgebiet ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <span className={`text-sm ${selectedUnterrechtsgebiet ? 'text-gray-900' : 'text-gray-500'}`}>
                  {selectedUnterrechtsgebiet?.name || (selectedRechtsgebiet ? 'Unterrechtsgebiet auswählen' : 'Erst Rechtsgebiet wählen')}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isUnterrechtsgebietOpen ? 'rotate-180' : ''}`} />
              </button>

              {isUnterrechtsgebietOpen && selectedRechtsgebiet && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {getCurrentUnterrechtsgebiete().length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      Noch keine Unterrechtsgebiete vorhanden
                    </div>
                  ) : (
                    getCurrentUnterrechtsgebiete().map(urg => (
                      <div
                        key={urg.id}
                        className={`flex items-center justify-between px-4 py-2 hover:bg-gray-50 ${
                          selectedUnterrechtsgebiet?.id === urg.id ? 'bg-primary-50' : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUnterrechtsgebiet(urg);
                            setIsUnterrechtsgebietOpen(false);
                          }}
                          className="flex-1 text-left text-sm text-gray-700"
                        >
                          {urg.name}
                        </button>

                        {deleteConfirmId === urg.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteUnterrechtsgebiet(urg.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Löschen bestätigen"
                            >
                              <CheckIcon size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(urg.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Löschen"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Add new Unterrechtsgebiet */}
            {selectedRechtsgebiet && (
              isCreatingUnterrechtsgebiet ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={newUnterrechtsgebietName}
                    onChange={(e) => setNewUnterrechtsgebietName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUnterrechtsgebiet()}
                    placeholder="Name eingeben..."
                    autoFocus
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                  />
                  <Button variant="primary" size="sm" onClick={handleAddUnterrechtsgebiet}>
                    Speichern
                  </Button>
                  <Button variant="default" size="sm" onClick={() => {
                    setIsCreatingUnterrechtsgebiet(false);
                    setNewUnterrechtsgebietName('');
                  }}>
                    Abbrechen
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingUnterrechtsgebiet(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 bg-primary-100 border-2 border-primary-300 rounded-lg hover:bg-primary-200 transition-colors"
                >
                  <PlusIcon size={16} className="text-gray-900" />
                  <span className="text-sm font-medium text-gray-900">+ Neues Unterrechtsgebiet erstellen</span>
                </button>
              )
            )}
          </div>

          {/* Blockgröße Field - Limited by available slots */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">
              Blockgröße <span className="text-xs text-gray-500">({availableSlots} Slot{availableSlots !== 1 ? 's' : ''} verfügbar)</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                disabled={blockSize <= 1}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MinusIcon size={16} className="text-gray-600" />
              </button>
              <span className="flex-1 text-center text-lg font-medium text-gray-900">{blockSize}</span>
              <button
                type="button"
                onClick={() => setBlockSize(Math.min(availableSlots, blockSize + 1))}
                disabled={blockSize >= availableSlots}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon size={16} className="text-gray-600" />
              </button>
            </div>
          </div>

          {/* Titel Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel eintragen..."
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Beschreibung Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung eintragen..."
              rows={3}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm resize-none"
            />
          </div>

          {/* Aufgaben Section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-900">Aufgaben</label>

            {/* Existing Tasks */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="group flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                    />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.text}
                    </span>
                    <DifficultySelector
                      value={task.difficulty}
                      onChange={(newDifficulty) => handleUpdateTaskDifficulty(task.id, newDifficulty)}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <TrashIcon size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Task */}
            <div className="group flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                disabled
                className="w-4 h-4 rounded border-gray-300 opacity-50"
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
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <TrashIcon size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTaskText.trim()}
                className="p-1 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon size={16} />
              </button>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button variant="default" onClick={handleDiscard}>
              Verwerfen
            </Button>
            <Button variant="default" onClick={() => console.log('Select archived block')}>
              Archivierten Lernblock auswählen
            </Button>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid()}
          >
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateThemeBlockDialog;
