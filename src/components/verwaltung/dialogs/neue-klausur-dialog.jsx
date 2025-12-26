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
import { ChevronDownIcon, CalendarIcon, PlusIcon } from '../../ui/icon';
import { useExams, GRADE_SYSTEMS, SEMESTER_OPTIONS } from '../../../contexts/exams-context';

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
  const { allSubjects, addCustomSubject, preferredGradeSystem } = useExams();

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
    gradeSystem: preferredGradeSystem || GRADE_SYSTEMS.PUNKTE,
    status: 'ausstehend',
    addToCalendar: false
  });

  // Dropdown states
  const [isSubjectOpen, setIsSubjectOpen] = useState(false);
  const [isSemesterOpen, setIsSemesterOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Custom subject input
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        subject: '',
        title: '',
        semester: '',
        description: '',
        date: '',
        time: '',
        ects: '',
        gradeValue: '',
        gradeSystem: preferredGradeSystem || GRADE_SYSTEMS.PUNKTE,
        status: 'ausstehend',
        addToCalendar: false
      });
      setIsSubjectOpen(false);
      setIsSemesterOpen(false);
      setIsStatusOpen(false);
      setShowAddSubject(false);
      setNewSubjectName('');
    }
  }, [open, preferredGradeSystem]);

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

    const examData = {
      ...formData,
      ects: formData.ects ? parseInt(formData.ects, 10) : null,
      gradeValue: formData.gradeValue
        ? (formData.gradeSystem === GRADE_SYSTEMS.PUNKTE
            ? parseInt(formData.gradeValue, 10)
            : parseFloat(formData.gradeValue))
        : null
    };

    onSave(examData);
    onOpenChange(false);
  };

  const isFormValid = formData.subject && formData.title;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Neue Leistung eintragen</DialogTitle>
          <DialogDescription>
            Trage eine neue Leistung in deine Übersicht ein.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Subject Dropdown with Add Custom */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">
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
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.subject ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formData.subject || 'Fach auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSubjectOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSubjectOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {allSubjects.map(subject => (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => {
                        handleInputChange('subject', subject);
                        setIsSubjectOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                        formData.subject === subject ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
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
                      className="w-full px-4 py-2 text-left text-sm text-primary-600 hover:bg-primary-50 border-t border-gray-100 flex items-center gap-2"
                    >
                      <PlusIcon size={14} />
                      Neues Fach hinzufügen
                    </button>
                  ) : (
                    <div className="p-2 border-t border-gray-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="Fachname eingeben"
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-primary-400"
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
            <label className="text-sm font-medium text-gray-900">Semester</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsSemesterOpen(!isSemesterOpen);
                  setIsSubjectOpen(false);
                  setIsStatusOpen(false);
                }}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left cursor-pointer"
              >
                <span className={`text-sm ${formData.semester ? 'text-gray-900' : 'text-gray-500'}`}>
                  {formData.semester || 'Semester auswählen'}
                </span>
                <ChevronDownIcon size={16} className={`text-gray-400 transition-transform ${isSemesterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSemesterOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {SEMESTER_OPTIONS.map(semester => (
                    <button
                      key={semester}
                      type="button"
                      onClick={() => {
                        handleInputChange('semester', semester);
                        setIsSemesterOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                        formData.semester === semester ? 'bg-primary-50 text-gray-900 font-medium' : 'text-gray-700'
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
            <label className="text-sm font-medium text-gray-900">
              Thema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Thema eintragen"
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
              <span className="text-sm text-gray-700">Leistung im Kalender eintragen</span>
            </div>
          </div>

          {/* ECTS Field */}
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

          {/* Grade System Toggle */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Notensystem</label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleInputChange('gradeSystem', GRADE_SYSTEMS.PUNKTE)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  formData.gradeSystem === GRADE_SYSTEMS.PUNKTE
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Punkte (0-18)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('gradeSystem', GRADE_SYSTEMS.NOTEN)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  formData.gradeSystem === GRADE_SYSTEMS.NOTEN
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Noten (1.0-5.0)
              </button>
            </div>
          </div>

          {/* Grade Value */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Note</label>
            <input
              type="number"
              min={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '0' : '1.0'}
              max={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '18' : '5.0'}
              step={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '1' : '0.1'}
              value={formData.gradeValue}
              onChange={(e) => handleInputChange('gradeValue', e.target.value)}
              placeholder={formData.gradeSystem === GRADE_SYSTEMS.PUNKTE ? '0-18 Punkte' : '1.0-5.0'}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
            />
          </div>

          {/* Status Dropdown */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-900">Status</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsSubjectOpen(false);
                  setIsSemesterOpen(false);
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
