import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'prepwell_exams';

/**
 * ExamsContext - Manages exam/Klausur data with persistence
 *
 * Provides CRUD operations for exams and calculates statistics
 * for the Leistungen page and Mentor analytics.
 */
const ExamsContext = createContext(null);

/**
 * Default sample exams for initial state
 */
const DEFAULT_EXAMS = [
  {
    id: 'exam-1',
    title: 'Vertragsrecht & Handelsrecht',
    subject: 'Zivilrecht',
    description: 'MGT00012345, Raum H209',
    date: '2025-07-24',
    time: '13:00 - 15:00',
    ects: 6,
    grade: null,
    status: 'angemeldet'
  },
  {
    id: 'exam-2',
    title: 'Strafrecht AT',
    subject: 'Strafrecht',
    description: 'MGT00023456',
    date: '2025-06-15',
    time: '09:00 - 12:00',
    ects: 8,
    grade: 11,
    status: 'bestanden'
  },
  {
    id: 'exam-3',
    title: 'Verwaltungsrecht',
    subject: 'Öffentliches Recht',
    description: 'MGT00034567',
    date: '2025-05-10',
    time: '14:00 - 17:00',
    ects: 6,
    grade: 9,
    status: 'bestanden'
  },
  {
    id: 'exam-4',
    title: 'BGB AT',
    subject: 'Zivilrecht',
    description: 'MGT00045678',
    date: '2025-04-20',
    time: '10:00 - 12:00',
    ects: 5,
    grade: 12,
    status: 'bestanden'
  },
  {
    id: 'exam-5',
    title: 'Verfassungsrecht',
    subject: 'Öffentliches Recht',
    description: 'MGT00056789',
    date: '2025-03-15',
    time: '09:00 - 11:00',
    ects: 6,
    grade: 10,
    status: 'bestanden'
  }
];

/**
 * Load exams from localStorage
 */
const loadExams = () => {
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
 * Save exams to localStorage
 */
const saveExams = (exams) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
  } catch (error) {
    console.error('Error saving exams:', error);
  }
};

/**
 * ExamsProvider component
 */
export const ExamsProvider = ({ children }) => {
  const [exams, setExams] = useState(loadExams);

  // Persist state changes to localStorage
  useEffect(() => {
    saveExams(exams);
  }, [exams]);

  /**
   * Add a new exam
   */
  const addExam = (examData) => {
    const newExam = {
      ...examData,
      id: `exam-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setExams(prev => [...prev, newExam]);
    return newExam;
  };

  /**
   * Update an existing exam
   */
  const updateExam = (updatedExam) => {
    setExams(prev => prev.map(exam =>
      exam.id === updatedExam.id
        ? { ...updatedExam, updatedAt: new Date().toISOString() }
        : exam
    ));
  };

  /**
   * Delete an exam
   */
  const deleteExam = (examId) => {
    setExams(prev => prev.filter(exam => exam.id !== examId));
  };

  /**
   * Get exam by ID
   */
  const getExamById = (examId) => {
    return exams.find(exam => exam.id === examId) || null;
  };

  /**
   * Calculate exam statistics
   */
  const stats = useMemo(() => {
    const gradedExams = exams.filter(e => e.grade !== null);
    const bySubject = {};

    gradedExams.forEach(exam => {
      if (!bySubject[exam.subject]) {
        bySubject[exam.subject] = { count: 0, totalGrade: 0, totalEcts: 0, grades: [] };
      }
      bySubject[exam.subject].count++;
      bySubject[exam.subject].totalGrade += exam.grade * exam.ects;
      bySubject[exam.subject].totalEcts += exam.ects;
      bySubject[exam.subject].grades.push({ grade: exam.grade, date: exam.date });
    });

    const subjectStats = Object.entries(bySubject).map(([subject, data]) => ({
      subject,
      count: data.count,
      average: data.totalEcts > 0 ? (data.totalGrade / data.totalEcts) : 0,
      grades: data.grades.sort((a, b) => new Date(a.date) - new Date(b.date))
    }));

    const totalEcts = gradedExams.reduce((sum, e) => sum + e.ects, 0);
    const weightedSum = gradedExams.reduce((sum, e) => sum + (e.grade * e.ects), 0);
    const totalAverage = totalEcts > 0 ? (weightedSum / totalEcts) : 0;

    // Grade trend (comparing last 3 exams to previous 3)
    const sortedByDate = [...gradedExams].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedByDate.slice(0, 3);
    const previous = sortedByDate.slice(3, 6);

    const recentAvg = recent.length > 0
      ? recent.reduce((s, e) => s + e.grade, 0) / recent.length
      : 0;
    const previousAvg = previous.length > 0
      ? previous.reduce((s, e) => s + e.grade, 0) / previous.length
      : 0;

    const gradeTrend = previous.length > 0 ? recentAvg - previousAvg : 0;

    // Best and worst grades
    const allGrades = gradedExams.map(e => e.grade);
    const bestGrade = allGrades.length > 0 ? Math.max(...allGrades) : null;
    const worstGrade = allGrades.length > 0 ? Math.min(...allGrades) : null;

    return {
      totalCount: gradedExams.length,
      totalEcts,
      totalAverage,
      subjectStats,
      gradeTrend,
      bestGrade,
      worstGrade,
      upcomingExams: exams.filter(e => e.grade === null && new Date(e.date) > new Date()),
      passedExams: exams.filter(e => e.status === 'bestanden'),
      failedExams: exams.filter(e => e.status === 'nicht bestanden')
    };
  }, [exams]);

  const value = {
    exams,
    stats,
    addExam,
    updateExam,
    deleteExam,
    getExamById
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
