import { useState, useMemo } from 'react';
import AufgabenFilterDialog from './aufgaben-filter-dialog';

// Sample task data
const SAMPLE_TASKS = [
  {
    id: 'task-1',
    subject: 'Zivilrecht',
    title: 'BGB AT Zusammenfassung',
    description: 'Kapitel 1-3 zusammenfassen',
    lernplanthema: 'Vertragsrecht',
    lernblock: 'Karteikarten lernen',
    priority: 'high',
    status: 'unerledigt',
    date: '2025-02-15'
  },
  {
    id: 'task-2',
    subject: 'Strafrecht',
    title: 'Fallbearbeitung üben',
    description: 'Klausurfall durcharbeiten',
    lernplanthema: 'Strafrecht AT',
    lernblock: 'Übungsaufgaben',
    priority: 'high',
    status: 'unerledigt',
    date: '2025-02-10'
  },
  {
    id: 'task-3',
    subject: 'Öffentliches Recht',
    title: 'Grundrechte wiederholen',
    description: 'Art. 1-19 GG',
    lernplanthema: 'Verfassungsrecht',
    lernblock: 'Wiederholung',
    priority: 'medium',
    status: 'unerledigt',
    date: '2025-02-12'
  },
  {
    id: 'task-4',
    subject: 'Zivilrecht',
    title: 'Schuldrecht BT',
    description: 'Kaufrecht Schema erstellen',
    lernplanthema: 'Schuldrecht',
    lernblock: 'Schema erstellen',
    priority: 'low',
    status: 'erledigt',
    date: '2025-02-05'
  },
  {
    id: 'task-5',
    subject: 'Strafrecht',
    title: 'Definitionen lernen',
    description: 'Vorsatz, Fahrlässigkeit',
    lernplanthema: 'Strafrecht AT',
    lernblock: 'Karteikarten lernen',
    priority: 'medium',
    status: 'erledigt',
    date: '2025-02-03'
  }
];

// Status colors
const STATUS_COLORS = {
  unerledigt: 'bg-yellow-100 text-yellow-800',
  erledigt: 'bg-green-100 text-green-800'
};

// Subject colors
const SUBJECT_COLORS = {
  'Zivilrecht': 'bg-primary-100 border-primary-200',
  'Strafrecht': 'bg-red-100 border-red-200',
  'Öffentliches Recht': 'bg-blue-100 border-blue-200'
};

// Priority display
const PRIORITY_DISPLAY = {
  low: '',
  medium: '!',
  high: '!!'
};

const PRIORITY_COLORS = {
  low: 'text-neutral-400',
  medium: 'text-yellow-600',
  high: 'text-red-600'
};

/**
 * AufgabenContent component
 * Main content area for tasks administration
 * Table-based layout matching Figma design
 */
// Default filter state
const DEFAULT_FILTERS = {
  faecher: [],
  status: 'standard',
  wichtigkeit: [],
  zeitrahmen: 'alle',
  datumVon: '',
  datumBis: ''
};

const AufgabenContent = ({ className = '' }) => {
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.lernplanthema?.toLowerCase().includes(query)
      );
    }

    // Fächer filter
    if (filters.faecher.length > 0) {
      result = result.filter(t => filters.faecher.includes(t.subject));
    }

    // Status filter
    if (filters.status !== 'standard') {
      result = result.filter(t => t.status === filters.status);
    }

    // Wichtigkeit filter
    if (filters.wichtigkeit.length > 0) {
      result = result.filter(t => filters.wichtigkeit.includes(t.priority));
    }

    // Zeitrahmen filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filters.zeitrahmen === 'vergangen') {
      result = result.filter(t => new Date(t.date) < today);
    } else if (filters.zeitrahmen === 'zukuenftig') {
      result = result.filter(t => new Date(t.date) >= today);
    } else if (filters.zeitrahmen === 'benutzerdefiniert') {
      if (filters.datumVon) {
        result = result.filter(t => new Date(t.date) >= new Date(filters.datumVon));
      }
      if (filters.datumBis) {
        result = result.filter(t => new Date(t.date) <= new Date(filters.datumBis));
      }
    }

    // Sort: unerledigt tasks first, then by date
    result.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'unerledigt' ? -1 : 1;
      }
      return new Date(b.date) - new Date(a.date);
    });

    return result;
  }, [tasks, searchQuery, filters]);

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Container Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
        <h3 className="text-sm font-medium text-neutral-900">Aufgaben</h3>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-56 px-2 py-1 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="p-2 text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            title="Filter"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full table-fixed">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="w-[12%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Fach
              </th>
              <th className="w-[20%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Aufgabe
              </th>
              <th className="w-[15%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Lernplanthema
              </th>
              <th className="w-[18%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Lernblock
              </th>
              <th className="w-[6%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Prio
              </th>
              <th className="w-[10%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Status
              </th>
              <th className="w-[19%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Datum
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredTasks.map((task) => (
              <tr
                key={task.id}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 truncate">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded border ${SUBJECT_COLORS[task.subject] || 'bg-neutral-100 border-neutral-200'}`}>
                    {task.subject}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="truncate">
                    <p className="text-sm text-neutral-900 font-medium truncate">{task.title}</p>
                    <p className="text-xs text-neutral-500 truncate">{task.description}</p>
                  </div>
                </td>
                <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                  {task.lernplanthema || '-'}
                </td>
                <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                  {task.lernblock || '-'}
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-sm font-bold ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_DISPLAY[task.priority]}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_COLORS[task.status] || 'bg-neutral-100 text-neutral-800'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                  {formatDate(task.date)}
                </td>
              </tr>
            ))}

            {filteredTasks.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-sm text-neutral-500">
                  Keine Aufgaben gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with Total */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-50 border-t border-neutral-200">
        <span className="text-sm font-medium text-neutral-700">Total</span>
        <span className="text-sm text-neutral-600">{filteredTasks.length} Aufgaben</span>
      </div>

      {/* Filter Dialog */}
      <AufgabenFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
};

export default AufgabenContent;
