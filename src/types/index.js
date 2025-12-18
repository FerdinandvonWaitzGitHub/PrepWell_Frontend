/**
 * PrepWell Data Model Types
 *
 * Hierarchie:
 * CONTENT → SLOT → BLOCK
 *
 * CONTENT: Was gelernt wird (zeitlos)
 * SLOT: Wann gelernt wird (Datum + Position)
 * BLOCK: Wie es dargestellt wird (Datum + Uhrzeit)
 */

/**
 * @typedef {Object} Content
 * Der Lerninhalt selbst - zeitlos und wiederverwendbar
 *
 * @property {string} id - Unique ID
 * @property {string} title - Titel des Inhalts
 * @property {string} [description] - Beschreibung
 * @property {string} [rechtsgebiet] - z.B. "Zivilrecht"
 * @property {string} [unterrechtsgebiet] - z.B. "BGB AT"
 * @property {string} [kapitel] - Kapitelname
 * @property {Array<ContentTask>} [aufgaben] - Aufgaben zum Inhalt
 * @property {'lernblock'|'exam'|'repetition'|'private'} blockType - Art des Blocks
 * @property {string} [createdAt] - Erstellungsdatum
 */

/**
 * @typedef {Object} ContentTask
 * Eine Aufgabe innerhalb eines Content
 *
 * @property {string} id - Unique ID
 * @property {string} title - Aufgabentext
 * @property {boolean} completed - Erledigt?
 */

/**
 * @typedef {Object} Slot
 * Ein Platzhalter für einen Tag - referenziert Content
 *
 * @property {string} id - Unique ID des Slots
 * @property {string} date - Datum im Format "YYYY-MM-DD"
 * @property {1|2|3} position - Position am Tag (1, 2 oder 3)
 * @property {string} contentId - Referenz auf Content.id
 * @property {'lernblock'|'exam'|'repetition'|'private'} blockType - Art des Blocks
 * @property {boolean} [isLocked] - Gesperrt/abgeschlossen?
 * @property {Array<SlotTask>} [tasks] - Diesem Slot zugewiesene Aufgaben
 * @property {string} [createdAt] - Erstellungsdatum
 */

/**
 * @typedef {Object} SlotTask
 * Eine Aufgabe die einem Slot zugewiesen wurde
 *
 * @property {string} id - Unique ID
 * @property {string} [sourceId] - Original-ID wenn aus anderer Quelle
 * @property {string} text - Aufgabentext
 * @property {boolean} completed - Erledigt?
 * @property {'todos'|'themenliste'|'content'} [source] - Woher die Aufgabe kam
 */

/**
 * @typedef {Object} Block
 * Die visuelle Darstellung für die Kalenderansicht
 * Wird aus Slot + Content + Zeitinfo abgeleitet
 *
 * @property {string} id - Slot ID
 * @property {string} contentId - Content ID
 * @property {string} date - Datum "YYYY-MM-DD"
 * @property {number} startHour - Startzeit (6-22)
 * @property {number} duration - Dauer in Stunden
 * @property {string} [startTime] - "HH:MM" Format
 * @property {string} [endTime] - "HH:MM" Format
 * @property {'lernblock'|'exam'|'repetition'|'private'} blockType
 *
 * // Von Content übernommen:
 * @property {string} title
 * @property {string} [description]
 * @property {string} [rechtsgebiet]
 * @property {string} [unterrechtsgebiet]
 *
 * // Von Slot übernommen:
 * @property {boolean} [isLocked]
 * @property {Array<SlotTask>} [tasks]
 */

/**
 * Position zu Zeitslot Mapping
 * Position 1: 08:00 - 10:00
 * Position 2: 10:00 - 12:00
 * Position 3: 14:00 - 16:00
 */
export const POSITION_TIME_MAP = {
  1: { startHour: 8, endHour: 10, startTime: '08:00', endTime: '10:00' },
  2: { startHour: 10, endHour: 12, startTime: '10:00', endTime: '12:00' },
  3: { startHour: 14, endHour: 16, startTime: '14:00', endTime: '16:00' },
};

/**
 * Erzeugt einen Block aus Slot und Content
 * @param {Slot} slot
 * @param {Content} content
 * @param {Object} [timeOverride] - Optionale Zeitüberschreibung
 * @returns {Block}
 */
export function createBlockFromSlotAndContent(slot, content, timeOverride = null) {
  const positionTime = POSITION_TIME_MAP[slot.position] || POSITION_TIME_MAP[1];

  return {
    // IDs
    id: slot.id,
    contentId: slot.contentId,
    date: slot.date,

    // Zeit (aus Position oder Override)
    startHour: timeOverride?.startHour ?? positionTime.startHour,
    duration: timeOverride?.duration ?? (positionTime.endHour - positionTime.startHour),
    startTime: timeOverride?.startTime ?? positionTime.startTime,
    endTime: timeOverride?.endTime ?? positionTime.endTime,

    // Block Type
    blockType: slot.blockType || content.blockType || 'lernblock',

    // Von Content
    title: content.title,
    description: content.description,
    rechtsgebiet: content.rechtsgebiet,
    unterrechtsgebiet: content.unterrechtsgebiet,

    // Von Slot
    position: slot.position,
    isLocked: slot.isLocked || false,
    tasks: slot.tasks || [],
  };
}

/**
 * Generiert eine eindeutige ID
 * @param {string} [prefix]
 * @returns {string}
 */
export function generateId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

export default {
  POSITION_TIME_MAP,
  createBlockFromSlotAndContent,
  generateId,
};
