import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  Check,
  Code2,
  Copy,
  Download,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { motion } from 'motion/react';
import { PARENTS, TODAY_ISO } from '../data/seedData';
import {
  CalendarEvent,
  ParentId,
  PediatricVisit,
  SwapRequest,
} from '../types/coParent';
import { formatEnglishDate } from '../utils/coParentLogic';
import { generateIcsFeed } from '../utils/icsGenerator';

interface CalendarViewProps {
  activeParent: ParentId;
  custodyMap: Record<string, ParentId>;
  events: CalendarEvent[];
  visits: PediatricVisit[];
  swapRequests: SwapRequest[];
  onOpenNewEvent: (date?: string) => void;
  onRequestSwap: (date: string, reason: string) => void;
  onRespondSwap: (swapId: string, decision: 'approved' | 'declined') => void;
  onDownloadIcs: (filterParent: ParentId | 'all', medicalOnly: boolean) => void;
}

const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_TEXT: Record<CalendarEvent['category'], string> = {
  custody: 'Custody',
  pediatric: 'Pediatrician',
  preschool: 'Preschool',
  handover: 'Handover',
  activity: 'Activity',
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  activeParent,
  custodyMap,
  events,
  visits,
  swapRequests,
  onOpenNewEvent,
  onRequestSwap,
  onRespondSwap,
  onDownloadIcs,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [icalFilter, setIcalFilter] = useState<ParentId | 'all'>('all');
  const [medicalOnly, setMedicalOnly] = useState<boolean>(false);
  const [copiedWebcal, setCopiedWebcal] = useState<boolean>(false);
  const [showIcsCode, setShowIcsCode] = useState<boolean>(false);
  const [swapReason, setSwapReason] = useState<string>('');
  const [showSwapForm, setShowSwapForm] = useState<boolean>(false);
  const [swapError, setSwapError] = useState<string>('');

  const novemberDays = useMemo(() => {
    const days: Array<{ date: string; dayNum: number } | null> = [
      null,
      null,
      null,
      null,
      null,
      null,
    ];
    for (let d = 1; d <= 30; d++) {
      const dateStr = `2026-11-${String(d).padStart(2, '0')}`;
      days.push({ date: dateStr, dayNum: d });
    }
    return days;
  }, []);

  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((e) => e.date === selectedDate)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, selectedDate]
  );

  const selectedCustodyParent: ParentId = custodyMap[selectedDate] ?? 'claire';

  const icsPreview = useMemo(
    () =>
      generateIcsFeed(events, visits, {
        calendarName:
          icalFilter === 'all'
            ? 'Olli — Noah (Shared)'
            : `Olli — ${PARENTS[icalFilter].name}`,
        filterParent: icalFilter,
        includeMedicalOnly: medicalOnly,
      }),
    [events, visits, icalFilter, medicalOnly]
  );

  const webcalUrl = `webcal://sync.olli-coparent.app/feeds/noah-bennett/${icalFilter}${
    medicalOnly ? '-pediatric' : ''
  }.ics`;

  const handleCopyWebcal = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
    } catch {
      // Fallback ignored in headless
    }
    setCopiedWebcal(true);
    setTimeout(() => setCopiedWebcal(false), 2000);
  };

  const handleSwapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!swapReason.trim()) {
      setSwapError('Please add a brief reason for the day swap request.');
      return;
    }
    onRequestSwap(selectedDate, swapReason.trim());
    setSwapReason('');
    setSwapError('');
    setShowSwapForm(false);
  };

  return (
    <div className="space-y-8">
      {/* Main Calendar + Day Inspector Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 cols: Monthly Custody Grid */}
        <section className="xl:col-span-8 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-white/10">
            <div>
              <h1 className="font-display text-xl font-bold text-[#101012] dark:text-[#F7F4EF]">
                November 2026 — Custody & Events
              </h1>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                2-2-3 rotation · Rose: Claire&apos;s days · Amber: David&apos;s days
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenNewEvent(selectedDate)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Add on Nov {Number(selectedDate.slice(8))}</span>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mt-5 mb-2">
            {WEEKDAYS_EN.map((wd) => (
              <div
                key={wd}
                className="text-center text-xs font-medium text-stone-500 dark:text-stone-400 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {novemberDays.map((cell, idx) => {
              if (!cell) {
                return <div key={`empty-${idx}`} className="h-20 sm:h-24 rounded-xl" />;
              }
              const owner = custodyMap[cell.date] ?? 'claire';
              const dayEvents = events.filter((e) => e.date === cell.date);
              const isSelected = cell.date === selectedDate;
              const isToday = cell.date === TODAY_ISO;

              return (
                <motion.button
                  key={cell.date}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedDate(cell.date)}
                  aria-label={`Nov ${cell.dayNum}, custody ${PARENTS[owner].name}, ${dayEvents.length} events`}
                  className={`relative h-20 sm:h-24 rounded-xl border p-2 text-left flex flex-col justify-between transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                    isSelected
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-500/12'
                      : 'border-stone-200/90 dark:border-white/10 bg-stone-50/60 dark:bg-[#101012]/60 hover:bg-stone-100/80 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`font-mono tabular-nums text-xs font-semibold ${
                        isToday
                          ? 'text-rose-600 dark:text-amber-400 underline underline-offset-4'
                          : 'text-[#101012] dark:text-[#F7F4EF]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        owner === 'claire'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {owner === 'claire' ? 'C' : 'D'}
                    </span>
                  </div>

                  <div className="space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] leading-tight truncate font-medium ${
                          ev.category === 'pediatric'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-stone-600 dark:text-stone-300'
                        }`}
                      >
                        {ev.startTime} {ev.title}
                      </div>
                    ))}
                    {dayEvents.length === 0 && (
                      <div className="text-[10px] text-stone-400 dark:text-stone-600 truncate">
                        {PARENTS[owner].name}
                      </div>
                    )}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-amber-500 font-medium">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Right 4 cols: Selected Day Detail & Custody Swap */}
        <section className="xl:col-span-4 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 space-y-5">
          <div className="pb-4 border-b border-stone-200 dark:border-white/10">
            <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Selected day
            </div>
            <h2 className="font-display text-lg font-bold text-[#101012] dark:text-[#F7F4EF] mt-0.5">
              {formatEnglishDate(selectedDate)}, 2026
            </h2>
            <div className="mt-2 flex items-center gap-2.5 text-sm text-stone-700 dark:text-stone-300">
              <img
                src={PARENTS[selectedCustodyParent].avatarUrl}
                alt={PARENTS[selectedCustodyParent].name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover"
              />
              <span>
                Primary custody: <strong>{PARENTS[selectedCustodyParent].name}</strong>
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Day schedule ({selectedDayEvents.length})
            </h3>

            {selectedDayEvents.length === 0 ? (
              <div className="py-6 text-center rounded-xl border border-dashed border-stone-200 dark:border-white/15">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  No scheduled events on this date.
                </p>
                <button
                  type="button"
                  onClick={() => onOpenNewEvent(selectedDate)}
                  className="mt-2 text-xs font-semibold text-rose-600 dark:text-amber-400 hover:underline"
                >
                  + Add visit or activity
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-200/80 dark:divide-white/10">
                {selectedDayEvents.map((ev) => (
                  <div key={ev.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#101012] dark:text-[#F7F4EF]">
                        {ev.title}
                      </span>
                      <span className="font-mono tabular-nums text-xs text-stone-500 dark:text-stone-400 shrink-0">
                        {ev.startTime}–{ev.endTime}
                      </span>
                    </div>
                    <div className="text-xs text-stone-500 dark:text-stone-400">
                      {CATEGORY_TEXT[ev.category]} ·{' '}
                      {ev.assignedParent === 'both'
                        ? 'Both parents'
                        : PARENTS[ev.assignedParent].name}
                      {ev.location ? ` · ${ev.location}` : ''}
                    </div>
                    {ev.notes && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 pt-1">
                        {ev.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Request Flow */}
          <div className="pt-4 border-t border-stone-200 dark:border-white/10 space-y-3">
            {!showSwapForm ? (
              <button
                type="button"
                onClick={() => setShowSwapForm(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-white/[0.04] text-xs font-semibold text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Request day swap ({formatEnglishDate(selectedDate)})</span>
              </button>
            ) : (
              <form onSubmit={handleSwapSubmit} className="space-y-3">
                <label
                  htmlFor="swap-reason"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300"
                >
                  Swap reason (requested by {PARENTS[activeParent].name})
                </label>
                <textarea
                  id="swap-reason"
                  rows={2}
                  value={swapReason}
                  onChange={(e) => setSwapReason(e.target.value)}
                  placeholder="e.g. Out-of-town flight, happy to swap next Saturday"
                  className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-xs text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {swapError && <div className="text-xs text-rose-500">{swapError}</div>}
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSwapForm(false);
                      setSwapError('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-lg suno-gradient text-xs font-semibold text-white"
                  >
                    Send request
                  </button>
                </div>
              </form>
            )}

            {swapRequests.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  Swap requests
                </div>
                {swapRequests.map((sw) => (
                  <div
                    key={sw.id}
                    className="p-3 rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-[#101012]/70 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#101012] dark:text-[#F7F4EF]">
                        {formatEnglishDate(sw.date)} · {PARENTS[sw.fromParent].name}
                      </span>
                      <span
                        className={`font-medium ${
                          sw.status === 'approved'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : sw.status === 'declined'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {sw.status === 'approved'
                          ? 'Approved'
                          : sw.status === 'declined'
                          ? 'Declined'
                          : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 dark:text-stone-400">{sw.reason}</p>
                    {sw.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onRespondSwap(sw.id, 'approved')}
                          className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-[11px] font-semibold text-white"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onRespondSwap(sw.id, 'declined')}
                          className="px-2.5 py-1 rounded-md border border-stone-300 dark:border-white/15 text-[11px] font-medium text-stone-700 dark:text-stone-300"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Apple iPhone iCalendar (.ics) RFC 5545 Sync Studio */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] suno-aura p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b border-stone-200 dark:border-white/10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-amber-400">
              <Smartphone className="w-4 h-4" />
              <span>Two-way Apple Calendar sync (iOS / iPhone)</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#101012] dark:text-[#F7F4EF]">
              iCalendar (.ics) Feed for Claire & David
            </h2>
            <p className="text-sm text-stone-600 dark:text-stone-300">
              Every custody handover and pediatrician visit compiles into standard RFC 5545 format with{' '}
              <span className="font-mono text-xs text-[#101012] dark:text-[#F7F4EF]">VALARM</span> alerts. Subscribe once in iPhone Calendar so schedule edits refresh automatically.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onDownloadIcs(icalFilter, medicalOnly)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download .ics for iPhone</span>
            </button>
            <button
              type="button"
              onClick={() => setShowIcsCode((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-stone-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.06] text-xs font-medium text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/[0.1] transition-colors whitespace-nowrap"
            >
              <Code2 className="w-4 h-4" />
              <span>{showIcsCode ? 'Hide RFC 5545' : 'Inspect RFC 5545'}</span>
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                role="group"
                aria-label="Filter iCal feed"
                className="inline-flex items-center gap-1 p-1 rounded-lg bg-stone-100 dark:bg-[#101012] border border-stone-200/80 dark:border-white/10"
              >
                {(
                  [
                    { id: 'all', label: 'All events' },
                    { id: 'claire', label: 'Claire only' },
                    { id: 'david', label: 'David only' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setIcalFilter(opt.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      icalFilter === opt.id
                        ? 'bg-white dark:bg-[#232329] text-[#101012] dark:text-[#F7F4EF] shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-[#101012] dark:hover:text-[#F7F4EF]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setMedicalOnly((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  medicalOnly
                    ? 'border-rose-500/50 bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    : 'border-stone-200 dark:border-white/10 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-white/[0.06]'
                }`}
              >
                {medicalOnly ? 'Filter: Pediatric visits only' : 'Include all categories'}
              </button>
            </div>

            <div>
              <label
                htmlFor="webcal-url-input"
                className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
              >
                Apple Calendar subscription URL (webcal://)
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="webcal-url-input"
                  type="text"
                  readOnly
                  value={webcalUrl}
                  className="flex-1 rounded-lg border border-stone-300 dark:border-white/15 bg-stone-50 dark:bg-[#101012] px-3 py-2 text-xs font-mono text-stone-800 dark:text-stone-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyWebcal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#232329] text-xs font-semibold text-[#101012] dark:text-[#F7F4EF] hover:bg-stone-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  {copiedWebcal ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2.5 text-xs text-stone-600 dark:text-stone-400 border-t lg:border-t-0 lg:border-l border-stone-200 dark:border-white/10 pt-4 lg:pt-0 lg:pl-6">
            <div className="font-semibold text-[#101012] dark:text-[#F7F4EF]">
              Connect to iPhone Calendar (iOS 17/18):
            </div>
            <p>1. Open the Apple Calendar app and tap &ldquo;Calendars&rdquo; at the bottom.</p>
            <p>2. Tap &ldquo;Add Calendar&rdquo; → &ldquo;Add Subscription Calendar&rdquo;.</p>
            <p>3. Paste the `webcal://` URL above or open the downloaded `.ics` file directly in Safari.</p>
            <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-stone-500 dark:text-stone-400">
              <span>Claire iPhone: synced 3:18 PM</span>
              <span>David iPhone: synced 3:12 PM</span>
            </div>
          </div>
        </div>

        {showIcsCode && (
          <motion.pre
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl border border-stone-200 dark:border-white/10 bg-[#0B0B0D] text-stone-200 text-xs font-mono overflow-x-auto max-h-72 leading-relaxed"
          >
            {icsPreview}
          </motion.pre>
        )}
      </section>
    </div>
  );
};
