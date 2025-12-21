import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * TimerStats - Timer and Pomodoro statistics section
 */
const TimerStats = ({ stats, formatDuration }) => {
  const {
    todaySessions,
    todayDuration,
    weekSessions,
    avgSessionsPerDay,
    completionRate,
    pomodoroCount,
    countdownCount,
    countupCount,
    preferredMode
  } = stats;

  // Mode distribution data
  const modeData = [
    { name: 'Pomodoro', value: pomodoroCount, color: '#EF4444' },
    { name: 'Countdown', value: countdownCount, color: '#3B82F6' },
    { name: 'Count-up', value: countupCount, color: '#10B981' }
  ].filter(d => d.value > 0);

  const totalSessions = pomodoroCount + countdownCount + countupCount;

  return (
    <StatCategory title="Timer & Pomodoro" icon="⏰">
      {/* Main Timer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sessions heute"
          value={todaySessions}
        />
        <StatCard
          label="Lernzeit heute"
          value={formatDuration(todayDuration)}
        />
        <StatCard
          label="Sessions diese Woche"
          value={weekSessions}
        />
        <StatCard
          label="Ø Sessions pro Tag"
          value={avgSessionsPerDay.toFixed(1)}
        />
      </div>

      {/* Completion & Mode Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Completion Rate */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">Abschlussrate</h4>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
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
                  stroke={completionRate >= 70 ? '#10B981' : completionRate >= 40 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="12"
                  strokeDasharray={`${(completionRate / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {Math.round(completionRate)}%
                </span>
                <span className="text-xs text-gray-500">abgeschlossen</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center mt-2">
            Sessions vollständig beendet vs. abgebrochen
          </p>
        </div>

        {/* Timer Mode Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Timer-Modus Verteilung
          </h4>
          {modeData.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {modeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} Sessions`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Präferierter Modus: <strong>{preferredMode}</strong>
              </p>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-gray-400">Noch keine Timer-Daten</p>
            </div>
          )}
        </div>
      </div>

      {/* Session Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Session-Übersicht</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-12 h-12 mx-auto mb-2 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-xl">🍅</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{pomodoroCount}</p>
            <p className="text-xs text-gray-500">Pomodoro</p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto mb-2 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏱️</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{countdownCount}</p>
            <p className="text-xs text-gray-500">Countdown</p>
          </div>
          <div>
            <div className="w-12 h-12 mx-auto mb-2 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-xl">⏲️</span>
            </div>
            <p className="text-xl font-semibold text-gray-900">{countupCount}</p>
            <p className="text-xs text-gray-500">Count-up</p>
          </div>
        </div>
      </div>

      {totalSessions === 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-100 p-4 text-center">
          <p className="text-blue-800">
            Starte den Timer auf dem Dashboard, um Statistiken zu sammeln!
          </p>
        </div>
      )}
    </StatCategory>
  );
};

export default TimerStats;
