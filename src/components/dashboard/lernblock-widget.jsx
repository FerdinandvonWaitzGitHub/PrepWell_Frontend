import React, { useMemo, useState } from 'react';

/**
 * LernblockWidget component
 * Displays current learning block with tasks on dashboard
 *
 * Status: ✅ Fully implemented from Figma (Node-ID: 2175:1761)
 */
const LernblockWidget = ({ className = '', data }) => {
  const [tasks, setTasks] = useState(data?.tasks || []);
  const [newTaskText, setNewTaskText] = useState('');

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = (event) => {
    event.preventDefault();
    const text = newTaskText.trim();
    if (!text) return;

    setTasks([
      ...tasks,
      { id: Date.now(), text, completed: false }
    ]);
    setNewTaskText('');
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((task) => task.completed).length;
    const percentage = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [tasks]);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Tags, Title, Description */}
      <div className="p-5 border-b border-gray-200">
        {/* Tag */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-700">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 bg-white">
            {data?.blockType || 'Rechtsgebiet'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-light text-gray-900 mb-2 leading-snug">
          {data?.title || 'Tagesthema'}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600">
          {data?.description || 'Beschreibung des Lernblocks mit relevanten Informationen und Details zum Inhalt.'}
        </p>
      </div>

      {/* Tasks Section */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Aufgaben zum Tagesthema</h4>
          <span className="text-xs text-gray-600">
            {stats.completed}/{stats.total} erledigt ({stats.percentage}%)
          </span>
        </div>

        {/* Task List */}
        <div className="space-y-2 mb-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 px-3 py-1.5 rounded border border-gray-200 bg-white"
            >
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTask(task.id)}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <div className="flex-1">
                <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.text}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span title="Wichtig">!</span>
                <span title="Verschieben">↻</span>
                <button
                  type="button"
                  onClick={() => removeTask(task.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Aufgabe löschen"
                >
                  ⌫
                </button>
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <p className="text-sm text-gray-500">Noch keine Aufgaben hinzugefügt.</p>
          )}
        </div>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="flex items-center gap-2">
          <button
            type="submit"
            className="h-8 w-8 flex items-center justify-center rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            aria-label="Aufgabe hinzufügen"
          >
            +
          </button>
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Aufgabe"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
          />
        </form>
      </div>
    </div>
  );
};

export default LernblockWidget;
