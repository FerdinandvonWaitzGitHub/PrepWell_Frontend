import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import StatCard from './stat-card';
import StatCategory from './stat-category';

/**
 * KlausurenStats - Exam and grade statistics section
 */
const KlausurenStats = ({ stats }) => {
  const {
    totalExams,
    avgGrade,
    bestGrade,
    worstGrade,
    gradeTrend,
    upcomingCount,
    passedCount,
    failedCount,
    bySubject
  } = stats;

  // Prepare subject chart data
  const subjectData = (bySubject || []).map(s => ({
    name: s.subject?.substring(0, 10) || '-',
    note: s.average || 0,
    anzahl: s.count || 0
  }));

  // Grade trend indicator
  const getTrendInfo = (trend) => {
    if (trend > 0.5) return { direction: 'up', text: 'Verbesserung' };
    if (trend < -0.5) return { direction: 'down', text: 'Verschlechterung' };
    return { direction: 'stable', text: 'Stabil' };
  };

  const trendInfo = getTrendInfo(gradeTrend);

  // Format grade (German system: 0-18 points)
  const formatGrade = (grade) => {
    if (grade === null || grade === undefined) return '-';
    return grade.toFixed(1);
  };

  return (
    <StatCategory title="Klausuren & Leistungen" icon="📝">
      {/* Main Grade Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Ø Gesamtnote"
          value={formatGrade(avgGrade)}
          unit="Punkte"
          size="large"
          trend={trendInfo.direction}
          trendValue={trendInfo.text}
        />
        <StatCard
          label="Beste Note"
          value={formatGrade(bestGrade)}
          unit="Punkte"
        />
        <StatCard
          label="Schlechteste Note"
          value={formatGrade(worstGrade)}
          unit="Punkte"
        />
        <StatCard
          label="Geschriebene Klausuren"
          value={totalExams}
        />
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-semibold text-green-600">{passedCount}</p>
          <p className="text-sm text-neutral-500">Bestanden</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-semibold text-red-600">{failedCount}</p>
          <p className="text-sm text-neutral-500">Nicht bestanden</p>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-4 text-center">
          <p className="text-3xl font-semibold text-blue-600">{upcomingCount}</p>
          <p className="text-sm text-neutral-500">Anstehend</p>
        </div>
      </div>

      {/* Subject Breakdown Chart */}
      {subjectData.length > 0 && subjectData.some(d => d.anzahl > 0) && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <h4 className="text-sm font-medium text-neutral-700 mb-4">Durchschnittsnote pro Fach</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  type="number"
                  domain={[0, 18]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}P`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  width={80}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'note' ? `${value} Punkte` : `${value} Klausuren`,
                    name === 'note' ? 'Ø Note' : 'Anzahl'
                  ]}
                />
                <Bar dataKey="note" fill="#FFC4C4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {totalExams === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500">Noch keine Klausuren eingetragen</p>
          <p className="text-sm text-neutral-400 mt-1">
            Füge Klausuren unter Verwaltung → Leistungen hinzu
          </p>
        </div>
      )}
    </StatCategory>
  );
};

export default KlausurenStats;
