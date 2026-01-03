import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, DashboardLayout } from '../components/layout';
import { LernblockWidget, ZeitplanWidget, DashboardSubHeader } from '../components/dashboard';
import TimerSelectionDialog from '../components/dashboard/timer/timer-selection-dialog';
import PomodoroSettingsDialog from '../components/dashboard/timer/pomodoro-settings-dialog';
import CountdownSettingsDialog from '../components/dashboard/timer/countdown-settings-dialog';
import TimerMainDialog from '../components/dashboard/timer/timer-main-dialog';
import { useDashboard } from '../hooks';
import { useCalendar } from '../contexts/calendar-context';
import { useCheckIn } from '../contexts/checkin-context';
import { useMentor } from '../contexts/mentor-context';
import { useTimer, TIMER_TYPES } from '../contexts/timer-context';
import { useAppMode } from '../contexts/appmode-context';

// Dialog components (same as WeekView)
import AddThemeDialog from '../features/calendar/components/add-theme-dialog';
import CreateThemeBlockDialog from '../features/calendar/components/create-theme-block-dialog';
import CreateRepetitionBlockDialog from '../features/calendar/components/create-repetition-block-dialog';
import CreateExamBlockDialog from '../features/calendar/components/create-exam-block-dialog';
import CreatePrivateBlockDialog from '../features/calendar/components/create-private-block-dialog';
import ManageThemeBlockDialog from '../features/calendar/components/manage-theme-block-dialog';
import ManageRepetitionBlockDialog from '../features/calendar/components/manage-repetition-block-dialog';
import ManageExamBlockDialog from '../features/calendar/components/manage-exam-block-dialog';
import ManagePrivateBlockDialog from '../features/calendar/components/manage-private-block-dialog';

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
  const { isCheckInNeeded, getCurrentPeriod: _getCurrentPeriod } = useCheckIn();
  void _getCurrentPeriod; // Reserved for future use
  const { isActivated: mentorIsActivated } = useMentor();

  // App Mode context for exam/normal mode
  const { isExamMode } = useAppMode();

  // Timer context for sub-header and learning progress
  const {
    saveTimerConfig,
    pomodoroSettings,
    timerHistory,
    elapsedSeconds,
    isActive,
    startPomodoro,
    startCountdown,
    startCountup
  } = useTimer();

  // Timer dialog states
  const [showTimerSelection, setShowTimerSelection] = useState(false);
  const [showPomodoroSettings, setShowPomodoroSettings] = useState(false);
  const [showCountdownSettings, setShowCountdownSettings] = useState(false);
  const [showTimerMain, setShowTimerMain] = useState(false);

  // Handle settings click from timer main dialog - show selection dialog
  const handleTimerSettingsClick = () => {
    console.log('handleTimerSettingsClick: closing main, opening selection');
    setShowTimerMain(false);
    setShowTimerSelection(true);
  };

  const {
    displayDate,
    dateString,
    currentLernblock: _currentLernblock,
    todaySlots,
    todayPrivateBlocks, // BUG-023 FIX: Private blocks only (for ZeitplanWidget)
    aufgaben,
    dayProgress,
    loading: _loading,
    checkInDone,
    isMentorActivated: _isMentorActivated,
    wasMorningSkipped: _wasMorningSkipped,
    hasRealLernplanSlots: _hasRealLernplanSlots, // true if wizard-created slots exist
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
  void _hasRealLernplanSlots;
  void _refresh;
  void _doCheckIn;

  // Redirect to check-in page if mentor is activated and check-in is needed
  useEffect(() => {
    if (mentorIsActivated && isCheckInNeeded) {
      navigate('/checkin');
    }
  }, [mentorIsActivated, isCheckInNeeded, navigate]);

  // CalendarContext for CRUD operations
  const {
    slotsByDate,
    privateBlocksByDate,
    updateDaySlots,
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
    deleteSeriesPrivateBlocks,
    // NEW DATA MODEL: Content management
    addSlotWithContent,
    saveContent,
    // Content Plans (Themenlisten)
    contentPlans,
    updateContentPlan,
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
              const themen = k.themen?.map(t => {
                const aufgaben = t.aufgaben?.map(a => {
                  totalAufgaben++;
                  if (a.completed) completedAufgaben++;
                  return {
                    id: a.id,
                    title: a.title,
                    completed: a.completed || false,
                    // Include scheduling info for UI display
                    scheduledInBlock: a.scheduledInBlock || null,
                  };
                }) || [];
                return {
                  id: t.id,
                  title: t.title,
                  description: t.description || '',
                  completed: t.completed || false,
                  aufgaben,
                };
              }) || [];

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
            t.aufgaben?.forEach(a => {
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
    const timeSlots = {
      1: { startTime: '08:00', endTime: '10:00' },
      2: { startTime: '10:00', endTime: '12:00' },
      3: { startTime: '14:00', endTime: '16:00' },
      4: { startTime: '16:00', endTime: '18:00' },
    };
    return timeSlots[position] || { startTime: '08:00', endTime: '10:00' };
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

  // Handle timeline click - open add block dialog
  const handleTimelineClick = useCallback(() => {
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

  // Add a new learning block (uses new Content → Slot model)
  const handleAddBlock = useCallback((_date, blockData) => {
    const daySlots = slotsByDate[dateString] || [];

    // Find next available position (1, 2, 3, or 4)
    const usedPositions = daySlots.filter(s => s.contentId).map(s => s.position);
    let position = 1;
    while (usedPositions.includes(position) && position <= 4) {
      position++;
    }

    if (position > 4) {
      console.warn('Alle Slots für diesen Tag sind belegt');
      return;
    }

    // Use addSlotWithContent from context (creates Content + Slot)
    addSlotWithContent(dateString, {
      position,
      blockType: blockData.blockType || 'lernblock',
      // Content data
      title: blockData.title,
      description: blockData.description || '',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      // Time data (optional)
      hasTime: blockData.hasTime || false,
      startTime: blockData.startTime,
      endTime: blockData.endTime,
      startHour: blockData.startHour,
      duration: blockData.duration,
      // Repeat data
      repeatEnabled: blockData.repeatEnabled || false,
      repeatType: blockData.repeatType,
      repeatCount: blockData.repeatCount,
      customDays: blockData.customDays,
      // Tasks
      tasks: blockData.tasks || [],
    });

    // TODO: Handle repeat logic - create additional slots for repeated days
  }, [dateString, slotsByDate, addSlotWithContent]);

  // Update a block (updates both Slot and Content)
  // Supports both contentId and topicId patterns for cross-view compatibility
  const handleUpdateBlock = useCallback((_date, updatedBlock) => {
    if (updatedBlock.blockType === 'private') {
      updatePrivateBlock(dateString, updatedBlock.id, updatedBlock);
    } else {
      const daySlots = slotsByDate[dateString] || [];

      // Find the slot by contentId, topicId, or id (supports both patterns)
      const updatedSlots = daySlots.map(slot => {
        const isMatch =
          slot.contentId === updatedBlock.id ||
          slot.contentId === updatedBlock.contentId ||
          slot.topicId === updatedBlock.id ||
          slot.topicId === updatedBlock.topicId ||
          slot.id === updatedBlock.id;

        if (isMatch) {
          // Update Content separately if using contentId pattern
          if (slot.contentId) {
            saveContent({
              id: slot.contentId,
              title: updatedBlock.title,
              description: updatedBlock.description,
              rechtsgebiet: updatedBlock.rechtsgebiet,
              unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
              blockType: updatedBlock.blockType,
            });
          }

          // Update Slot data (supports both patterns)
          return {
            ...slot,
            // Update title in both patterns
            title: updatedBlock.title,
            topicTitle: updatedBlock.title,
            blockType: updatedBlock.blockType,
            description: updatedBlock.description,
            rechtsgebiet: updatedBlock.rechtsgebiet,
            unterrechtsgebiet: updatedBlock.unterrechtsgebiet,
            // Time data
            hasTime: updatedBlock.hasTime || false,
            startTime: updatedBlock.startTime,
            endTime: updatedBlock.endTime,
            startHour: updatedBlock.startHour,
            duration: updatedBlock.duration,
            // Repeat data
            repeatEnabled: updatedBlock.repeatEnabled || false,
            repeatType: updatedBlock.repeatType,
            repeatCount: updatedBlock.repeatCount,
            customDays: updatedBlock.customDays,
            // Tasks
            tasks: updatedBlock.tasks || [],
            updatedAt: new Date().toISOString(),
          };
        }
        return slot;
      });
      updateDaySlots(dateString, updatedSlots);
    }
  }, [dateString, slotsByDate, updateDaySlots, updatePrivateBlock, saveContent]);

  // Delete a block (removes Slot, Content remains for potential reuse)
  // Supports both contentId and topicId patterns for cross-view compatibility
  const handleDeleteBlock = useCallback((_date, blockId) => {
    const dayPrivateBlocks = privateBlocksByDate[dateString] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateBlock(dateString, blockId);
    } else {
      const daySlots = slotsByDate[dateString] || [];
      // Filter out the slot with matching contentId, topicId, or id (supports both patterns)
      const updatedSlots = daySlots.filter(slot => {
        const isMatch =
          slot.contentId === blockId ||
          slot.topicId === blockId ||
          slot.id === blockId;
        return !isMatch;
      });
      updateDaySlots(dateString, updatedSlots);
      // Note: Content is NOT deleted - it can be reused later
    }
  }, [dateString, slotsByDate, privateBlocksByDate, updateDaySlots, deletePrivateBlock]);

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
  const handleDropTaskToBlock = useCallback((block, droppedTask, source) => {
    const daySlots = slotsByDate[dateString] || [];
    let taskWasAdded = false;
    let targetSlotId = null;

    const updatedSlots = daySlots.map(slot => {
      // Match by contentId, topicId, or id (supports both patterns)
      const isMatch =
        slot.contentId === block.id ||
        slot.contentId === block.contentId ||
        slot.topicId === block.id ||
        slot.topicId === block.topicId ||
        slot.id === block.id;

      if (isMatch) {
        // Add the task to this slot's tasks array
        const existingTasks = slot.tasks || [];
        // Check if task already exists (by sourceId or id)
        const alreadyExists = existingTasks.some(t =>
          t.sourceId === droppedTask.id || t.id === droppedTask.id
        );

        if (alreadyExists) {
          return slot; // Don't add duplicate
        }

        taskWasAdded = true;
        targetSlotId = slot.id;

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
          ...slot,
          tasks: [...existingTasks, newTask],
          updatedAt: new Date().toISOString(),
        };
      }
      return slot;
    });

    updateDaySlots(dateString, updatedSlots);

    // Handle source-specific behavior
    if (source === 'todos') {
      // Remove from To-Do list
      removeTask(droppedTask.id);
    } else if (source === 'themenliste' && taskWasAdded) {
      // Mark the aufgabe as scheduled in the themenliste (grays it out)
      scheduleAufgabeToBlock(droppedTask.id, {
        slotId: targetSlotId,
        date: dateString,
        blockTitle: block.title || 'Lernblock',
      });
    }
  }, [dateString, slotsByDate, updateDaySlots, removeTask, scheduleAufgabeToBlock]);

  // Current date as Date object for dialogs
  const currentDateObj = new Date(dateString);

  // BUG-023 FIX: Dashboard shows only Private Blocks, no Lernplan content
  // Topics from Lernplan are not shown on Dashboard (only in Week view in Exam mode)
  const topics = [];
  void todaySlots; // todaySlots is no longer used on Dashboard

  // BUG-022 FIX: Calculate daily learning goal with proper priority:
  // 1. User-defined setting from Settings page (dailyGoalHours)
  // 2. Calculated from planned Lernplan slots for today
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

    // Priority 2: Calculate from planned Lernplan slots for today
    const learningSlots = todaySlots.filter(slot =>
      slot.blockType !== 'private' && slot.isFromLernplan === true
    );

    let totalMinutes = 0;
    learningSlots.forEach(slot => {
      if (slot.duration) {
        // Custom duration in minutes
        totalMinutes += slot.duration;
      } else if (slot.startTime && slot.endTime) {
        // Calculate from start/end time
        const [startH, startM] = slot.startTime.split(':').map(Number);
        const [endH, endM] = slot.endTime.split(':').map(Number);
        totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
      } else {
        // Default: each position-based slot is 2 hours
        totalMinutes += 120;
      }
    });

    // Priority 3: If no settings and no slots planned, return 0
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

  // BUG-023 FIX: Transform private blocks to ZeitplanWidget format
  // Dashboard shows ONLY private blocks (not Lernplan slots)
  const privateBlocksForWidget = useMemo(() => {
    return todayPrivateBlocks.map(block => {
      // Parse startTime and endTime (format: "HH:MM")
      const [startH, startM] = (block.startTime || '08:00').split(':').map(Number);
      const [endH, endM] = (block.endTime || '10:00').split(':').map(Number);
      const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      const durationHours = durationMinutes / 60;

      return {
        id: block.id,
        startHour: startH + (startM / 60), // e.g., 9.5 for 9:30
        duration: durationHours,
        title: block.title || 'Privater Termin',
        description: block.description || '',
        blockType: 'private',
        isBlocked: false,
        startTime: block.startTime,
        endTime: block.endTime,
        // For multi-day detection
        isMultiDay: block.isMultiDay || false,
        startDate: block.startDate,
        endDate: block.endDate,
      };
    });
  }, [todayPrivateBlocks]);

  const zeitplanData = {
    completedBlocks: 0, // Private blocks don't have "completed" status
    totalBlocks: privateBlocksForWidget.length,
    currentHour: new Date().getHours(),
    progress: dayProgress.percentage,
    plannedLabel: privateBlocksForWidget.length > 0
      ? `${privateBlocksForWidget.length} Termin${privateBlocksForWidget.length > 1 ? 'e' : ''}`
      : '',
    blocks: privateBlocksForWidget,
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

      {/* Manage Theme Block Dialog */}
      <ManageThemeBlockDialog
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

      {/* Manage Repetition Block Dialog */}
      <ManageRepetitionBlockDialog
        open={isManageRepetitionOpen}
        onOpenChange={setIsManageRepetitionOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Exam Block Dialog */}
      <ManageExamBlockDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={4}
      />

      {/* Manage Private Block Dialog */}
      <ManagePrivateBlockDialog
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

      {/* Create Theme Block Dialog */}
      <CreateThemeBlockDialog
        open={isCreateThemeOpen}
        onOpenChange={setIsCreateThemeOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
        availableTasks={aufgaben}
        themeLists={themeLists}
      />

      {/* Create Repetition Block Dialog */}
      <CreateRepetitionBlockDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Exam Block Dialog */}
      <CreateExamBlockDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={4}
      />

      {/* Create Private Block Dialog */}
      <CreatePrivateBlockDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={currentDateObj}
        initialTime="09:00"
        onSave={handleAddPrivateBlock}
      />

      {/* Timer Selection Dialog */}
      <TimerSelectionDialog
        open={showTimerSelection}
        onOpenChange={setShowTimerSelection}
        onSelectType={(type) => {
          setShowTimerSelection(false);
          switch (type) {
            case 'pomodoro':
              setShowPomodoroSettings(true);
              break;
            case 'countdown':
              setShowCountdownSettings(true);
              break;
            case 'countup':
              // Start countup timer immediately
              saveTimerConfig({ timerType: TIMER_TYPES.COUNTUP });
              startCountup();
              setShowTimerMain(true);
              break;
          }
        }}
      />

      {/* Pomodoro Settings Dialog */}
      <PomodoroSettingsDialog
        open={showPomodoroSettings}
        onOpenChange={(open) => {
          setShowPomodoroSettings(open);
          if (!open) {
            // When closing settings, return to main dialog
            setShowTimerMain(true);
          }
        }}
        onStart={(settings, sessions) => {
          startPomodoro(settings, sessions);
        }}
        initialSettings={pomodoroSettings}
      />

      {/* Countdown Settings Dialog */}
      <CountdownSettingsDialog
        open={showCountdownSettings}
        onOpenChange={(open) => {
          setShowCountdownSettings(open);
          if (!open) {
            // When closing settings, return to main dialog
            setShowTimerMain(true);
          }
        }}
        onStart={(durationMinutes) => {
          startCountdown(durationMinutes);
        }}
      />

      {/* Timer Main Dialog */}
      <TimerMainDialog
        open={showTimerMain}
        onOpenChange={setShowTimerMain}
        onSettingsClick={handleTimerSettingsClick}
        dailyLearningGoalMinutes={dailyLearningGoalMinutes}
      />
    </div>
  );
};

export default DashboardPage;
