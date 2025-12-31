import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, SubHeader } from '../components/layout';
import { LernplanContent, ThemenlistenDatabaseDialog } from '../components/lernplan';
import { Button, PlusIcon } from '../components/ui';
import { useCalendar } from '../contexts/calendar-context';

/**
 * LernplanPage - Lernpläne Übersicht
 * Learning plans overview with horizontal bar layout
 *
 * Figma: "✅ Lernpläne" (Node-ID: 2129:2706)
 * Status: ✅ Implemented based on Figma design
 */
const LernplanPage = () => {
  const navigate = useNavigate();
  // Use ref to trigger create new in content component
  const contentRef = useRef(null);
  const [isDatabaseOpen, setIsDatabaseOpen] = useState(false);
  const { importThemenlisteTemplate } = useCalendar();

  const handleCreateNew = () => {
    // Navigate to wizard instead of inline creation
    navigate('/lernplan/erstellen', { state: { from: '/lernplan' } });
  };

  const handleCreateNewThemenliste = () => {
    // Create Themenliste inline (uses same structure as Lernplan but with type: 'themenliste')
    contentRef.current?.openCreateThemenlisteDialog();
  };

  const handleImportTemplate = (template) => {
    importThemenlisteTemplate(template);
    setIsDatabaseOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <Header userInitials="CN" currentPage="lernplan" />

      {/* Sub-Header with Create Buttons */}
      <SubHeader
        title="Lernpläne"
        actions={
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsDatabaseOpen(true)} variant="default" className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
              Themenlistendatenbank
            </Button>
            <Button onClick={handleCreateNewThemenliste} variant="default" className="flex items-center gap-2">
              <PlusIcon size={14} />
              Neue Themenliste
            </Button>
            <Button onClick={handleCreateNew} variant="primary" className="flex items-center gap-2">
              <PlusIcon size={14} />
              Neuen Lernplan erstellen
            </Button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 flex flex-col min-h-0">
        <LernplanContent ref={contentRef} className="flex-1 min-h-0" />

        {/* Footer */}
        <footer className="py-2 flex-shrink-0">
          <p className="text-xs text-neutral-400 text-center">
            © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
          </p>
        </footer>
      </main>

      {/* Themenlisten Database Dialog */}
      <ThemenlistenDatabaseDialog
        open={isDatabaseOpen}
        onClose={() => setIsDatabaseOpen(false)}
        onImport={handleImportTemplate}
      />
    </div>
  );
};

export default LernplanPage;
