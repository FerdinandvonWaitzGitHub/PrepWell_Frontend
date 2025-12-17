import React, { useState, useCallback } from 'react';
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
    // Themenliste
    themeLists,
    toggleThemeListTopicComplete,
  } = useCalendar();

  // Selected theme list state
  const [selectedThemeListId, setSelectedThemeListId] = useState(null);

  // Handle theme list topic complete toggle
  const handleToggleThemeListTopicComplete = useCallback((topicId) => {
    if (selectedThemeListId) {
      toggleThemeListTopicComplete(selectedThemeListId, topicId);
    }
  }, [selectedThemeListId, toggleThemeListTopicComplete]);

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

  // Add a new learning block
  const handleAddBlock = useCallback((_date, blockData) => {
    const daySlots = slotsByDate[dateString] || [];

    // Find next available position (1, 2, or 3)
    const usedPositions = daySlots.filter(s => s.status === 'topic').map(s => s.position);
    let position = 1;
    while (usedPositions.includes(position) && position <= 3) {
      position++;
    }

    if (position > 3) {
      console.warn('Alle Slots für diesen Tag sind belegt');
      return;
    }

    // Create new slot
    const newSlot = {
      id: `slot-${dateString}-${position}`,
      date: dateString,
      position,
      status: 'topic',
      topicId: blockData.id || `topic-${Date.now()}`,
      topicTitle: blockData.title,
      blockType: blockData.blockType || 'lernblock',
      description: blockData.description || '',
      rechtsgebiet: blockData.rechtsgebiet,
      unterrechtsgebiet: blockData.unterrechtsgebiet,
      createdAt: new Date().toISOString(),
    };

    // Update slots
    const existingSlotIndex = daySlots.findIndex(s => s.position === position);
    let updatedSlots;
    if (existingSlotIndex >= 0) {
      updatedSlots = [...daySlots];
      updatedSlots[existingSlotIndex] = newSlot;
    } else {
      updatedSlots = [...daySlots, newSlot];
    }

    updateDaySlots(dateString, updatedSlots);
  }, [dateString, slotsByDate, updateDaySlots]);

  // Update a block
  const handleUpdateBlock = useCallback((_date, updatedBlock) => {
    if (updatedBlock.blockType === 'private') {
      updatePrivateBlock(dateString, updatedBlock.id, updatedBlock);
    } else {
      const daySlots = slotsByDate[dateString] || [];
      const updatedSlots = daySlots.map(slot => {
        if (slot.topicId === updatedBlock.id) {
          return {
            ...slot,
            topicTitle: updatedBlock.title,
            blockType: updatedBlock.blockType,
            description: updatedBlock.description,
            updatedAt: new Date().toISOString(),
          };
        }
        return slot;
      });
      updateDaySlots(dateString, updatedSlots);
    }
  }, [dateString, slotsByDate, updateDaySlots, updatePrivateBlock]);

  // Delete a block
  const handleDeleteBlock = useCallback((_date, blockId) => {
    const dayPrivateBlocks = privateBlocksByDate[dateString] || [];
    const isPrivate = dayPrivateBlocks.some(b => b.id === blockId);

    if (isPrivate) {
      deletePrivateBlock(dateString, blockId);
    } else {
      const daySlots = slotsByDate[dateString] || [];
      const updatedSlots = daySlots.map(slot => {
        if (slot.topicId === blockId) {
          return {
            ...slot,
            status: 'empty',
            topicId: null,
            topicTitle: null,
            blockType: null,
            description: null,
          };
        }
        return slot;
      });
      updateDaySlots(dateString, updatedSlots);
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

  // Current date as Date object for dialogs
  const currentDateObj = new Date(dateString);

  // Transform todaySlots to topics for LernblockWidget
  const topics = todaySlots.map(slot => ({
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
                onToggleThemeListTopicComplete={handleToggleThemeListTopicComplete}
              />
            }
            rightColumn={
              <ZeitplanWidget
                data={zeitplanData}
                onPreviousDay={previousDay}
                onNextDay={nextDay}
                onBlockClick={handleBlockClick}
                onTimelineClick={handleTimelineClick}
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
