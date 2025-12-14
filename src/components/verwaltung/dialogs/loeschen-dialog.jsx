import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../ui/dialog';
import Button from '../../ui/button';

/**
 * LoeschenDialog - Confirmation dialog for deleting an exam
 */
const LoeschenDialog = ({ open, onOpenChange, exam, onConfirm }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md">
        <DialogHeader>
          <DialogTitle>Klausur endgültig löschen?</DialogTitle>
          <DialogDescription>
            Die Klausur "{exam?.title}" wird endgültig gelöscht und kann nicht mehr wiederhergestellt werden.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="default"
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700 border-red-600"
          >
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LoeschenDialog;
