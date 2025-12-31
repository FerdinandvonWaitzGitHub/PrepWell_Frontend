import React, { useState, useEffect, useCallback } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { agentApi } from '../../../services/api';
import { generateLearningDaysFromTemplate, getTemplateById } from '../../../data/templates';

/**
 * Step 9: Lerntage sortieren
 * User arranges the order of learning days
 * Supports:
 * - automatic path: extracts from manualLernplan
 * - template path: uses template content
 * - AI path: generates via agent API
 */

// Rechtsgebiet colors for automatic path
const MANUAL_RECHTSGEBIET_COLORS = {
  'Zivilrecht': 'bg-blue-500',
  'Öffentliches Recht': 'bg-green-500',
  'Strafrecht': 'bg-red-500',
};

const Step9Lerntage = () => {
  const {
    currentStep,
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    unterrechtsgebieteOrder,
    learningDaysOrder,
    updateWizardData,
    creationMethod,
    selectedTemplate,
    manualLernplan,
  } = useWizard();

  // Check if we're in automatic mode (using manualLernplan)
  const isAutomaticMode = creationMethod === 'automatic' && manualLernplan;

  // Extract Lerntage from manualLernplan for automatic path
  const extractFromManualLernplan = useCallback(() => {
    if (!manualLernplan?.rechtsgebiete) return [];

    const items = [];
    let globalIndex = 0;

    Object.entries(manualLernplan.rechtsgebiete).forEach(([rechtsgebiet, rgData]) => {
      Object.entries(rgData.unterrechtsgebiete || {}).forEach(([unterrechtsgebiet, ugData]) => {
        (ugData.lerntage || []).forEach((lerntag, lerntagIndex) => {
          globalIndex++;
          const firstThema = lerntag.themen?.[0];
          items.push({
            id: lerntag.id || `${rechtsgebiet}-${unterrechtsgebiet}-lt${lerntagIndex}`,
            theme: firstThema?.beschreibung || `Lerntag ${lerntagIndex + 1}`,
            rechtsgebiet,
            unterrechtsgebiet,
            lerntagIndex: lerntagIndex + 1,
            blocks: lerntag.themen?.reduce((sum, t) => sum + (t.bloecke || 1), 0) || 1,
            color: MANUAL_RECHTSGEBIET_COLORS[rechtsgebiet] || 'bg-neutral-500',
            kategorie: unterrechtsgebiet,
          });
        });
      });
    });
    return items;
  }, [manualLernplan]);

  const [items, setItems] = useState(() => {
    if (learningDaysOrder?.length > 0) {
      return learningDaysOrder;
    }
    if (isAutomaticMode) {
      return extractFromManualLernplan();
    }
    return [];
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSource, setGenerationSource] = useState(isAutomaticMode ? 'manual' : null);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Check if we're using template-based generation
  const isTemplateMode = creationMethod === 'template' && selectedTemplate;

  // Generate learning days using template or agent API
  const generateLearningDays = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Template-based generation - use template content directly
      if (isTemplateMode) {
        const templateLearningDays = generateLearningDaysFromTemplate(selectedTemplate, blocksPerDay);
        const template = getTemplateById(selectedTemplate);

        if (templateLearningDays.length > 0) {
          setItems(templateLearningDays);
          setGenerationSource('template');
          setMetadata({
            totalCalendarDays: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
            templateName: template?.title || 'Vorlage',
            templateContentCount: templateLearningDays.length,
          });
          updateWizardData({ learningDaysOrder: templateLearningDays });
        } else {
          setError('Vorlage konnte nicht geladen werden');
        }
        setIsGenerating(false);
        return;
      }

      // AI-based generation for manual/automatic modes
      const wizardData = {
        startDate,
        endDate,
        bufferDays,
        vacationDays,
        blocksPerDay,
        weekStructure,
        unterrechtsgebieteOrder,
      };

      const result = await agentApi.generateLernplan(wizardData);

      if (result.success) {
        setItems(result.learningDays || []);
        setGenerationSource(result.source);
        setMetadata(result.metadata || null);
        updateWizardData({ learningDaysOrder: result.learningDays || [] });
      } else {
        setError(result.message || 'Fehler bei der Generierung');
      }
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsGenerating(false);
    }
  }, [startDate, endDate, bufferDays, vacationDays, blocksPerDay, weekStructure, unterrechtsgebieteOrder, updateWizardData, isTemplateMode, selectedTemplate]);

  // Generate on mount if no items exist
  useEffect(() => {
    // For automatic mode, extract from manualLernplan (no API call needed)
    if (isAutomaticMode && items.length === 0) {
      const extractedItems = extractFromManualLernplan();
      if (extractedItems.length > 0) {
        setItems(extractedItems);
        setGenerationSource('manual');
      }
      return;
    }

    // For template mode, generate if no items and template is selected
    if (isTemplateMode && items.length === 0) {
      generateLearningDays();
    }
    // For non-template/non-automatic modes, generate if no items and unterrechtsgebiete are selected
    else if (!isTemplateMode && !isAutomaticMode && items.length === 0 && unterrechtsgebieteOrder.length > 0) {
      generateLearningDays();
    }
  }, [isTemplateMode, isAutomaticMode, extractFromManualLernplan]);

  // Update wizard state when order changes
  useEffect(() => {
    if (items.length > 0) {
      updateWizardData({ learningDaysOrder: items });
    }
  }, [items, updateWizardData]);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedItem !== null && dragOverIndex !== null && draggedItem !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedItem, 1);
      newItems.splice(dragOverIndex, 0, removed);
      setItems(newItems);
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;

    const newItems = [...items];
    const [removed] = newItems.splice(index, 1);
    newItems.splice(newIndex, 0, removed);
    setItems(newItems);
  };

  // Loading state
  if (isGenerating) {
    return (
      <div>
        <StepHeader
          step={currentStep}
          title="Lerntage werden generiert..."
          description="Die KI erstellt deinen optimalen Lernplan."
        />

        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          {/* Animated spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-200 rounded-full animate-spin border-t-primary-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary-500">
                <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg font-medium text-neutral-900">Lernplan wird erstellt</p>
            <p className="text-sm text-neutral-500 mt-1">
              Basierend auf {unterrechtsgebieteOrder.length} Unterrechtsgebieten
            </p>
          </div>

          {/* Progress indicators */}
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepHeader
        step={currentStep}
        title="Sortiere deine Lerntage."
        description="In welcher Reihenfolge sollen die Lerntage in deinen Lernplan eingefügt werden?"
      />

      <div className="space-y-6">
        {/* Generation source indicator */}
        {generationSource && (
          <div className={`rounded-xl p-3 border flex items-center gap-2 ${
            generationSource === 'template'
              ? 'bg-purple-50 border-purple-200 text-purple-700'
              : generationSource === 'manual'
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : generationSource === 'agent' || generationSource === 'ai'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {generationSource === 'template' ? (
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" strokeLinecap="round" strokeLinejoin="round"/>
              ) : generationSource === 'manual' ? (
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
              ) : generationSource === 'agent' || generationSource === 'ai' ? (
                <path d="M12 2L12 6M12 18L12 22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12L6 12M18 12L22 12M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" strokeLinecap="round"/>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
            <span className="text-sm">
              {generationSource === 'template'
                ? `Aus Vorlage: ${metadata?.templateName || 'Vorlage'}`
                : generationSource === 'manual'
                ? 'Manuell erstellt'
                : generationSource === 'agent' || generationSource === 'ai'
                ? 'Mit KI generiert'
                : 'Lokal generiert (KI nicht verfügbar)'}
            </span>
            {generationSource !== 'manual' && (
              <button
                onClick={generateLearningDays}
                className="ml-auto text-xs underline hover:no-underline"
              >
                Neu generieren
              </button>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 rounded-xl p-4 border border-red-200 flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-600 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={generateLearningDays}
                className="mt-2 text-sm text-red-600 underline hover:no-underline"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Summary with metadata */}
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">Anzahl Lerntage:</span>
            <span className="font-semibold text-neutral-900">{items.length} Tage</span>
          </div>
          {metadata && (
            <div className="mt-2 pt-2 border-t border-neutral-200 grid grid-cols-3 gap-2 text-xs text-neutral-500">
              <div>
                <span className="block text-neutral-400">Kalendertage</span>
                <span className="font-medium text-neutral-600">{metadata.totalCalendarDays}</span>
              </div>
              {isTemplateMode ? (
                <div>
                  <span className="block text-neutral-400">Vorlagen-Inhalte</span>
                  <span className="font-medium text-neutral-600">{metadata.templateContentCount || items.length}</span>
                </div>
              ) : (
                <div>
                  <span className="block text-neutral-400">Aktive Tage</span>
                  <span className="font-medium text-neutral-600">{metadata.activeLearningDays}</span>
                </div>
              )}
              {!isTemplateMode && (
                <div>
                  <span className="block text-neutral-400">Netto Lerntage</span>
                  <span className="font-medium text-neutral-600">{metadata.netLearningDays}</span>
                </div>
              )}
              {isTemplateMode && (
                <div>
                  <span className="block text-neutral-400">Blöcke/Tag</span>
                  <span className="font-medium text-neutral-600">{blocksPerDay}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scrollable list */}
        {items.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group flex items-center gap-3 p-3 rounded-xl border-2 bg-white cursor-move transition-all ${
                  draggedItem === index
                    ? 'opacity-50 border-primary-300'
                    : dragOverIndex === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                {/* Drag handle */}
                <div className="text-neutral-400 group-hover:text-neutral-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Position number */}
                <div className="w-7 h-7 rounded-lg bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-600">
                  {index + 1}
                </div>

                {/* Color indicator */}
                <div className={`w-2 h-6 rounded ${item.color}`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 text-sm truncate">{item.theme}</p>
                  <p className="text-xs text-neutral-500">
                    {item.blocks} Blöcke
                    {item.kategorie && ` • ${item.kategorie}`}
                  </p>
                </div>

                {/* Move buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    className="p-1 rounded hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-300">
            <p className="text-neutral-500 mb-4">Keine Lerntage generiert</p>
            <button
              onClick={generateLearningDays}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Lerntage generieren
            </button>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex gap-3">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-600 flex-shrink-0 mt-0.5"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-sm text-blue-700">
            Die Lerntage werden in dieser Reihenfolge in deinen Kalender eingefügt,
            basierend auf deiner Wochenstruktur.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step9Lerntage;
