import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter
} from '../ui/dialog';
import Button from '../ui/button';
import { useMentor } from '../../contexts/mentor-context';

/**
 * MentorActivationDialog - Confirmation dialog for activating the mentor feature
 *
 * Shows a confirmation prompt before enabling statistics and analytics tracking.
 */
const MentorActivationDialog = ({ open, onOpenChange }) => {
  const { activateMentor } = useMentor();

  const handleActivate = () => {
    activateMentor();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Mentor aktivieren?
          </DialogTitle>
          <DialogDescription>
            Der Mentor analysiert deine Lerngewohnheiten und zeigt dir detaillierte Statistiken zu:
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="py-4">
          <ul className="space-y-2 text-sm text-neutral-600">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Lernzeit-Analyse (täglich, wöchentlich, monatlich)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Fortschritt pro Rechtsgebiet und Unterrechtsgebiet</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Aufgaben-Erledigungsraten und Planerfüllung</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Streaks, Konsistenz und Lernmuster</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Klausur-Notenübersicht und Trends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Timer- und Pomodoro-Statistiken</span>
            </li>
          </ul>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Alle Daten werden lokal in deinem Browser gespeichert und nicht an Server übertragen.
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleActivate}
          >
            Jetzt aktivieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MentorActivationDialog;
