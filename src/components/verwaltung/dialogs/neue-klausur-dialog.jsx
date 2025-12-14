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
import { ChevronDownIcon, CalendarIcon } from '../../ui/icon';

// Available subjects
const SUBJECTS = [
  'Zivilrecht',
  'Strafrecht',
  'Öffentliches Recht',
  'Zivilrechtliche Nebengebiete',
  'Rechtsgeschichte',
  'Philosophie'
];

// Status options
const STATUS_OPTIONS = [
  { value: 'angemeldet', label: 'Angemeldet' },
  { value: 'ausstehend', label: 'Ausstehend' },
  { value: 'bestanden', label: 'Bestanden' },
  { value: 'nicht bestanden', label: 'Nicht bestanden' }
];

/**
 * NeueKlausurDialog - Dialog for creating a new exam entry
 */
const NeueKlausurDialog = ({ open, onOpenChange, onSave }) => {
  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    description: '',
    date: '',
    time: '',
    ects: '',
    grade: '',
    status: 'ausstehend',
    addToCalendar: false
  });

  // Dropdown states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        subject: '',
        title: '',
        description: '',
        date: '',
        time: '',
        ects: '',
        grade: '',
        status: 'ausstehend',
        addToCalendar: false
      });
      setIsSubjectOpen(false);
      setIsStatusOpen(false);
    }
  }, [open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.subject || !formData.title) return;

    const examData = {
      ...formData,
      ects: formData.ects ? parseInt(formData.ects, 10) : null,
      grade: formData.grade ? parseInt(formData.grade, 10) : null
    };

    onSave(examData);
    onOpenChange(false);
  };

  const isFormValid = formData.subject && formData.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-xl">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Neue Klausur eintragen</DialogTitle>
          <DialogDescription>
            Trage eine neue Klausur in deine Leistungsübersicht ein.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Subject Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">
              Fach <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSubjectOpen(!isSubjectOpen);
                  setIsStatusOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.subject ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formData.subject || 'Fach auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubjectOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {SUBJECTS.map(subject => (
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

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">
              Titel <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Titel eintragen"
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
              placeholder="Referenz, Raum, etc. hinzufügen"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Status Anmeldung zur Klausur</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsSubjectOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className="text-sm text-gray-900">
                  {STATUS_OPTIONS.find(s => s.value === formData.status)?.label || 'Status wählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('status', option.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        formData.status === option.value ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Datum</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Uhrzeit</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="z.B. 09:00 - 12:00"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
          </div>

          {/* Calendar Toggle */}
          <div className="flex items-center gap-3 py-2">
            <button
              type="button"
              onClick={() => handleInputChange('addToCalendar', !formData.addToCalendar)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
                formData.addToCalendar ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  formData.addToCalendar ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div className="flex items-center gap-2">
              <CalendarIcon size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Klausur im Kalender eintragen</span>
            </div>
          </div>

          {/* ECTS & Grade Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">ECTS / Gewichtung</label>
              <input
                type="number"
                min="1"
                max="30"
                value={formData.ects}
                onChange={(e) => handleInputChange('ects', e.target.value)}
                placeholder="ECTS-Punkte eintragen"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-900">Note</label>
              <input
                type="number"
                min="0"
                max="18"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                placeholder="Note eintragen"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NeueKlausurDialog;
