import React, { useState, useCallback, useMemo } from 'react';
import { Header, DashboardLayout } from '../components/layout';
import { LernblockWidget, ZeitplanWidget, TimerButton } from '../components/dashboard';
import { useDashboard } from '../hooks';
import { useCalendar } from '../contexts/calendar-context';

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
  const {
    displayDate,
    dateString,
    currentLernblock,
    todaySlots,
    aufgaben,
    dayProgress,
    loading,
    checkInDone,
    hasRealLernplanSlots, // true if wizard-created slots exist
    refresh,
    previousDay,
    nextDay,
    doCheckIn,
    toggleTask,
    toggleTaskPriority,
    addTask,
    editTask,
    removeTask,
  } = useDashboard();

  // CalendarContext for CRUD operations
  const {
    slotsByDate,
    privateBlocksByDate,
    updateDaySlots,
    addPrivateBlock,
    updatePrivateBlock,
    deletePrivateBlock,
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

  // Helper: Get position-based time
  const getTimeForPosition = (position) => {
    const timeSlots = {
      1: { startTime: '08:00', endTime: '10:00' },
      2: { startTime: '10:00', endTime: '12:00' },
      3: { startTime: '14:00', endTime: '16:00' },
    };
    return timeSlots[position] || { startTime: '08:00', endTime: '10:00' };
  };

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

    // Find next available position (1, 2, or 3)
    const usedPositions = daySlots.filter(s => s.contentId).map(s => s.position);
    let position = 1;
    while (usedPositions.includes(position) && position <= 3) {
      position++;
    }

    if (position > 3) {
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

  // Transform todaySlots to topics for LernblockWidget
  // Only include "real" Lernplan slots (isFromLernplan: true) for left side override
  const topics = todaySlots
    .filter(slot => slot.isFromLernplan === true)
    .map(slot => ({
      id: slot.id,
      title: slot.title,
      description: slot.description,
      rechtsgebiet: slot.rechtsgebiet || slot.blockType,
      unterrechtsgebiet: slot.unterrechtsgebiet,
      blockType: slot.blockType,
    }));

  const zeitplanData = {
    completedBlocks: todaySlots.filter(s => s.isBlocked).length,
    totalBlocks: todaySlots.length,
    currentHour: new Date().getHours(),
    progress: dayProgress.percentage,
    plannedLabel: `${todaySlots.length * 2}h geplant`,
    blocks: todaySlots,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header userInitials="CN" currentPage="startseite" />

      {/* Hero / Status Bar */}
      <section className="px-8 py-4 border-b border-gray-200 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-900">{displayDate}</p>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 flex-1 justify-center md:justify-start lg:justify-center">
            <button
              onClick={doCheckIn}
              disabled={checkInDone}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm transition-colors ${
                checkInDone
                  ? 'border-green-200 bg-green-50 text-green-700 cursor-default'
                  : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
              }`}
            >
              {checkInDone ? (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Check-in erledigt
                </>
              ) : (
                <>
                  Check-in am Morgen
                  <span aria-hidden className="text-gray-500">→</span>
                </>
              )}
            </button>

            <div className="flex flex-col gap-1 min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>
                  {dayProgress.tasksCompleted} von {dayProgress.tasksTotal} Aufgaben erledigt
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all"
                  style={{ width: `${dayProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loading && (
              <span className="text-xs text-gray-500">Lädt...</span>
            )}
            <TimerButton />
          </div>
        </div>
      </section>

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
          <footer className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
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
        availableSlots={3}
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
        availableSlots={3}
      />

      {/* Manage Exam Block Dialog */}
      <ManageExamBlockDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={3}
      />

      {/* Manage Private Block Dialog */}
      <ManagePrivateBlockDialog
        open={isManagePrivateOpen}
        onOpenChange={setIsManagePrivateOpen}
        date={currentDateObj}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
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
        availableSlots={3}
        availableTasks={aufgaben}
        themeLists={themeLists}
      />

      {/* Create Repetition Block Dialog */}
      <CreateRepetitionBlockDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={3}
      />

      {/* Create Exam Block Dialog */}
      <CreateExamBlockDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={currentDateObj}
        onSave={handleAddBlock}
        availableSlots={3}
      />

      {/* Create Private Block Dialog */}
      <CreatePrivateBlockDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={currentDateObj}
        initialTime="09:00"
        onSave={handleAddPrivateBlock}
      />
    </div>
  );
};

export default DashboardPage;
