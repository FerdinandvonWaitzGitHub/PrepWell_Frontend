import { useState, useEffect } from 'react';
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
import { PlusIcon, MinusIcon, ChevronDownIcon } from '../../../components/ui/icon';
import { useUnterrechtsgebiete } from '../../../contexts';

// Fixed law areas (Rechtsgebiete)
const RECHTSGEBIETE = [
  { id: 'zivilrecht', name: 'Zivilrecht' },
  { id: 'oeffentliches-recht', name: 'Öffentliches Recht' },
  { id: 'strafrecht', name: 'Strafrecht' }
];

/**
 * Create Exam Block Dialog Component
 * Form for creating a new exam (Klausuren) block
 * Features a toggle to optionally add details (Rechtsgebiet, Unterrechtsgebiet)
 */
const CreateExamBlockDialog = ({ open, onOpenChange, date, onSave, availableSlots = 3 }) => {
  // Use central Unterrechtsgebiete context
  const {
    getUnterrechtsgebieteByRechtsgebiet,
    addUnterrechtsgebiet
  } = useUnterrechtsgebiete();

  // Toggle state for showing details
  const [showDetails, setShowDetails] = useState(false);

  // Form state
  const [blockSize, setBlockSize] = useState(1);
  const [selectedRechtsgebiet, setSelectedRechtsgebiet] = useState(null);
  const [selectedUnterrechtsgebiet, setSelectedUnterrechtsgebiet] = useState(null);

  // Dropdown states
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);
  const [isUnterrechtsgebietOpen, setIsUnterrechtsgebietOpen] = useState(false);

  // New Unterrechtsgebiet input
  const [isCreatingUnterrechtsgebiet, setIsCreatingUnterrechtsgebiet] = useState(false);
  const [newUnterrechtsgebietName, setNewUnterrechtsgebietName] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setShowDetails(false);
      setBlockSize(1);
      setSelectedRechtsgebiet(null);
      setSelectedUnterrechtsgebiet(null);
      setIsCreatingUnterrechtsgebiet(false);
      setNewUnterrechtsgebietName('');
    }
  }, [open]);

  // Format date for display (e.g., "Montag, 1. August 2025")
  const formatDate = (date) => {
    if (!date) return '';
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get current Unterrechtsgebiete for selected Rechtsgebiet
  const getCurrentUnterrechtsgebiete = () => {
    if (!selectedRechtsgebiet) return [];
    return getUnterrechtsgebieteByRechtsgebiet(selectedRechtsgebiet.id);
  };

  // Add new Unterrechtsgebiet
  const handleAddUnterrechtsgebiet = () => {
    if (!newUnterrechtsgebietName.trim() || !selectedRechtsgebiet) return;

    const newItem = {
      id: `urg-${Date.now()}`,
      name: newUnterrechtsgebietName.trim()
    };

    addUnterrechtsgebiet(selectedRechtsgebiet.id, newItem);

    setNewUnterrechtsgebietName('');
    setIsCreatingUnterrechtsgebiet(false);
    setSelectedUnterrechtsgebiet(newItem);
  };

  const handleSave = () => {
    if (date && onSave) {
      const examData = {
        id: `exam-${Date.now()}`,
        title: selectedUnterrechtsgebiet?.name || 'Klausur',
        blockType: 'exam',
        blockSize: showDetails ? blockSize : 1,
        hasDetails: showDetails,
        progress: '0/1'
      };

      // Add detail fields if toggle is on
      if (showDetails) {
        examData.rechtsgebiet = selectedRechtsgebiet;
        examData.unterrechtsgebiet = selectedUnterrechtsgebiet;
      }

      onSave(date, examData);
    }
    onOpenChange(false);
  };

  const handleDiscard = () => {
    onOpenChange(false);
  };

  // Check if form is valid for saving
  const isFormValid = () => {
    // If details toggle is off, always valid (simple exam block)
    if (!showDetails) return true;
    // If details toggle is on, need rechtsgebiet and unterrechtsgebiet
    return selectedRechtsgebiet && selectedUnterrechtsgebiet;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Header */}
        <DialogHeader>
          <DialogTitle>Neuen Klausurenblock hinzufügen</DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6">
          {/* Blockgröße Field - Only shown when details toggle is ON */}
          {showDetails && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Blockgröße <span className="text-xs text-gray-500">({availableSlots} Slot{availableSlots !== 1 ? 's' : ''} verfügbar)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.max(1, blockSize - 1))}
                  disabled={blockSize <= 1}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MinusIcon size={16} className="text-gray-600" />
                </button>
                <span className="flex-1 text-center text-lg font-medium text-gray-900">{blockSize}</span>
                <button
                  type="button"
                  onClick={() => setBlockSize(Math.min(availableSlots, blockSize + 1))}
                  disabled={blockSize >= availableSlots}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          )}

          {/* Details Toggle */}
          <div className="flex items-start gap-3">
            {/* Toggle Switch */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                showDetails ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  showDetails ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            {/* Toggle Label and Description */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Details eintragen</p>
              <p className="text-sm text-gray-500 mt-1">
                Aktiviere den Klausurenblock, um Details einzutragen. Die Klausur wird automatisch in deine Leistungen aufgenommen.
              </p>
            </div>
          </div>

          {/* Detail Fields - Only shown when toggle is ON */}
          {showDetails && (
            <div className="space-y-6 pt-4 border-t border-gray-100">
              {/* Rechtsgebiet Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Rechtsgebiet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRechtsgebietOpen(!isRechtsgebietOpen);
                      setIsUnterrechtsgebietOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
                  >
                    <span className={`text-sm ${selectedRechtsgebiet ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedRechtsgebiet?.name || 'Rechtsgebiet auswählen'}
                    </span>
                    <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isRechtsgebietOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isRechtsgebietOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                      {RECHTSGEBIETE.map(rg => (
                        <button
                          key={rg.id}
                          type="button"
                          onClick={() => {
                            setSelectedRechtsgebiet(rg);
                            setSelectedUnterrechtsgebiet(null);
                            setIsRechtsgebietOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                            selectedRechtsgebiet?.id === rg.id ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {rg.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Unterrechtsgebiet Dropdown */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Unterrechtsgebiet <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedRechtsgebiet) {
                        setIsUnterrechtsgebietOpen(!isUnterrechtsgebietOpen);
                        setIsRechtsgebietOpen(false);
                      }
                    }}
                    disabled={!selectedRechtsgebiet}
                    className={`w-full flex items-center justify-between px-4 py-2 bg-white border border-gray-200 rounded-lg transition-colors text-left ${
                      selectedRechtsgebiet ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span className={`text-sm ${selectedUnterrechtsgebiet ? 'text-gray-900' : 'text-gray-500'}`}>
                      {selectedUnterrechtsgebiet?.name || (selectedRechtsgebiet ? 'Unterrechtsgebiet auswählen' : 'Erst Rechtsgebiet wählen')}
                    </span>
                    <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isUnterrechtsgebietOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isUnterrechtsgebietOpen && selectedRechtsgebiet && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {getCurrentUnterrechtsgebiete().length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          Noch keine Unterrechtsgebiete vorhanden
                        </div>
                      ) : (
                        getCurrentUnterrechtsgebiete().map(urg => (
                          <button
                            key={urg.id}
                            type="button"
                            onClick={() => {
                              setSelectedUnterrechtsgebiet(urg);
                              setIsUnterrechtsgebietOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                              selectedUnterrechtsgebiet?.id === urg.id ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {urg.name}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Add new Unterrechtsgebiet */}
                {selectedRechtsgebiet && (
                  isCreatingUnterrechtsgebiet ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newUnterrechtsgebietName}
                        onChange={(e) => setNewUnterrechtsgebietName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddUnterrechtsgebiet()}
                        placeholder="Name eingeben..."
                        autoFocus
                        className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                      />
                      <Button variant="primary" size="sm" onClick={handleAddUnterrechtsgebiet}>
                        Speichern
                      </Button>
                      <Button variant="default" size="sm" onClick={() => {
                        setIsCreatingUnterrechtsgebiet(false);
                        setNewUnterrechtsgebietName('');
                      }}>
                        Abbrechen
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCreatingUnterrechtsgebiet(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 bg-primary-100 border-2 border-primary-300 rounded-lg hover:bg-primary-200 transition-colors"
                    >
                      <PlusIcon size={16} className="text-gray-900" />
                      <span className="text-sm font-medium text-gray-900">+ Neues Unterrechtsgebiet erstellen</span>
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </DialogBody>

        {/* Footer */}
        <DialogFooter className="justify-between">
          <Button variant="default" onClick={handleDiscard}>
            Verwerfen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid()}
          >
            Fertig
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExamBlockDialog;
