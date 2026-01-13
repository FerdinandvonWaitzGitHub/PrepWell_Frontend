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
            : 'text-neutral-700 hover:text-neutral-900'
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
 * TICKET-5: Tasks are now editable via double-click
 */
const TaskList = ({
  tasks,
  title,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
  onEditTask, // TICKET-5: Edit task callback
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');

  // TICKET-5: Edit state for inline editing
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');

  // TICKET-5: Start editing a task
  const handleStartEdit = useCallback((task) => {
    setEditingTaskId(task.id);
    setEditTaskText(task.text || '');
  }, []);

  // TICKET-5: Submit edit
  const handleEditSubmit = useCallback(() => {
    if (editingTaskId && editTaskText.trim() && onEditTask) {
      onEditTask(editingTaskId, editTaskText.trim());
    }
    setEditingTaskId(null);
    setEditTaskText('');
  }, [editingTaskId, editTaskText, onEditTask]);

  // TICKET-5: Cancel edit
  const handleEditCancel = useCallback(() => {
    setEditingTaskId(null);
    setEditTaskText('');
  }, []);

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

      {/* Task Items - TICKET-5: Double-click to edit */}
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div key={task.id} onDoubleClick={() => handleStartEdit(task)}>
            <TaskItem
              task={task}
              onToggle={onToggleTask}
              onTogglePriority={onTogglePriority}
              onDelete={onRemoveTask}
              isEditing={editingTaskId === task.id}
              editText={editingTaskId === task.id ? editTaskText : ''}
              onEditChange={setEditTaskText}
              onEditSubmit={handleEditSubmit}
              onEditCancel={handleEditCancel}
            />
          </div>
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
 * When chapterLevelEnabled=true: Unterrechtsgebiet → Kapitel → Themen → Aufgaben
 * When chapterLevelEnabled=false: Unterrechtsgebiet → Themen → Aufgaben (skips Kapitel)
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
  onAddAufgabe, // Add aufgabe callback
  onUpdateAufgabe, // Update aufgabe callback
  onDeleteAufgabe, // Delete aufgabe callback
  onToggleAufgabePriority, // Toggle aufgabe priority callback
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
  chapterLevelEnabled = false, // Option C: Whether to show Kapitel level in hierarchy
}) => {
  // Calculate progress for this unterrechtsgebiet
  let completedCount = 0;
  let totalCount = 0;
  unterrechtsgebiet.kapitel?.forEach(k => {
    k.themen?.forEach(t => {
      // Guard: t could be undefined if array has holes
      t?.aufgaben?.forEach(a => {
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

      {/* Expanded: Show Kapitel or Themen directly based on chapterLevelEnabled */}
      {isExpanded && unterrechtsgebiet.kapitel && (
        <div className="border-t border-neutral-100 bg-neutral-50">
          {chapterLevelEnabled ? (
            // Show Kapitel level (full hierarchy)
            unterrechtsgebiet.kapitel.map((kapitel) => (
              <ThemeListKapitelRow
                key={kapitel.id}
                kapitel={kapitel}
                unterrechtsgebietId={unterrechtsgebiet.id}
                rechtsgebietId={unterrechtsgebiet.rechtsgebietId}
                isExpanded={expandedKapitelId === kapitel.id}
                onToggleExpand={() => onToggleKapitel(kapitel.id)}
                expandedThemaId={expandedThemaId}
                onToggleThema={onToggleThema}
                onToggleAufgabe={onToggleAufgabe}
                onAddAufgabe={onAddAufgabe}
                onUpdateAufgabe={onUpdateAufgabe}
                onDeleteAufgabe={onDeleteAufgabe}
                onToggleAufgabePriority={onToggleAufgabePriority}
                onToggleThemaCompleted={onToggleThemaCompleted}
                showThemaCheckbox={showThemaCheckbox}
              />
            ))
          ) : (
            // Skip Kapitel level - show Themen directly
            unterrechtsgebiet.kapitel.flatMap((kapitel) =>
              (kapitel.themen || []).map((thema) => (
                <ThemeListThemaRow
                  key={thema.id}
                  thema={thema}
                  kapitelId={kapitel.id}
                  unterrechtsgebietId={unterrechtsgebiet.id}
                  rechtsgebietId={unterrechtsgebiet.rechtsgebietId}
                  isExpanded={expandedThemaId === thema.id}
                  onToggleExpand={() => onToggleThema(thema.id)}
                  onToggleAufgabe={onToggleAufgabe}
                  onAddAufgabe={onAddAufgabe}
                  onUpdateAufgabe={onUpdateAufgabe}
                  onDeleteAufgabe={onDeleteAufgabe}
                  onToggleAufgabePriority={onToggleAufgabePriority}
                  onToggleThemaCompleted={onToggleThemaCompleted}
                  showThemaCheckbox={showThemaCheckbox}
                  kapitelTitle={kapitel.title}
                />
              ))
            )
          )}
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
  unterrechtsgebietId,
  rechtsgebietId,
  isExpanded,
  onToggleExpand,
  expandedThemaId,
  onToggleThema,
  onToggleAufgabe,
  onAddAufgabe, // Add aufgabe callback
  onUpdateAufgabe, // Update aufgabe callback
  onDeleteAufgabe, // Delete aufgabe callback
  onToggleAufgabePriority, // Toggle aufgabe priority callback
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
}) => {
  // Calculate progress for this kapitel
  let completedCount = 0;
  let totalCount = 0;
  kapitel.themen?.forEach(t => {
    // Guard: t could be undefined if array has holes
    t?.aufgaben?.forEach(a => {
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
              kapitelId={kapitel.id}
              unterrechtsgebietId={unterrechtsgebietId}
              rechtsgebietId={rechtsgebietId}
              isExpanded={expandedThemaId === thema.id}
              onToggleExpand={() => onToggleThema(thema.id)}
              onToggleAufgabe={onToggleAufgabe}
              onAddAufgabe={onAddAufgabe}
              onUpdateAufgabe={onUpdateAufgabe}
              onDeleteAufgabe={onDeleteAufgabe}
              onToggleAufgabePriority={onToggleAufgabePriority}
              onToggleThemaCompleted={onToggleThemaCompleted}
              showThemaCheckbox={showThemaCheckbox}
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
 * Always expandable (even with no aufgaben) to allow adding new tasks
 */
const ThemeListThemaRow = ({
  thema,
  kapitelId,
  unterrechtsgebietId,
  rechtsgebietId,
  isExpanded,
  onToggleExpand,
  onToggleAufgabe,
  onAddAufgabe, // Add aufgabe callback
  onUpdateAufgabe, // Update aufgabe callback
  onDeleteAufgabe, // Delete aufgabe callback
  onToggleAufgabePriority, // Toggle aufgabe priority callback
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
  kapitelTitle = '',
}) => {
  // Local state for editing mode - prevents input->span switch during typing
  const [editingAufgabeId, setEditingAufgabeId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Guard: thema could be undefined if parent array has holes
  if (!thema) return null;

  // Only count non-scheduled aufgaben for progress
  const availableAufgaben = thema.aufgaben?.filter(a => !a.scheduledInBlock) || [];
  const completedCount = availableAufgaben.filter(a => a.completed).length;
  const totalCount = availableAufgaben.length;
  const scheduledCount = (thema.aufgaben?.length || 0) - availableAufgaben.length;

  // Start editing an aufgabe
  const handleStartEdit = (aufgabe) => {
    setEditingAufgabeId(aufgabe.id);
    setEditingTitle(aufgabe.title || '');
  };

  // Save and exit edit mode
  const handleSaveEdit = (aufgabeId) => {
    if (editingTitle.trim()) {
      onUpdateAufgabe?.(unterrechtsgebietId, kapitelId, thema.id, aufgabeId, { title: editingTitle.trim() }, rechtsgebietId);
    }
    setEditingAufgabeId(null);
    setEditingTitle('');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingAufgabeId(null);
    setEditingTitle('');
  };

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

  // T5.4: Thema drag handler - drag complete thema with all available aufgaben
  const handleThemaDragStart = (e) => {
    // Only allow dragging if there are available (non-scheduled, non-completed) aufgaben
    const draggableAufgaben = (thema.aufgaben || []).filter(a => !a.scheduledInBlock && !a.completed);
    if (draggableAufgaben.length === 0) {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'thema',
      source: 'themenliste',
      thema: {
        id: thema.id,
        title: thema.title,
        kapitelId: kapitelId,
        unterrechtsgebietId: unterrechtsgebietId,
        rechtsgebietId: rechtsgebietId,
        kapitelTitle: kapitelTitle,
        aufgaben: draggableAufgaben.map(a => ({
          id: a.id,
          title: a.title,
          completed: a.completed || false,
          priority: a.priority || 'none',
        })),
      },
    }));
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.classList.add('opacity-50');
  };

  const handleThemaDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  // Check if thema can be dragged (has available aufgaben)
  const canDragThema = (thema.aufgaben || []).some(a => !a.scheduledInBlock && !a.completed);

  const handleAddAufgabe = () => {
    if (onAddAufgabe) {
      // Add the aufgabe first
      onAddAufgabe(unterrechtsgebietId, kapitelId, thema.id, rechtsgebietId);
      // Note: The new aufgabe will be created with empty title and auto-focused
      // We set editing state to 'new' to track that a new aufgabe is being created
      setEditingAufgabeId('new');
      setEditingTitle('');
    }
  };

  return (
    <div className="border-b border-neutral-50 last:border-b-0">
      {/* Thema Header - T5.4: draggable to schedule complete thema */}
      <div
        className={`w-full flex items-center justify-between px-8 py-2 hover:bg-neutral-50 transition-colors group ${
          canDragThema ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        draggable={canDragThema}
        onDragStart={handleThemaDragStart}
        onDragEnd={handleThemaDragEnd}
      >
        <div className="flex items-center gap-3">
          {/* T5.4: Drag Handle for Thema - visible when draggable */}
          {canDragThema && (
            <span className="text-neutral-300 group-hover:text-neutral-400 flex-shrink-0">
              <DragHandleIcon />
            </span>
          )}
          {/* T5.1: Thema checkbox - only show when showThemaCheckbox is true */}
          {showThemaCheckbox && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleThemaCompleted?.(unterrechtsgebietId, kapitelId, thema.id, rechtsgebietId);
              }}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                thema.completed
                  ? 'bg-neutral-900 border-neutral-900'
                  : 'border-neutral-300 hover:border-neutral-400'
              }`}
              title={thema.completed ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
            >
              {thema.completed && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-2"
          >
            <ChevronDownIcon className={`text-neutral-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            <span className={`text-sm ${thema.completed ? 'text-neutral-400 line-through' : 'text-neutral-600'}`}>{thema.title}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {scheduledCount > 0 && (
            <span className="text-xs text-blue-500" title={`${scheduledCount} eingeplant`}>
              {scheduledCount} eingeplant
            </span>
          )}
          <span className="text-xs text-neutral-400">{completedCount}/{totalCount}</span>
        </div>
      </div>

      {/* Expanded: Aufgaben - always show when expanded (even if empty) */}
      {isExpanded && (
        <div className="px-8 pb-2 bg-neutral-50">
          {/* Existing Aufgaben */}
          {thema.aufgaben && thema.aufgaben.length > 0 && (
            <div className="space-y-0.5">
              {thema.aufgaben.map((aufgabe) => {
                const isScheduled = !!aufgabe.scheduledInBlock;
                const hasTitle = !!aufgabe.title;
                // Check if this aufgabe is being edited OR is a new aufgabe being created
                const isEditing = editingAufgabeId === aufgabe.id ||
                  (editingAufgabeId === 'new' && !aufgabe.title);

                return (
                  <div
                    key={aufgabe.id}
                    className={`flex items-center gap-3 py-1.5 pl-4 rounded transition-colors group ${
                      isScheduled
                        ? 'opacity-50 cursor-default'
                        : hasTitle && !isEditing ? 'cursor-grab active:cursor-grabbing hover:bg-neutral-100' : ''
                    }`}
                    draggable={!isScheduled && hasTitle && !isEditing}
                    onDragStart={(e) => handleAufgabeDragStart(e, aufgabe)}
                    onDragEnd={handleAufgabeDragEnd}
                    title={isScheduled ? `Eingeplant: ${aufgabe.scheduledInBlock.blockTitle} (${aufgabe.scheduledInBlock.date})` : undefined}
                  >
                    {/* Drag Handle - hidden for scheduled or editing aufgaben */}
                    <span className={`flex-shrink-0 ${isScheduled ? 'text-neutral-200' : 'text-neutral-300 group-hover:text-neutral-400'}`}>
                      {isScheduled ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      ) : hasTitle && !isEditing ? (
                        <DragHandleIcon />
                      ) : (
                        <span className="w-3" />
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={aufgabe.completed}
                      onChange={() => onToggleAufgabe(aufgabe.id)}
                      onClick={(e) => e.stopPropagation()}
                      disabled={isScheduled || !hasTitle || isEditing}
                      className={`h-4 w-4 rounded border-neutral-300 focus:ring-neutral-500 ${
                        isScheduled ? 'text-neutral-400' : 'text-neutral-900'
                      }`}
                    />
                    {/* Show input when editing, span otherwise */}
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(aufgabe.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(aufgabe.id);
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        placeholder="Aufgabe eingeben..."
                        autoFocus
                        className="flex-1 text-sm bg-transparent border-b border-neutral-300 focus:border-primary-400 focus:outline-none py-0.5"
                      />
                    ) : hasTitle ? (
                      <span
                        className={`text-sm flex-1 ${
                          isScheduled
                            ? 'text-neutral-400 italic'
                            : aufgabe.completed
                              ? 'text-neutral-400 line-through'
                              : 'text-neutral-700'
                        }`}
                        onDoubleClick={() => !isScheduled && handleStartEdit(aufgabe)}
                        title={!isScheduled ? 'Doppelklick zum Bearbeiten' : undefined}
                      >
                        {aufgabe.title}
                      </span>
                    ) : (
                      <span
                        className="text-sm text-neutral-400 flex-1 cursor-pointer"
                        onClick={() => handleStartEdit(aufgabe)}
                      >
                        Aufgabe eingeben...
                      </span>
                    )}
                    {/* Priority indicator - cycles: none → medium (!) → high (!!) → none */}
                    {!isScheduled && hasTitle && !isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleAufgabePriority?.(unterrechtsgebietId, kapitelId, thema.id, aufgabe.id, aufgabe.priority || 'none', rechtsgebietId);
                        }}
                        className={`px-1 py-0.5 rounded text-xs font-semibold transition-colors ${
                          (aufgabe.priority || 'none') === 'none'
                            ? 'text-neutral-300 hover:text-neutral-500 opacity-0 group-hover:opacity-100'
                            : 'text-neutral-700 hover:text-neutral-900'
                        }`}
                        title={
                          (aufgabe.priority || 'none') === 'none' ? 'Keine Priorität' :
                          aufgabe.priority === 'medium' ? 'Mittlere Priorität' : 'Hohe Priorität'
                        }
                      >
                        {(aufgabe.priority || 'none') === 'none' ? '!' : aufgabe.priority === 'medium' ? '!' : '!!'}
                      </button>
                    )}
                    {/* Delete button - only visible on hover for non-scheduled tasks */}
                    {!isScheduled && hasTitle && !isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteAufgabe?.(unterrechtsgebietId, kapitelId, thema.id, aufgabe.id, rechtsgebietId);
                        }}
                        className="p-0.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Löschen"
                      >
                        <TrashIcon />
                      </button>
                    )}
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

          {/* Add Aufgabe Button - always visible */}
          <button
            onClick={handleAddAufgabe}
            className="flex items-center gap-1 px-4 py-1.5 mt-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Aufgabe
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListView - Ansicht für eine ausgewählte Themenliste (hierarchisch)
 * Hierarchie: Unterrechtsgebiet → Kapitel → Themen → Aufgaben
 * When chapterLevelEnabled=false: Unterrechtsgebiet → Themen → Aufgaben (skips Kapitel)
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
  onAddAufgabe, // Add aufgabe callback
  onUpdateAufgabe, // Update aufgabe callback
  onDeleteAufgabe, // Delete aufgabe callback
  onToggleAufgabePriority, // Toggle aufgabe priority callback
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
  chapterLevelEnabled = false, // Option C: Whether to show Kapitel level in hierarchy
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
            onAddAufgabe={onAddAufgabe}
            onUpdateAufgabe={onUpdateAufgabe}
            onDeleteAufgabe={onDeleteAufgabe}
            onToggleAufgabePriority={onToggleAufgabePriority}
            onToggleThemaCompleted={onToggleThemaCompleted}
            showThemaCheckbox={showThemaCheckbox}
            chapterLevelEnabled={chapterLevelEnabled}
          />
        ))
      )}
    </div>
  );
};

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
 * NoTopicsView - Ansicht ohne Topics (To-Dos oder Themenliste)
 * Toggle zwischen To-Dos und Themenliste mit Dropdown-Auswahl
 */
const NoTopicsView = ({
  tasks,
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
  onEditTask, // TICKET-5: Edit task callback
  // Themenliste props
  themeLists = [],
  selectedThemeListId,
  onSelectThemeList,
  onToggleThemeListAufgabe,
  onAddThemeListAufgabe, // Add aufgabe to theme list
  onUpdateThemeListAufgabe, // Update aufgabe title in theme list
  onDeleteThemeListAufgabe, // Delete aufgabe from theme list
  onToggleThemeListAufgabePriority, // Toggle aufgabe priority in theme list
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
  chapterLevelEnabled = false, // Option C: Whether to show Kapitel level in hierarchy
  onArchiveThemeList, // TICKET-12: Archive callback
}) => {
  const [viewMode, setViewMode] = useState('todos'); // 'todos' or 'themenliste'
  const [expandedUnterrechtsgebietId, setExpandedUnterrechtsgebietId] = useState(null);
  const [expandedKapitelId, setExpandedKapitelId] = useState(null);
  const [expandedThemaId, setExpandedThemaId] = useState(null);
  // TICKET-12: Collapsed state for themenliste
  const [isThemeListCollapsed, setIsThemeListCollapsed] = useState(false);

  // Get selected Themenliste
  const selectedThemeList = themeLists.find(tl => tl.id === selectedThemeListId);

  // Auto-select first themenliste if none selected and switching to themenliste view
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'themenliste' && !selectedThemeListId && themeLists.length > 0) {
      onSelectThemeList?.(themeLists[0].id);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Toggle */}
      <div className="border-b border-neutral-200 pb-4">
        <div className="flex items-center justify-center mb-3">
          <div className="inline-flex items-center bg-neutral-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => handleViewModeChange('todos')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'todos'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <ChecklistIcon />
              <span>To-Dos</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('themenliste')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'themenliste'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <BookIcon />
              <span>Themenliste</span>
            </button>
          </div>
        </div>

        {/* Themenliste Dropdown - only show when in themenliste mode */}
        {viewMode === 'themenliste' && themeLists.length > 0 && (
          <div className="flex justify-center items-center gap-2">
            <select
              value={selectedThemeListId || ''}
              onChange={(e) => onSelectThemeList?.(e.target.value)}
              className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              {themeLists.map((tl) => (
                <option key={tl.id} value={tl.id}>
                  {tl.name} ({tl.progress?.completed || 0}/{tl.progress?.total || 0})
                </option>
              ))}
            </select>

            {/* TICKET-12: Collapse/Expand button */}
            <button
              type="button"
              onClick={() => setIsThemeListCollapsed(!isThemeListCollapsed)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              title={isThemeListCollapsed ? 'Ausklappen' : 'Einklappen'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`transition-transform ${isThemeListCollapsed ? '' : 'rotate-180'}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {/* TICKET-12: Archive button */}
            {selectedThemeListId && onArchiveThemeList && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Themenliste archivieren? Sie wird aus dieser Ansicht entfernt.')) {
                    onArchiveThemeList(selectedThemeListId);
                    // Select next themelist or clear selection
                    const remainingLists = themeLists.filter(tl => tl.id !== selectedThemeListId);
                    onSelectThemeList?.(remainingLists.length > 0 ? remainingLists[0].id : null);
                  }
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                title="Archivieren"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </button>
            )}
          </div>
        )}

        <p className="text-sm text-neutral-500 text-center mt-2">
          {viewMode === 'todos'
            ? 'Deine To-Dos für heute'
            : themeLists.length === 0
              ? 'Keine Themenlisten vorhanden'
              : selectedThemeList?.name || 'Wähle eine Themenliste'
          }
        </p>
      </div>

      {/* Content */}
      {viewMode === 'todos' ? (
        <TaskList
          tasks={tasks}
          title="Deine To-Dos"
          onToggleTask={onToggleTask}
          onTogglePriority={onTogglePriority}
          onAddTask={onAddTask}
          onRemoveTask={onRemoveTask}
          onEditTask={onEditTask}
        />
      ) : (
        // Themenliste View
        themeLists.length === 0 ? (
          <div className="text-sm text-neutral-500 py-4 text-center">
            <p>Du hast noch keine Themenlisten.</p>
            <p className="mt-1">Erstelle eine auf der Lernpläne-Seite.</p>
          </div>
        ) : !selectedThemeList ? (
          <div className="text-sm text-neutral-500 py-4 text-center">
            Wähle eine Themenliste aus dem Dropdown.
          </div>
        ) : isThemeListCollapsed ? (
          // TICKET-12: Collapsed state - show summary only
          <div className="text-sm text-neutral-500 py-4 text-center">
            <p className="font-medium text-neutral-700">{selectedThemeList.name}</p>
            <p>{selectedThemeList.progress?.completed || 0}/{selectedThemeList.progress?.total || 0} Aufgaben erledigt</p>
          </div>
        ) : (
          <ThemeListView
            themeList={selectedThemeList}
            expandedUnterrechtsgebietId={expandedUnterrechtsgebietId}
            onToggleUnterrechtsgebiet={(id) => setExpandedUnterrechtsgebietId(prev => prev === id ? null : id)}
            expandedKapitelId={expandedKapitelId}
            onToggleKapitel={(id) => setExpandedKapitelId(prev => prev === id ? null : id)}
            expandedThemaId={expandedThemaId}
            onToggleThema={(id) => setExpandedThemaId(prev => prev === id ? null : id)}
            onToggleAufgabe={onToggleThemeListAufgabe}
            onAddAufgabe={onAddThemeListAufgabe}
            onUpdateAufgabe={onUpdateThemeListAufgabe}
            onDeleteAufgabe={onDeleteThemeListAufgabe}
            onToggleAufgabePriority={onToggleThemeListAufgabePriority}
            onToggleThemaCompleted={onToggleThemaCompleted}
            showThemaCheckbox={showThemaCheckbox}
            chapterLevelEnabled={chapterLevelEnabled}
          />
        )
      )}
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
  onEditTask, // TICKET-5: Edit task callback
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
          onEditTask={onEditTask}
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
 * - Normal Mode: Shows To-Dos/Themenliste toggle with dropdown
 */
const SessionWidget = ({
  className = '',
  topics = [],
  tasks = [],
  onToggleTask,
  onTogglePriority,
  onAddTask,
  onRemoveTask,
  onEditTask, // TICKET-5: Edit task callback
  // Themenliste props
  themeLists = [],
  selectedThemeListId,
  onSelectThemeList,
  onToggleThemeListAufgabe,
  onAddThemeListAufgabe, // Add aufgabe to theme list
  onUpdateThemeListAufgabe, // Update aufgabe title in theme list
  onDeleteThemeListAufgabe, // Delete aufgabe from theme list
  onToggleThemeListAufgabePriority, // Toggle aufgabe priority in theme list
  onToggleThemaCompleted, // T5.1: Toggle thema completed callback
  showThemaCheckbox = false, // T5.1: Whether to show thema checkbox
  chapterLevelEnabled = false, // Option C: Whether to show Kapitel level in hierarchy
  onArchiveThemeList, // TICKET-12: Archive themenliste callback
  // Mode prop
  isExamMode = false,
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

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col h-full ${className}`}>
      {/* T11: flex-1 min-h-0 for proper flex-based scrolling within viewport height */}
      <div className="p-5 overflow-y-auto flex-1 min-h-0">
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
            onEditTask={onEditTask}
          />
        ) : (
          // Normal Mode: To-Dos/Themenliste toggle
          <NoTopicsView
            tasks={tasks}
            onToggleTask={onToggleTask}
            onTogglePriority={onTogglePriority}
            onAddTask={onAddTask}
            onRemoveTask={onRemoveTask}
            onEditTask={onEditTask}
            themeLists={themeLists}
            selectedThemeListId={selectedThemeListId}
            onSelectThemeList={onSelectThemeList}
            onToggleThemeListAufgabe={onToggleThemeListAufgabe}
            onAddThemeListAufgabe={onAddThemeListAufgabe}
            onUpdateThemeListAufgabe={onUpdateThemeListAufgabe}
            onDeleteThemeListAufgabe={onDeleteThemeListAufgabe}
            onToggleThemeListAufgabePriority={onToggleThemeListAufgabePriority}
            onToggleThemaCompleted={onToggleThemaCompleted}
            showThemaCheckbox={showThemaCheckbox}
            chapterLevelEnabled={chapterLevelEnabled}
            onArchiveThemeList={onArchiveThemeList}
          />
        )}
      </div>
    </div>
  );
};

// Legacy alias for backwards compatibility
export const LernblockWidget = SessionWidget;

export default SessionWidget;
