import { useStudiengang } from '../contexts/studiengang-context';

/**
 * Hook für einfachen Zugriff auf Hierarchie-Labels
 *
 * Die Labels ändern sich basierend auf dem gewählten Studiengang:
 * - Jura: Rechtsgebiet → Unterrechtsgebiet → Kapitel → Thema → Aufgabe
 * - Andere: Fach → Kapitel → Thema → Aufgabe
 *
 * @example
 * const { level1, level2, isJura } = useHierarchyLabels();
 * // Bei Jura: level1 = "Rechtsgebiet", level2 = "Unterrechtsgebiet"
 * // Bei anderen: level1 = "Fach", level2 = "Kapitel"
 *
 * @returns {object} Hierarchie-Labels und Flags
 */
export function useHierarchyLabels() {
  const { hierarchyLabels, isJura } = useStudiengang();

  return {
    // Singular-Formen
    level1: hierarchyLabels.level1,           // "Rechtsgebiet" oder "Fach"
    level2: hierarchyLabels.level2,           // "Unterrechtsgebiet" oder "Kapitel"
    level3: hierarchyLabels.level3,           // "Kapitel" oder "Thema"
    level4: hierarchyLabels.level4,           // "Thema" oder "Aufgabe"
    level5: hierarchyLabels.level5,           // "Aufgabe" (nur bei Jura)

    // Plural-Formen
    level1Plural: hierarchyLabels.level1Plural,   // "Rechtsgebiete" oder "Fächer"
    level2Plural: hierarchyLabels.level2Plural,   // "Unterrechtsgebiete" oder "Kapitel"
    level3Plural: hierarchyLabels.level3Plural,   // "Kapitel" oder "Themen"
    level4Plural: hierarchyLabels.level4Plural,   // "Themen" oder "Aufgaben"
    level5Plural: hierarchyLabels.level5Plural,   // "Aufgaben" (nur bei Jura)

    // Flags
    isJura,
    hasChapterLevel: isJura, // Zusätzliche Kapitel-Ebene nur bei Jura relevant
  };
}

export default useHierarchyLabels;
