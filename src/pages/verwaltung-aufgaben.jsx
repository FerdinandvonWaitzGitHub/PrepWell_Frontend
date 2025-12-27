import { useState } from 'react';
import { X } from 'lucide-react';
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
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header currentPage="verwaltung-aufgaben" />

      {/* Sub-Header */}
      <SubHeader
        title="Aufgabenverwaltung"
        actions={
          <button
            onClick={() => setShowTutorialModal(true)}
            className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 hover:underline transition-colors"
          >
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

      {/* Tutorial Coming Soon Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Coming Soon</h3>
              <button
                onClick={() => setShowTutorialModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Das Tutorial wird bald verfügbar sein. Wir erstellen gerade hilfreiche Anleitungen für dich.
            </p>
            <button
              onClick={() => setShowTutorialModal(false)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerwaltungAufgabenPage;
