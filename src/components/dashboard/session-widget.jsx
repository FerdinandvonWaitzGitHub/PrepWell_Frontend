import { useState, useMemo, useCallback } from 'react';

/**
 * SessionWidget component (formerly LernblockWidget)
 * Displays learning sessions and tasks on dashboard
 *
 * 4 States:
 * 1. No topics for today - shows "Aufgaben" with "Deine To-Dos" OR Themenliste (toggle)
 * 2. One topic - shows topic info + "Aufgaben zum Tagesthema"
 * 3. Multiple topics - accordion-style collapsible sessions
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

// ListIcon - reserved for future use
const _ListIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);
void _ListIcon;

const ChecklistIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const BookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const DragHandleIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="5" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="19" r="1" />
    <circle cx="15" cy="5" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="19" r="1" />
  </svg>
);


/**
 * TaskItem component - einzelne Aufgabe
 * Figma Design:
 * - Expanded (with description): bg-neutral-100, NO border, rounded-lg, p-2.5
 * - Collapsed (no description): border border-neutral-200, bg-white, rounded-lg
 * - Dual "!" priority indicators
 * - Drag handle on hover for drag & drop to Zeitplan
 * - Trash icon on hover
 */
const TaskItem = ({
  task,
  onToggle,
  onTogglePriority,
  onDelete,
  isEditing,
  editText,
  onEditChange,
  onEditSubmit,
  onEditCancel,
}) => {
  // Determine if expanded (has description) or collapsed
  const hasDescription = task.description && task.description.trim().length > 0;

  // Drag handlers for dropping tasks onto Zeitplan blocks
  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'task',
      source: 'todos',
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
      <div className="flex items-center gap-3 p-2.5 rounded-lg bg-neutral-100">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 flex-shrink-0"
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
          className="text-xs text-neutral-600 hover:text-neutral-900"
        >
          OK
        </button>
      </div>
    );
  }

  // Determine priority level (0, 1, or 2 exclamation marks active)
  const priorityLevel = task.priority === 'high' ? 2 : task.priority === 'medium' ? 1 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg group transition-all cursor-grab active:cursor-grabbing ${
        hasDescription
          ? 'bg-neutral-100 hover:bg-neutral-150'
          : 'border border-neutral-200 bg-white hover:bg-neutral-50'
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Drag Handle - visible on hover */}
      <span className="flex-shrink-0 text-neutral-300 group-hover:text-neutral-400 transition-colors">
        <DragHandleIcon />
      </span>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <span className={`text-sm ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-900'}`}>
          {task.text}
        </span>
        {hasDescription && (
          <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
            {task.description}
          </p>
        )}
      </div>
      {/* Priority indicator - single button that cycles through: none → medium → high → none */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          // Cycle through: none (0) → medium (1) → high (2) → none (0)
          const nextLevel = (priorityLevel + 1) % 3;
          const nextPriority = nextLevel === 0 ? 'none' : nextLevel === 1 ? 'medium' : 'high';
          onTogglePriority(task.id, nextPriority);
        }}
        className={`px-1.5 py-0.5 rounded text-sm font-semibold transition-colors ${
          priorityLevel === 0
            ? 'text-neutral-300 hover:text-neutral-500'
            : priorityLevel === 1
            ? 'text-yellow-600 bg-yellow-50'
            : 'text-red-600 bg-red-50'
        }`}
        title={priorityLevel === 0 ? 'Keine Priorität' : priorityLevel === 1 ? 'Mittlere Priorität' : 'Hohe Priorität'}
      >
        {priorityLevel === 0 ? '!' : priorityLevel === 1 ? '!' : '!!'}
      </button>
      {/* Trash icon - only on hover */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="w-6 h-6 flex items-center justify-center rounded text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
        title="Löschen"
      >
        <TrashIcon />
      </button>
    </div>
  );
};

/**
 * TaskList component - Liste von Aufgaben
 * Figma Design: Simple "Neue Aufgabe" button without border box
 */
const TaskList = ({
  tasks,
  title,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    return { total, completed };
  }, [tasks]);

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
        <h4 className="text-sm font-medium text-neutral-900">{title}</h4>
        <span className="text-xs text-neutral-500">
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
            onDelete={onRemoveTask}
          />
        ))}

        {tasks.length === 0 && !isAddingNew && (
          <p className="text-sm text-neutral-400 py-2">Noch keine Aufgaben hinzugefügt.</p>
        )}

        {/* New Task Input */}
        {isAddingNew && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-200 bg-white">
            <input
              type="checkbox"
              disabled
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 flex-shrink-0 opacity-50"
            />
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewTaskSubmit();
                if (e.key === 'Escape') handleNewTaskCancel();
              }}
              onBlur={handleNewTaskSubmit}
              placeholder="Neue Aufgabe..."
              autoFocus
              className="flex-1 text-sm border-none outline-none bg-transparent"
            />
          </div>
        )}
      </div>

      {/* Add Task Button - Figma: Simple text with Plus icon, NO border box */}
      <button
        type="button"
        onClick={handleAddNew}
        disabled={isAddingNew}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors disabled:opacity-50"
      >
        <PlusIcon />
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
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      {/* Unterrechtsgebiet Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium text-neutral-900">{unterrechtsgebiet.name}</span>
          {unterrechtsgebiet.rechtsgebiet && (
            <span className="text-xs px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
              {unterrechtsgebiet.rechtsgebiet}
            </span>
          )}
        </div>
        <span className="text-xs text-neutral-500">{completedCount}/{totalCount}</span>
      </button>

      {/* Expanded: Kapitel */}
      {isExpanded && unterrechtsgebiet.kapitel && (
        <div className="border-t border-neutral-100 bg-neutral-50">
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
    <div className="border-b border-neutral-100 last:border-b-0">
      {/* Kapitel Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium text-neutral-700">{kapitel.title}</span>
        </div>
        <span className="text-xs text-neutral-500">{completedCount}/{totalCount}</span>
      </button>

      {/* Expanded: Themen */}
      {isExpanded && kapitel.themen && (
        <div className="bg-white border-t border-neutral-100">
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
 * Scheduled aufgaben are grayed out and not draggable
 */
const ThemeListThemaRow = ({
  thema,
  isExpanded,
  onToggleExpand,
  onToggleAufgabe,
  kapitelTitle = '',
}) => {
  // Only count non-scheduled aufgaben for progress
  const availableAufgaben = thema.aufgaben?.filter(a => !a.scheduledInBlock) || [];
  const completedCount = availableAufgaben.filter(a => a.completed).length;
  const totalCount = availableAufgaben.length;
  const scheduledCount = (thema.aufgaben?.length || 0) - availableAufgaben.length;

  const handleAufgabeDragStart = (e, aufgabe) => {
    // Don't allow dragging scheduled aufgaben
    if (aufgabe.scheduledInBlock) {
      e.preventDefault();
      return;
    }
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
    <div className="border-b border-neutral-50 last:border-b-0">
      {/* Thema Header */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between px-8 py-2 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon className={`text-neutral-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          <span className="text-sm text-neutral-600">{thema.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {scheduledCount > 0 && (
            <span className="text-xs text-blue-500" title={`${scheduledCount} eingeplant`}>
              {scheduledCount} eingeplant
            </span>
          )}
          <span className="text-xs text-neutral-400">{completedCount}/{totalCount}</span>
        </div>
      </button>

      {/* Expanded: Aufgaben */}
      {isExpanded && thema.aufgaben && thema.aufgaben.length > 0 && (
        <div className="px-8 pb-2 bg-neutral-50">
          {thema.aufgaben.map((aufgabe) => {
            const isScheduled = !!aufgabe.scheduledInBlock;

            return (
              <div
                key={aufgabe.id}
                className={`flex items-center gap-3 py-1.5 pl-4 rounded transition-colors group ${
                  isScheduled
                    ? 'opacity-50 cursor-default'
                    : 'cursor-grab active:cursor-grabbing hover:bg-neutral-100'
                }`}
                draggable={!isScheduled}
                onDragStart={(e) => handleAufgabeDragStart(e, aufgabe)}
                onDragEnd={handleAufgabeDragEnd}
                title={isScheduled ? `Eingeplant: ${aufgabe.scheduledInBlock.blockTitle} (${aufgabe.scheduledInBlock.date})` : undefined}
              >
                {/* Drag Handle - hidden for scheduled */}
                <span className={`flex-shrink-0 ${isScheduled ? 'text-neutral-200' : 'text-neutral-300 group-hover:text-neutral-400'}`}>
                  {isScheduled ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <DragHandleIcon />
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={aufgabe.completed}
                  onChange={() => onToggleAufgabe(aufgabe.id)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isScheduled}
                  className={`h-4 w-4 rounded border-neutral-300 focus:ring-neutral-500 ${
                    isScheduled ? 'text-neutral-400' : 'text-neutral-900'
                  }`}
                />
                <span className={`text-sm ${
                  isScheduled
                    ? 'text-neutral-400 italic'
                    : aufgabe.completed
                      ? 'text-neutral-400 line-through'
                      : 'text-neutral-700'
                }`}>
                  {aufgabe.title}
                </span>
                {isScheduled && (
                  <span className="text-xs text-blue-400 ml-auto">
                    → {aufgabe.scheduledInBlock.date}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListView - Ansicht für eine ausgewählte Themenliste (hierarchisch)
 * Hierarchie: Unterrechtsgebiet → Kapitel → Themen → Aufgaben
 * Reserved for future Themenliste feature
 */
const _ThemeListView = ({
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
      <div className="text-sm text-neutral-500 py-4">
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
        <span className="text-neutral-600 font-medium">{themeList.name}</span>
        <span className="text-neutral-500">{progress.completed}/{progress.total} Aufgaben</span>
      </div>

      {/* Progress Bar */}
      {progress.total > 0 && (
        <div className="w-full bg-neutral-200 rounded-full h-1.5">
          <div
            className="bg-neutral-900 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }}
          />
        </div>
      )}

      {/* Unterrechtsgebiet Blocks */}
      {unterrechtsgebiete.length === 0 ? (
        <p className="text-sm text-neutral-500 py-2">Diese Themenliste hat keine Inhalte.</p>
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
void _ThemeListView;

/**
 * Helper function to get Rechtsgebiet color based on ID or name
 */
const getRechtsgebietColor = (rechtsgebiet) => {
  const name = typeof rechtsgebiet === 'object' ? rechtsgebiet?.id || rechtsgebiet?.name : rechtsgebiet;
  const lowerName = (name || '').toLowerCase();

  if (lowerName.includes('öffentlich') || lowerName.includes('oeffentlich') || lowerName === 'oeffentliches-recht') {
    return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' };
  }
  if (lowerName.includes('zivil') || lowerName === 'zivilrecht') {
    return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' };
  }
  if (lowerName.includes('straf') || lowerName === 'strafrecht') {
    return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' };
  }
  if (lowerName.includes('querschnitt') || lowerName === 'querschnitt') {
    return { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200' };
  }
  // Default
  return { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200' };
};

/**
 * TopicBlock component - einzelner Topic Block (für Accordion)
 * Design based on Figma: Rechtsgebiet-Tag, Titel, Beschreibung, Aufgaben
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
  onRemoveTask,
}) => {
  const rechtsgebietColors = getRechtsgebietColor(topic.rechtsgebiet);
  const rechtsgebietName = typeof topic.rechtsgebiet === 'object' ? topic.rechtsgebiet?.name : topic.rechtsgebiet || 'Rechtsgebiet';

  return (
    <div className={`rounded-xl overflow-hidden bg-white border-2 ${rechtsgebietColors.border} shadow-sm hover:shadow-md transition-shadow`}>
      {/* Header - always visible */}
      <div
        className="p-5 cursor-pointer hover:bg-neutral-50/50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Rechtsgebiet Badge - prominent styling like Figma */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg ${rechtsgebietColors.bg} ${rechtsgebietColors.text} text-sm font-semibold`}>
                {rechtsgebietName}
              </span>
              <span className="text-xs text-neutral-400 font-medium">
                Block {index + 1}/{totalTopics}
              </span>
            </div>

            {/* Title - Figma: text-2xl font-extralight */}
            <h3 className={`text-2xl font-extralight text-neutral-900 leading-snug ${isExpanded ? '' : 'line-clamp-2'}`}>
              {topic.title || 'Session'}
            </h3>

            {/* Description preview when collapsed - Figma: text-neutral-400 */}
            {!isExpanded && topic.description && (
              <p className="text-sm text-neutral-400 mt-2 line-clamp-1">
                {topic.description}
              </p>
            )}
          </div>

          {/* Expand/Collapse Button - cleaner design */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <span className="hidden sm:inline">{isExpanded ? 'Einklappen' : 'Details'}</span>
            {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-neutral-100 bg-neutral-50/30">
          {/* Description - Figma: text-neutral-400 */}
          {topic.description && (
            <p className="text-sm text-neutral-400 mt-4 mb-5 leading-relaxed">
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
 * Design based on Figma: Single prominent Lernplan card
 */
const SingleTopicView = ({
  topic,
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
}) => {
  const rechtsgebietColors = getRechtsgebietColor(topic.rechtsgebiet);
  const rechtsgebietName = typeof topic.rechtsgebiet === 'object' ? topic.rechtsgebiet?.name : topic.rechtsgebiet || 'Rechtsgebiet';

  return (
    <div className="flex flex-col gap-5">
      {/* Topic Card - styled like Figma Lernplan panel */}
      <div className={`rounded-xl border-2 ${rechtsgebietColors.border} bg-white overflow-hidden`}>
        <div className="p-5">
          {/* Rechtsgebiet Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg ${rechtsgebietColors.bg} ${rechtsgebietColors.text} text-sm font-semibold`}>
              {rechtsgebietName}
            </span>
          </div>

          {/* Title - Figma: text-2xl font-extralight */}
          <h3 className="text-2xl font-extralight text-neutral-900 leading-snug mb-3">
            {topic.title || 'Session'}
          </h3>

          {/* Description - Figma: text-neutral-400 */}
          {topic.description && (
            <p className="text-sm text-neutral-400 leading-relaxed">
              {topic.description}
            </p>
          )}
        </div>

        {/* Tasks section */}
        <div className="px-5 pb-5 pt-2 border-t border-neutral-100 bg-neutral-50/50">
          <TaskList
            tasks={tasks}
            title="Aufgaben"
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onRemoveTask={onRemoveTask}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * NoTopicsView - Ansicht ohne Topics (nur To-Dos)
 * BUG-018 FIX: Themenlisten-Toggle entfernt - Themenlisten nur auf Lernpläne-Seite
 */
const NoTopicsView = ({
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Header - simplified without toggle */}
      <div className="border-b border-neutral-200 pb-4">
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Aufgaben</h2>
        <p className="text-sm text-neutral-500">Deine To-Dos für heute</p>
      </div>

      {/* Content - only To-Dos */}
      <TaskList
        tasks={tasks}
        title="Deine To-Dos"
        onToggleTask={onToggleTask}
        onTogglePriority={onTogglePriority}
        onAddTask={onAddTask}
        onRemoveTask={onRemoveTask}
      />
    </div>
  );
};

/**
 * ExamModeView - View for exam mode with Lernplan/Todos toggle
 * Shows toggle between Lernplan (topics) and To-Dos
 */
const ExamModeView = ({
  topics,
  tasks,
  expandedTopicId,
  onToggleExpand,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
}) => {
  const [viewMode, setViewMode] = useState('lernplan'); // 'lernplan' or 'todos'

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Toggle Switch */}
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('lernplan')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'lernplan'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <BookIcon />
              <span>Lernplan</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('todos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'todos'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ChecklistIcon />
              <span>To-Dos</span>
            </button>
          </div>
        </div>

        <p className="text-sm text-neutral-500 text-center">
          {viewMode === 'lernplan'
            ? `${topics.length} Sessions für heute geplant`
            : 'Deine To-Dos'
          }
        </p>
      </div>

      {/* Content */}
      {viewMode === 'lernplan' ? (
        <div className="flex flex-col gap-3">
          {topics.length === 0 ? (
            <p className="text-sm text-neutral-500 py-4 text-center">
              Keine Sessions für heute geplant.
            </p>
          ) : topics.length === 1 ? (
            <SingleTopicView
              topic={topics[0]}
              tasks={tasks}
              onToggleTask={onToggleTask}
              onTogglePriority={onTogglePriority}
              onAddTask={onAddTask}
              onRemoveTask={onRemoveTask}
            />
          ) : (
            topics.map((topic, index) => (
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
                onRemoveTask={onRemoveTask}
              />
            ))
          )}
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          title="Deine To-Dos"
          onToggleTask={onToggleTask}
          onTogglePriority={onTogglePriority}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
        />
      )}
    </div>
  );
};

/**
 * Main SessionWidget Component (formerly LernblockWidget)
 *
 * Behavior based on mode:
 * - Exam Mode: Shows Lernplan/To-Dos toggle (with topics from Lernplan)
 * - Normal Mode: Shows Themenliste/To-Dos toggle (without topics)
 */
const SessionWidget = ({
  className = '',
  topics = [],
  tasks = [],
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
  // Themenliste props (reserved for future use)
  themeLists: _themeLists = [],
  selectedThemeListId: _selectedThemeListId,
  onSelectThemeList: _onSelectThemeList,
  onToggleThemeListAufgabe: _onToggleThemeListAufgabe,
  // Mode prop
  isExamMode = false,
}) => {
  // Mark reserved props as intentionally unused
  void _themeLists; void _selectedThemeListId; void _onSelectThemeList; void _onToggleThemeListAufgabe;

  // Accordion state - nur ein Topic auf einmal expanded
  const [expandedTopicId, setExpandedTopicId] = useState(() => {
    // Standardmäßig erstes Topic expanded
    return topics.length > 0 ? topics[0].id : null;
  });

  // Toggle expand - nur ein Topic kann expanded sein
  const handleToggleExpand = useCallback((topicId) => {
    setExpandedTopicId((prev) => (prev === topicId ? null : topicId));
  }, []);

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      <div className="p-5 overflow-y-auto max-h-[730px]">
        {isExamMode ? (
          // Exam Mode: Lernplan/To-Dos toggle
          <ExamModeView
            topics={topics}
            tasks={tasks}
            expandedTopicId={expandedTopicId}
            onToggleExpand={handleToggleExpand}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onRemoveTask={onRemoveTask}
          />
        ) : (
          // Normal Mode: Only To-Dos (BUG-018 FIX: Themenlisten-Toggle entfernt)
          <NoTopicsView
            tasks={tasks}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onRemoveTask={onRemoveTask}
          />
        )}
      </div>
    </div>
  );
};

// Legacy alias for backwards compatibility
export const LernblockWidget = SessionWidget;

export default SessionWidget;
