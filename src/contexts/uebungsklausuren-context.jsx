import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const STORAGE_KEY = 'prepwell_uebungsklausuren';

/**
 * UebungsklausurenContext - Manages practice exam data for Exam Mode
 *
 * Simplified compared to ExamsContext:
 * - Only Punkte (0-18) grade system
 * - No semester field
 * - Focused on the 3 main Rechtsgebiete
 */
const UebungsklausurenContext = createContext(null);

// The three main Rechtsgebiete for exam preparation
export const RECHTSGEBIETE = [
  'Zivilrecht',
  'Strafrecht',
  'Öffentliches Recht',
];

// Color mapping for Rechtsgebiete
export const RECHTSGEBIET_COLORS = {
  'Zivilrecht': {
    bg: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-800',
    chart: '#3b82f6', // blue-500
    chartLight: '#93c5fd', // blue-300
  },
  'Strafrecht': {
    bg: 'bg-red-100',
    border: 'border-red-200',
    text: 'text-red-800',
    chart: '#ef4444', // red-500
    chartLight: '#fca5a5', // red-300
  },
  'Öffentliches Recht': {
    bg: 'bg-green-100',
    border: 'border-green-200',
    text: 'text-green-800',
    chart: '#22c55e', // green-500
    chartLight: '#86efac', // green-300
  },
};

/**
 * Format grade for display (always Punkte)
 */
export const formatPunkte = (value) => {
  if (value === null || value === undefined) return '-';
  return `${value} Pkt.`;
};

/**
 * Get grade quality label
 */
export const getGradeLabel = (punkte) => {
  if (punkte === null || punkte === undefined) return '';
  if (punkte >= 14) return 'Sehr gut';
  if (punkte >= 11) return 'Gut';
  if (punkte >= 8) return 'Befriedigend';
  if (punkte >= 5) return 'Ausreichend';
  if (punkte >= 2) return 'Mangelhaft';
  return 'Ungenügend';
};

/**
 * Default sample practice exams
 */
const DEFAULT_UEBUNGSKLAUSUREN = [
  {
    id: 'uk-1',
    title: 'BGB AT Grundlagen',
    subject: 'Zivilrecht',
    description: 'Anfechtung, Stellvertretung',
    date: '2025-03-15',
    punkte: 12,
  },
  {
    id: 'uk-2',
    title: 'Schuldrecht AT',
    subject: 'Zivilrecht',
    description: 'Leistungsstörungen',
    date: '2025-04-02',
    punkte: 10,
  },
  {
    id: 'uk-3',
    title: 'Strafrecht AT I',
    subject: 'Strafrecht',
    description: 'Tatbestand, Rechtswidrigkeit',
    date: '2025-04-20',
    punkte: 8,
  },
  {
    id: 'uk-4',
    title: 'Grundrechte',
    subject: 'Öffentliches Recht',
    description: 'Art. 1-19 GG',
    date: '2025-05-05',
    punkte: 11,
  },
  {
    id: 'uk-5',
    title: 'Sachenrecht',
    subject: 'Zivilrecht',
    description: 'Eigentumserwerb',
    date: '2025-05-20',
    punkte: 9,
  },
  {
    id: 'uk-6',
    title: 'Strafrecht BT',
    subject: 'Strafrecht',
    description: 'Vermögensdelikte',
    date: '2025-06-10',
    punkte: 13,
  },
  {
    id: 'uk-7',
    title: 'Verwaltungsrecht AT',
    subject: 'Öffentliches Recht',
    description: 'Verwaltungsakt',
    date: '2025-06-25',
    punkte: 7,
  },
  {
    id: 'uk-8',
    title: 'Schuldrecht BT',
    subject: 'Zivilrecht',
    description: 'Kaufrecht',
    date: '2025-07-12',
    punkte: 14,
  },
];

/**
 * Load from localStorage
 */
const loadUebungsklausuren = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading Übungsklausuren:', error);
  }
  return DEFAULT_UEBUNGSKLAUSUREN;
};

/**
 * Save to localStorage
 */
const saveUebungsklausuren = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving Übungsklausuren:', error);
  }
};

/**
 * UebungsklausurenProvider component
 */
export const UebungsklausurenProvider = ({ children }) => {
  const [klausuren, setKlausuren] = useState(loadUebungsklausuren);

  // Persist to localStorage
  useEffect(() => {
    saveUebungsklausuren(klausuren);
  }, [klausuren]);

  /**
   * Add a new Übungsklausur
   */
  const addKlausur = useCallback((data) => {
    const newKlausur = {
      ...data,
      id: `uk-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setKlausuren(prev => [...prev, newKlausur]);
    return newKlausur;
  }, []);

  /**
   * Update an existing Übungsklausur
   */
  const updateKlausur = useCallback((updated) => {
    setKlausuren(prev => prev.map(k =>
      k.id === updated.id
        ? { ...updated, updatedAt: new Date().toISOString() }
        : k
    ));
  }, []);

  /**
   * Delete an Übungsklausur
   */
  const deleteKlausur = useCallback((id) => {
    setKlausuren(prev => prev.filter(k => k.id !== id));
  }, []);

  /**
   * Get by ID
   */
  const getKlausurById = useCallback((id) => {
    return klausuren.find(k => k.id === id) || null;
  }, [klausuren]);

  /**
   * Calculate statistics
   */
  const stats = useMemo(() => {
    const gradedKlausuren = klausuren.filter(k => k.punkte !== null && k.punkte !== undefined);

    // By Rechtsgebiet
    const bySubject = {};
    RECHTSGEBIETE.forEach(subject => {
      bySubject[subject] = { count: 0, total: 0, grades: [] };
    });

    gradedKlausuren.forEach(k => {
      if (bySubject[k.subject]) {
        bySubject[k.subject].count++;
        bySubject[k.subject].total += k.punkte;
        bySubject[k.subject].grades.push({
          punkte: k.punkte,
          date: k.date,
          title: k.title,
        });
      }
    });

    // Subject stats with averages and trends
    const subjectStats = RECHTSGEBIETE.map(subject => {
      const data = bySubject[subject];
      const sortedGrades = [...data.grades].sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate trend (last 3 vs previous 3)
      const recent = sortedGrades.slice(-3);
      const previous = sortedGrades.slice(-6, -3);

      const recentAvg = recent.length > 0
        ? recent.reduce((s, g) => s + g.punkte, 0) / recent.length
        : 0;
      const previousAvg = previous.length > 0
        ? previous.reduce((s, g) => s + g.punkte, 0) / previous.length
        : 0;

      const trend = previous.length > 0 ? recentAvg - previousAvg : 0;

      return {
        subject,
        count: data.count,
        average: data.count > 0 ? data.total / data.count : 0,
        trend,
        grades: sortedGrades,
      };
    });

    // Total stats
    const totalCount = gradedKlausuren.length;
    const totalSum = gradedKlausuren.reduce((s, k) => s + k.punkte, 0);
    const totalAverage = totalCount > 0 ? totalSum / totalCount : 0;

    // All grades sorted by date for chart
    const allGradesByDate = gradedKlausuren
      .map(k => ({
        date: k.date,
        punkte: k.punkte,
        subject: k.subject,
        title: k.title,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Distribution of Rechtsgebiete (percentage)
    const distribution = RECHTSGEBIETE.map(subject => ({
      subject,
      count: bySubject[subject].count,
      percentage: totalCount > 0 ? (bySubject[subject].count / totalCount) * 100 : 0,
    }));

    // Best and worst grades
    const allPunkte = gradedKlausuren.map(k => k.punkte);
    const bestGrade = allPunkte.length > 0 ? Math.max(...allPunkte) : null;
    const worstGrade = allPunkte.length > 0 ? Math.min(...allPunkte) : null;

    // Overall trend
    const sortedAll = [...gradedKlausuren].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentAll = sortedAll.slice(0, 3);
    const previousAll = sortedAll.slice(3, 6);

    const recentAllAvg = recentAll.length > 0
      ? recentAll.reduce((s, k) => s + k.punkte, 0) / recentAll.length
      : 0;
    const previousAllAvg = previousAll.length > 0
      ? previousAll.reduce((s, k) => s + k.punkte, 0) / previousAll.length
      : 0;

    const overallTrend = previousAll.length > 0 ? recentAllAvg - previousAllAvg : 0;

    return {
      totalCount,
      totalAverage,
      subjectStats,
      allGradesByDate,
      distribution,
      bestGrade,
      worstGrade,
      overallTrend,
    };
  }, [klausuren]);

  const value = {
    klausuren,
    stats,
    addKlausur,
    updateKlausur,
    deleteKlausur,
    getKlausurById,
  };

  return (
    <UebungsklausurenContext.Provider value={value}>
      {children}
    </UebungsklausurenContext.Provider>
  );
};

/**
 * useUebungsklausuren hook
 */
export const useUebungsklausuren = () => {
  const context = useContext(UebungsklausurenContext);
  if (!context) {
    throw new Error('useUebungsklausuren must be used within a UebungsklausurenProvider');
  }
  return context;
};

export default UebungsklausurenContext;
