import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout';
import { useCalendar } from '../contexts/calendar-context';
import { useStudiengang } from '../contexts/studiengang-context';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS, ALL_UNTERRECHTSGEBIETE } from '../data/unterrechtsgebiete-data';

// Feature components
import ThemenlisteHeader from '../features/themenliste/components/themenliste-header';
import ThemenNavigation from '../features/themenliste/components/themen-navigation';
import ThemaDetail from '../features/themenliste/components/thema-detail';
import ThemenlisteFooter from '../features/themenliste/components/themenliste-footer';
import DeleteConfirmDialog from '../features/themenliste/components/delete-confirm-dialog';
import CancelConfirmDialog from '../features/themenliste/components/cancel-confirm-dialog';
import DraftDialog from '../features/themenliste/components/draft-dialog';

// Draft localStorage key
const DRAFT_KEY = 'prepwell_themenliste_draft';

/**
 * ThemenlisteEditorPage - T22 Phase 2
 * Vollständige Seite zum Erstellen einer neuen Themenliste
 *
 * Features:
 * - Auto-Save bei jeder Änderung
 * - Draft-Persistenz (localStorage)
 * - Akkordeon-Navigation für Rechtsgebiete/Untergebiete/Kapitel/Themen
 * - Kapitel-Ebene basierend auf Einstellung (nur für Juristen)
 * - Aufgaben mit Prioritätssystem (low/medium/high)
 * - 40/60 Breitenverhältnis
 */
// T23: Generate local ID without calling context functions
const generateLocalId = () => `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const ThemenlisteEditorPage = () => {
  const navigate = useNavigate();
  // T23 FIX: Use createContentPlan and updateContentPlan (not saveContentPlanToSupabase)
  const { createContentPlan, updateContentPlan } = useCalendar();
  const { isJura, hierarchyLabels, kapitelEbeneAktiviert } = useStudiengang();

  // Kapitel-Ebene: nur wenn Jura UND Einstellung aktiviert
  const showKapitelLevel = isJura && kapitelEbeneAktiviert;

  // Draft state
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // T23 FIX: Track whether plan has been saved to DB (for lazy creation)
  const [isSavedToDb, setIsSavedToDb] = useState(false);

  // T23 FIX: Content plan state - initialize WITHOUT calling createContentPlan
  // This prevents setState-during-render and avoids creating DB entries on page load
  const [contentPlan, setContentPlan] = useState(() => ({
    id: generateLocalId(),
    type: 'themenliste',
    name: '',
    description: '',
    rechtsgebiete: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  // UI state
  const [selectedThemaId, setSelectedThemaId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [hasChanges, setHasChanges] = useState(false);

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Check for existing draft on mount
  // T23 FIX: Only show draft dialog if draft has meaningful content
  useEffect(() => {
    try {
      const draftJson = localStorage.getItem(DRAFT_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        const plan = draft?.contentPlan;

        // Check if draft has meaningful content (name OR at least one Rechtsgebiet)
        const hasContent = plan && (
          (plan.name && plan.name.trim().length > 0) ||
          (plan.rechtsgebiete && plan.rechtsgebiete.length > 0)
        );

        if (hasContent) {
          setPendingDraft(draft);
          setShowDraftDialog(true);
        } else {
          // Empty draft - remove it and start fresh
          localStorage.removeItem(DRAFT_KEY);
          setDraftLoaded(true);
        }
      } else {
        setDraftLoaded(true);
      }
    } catch (e) {
      console.error('Error loading draft:', e);
      setDraftLoaded(true);
    }
  }, []);

  // Save draft to localStorage on changes
  useEffect(() => {
    if (!draftLoaded || !hasChanges) return;

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        contentPlan,
        lastModified: new Date().toISOString()
      }));
    } catch (e) {
      console.error('Error saving draft:', e);
    }
  }, [contentPlan, hasChanges, draftLoaded]);

  // Handle resume draft
  const handleResumeDraft = useCallback(() => {
    if (pendingDraft?.contentPlan) {
      setContentPlan(pendingDraft.contentPlan);
      // T23 FIX: Check if draft was already saved to DB (non-local ID)
      const wasAlreadySaved = pendingDraft.contentPlan.id &&
        !pendingDraft.contentPlan.id.startsWith('local-');
      setIsSavedToDb(wasAlreadySaved);
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
    setDraftLoaded(true);
  }, [pendingDraft]);

  // Handle discard draft
  const handleDiscardDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftDialog(false);
    setPendingDraft(null);
    setDraftLoaded(true);
  }, []);

  // T23 FIX: Auto-save effect with lazy creation pattern
  // First save creates the plan in DB, subsequent saves update it
  useEffect(() => {
    if (!hasChanges || !draftLoaded) return;

    const timeoutId = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        if (!isSavedToDb) {
          // First save: create new plan in DB
          const savedPlan = await createContentPlan({
            ...contentPlan,
            id: undefined, // Let server generate ID
          });
          // Update local state with server-generated ID
          setContentPlan(prev => ({ ...prev, id: savedPlan.id }));
          setIsSavedToDb(true);
        } else {
          // Subsequent saves: update existing plan
          await updateContentPlan(contentPlan.id, contentPlan);
        }
        setAutoSaveStatus('saved');
        setHasChanges(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
        setAutoSaveStatus('error');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [contentPlan, hasChanges, draftLoaded, isSavedToDb, createContentPlan, updateContentPlan]);

  // Update content plan and mark as changed
  const updatePlan = useCallback((updates) => {
    setContentPlan(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    setHasChanges(true);
  }, []);

  // Generate unique ID
  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Find selected Thema
  const selectedThema = useMemo(() => {
    if (!selectedThemaId) return null;

    for (const rg of contentPlan.rechtsgebiete) {
      for (const urg of rg.unterrechtsgebiete || []) {
        if (showKapitelLevel) {
          for (const kap of urg.kapitel || []) {
            const thema = kap.themen?.find(t => t.id === selectedThemaId);
            if (thema) return { ...thema, kapitelId: kap.id, urgId: urg.id, rgId: rg.id };
          }
        } else {
          const thema = urg.themen?.find(t => t.id === selectedThemaId);
          if (thema) return { ...thema, urgId: urg.id, rgId: rg.id };
        }
      }
    }
    return null;
  }, [selectedThemaId, contentPlan.rechtsgebiete, showKapitelLevel]);

  // Add Rechtsgebiet
  const handleAddRechtsgebiet = useCallback((rechtsgebietId) => {
    const existingRg = contentPlan.rechtsgebiete.find(rg => rg.rechtsgebietId === rechtsgebietId);
    if (existingRg) return existingRg;

    const newRg = {
      id: genId(),
      rechtsgebietId,
      unterrechtsgebiete: [],
    };

    updatePlan({
      rechtsgebiete: [...contentPlan.rechtsgebiete, newRg],
    });

    return newRg;
  }, [contentPlan.rechtsgebiete, updatePlan]);

  // Add Unterrechtsgebiet
  const handleAddUntergebiet = useCallback((rgId, untergebietId, name) => {
    const newUrgId = genId();
    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
      if (rg.id !== rgId) return rg;

      const newUrg = {
        id: newUrgId,
        unterrechtsgebietId: untergebietId,
        name,
        ...(showKapitelLevel ? { kapitel: [] } : { themen: [] }),
      };

      return {
        ...rg,
        unterrechtsgebiete: [...(rg.unterrechtsgebiete || []), newUrg],
      };
    });

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
    return newUrgId;
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Add Kapitel (only for Jura with Kapitel enabled)
  const handleAddKapitel = useCallback((rgId, urgId, title) => {
    if (!showKapitelLevel) return null;

    const newKapitelId = genId();
    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
      if (rg.id !== rgId) return rg;

      return {
        ...rg,
        unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
          if (urg.id !== urgId) return urg;

          const newKapitel = {
            id: newKapitelId,
            title,
            themen: [],
          };

          return {
            ...urg,
            kapitel: [...(urg.kapitel || []), newKapitel],
          };
        }),
      };
    });

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
    return newKapitelId;
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Add Thema
  const handleAddThema = useCallback((rgId, urgId, kapitelId, name) => {
    const newThema = {
      id: genId(),
      name,
      description: '',
      aufgaben: [],
    };

    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
      if (rg.id !== rgId) return rg;

      return {
        ...rg,
        unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
          if (urg.id !== urgId) return urg;

          if (showKapitelLevel && kapitelId) {
            return {
              ...urg,
              kapitel: (urg.kapitel || []).map(kap => {
                if (kap.id !== kapitelId) return kap;
                return {
                  ...kap,
                  themen: [...(kap.themen || []), newThema],
                };
              }),
            };
          } else {
            return {
              ...urg,
              themen: [...(urg.themen || []), newThema],
            };
          }
        }),
      };
    });

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
    setSelectedThemaId(newThema.id);
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Delete handlers
  const handleDeleteRequest = useCallback((type, id, parentPath) => {
    setDeleteTarget({ type, id, ...parentPath });
    setShowDeleteDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;

    // T23: Delete Rechtsgebiet
    if (deleteTarget.type === 'rechtsgebiet') {
      const updatedRechtsgebiete = contentPlan.rechtsgebiete.filter(
        rg => rg.id !== deleteTarget.id
      );
      updatePlan({ rechtsgebiete: updatedRechtsgebiete });
      setSelectedThemaId(null);
    }
    // T23: Delete Unterrechtsgebiet
    else if (deleteTarget.type === 'unterrechtsgebiet') {
      const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
        if (rg.id !== deleteTarget.rgId) return rg;
        return {
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).filter(
            urg => urg.id !== deleteTarget.id
          ),
        };
      });
      updatePlan({ rechtsgebiete: updatedRechtsgebiete });
      setSelectedThemaId(null);
    }
    // T23: Delete Kapitel
    else if (deleteTarget.type === 'kapitel') {
      const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
        if (rg.id !== deleteTarget.rgId) return rg;
        return {
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
            if (urg.id !== deleteTarget.urgId) return urg;
            return {
              ...urg,
              kapitel: (urg.kapitel || []).filter(kap => kap.id !== deleteTarget.id),
            };
          }),
        };
      });
      updatePlan({ rechtsgebiete: updatedRechtsgebiete });
      setSelectedThemaId(null);
    }
    // Delete Thema
    else if (deleteTarget.type === 'thema') {
      const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
        if (rg.id !== deleteTarget.rgId) return rg;

        return {
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
            if (urg.id !== deleteTarget.urgId) return urg;

            if (showKapitelLevel && deleteTarget.kapitelId) {
              return {
                ...urg,
                kapitel: (urg.kapitel || []).map(kap => {
                  if (kap.id !== deleteTarget.kapitelId) return kap;
                  return {
                    ...kap,
                    themen: (kap.themen || []).filter(t => t.id !== deleteTarget.id),
                  };
                }),
              };
            } else {
              return {
                ...urg,
                themen: (urg.themen || []).filter(t => t.id !== deleteTarget.id),
              };
            }
          }),
        };
      });

      updatePlan({ rechtsgebiete: updatedRechtsgebiete });

      if (selectedThemaId === deleteTarget.id) {
        setSelectedThemaId(null);
      }
    } else if (deleteTarget.type === 'aufgabe') {
      const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => {
        if (rg.id !== deleteTarget.rgId) return rg;

        return {
          ...rg,
          unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
            if (urg.id !== deleteTarget.urgId) return urg;

            if (showKapitelLevel && deleteTarget.kapitelId) {
              return {
                ...urg,
                kapitel: (urg.kapitel || []).map(kap => {
                  if (kap.id !== deleteTarget.kapitelId) return kap;
                  return {
                    ...kap,
                    themen: (kap.themen || []).map(t => {
                      if (t.id !== deleteTarget.themaId) return t;
                      return {
                        ...t,
                        aufgaben: (t.aufgaben || []).filter(a => a.id !== deleteTarget.id),
                      };
                    }),
                  };
                }),
              };
            } else {
              return {
                ...urg,
                themen: (urg.themen || []).map(t => {
                  if (t.id !== deleteTarget.themaId) return t;
                  return {
                    ...t,
                    aufgaben: (t.aufgaben || []).filter(a => a.id !== deleteTarget.id),
                  };
                }),
              };
            }
          }),
        };
      });

      updatePlan({ rechtsgebiete: updatedRechtsgebiete });
    }

    setShowDeleteDialog(false);
    setDeleteTarget(null);
  }, [deleteTarget, contentPlan.rechtsgebiete, updatePlan, showKapitelLevel, selectedThemaId]);

  // Add Aufgabe
  const handleAddAufgabe = useCallback((themaId, aufgabenName) => {
    const newAufgabe = {
      id: genId(),
      name: aufgabenName,
      priority: 'low',
      completed: false,
    };

    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => ({
      ...rg,
      unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
        if (showKapitelLevel) {
          return {
            ...urg,
            kapitel: (urg.kapitel || []).map(kap => ({
              ...kap,
              themen: (kap.themen || []).map(t => {
                if (t.id !== themaId) return t;
                return {
                  ...t,
                  aufgaben: [...(t.aufgaben || []), newAufgabe],
                };
              }),
            })),
          };
        } else {
          return {
            ...urg,
            themen: (urg.themen || []).map(t => {
              if (t.id !== themaId) return t;
              return {
                ...t,
                aufgaben: [...(t.aufgaben || []), newAufgabe],
              };
            }),
          };
        }
      }),
    }));

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Toggle Aufgabe Priority
  const handleTogglePriority = useCallback((themaId, aufgabeId) => {
    const priorities = ['low', 'medium', 'high'];

    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => ({
      ...rg,
      unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
        if (showKapitelLevel) {
          return {
            ...urg,
            kapitel: (urg.kapitel || []).map(kap => ({
              ...kap,
              themen: (kap.themen || []).map(t => {
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
              }),
            })),
          };
        } else {
          return {
            ...urg,
            themen: (urg.themen || []).map(t => {
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
            }),
          };
        }
      }),
    }));

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Update Thema
  const handleUpdateThema = useCallback((themaId, updates) => {
    const updatedRechtsgebiete = contentPlan.rechtsgebiete.map(rg => ({
      ...rg,
      unterrechtsgebiete: (rg.unterrechtsgebiete || []).map(urg => {
        if (showKapitelLevel) {
          return {
            ...urg,
            kapitel: (urg.kapitel || []).map(kap => ({
              ...kap,
              themen: (kap.themen || []).map(t => {
                if (t.id !== themaId) return t;
                return { ...t, ...updates };
              }),
            })),
          };
        } else {
          return {
            ...urg,
            themen: (urg.themen || []).map(t => {
              if (t.id !== themaId) return t;
              return { ...t, ...updates };
            }),
          };
        }
      }),
    }));

    updatePlan({ rechtsgebiete: updatedRechtsgebiete });
  }, [contentPlan.rechtsgebiete, updatePlan, showKapitelLevel]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    if (hasChanges) {
      setShowCancelDialog(true);
    } else {
      navigate('/lernplan');
    }
  }, [hasChanges, navigate]);

  const handleConfirmCancel = useCallback(() => {
    // Clear draft when canceling
    localStorage.removeItem(DRAFT_KEY);
    navigate('/lernplan');
  }, [navigate]);

  // Archive handler
  const handleArchive = useCallback(async () => {
    updatePlan({ archived: true });
    // Clear draft after archiving
    localStorage.removeItem(DRAFT_KEY);
    // Wait for auto-save
    setTimeout(() => {
      navigate('/lernplan');
    }, 600);
  }, [updatePlan, navigate]);

  // T23: Finish handler - complete the Themenliste creation
  const handleFinish = useCallback(async () => {
    // Ensure plan is saved to DB first
    if (!isSavedToDb) {
      setAutoSaveStatus('saving');
      try {
        const savedPlan = await createContentPlan({
          ...contentPlan,
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
      // Update with active status
      try {
        await updateContentPlan(contentPlan.id, {
          ...contentPlan,
          status: 'active',
        });
      } catch (error) {
        console.error('Update failed:', error);
        setAutoSaveStatus('error');
        return;
      }
    }

    // Clear draft
    localStorage.removeItem(DRAFT_KEY);
    setAutoSaveStatus('saved');

    // Navigate to Lernpläne
    navigate('/lernplan');
  }, [contentPlan, isSavedToDb, createContentPlan, updateContentPlan, navigate]);

  // T23: Check if finish is possible (has at least a name)
  const canFinish = contentPlan.name.trim().length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header without navigation */}
      <Header hideNav />

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <ThemenlisteHeader
          name={contentPlan.name}
          description={contentPlan.description}
          rechtsgebiete={contentPlan.rechtsgebiete}
          onNameChange={(name) => updatePlan({ name })}
          onDescriptionChange={(description) => updatePlan({ description })}
          hierarchyLabels={hierarchyLabels}
        />

        {/* Divider */}
        <hr className="border-neutral-200" />

        {/* Main Content: Split View - 40/60 ratio */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation - 40% */}
          <div className="w-2/5 flex-shrink-0 overflow-hidden">
            <ThemenNavigation
              rechtsgebiete={contentPlan.rechtsgebiete}
              selectedThemaId={selectedThemaId}
              onSelectThema={setSelectedThemaId}
              onAddRechtsgebiet={handleAddRechtsgebiet}
              onAddUntergebiet={handleAddUntergebiet}
              onAddKapitel={handleAddKapitel}
              onAddThema={handleAddThema}
              onDeleteThema={(id, parentPath) => handleDeleteRequest('thema', id, parentPath)}
              onDeleteRechtsgebiet={(id) => handleDeleteRequest('rechtsgebiet', id, {})}
              onDeleteUnterrechtsgebiet={(id, rgId) => handleDeleteRequest('unterrechtsgebiet', id, { rgId })}
              onDeleteKapitel={(id, rgId, urgId) => handleDeleteRequest('kapitel', id, { rgId, urgId })}
              showKapitelLevel={showKapitelLevel}
              hierarchyLabels={hierarchyLabels}
              rechtsgebietLabels={RECHTSGEBIET_LABELS}
              rechtsgebietColors={RECHTSGEBIET_COLORS}
              unterrechtsgebieteData={ALL_UNTERRECHTSGEBIETE}
            />
          </div>

          {/* Right Detail View - 60% */}
          <div className="w-3/5 flex-shrink-0 overflow-hidden">
            <ThemaDetail
              thema={selectedThema}
              onAddAufgabe={handleAddAufgabe}
              onDeleteAufgabe={(aufgabeId) => handleDeleteRequest('aufgabe', aufgabeId, {
                themaId: selectedThema?.id,
                kapitelId: selectedThema?.kapitelId,
                urgId: selectedThema?.urgId,
                rgId: selectedThema?.rgId,
              })}
              onTogglePriority={handleTogglePriority}
              onUpdateThema={handleUpdateThema}
              hierarchyLabels={hierarchyLabels}
            />
          </div>
        </div>

        {/* Footer */}
        <ThemenlisteFooter
          onArchive={handleArchive}
          onCancel={handleCancel}
          onFinish={handleFinish}
          autoSaveStatus={autoSaveStatus}
          canFinish={canFinish}
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
    </div>
  );
};

export default ThemenlisteEditorPage;
