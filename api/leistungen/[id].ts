/**
 * API: GET /api/leistungen/[id] - Get single Leistung
 * API: PUT /api/leistungen/[id] - Update Leistung
 * API: DELETE /api/leistungen/[id] - Delete Leistung
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLeistung, saveLeistung, deleteLeistung } from '../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString } from '../lib/utils';
import type { Leistung } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const id = getQueryString(req.query, 'id');
  if (!id) {
    return sendError(res, 'Missing id parameter', 400);
  }

  try {
    switch (req.method) {
      case 'GET': {
        const leistung = await getLeistung(id);
        if (!leistung) {
          return sendError(res, 'Leistung not found', 404);
        }
        return sendSuccess(res, leistung);
      }

      case 'PUT': {
        const existing = await getLeistung(id);
        if (!existing) {
          return sendError(res, 'Leistung not found', 404);
        }

        const body = req.body as Partial<Leistung>;
        const updated: Leistung = {
          ...existing,
          ...body,
          id, // Ensure ID doesn't change
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveLeistung(updated);
        return sendSuccess(res, saved);
      }

      case 'DELETE': {
        const leistung = await getLeistung(id);
        if (!leistung) {
          return sendError(res, 'Leistung not found', 404);
        }

        await deleteLeistung(id);
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
