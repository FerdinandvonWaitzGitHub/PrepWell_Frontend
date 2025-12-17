/**
 * API: GET /api/lernplaene/[id] - Get single Lernplan
 * API: PUT /api/lernplaene/[id] - Update Lernplan
 * API: DELETE /api/lernplaene/[id] - Delete Lernplan
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLernplan, saveLernplan, deleteLernplan } from '../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString } from '../lib/utils';
import type { Lernplan } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const id = getQueryString(req.query, 'id');
  if (!id) {
    return sendError(res, 'Missing id parameter', 400);
  }

  try {
    switch (req.method) {
      case 'GET': {
        const lernplan = await getLernplan(id);
        if (!lernplan) {
          return sendError(res, 'Lernplan not found', 404);
        }
        return sendSuccess(res, lernplan);
      }

      case 'PUT': {
        const existing = await getLernplan(id);
        if (!existing) {
          return sendError(res, 'Lernplan not found', 404);
        }

        const body = req.body as Partial<Lernplan>;
        const updated: Lernplan = {
          ...existing,
          ...body,
          id, // Ensure ID doesn't change
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveLernplan(updated);
        return sendSuccess(res, saved);
      }

      case 'DELETE': {
        const lernplan = await getLernplan(id);
        if (!lernplan) {
          return sendError(res, 'Lernplan not found', 404);
        }

        await deleteLernplan(id);
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
