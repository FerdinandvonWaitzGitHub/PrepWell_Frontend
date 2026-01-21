/**
 * Zeit-Validierung für Session-Dialoge
 *
 * Stellt sicher, dass:
 * - Endzeit nach Startzeit liegt
 * - Minimum-Dauer von 15 Minuten eingehalten wird
 */

/**
 * Validiert, dass endTime nach startTime liegt
 * @param {string} startTime - Format "HH:MM"
 * @param {string} endTime - Format "HH:MM"
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTimeRange(startTime, endTime) {
  if (!startTime || !endTime) {
    return { valid: false, error: 'Start- und Endzeit müssen angegeben werden' };
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    return {
      valid: false,
      error: 'Die Endzeit muss nach der Startzeit liegen'
    };
  }

  if (endMinutes - startMinutes < 15) {
    return {
      valid: false,
      error: 'Die minimale Dauer beträgt 15 Minuten'
    };
  }

  return { valid: true };
}

/**
 * Berechnet die Dauer in Stunden
 * @param {string} startTime - Format "HH:MM"
 * @param {string} endTime - Format "HH:MM"
 * @returns {number} Dauer in Stunden (minimum 0.25 = 15min)
 */
export function calculateDurationSafe(startTime, endTime) {
  const validation = validateTimeRange(startTime, endTime);
  if (!validation.valid) {
    return 0.25; // Fallback auf 15 Minuten
  }

  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM - startH * 60 - startM) / 60;
}

/**
 * Snapped eine Zeit auf 15-Minuten-Intervalle
 * @param {string} time - Format "HH:MM"
 * @returns {string} Gesnappte Zeit im Format "HH:MM"
 */
export function snapTo15Minutes(time) {
  if (!time) return time;

  const [hours, minutes] = time.split(':').map(Number);
  const snappedMinutes = Math.round(minutes / 15) * 15;

  // Handle overflow (60 minutes -> next hour)
  const finalHours = snappedMinutes === 60 ? hours + 1 : hours;
  const finalMinutes = snappedMinutes === 60 ? 0 : snappedMinutes;

  return `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;
}
