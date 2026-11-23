import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Pill,
  Plus,
  Stethoscope,
  Thermometer,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { CHILD_PROFILE, PARENTS } from '../data/seedData';
import {
  DoseLog,
  Medication,
  ParentId,
  PediatricVisit,
  TemperatureReading,
} from '../types/coParent';
import {
  formatEnglishDate,
  formatTimeShort,
  getMedicationTimingStatus,
} from '../utils/coParentLogic';
import {
  getMedicationMeta,
  getShortDosage,
  MedicationIcon,
} from './MedicationIcon';

interface HealthViewProps {
  activeParent: ParentId;
  medications: Medication[];
  doseLogs: DoseLog[];
  temperatures: TemperatureReading[];
  visits: PediatricVisit[];
  now: Date;
  onLogDose: (medId: string, note?: string) => void;
  onAddTemperature: (fahrenheit: number, symptoms: string) => void;
  onAddVisit: (visit: Omit<PediatricVisit, 'id'>) => void;
  onExportVisitIcs: (visit: PediatricVisit) => void;
}

export const HealthView: React.FC<HealthViewProps> = ({
  activeParent,
  medications,
  doseLogs,
  temperatures,
  visits,
  now,
  onLogDose,
  onAddTemperature,
  onAddVisit,
  onExportVisitIcs,
}) => {
  const [tempValue, setTempValue] = useState('98.6');
  const [tempSymptoms, setTempSymptoms] = useState('');
  const [tempError, setTempError] = useState('');

  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitDate, setVisitDate] = useState('2026-11-28');
  const [visitTime, setVisitTime] = useState('11:00');
  const [visitDoctor, setVisitDoctor] = useState(CHILD_PROFILE.pediatrician);
  const [visitReason, setVisitReason] = useState('');
  const [visitRecommendations, setVisitRecommendations] = useState('');
  const [visitError, setVisitError] = useState('');

  const [hoveredTempIdx, setHoveredTempIdx] = useState<number | null>(null);
  const [showAllMeds, setShowAllMeds] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [expandedInfoId, setExpandedInfoId] = useState<string | null>(null);

  const sortedMedications = useMemo(
    () =>
      [...medications].sort(
        (a, b) => new Date(b.lastGivenAt).getTime() - new Date(a.lastGivenAt).getTime()
      ),
    [medications]
  );

  const visibleMedications = showAllMeds
    ? sortedMedications
    : sortedMedications.slice(0, 3);
  const hiddenMedsCount = Math.max(0, sortedMedications.length - 3);
  const visibleLogs = showAllLogs ? doseLogs : doseLogs.slice(0, 3);

  const handleTempSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(tempValue.replace(',', '.'));
    if (Number.isNaN(parsed) || parsed < 94 || parsed > 107) {
      setTempError('Enter a valid temperature between 94.0°F and 107.0°F.');
      return;
    }
    onAddTemperature(parsed, tempSymptoms.trim() || 'Routine check');
    setTempSymptoms('');
    setTempError('');
  };

  const handleVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitReason.trim()) {
      setVisitError('Please enter the reason for the pediatrician visit.');
      return;
    }
    onAddVisit({
      date: visitDate,
      time: visitTime,
      doctor: visitDoctor.trim() || CHILD_PROFILE.pediatrician,
      clinic: CHILD_PROFILE.clinic,
      reason: visitReason.trim(),
      status: 'upcoming',
      attendingParent: activeParent,
      recommendations:
        visitRecommendations.trim() || 'Pending doctor notes after consultation.',
    });
    setVisitReason('');
    setVisitRecommendations('');
    setVisitError('');
    setShowVisitForm(false);
  };

  // SVG chart coordinates for temperature curve (°F)
  const chartW = 560;
  const chartH = 180;
  const padX = 40;
  const padY = 20;
  const minT = 97.5;
  const maxT = 104.0;

  const points = temperatures.map((t, i) => {
    const x =
      temperatures.length === 1
        ? chartW / 2
        : padX + (i / (temperatures.length - 1)) * (chartW - padX * 2);
    const clamped = Math.max(minT, Math.min(maxT, t.fahrenheit));
    const y = padY + ((maxT - clamped) / (maxT - minT)) * (chartH - padY * 2);
    return { x, y, reading: t };
  });

  const polylinePath = points.map((p) => `${p.x},${p.y}`).join(' ');
  const feverThresholdY =
    padY + ((maxT - 100.4) / (maxT - minT)) * (chartH - padY * 2);

  return (
    <div className="space-y-8">
      {/* Compact Clinical Reference Strip */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="font-display text-lg font-bold text-[#101012] dark:text-[#F7F4EF]">
              {CHILD_PROFILE.name}, {CHILD_PROFILE.ageYears} yrs
            </h1>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {CHILD_PROFILE.pediatrician}
            </span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Allergies: {CHILD_PROFILE.allergies.join(', ')}
            </span>
          </div>
          <div className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400 shrink-0">
            {CHILD_PROFILE.weightLbs} lbs · {CHILD_PROFILE.bloodType}
          </div>
        </div>
      </section>

      {/* Glanceable Last-Given Medications (Top 3 most recent + Expand toggle) */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-stone-200 dark:border-white/10">
          <div>
            <h2 className="font-display text-xl font-bold text-[#101012] dark:text-[#F7F4EF]">
              Medications given
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Sorted by most recent · logging as {PARENTS[activeParent].name}
            </p>
          </div>
          {hiddenMedsCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAllMeds((prev) => !prev)}
              aria-expanded={showAllMeds}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-white/[0.05] text-xs font-semibold text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              {showAllMeds ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Show 3 most recent</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show remaining ({hiddenMedsCount})</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
          <AnimatePresence initial={false}>
            {visibleMedications.map((med, index) => {
              const timing = getMedicationTimingStatus(med, now);
              const meta = getMedicationMeta(med.name);
              const shortDosage = getShortDosage(med.dosage);
              const progressPct = Math.min(
                100,
                Math.round((med.dosesCompleted / med.totalCourseDoses) * 100)
              );
              const isMostRecent = index === 0;
              const isInfoOpen = expandedInfoId === med.id;

              return (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-5 transition-colors ${
                    isMostRecent
                      ? 'border-amber-500/50 suno-aura bg-amber-50/40 dark:bg-[#1C1B1E]'
                      : 'border-stone-200 dark:border-white/10 bg-stone-50/70 dark:bg-[#101012]/65'
                  }`}
                >
                  {/* Top Row: Product Icon + Short Name + Info toggle */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MedicationIcon kind={meta.kind} size="lg" />
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold text-[#101012] dark:text-[#F7F4EF] truncate">
                          {meta.shortName}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {meta.brandTag}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedInfoId((prev) => (prev === med.id ? null : med.id))
                      }
                      aria-expanded={isInfoOpen}
                      aria-label={`Dosage instructions for ${meta.shortName}`}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-[#101012] dark:hover:text-[#F7F4EF] hover:bg-stone-200/60 dark:hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hero Glanceable Readout: Last Given Time + Parent + Dosage */}
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-stone-200/80 dark:border-white/10">
                    <div>
                      <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        {isMostRecent ? 'Last given' : 'Previous dose'}
                      </div>
                      <div className="mt-0.5 font-mono tabular-nums text-xl sm:text-2xl font-bold text-[#101012] dark:text-[#F7F4EF]">
                        {formatTimeShort(med.lastGivenAt)}
                      </div>
                      <div className="text-xs font-medium text-stone-600 dark:text-stone-300">
                        {PARENTS[med.lastGivenBy].name}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                        Dose (q{med.intervalHours}h)
                      </div>
                      <div className="mt-0.5 text-lg font-bold text-[#101012] dark:text-[#F7F4EF] leading-tight">
                        {shortDosage}
                      </div>
                      <div className="text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400 mt-0.5">
                        {med.dosesCompleted}/{med.totalCourseDoses} doses
                      </div>
                    </div>
                  </div>

                  {isInfoOpen && (
                    <div className="text-xs text-stone-600 dark:text-stone-300 bg-white/80 dark:bg-[#101012] rounded-xl p-3 border border-stone-200 dark:border-white/10">
                      <span className="font-semibold">{med.name}:</span> {med.instructions}
                    </div>
                  )}

                  {/* Footer: Progress + Countdown + Action Button */}
                  <div className="space-y-3">
                    <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full suno-gradient"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`text-xs font-mono tabular-nums font-semibold ${
                          timing.status === 'due_now'
                            ? 'text-rose-600 dark:text-rose-400'
                            : timing.status === 'soon'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        Next: {timing.formattedCountdown}
                      </span>

                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => onLogDose(med.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap"
                      >
                        <Pill className="w-3.5 h-3.5" />
                        <span>Log dose</span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Compact Recent Dose History */}
        <div className="mt-6 pt-5 border-t border-stone-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Recent 3 doses
            </h3>
            {doseLogs.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllLogs((prev) => !prev)}
                className="text-xs font-medium text-rose-600 dark:text-amber-400 hover:underline"
              >
                {showAllLogs ? 'Show top 3' : `Show full log (${doseLogs.length})`}
              </button>
            )}
          </div>
          <div className="divide-y divide-stone-200/80 dark:divide-white/10">
            {visibleLogs.map((log) => {
              const med = medications.find((m) => m.id === log.medicationId);
              const meta = getMedicationMeta(med?.name ?? 'Medication');
              return (
                <div
                  key={log.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <MedicationIcon kind={meta.kind} size="sm" />
                    <span className="font-semibold text-[#101012] dark:text-[#F7F4EF] truncate">
                      {meta.shortName}
                    </span>
                    <span className="text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                      · {PARENTS[log.givenBy].name}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums text-xs font-semibold text-stone-600 dark:text-stone-300 shrink-0">
                    {formatTimeShort(log.givenAt)} · {formatEnglishDate(log.givenAt.slice(0, 10))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Temperature Chart + Add Reading Form */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <section className="xl:col-span-7 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Fever & symptom curve
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Dashed line marks 100.4°F fever threshold
              </p>
            </div>
            <Thermometer className="w-5 h-5 text-rose-500" />
          </div>

          <div className="mt-4 overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full min-w-[420px] h-48"
              role="img"
              aria-label="Noah temperature chart"
            >
              <defs>
                <linearGradient id="sunoLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>

              {[98.6, 100.4, 102.0, 103.5].map((val) => {
                const y = padY + ((maxT - val) / (maxT - minT)) * (chartH - padY * 2);
                const isThreshold = val === 100.4;
                return (
                  <g key={val}>
                    <line
                      x1={padX}
                      y1={y}
                      x2={chartW - padX}
                      y2={y}
                      stroke={isThreshold ? '#f43f5e' : 'currentColor'}
                      strokeOpacity={isThreshold ? 0.5 : 0.12}
                      strokeDasharray={isThreshold ? '4 4' : undefined}
                    />
                    <text
                      x={4}
                      y={y + 4}
                      fontSize="10"
                      className="fill-stone-400 font-mono"
                    >
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              <text
                x={chartW - padX}
                y={feverThresholdY - 5}
                textAnchor="end"
                fontSize="10"
                className="fill-rose-500 font-mono"
              >
                100.4°F
              </text>

              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="url(#sunoLineGrad)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={polylinePath}
                />
              )}

              {points.map((p, i) => {
                const isFever = p.reading.fahrenheit >= 100.4;
                const isHovered = hoveredTempIdx === i;
                return (
                  <g
                    key={p.reading.id}
                    onMouseEnter={() => setHoveredTempIdx(i)}
                    onMouseLeave={() => setHoveredTempIdx(null)}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 6 : 4.5}
                      fill={isFever ? '#f43f5e' : '#f59e0b'}
                      stroke="#101012"
                      strokeWidth="1.5"
                    />
                    <text
                      x={p.x}
                      y={chartH - 4}
                      textAnchor="middle"
                      fontSize="9"
                      className="fill-stone-400 font-mono"
                    >
                      {formatTimeShort(p.reading.recordedAt)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {hoveredTempIdx !== null && temperatures[hoveredTempIdx] && (
            <div className="mt-2 px-3 py-2 rounded-lg bg-stone-100 dark:bg-white/[0.06] text-xs text-stone-700 dark:text-stone-200 flex items-center justify-between">
              <span>
                <strong className="font-mono">
                  {temperatures[hoveredTempIdx].fahrenheit.toFixed(1)}°F
                </strong>{' '}
                · {temperatures[hoveredTempIdx].symptoms}
              </span>
              <span className="text-stone-500 dark:text-stone-400">
                {PARENTS[temperatures[hoveredTempIdx].recordedBy].name}
              </span>
            </div>
          )}
        </section>

        {/* Add Temperature Form + Recent Readings */}
        <section className="xl:col-span-5 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 space-y-5">
          <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
            Log temperature
          </h2>

          <form onSubmit={handleTempSubmit} className="space-y-3">
            {tempError && (
              <div className="text-xs text-rose-500 font-medium">{tempError}</div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="temp-input"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Temp (°F)
                </label>
                <input
                  id="temp-input"
                  type="text"
                  inputMode="decimal"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm font-mono tabular-nums text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="temp-symptoms"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Symptoms & mood
                </label>
                <input
                  id="temp-symptoms"
                  type="text"
                  value={tempSymptoms}
                  onChange={(e) => setTempSymptoms(e.target.value)}
                  placeholder="e.g. Playful, drinking water well"
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#101012] dark:bg-[#F7F4EF] text-xs font-semibold text-[#F7F4EF] dark:text-[#101012] hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save reading as {PARENTS[activeParent].name}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-stone-200 dark:border-white/10 space-y-2">
            <div className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Latest readings
            </div>
            <div className="divide-y divide-stone-200/80 dark:divide-white/10">
              {[...temperatures]
                .reverse()
                .slice(0, 3)
                .map((r) => (
                  <div key={r.id} className="py-2 flex items-start justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span
                        className={`font-mono tabular-nums font-semibold ${
                          r.fahrenheit >= 100.4
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {r.fahrenheit.toFixed(1)}°F
                      </span>
                      <span className="text-stone-600 dark:text-stone-300 ml-2">
                        {r.symptoms}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-stone-400 shrink-0">
                      {formatTimeShort(r.recordedAt)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      </div>

      {/* Pediatric Visits & Recommendations */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-white/10">
          <div>
            <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
              Pediatric visits & doctor notes
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Synced medical instructions accessible to both parents
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowVisitForm((prev) => !prev)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-white/[0.05] text-xs font-semibold text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{showVisitForm ? 'Close form' : 'Add pediatric visit'}</span>
          </button>
        </div>

        {showVisitForm && (
          <form
            onSubmit={handleVisitSubmit}
            className="mt-5 p-4 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-[#101012]/70 space-y-3"
          >
            {visitError && <div className="text-xs text-rose-500">{visitError}</div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="vis-date"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Visit date
                </label>
                <input
                  id="vis-date"
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] px-3 py-2 text-xs font-mono text-[#101012] dark:text-[#F7F4EF]"
                />
              </div>
              <div>
                <label
                  htmlFor="vis-time"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Time
                </label>
                <input
                  id="vis-time"
                  type="time"
                  value={visitTime}
                  onChange={(e) => setVisitTime(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] px-3 py-2 text-xs font-mono text-[#101012] dark:text-[#F7F4EF]"
                />
              </div>
              <div>
                <label
                  htmlFor="vis-doc"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Doctor
                </label>
                <input
                  id="vis-doc"
                  type="text"
                  value={visitDoctor}
                  onChange={(e) => setVisitDoctor(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] px-3 py-2 text-xs text-[#101012] dark:text-[#F7F4EF]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="vis-reason"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Reason for visit
                </label>
                <input
                  id="vis-reason"
                  type="text"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                  placeholder="e.g. Chest & airway checkup"
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] px-3 py-2 text-xs text-[#101012] dark:text-[#F7F4EF]"
                />
              </div>
              <div>
                <label
                  htmlFor="vis-rec"
                  className="block text-xs font-medium text-stone-600 dark:text-stone-400 mb-1"
                >
                  Doctor notes / prep
                </label>
                <input
                  id="vis-rec"
                  type="text"
                  value={visitRecommendations}
                  onChange={(e) => setVisitRecommendations(e.target.value)}
                  placeholder="e.g. Bring current medication log"
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#17171A] px-3 py-2 text-xs text-[#101012] dark:text-[#F7F4EF]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg suno-gradient text-xs font-semibold text-white"
              >
                Save visit & sync calendar
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-stone-200/80 dark:divide-white/10 mt-2">
          {visits.map((vis) => (
            <div
              key={vis.id}
              className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#101012] dark:text-[#F7F4EF]">
                  <Stethoscope className="w-4 h-4 text-rose-500 dark:text-amber-400 shrink-0" />
                  <span>{vis.reason}</span>
                </div>
                <div className="text-xs text-stone-500 dark:text-stone-400">
                  <span className="font-mono tabular-nums">
                    {formatEnglishDate(vis.date)} · {vis.time}
                  </span>{' '}
                  · {vis.doctor} ·{' '}
                  {vis.attendingParent === 'both'
                    ? 'Attending: Claire & David'
                    : `Attending: ${PARENTS[vis.attendingParent].name}`}
                </div>
                <p className="text-xs text-stone-700 dark:text-stone-300 pt-1">
                  {vis.recommendations}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-medium ${
                    vis.status === 'upcoming'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {vis.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                </span>
                {vis.status === 'upcoming' && (
                  <button
                    type="button"
                    onClick={() => onExportVisitIcs(vis)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-white/[0.05] text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Add to iPhone (.ics)</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
