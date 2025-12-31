import { useState, useMemo } from 'react';
import Button from '../ui/button';
import { PlusIcon, ChevronDownIcon } from '../ui/icon';
import { useExams, GRADE_SYSTEMS, formatGrade } from '../../contexts/exams-context';

// Dialog imports
import NeueKlausurDialog from './dialogs/neue-klausur-dialog.jsx';
import KlausurBearbeitenDialog from './dialogs/klausur-bearbeiten-dialog.jsx';
import AnalyseDialog from './dialogs/analyse-dialog.jsx';
import FilterSortierenDialog from './dialogs/filter-sortieren-dialog.jsx';
import LoeschenDialog from './dialogs/loeschen-dialog.jsx';

// Subject colors for grades list
const SUBJECT_COLORS = {
  'Zivilrecht': 'bg-primary-100 border-primary-200 text-primary-800',
  'Strafrecht': 'bg-red-100 border-red-200 text-red-800',
  'Öffentliches Recht': 'bg-green-100 border-green-200 text-green-800',
  'Zivilrechtliche Nebengebiete': 'bg-purple-100 border-purple-200 text-purple-800',
  'Rechtsgeschichte': 'bg-amber-100 border-amber-200 text-amber-800',
  'Philosophie': 'bg-neutral-100 border-neutral-200 text-neutral-800'
};

/**
 * LeistungenContent component
 * Main content area for exam/performance administration
 * Two-column layout: Left (Klausurenverwaltung) + Right (Klausurenauswertung)
 */
const LeistungenContent = ({ className = '' }) => {
  // Use ExamsContext for persistent storage
  const { exams, addExam, updateExam, deleteExam } = useExams();

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

  // Analyse settings state
  const [analyseSettings, setAnalyseSettings] = useState({
    groupBy: 'subject',
    startDate: '',
    endDate: '',
    weightByEcts: true
  });

  // Calculate statistics for display with analyse settings applied
  const stats = useMemo(() => {
    // Filter exams by date range if set
    let filteredForAnalysis = [...exams];

    if (analyseSettings.startDate) {
      const startDate = new Date(analyseSettings.startDate);
      filteredForAnalysis = filteredForAnalysis.filter(e => new Date(e.date) >= startDate);
    }

    if (analyseSettings.endDate) {
      const endDate = new Date(analyseSettings.endDate);
      filteredForAnalysis = filteredForAnalysis.filter(e => new Date(e.date) <= endDate);
    }

    // Group by subject or semester
    const grouped = {};
    filteredForAnalysis.forEach(exam => {
      const key = analyseSettings.groupBy === 'semester'
        ? (exam.semester || 'Kein Semester')
        : exam.subject;

      if (!grouped[key]) {
        grouped[key] = { items: [], totalGrade: 0, totalEcts: 0, count: 0 };
      }

      const gradeValue = exam.gradeValue ?? exam.grade;
      if (gradeValue !== null && gradeValue !== undefined) {
        const ects = exam.ects || 1;
        if (analyseSettings.weightByEcts) {
          grouped[key].totalGrade += gradeValue * ects;
          grouped[key].totalEcts += ects;
        } else {
          grouped[key].totalGrade += gradeValue;
        }
        grouped[key].count++;
      }
      grouped[key].items.push(exam);
    });

    // Calculate averages
    const groupedStats = Object.keys(grouped).map(key => {
      const group = grouped[key];
      let average = 0;
      if (analyseSettings.weightByEcts && group.totalEcts > 0) {
        average = group.totalGrade / group.totalEcts;
      } else if (group.count > 0) {
        average = group.totalGrade / group.count;
      }

      return {
        label: key,
        count: group.items.length,
        average: average > 0 ? average.toFixed(1) : '-'
      };
    });

    // Sort by label
    groupedStats.sort((a, b) => {
      if (analyseSettings.groupBy === 'semester') {
        // Sort semesters numerically
        const numA = parseInt(a.label) || 999;
        const numB = parseInt(b.label) || 999;
        return numA - numB;
      }
      return a.label.localeCompare(b.label);
    });

    // Calculate total
    let totalAverage = 0;
    let totalGrade = 0;
    let totalEcts = 0;
    let totalCount = 0;

    filteredForAnalysis.forEach(exam => {
      const gradeValue = exam.gradeValue ?? exam.grade;
      if (gradeValue !== null && gradeValue !== undefined) {
        const ects = exam.ects || 1;
        if (analyseSettings.weightByEcts) {
          totalGrade += gradeValue * ects;
          totalEcts += ects;
        } else {
          totalGrade += gradeValue;
        }
        totalCount++;
      }
    });

    if (analyseSettings.weightByEcts && totalEcts > 0) {
      totalAverage = totalGrade / totalEcts;
    } else if (totalCount > 0) {
      totalAverage = totalGrade / totalCount;
    }

    return {
      groupedStats,
      totalCount: filteredForAnalysis.length,
      totalAverage: totalAverage > 0 ? totalAverage.toFixed(1) : '-',
      groupBy: analyseSettings.groupBy
    };
  }, [exams, analyseSettings]);

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
      <div className="flex-1 min-w-0 bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
        {/* Container Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-neutral-900">Leistungsübersicht</h3>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Suchen..."
                className="w-48 px-3 py-1.5 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(true)}
              className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
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
              Neue Leistung
            </Button>
          </div>
        </div>

        {/* Table Content */}
        <div className="w-full flex-1 overflow-auto">
          <table className="w-full table-fixed">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="w-[18%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fach
                </th>
                <th className="w-[14%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="w-[30%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Thema
                </th>
                <th className="w-[22%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Datum (Zeit)
                </th>
                <th className="w-[16%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExams.map((exam) => {
                const gradeValue = exam.gradeValue ?? exam.grade;
                const gradeSystem = exam.gradeSystem || GRADE_SYSTEMS.PUNKTE;
                return (
                  <tr
                    key={exam.id}
                    onClick={() => handleExamClick(exam)}
                    className="hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2 truncate">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded border ${SUBJECT_COLORS[exam.subject] || 'bg-neutral-100 border-neutral-200 text-neutral-800'}`}>
                        {exam.subject}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                      {exam.semester || '-'}
                    </td>
                    <td className="px-3 py-2 text-sm text-neutral-900 font-medium truncate">
                      {exam.title}
                    </td>
                    <td className="px-3 py-2 text-sm text-neutral-600 truncate">
                      {formatDate(exam.date)}
                      {exam.time && <span className="text-neutral-400 ml-1">({exam.time})</span>}
                    </td>
                    <td className="px-3 py-2 text-sm text-center font-medium text-neutral-900">
                      {gradeValue !== null && gradeValue !== undefined
                        ? formatGrade(gradeValue, gradeSystem)
                        : '-'}
                    </td>
                  </tr>
                );
              })}

              {filteredExams.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
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
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col flex-1">
          {/* Card Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 flex-shrink-0">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-neutral-900">Leistungsanalyse</h3>
              <span className="text-sm text-neutral-500">
                {analyseSettings.startDate || analyseSettings.endDate ? (
                  <>
                    {analyseSettings.startDate
                      ? new Date(analyseSettings.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : 'Anfang'
                    }
                    {' → '}
                    {analyseSettings.endDate
                      ? new Date(analyseSettings.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
                      : 'heute'
                    }
                  </>
                ) : 'Alle Zeiträume'}
              </span>
            </div>
            <button
              onClick={() => setIsAnalyseOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Ansicht ändern
              <ChevronDownIcon size={12} />
            </button>
          </div>

          {/* Table */}
          <div className="divide-y divide-neutral-100 flex-1 overflow-auto">
            {/* Table Header */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
              <div>{stats.groupBy === 'semester' ? 'Semester' : 'Fach'}</div>
              <div className="text-center">Anzahl</div>
              <div className="text-center">Durchschnitt</div>
            </div>

            {/* Table Rows */}
            {stats.groupedStats.map((stat) => (
              <div
                key={stat.label}
                className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm hover:bg-neutral-50"
              >
                <div className="text-neutral-900 truncate">
                  {stats.groupBy === 'semester' ? `${stat.label}. Semester` : stat.label}
                </div>
                <div className="text-center text-neutral-600">{stat.count}</div>
                <div className="text-center text-neutral-900 font-medium">{stat.average}</div>
              </div>
            ))}

            {stats.groupedStats.length === 0 && (
              <div className="px-3 py-4 text-sm text-neutral-500 text-center">
                Keine Daten für den gewählten Zeitraum
              </div>
            )}

            {/* Total Row */}
            <div className="grid grid-cols-3 gap-2 px-3 py-1.5 text-sm bg-neutral-50 font-medium">
              <div className="text-neutral-900">Total</div>
              <div className="text-center text-neutral-600">{stats.totalCount}</div>
              <div className="text-center text-neutral-900">{stats.totalAverage}</div>
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
        onApply={setAnalyseSettings}
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
