import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../../components/ui/dialog';
import Button from '../../../components/ui/button';

/**
 * DeleteConfirmDialog - Confirmation dialog for deleting items in Themenliste
 * T23: Extended to support all hierarchy levels
 */
const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  type, // 'rechtsgebiet' | 'unterrechtsgebiet' | 'kapitel' | 'thema' | 'aufgabe'
  hierarchyLabels,
}) => {
  // T23: Get label and description based on type
  const getTypeInfo = () => {
    switch (type) {
      case 'rechtsgebiet':
        return {
          label: hierarchyLabels?.level1 || 'Rechtsgebiet',
          action: 'entfernen',
          title: `${hierarchyLabels?.level1 || 'Rechtsgebiet'} entfernen?`,
          description: `Das ${hierarchyLabels?.level1 || 'Rechtsgebiet'} und alle enthaltenen ${hierarchyLabels?.level2Plural || 'Untergebiete'}, ${hierarchyLabels?.level4Plural || 'Themen'} und ${hierarchyLabels?.level5Plural || 'Aufgaben'} werden aus der Themenliste entfernt.`,
        };
      case 'unterrechtsgebiet':
        return {
          label: hierarchyLabels?.level2 || 'Untergebiet',
          action: 'entfernen',
          title: `${hierarchyLabels?.level2 || 'Untergebiet'} entfernen?`,
          description: `Das ${hierarchyLabels?.level2 || 'Untergebiet'} und alle enthaltenen ${hierarchyLabels?.level4Plural || 'Themen'} und ${hierarchyLabels?.level5Plural || 'Aufgaben'} werden aus der Themenliste entfernt.`,
        };
      case 'kapitel':
        return {
          label: hierarchyLabels?.level3 || 'Kapitel',
          action: 'löschen',
          title: `${hierarchyLabels?.level3 || 'Kapitel'} endgültig löschen?`,
          description: `Das ${hierarchyLabels?.level3 || 'Kapitel'} und alle enthaltenen ${hierarchyLabels?.level4Plural || 'Themen'} und ${hierarchyLabels?.level5Plural || 'Aufgaben'} werden endgültig gelöscht.`,
        };
      case 'thema':
        return {
          label: hierarchyLabels?.level4 || 'Thema',
          action: 'löschen',
          title: `${hierarchyLabels?.level4 || 'Thema'} endgültig löschen?`,
          description: `Das ${hierarchyLabels?.level4 || 'Thema'} und alle ${hierarchyLabels?.level5Plural || 'Aufgaben'} werden endgültig gelöscht.`,
        };
      case 'aufgabe':
      default:
        return {
          label: hierarchyLabels?.level5 || 'Aufgabe',
          action: 'löschen',
          title: `${hierarchyLabels?.level5 || 'Aufgabe'} endgültig löschen?`,
          description: `Die ${hierarchyLabels?.level5 || 'Aufgabe'} wird endgültig gelöscht und kann nicht wiederhergestellt werden.`,
        };
    }
  };

  const { label, action, title, description } = getTypeInfo();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent className="max-w-lg p-6">
        <DialogTitle className="text-lg font-semibold">
          {title}
        </DialogTitle>
        <DialogDescription className="mt-2 text-neutral-600">
          {description}
        </DialogDescription>
        <DialogFooter className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="rounded-3xl px-5">
            Abbrechen
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            className="rounded-3xl gap-2 px-5"
          >
            {label} {action}
            <Trash2 size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
