import { useState, useMemo, useCallback } from 'react';
import { PlusIcon, FilterIcon, BarChartIcon } from '../ui/icon';
import {
  useSemesterLeistungen,
  formatNote,
  NOTEN_SYSTEME,
} from '../../contexts/semester-leistungen-context';
import { useCalendar } from '../../contexts/calendar-context';
import { getRechtsgebietColor } from '../../utils/rechtsgebiet-colors';
import { useLabels } from '../../hooks/use-labels';

// Dialog imports
import NeueLeistungDialog from './dialogs/neue-leistung-dialog';
import LeistungBearbeitenDialog from './dialogs/leistung-bearbeiten-dialog';
import AuswertungDialog from './dialogs/auswertung-dialog';
import FilterSortierenDialog from './dialogs/filter-sortieren-dialog';
import LoeschenDialog from '../verwaltung/dialogs/loeschen-dialog';

/**
 * SemesterleistungenContent component
 * Main content for Normal Mode semester performances
 *
 * Figma: Node-ID 2585:1844
 * Columns: Fach, Semester, Thema, Datum, Note
 * NO stats panel - full width table
 */
const SemesterleistungenContent = ({ className = '' }) => {
  const { leistungen, addLeistung, updateLeistung, deleteLeistung } = useSemesterLeistungen();
  const { subject } = useLabels(); // T29: Dynamic labels

  // T29: Calendar integration
  const { updateDayBlocks, blocksByDate, addTimeSession, addPrivateSession, privateSessionsByDate, deletePrivateSession } = useCalendar();

  const [selectedLeistung, setSelectedLeistung] = useState(null);

  // Dialog states
  const [isNeueLeistungOpen, setIsNeueLeistungOpen] = useState(false);
  const [isBearbeitenOpen, setIsBearbeitenOpen] = useState(false);
  const [isAuswertungOpen, setIsAuswertungOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoeschenOpen, setIsLoeschenOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    rechtsgebiete: [],
    primarySort: 'date',
    sortDirection: 'desc',
  });

  // Filtered leistungen
  const filteredLeistungen = useMemo(() => {
    let result = [...leistungen];

    // Apply rechtsgebiet filter
    if (filters.rechtsgebiete.length > 0) {
      result = result.filter(l => filters.rechtsgebiete.includes(l.rechtsgebiet));
    }

    // Apply sorting
    result.sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      if (filters.primarySort === 'date') {
        const dateA = a.datum ? new Date(a.datum) : new Date(0);
        const dateB = b.datum ? new Date(b.datum) : new Date(0);
        return direction * (dateB - dateA);
      }
      if (filters.primarySort === 'grade') {
        return direction * ((b.note || 0) - (a.note || 0));
      }
      if (filters.primarySort === 'subject') {
        return direction * (a.rechtsgebiet || '').localeCompare(b.rechtsgebiet || '');
      }
      return direction * (a.titel || '').localeCompare(b.titel || '');
    });

    return result;
  }, [leistungen, filters]);

  // T29: Helper to create calendar entries for Klausur
  const createKlausurCalendarEntries = useCallback(async (leistungData) => {
    if (!leistungData.inKalender || !leistungData.datum) return;

    const dateKey = leistungData.datum; // Already in YYYY-MM-DD format

    // 1. Create calendar_blocks (Monatsansicht) - 2 blocks with kind 'klausur'
    const existingBlocks = blocksByDate[dateKey] || [];
    const klausurBlock = {
      id: `klausur-${leistungData.id || Date.now()}`,
      kind: 'klausur',
      blockType: 'klausur',
      size: 2,
      position: 1,
      title: leistungData.titel,
      rechtsgebiet: leistungData.rechtsgebiet,
      leistungId: leistungData.id,
      isFromSemesterleistung: true,
    };

    // Add or update the klausur block
    const filteredBlocks = existingBlocks.filter(b => b.leistungId !== leistungData.id);
    await updateDayBlocks(dateKey, [...filteredBlocks, klausurBlock]);

    // 2. If uhrzeit is present, create time_sessions (Wochenansicht)
    if (leistungData.uhrzeit) {
      // Parse uhrzeit format "HH:MM - HH:MM" or "HH:MM"
      const timeParts = leistungData.uhrzeit.split('-').map(t => t.trim());
      const startTime = timeParts[0] || '09:00';
      const endTime = timeParts[1] || timeParts[0] || '11:00';

      await addTimeSession(dateKey, {
        id: `klausur-session-${leistungData.id || Date.now()}`,
        title: leistungData.titel,
        description: leistungData.beschreibung || '',
        blockType: 'klausur',
        kind: 'klausur',
        rechtsgebiet: leistungData.rechtsgebiet,
        startTime,
        endTime,
        leistungId: leistungData.id,
        isFromSemesterleistung: true,
      });
    }

    console.log('[T29] Klausur calendar entries created for:', dateKey);
  }, [blocksByDate, updateDayBlocks, addTimeSession]);

  // T29: Helper to find earliest available time slot for reminder
  const findEarliestTimeSlot = useCallback((dateKey) => {
    const sessions = privateSessionsByDate[dateKey] || [];

    // Default slot: 08:00
    const defaultStart = '08:00';
    const defaultEnd = '08:15';

    // Check if 08:00-08:15 is available
    const isDefaultSlotBusy = sessions.some(session => {
      const sessionStart = session.startTime || '00:00';
      const sessionEnd = session.endTime || '23:59';
      // Check overlap with 08:00-08:15
      return sessionStart < '08:15' && sessionEnd > '08:00';
    });

    if (!isDefaultSlotBusy) {
      return { startTime: defaultStart, endTime: defaultEnd };
    }

    // Find the earliest session and place reminder 15 min before
    const sortedSessions = [...sessions].sort((a, b) =>
      (a.startTime || '00:00').localeCompare(b.startTime || '00:00')
    );

    if (sortedSessions.length > 0) {
      const earliestSession = sortedSessions[0];
      const [hours, minutes] = (earliestSession.startTime || '08:00').split(':').map(Number);
      const startMinutes = hours * 60 + minutes - 15;
      const endMinutes = startMinutes + 15;

      const startTime = `${Math.floor(startMinutes / 60).toString().padStart(2, '0')}:${(startMinutes % 60).toString().padStart(2, '0')}`;
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

      return { startTime, endTime };
    }

    return { startTime: defaultStart, endTime: defaultEnd };
  }, [privateSessionsByDate]);

  // T29: Helper to create reminder private session
  const createReminderSession = useCallback(async (leistungData) => {
    if (!leistungData.erinnerungEnabled || !leistungData.erinnerungDatum) return null;

    const dateKey = leistungData.erinnerungDatum;
    const { startTime, endTime } = findEarliestTimeSlot(dateKey);

    const reminderBlock = await addPrivateSession(dateKey, {
      title: `Klausuranmeldung: ${leistungData.titel}`,
      description: `Anmeldung zur Klausur in ${leistungData.rechtsgebiet}`,
      startTime,
      endTime,
      blockType: 'private',
      // T29: Link to leistung for auto-delete
      leistungId: leistungData.id,
      isReminderSession: true,
    });

    console.log('[T29] Reminder session created for:', dateKey, reminderBlock?.id);
    return reminderBlock?.id;
  }, [addPrivateSession, findEarliestTimeSlot]);

  // T29: Helper to delete reminder private session
  const deleteReminderSession = useCallback(async (leistungId) => {
    // Find and delete the reminder session for this leistung
    for (const [dateKey, sessions] of Object.entries(privateSessionsByDate)) {
      const reminderSession = sessions.find(s => s.leistungId === leistungId && s.isReminderSession);
      if (reminderSession) {
        await deletePrivateSession(dateKey, reminderSession.id);
        console.log('[T29] Reminder session deleted:', reminderSession.id);
        return;
      }
    }
  }, [privateSessionsByDate, deletePrivateSession]);

  // Handlers
  const handleAddLeistung = async (data) => {
    const newLeistung = await addLeistung(data);
    // T29: Create calendar entries if checkbox is checked
    if (data.inKalender && data.datum) {
      await createKlausurCalendarEntries({ ...data, id: newLeistung?.id });
    }
    // T29: Create reminder session if enabled
    if (data.erinnerungEnabled && data.erinnerungDatum && data.status === 'ausstehend') {
      await createReminderSession({ ...data, id: newLeistung?.id });
    }
  };

  const handleUpdateLeistung = async (updated) => {
    // T29: Get previous leistung to check for status change
    const previousLeistung = leistungen.find(l => l.id === updated.id);
    const statusChangedToAngemeldet = previousLeistung?.status === 'ausstehend' && updated.status === 'angemeldet';

    await updateLeistung(updated);

    // T29: Update calendar entries if checkbox is checked
    if (updated.inKalender && updated.datum) {
      await createKlausurCalendarEntries(updated);
    }

    // T29: Auto-delete reminder when status changes to "angemeldet"
    if (statusChangedToAngemeldet) {
      await deleteReminderSession(updated.id);
    }
    // T29: Create/update reminder session if enabled and status is still "ausstehend"
    else if (updated.erinnerungEnabled && updated.erinnerungDatum && updated.status === 'ausstehend') {
      // Delete old reminder first (if date changed)
      await deleteReminderSession(updated.id);
      await createReminderSession(updated);
    }
    // T29: Delete reminder if disabled
    else if (!updated.erinnerungEnabled) {
      await deleteReminderSession(updated.id);
    }
  };

  const handleDeleteLeistung = async (id) => {
    await deleteLeistung(id);
    setIsLoeschenOpen(false);
    setIsBearbeitenOpen(false);
    setSelectedLeistung(null);
  };

  const handleLeistungClick = (leistung) => {
    setSelectedLeistung(leistung);
    setIsBearbeitenOpen(true);
  };

  const handleDeleteClick = () => {
    setIsBearbeitenOpen(false);
    setIsLoeschenOpen(true);
  };

  // Format date for display
  const formatDate = (dateStr, uhrzeitStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const formatted = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(-2)}`;
    if (uhrzeitStr) {
      return `${formatted}, ${uhrzeitStr}`;
    }
    return formatted;
  };

  // Get color classes for rechtsgebiet
  const getRechtsgebietColors = (rechtsgebiet) => {
    const colors = getRechtsgebietColor(rechtsgebiet);
    if (!colors) return 'bg-neutral-100 border-neutral-200 text-neutral-800';
    return `${colors.bg} ${colors.border} ${colors.text}`;
  };

  return (
    <div className={`flex flex-col w-full h-full bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
        <h3 className="text-base font-medium text-neutral-900">Semesterleistungen</h3>
        <div className="flex items-center gap-2">
          {/* Neue Leistung Button - Pill Style */}
          <button
            onClick={() => setIsNeueLeistungOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors"
          >
            Neue Leistung
            <PlusIcon size={16} />
          </button>

          {/* Filter Button - Pill Style */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors"
          >
            Filtern
            <FilterIcon size={16} />
          </button>

          {/* Auswertung Button - Pill Style */}
          <button
            onClick={() => setIsAuswertungOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-300 rounded-full hover:bg-neutral-50 transition-colors"
          >
            Auswertung
            <BarChartIcon size={16} />
          </button>
        </div>
      </div>

      {/* Table Content - Full Width */}
      <div className="w-full flex-1 overflow-auto">
        <table className="w-full">
          <thead className="bg-neutral-50 border-b border-neutral-200 sticky top-0">
            <tr>
              <th className="w-[15%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500 tracking-wider">
                {subject /* T29: Dynamic label */}
              </th>
              <th className="w-[10%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500 tracking-wider">
                Semester
              </th>
              <th className="w-[40%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500 tracking-wider">
                Thema
              </th>
              <th className="w-[20%] px-4 py-2.5 text-left text-xs font-medium text-neutral-500 tracking-wider">
                Datum
              </th>
              <th className="w-[15%] px-4 py-2.5 text-right text-xs font-medium text-neutral-500 tracking-wider">
                Note
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredLeistungen.map((leistung) => (
              <tr
                key={leistung.id}
                onClick={() => handleLeistungClick(leistung)}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                {/* Fach */}
                <td className="px-4 py-3">
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded ${getRechtsgebietColors(leistung.rechtsgebiet)}`}>
                    {leistung.rechtsgebiet || 'subject'}
                  </span>
                </td>

                {/* Semester */}
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {leistung.semester || '-'}
                </td>

                {/* Thema (Title + Description) */}
                <td className="px-4 py-3">
                  <div className="text-sm text-neutral-900 font-medium">{leistung.titel || 'exam_title'}</div>
                  {leistung.beschreibung && (
                    <div className="text-xs text-neutral-500">{leistung.beschreibung}</div>
                  )}
                </td>

                {/* Datum */}
                <td className="px-4 py-3 text-sm text-neutral-600">
                  {formatDate(leistung.datum, leistung.uhrzeit)}
                </td>

                {/* Note */}
                <td className="px-4 py-3 text-sm text-right font-medium text-neutral-900">
                  {formatNote(leistung.note, leistung.notenSystem || NOTEN_SYSTEME.PUNKTE)}
                </td>
              </tr>
            ))}

            {filteredLeistungen.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-500">
                  Keine Leistungen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      <NeueLeistungDialog
        open={isNeueLeistungOpen}
        onOpenChange={setIsNeueLeistungOpen}
        onSave={handleAddLeistung}
      />

      <LeistungBearbeitenDialog
        open={isBearbeitenOpen}
        onOpenChange={setIsBearbeitenOpen}
        leistung={selectedLeistung}
        onSave={handleUpdateLeistung}
        onDelete={handleDeleteClick}
      />

      <LoeschenDialog
        open={isLoeschenOpen}
        onOpenChange={setIsLoeschenOpen}
        exam={selectedLeistung ? { title: selectedLeistung.titel, subject: selectedLeistung.rechtsgebiet } : null}
        onConfirm={() => selectedLeistung && handleDeleteLeistung(selectedLeistung.id)}
      />

      <AuswertungDialog
        open={isAuswertungOpen}
        onOpenChange={setIsAuswertungOpen}
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

export default SemesterleistungenContent;
