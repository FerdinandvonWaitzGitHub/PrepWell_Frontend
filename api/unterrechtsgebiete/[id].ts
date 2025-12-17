/**
 * API: DELETE /api/unterrechtsgebiete/[id] - Delete Unterrechtsgebiet
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteUnterrechtsgebiet } from '../lib/kv';
import { handleCors, sendSuccess, sendError, getQueryString } from '../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'DELETE') {
    return sendError(res, 'Method not allowed', 405);
  }

  const id = getQueryString(req.query, 'id');
  if (!id) {
    return sendError(res, 'Missing id parameter', 400);
  }

  try {
    const gebiete = await deleteUnterrechtsgebiet(id);
    return sendSuccess(res, gebiete);
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
