import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * PlanungStats - Learning plan and planning statistics section
 */
const PlanungStats = ({ stats, formatPercentage }) => {
  const {
    daysSinceStart,
    daysUntilExam,
    timeProgress,
    stoffProgress,
    onTrackScore,
    missedDays,
    planFulfillmentTotal,
    activeDays,
    examDate
  } = stats;

  // Format exam date
  const formattedExamDate = examDate
    ? new Date(examDate).toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '-';

  // On-track status
  const getOnTrackStatus = (score) => {
    if (score >= 90) return { text: 'Sehr gut im Plan', trend: 'up', color: 'text-green-600' };
    if (score >= 70) return { text: 'Im Plan', trend: 'up', color: 'text-green-500' };
    if (score >= 50) return { text: 'Leicht hinter Plan', trend: 'stable', color: 'text-amber-500' };
    return { text: 'Hinter Plan', trend: 'down', color: 'text-red-500' };
  };

  const onTrackStatus = getOnTrackStatus(onTrackScore);

  return (
    <StatCategory title="Lernplan & Planung" icon="📅">
      {/* Main Timeline Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Tage seit Start"
          value={daysSinceStart}
          unit="Tage"
        />
        <StatCard
          label="Tage bis Examen"
          value={daysUntilExam}
          unit="Tage"
          trend={daysUntilExam <= 30 ? 'down' : daysUntilExam <= 90 ? 'stable' : 'up'}
          trendValue={examDate ? `am ${formattedExamDate}` : ''}
        />
        <StatCard
          label="Zeitfortschritt"
          value={formatPercentage(timeProgress)}
        />
        <StatCard
          label="Stofffortschritt"
          value={formatPercentage(stoffProgress)}
        />
      </div>

      {/* On-Track Score */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">On-Track Score</h4>
          <span className={`text-sm font-medium ${onTrackStatus.color}`}>
            {onTrackStatus.text}
          </span>
        </div>

        {/* Progress comparison */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Zeitfortschritt</span>
              <span className="font-medium">{formatPercentage(timeProgress)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, timeProgress)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Stofffortschritt</span>
              <span className="font-medium">{formatPercentage(stoffProgress)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, stoffProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* On-Track indicator */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className={`text-4xl font-bold ${onTrackStatus.color}`}>
                {Math.round(onTrackScore)}%
              </p>
              <p className="text-sm text-gray-500 mt-1">On-Track Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          label="Aktive Lerntage"
          value={activeDays}
          unit="Tage"
        />
        <StatCard
          label="Verpasste Lerntage"
          value={missedDays}
          unit="Tage"
          trend={missedDays <= 5 ? 'up' : missedDays <= 15 ? 'stable' : 'down'}
        />
        <StatCard
          label="Planerfüllung"
          value={formatPercentage(planFulfillmentTotal)}
        />
      </div>
    </StatCategory>
  );
};

export default PlanungStats;
