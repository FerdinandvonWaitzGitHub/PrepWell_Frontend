import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * KonsistenzStats - Consistency and habit statistics section
 */
const KonsistenzStats = ({ stats }) => {
  const {
    currentStreak,
    longestStreak,
    thisWeekDays,
    avgDaysPerWeek,
    totalLearningDays
  } = stats;

  // Create streak visualization data
  const streakData = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    streakData.push({
      day: date.toLocaleDateString('de-DE', { weekday: 'short' }),
      active: i < currentStreak ? 1 : 0
    });
  }

  return (
    <StatCategory title="Konsistenz & Gewohnheiten" icon="🔥">
      {/* Streak Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Aktueller Streak"
          value={currentStreak}
          unit="Tage"
          size="large"
          trend={currentStreak >= 7 ? 'up' : currentStreak >= 3 ? 'stable' : 'down'}
          trendValue={currentStreak >= 7 ? 'Super!' : 'Weiter so!'}
        />
        <StatCard
          label="Längster Streak"
          value={longestStreak}
          unit="Tage"
        />
        <StatCard
          label="Lerntage diese Woche"
          value={thisWeekDays}
          unit="/ 7 Tage"
        />
        <StatCard
          label="Ø Lerntage pro Woche"
          value={avgDaysPerWeek.toFixed(1)}
          unit="Tage"
        />
      </div>

      {/* Week Activity Visualization */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <h4 className="text-sm font-medium text-neutral-700 mb-4">Diese Woche</h4>
        <div className="flex justify-between items-center">
          {streakData.map((day, index) => (
            <div key={index} className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-1 ${
                  day.active
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-100 text-neutral-400'
                }`}
              >
                {day.active ? '🔥' : '-'}
              </div>
              <span className="text-xs text-neutral-500">{day.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Gesamt-Lerntage</p>
            <p className="text-2xl font-semibold text-neutral-900">{totalLearningDays}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-500">Ausfallquote</p>
            <p className="text-2xl font-semibold text-neutral-900">
              {thisWeekDays > 0 ? Math.round(((7 - thisWeekDays) / 7) * 100) : 100}%
            </p>
          </div>
        </div>
      </div>
    </StatCategory>
  );
};

export default KonsistenzStats;
