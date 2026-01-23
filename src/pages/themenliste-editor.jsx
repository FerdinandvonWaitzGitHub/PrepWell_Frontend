import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Header } from '../components/layout';
import { useCalendar } from '../contexts/calendar-context';
import { useStudiengang } from '../contexts/studiengang-context';
import { useOnlineStatus } from '../hooks/use-online-status';

// Feature components
import ThemenlisteHeader from '../features/themenliste/components/themenliste-header';
import ThemenNavigation from '../features/themenliste/components/themen-navigation';
import ThemaDetail from '../features/themenliste/components/thema-detail';
import ThemenlisteFooter from '../features/themenliste/components/themenliste-footer';
import DeleteConfirmDialog from '../features/themenliste/components/delete-confirm-dialog';
import CancelConfirmDialog from '../features/themenliste/components/cancel-confirm-dialog';
import DraftDialog from '../features/themenliste/components/draft-dialog';
import ConflictDialog from '../features/themenliste/components/conflict-dialog';

// Migration utility
import {
  isOldStructure,
  migrateOldToNewStructure,
  createEmptyContentPlan,
  getDisplayName
} from '../utils/themenliste-migration';

// Draft localStorage key
const DRAFT_KEY = 'prepwell_themenliste_draft';

// T33: Retry configuration
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 1000; // 1s, 2s, 4s with exponential backoff

/**
 * ThemenlisteEditorPage - T27 Redesign
 *
 * Features:
 * - New flat data structure: selectedAreas[] + themen[] + optional kapitel[]
 * - URG/Fach autocomplete in header (replaces title + badges)
 * - Flat theme list with color bars (replaces accordion)
 * - Optional Kapitel grouping (useKapitel toggle)
 * - Auto-Save with draft persistence
 */

// Generate local ID
const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ThemenlisteEditorPage = () => {
  const navigate = useNavigate();
  // T33: Get planId from URL for editing existing plans
  const { planId } = useParams();
  const { createContentPlan, updateContentPlan, deleteContentPlan, contentPlans } = useCalendar();
  const { hierarchyLabels, themenlisteKapitelDefault, isJura } = useStudiengang();

  // T33: Track if we're editing an existing plan (vs creating new)
  const [isEditingExisting, setIsEditingExisting] = useState(false);

  // Draft state
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Track whether plan has been saved to DB
  const [isSavedToDb, setIsSavedToDb] = useState(false);

  // T27: New content plan structure
  const [contentPlan, setContentPlan] = useState(() =>
    createEmptyContentPlan({ useKapitel: themenlisteKapitelDefault })
  );

  // UI state
  const [selectedThemaId, setSelectedThemaId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');
  const [hasChanges, setHasChanges] = useState(false);

  // T33 Phase 1: Error handling state
  const [saveError, setSaveError] = useState(null);

  // T33 Phase 2: Online status
  const { isOnline } = useOnlineStatus();

  // T33 Phase 3: Race condition prevention refs
  const isSavingRef = useRef(false);
  const pendingChangesRef = useRef(null);
  const currentPlanRef = useRef(contentPlan);

  // Keep ref in sync with state
  useEffect(() => {
    currentPlanRef.current = contentPlan;
  }, [contentPlan]);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // T33 Phase 4: Conflict detection state
  const [conflictInfo, setConflictInfo] = useState(null);

  // T33: Load existing plan when planId is provided (edit mode)
  useEffect(() => {
    if (!planId || !contentPlans || isEditingExisting) return;

    // Find the plan by ID
    const existingPlan = contentPlans.find(p => p.id === planId);

    if (existingPlan) {
      // Check if it's a T27 structure plan (has selectedAreas)
      if (existingPlan.selectedAreas && existingPlan.selectedAreas.length > 0) {
        // Load the existing plan
        setContentPlan(existingPlan);
        setIsSavedToDb(true);
        setIsEditingExisting(true);
        setDraftLoaded(true); // Skip draft dialog
        setAutoSaveStatus('saved');

        // Select first thema if available
        if (existingPlan.themen?.length > 0) {
          setSelectedThemaId(existingPlan.themen[0].id);
        }

      } else if (isOldStructure(existingPlan)) {
        // Migrate old structure and load
        const migratedPlan = migrateOldToNewStructure(existingPlan);
        setContentPlan(migratedPlan);
        setIsSavedToDb(true);
        setIsEditingExisting(true);
        setDraftLoaded(true);
        setAutoSaveStatus('saved');

        if (migratedPlan.themen?.length > 0) {
          setSelectedThemaId(migratedPlan.themen[0].id);
        }

      } else {
        // Plan exists but has no content - treat as new
        console.warn('T33: Plan exists but has no recognized structure:', planId);
      }
    } else {
      console.warn('T33: Plan not found:', planId);
      // Optionally navigate back if plan not found
      // navigate('/lernplan');
    }
  }, [planId, contentPlans, isEditingExisting]);

  // Check for existing draft on mount - T27 FIX: Also check DB for drafts
  // T33 Phase 4: Added conflict detection for multi-device sync
  // T34 FIX: Don't load drafts when creating NEW Themenliste (no planId)
  useEffect(() => {
    // T32 FIX: Don't re-check if we've already loaded or if dialog is showing
    if (draftLoaded || showDraftDialog || conflictInfo) return;

    // T34 FIX: When creating NEW Themenliste (no planId), clear any existing draft
    // This prevents "Mikroökonomie hardcoded" bug where old draft is loaded
    if (!planId) {
      localStorage.removeItem(DRAFT_KEY);
      setDraftLoaded(true);
      return;
    }

    try {
      // First check localStorage (only for edit mode with planId)
      const draftJson = localStorage.getItem(DRAFT_KEY);
      let localDraft = null;

      if (draftJson) {
        const draft = JSON.parse(draftJson);
        let plan = draft?.contentPlan;

        // T27: Migrate old structure if needed
        if (plan && isOldStructure(plan)) {
          plan = migrateOldToNewStructure(plan);
          draft.contentPlan = plan;
        }

        // Check if draft has meaningful content
        const hasContent = plan && (
          (plan.selectedAreas && plan.selectedAreas.length > 0) ||
          (plan.themen && plan.themen.length > 0) ||
          // Fallback for old structure detection
          (plan.name && plan.name.trim().length > 0) ||
          (plan.rechtsgebiete && plan.rechtsgebiete.length > 0)
        );

        if (hasContent) {
          localDraft = draft;
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }

      // T27 FIX: Also check DB for themenliste drafts (in case localStorage was cleared)
      const dbDraft = contentPlans?.find(p =>
        p.type === 'themenliste' && p.status === 'draft'
      );

      // T33 Phase 4: Check for conflict (both exist and DB is newer)
      if (localDraft && dbDraft) {
        const localTime = new Date(localDraft.lastModified || 0).getTime();
        const dbTime = new Date(dbDraft.updatedAt || 0).getTime();

        if (dbTime > localTime) {
          // DB is newer - show conflict dialog
          let migratedDbDraft = dbDraft;
          if (isOldStructure(dbDraft)) {
            migratedDbDraft = migrateOldToNewStructure(dbDraft);
          }
          setConflictInfo({
            localVersion: localDraft,
            dbVersion: migratedDbDraft
          });
          return;
        }
        // Local is newer or same - show draft dialog as usual
        setPendingDraft(localDraft);
        setShowDraftDialog(true);
      } else if (localDraft) {
        // Only local exists
        setPendingDraft(localDraft);
        setShowDraftDialog(true);
      } else if (dbDraft) {
        // DB draft exists but no localStorage - create draft object
        let plan = dbDraft;
        if (isOldStructure(plan)) {
          plan = migrateOldToNewStructure(plan);
        }
        setPendingDraft({ contentPlan: plan, lastModified: plan.updatedAt });
        setShowDraftDialog(true);
      } else {
        setDraftLoaded(true);
      }
    } catch (e) {
      console.error('Error loading draft:', e);
      setDraftLoaded(true);
    }
  }, [contentPlans, draftLoaded, showDraftDialog, conflictInfo]);

  // Handle resume draft
  const handleResumeDraft = useCallback(() => {
    if (pendingDraft?.contentPlan) {
      let plan = pendingDraft.contentPlan;
      // Migrate if needed
      if (isOldStructure(plan)) {
        plan = migrateOldToNewStructure(plan);
      }
      setContentPlan(plan);
      const wasAlreadySaved = plan.id && !plan.id.startsWith('local-');
      setIsSavedToDb(wasAlreadySaved);
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
    setDraftLoaded(true);
  }, [pendingDraft]);

  // Handle discard draft - T27 FIX: Also delete DB draft
  const handleDiscardDraft = useCallback(async () => {
    // Delete DB draft if it exists
    const draftId = pendingDraft?.contentPlan?.id;
    if (draftId && !draftId.startsWith('local-')) {
      try {
        await deleteContentPlan(draftId);
      } catch (e) {
        console.warn('Failed to delete DB draft:', e);
      }
    }

    localStorage.removeItem(DRAFT_KEY);
    setShowDraftDialog(false);
    setPendingDraft(null);
    setDraftLoaded(true);
  }, [pendingDraft, deleteContentPlan]);

  // T33 Phase 4: Handle conflict resolution - use local version
  const handleUseLocalVersion = useCallback(() => {
    if (conflictInfo?.localVersion?.contentPlan) {
      let plan = conflictInfo.localVersion.contentPlan;
      if (isOldStructure(plan)) {
        plan = migrateOldToNewStructure(plan);
      }
      setContentPlan(plan);
      const wasAlreadySaved = plan.id && !plan.id.startsWith('local-');
      setIsSavedToDb(wasAlreadySaved);
      // Mark as changed to trigger save (overwrite DB with local)
      setHasChanges(true);
    }
    setConflictInfo(null);
    setDraftLoaded(true);
  }, [conflictInfo]);

  // T33 Phase 4: Handle conflict resolution - use cloud version
  const handleUseCloudVersion = useCallback(() => {
    if (conflictInfo?.dbVersion) {
      let plan = conflictInfo.dbVersion;
      if (isOldStructure(plan)) {
        plan = migrateOldToNewStructure(plan);
      }
      setContentPlan(plan);
      setIsSavedToDb(true);
      // Remove local draft since we're using cloud version
      localStorage.removeItem(DRAFT_KEY);
      // Update localStorage with cloud version
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        contentPlan: plan,
        lastModified: plan.updatedAt
      }));
    }
    setConflictInfo(null);
    setDraftLoaded(true);
  }, [conflictInfo]);

  // T33 Phase 1: Save with retry logic
  const saveToSupabase = useCallback(async (planToSave, attempt = 0) => {
    try {
      if (!isSavedToDb) {
        const savedPlan = await createContentPlan({
          ...planToSave,
          id: undefined,
          status: 'draft',
        });
        setContentPlan(prev => ({ ...prev, id: savedPlan.id }));
        // T34 FIX: CRITICAL - also update ref with new Supabase ID!
        // Without this, subsequent updates use wrong ID and data is lost
        currentPlanRef.current = { ...currentPlanRef.current, id: savedPlan.id };
        setIsSavedToDb(true);
        // Update localStorage with new ID
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          contentPlan: { ...planToSave, id: savedPlan.id },
          lastModified: new Date().toISOString()
        }));
        return savedPlan;
      } else {
        await updateContentPlan(planToSave.id, {
          ...planToSave,
          status: 'draft',
        });
        return planToSave;
      }
    } catch (error) {
      console.error(`Save failed (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

      if (attempt < MAX_RETRIES - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
        setAutoSaveStatus('retrying');
        await new Promise(resolve => setTimeout(resolve, delay));
        return saveToSupabase(planToSave, attempt + 1);
      }

      // All retries failed
      throw error;
    }
  }, [isSavedToDb, createContentPlan, updateContentPlan]);

  // T33 Phase 3: Perform save with race condition prevention
  const performSave = useCallback(async () => {
    // Don't save if already saving
    if (isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    const planToSave = currentPlanRef.current;

    try {
      setAutoSaveStatus('saving');
      setSaveError(null);

      // Always save to localStorage first (works offline)
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        contentPlan: planToSave,
        lastModified: new Date().toISOString()
      }));

      // T33 Phase 2: Check if online before Supabase save
      if (!isOnline) {
        setAutoSaveStatus('offline');
        setHasChanges(false);
        return;
      }

      // Save to Supabase with retry
      await saveToSupabase(planToSave);

      setAutoSaveStatus('saved');
      setHasChanges(false);

      // T33 Phase 3: Check for pending changes that happened during save
      // T34 FIX: Actually USE the pending plan - sync it to ref before triggering new save
      if (pendingChangesRef.current) {
        const pendingPlan = pendingChangesRef.current;
        pendingChangesRef.current = null;

        // T34 FIX: Sync the pending plan to currentPlanRef so next save uses it
        currentPlanRef.current = pendingPlan;

        // Schedule another save for pending changes
        isSavingRef.current = false;
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Auto-save failed after all retries:', error);
      setAutoSaveStatus('error');
      setSaveError({
        message: 'Speichern fehlgeschlagen. Deine Änderungen sind lokal gesichert.',
        canRetry: true,
        timestamp: Date.now()
      });
    } finally {
      isSavingRef.current = false;
    }
  }, [isOnline, saveToSupabase]);

  // T33: Manual retry handler
  const handleRetry = useCallback(() => {
    setSaveError(null);
    setHasChanges(true);
  }, []);

  // T33 Phase 2: Sync to Supabase when coming back online
  useEffect(() => {
    if (isOnline && autoSaveStatus === 'offline' && draftLoaded) {
      // We're back online and have offline changes - trigger save
      setHasChanges(true);
    }
  }, [isOnline, autoSaveStatus, draftLoaded]);

  // Auto-save to DB with status='draft'
  useEffect(() => {
    if (!hasChanges || !draftLoaded) return;

    const timeoutId = setTimeout(() => {
      performSave();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [contentPlan, hasChanges, draftLoaded, performSave]);

  // Update content plan and mark as changed
  // T33 Phase 3: Track pending changes if save is in progress
  // T33 Phase 5: Optimistic UI - immediately show "pending" status
  const updatePlan = useCallback((updates) => {
    setContentPlan(prev => {
      const newPlan = { ...prev, ...updates, updatedAt: new Date().toISOString() };

      // T34 FIX: Update ref SYNCHRONOUSLY inside setState, not via useEffect
      // This ensures performSave() always has the latest data
      currentPlanRef.current = newPlan;

      // If currently saving, queue this as pending change
      if (isSavingRef.current) {
        pendingChangesRef.current = newPlan;
      }

      return newPlan;
    });

    // T33 Phase 5: Immediately show "pending" status for optimistic UI
    // This gives instant feedback that changes are being tracked
    if (autoSaveStatus === 'saved' || autoSaveStatus === 'error') {
      setAutoSaveStatus('pending');
    }

    setHasChanges(true);
  }, [autoSaveStatus]);

  // Generate unique ID
  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // === T27: NEW SIMPLIFIED HANDLERS ===

  // Handle areas change (from autocomplete)
  const handleAreasChange = useCallback((newAreas) => {
    updatePlan({ selectedAreas: newAreas });
  }, [updatePlan]);

  // Handle description change
  const handleDescriptionChange = useCallback((description) => {
    updatePlan({ description });
  }, [updatePlan]);

  // Add Thema (simplified - flat array)
  const handleAddThema = useCallback((name, areaId, kapitelId = null) => {
    const newThema = {
      id: genId(),
      name,
      description: '',
      areaId: areaId,
      kapitelId: kapitelId,
      order: contentPlan.themen.length,
      aufgaben: [],
    };

    updatePlan({
      themen: [...contentPlan.themen, newThema],
    });
    setSelectedThemaId(newThema.id);
  }, [contentPlan.themen, updatePlan]);

  // Add Kapitel (simplified)
  // T32 Bug 4b: Accept areaId parameter for Kapitel-Fach-Bindung
  const handleAddKapitel = useCallback((name, areaId = null) => {
    const newKapitel = {
      id: genId(),
      name,
      order: contentPlan.kapitel.length,
      // T32: Kapitel gets areaId - defaults to first selected area if not specified
      areaId: areaId || (contentPlan.selectedAreas?.[0]?.id || null),
    };

    updatePlan({
      kapitel: [...contentPlan.kapitel, newKapitel],
    });

    return newKapitel.id;
  }, [contentPlan.kapitel, contentPlan.selectedAreas, updatePlan]);

  // Delete Thema (simplified)
  const handleDeleteThema = useCallback((themaId) => {
    updatePlan({
      themen: contentPlan.themen.filter(t => t.id !== themaId),
    });
    if (selectedThemaId === themaId) {
      setSelectedThemaId(null);
    }
  }, [contentPlan.themen, updatePlan, selectedThemaId]);

  // Delete Kapitel
  const handleDeleteKapitel = useCallback((kapitelId) => {
    // Also remove kapitelId from themes that reference it
    const updatedThemen = contentPlan.themen.map(t =>
      t.kapitelId === kapitelId ? { ...t, kapitelId: null } : t
    );
    updatePlan({
      kapitel: contentPlan.kapitel.filter(k => k.id !== kapitelId),
      themen: updatedThemen,
    });
  }, [contentPlan.kapitel, contentPlan.themen, updatePlan]);

  // T32 Bug 4b: Update Kapitel (e.g., change areaId)
  const handleUpdateKapitel = useCallback((kapitelId, updates) => {
    const updatedKapitel = contentPlan.kapitel.map(k => {
      if (k.id !== kapitelId) return k;
      return { ...k, ...updates };
    });

    // If areaId changed, update all themes in this Kapitel to inherit the new areaId
    if (updates.areaId) {
      const updatedThemen = contentPlan.themen.map(t => {
        if (t.kapitelId !== kapitelId) return t;
        return { ...t, areaId: updates.areaId };
      });
      updatePlan({ kapitel: updatedKapitel, themen: updatedThemen });
    } else {
      updatePlan({ kapitel: updatedKapitel });
    }
  }, [contentPlan.kapitel, contentPlan.themen, updatePlan]);

  // Find selected Thema
  const selectedThema = useMemo(() => {
    if (!selectedThemaId) return null;
    const thema = contentPlan.themen.find(t => t.id === selectedThemaId);
    if (!thema) return null;
    // Add areaId info for color bar
    return thema;
  }, [selectedThemaId, contentPlan.themen]);

  // Add Aufgabe
  const handleAddAufgabe = useCallback((themaId, aufgabenName) => {
    const newAufgabe = {
      id: genId(),
      name: aufgabenName,
      priority: 'low',
      completed: false,
      order: 0,
    };

    const updatedThemen = contentPlan.themen.map(t => {
      if (t.id !== themaId) return t;
      const aufgaben = t.aufgaben || [];
      return {
        ...t,
        aufgaben: [...aufgaben, { ...newAufgabe, order: aufgaben.length }],
      };
    });

    updatePlan({ themen: updatedThemen });
  }, [contentPlan.themen, updatePlan]);

  // Delete Aufgabe
  const handleDeleteAufgabe = useCallback((themaId, aufgabeId) => {
    const updatedThemen = contentPlan.themen.map(t => {
      if (t.id !== themaId) return t;
      return {
        ...t,
        aufgaben: (t.aufgaben || []).filter(a => a.id !== aufgabeId),
      };
    });
    updatePlan({ themen: updatedThemen });
  }, [contentPlan.themen, updatePlan]);

  // Toggle Aufgabe Priority
  const handleTogglePriority = useCallback((themaId, aufgabeId) => {
    const priorities = ['low', 'medium', 'high'];

    const updatedThemen = contentPlan.themen.map(t => {
      if (t.id !== themaId) return t;
      return {
        ...t,
        aufgaben: (t.aufgaben || []).map(a => {
          if (a.id !== aufgabeId) return a;
          const currentIdx = priorities.indexOf(a.priority || 'low');
          const nextPriority = priorities[(currentIdx + 1) % priorities.length];
          return { ...a, priority: nextPriority };
        }),
      };
    });

    updatePlan({ themen: updatedThemen });
  }, [contentPlan.themen, updatePlan]);

  // Update Thema
  const handleUpdateThema = useCallback((themaId, updates) => {
    const updatedThemen = contentPlan.themen.map(t => {
      if (t.id !== themaId) return t;
      return { ...t, ...updates };
    });
    updatePlan({ themen: updatedThemen });
  }, [contentPlan.themen, updatePlan]);

  // Delete handler for dialog
  const handleDeleteRequest = useCallback((type, id) => {
    setDeleteTarget({ type, id });
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'thema') {
      handleDeleteThema(deleteTarget.id);
    } else if (deleteTarget.type === 'kapitel') {
      handleDeleteKapitel(deleteTarget.id);
    } else if (deleteTarget.type === 'aufgabe' && selectedThema) {
      handleDeleteAufgabe(selectedThema.id, deleteTarget.id);
    }

    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }, [deleteTarget, handleDeleteThema, handleDeleteKapitel, handleDeleteAufgabe, selectedThema]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      navigate('/lernplan');
    }
  }, [hasChanges, navigate]);

  // T27 FIX: Also delete DB draft when canceling
  const handleConfirmCancel = useCallback(async () => {
    // Delete DB draft if it exists
    const draftId = contentPlan?.id;
    if (draftId && !draftId.startsWith('local-') && contentPlan?.status === 'draft') {
      try {
        await deleteContentPlan(draftId);
      } catch (e) {
        console.warn('Failed to delete DB draft on cancel:', e);
      }
    }

    localStorage.removeItem(DRAFT_KEY);
    navigate('/lernplan');
  }, [navigate, contentPlan, deleteContentPlan]);

  // Archive handler
  const handleArchive = useCallback(async () => {
    updatePlan({ archived: true });
    localStorage.removeItem(DRAFT_KEY);
    setTimeout(() => {
      navigate('/lernplan');
    }, 600);
  }, [updatePlan, navigate]);

  // Finish handler
  // T32 FIX: Set name from selectedAreas before saving
  // T34 FIX: Use currentPlanRef instead of contentPlan closure to ensure latest data
  const handleFinish = useCallback(async () => {
    // T34 FIX: Get current plan from ref, not from closure (which might be stale)
    const currentPlan = currentPlanRef.current;

    // T32: Generate name from selected areas (e.g., "Mikroökonomie, Makroökonomie")
    const planName = getDisplayName(currentPlan.selectedAreas);

    if (!isSavedToDb) {
      setAutoSaveStatus('saving');
      try {
        const savedPlan = await createContentPlan({
          ...currentPlan,
          name: planName, // T32 FIX: Set name from selectedAreas
          id: undefined,
          status: 'active',
        });
        setContentPlan(prev => ({ ...prev, id: savedPlan.id }));
        setIsSavedToDb(true);
      } catch (error) {
        console.error('Save failed:', error);
        setAutoSaveStatus('error');
        return;
      }
    } else {
      try {
        await updateContentPlan(currentPlan.id, {
          ...currentPlan,
          name: planName, // T32 FIX: Update name from selectedAreas
          status: 'active',
        });
      } catch (error) {
        console.error('Update failed:', error);
        setAutoSaveStatus('error');
        return;
      }
    }

    localStorage.removeItem(DRAFT_KEY);
    setAutoSaveStatus('saved');
    navigate('/lernplan');
  // T34 FIX: Removed contentPlan from deps - we now use currentPlanRef
  }, [isSavedToDb, createContentPlan, updateContentPlan, navigate]);

  // T27: Check if finish is possible (has at least one area selected)
  const canFinish = contentPlan.selectedAreas && contentPlan.selectedAreas.length > 0;

  // T27: Display name for canFinish tooltip
  const displayName = getDisplayName(contentPlan.selectedAreas);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header without navigation */}
      <Header hideNav />

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {/* T27: Content Header with URG Autocomplete */}
        <ThemenlisteHeader
          selectedAreas={contentPlan.selectedAreas}
          description={contentPlan.description}
          onAreasChange={handleAreasChange}
          onDescriptionChange={handleDescriptionChange}
          hierarchyLabels={hierarchyLabels}
          isJura={isJura}
        />

        {/* Divider */}
        <hr className="border-neutral-200" />

        {/* Main Content: Split View - 40/60 ratio */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation - 40% */}
          <div className="w-2/5 flex-shrink-0 overflow-hidden">
            <ThemenNavigation
              themen={contentPlan.themen}
              kapitel={contentPlan.kapitel}
              useKapitel={contentPlan.useKapitel}
              selectedAreas={contentPlan.selectedAreas}
              selectedThemaId={selectedThemaId}
              onSelectThema={setSelectedThemaId}
              onAddThema={handleAddThema}
              onDeleteThema={(id) => handleDeleteRequest('thema', id)}
              onAddKapitel={handleAddKapitel}
              onDeleteKapitel={(id) => handleDeleteRequest('kapitel', id)}
              onUpdateKapitel={handleUpdateKapitel}
              onUpdateThema={handleUpdateThema}
              hierarchyLabels={hierarchyLabels}
              isJura={isJura}
            />
          </div>

          {/* Right Detail View - 60% */}
          <div className="w-3/5 flex-shrink-0 overflow-hidden">
            <ThemaDetail
              thema={selectedThema}
              selectedAreas={contentPlan.selectedAreas}
              onAddAufgabe={handleAddAufgabe}
              onDeleteAufgabe={(aufgabeId) => handleDeleteRequest('aufgabe', aufgabeId)}
              onTogglePriority={handleTogglePriority}
              onUpdateThema={handleUpdateThema}
              hierarchyLabels={hierarchyLabels}
              isJura={isJura}
            />
          </div>
        </div>

        {/* Footer */}
        <ThemenlisteFooter
          onArchive={handleArchive}
          onCancel={handleCancel}
          onFinish={handleFinish}
          onRetry={handleRetry}
          autoSaveStatus={autoSaveStatus}
          saveError={saveError}
          canFinish={canFinish}
          isOnline={isOnline}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        type={deleteTarget?.type}
        hierarchyLabels={hierarchyLabels}
      />

      {/* Cancel Confirmation Dialog */}
      <CancelConfirmDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleConfirmCancel}
      />

      {/* Draft Dialog */}
      <DraftDialog
        open={showDraftDialog}
        draft={pendingDraft}
        onResume={handleResumeDraft}
        onDiscard={handleDiscardDraft}
      />

      {/* T33 Phase 4: Conflict Resolution Dialog */}
      <ConflictDialog
        open={conflictInfo !== null}
        localVersion={conflictInfo?.localVersion}
        dbVersion={conflictInfo?.dbVersion}
        onUseLocal={handleUseLocalVersion}
        onUseCloud={handleUseCloudVersion}
      />
    </div>
  );
};

export default ThemenlisteEditorPage;
