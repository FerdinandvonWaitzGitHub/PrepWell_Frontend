import React from 'react';
import { Header, SubHeader } from '../components/layout';
import { MentorContent } from '../components/mentor';

/**
 * MentorPage - Mentor
 * AI Mentor dashboard with check-in, scores, and statistics
 *
 * Figma: "⚠️ Mentor" (Node-ID: 2439:2921)
 * Status: ✅ Base layout implemented with placeholders
 */
const MentorPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header userInitials="CN" currentPage="mentor" />

      {/* Sub-Header */}
      <SubHeader
        title="Mentor"
        actions={
          <div className="flex items-center gap-4">
            {/* Day Display */}
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">
                {new Date().toLocaleDateString('de-DE', { weekday: 'long' })}
              </span>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>

            {/* Check-In Button */}
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors">
              Check-In
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <main className="p-12.5">
        <div className="max-w-[1440px] mx-auto">
          <MentorContent />

          {/* Footer */}
          <footer className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              © 2026 PrepWell GmbH - Impressum & Datenschutzerklärung
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default MentorPage;
