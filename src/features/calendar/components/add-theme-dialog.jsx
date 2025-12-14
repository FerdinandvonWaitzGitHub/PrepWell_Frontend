import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogClose
} from '../../../components/ui/dialog';
import { BookOpenTextIcon, Repeat2Icon, FilePenLineIcon, CalendarIcon } from '../../../components/ui/icon';

/**
 * Add Theme Dialog Component
 * Allows users to add a new learning block to a day
 */
const AddThemeDialog = ({ open, onOpenChange, date, onSelectType }) => {
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

  const blockTypes = [
    {
      type: 'theme',
      icon: BookOpenTextIcon,
      title: 'Lernblock',
      description: 'Erstelle einen neuen Lernblock'
    },
    {
      type: 'repetition',
      icon: Repeat2Icon,
      title: 'Wiederholung',
      description: 'Erstelle einen neuen Block für Wiederholungen'
    },
    {
      type: 'exam',
      icon: FilePenLineIcon,
      title: 'Klausur',
      description: 'Erstelle einen neuen Block für Übungsklausuren'
    },
    {
      type: 'private',
      icon: CalendarIcon,
      title: 'Privater Termin',
      description: 'Erstelle einen neuen Block für geplante Freizeit'
    }
  ];

  const handleSelectType = (type) => {
    console.log('Selected type:', type);
    if (onSelectType) {
      onSelectType(type);
    }
    // For now, just close the dialog
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Neuen Block hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-3">
            {blockTypes.map((blockType) => {
              const Icon = blockType.icon;
              return (
                <button
                  key={blockType.type}
                  onClick={() => handleSelectType(blockType.type)}
                  className="w-full flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    <Icon size={20} className="text-gray-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <h3 className="text-sm font-medium text-gray-900">{blockType.title}</h3>
                    <p className="text-sm text-gray-600">{blockType.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export default AddThemeDialog;
