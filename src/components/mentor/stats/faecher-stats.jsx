import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import StatCard from './stat-card';
import StatCategory from './stat-category';

// Rechtsgebiet colors
const RG_COLORS = {
  'oeffentliches-recht': '#10B981',
  'zivilrecht': '#3B82F6',
  'strafrecht': '#EF4444',
  'querschnitt': '#8B5CF6'
};

const RG_NAMES = {
  'oeffentliches-recht': 'Öffentliches Recht',
  'zivilrecht': 'Zivilrecht',
  'strafrecht': 'Strafrecht',
  'querschnitt': 'Querschnittsrecht'
};

/**
 * FaecherStats - Subject/Rechtsgebiet statistics section
 */
const FaecherStats = ({ stats, formatPercentage }) => {
  const {
    distribution,
    progress,
    mostStudied,
    leastStudied,
    balanceScore,
    totalBlocks
  } = stats;

  // Prepare pie chart data
  const pieData = distribution.map(d => ({
    name: RG_NAMES[d.rechtsgebiet] || d.rechtsgebiet,
    value: d.count,
    color: RG_COLORS[d.rechtsgebiet] || '#9CA3AF'
  }));

  // Prepare progress data
  const progressData = Object.entries(progress).map(([rg, data]) => ({
    name: RG_NAMES[rg] || rg,
    fortschritt: Math.round(data.percentage),
    color: RG_COLORS[rg] || '#9CA3AF'
  }));

  return (
    <StatCategory title="Fächer & Rechtsgebiete" icon="📚">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Meistgelerntes Fach"
          value={RG_NAMES[mostStudied] || mostStudied || '-'}
        />
        <StatCard
          label="Wenigstgelerntes Fach"
          value={RG_NAMES[leastStudied] || leastStudied || '-'}
        />
        <StatCard
          label="Fächerbalance"
          value={formatPercentage(balanceScore)}
          trend={balanceScore >= 70 ? 'up' : balanceScore >= 40 ? 'stable' : 'down'}
          trendValue={balanceScore >= 70 ? 'Gut ausgeglichen' : 'Verbesserungspotential'}
        />
        <StatCard
          label="Gesamt-Blöcke"
          value={totalBlocks}
        />
      </div>

      {/* Distribution Chart */}
      {pieData.length > 0 && pieData.some(d => d.value > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-4">Fächerverteilung</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Blöcke`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress per Subject */}
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <h4 className="text-sm font-medium text-neutral-700 mb-4">Fortschritt pro Fach</h4>
            {progressData.length > 0 ? (
              <div className="space-y-3">
                {progressData.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-700">{item.name}</span>
                      <span className="font-medium">{item.fortschritt}%</span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${item.fortschritt}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500 text-center py-8">
                Noch keine Fortschrittsdaten verfügbar
              </p>
            )}
          </div>
        </div>
      )}

      {pieData.length === 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
          <p className="text-neutral-500">Noch keine Fächer-Daten verfügbar</p>
          <p className="text-sm text-neutral-400 mt-1">Erstelle Lernblöcke, um Statistiken zu sehen</p>
        </div>
      )}
    </StatCategory>
  );
};

export default FaecherStats;
