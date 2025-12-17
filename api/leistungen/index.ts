/**
 * API: GET /api/leistungen - Get all Leistungen/Prüfungen
 * API: POST /api/leistungen - Create new Leistung
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAllLeistungen, saveLeistung } from '../lib/kv';
import { handleCors, sendSuccess, sendError, generateId, validateRequired } from '../lib/utils';
import type { Leistung } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const leistungen = await getAllLeistungen();
        return sendSuccess(res, leistungen);
      }

      case 'POST': {
        const body = req.body as Partial<Leistung>;

        const error = validateRequired(body as Record<string, unknown>, ['title', 'subject', 'date']);
        if (error) return sendError(res, error);

        const newLeistung: Leistung = {
          id: generateId(),
          title: body.title!,
          subject: body.subject!,
          description: body.description,
          date: body.date!,
          time: body.time,
          ects: body.ects || 0,
          grade: body.grade ?? null,
          status: body.status || 'angemeldet',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const saved = await saveLeistung(newLeistung);
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
