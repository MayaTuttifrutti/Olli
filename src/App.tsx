import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, CheckCircle2, Moon, Sun } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AnalyticsView } from './components/AnalyticsView';
import { CalendarView } from './components/CalendarView';
import { EventModal } from './components/EventModal';
import { HealthView } from './components/HealthView';
import { OverviewView } from './components/OverviewView';
import { Sidebar } from './components/Sidebar';
import { TasksView } from './components/TasksView';
import {
  DEMO_NOW_ISO,
  INITIAL_CUSTODY_MAP,
  INITIAL_DOSE_LOGS,
  INITIAL_EVENTS,
  INITIAL_EXPENSES,
  INITIAL_MEDICATIONS,
  INITIAL_SWAP_REQUESTS,
  INITIAL_TASKS,
  INITIAL_TEMPERATURES,
  INITIAL_VISITS,
  PARENTS,
} from './data/seedData';
import {
  CalendarEvent,
  DoseLog,
  ExpenseItem,
  HandoverTask,
  Medication,
  NavTab,
  ParentId,
  PediatricVisit,
  SwapRequest,
  TemperatureReading,
} from './types/coParent';
import { getMedicationTimingStatus } from './utils/coParentLogic';
import { generateIcsFeed, generateSingleVisitIcs } from './utils/icsGenerator';

const STORAGE_KEY = 'olli_coparent_state_v1';

const TAB_TITLES: Record<NavTab, string> = {
  overview: 'Daily Overview',
  calendar: 'Calendar & iCal',
  health: 'Health & Pediatrics',
  tasks: 'Tasks & Bag',
  analytics: 'Stats & Split',
};

interface PersistedState {
  isDark: boolean;
  activeParent: ParentId;
  custodyMap: Record<string, ParentId>;
  events: CalendarEvent[];
  swapRequests: SwapRequest[];
  medications: Medication[];
  doseLogs: DoseLog[];
  temperatures: TemperatureReading[];
  visits: PediatricVisit[];
  tasks: HandoverTask[];
  expenses: ExpenseItem[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as PersistedState;
    }
  } catch {
    // ignore storage errors
  }
  return {
    isDark: true,
    activeParent: 'claire',
    custodyMap: INITIAL_CUSTODY_MAP,
    events: INITIAL_EVENTS,
    swapRequests: INITIAL_SWAP_REQUESTS,
    medications: INITIAL_MEDICATIONS,
    doseLogs: INITIAL_DOSE_LOGS,
    temperatures: INITIAL_TEMPERATURES,
    visits: INITIAL_VISITS,
    tasks: INITIAL_TASKS,
    expenses: INITIAL_EXPENSES,
  };
}

function triggerIcsDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [state, setState] = useState<PersistedState>(() => loadInitialState());
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const demoNow = useMemo(() => new Date(DEMO_NOW_ISO), []);

  useEffect(() => {
    const root = document.documentElement;
    if (state.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [state.isDark]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const dueMedsCount = useMemo(
    () =>
      state.medications.filter((m) => {
        const st = getMedicationTimingStatus(m, demoNow).status;
        return st === 'due_now' || st === 'soon';
      }).length,
    [state.medications, demoNow]
  );

  const pendingSwapsCount = useMemo(
    () => state.swapRequests.filter((s) => s.status === 'pending').length,
    [state.swapRequests]
  );

  const incompleteTasksCount = useMemo(
    () => state.tasks.filter((t) => !t.completed).length,
    [state.tasks]
  );

  const handleToggleTheme = () => {
    setState((prev) => ({ ...prev, isDark: !prev.isDark }));
  };

  const handleChangeParent = (parent: ParentId) => {
    setState((prev) => ({ ...prev, activeParent: parent }));
    showToast(`Switched view to ${PARENTS[parent].name}`);
  };

  const handleOpenNewEvent = (date?: string) => {
    setModalInitialDate(date);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (ev: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...ev,
      id: `ev-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      events: [...prev.events, newEvent],
    }));
    showToast(`Added "${newEvent.title}" and updated iCal feed.`);
  };

  const handleRequestSwap = (date: string, reason: string) => {
    const toParent: ParentId = state.activeParent === 'claire' ? 'david' : 'claire';
    const req: SwapRequest = {
      id: `sw-${Date.now()}`,
      date,
      fromParent: state.activeParent,
      toParent,
      reason,
      status: 'pending',
      createdAt: DEMO_NOW_ISO,
    };
    setState((prev) => ({
      ...prev,
      swapRequests: [req, ...prev.swapRequests],
    }));
    showToast(`Sent day swap request to ${PARENTS[toParent].name}.`);
  };

  const handleRespondSwap = (swapId: string, decision: 'approved' | 'declined') => {
    setState((prev) => {
      const target = prev.swapRequests.find((s) => s.id === swapId);
      const nextCustody = { ...prev.custodyMap };
      if (target && decision === 'approved') {
        const currentOwner = nextCustody[target.date] ?? target.fromParent;
        nextCustody[target.date] = currentOwner === 'claire' ? 'david' : 'claire';
      }
      return {
        ...prev,
        custodyMap: nextCustody,
        swapRequests: prev.swapRequests.map((s) =>
          s.id === swapId ? { ...s, status: decision } : s
        ),
      };
    });
    showToast(
      decision === 'approved'
        ? 'Swap approved — custody schedule and .ics feed updated.'
        : 'Swap request declined.'
    );
  };

  const handleLogDose = (medId: string, note?: string) => {
    const nowStamp = DEMO_NOW_ISO;
    setState((prev) => ({
      ...prev,
      medications: prev.medications.map((m) =>
        m.id === medId
          ? {
              ...m,
              lastGivenAt: nowStamp,
              lastGivenBy: prev.activeParent,
              dosesCompleted: Math.min(m.totalCourseDoses, m.dosesCompleted + 1),
            }
          : m
      ),
      doseLogs: [
        {
          id: `dl-${Date.now()}`,
          medicationId: medId,
          givenAt: nowStamp,
          givenBy: prev.activeParent,
          note,
        },
        ...prev.doseLogs,
      ],
    }));
    const medName = state.medications.find((m) => m.id === medId)?.name.split(' ')[0] ?? 'Medication';
    showToast(`Logged ${medName} dose by ${PARENTS[state.activeParent].name}.`);
  };

  const handleAddTemperature = (fahrenheit: number, symptoms: string) => {
    const reading: TemperatureReading = {
      id: `temp-${Date.now()}`,
      recordedAt: DEMO_NOW_ISO,
      fahrenheit,
      recordedBy: state.activeParent,
      symptoms,
    };
    setState((prev) => ({
      ...prev,
      temperatures: [...prev.temperatures, reading],
    }));
    showToast(`Saved temperature reading: ${fahrenheit.toFixed(1)}°F.`);
  };

  const handleAddVisit = (visit: Omit<PediatricVisit, 'id'>) => {
    const newVisit: PediatricVisit = {
      ...visit,
      id: `vis-${Date.now()}`,
    };
    const linkedEvent: CalendarEvent = {
      id: `ev-vis-${Date.now()}`,
      title: `Pediatrician: ${newVisit.reason}`,
      date: newVisit.date,
      startTime: newVisit.time,
      endTime: newVisit.time,
      category: 'pediatric',
      assignedParent: newVisit.attendingParent,
      location: newVisit.clinic,
      notes: newVisit.recommendations,
      reminderMinutes: 60,
      syncedToICal: true,
    };
    setState((prev) => ({
      ...prev,
      visits: [newVisit, ...prev.visits],
      events: [...prev.events, linkedEvent],
    }));
    showToast(`Added pediatrician visit (${newVisit.date}) and synced to calendar.`);
  };

  const handleToggleTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedBy: !t.completed ? prev.activeParent : undefined,
            }
          : t
      ),
    }));
  };

  const handleAddTask = (task: Omit<HandoverTask, 'id'>) => {
    setState((prev) => ({
      ...prev,
      tasks: [{ ...task, id: `tk-${Date.now()}` }, ...prev.tasks],
    }));
    showToast('Added item to shared handover list.');
  };

  const handleDeleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleAddExpense = (expense: Omit<ExpenseItem, 'id'>) => {
    setState((prev) => ({
      ...prev,
      expenses: [{ ...expense, id: `exp-${Date.now()}` }, ...prev.expenses],
    }));
    showToast(`Added expense ($${expense.amountUsd.toFixed(2)}) to 50/50 split.`);
  };

  const handleDownloadIcs = (filterParent: ParentId | 'all' = 'all', medicalOnly = false) => {
    const content = generateIcsFeed(state.events, state.visits, {
      calendarName:
        filterParent === 'all'
          ? 'Olli — Noah (Shared)'
          : `Olli — ${PARENTS[filterParent].name}`,
      filterParent,
      includeMedicalOnly: medicalOnly,
    });
    triggerIcsDownload(`olli-noah-${filterParent}.ics`, content);
    showToast('Generated .ics file ready for Apple iPhone Calendar.');
  };

  const handleExportVisitIcs = (visit: PediatricVisit) => {
    const content = generateSingleVisitIcs(visit);
    triggerIcsDownload(`pediatrician-${visit.date}.ics`, content);
    showToast(`Exported visit (${visit.date}) to .ics.`);
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <div className="min-h-screen flex bg-[#FAF7F2] dark:bg-[#101012] text-[#101012] dark:text-[#F7F4EF] transition-colors duration-200">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        activeParent={state.activeParent}
        onChangeParent={handleChangeParent}
        isDark={state.isDark}
        onToggleTheme={handleToggleTheme}
        dueMedsCount={dueMedsCount}
        pendingSwapsCount={pendingSwapsCount}
        incompleteTasksCount={incompleteTasksCount}
      />

      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Strict 3-Zone Top Header Bar */}
        <header className="sticky top-0 z-30 border-b border-stone-200 dark:border-white/10 bg-white/90 dark:bg-[#141416]/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand / Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="lg:hidden font-display text-lg font-bold text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
              Olli
            </span>
            <span className="lg:hidden text-stone-400">/</span>
            <span className="text-sm font-semibold text-stone-800 dark:text-stone-200 truncate">
              {TAB_TITLES[activeTab]}
            </span>
          </div>

          {/* Zone 2: Clean single-line context */}
          <div className="hidden md:flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
            <span>Noah (3 yrs)</span>
            <span aria-hidden="true">·</span>
            <span>Viewing as {PARENTS[state.activeParent].name}</span>
          </div>

          {/* Zone 3: 1 Primary CTA + Mobile theme quick switch */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={state.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="lg:hidden p-2 rounded-lg border border-stone-200 dark:border-white/15 text-stone-600 dark:text-stone-300"
            >
              {state.isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => handleOpenNewEvent()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap shrink-0"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>New event</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 lg:py-8">
          {/* Mobile Workspace Parent Perspective Switcher */}
          <div className="lg:hidden mb-5 flex items-center justify-between gap-3 rounded-xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] px-3.5 py-2.5">
            <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
              Active parent:
            </span>
            <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-stone-100 dark:bg-[#101012]">
              {(['claire', 'david'] as ParentId[]).map((pid) => (
                <button
                  key={pid}
                  type="button"
                  onClick={() => handleChangeParent(pid)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    state.activeParent === pid
                      ? 'bg-white dark:bg-[#232329] text-[#101012] dark:text-[#F7F4EF] shadow-xs'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {PARENTS[pid].name}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'overview' && (
                <OverviewView
                  activeParent={state.activeParent}
                  custodyMap={state.custodyMap}
                  events={state.events}
                  medications={state.medications}
                  temperatures={state.temperatures}
                  visits={state.visits}
                  tasks={state.tasks}
                  swapRequests={state.swapRequests}
                  now={demoNow}
                  onLogDose={handleLogDose}
                  onToggleTask={handleToggleTask}
                  onRespondSwap={handleRespondSwap}
                  onNavigate={handleSelectTab}
                  onDownloadIcs={() => handleDownloadIcs('all', false)}
                />
              )}

              {activeTab === 'calendar' && (
                <CalendarView
                  activeParent={state.activeParent}
                  custodyMap={state.custodyMap}
                  events={state.events}
                  visits={state.visits}
                  swapRequests={state.swapRequests}
                  onOpenNewEvent={handleOpenNewEvent}
                  onRequestSwap={handleRequestSwap}
                  onRespondSwap={handleRespondSwap}
                  onDownloadIcs={handleDownloadIcs}
                />
              )}

              {activeTab === 'health' && (
                <HealthView
                  activeParent={state.activeParent}
                  medications={state.medications}
                  doseLogs={state.doseLogs}
                  temperatures={state.temperatures}
                  visits={state.visits}
                  now={demoNow}
                  onLogDose={handleLogDose}
                  onAddTemperature={handleAddTemperature}
                  onAddVisit={handleAddVisit}
                  onExportVisitIcs={handleExportVisitIcs}
                />
              )}

              {activeTab === 'tasks' && (
                <TasksView
                  activeParent={state.activeParent}
                  tasks={state.tasks}
                  onToggleTask={handleToggleTask}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  activeParent={state.activeParent}
                  custodyMap={state.custodyMap}
                  expenses={state.expenses}
                  onAddExpense={handleAddExpense}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <EventModal
        isOpen={isEventModalOpen}
        initialDate={modalInitialDate}
        onClose={() => setIsEventModalOpen(false)}
        onSave={handleSaveEvent}
      />

      {/* Ephemeral Action Confirmation Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 rounded-xl border border-stone-200 dark:border-white/15 bg-white dark:bg-[#17171A] px-4 py-3 text-xs font-medium text-[#101012] dark:text-[#F7F4EF] shadow-lg max-w-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
