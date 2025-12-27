import { supabase, isSupabaseConfigured } from './supabase';

// ============================================
// LERNPLÄNE
// ============================================

export const lernplaeneService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('lernplaene')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getById(id) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('lernplaene')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(lernplan) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('lernplaene')
      .insert({ ...lernplan, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('lernplaene')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('lernplaene')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// SLOTS (Kalender)
// ============================================

export const slotsService = {
  async getByLernplan(lernplanId) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('slots')
      .select('*, contents(*)')
      .eq('lernplan_id', lernplanId)
      .order('date', { ascending: true });

    return { data, error };
  },

  async getByDateRange(lernplanId, startDate, endDate) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('slots')
      .select('*, contents(*)')
      .eq('lernplan_id', lernplanId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    return { data, error };
  },

  async upsert(slot) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('slots')
      .upsert(slot, { onConflict: 'lernplan_id,date,position' })
      .select()
      .single();

    return { data, error };
  },

  async bulkUpsert(slots) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('slots')
      .upsert(slots, { onConflict: 'lernplan_id,date,position' })
      .select();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// CONTENTS
// ============================================

export const contentsService = {
  async getByLernplan(lernplanId) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('contents')
      .select('*')
      .eq('lernplan_id', lernplanId);

    return { data, error };
  },

  async create(content) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('contents')
      .insert({ ...content, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('contents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('contents')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// AUFGABEN
// ============================================

export const aufgabenService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('aufgaben')
      .select('*')
      .order('due_date', { ascending: true });

    return { data, error };
  },

  async getByLernplan(lernplanId) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('aufgaben')
      .select('*')
      .eq('lernplan_id', lernplanId)
      .order('due_date', { ascending: true });

    return { data, error };
  },

  async getById(id) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('aufgaben')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(aufgabe) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('aufgaben')
      .insert({ ...aufgabe, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('aufgaben')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('aufgaben')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// LEISTUNGEN
// ============================================

export const leistungenService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('leistungen')
      .select('*')
      .order('exam_date', { ascending: true });

    return { data, error };
  },

  async getById(id) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('leistungen')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  async create(leistung) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('leistungen')
      .insert({ ...leistung, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('leistungen')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('leistungen')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// ÜBUNGSKLAUSUREN
// ============================================

export const uebungsklausurenService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('uebungsklausuren')
      .select('*')
      .order('exam_date', { ascending: true });

    return { data, error };
  },

  async create(klausur) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('uebungsklausuren')
      .insert({ ...klausur, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('uebungsklausuren')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('uebungsklausuren')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// WIZARD DRAFT
// ============================================

export const wizardService = {
  async getDraft() {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('wizard_drafts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data, error };
  },

  async saveDraft(draft) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('wizard_drafts')
      .upsert({
        user_id: user.id,
        current_step: draft.currentStep,
        wizard_data: draft
      }, { onConflict: 'user_id' })
      .select()
      .single();

    return { data, error };
  },

  async deleteDraft() {
    if (!isSupabaseConfigured()) return { error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: null };

    const { error } = await supabase
      .from('wizard_drafts')
      .delete()
      .eq('user_id', user.id);

    return { error };
  },

  /**
   * Complete wizard: Create Lernplan + Contents + Slots in one transaction
   * @param {Object} wizardData - Complete wizard data including generated learning days
   */
  async complete(wizardData) {
    if (!isSupabaseConfigured()) return { data: null, error: 'Supabase not configured' };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: 'Not authenticated' };

    try {
      // 1. Create Lernplan
      const { data: lernplan, error: lernplanError } = await supabase
        .from('lernplaene')
        .insert({
          user_id: user.id,
          title: wizardData.title || 'Neuer Lernplan',
          description: wizardData.description || '',
          mode: wizardData.mode || 'standard',
          start_date: wizardData.startDate,
          end_date: wizardData.endDate,
          metadata: {
            bufferDays: wizardData.bufferDays,
            vacationDays: wizardData.vacationDays,
            blocksPerDay: wizardData.blocksPerDay,
            weekStructure: wizardData.weekStructure,
            createdVia: 'wizard'
          }
        })
        .select()
        .single();

      if (lernplanError) throw lernplanError;

      // 2. Create Contents from learning days
      const learningDays = wizardData.learningDays || [];
      const contentsBySubject = {};

      // Group learning days by subject to create unique contents
      for (const day of learningDays) {
        const key = `${day.rechtsgebiet}-${day.subject}`;
        if (!contentsBySubject[key]) {
          contentsBySubject[key] = {
            user_id: user.id,
            lernplan_id: lernplan.id,
            title: day.subject,
            rechtsgebiet: day.rechtsgebiet,
            unterrechtsgebiet: day.subject,
            color: day.color,
            block_type: 'lernblock',
            themes: []
          };
        }
        if (day.theme) {
          contentsBySubject[key].themes.push(day.theme);
        }
      }

      const contentsToInsert = Object.values(contentsBySubject);
      let insertedContents = [];

      if (contentsToInsert.length > 0) {
        const { data: contents, error: contentsError } = await supabase
          .from('contents')
          .insert(contentsToInsert)
          .select();

        if (contentsError) throw contentsError;
        insertedContents = contents || [];
      }

      // Create a map for quick content lookup
      const contentMap = {};
      for (const content of insertedContents) {
        const key = `${content.rechtsgebiet}-${content.unterrechtsgebiet}`;
        contentMap[key] = content.id;
      }

      // 3. Create Slots based on week structure and learning days
      const slots = [];
      const startDate = new Date(wizardData.startDate);
      const endDate = new Date(wizardData.endDate);
      const weekdayMap = {
        0: 'sonntag', 1: 'montag', 2: 'dienstag', 3: 'mittwoch',
        4: 'donnerstag', 5: 'freitag', 6: 'samstag'
      };

      let learningDayIndex = 0;
      const currentDate = new Date(startDate);

      while (currentDate <= endDate && learningDayIndex < learningDays.length) {
        const dayName = weekdayMap[currentDate.getDay()];
        const dayStructure = wizardData.weekStructure?.[dayName] || [];

        for (let position = 1; position <= 4; position++) {
          const blockType = dayStructure[position - 1];

          if (blockType === 'lernblock' && learningDayIndex < learningDays.length) {
            const learningDay = learningDays[learningDayIndex];
            const contentKey = `${learningDay.rechtsgebiet}-${learningDay.subject}`;

            slots.push({
              lernplan_id: lernplan.id,
              content_id: contentMap[contentKey] || null,
              date: currentDate.toISOString().split('T')[0],
              position: position,
              is_locked: false,
              metadata: {
                theme: learningDay.theme,
                originalIndex: learningDayIndex
              }
            });

            learningDayIndex++;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      if (slots.length > 0) {
        const { error: slotsError } = await supabase
          .from('slots')
          .insert(slots);

        if (slotsError) throw slotsError;
      }

      // 4. Delete wizard draft
      await supabase
        .from('wizard_drafts')
        .delete()
        .eq('user_id', user.id);

      return {
        data: {
          lernplan,
          contentsCount: insertedContents.length,
          slotsCount: slots.length
        },
        error: null
      };

    } catch (error) {
      console.error('Wizard complete error:', error);
      return { data: null, error: error.message || 'Failed to complete wizard' };
    }
  }
};

// ============================================
// CUSTOM UNTERRECHTSGEBIETE
// ============================================

export const unterrechtsgebieteService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('custom_unterrechtsgebiete')
      .select('*')
      .order('name', { ascending: true });

    return { data, error };
  },

  async create(unterrechtsgebiet) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('custom_unterrechtsgebiete')
      .insert({ ...unterrechtsgebiet, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('custom_unterrechtsgebiete')
      .delete()
      .eq('id', id);

    return { error };
  }
};

// ============================================
// CHECK-IN (Mentor)
// ============================================

export const checkinService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('checkin_responses')
      .select('*')
      .order('response_date', { ascending: false });

    return { data, error };
  },

  async getByDateRange(startDate, endDate) {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('checkin_responses')
      .select('*')
      .gte('response_date', startDate)
      .lte('response_date', endDate)
      .order('response_date', { ascending: true });

    return { data, error };
  },

  async upsert(response) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('checkin_responses')
      .upsert({ ...response, user_id: user?.id }, { onConflict: 'user_id,response_date' })
      .select()
      .single();

    return { data, error };
  }
};

// ============================================
// TIMER SESSIONS
// ============================================

export const timerService = {
  async getSessions() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('timer_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async createSession(session) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('timer_sessions')
      .insert({ ...session, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  }
};

// ============================================
// USER SETTINGS
// ============================================

export const settingsService = {
  async get() {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return { data, error };
  },

  async upsert(settings) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: user.id }, { onConflict: 'user_id' })
      .select()
      .single();

    return { data, error };
  }
};

// ============================================
// THEMENLISTEN
// ============================================

export const themenlistenService = {
  async getAll() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('themenlisten')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  async getPublished() {
    if (!isSupabaseConfigured()) return { data: [], error: null };

    const { data, error } = await supabase
      .from('themenlisten')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    return { data, error };
  },

  async create(themenliste) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('themenlisten')
      .insert({ ...themenliste, user_id: user?.id })
      .select()
      .single();

    return { data, error };
  },

  async update(id, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('themenlisten')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async publish(id) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from('themenlisten')
      .update({ is_published: true, published_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  async delete(id) {
    if (!isSupabaseConfigured()) return { error: null };

    const { error } = await supabase
      .from('themenlisten')
      .delete()
      .eq('id', id);

    return { error };
  }
};
