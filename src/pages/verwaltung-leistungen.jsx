import { Header, SubHeader } from '../components/layout';
import UebungsklausurenContent from '../components/uebungsklausuren/uebungsklausuren-content';
import { SemesterleistungenContent } from '../components/semesterleistungen';
import { SemesterLeistungenProvider } from '../contexts/semester-leistungen-context';
import { useAppMode } from '../contexts/appmode-context';

/**
 * VerwaltungLeistungenPage - Verwaltung > Leistungen
 * Administration services management
 *
 * Shows different content based on app mode:
 * - Exam Mode: UebungsklausurenContent (practice exams for Staatsexamen)
 * - Normal Mode: SemesterleistungenContent (T28 - semester performances)
 *
 * Figma: "✅ Verwaltung -> Leistungen" (Node-ID: 2119:851)
 * Status: ✅ Implemented based on Figma design
 */
const VerwaltungLeistungenPage = () => {
  const { isExamMode } = useAppMode();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <Header userInitials="CN" currentPage="verwaltung-leistungen" />

      {/* Sub-Header */}
      <SubHeader title={isExamMode ? 'Übungsklausuren' : 'Leistungen verwalten'} />

      {/* Main Content */}
      <main className="flex-1 px-3 pt-2 pb-1 flex flex-col min-h-0">
        {isExamMode ? (
          <UebungsklausurenContent className="flex-1 min-h-0" />
        ) : (
          <SemesterLeistungenProvider>
            <SemesterleistungenContent className="flex-1 min-h-0" />
          </SemesterLeistungenProvider>
        )}

        {/* Footer */}
        <footer className="py-1 flex-shrink-0">
          <p className="text-xs text-neutral-400 text-center">
            © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
          </p>
        </footer>
      </main>
    </div>
  );
};

export default VerwaltungLeistungenPage;
