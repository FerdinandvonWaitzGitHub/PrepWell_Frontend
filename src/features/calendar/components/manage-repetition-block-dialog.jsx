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
import { PlusIcon, MinusIcon, TrashIcon, CheckIcon } from '../../../components/ui/icon';

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
  availableSlots = 3
}) => {
  // Form state
  const [blockSize, setBlockSize] = useState(2);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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
      setTasks(block.tasks || []);
      setNewTaskText('');
      setNewTaskDifficulty(0);
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

  // Task handlers
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
        className={`text-xl font-semibold transition-colors ${value >= 1 ? 'text-gray-900' : 'text-gray-300'}`}
      >
        !
      </button>
      <button
        type="button"
        onClick={() => onChange(value >= 2 ? 1 : 2)}
        className={`text-xl font-semibold transition-colors ${value >= 2 ? 'text-gray-900' : 'text-gray-300'}`}
      >
        !
      </button>
    </div>
  );

  // Save and close handler
  const handleSaveAndClose = () => {
    if (!date || !onSave) return;
    onSave(date, {
      ...block,
      title: title || 'Wiederholung',
      blockType: 'repetition',
      blockSize,
      description,
      tasks
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

  // Calculate total available slots (current block size + free slots)
  const totalAvailableSlots = (block?.blockSize || 0) + availableSlots;

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
                <label className="text-sm font-medium text-gray-900">Blockgröße</label>
                <div className="inline-flex">
                  <button
                    type="button"
                    onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                    disabled={blockSize <= 1}
                    className="w-9 h-9 bg-white rounded-l-lg shadow-sm border border-gray-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <MinusIcon size={16} className="text-gray-900" />
                  </button>
                  <div className="h-9 px-4 py-2 bg-white shadow-sm border-t border-b border-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-900">{blockSize}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockSize(Math.min(totalAvailableSlots, blockSize + 1))}
                    disabled={blockSize >= totalAvailableSlots}
                    className="w-9 h-9 bg-white rounded-r-lg shadow-sm border border-gray-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <PlusIcon size={16} className="text-gray-900" />
                  </button>
                </div>
              </div>

              {/* Titel */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Titel</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titel eintragen..."
                  className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
                />
              </div>

              {/* Beschreibung */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-900">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschreibung eintragen..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 text-sm resize-none"
                />
              </div>
            </div>

            {/* Right Column - Tasks */}
            <div className="flex-1 py-2.5 space-y-3">
              <label className="text-sm font-medium text-gray-900">Aufgaben</label>

              {/* Task List */}
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2.5">
                    <div className="flex-1 max-w-[578px] p-2.5 rounded-lg border border-gray-200 flex justify-between items-center">
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300"
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
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
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                ))}

                {/* Add Task Button */}
                <div className="flex items-center gap-2.5">
                  <div className="flex-1 max-w-[578px] p-2.5 rounded-lg border border-gray-200 flex items-center gap-2">
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
                      placeholder="Neue Aufgabe..."
                      className="flex-1 text-sm bg-transparent border-none focus:outline-none"
                    />
                    <DifficultySelector value={newTaskDifficulty} onChange={setNewTaskDifficulty} />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskText.trim()}
                    className="h-8 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center disabled:opacity-50"
                  >
                    <PlusIcon size={16} className="text-gray-900" />
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
