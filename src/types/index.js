/**
 * PrepWell Data Model Types
 *
 * Hierarchie:
 * CONTENT -> BLOCK -> SESSION
 *
 * CONTENT: Was gelernt wird (zeitlos)
 * BLOCK: Wann gelernt wird (Datum + Position)
 * SESSION: Wie es dargestellt wird (Datum + Uhrzeit)
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
 * @typedef {Object} Block
 * Ein Platzhalter für einen Tag - referenziert Content (formerly Slot)
 *
 * @property {string} id - Unique ID des Blocks
 * @property {string} date - Datum im Format "YYYY-MM-DD"
 * @property {1|2|3|4} position - Position am Tag (1, 2, 3 oder 4)
 * @property {string} contentId - Referenz auf Content.id
 * @property {'lernblock'|'exam'|'repetition'|'private'} blockType - Art des Blocks
 * @property {boolean} [isLocked] - Gesperrt/abgeschlossen?
 * @property {Array<BlockTask>} [tasks] - Diesem Block zugewiesene Aufgaben
 * @property {string} [createdAt] - Erstellungsdatum
 */

/**
 * @typedef {Object} BlockTask
 * Eine Aufgabe die einem Block zugewiesen wurde (formerly SlotTask)
 *
 * @property {string} id - Unique ID
 * @property {string} [sourceId] - Original-ID wenn aus anderer Quelle
 * @property {string} text - Aufgabentext
 * @property {boolean} completed - Erledigt?
 * @property {'todos'|'themenliste'|'content'} [source] - Woher die Aufgabe kam
 */

/**
 * @typedef {Object} Session
 * Die visuelle Darstellung für die Kalenderansicht (formerly Block)
 * Wird aus Block + Content + Zeitinfo abgeleitet
 *
 * @property {string} id - Block ID
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
 * // Von Block übernommen:
 * @property {boolean} [isLocked]
 * @property {Array<BlockTask>} [tasks]
 */

/**
 * Position zu Zeitblock Mapping
 * Position 1: 08:00 - 10:00
 * Position 2: 10:00 - 12:00
 * Position 3: 14:00 - 16:00
 * Position 4: 16:00 - 18:00
 */
export const POSITION_TIME_MAP = {
  1: { startHour: 8, endHour: 10, startTime: '08:00', endTime: '10:00' },
  2: { startHour: 10, endHour: 12, startTime: '10:00', endTime: '12:00' },
  3: { startHour: 14, endHour: 16, startTime: '14:00', endTime: '16:00' },
  4: { startHour: 16, endHour: 18, startTime: '16:00', endTime: '18:00' },
};

/**
 * Erzeugt eine Session aus Block und Content (formerly createBlockFromSlotAndContent)
 * @param {Block} block
 * @param {Content} content
 * @param {Object} [timeOverride] - Optionale Zeitüberschreibung
 * @returns {Session}
 */
export function createSessionFromBlockAndContent(block, content, timeOverride = null) {
  const positionTime = POSITION_TIME_MAP[block.position] || POSITION_TIME_MAP[1];

  return {
    // IDs
    id: block.id,
    contentId: block.contentId,
    date: block.date,

    // Zeit (aus Position oder Override)
    startHour: timeOverride?.startHour ?? positionTime.startHour,
    duration: timeOverride?.duration ?? (positionTime.endHour - positionTime.startHour),
    startTime: timeOverride?.startTime ?? positionTime.startTime,
    endTime: timeOverride?.endTime ?? positionTime.endTime,

    // Block Type
    blockType: block.blockType || content.blockType || 'lernblock',

    // Von Content
    title: content.title,
    description: content.description,
    rechtsgebiet: content.rechtsgebiet,
    unterrechtsgebiet: content.unterrechtsgebiet,

    // Von Block
    position: block.position,
    isLocked: block.isLocked || false,
    tasks: block.tasks || [],
  };
}

// Legacy alias for backwards compatibility
export const createBlockFromSlotAndContent = createSessionFromBlockAndContent;

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
  createSessionFromBlockAndContent,
  createBlockFromSlotAndContent, // Legacy alias
  generateId,
};
