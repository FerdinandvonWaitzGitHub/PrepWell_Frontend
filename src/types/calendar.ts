/**
 * Calendar Types
 * Slot-based learning plan system
 */

export type SlotStatus = "empty" | "topic" | "free";

export type BlockType = "lernblock" | "repetition" | "exam" | "free" | "private";

export interface Slot {
  // Identifikation
  id: string;                 // z. B. "2025-08-03-1"
  date: string;               // ISO Datum "2025-08-03"
  position: 1 | 2 | 3 | 4;    // Slot Nummer im Tag

  // Inhalt
  status: SlotStatus;         // "empty", "topic" oder "free"
  topicId?: string;           // wenn status === "topic"
  topicTitle?: string;        // optional, für schnelleren Zugriff im Frontend
  blockType?: BlockType;      // Art des Lernblocks

  // Multi Slot Logik
  groupId?: string;           // gleiche groupId = gleicher Themenblock über mehrere Slots
  groupSize?: number;         // wie viele Slots gehören zu dieser Gruppe (1, 2, 3 oder 4)
  groupIndex?: number;        // an welcher Stelle innerhalb der Gruppe dieser Slot steht (0, 1, 2, 3)

  // Zusätzliche Daten
  progress?: string;          // z.B. "2/3"
  description?: string;

  // Steuerung
  isLocked: boolean;          // darf der User diesen Slot bearbeiten
  createdAt: string;
  updatedAt: string;
}

export interface Day {
  date: string;               // "2025-08-03"
  slots: Slot[];              // immer Länge 4
}

export interface LearningBlock {
  id: string;
  title: string;
  blockType: BlockType;
  blockSize: number;          // 1, 2, 3 oder 4 Slots
  description?: string;
  progress?: string;
  // Zeit-Eigenschaften für Wochenansicht
  startTime?: string;         // z.B. "09:00"
  endTime?: string;           // z.B. "11:00"
  startDate?: string;         // ISO Datum für mehrtägige Blöcke
  endDate?: string;           // ISO Datum für mehrtägige Blöcke
  isMultiDay?: boolean;       // true wenn Block > 24h
}
