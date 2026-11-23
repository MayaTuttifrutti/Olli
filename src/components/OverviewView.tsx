import React from 'react';
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Clock,
  Pill,
  RefreshCw,
  Stethoscope,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PARENTS, TODAY_ISO } from '../data/seedData';
import {
  CalendarEvent,
  HandoverTask,
  Medication,
  NavTab,
  ParentId,
  PediatricVisit,
  SwapRequest,
  TemperatureReading,
} from '../types/coParent';
import {
  calculateCustodyBalance,
  calculateTaskProgress,
  formatEnglishDate,
  formatTimeShort,
  getMedicationTimingStatus,
} from '../utils/coParentLogic';
import { getMedicationMeta } from './MedicationIcon';

interface OverviewViewProps {
  activeParent: ParentId;
  custodyMap: Record<string, ParentId>;
  events: CalendarEvent[];
  medications: Medication[];
  temperatures: TemperatureReading[];
  visits: PediatricVisit[];
  tasks: HandoverTask[];
  swapRequests: SwapRequest[];
  now: Date;
  onLogDose: (medId: string) => void;
  onToggleTask: (taskId: string) => void;
  onRespondSwap: (swapId: string, decision: 'approved' | 'declined') => void;
  onNavigate: (tab: NavTab) => void;
  onDownloadIcs: () => void;
}

const CATEGORY_LABELS: Record<CalendarEvent['category'], string> = {
  custody: 'Custody',
  pediatric: 'Pediatrician',
  preschool: 'Preschool',
  handover: 'Handover',
  activity: 'Activity',
};

export const OverviewView: React.FC<OverviewViewProps> = ({
  activeParent,
  custodyMap,
  events,
  medications,
  temperatures,
  visits,
  tasks,
  swapRequests,
  now,
  onLogDose,
  onToggleTask,
  onRespondSwap,
  onNavigate,
  onDownloadIcs,
}) => {
  const todayCustodyParentId = custodyMap[TODAY_ISO] ?? 'claire';
  const todayParent = PARENTS[todayCustodyParentId];
  const otherParent = PARENTS[todayCustodyParentId === 'claire' ? 'david' : 'claire'];
  const balance = calculateCustodyBalance(custodyMap);
  const taskProgress = calculateTaskProgress(tasks);
  const latestTemp = temperatures[temperatures.length - 1];
  const nextVisit = visits.find((v) => v.status === 'upcoming');
  const pendingSwaps = swapRequests.filter((s) => s.status === 'pending');

  const upcomingEvents = [...events]
    .filter((e) => e.date >= TODAY_ISO)
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`))
    .slice(0, 4);

  const bagTasks = tasks.filter((t) => t.group === 'bag');

  return (
    <div className="space-y-8">
      {/* Dominant Hero Anchor with Suno Atmospheric Aura */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] suno-aura p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={todayParent.avatarUrl}
              alt={todayParent.fullName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-stone-200 dark:border-white/15"
            />
            <div className="space-y-1">
              <div className="text-xs font-medium text-rose-600 dark:text-amber-400">
                Saturday, Nov 21, 2026 · Active custody
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#101012] dark:text-[#F7F4EF]">
                Noah is with {todayParent.name} today
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300">
                Next handover to {otherParent.name} on Sunday at{' '}
                <span className="font-mono tabular-nums font-semibold text-[#101012] dark:text-[#F7F4EF]">
                  5:30 PM
                </span>{' '}
                · Cedar Park East Entrance
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onDownloadIcs}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] text-sm font-medium text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap"
            >
              <CalendarCheck className="w-4 h-4 text-rose-500 dark:text-amber-400" />
              <span>Export .ics (iPhone)</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('health')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg suno-gradient text-sm font-semibold text-white transition-all whitespace-nowrap shadow-sm"
            >
              <Pill className="w-4 h-4" />
              <span>Meds & Fever Log</span>
            </button>
          </div>
        </div>

        {/* Full-width 4-column KPI strip below hero */}
        <div className="mt-8 pt-6 border-t border-stone-200/80 dark:border-white/10 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="min-w-0">
            <div className="text-xs text-stone-500 dark:text-stone-400">Latest temperature</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
                {latestTemp ? `${latestTemp.fahrenheit.toFixed(1)}°F` : '—'}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap">
                {latestTemp && latestTemp.fahrenheit < 100.4 ? 'Fever cleared' : 'Monitoring'}
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs text-stone-500 dark:text-stone-400">November split</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
                {balance.clairePercent}% / {balance.davidPercent}%
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                Claire · David
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs text-stone-500 dark:text-stone-400">Handover bag</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
                {taskProgress.completed}/{taskProgress.total}
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                ({taskProgress.percent}% packed)
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="text-xs text-stone-500 dark:text-stone-400">Next pediatrician</div>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-mono tabular-nums text-xl sm:text-2xl font-semibold text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
                {nextVisit ? formatEnglishDate(nextVisit.date) : 'None'}
              </span>
              {nextVisit && (
                <span className="text-xs text-stone-500 dark:text-stone-400 font-mono tabular-nums whitespace-nowrap">
                  {nextVisit.time}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pending Custody Swap Alert Banner */}
      {pendingSwaps.length > 0 && (
        <section className="rounded-2xl border border-amber-400/50 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/10 p-5">
          {pendingSwaps.map((sw) => (
            <div
              key={sw.id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    Day swap request · {formatEnglishDate(sw.date)} · from{' '}
                    {PARENTS[sw.fromParent].name}
                  </span>
                </div>
                <p className="text-sm text-[#101012] dark:text-[#F7F4EF]">{sw.reason}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onRespondSwap(sw.id, 'declined')}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-white/10 transition-colors"
                >
                  Decline
                </button>
                <button
                  type="button"
                  onClick={() => onRespondSwap(sw.id, 'approved')}
                  className="px-3.5 py-2 rounded-lg suno-gradient text-xs font-semibold text-white transition-all"
                >
                  Approve swap & sync iCal
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Two-Column Core Operations */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Active Pediatric Medications */}
        <section className="xl:col-span-7 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Today&apos;s medication schedule
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Logging as {PARENTS[activeParent].name} · instant sync with co-parent
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('health')}
              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-amber-400 hover:underline whitespace-nowrap"
            >
              <span>Full card</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-stone-200/80 dark:divide-white/10">
            {medications.map((med) => {
              const timing = getMedicationTimingStatus(med, now);
              const meta = getMedicationMeta(med.name);
              const isDue = timing.status === 'due_now';
              const isSoon = timing.status === 'soon';
              return (
                <div
                  key={med.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-semibold text-[#101012] dark:text-[#F7F4EF] truncate">
                      {meta.shortName} · {med.dosage}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      Last given{' '}
                      <span className="font-mono tabular-nums font-medium">
                        {formatTimeShort(med.lastGivenAt)}
                      </span>{' '}
                      ({PARENTS[med.lastGivenBy].name})
                    </div>
                    <div
                      className={`text-xs font-mono tabular-nums font-medium ${
                        isDue
                          ? 'text-rose-600 dark:text-rose-400'
                          : isSoon
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      Next dose: {timing.formattedCountdown} · {med.dosesCompleted}/
                      {med.totalCourseDoses}
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={() => onLogDose(med.id)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isDue
                        ? 'suno-gradient text-white'
                        : 'border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-white/[0.05] text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    Log dose
                  </motion.button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 5 cols: Upcoming Events + Handover Checklist */}
        <div className="xl:col-span-5 space-y-6">
          <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
              <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Upcoming events
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('calendar')}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-amber-400 hover:underline whitespace-nowrap"
              >
                <span>Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-stone-200/80 dark:divide-white/10">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-sm font-medium text-[#101012] dark:text-[#F7F4EF] truncate">
                      {ev.title}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {CATEGORY_LABELS[ev.category]} ·{' '}
                      {ev.assignedParent === 'both'
                        ? 'Claire & David'
                        : PARENTS[ev.assignedParent].name}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums font-medium text-[#101012] dark:text-[#F7F4EF]">
                      {ev.startTime}
                    </div>
                    <div className="text-[11px] text-stone-500 dark:text-stone-400">
                      {formatEnglishDate(ev.date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                  Handover bag
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Items to pack for Sunday 5:30 PM
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks')}
                className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-amber-400 hover:underline whitespace-nowrap"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {bagTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-stone-50 dark:hover:bg-white/[0.04] text-left transition-colors"
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                      task.completed
                        ? 'suno-gradient border-transparent text-white'
                        : 'border-stone-300 dark:border-white/25 bg-transparent'
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3" />}
                  </span>
                  <span
                    className={`text-sm ${
                      task.completed
                        ? 'line-through text-stone-400 dark:text-stone-500'
                        : 'text-stone-800 dark:text-stone-200'
                    }`}
                  >
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Pediatric Note Preview */}
      {nextVisit && (
        <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-rose-500 dark:text-amber-400 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Next visit: {nextVisit.reason} · {formatEnglishDate(nextVisit.date)},{' '}
                <span className="font-mono tabular-nums">{nextVisit.time}</span>
              </div>
              <div className="text-xs text-stone-600 dark:text-stone-400">
                {nextVisit.doctor} · {nextVisit.clinic} · Note: {nextVisit.recommendations}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 text-xs text-stone-500 dark:text-stone-400">
            <Clock className="w-3.5 h-3.5" />
            <span>iCal alert: 60 min before</span>
          </div>
        </section>
      )}
    </div>
  );
};
