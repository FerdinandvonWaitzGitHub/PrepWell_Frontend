/**
 * useDashboard Hook
 * Manages dashboard data and state
 *
 * Data flow: CalendarContext → useDashboard → Startseite
 * Uses the same data source as Wochenansicht, filtered to current day
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCalendar } from '../contexts/calendar-context';
import { slotsToLearningBlocks } from '../utils/slotUtils';

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Get German weekday name
 */
const getWeekdayName = (date) => {
  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  return weekdays[date.getDay()];
};

/**
 * Format date for display (e.g., "Montag, 10. November")
 */
const formatDisplayDate = (date) => {
  const weekday = getWeekdayName(date);
  const day = date.getDate();
  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const month = months[date.getMonth()];
  return `${weekday}, ${day}. ${month}`;
};

/**
 * Get time slot based on position
 */
const getTimeForPosition = (position) => {
  const timeSlots = {
    1: { startHour: 8, endHour: 10 },
    2: { startHour: 10, endHour: 12 },
    3: { startHour: 14, endHour: 16 },
  };
  return timeSlots[position] || { startHour: 8, endHour: 10 };
};

/**
 * useDashboard hook
 * @returns Dashboard state and actions
 */
export function useDashboard() {
  // Current date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkInDone, setCheckInDone] = useState(false);

  // Get data from CalendarContext (Single Source of Truth)
  const {
    slotsByDate,
    privateBlocksByDate,
    tasksByDate,
    lernplanMetadata,
    hasActiveLernplan,
    addTask: addTaskToContext,
    updateTask: updateTaskInContext,
    toggleTaskComplete,
    deleteTask: deleteTaskFromContext,
  } = useCalendar();

  // Derived date values
  const dateString = useMemo(() => formatDate(currentDate), [currentDate]);
  const displayDate = useMemo(() => formatDisplayDate(currentDate), [currentDate]);

  /**
   * Toggle task priority (medium <-> high)
   */
  const toggleTaskPriority = useCallback((taskId) => {
    const dayTasks = tasksByDate[dateString] || [];
    const task = dayTasks.find(t => t.id === taskId);
    if (task) {
      const newPriority = task.priority === 'high' ? 'medium' : 'high';
      updateTaskInContext(dateString, taskId, { priority: newPriority });
    }
  }, [dateString, tasksByDate, updateTaskInContext]);

  /**
   * Edit task text
   */
  const editTask = useCallback((taskId, newText) => {
    if (!newText || !newText.trim()) return;
    updateTaskInContext(dateString, taskId, {
      text: newText.trim(),
      title: newText.trim(),
    });
  }, [dateString, updateTaskInContext]);

  // Transform slots from CalendarContext to dashboard format
  const todaySlots = useMemo(() => {
    const daySlots = slotsByDate[dateString] || [];

    // Convert slots to learning blocks
    const learningBlocks = slotsToLearningBlocks(daySlots);

    // Transform to zeitplan format with time information
    return learningBlocks
      .filter(block => !block.isAddButton)
      .map(block => {
        // Find original slot to get position
        const originalSlot = daySlots.find(s => s.topicId === block.id);
        const position = originalSlot?.position || 1;
        const { startHour, endHour } = getTimeForPosition(position);

        return {
          id: block.id,
          startHour,
          duration: endHour - startHour,
          title: block.title || 'Lernblock',
          description: block.description || '',
          tags: block.blockType ? [block.blockType] : [],
          isBlocked: originalSlot?.isLocked || false,
          blockType: block.blockType,
          rechtsgebiet: block.rechtsgebiet,
          unterrechtsgebiet: block.unterrechtsgebiet,
        };
      });
  }, [dateString, slotsByDate]);

  // Get private blocks for today
  const todayPrivateBlocks = useMemo(() => {
    return privateBlocksByDate[dateString] || [];
  }, [dateString, privateBlocksByDate]);

  // Get tasks for today from CalendarContext
  const aufgaben = useMemo(() => {
    const dayTasks = tasksByDate[dateString] || [];
    return dayTasks.map(task => ({
      id: task.id,
      text: task.text || task.title,
      completed: task.completed || false,
      priority: task.priority || 'medium',
      subject: task.subject || 'Allgemein',
    }));
  }, [dateString, tasksByDate]);

  // Check check-in status on date change
  useEffect(() => {
    const lastCheckIn = localStorage.getItem('prepwell_last_checkin');
    setCheckInDone(lastCheckIn === dateString);
  }, [dateString]);

  /**
   * Navigate to previous day
   */
  const previousDay = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  /**
   * Navigate to next day
   */
  const nextDay = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  /**
   * Go to today
   */
  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  /**
   * Perform morning check-in
   */
  const doCheckIn = useCallback(() => {
    localStorage.setItem('prepwell_last_checkin', dateString);
    setCheckInDone(true);
  }, [dateString]);

  /**
   * Toggle task completion - uses CalendarContext
   */
  const toggleTask = useCallback((taskId) => {
    toggleTaskComplete(dateString, taskId);
  }, [dateString, toggleTaskComplete]);

  /**
   * Add new task - uses CalendarContext
   */
  const addTask = useCallback((text, subject = 'Allgemein') => {
    if (!text || !text.trim()) return null;

    const newTask = addTaskToContext(dateString, {
      text: text.trim(),
      title: text.trim(),
      subject,
      priority: 'medium',
    });

    return newTask;
  }, [dateString, addTaskToContext]);

  /**
   * Remove task - uses CalendarContext
   */
  const removeTask = useCallback((taskId) => {
    deleteTaskFromContext(dateString, taskId);
  }, [dateString, deleteTaskFromContext]);

  /**
   * Refresh - no-op since data comes from context reactively
   */
  const refresh = useCallback(() => {
    // Data is reactive from CalendarContext, no refresh needed
    // This is kept for API compatibility
    console.log('Dashboard data refreshed from CalendarContext');
  }, []);

  // Calculate day progress
  const dayProgress = useMemo(() => {
    const completed = aufgaben.filter(t => t.completed).length;
    const total = aufgaben.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Estimate hours based on slots
    const slotsCompleted = todaySlots.filter(s => s.isBlocked).length;
    const hoursCompleted = slotsCompleted * 2;
    const hoursTarget = todaySlots.length * 2 || 8;

    return {
      tasksCompleted: completed,
      tasksTotal: total,
      hoursCompleted,
      hoursTarget,
      percentage,
    };
  }, [aufgaben, todaySlots]);

  // Current lernblock (based on current time)
  const currentLernblock = useMemo(() => {
    const currentHour = new Date().getHours();
    const activeSlot = todaySlots.find(slot => {
      const slotEnd = slot.startHour + slot.duration;
      return currentHour >= slot.startHour && currentHour < slotEnd && !slot.isBlocked;
    });

    if (activeSlot) {
      return {
        blockType: activeSlot.tags?.[0] || activeSlot.blockType || 'Lernblock',
        title: activeSlot.title,
        description: activeSlot.description,
        subject: activeSlot.tags?.[0] || activeSlot.blockType || '',
      };
    }

    // Fallback if no active slot
    return {
      blockType: 'Kein aktiver Block',
      title: 'Kein Lernblock geplant',
      description: 'Für diese Uhrzeit ist kein Lernblock eingeplant.',
      subject: '',
    };
  }, [todaySlots]);

  return {
    // Date
    currentDate,
    dateString,
    displayDate,

    // Data from CalendarContext
    todaySlots,
    todayPrivateBlocks,
    aufgaben,
    currentLernblock,
    dayProgress,
    lernplanMetadata,

    // UI State
    loading: false, // No loading state needed - data is reactive
    error: null,
    checkInDone,
    hasActiveLernplan: hasActiveLernplan(),

    // Actions
    refresh,
    previousDay,
    nextDay,
    goToToday,
    doCheckIn,
    toggleTask,
    toggleTaskPriority,
    addTask,
    editTask,
    removeTask,
  };
}

export default useDashboard;
