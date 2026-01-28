/**
 * PW-205: Parser for Schedule Screenshots
 *
 * Parses OCR output from schedule screenshots (Terminpläne)
 * Supports various German university schedule formats:
 * - "20.02.2025 Grundzüge des Strafverfahrens"
 * - "1. 20.02.2025 Thema"
 * - "07.09.2022 Grundlagen Gesellschaftsrecht"
 */

// Date pattern: DD.MM.YYYY
const DATE_REGEX = /\b(\d{1,2}\.\d{2}\.\d{4})\b/;

// Header lines to skip
const HEADER_KEYWORDS = /^(Termin|Datum|Programm|Einheit|Schwerpunkt|Nr\.?|Uhrzeit|Raum|Dozent)/i;

// Hints (not imported as themes)
const HINT_KEYWORDS = /\b(Ferien|Feiertag|Himmelfahrt|Ostern|Weihnachten|Keine Vorlesung|Ausweichstunde|Wiederholung|frei|entfällt|Tag der Arbeit)\b/i;

// Date range pattern (e.g., "17.04.2025 - 01.05.2025")
const DATE_RANGE_REGEX = /(\d{1,2}\.\d{2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{2}\.\d{4})/;

/**
 * Parse OCR lines from schedule screenshots
 * @param {string[]} lines - Array of OCR text lines
 * @returns {{ themen: Array, hinweise: Array, unparsed: Array, fach: string|null }}
 */
export function parseScheduleLines(lines) {
  const results = {
    fach: null,
    themen: [],
    hinweise: [],
    unparsed: [],
  };

  // Try to extract Fach from first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Skip if it's a date line
    if (DATE_REGEX.test(line)) break;

    // Skip typical header words
    if (HEADER_KEYWORDS.test(line)) continue;

    // First non-header, non-date line could be the Fach
    if (!results.fach && line.length > 3 && !DATE_REGEX.test(line)) {
      // Check if it looks like a course name (not a number or short word)
      if (!/^\d+\.?\s*$/.test(line)) {
        results.fach = line;
      }
    }
  }

  for (const line of lines) {
    const trimmed = line?.trim();
    if (!trimmed) continue;

    // Skip header lines
    if (HEADER_KEYWORDS.test(trimmed)) continue;

    // Skip if it's the detected Fach
    if (results.fach && trimmed === results.fach) continue;

    // Check for date
    const dateMatch = trimmed.match(DATE_REGEX);

    if (!dateMatch) {
      // No date found - might be continuation or noise
      if (trimmed.length > 5 && !HEADER_KEYWORDS.test(trimmed)) {
        results.unparsed.push(trimmed);
      }
      continue;
    }

    const date = dateMatch[1];

    // Check for date range (Ferien)
    const rangeMatch = trimmed.match(DATE_RANGE_REGEX);

    // Check if it's a hint (Ferien, Feiertag, etc.)
    if (HINT_KEYWORDS.test(trimmed)) {
      results.hinweise.push({
        date: rangeMatch ? `${rangeMatch[1]} - ${rangeMatch[2]}` : date,
        text: trimmed,
        type: 'hinweis',
      });
      continue;
    }

    // Extract topic text (everything after the date pattern)
    let topic = trimmed
      .replace(/^\d+\.?\s*/, '')     // Remove leading number "1. " or "1 "
      .replace(DATE_REGEX, '')        // Remove date
      .replace(DATE_RANGE_REGEX, '')  // Remove date range
      .replace(/^\s*[-–:]\s*/, '')    // Remove dash/colon after date
      .trim();

    // Skip if only a date remains (no topic)
    if (!topic || topic.length < 2) continue;

    results.themen.push({
      date,
      name: topic,
      type: 'thema',
    });
  }

  return results;
}

/**
 * Convert parsed results to contentPlan themen format
 * @param {{ themen: Array }} parsed - Parsed schedule data
 * @param {string|null} areaId - Area ID to assign to themes
 * @returns {Array} - Array of thema objects
 */
export function parsedToThemen(parsed, areaId = null) {
  return parsed.themen.map((item, index) => ({
    id: `imported-${Date.now()}-${index}`,
    name: item.name,
    description: item.date ? `Datum: ${item.date}` : '',
    areaId,
    kapitelId: null,
    order: index,
    aufgaben: [],
  }));
}

/**
 * Smart parse: Try to detect schedule format and parse accordingly
 * @param {string[]} lines - OCR lines
 * @returns {{ themen: Array, hinweise: Array, fach: string|null }}
 */
export function smartParseLines(lines) {
  // For now, use schedule parser
  // In future, could add detection for different formats (Gliederung vs Terminplan)
  return parseScheduleLines(lines);
}

export default {
  parseScheduleLines,
  parsedToThemen,
  smartParseLines,
};
