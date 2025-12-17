/**
 * API: GET /api/wizard/draft - Get wizard draft
 * API: PUT /api/wizard/draft - Save wizard draft
 * API: DELETE /api/wizard/draft - Clear wizard draft
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getWizardDraft, saveWizardDraft, deleteWizardDraft } from '../lib/kv';
import { handleCors, sendSuccess, sendError } from '../lib/utils';
import type { WizardDraft } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  try {
    switch (req.method) {
      case 'GET': {
        const draft = await getWizardDraft();
        return sendSuccess(res, draft);
      }

      case 'PUT': {
        const body = req.body as WizardDraft;
        const saved = await saveWizardDraft(body);
        return sendSuccess(res, saved);
      }

      case 'DELETE': {
        await deleteWizardDraft();
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
