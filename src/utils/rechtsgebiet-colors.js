/**
 * Zentrale Rechtsgebiet/Fach Farbverwaltung
 * Single Source of Truth für alle Farblogik
 *
 * T-SET-1: Custom Rechtsgebiet-Farben & Fächer
 */

const STORAGE_KEY = 'prepwell_settings';

/**
 * Verfügbare Farben für den Color Picker
 * 12 Tailwind-Farben mit guter Unterscheidbarkeit
 */
export const AVAILABLE_COLORS = [
  { name: 'blue', label: 'Blau' },
  { name: 'green', label: 'Grün' },
  { name: 'red', label: 'Rot' },
  { name: 'purple', label: 'Violett' },
  { name: 'amber', label: 'Bernstein' },
  { name: 'teal', label: 'Türkis' },
  { name: 'pink', label: 'Rosa' },
  { name: 'indigo', label: 'Indigo' },
  { name: 'orange', label: 'Orange' },
  { name: 'cyan', label: 'Cyan' },
  { name: 'emerald', label: 'Smaragd' },
  { name: 'violet', label: 'Lila' },
];

/**
 * Standard-Rechtsgebiete (Jura-spezifisch, nicht löschbar)
 */
export const DEFAULT_RECHTSGEBIETE = {
  'oeffentliches-recht': {
    name: 'Öffentliches Recht',
    defaultColor: 'green',
    isDefault: true,
  },
  'zivilrecht': {
    name: 'Zivilrecht',
    defaultColor: 'blue',
    isDefault: true,
  },
  'strafrecht': {
    name: 'Strafrecht',
    defaultColor: 'red',
    isDefault: true,
  },
  'querschnitt': {
    name: 'Querschnittsrecht',
    defaultColor: 'purple',
    isDefault: true,
  },
};

/**
 * Lädt die Fächer-Einstellungen aus localStorage
 * @returns {{ colorOverrides: Object, customSubjects: Array }}
 */
export function getSubjectSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return settings.subjects || { colorOverrides: {}, customSubjects: [] };
  } catch {
    return { colorOverrides: {}, customSubjects: [] };
  }
}

/**
 * Speichert die Fächer-Einstellungen in localStorage
 * @param {Object} subjectSettings - { colorOverrides, customSubjects }
 */
export function saveSubjectSettings(subjectSettings) {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    settings.subjects = subjectSettings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Dispatch storage event für Cross-Component Updates
    window.dispatchEvent(new Event('storage'));
  } catch (e) {
    console.error('Error saving subject settings:', e);
  }
}

/**
 * Ermittelt die effektive Farbe für ein Rechtsgebiet/Fach
 * Prüft: 1) User Override, 2) Custom Subject, 3) Default
 *
 * @param {string} subjectId - ID des Rechtsgebiets/Fachs
 * @returns {string} Tailwind Farbname (z.B. 'blue', 'green')
 */
export function getColorForSubject(subjectId) {
  const settings = getSubjectSettings();

  // 1. Prüfe Farb-Overrides für Standard-Rechtsgebiete
  if (settings.colorOverrides[subjectId]) {
    return settings.colorOverrides[subjectId];
  }

  // 2. Prüfe Custom Subjects
  const customSubject = settings.customSubjects.find(s => s.id === subjectId);
  if (customSubject) {
    return customSubject.color;
  }

  // 3. Prüfe Standard-Rechtsgebiete
  if (DEFAULT_RECHTSGEBIETE[subjectId]) {
    return DEFAULT_RECHTSGEBIETE[subjectId].defaultColor;
  }

  // 4. Fallback
  return 'neutral';
}

/**
 * Generiert vollständige Farb-Klassen aus einem Farbnamen
 * @param {string} colorName - Tailwind Farbname
 * @returns {{ bg: string, border: string, text: string, badge: string, solid: string }}
 */
export function getColorClasses(colorName) {
  const fallback = {
    bg: 'bg-neutral-50',
    border: 'border-neutral-200',
    text: 'text-neutral-700',
    badge: 'bg-neutral-100',
    solid: 'bg-neutral-500',
  };

  if (!colorName || colorName === 'neutral') {
    return fallback;
  }

  return {
    bg: `bg-${colorName}-50`,
    border: `border-${colorName}-200`,
    text: `text-${colorName}-700`,
    badge: `bg-${colorName}-100`,
    solid: `bg-${colorName}-500`,
  };
}

/**
 * Kombiniert getColorForSubject + getColorClasses
 * Hauptfunktion für Komponenten
 *
 * @param {string} subjectId - ID des Rechtsgebiets/Fachs
 * @returns {{ bg: string, border: string, text: string, badge: string, solid: string }}
 */
export function getRechtsgebietColor(subjectId) {
  const colorName = getColorForSubject(subjectId);
  return getColorClasses(colorName);
}

/**
 * Gibt alle Subjects zurück (Defaults + Custom)
 * @param {boolean} isJura - Ob Jura-Studiengang (zeigt Standard-Rechtsgebiete)
 * @returns {Array<{ id: string, name: string, color: string, isDefault: boolean }>}
 */
export function getAllSubjects(isJura = true) {
  const settings = getSubjectSettings();
  const subjects = [];

  // Standard-Rechtsgebiete hinzufügen (nur für Jura)
  if (isJura) {
    Object.entries(DEFAULT_RECHTSGEBIETE).forEach(([id, data]) => {
      subjects.push({
        id,
        name: data.name,
        color: settings.colorOverrides[id] || data.defaultColor,
        isDefault: true,
      });
    });
  }

  // Custom Subjects hinzufügen
  settings.customSubjects.forEach(subject => {
    subjects.push({ ...subject, isDefault: false });
  });

  return subjects;
}

/**
 * Fügt ein neues Custom Subject hinzu
 * @param {string} name - Anzeigename
 * @param {string} color - Tailwind Farbname
 * @returns {string} Generierte ID
 * @throws {Error} Bei doppeltem Namen
 */
export function addCustomSubject(name, color) {
  const settings = getSubjectSettings();

  // ID aus Name generieren (Slug)
  const id = name.toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Duplikat-Check
  const existingIds = [
    ...Object.keys(DEFAULT_RECHTSGEBIETE),
    ...settings.customSubjects.map(s => s.id)
  ];

  if (existingIds.includes(id)) {
    throw new Error('Ein Fach mit diesem Namen existiert bereits');
  }

  settings.customSubjects.push({
    id,
    name,
    color,
    isDefault: false,
    createdAt: new Date().toISOString(),
  });

  saveSubjectSettings(settings);
  return id;
}

/**
 * Aktualisiert die Farbe eines Subjects (Default oder Custom)
 * @param {string} subjectId - ID des Subjects
 * @param {string} newColor - Neue Tailwind Farbe
 */
export function updateSubjectColor(subjectId, newColor) {
  const settings = getSubjectSettings();

  // Standard-Rechtsgebiet: In Overrides speichern
  if (DEFAULT_RECHTSGEBIETE[subjectId]) {
    // Bei Zurücksetzen auf Default: Override entfernen
    if (newColor === DEFAULT_RECHTSGEBIETE[subjectId].defaultColor) {
      delete settings.colorOverrides[subjectId];
    } else {
      settings.colorOverrides[subjectId] = newColor;
    }
  } else {
    // Custom Subject: Direkt aktualisieren
    const subject = settings.customSubjects.find(s => s.id === subjectId);
    if (subject) {
      subject.color = newColor;
    }
  }

  saveSubjectSettings(settings);
}

/**
 * Löscht ein Custom Subject (Standard-Rechtsgebiete nicht löschbar)
 * @param {string} subjectId - ID des Subjects
 * @throws {Error} Bei Versuch, Standard-Rechtsgebiet zu löschen
 */
export function deleteCustomSubject(subjectId) {
  if (DEFAULT_RECHTSGEBIETE[subjectId]) {
    throw new Error('Standard-Rechtsgebiete können nicht gelöscht werden');
  }

  const settings = getSubjectSettings();
  settings.customSubjects = settings.customSubjects.filter(s => s.id !== subjectId);
  saveSubjectSettings(settings);
}

/**
 * Setzt ein Standard-Rechtsgebiet auf seine Default-Farbe zurück
 * @param {string} subjectId - ID des Standard-Rechtsgebiets
 */
export function resetToDefaultColor(subjectId) {
  if (!DEFAULT_RECHTSGEBIETE[subjectId]) {
    return; // Nur für Defaults
  }

  const settings = getSubjectSettings();
  delete settings.colorOverrides[subjectId];
  saveSubjectSettings(settings);
}

/**
 * Prüft ob ein Subject eine geänderte Farbe hat
 * @param {string} subjectId - ID des Subjects
 * @returns {boolean}
 */
export function hasCustomColor(subjectId) {
  if (!DEFAULT_RECHTSGEBIETE[subjectId]) {
    return false; // Nur relevant für Defaults
  }

  const settings = getSubjectSettings();
  return !!settings.colorOverrides[subjectId];
}

// Legacy-Export für Abwärtskompatibilität
export const RECHTSGEBIET_COLORS = {
  'oeffentliches-recht': 'bg-green-500',
  'zivilrecht': 'bg-blue-500',
  'strafrecht': 'bg-red-500',
  'querschnitt': 'bg-purple-500',
};
