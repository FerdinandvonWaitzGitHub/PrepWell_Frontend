import React, { useState, useMemo, useCallback } from 'react';

/**
 * LernblockWidget component
 * Displays learning blocks and tasks on dashboard
 *
 * 4 States:
 * 1. No topics for today - shows "Aufgaben" with "Deine To-Dos" OR Themenliste (toggle)
 * 2. One topic - shows topic info + "Aufgaben zum Tagesthema"
 * 3. Multiple topics - accordion-style collapsible blocks
 * 4. Themenliste view - when no topics, user can view a dateless theme list
 *
 * Status: Backend-connected via CalendarContext
 */

// Icons
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 15l-6-6-6 6" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const ChecklistIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// Drag handle icon
const DragHandleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="2" />
    <circle cx="15" cy="6" r="2" />
    <circle cx="9" cy="12" r="2" />
    <circle cx="15" cy="12" r="2" />
    <circle cx="9" cy="18" r="2" />
    <circle cx="15" cy="18" r="2" />
  </svg>
);

/**
 * TaskItem component - einzelne Aufgabe (draggable)
 */
const TaskItem = ({
  task,
  onToggle,
  onTogglePriority,
  onEdit,
  onDelete,
  isEditing,
  editText,
  onEditChange,
  onEditSubmit,
  onEditCancel,
  draggable = true,
  dragSource = 'todos',
}) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'task',
      source: dragSource,
      task: {
        id: task.id,
        text: task.text,
        completed: task.completed,
        priority: task.priority,
      }
    }));
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 flex-shrink-0"
        />
        <input
          type="text"
          value={editText}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
          }}
          autoFocus
          className="flex-1 text-sm border-none outline-none bg-transparent"
        />
        <button
          type="button"
          onClick={onEditSubmit}
          className="text-xs text-gray-600 hover:text-gray-900"
        >
          OK
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white group cursor-grab active:cursor-grabbing"
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Drag Handle */}
      <span className="text-gray-300 group-hover:text-gray-400 flex-shrink-0">
        <DragHandleIcon />
      </span>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 flex-shrink-0"
      />
      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
        {task.text}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onTogglePriority(task.id)}
          className={`w-6 h-6 flex items-center justify-center rounded text-sm font-bold transition-colors ${
            task.priority === 'high'
              ? 'text-yellow-600 bg-yellow-50'
              : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
          }`}
          title="Als wichtig markieren"
        >
          !
        </button>
        <button
          type="button"
          onClick={() => onEdit(task.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Bearbeiten"
        >
          <EditIcon />
        </button>
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Löschen"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  );
};

/**
 * TaskList component - Liste von Aufgaben
 */
const TaskList = ({
  tasks,
  title,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
}) => {
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    return { total, completed };
  }, [tasks]);

  const handleStartEdit = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTaskId(taskId);
      setEditText(task.text);
    }
  };

  const handleEditSubmit = () => {
    if (editingTaskId && editText.trim() && onEditTask) {
      onEditTask(editingTaskId, editText.trim());
    }
    setEditingTaskId(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
    setEditText('');
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewTaskText('');
  };

  const handleNewTaskSubmit = () => {
    if (newTaskText.trim() && onAddTask) {
      onAddTask(newTaskText.trim());
    }
    setIsAddingNew(false);
    setNewTaskText('');
  };

  const handleNewTaskCancel = () => {
    setIsAddingNew(false);
    setNewTaskText('');
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <span className="text-xs text-gray-500">
          {stats.completed}/{stats.total} erledigt
        </span>
      </div>

      {/* Task Items */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onTogglePriority={onTogglePriority}
            onEdit={handleStartEdit}
            onDelete={onRemoveTask}
            isEditing={editingTaskId === task.id}
            editText={editText}
            onEditChange={setEditText}
            onEditSubmit={handleEditSubmit}
            onEditCancel={handleEditCancel}
          />
        ))}

        {tasks.length === 0 && !isAddingNew && (
          <p className="text-sm text-gray-500 py-2">Noch keine Aufgaben hinzugefügt.</p>
        )}

        {/* New Task Input */}
        {isAddingNew && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white">
            <input
              type="checkbox"
              disabled
              className="h-4 w-4 rounded border-gray-300 text-gray-900 flex-shrink-0 opacity-50"
            />
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewTaskSubmit();
                if (e.key === 'Escape') handleNewTaskCancel();
              }}
              placeholder="Neue Aufgabe..."
              autoFocus
              className="flex-1 text-sm border-none outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={handleNewTaskSubmit}
              className="text-xs text-gray-600 hover:text-gray-900"
            >
              OK
            </button>
          </div>
        )}
      </div>

      {/* Add Task Button */}
      <button
        type="button"
        onClick={handleAddNew}
        disabled={isAddingNew}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
      >
        <span className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 bg-white">
          <PlusIcon />
        </span>
        <span>Neue Aufgabe</span>
      </button>
    </div>
  );
};

/**
 * ThemeListUnterrechtsgebietRow - Unterrechtsgebiet mit Kapitel
 */
const ThemeListUnterrechtsgebietRow = ({
  unterrechtsgebiet,
  isExpanded,
  onToggleExpand,
  expandedKapitelId,
  onToggleKapitel,
  expandedThemaId,
  onToggleThema,
  onToggleAufgabe,
}) => {
  // Calculate progress for this unterrechtsgebiet
  let completedCount = 0;
  let totalCount = 0;
  unterrechtsgebiet.kapitel?.forEach(k => {
    k.themen?.forEach(t => {
      t.aufgaben?.forEach(a => {
        totalCount++;
        if (a.completed) completedCount++;
      });
    });
  });

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Unterrechtsgebiet Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium text-gray-900">{unterrechtsgebiet.name}</span>
          {unterrechtsgebiet.rechtsgebiet && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
              {unterrechtsgebiet.rechtsgebiet}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{completedCount}/{totalCount}</span>
      </button>

      {/* Expanded: Kapitel */}
      {isExpanded && unterrechtsgebiet.kapitel && (
        <div className="border-t border-gray-100 bg-gray-50">
          {unterrechtsgebiet.kapitel.map((kapitel) => (
            <ThemeListKapitelRow
              key={kapitel.id}
              kapitel={kapitel}
              isExpanded={expandedKapitelId === kapitel.id}
              onToggleExpand={() => onToggleKapitel(kapitel.id)}
              expandedThemaId={expandedThemaId}
              onToggleThema={onToggleThema}
              onToggleAufgabe={onToggleAufgabe}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListKapitelRow - Kapitel-Zeile mit Themen
 */
const ThemeListKapitelRow = ({
  kapitel,
  isExpanded,
  onToggleExpand,
  expandedThemaId,
  onToggleThema,
  onToggleAufgabe,
}) => {
  // Calculate progress for this kapitel
  let completedCount = 0;
  let totalCount = 0;
  kapitel.themen?.forEach(t => {
    t.aufgaben?.forEach(a => {
      totalCount++;
      if (a.completed) completedCount++;
    });
  });

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Kapitel Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium text-gray-700">{kapitel.title}</span>
        </div>
        <span className="text-xs text-gray-500">{completedCount}/{totalCount}</span>
      </button>

      {/* Expanded: Themen */}
      {isExpanded && kapitel.themen && (
        <div className="bg-white border-t border-gray-100">
          {kapitel.themen.map((thema) => (
            <ThemeListThemaRow
              key={thema.id}
              thema={thema}
              isExpanded={expandedThemaId === thema.id}
              onToggleExpand={() => onToggleThema(thema.id)}
              onToggleAufgabe={onToggleAufgabe}
              kapitelTitle={kapitel.title}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListThemaRow - Thema-Zeile mit Aufgaben (draggable)
 */
const ThemeListThemaRow = ({
  thema,
  isExpanded,
  onToggleExpand,
  onToggleAufgabe,
  kapitelTitle = '',
}) => {
  const completedCount = thema.aufgaben?.filter(a => a.completed).length || 0;
  const totalCount = thema.aufgaben?.length || 0;

  const handleAufgabeDragStart = (e, aufgabe) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'task',
      source: 'themenliste',
      task: {
        id: aufgabe.id,
        text: aufgabe.title,
        completed: aufgabe.completed,
        thema: thema.title,
        kapitel: kapitelTitle,
      }
    }));
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleAufgabeDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  return (
    <div className="border-b border-gray-50 last:border-b-0">
      {/* Thema Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-8 py-2 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm text-gray-600">{thema.title}</span>
        </div>
        <span className="text-xs text-gray-400">{completedCount}/{totalCount}</span>
      </button>

      {/* Expanded: Aufgaben */}
      {isExpanded && thema.aufgaben && thema.aufgaben.length > 0 && (
        <div className="px-8 pb-2 bg-gray-50">
          {thema.aufgaben.map((aufgabe) => (
            <div
              key={aufgabe.id}
              className="flex items-center gap-3 py-1.5 pl-4 rounded cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors group"
              draggable
              onDragStart={(e) => handleAufgabeDragStart(e, aufgabe)}
              onDragEnd={handleAufgabeDragEnd}
            >
              <span className="text-gray-300 group-hover:text-gray-400 flex-shrink-0">
                <DragHandleIcon />
              </span>
              <input
                type="checkbox"
                checked={aufgabe.completed}
                onChange={() => onToggleAufgabe(aufgabe.id)}
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
              />
              <span className={`text-sm ${aufgabe.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {aufgabe.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListView - Ansicht für eine ausgewählte Themenliste (hierarchisch)
 * Hierarchie: Unterrechtsgebiet → Kapitel → Themen → Aufgaben
 */
const ThemeListView = ({
  themeList,
  expandedUnterrechtsgebietId,
  onToggleUnterrechtsgebiet,
  expandedKapitelId,
  onToggleKapitel,
  expandedThemaId,
  onToggleThema,
  onToggleAufgabe,
}) => {
  if (!themeList) {
    return (
      <div className="text-sm text-gray-500 py-4">
        Keine Themenliste ausgewählt.
      </div>
    );
  }

  const unterrechtsgebiete = themeList.unterrechtsgebiete || [];
  const progress = themeList.progress || { completed: 0, total: 0 };

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 font-medium">{themeList.name}</span>
        <span className="text-gray-500">{progress.completed}/{progress.total} Aufgaben</span>
      </div>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
          />
        </div>
      )}

      {/* Unterrechtsgebiet Blocks */}
      {unterrechtsgebiete.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Diese Themenliste hat keine Inhalte.</p>
      ) : (
        unterrechtsgebiete.map((urg) => (
          <ThemeListUnterrechtsgebietRow
            key={urg.id}
            unterrechtsgebiet={urg}
            isExpanded={expandedUnterrechtsgebietId === urg.id}
            onToggleExpand={() => onToggleUnterrechtsgebiet(urg.id)}
            expandedKapitelId={expandedKapitelId}
            onToggleKapitel={onToggleKapitel}
            expandedThemaId={expandedThemaId}
            onToggleThema={onToggleThema}
            onToggleAufgabe={onToggleAufgabe}
          />
        ))
      )}
    </div>
  );
};

/**
 * TopicBlock component - einzelner Topic Block (für Accordion)
 */
const TopicBlock = ({
  topic,
  index,
  totalTopics,
  isExpanded,
  onToggleExpand,
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
}) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Header - always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black text-white text-xs font-medium">
                {typeof topic.rechtsgebiet === 'object' ? topic.rechtsgebiet?.name : topic.rechtsgebiet || 'Rechtsgebiet'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600">
                {index + 1} von {totalTopics} Blöcken
              </span>
            </div>

            {/* Title */}
            <h3 className={`text-base font-medium text-gray-900 leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
              {topic.title || 'Lernblock'}
            </h3>
          </div>

          {/* Expand/Collapse Button */}
          <button
            type="button"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 flex-shrink-0"
          >
            <span>{isExpanded ? 'Einklappen' : 'Ausklappen'}</span>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Description */}
          {topic.description && (
            <p className="text-sm text-gray-600 mt-3 mb-4">
              {topic.description}
            </p>
          )}

          {/* Tasks */}
          <div className="mt-4">
            <TaskList
              tasks={tasks}
              title="Aufgaben zum Tagesthema"
              onToggleTask={onToggleTask}
              onTogglePriority={onTogglePriority}
              onAddTask={onAddTask}
              onEditTask={onEditTask}
              onRemoveTask={onRemoveTask}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * SingleTopicView - Ansicht für einen einzelnen Topic
 */
const SingleTopicView = ({
  topic,
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Topic Info */}
      <div className="border-b border-gray-200 pb-4">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-black text-white text-xs font-medium">
            {typeof topic.rechtsgebiet === 'object' ? topic.rechtsgebiet?.name : topic.rechtsgebiet || 'Rechtsgebiet'}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-medium text-gray-900 leading-snug mb-2 line-clamp-3">
          {topic.title || 'Lernblock'}
        </h3>

        {/* Description */}
        {topic.description && (
          <p className="text-sm text-gray-600">
            {topic.description}
          </p>
        )}
      </div>

      {/* Tasks */}
      <TaskList
        tasks={tasks}
        title="Aufgaben zum Tagesthema"
        onToggleTask={onToggleTask}
        onTogglePriority={onTogglePriority}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onRemoveTask={onRemoveTask}
      />
    </div>
  );
};

/**
 * NoTopicsView - Ansicht ohne Topics (To-Dos oder Themenliste)
 */
const NoTopicsView = ({
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
  // Themenliste props
  themeLists = [],
  selectedThemeListId,
  onSelectThemeList,
  onToggleThemeListAufgabe,
}) => {
  const [viewMode, setViewMode] = useState('todos'); // 'todos' or 'themelist'
  const [expandedUnterrechtsgebietId, setExpandedUnterrechtsgebietId] = useState(null);
  const [expandedKapitelId, setExpandedKapitelId] = useState(null);
  const [expandedThemaId, setExpandedThemaId] = useState(null);

  const selectedThemeList = useMemo(() => {
    return themeLists.find(list => list.id === selectedThemeListId) || null;
  }, [themeLists, selectedThemeListId]);

  const handleToggleUnterrechtsgebiet = useCallback((urgId) => {
    setExpandedUnterrechtsgebietId(prev => prev === urgId ? null : urgId);
    setExpandedKapitelId(null);
    setExpandedThemaId(null);
  }, []);

  const handleToggleKapitel = useCallback((kapitelId) => {
    setExpandedKapitelId(prev => prev === kapitelId ? null : kapitelId);
    setExpandedThemaId(null);
  }, []);

  const handleToggleThema = useCallback((themaId) => {
    setExpandedThemaId(prev => prev === themaId ? null : themaId);
  }, []);

  const hasThemeLists = themeLists.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Toggle Switch */}
      <div className="border-b border-gray-200 pb-4">
        {/* Toggle Switch - only show if there are theme lists */}
        {hasThemeLists ? (
          <div className="flex items-center justify-center mb-3">
            <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setViewMode('todos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'todos'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ChecklistIcon />
                <span>To-Dos</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('themelist')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'themelist'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ListIcon />
                <span>Themenliste</span>
              </button>
            </div>
          </div>
        ) : (
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aufgaben</h2>
        )}

        <p className="text-sm text-gray-500 text-center">
          {viewMode === 'todos' ? 'Deine To-Dos' : 'Unterrechtsgebiete, Kapitel, Themen und Aufgaben'}
        </p>

        {/* Themenliste Dropdown - only show in themelist mode */}
        {viewMode === 'themelist' && hasThemeLists && (
          <div className="mt-3">
            <select
              value={selectedThemeListId || ''}
              onChange={(e) => onSelectThemeList(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <option value="">Themenliste auswählen...</option>
              {themeLists.map(list => (
                <option key={list.id} value={list.id}>
                  {list.name} ({list.progress?.total || 0} Aufgaben)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'todos' ? (
        <TaskList
          tasks={tasks}
          title="Deine To-Dos"
          onToggleTask={onToggleTask}
          onTogglePriority={onTogglePriority}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
          onRemoveTask={onRemoveTask}
        />
      ) : (
        <ThemeListView
          themeList={selectedThemeList}
          expandedUnterrechtsgebietId={expandedUnterrechtsgebietId}
          onToggleUnterrechtsgebiet={handleToggleUnterrechtsgebiet}
          expandedKapitelId={expandedKapitelId}
          onToggleKapitel={handleToggleKapitel}
          expandedThemaId={expandedThemaId}
          onToggleThema={handleToggleThema}
          onToggleAufgabe={onToggleThemeListAufgabe}
        />
      )}
    </div>
  );
};

/**
 * MultipleTopicsView - Accordion-Ansicht für mehrere Topics
 */
const MultipleTopicsView = ({
  topics,
  tasks,
  expandedTopicId,
  onToggleExpand,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
}) => {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-semibold text-gray-900">Lernblöcke</h2>
        <p className="text-sm text-gray-500 mt-1">{topics.length} Blöcke für heute geplant</p>
      </div>

      {/* Topic Blocks */}
      {topics.map((topic, index) => (
        <TopicBlock
          key={topic.id}
          topic={topic}
          index={index}
          totalTopics={topics.length}
          isExpanded={expandedTopicId === topic.id}
          onToggleExpand={() => onToggleExpand(topic.id)}
          tasks={tasks}
          onToggleTask={onToggleTask}
          onTogglePriority={onTogglePriority}
          onAddTask={onAddTask}
          onEditTask={onEditTask}
          onRemoveTask={onRemoveTask}
        />
      ))}
    </div>
  );
};

/**
 * Main LernblockWidget Component
 */
const LernblockWidget = ({
  className = '',
  topics = [],
  tasks = [],
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onEditTask,
  onRemoveTask,
  // Themenliste props
  themeLists = [],
  selectedThemeListId,
  onSelectThemeList,
  onToggleThemeListAufgabe,
}) => {
  // Accordion state - nur ein Topic auf einmal expanded
  const [expandedTopicId, setExpandedTopicId] = useState(() => {
    // Standardmäßig erstes Topic expanded
    return topics.length > 0 ? topics[0].id : null;
  });

  // Toggle expand - nur ein Topic kann expanded sein
  const handleToggleExpand = useCallback((topicId) => {
    setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  // Determine which view to show
  const topicCount = topics.length;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-5 overflow-y-auto max-h-[730px]">
        {topicCount === 0 && (
          <NoTopicsView
            tasks={tasks}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onRemoveTask={onRemoveTask}
            themeLists={themeLists}
            selectedThemeListId={selectedThemeListId}
            onSelectThemeList={onSelectThemeList}
            onToggleThemeListAufgabe={onToggleThemeListAufgabe}
          />
        )}

        {topicCount === 1 && (
          <SingleTopicView
            topic={topics[0]}
            tasks={tasks}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onRemoveTask={onRemoveTask}
          />
        )}

        {topicCount > 1 && (
          <MultipleTopicsView
            topics={topics}
            tasks={tasks}
            expandedTopicId={expandedTopicId}
            onToggleExpand={handleToggleExpand}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onRemoveTask={onRemoveTask}
          />
        )}
      </div>
    </div>
  );
};

export default LernblockWidget;
