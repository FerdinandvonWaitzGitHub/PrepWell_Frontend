import React, { useState, useEffect } from 'react';
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
import { PlusIcon, MinusIcon, TrashIcon } from '../../../components/ui/icon';

/**
 * Create Repetition Block Dialog Component
 * Form for creating a new repetition learning block
 */
const CreateRepetitionBlockDialog = ({ open, onOpenChange, date, onSave, availableSlots = 3 }) => {
  const [blockSize, setBlockSize] = useState(2);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
      setBlockSize(Math.min(2, availableSlots));
      setTitle('');
      setDescription('');
      setTasks([]);
      setNewTaskText('');
      setNewTaskDifficulty(0);
    }
  }, [open, availableSlots]);

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

  const handleSave = () => {
    if (date && onSave) {
      onSave(date, {
        title: title || 'Wiederholung',
        blockType: 'repetition',
        blockSize,
        description,
        tasks,
        progress: '0/1'
      });
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
