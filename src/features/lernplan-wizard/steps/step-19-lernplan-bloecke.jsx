import { useMemo } from 'react';
import { useWizard } from '../context/wizard-context';
import StepHeader from '../components/step-header';
import { CheckCircle2, Package } from 'lucide-react';
import { RECHTSGEBIET_LABELS, RECHTSGEBIET_COLORS } from '../../../data/unterrechtsgebiete-data';

/**
 * Step 19: Lernplanblöcke - Übersicht
 * Shows a summary of all blocks created in Step 15.
 * Uses lernbloeckeDraft (keyed by RG) - consistent with Steps 15, 18, and 21.
 *
 * NOTE: lernplanBloecke (keyed by URG) was removed as it was never used
 * by Step 21 calendar generation. All block data is now in lernbloeckeDraft.
 */

/**
 * Block Summary Card
 */
const BlockSummaryCard = ({ rgId, blocks }) => {
  const colorClass = RECHTSGEBIET_COLORS[rgId] || 'bg-gray-500';
  const label = RECHTSGEBIET_LABELS[rgId] || rgId;

  const totalThemes = blocks.reduce((sum, block) => sum + (block.themen?.length || 0), 0);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${colorClass}`} />
        <h4 className="font-medium text-neutral-900">{label}</h4>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-neutral-900">{blocks.length}</div>
          <div className="text-xs text-neutral-500">Lernblöcke</div>
        </div>
        <div className="bg-neutral-50 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-neutral-900">{totalThemes}</div>
          <div className="text-xs text-neutral-500">Themen</div>
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="mt-3 space-y-1">
          {blocks.slice(0, 3).map((block, idx) => (
            <div key={block.id} className="flex items-center gap-2 text-sm text-neutral-600">
              <Package className="w-3 h-3" />
              <span>Block {idx + 1}: {block.themen?.length || 0} Themen</span>
            </div>
          ))}
          {blocks.length > 3 && (
            <div className="text-xs text-neutral-400">
              +{blocks.length - 3} weitere Blöcke
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Step 19 Component
 */
const Step19LernplanBloecke = () => {
  const {
    selectedRechtsgebiete,
    lernbloeckeDraft,
  } = useWizard();

  // Calculate totals
  const { totalBlocks, totalThemes, blocksByRg } = useMemo(() => {
    let total = 0;
    let themes = 0;
    const byRg = {};

    selectedRechtsgebiete.forEach(rgId => {
      const blocks = lernbloeckeDraft[rgId] || [];
      byRg[rgId] = blocks;
      total += blocks.length;
      blocks.forEach(block => {
        themes += block.themen?.length || 0;
      });
    });

    return { totalBlocks: total, totalThemes: themes, blocksByRg: byRg };
  }, [selectedRechtsgebiete, lernbloeckeDraft]);

  const hasBlocks = totalBlocks > 0;

  return (
    <div>
      <StepHeader
        step={19}
        title="Deine Lernplanblöcke"
        description="Übersicht über alle erstellten Lernblöcke. Diese werden im nächsten Schritt auf deine Lerntage verteilt."
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-semibold text-primary-700">{totalBlocks}</div>
          <div className="text-sm text-primary-600">Lernblöcke gesamt</div>
        </div>
        <div className="bg-primary-50 rounded-lg p-4 text-center">
          <div className="text-3xl font-semibold text-primary-700">{totalThemes}</div>
          <div className="text-sm text-primary-600">Themen zugewiesen</div>
        </div>
      </div>

      {/* Blocks by RG */}
      {hasBlocks ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {selectedRechtsgebiete.map(rgId => (
            <BlockSummaryCard
              key={rgId}
              rgId={rgId}
              blocks={blocksByRg[rgId] || []}
            />
          ))}
        </div>
      ) : (
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-6 text-center mb-6">
          <p className="text-amber-700">
            <strong>Keine Lernblöcke erstellt.</strong><br />
            Gehe zurück zu Schritt 15, um Lernblöcke zu erstellen.
          </p>
        </div>
      )}

      {/* Success message if blocks exist */}
      {hasBlocks && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-900">
              {totalBlocks} Lernblöcke bereit
            </p>
            <p className="text-sm text-green-700">
              Im nächsten Schritt wählst du, wie die Blöcke auf deine Lerntage verteilt werden.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step19LernplanBloecke;
