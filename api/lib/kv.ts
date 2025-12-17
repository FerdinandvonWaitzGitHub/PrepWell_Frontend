/**
 * Vercel KV Utility
 * Handles all database operations with Vercel KV
 */

import { kv } from '@vercel/kv';
import type {
  Lernplan,
  Slot,
  Aufgabe,
  Leistung,
  WizardDraft,
  Unterrechtsgebiet
} from '../types';

// ============================================
// KEY PREFIXES
// ============================================

const KEYS = {
  LERNPLAENE: 'lernplaene',
  LERNPLAN: (id: string) => `lernplan:${id}`,
  SLOTS: (lernplanId: string) => `slots:${lernplanId}`,
  AUFGABEN: 'aufgaben',
  AUFGABE: (id: string) => `aufgabe:${id}`,
  LEISTUNGEN: 'leistungen',
  LEISTUNG: (id: string) => `leistung:${id}`,
  WIZARD_DRAFT: 'wizard:draft',
  UNTERRECHTSGEBIETE: 'unterrechtsgebiete',
} as const;

// ============================================
// LERNPLÄNE
// ============================================

export async function getAllLernplaene(): Promise<Lernplan[]> {
  const ids = await kv.smembers(KEYS.LERNPLAENE);
  if (!ids || ids.length === 0) return [];

  const lernplaene = await Promise.all(
    ids.map(id => kv.get<Lernplan>(KEYS.LERNPLAN(id as string)))
  );

  return lernplaene.filter((lp): lp is Lernplan => lp !== null);
}

export async function getLernplan(id: string): Promise<Lernplan | null> {
  return kv.get<Lernplan>(KEYS.LERNPLAN(id));
}

export async function saveLernplan(lernplan: Lernplan): Promise<Lernplan> {
  const now = new Date().toISOString();
  const toSave = {
    ...lernplan,
    updatedAt: now,
    createdAt: lernplan.createdAt || now,
  };

  await kv.set(KEYS.LERNPLAN(lernplan.id), toSave);
  await kv.sadd(KEYS.LERNPLAENE, lernplan.id);

  return toSave;
}

export async function deleteLernplan(id: string): Promise<void> {
  await kv.del(KEYS.LERNPLAN(id));
  await kv.srem(KEYS.LERNPLAENE, id);
  // Also delete associated slots
  await kv.del(KEYS.SLOTS(id));
}

// ============================================
// KALENDER SLOTS
// ============================================

export async function getSlots(lernplanId: string): Promise<Slot[]> {
  const slots = await kv.get<Slot[]>(KEYS.SLOTS(lernplanId));
  return slots || [];
}

export async function saveSlots(lernplanId: string, slots: Slot[]): Promise<Slot[]> {
  const now = new Date().toISOString();
  const toSave = slots.map(slot => ({
    ...slot,
    updatedAt: now,
    createdAt: slot.createdAt || now,
  }));

  await kv.set(KEYS.SLOTS(lernplanId), toSave);
  return toSave;
}

export async function updateSlot(lernplanId: string, slot: Slot): Promise<Slot[]> {
  const slots = await getSlots(lernplanId);
  const index = slots.findIndex(s => s.id === slot.id);

  const now = new Date().toISOString();
  const updatedSlot = { ...slot, updatedAt: now };

  if (index >= 0) {
    slots[index] = updatedSlot;
  } else {
    slots.push({ ...updatedSlot, createdAt: now });
  }

  await kv.set(KEYS.SLOTS(lernplanId), slots);
  return slots;
}

// ============================================
// AUFGABEN
// ============================================

export async function getAllAufgaben(): Promise<Aufgabe[]> {
  const ids = await kv.smembers(KEYS.AUFGABEN);
  if (!ids || ids.length === 0) return [];

  const aufgaben = await Promise.all(
    ids.map(id => kv.get<Aufgabe>(KEYS.AUFGABE(id as string)))
  );

  return aufgaben.filter((a): a is Aufgabe => a !== null);
}

export async function getAufgabe(id: string): Promise<Aufgabe | null> {
  return kv.get<Aufgabe>(KEYS.AUFGABE(id));
}

export async function saveAufgabe(aufgabe: Aufgabe): Promise<Aufgabe> {
  const now = new Date().toISOString();
  const toSave = {
    ...aufgabe,
    updatedAt: now,
    createdAt: aufgabe.createdAt || now,
  };

  await kv.set(KEYS.AUFGABE(aufgabe.id), toSave);
  await kv.sadd(KEYS.AUFGABEN, aufgabe.id);

  return toSave;
}

export async function deleteAufgabe(id: string): Promise<void> {
  await kv.del(KEYS.AUFGABE(id));
  await kv.srem(KEYS.AUFGABEN, id);
}

// ============================================
// LEISTUNGEN
// ============================================

export async function getAllLeistungen(): Promise<Leistung[]> {
  const ids = await kv.smembers(KEYS.LEISTUNGEN);
  if (!ids || ids.length === 0) return [];

  const leistungen = await Promise.all(
    ids.map(id => kv.get<Leistung>(KEYS.LEISTUNG(id as string)))
  );

  return leistungen.filter((l): l is Leistung => l !== null);
}

export async function getLeistung(id: string): Promise<Leistung | null> {
  return kv.get<Leistung>(KEYS.LEISTUNG(id));
}

export async function saveLeistung(leistung: Leistung): Promise<Leistung> {
  const now = new Date().toISOString();
  const toSave = {
    ...leistung,
    updatedAt: now,
    createdAt: leistung.createdAt || now,
  };

  await kv.set(KEYS.LEISTUNG(leistung.id), toSave);
  await kv.sadd(KEYS.LEISTUNGEN, leistung.id);

  return toSave;
}

export async function deleteLeistung(id: string): Promise<void> {
  await kv.del(KEYS.LEISTUNG(id));
  await kv.srem(KEYS.LEISTUNGEN, id);
}

// ============================================
// WIZARD DRAFT
// ============================================

export async function getWizardDraft(): Promise<WizardDraft | null> {
  return kv.get<WizardDraft>(KEYS.WIZARD_DRAFT);
}

export async function saveWizardDraft(draft: WizardDraft): Promise<WizardDraft> {
  const toSave = {
    ...draft,
    lastModified: new Date().toISOString(),
  };

  await kv.set(KEYS.WIZARD_DRAFT, toSave);
  return toSave;
}

export async function deleteWizardDraft(): Promise<void> {
  await kv.del(KEYS.WIZARD_DRAFT);
}

// ============================================
// UNTERRECHTSGEBIETE
// ============================================

export async function getAllUnterrechtsgebiete(): Promise<Unterrechtsgebiet[]> {
  const gebiete = await kv.get<Unterrechtsgebiet[]>(KEYS.UNTERRECHTSGEBIETE);
  return gebiete || [];
}

export async function saveUnterrechtsgebiete(gebiete: Unterrechtsgebiet[]): Promise<Unterrechtsgebiet[]> {
  await kv.set(KEYS.UNTERRECHTSGEBIETE, gebiete);
  return gebiete;
}

export async function addUnterrechtsgebiet(gebiet: Unterrechtsgebiet): Promise<Unterrechtsgebiet[]> {
  const gebiete = await getAllUnterrechtsgebiete();
  const now = new Date().toISOString();
  gebiete.push({ ...gebiet, createdAt: now });
  await kv.set(KEYS.UNTERRECHTSGEBIETE, gebiete);
  return gebiete;
}

export async function deleteUnterrechtsgebiet(id: string): Promise<Unterrechtsgebiet[]> {
  const gebiete = await getAllUnterrechtsgebiete();
  const filtered = gebiete.filter(g => g.id !== id);
  await kv.set(KEYS.UNTERRECHTSGEBIETE, filtered);
  return filtered;
}
