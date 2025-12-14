import { useState, useEffect } from 'react';
import WeekViewHeader from './week-view-header';
import WeekGrid from './week-grid';
import AddThemeDialog from './add-theme-dialog';
import CreateThemeBlockDialog from './create-theme-block-dialog';
import CreateRepetitionBlockDialog from './create-repetition-block-dialog';
import CreateExamBlockDialog from './create-exam-block-dialog';
import CreatePrivateBlockDialog from './create-private-block-dialog';
import ManageThemeBlockDialog from './manage-theme-block-dialog';
import ManageRepetitionBlockDialog from './manage-repetition-block-dialog';
import ManageExamBlockDialog from './manage-exam-block-dialog';
import ManagePrivateBlockDialog from './manage-private-block-dialog';

/**
 * WeekView component
 * Weekly calendar view for exam mode
 * Displays week schedule with time-based blocks
 */
const WeekView = ({ initialDate = new Date(), className = '' }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);

  // State for blocks (learning blocks with times)
  const [blocks, setBlocks] = useState([]);
  // State for private blocks
  const [privateBlocks, setPrivateBlocks] = useState([]);

  // Dialog states
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

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

  // Initialize with sample data for testing
  useEffect(() => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    // Sample learning blocks with times
    const sampleBlocks = [
      {
        id: 'block-1',
        title: 'Vertragsrecht',
        blockType: 'theme',
        blockSize: 2,
        startDate: formatDate(today),
        startTime: '09:00',
        endTime: '11:00',
        isMultiDay: false
      },
      {
        id: 'block-2',
        title: 'Wiederholung BGB AT',
        blockType: 'repetition',
        blockSize: 1,
        startDate: formatDate(today),
        startTime: '14:00',
        endTime: '15:30',
        isMultiDay: false
      },
      {
        id: 'block-3',
        title: 'Probeklausur 1',
        blockType: 'exam',
        blockSize: 3,
        startDate: formatDate(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)),
        startTime: '08:00',
        endTime: '12:00',
        isMultiDay: false
      }
    ];

    // Sample private blocks
    const samplePrivate = [
      {
        id: 'private-1',
        title: 'Arzttermin',
        blockType: 'private',
        blockSize: 1,
        startDate: formatDate(new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000)),
        startTime: '10:00',
        endTime: '11:00',
        isMultiDay: false,
        description: 'Zahnarzt'
      },
      {
        id: 'private-2',
        title: 'Urlaub',
        blockType: 'private',
        blockSize: 1,
        startDate: formatDate(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)),
        endDate: formatDate(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)),
        startTime: '00:00',
        endTime: '23:59',
        isMultiDay: true,
        description: 'Kurzurlaub'
      }
    ];

    setBlocks(sampleBlocks);
    setPrivateBlocks(samplePrivate);
  }, []);

  // Get week number - returns "Kalenderwoche X" format
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `Kalenderwoche ${weekNo}`;
  };

  // Navigate to previous week
  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Handle block click - open appropriate manage dialog
  const handleBlockClick = (block, date) => {
    setSelectedBlock(block);
    setSelectedDate(date);

    switch (block.blockType) {
      case 'theme':
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
        break;
    }
  };

  // Handle slot click - open add block dialog
  const handleSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setIsAddDialogOpen(true);
  };

  // Handle block type selection from AddThemeDialog
  const handleSelectBlockType = (type) => {
    setIsAddDialogOpen(false);
    switch (type) {
      case 'theme':
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
  };

  // Update a block
  const handleUpdateBlock = (_date, updatedBlock) => {
    if (updatedBlock.blockType === 'private') {
      setPrivateBlocks(prev =>
        prev.map(b => b.id === updatedBlock.id ? updatedBlock : b)
      );
    } else {
      setBlocks(prev =>
        prev.map(b => b.id === updatedBlock.id ? updatedBlock : b)
      );
    }
  };

  // Delete a block
  const handleDeleteBlock = (_date, blockId) => {
    // Check in private blocks first
    const isPrivate = privateBlocks.some(b => b.id === blockId);
    if (isPrivate) {
      setPrivateBlocks(prev => prev.filter(b => b.id !== blockId));
    } else {
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    }
  };

  // Add a new learning block (theme, repetition, exam, free)
  const handleAddBlock = (_date, blockData) => {
    // Add time properties based on selected time slot
    const blockWithTime = {
      ...blockData,
      startDate: selectedDate ? selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: selectedTime || '09:00',
      endTime: calculateEndTime(selectedTime || '09:00', blockData.blockSize || 1),
      isMultiDay: false
    };
    setBlocks(prev => [...prev, blockWithTime]);
  };

  // Calculate end time based on start time and block size (1 slot = 1.5 hours)
  const calculateEndTime = (startTime, blockSize) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (blockSize * 90); // 1.5 hours per slot
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

  // Add a new private block
  const handleAddPrivateBlock = (_date, blockData) => {
    setPrivateBlocks(prev => [...prev, blockData]);
  };

  return (
    <div className={`flex flex-col bg-white h-[calc(100vh-64px)] ${className}`}>
      <WeekViewHeader
        weekTitle={getWeekNumber(currentDate)}
        onPrevWeek={handlePrevWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
      />
      <WeekGrid
        currentDate={currentDate}
        blocks={blocks}
        privateBlocks={privateBlocks}
        onBlockClick={handleBlockClick}
        onSlotClick={handleSlotClick}
      />

      {/* Manage Theme Block Dialog */}
      <ManageThemeBlockDialog
        open={isManageThemeOpen}
        onOpenChange={setIsManageThemeOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={3}
      />

      {/* Manage Repetition Block Dialog */}
      <ManageRepetitionBlockDialog
        open={isManageRepetitionOpen}
        onOpenChange={setIsManageRepetitionOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={3}
      />

      {/* Manage Exam Block Dialog */}
      <ManageExamBlockDialog
        open={isManageExamOpen}
        onOpenChange={setIsManageExamOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
        availableSlots={3}
      />

      {/* Manage Private Block Dialog */}
      <ManagePrivateBlockDialog
        open={isManagePrivateOpen}
        onOpenChange={setIsManagePrivateOpen}
        date={selectedDate}
        block={selectedBlock}
        onSave={handleUpdateBlock}
        onDelete={handleDeleteBlock}
      />

      {/* Add Block Type Selection Dialog */}
      <AddThemeDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        date={selectedDate}
        onSelectType={handleSelectBlockType}
      />

      {/* Create Theme Block Dialog */}
      <CreateThemeBlockDialog
        open={isCreateThemeOpen}
        onOpenChange={setIsCreateThemeOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={3}
      />

      {/* Create Repetition Block Dialog */}
      <CreateRepetitionBlockDialog
        open={isCreateRepetitionOpen}
        onOpenChange={setIsCreateRepetitionOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={3}
      />

      {/* Create Exam Block Dialog */}
      <CreateExamBlockDialog
        open={isCreateExamOpen}
        onOpenChange={setIsCreateExamOpen}
        date={selectedDate}
        onSave={handleAddBlock}
        availableSlots={3}
      />

      {/* Create Private Block Dialog */}
      <CreatePrivateBlockDialog
        open={isCreatePrivateOpen}
        onOpenChange={setIsCreatePrivateOpen}
        date={selectedDate}
        initialTime={selectedTime}
        onSave={handleAddPrivateBlock}
      />
    </div>
  );
};

export default WeekView;
