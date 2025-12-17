/**
 * API: POST /api/wizard/complete - Complete wizard and create Lernplan with Slots
 *
 * This endpoint:
 * 1. Creates a new Lernplan from wizard data
 * 2. Generates slots based on wizard configuration
 * 3. Clears the wizard draft
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { saveLernplan, saveSlots, deleteWizardDraft } from '../lib/kv';
import { handleCors, sendSuccess, sendError, generateId, validateRequired } from '../lib/utils';
import type { Lernplan, Slot, WizardDraft, WeekStructure } from '../types';

interface CompleteWizardRequest {
  wizardData: WizardDraft;
  lernplanTitle: string;
  lernplanDescription?: string;
  rechtsgebiet?: string;
}

// German day names mapping
const WEEKDAYS: (keyof WeekStructure)[] = [
  'sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'
];

/**
 * Generate slots for the learning period based on wizard configuration
 */
function generateSlots(
  lernplanId: string,
  startDate: string,
  endDate: string,
  weekStructure: WeekStructure,
  blocksPerDay: number
): Slot[] {
  const slots: Slot[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date().toISOString();

  // Iterate through each day
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const dayName = WEEKDAYS[dayOfWeek];
    const dateStr = d.toISOString().split('T')[0];

    // Check if this day is a learning day
    const isLearningDay = weekStructure[dayName];

    // Create 3 slots per day (our fixed slot system)
    for (let position = 1; position <= 3; position++) {
      const slot: Slot = {
        id: `${dateStr}-${position}`,
        date: dateStr,
        position: position as 1 | 2 | 3,
        status: isLearningDay ? 'empty' : 'free',
        blockType: isLearningDay ? undefined : 'free',
        isLocked: false,
        createdAt: now,
        updatedAt: now,
      };

      // Mark extra slots as free if blocksPerDay < 3
      if (isLearningDay && position > blocksPerDay) {
        slot.status = 'free';
        slot.blockType = 'free';
      }

      slots.push(slot);
    }
  }

  return slots;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405);
  }

  try {
    const body = req.body as CompleteWizardRequest;

    const error = validateRequired(body as Record<string, unknown>, ['wizardData', 'lernplanTitle']);
    if (error) return sendError(res, error);

    const { wizardData, lernplanTitle, lernplanDescription, rechtsgebiet } = body;

    // Validate wizard data
    if (!wizardData.startDate || !wizardData.endDate) {
      return sendError(res, 'Missing start or end date in wizard data', 400);
    }

    // Create the Lernplan
    const lernplanId = generateId();
    const now = new Date().toISOString();

    const lernplan: Lernplan = {
      id: lernplanId,
      title: lernplanTitle,
      description: lernplanDescription || '',
      tags: [],
      rechtsgebiet: rechtsgebiet || '',
      mode: wizardData.creationMethod === 'automatic' ? 'examen' : 'standard',
      examDate: undefined,
      archived: false,
      chapters: [],
      createdAt: now,
      updatedAt: now,
    };

    // Generate slots based on wizard configuration
    const slots = generateSlots(
      lernplanId,
      wizardData.startDate,
      wizardData.endDate,
      wizardData.weekStructure,
      wizardData.blocksPerDay
    );

    // Save Lernplan and Slots
    const savedLernplan = await saveLernplan(lernplan);
    const savedSlots = await saveSlots(lernplanId, slots);

    // Clear the wizard draft
    await deleteWizardDraft();

    return sendSuccess(res, {
      lernplan: savedLernplan,
      slots: savedSlots,
      slotsCount: savedSlots.length,
    }, 201);
  } catch (err) {
    console.error('API Error:', err);
    return sendError(res, 'Internal server error', 500);
  }
}
