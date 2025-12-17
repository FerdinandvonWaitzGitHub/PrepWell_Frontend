/**
 * API: GET /api/unterrechtsgebiete - Get all Unterrechtsgebiete
 * API: POST /api/unterrechtsgebiete - Add new Unterrechtsgebiet
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllUnterrechtsgebiete, addUnterrechtsgebiet } from '../lib/kv';
import { handleCors, sendSuccess, sendError, generateId, validateRequired } from '../lib/utils';
import type { Unterrechtsgebiet } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const gebiete = await getAllUnterrechtsgebiete();
        return sendSuccess(res, gebiete);
      }

      case 'POST': {
        const body = req.body as Partial<Unterrechtsgebiet>;

        const error = validateRequired(body as Record<string, unknown>, ['name', 'rechtsgebiet']);
        if (error) return sendError(res, error);

        const newGebiet: Unterrechtsgebiet = {
          id: generateId(),
          name: body.name!,
          rechtsgebiet: body.rechtsgebiet!,
          createdAt: new Date().toISOString(),
        };

        const gebiete = await addUnterrechtsgebiet(newGebiet);
        return sendSuccess(res, gebiete, 201);
      }

      default:
        return sendError(res, 'Method not allowed', 405);
    }
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
