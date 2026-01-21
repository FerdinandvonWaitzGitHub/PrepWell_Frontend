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
import { ChevronDownIcon, CalendarIcon, CheckIcon } from '../../ui/icon';
import { useSemesterLeistungen } from '../../../contexts/semester-leistungen-context';
import { useLabels } from '../../../hooks/use-labels';

/**
 * NeueLeistungDialog - Dialog for creating a new semester performance
 *
 * Figma: Node-ID 2122:1899
 * Layout: Two columns (left: Rechtsgebiet/Titel/Beschreibung/Status, right: Datum/Kalender/ECTS/Note)
 */
const NeueLeistungDialog = ({ open, onOpenChange, onSave }) => {
  const { alleRechtsgebiete } = useSemesterLeistungen();
  const { subject } = useLabels(); // T29: Dynamic labels

  // Form state (simplified per Figma - no semester, no notenSystem toggle)
  const [formData, setFormData] = useState({
    rechtsgebiet: '',
    titel: '',
    beschreibung: '',
    datum: '',
    uhrzeit: '',
    ects: '',
    note: '',
    status: 'ausstehend', // 'angemeldet' when toggle is on
    inKalender: false,
    // T29: Reminder fields
    erinnerungEnabled: false,
    erinnerungDatum: '',
  });

  // Dropdown state
  const [isRechtsgebietOpen, setIsRechtsgebietOpen] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        rechtsgebiet: '',
        titel: '',
        beschreibung: '',
        datum: '',
        uhrzeit: '',
        ects: '',
        note: '',
        status: 'ausstehend',
        inKalender: false,
        // T29: Reset reminder fields
        erinnerungEnabled: false,
        erinnerungDatum: '',
      });
      setIsRechtsgebietOpen(false);
    }
  }, [open]);

  // T29: Calculate default reminder date (3 weeks before exam)
  useEffect(() => {
    if (formData.datum && formData.erinnerungEnabled && !formData.erinnerungDatum) {
      const examDate = new Date(formData.datum);
      const reminderDate = new Date(examDate);
      reminderDate.setDate(reminderDate.getDate() - 21); // 3 weeks before
      const formattedDate = reminderDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, erinnerungDatum: formattedDate }));
    }
  }, [formData.datum, formData.erinnerungEnabled, formData.erinnerungDatum]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.rechtsgebiet || !formData.titel) return;

    const leistungData = {
      ...formData,
      ects: formData.ects !== '' ? parseInt(formData.ects, 10) : null,
      note: formData.note !== '' ? parseInt(formData.note, 10) : null,
      notenSystem: 'punkte', // Default to Punkte system
    };

    onSave(leistungData);
    onOpenChange(false);
  };

  const isFormValid = formData.rechtsgebiet && formData.titel;

  // Format date and time for display
  const getDateTimeDisplay = () => {
    if (!formData.datum) return '';
    const date = new Date(formData.datum);
    const formatted = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    if (formData.uhrzeit) {
      return `${formatted}, ${formData.uhrzeit}`;
    }
    return formatted;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-2xl">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Neue Leistung eintragen</DialogTitle>
          <DialogDescription>
            This is a dialog description.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Two-Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Rechtsgebiet/Fach Dropdown - T29: Dynamic label */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">{subject}</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRechtsgebietOpen(!isRechtsgebietOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                  >
                    <span className={`text-sm ${formData.rechtsgebiet ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {formData.rechtsgebiet || `${subject} auswählen`}
                    </span>
                    <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isRechtsgebietOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isRechtsgebietOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {alleRechtsgebiete.map(subject => (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => {
                            handleInputChange('rechtsgebiet', subject.name);
                            setIsRechtsgebietOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                            formData.rechtsgebiet === subject.name ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                          }`}
                        >
                          {subject.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Titel Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Titel</label>
                <input
                  type="text"
                  value={formData.titel}
                  onChange={(e) => handleInputChange('titel', e.target.value)}
                  placeholder="Titel eintragen"
                  className="w-full px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-sm placeholder:text-neutral-400"
                />
              </div>

              {/* Beschreibung Input */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Beschreibung</label>
                <input
                  type="text"
                  value={formData.beschreibung}
                  onChange={(e) => handleInputChange('beschreibung', e.target.value)}
                  placeholder="Referenz, Raum, etc. hinzufügen"
                  className="w-full px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-sm placeholder:text-neutral-400"
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('status', formData.status === 'angemeldet' ? 'ausstehend' : 'angemeldet')}
                  className={`relative flex-shrink-0 w-12 h-7 rounded-full transition-colors duration-200 ${
                    formData.status === 'angemeldet' ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      formData.status === 'angemeldet' ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-sm text-neutral-700">Status Anmeldung zur Klausur</span>
              </div>

              {/* T29: Reminder Section - Only shown when status is 'ausstehend' */}
              {formData.status === 'ausstehend' && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                  {/* Reminder Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        formData.erinnerungEnabled
                          ? 'bg-amber-600 border-amber-600'
                          : 'bg-white border-neutral-300'
                      }`}
                      onClick={() => handleInputChange('erinnerungEnabled', !formData.erinnerungEnabled)}
                    >
                      {formData.erinnerungEnabled && <CheckIcon size={14} className="text-white" />}
                    </div>
                    <span className="text-sm text-neutral-700">Erinnerung zur Anmeldung setzen</span>
                  </label>

                  {/* Reminder Date - Only shown when checkbox is checked */}
                  {formData.erinnerungEnabled && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-neutral-600">Erinnerung am</label>
                      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-amber-300 rounded-lg">
                        <CalendarIcon size={14} className="text-amber-500 flex-shrink-0" />
                        <input
                          type="date"
                          value={formData.erinnerungDatum}
                          onChange={(e) => handleInputChange('erinnerungDatum', e.target.value)}
                          className="flex-1 bg-transparent text-sm focus:outline-none"
                        />
                      </div>
                      <p className="text-xs text-neutral-500">
                        Standard: 3 Wochen vor dem Klausurtermin
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Datum Field (Combined) */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Datum</label>
                <div className="relative">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg">
                    <CalendarIcon size={16} className="text-neutral-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={getDateTimeDisplay()}
                      onClick={(e) => {
                        // Focus on hidden date input
                        e.target.nextElementSibling?.showPicker?.();
                      }}
                      readOnly
                      placeholder="Datum & Uhrzeit auswählen"
                      className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-neutral-400 cursor-pointer"
                    />
                    <input
                      type="date"
                      value={formData.datum}
                      onChange={(e) => handleInputChange('datum', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                {/* Optional: Time input shown when date is selected */}
                {formData.datum && (
                  <input
                    type="text"
                    value={formData.uhrzeit}
                    onChange={(e) => handleInputChange('uhrzeit', e.target.value)}
                    placeholder="z.B. 13:00 - 15:00"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm placeholder:text-neutral-400"
                  />
                )}
              </div>

              {/* Calendar Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    formData.inKalender
                      ? 'bg-neutral-900 border-neutral-900'
                      : 'bg-white border-neutral-300'
                  }`}
                  onClick={() => handleInputChange('inKalender', !formData.inKalender)}
                >
                  {formData.inKalender && <CheckIcon size={14} className="text-white" />}
                </div>
                <span className="text-sm text-neutral-700">Klausur im Kalender eintragen</span>
              </label>

              {/* ECTS / Gewichtung */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">ECTS / Gewichtung</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.ects}
                  onChange={(e) => handleInputChange('ects', e.target.value)}
                  placeholder="ECTS-Punkte eintragen"
                  className="w-full px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-sm placeholder:text-neutral-400"
                />
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-900">Note</label>
                <input
                  type="number"
                  min="0"
                  max="18"
                  step="1"
                  value={formData.note}
                  onChange={(e) => handleInputChange('note', e.target.value)}
                  placeholder="Note eintragen"
                  className="w-full px-3 py-2.5 bg-neutral-100 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white text-sm placeholder:text-neutral-400"
                />
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isFormValid}
            className="flex items-center gap-1"
          >
            Speichern
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NeueLeistungDialog;
