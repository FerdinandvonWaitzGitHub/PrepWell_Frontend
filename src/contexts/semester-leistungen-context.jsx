import { createContext, useContext, useMemo, useCallback } from 'react';
import { useSemesterLeistungenSync } from '../hooks/use-supabase-sync';
import { getAllSubjects, getRechtsgebietColor } from '../utils/rechtsgebiet-colors';

/**
 * SemesterLeistungenContext - T28
 *
 * Manages Semester-Leistungen for Normal Mode.
 * COMPLETELY SEPARATE from Übungsklausuren (Exam Mode).
 *
 * Uses the dynamic color system from rechtsgebiet-colors.js.
 */
const SemesterLeistungenContext = createContext(null);

// Notensystem constants (same as exams for compatibility)
export const NOTEN_SYSTEME = {
  PUNKTE: 'punkte',  // 0-18 points (Jura)
  NOTEN: 'noten',    // 1.0-5.0 (standard)
};

// Status options
export const STATUS_OPTIONEN = [
  { value: 'angemeldet', label: 'Angemeldet' },
  { value: 'ausstehend', label: 'Ausstehend' },
  { value: 'bestanden', label: 'Bestanden' },
  { value: 'nicht bestanden', label: 'Nicht bestanden' },
];

// Semester options (dynamic - current + past 6)
export const getSemesterOptions = () => {
  const options = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Determine current semester
  // WS starts October (month 9), SS starts April (month 3)
  const isWS = currentMonth >= 9 || currentMonth < 3;

  // Generate options: current + 6 past semesters
  let year = currentYear;
  let ws = isWS;

  for (let i = 0; i < 7; i++) {
    if (ws) {
      options.push(`WS ${year}/${(year + 1).toString().slice(-2)}`);
      ws = false;
    } else {
      options.push(`SS ${year}`);
      ws = true;
      year--;
    }
  }

  return options;
};

/**
 * Format note for display
 */
export const formatNote = (value, system) => {
  if (value === null || value === undefined) return '-';
  if (system === NOTEN_SYSTEME.PUNKTE) {
    return `${value} Pkt.`;
  }
  return value.toFixed(1);
};

/**
 * Convert between grade systems
 */
export const convertNote = (value, fromSystem, toSystem) => {
  if (value === null || value === undefined) return null;
  if (fromSystem === toSystem) return value;

  if (fromSystem === NOTEN_SYSTEME.PUNKTE && toSystem === NOTEN_SYSTEME.NOTEN) {
    if (value >= 18) return 1.0;
    if (value <= 0) return 5.0;
    if (value >= 4) {
      return Math.round((5.0 - (value - 4) * (4.0 / 14)) * 10) / 10;
    }
    return Math.round((5.0 - value * 0.25) * 10) / 10;
  }

  if (fromSystem === NOTEN_SYSTEME.NOTEN && toSystem === NOTEN_SYSTEME.PUNKTE) {
    if (value <= 1.0) return 18;
    if (value >= 5.0) return 0;
    if (value <= 4.0) {
      return Math.round(4 + (4.0 - value) * (14 / 3));
    }
    return Math.round((5.0 - value) * 4);
  }

  return value;
};

/**
 * SemesterLeistungenProvider
 */
export const SemesterLeistungenProvider = ({ children }) => {
  // Use Supabase sync hook
  const {
    data: leistungen,
    loading,
    saveItem: saveLeistung,
    removeItem: removeLeistung,
    isAuthenticated,
  } = useSemesterLeistungenSync();

  /**
   * Add a new Leistung
   */
  const addLeistung = useCallback(async (leistungData) => {
    const newLeistung = {
      ...leistungData,
      id: `local-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    await saveLeistung(newLeistung);
    return newLeistung;
  }, [saveLeistung]);

  /**
   * Update an existing Leistung
   */
  const updateLeistung = useCallback(async (updatedLeistung) => {
    const leistungWithTimestamp = {
      ...updatedLeistung,
      updatedAt: new Date().toISOString(),
    };
    await saveLeistung(leistungWithTimestamp);
  }, [saveLeistung]);

  /**
   * Delete a Leistung
   */
  const deleteLeistung = useCallback(async (leistungId) => {
    await removeLeistung(leistungId);
  }, [removeLeistung]);

  /**
   * Get Leistung by ID
   */
  const getLeistungById = useCallback((leistungId) => {
    return leistungen.find(l => l.id === leistungId) || null;
  }, [leistungen]);

  /**
   * Get normalized note value in Punkte for calculations
   */
  const getNormalizedNote = useCallback((leistung) => {
    if (leistung.note === null || leistung.note === undefined) return null;
    const system = leistung.notenSystem || NOTEN_SYSTEME.PUNKTE;
    return convertNote(leistung.note, system, NOTEN_SYSTEME.PUNKTE);
  }, []);

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    const gradedLeistungen = leistungen.filter(l =>
      l.note !== null && l.note !== undefined
    );

    const byRechtsgebiet = {};
    const bySemester = {};

    gradedLeistungen.forEach(leistung => {
      const note = getNormalizedNote(leistung);
      if (note === null) return;

      const ects = leistung.ects || 1;

      // By Rechtsgebiet
      const rg = leistung.rechtsgebiet || 'Sonstige';
      if (!byRechtsgebiet[rg]) {
        byRechtsgebiet[rg] = { count: 0, totalNote: 0, totalEcts: 0 };
      }
      byRechtsgebiet[rg].count++;
      byRechtsgebiet[rg].totalNote += note * ects;
      byRechtsgebiet[rg].totalEcts += ects;

      // By Semester
      const semester = leistung.semester || 'Unbekannt';
      if (!bySemester[semester]) {
        bySemester[semester] = { count: 0, totalNote: 0, totalEcts: 0 };
      }
      bySemester[semester].count++;
      bySemester[semester].totalNote += note * ects;
      bySemester[semester].totalEcts += ects;
    });

    // Calculate totals
    const totalEcts = gradedLeistungen.reduce((sum, l) => sum + (l.ects || 1), 0);
    const totalCount = gradedLeistungen.length;

    // Rechtsgebiet stats with weighted average and percentage
    const rechtsgebietStats = Object.entries(byRechtsgebiet).map(([rechtsgebiet, data]) => ({
      rechtsgebiet,
      count: data.count,
      ects: data.totalEcts,
      average: data.totalEcts > 0 ? (data.totalNote / data.totalEcts) : 0,
      percentage: totalEcts > 0 ? Math.round((data.totalEcts / totalEcts) * 100) : 0,
      colors: getRechtsgebietColor(rechtsgebiet),
    }));

    // Semester stats
    const semesterStats = Object.entries(bySemester).map(([semester, data]) => ({
      semester,
      count: data.count,
      ects: data.totalEcts,
      average: data.totalEcts > 0 ? (data.totalNote / data.totalEcts) : 0,
    })).sort((a, b) => {
      // Sort by semester (newest first)
      // WS 2024/25 > SS 2024 > WS 2023/24 etc.
      const parseS = (s) => {
        const match = s.match(/(WS|SS)\s*(\d{4})/);
        if (!match) return 0;
        const year = parseInt(match[2]);
        const isWS = match[1] === 'WS';
        return year * 10 + (isWS ? 5 : 0);
      };
      return parseS(b.semester) - parseS(a.semester);
    });

    // Overall weighted average
    const weightedSum = gradedLeistungen.reduce((sum, l) => {
      const note = getNormalizedNote(l);
      return sum + (note * (l.ects || 1));
    }, 0);
    const gesamtdurchschnitt = totalEcts > 0 ? (weightedSum / totalEcts) : 0;

    return {
      totalCount,
      totalEcts,
      gesamtdurchschnitt,
      rechtsgebietStats,
      semesterStats,
      bestandenCount: leistungen.filter(l => l.status === 'bestanden').length,
      nichtBestandenCount: leistungen.filter(l => l.status === 'nicht bestanden').length,
      ausstehendCount: leistungen.filter(l => l.status === 'ausstehend' || l.status === 'angemeldet').length,
    };
  }, [leistungen, getNormalizedNote]);

  /**
   * Get all available Rechtsgebiete/Fächer
   * Uses the dynamic color system
   */
  const alleRechtsgebiete = useMemo(() => {
    return getAllSubjects(true); // true = isJura (default)
  }, []);

  // Memoize context value
  const value = useMemo(() => ({
    leistungen: leistungen || [],
    loading,
    isAuthenticated,
    // CRUD
    addLeistung,
    updateLeistung,
    deleteLeistung,
    getLeistungById,
    // Stats
    stats,
    getNormalizedNote,
    // Helpers
    alleRechtsgebiete,
  }), [
    leistungen, loading, isAuthenticated,
    addLeistung, updateLeistung, deleteLeistung, getLeistungById,
    stats, getNormalizedNote, alleRechtsgebiete,
  ]);

  return (
    <SemesterLeistungenContext.Provider value={value}>
      {children}
    </SemesterLeistungenContext.Provider>
  );
};

/**
 * useSemesterLeistungen hook
 */
export const useSemesterLeistungen = () => {
  const context = useContext(SemesterLeistungenContext);
  if (!context) {
    throw new Error('useSemesterLeistungen must be used within a SemesterLeistungenProvider');
  }
  return context;
};

export default SemesterLeistungenContext;
