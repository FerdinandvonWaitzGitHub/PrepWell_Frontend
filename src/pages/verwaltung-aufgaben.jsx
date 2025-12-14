import { Header, SubHeader } from '../components/layout';
import { AufgabenContent } from '../components/verwaltung';

/**
 * VerwaltungAufgabenPage - Verwaltung > Aufgaben
 * Administration tasks management
 *
 * Figma: "✅ Verwaltung -> Aufgaben" (Node-ID: 2206:9505)
 * Status: ✅ Implemented based on Figma design
 */
const VerwaltungAufgabenPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header userInitials="CN" currentPage="verwaltung-aufgaben" />

      {/* Sub-Header */}
      <SubHeader
        title="Aufgabenverwaltung"
        actions={
          <button className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors">
            Link zum Tutorial
          </button>
        }
      />

      {/* Main Content */}
      <main className="px-3 pt-2 pb-1">
        <div className="w-full">
          <AufgabenContent />

          {/* Footer */}
          <footer className="py-1">
            <p className="text-xs text-gray-400 text-center">
              © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default VerwaltungAufgabenPage;
