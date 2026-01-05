import { createContext, useContext, useMemo, useCallback } from 'react';
import { useExamsSync, useUserSettingsSync } from '../hooks/use-supabase-sync';

const STORAGE_KEY = 'prepwell_exams';
const STORAGE_KEY_SUBJECTS = 'prepwell_custom_subjects';
const STORAGE_KEY_GRADE_SYSTEM = 'prepwell_grade_system';

/**
 * ExamsContext - Manages exam/Klausur data with persistence
 *
 * Provides CRUD operations for exams and calculates statistics
 * for the Leistungen page and Mentor analytics.
 *
 * Supports dual notation system:
 * - Punkte: 0-18 (Jura/German law exam system)
 * - Noten: 1.0-5.0 (Standard German university grades)
 */
const ExamsContext = createContext(null);

// Grade system constants
export const GRADE_SYSTEMS = {
  PUNKTE: 'punkte',  // 0-18 points (Jura)
  NOTEN: 'noten',    // 1.0-5.0 (standard)
};

// Default subjects
export const DEFAULT_SUBJECTS = [
  'Zivilrecht',
  'Strafrecht',
  'Öffentliches Recht',
  'Zivilrechtliche Nebengebiete',
  'Rechtsgeschichte',
  'Philosophie',
];

// Semester options
export const SEMESTER_OPTIONS = [
  'WS 2024/25',
  'SS 2024',
  'WS 2023/24',
  'SS 2023',
  'WS 2022/23',
  'SS 2022',
  'WS 2021/22',
  'SS 2021',
];

/**
 * Convert between grade systems
 * Punkte (0-18) <-> Noten (1.0-5.0)
 */
export const convertGrade = (value, fromSystem, toSystem) => {
  if (value === null || value === undefined) return null;
  if (fromSystem === toSystem) return value;

  if (fromSystem === GRADE_SYSTEMS.PUNKTE && toSystem === GRADE_SYSTEMS.NOTEN) {
    // Punkte to Noten: 18 -> 1.0, 0 -> 5.0
    if (value >= 18) return 1.0;
    if (value <= 0) return 5.0;
    // Linear interpolation: 18->1.0, 4->4.0, 0->5.0
    if (value >= 4) {
      return Math.round((5.0 - (value - 4) * (4.0 / 14)) * 10) / 10;
    }
    return Math.round((5.0 - value * 0.25) * 10) / 10;
  }

  if (fromSystem === GRADE_SYSTEMS.NOTEN && toSystem === GRADE_SYSTEMS.PUNKTE) {
    // Noten to Punkte: 1.0 -> 18, 5.0 -> 0
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
 * Format grade for display
 */
export const formatGrade = (value, system) => {
  if (value === null || value === undefined) return '-';
  if (system === GRADE_SYSTEMS.PUNKTE) {
    return `${value} Pkt.`;
  }
  return value.toFixed(1);
};

/**
 * Default sample exams for initial state
 */
const DEFAULT_EXAMS = [
  {
    id: 'exam-1',
    title: 'Vertragsrecht & Handelsrecht',
    subject: 'Zivilrecht',
    semester: 'WS 2024/25',
    description: 'MGT00012345, Raum H209',
    date: '2025-07-24',
    time: '13:00 - 15:00',
    ects: 6,
    gradeValue: null,
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'angemeldet'
  },
  {
    id: 'exam-2',
    title: 'Strafrecht AT',
    subject: 'Strafrecht',
    semester: 'WS 2024/25',
    description: 'MGT00023456',
    date: '2025-06-15',
    time: '09:00 - 12:00',
    ects: 8,
    gradeValue: 11,
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'bestanden'
  },
  {
    id: 'exam-3',
    title: 'Verwaltungsrecht',
    subject: 'Öffentliches Recht',
    semester: 'SS 2024',
    description: 'MGT00034567',
    date: '2025-05-10',
    time: '14:00 - 17:00',
    ects: 6,
    gradeValue: 9,
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'bestanden'
  },
  {
    id: 'exam-4',
    title: 'BGB AT',
    subject: 'Zivilrecht',
    semester: 'SS 2024',
    description: 'MGT00045678',
    date: '2025-04-20',
    time: '10:00 - 12:00',
    ects: 5,
    gradeValue: 12,
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'bestanden'
  },
  {
    id: 'exam-5',
    title: 'Verfassungsrecht',
    subject: 'Öffentliches Recht',
    semester: 'WS 2023/24',
    description: 'MGT00056789',
    date: '2025-03-15',
    time: '09:00 - 11:00',
    ects: 6,
    gradeValue: 10,
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'bestanden'
  }
];

/**
 * Load exams from localStorage (legacy - kept for offline fallback)
 */
const _loadExams = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading exams:', error);
  }
  return DEFAULT_EXAMS;
};

/**
 * Save exams to localStorage (legacy - kept for offline fallback)
 */
const _saveExams = (exams) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  } catch (error) {
    console.error('Error saving exams:', error);
  }
};

/**
 * Load custom subjects from localStorage
 */
const loadCustomSubjects = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_SUBJECTS);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom subjects:', error);
  }
  return [];
};

/**
 * Load preferred grade system from localStorage
 */
const loadPreferredGradeSystem = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GRADE_SYSTEM);
    if (stored) {
      return stored;
    }
  } catch (error) {
    console.error('Error loading grade system:', error);
  }
  return GRADE_SYSTEMS.PUNKTE;
};

/**
 * ExamsProvider component
 *
 * Now uses Supabase for persistence when authenticated,
 * with LocalStorage fallback for offline/unauthenticated use.
 */
export const ExamsProvider = ({ children }) => {
  // Use Supabase sync hook for exams
  const {
    data: exams,
    loading: examsLoading,
    saveItem: saveExam,
    removeItem: removeExam,
    isAuthenticated,
  } = useExamsSync();

  // Use Supabase sync hook for user settings (includes customSubjects & gradeSystem)
  const {
    settings,
    updateSettings,
    loading: settingsLoading,
  } = useUserSettingsSync();

  // Extract settings with fallbacks
  const customSubjects = settings.customSubjects || loadCustomSubjects();
  const preferredGradeSystem = settings.gradeSystem || loadPreferredGradeSystem();

  // All available subjects (default + custom)
  const allSubjects = useMemo(() => {
    return [...DEFAULT_SUBJECTS, ...customSubjects];
  }, [customSubjects]);

  // Update preferred grade system
  const setPreferredGradeSystem = useCallback((system) => {
    updateSettings({ gradeSystem: system });
  }, [updateSettings]);

  // Update custom subjects
  const setCustomSubjects = useCallback((subjects) => {
    updateSettings({ customSubjects: subjects });
  }, [updateSettings]);

  /**
   * Add a custom subject
   */
  const addCustomSubject = useCallback((subjectName) => {
    const trimmed = subjectName.trim();
    if (trimmed && !allSubjects.includes(trimmed)) {
      const newSubjects = [...customSubjects, trimmed];
      setCustomSubjects(newSubjects);
      return true;
    }
    return false;
  }, [allSubjects, customSubjects, setCustomSubjects]);

  /**
   * Remove a custom subject
   */
  const removeCustomSubject = useCallback((subjectName) => {
    if (DEFAULT_SUBJECTS.includes(subjectName)) return false;
    const newSubjects = customSubjects.filter(s => s !== subjectName);
    setCustomSubjects(newSubjects);
    return true;
  }, [customSubjects, setCustomSubjects]);

  /**
   * Add a new exam
   * Now syncs to Supabase when authenticated
   */
  const addExam = useCallback(async (examData) => {
    const newExam = {
      ...examData,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    await saveExam(newExam);
    return newExam;
  }, [saveExam]);

  /**
   * Update an existing exam
   * Now syncs to Supabase when authenticated
   */
  const updateExam = useCallback(async (updatedExam) => {
    const examWithTimestamp = {
      ...updatedExam,
      updatedAt: new Date().toISOString()
    };
    await saveExam(examWithTimestamp);
  }, [saveExam]);

  /**
   * Delete an exam
   * Now syncs to Supabase when authenticated
   */
  const deleteExam = useCallback(async (examId) => {
    await removeExam(examId);
  }, [removeExam]);

  /**
   * Get exam by ID
   */
  const getExamById = useCallback((examId) => {
    return exams.find(exam => exam.id === examId) || null;
  }, [exams]);

  /**
   * Get normalized grade value in preferred system for calculations
   */
  const getNormalizedGrade = useCallback((exam) => {
    if (exam.gradeValue === null || exam.gradeValue === undefined) return null;
    // For legacy exams that use 'grade' instead of 'gradeValue'
    const value = exam.gradeValue ?? exam.grade;
    const system = exam.gradeSystem || GRADE_SYSTEMS.PUNKTE;
    // Always convert to Punkte for consistent calculations
    return convertGrade(value, system, GRADE_SYSTEMS.PUNKTE);
  }, []);

  /**
   * Calculate exam statistics
   */
  const stats = useMemo(() => {
    const gradedExams = exams.filter(e => {
      const grade = e.gradeValue ?? e.grade;
      return grade !== null && grade !== undefined;
    });

    const bySubject = {};
    const bySemester = {};

    gradedExams.forEach(exam => {
      const grade = getNormalizedGrade(exam);
      if (grade === null) return;

      // By subject
      if (!bySubject[exam.subject]) {
        bySubject[exam.subject] = { count: 0, totalGrade: 0, totalEcts: 0, grades: [] };
      }
      bySubject[exam.subject].count++;
      bySubject[exam.subject].totalGrade += grade * (exam.ects || 1);
      bySubject[exam.subject].totalEcts += exam.ects || 1;
      bySubject[exam.subject].grades.push({ grade, date: exam.date });

      // By semester
      const semester = exam.semester || 'Unbekannt';
      if (!bySemester[semester]) {
        bySemester[semester] = { count: 0, totalGrade: 0, totalEcts: 0, grades: [] };
      }
      bySemester[semester].count++;
      bySemester[semester].totalGrade += grade * (exam.ects || 1);
      bySemester[semester].totalEcts += exam.ects || 1;
      bySemester[semester].grades.push({ grade, date: exam.date });
    });

    const subjectStats = Object.entries(bySubject).map(([subject, data]) => ({
      subject,
      count: data.count,
      average: data.totalEcts > 0 ? (data.totalGrade / data.totalEcts) : 0,
      grades: data.grades.sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    const semesterStats = Object.entries(bySemester).map(([semester, data]) => ({
      semester,
      count: data.count,
      average: data.totalEcts > 0 ? (data.totalGrade / data.totalEcts) : 0,
      grades: data.grades.sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    const totalEcts = gradedExams.reduce((sum, e) => sum + (e.ects || 1), 0);
    const weightedSum = gradedExams.reduce((sum, e) => {
      const grade = getNormalizedGrade(e);
      return sum + (grade * (e.ects || 1));
    }, 0);
    const totalAverage = totalEcts > 0 ? (weightedSum / totalEcts) : 0;

    // Grade trend (comparing last 3 exams to previous 3)
    const sortedByDate = [...gradedExams].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedByDate.slice(0, 3);
    const previous = sortedByDate.slice(3, 6);

    const recentAvg = recent.length > 0
      ? recent.reduce((s, e) => s + getNormalizedGrade(e), 0) / recent.length
      : 0;
    const previousAvg = previous.length > 0
      ? previous.reduce((s, e) => s + getNormalizedGrade(e), 0) / previous.length
      : 0;

    const gradeTrend = previous.length > 0 ? recentAvg - previousAvg : 0;

    // Best and worst grades (in Punkte - higher is better)
    const allGrades = gradedExams.map(e => getNormalizedGrade(e)).filter(g => g !== null);
    const bestGrade = allGrades.length > 0 ? Math.max(...allGrades) : null;
    const worstGrade = allGrades.length > 0 ? Math.min(...allGrades) : null;

    return {
      totalCount: gradedExams.length,
      totalEcts,
      totalAverage,
      subjectStats,
      semesterStats,
      gradeTrend,
      bestGrade,
      worstGrade,
      upcomingExams: exams.filter(e => {
        const grade = e.gradeValue ?? e.grade;
        return grade === null && new Date(e.date) > new Date();
      }),
      passedExams: exams.filter(e => e.status === 'bestanden'),
      failedExams: exams.filter(e => e.status === 'nicht bestanden')
    };
  }, [exams, getNormalizedGrade]);

  const value = {
    exams: exams || [],
    stats,
    addExam,
    updateExam,
    deleteExam,
    getExamById,
    // Subjects
    allSubjects,
    customSubjects,
    addCustomSubject,
    removeCustomSubject,
    // Grade system
    preferredGradeSystem,
    setPreferredGradeSystem,
    getNormalizedGrade,
    // Loading states
    loading: examsLoading || settingsLoading,
    isAuthenticated,
  };

  return (
    <ExamsContext.Provider value={value}>
      {children}
    </ExamsContext.Provider>
  );
};

/**
 * useExams hook - Access exams context
 */
export const useExams = () => {
  const context = useContext(ExamsContext);
  if (!context) {
    throw new Error('useExams must be used within an ExamsProvider');
  }
  return context;
};

export default ExamsContext;
