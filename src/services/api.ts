/**
 * PrepWell API Service
 * Centralized API calls for all backend operations
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE = '/api';
const LOCAL_API_BASE = 'http://localhost:3010/api';
const isDev = import.meta.env.DEV;
const USE_LOCAL_API = isDev;

// =============================================================================
// TYPES
// =============================================================================

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

interface Lernplan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  [key: string]: unknown;
}

interface Aufgabe {
  id: string;
  title: string;
  completed: boolean;
  [key: string]: unknown;
}

interface Leistung {
  id: string;
  title: string;
  grade?: number;
  [key: string]: unknown;
}

interface Unterrechtsgebiet {
  id: string;
  name: string;
  rechtsgebiet?: string;
  kategorie?: string;
  color?: string;
  [key: string]: unknown;
}

interface WizardDraft {
  currentStep: number;
  [key: string]: unknown;
}

interface LearningDay {
  id: string;
  subject: string;
  rechtsgebiet?: string;
  color: string;
  theme: string;
  blocks: number;
  kategorie?: string;
}

interface GeneratePlanResult {
  success: boolean;
  source: string;
  learningDays: LearningDay[];
  totalDays: number;
  metadata?: {
    totalCalendarDays: number;
    activeLearningDays: number;
    netLearningDays: number;
    subjectsCount: number;
  };
  message?: string;
}

interface WizardData {
  startDate: string;
  endDate: string;
  bufferDays: number;
  vacationDays: number;
  blocksPerDay: number;
  weekStructure: Record<string, string[]>;
  unterrechtsgebieteOrder: Unterrechtsgebiet[];
  [key: string]: unknown;
}

// =============================================================================
// FETCH WRAPPER
// =============================================================================

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const baseUrl = USE_LOCAL_API ? LOCAL_API_BASE : API_BASE;
  const url = `${baseUrl}${endpoint}`;

  const { body, ...restOptions } = options;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(restOptions.headers as Record<string, string>),
    },
    ...restOptions,
    body: body && typeof body === 'object' ? JSON.stringify(body) : (body as BodyInit | undefined),
  };

  try {
    const response = await fetch(url, config);
    const data = (await response.json()) as ApiResponse<T>;

    if (!response.ok || !data.success) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data.data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// =============================================================================
// LERNPLÄNE API
// =============================================================================

export const lernplaeneApi = {
  getAll: (): Promise<Lernplan[]> => fetchApi('/lernplaene'),

  getById: (id: string): Promise<Lernplan> => fetchApi(`/lernplaene/${id}`),

  create: (lernplan: Partial<Lernplan>): Promise<Lernplan> =>
    fetchApi('/lernplaene', {
      method: 'POST',
      body: lernplan,
    }),

  update: (id: string, updates: Partial<Lernplan>): Promise<Lernplan> =>
    fetchApi(`/lernplaene/${id}`, {
      method: 'PUT',
      body: updates,
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/lernplaene/${id}`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// AUFGABEN API
// =============================================================================

export const aufgabenApi = {
  getAll: (): Promise<Aufgabe[]> => fetchApi('/aufgaben'),

  getById: (id: string): Promise<Aufgabe> => fetchApi(`/aufgaben/${id}`),

  create: (aufgabe: Partial<Aufgabe>): Promise<Aufgabe> =>
    fetchApi('/aufgaben', {
      method: 'POST',
      body: aufgabe,
    }),

  update: (id: string, updates: Partial<Aufgabe>): Promise<Aufgabe> =>
    fetchApi(`/aufgaben/${id}`, {
      method: 'PUT',
      body: updates,
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/aufgaben/${id}`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// LEISTUNGEN API
// =============================================================================

export const leistungenApi = {
  getAll: (): Promise<Leistung[]> => fetchApi('/leistungen'),

  getById: (id: string): Promise<Leistung> => fetchApi(`/leistungen/${id}`),

  create: (leistung: Partial<Leistung>): Promise<Leistung> =>
    fetchApi('/leistungen', {
      method: 'POST',
      body: leistung,
    }),

  update: (id: string, updates: Partial<Leistung>): Promise<Leistung> =>
    fetchApi(`/leistungen/${id}`, {
      method: 'PUT',
      body: updates,
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/leistungen/${id}`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// WIZARD API
// =============================================================================

export const wizardApi = {
  getDraft: (): Promise<WizardDraft | null> => fetchApi('/wizard/draft'),

  saveDraft: (draft: WizardDraft): Promise<WizardDraft> =>
    fetchApi('/wizard/draft', {
      method: 'PUT',
      body: draft,
    }),

  clearDraft: (): Promise<void> =>
    fetchApi('/wizard/draft', {
      method: 'DELETE',
    }),

  complete: <T>(data: unknown): Promise<T> =>
    fetchApi('/wizard/complete', {
      method: 'POST',
      body: data,
    }),
};

// =============================================================================
// UNTERRECHTSGEBIETE API
// =============================================================================

export const unterrechtsgebieteApi = {
  getAll: (): Promise<Unterrechtsgebiet[]> => fetchApi('/unterrechtsgebiete'),

  create: (gebiet: Partial<Unterrechtsgebiet>): Promise<Unterrechtsgebiet> =>
    fetchApi('/unterrechtsgebiete', {
      method: 'POST',
      body: gebiet,
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/unterrechtsgebiete/${id}`, {
      method: 'DELETE',
    }),
};

// =============================================================================
// AGENT API (KI-Lernplan-Generierung)
// =============================================================================

export const agentApi = {
  generateLernplan: async (wizardData: WizardData): Promise<GeneratePlanResult> => {
    const apiUrl = USE_LOCAL_API ? `${LOCAL_API_BASE}/generate-plan` : '/api/generate-plan';

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

      const result = (await response.json()) as GeneratePlanResult;
      console.log(`Generated ${result.totalDays} learning days (source: ${result.source})`);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('API unavailable, using client-side fallback:', message);
      return agentApi.generateLocalFallback(wizardData);
    }
  },

  generateLocalFallback: (wizardData: WizardData): GeneratePlanResult => {
    const {
      startDate,
      endDate,
      bufferDays,
      vacationDays,
      blocksPerDay,
      weekStructure,
      unterrechtsgebieteOrder,
    } = wizardData;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalCalendarDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const weekdayMap: Record<number, string> = {
      0: 'sonntag',
      1: 'montag',
      2: 'dienstag',
      3: 'mittwoch',
      4: 'donnerstag',
      5: 'freitag',
      6: 'samstag',
    };

    let activeLearningDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayName = weekdayMap[currentDate.getDay()];
      const dayBlocks = weekStructure[dayName];
      if (Array.isArray(dayBlocks) && dayBlocks.some((b) => b === 'lernblock')) {
        activeLearningDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const netLearningDays = Math.max(0, activeLearningDays - bufferDays - vacationDays);

    const subjects: Unterrechtsgebiet[] =
      unterrechtsgebieteOrder.length > 0
        ? unterrechtsgebieteOrder
        : [{ id: 'default-1', name: 'Grundlagen', color: 'bg-gray-500' }];

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

  checkHealth: async (): Promise<boolean> => {
    try {
      const apiUrl = USE_LOCAL_API ? `${LOCAL_API_BASE}/health` : '/api/health';

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

  getBaseUrl: (): string => (USE_LOCAL_API ? LOCAL_API_BASE : API_BASE),
};

// =============================================================================
// COMBINED API EXPORT
// =============================================================================

const api = {
  lernplaene: lernplaeneApi,
  aufgaben: aufgabenApi,
  leistungen: leistungenApi,
  wizard: wizardApi,
  unterrechtsgebiete: unterrechtsgebieteApi,
  agent: agentApi,
};

export default api;
