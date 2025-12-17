import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, SubHeader } from '../components/layout';
import { LernplanContent } from '../components/lernplan';
import { Button, PlusIcon } from '../components/ui';

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

  const handleCreateNew = () => {
    // Navigate to wizard instead of inline creation
    navigate('/lernplan/erstellen', { state: { from: '/lernplan' } });
  };

  const handleCreateNewThemenliste = () => {
    // Create Themenliste inline (uses same structure as Lernplan but with type: 'themenliste')
    contentRef.current?.openCreateThemenlisteDialog();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header userInitials="CN" currentPage="lernplan" />

      {/* Sub-Header with Create Buttons */}
      <SubHeader
        title="Lernpläne"
        actions={
          <div className="flex items-center gap-2">
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
          <p className="text-xs text-gray-400 text-center">
            © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LernplanPage;
