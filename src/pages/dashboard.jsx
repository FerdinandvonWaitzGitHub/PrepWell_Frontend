import React from 'react';
import { Header, DashboardLayout } from '../components/layout';
import { LernblockWidget, ZeitplanWidget } from '../components/dashboard';
import { lernblockData, zeitplanData, dayProgress } from '../data/dashboard-mock-data';

/**
 * DashboardPage - Startseite
 * Main homepage/dashboard
 *
 * Figma: "✅ Startseite" (Node-ID: 2175:1761)
 * Status: ✅ Fully implemented from Figma with mock data
 */
const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header userInitials="CN" currentPage="startseite" />

      {/* Hero / Status Bar */}
      <section className="px-8 py-4 border-b border-gray-200 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-900">Montag, 10. November</p>
            <p className="text-xs text-gray-500">Dashboard</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 flex-1 justify-center md:justify-start lg:justify-center">
            <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-gray-200 bg-white text-sm text-gray-800 hover:bg-gray-50 transition-colors">
              Check-in am Morgen
              <span aria-hidden className="text-gray-500">→</span>
            </button>

            <div className="flex flex-col gap-1 min-w-[220px]">
              <div className="flex items-center justify-between text-xs text-gray-700">
                <span>{dayProgress.hoursCompleted}h von {dayProgress.hoursTarget}h Tageslernziel</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-gray-900 h-1.5 rounded-full transition-all"
                  style={{ width: `${dayProgress.percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-900">6min verbleibend</p>
              <p className="text-[11px] text-gray-500">18:25 → 18:55</p>
            </div>
            <button className="h-9 w-9 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="px-8 py-8 bg-white">
        <div className="max-w-[1440px] mx-auto">
          <DashboardLayout
            leftColumn={<LernblockWidget data={lernblockData} />}
            rightColumn={<ZeitplanWidget data={zeitplanData} />}
          />

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

export default DashboardPage;
