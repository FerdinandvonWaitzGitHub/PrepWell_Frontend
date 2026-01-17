/**
 * AuthLayout - Split-Screen Layout für Auth-Screens
 *
 * Figma-Referenz: Node 2396:4802
 * - Desktop: 50/50 Split (756px + 756px)
 * - Mobile: Stack-Layout (Logo oben, Form unten)
 */
export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Panel - Branding */}
        <div className="lg:w-1/2 bg-neutral-50 p-8 lg:p-12 flex items-center justify-center">
          <div className="max-w-md">
            {/* Logo - Text-Fallback da /public/logo.svg fehlt */}
            <span className="text-2xl font-bold text-gray-950 mb-8 block">
              PrepWell
            </span>

            <h1 className="text-3xl font-light text-gray-950 mb-4">
              Struktur. Klarheit. Wohlbefinden.
            </h1>

            <p className="text-gray-500">
              Dein Lernbegleiter für die Vorbereitung auf das Staatsexamen.
            </p>
          </div>
        </div>

        {/* Right Panel - Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-[500px]">
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-xs text-gray-500 bg-white border-t border-gray-200">
        © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
      </div>
    </div>
  );
}
