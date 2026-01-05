/**
 * Studiengang Types
 * Dynamische Hierarchie-Bezeichnungen je nach Studiengang
 */

export type StudiengangCategory =
  | 'recht'
  | 'medizin'
  | 'sozialwissenschaften'
  | 'informatik'
  | 'ingenieurwissenschaften'
  | 'naturwissenschaften'
  | 'geisteswissenschaften'
  | 'paedagogik';

export interface Studiengang {
  id: string;
  name: string;
  category: StudiengangCategory;
  hasKapitelEbene: boolean;  // true = 5-stufige Hierarchie (nur Jura)
}

/**
 * Hierarchie-Labels für dynamische UI-Bezeichnungen
 *
 * Jura (5-stufig):
 *   Level 1: Rechtsgebiet
 *   Level 2: Unterrechtsgebiet
 *   Level 3: Kapitel (optional)
 *   Level 4: Thema
 *   Level 5: Aufgabe
 *
 * Andere Studiengänge (4-stufig):
 *   Level 1: Fach
 *   Level 2: Kapitel
 *   Level 3: Thema
 *   Level 4: Aufgabe
 */
export interface HierarchyLabels {
  level1: string;
  level1Plural: string;
  level2: string;
  level2Plural: string;
  level3: string;
  level3Plural: string;
  level4: string;
  level4Plural: string;
  level5?: string;        // Nur für Jura
  level5Plural?: string;  // Nur für Jura
}

export const JURA_HIERARCHY: HierarchyLabels = {
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

export const DEFAULT_HIERARCHY: HierarchyLabels = {
  level1: 'Fach',
  level1Plural: 'Fächer',
  level2: 'Kapitel',
  level2Plural: 'Kapitel',
  level3: 'Thema',
  level3Plural: 'Themen',
  level4: 'Aufgabe',
  level4Plural: 'Aufgaben',
};

// =============================================================================
// SUBJECT & TOPIC (Inhaltliche Struktur)
// =============================================================================

export interface Subject {
  id: string;
  name: string;
  color: string;          // Hex color
  studiengang_id: string;
  order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: string;
  name: string;
  subject_id: string;
  parent_id?: string;     // Für verschachtelte Hierarchie
  level: number;          // 1-5
  order: number;
  is_completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// RECHTSGEBIETE (Jura-spezifisch)
// =============================================================================

export type RechtsgebietId =
  | 'oeffentliches-recht'
  | 'zivilrecht'
  | 'strafrecht'
  | 'querschnitt';

export interface Rechtsgebiet {
  id: RechtsgebietId;
  name: string;
  color: string;
  shortName: string;
}

export const RECHTSGEBIETE: Record<RechtsgebietId, Rechtsgebiet> = {
  'oeffentliches-recht': {
    id: 'oeffentliches-recht',
    name: 'Öffentliches Recht',
    color: '#22c55e',  // green-500
    shortName: 'ÖffR',
  },
  'zivilrecht': {
    id: 'zivilrecht',
    name: 'Zivilrecht',
    color: '#3b82f6',  // blue-500
    shortName: 'ZR',
  },
  'strafrecht': {
    id: 'strafrecht',
    name: 'Strafrecht',
    color: '#ef4444',  // red-500
    shortName: 'SR',
  },
  'querschnitt': {
    id: 'querschnitt',
    name: 'Querschnittsrecht',
    color: '#8b5cf6',  // violet-500
    shortName: 'QR',
  },
};
