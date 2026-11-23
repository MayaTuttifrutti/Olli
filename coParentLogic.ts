import {
  ExpenseItem,
  HandoverTask,
  Medication,
  ParentId,
} from '../types/coParent';

export interface CustodyBalance {
  claireDays: number;
  davidDays: number;
  totalDays: number;
  clairePercent: number;
  davidPercent: number;
}

export function calculateCustodyBalance(custodyMap: Record<string, ParentId>): CustodyBalance {
  const entries = Object.values(custodyMap);
  const totalDays = entries.length;
  if (totalDays === 0) {
    return { claireDays: 0, davidDays: 0, totalDays: 0, clairePercent: 50, davidPercent: 50 };
  }
  const claireDays = entries.filter((p) => p === 'claire').length;
  const davidDays = totalDays - claireDays;
  const clairePercent = Math.round((claireDays / totalDays) * 100);
  const davidPercent = 100 - clairePercent;
  return { claireDays, davidDays, totalDays, clairePercent, davidPercent };
}

export interface MedicationTimingStatus {
  nextDueAt: Date;
  minutesRemaining: number;
  status: 'due_now' | 'soon' | 'scheduled';
  formattedCountdown: string;
}

export function getMedicationTimingStatus(
  med: Medication,
  now: Date
): MedicationTimingStatus {
  const last = new Date(med.lastGivenAt);
  const nextDueAt = new Date(last.getTime() + med.intervalHours * 3600 * 1000);
  const diffMs = nextDueAt.getTime() - now.getTime();
  const minutesRemaining = Math.round(diffMs / 60000);

  if (minutesRemaining <= 0) {
    const overdueMin = Math.abs(minutesRemaining);
    const hrs = Math.floor(overdueMin / 60);
    const mins = overdueMin % 60;
    return {
      nextDueAt,
      minutesRemaining,
      status: 'due_now',
      formattedCountdown:
        hrs > 0
          ? `Due now (${hrs}h ${mins}m overdue)`
          : overdueMin > 5
          ? `Due now (+${overdueMin}m)`
          : 'Due now',
    };
  }

  const hrs = Math.floor(minutesRemaining / 60);
  const mins = minutesRemaining % 60;
  const formattedCountdown =
    hrs > 0 ? `in ${hrs}h ${String(mins).padStart(2, '0')}m` : `in ${mins}m`;

  return {
    nextDueAt,
    minutesRemaining,
    status: minutesRemaining <= 60 ? 'soon' : 'scheduled',
    formattedCountdown,
  };
}

export interface ExpenseSettlement {
  totalUsd: number;
  clairePaidUsd: number;
  davidPaidUsd: number;
  claireShareUsd: number;
  davidShareUsd: number;
  owesParent: ParentId | null;
  owedToParent: ParentId | null;
  settlementAmountUsd: number;
}

export function calculateExpenseSettlement(expenses: ExpenseItem[]): ExpenseSettlement {
  let totalUsd = 0;
  let clairePaidUsd = 0;
  let davidPaidUsd = 0;
  let claireShareUsd = 0;
  let davidShareUsd = 0;

  for (const item of expenses) {
    totalUsd += item.amountUsd;
    if (item.paidBy === 'claire') {
      clairePaidUsd += item.amountUsd;
    } else {
      davidPaidUsd += item.amountUsd;
    }
    const clairePart = item.amountUsd * item.splitRatio;
    const davidPart = item.amountUsd * (1 - item.splitRatio);
    claireShareUsd += clairePart;
    davidShareUsd += davidPart;
  }

  const claireNet = Number((clairePaidUsd - claireShareUsd).toFixed(2));
  if (Math.abs(claireNet) < 0.01) {
    return {
      totalUsd: round2(totalUsd),
      clairePaidUsd: round2(clairePaidUsd),
      davidPaidUsd: round2(davidPaidUsd),
      claireShareUsd: round2(claireShareUsd),
      davidShareUsd: round2(davidShareUsd),
      owesParent: null,
      owedToParent: null,
      settlementAmountUsd: 0,
    };
  }

  if (claireNet > 0) {
    return {
      totalUsd: round2(totalUsd),
      clairePaidUsd: round2(clairePaidUsd),
      davidPaidUsd: round2(davidPaidUsd),
      claireShareUsd: round2(claireShareUsd),
      davidShareUsd: round2(davidShareUsd),
      owesParent: 'david',
      owedToParent: 'claire',
      settlementAmountUsd: round2(claireNet),
    };
  }

  return {
    totalUsd: round2(totalUsd),
    clairePaidUsd: round2(clairePaidUsd),
    davidPaidUsd: round2(davidPaidUsd),
    claireShareUsd: round2(claireShareUsd),
    davidShareUsd: round2(davidShareUsd),
    owesParent: 'claire',
    owedToParent: 'david',
    settlementAmountUsd: round2(Math.abs(claireNet)),
  };
}

export function calculateTaskProgress(tasks: HandoverTask[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = tasks.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = tasks.filter((t) => t.completed).length;
  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

export function formatTimeShort(isoOrTime: string): string {
  if (/^\d{2}:\d{2}$/.test(isoOrTime)) return isoOrTime;
  const d = new Date(isoOrTime);
  if (Number.isNaN(d.getTime())) return isoOrTime;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatEnglishDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
