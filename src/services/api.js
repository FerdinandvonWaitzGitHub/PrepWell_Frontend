/**
 * PrepWell API Service
 * Centralized API calls for all backend operations
 */

// API Base URL - uses relative path for same-origin deployment
const API_BASE = '/api';

// Local API server for development (runs on port 3010)
const LOCAL_API_BASE = 'http://localhost:3010/api';

// Check if we're in development mode
const isDev = import.meta.env.DEV;

// In dev mode, use local API server for KI generation
const USE_LOCAL_API = isDev;

/**
 * Generic fetch wrapper with error handling
 * Uses local API server in development mode
 */
async function fetchApi(endpoint, options = {}) {
  // Use local API server in development, relative path in production
  const baseUrl = USE_LOCAL_API ? LOCAL_API_BASE : API_BASE;
  const url = `${baseUrl}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// LERNPLÄNE API
// ============================================

export const lernplaeneApi = {
  /**
   * Get all Lernpläne
   */
  getAll: () => fetchApi('/lernplaene'),

  /**
   * Get single Lernplan by ID
   */
  getById: (id) => fetchApi(`/lernplaene/${id}`),

  /**
   * Create new Lernplan
   */
  create: (lernplan) => fetchApi('/lernplaene', {
    method: 'POST',
    body: lernplan,
  }),

  /**
   * Update Lernplan
   */
  update: (id, updates) => fetchApi(`/lernplaene/${id}`, {
    method: 'PUT',
    body: updates,
  }),

  /**
   * Delete Lernplan
   */
  delete: (id) => fetchApi(`/lernplaene/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// KALENDER / SLOTS API
// ============================================

export const kalenderApi = {
  /**
   * Get all slots for a Lernplan
   */
  getSlots: (lernplanId) => fetchApi(`/kalender/${lernplanId}/slots`),

  /**
   * Update all slots for a Lernplan
   */
  updateSlots: (lernplanId, slots) => fetchApi(`/kalender/${lernplanId}/slots`, {
    method: 'PUT',
    body: slots,
  }),

  /**
   * Add or update single slot
   */
  updateSlot: (lernplanId, slot) => fetchApi(`/kalender/${lernplanId}/slots`, {
    method: 'POST',
    body: slot,
  }),

  /**
   * Bulk update slots
   */
  bulkUpdateSlots: (lernplanId, slots) => fetchApi(`/kalender/${lernplanId}/slots/bulk`, {
    method: 'POST',
    body: slots,
  }),
};

// ============================================
// AUFGABEN API
// ============================================

export const aufgabenApi = {
  /**
   * Get all Aufgaben
   */
  getAll: () => fetchApi('/aufgaben'),

  /**
   * Get single Aufgabe by ID
   */
  getById: (id) => fetchApi(`/aufgaben/${id}`),

  /**
   * Create new Aufgabe
   */
  create: (aufgabe) => fetchApi('/aufgaben', {
    method: 'POST',
    body: aufgabe,
  }),

  /**
   * Update Aufgabe
   */
  update: (id, updates) => fetchApi(`/aufgaben/${id}`, {
    method: 'PUT',
    body: updates,
  }),

  /**
   * Delete Aufgabe
   */
  delete: (id) => fetchApi(`/aufgaben/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// LEISTUNGEN API
// ============================================

export const leistungenApi = {
  /**
   * Get all Leistungen
   */
  getAll: () => fetchApi('/leistungen'),

  /**
   * Get single Leistung by ID
   */
  getById: (id) => fetchApi(`/leistungen/${id}`),

  /**
   * Create new Leistung
   */
  create: (leistung) => fetchApi('/leistungen', {
    method: 'POST',
    body: leistung,
  }),

  /**
   * Update Leistung
   */
  update: (id, updates) => fetchApi(`/leistungen/${id}`, {
    method: 'PUT',
    body: updates,
  }),

  /**
   * Delete Leistung
   */
  delete: (id) => fetchApi(`/leistungen/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// WIZARD API
// ============================================

export const wizardApi = {
  /**
   * Get wizard draft
   */
  getDraft: () => fetchApi('/wizard/draft'),

  /**
   * Save wizard draft
   */
  saveDraft: (draft) => fetchApi('/wizard/draft', {
    method: 'PUT',
    body: draft,
  }),

  /**
   * Clear wizard draft
   */
  clearDraft: () => fetchApi('/wizard/draft', {
    method: 'DELETE',
  }),

  /**
   * Complete wizard and create Lernplan with Slots
   */
  complete: (data) => fetchApi('/wizard/complete', {
    method: 'POST',
    body: data,
  }),
};

// ============================================
// UNTERRECHTSGEBIETE API
// ============================================

export const unterrechtsgebieteApi = {
  /**
   * Get all Unterrechtsgebiete
   */
  getAll: () => fetchApi('/unterrechtsgebiete'),

  /**
   * Add new Unterrechtsgebiet
   */
  create: (gebiet) => fetchApi('/unterrechtsgebiete', {
    method: 'POST',
    body: gebiet,
  }),

  /**
   * Delete Unterrechtsgebiet
   */
  delete: (id) => fetchApi(`/unterrechtsgebiete/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// LERNPLAN KI API (Integriert in PrepWell)
// ============================================

/**
 * KI-Lernplan-Generierung
 *
 * Ruft den lokalen Vercel Serverless Endpoint auf,
 * der die OpenAI-Integration direkt enthält.
 * Kein externer Agent3-Service mehr nötig.
 *
 * POST /api/generate-plan
 * - Bei konfiguriertem OPENAI_API_KEY: KI-generierter Plan
 * - Ohne API Key: Lokaler Fallback-Algorithmus
 */
export const agentApi = {
  /**
   * Generate Lernplan with AI
   * Uses local server in dev mode, Vercel function in production
   */
  generateLernplan: async (wizardData) => {
    // Use local API server in dev, production API otherwise
    const apiUrl = USE_LOCAL_API
      ? `${LOCAL_API_BASE}/generate-plan`
      : '/api/generate-plan';

    try {
      console.log(`Calling ${USE_LOCAL_API ? 'local' : 'production'} API:`, apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wizardData),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log(`Generated ${result.totalDays} learning days (source: ${result.source})`);
      return result;
    } catch (error) {
      console.warn('API unavailable, using client-side fallback:', error.message);
      // Client-side fallback if API is completely unavailable
      return agentApi.generateLocalFallback(wizardData);
    }
  },

  /**
   * Local fallback calculation when Agent is unavailable
   * Generates a basic learning plan based on wizard settings
   */
  generateLocalFallback: (wizardData) => {
    const {
      startDate,
      endDate,
      bufferDays,
      vacationDays,
      blocksPerDay,
      weekStructure,
      unterrechtsgebieteOrder,
    } = wizardData;

    // Calculate available learning days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalCalendarDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    // Count active weekdays
    const weekdayMap = {
      0: 'sonntag', 1: 'montag', 2: 'dienstag', 3: 'mittwoch',
      4: 'donnerstag', 5: 'freitag', 6: 'samstag'
    };

    let activeLearningDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = weekdayMap[currentDate.getDay()];
      const dayBlocks = weekStructure[dayName];
      // Check if day has at least one 'lernblock' (not all 'free')
      if (Array.isArray(dayBlocks) && dayBlocks.some(b => b === 'lernblock')) {
        activeLearningDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Subtract buffer and vacation days
    const netLearningDays = Math.max(0, activeLearningDays - bufferDays - vacationDays);

    // Generate learning days based on Unterrechtsgebiete
    const subjects = unterrechtsgebieteOrder.length > 0
      ? unterrechtsgebieteOrder
      : [
          { id: 'default-1', name: 'Grundlagen', color: 'bg-gray-500' },
        ];

    const learningDays = [];

    if (subjects.length > 0 && netLearningDays > 0) {
      // Distribute days across subjects based on their position (earlier = more important)
      const daysPerSubject = Math.max(1, Math.floor(netLearningDays / subjects.length));
      const extraDays = netLearningDays % subjects.length;

      subjects.forEach((subject, subjectIndex) => {
        // Earlier subjects get slightly more days
        const subjectDays = daysPerSubject + (subjectIndex < extraDays ? 1 : 0);

        for (let i = 0; i < subjectDays; i++) {
          learningDays.push({
            id: `day-${subject.id}-${i}`,
            subject: subject.name,
            rechtsgebiet: subject.rechtsgebiet,
            color: subject.color || 'bg-gray-500',
            theme: subjectDays > 1
              ? `${subject.name} - Teil ${i + 1}`
              : subject.name,
            blocks: blocksPerDay,
            kategorie: subject.kategorie,
          });
        }
      });
    }

    return {
      success: true,
      source: 'local-fallback',
      learningDays,
      totalDays: learningDays.length,
      metadata: {
        totalCalendarDays,
        activeLearningDays,
        netLearningDays,
        subjectsCount: subjects.length,
      },
      message: 'Lernplan lokal generiert (KI nicht verfügbar)',
    };
  },

  /**
   * Check agent health/status
   */
  checkHealth: async () => {
    try {
      const apiUrl = USE_LOCAL_API
        ? `${LOCAL_API_BASE}/health`
        : '/api/health';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(apiUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  },

  /**
   * Get current API base URL (for debugging)
   */
  getBaseUrl: () => USE_LOCAL_API ? LOCAL_API_BASE : API_BASE,
};

// ============================================
// COMBINED API EXPORT
// ============================================

const api = {
  lernplaene: lernplaeneApi,
  kalender: kalenderApi,
  aufgaben: aufgabenApi,
  leistungen: leistungenApi,
  wizard: wizardApi,
  unterrechtsgebiete: unterrechtsgebieteApi,
  agent: agentApi,
};

export default api;
