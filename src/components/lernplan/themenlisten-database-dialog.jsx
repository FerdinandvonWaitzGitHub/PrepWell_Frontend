import { useState, useMemo, useRef } from 'react';
import { THEMENLISTEN_TEMPLATES } from '../../data/themenlisten-templates';
import { useCalendar } from '../../contexts/calendar-context';

/**
 * TemplateCard - Single template card in the database
 */
const TemplateCard = ({ template, isSelected, onSelect, badge }) => {
  const { name, description, stats, gewichtung } = template;

  return (
    <div className={`p-5 bg-white rounded-xl border transition-all ${
      isSelected ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-300'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        {/* Left: Info */}
        <div className="flex-1">
          {/* Stats & Badge */}
          <div className="flex items-center gap-4 mb-2">
            <span className="text-xs font-medium text-neutral-600">
              {stats?.unterrechtsgebiete || 0} Unterrechtsgebiete
            </span>
            <span className="text-xs font-medium text-neutral-600">
              {stats?.themen || 0} Themen
            </span>
            {badge && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {badge}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-normal text-neutral-900 mb-2">
            {name}
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-500 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Right: Gewichtung & Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center gap-4">
          {/* Gewichtung */}
          {gewichtung && (
            <div className="flex flex-col gap-1">
              <span className="text-xs text-neutral-500 mb-1">Gewichtung der Themenblöcke</span>
              <div className="flex items-center gap-2">
                {gewichtung['oeffentliches-recht'] > 0 && (
                  <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200 min-w-[100px]">
                    <div className="text-sm font-medium text-neutral-900">
                      {gewichtung['oeffentliches-recht']} %
                    </div>
                    <div className="text-xs text-neutral-500">Öffentliches Recht</div>
                  </div>
                )}
                {gewichtung['zivilrecht'] > 0 && (
                  <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200 min-w-[100px]">
                    <div className="text-sm font-medium text-neutral-900">
                      {gewichtung['zivilrecht']} %
                    </div>
                    <div className="text-xs text-neutral-500">Zivilrecht</div>
                  </div>
                )}
                {gewichtung['strafrecht'] > 0 && (
                  <div className="px-3 py-2 bg-white rounded-lg border border-neutral-200 min-w-[100px]">
                    <div className="text-sm font-medium text-neutral-900">
                      {gewichtung['strafrecht']} %
                    </div>
                    <div className="text-xs text-neutral-500">Strafrecht</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Select Button */}
          <button
            onClick={() => onSelect(template)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
              isSelected
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-900 border border-neutral-300 hover:bg-neutral-50'
            }`}
          >
            {isSelected ? (
              <>
                Ausgewählt
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            ) : (
              <>
                Auswählen
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * ThemenlistenDatabaseDialog - Full-screen overlay for browsing template Themenlisten
 */
const ThemenlistenDatabaseDialog = ({ open, onClose, onImport }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('vorlagen'); // 'vorlagen' | 'community'
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  const { publishedThemenlisten, importThemenlisteFromJson } = useCalendar();

  // Get data based on active tab
  const templates = useMemo(() => {
    if (activeTab === 'vorlagen') {
      return THEMENLISTEN_TEMPLATES;
    }
    return publishedThemenlisten || [];
  }, [activeTab, publishedThemenlisten]);

  const handleSelect = (template) => {
    setSelectedTemplate(template.id === selectedTemplate?.id ? null : template);
  };

  const handleImport = () => {
    if (selectedTemplate) {
      onImport(selectedTemplate);
      onClose();
    }
  };

  // Handle JSON file import
  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      importThemenlisteFromJson(jsonData);
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      setImportError(error.message || 'Fehler beim Importieren der Datei');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xl font-semibold text-neutral-900">Themenlistendatenbank</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Import JSON Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 border border-neutral-300 text-neutral-700 rounded-full text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              JSON importieren
            </button>

            {selectedTemplate && (
              <button
                onClick={handleImport}
                className="px-5 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                Themenliste importieren
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-12 flex flex-col items-center">
        <div className="w-full max-w-[1200px]">
          {/* Title Section */}
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500 mb-2">Themenlistendatenbank</p>
            <h1 className="text-4xl font-extralight text-neutral-900 mb-4">
              Wähle eine Themenliste aus.
            </h1>
            <p className="text-sm text-neutral-500 max-w-xl mx-auto">
              {activeTab === 'vorlagen'
                ? 'Unten siehst du unsere Auswahl an Themenlisten, die wir stets erweitern.'
                : 'Hier findest du von dir oder anderen Nutzern veröffentlichte Themenlisten.'}
            </p>
          </div>

          {/* Import Error */}
          {importError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
              <span>{importError}</span>
              <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-neutral-100 rounded-lg p-1">
              <button
                onClick={() => { setActiveTab('vorlagen'); setSelectedTemplate(null); }}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'vorlagen'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Vorlagen
                <span className="ml-2 px-1.5 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded">
                  {THEMENLISTEN_TEMPLATES.length}
                </span>
              </button>
              <button
                onClick={() => { setActiveTab('community'); setSelectedTemplate(null); }}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'community'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Community
                <span className="ml-2 px-1.5 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded">
                  {publishedThemenlisten?.length || 0}
                </span>
              </button>
            </div>
          </div>

          {/* Template List */}
          <div className="flex flex-col gap-4">
            {templates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={handleSelect}
                badge={activeTab === 'community' ? 'Benutzer' : null}
              />
            ))}

            {templates.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-neutral-400">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <p className="text-neutral-500 mb-2">
                  {activeTab === 'community'
                    ? 'Noch keine Community-Themenlisten vorhanden.'
                    : 'Keine Vorlagen vorhanden.'}
                </p>
                {activeTab === 'community' && (
                  <p className="text-sm text-neutral-400">
                    Veröffentliche deine eigenen Themenlisten, um sie hier zu sehen.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemenlistenDatabaseDialog;
