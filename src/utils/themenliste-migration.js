/**
 * Migration Utility für Themenliste-Datenstruktur
 *
 * Konvertiert alte 4-Level-Hierarchie (RG → URG → Kapitel → Thema)
 * zu neuer flacher Struktur (selectedAreas + themen[])
 */

import { RECHTSGEBIET_COLORS } from '../data/unterrechtsgebiete-data';

/**
 * Prüft ob ein ContentPlan die alte Struktur hat
 * @param {Object} plan - Der zu prüfende ContentPlan
 * @returns {boolean}
 */
export function isOldStructure(plan) {
  if (!plan) return false;
  // Alte Struktur hat 'rechtsgebiete' Array mit verschachtelter Hierarchie
  return Array.isArray(plan.rechtsgebiete) && !plan.selectedAreas;
}

/**
 * Prüft ob ein ContentPlan die neue Struktur hat
 * @param {Object} plan - Der zu prüfende ContentPlan
 * @returns {boolean}
 */
export function isNewStructure(plan) {
  if (!plan) return false;
  // Neue Struktur hat 'selectedAreas' und 'themen' Arrays
  return Array.isArray(plan.selectedAreas);
}

/**
 * Migriert einen ContentPlan von alter zu neuer Struktur
 * @param {Object} oldPlan - ContentPlan mit alter Struktur
 * @returns {Object} - ContentPlan mit neuer Struktur
 */
export function migrateOldToNewStructure(oldPlan) {
  if (!oldPlan || !isOldStructure(oldPlan)) {
    return oldPlan;
  }

  const selectedAreas = [];
  const themen = [];
  let themaOrder = 0;

  // Durchlaufe alle Rechtsgebiete
  for (const rg of oldPlan.rechtsgebiete || []) {
    const rechtsgebietId = rg.rechtsgebietId;
    const color = RECHTSGEBIET_COLORS[rechtsgebietId] || 'bg-neutral-400';

    // Durchlaufe alle Unterrechtsgebiete
    for (const urg of rg.unterrechtsgebiete || []) {
      // PW-021 FIX: Fallback für URG-ID (alte Struktur kann urg.id oder urg.unterrechtsgebietId haben)
      const urgId = urg.unterrechtsgebietId || urg.id;

      // Füge URG zu selectedAreas hinzu (wenn noch nicht vorhanden)
      const areaExists = selectedAreas.some(a => a.id === urgId);
      if (!areaExists) {
        selectedAreas.push({
          id: urgId,
          name: urg.name,
          rechtsgebietId: rechtsgebietId,
          color: color
        });
      }

      // Extrahiere Themen - entweder aus Kapitel oder direkt
      if (urg.kapitel && Array.isArray(urg.kapitel)) {
        // Alte Struktur mit Kapitel-Ebene
        for (const kap of urg.kapitel) {
          for (const thema of kap.themen || []) {
            themen.push({
              id: thema.id,
              name: thema.name,
              description: thema.description || '',
              areaId: urgId,
              kapitelId: null, // Migration verliert Kapitel-Zuordnung
              order: themaOrder++,
              aufgaben: (thema.aufgaben || []).map((a, idx) => ({
                id: a.id,
                name: a.name,
                priority: a.priority || 'low',
                completed: a.completed || false,
                order: idx
              }))
            });
          }
        }
      } else if (urg.themen && Array.isArray(urg.themen)) {
        // Alte Struktur ohne Kapitel-Ebene
        for (const thema of urg.themen) {
          themen.push({
            id: thema.id,
            name: thema.name,
            description: thema.description || '',
            areaId: urgId,
            kapitelId: null,
            order: themaOrder++,
            aufgaben: (thema.aufgaben || []).map((a, idx) => ({
              id: a.id,
              name: a.name,
              priority: a.priority || 'low',
              completed: a.completed || false,
              order: idx
            }))
          });
        }
      }
    }
  }

  // Erstelle neuen Plan mit neuer Struktur
  return {
    id: oldPlan.id,
    type: 'themenliste',
    description: oldPlan.description || '',
    selectedAreas,
    useKapitel: false, // Migration setzt Kapitel standardmäßig auf false
    kapitel: [],
    themen,
    status: oldPlan.status || 'draft',
    archived: oldPlan.archived || false,
    createdAt: oldPlan.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Erstellt einen leeren ContentPlan mit neuer Struktur
 * @param {Object} options - Optionen für den neuen Plan
 * @param {boolean} options.useKapitel - Ob Kapitel-Ebene aktiviert sein soll
 * @returns {Object} - Neuer ContentPlan
 */
export function createEmptyContentPlan({ useKapitel = false } = {}) {
  const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id,
    type: 'themenliste',
    description: '',
    selectedAreas: [],
    useKapitel,
    kapitel: [],
    themen: [],
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Generiert den Anzeigenamen aus den selectedAreas
 * @param {Array} selectedAreas - Array der ausgewählten Bereiche
 * @returns {string} - Komma-separierter Name
 */
export function getDisplayName(selectedAreas) {
  if (!selectedAreas || selectedAreas.length === 0) {
    return '';
  }
  return selectedAreas.map(area => area.name).join(', ');
}

/**
 * Findet die Farbe für eine Area-ID
 * @param {Array} selectedAreas - Array der ausgewählten Bereiche
 * @param {string} areaId - ID der Area
 * @returns {string} - Tailwind-Farbklasse
 */
export function getColorForArea(selectedAreas, areaId) {
  const area = selectedAreas.find(a => a.id === areaId);
  return area?.color || 'bg-neutral-400';
}
