import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';
import Badge from '../../../components/ui/badge';
import {
  CheckIcon,
  ShuffleIcon,
  ArchiveIcon,
  TrashIcon,
  ReplaceAllIcon,
  CalendarRangeIcon,
  ArrowRightLeftIcon,
  MoveRightIcon,
  MoveLeftIcon
} from '../../../components/ui/icon';
import ManageThemeSessionDialog from './manage-theme-session-dialog';
import ManageRepetitionSessionDialog from './manage-repetition-session-dialog';
import ManageFreetimeSessionDialog from './manage-freetime-session-dialog';
import ManageExamSessionDialog from './manage-exam-session-dialog';

/**
 * Day Management Dialog Component
 * Displays and manages a single day's learning blocks and settings
 */
const DayManagementDialog = ({
  open,
  onOpenChange,
  date,
  dayType = 'Lerntag',
  learningBlocks = [],
  onUpdateBlock,
  onDeleteBlock,
  availableSlots = 4
}) => {
  // State for selected block
  const [selectedBlock, setSelectedBlock] = useState(null);

  // State for each block type dialog
  const [isManageThemeBlockOpen, setIsManageThemeBlockOpen] = useState(false);
  const [isManageRepetitionBlockOpen, setIsManageRepetitionBlockOpen] = useState(false);
  const [isManageFreetimeBlockOpen, setIsManageFreetimeBlockOpen] = useState(false);
  const [isManageExamBlockOpen, setIsManageExamBlockOpen] = useState(false);

  // Handle block click - open appropriate manage dialog based on block type
  const handleBlockClick = (block) => {
    setSelectedBlock(block);

    switch (block.blockType) {
      case 'lernblock':
        setIsManageThemeBlockOpen(true);
        break;
      case 'repetition':
        setIsManageRepetitionBlockOpen(true);
        break;
      case 'free':
        setIsManageFreetimeBlockOpen(true);
        break;
      case 'exam':
        setIsManageExamBlockOpen(true);
        break;
      default:
        break;
    }
  };

  // Handle save from ManageThemeSessionDialog
  const handleBlockSave = (date, updatedBlock) => {
    if (onUpdateBlock) {
      onUpdateBlock(date, updatedBlock);
    }
  };

  // Handle delete from any Manage Block Dialog
  const handleBlockDelete = (date, blockId) => {
    if (onDeleteBlock) {
      onDeleteBlock(date, blockId);
    }
    // Close all dialogs
    setIsManageThemeBlockOpen(false);
    setIsManageRepetitionBlockOpen(false);
    setIsManageFreetimeBlockOpen(false);
    setIsManageExamBlockOpen(false);
  };
  // Format date for display (e.g., "Montag, 1. August 2025")
  const formatDate = (date) => {
    if (!date) return '';

    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${weekday}, ${day}. ${month} ${year}`;
  };

  const handleChangeDayType = () => {
    console.log('Tagestyp ändern');
  };

  const handleArchiveBlock = (blockId) => {
    console.log('Archiviere Block:', blockId);
  };

  const handleSwapWithAny = () => {
    console.log('Mit einem anderen Tag tauschen');
  };

  const handleSwapWithNext = () => {
    console.log('Mit dem nächsten Tag tauschen');
  };

  const handlePushForward = () => {
    console.log('Alle flexiblen Lerntage aufschieben');
  };

  const handlePullBack = () => {
    console.log('Alle flexiblen Lerntage vorziehen');
  };

  const handleDeleteDay = () => {
    console.log('Tag löschen');
  };

  const handleSave = () => {
    console.log('Änderungen speichern');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Tag verwalten</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Day Type Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center gap-20">
                <span className="text-sm font-medium text-neutral-900">Tagestyp</span>
                <span className="text-lg font-light text-neutral-900">{dayType}</span>
              </div>
              <Button
                variant="default"
                size="default"
                onClick={handleChangeDayType}
                className="gap-2"
              >
                <ShuffleIcon size={16} />
                Tagestyp verändern
              </Button>
            </div>
          </div>

          {/* Learning Blocks Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-neutral-900">Tagesblöcke</h3>

            <div className="space-y-3">
              {learningBlocks.map((block) => (
                <div key={block.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                  {/* Block Content - Clickable for all block types */}
                  <button
                    type="button"
                    onClick={() => handleBlockClick(block)}
                    className="w-full text-left bg-primary-50 p-4 transition-colors hover:bg-primary-100 cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Tags */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="primary" className="font-semibold">
                          <CheckIcon size={12} />
                          {block.blockType}
                        </Badge>
                        {block.subject && (
                          <Badge variant="default" className="font-semibold">
                            {block.subject}
                          </Badge>
                        )}
                        <Badge variant="default" className="font-semibold">
                          {block.progress}
                        </Badge>
                      </div>

                      {/* Title */}
                      {block.title && (
                        <div className="bg-neutral-50 px-3 py-1.5 rounded">
                          <span className="text-sm font-light text-neutral-900">{block.title}</span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Archive Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleArchiveBlock(block.id);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 border-t border-neutral-200 transition-colors"
                  >
                    <ArchiveIcon size={14} />
                    <span className="text-xs font-medium text-neutral-900">Für später archivieren</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Learning Plan Manager Section */}
          <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
            <div className="flex items-start gap-3">
              <ReplaceAllIcon size={20} className="text-neutral-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-neutral-900">Lernplan-Manager</h3>
                <p className="text-sm text-neutral-600">Erstelle einen neuen Block für ein Tagesthema</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="default"
                size="default"
                onClick={handleSwapWithAny}
                className="w-full justify-start gap-2"
              >
                <CalendarRangeIcon size={16} />
                Diesen Lerntag mit einem anderen tauschen
              </Button>

              <Button
                variant="default"
                size="default"
                onClick={handleSwapWithNext}
                className="w-full justify-start gap-2"
              >
                <ArrowRightLeftIcon size={16} />
                Diesen Tag mit dem nächsten tauschen
              </Button>

              <Button
                variant="default"
                size="default"
                onClick={handlePushForward}
                className="w-full justify-start gap-2"
              >
                <MoveRightIcon size={16} />
                Alle flexiblen Lerntage ab hier einen Tag aufschieben
              </Button>

              <Button
                variant="default"
                size="default"
                onClick={handlePullBack}
                className="w-full justify-start gap-2"
              >
                <MoveLeftIcon size={16} />
                Alle flexiblen Lerntage hierhin vorziehen
              </Button>
            </div>
          </div>
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="default"
              onClick={handleDeleteDay}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <TrashIcon size={16} />
              Lerntag löschen
            </Button>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            className="gap-2"
          >
            <CheckIcon size={16} />
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Manage Theme Session Dialog */}
      <ManageThemeSessionDialog
        open={isManageThemeBlockOpen}
        onOpenChange={setIsManageThemeBlockOpen}
        date={date}
        block={selectedBlock}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        availableSlots={availableSlots}
      />

      {/* Manage Repetition Session Dialog */}
      <ManageRepetitionSessionDialog
        open={isManageRepetitionBlockOpen}
        onOpenChange={setIsManageRepetitionBlockOpen}
        date={date}
        block={selectedBlock}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        availableSlots={availableSlots}
      />

      {/* Manage Freetime Session Dialog */}
      <ManageFreetimeSessionDialog
        open={isManageFreetimeBlockOpen}
        onOpenChange={setIsManageFreetimeBlockOpen}
        date={date}
        block={selectedBlock}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        availableSlots={availableSlots}
      />

      {/* Manage Exam Session Dialog */}
      <ManageExamSessionDialog
        open={isManageExamBlockOpen}
        onOpenChange={setIsManageExamBlockOpen}
        date={date}
        block={selectedBlock}
        onSave={handleBlockSave}
        onDelete={handleBlockDelete}
        availableSlots={availableSlots}
      />
    </Dialog>
  );
};

export default DayManagementDialog;
