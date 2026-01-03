/**
 * useDashboard Hook
 * Manages dashboard data and state
 *
 * Data Model:
 * - CONTENT: What to learn (timeless) - stored in contentsById
 * - SLOT: When to learn (date + position) - stored in slotsByDate
 * - BLOCK: How to display (derived from Slot + Content)
 *
 * Data flow: CalendarContext → useDashboard → Startseite
 */

import { useState, useCallback, useMemo } from 'react';
import { useCalendar } from '../contexts/calendar-context';
import { useCheckIn } from '../contexts/checkin-context';
import { useMentor } from '../contexts/mentor-context';

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
 * useDashboard hook
 * @returns Dashboard state and actions
 */
export function useDashboard() {
  // Current date state
  const [currentDate, setCurrentDate] = useState(new Date());

  // CheckIn context for Well Score questionnaire
  const {
    isCheckInButtonEnabled,
    wasMorningSkipped,
    todayCheckIn,
  } = useCheckIn();

  // Mentor context for activation status
  const { isActivated: isMentorActivated } = useMentor();

  // Get data from CalendarContext (Single Source of Truth)
  // BUG-023 FIX: Also get timeBlocksByDate for user-created time blocks
  const {
    privateBlocksByDate,
    timeBlocksByDate, // BUG-023 FIX: Time-based blocks for Dashboard
    tasksByDate,
    lernplanMetadata,
    hasActiveLernplan,
    addTask: addTaskToContext,
    updateTask: updateTaskInContext,
    toggleTaskComplete,
    deleteTask: deleteTaskFromContext,
    getBlocksForDate, // NEW: Get derived blocks from context
  } = useCalendar();

  // Derived date values
  const dateString = useMemo(() => formatDate(currentDate), [currentDate]);
  const displayDate = useMemo(() => formatDisplayDate(currentDate), [currentDate]);

  /**
   * Toggle task priority
   * @param taskId - Task ID
   * @param newPriority - The new priority value ('none', 'medium', 'high')
   */
  const toggleTaskPriority = useCallback((taskId, newPriority) => {
    const dayTasks = tasksByDate[dateString] || [];
    const task = dayTasks.find(t => t.id === taskId);
    if (task) {
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

  // BUG-023 FIX: Get time blocks for today (user-created in Dashboard/Week)
  const todayTimeBlocks = useMemo(() => {
    const blocks = timeBlocksByDate[dateString] || [];
    return blocks.map(block => {
      // Calculate startHour and duration from startTime and endTime
      const [startH, startM] = (block.startTime || '09:00').split(':').map(Number);
      const [endH, endM] = (block.endTime || '10:00').split(':').map(Number);
      const startHour = startH + startM / 60;
      const endMinutes = endH * 60 + endM;
      const startMinutes = startH * 60 + startM;
      const duration = Math.max(0.5, (endMinutes - startMinutes) / 60);

      return {
        id: block.id,
        startHour,
        duration,
        title: block.title || 'Lernblock',
        description: block.description || '',
        blockType: block.blockType || 'lernblock',
        rechtsgebiet: block.rechtsgebiet,
        unterrechtsgebiet: block.unterrechtsgebiet,
        isFromLernplan: false, // Always false for time blocks
        isTimeBlock: true, // Mark as time block
        hasTime: true,
        startTime: block.startTime,
        endTime: block.endTime,
        repeatEnabled: block.repeatEnabled || false,
        repeatType: block.repeatType,
        repeatCount: block.repeatCount,
        tasks: block.tasks || [],
      };
    });
  }, [dateString, timeBlocksByDate]);

  // Get blocks for today from CalendarContext (uses new Content→Slot→Block model)
  // BUG-023 FIX: Combine Lernplan slots (position-based) with time blocks (time-based)
  const todaySlots = useMemo(() => {
    // getBlocksForDate returns derived blocks from slotsByDate (Lernplan)
    const lernplanBlocks = getBlocksForDate(dateString);

    // Transform Lernplan blocks to zeitplan widget format
    const lernplanFormatted = lernplanBlocks.map(block => ({
      id: block.id,
      startHour: block.startHour,
      duration: block.duration,
      title: block.title || 'Lernblock',
      description: block.description || '',
      tags: block.blockType ? [block.blockType] : [],
      isBlocked: block.isLocked || block.isBlocked || false,
      blockType: block.blockType,
      rechtsgebiet: block.rechtsgebiet,
      unterrechtsgebiet: block.unterrechtsgebiet,
      isFromLernplan: block.isFromLernplan || false, // Wizard-created vs manual
      // Time data
      hasTime: block.hasTime || false,
      startTime: block.startTime,
      endTime: block.endTime,
      // Repeat data
      repeatEnabled: block.repeatEnabled || false,
      repeatType: block.repeatType,
      repeatCount: block.repeatCount,
      // Tasks
      tasks: block.tasks || [],
    }));

    // BUG-023 FIX: Combine Lernplan blocks with time blocks
    // Time blocks come from timeBlocksByDate (user-created in Dashboard/Week)
    return [...lernplanFormatted, ...todayTimeBlocks];
  }, [dateString, getBlocksForDate, todayTimeBlocks]);

  // Check if there are "real" Lernplan slots (from wizard, not manual)
  const hasRealLernplanSlots = useMemo(() => {
    return todaySlots.some(slot => slot.isFromLernplan === true);
  }, [todaySlots]);

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

  // Check-in is done if mentor is activated and today's check-in is completed (not skipped)
  const checkInDone = useMemo(() => {
    if (!isMentorActivated) {
      // If mentor is not activated, use legacy check-in tracking
      const lastCheckIn = localStorage.getItem('prepwell_last_checkin');
      return lastCheckIn === dateString;
    }
    // Check if any period has been completed (not skipped)
    return (todayCheckIn.morning?.answers && !todayCheckIn.morning?.skipped) ||
           (todayCheckIn.evening?.answers && !todayCheckIn.evening?.skipped);
  }, [isMentorActivated, dateString, todayCheckIn]);

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
   * If mentor is activated, navigate to questionnaire page
   * Otherwise, just mark as done (legacy behavior)
   */
  const doCheckIn = useCallback(() => {
    if (isMentorActivated) {
      // Navigate to check-in questionnaire
      window.location.href = '/checkin';
    } else {
      // Legacy behavior: just mark as done
      localStorage.setItem('prepwell_last_checkin', dateString);
    }
  }, [dateString, isMentorActivated]);

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
      priority: 'none',
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
    hasRealLernplanSlots, // true if wizard-created slots exist for today
    isMentorActivated,
    isCheckInButtonEnabled: isMentorActivated ? isCheckInButtonEnabled : !checkInDone,
    wasMorningSkipped,

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
