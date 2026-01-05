import { useStudiengang } from '../contexts/studiengang-context';
import type { HierarchyLabels } from '../types/studiengang';

export interface UseHierarchyLabelsReturn extends HierarchyLabels {
  isJura: boolean;
  hasChapterLevel: boolean;
}

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
 */
export function useHierarchyLabels(): UseHierarchyLabelsReturn {
  const { hierarchyLabels, isJura } = useStudiengang();

  return {
    // Singular-Formen
    level1: hierarchyLabels.level1,
    level2: hierarchyLabels.level2,
    level3: hierarchyLabels.level3,
    level4: hierarchyLabels.level4,
    level5: hierarchyLabels.level5,

    // Plural-Formen
    level1Plural: hierarchyLabels.level1Plural,
    level2Plural: hierarchyLabels.level2Plural,
    level3Plural: hierarchyLabels.level3Plural,
    level4Plural: hierarchyLabels.level4Plural,
    level5Plural: hierarchyLabels.level5Plural,

    // Flags
    isJura,
    hasChapterLevel: isJura,
  };
}

export default useHierarchyLabels;
