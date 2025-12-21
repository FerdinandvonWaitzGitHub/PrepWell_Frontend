import { useState, useMemo } from 'react';
import Button from '../ui/button';
import { PlusIcon, ChevronDownIcon } from '../ui/icon';
import { useExams } from '../../contexts/exams-context';

// Dialog imports
import NeueKlausurDialog from './dialogs/neue-klausur-dialog.jsx';
import KlausurBearbeitenDialog from './dialogs/klausur-bearbeiten-dialog.jsx';
import AnalyseDialog from './dialogs/analyse-dialog.jsx';
import FilterSortierenDialog from './dialogs/filter-sortieren-dialog.jsx';
import LoeschenDialog from './dialogs/loeschen-dialog.jsx';

// Status badge colors
const STATUS_COLORS = {
  angemeldet: 'bg-blue-100 text-blue-800',
  bestanden: 'bg-green-100 text-green-800',
  'nicht bestanden': 'bg-red-100 text-red-800',
  ausstehend: 'bg-yellow-100 text-yellow-800'
};

// Subject colors for grades list
const SUBJECT_COLORS = {
  'Zivilrecht': 'bg-primary-100 border-primary-200',
  'Strafrecht': 'bg-red-100 border-red-200',
  'Öffentliches Recht': 'bg-blue-100 border-blue-200',
  'Zivilrechtliche Nebengebiete': 'bg-purple-100 border-purple-200',
  'Rechtsgeschichte': 'bg-amber-100 border-amber-200',
  'Philosophie': 'bg-gray-100 border-gray-200'
};

/**
 * LeistungenContent component
 * Main content area for exam/performance administration
 * Two-column layout: Left (Klausurenverwaltung) + Right (Klausurenauswertung)
 */
const LeistungenContent = ({ className = '' }) => {
  // Use ExamsContext for persistent storage
  const { exams, stats: contextStats, addExam, updateExam, deleteExam } = useExams();

  const [selectedExam, setSelectedExam] = useState(null);

  // Dialog states
  const [isNeueKlausurOpen, setIsNeueKlausurOpen] = useState(false);
  const [isBearbeitenOpen, setIsBearbeitenOpen] = useState(false);
  const [isAnalyseOpen, setIsAnalyseOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoeschenOpen, setIsLoeschenOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    subjects: [],
    semesters: [],
    primarySort: 'date',
    secondarySort: 'title',
    sortDirection: 'desc'
  });

  // Calculate statistics for display (formatted)
  const stats = useMemo(() => {
    const subjectStats = (contextStats.subjectStats || []).map(s => ({
      subject: s.subject,
      count: s.count,
      average: s.average > 0 ? s.average.toFixed(1) : '-'
    }));

    return {
      subjectStats,
      totalCount: contextStats.totalCount || 0,
      totalAverage: contextStats.totalAverage > 0 ? contextStats.totalAverage.toFixed(1) : '-'
    };
  }, [contextStats]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    let result = [...exams];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.subject.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      );
    }

    // Apply subject filter
    if (filters.subjects.length > 0) {
      result = result.filter(e => filters.subjects.includes(e.subject));
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      if (filters.primarySort === 'date') {
        return direction * (new Date(b.date) - new Date(a.date));
      }
      if (filters.primarySort === 'grade') {
        return direction * ((b.grade || 0) - (a.grade || 0));
      }
      return direction * a.title.localeCompare(b.title);
    });

    return result;
  }, [exams, searchQuery, filters]);

  // Handlers - using ExamsContext functions
  const handleAddExam = (examData) => {
    addExam(examData);
  };

  const handleUpdateExam = (updatedExam) => {
    updateExam(updatedExam);
  };

  const handleDeleteExam = (examId) => {
    deleteExam(examId);
    setIsLoeschenOpen(false);
    setIsBearbeitenOpen(false);
    setSelectedExam(null);
  };

  const handleExamClick = (exam) => {
    setSelectedExam(exam);
    setIsBearbeitenOpen(true);
  };

  const handleDeleteClick = () => {
    setIsBearbeitenOpen(false);
    setIsLoeschenOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
  };

  return (
    <div className={`flex gap-3 w-full h-full ${className}`}>
      {/* Left Column: Klausurenverwaltung */}
      <div className="flex-1 min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col">
        {/* Container Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-gray-900">Klausurenverwaltung</h3>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-48 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Filter
            </button>

            {/* New Exam Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNeueKlausurOpen(true)}
              className="flex items-center gap-1"
            >
              <PlusIcon size={14} />
              Neue Klausur
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="w-full flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-[15%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fach
                </th>
                <th className="w-[25%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Titel
                </th>
                <th className="w-[25%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beschreibung
                </th>
                <th className="w-[18%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="w-[7%] px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="w-[10%] px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredExams.map((exam) => (
                <tr
                  key={exam.id}
                  onClick={() => handleExamClick(exam)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2 truncate">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${SUBJECT_COLORS[exam.subject] || 'bg-gray-100 border-gray-200'}`}>
                      {exam.subject}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900 font-medium truncate">
                    {exam.title}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500 truncate">
                    {exam.description || '-'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-600 truncate">
                    {formatDate(exam.date)}
                    {exam.time && <span className="text-gray-400 ml-1">{exam.time}</span>}
                  </td>
                  <td className="px-3 py-2 text-sm text-center font-medium text-gray-900">
                    {exam.grade !== null ? exam.grade : '-'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${STATUS_COLORS[exam.status] || 'bg-gray-100 text-gray-800'}`}>
                      {exam.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Keine Klausuren gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Klausurenauswertung (400px) */}
      <div className="w-[400px] flex-shrink-0 flex flex-col">
        {/* Notenliste / Leistungsanalyse Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden flex flex-col flex-1">
          {/* Card Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 flex-shrink-0">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-gray-900">Leistungsanalyse</h3>
              <span className="text-sm text-gray-500">12.11.15 → heute</span>
            </div>
            <button
              onClick={() => setIsAnalyseOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Ansicht ändern
              <ChevronDownIcon size={12} />
            </button>
          </div>

          {/* Table */}
          <div className="divide-y divide-gray-100 flex-1 overflow-auto">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-gray-50 text-xs font-medium text-gray-500 uppercase">
              <div>Fach</div>
              <div className="text-center">Anzahl</div>
              <div className="text-center">Durchschnitt</div>
            </div>

            {/* Table Rows */}
            {stats.subjectStats.map((stat) => (
              <div
                key={stat.subject}
                className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <div className="text-gray-900 truncate">{stat.subject}</div>
                <div className="text-center text-gray-600">{stat.count}</div>
                <div className="text-center text-gray-900 font-medium">{stat.average}</div>
              </div>
            ))}

            {/* Total Row */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm bg-gray-50 font-medium">
              <div className="text-gray-900">Total</div>
              <div className="text-center text-gray-600">{stats.totalCount}</div>
              <div className="text-center text-gray-900">{stats.totalAverage}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NeueKlausurDialog
        open={isNeueKlausurOpen}
        onOpenChange={setIsNeueKlausurOpen}
        onSave={handleAddExam}
      />

      <KlausurBearbeitenDialog
        open={isBearbeitenOpen}
        onOpenChange={setIsBearbeitenOpen}
        exam={selectedExam}
        onSave={handleUpdateExam}
        onDelete={handleDeleteClick}
      />

      <LoeschenDialog
        open={isLoeschenOpen}
        onOpenChange={setIsLoeschenOpen}
        exam={selectedExam}
        onConfirm={() => selectedExam && handleDeleteExam(selectedExam.id)}
      />

      <AnalyseDialog
        open={isAnalyseOpen}
        onOpenChange={setIsAnalyseOpen}
        onApply={(settings) => console.log('Analyse settings:', settings)}
      />

      <FilterSortierenDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
};

export default LeistungenContent;
