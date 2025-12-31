import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogClose
} from '../../ui/dialog';
import Button from '../../ui/button';
import { TrendingUpIcon, TrendingDownIcon } from '../../ui/icon';
import {
  useUebungsklausuren,
  RECHTSGEBIETE,
  RECHTSGEBIET_COLORS,
  formatPunkte,
  getGradeLabel,
} from '../../../contexts/uebungsklausuren-context';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';

/**
 * UebungsklausurenAuswertungDialog - Full analysis dialog with charts
 * Uses Recharts for visualization
 */
const UebungsklausurenAuswertungDialog = ({ open, onOpenChange }) => {
  const { stats, klausuren } = useUebungsklausuren();
  const [activeTab, setActiveTab] = useState('entwicklung'); // 'entwicklung' | 'verteilung'

  // Prepare line chart data - all grades over time
  const lineChartData = useMemo(() => {
    if (!stats.allGradesByDate || stats.allGradesByDate.length === 0) return [];

    return stats.allGradesByDate.map((grade, index) => {
      const date = new Date(grade.date);
      return {
        index: index + 1,
        date: `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear().toString().slice(-2)}`,
        punkte: grade.punkte,
        subject: grade.subject,
        title: grade.title,
      };
    });
  }, [stats.allGradesByDate]);

  // Prepare bar chart data - distribution by Rechtsgebiet
  const barChartData = useMemo(() => {
    return stats.distribution.map(d => ({
      subject: d.subject,
      count: d.count,
      percentage: d.percentage,
      color: RECHTSGEBIET_COLORS[d.subject]?.chart || '#9ca3af',
    }));
  }, [stats.distribution]);

  // Calculate average line data (rolling average)
  const avgLineData = useMemo(() => {
    if (lineChartData.length === 0) return [];

    let sum = 0;
    return lineChartData.map((d, i) => {
      sum += d.punkte;
      return {
        ...d,
        average: sum / (i + 1),
      };
    });
  }, [lineChartData]);

  // Custom tooltip for line chart
  const LineChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-neutral-900">{data.title}</p>
          <p className="text-sm text-neutral-600">{data.subject}</p>
          <p className="text-sm text-neutral-500">{data.date}</p>
          <p className="text-lg font-bold text-neutral-900 mt-1">
            {formatPunkte(data.punkte)}
          </p>
          <p className="text-xs text-neutral-500">{getGradeLabel(data.punkte)}</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const BarChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <p className="font-medium text-neutral-900">{data.subject}</p>
          <p className="text-sm text-neutral-600">{data.count} Klausuren</p>
          <p className="text-sm text-neutral-500">{data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Auswertung</DialogTitle>
          <DialogDescription>
            Analyse deiner Übungsklausuren
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-6 overflow-y-auto">
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-neutral-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-neutral-900">
                {stats.totalCount}
              </div>
              <div className="text-xs text-neutral-600">Klausuren</div>
            </div>
            <div className="bg-primary-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-primary-700">
                {stats.totalAverage > 0 ? stats.totalAverage.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-primary-600">Durchschnitt</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {stats.bestGrade !== null ? stats.bestGrade : '-'}
              </div>
              <div className="text-xs text-green-600">Beste Note</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1">
                {stats.overallTrend !== 0 && (
                  stats.overallTrend > 0 ? (
                    <TrendingUpIcon size={20} className="text-green-600" />
                  ) : (
                    <TrendingDownIcon size={20} className="text-red-600" />
                  )
                )}
                <span className={`text-2xl font-bold ${
                  stats.overallTrend > 0 ? 'text-green-700' : stats.overallTrend < 0 ? 'text-red-700' : 'text-neutral-700'
                }`}>
                  {stats.overallTrend !== 0 ? `${stats.overallTrend > 0 ? '+' : ''}${stats.overallTrend.toFixed(1)}` : '-'}
                </span>
              </div>
              <div className="text-xs text-amber-600">Trend</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-neutral-200">
            <button
              onClick={() => setActiveTab('entwicklung')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'entwicklung'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Entwicklung
            </button>
            <button
              onClick={() => setActiveTab('verteilung')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'verteilung'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Gewichtung der Rechtsgebiete
            </button>
          </div>

          {/* Charts */}
          {activeTab === 'entwicklung' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-900">
                Notenentwicklung über Zeit
              </h4>

              {lineChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={avgLineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="index"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        domain={[0, 18]}
                        ticks={[0, 4, 8, 12, 16, 18]}
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<LineChartTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="punkte"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 0, r: 4 }}
                        activeDot={{ r: 6, fill: '#2563eb' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#9ca3af"
                        strokeWidth={1}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-500">
                    Noch keine Daten vorhanden
                  </p>
                </div>
              )}

              <div className="flex items-center justify-center gap-6 text-xs text-neutral-500">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-blue-500"></div>
                  <span>Einzelnote</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-neutral-400 border-dashed"></div>
                  <span>Laufender Durchschnitt</span>
                </div>
              </div>

              {/* Subject-specific line charts */}
              <div className="space-y-4 pt-4 border-t border-neutral-200">
                <h4 className="text-sm font-medium text-neutral-900">
                  Entwicklung nach Rechtsgebiet
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {stats.subjectStats.map(subjectStat => (
                    <div key={subjectStat.subject} className="bg-neutral-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-neutral-700">
                          {subjectStat.subject}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {subjectStat.count} Klausuren
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold" style={{ color: RECHTSGEBIET_COLORS[subjectStat.subject]?.chart }}>
                          {subjectStat.count > 0 ? subjectStat.average.toFixed(1) : '-'}
                        </span>
                        {subjectStat.count > 2 && subjectStat.trend !== 0 && (
                          <span className={`flex items-center text-xs ${subjectStat.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {subjectStat.trend > 0 ? (
                              <TrendingUpIcon size={12} />
                            ) : (
                              <TrendingDownIcon size={12} />
                            )}
                            {Math.abs(subjectStat.trend).toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'verteilung' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-neutral-900">
                Verteilung der Übungsklausuren
              </h4>

              {barChartData.some(d => d.count > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="subject"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip content={<BarChartTooltip />} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-500">
                    Noch keine Daten vorhanden
                  </p>
                </div>
              )}

              {/* Percentage breakdown */}
              <div className="space-y-2">
                {barChartData.map(d => (
                  <div key={d.subject} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: d.color }}
                    ></div>
                    <span className="text-sm text-neutral-700 flex-1">{d.subject}</span>
                    <span className="text-sm font-medium text-neutral-900">
                      {d.count} ({d.percentage.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              {barChartData.some(d => d.count > 0) && (
                <div className="bg-amber-50 rounded-lg p-4 mt-4">
                  <h5 className="text-sm font-medium text-amber-800 mb-2">
                    Empfehlung
                  </h5>
                  <p className="text-sm text-amber-700">
                    {(() => {
                      const minCount = Math.min(...barChartData.map(d => d.count));
                      const underrepresented = barChartData.filter(d => d.count === minCount);
                      if (underrepresented.length > 0 && minCount < stats.totalCount / 3) {
                        return `Übe mehr ${underrepresented.map(d => d.subject).join(' und ')}, um eine ausgewogene Vorbereitung zu erreichen.`;
                      }
                      return 'Deine Verteilung ist ausgewogen. Weiter so!';
                    })()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="primary" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UebungsklausurenAuswertungDialog;
