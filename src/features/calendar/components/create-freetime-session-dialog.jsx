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
import { PlusIcon, MinusIcon } from '../../../components/ui/icon';

/**
 * Create Free Time Block Dialog Component
 * Form for creating a new free time block
 */
const CreateFreeTimeBlockDialog = ({ open, onOpenChange, date, onSave }) => {
  const [blockSize, setBlockSize] = useState(2);
  const [title, setTitle] = useState('');

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

  const handleSave = () => {
    if (date && onSave) {
      onSave(date, {
        title: title || 'Frei',
        blockType: 'free',
        blockSize,
        progress: '1/1'
      });
    }
    // Reset form
    setBlockSize(2);
    setTitle('');
    onOpenChange(false);
  };

  const handleDiscard = () => {
    console.log('Discarding changes');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Neuen Freizeitblock hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Blockgröße Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Blockgröße</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <MinusIcon size={16} className="text-neutral-600" />
              </button>
              <span className="flex-1 text-center text-lg font-medium text-neutral-900">{blockSize}</span>
              <button
                onClick={() => setBlockSize(Math.min(10, blockSize + 1))}
                className="p-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <PlusIcon size={16} className="text-neutral-600" />
              </button>
            </div>
          </div>

          {/* Titel Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900">Titel</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel eintragen..."
              className="w-full px-4 py-2 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="justify-between">
          <Button
            variant="default"
            onClick={handleDiscard}
          >
            Verwerfen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
          >
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFreeTimeBlockDialog;
