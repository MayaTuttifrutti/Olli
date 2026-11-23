import React from 'react';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckSquare,
  LayoutDashboard,
  Moon,
  Sun,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CHILD_PROFILE, PARENTS } from '../data/seedData';
import { NavTab, ParentId } from '../types/coParent';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeParent: ParentId;
  onChangeParent: (parent: ParentId) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  dueMedsCount: number;
  pendingSwapsCount: number;
  incompleteTasksCount: number;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  mobileLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Daily Overview', mobileLabel: 'Today', icon: LayoutDashboard },
  { id: 'calendar', label: 'Calendar & iCal', mobileLabel: 'Calendar', icon: CalendarDays },
  { id: 'health', label: 'Health & Pediatrics', mobileLabel: 'Health', icon: Activity },
  { id: 'tasks', label: 'Tasks & Bag', mobileLabel: 'Tasks', icon: CheckSquare },
  { id: 'analytics', label: 'Stats & Split', mobileLabel: 'Stats', icon: BarChart3 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  activeParent,
  onChangeParent,
  isDark,
  onToggleTheme,
  dueMedsCount,
  pendingSwapsCount,
  incompleteTasksCount,
}) => {
  const getBadgeCount = (id: NavTab): number => {
    if (id === 'health') return dueMedsCount;
    if (id === 'calendar') return pendingSwapsCount;
    if (id === 'tasks') return incompleteTasksCount;
    return 0;
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:w-64 lg:shrink-0 lg:flex-col lg:justify-between border-r border-stone-200 dark:border-white/10 bg-white dark:bg-[#141416] px-4 py-6">
        <div className="space-y-8">
          {/* Brand Wordmark */}
          <div className="px-2">
            <span className="font-display text-2xl font-bold tracking-tight text-[#101012] dark:text-[#F7F4EF] whitespace-nowrap">
              Olli
            </span>
          </div>

          {/* Child Profile Summary */}
          <div className="px-2 py-3 border-y border-stone-200 dark:border-white/10 flex items-center gap-3">
            <img
              src={CHILD_PROFILE.avatarUrl}
              alt={CHILD_PROFILE.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover shrink-0 bg-stone-200 dark:bg-white/10"
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#101012] dark:text-[#F7F4EF] truncate">
                {CHILD_PROFILE.name}, {CHILD_PROFILE.ageYears} yrs
              </div>
              <div className="text-xs text-stone-500 dark:text-stone-400 truncate font-mono tabular-nums">
                {CHILD_PROFILE.weightLbs} lbs · {CHILD_PROFILE.bloodType}
              </div>
            </div>
          </div>

          {/* Primary Navigation */}
          <nav aria-label="Main navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const count = getBadgeCount(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                    isActive
                      ? 'text-[#101012] dark:text-[#F7F4EF]'
                      : 'text-stone-600 dark:text-stone-400 hover:text-[#101012] dark:hover:text-[#F7F4EF] hover:bg-stone-100/80 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-indicator"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-stone-100 dark:bg-white/[0.08] border border-stone-200/80 dark:border-white/10"
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-3 whitespace-nowrap">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-rose-500 dark:text-amber-400'
                          : 'text-stone-400 dark:text-stone-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {count > 0 && (
                    <span className="relative z-10 text-xs font-mono tabular-nums text-rose-600 dark:text-amber-400 font-semibold">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Workspace Controls: Parent Perspective + Dark/Light Mode */}
        <div className="space-y-4 pt-6 border-t border-stone-200 dark:border-white/10">
          <div>
            <div className="px-1 mb-2 text-xs font-medium text-stone-500 dark:text-stone-400">
              Active parent view
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-stone-100 dark:bg-white/[0.05] border border-stone-200/80 dark:border-white/10">
              {(['claire', 'david'] as ParentId[]).map((pid) => {
                const parent = PARENTS[pid];
                const selected = activeParent === pid;
                return (
                  <button
                    key={pid}
                    type="button"
                    onClick={() => onChangeParent(pid)}
                    className={`flex items-center justify-center gap-2 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
                      selected
                        ? 'bg-white dark:bg-[#1E1E22] text-[#101012] dark:text-[#F7F4EF] shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-[#101012] dark:hover:text-[#F7F4EF]'
                    }`}
                  >
                    <img
                      src={parent.avatarUrl}
                      alt={parent.name}
                      referrerPolicy="no-referrer"
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{parent.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-white/[0.04] text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              {isDark ? (
                <Moon className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isDark ? 'Obsidian Dark' : 'Warm Ivory'}</span>
            </span>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              {isDark ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-stone-200 dark:border-white/10 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md px-2 py-1.5 flex items-center justify-around"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center gap-1 min-w-[56px] py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-rose-600 dark:text-amber-400'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[64px]">{item.mobileLabel}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
