import { useWizard } from '../context/wizard-context';
import { allTemplates } from '../../../data/templates';
import { Check, ChevronRight } from 'lucide-react';

/**
 * Step 7 - Template Path: Select a predefined template
 * User selects from available learning plan templates
 * Based on Figma: Schritt_7_Alt_3_body
 * Templates from: agent3 repository (6 templates for Jura exam preparation)
 */
const Step7Template = () => {
  const { selectedTemplate, updateWizardData } = useWizard();

  // Calculate template statistics
  const getTemplateStats = (template) => {
    const unterrechtsgebiete = new Set();
    template.content.forEach(item => {
      unterrechtsgebiete.add(item.unterrechtsgebiet);
    });

    const themenCount = template.content.length;

    // Calculate weight per Rechtsgebiet
    const rechtsgebietCounts = {};
    template.content.forEach(item => {
      rechtsgebietCounts[item.rechtsgebiet] = (rechtsgebietCounts[item.rechtsgebiet] || 0) + 1;
    });

    const weights = Object.entries(rechtsgebietCounts).map(([name, count]) => ({
      name,
      percentage: Math.round((count / themenCount) * 100)
    }));

    return {
      unterrechtsgebieteCount: unterrechtsgebiete.size,
      themenCount,
      weights
    };
  };

  const handleSelect = (templateId) => {
    updateWizardData({ selectedTemplate: templateId });
  };

  return (
    <div>
      {/* Header */}
      <div className="w-full flex flex-col items-center gap-2.5 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xl font-medium leading-7">Schritt 7</span>
        </div>
        <div className="w-full py-[5px] flex justify-center items-center">
          <h1 className="text-center text-gray-900 text-3xl md:text-5xl font-extralight leading-tight md:leading-[48px]">
            Wähle einen Lernplan aus.
          </h1>
        </div>
        <p className="w-full max-w-[900px] text-center text-gray-500 text-sm font-light leading-5">
          Unten siehst du unsere Auswahl an Lernplänen, die wir stets erweitern.
        </p>
      </div>

      {/* Template Cards */}
      <div className="w-full flex flex-col gap-2.5 overflow-hidden">
        {allTemplates.map((template) => {
          const stats = getTemplateStats(template);
          const isSelected = selectedTemplate === template.id;

          return (
            <div
              key={template.id}
              className="w-full bg-white rounded-[5px] border border-neutral-200 flex flex-col lg:flex-row overflow-hidden"
            >
              {/* Left Section - Info */}
              <div className="p-6 flex flex-col gap-4 flex-1">
                {/* Badges */}
                <div className="flex flex-wrap gap-4">
                  <div className="px-2 py-0.5 bg-gray-100 rounded-lg flex items-center">
                    <span className="text-gray-600 text-xs font-semibold leading-4">
                      {stats.unterrechtsgebieteCount} Unterrechtsgebiete
                    </span>
                  </div>
                  <div className="px-2 py-0.5 bg-gray-100 rounded-lg flex items-center">
                    <span className="text-gray-600 text-xs font-semibold leading-4">
                      {stats.themenCount} Themen
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="w-full max-w-[384px]">
                  <h3 className="text-gray-900 text-2xl font-extralight leading-6">
                    {template.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="w-full max-w-[487px] text-gray-400 text-sm font-normal leading-5">
                  {template.description}
                </p>
              </div>

              {/* Middle Section - Weights */}
              <div className="px-6 py-6 lg:py-10 flex flex-col gap-4">
                <div className="flex flex-col gap-[5px]">
                  <span className="text-gray-900 text-sm font-medium leading-5">
                    Gewichtung der Themenblöcke
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {stats.weights.map((weight) => (
                    <div
                      key={weight.name}
                      className="p-4 rounded-lg border border-gray-200 flex flex-col gap-1"
                    >
                      <span className="text-gray-900 text-sm font-medium leading-4">
                        {weight.percentage} %
                      </span>
                      <span className="text-gray-500 text-sm font-normal leading-5 line-clamp-2">
                        {weight.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Section - Button */}
              <div className="px-6 py-6 lg:py-10 flex flex-col justify-end items-end">
                <button
                  onClick={() => handleSelect(template.id)}
                  className={`px-5 py-2.5 rounded-3xl flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-slate-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-light leading-5">
                    {isSelected ? 'Ausgewählt' : 'Auswählen'}
                  </span>
                  {isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Step7Template;
