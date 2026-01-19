import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';

/**
 * CancelConfirmDialog - Confirmation dialog for leaving with unsaved changes
 */
const CancelConfirmDialog = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-md">
        <DialogTitle>Ungespeicherte Änderungen</DialogTitle>
        <DialogDescription>
          Möchtest du die Seite wirklich verlassen? Nicht gespeicherte Änderungen gehen verloren.
        </DialogDescription>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} className="rounded-3xl">
            Bleiben
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="rounded-3xl"
          >
            Verwerfen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelConfirmDialog;
