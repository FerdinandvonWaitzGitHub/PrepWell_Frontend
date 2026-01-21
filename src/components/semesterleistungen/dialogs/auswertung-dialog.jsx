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
import { CheckIcon, TrendingUpIcon } from '../../ui/icon';
import {
  useSemesterLeistungen,
  formatNote,
  NOTEN_SYSTEME,
} from '../../../contexts/semester-leistungen-context';
import { useLabels } from '../../../hooks/use-labels';

/**
 * AuswertungDialog - Dialog showing detailed statistics
 *
 * Figma: Node-ID 2585:4447
 * Layout: Two large boxes (Rechtsgebiete + Semester)
 */
const AuswertungDialog = ({ open, onOpenChange }) => {
  const { stats } = useSemesterLeistungen();
  const { subjectPlural } = useLabels(); // T29: Dynamic labels

  // TendenzangabeItem component for reuse
  const TendenzangabeItem = () => (
    <div className="flex items-center gap-1.5 text-green-600">
      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <TrendingUpIcon size={10} className="text-white" />
      </div>
      <span className="text-xs">Tendenzangabe</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="relative max-w-3xl">
        <DialogClose onClose={() => onOpenChange(false)} />

        <DialogHeader>
          <DialogTitle>Auswertung deiner Leistungen</DialogTitle>
          <DialogDescription>
            This is a dialog description.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="grid grid-cols-2 gap-6">
            {/* Left Box: Durchschnittsnoten der Rechtsgebiete/Fächer - T29: Dynamic label */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                Durchschnittsnoten der {subjectPlural}
              </h4>

              {/* Rechtsgebiet Stats */}
              <div className="space-y-0 divide-y divide-neutral-100">
                {stats.rechtsgebietStats.length > 0 ? (
                  stats.rechtsgebietStats.map((stat) => (
                    <div key={stat.rechtsgebiet} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm text-neutral-600">{stat.rechtsgebiet}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-neutral-900">
                            {stat.count > 0 ? stat.average.toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ∅ aus {stat.count} Leistungen
                          </span>
                        </div>
                      </div>
                      <TendenzangabeItem />
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-500">
                    Noch keine Leistungen mit Note
                  </div>
                )}
              </div>

              {/* Gewichtung der Rechtsgebiete/Fächer - T29: Dynamic label */}
              {stats.rechtsgebietStats.length > 0 && (
                <div className="mt-6 pt-4 border-t border-neutral-200">
                  <h5 className="text-sm font-medium text-neutral-900 mb-3">
                    Gewichtung der {subjectPlural}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {stats.rechtsgebietStats.map((stat) => (
                      <div
                        key={stat.rechtsgebiet}
                        className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg"
                      >
                        <div className="text-lg font-bold text-neutral-900">
                          {stat.percentage} %
                        </div>
                        <div className="text-xs text-neutral-500">{stat.rechtsgebiet}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Box: Durchschnittsnoten der Semester */}
            <div className="border border-neutral-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-4">
                Durchschnittsnoten der Semester
              </h4>

              {/* Semester Stats */}
              <div className="space-y-0 divide-y divide-neutral-100">
                {stats.semesterStats.length > 0 ? (
                  stats.semesterStats.map((stat) => (
                    <div key={stat.semester} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-sm text-neutral-600">{stat.semester}</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-neutral-900">
                            {stat.count > 0 ? stat.average.toFixed(1) : '-'}
                          </span>
                          <span className="text-xs text-neutral-400">
                            ∅ aus {stat.count} Leistungen
                          </span>
                        </div>
                      </div>
                      <TendenzangabeItem />
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center text-sm text-neutral-500">
                    Noch keine Semester-Daten
                  </div>
                )}
              </div>

              {/* Gesamtdurchschnitt */}
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <h5 className="text-sm font-medium text-neutral-900 mb-3">
                  Gesamtdurchschnitt
                </h5>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl font-bold text-neutral-900">
                    {stats.totalCount > 0 ? stats.gesamtdurchschnitt.toFixed(1) : '-'}
                  </span>
                  <span className="text-xs text-neutral-400">
                    ∅ aus {stats.totalCount} Leistungen
                  </span>
                  <div className="ml-2">
                    <TendenzangabeItem />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-end">
          <Button
            variant="primary"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1"
          >
            Fertig
            <CheckIcon size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuswertungDialog;
