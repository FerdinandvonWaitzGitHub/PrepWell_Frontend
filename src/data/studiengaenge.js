/**
 * Studiengänge und deren Hierarchie-Bezeichnungen
 *
 * Jura verwendet eine 5-stufige Hierarchie:
 * Rechtsgebiet → Unterrechtsgebiet → Kapitel → Thema → Aufgabe
 *
 * Alle anderen Studiengänge verwenden eine 4-stufige Hierarchie:
 * Fach → Kapitel → Thema → Aufgabe
 */

// Jura-spezifische Hierarchie-Bezeichnungen
export const JURA_HIERARCHY = {
  level1: 'Rechtsgebiet',
  level1Plural: 'Rechtsgebiete',
  level2: 'Unterrechtsgebiet',
  level2Plural: 'Unterrechtsgebiete',
  level3: 'Kapitel',
  level3Plural: 'Kapitel',
  level4: 'Thema',
  level4Plural: 'Themen',
  level5: 'Aufgabe',
  level5Plural: 'Aufgaben',
};

// Standard-Hierarchie für alle anderen Studiengänge
export const DEFAULT_HIERARCHY = {
  level1: 'Fach',
  level1Plural: 'Fächer',
  level2: 'Kapitel',
  level2Plural: 'Kapitel',
  level3: 'Thema',
  level3Plural: 'Themen',
  level4: 'Aufgabe',
  level4Plural: 'Aufgaben',
};

// Liste aller verfügbaren Studiengänge
export const STUDIENGAENGE = [
  {
    id: 'rechtswissenschaften',
    name: 'Rechtswissenschaften (Jura)',
    isJura: true,
    hierarchy: JURA_HIERARCHY,
  },
  {
    id: 'medizin',
    name: 'Medizin',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'zahnmedizin',
    name: 'Zahnmedizin',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'pharmazie',
    name: 'Pharmazie',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'psychologie',
    name: 'Psychologie',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'bwl',
    name: 'Betriebswirtschaftslehre (BWL)',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'vwl',
    name: 'Volkswirtschaftslehre (VWL)',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'wirtschaftsinformatik',
    name: 'Wirtschaftsinformatik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'informatik',
    name: 'Informatik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'maschinenbau',
    name: 'Maschinenbau',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'elektrotechnik',
    name: 'Elektrotechnik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'bauingenieurwesen',
    name: 'Bauingenieurwesen',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'architektur',
    name: 'Architektur',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'physik',
    name: 'Physik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'chemie',
    name: 'Chemie',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'biologie',
    name: 'Biologie',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'mathematik',
    name: 'Mathematik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'germanistik',
    name: 'Germanistik',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'geschichte',
    name: 'Geschichte',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
  {
    id: 'lehramt',
    name: 'Lehramt',
    isJura: false,
    hierarchy: DEFAULT_HIERARCHY,
  },
];

/**
 * Gibt die Hierarchie-Labels für einen Studiengang zurück
 * @param {string} studiengangId - ID des Studiengangs
 * @returns {object} Hierarchie-Labels
 */
export const getHierarchyLabels = (studiengangId) => {
  if (!studiengangId) return DEFAULT_HIERARCHY;
  const studiengang = STUDIENGAENGE.find(s => s.id === studiengangId);
  return studiengang?.hierarchy || DEFAULT_HIERARCHY;
};

/**
 * Prüft ob ein Studiengang Jura ist
 * @param {string} studiengangId - ID des Studiengangs
 * @returns {boolean} true wenn Jura
 */
export const isJuraStudiengang = (studiengangId) => {
  if (!studiengangId) return false;
  const studiengang = STUDIENGAENGE.find(s => s.id === studiengangId);
  return studiengang?.isJura ?? false;
};

/**
 * Gibt den Namen eines Studiengangs zurück
 * @param {string} studiengangId - ID des Studiengangs
 * @returns {string} Name des Studiengangs
 */
export const getStudiengangName = (studiengangId) => {
  if (!studiengangId) return '';
  const studiengang = STUDIENGAENGE.find(s => s.id === studiengangId);
  return studiengang?.name || '';
};
