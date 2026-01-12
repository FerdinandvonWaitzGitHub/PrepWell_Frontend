import { useState } from 'react';
import { ChevronDownIcon, PlusIcon } from '../ui';
import { useUnterrechtsgebiete } from '../../contexts/unterrechtsgebiete-context';
import { useHierarchyLabels } from '../../hooks/use-hierarchy-labels';

// Rechtsgebiete options
const RECHTSGEBIETE = [
  { id: 'zivilrecht', label: 'Zivilrecht' },
  { id: 'oeffentliches-recht', label: 'Öffentliches Recht' },
  { id: 'strafrecht', label: 'Strafrecht' }
];

// Tag colors
const TAG_COLORS = {
  'Zivilrecht': 'bg-primary-100 text-primary-700',
  'Strafrecht': 'bg-red-100 text-red-700',
  'Öffentliches Recht': 'bg-blue-100 text-blue-700',
  'Examen': 'bg-purple-100 text-purple-700',
  'Standard': 'bg-neutral-100 text-neutral-700'
};

// Generate unique ID
const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * LernplanEditCard - Inline editable learning plan card
 * Collapsible card with full editing capabilities
 */
const LernplanEditCard = ({
  lernplan,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onArchive,
  isNew = false
}) => {
  const { addUnterrechtsgebiet, getUnterrechtsgebieteByRechtsgebiet } = useUnterrechtsgebiete();
  const { level1, level2, level3, level3Plural, level4, level4Plural, level5, level5Plural, isJura } = useHierarchyLabels();

  // Determine labels based on Jura vs non-Jura
  const themaLabel = isJura ? level4 : level3;
  const themaPluralLabel = isJura ? level4Plural : level3Plural;
  const aufgabeLabel = isJura ? level5 : level4;
  const aufgabePluralLabel = isJura ? level5Plural : level4Plural;

  // Local editing state
  const [localData, setLocalData] = useState(lernplan);
  const [expandedChapters, setExpandedChapters] = useState(new Set());
  const [expandedThemes, setExpandedThemes] = useState(new Set());

  // Dropdown states
  const [showRechtsgebietDropdown, setShowRechtsgebietDropdown] = useState(false);
  const [showUnterrechtsgebietDropdown, setShowUnterrechtsgebietDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);

  // New Unterrechtsgebiet popup
  const [showNewUnterrechtsgebietPopup, setShowNewUnterrechtsgebietPopup] = useState(false);
  const [newUnterrechtsgebietName, setNewUnterrechtsgebietName] = useState('');

  // Get available Unterrechtsgebiete
  const availableUnterrechtsgebiete = localData.rechtsgebiet
    ? getUnterrechtsgebieteByRechtsgebiet(localData.rechtsgebiet)
    : [];

  // Update local data and propagate to parent
  const updateData = (updates) => {
    const newData = { ...localData, ...updates };
    setLocalData(newData);
    onUpdate?.(newData);
  };

  // Handle save new Unterrechtsgebiet
  const handleSaveNewUnterrechtsgebiet = () => {
    if (newUnterrechtsgebietName.trim() && localData.rechtsgebiet) {
      const newItem = {
        id: generateId(),
        name: newUnterrechtsgebietName.trim()
      };
      addUnterrechtsgebiet(localData.rechtsgebiet, newItem);
      updateData({ unterrechtsgebiet: newItem.id });
      setNewUnterrechtsgebietName('');
      setShowNewUnterrechtsgebietPopup(false);
    }
  };

  // Chapter operations
  const addChapter = () => {
    const newChapter = {
      id: generateId(),
      title: `Kapitel ${(localData.chapters?.length || 0) + 1}`,
      themes: []
    };
    updateData({ chapters: [...(localData.chapters || []), newChapter] });
    setExpandedChapters(prev => new Set([...prev, newChapter.id]));
  };

  const updateChapter = (chapterId, chapterUpdates) => {
    updateData({
      chapters: localData.chapters.map(ch =>
        ch.id === chapterId ? { ...ch, ...chapterUpdates } : ch
      )
    });
  };

  const deleteChapter = (chapterId) => {
    updateData({
      chapters: localData.chapters.filter(ch => ch.id !== chapterId)
    });
  };

  // Theme operations
  const addTheme = (chapterId) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          const newTheme = {
            id: generateId(),
            title: `Thema ${(ch.themes?.length || 0) + 1}`,
            tasks: []
          };
          return { ...ch, themes: [...(ch.themes || []), newTheme] };
        }
        return ch;
      })
    });
  };

  const updateTheme = (chapterId, themeId, themeUpdates) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            themes: ch.themes.map(th =>
              th.id === themeId ? { ...th, ...themeUpdates } : th
            )
          };
        }
        return ch;
      })
    });
  };

  const deleteTheme = (chapterId, themeId) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          return { ...ch, themes: ch.themes.filter(th => th.id !== themeId) };
        }
        return ch;
      })
    });
  };

  // Task operations
  const addTask = (chapterId, themeId) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            themes: ch.themes.map(th => {
              if (th.id === themeId) {
                const newTask = {
                  id: generateId(),
                  title: '',
                  completed: false
                };
                return { ...th, tasks: [...(th.tasks || []), newTask] };
              }
              return th;
            })
          };
        }
        return ch;
      })
    });
  };

  const updateTask = (chapterId, themeId, taskId, taskUpdates) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            themes: ch.themes.map(th => {
              if (th.id === themeId) {
                return {
                  ...th,
                  tasks: th.tasks.map(t =>
                    t.id === taskId ? { ...t, ...taskUpdates } : t
                  )
                };
              }
              return th;
            })
          };
        }
        return ch;
      })
    });
  };

  const deleteTask = (chapterId, themeId, taskId) => {
    updateData({
      chapters: localData.chapters.map(ch => {
        if (ch.id === chapterId) {
          return {
            ...ch,
            themes: ch.themes.map(th => {
              if (th.id === themeId) {
                return { ...th, tasks: th.tasks.filter(t => t.id !== taskId) };
              }
              return th;
            })
          };
        }
        return ch;
      })
    });
  };

  // Toggle chapter/theme
  const toggleChapter = (chapterId) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  const toggleTheme = (themeId) => {
    setExpandedThemes(prev => {
      const next = new Set(prev);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  };

  // Calculate progress
  const completedTopics = localData.chapters?.reduce((acc, ch) =>
    acc + (ch.themes?.reduce((tAcc, th) =>
      tAcc + (th.tasks?.filter(t => t.completed).length || 0), 0) || 0), 0) || 0;
  const totalTopics = localData.chapters?.reduce((acc, ch) =>
    acc + (ch.themes?.reduce((tAcc, th) =>
      tAcc + (th.tasks?.length || 0), 0) || 0), 0) || 0;
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return (
    <div className={`bg-white rounded-lg border ${isNew ? 'border-primary-300 ring-2 ring-primary-100' : 'border-neutral-200'} overflow-hidden`}>
      {/* Header Bar - Always Visible */}
      <div
        className="flex items-center h-[70px] px-4 cursor-pointer hover:bg-neutral-50"
        onClick={() => onToggleExpand?.(localData.id)}
      >
        {/* Expand/Collapse Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.(localData.id);
          }}
          className="p-1.5 mr-3 text-neutral-500 hover:bg-neutral-100 rounded transition-colors"
        >
          <ChevronDownIcon
            size={18}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mr-4 flex-shrink-0">
          {localData.tags?.map((tag, idx) => (
            <span
              key={idx}
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${TAG_COLORS[tag] || TAG_COLORS['Standard']}`}
            >
              {tag}
            </span>
          ))}
          {localData.mode === 'examen' && (
            <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
              Examen
            </span>
          )}
        </div>

        {/* Title (Editable) */}
        <input
          type="text"
          value={localData.title}
          onChange={(e) => updateData({ title: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          placeholder="Lernplan Titel..."
          className="flex-1 min-w-0 px-2 py-1 text-base font-medium text-neutral-900 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
        />

        {/* Progress Bar */}
        <div className="flex items-center gap-3 ml-4 flex-shrink-0">
          <div className="w-32 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-900 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm text-neutral-500 whitespace-nowrap">
            {completedTopics}/{totalTopics}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-4 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive?.(localData);
            }}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            title="Archivieren"
          >
            <ArchiveIcon size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`"${localData.title}" wirklich löschen?`)) {
                onDelete?.(localData);
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Löschen"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 bg-neutral-50 p-4">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {/* Description */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Beschreibung</label>
              <textarea
                value={localData.description || ''}
                onChange={(e) => updateData({ description: e.target.value })}
                placeholder="Beschreibung..."
                rows={2}
                className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            </div>

            {/* Rechtsgebiet */}
            <div className="relative">
              <label className="block text-xs font-medium text-neutral-500 mb-1">{level1}</label>
              <button
                onClick={() => setShowRechtsgebietDropdown(!showRechtsgebietDropdown)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50"
              >
                <span className={localData.rechtsgebiet ? 'text-neutral-900' : 'text-neutral-400'}>
                  {localData.rechtsgebiet
                    ? RECHTSGEBIETE.find(r => r.id === localData.rechtsgebiet)?.label
                    : 'Auswählen'
                  }
                </span>
                <ChevronDownIcon size={14} className="text-neutral-400" />
              </button>
              {showRechtsgebietDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  {RECHTSGEBIETE.map(rg => (
                    <button
                      key={rg.id}
                      onClick={() => {
                        updateData({
                          rechtsgebiet: rg.id,
                          unterrechtsgebiet: '',
                          tags: [rg.label]
                        });
                        setShowRechtsgebietDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                        localData.rechtsgebiet === rg.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                      }`}
                    >
                      {rg.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modus */}
            <div className="relative">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Modus</label>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="w-full flex items-center justify-between px-2 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50"
              >
                <span>{localData.mode === 'examen' ? 'Examen' : 'Standard'}</span>
                <ChevronDownIcon size={14} className="text-neutral-400" />
              </button>
              {showModeDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  <button
                    onClick={() => { updateData({ mode: 'standard' }); setShowModeDropdown(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                      localData.mode === 'standard' ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                    }`}
                  >
                    Standard
                  </button>
                  <button
                    onClick={() => { updateData({ mode: 'examen' }); setShowModeDropdown(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                      localData.mode === 'examen' ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                    }`}
                  >
                    Examen
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Unterrechtsgebiet Row */}
          {localData.rechtsgebiet && (
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="relative col-span-2">
                <label className="block text-xs font-medium text-neutral-500 mb-1">{level2}</label>
                <button
                  onClick={() => setShowUnterrechtsgebietDropdown(!showUnterrechtsgebietDropdown)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white hover:bg-neutral-50"
                >
                  <span className={localData.unterrechtsgebiet ? 'text-neutral-900' : 'text-neutral-400'}>
                    {localData.unterrechtsgebiet
                      ? availableUnterrechtsgebiete.find(u => u.id === localData.unterrechtsgebiet)?.name
                      : `${level2} auswählen`
                    }
                  </span>
                  <ChevronDownIcon size={14} className="text-neutral-400" />
                </button>
                {showUnterrechtsgebietDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {availableUnterrechtsgebiete.map(urg => (
                      <button
                        key={urg.id}
                        onClick={() => {
                          updateData({ unterrechtsgebiet: urg.id });
                          setShowUnterrechtsgebietDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                          localData.unterrechtsgebiet === urg.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700'
                        }`}
                      >
                        {urg?.name || 'Unterrechtsgebiet'}
                      </button>
                    ))}
                    {availableUnterrechtsgebiete.length === 0 && (
                      <div className="px-3 py-2 text-sm text-neutral-400">Keine verfügbar</div>
                    )}
                    <div className="border-t border-neutral-100">
                      <button
                        onClick={() => {
                          setShowUnterrechtsgebietDropdown(false);
                          setShowNewUnterrechtsgebietPopup(true);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 flex items-center gap-2"
                      >
                        <PlusIcon size={12} />
                        {level2} erstellen
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Exam Date (if examen mode) */}
              {localData.mode === 'examen' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-neutral-500 mb-1">Examenstermin</label>
                  <input
                    type="date"
                    value={localData.examDate || ''}
                    onChange={(e) => updateData({ examDate: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              )}
            </div>
          )}

          {/* Chapters Section */}
          <div className="border-t border-neutral-200 pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-neutral-700">{level3Plural} & {themaPluralLabel}</h4>
              <button
                onClick={addChapter}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded transition-colors"
              >
                <PlusIcon size={12} />
                {level3}
              </button>
            </div>

            {(!localData.chapters || localData.chapters.length === 0) ? (
              <div className="text-center py-6 bg-white rounded-lg border border-dashed border-neutral-300">
                <p className="text-sm text-neutral-400 mb-2">Noch keine {level3Plural}</p>
                <button
                  onClick={addChapter}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {level3} hinzufügen
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {localData.chapters.map((chapter) => (
                  <ChapterSection
                    key={chapter.id}
                    chapter={chapter}
                    isExpanded={expandedChapters.has(chapter.id)}
                    onToggle={() => toggleChapter(chapter.id)}
                    onUpdate={(updates) => updateChapter(chapter.id, updates)}
                    onDelete={() => deleteChapter(chapter.id)}
                    onAddTheme={() => addTheme(chapter.id)}
                    expandedThemes={expandedThemes}
                    onToggleTheme={toggleTheme}
                    onUpdateTheme={(themeId, updates) => updateTheme(chapter.id, themeId, updates)}
                    onDeleteTheme={(themeId) => deleteTheme(chapter.id, themeId)}
                    onAddTask={(themeId) => addTask(chapter.id, themeId)}
                    onUpdateTask={(themeId, taskId, updates) => updateTask(chapter.id, themeId, taskId, updates)}
                    onDeleteTask={(themeId, taskId) => deleteTask(chapter.id, themeId, taskId)}
                    hierarchyLabels={{ themaLabel, themaPluralLabel, aufgabeLabel, aufgabePluralLabel }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Unterrechtsgebiet Popup */}
      {showNewUnterrechtsgebietPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowNewUnterrechtsgebietPopup(false)} />
          <div className="relative z-10 bg-white rounded-lg shadow-xl p-4 w-80">
            <h4 className="text-sm font-medium text-neutral-900 mb-3">{level2} erstellen</h4>
            <input
              type="text"
              value={newUnterrechtsgebietName}
              onChange={(e) => setNewUnterrechtsgebietName(e.target.value)}
              placeholder="Name eingeben..."
              autoFocus
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 mb-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNewUnterrechtsgebiet();
                if (e.key === 'Escape') setShowNewUnterrechtsgebietPopup(false);
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewUnterrechtsgebietPopup(false)}
                className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSaveNewUnterrechtsgebiet}
                disabled={!newUnterrechtsgebietName.trim()}
                className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * ChapterSection - Expandable chapter with themes
 */
const ChapterSection = ({
  chapter,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddTheme,
  expandedThemes,
  onToggleTheme,
  onUpdateTheme,
  onDeleteTheme,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  hierarchyLabels
}) => {
  const { themaLabel, themaPluralLabel, aufgabeLabel, aufgabePluralLabel } = hierarchyLabels;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      {/* Chapter Header */}
      <div className="flex items-center px-3 py-2 bg-neutral-50">
        <button onClick={onToggle} className="p-1 mr-2 hover:bg-neutral-200 rounded">
          <ChevronDownIcon
            size={14}
            className={`text-neutral-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        <input
          type="text"
          value={chapter.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 px-2 py-0.5 text-sm font-medium bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
        />
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onDelete}
            className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
            title="Löschen"
          >
            <TrashIcon size={14} />
          </button>
        </div>
      </div>

      {/* Chapter Content */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-neutral-100">
          {chapter.themes && chapter.themes.length > 0 ? (
            <div className="space-y-2 mb-2">
              {chapter.themes.map((theme) => (
                <ThemeSection
                  key={theme.id}
                  theme={theme}
                  isExpanded={expandedThemes.has(theme.id)}
                  onToggle={() => onToggleTheme(theme.id)}
                  onUpdate={(updates) => onUpdateTheme(theme.id, updates)}
                  onDelete={() => onDeleteTheme(theme.id)}
                  onAddTask={() => onAddTask(theme.id)}
                  onUpdateTask={(taskId, updates) => onUpdateTask(theme.id, taskId, updates)}
                  onDeleteTask={(taskId) => onDeleteTask(theme.id, taskId)}
                  hierarchyLabels={{ aufgabeLabel, aufgabePluralLabel }}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-2 pl-4">Keine {themaPluralLabel}</p>
          )}
          <button
            onClick={onAddTheme}
            className="flex items-center gap-1 px-2 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded ml-4"
          >
            <PlusIcon size={10} />
            {themaLabel}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * ThemeSection - Expandable theme with tasks
 */
const ThemeSection = ({
  theme,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  hierarchyLabels
}) => {
  const { aufgabeLabel, aufgabePluralLabel } = hierarchyLabels;

  return (
    <div className="ml-4 border-l-2 border-neutral-200 pl-3">
      {/* Theme Header */}
      <div className="flex items-center py-1">
        <button onClick={onToggle} className="p-0.5 mr-1.5 hover:bg-neutral-100 rounded">
          <ChevronDownIcon
            size={12}
            className={`text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
        <input
          type="text"
          value={theme.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 px-1.5 py-0.5 text-sm bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none"
        />
        <button
          onClick={onDelete}
          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded ml-1"
          title="Löschen"
        >
          <TrashIcon size={12} />
        </button>
      </div>

      {/* Tasks */}
      {isExpanded && (
        <div className="ml-5 py-1">
          {theme.tasks && theme.tasks.length > 0 ? (
            <div className="space-y-1">
              {theme.tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  aufgabeLabel={aufgabeLabel}
                  onUpdate={(updates) => onUpdateTask(task.id, updates)}
                  onDelete={() => onDeleteTask(task.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-400 py-1">Keine {aufgabePluralLabel}</p>
          )}
          <button
            onClick={onAddTask}
            className="flex items-center gap-1 px-1.5 py-1 text-xs text-primary-600 hover:bg-primary-50 rounded mt-1"
          >
            <PlusIcon size={10} />
            {aufgabeLabel}
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * TaskItem - Single task with checkbox
 */
const TaskItem = ({ task, aufgabeLabel, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center gap-2 py-0.5 group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onUpdate({ completed: e.target.checked })}
        className="w-3.5 h-3.5 rounded border-neutral-300 text-primary-600 focus:ring-primary-400"
      />
      <input
        type="text"
        value={task.title}
        onChange={(e) => onUpdate({ title: e.target.value })}
        placeholder={`${aufgabeLabel} eingeben...`}
        className={`flex-1 px-1 py-0.5 text-xs bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-primary-400 focus:outline-none ${
          task.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'
        }`}
      />
      <button
        onClick={onDelete}
        className="p-0.5 text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Löschen"
      >
        <TrashIcon size={10} />
      </button>
    </div>
  );
};

// Icons
const TrashIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ArchiveIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="21 8 21 21 3 21 3 8" />
    <rect x="1" y="3" width="22" height="5" />
    <line x1="10" y1="12" x2="14" y2="12" />
  </svg>
);

export default LernplanEditCard;
