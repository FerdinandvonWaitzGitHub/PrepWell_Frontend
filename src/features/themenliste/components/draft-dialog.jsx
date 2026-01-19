import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';

/**
 * DraftDialog - Dialog for resuming or discarding a previous draft
 */
const DraftDialog = ({
  open,
  draft,
  onResume,
  onDiscard,
}) => {
  const formattedDate = draft?.lastModified
    ? new Date(draft.lastModified).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <Dialog open={open} onClose={onDiscard}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-lg font-semibold">
          Unvollständiger Entwurf gefunden
        </DialogTitle>
        <DialogDescription className="mt-2 text-neutral-600">
          Du hast einen unvollständigen Entwurf vom {formattedDate}.
          Möchtest du diesen fortsetzen oder neu beginnen?
        </DialogDescription>
        <DialogFooter className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onDiscard} className="rounded-3xl px-5">
            Neu beginnen
          </Button>
          <Button onClick={onResume} className="rounded-3xl px-5">
            Entwurf fortsetzen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DraftDialog;
