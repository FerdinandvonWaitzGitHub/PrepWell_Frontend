/**
 * API: POST /api/kalender/[lernplanId]/slots/bulk - Bulk create/update slots
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSlots, saveSlots, getLernplan } from '../../../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString } from '../../../lib/utils';
import type { Slot } from '../../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  const lernplanId = getQueryString(req.query, 'lernplanId');
  if (!lernplanId) {
    return sendError(res, 'Missing lernplanId parameter', 400);
  }

  try {
    // Verify lernplan exists
    const lernplan = await getLernplan(lernplanId);
    if (!lernplan) {
      return sendError(res, 'Lernplan not found', 404);
    }

    const newSlots = req.body as Slot[];
    if (!Array.isArray(newSlots)) {
      return sendError(res, 'Body must be an array of slots', 400);
    }

    // Get existing slots
    const existingSlots = await getSlots(lernplanId);

    // Create a map of existing slots by ID
    const slotsMap = new Map<string, Slot>();
    existingSlots.forEach(slot => slotsMap.set(slot.id, slot));

    // Update or add new slots
    const now = new Date().toISOString();
    newSlots.forEach(slot => {
      const existing = slotsMap.get(slot.id);
      slotsMap.set(slot.id, {
        ...slot,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      });
    });

    // Save all slots
    const allSlots = Array.from(slotsMap.values());
    const saved = await saveSlots(lernplanId, allSlots);

    return sendSuccess(res, saved, 201);
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
