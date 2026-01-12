import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, DashboardLayout } from '../components/layout';
import { LernblockWidget, ZeitplanWidget, DashboardSubHeader } from '../components/dashboard';
import TimerMainDialog from '../components/dashboard/timer/timer-main-dialog';
import { useDashboard } from '../hooks';
import { useCalendar } from '../contexts/calendar-context';
import { useCheckIn } from '../contexts/checkin-context';
import { useMentor } from '../contexts/mentor-context';
import { useTimer } from '../contexts/timer-context';
import { useAppMode } from '../contexts/appmode-context';

// Dialog components (same as WeekView)
import AddThemeDialog from '../features/calendar/components/add-theme-dialog';
import CreateThemeSessionDialog from '../features/calendar/components/create-theme-session-dialog';
import CreateRepetitionSessionDialog from '../features/calendar/components/create-repetition-session-dialog';
import CreateExamSessionDialog from '../features/calendar/components/create-exam-session-dialog';
import CreatePrivateSessionDialog from '../features/calendar/components/create-private-session-dialog';
import ManageThemeSessionDialog from '../features/calendar/components/manage-theme-session-dialog';
import ManageRepetitionSessionDialog from '../features/calendar/components/manage-repetition-session-dialog';
import ManageExamSessionDialog from '../features/calendar/components/manage-exam-session-dialog';
import ManagePrivateSessionDialog from '../features/calendar/components/manage-private-session-dialog';

/**
 * DashboardPage - Startseite
 * Main homepage/dashboard with Backend integration
 *
 * Figma: "Startseite" (Node-ID: 2175:1761)
 * Status: Backend-connected
 */
const DashboardPage = () => {
  const navigate = useNavigate();

  // CheckIn and Mentor contexts for redirect logic
  // BUG-C FIX: Also get loading state to prevent redirect during data fetch
  const { isCheckInNeeded, loading: checkInLoading, getCurrentPeriod: _getCurrentPeriod } = useCheckIn();
  void _getCurrentPeriod; // Reserved for future use
  const { isActivated: mentorIsActivated } = useMentor();

  // App Mode context for exam/normal mode
  const { isExamMode } = useAppMode();

  // Timer context for sub-header and learning progress
  const {
    timerHistory,
    elapsedSeconds,
    isActive,
  } = useTimer();

  // Timer dialog state
  const [showTimerMain, setShowTimerMain] = useState(false);

  const {
    displayDate,
    dateString,
    currentLernblock: _currentLernblock,
    todayBlocks: todaySlots,
    todayPrivateBlocks, // BUG-023 FIX: Private blocks only (for ZeitplanWidget)
    aufgaben,
    dayProgress,
    loading: _loading,
    checkInDone,
    checkInStatus, // TICKET-1: Detailed check-in status
    isMentorActivated: _isMentorActivated,
    wasMorningSkipped: _wasMorningSkipped,
    hasRealLernplanBlocks: _hasRealLernplanBlocks, // true if wizard-created blocks exist
    refresh: _refresh,
    previousDay,
    nextDay,
    doCheckIn: _doCheckIn,
    toggleTask,
    toggleTaskPriority,
    addTask,
    editTask,
    removeTask,
  } = useDashboard();
  // Mark unused variables to satisfy linter
  void _currentLernblock;
  void _loading;
  void _isMentorActivated;
  void _wasMorningSkipped;
  void _hasRealLernplanBlocks;
  void _refresh;
  void _doCheckIn;

  // Redirect to check-in page if mentor is activated and check-in is needed
  // BUG-C FIX: Wait for check-in data to be loaded before deciding to redirect
  useEffect(() => {
    // Don't redirect while data is still loading (e.g. from Supabase)
    if (checkInLoading) return;

    if (mentorIsActivated && isCheckInNeeded) {
      navigate('/checkin');
    }
  }, [mentorIsActivated, isCheckInNeeded, checkInLoading, navigate]);

  // CalendarContext for CRUD operations
  // BUG-023 FIX: Use timeBlocksByDate and addTimeBlock for user-created blocks
  const {
    blocksByDate,
    privateBlocksByDate,
    timeBlocksByDate, // BUG-023 FIX: Time-based blocks
    updateDayBlocks,
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
    deleteSeriesPrivateBlocks,
    addTimeBlock, // BUG-023 FIX: Use this instead of addBlockWithContent
    updateTimeBlock,
    deleteTimeBlock,
    // NEW DATA MODEL: Content management
    saveContent,
    // Content Plans (Themenlisten)
    contentPlans,
    updateContentPlan,
    archiveContentPlan, // TICKET-12: Archive themenliste
    addAufgabeToPlan, // For adding aufgaben from dashboard
    updateAufgabeInPlan, // For editing aufgaben from dashboard
    // Aufgabe Scheduling (for drag & drop)
    scheduleAufgabeToBlock,
  } = useCalendar();

  // Selected theme list state
  const [selectedThemeListId, setSelectedThemeListId] = useState(null);

  // Convert contentPlans (type='themenliste') to the format expected by LernblockWidget
  // Preserves full hierarchy: Unterrechtsgebiet → Kapitel → Themen → Aufgaben
  // Also includes scheduledInBlock info for graying out scheduled aufgaben
  const themeLists = useMemo(() => {
    if (!contentPlans) return [];

    return contentPlans
      .filter(plan => plan.type === 'themenliste' && !plan.archived)
      .map(plan => {
        // Build unterrechtsgebiete with full hierarchy
        const unterrechtsgebiete = [];
        let totalAufgaben = 0;
        let completedAufgaben = 0;

        plan.rechtsgebiete?.forEach(rg => {
          rg.unterrechtsgebiete?.forEach(urg => {
            const kapitel = [];

            urg.kapitel?.forEach(k => {
              // Filter out undefined elements and map
              const themen = (k.themen || []).filter(t => t).map(t => {
                // Guard: use optional chaining for aufgaben access
                const aufgaben = (t?.aufgaben || []).map(a => {
                  totalAufgaben++;
                  if (a.completed) completedAufgaben++;
                  return {
                    id: a.id,
                    title: a.title,
                    completed: a.completed || false,
                    // Include scheduling info for UI display
                    scheduledInBlock: a.scheduledInBlock || null,
                  };
                });
                return {
                  id: t.id,
                  title: t.title,
                  description: t.description || '',
                  completed: t.completed || false,
                  aufgaben,
                };
              });

              if (themen.length > 0) {
                kapitel.push({
                  id: k.id,
                  title: k.title,
                  themen,
                });
              }
            });

            if (kapitel.length > 0) {
              unterrechtsgebiete.push({
                id: urg.id,
                name: urg.name,
                rechtsgebiet: rg.name || rg.rechtsgebietId,
                rechtsgebietId: rg.id, // Needed for addAufgabeToPlan
                kapitel,
              });
            }
          });
        });

        return {
          id: plan.id,
          name: plan.name,
          unterrechtsgebiete,
          progress: { completed: completedAufgaben, total: totalAufgaben },
        };
      });
  }, [contentPlans]);

  // Handle theme list Aufgabe (task) toggle
  const handleToggleThemeListAufgabe = useCallback((aufgabeId) => {
    if (!selectedThemeListId) return;

    const plan = contentPlans?.find(p => p.id === selectedThemeListId);
    if (!plan) return;

    // Deep clone and update the aufgabe's completed status
    const updatedPlan = JSON.parse(JSON.stringify(plan));
    updatedPlan.rechtsgebiete?.forEach(rg => {
      rg.unterrechtsgebiete?.forEach(urg => {
        urg.kapitel?.forEach(k => {
          k.themen?.forEach(t => {
            // Guard: t could be undefined if array has holes
            t?.aufgaben?.forEach(a => {
              if (a.id === aufgabeId) {
                a.completed = !a.completed;
              }
            });
          });
        });
      });
    });

    updateContentPlan(selectedThemeListId, updatedPlan);
  }, [selectedThemeListId, contentPlans, updateContentPlan]);

  // Handle adding a new Aufgabe to a Thema in the selected theme list
  const handleAddThemeListAufgabe = useCallback((unterrechtsgebietId, kapitelId, themaId, rechtsgebietId) => {
    if (!selectedThemeListId) return;
    addAufgabeToPlan(selectedThemeListId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId);
  }, [selectedThemeListId, addAufgabeToPlan]);

  // Handle updating an Aufgabe title in the selected theme list
  const handleUpdateThemeListAufgabe = useCallback((unterrechtsgebietId, kapitelId, themaId, aufgabeId, updates, rechtsgebietId) => {
    if (!selectedThemeListId) return;
    updateAufgabeInPlan(selectedThemeListId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeId, updates);
  }, [selectedThemeListId, updateAufgabeInPlan]);

  // Dialog states
  const [selectedBlock, setSelectedBlock] = useState(null);

  // Add block dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Create dialog states
  const [isCreateThemeOpen, setIsCreateThemeOpen] = useState(false);
  const [isCreateRepetitionOpen, setIsCreateRepetitionOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreatePrivateOpen, setIsCreatePrivateOpen] = useState(false);

  // Manage dialog states
  const [isManageThemeOpen, setIsManageThemeOpen] = useState(false);
  const [isManageRepetitionOpen, setIsManageRepetitionOpen] = useState(false);
  const [isManageExamOpen, setIsManageExamOpen] = useState(false);
  const [isManagePrivateOpen, setIsManagePrivateOpen] = useState(false);

  // Helper: Get position-based time (reserved for future use)
  const _getTimeForPosition = (position) => {
    const timePositions = {
      1: { startTime: '08:00', endTime: '10:00' },
      2: { startTime: '10:00', endTime: '12:00' },
      3: { startTime: '14:00', endTime: '16:00' },
      4: { startTime: '16:00', endTime: '18:00' },
    };
    return timePositions[position] || { startTime: '08:00', endTime: '10:00' };
  };
  void _getTimeForPosition;

  // Handle block click - open appropriate manage dialog
  const handleBlockClick = useCallback((block) => {
    setSelectedBlock(block);

    const blockType = block.blockType || 'lernblock';
    switch (blockType) {
      case 'lernblock':
        setIsManageThemeOpen(true);
        break;
      case 'repetition':
        setIsManageRepetitionOpen(true);
        break;
      case 'exam':
        setIsManageExamOpen(true);
        break;
      case 'private':
        setIsManagePrivateOpen(true);
        break;
      default:
        setIsManageThemeOpen(true);
        break;
    }
  }, []);

  // T6.5 FIX: Handle timeline click - open session creation dialog
  // Previously navigated to week view (TICKET-9), but user expects dialog
  const handleTimelineClick = useCallback(() => {
    // Open add dialog to let user choose session type
    setIsAddDialogOpen(true);
  }, []);

  // Handle block type selection from AddThemeDialog
  const handleSelectBlockType = useCallback((type) => {
    setIsAddDialogOpen(false);
    switch (type) {
      case 'lernblock':
        setIsCreateThemeOpen(true);
        break;
      case 'repetition':
        setIsCreateRepetitionOpen(true);
        break;
      case 'exam':
        setIsCreateExamOpen(true);
        break;
      case 'private':
        setIsCreatePrivateOpen(true);
        break;
      default:
        break;
    }
  }, []);

  // BUG-023 FIX: Add a new learning block - uses timeBlocksByDate
  // Creates time blocks (NOT block allocations) for Dashboard/Week views
  // This ensures blocks created here are NEVER shown in Month view
  const handleAddBlock = useCallback(async (_date, blockData) => {
    console.log('[Dashboard handleAddBlock] BUG-023 FIX: Creating time block');

    // Create time block data (time-based, NOT position-based)
    const timeBlockData = {
      title: blockData.title,
      description: blockData.description || '',
      blockType: blockData.blockType || 'lernblock',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '10:00',
      // Repeat settings (handled by addTimeBlock)
      repeatEnabled: blockData.repeatEnabled || false,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
      customDays: blockData.customDays,
      tasks: blockData.tasks || [],
    };

    // Use addTimeBlock which stores in timeBlocksByDate (NOT blocksByDate)
    await addTimeBlock(dateString, timeBlockData);

    console.log('[Dashboard handleAddBlock] Time block created successfully');
  }, [dateString, addTimeBlock]);

  // Update a block (updates both Block and Content)
  // BUG-023 FIX: Check time blocks first, then private blocks, then Lernplan blocks
  const handleUpdateBlock = useCallback(async (_date, updatedBlock) => {
    if (updatedBlock.blockType === 'private') {
      updatePrivateBlock(dateString, updatedBlock.id, updatedBlock);
      return;
    }

    // BUG-023 FIX: Check if this is a time block
    const dayTimeBlocks = (timeBlocksByDate || {})[dateString] || [];
    const isTimeBlock = dayTimeBlocks.some(block => block.id === updatedBlock.id) || updatedBlock.isTimeBlock;

    if (isTimeBlock) {
      // Update time block (user-created in Dashboard/Week)
      console.log('[Dashboard handleUpdateBlock] BUG-023 FIX: Updating time block');
      await updateTimeBlock(dateString, updatedBlock.id, {
        title: updatedBlock.title,
        description: updatedBlock.description,
        blockType: updatedBlock.blockType,
        rechtsgebiet: updatedBlock.rechtsgebiet,
        unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
        startTime: updatedBlock.startTime,
        endTime: updatedBlock.endTime,
        tasks: updatedBlock.tasks || [],
      });
      return;
    }

    // Legacy: Update Lernplan block (for backwards compatibility)
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const updatedBlocks = dayBlocks.map(block => {
      const isMatch =
        block.contentId === updatedBlock.id ||
        block.contentId === updatedBlock.contentId ||
        block.topicId === updatedBlock.id ||
        block.topicId === updatedBlock.topicId ||
        block.id === updatedBlock.id;

      if (isMatch) {
        // Update Content separately if using contentId pattern
        if (block.contentId) {
          saveContent({
            id: block.contentId,
            title: updatedBlock.title,
            description: updatedBlock.description,
            rechtsgebiet: updatedBlock.rechtsgebiet,
            unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
            blockType: updatedBlock.blockType,
          });
        }

        // Update Block data
        return {
          ...block,
          title: updatedBlock.title,
          topicTitle: updatedBlock.title,
          blockType: updatedBlock.blockType,
          description: updatedBlock.description,
          rechtsgebiet: updatedBlock.rechtsgebiet,
          unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
          hasTime: updatedBlock.hasTime || false,
          startTime: updatedBlock.startTime,
          endTime: updatedBlock.endTime,
          startHour: updatedBlock.startHour,
          duration: updatedBlock.duration,
          repeatEnabled: updatedBlock.repeatEnabled || false,
          repeatType: updatedBlock.repeatType,
          repeatCount: updatedBlock.repeatCount,
          customDays: updatedBlock.customDays,
          tasks: updatedBlock.tasks || [],
          updatedAt: new Date().toISOString(),
        };
      }
      return block;
    });
    updateDayBlocks(dateString, updatedBlocks);
  }, [dateString, blocksByDate, timeBlocksByDate, updateDayBlocks, updatePrivateBlock, updateTimeBlock, saveContent]);

  // Delete a block (removes Block, Content remains for potential reuse)
  // BUG-023 FIX: Check time blocks first, then private blocks, then Lernplan blocks
  const handleDeleteBlock = useCallback(async (_date, blockId) => {
    const dayPrivateBlocks = (privateBlocksByDate || {})[dateString] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateBlock(dateString, blockId);
      return;
    }

    // BUG-023 FIX: Check if it's a time block
    const dayTimeBlocks = (timeBlocksByDate || {})[dateString] || [];
    const isTimeBlock = dayTimeBlocks.some(b => b.id === blockId);

    if (isTimeBlock) {
      console.log('[Dashboard handleDeleteBlock] BUG-023 FIX: Deleting time block');
      await deleteTimeBlock(dateString, blockId);
      return;
    }

    // Legacy: Delete Lernplan block (for backwards compatibility)
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const updatedBlocks = dayBlocks.filter(block => {
      const isMatch =
        block.contentId === blockId ||
        block.topicId === blockId ||
        block.id === blockId;
      return !isMatch;
    });
    updateDayBlocks(dateString, updatedBlocks);
    // Note: Content is NOT deleted - it can be reused later
  }, [dateString, blocksByDate, timeBlocksByDate, privateBlocksByDate, updateDayBlocks, deletePrivateBlock, deleteTimeBlock]);

  // Add a new private block
  const handleAddPrivateBlock = useCallback((_date, blockData) => {
    addPrivateBlock(dateString, {
      ...blockData,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '11:00',
    });
  }, [dateString, addPrivateBlock]);

  // Handle dropping a task onto a block
  // Supports both contentId and topicId patterns for cross-view compatibility
  // TICKET-7: Ensures a task can only be scheduled to ONE block at a time
  const handleDropTaskToBlock = useCallback((block, droppedTask, source) => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    let taskWasAdded = false;
    let targetBlockId = null;

    // TICKET-7: First, remove the task from ALL other blocks where it might exist
    // This ensures a task can only be in one block at a time
    const blocksWithTaskRemoved = dayBlocks.map(blk => {
      const existingTasks = blk.tasks || [];
      const taskExistsHere = existingTasks.some(t =>
        t.sourceId === droppedTask.id || t.id === droppedTask.id
      );

      if (taskExistsHere) {
        // Remove the task from this block
        return {
          ...blk,
          tasks: existingTasks.filter(t =>
            t.sourceId !== droppedTask.id && t.id !== droppedTask.id
          ),
          updatedAt: new Date().toISOString(),
        };
      }
      return blk;
    });

    // Now add the task to the target block
    const updatedBlocks = blocksWithTaskRemoved.map(blk => {
      // Match by contentId, topicId, or id (supports both patterns)
      const isMatch =
        blk.contentId === block.id ||
        blk.contentId === block.contentId ||
        blk.topicId === block.id ||
        blk.topicId === block.topicId ||
        blk.id === block.id;

      if (isMatch) {
        // Add the task to this block's tasks array
        const existingTasks = blk.tasks || [];
        // Check if task already exists (by sourceId or id) - shouldn't happen after removal above
        const alreadyExists = existingTasks.some(t =>
          t.sourceId === droppedTask.id || t.id === droppedTask.id
        );

        if (alreadyExists) {
          return blk; // Don't add duplicate
        }

        taskWasAdded = true;
        targetBlockId = blk.id;

        const newTask = {
          id: `dropped-${Date.now()}`,
          sourceId: droppedTask.id,
          text: droppedTask.text,
          completed: droppedTask.completed || false,
          source: source,
          thema: droppedTask.thema,
          kapitel: droppedTask.kapitel,
        };

        return {
          ...blk,
          tasks: [...existingTasks, newTask],
          updatedAt: new Date().toISOString(),
        };
      }
      return blk;
    });

    updateDayBlocks(dateString, updatedBlocks);

    // Handle source-specific behavior
    if (source === 'todos') {
      // Remove from To-Do list
      removeTask(droppedTask.id);
    } else if (source === 'themenliste' && taskWasAdded) {
      // Mark the aufgabe as scheduled in the themenliste (grays it out)
      scheduleAufgabeToBlock(droppedTask.id, {
        blockId: targetBlockId,
        date: dateString,
        blockTitle: block.title || 'Lernblock',
      });
    }
  }, [dateString, blocksByDate, updateDayBlocks, removeTask, scheduleAufgabeToBlock]);

  // Current date as Date object for dialogs
  const currentDateObj = new Date(dateString);

  // BUG-023 FIX: Dashboard shows manually-created blocks (not Lernplan wizard blocks)
  // - Private blocks: from todayPrivateBlocks
  // - Lernblöcke, Wiederholungsblöcke, Klausurblöcke: from todaySlots where isFromLernplan !== true
  const topics = [];

  // Filter todaySlots to get only manually-created blocks (not from Wizard)
  const manuallyCreatedBlocks = useMemo(() => {
    return todaySlots.filter(block => block.isFromLernplan !== true);
  }, [todaySlots]);

  // BUG-022 FIX: Calculate daily learning goal with proper priority:
  // 1. User-defined setting from Settings page (dailyGoalHours)
  // 2. Calculated from planned Lernplan blocks for today
  // 3. If neither, return 0 (not a hardcoded fallback)
  const dailyLearningGoalMinutes = useMemo(() => {
    // Priority 1: Check if user has set a daily goal in settings
    try {
      const settingsStr = localStorage.getItem('prepwell_settings');
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        if (settings?.learning?.dailyGoalHours && settings.learning.dailyGoalHours > 0) {
          // User has explicitly set a daily goal - use it
          return settings.learning.dailyGoalHours * 60;
        }
      }
    } catch (e) {
      console.error('Error reading settings:', e);
    }

    // Priority 2: Calculate from planned Lernplan blocks for today
    const learningBlocks = todaySlots.filter(block =>
      block.blockType !== 'private' && block.isFromLernplan === true
    );

    let totalMinutes = 0;
    learningBlocks.forEach(block => {
      if (block.duration) {
        // Custom duration in minutes
        totalMinutes += block.duration;
      } else if (block.startTime && block.endTime) {
        // Calculate from start/end time
        const [startH, startM] = block.startTime.split(':').map(Number);
        const [endH, endM] = block.endTime.split(':').map(Number);
        totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
      } else {
        // Default: each position-based block is 2 hours
        totalMinutes += 120;
      }
    });

    // Priority 3: If no settings and no blocks planned, return 0
    return totalMinutes;
  }, [todaySlots]);

  // BUG-009 FIX: Force periodic re-calculation of learning minutes when timer is active
  const [progressUpdateTick, setProgressUpdateTick] = useState(0);

  // Update tick every 10 seconds when timer is active to force progress bar re-render
  useEffect(() => {
    if (!isActive) return;

    const intervalId = setInterval(() => {
      setProgressUpdateTick(t => t + 1);
    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [isActive]);

  // Calculate completed learning minutes from timer history (today's sessions)
  // Plus current active timer elapsed time
  // BUG-009 FIX: Added progressUpdateTick to dependencies to ensure periodic updates
  const completedLearningMinutes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Sum completed sessions from today
    const todaySessions = timerHistory?.filter(s => s.date === today) || [];
    const historyMinutes = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60;

    // Add current active session elapsed time
    const currentMinutes = isActive ? Math.floor(elapsedSeconds / 60) : 0;

    return Math.round(historyMinutes + currentMinutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerHistory, isActive, elapsedSeconds, progressUpdateTick]);

  // BUG-023 FIX: Transform blocks to ZeitplanWidget format
  // Dashboard shows: Private blocks + manually-created blocks (Lernblock, Wiederholung, Klausur)
  // NOT shown: Wizard-created blocks (isFromLernplan: true)
  const blocksForWidget = useMemo(() => {
    const allBlocks = [];

    // Add private blocks
    todayPrivateBlocks.forEach(block => {
      const [startH, startM] = (block.startTime || '08:00').split(':').map(Number);
      const [endH, endM] = (block.endTime || '10:00').split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      const durationHours = durationMinutes / 60;

      allBlocks.push({
        id: block.id,
        startHour: startH + (startM / 60),
        duration: durationHours,
        title: block.title || 'Privater Termin',
        description: block.description || '',
        blockType: 'private',
        isBlocked: false,
        startTime: block.startTime,
        endTime: block.endTime,
        isMultiDay: block.isMultiDay || false,
        startDate: block.startDate,
        endDate: block.endDate,
      });
    });

    // Add manually-created blocks (Lernblock, Wiederholung, Klausur - not from Wizard)
    manuallyCreatedBlocks.forEach(block => {
      // Use block's time if available, otherwise use position-based defaults
      const position = block.position || 1;
      const defaultTimes = {
        1: { start: '08:00', end: '10:00' },
        2: { start: '10:00', end: '12:00' },
        3: { start: '14:00', end: '16:00' },
        4: { start: '16:00', end: '18:00' },
      };
      const defaults = defaultTimes[position] || defaultTimes[1];
      const startTime = block.startTime || defaults.start;
      const endTime = block.endTime || defaults.end;

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      const durationHours = durationMinutes / 60;

      allBlocks.push({
        id: block.id || block.contentId || block.topicId,
        startHour: startH + (startM / 60),
        duration: durationHours,
        title: block.title || block.topicTitle || 'Lernblock',
        description: block.description || '',
        blockType: block.blockType || 'lernblock',
        rechtsgebiet: block.rechtsgebiet,
        unterrechtsgebiet: block.unterrechtsgebiet,
        isBlocked: false,
        startTime,
        endTime,
        tasks: block.tasks || [],
      });
    });

    // Sort by start time
    allBlocks.sort((a, b) => a.startHour - b.startHour);

    return allBlocks;
  }, [todayPrivateBlocks, manuallyCreatedBlocks]);

  const zeitplanData = {
    completedBlocks: 0,
    totalBlocks: blocksForWidget.length,
    currentHour: new Date().getHours(),
    progress: dayProgress.percentage,
    plannedLabel: blocksForWidget.length > 0
      ? `${blocksForWidget.length} Termin${blocksForWidget.length > 1 ? 'e' : ''}`
      : '',
    blocks: blocksForWidget,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header userInitials="CN" currentPage="startseite" />

      {/* Sub-Header / Status Bar */}
      <DashboardSubHeader
        displayDate={displayDate}
        tasksCompleted={dayProgress.tasksCompleted}
        tasksTotal={dayProgress.tasksTotal}
        learningMinutesCompleted={completedLearningMinutes}
        learningMinutesGoal={dailyLearningGoalMinutes}
        checkInDone={checkInDone}
        checkInStatus={checkInStatus}
        onTimerClick={() => {
          // Always show timer main dialog - it handles all states
          setShowTimerMain(true);
        }}
      />

      {/* Main Content */}
      <main className="px-8 py-8 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <DashboardLayout
            leftColumn={
              <LernblockWidget
                topics={topics}
                tasks={aufgaben}
                onToggleTask={toggleTask}
                onTogglePriority={toggleTaskPriority}
                onAddTask={addTask}
                onEditTask={editTask}
                onRemoveTask={removeTask}
                themeLists={themeLists}
                selectedThemeListId={selectedThemeListId}
                onSelectThemeList={setSelectedThemeListId}
                onToggleThemeListAufgabe={handleToggleThemeListAufgabe}
                onAddThemeListAufgabe={handleAddThemeListAufgabe}
                onUpdateThemeListAufgabe={handleUpdateThemeListAufgabe}
                onArchiveThemeList={archiveContentPlan}
                isExamMode={isExamMode}
              />
            }
            rightColumn={
              <ZeitplanWidget
                data={zeitplanData}
                onPreviousDay={previousDay}
                onNextDay={nextDay}
                onBlockClick={handleBlockClick}
                onTimelineClick={handleTimelineClick}
                onDropTaskToBlock={handleDropTaskToBlock}
              />
            }
          />

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 text-center">
              © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
            </p>
          </footer>
        </div>
      </main>

      {/* Manage Theme Session Dialog */}
      <ManageThemeSessionDialog
        open={isManageThemeOpen}
        onOpenChange={setIsManageThemeOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
        availableTasks={aufgaben}
        themeLists={themeLists}
      />

      {/* Manage Repetition Session Dialog */}
      <ManageRepetitionSessionDialog
        open={isManageRepetitionOpen}
        onOpenChange={setIsManageRepetitionOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Exam Session Dialog */}
      <ManageExamSessionDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Private Session Dialog */}
      <ManagePrivateSessionDialog
        open={isManagePrivateOpen}
        onOpenChange={setIsManagePrivateOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        onDeleteSeries={deleteSeriesPrivateBlocks}
      />

      {/* Add Block Type Selection Dialog */}
      <AddThemeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={currentDateObj}
        onSelectType={handleSelectBlockType}
      />

      {/* Create Theme Session Dialog */}
      <CreateThemeSessionDialog
        open={isCreateThemeOpen}
        onOpenChange={setIsCreateThemeOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
        availableTasks={aufgaben}
        themeLists={themeLists}
      />

      {/* Create Repetition Session Dialog */}
      <CreateRepetitionSessionDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Exam Session Dialog */}
      <CreateExamSessionDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Private Session Dialog */}
      <CreatePrivateSessionDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={currentDateObj}
        initialTime="09:00"
        onSave={handleAddPrivateBlock}
      />

      {/* Timer Main Dialog - handles timer selection and settings inline */}
      <TimerMainDialog
        open={showTimerMain}
        onOpenChange={setShowTimerMain}
        dailyLearningGoalMinutes={dailyLearningGoalMinutes}
      />
    </div>
  );
};

export default DashboardPage;
