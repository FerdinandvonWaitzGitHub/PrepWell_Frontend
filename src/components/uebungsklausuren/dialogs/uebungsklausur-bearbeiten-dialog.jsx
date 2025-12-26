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
} from '../../ui/dialog';
import Button from '../../ui/button';
import { ChevronDownIcon } from '../../ui/icon';
import { RECHTSGEBIETE, getGradeLabel } from '../../../contexts/uebungsklausuren-context';

/**
 * UebungsklausurBearbeitenDialog - Dialog for editing a practice exam
 * Only uses Punkte (0-18) grade system
 */
const UebungsklausurBearbeitenDialog = ({ open, onOpenChange, klausur, onSave, onDelete }) => {
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    date: '',
    punkte: '',
  });

  // Dropdown state
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);

  // Load klausur data when dialog opens
  useEffect(() => {
    if (open && klausur) {
      setFormData({
        subject: klausur.subject || '',
        title: klausur.title || '',
        description: klausur.description || '',
        date: klausur.date || '',
        punkte: klausur.punkte?.toString() || '',
      });
      setIsSubjectOpen(false);
    }
  }, [open, klausur]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.subject || !formData.title) return;

    const updatedKlausur = {
      ...klausur,
      ...formData,
      punkte: formData.punkte !== '' ? parseInt(formData.punkte, 10) : null,
    };

    onSave(updatedKlausur);
    onOpenChange(false);
  };

  const isFormValid = formData.subject && formData.title;

  // Format date for header display
  const formatDateDisplay = () => {
    if (!klausur?.date) return '';
    const date = new Date(klausur.date);
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Übungsklausur bearbeiten</DialogTitle>
          <DialogDescription>
            {formatDateDisplay() || 'Bearbeite die Details dieser Übungsklausur.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Subject Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">
              Rechtsgebiet <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSubjectOpen(!isSubjectOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.subject ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formData.subject || 'Rechtsgebiet auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubjectOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {RECHTSGEBIETE.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => {
                        handleInputChange('subject', subject);
                        setIsSubjectOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        formData.subject === subject ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title Input (Thema) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">
              Thema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="z.B. BGB AT Grundlagen"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Beschreibung</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Zusätzliche Infos, Schwerpunkte, etc."
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Datum</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Punkte Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Punkte</label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="18"
                step="1"
                value={formData.punkte}
                onChange={(e) => handleInputChange('punkte', e.target.value)}
                placeholder="0-18 Punkte"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                Pkt.
              </span>
            </div>
            {formData.punkte && (
              <p className="text-xs text-gray-500">
                {getGradeLabel(parseInt(formData.punkte, 10))}
              </p>
            )}
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button
            variant="default"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Klausur löschen
          </Button>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isFormValid}
            >
              Speichern
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UebungsklausurBearbeitenDialog;
