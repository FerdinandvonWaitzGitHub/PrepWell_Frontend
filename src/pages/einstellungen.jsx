import { Header, SubHeader } from '../components/layout';
import { SettingsContent } from '../components/settings';

/**
 * EinstellungenPage - Einstellungen
 * Settings and preferences page
 *
 * Figma: "⚠️ Einstellungen" (Node-ID: 2439:2920)
 * Status: ✅ Base layout implemented with placeholders
 */
const EinstellungenPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <Header userInitials="CN" currentPage="einstellungen" />

      {/* Sub-Header */}
      <SubHeader title="Einstellungen" />

      {/* Main Content */}
      <main className="p-12.5">
        <div className="max-w-[900px] mx-auto">
          <SettingsContent />

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-neutral-200">
            <p className="text-sm text-neutral-500 text-center">
              © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default EinstellungenPage;
