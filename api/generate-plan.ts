import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function: Generate Learning Plan with AI
 *
 * This integrates the core logic from Agent3 directly into PrepWell,
 * eliminating the need for external service calls and data conversion.
 *
 * POST /api/generate-plan
 */

// Types
interface WizardData {
  startDate: string;
  endDate: string;
  bufferDays: number;
  vacationDays: number;
  blocksPerDay: number;
  weekStructure: Record<string, boolean>;
  unterrechtsgebieteOrder: Array<{
    id: string;
    name: string;
    rechtsgebiet: string;
    kategorie?: string;
    color: string;
  }>;
}

interface LearningDay {
  id: string;
  subject: string;
  rechtsgebiet: string;
  color: string;
  theme: string;
  blocks: number;
  kategorie?: string;
  date?: string;
}

interface GeneratePlanResponse {
  success: boolean;
  learningDays: LearningDay[];
  totalDays: number;
  metadata?: {
    totalCalendarDays: number;
    activeLearningDays: number;
    netLearningDays: number;
    subjectsCount: number;
  };
  source: 'ai' | 'fallback';
  message?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to set CORS headers on response
function setCorsHeaders(res: VercelResponse): void {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Build the prompt for OpenAI to generate a learning plan
 */
function buildPrompt(data: WizardData): string {
  const {
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    unterrechtsgebieteOrder,
  } = data;

  // Calculate dates and days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalCalendarDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Get active weekdays
  const weekdayNames: Record<string, string> = {
    montag: 'Montag',
    dienstag: 'Dienstag',
    mittwoch: 'Mittwoch',
    donnerstag: 'Donnerstag',
    freitag: 'Freitag',
    samstag: 'Samstag',
    sonntag: 'Sonntag',
  };

  const activeWeekdays = Object.entries(weekStructure)
    .filter(([_, active]) => active)
    .map(([day]) => weekdayNames[day])
    .join(', ');

  // Group subjects by Rechtsgebiet
  const subjectsByRechtsgebiet: Record<string, string[]> = {};
  unterrechtsgebieteOrder.forEach((item) => {
    const rg = item.rechtsgebiet || 'Sonstige';
    if (!subjectsByRechtsgebiet[rg]) {
      subjectsByRechtsgebiet[rg] = [];
    }
    subjectsByRechtsgebiet[rg].push(item.name);
  });

  const subjectList = unterrechtsgebieteOrder
    .map((item, index) => `${index + 1}. ${item.name} (${item.rechtsgebiet})`)
    .join('\n');

  const rechtsgebietSummary = Object.entries(subjectsByRechtsgebiet)
    .map(([rg, subjects]) => `- ${rg}: ${subjects.length} Themen`)
    .join('\n');

  return `Du bist ein Experte für Jura-Examensvorbereitungen in Deutschland. Erstelle einen optimalen Lernplan basierend auf folgenden Parametern:

## Lernzeitraum
- Start: ${startDate}
- Ende: ${endDate}
- Kalendertage gesamt: ${totalCalendarDays}
- Puffertage: ${bufferDays}
- Urlaubstage: ${vacationDays}
- Netto verfügbare Lerntage: ca. ${Math.round(totalCalendarDays * 0.7) - bufferDays - vacationDays}

## Wochenstruktur
- Aktive Lerntage: ${activeWeekdays}
- Lernblöcke pro Tag: ${blocksPerDay}

## Zu bearbeitende Unterrechtsgebiete (in Prioritätsreihenfolge)
${subjectList}

## Verteilung nach Rechtsgebieten
${rechtsgebietSummary}

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

Generiere ca. ${Math.round((totalCalendarDays * 0.7) - bufferDays - vacationDays)} Lerntage.`;
}

/**
 * Parse AI response into LearningDay array
 */
function parseAIResponse(
  response: string,
  unterrechtsgebieteOrder: WizardData['unterrechtsgebieteOrder'],
  blocksPerDay: number
): LearningDay[] {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    // Map to LearningDay format with colors
    const colorMap: Record<string, string> = {
      'oeffentliches-recht': 'bg-green-500',
      'zivilrecht': 'bg-blue-500',
      'strafrecht': 'bg-red-500',
      'querschnitt': 'bg-purple-500',
    };

    return parsed.map((item, index) => {
      // Try to find matching subject for additional data
      const matchingSubject = unterrechtsgebieteOrder.find(
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

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY ist nicht konfiguriert');
  }

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

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Local fallback when AI is not available
 */
function generateLocalFallback(data: WizardData): GeneratePlanResponse {
  const {
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    unterrechtsgebieteOrder,
  } = data;

  // Calculate available learning days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalCalendarDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  // Count active weekdays
  const weekdayMap: Record<number, string> = {
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

  // Generate learning days
  const subjects = unterrechtsgebieteOrder.length > 0
    ? unterrechtsgebieteOrder
    : [{ id: 'default-1', name: 'Grundlagen', color: 'bg-gray-500', rechtsgebiet: '' }];

  const learningDays: LearningDay[] = [];

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
          kategorie: (subject as any).kategorie || '',
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

/**
 * Main handler
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const wizardData = req.body as WizardData;

    // Validate required fields
    if (!wizardData.startDate || !wizardData.endDate) {
      setCorsHeaders(res);
      res.status(400).json({
        success: false,
        error: 'startDate und endDate sind erforderlich',
      });
      return;
    }

    // Check if OpenAI is configured
    const useAI = !!process.env.OPENAI_API_KEY;

    if (useAI) {
      try {
        // Build prompt and call OpenAI
        const prompt = buildPrompt(wizardData);
        const aiResponse = await callOpenAI(prompt);

        // Parse response
        const learningDays = parseAIResponse(
          aiResponse,
          wizardData.unterrechtsgebieteOrder,
          wizardData.blocksPerDay
        );

        // Calculate metadata
        const start = new Date(wizardData.startDate);
        const end = new Date(wizardData.endDate);
        const totalCalendarDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

        setCorsHeaders(res);
        res.status(200).json({
          success: true,
          learningDays,
          totalDays: learningDays.length,
          metadata: {
            totalCalendarDays,
            activeLearningDays: learningDays.length + wizardData.bufferDays + wizardData.vacationDays,
            netLearningDays: learningDays.length,
            subjectsCount: wizardData.unterrechtsgebieteOrder.length,
          },
          source: 'ai',
        } as GeneratePlanResponse);
      } catch (aiError) {
        console.error('AI generation failed, using fallback:', aiError);
        // Fall back to local generation
        const fallbackResult = generateLocalFallback(wizardData);
        fallbackResult.message = `KI-Fehler: ${(aiError as Error).message}. Lokaler Fallback verwendet.`;
        setCorsHeaders(res);
        res.status(200).json(fallbackResult);
      }
    } else {
      // No API key configured, use fallback
      const fallbackResult = generateLocalFallback(wizardData);
      setCorsHeaders(res);
      res.status(200).json(fallbackResult);
    }
  } catch (error) {
    console.error('Generate plan error:', error);
    setCorsHeaders(res);
    res.status(500).json({
      success: false,
      error: (error as Error).message || 'Interner Serverfehler',
    });
  }
}
