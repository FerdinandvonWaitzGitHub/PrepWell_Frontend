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

/**
 * TaskItem component - einzelne Aufgabe
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
}) => {
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
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
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
 * ThemeListTopicBlock - einzelnes Thema in einer Themenliste (klickbar zum Durchstreichen)
 */
const ThemeListTopicBlock = ({
  topic,
  index,
  totalTopics,
  isExpanded,
  onToggleExpand,
  onToggleComplete,
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${topic.completed ? 'border-gray-100 bg-gray-50' : 'border-gray-200'}`}>
      {/* Header - always visible */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                topic.completed ? 'bg-gray-400 text-white' : 'bg-black text-white'
              }`}>
                {topic.rechtsgebiet || 'Rechtsgebiet'}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 text-xs text-gray-600">
                {index + 1} von {totalTopics} Themen
              </span>
            </div>

            {/* Title - click to toggle complete */}
            <h3
              className={`text-base font-medium leading-snug cursor-pointer ${
                topic.completed ? 'line-through text-gray-400' : 'text-gray-900'
              } ${isExpanded ? '' : 'line-clamp-2'}`}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(topic.id);
              }}
            >
              {topic.title || 'Thema'}
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
            <p className={`text-sm mt-3 ${topic.completed ? 'text-gray-400' : 'text-gray-600'}`}>
              {topic.description}
            </p>
          )}

          {/* Mark as complete button */}
          <button
            type="button"
            onClick={() => onToggleComplete(topic.id)}
            className={`mt-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              topic.completed
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-green-50 text-green-700 hover:bg-green-100'
            }`}
          >
            {topic.completed ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * ThemeListView - Ansicht für eine ausgewählte Themenliste
 */
const ThemeListView = ({
  themeList,
  expandedTopicId,
  onToggleExpand,
  onToggleTopicComplete,
}) => {
  const stats = useMemo(() => {
    const topics = themeList?.topics || [];
    const total = topics.length;
    const completed = topics.filter(t => t.completed).length;
    return { total, completed };
  }, [themeList]);

  if (!themeList) {
    return (
      <div className="text-sm text-gray-500 py-4">
        Keine Themenliste ausgewählt.
      </div>
    );
  }

  const topics = themeList.topics || [];

  return (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">{themeList.name}</span>
        <span className="text-gray-500">{stats.completed}/{stats.total} erledigt</span>
      </div>

      {/* Topic Blocks */}
      {topics.length === 0 ? (
        <p className="text-sm text-gray-500 py-2">Diese Themenliste hat keine Themen.</p>
      ) : (
        topics.map((topic, index) => (
          <ThemeListTopicBlock
            key={topic.id}
            topic={topic}
            index={index}
            totalTopics={topics.length}
            isExpanded={expandedTopicId === topic.id}
            onToggleExpand={() => onToggleExpand(topic.id)}
            onToggleComplete={onToggleTopicComplete}
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
                {topic.rechtsgebiet || 'Rechtsgebiet'}
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
            {topic.rechtsgebiet || 'Rechtsgebiet'}
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
  onToggleThemeListTopicComplete,
}) => {
  const [viewMode, setViewMode] = useState('todos'); // 'todos' or 'themelist'
  const [themeListExpandedTopicId, setThemeListExpandedTopicId] = useState(null);

  const selectedThemeList = useMemo(() => {
    return themeLists.find(list => list.id === selectedThemeListId) || null;
  }, [themeLists, selectedThemeListId]);

  const handleToggleThemeListExpand = useCallback((topicId) => {
    setThemeListExpandedTopicId(prev => prev === topicId ? null : topicId);
  }, []);

  const hasThemeLists = themeLists.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header with Toggle */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">
            {viewMode === 'todos' ? 'Aufgaben' : 'Themenliste'}
          </h2>

          {/* Toggle Button - only show if there are theme lists */}
          {hasThemeLists && (
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === 'todos' ? 'themelist' : 'todos')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {viewMode === 'todos' ? (
                <>
                  <ListIcon />
                  <span>Themenliste</span>
                </>
              ) : (
                <>
                  <ChecklistIcon />
                  <span>To-Dos</span>
                </>
              )}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {viewMode === 'todos' ? 'Deine To-Dos' : 'Themen aus deinem Lernplan'}
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
                  {list.name} ({list.topics?.length || 0} Themen)
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
          expandedTopicId={themeListExpandedTopicId}
          onToggleExpand={handleToggleThemeListExpand}
          onToggleTopicComplete={onToggleThemeListTopicComplete}
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
  onToggleThemeListTopicComplete,
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
            onToggleThemeListTopicComplete={onToggleThemeListTopicComplete}
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
