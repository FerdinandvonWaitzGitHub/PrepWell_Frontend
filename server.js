/**
 * Simple local development server for API endpoints
 * Runs alongside Vite without requiring Vercel authentication
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3010;

app.use(cors());
app.use(express.json());

// ============================================
// PERSISTENT FILE STORAGE
// ============================================
const DATA_DIR = path.join(__dirname, 'data');
const LERNPLAENE_FILE = path.join(DATA_DIR, 'lernplaene.json');
const SLOTS_FILE = path.join(DATA_DIR, 'slots.json');
const AUFGABEN_FILE = path.join(DATA_DIR, 'aufgaben.json');
const LEISTUNGEN_FILE = path.join(DATA_DIR, 'leistungen.json');
const WIZARD_DRAFT_FILE = path.join(DATA_DIR, 'wizard-draft.json');
const UNTERRECHTSGEBIETE_FILE = path.join(DATA_DIR, 'unterrechtsgebiete.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from file
function loadData(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error.message);
  }
  return defaultValue;
}

// Save data to file
function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error.message);
  }
}

// Generate unique ID
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize storage from files
const lernplaeneData = loadData(LERNPLAENE_FILE);
const slotsData = loadData(SLOTS_FILE);
const aufgabenData = loadData(AUFGABEN_FILE);
const leistungenData = loadData(LEISTUNGEN_FILE);
let wizardDraftData = loadData(WIZARD_DRAFT_FILE, null);
let unterrechtsgebieteData = loadData(UNTERRECHTSGEBIETE_FILE, []);

console.log(`📂 Geladene Lernpläne: ${Object.keys(lernplaeneData).length}`);
console.log(`📂 Geladene Slots: ${Object.keys(slotsData).length}`);
console.log(`📂 Geladene Aufgaben: ${Object.keys(aufgabenData).length}`);
console.log(`📂 Geladene Leistungen: ${Object.keys(leistungenData).length}`);
console.log(`📂 Wizard Draft: ${wizardDraftData ? 'vorhanden' : 'leer'}`);
console.log(`📂 Unterrechtsgebiete: ${unterrechtsgebieteData.length}`);

// ============================================
// HEALTH CHECK ENDPOINT (PW-019)
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    server: 'local-dev',
  });
});

// ============================================
// GENERATE PLAN ENDPOINT (OpenAI Integration)
// ============================================

app.post('/api/generate-plan', async (req, res) => {
  const wizardData = req.body;

  // Validate required fields
  if (!wizardData.startDate || !wizardData.endDate) {
    return res.status(400).json({
      success: false,
      error: 'startDate und endDate sind erforderlich',
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.includes('DEIN_API_KEY')) {
    console.log('No valid API key, using fallback');
    return res.json(generateLocalFallback(wizardData));
  }

  try {
    console.log('Calling OpenAI API...');
    const prompt = buildPrompt(wizardData);
    const aiResponse = await callOpenAI(prompt, apiKey);
    const learningDays = parseAIResponse(aiResponse, wizardData.unterrechtsgebieteOrder, wizardData.blocksPerDay);

    const start = new Date(wizardData.startDate);
    const end = new Date(wizardData.endDate);
    const totalCalendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    console.log(`Generated ${learningDays.length} learning days with AI`);

    res.json({
      success: true,
      learningDays,
      totalDays: learningDays.length,
      metadata: {
        totalCalendarDays,
        activeLearningDays: learningDays.length + wizardData.bufferDays + wizardData.vacationDays,
        netLearningDays: learningDays.length,
        subjectsCount: wizardData.unterrechtsgebieteOrder?.length || 0,
      },
      source: 'ai',
    });
  } catch (error) {
    console.error('AI generation failed:', error.message);
    const fallback = generateLocalFallback(wizardData);
    fallback.message = `KI-Fehler: ${error.message}. Lokaler Fallback verwendet.`;
    res.json(fallback);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildPrompt(data) {
  const {
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    unterrechtsgebieteOrder,
  } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalCalendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const weekdayNames = {
    montag: 'Montag',
    dienstag: 'Dienstag',
    mittwoch: 'Mittwoch',
    donnerstag: 'Donnerstag',
    freitag: 'Freitag',
    samstag: 'Samstag',
    sonntag: 'Sonntag',
  };

  const activeWeekdays = Object.entries(weekStructure || {})
    .filter(([_, active]) => active)
    .map(([day]) => weekdayNames[day])
    .join(', ');

  const subjectList = (unterrechtsgebieteOrder || [])
    .map((item, index) => `${index + 1}. ${item.name} (${item.rechtsgebiet})`)
    .join('\n');

  const netDays = Math.round((totalCalendarDays * 0.7) - bufferDays - vacationDays);

  return `Du bist ein Experte für Jura-Examensvorbereitungen in Deutschland. Erstelle einen optimalen Lernplan basierend auf folgenden Parametern:

## Lernzeitraum
- Start: ${startDate}
- Ende: ${endDate}
- Kalendertage gesamt: ${totalCalendarDays}
- Puffertage: ${bufferDays}
- Urlaubstage: ${vacationDays}
- Netto verfügbare Lerntage: ca. ${netDays}

## Wochenstruktur
- Aktive Lerntage: ${activeWeekdays}
- Lernblöcke pro Tag: ${blocksPerDay}

## Zu bearbeitende Unterrechtsgebiete (in Prioritätsreihenfolge)
${subjectList}

## Aufgabe
Erstelle einen strukturierten Lernplan, der:
1. Die Unterrechtsgebiete in der gegebenen Prioritätsreihenfolge bearbeitet
2. Komplexere Themen mehr Tage zuweist als einfachere
3. Thematisch zusammenhängende Gebiete gruppiert
4. Wiederholungsphasen einplant (ca. 20% der Zeit)

## Ausgabeformat (JSON)
Antworte NUR mit einem JSON-Array im folgenden Format, ohne zusätzlichen Text:
[
  {
    "subject": "Name des Unterrechtsgebiets",
    "theme": "Spezifisches Thema/Kapitel",
    "rechtsgebiet": "oeffentliches-recht|zivilrecht|strafrecht|querschnitt",
    "blocks": ${blocksPerDay},
    "isRepetition": false
  }
]

Generiere ca. ${netDays} Lerntage.`;
}

async function callOpenAI(prompt, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Experte für Jura-Examensvorbereitung in Deutschland. Antworte immer im angeforderten JSON-Format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);
    throw new Error(`OpenAI API Fehler: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseAIResponse(response, unterrechtsgebieteOrder, blocksPerDay) {
  try {
    let jsonStr = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    const colorMap = {
      'oeffentliches-recht': 'bg-green-500',
      'zivilrecht': 'bg-blue-500',
      'strafrecht': 'bg-red-500',
      'querschnitt': 'bg-purple-500',
    };

    return parsed.map((item, index) => {
      const matchingSubject = (unterrechtsgebieteOrder || []).find(
        (u) => u.name === item.subject || u.name.includes(item.subject) || item.subject.includes(u.name)
      );

      return {
        id: `day-${index}`,
        subject: item.subject || 'Unbekannt',
        rechtsgebiet: item.rechtsgebiet || matchingSubject?.rechtsgebiet || '',
        color: colorMap[item.rechtsgebiet] || matchingSubject?.color || 'bg-gray-500',
        theme: item.theme || item.subject || `Tag ${index + 1}`,
        blocks: item.blocks || blocksPerDay,
        kategorie: matchingSubject?.kategorie || '',
      };
    });
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('AI-Antwort konnte nicht verarbeitet werden');
  }
}

function generateLocalFallback(data) {
  const {
    startDate,
    endDate,
    bufferDays = 0,
    vacationDays = 0,
    blocksPerDay = 3,
    weekStructure = {},
    unterrechtsgebieteOrder = [],
  } = data;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalCalendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const weekdayMap = {
    0: 'sonntag', 1: 'montag', 2: 'dienstag', 3: 'mittwoch',
    4: 'donnerstag', 5: 'freitag', 6: 'samstag'
  };

  let activeLearningDays = 0;
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dayName = weekdayMap[currentDate.getDay()];
    if (weekStructure[dayName]) {
      activeLearningDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const netLearningDays = Math.max(0, activeLearningDays - bufferDays - vacationDays);

  const subjects = unterrechtsgebieteOrder.length > 0
    ? unterrechtsgebieteOrder
    : [{ id: 'default-1', name: 'Grundlagen', color: 'bg-gray-500', rechtsgebiet: '' }];

  const learningDays = [];

  if (subjects.length > 0 && netLearningDays > 0) {
    const daysPerSubject = Math.max(1, Math.floor(netLearningDays / subjects.length));
    const extraDays = netLearningDays % subjects.length;

    subjects.forEach((subject, subjectIndex) => {
      const subjectDays = daysPerSubject + (subjectIndex < extraDays ? 1 : 0);

      for (let i = 0; i < subjectDays; i++) {
        learningDays.push({
          id: `day-${subject.id}-${i}`,
          subject: subject.name,
          rechtsgebiet: subject.rechtsgebiet,
          color: subject.color || 'bg-gray-500',
          theme: subjectDays > 1 ? `${subject.name} - Teil ${i + 1}` : subject.name,
          blocks: blocksPerDay,
          kategorie: subject.kategorie || '',
        });
      }
    });
  }

  return {
    success: true,
    learningDays,
    totalDays: learningDays.length,
    metadata: {
      totalCalendarDays,
      activeLearningDays,
      netLearningDays,
      subjectsCount: subjects.length,
    },
    source: 'fallback',
    message: 'Lernplan lokal generiert (KI nicht verfügbar)',
  };
}

// ============================================
// WIZARD COMPLETE ENDPOINT
// ============================================

app.post('/api/wizard/complete', async (req, res) => {
  // PW-018 FIX: Handle both wrapped and flat payload formats
  // Frontend sends: { wizardData, lernplanTitle, lernplanDescription }
  // Fallback to req.body directly for backwards compatibility
  const wizardData = req.body.wizardData || req.body;
  const lernplanTitle = req.body.lernplanTitle || wizardData.title || 'Mein Lernplan';

  try {
    // Generiere eindeutige ID
    const lernplanId = `lp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const bufferDays = wizardData.bufferDays || 0;
    const vacationDays = wizardData.vacationDays || 0;
    const blocksPerDay = wizardData.blocksPerDay || 3;

    // Bestimme Rechtsgebiet basierend auf learningDaysOrder
    const learningDays = wizardData.learningDaysOrder || [];
    const rechtsgebiete = [...new Set(learningDays.map(d => d.rechtsgebiet).filter(Boolean))];
    const primaryRechtsgebiet = rechtsgebiete[0] || 'allgemein';

    // Konvertiere learningDays in chapters-Struktur für Frontend
    // Gruppiere nach subject (Unterrechtsgebiet) -> chapters
    // Gruppiere nach theme -> themes innerhalb chapters
    const chaptersMap = new Map();

    learningDays.forEach((day, dayIndex) => {
      const chapterKey = day.subject || 'Allgemein';

      if (!chaptersMap.has(chapterKey)) {
        chaptersMap.set(chapterKey, {
          id: `ch-${lernplanId}-${chaptersMap.size}`,
          title: chapterKey,
          rechtsgebiet: day.rechtsgebiet || '',
          color: day.color || 'bg-gray-500',
          themes: new Map(),
        });
      }

      const chapter = chaptersMap.get(chapterKey);
      const themeKey = day.theme || chapterKey;

      if (!chapter.themes.has(themeKey)) {
        chapter.themes.set(themeKey, {
          id: `th-${lernplanId}-${dayIndex}`,
          title: themeKey,
          tasks: [],
        });
      }

      const theme = chapter.themes.get(themeKey);

      // Erstelle Aufgaben basierend auf blocks
      const taskCount = day.blocks || blocksPerDay;
      for (let b = 0; b < taskCount; b++) {
        theme.tasks.push({
          id: `t-${lernplanId}-${dayIndex}-${b}`,
          title: `${themeKey} - Block ${b + 1}`,
          completed: false,
        });
      }
    });

    // Konvertiere Maps zu Arrays
    const chapters = Array.from(chaptersMap.values()).map(chapter => ({
      ...chapter,
      themes: Array.from(chapter.themes.values()),
    }));

    // Erstelle Lernplan-Objekt (kompatibel mit Frontend-Struktur)
    const lernplan = {
      id: lernplanId,
      title: lernplanTitle,
      description: `Lernplan vom ${new Date(wizardData.startDate).toLocaleDateString('de-DE')} bis ${new Date(wizardData.endDate).toLocaleDateString('de-DE')}`,
      tags: rechtsgebiete.map(r => r.charAt(0).toUpperCase() + r.slice(1).replace(/-/g, ' ')),
      rechtsgebiet: primaryRechtsgebiet,
      mode: 'examen',
      archived: false,
      // Wizard-spezifische Daten
      startDate: wizardData.startDate,
      endDate: wizardData.endDate,
      bufferDays,
      vacationDays,
      blocksPerDay,
      weekStructure: wizardData.weekStructure || {},
      creationMethod: wizardData.creationMethod || 'manual',
      selectedTemplate: wizardData.selectedTemplate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Kapitel-Struktur aus learningDays generiert
      chapters,
    };

    // Speichere Lernplan in Memory und Datei
    lernplaeneData[lernplanId] = lernplan;
    saveData(LERNPLAENE_FILE, lernplaeneData);

    // Erstelle Kalender-Slots aus learningDaysOrder
    const calendarSlots = [];

    // Berechne tatsächliche Lerntage basierend auf weekStructure
    const start = new Date(wizardData.startDate);
    const end = new Date(wizardData.endDate);
    const weekdayMap = {
      0: 'sonntag', 1: 'montag', 2: 'dienstag', 3: 'mittwoch',
      4: 'donnerstag', 5: 'freitag', 6: 'samstag'
    };

    // Sammle alle aktiven Lerntage im Zeitraum
    const activeDates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = weekdayMap[currentDate.getDay()];
      if (wizardData.weekStructure?.[dayName]) {
        activeDates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Berechne Netto-Lerntage (aktive Tage minus Puffer und Urlaub)
    const netLearningDays = Math.max(0, activeDates.length - bufferDays - vacationDays);

    console.log(`📊 Berechnung: ${activeDates.length} aktive Tage - ${bufferDays} Puffer - ${vacationDays} Urlaub = ${netLearningDays} Netto-Lerntage`);

    // Verteile learningDays zyklisch auf ALLE Netto-Lerntage
    // Wenn weniger Lerninhalte als Tage vorhanden sind, wiederholen wir sie
    if (learningDays.length > 0 && netLearningDays > 0) {
      for (let i = 0; i < netLearningDays; i++) {
        // Zyklisch durch die Lerninhalte iterieren
        const dayContent = learningDays[i % learningDays.length];
        const slotDate = activeDates[i];

        // Erstelle einen Slot für jeden Tag
        const slot = {
          id: `slot-${lernplanId}-${i}`,
          lernplanId,
          date: slotDate.toISOString().split('T')[0],
          subject: dayContent.subject,
          theme: dayContent.theme,
          rechtsgebiet: dayContent.rechtsgebiet,
          color: dayContent.color,
          blocks: blocksPerDay,
          completed: false,
          notes: '',
          // Markiere Wiederholungen
          cycleNumber: Math.floor(i / learningDays.length) + 1,
          isRepetition: i >= learningDays.length,
        };
        calendarSlots.push(slot);
      }
    }

    // Speichere Slots in Memory und Datei
    slotsData[lernplanId] = calendarSlots;
    saveData(SLOTS_FILE, slotsData);

    // Berechne Gesamtblöcke
    const totalBlocks = calendarSlots.length * blocksPerDay;

    console.log(`✅ Lernplan erstellt: ${lernplanId}`);
    console.log(`   📅 ${calendarSlots.length} Lerntage (von ${netLearningDays} Netto-Lerntagen)`);
    console.log(`   📦 ${totalBlocks} Lernblöcke (${calendarSlots.length} Tage × ${blocksPerDay} Blöcke)`);
    console.log(`   🔄 Lerninhalte: ${learningDays.length} Themen, ${Math.ceil(netLearningDays / learningDays.length)} Durchläufe`);

    // PW-018 FIX: Wrap response in data object for frontend compatibility
    // Manual flow expects: result.data?.lernplan?.id
    // Template flow expects: result.lernplanId (backwards compatibility)
    res.json({
      success: true,
      // Backwards compatibility (template flow reads these directly)
      lernplanId,
      lernplan,
      // New wrapped format (manual flow reads result.data)
      data: {
        storage: 'local',
        lernplanId,
        lernplan,
        slotsCount: calendarSlots.length,
        totalBlocks,
      },
      message: `Lernplan mit ${calendarSlots.length} Lerntagen und ${totalBlocks} Lernblöcken erstellt!`,
    });
  } catch (error) {
    console.error('Fehler beim Erstellen des Lernplans:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Lernplan konnte nicht erstellt werden',
    });
  }
});

// GET Lernplan by ID
app.get('/api/lernplaene/:id', (req, res) => {
  const { id } = req.params;
  const lernplan = lernplaeneData[id];

  if (!lernplan) {
    return res.status(404).json({
      success: false,
      error: 'Lernplan nicht gefunden',
    });
  }

  res.json({
    success: true,
    data: lernplan,
  });
});

// GET all Lernpläne
app.get('/api/lernplaene', (req, res) => {
  const allLernplaene = Object.values(lernplaeneData);
  res.json({
    success: true,
    data: allLernplaene,
  });
});

// POST - Create new Lernplan
app.post('/api/lernplaene', (req, res) => {
  const body = req.body;

  if (!body.title) {
    return res.status(400).json({
      success: false,
      error: 'Title ist erforderlich',
    });
  }

  const id = generateId();
  const now = new Date().toISOString();

  const newLernplan = {
    id,
    title: body.title,
    description: body.description || '',
    tags: body.tags || [],
    rechtsgebiet: body.rechtsgebiet || '',
    mode: body.mode || 'standard',
    examDate: body.examDate,
    archived: body.archived || false,
    chapters: body.chapters || [],
    createdAt: now,
    updatedAt: now,
  };

  lernplaeneData[id] = newLernplan;
  saveData(LERNPLAENE_FILE, lernplaeneData);

  res.status(201).json({
    success: true,
    data: newLernplan,
  });
});

// PUT - Update Lernplan
app.put('/api/lernplaene/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!lernplaeneData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Lernplan nicht gefunden',
    });
  }

  const updated = {
    ...lernplaeneData[id],
    ...body,
    id, // ID kann nicht geändert werden
    updatedAt: new Date().toISOString(),
  };

  lernplaeneData[id] = updated;
  saveData(LERNPLAENE_FILE, lernplaeneData);

  res.json({
    success: true,
    data: updated,
  });
});

// PW-017: /slots endpoints removed - CalendarContext uses Supabase directly via:
// - useCalendarBlocksSync() → calendar_blocks table (Month view, position-based)
// - useTimeSessionsSync() → time_sessions table (Week/Dashboard, time-based)
// - usePrivateSessionsSync() → private_sessions table (Private appointments)

// DELETE Lernplan
app.delete('/api/lernplaene/:id', (req, res) => {
  const { id } = req.params;

  if (!lernplaeneData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Lernplan nicht gefunden',
    });
  }

  // Lösche Lernplan und zugehörige Slots
  delete lernplaeneData[id];
  delete slotsData[id];

  // Speichere in Dateien
  saveData(LERNPLAENE_FILE, lernplaeneData);
  saveData(SLOTS_FILE, slotsData);

  res.json({
    success: true,
    message: 'Lernplan gelöscht',
  });
});

// ============================================
// AUFGABEN ENDPOINTS
// ============================================

// GET all Aufgaben
app.get('/api/aufgaben', (req, res) => {
  const allAufgaben = Object.values(aufgabenData);
  res.json({
    success: true,
    data: allAufgaben,
  });
});

// GET single Aufgabe
app.get('/api/aufgaben/:id', (req, res) => {
  const { id } = req.params;
  const aufgabe = aufgabenData[id];

  if (!aufgabe) {
    return res.status(404).json({
      success: false,
      error: 'Aufgabe nicht gefunden',
    });
  }

  res.json({
    success: true,
    data: aufgabe,
  });
});

// POST - Create Aufgabe
app.post('/api/aufgaben', (req, res) => {
  const body = req.body;

  if (!body.title || !body.subject) {
    return res.status(400).json({
      success: false,
      error: 'title und subject sind erforderlich',
    });
  }

  const id = generateId();
  const now = new Date().toISOString();

  const newAufgabe = {
    id,
    subject: body.subject,
    title: body.title,
    description: body.description || '',
    lernplanthema: body.lernplanthema,
    lernblock: body.lernblock,
    priority: body.priority || 'medium',
    status: body.status || 'unerledigt',
    date: body.date || now.split('T')[0],
    lernplanId: body.lernplanId,
    createdAt: now,
    updatedAt: now,
  };

  aufgabenData[id] = newAufgabe;
  saveData(AUFGABEN_FILE, aufgabenData);

  res.status(201).json({
    success: true,
    data: newAufgabe,
  });
});

// PUT - Update Aufgabe
app.put('/api/aufgaben/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!aufgabenData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Aufgabe nicht gefunden',
    });
  }

  const updated = {
    ...aufgabenData[id],
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  };

  aufgabenData[id] = updated;
  saveData(AUFGABEN_FILE, aufgabenData);

  res.json({
    success: true,
    data: updated,
  });
});

// DELETE Aufgabe
app.delete('/api/aufgaben/:id', (req, res) => {
  const { id } = req.params;

  if (!aufgabenData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Aufgabe nicht gefunden',
    });
  }

  delete aufgabenData[id];
  saveData(AUFGABEN_FILE, aufgabenData);

  res.json({
    success: true,
    data: { deleted: true },
  });
});

// ============================================
// LEISTUNGEN ENDPOINTS
// ============================================

// GET all Leistungen
app.get('/api/leistungen', (req, res) => {
  const allLeistungen = Object.values(leistungenData);
  res.json({
    success: true,
    data: allLeistungen,
  });
});

// GET single Leistung
app.get('/api/leistungen/:id', (req, res) => {
  const { id } = req.params;
  const leistung = leistungenData[id];

  if (!leistung) {
    return res.status(404).json({
      success: false,
      error: 'Leistung nicht gefunden',
    });
  }

  res.json({
    success: true,
    data: leistung,
  });
});

// POST - Create Leistung
app.post('/api/leistungen', (req, res) => {
  const body = req.body;

  if (!body.title || !body.subject || !body.date) {
    return res.status(400).json({
      success: false,
      error: 'title, subject und date sind erforderlich',
    });
  }

  const id = generateId();
  const now = new Date().toISOString();

  const newLeistung = {
    id,
    title: body.title,
    subject: body.subject,
    description: body.description,
    date: body.date,
    time: body.time,
    ects: body.ects || 0,
    grade: body.grade ?? null,
    status: body.status || 'angemeldet',
    createdAt: now,
    updatedAt: now,
  };

  leistungenData[id] = newLeistung;
  saveData(LEISTUNGEN_FILE, leistungenData);

  res.status(201).json({
    success: true,
    data: newLeistung,
  });
});

// PUT - Update Leistung
app.put('/api/leistungen/:id', (req, res) => {
  const { id } = req.params;
  const body = req.body;

  if (!leistungenData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Leistung nicht gefunden',
    });
  }

  const updated = {
    ...leistungenData[id],
    ...body,
    id,
    updatedAt: new Date().toISOString(),
  };

  leistungenData[id] = updated;
  saveData(LEISTUNGEN_FILE, leistungenData);

  res.json({
    success: true,
    data: updated,
  });
});

// DELETE Leistung
app.delete('/api/leistungen/:id', (req, res) => {
  const { id } = req.params;

  if (!leistungenData[id]) {
    return res.status(404).json({
      success: false,
      error: 'Leistung nicht gefunden',
    });
  }

  delete leistungenData[id];
  saveData(LEISTUNGEN_FILE, leistungenData);

  res.json({
    success: true,
    data: { deleted: true },
  });
});

// ============================================
// WIZARD DRAFT ENDPOINTS
// ============================================

// GET Wizard Draft
app.get('/api/wizard/draft', (req, res) => {
  res.json({
    success: true,
    data: wizardDraftData,
  });
});

// PUT - Save Wizard Draft
app.put('/api/wizard/draft', (req, res) => {
  const body = req.body;

  wizardDraftData = {
    ...body,
    lastModified: new Date().toISOString(),
  };

  saveData(WIZARD_DRAFT_FILE, wizardDraftData);

  res.json({
    success: true,
    data: wizardDraftData,
  });
});

// DELETE Wizard Draft
app.delete('/api/wizard/draft', (req, res) => {
  wizardDraftData = null;
  saveData(WIZARD_DRAFT_FILE, null);

  res.json({
    success: true,
    data: { deleted: true },
  });
});

// ============================================
// UNTERRECHTSGEBIETE ENDPOINTS
// ============================================

// GET all Unterrechtsgebiete
app.get('/api/unterrechtsgebiete', (req, res) => {
  res.json({
    success: true,
    data: unterrechtsgebieteData,
  });
});

// POST - Add Unterrechtsgebiet
app.post('/api/unterrechtsgebiete', (req, res) => {
  const body = req.body;

  if (!body.name || !body.rechtsgebiet) {
    return res.status(400).json({
      success: false,
      error: 'name und rechtsgebiet sind erforderlich',
    });
  }

  const newGebiet = {
    id: generateId(),
    name: body.name,
    rechtsgebiet: body.rechtsgebiet,
    createdAt: new Date().toISOString(),
  };

  unterrechtsgebieteData.push(newGebiet);
  saveData(UNTERRECHTSGEBIETE_FILE, unterrechtsgebieteData);

  res.status(201).json({
    success: true,
    data: unterrechtsgebieteData,
  });
});

// DELETE Unterrechtsgebiet
app.delete('/api/unterrechtsgebiete/:id', (req, res) => {
  const { id } = req.params;
  const index = unterrechtsgebieteData.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Unterrechtsgebiet nicht gefunden',
    });
  }

  unterrechtsgebieteData.splice(index, 1);
  saveData(UNTERRECHTSGEBIETE_FILE, unterrechtsgebieteData);

  res.json({
    success: true,
    data: unterrechtsgebieteData,
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`\n🚀 API Server läuft auf http://localhost:${PORT}`);
  console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Konfiguriert' : '❌ Nicht gefunden'}`);
  console.log(`   Model: ${process.env.OPENAI_MODEL || 'gpt-4o-mini'}`);
  console.log(`\n📋 Verfügbare Endpoints:`);
  console.log(`   GET/POST       /api/lernplaene`);
  console.log(`   GET/PUT/DELETE /api/lernplaene/:id`);
  console.log(`   GET/PUT/POST   /api/kalender/:lernplanId/slots`);
  console.log(`   POST           /api/kalender/:lernplanId/slots/bulk`);
  console.log(`   GET/POST       /api/aufgaben`);
  console.log(`   GET/PUT/DELETE /api/aufgaben/:id`);
  console.log(`   GET/POST       /api/leistungen`);
  console.log(`   GET/PUT/DELETE /api/leistungen/:id`);
  console.log(`   GET/PUT/DELETE /api/wizard/draft`);
  console.log(`   POST           /api/wizard/complete`);
  console.log(`   GET/POST       /api/unterrechtsgebiete`);
  console.log(`   DELETE         /api/unterrechtsgebiete/:id`);
  console.log(`   POST           /api/generate-plan\n`);
});
