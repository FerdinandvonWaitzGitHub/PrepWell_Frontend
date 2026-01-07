import { useState, useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import { Plus, GripVertical, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { RECHTSGEBIET_LABELS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 15: Lernblöcke erstellen
 * Based on Figma: Lernplan_Prozess_Base
 *
 * Layout:
 * - Header with title and stats (Gewichtung, gesamt/verbraucht/verfügbar)
 * - URG tabs (horizontal)
 * - Two columns: Meine Themen (left) | Meine Lernblöcke (right)
 */

/**
 * Calculate total learning days from wizard data
 */
const calculateLearningDays = (startDate, endDate, bufferDays, vacationDays, weekStructure) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Count free days per week
  const freeDaysPerWeek = weekStructure
    ? Object.values(weekStructure).filter(blocks =>
        Array.isArray(blocks) && blocks.every(b => b === 'free')
      ).length
    : 2;

  const weeks = totalDays / 7;
  const freeDays = Math.floor(weeks * freeDaysPerWeek);
  const netDays = totalDays - (bufferDays || 0) - (vacationDays || 0) - freeDays;
  return Math.max(0, Math.floor(netDays));
};

/**
 * URG Tab Component (Figma style)
 */
const UrgTab = ({ urg, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-4 py-2 text-sm transition-all whitespace-nowrap
        ${isActive
          ? 'bg-white border border-neutral-200 rounded-lg font-medium text-neutral-900'
          : 'text-neutral-600 hover:text-neutral-900'
        }
      `}
    >
      {urg.name}
    </button>
  );
};

/**
 * Aufgabe Item Component (matching Step 12 / Figma design)
 */
const AufgabeItem = ({ aufgabe, onToggle, onPriorityChange, onDelete }) => {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-neutral-100 last:border-0">
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          aufgabe.completed
            ? 'bg-primary-600 border-primary-600'
            : 'border-neutral-300 hover:border-neutral-400'
        }`}
      >
        {aufgabe.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Aufgabe text */}
      <span className={`flex-1 text-sm ${aufgabe.completed ? 'line-through text-neutral-400' : 'text-neutral-700'}`}>
        {aufgabe.name || aufgabe.text || 'Aufgabe'}
      </span>

      {/* Priority buttons (!!) */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onPriorityChange(aufgabe.priority === 1 ? 0 : 1)}
          className={`w-6 h-6 rounded text-xs font-bold transition-all ${
            aufgabe.priority >= 1
              ? 'bg-amber-100 text-amber-600'
              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
          }`}
        >
          !
        </button>
        <button
          type="button"
          onClick={() => onPriorityChange(aufgabe.priority === 2 ? 0 : 2)}
          className={`w-6 h-6 rounded text-xs font-bold transition-all ${
            aufgabe.priority >= 2
              ? 'bg-red-100 text-red-600'
              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
          }`}
        >
          !
        </button>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * Theme Card Component (Figma style - like Step 12)
 */
const ThemeCard = ({
  thema,
  onDragStart,
  onAufgabeToggle,
  onAufgabePriority,
  onAufgabeDelete,
  onAddAufgabe
}) => {
  const [newAufgabe, setNewAufgabe] = useState('');

  const handleAddAufgabe = () => {
    if (newAufgabe.trim()) {
      onAddAufgabe(newAufgabe.trim());
      setNewAufgabe('');
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, thema)}
      className="bg-white rounded-lg border border-neutral-200 overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Theme Header */}
      <div className="flex items-center gap-2 p-3 bg-neutral-50 border-b border-neutral-200">
        <GripVertical className="w-4 h-4 text-neutral-400" />
        <span className="font-medium text-neutral-900">{thema.name}</span>
      </div>

      {/* Aufgaben List */}
      <div className="px-3">
        {thema.aufgaben?.map((aufgabe, idx) => (
          <AufgabeItem
            key={aufgabe.id || idx}
            aufgabe={aufgabe}
            onToggle={() => onAufgabeToggle(thema.id, aufgabe.id || idx)}
            onPriorityChange={(p) => onAufgabePriority(thema.id, aufgabe.id || idx, p)}
            onDelete={() => onAufgabeDelete(thema.id, aufgabe.id || idx)}
          />
        ))}
      </div>

      {/* Add Aufgabe */}
      <div className="p-3 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newAufgabe}
            onChange={(e) => setNewAufgabe(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddAufgabe()}
            placeholder="Neue Aufgabe..."
            className="flex-1 text-sm px-2 py-1 border-0 bg-transparent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddAufgabe}
            className="flex items-center gap-1 text-sm text-neutral-500 hover:text-primary-600"
          >
            <Plus className="w-4 h-4" />
            Neue Aufgabe
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Lernblock Card Component (Right Column)
 */
const LernblockCard = ({ block, onRemove, onDrop }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(e, block.id); }}
      className={`
        bg-white rounded-lg border-2 p-4 min-h-[120px] transition-all
        ${isDragOver ? 'border-primary-400 bg-primary-50' : 'border-dashed border-neutral-300'}
      `}
    >
      {block.themen?.length > 0 ? (
        <div className="space-y-2">
          {block.themen.map((t, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-neutral-50 rounded">
              <span className="text-sm">{t.name}</span>
              <button
                type="button"
                onClick={() => onRemove(block.id, t.id)}
                className="text-neutral-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-neutral-400 text-sm">
          Themen hierher ziehen
        </div>
      )}
    </div>
  );
};

/**
 * Step 15 Component
 */
const Step15Lernbloecke = () => {
  const {
    selectedRechtsgebiete,
    currentRechtsgebietIndex,
    unterrechtsgebieteDraft,
    themenDraft,
    rechtsgebieteGewichtung,
    startDate,
    endDate,
    bufferDays,
    vacationDays,
    blocksPerDay,
    weekStructure,
    lernbloeckeDraft,
    updateWizardData
  } = useWizard();

  const [activeUrgIndex, setActiveUrgIndex] = useState(0);
  const [draggingThema, setDraggingThema] = useState(null);

  // Current RG (from the loop, like Step 12)
  const currentRgId = selectedRechtsgebiete[currentRechtsgebietIndex] || selectedRechtsgebiete[0];
  const currentRgLabel = RECHTSGEBIET_LABELS[currentRgId] || currentRgId;
  const rgGewichtung = rechtsgebieteGewichtung[currentRgId] || 0;

  // URGs for current RG
  const currentUrgs = useMemo(() => {
    return unterrechtsgebieteDraft[currentRgId] || [];
  }, [unterrechtsgebieteDraft, currentRgId]);

  const activeUrg = currentUrgs[activeUrgIndex];

  // Blocks for current RG
  const currentBlocks = useMemo(() => {
    return lernbloeckeDraft[currentRgId] || [];
  }, [lernbloeckeDraft, currentRgId]);

  // Calculate block budget
  const learningDays = useMemo(() =>
    calculateLearningDays(startDate, endDate, bufferDays, vacationDays, weekStructure),
    [startDate, endDate, bufferDays, vacationDays, weekStructure]
  );

  const totalBlocksForRg = useMemo(() => {
    if (!rgGewichtung) return 0;
    return Math.floor(learningDays * blocksPerDay * (rgGewichtung / 100));
  }, [learningDays, blocksPerDay, rgGewichtung]);

  const usedBlocks = useMemo(() => {
    return currentBlocks.reduce((sum, block) =>
      sum + (block.themen?.length || 0), 0);
  }, [currentBlocks]);

  const availableBlocks = Math.max(0, totalBlocksForRg - usedBlocks);
  const usedPercentage = totalBlocksForRg > 0 ? Math.round((usedBlocks / totalBlocksForRg) * 100) : 0;

  // Themes for active URG
  const activeUrgThemen = useMemo(() => {
    if (!activeUrg) return [];
    return themenDraft[activeUrg.id] || [];
  }, [activeUrg, themenDraft]);

  // Handlers
  const handleDragStart = (e, thema) => {
    setDraggingThema(thema);
    e.dataTransfer.setData('text/plain', thema.id);
  };

  const handleDrop = (e, blockId) => {
    const themaId = e.dataTransfer.getData('text/plain');
    if (!themaId || !draggingThema) return;

    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        if (block.themen?.find(t => t.id === themaId)) return block;
        return {
          ...block,
          themen: [...(block.themen || []), { id: themaId, name: draggingThema.name }]
        };
      }
      return block;
    });

    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: updatedBlocks }
    });
    setDraggingThema(null);
  };

  const handleRemoveFromBlock = (blockId, themaId) => {
    const updatedBlocks = currentBlocks.map(block => {
      if (block.id === blockId) {
        return { ...block, themen: (block.themen || []).filter(t => t.id !== themaId) };
      }
      return block;
    });
    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: updatedBlocks }
    });
  };

  const handleAddBlock = () => {
    const newBlock = { id: `block-${Date.now()}`, themen: [] };
    updateWizardData({
      lernbloeckeDraft: { ...lernbloeckeDraft, [currentRgId]: [...currentBlocks, newBlock] }
    });
  };

  // Aufgaben handlers
  const handleAufgabeToggle = (themaId, aufgabeIdx) => {
    const updatedThemen = activeUrgThemen.map(t => {
      if (t.id === themaId) {
        const updatedAufgaben = t.aufgaben?.map((a, i) =>
          i === aufgabeIdx ? { ...a, completed: !a.completed } : a
        );
        return { ...t, aufgaben: updatedAufgaben };
      }
      return t;
    });
    updateWizardData({
      themenDraft: { ...themenDraft, [activeUrg.id]: updatedThemen }
    });
  };

  const handleAufgabePriority = (themaId, aufgabeIdx, priority) => {
    const updatedThemen = activeUrgThemen.map(t => {
      if (t.id === themaId) {
        const updatedAufgaben = t.aufgaben?.map((a, i) =>
          i === aufgabeIdx ? { ...a, priority } : a
        );
        return { ...t, aufgaben: updatedAufgaben };
      }
      return t;
    });
    updateWizardData({
      themenDraft: { ...themenDraft, [activeUrg.id]: updatedThemen }
    });
  };

  const handleAufgabeDelete = (themaId, aufgabeIdx) => {
    const updatedThemen = activeUrgThemen.map(t => {
      if (t.id === themaId) {
        return { ...t, aufgaben: t.aufgaben?.filter((_, i) => i !== aufgabeIdx) };
      }
      return t;
    });
    updateWizardData({
      themenDraft: { ...themenDraft, [activeUrg.id]: updatedThemen }
    });
  };

  const handleAddAufgabe = (themaId, text) => {
    const updatedThemen = activeUrgThemen.map(t => {
      if (t.id === themaId) {
        return {
          ...t,
          aufgaben: [...(t.aufgaben || []), { id: `aufgabe-${Date.now()}`, name: text, completed: false, priority: 0 }]
        };
      }
      return t;
    });
    updateWizardData({
      themenDraft: { ...themenDraft, [activeUrg.id]: updatedThemen }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-light text-neutral-900">
          Lernblöcke für {currentRgLabel}
        </h1>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-6 mb-8">
        {/* Gewichtung Badge */}
        <div className="px-4 py-1.5 bg-white rounded-full border border-neutral-200 text-sm">
          Gewichtung {rgGewichtung}%
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-xs text-neutral-500">gesamt</div>
            <div className="text-xl font-medium">{totalBlocksForRg}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500">verbraucht</div>
            <div className="text-xl font-medium">{usedBlocks}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-neutral-500">verfügbar</div>
            <div className="text-xl font-medium">{availableBlocks}</div>
          </div>
        </div>

        {/* Progress */}
        <div className="w-40">
          <div className="text-xs text-neutral-500 mb-1">{usedPercentage}% verbraucht</div>
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-neutral-800 transition-all"
              style={{ width: `${Math.min(100, usedPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Separator Line */}
      <div className="border-t border-neutral-200 mb-6" />

      {/* URG Tabs */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        {currentUrgs.map((urg, index) => (
          <UrgTab
            key={urg.id}
            urg={urg}
            isActive={index === activeUrgIndex}
            onClick={() => setActiveUrgIndex(index)}
          />
        ))}
      </div>

      {/* URGs anpassen link */}
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
      >
        <Pencil className="w-3.5 h-3.5" />
        URGs anpassen
      </button>

      {/* Instruction */}
      <p className="text-center text-neutral-600 mb-8">
        Erstelle Lernblöcke und bringe alle Themen darin unter.
      </p>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] gap-4 min-h-0">
        {/* Left Column: Meine Themen */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-neutral-900">Meine Themen</h2>
            <button
              type="button"
              className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
            >
              <Pencil className="w-3.5 h-3.5" />
              Themen anpassen
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {activeUrgThemen.length > 0 ? (
              activeUrgThemen.map(thema => (
                <ThemeCard
                  key={thema.id}
                  thema={thema}
                  onDragStart={handleDragStart}
                  onAufgabeToggle={handleAufgabeToggle}
                  onAufgabePriority={handleAufgabePriority}
                  onAufgabeDelete={handleAufgabeDelete}
                  onAddAufgabe={(text) => handleAddAufgabe(thema.id, text)}
                />
              ))
            ) : (
              <div className="p-8 bg-neutral-50 rounded-lg text-center text-neutral-500">
                Keine Themen für dieses Unterrechtsgebiet.
              </div>
            )}

            {/* Add Theme button */}
            <button
              type="button"
              className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors flex items-center justify-center gap-2"
            >
              Neues Thema hinzufügen
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center px-4">
          <ChevronRight className="w-8 h-8 text-neutral-300" />
        </div>

        {/* Right Column: Meine Lernblöcke */}
        <div className="flex flex-col min-h-0">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-neutral-900">Meine Lernblöcke</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {currentBlocks.map(block => (
              <LernblockCard
                key={block.id}
                block={block}
                onRemove={handleRemoveFromBlock}
                onDrop={handleDrop}
              />
            ))}

            {/* Add Block button */}
            <button
              type="button"
              onClick={handleAddBlock}
              className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:border-neutral-400 hover:text-neutral-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Neuer Lernblock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step15Lernbloecke;
