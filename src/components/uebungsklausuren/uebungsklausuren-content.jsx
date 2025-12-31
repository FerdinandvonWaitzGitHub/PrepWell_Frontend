import { useState, useMemo } from 'react';
import Button from '../ui/button';
import { PlusIcon, ChevronDownIcon, TrendingUpIcon, TrendingDownIcon } from '../ui/icon';
import {
  useUebungsklausuren,
  RECHTSGEBIET_COLORS,
  formatPunkte,
} from '../../contexts/uebungsklausuren-context';

// Dialog imports
import NeueUebungsklausurDialog from './dialogs/neue-uebungsklausur-dialog';
import UebungsklausurBearbeitenDialog from './dialogs/uebungsklausur-bearbeiten-dialog';
import UebungsklausurenAuswertungDialog from './dialogs/uebungsklausuren-auswertung-dialog';
import UebungsklausurenFilterDialog from './dialogs/uebungsklausuren-filter-dialog';
import LoeschenDialog from '../verwaltung/dialogs/loeschen-dialog';

/**
 * UebungsklausurenContent component
 * Main content for Exam Mode practice exams
 * Table columns: Fach, Thema, Datum, Note (no Semester)
 */
const UebungsklausurenContent = ({ className = '' }) => {
  const { klausuren, stats, addKlausur, updateKlausur, deleteKlausur } = useUebungsklausuren();

  const [selectedKlausur, setSelectedKlausur] = useState(null);

  // Dialog states
  const [isNeueKlausurOpen, setIsNeueKlausurOpen] = useState(false);
  const [isBearbeitenOpen, setIsBearbeitenOpen] = useState(false);
  const [isAuswertungOpen, setIsAuswertungOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoeschenOpen, setIsLoeschenOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [filters, setFilters] = useState({
    subjects: [],
    primarySort: 'date',
    sortDirection: 'desc',
  });

  // Filtered klausuren
  const filteredKlausuren = useMemo(() => {
    let result = [...klausuren];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(k =>
        k.title.toLowerCase().includes(query) ||
        k.subject.toLowerCase().includes(query) ||
        k.description?.toLowerCase().includes(query)
      );
    }

    // Apply subject filter
    if (filters.subjects.length > 0) {
      result = result.filter(k => filters.subjects.includes(k.subject));
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      if (filters.primarySort === 'date') {
        return direction * (new Date(b.date) - new Date(a.date));
      }
      if (filters.primarySort === 'grade') {
        return direction * ((b.punkte || 0) - (a.punkte || 0));
      }
      if (filters.primarySort === 'subject') {
        return direction * a.subject.localeCompare(b.subject);
      }
      return direction * a.title.localeCompare(b.title);
    });

    return result;
  }, [klausuren, searchQuery, filters]);

  // Handlers
  const handleAddKlausur = (data) => {
    addKlausur(data);
  };

  const handleUpdateKlausur = (updated) => {
    updateKlausur(updated);
  };

  const handleDeleteKlausur = (id) => {
    deleteKlausur(id);
    setIsLoeschenOpen(false);
    setIsBearbeitenOpen(false);
    setSelectedKlausur(null);
  };

  const handleKlausurClick = (klausur) => {
    setSelectedKlausur(klausur);
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

  // Get color classes for subject
  const getSubjectColors = (subject) => {
    const colors = RECHTSGEBIET_COLORS[subject];
    if (!colors) return 'bg-neutral-100 border-neutral-200 text-neutral-800';
    return `${colors.bg} ${colors.border} ${colors.text}`;
  };

  return (
    <div className={`flex gap-3 w-full h-full ${className}`}>
      {/* Left Column: Übungsklausuren Table */}
      <div className="flex-1 min-w-0 bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200 flex-shrink-0">
          <h3 className="text-sm font-medium text-neutral-900">Übungsklausuren</h3>
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

            {/* New Klausur Button */}
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
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="w-[20%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fach
                </th>
                <th className="w-[40%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Thema
                </th>
                <th className="w-[20%] px-3 py-2 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Datum
                </th>
                <th className="w-[20%] px-3 py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Note
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredKlausuren.map((klausur) => (
                <tr
                  key={klausur.id}
                  onClick={() => handleKlausurClick(klausur)}
                  className="hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  <td className="px-3 py-2 truncate">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${getSubjectColors(klausur.subject)}`}>
                      {klausur.subject}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-neutral-900 font-medium truncate">{klausur.title}</div>
                    {klausur.description && (
                      <div className="text-xs text-neutral-500 truncate">{klausur.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-sm text-neutral-600">
                    {formatDate(klausur.date)}
                  </td>
                  <td className="px-3 py-2 text-sm text-center font-medium text-neutral-900">
                    {formatPunkte(klausur.punkte)}
                  </td>
                </tr>
              ))}

              {filteredKlausuren.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500">
                    Keine Übungsklausuren gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Column: Auswertung (400px) */}
      <div className="w-[400px] flex-shrink-0 flex flex-col gap-3">
        {/* Subject Stats Card */}
        <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-neutral-900">Durchschnittsnoten</h3>
              <span className="text-xs text-neutral-500">der Rechtsgebiete</span>
            </div>
            <button
              onClick={() => setIsAuswertungOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Auswertung
              <ChevronDownIcon size={12} />
            </button>
          </div>

          {/* Stats Table */}
          <div className="divide-y divide-neutral-100">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-neutral-50 text-xs font-medium text-neutral-500 uppercase">
              <div>Fach</div>
              <div className="text-center">Anzahl</div>
              <div className="text-center">Schnitt</div>
              <div className="text-center">Trend</div>
            </div>

            {/* Table Rows */}
            {stats.subjectStats.map((stat) => (
              <div
                key={stat.subject}
                className="grid grid-cols-4 gap-2 px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <div className="text-neutral-900 truncate text-xs">{stat.subject}</div>
                <div className="text-center text-neutral-600">{stat.count}</div>
                <div className="text-center text-neutral-900 font-medium">
                  {stat.count > 0 ? stat.average.toFixed(1) : '-'}
                </div>
                <div className="flex justify-center">
                  {stat.count > 2 && stat.trend !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs ${stat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend > 0 ? (
                        <TrendingUpIcon size={12} />
                      ) : (
                        <TrendingDownIcon size={12} />
                      )}
                      {Math.abs(stat.trend).toFixed(1)}
                    </span>
                  )}
                  {(stat.count <= 2 || stat.trend === 0) && (
                    <span className="text-xs text-neutral-400">-</span>
                  )}
                </div>
              </div>
            ))}

            {/* Total Row */}
            <div className="grid grid-cols-4 gap-2 px-3 py-2 text-sm bg-neutral-50 font-medium">
              <div className="text-neutral-900">Gesamt</div>
              <div className="text-center text-neutral-600">{stats.totalCount}</div>
              <div className="text-center text-neutral-900">
                {stats.totalCount > 0 ? stats.totalAverage.toFixed(1) : '-'}
              </div>
              <div className="flex justify-center">
                {stats.totalCount > 2 && stats.overallTrend !== 0 && (
                  <span className={`flex items-center gap-0.5 text-xs ${stats.overallTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.overallTrend > 0 ? (
                      <TrendingUpIcon size={12} />
                    ) : (
                      <TrendingDownIcon size={12} />
                    )}
                    {Math.abs(stats.overallTrend).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.bestGrade !== null ? formatPunkte(stats.bestGrade) : '-'}
              </div>
              <div className="text-xs text-green-600">Beste Note</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">
                {stats.worstGrade !== null ? formatPunkte(stats.worstGrade) : '-'}
              </div>
              <div className="text-xs text-amber-600">Niedrigste Note</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <NeueUebungsklausurDialog
        open={isNeueKlausurOpen}
        onOpenChange={setIsNeueKlausurOpen}
        onSave={handleAddKlausur}
      />

      <UebungsklausurBearbeitenDialog
        open={isBearbeitenOpen}
        onOpenChange={setIsBearbeitenOpen}
        klausur={selectedKlausur}
        onSave={handleUpdateKlausur}
        onDelete={handleDeleteClick}
      />

      <LoeschenDialog
        open={isLoeschenOpen}
        onOpenChange={setIsLoeschenOpen}
        exam={selectedKlausur}
        onConfirm={() => selectedKlausur && handleDeleteKlausur(selectedKlausur.id)}
      />

      <UebungsklausurenAuswertungDialog
        open={isAuswertungOpen}
        onOpenChange={setIsAuswertungOpen}
      />

      <UebungsklausurenFilterDialog
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </div>
  );
};

export default UebungsklausurenContent;
