/**
 * API: GET /api/lernplaene - Get all Lernpläne
 * API: POST /api/lernplaene - Create new Lernplan
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllLernplaene, saveLernplan } from '../lib/kv';
import { handleCors, sendSuccess, sendError, generateId, validateRequired } from '../lib/utils';
import type { Lernplan } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const lernplaene = await getAllLernplaene();
        return sendSuccess(res, lernplaene);
      }

      case 'POST': {
        const body = req.body as Partial<Lernplan>;

        const error = validateRequired(body as Record<string, unknown>, ['title']);
        if (error) return sendError(res, error);

        const newLernplan: Lernplan = {
          id: generateId(),
          title: body.title!,
          description: body.description || '',
          tags: body.tags || [],
          rechtsgebiet: body.rechtsgebiet || '',
          mode: body.mode || 'standard',
          examDate: body.examDate,
          archived: body.archived || false,
          chapters: body.chapters || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveLernplan(newLernplan);
        return sendSuccess(res, saved, 201);
      }

      default:
        return sendError(res, 'Method not allowed', 405);
    }
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
