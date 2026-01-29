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
    todayBlocks,
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

  // FR1: Filter out scheduled tasks (they should not appear in To-Do list when scheduled to a block)
  const availableAufgaben = useMemo(() => {
    return aufgaben.filter(task => !task.scheduledInBlock);
  }, [aufgaben]);

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
  // BUG-023 FIX: Use timeSessionsByDate and addTimeSession for user-created sessions
  const {
    blocksByDate,
    privateSessionsByDate,
    timeSessionsByDate, // BUG-023 FIX: Time-based sessions
    updateDayBlocks,
    addPrivateSession, // T30: Renamed from addPrivateBlock
    updatePrivateBlock,
    deletePrivateSession, // T30: Renamed from deletePrivateBlock
    deleteSeriesPrivateBlocks,
    addTimeSession, // T30: Renamed from addTimeBlock, BUG-023 FIX: Use this instead of addBlockWithContent
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
    deleteAufgabeFromPlan, // For deleting aufgaben from dashboard
    updateThemaInPlan, // For toggling thema completed status
    // Aufgabe Scheduling (for drag & drop)
    scheduleAufgabeToBlock,
    unscheduleAufgabeFromBlock, // For removing tasks from blocks
    // FR1: Task Scheduling (for drag & drop To-Do tasks)
    scheduleTaskToBlock,
    unscheduleTaskFromBlock,
    // T5.4: Thema Scheduling (for drag & drop complete thema)
    scheduleThemaToBlock,
    // T5.4: Cleanup expired schedules at midnight
    cleanupExpiredSchedules,
  } = useCalendar();

  // Selected theme list state
  const [selectedThemeListId, setSelectedThemeListId] = useState(null);

  // T5.1: Progress calculation setting - determines if thema checkboxes are shown
  const [showThemaCheckbox, setShowThemaCheckbox] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.learning?.progressCalculation === 'themen';
    } catch {
      return false;
    }
  });

  // Option C: chapterLevelEnabled setting - determines if Kapitel level is shown in hierarchy
  const [chapterLevelEnabled, setChapterLevelEnabled] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.jura?.chapterLevelEnabled ?? false;
    } catch {
      return false;
    }
  });

  // Daily goal enabled setting - determines if Tagesziel is shown on dashboard
  const [dailyGoalEnabled, setDailyGoalEnabled] = useState(() => {
    try {
      const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
      return settings.learning?.dailyGoalEnabled ?? true; // Default: enabled
    } catch {
      return true;
    }
  });

  // Listen for settings changes (when user changes settings)
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('prepwell_settings') || '{}');
        setShowThemaCheckbox(settings.learning?.progressCalculation === 'themen');
        setChapterLevelEnabled(settings.jura?.chapterLevelEnabled ?? false);
        setDailyGoalEnabled(settings.learning?.dailyGoalEnabled ?? true);
      } catch {
        setShowThemaCheckbox(false);
        setChapterLevelEnabled(false);
        setDailyGoalEnabled(true);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event from settings page
    window.addEventListener('prepwell-settings-changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('prepwell-settings-changed', handleStorageChange);
    };
  }, []);

  // T5.4: Cleanup expired scheduled items on mount (midnight expiration)
  useEffect(() => {
    if (cleanupExpiredSchedules) {
      cleanupExpiredSchedules();
    }
  }, [cleanupExpiredSchedules]);

  // PW-021: Convert contentPlans (type='themenliste') to the format expected by LernblockWidget
  // Now uses NEW T27 structure: selectedAreas[] + themen[]
  // Hierarchy for widget: Unterrechtsgebiet (=Area) → Kapitel → Themen → Aufgaben
  const themeLists = useMemo(() => {
    if (!contentPlans) return [];

    return contentPlans
      // PW-021 FIX: Auch Drafts ausfiltern (konsistent mit lernplan-content.jsx)
      .filter(plan => plan.type === 'themenliste' && !plan.archived && plan.status !== 'draft')
      .map(plan => {
        let totalAufgaben = 0;
        let completedAufgaben = 0;

        // PW-021: Read from NEW structure (selectedAreas + themen)
        const unterrechtsgebiete = (plan.selectedAreas || []).map(area => {
          // Filter themen that belong to this area
          const areaThemen = (plan.themen || []).filter(t => t.areaId === area.id);

          // Build themen with aufgaben
          const themen = areaThemen.map(t => {
            const aufgaben = (t.aufgaben || []).map(a => {
              totalAufgaben++;
              if (a.completed) completedAufgaben++;
              return {
                id: a.id,
                title: a.name, // T27 uses 'name', widget expects 'title'
                completed: a.completed || false,
                priority: a.priority || 'none',
                scheduledInBlock: a.scheduledInBlock || null,
              };
            });
            return {
              id: t.id,
              title: t.name, // T27 uses 'name', widget expects 'title'
              description: t.description || '',
              completed: t.completed || false,
              aufgaben,
            };
          });

          // Wrap in kapitel structure (widget expects this hierarchy)
          const kapitel = themen.length > 0 ? [{
            id: `kapitel-${area.id}`,
            title: area.name,
            themen,
          }] : [];

          return {
            id: area.id,
            name: area.name,
            rechtsgebiet: area.rechtsgebietId,
            rechtsgebietId: area.rechtsgebietId,
            kapitel,
          };
        }).filter(urg => urg.kapitel.length > 0); // Only include areas with content

        return {
          id: plan.id,
          name: plan.name,
          unterrechtsgebiete,
          progress: { completed: completedAufgaben, total: totalAufgaben },
        };
      });
  }, [contentPlans]);

  // PW-021: Handle theme list Aufgabe (task) toggle - uses NEW T27 structure
  const handleToggleThemeListAufgabe = useCallback((aufgabeId) => {
    if (!selectedThemeListId) return;

    const plan = contentPlans?.find(p => p.id === selectedThemeListId);
    if (!plan) return;

    // Deep clone and update the aufgabe's completed status in NEW structure
    const updatedPlan = JSON.parse(JSON.stringify(plan));
    updatedPlan.themen?.forEach(t => {
      t.aufgaben?.forEach(a => {
        if (a.id === aufgabeId) {
          a.completed = !a.completed;
        }
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

  // Handle deleting an Aufgabe from the selected theme list
  const handleDeleteThemeListAufgabe = useCallback((unterrechtsgebietId, kapitelId, themaId, aufgabeId, rechtsgebietId) => {
    if (!selectedThemeListId) return;
    deleteAufgabeFromPlan(selectedThemeListId, rechtsgebietId, unterrechtsgebietId, kapitelId, themaId, aufgabeId);
  }, [selectedThemeListId, deleteAufgabeFromPlan]);

  // Handle toggling Aufgabe priority in the selected theme list
  // Cycles: none → medium (!) → high (!!) → none
  // Uses flat themen structure (plan.themen[].aufgaben[])
  const handleToggleThemeListAufgabePriority = useCallback((unterrechtsgebietId, kapitelId, themaId, aufgabeId, currentPriority, rechtsgebietId) => {
    if (!selectedThemeListId) return;
    const plan = contentPlans?.find(p => p.id === selectedThemeListId);
    if (!plan) return;

    const priorityMap = { none: 'medium', medium: 'high', high: 'none' };
    const nextPriority = priorityMap[currentPriority] || 'medium';

    // Update using flat themen structure
    const updatedThemen = (plan.themen || []).map(t => {
      if (t.id !== themaId) return t;
      return {
        ...t,
        aufgaben: (t.aufgaben || []).map(a =>
          a.id === aufgabeId ? { ...a, priority: nextPriority } : a
        ),
      };
    });

    updateContentPlan(selectedThemeListId, { themen: updatedThemen });
  }, [selectedThemeListId, contentPlans, updateContentPlan]);

  // PW-021: T5.1: Handle toggling Thema completed status - uses NEW T27 structure
  const handleToggleThemaCompleted = useCallback((unterrechtsgebietId, kapitelId, themaId, rechtsgebietId) => {
    if (!selectedThemeListId) return;
    const plan = contentPlans?.find(p => p.id === selectedThemeListId);
    if (!plan) return;

    // Find thema in NEW structure (themen array at root)
    const thema = plan.themen?.find(t => t.id === themaId);
    const currentCompleted = thema?.completed || false;

    // Deep clone and update
    const updatedPlan = JSON.parse(JSON.stringify(plan));
    const themaToUpdate = updatedPlan.themen?.find(t => t.id === themaId);
    if (themaToUpdate) {
      themaToUpdate.completed = !currentCompleted;
    }

    updateContentPlan(selectedThemeListId, updatedPlan);
  }, [selectedThemeListId, contentPlans, updateContentPlan]);

  // FR2: Today's blocks for BlocksListView (from calendar_blocks, NOT time_sessions!)
  // These are the block allocations from the month view (capacity planning)
  const todayBlocksForWidget = useMemo(() => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    // Group blocks by topicId/contentId to get unique learning blocks
    const blockMap = new Map();
    dayBlocks.forEach(block => {
      if (block.status !== 'empty') {
        const blockId = block.topicId || block.contentId || block.id;
        if (!blockMap.has(blockId)) {
          blockMap.set(blockId, {
            id: blockId,
            title: block.topicTitle || block.title || 'Lernblock',
            blockType: block.blockType || 'lernblock',
            rechtsgebiet: block.rechtsgebiet,
            unterrechtsgebiet: block.unterrechtsgebiet,
            size: 1,
            positions: [block.position],
            tasks: block.tasks || [],
          });
        } else {
          // Merge multi-position blocks
          const existing = blockMap.get(blockId);
          existing.size += 1;
          existing.positions.push(block.position);
        }
      }
    });
    return Array.from(blockMap.values());
  }, [blocksByDate, dateString]);

  // FR2: Block task handlers use updateDayBlocks (calendar_blocks), NOT updateTimeBlock
  const handleToggleBlockTask = useCallback((blockId, taskId) => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const updatedBlocks = dayBlocks.map(block => {
      const isMatch = block.topicId === blockId || block.contentId === blockId || block.id === blockId;
      if (isMatch && block.tasks) {
        return {
          ...block,
          tasks: block.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      }
      return block;
    });
    updateDayBlocks(dateString, updatedBlocks);
  }, [dateString, blocksByDate, updateDayBlocks]);

  // FR2: Add a new task to a calendar block
  const handleAddBlockTask = useCallback((blockId, taskTitle) => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const newTask = {
      id: `block-task-${Date.now()}`,
      title: taskTitle,
      completed: false,
      priority: 'none',
      createdAt: new Date().toISOString(),
    };
    const updatedBlocks = dayBlocks.map(block => {
      const isMatch = block.topicId === blockId || block.contentId === blockId || block.id === blockId;
      if (isMatch) {
        return {
          ...block,
          tasks: [...(block.tasks || []), newTask],
        };
      }
      return block;
    });
    updateDayBlocks(dateString, updatedBlocks);
  }, [dateString, blocksByDate, updateDayBlocks]);

  // FR2: Delete a task from a calendar block
  const handleDeleteBlockTask = useCallback((blockId, taskId) => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const updatedBlocks = dayBlocks.map(block => {
      const isMatch = block.topicId === blockId || block.contentId === blockId || block.id === blockId;
      if (isMatch && block.tasks) {
        return {
          ...block,
          tasks: block.tasks.filter(task => task.id !== taskId),
        };
      }
      return block;
    });
    updateDayBlocks(dateString, updatedBlocks);
  }, [dateString, blocksByDate, updateDayBlocks]);

  // FR2: Toggle task priority in a calendar block (none → medium → high → none)
  const handleToggleBlockTaskPriority = useCallback((blockId, taskId) => {
    const dayBlocks = (blocksByDate || {})[dateString] || [];
    const priorityMap = { none: 'medium', medium: 'high', high: 'none' };
    const updatedBlocks = dayBlocks.map(block => {
      const isMatch = block.topicId === blockId || block.contentId === blockId || block.id === blockId;
      if (isMatch && block.tasks) {
        return {
          ...block,
          tasks: block.tasks.map(task => {
            if (task.id === taskId) {
              const currentPriority = task.priority || 'none';
              return { ...task, priority: priorityMap[currentPriority] || 'medium' };
            }
            return task;
          }),
        };
      }
      return block;
    });
    updateDayBlocks(dateString, updatedBlocks);
  }, [dateString, blocksByDate, updateDayBlocks]);

  // Dialog states
  const [selectedBlock, setSelectedBlock] = useState(null);

  // T4.1: Selected time range from drag-to-select
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);

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
    // Clear any previously selected time range
    setSelectedTimeRange(null);
    // Open add dialog to let user choose session type
    setIsAddDialogOpen(true);
  }, []);

  // T4.1: Handle time range selection from drag-to-select in ZeitplanWidget
  const handleTimeRangeSelect = useCallback((startHour, endHour) => {
    // Convert hours to HH:MM format
    const formatHour = (h) => {
      const hours = Math.floor(h);
      const minutes = Math.round((h - hours) * 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    setSelectedTimeRange({
      startTime: formatHour(startHour),
      endTime: formatHour(endHour),
    });
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

  // BUG-023 FIX: Add a new learning block - uses timeSessionsByDate
  // Creates time blocks (NOT block allocations) for Dashboard/Week views
  // This ensures blocks created here are NEVER shown in Month view
  const handleAddBlock = useCallback(async (_date, blockData) => {
    console.log('[Dashboard handleAddSession] BUG-023 FIX: Creating time session');

    // Create time block data (time-based, NOT position-based)
    const timeBlockData = {
      title: blockData.title,
      description: blockData.description || '',
      blockType: blockData.blockType || 'lernblock',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '10:00',
      // Repeat settings (handled by addTimeSession)
      repeatEnabled: blockData.repeatEnabled || false,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
      customDays: blockData.customDays,
      tasks: blockData.tasks || [],
    };

    // Use addTimeSession which stores in timeSessionsByDate (NOT blocksByDate)
    await addTimeSession(dateString, timeBlockData);

    console.log('[Dashboard handleAddSession] Time session created successfully');
  }, [dateString, addTimeSession]);

  // Update a block (updates both Block and Content)
  // BUG-023 FIX: Check time blocks first, then private blocks, then Lernplan blocks
  // T5.4 FIX: Unschedule removed tasks so they become available in themenliste again
  const handleUpdateBlock = useCallback(async (_date, updatedBlock) => {
    if (updatedBlock.blockType === 'private') {
      updatePrivateBlock(dateString, updatedBlock.id, updatedBlock);
      return;
    }

    // BUG-023 FIX: Check if this is a time block
    const dayTimeBlocks = (timeSessionsByDate || {})[dateString] || [];
    const dayLernplanBlocks = (blocksByDate || {})[dateString] || [];
    const isTimeBlock = dayTimeBlocks.some(block => block.id === updatedBlock.id) || updatedBlock.isTimeBlock;

    // T5.4 FIX: Find original block to compare tasks
    let originalBlock = null;
    if (isTimeBlock) {
      originalBlock = dayTimeBlocks.find(b => b.id === updatedBlock.id);
    } else {
      originalBlock = dayLernplanBlocks.find(b =>
        b.id === updatedBlock.id ||
        b.contentId === updatedBlock.id ||
        b.contentId === updatedBlock.contentId ||
        b.topicId === updatedBlock.id ||
        b.topicId === updatedBlock.topicId
      );
    }

    // T5.4 FIX: Find tasks that were removed and unschedule them
    if (originalBlock) {
      const oldTasks = originalBlock.tasks || [];
      const newTasks = updatedBlock.tasks || [];
      const newTaskIds = new Set(newTasks.map(t => t.id));

      // Find removed tasks
      const removedTasks = oldTasks.filter(t => !newTaskIds.has(t.id));

      // Unschedule each removed task that came from themenliste
      removedTasks.forEach(task => {
        if (task.sourceId && task.source === 'themenliste' && unscheduleAufgabeFromBlock) {
          unscheduleAufgabeFromBlock(task.sourceId);
        }
      });
    }

    if (isTimeBlock) {
      // Update time block (user-created in Dashboard/Week)
      console.log('[Dashboard handleUpdateSession] BUG-023 FIX: Updating time session');
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
  }, [dateString, blocksByDate, timeSessionsByDate, updateDayBlocks, updatePrivateBlock, updateTimeBlock, saveContent, unscheduleAufgabeFromBlock]);

  // Delete a block (removes Block, Content remains for potential reuse)
  // BUG-023 FIX: Check time blocks first, then private blocks, then Lernplan blocks
  // T5.4 FIX: Unschedule all tasks in the block before deletion
  const handleDeleteBlock = useCallback(async (_date, blockId) => {
    const dayPrivateBlocks = (privateSessionsByDate || {})[dateString] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateSession(dateString, blockId);
      return;
    }

    // BUG-023 FIX: Check if it's a time block
    const dayTimeBlocks = (timeSessionsByDate || {})[dateString] || [];
    const dayLernplanBlocks = (blocksByDate || {})[dateString] || [];
    const isTimeBlock = dayTimeBlocks.some(b => b.id === blockId);

    // T5.4 FIX: Find block and unschedule all its tasks before deletion
    let blockToDelete = null;
    if (isTimeBlock) {
      blockToDelete = dayTimeBlocks.find(b => b.id === blockId);
    } else {
      blockToDelete = dayLernplanBlocks.find(b =>
        b.contentId === blockId ||
        b.topicId === blockId ||
        b.id === blockId
      );
    }

    // Unschedule all tasks from themenliste
    if (blockToDelete?.tasks && unscheduleAufgabeFromBlock) {
      blockToDelete.tasks.forEach(task => {
        if (task.sourceId && task.source === 'themenliste') {
          unscheduleAufgabeFromBlock(task.sourceId);
        }
      });
    }

    if (isTimeBlock) {
      console.log('[Dashboard handleDeleteSession] BUG-023 FIX: Deleting time session');
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
  }, [dateString, blocksByDate, timeSessionsByDate, privateSessionsByDate, updateDayBlocks, deletePrivateSession, deleteTimeBlock, unscheduleAufgabeFromBlock]);

  // Add a new private session
  const handleAddPrivateBlock = useCallback((_date, blockData) => {
    addPrivateSession(dateString, {
      ...blockData,
      startTime: blockData.startTime || '09:00',
      endTime: blockData.endTime || '11:00',
    });
  }, [dateString, addPrivateSession]);

  // Handle dropping a task or thema onto a block
  // Supports both contentId and topicId patterns for cross-view compatibility
  // TICKET-7: Ensures a task can only be scheduled to ONE block at a time
  // T5.4: Extended to support dropping complete thema with all aufgaben
  // FIX: Now checks BOTH blocksByDate (Lernplan) AND timeSessionsByDate (manual time blocks)
  const handleDropTaskToBlock = useCallback((block, droppedItem, source, itemType = 'task') => {
    const lernplanBlocks = (blocksByDate || {})[dateString] || [];
    const timeBlocks = (timeSessionsByDate || {})[dateString] || [];
    let itemsWereAdded = false;
    let targetBlockId = null;
    let targetIsTimeBlock = false;

    // Bug 1b fix: Helper to check if block matches target
    // Enhanced matching to handle all ID formats (timeblock-xxx, UUIDs, contentIds, topicIds)
    const isBlockMatch = (blk, targetBlock) => {
      // Direct ID match (most common for time blocks)
      if (blk.id && targetBlock.id && blk.id === targetBlock.id) return true;
      // Content ID match (for Lernplan blocks)
      if (blk.contentId && (blk.contentId === targetBlock.id || blk.contentId === targetBlock.contentId)) return true;
      // Topic ID match (for topic-based blocks)
      if (blk.topicId && (blk.topicId === targetBlock.id || blk.topicId === targetBlock.topicId)) return true;
      // Reverse check: target has contentId/topicId
      if (targetBlock.contentId && (targetBlock.contentId === blk.id || targetBlock.contentId === blk.contentId)) return true;
      if (targetBlock.topicId && (targetBlock.topicId === blk.id || targetBlock.topicId === blk.topicId)) return true;
      return false;
    };

    // Check which data store contains the target block
    const targetInLernplan = lernplanBlocks.some(blk => isBlockMatch(blk, block));
    const targetInTimeBlocks = timeBlocks.some(blk => isBlockMatch(blk, block));

    // T5.4: Handle thema drop (complete thema with all aufgaben)
    if (itemType === 'thema') {
      const thema = droppedItem;
      const aufgabenToAdd = thema.aufgaben || [];

      if (aufgabenToAdd.length === 0) return;

      // Create tasks from all aufgaben in the thema
      const newTasks = aufgabenToAdd.map((a, index) => ({
        id: `dropped-${Date.now()}-${index}`,
        sourceId: a.id,
        text: a.title,
        completed: a.completed || false,
        source: source,
        // T5.4: Track thema association for grouped display
        themaId: thema.id,
        themaTitle: thema.title,
        kapitel: thema.kapitelTitle,
      }));

      // Try to add to time blocks first (most common case for manual blocks)
      if (targetInTimeBlocks) {
        const targetTimeBlock = timeBlocks.find(blk => isBlockMatch(blk, block));
        if (targetTimeBlock) {
          const existingTasks = targetTimeBlock.tasks || [];
          const tasksToAddFiltered = newTasks.filter(nt =>
            !existingTasks.some(et => et.sourceId === nt.sourceId)
          );

          if (tasksToAddFiltered.length > 0) {
            itemsWereAdded = true;
            targetBlockId = targetTimeBlock.id;
            targetIsTimeBlock = true;

            updateTimeBlock(dateString, targetTimeBlock.id, {
              tasks: [...existingTasks, ...tasksToAddFiltered],
            });
          }
        }
      }
      // Fallback to Lernplan blocks
      else if (targetInLernplan) {
        const updatedBlocks = lernplanBlocks.map(blk => {
          if (isBlockMatch(blk, block)) {
            const existingTasks = blk.tasks || [];
            const tasksToAddFiltered = newTasks.filter(nt =>
              !existingTasks.some(et => et.sourceId === nt.sourceId)
            );

            if (tasksToAddFiltered.length > 0) {
              itemsWereAdded = true;
              targetBlockId = blk.id;

              return {
                ...blk,
                tasks: [...existingTasks, ...tasksToAddFiltered],
                updatedAt: new Date().toISOString(),
              };
            }
          }
          return blk;
        });

        if (itemsWereAdded) {
          updateDayBlocks(dateString, updatedBlocks);
        }
      }

      // Mark the whole thema as scheduled in the themenliste
      if (itemsWereAdded && scheduleThemaToBlock) {
        scheduleThemaToBlock(thema.id, {
          blockId: targetBlockId,
          date: dateString,
          blockTitle: block.title || 'Lernblock',
        });
      }
      return;
    }

    // Original single task drop logic
    const droppedTask = droppedItem;

    // Create new task object
    const newTask = {
      id: `dropped-${Date.now()}`,
      sourceId: droppedTask.id,
      text: droppedTask.text,
      completed: droppedTask.completed || false,
      source: source,
      thema: droppedTask.thema,
      kapitel: droppedTask.kapitel,
    };

    // Try to add to time blocks first (most common case for manual blocks)
    if (targetInTimeBlocks) {
      const targetTimeBlock = timeBlocks.find(blk => isBlockMatch(blk, block));
      if (targetTimeBlock) {
        const existingTasks = targetTimeBlock.tasks || [];
        const alreadyExists = existingTasks.some(t =>
          t.sourceId === droppedTask.id || t.id === droppedTask.id
        );

        if (!alreadyExists) {
          itemsWereAdded = true;
          targetBlockId = targetTimeBlock.id;
          targetIsTimeBlock = true;

          updateTimeBlock(dateString, targetTimeBlock.id, {
            tasks: [...existingTasks, newTask],
          });
        }
      }
    }
    // Fallback to Lernplan blocks
    else if (targetInLernplan) {
      // TICKET-7: First, remove the task from ALL other blocks where it might exist
      const blocksWithTaskRemoved = lernplanBlocks.map(blk => {
        const existingTasks = blk.tasks || [];
        const taskExistsHere = existingTasks.some(t =>
          t.sourceId === droppedTask.id || t.id === droppedTask.id
        );

        if (taskExistsHere) {
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
        if (isBlockMatch(blk, block)) {
          const existingTasks = blk.tasks || [];
          const alreadyExists = existingTasks.some(t =>
            t.sourceId === droppedTask.id || t.id === droppedTask.id
          );

          if (!alreadyExists) {
            itemsWereAdded = true;
            targetBlockId = blk.id;

            return {
              ...blk,
              tasks: [...existingTasks, newTask],
              updatedAt: new Date().toISOString(),
            };
          }
        }
        return blk;
      });

      updateDayBlocks(dateString, updatedBlocks);
    }

    // Handle source-specific behavior
    if (source === 'todos' && itemsWereAdded) {
      // FR1: Mark as scheduled instead of deleting (allows restoration)
      scheduleTaskToBlock(droppedTask.id, {
        blockId: targetBlockId,
        date: dateString,
        blockTitle: block.title || 'Lernblock',
      });
    } else if (source === 'themenliste' && itemsWereAdded) {
      // Mark the aufgabe as scheduled in the themenliste (grays it out)
      scheduleAufgabeToBlock(droppedTask.id, {
        blockId: targetBlockId,
        date: dateString,
        blockTitle: block.title || 'Lernblock',
      });
    }
  }, [dateString, blocksByDate, timeSessionsByDate, updateDayBlocks, updateTimeBlock, scheduleTaskToBlock, scheduleAufgabeToBlock, scheduleThemaToBlock]);

  // Handle removing a task from a block (for unscheduling)
  // This removes the task from the block AND marks it as available again in themenliste
  const handleRemoveTaskFromBlock = useCallback((block, task) => {
    const lernplanBlocks = (blocksByDate || {})[dateString] || [];
    const timeBlocks = (timeSessionsByDate || {})[dateString] || [];

    // Bug 1b fix: Helper to check if block matches target
    // Enhanced matching to handle all ID formats (timeblock-xxx, UUIDs, contentIds, topicIds)
    const isBlockMatch = (blk, targetBlock) => {
      // Direct ID match (most common for time blocks)
      if (blk.id && targetBlock.id && blk.id === targetBlock.id) return true;
      // Content ID match (for Lernplan blocks)
      if (blk.contentId && (blk.contentId === targetBlock.id || blk.contentId === targetBlock.contentId)) return true;
      // Topic ID match (for topic-based blocks)
      if (blk.topicId && (blk.topicId === targetBlock.id || blk.topicId === targetBlock.topicId)) return true;
      // Reverse check: target has contentId/topicId
      if (targetBlock.contentId && (targetBlock.contentId === blk.id || targetBlock.contentId === blk.contentId)) return true;
      if (targetBlock.topicId && (targetBlock.topicId === blk.id || targetBlock.topicId === blk.topicId)) return true;
      return false;
    };

    // Check which data store contains the target block
    const targetInTimeBlocks = timeBlocks.some(blk => isBlockMatch(blk, block));

    if (targetInTimeBlocks) {
      // Remove from time block
      const targetTimeBlock = timeBlocks.find(blk => isBlockMatch(blk, block));
      if (targetTimeBlock) {
        const updatedTasks = (targetTimeBlock.tasks || []).filter(t => t.id !== task.id);
        updateTimeBlock(dateString, targetTimeBlock.id, {
          tasks: updatedTasks,
        });
      }
    } else {
      // Remove from Lernplan block
      const updatedBlocks = lernplanBlocks.map(blk => {
        if (isBlockMatch(blk, block)) {
          return {
            ...blk,
            tasks: (blk.tasks || []).filter(t => t.id !== task.id),
            updatedAt: new Date().toISOString(),
          };
        }
        return blk;
      });
      updateDayBlocks(dateString, updatedBlocks);
    }

    // FR1: Permanent delete - for todos, actually delete the task
    if (task.source === 'todos' && task.sourceId) {
      // Permanently delete the task from the To-Do list
      removeTask(task.sourceId);
    } else if (task.source === 'themenliste' && task.sourceId && unscheduleAufgabeFromBlock) {
      // For themenliste tasks, unschedule (they can't be deleted, only unscheduled)
      unscheduleAufgabeFromBlock(task.sourceId);
    }
  }, [dateString, blocksByDate, timeSessionsByDate, updateDayBlocks, updateTimeBlock, removeTask, unscheduleAufgabeFromBlock]);

  // FR1: Handle unscheduling a task from a block (returns it to To-Do list)
  // This removes the task from the block AND marks it as available again
  const handleUnscheduleTaskFromBlock = useCallback((block, task) => {
    const lernplanBlocks = (blocksByDate || {})[dateString] || [];
    const timeBlocks = (timeSessionsByDate || {})[dateString] || [];

    // Helper to check if block matches target
    const isBlockMatch = (blk, targetBlock) => {
      if (blk.id && targetBlock.id && blk.id === targetBlock.id) return true;
      if (blk.contentId && (blk.contentId === targetBlock.id || blk.contentId === targetBlock.contentId)) return true;
      if (blk.topicId && (blk.topicId === targetBlock.id || blk.topicId === targetBlock.topicId)) return true;
      if (targetBlock.contentId && (targetBlock.contentId === blk.id || targetBlock.contentId === blk.contentId)) return true;
      if (targetBlock.topicId && (targetBlock.topicId === blk.id || targetBlock.topicId === blk.topicId)) return true;
      return false;
    };

    // Check which data store contains the target block
    const targetInTimeBlocks = timeBlocks.some(blk => isBlockMatch(blk, block));

    if (targetInTimeBlocks) {
      // Remove from time block
      const targetTimeBlock = timeBlocks.find(blk => isBlockMatch(blk, block));
      if (targetTimeBlock) {
        const updatedTasks = (targetTimeBlock.tasks || []).filter(t => t.id !== task.id);
        updateTimeBlock(dateString, targetTimeBlock.id, {
          tasks: updatedTasks,
        });
      }
    } else {
      // Remove from Lernplan block
      const updatedBlocks = lernplanBlocks.map(blk => {
        if (isBlockMatch(blk, block)) {
          return {
            ...blk,
            tasks: (blk.tasks || []).filter(t => t.id !== task.id),
            updatedAt: new Date().toISOString(),
          };
        }
        return blk;
      });
      updateDayBlocks(dateString, updatedBlocks);
    }

    // Unschedule based on source type (makes task available again in To-Do list)
    if (task.source === 'todos' && task.sourceId && unscheduleTaskFromBlock) {
      unscheduleTaskFromBlock(task.sourceId);
    } else if (task.source === 'themenliste' && task.sourceId && unscheduleAufgabeFromBlock) {
      unscheduleAufgabeFromBlock(task.sourceId);
    }
  }, [dateString, blocksByDate, timeSessionsByDate, updateDayBlocks, updateTimeBlock, unscheduleTaskFromBlock, unscheduleAufgabeFromBlock]);

  // Current date as Date object for dialogs
  const currentDateObj = new Date(dateString);

  // BUG-023 FIX: Dashboard shows manually-created blocks (not Lernplan wizard blocks)
  // - Private blocks: from todayPrivateBlocks
  // - Lernblöcke, Wiederholungsblöcke, Klausurblöcke: from todayBlocks where isFromLernplan !== true
  const topics = [];

  // Filter todayBlocks to get only manually-created blocks (not from Wizard)
  const manuallyCreatedBlocks = useMemo(() => {
    return todayBlocks.filter(block => block.isFromLernplan !== true);
  }, [todayBlocks]);

  // BUG-022 FIX: Calculate daily learning goal with proper priority:
  // 0. Check if daily goal is enabled (if disabled, return 0 to hide from dashboard)
  // 1. User-defined setting from Settings page (dailyGoalHours)
  // 2. Calculated from planned Lernplan blocks for today
  // 3. If neither, return 0 (not a hardcoded fallback)
  const dailyLearningGoalMinutes = useMemo(() => {
    // Priority 0: Check if daily goal is enabled (uses React state for reactivity)
    if (!dailyGoalEnabled) {
      return 0;
    }

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
    const learningBlocks = todayBlocks.filter(block =>
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
  }, [todayBlocks, dailyGoalEnabled]);

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
        isMentorActivated={mentorIsActivated}
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
                tasks={availableAufgaben}
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
                onDeleteThemeListAufgabe={handleDeleteThemeListAufgabe}
                onToggleThemeListAufgabePriority={handleToggleThemeListAufgabePriority}
                onToggleThemaCompleted={handleToggleThemaCompleted}
                showThemaCheckbox={showThemaCheckbox}
                chapterLevelEnabled={chapterLevelEnabled}
                onArchiveThemeList={archiveContentPlan}
                // FR2: Blocks props for third toggle position
                todayBlocks={todayBlocksForWidget}
                onToggleBlockTask={handleToggleBlockTask}
                onAddBlockTask={handleAddBlockTask}
                onDeleteBlockTask={handleDeleteBlockTask}
                onToggleBlockTaskPriority={handleToggleBlockTaskPriority}
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
                onTimeRangeSelect={handleTimeRangeSelect}
                onDropTaskToBlock={handleDropTaskToBlock}
                onRemoveTaskFromBlock={handleRemoveTaskFromBlock}
                onUnscheduleTaskFromBlock={handleUnscheduleTaskFromBlock}
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
        onUnscheduleTask={handleUnscheduleTaskFromBlock}
        availableBlocks={4}
        availableTasks={availableAufgaben}
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
        availableBlocks={4}
      />

      {/* Manage Exam Session Dialog */}
      <ManageExamSessionDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableBlocks={4}
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
        availableBlocks={4}
        availableTasks={availableAufgaben}
        themeLists={themeLists}
        initialStartTime={selectedTimeRange?.startTime}
        initialEndTime={selectedTimeRange?.endTime}
      />

      {/* Create Repetition Session Dialog */}
      <CreateRepetitionSessionDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableBlocks={4}
        initialStartTime={selectedTimeRange?.startTime}
        initialEndTime={selectedTimeRange?.endTime}
      />

      {/* Create Exam Session Dialog */}
      <CreateExamSessionDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableBlocks={4}
        initialStartTime={selectedTimeRange?.startTime}
        initialEndTime={selectedTimeRange?.endTime}
      />

      {/* Create Private Session Dialog */}
      <CreatePrivateSessionDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={currentDateObj}
        initialTime={selectedTimeRange?.startTime || "09:00"}
        initialEndTime={selectedTimeRange?.endTime}
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
