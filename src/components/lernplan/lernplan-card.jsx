import { useState } from 'react';
import { ChevronDownIcon } from '../ui';

// Subject/Tag colors
const TAG_COLORS = {
  'Zivilrecht': 'bg-primary-100 text-primary-700',
  'Strafrecht': 'bg-red-100 text-red-700',
  'Öffentliches Recht': 'bg-blue-100 text-blue-700',
  'Examen': 'bg-purple-100 text-purple-700',
  'Standard': 'bg-neutral-100 text-neutral-700'
};

/**
 * LernplanCard component
 * Horizontal bar layout matching Figma design (1392x70px)
 * Layout: [Tags | Title | Progress] [Expand]
 * View-only card - use LernplanEditCard for editing
 */
const LernplanCard = ({
  lernplan,
  isExpanded = false,
  onToggleExpand
}) => {
  // Calculate progress - count Aufgaben (tasks) for consistency with edit mode
  let completedTasks = 0;
  let totalTasks = 0;
  lernplan.chapters?.forEach(ch => {
    ch.topics?.forEach(t => {
      t.tasks?.forEach(task => {
        totalTasks++;
        if (task.completed) completedTasks++;
      });
    });
  });
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="bg-white rounded border border-neutral-200 overflow-hidden">
      {/* Main Bar - 70px height */}
      <div className="flex items-center h-[70px] px-4">
        {/* Left Side: Tags, Title, Progress */}
        <div className="flex-1 flex items-center gap-6 min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {lernplan.tags?.map((tag, idx) => (
              <span
                key={idx}
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${TAG_COLORS[tag] || TAG_COLORS['Standard']}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h3 className="text-base font-medium text-neutral-900 truncate flex-shrink-0 max-w-[200px]">
            {lernplan.title}
          </h3>

          {/* Progress */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-48 h-1 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-neutral-500 whitespace-nowrap">
              {completedTasks} von {totalTasks} Aufgaben abgeschlossen
            </span>
          </div>
        </div>

        {/* Right Side: Expand */}
        <div className="flex items-center flex-shrink-0 ml-4">
          {/* Expand/Collapse Button */}
          <button
            onClick={() => onToggleExpand?.(lernplan.id)}
            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded transition-colors"
            title={isExpanded ? 'Einklappen' : 'Ausklappen'}
          >
            <ChevronDownIcon
              size={16}
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expandable Chapters */}
      {isExpanded && lernplan.chapters && lernplan.chapters.length > 0 && (
        <div className="border-t border-neutral-100 bg-neutral-50">
          {lernplan.chapters.map((chapter, idx) => (
            <ChapterRow key={chapter.id || idx} chapter={chapter} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ChapterRow component
 * Collapsible chapter row with topics
 */
const ChapterRow = ({ chapter }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Count tasks (Aufgaben) within all topics of this chapter
  let completedCount = 0;
  let totalCount = 0;
  chapter.topics?.forEach(t => {
    t.tasks?.forEach(task => {
      totalCount++;
      if (task.completed) completedCount++;
    });
  });

  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      {/* Chapter Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <ChevronDownIcon
            size={12}
            className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
          <span className="text-sm font-medium text-neutral-900">{chapter.title}</span>
        </div>
        <span className="text-xs text-neutral-500">{completedCount}/{totalCount}</span>
      </button>

      {/* Topics */}
      {isOpen && chapter.topics && (
        <div className="px-6 pb-2">
          {chapter.topics.map((topic, idx) => (
            <div
              key={topic.id || idx}
              className="flex items-center gap-2 py-1.5 pl-5"
            >
              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                topic.completed
                  ? 'bg-neutral-900 border-neutral-900'
                  : 'border-neutral-300'
              }`}>
                {topic.completed && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className={`text-sm ${topic.completed ? 'text-neutral-400 line-through' : 'text-neutral-700'}`}>
                {topic.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LernplanCard;
