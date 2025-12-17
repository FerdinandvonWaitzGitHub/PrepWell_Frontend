/**
 * API: GET /api/aufgaben/[id] - Get single Aufgabe
 * API: PUT /api/aufgaben/[id] - Update Aufgabe
 * API: DELETE /api/aufgaben/[id] - Delete Aufgabe
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAufgabe, saveAufgabe, deleteAufgabe } from '../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString } from '../lib/utils';
import type { Aufgabe } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const id = getQueryString(req.query, 'id');
  if (!id) {
    return sendError(res, 'Missing id parameter', 400);
  }

  try {
    switch (req.method) {
      case 'GET': {
        const aufgabe = await getAufgabe(id);
        if (!aufgabe) {
          return sendError(res, 'Aufgabe not found', 404);
        }
        return sendSuccess(res, aufgabe);
      }

      case 'PUT': {
        const existing = await getAufgabe(id);
        if (!existing) {
          return sendError(res, 'Aufgabe not found', 404);
        }

        const body = req.body as Partial<Aufgabe>;
        const updated: Aufgabe = {
          ...existing,
          ...body,
          id, // Ensure ID doesn't change
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveAufgabe(updated);
        return sendSuccess(res, saved);
      }

      case 'DELETE': {
        const aufgabe = await getAufgabe(id);
        if (!aufgabe) {
          return sendError(res, 'Aufgabe not found', 404);
        }

        await deleteAufgabe(id);
        return sendSuccess(res, { deleted: true });
      }

      default:
        return sendError(res, 'Method not allowed', 405);
    }
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
