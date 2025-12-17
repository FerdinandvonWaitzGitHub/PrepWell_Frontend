/**
 * API: GET /api/aufgaben - Get all Aufgaben
 * API: POST /api/aufgaben - Create new Aufgabe
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllAufgaben, saveAufgabe } from '../lib/kv';
import { handleCors, sendSuccess, sendError, generateId, validateRequired } from '../lib/utils';
import type { Aufgabe } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const aufgaben = await getAllAufgaben();
        return sendSuccess(res, aufgaben);
      }

      case 'POST': {
        const body = req.body as Partial<Aufgabe>;

        const error = validateRequired(body as Record<string, unknown>, ['title', 'subject']);
        if (error) return sendError(res, error);

        const newAufgabe: Aufgabe = {
          id: generateId(),
          subject: body.subject!,
          title: body.title!,
          description: body.description || '',
          lernplanthema: body.lernplanthema,
          lernblock: body.lernblock,
          priority: body.priority || 'medium',
          status: body.status || 'unerledigt',
          date: body.date || new Date().toISOString().split('T')[0],
          lernplanId: body.lernplanId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveAufgabe(newAufgabe);
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
