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
import { ChevronDownIcon, PlusIcon } from '../../ui/icon';
import { useExams, GRADE_SYSTEMS, SEMESTER_OPTIONS } from '../../../contexts/exams-context';

// Status options
const STATUS_OPTIONS = [
  { value: 'angemeldet', label: 'Angemeldet' },
  { value: 'ausstehend', label: 'Ausstehend' },
  { value: 'bestanden', label: 'Bestanden' },
  { value: 'nicht bestanden', label: 'Nicht bestanden' }
];

/**
 * KlausurBearbeitenDialog - Dialog for editing an existing exam entry
 */
const KlausurBearbeitenDialog = ({ open, onOpenChange, exam, onSave, onDelete }) => {
  const { allSubjects, addCustomSubject } = useExams();

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    semester: '',
    description: '',
    date: '',
    time: '',
    ects: '',
    gradeValue: '',
    gradeSystem: GRADE_SYSTEMS.PUNKTE,
    status: 'ausstehend'
  });

  // Dropdown states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Custom subject input
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Load exam data when dialog opens
  useEffect(() => {
    if (open && exam) {
      const gradeValue = exam.gradeValue ?? exam.grade;
      setFormData({
        subject: exam.subject || '',
        title: exam.title || '',
        semester: exam.semester || '',
        description: exam.description || '',
        date: exam.date || '',
        time: exam.time || '',
        ects: exam.ects?.toString() || '',
        gradeValue: gradeValue?.toString() || '',
        gradeSystem: exam.gradeSystem || GRADE_SYSTEMS.PUNKTE,
        status: exam.status || 'ausstehend'
      });
      setIsSubjectOpen(false);
      setIsSemesterOpen(false);
      setIsStatusOpen(false);
      setShowAddSubject(false);
      setNewSubjectName('');
    }
  }, [open, exam]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddNewSubject = () => {
    if (newSubjectName.trim()) {
      addCustomSubject(newSubjectName.trim());
      setFormData(prev => ({ ...prev, subject: newSubjectName.trim() }));
      setNewSubjectName('');
      setShowAddSubject(false);
      setIsSubjectOpen(false);
    }
  };

  const handleSave = () => {
    if (!formData.subject || !formData.title) return;

    const updatedExam = {
      ...exam,
      ...formData,
      ects: formData.ects ? parseInt(formData.ects, 10) : null,
      gradeValue: formData.gradeValue
        ? (formData.gradeSystem === GRADE_SYSTEMS.PUNKTE
            ? parseInt(formData.gradeValue, 10)
            : parseFloat(formData.gradeValue))
        : null
    };

    onSave(updatedExam);
    onOpenChange(false);
  };

  const isFormValid = formData.subject && formData.title;

  // Format date for header display
  const formatDateDisplay = () => {
    if (!exam?.date) return '';
    const date = new Date(exam.date);
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${weekdays[date.getDay()]}, ${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Leistung bearbeiten</DialogTitle>
          <DialogDescription>
            {formatDateDisplay() || 'Bearbeite die Details dieser Leistung.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Subject Dropdown with Add Custom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">
              Fach <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSubjectOpen(!isSubjectOpen);
                  setIsSemesterOpen(false);
                  setIsStatusOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.subject ? 'text-neutral-900' : 'text-neutral-500'}`}>
                  {formData.subject || 'Fach auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubjectOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {allSubjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => {
                        handleInputChange('subject', subject);
                        setIsSubjectOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 ${
                        formData.subject === subject ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                      }`}
                    >
                      {subject}
                    </button>
                  ))}
                  {/* Add new subject option */}
                  {!showAddSubject ? (
                    <button
                      type="button"
                      onClick={() => setShowAddSubject(true)}
                      className="w-full px-4 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 border-t border-neutral-100 flex items-center gap-2"
                    >
                      <PlusIcon size={14} />
                      Neues Fach hinzufügen
                    </button>
                  ) : (
                    <div className="p-2 border-t border-neutral-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Fachname eingeben"
                          className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNewSubject()}
                        />
                        <Button size="sm" variant="primary" onClick={handleAddNewSubject}>
                          Hinzufügen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Semester Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Semester</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSemesterOpen(!isSemesterOpen);
                  setIsSubjectOpen(false);
                  setIsStatusOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.semester ? 'text-neutral-900' : 'text-neutral-500'}`}>
                  {formData.semester || 'Semester auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isSemesterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSemesterOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {SEMESTER_OPTIONS.map(semester => (
                    <button
                      key={semester}
                      type="button"
                      onClick={() => {
                        handleInputChange('semester', semester);
                        setIsSemesterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                        formData.semester === semester ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                      }`}
                    >
                      {semester}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Title Input (Thema) */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">
              Thema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Thema eintragen"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Beschreibung</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Referenz, Raum, etc. hinzufügen"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Datum</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-900">Uhrzeit</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                placeholder="z.B. 09:00 - 12:00"
                className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
              />
            </div>
          </div>

          {/* ECTS Field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">ECTS / Gewichtung</label>
            <input
              type="number"
              min="1"
              max="30"
              value={formData.ects}
              onChange={(e) => handleInputChange('ects', e.target.value)}
              placeholder="ECTS-Punkte eintragen"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Grade System Toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Notensystem</label>
            <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleInputChange('gradeSystem', GRADE_SYSTEMS.PUNKTE)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  formData.gradeSystem === GRADE_SYSTEMS.PUNKTE
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Punkte (0-18)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('gradeSystem', GRADE_SYSTEMS.NOTEN)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  formData.gradeSystem === GRADE_SYSTEMS.NOTEN
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Noten (1.0-5.0)
              </button>
            </div>
          </div>

          {/* Grade Value */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Note</label>
            <input
              type="number"
              min={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '0' : '1.0'}
              max={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '18' : '5.0'}
              step={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '1' : '0.1'}
              value={formData.gradeValue}
              onChange={(e) => handleInputChange('gradeValue', e.target.value)}
              placeholder={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '0-18 Punkte' : '1.0-5.0'}
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-neutral-900">Status</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsSubjectOpen(false);
                  setIsSemesterOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left cursor-pointer"
              >
                <span className="text-sm text-neutral-900">
                  {STATUS_OPTIONS.find(s => s.value === formData.status)?.label || 'Status wählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-neutral-400 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        handleInputChange('status', option.value);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 first:rounded-t-lg last:rounded-b-lg ${
                        formData.status === option.value ? 'bg-primary-50 text-neutral-900 font-medium' : 'text-neutral-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="justify-between">
          <Button
            variant="default"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Leistung löschen
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

export default KlausurBearbeitenDialog;
