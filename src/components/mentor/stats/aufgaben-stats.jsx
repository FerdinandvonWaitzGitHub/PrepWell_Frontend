import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * AufgabenStats - Tasks and topics statistics section
 */
const AufgabenStats = ({ stats, formatPercentage }) => {
  const {
    todayRate,
    weekRate,
    totalRate,
    todayTotal,
    todayCompleted,
    weekTotal,
    weekCompleted,
    overdueCount,
    totalKapitel,
    completedKapitel,
    inProgressKapitel,
    notStartedKapitel,
    totalThemen,
    completedThemen,
    themenRate
  } = stats;

  // Kapitel progress data
  const kapitelData = [
    { name: 'Abgeschlossen', value: completedKapitel, color: '#10B981' },
    { name: 'In Bearbeitung', value: inProgressKapitel, color: '#F59E0B' },
    { name: 'Nicht begonnen', value: notStartedKapitel, color: '#E5E7EB' }
  ];

  return (
    <StatCategory title="Aufgaben & Themen" icon="✅">
      {/* Completion Rates */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Erledigungsrate (Heute)"
          value={formatPercentage(todayRate)}
          trend={todayRate >= 80 ? 'up' : todayRate >= 50 ? 'stable' : 'down'}
          trendValue={`${todayCompleted}/${todayTotal} Aufgaben`}
        />
        <StatCard
          label="Erledigungsrate (Woche)"
          value={formatPercentage(weekRate)}
          trend={weekRate >= 80 ? 'up' : weekRate >= 50 ? 'stable' : 'down'}
          trendValue={`${weekCompleted}/${weekTotal} Aufgaben`}
        />
        <StatCard
          label="Erledigungsrate (Gesamt)"
          value={formatPercentage(totalRate)}
        />
        <StatCard
          label="Überfällige Aufgaben"
          value={overdueCount}
          trend={overdueCount > 5 ? 'down' : overdueCount > 0 ? 'stable' : 'up'}
          trendValue={overdueCount === 0 ? 'Alles aktuell!' : 'Offen'}
        />
      </div>

      {/* Kapitel Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kapitel Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Kapitel-Fortschritt</h4>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-green-600">{completedKapitel}</p>
              <p className="text-xs text-gray-500">Abgeschlossen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-amber-500">{inProgressKapitel}</p>
              <p className="text-xs text-gray-500">In Bearbeitung</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-400">{notStartedKapitel}</p>
              <p className="text-xs text-gray-500">Nicht begonnen</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden flex">
            {totalKapitel > 0 && (
              <>
                <div
                  className="h-3 bg-green-500"
                  style={{ width: `${(completedKapitel / totalKapitel) * 100}%` }}
                />
                <div
                  className="h-3 bg-amber-400"
                  style={{ width: `${(inProgressKapitel / totalKapitel) * 100}%` }}
                />
              </>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {totalKapitel} Kapitel insgesamt
          </p>
        </div>

        {/* Themen Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Themen-Fortschritt</h4>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              {/* Circular progress */}
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="12"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray={`${(themenRate / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {formatPercentage(themenRate)}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 text-center">
            {completedThemen} von {totalThemen} Themen abgeschlossen
          </p>
        </div>
      </div>
    </StatCategory>
  );
};

export default AufgabenStats;
