/**
 * API: GET /api/kalender/[lernplanId]/slots - Get all slots for a Lernplan
 * API: PUT /api/kalender/[lernplanId]/slots - Update all slots for a Lernplan
 * API: POST /api/kalender/[lernplanId]/slots - Add/Update single slot
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSlots, saveSlots, updateSlot, getLernplan } from '../../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString, generateId } from '../../lib/utils';
import type { Slot } from '../../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

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

    switch (req.method) {
      case 'GET': {
        const slots = await getSlots(lernplanId);
        return sendSuccess(res, slots);
      }

      case 'PUT': {
        // Replace all slots
        const body = req.body as Slot[];
        if (!Array.isArray(body)) {
          return sendError(res, 'Body must be an array of slots', 400);
        }

        const saved = await saveSlots(lernplanId, body);
        return sendSuccess(res, saved);
      }

      case 'POST': {
        // Add or update single slot
        const slot = req.body as Partial<Slot>;

        if (!slot.date || !slot.position) {
          return sendError(res, 'Missing required fields: date, position', 400);
        }

        const newSlot: Slot = {
          id: slot.id || `${slot.date}-${slot.position}`,
          date: slot.date,
          position: slot.position as 1 | 2 | 3,
          status: slot.status || 'empty',
          topicId: slot.topicId,
          topicTitle: slot.topicTitle,
          blockType: slot.blockType,
          groupId: slot.groupId,
          groupSize: slot.groupSize,
          groupIndex: slot.groupIndex,
          progress: slot.progress,
          description: slot.description,
          isLocked: slot.isLocked || false,
          createdAt: slot.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const slots = await updateSlot(lernplanId, newSlot);
        return sendSuccess(res, slots, 201);
      }

      default:
        return sendError(res, 'Method not allowed', 405);
    }
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
