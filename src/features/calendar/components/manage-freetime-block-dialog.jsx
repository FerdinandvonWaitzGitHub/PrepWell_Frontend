import React, { useState, useEffect } from 'react';
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
import { PlusIcon, MinusIcon, TrashIcon, CheckIcon } from '../../../components/ui/icon';

/**
 * Manage Freetime Block Dialog Component
 * Dialog for viewing and editing an existing freetime block
 */
const ManageFreetimeBlockDialog = ({
  open,
  onOpenChange,
  date,
  block,
  onSave,
  onDelete,
  availableSlots = 3
}) => {
  // Form state
  const [blockSize, setBlockSize] = useState(2);
  const [title, setTitle] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load block data when dialog opens
  useEffect(() => {
    if (open && block) {
      setBlockSize(block.blockSize || 2);
      setTitle(block.title || '');
      setShowDeleteConfirm(false);
    }
  }, [open, block]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Save and close handler
  const handleSaveAndClose = () => {
    if (!date || !onSave) return;
    onSave(date, {
      ...block,
      title: title || 'Freizeit',
      blockType: 'free',
      blockSize
    });
    onOpenChange(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (onDelete && block) {
      onDelete(date, block.id);
      onOpenChange(false);
    }
  };

  // Discard handler
  const handleDiscard = () => {
    onOpenChange(false);
  };

  // Calculate total available slots (current block size + free slots)
  const totalAvailableSlots = (block?.blockSize || 0) + availableSlots;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle className="text-lg font-light">Freizeitblock verwalten</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-4">
            {/* Blockgröße */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Blockgröße</label>
              <div className="inline-flex">
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                  disabled={blockSize <= 1}
                  className="w-9 h-9 bg-white rounded-l-lg shadow-sm border border-gray-200 flex items-center justify-center disabled:opacity-50"
                >
                  <MinusIcon size={16} className="text-gray-900" />
                </button>
                <div className="h-9 px-4 py-2 bg-white shadow-sm border-t border-b border-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-900">{blockSize}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.min(totalAvailableSlots, blockSize + 1))}
                  disabled={blockSize >= totalAvailableSlots}
                  className="w-9 h-9 bg-white rounded-r-lg shadow-sm border border-gray-200 flex items-center justify-center disabled:opacity-50"
                >
                  <PlusIcon size={16} className="text-gray-900" />
                </button>
              </div>
            </div>

            {/* Titel */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Titel</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titel eintragen..."
                className="w-full h-9 px-3 py-1 bg-white rounded-lg shadow-sm border border-gray-200 text-sm"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={handleDiscard} className="rounded-3xl">
              Änderungen verwerfen
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">Wirklich löschen?</span>
                <Button
                  variant="default"
                  onClick={handleDelete}
                  className="rounded-3xl text-red-600 hover:bg-red-50"
                >
                  Ja, löschen
                </Button>
                <Button
                  variant="default"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-3xl"
                >
                  Abbrechen
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-3xl gap-2"
              >
                Freizeitblock löschen
                <TrashIcon size={16} />
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleSaveAndClose}
            className="rounded-3xl gap-2"
          >
            Fertig
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageFreetimeBlockDialog;
