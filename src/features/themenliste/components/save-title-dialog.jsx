import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';

/**
 * PW-212: Save Title Dialog
 *
 * Shows when user clicks "Fertig" to let them review/edit the plan title.
 * Auto-generates a title from:
 * - OCR fach name (if available)
 * - Semester + Year + selectedAreas (if manual)
 * - selectedAreas as fallback
 */
const SaveTitleDialog = ({
  open,
  onClose,
  onSave,
  suggestedTitle = '',
}) => {
  const [title, setTitle] = useState(suggestedTitle);
  const inputRef = useRef(null);

  // Update title when suggestedTitle changes (dialog opens with new value)
  useEffect(() => {
    if (open) {
      setTitle(suggestedTitle);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, suggestedTitle]);

  const handleSave = () => {
    onSave(title.trim() || suggestedTitle);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Lernplan speichern</DialogTitle>
        <DialogDescription>
          Gib deinem Lernplan einen Titel. Du kannst ihn später jederzeit ändern.
        </DialogDescription>

        <div className="mt-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Titel eingeben..."
            className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none"
          />
        </div>

        <DialogFooter className="mt-6">
          <Button variant="secondary" onClick={onClose} className="rounded-3xl">
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            className="rounded-3xl"
          >
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveTitleDialog;
