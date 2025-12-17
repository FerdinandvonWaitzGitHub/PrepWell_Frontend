# PrepWell Backend Setup Guide

## Übersicht

Das Backend verwendet **Vercel Serverless Functions** mit **Vercel KV** (Redis) für die Datenpersistenz.

## Architektur

```
api/
├── types.ts                    # Shared TypeScript Types
├── lib/
│   ├── kv.ts                   # Vercel KV Database Operations
│   └── utils.ts                # Helper Functions
├── generate-plan.ts            # POST /api/generate-plan (KI-Integration)
├── lernplaene/
│   ├── index.ts                # GET/POST /api/lernplaene
│   └── [id].ts                 # GET/PUT/DELETE /api/lernplaene/:id
├── kalender/
│   └── [lernplanId]/
│       ├── slots.ts            # GET/PUT/POST /api/kalender/:id/slots
│       └── slots/
│           └── bulk.ts         # POST /api/kalender/:id/slots/bulk
├── aufgaben/
│   ├── index.ts                # GET/POST /api/aufgaben
│   └── [id].ts                 # GET/PUT/DELETE /api/aufgaben/:id
├── leistungen/
│   ├── index.ts                # GET/POST /api/leistungen
│   └── [id].ts                 # GET/PUT/DELETE /api/leistungen/:id
├── wizard/
│   ├── draft.ts                # GET/PUT/DELETE /api/wizard/draft
│   └── complete.ts             # POST /api/wizard/complete
└── unterrechtsgebiete/
    ├── index.ts                # GET/POST /api/unterrechtsgebiete
    └── [id].ts                 # DELETE /api/unterrechtsgebiete/:id
```

## Setup Schritte

### 1. Vercel KV einrichten

1. Gehe zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Wähle dein Projekt
3. Gehe zu **Storage** → **Create Database**
4. Wähle **KV** (Redis)
5. Erstelle die Datenbank (Free Tier: 30k Requests/Monat)

### 2. Environment Variables

Nach dem Erstellen von Vercel KV werden automatisch diese Variablen gesetzt:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**Für lokale Entwicklung:**

1. Lade die `.env` von Vercel:
```bash
vercel env pull .env.local
```

2. Oder erstelle `.env.local` manuell:
```env
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### 3. Deployment

```bash
# Deployen zu Vercel
vercel

# Oder für Production
vercel --prod
```

## API Endpoints

### Lernpläne

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/lernplaene` | Alle Lernpläne |
| POST | `/api/lernplaene` | Neuer Lernplan |
| GET | `/api/lernplaene/:id` | Einzelner Lernplan |
| PUT | `/api/lernplaene/:id` | Update Lernplan |
| DELETE | `/api/lernplaene/:id` | Löschen |

### Kalender/Slots

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/kalender/:lernplanId/slots` | Alle Slots |
| PUT | `/api/kalender/:lernplanId/slots` | Alle Slots ersetzen |
| POST | `/api/kalender/:lernplanId/slots` | Einzelnen Slot updaten |
| POST | `/api/kalender/:lernplanId/slots/bulk` | Bulk Update |

### Aufgaben

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/aufgaben` | Alle Aufgaben |
| POST | `/api/aufgaben` | Neue Aufgabe |
| GET | `/api/aufgaben/:id` | Einzelne Aufgabe |
| PUT | `/api/aufgaben/:id` | Update |
| DELETE | `/api/aufgaben/:id` | Löschen |

### Leistungen

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/leistungen` | Alle Leistungen |
| POST | `/api/leistungen` | Neue Leistung |
| GET | `/api/leistungen/:id` | Einzelne Leistung |
| PUT | `/api/leistungen/:id` | Update |
| DELETE | `/api/leistungen/:id` | Löschen |

### Wizard

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/wizard/draft` | Draft laden |
| PUT | `/api/wizard/draft` | Draft speichern |
| DELETE | `/api/wizard/draft` | Draft löschen |
| POST | `/api/wizard/complete` | Wizard abschließen |

### Unterrechtsgebiete

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/unterrechtsgebiete` | Alle Gebiete |
| POST | `/api/unterrechtsgebiete` | Neues Gebiet |
| DELETE | `/api/unterrechtsgebiete/:id` | Löschen |

## Frontend Integration

Das Frontend nutzt den API-Service in `src/services/api.js`:

```javascript
import { lernplaeneApi, kalenderApi, aufgabenApi } from '../services/api';

// Beispiel: Lernpläne laden
const lernplaene = await lernplaeneApi.getAll();

// Beispiel: Neuen Lernplan erstellen
const newPlan = await lernplaeneApi.create({
  title: 'Mein Lernplan',
  description: 'Beschreibung...',
  rechtsgebiet: 'zivilrecht'
});

// Beispiel: Slots laden
const slots = await kalenderApi.getSlots(lernplanId);
```

## KI-Integration (OpenAI)

Die KI-Lernplan-Generierung ist **direkt in PrepWell integriert** (kein externer Agent3-Service mehr nötig).

### Architektur

```
┌─────────────────────────────────────────────────────────┐
│                   PrepWell Frontend                     │
│                                                         │
│  Step 9 (Wizard)  →  agentApi.generateLernplan()       │
│                              │                          │
└──────────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────┐
│              /api/generate-plan.ts                      │
│                                                         │
│  ┌─────────────────────┐    ┌──────────────────────┐   │
│  │ OPENAI_API_KEY      │───▶│ OpenAI GPT-4o-mini   │   │
│  │ konfiguriert?       │    │ → KI-generierter     │   │
│  └─────────────────────┘    │    Lernplan          │   │
│           │ Nein            └──────────────────────┘   │
│           ▼                                            │
│  ┌─────────────────────┐                               │
│  │ Lokaler Fallback    │                               │
│  │ → Algorithmisch     │                               │
│  └─────────────────────┘                               │
└─────────────────────────────────────────────────────────┘
```

### Environment Variables für KI

```env
# .env.local oder Vercel Dashboard

# OpenAI API Key (optional - ohne Key wird lokaler Fallback genutzt)
OPENAI_API_KEY=sk-...

# OpenAI Model (optional, Standard: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini
```

### API Endpoint

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| POST | `/api/generate-plan` | Lernplan mit KI generieren |

**Request:**
```json
{
  "startDate": "2025-01-15",
  "endDate": "2025-06-30",
  "bufferDays": 10,
  "vacationDays": 14,
  "blocksPerDay": 3,
  "weekStructure": {
    "montag": true,
    "dienstag": true,
    "mittwoch": true,
    "donnerstag": true,
    "freitag": true,
    "samstag": false,
    "sonntag": false
  },
  "unterrechtsgebieteOrder": [
    { "id": "staatsorg", "name": "Staatsorganisationsrecht", "rechtsgebiet": "oeffentliches-recht", "color": "bg-green-500" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "learningDays": [
    { "id": "day-0", "subject": "Staatsorganisationsrecht", "theme": "Staatsorg - Teil 1", "blocks": 3, "color": "bg-green-500" }
  ],
  "totalDays": 85,
  "source": "ai",
  "metadata": {
    "totalCalendarDays": 166,
    "activeLearningDays": 109,
    "netLearningDays": 85,
    "subjectsCount": 15
  }
}
```

### Frontend Verwendung

```javascript
import { agentApi } from '../services/api';

// Lernplan generieren (nutzt KI wenn verfügbar)
const result = await agentApi.generateLernplan({
  startDate: '2025-01-01',
  endDate: '2025-06-30',
  bufferDays: 10,
  vacationDays: 14,
  blocksPerDay: 3,
  weekStructure: { montag: true, ... },
  unterrechtsgebieteOrder: [...]
});

if (result.success) {
  console.log(`${result.totalDays} Lerntage generiert (Quelle: ${result.source})`);
}
```

### KI-Prompt

Der Prompt ist speziell für **deutsche Jura-Examensvorbereitung** optimiert:
- Berücksichtigt Prioritätsreihenfolge der Unterrechtsgebiete
- Plant Wiederholungsphasen ein (~20%)
- Gruppiert thematisch zusammenhängende Gebiete
- Verteilt komplexere Themen auf mehr Tage

## Lokale Entwicklung

```bash
# Dependencies installieren
npm install

# Vercel CLI installieren (falls nicht vorhanden)
npm i -g vercel

# Mit Vercel verlinken
vercel link

# Environment Variables laden
vercel env pull .env.local

# Lokal starten mit Vercel Functions
vercel dev
```

## Troubleshooting

### API gibt 500 zurück
- Prüfe ob Vercel KV korrekt konfiguriert ist
- Prüfe die Logs: `vercel logs`

### CORS Fehler
- Die API setzt automatisch CORS-Header für alle Origins

### Daten nicht persistiert
- Prüfe ob KV_* Umgebungsvariablen gesetzt sind
- Free Tier hat Rate Limits (30k/Monat)

## Nächste Schritte

1. [ ] Vercel KV in Vercel Dashboard erstellen
2. [ ] `vercel env pull .env.local` ausführen
3. [ ] `vercel dev` zum Testen
4. [ ] `vercel --prod` für Production Deployment
