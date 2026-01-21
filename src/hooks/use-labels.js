import { useMemo } from 'react';
import { useStudiengang } from '../contexts/studiengang-context';

/**
 * T29: useLabels - Dynamische Labels basierend auf Jura vs. Nicht-Jura Modus
 *
 * Provides semantic label names that automatically adapt to the user's Studiengang:
 *
 * | Semantic Key | Jura-Modus        | Nicht-Jura-Modus |
 * |--------------|-------------------|------------------|
 * | subject      | Rechtsgebiet      | Fach             |
 * | subSubject   | Unterrechtsgebiet | Kapitel          |
 * | topic        | Thema             | Thema            |
 * | task         | Aufgabe           | Aufgabe          |
 *
 * Usage:
 * ```jsx
 * const { subject, subSubject, topic, task } = useLabels();
 * return <label>{subject}</label>; // Shows "Rechtsgebiet" or "Fach"
 * ```
 */
export const useLabels = () => {
  const { isJura, hierarchyLabels } = useStudiengang();

  return useMemo(() => ({
    // Primary subject label (Rechtsgebiet / Fach)
    subject: hierarchyLabels.level1,
    subjectPlural: hierarchyLabels.level1Plural,

    // Secondary subject label (Unterrechtsgebiet / Kapitel)
    subSubject: hierarchyLabels.level2,
    subSubjectPlural: hierarchyLabels.level2Plural,

    // Chapter label (Kapitel - only for Jura with 5 levels)
    // For Non-Jura, this equals subSubject
    chapter: isJura ? hierarchyLabels.level3 : hierarchyLabels.level2,
    chapterPlural: isJura ? hierarchyLabels.level3Plural : hierarchyLabels.level2Plural,

    // Topic label (Thema)
    topic: isJura ? hierarchyLabels.level4 : hierarchyLabels.level3,
    topicPlural: isJura ? hierarchyLabels.level4Plural : hierarchyLabels.level3Plural,

    // Task label (Aufgabe)
    task: isJura ? hierarchyLabels.level5 : hierarchyLabels.level4,
    taskPlural: isJura ? hierarchyLabels.level5Plural : hierarchyLabels.level4Plural,

    // Flag for convenience
    isJura,
  }), [isJura, hierarchyLabels]);
};

export default useLabels;
