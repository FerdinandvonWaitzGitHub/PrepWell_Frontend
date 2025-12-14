import { Header, SubHeader } from '../components/layout';
import { LeistungenContent } from '../components/verwaltung';

/**
 * VerwaltungLeistungenPage - Verwaltung > Leistungen
 * Administration services management
 *
 * Figma: "✅ Verwaltung -> Leistungen" (Node-ID: 2119:851)
 * Status: ✅ Implemented based on Figma design
 */
const VerwaltungLeistungenPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <Header userInitials="CN" currentPage="verwaltung-leistungen" />

      {/* Sub-Header */}
      <SubHeader title="Leistungen verwalten" />

      {/* Main Content */}
      <main className="flex-1 px-3 pt-2 pb-1 flex flex-col min-h-0">
        <LeistungenContent className="flex-1 min-h-0" />

        {/* Footer */}
        <footer className="py-1 flex-shrink-0">
          <p className="text-xs text-gray-400 text-center">
            © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
          </p>
        </footer>
      </main>
    </div>
  );
};

export default VerwaltungLeistungenPage;
