import React, { useMemo, useState } from 'react';
import { Plus, Receipt, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { MONTHLY_HEALTH_STATS, PARENTS, TODAY_ISO } from '../data/seedData';
import { ExpenseItem, ParentId } from '../types/coParent';
import {
  calculateCustodyBalance,
  calculateExpenseSettlement,
  formatEnglishDate,
} from '../utils/coParentLogic';

interface AnalyticsViewProps {
  activeParent: ParentId;
  custodyMap: Record<string, ParentId>;
  expenses: ExpenseItem[];
  onAddExpense: (expense: Omit<ExpenseItem, 'id'>) => void;
}

const EXPENSE_CAT_LABELS: Record<ExpenseItem['category'], string> = {
  pediatric: 'Pediatric & Labs',
  medication: 'Meds & Pharmacy',
  preschool: 'Preschool',
  clothing: 'Clothing & Gear',
};

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  activeParent,
  custodyMap,
  expenses,
  onAddExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseItem['category']>('medication');
  const [paidBy, setPaidBy] = useState<ParentId>(activeParent);
  const [formError, setFormError] = useState('');

  const balance = useMemo(() => calculateCustodyBalance(custodyMap), [custodyMap]);
  const settlement = useMemo(() => calculateExpenseSettlement(expenses), [expenses]);

  // Animated Donut math (circumference for r=52)
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const claireStroke = (balance.clairePercent / 100) * circumference;

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount.replace(',', '.'));
    if (!title.trim()) {
      setFormError('Please enter an expense description.');
      return;
    }
    if (Number.isNaN(num) || num <= 0) {
      setFormError('Please enter an amount greater than $0.');
      return;
    }
    onAddExpense({
      title: title.trim(),
      category,
      amountUsd: num,
      paidBy,
      date: TODAY_ISO,
      splitRatio: 0.5,
    });
    setTitle('');
    setAmount('');
    setFormError('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] suno-aura p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-bold text-[#101012] dark:text-[#F7F4EF]">
              Care balance, immunity & 50/50 split
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Monthly custody ratio, seasonal illness recovery, and shared expense settlement
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
            On-time dose rate: 96%
          </div>
        </div>
      </section>

      {/* Two Modern Analytics Panels */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* Panel 1: Custody Split Donut & Monthly Balance */}
        <section className="xl:col-span-5 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 flex flex-col justify-between">
          <div className="pb-4 border-b border-stone-200 dark:border-white/10">
            <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
              Custody balance (November)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Recalculates automatically whenever a day swap is approved
            </p>
          </div>

          <div className="my-6 flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  className="text-amber-500/85 dark:text-amber-500/75"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="14"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: circumference - claireStroke }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  strokeLinecap="round"
                  className="text-rose-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-mono tabular-nums text-lg font-bold text-[#101012] dark:text-[#F7F4EF]">
                  {balance.totalDays} days
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400">November</span>
              </div>
            </div>

            <div className="space-y-4 w-full sm:w-auto">
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">Claire (Mom)</div>
                <div className="font-mono tabular-nums text-xl font-bold text-rose-600 dark:text-rose-400">
                  {balance.claireDays} days ({balance.clairePercent}%)
                </div>
              </div>
              <div>
                <div className="text-xs text-stone-500 dark:text-stone-400">David (Dad)</div>
                <div className="font-mono tabular-nums text-xl font-bold text-amber-600 dark:text-amber-400">
                  {balance.davidDays} days ({balance.davidPercent}%)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200 dark:border-white/10 text-xs text-stone-500 dark:text-stone-400">
            Base schedule: 2-2-3 rotation · {Math.abs(balance.claireDays - balance.davidDays)}-day
            variance this month
          </div>
        </section>

        {/* Panel 2: 6-Month Healthy vs Sick Days Trend */}
        <section className="xl:col-span-7 rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-white/10">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Health & pediatric trend (6 months)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Healthy preschool days (amber) vs. sick care days at home (rose)
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>

          <div className="mt-6 grid grid-cols-6 gap-3 sm:gap-5 items-end h-44 pt-4">
            {MONTHLY_HEALTH_STATS.map((st, idx) => {
              const total = st.healthyDays + st.sickDays;
              const healthyH = Math.round((st.healthyDays / 31) * 100);
              const sickH = Math.round((st.sickDays / 31) * 100);
              return (
                <div key={st.month} className="flex flex-col items-center h-full justify-end gap-2">
                  <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400">
                    {st.sickDays}d sick
                  </div>
                  <div className="w-full max-w-[40px] h-28 flex flex-col justify-end rounded-lg overflow-hidden bg-stone-100 dark:bg-white/[0.06]">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${sickH}%` }}
                      transition={{ duration: 0.45, delay: idx * 0.05 }}
                      className="w-full bg-rose-500/90"
                      title={`${st.month}: ${st.sickDays} sick days`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${healthyH}%` }}
                      transition={{ duration: 0.45, delay: idx * 0.05 }}
                      className="w-full bg-amber-500/85"
                      title={`${st.month}: ${st.healthyDays} healthy days (${total} tracked)`}
                    />
                  </div>
                  <div className="text-xs font-medium text-stone-700 dark:text-stone-300">
                    {st.month}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-stone-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500/85" />
                <span>Healthy days</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-500/90" />
                <span>Sick / recovery days</span>
              </span>
            </div>
            <span className="font-mono tabular-nums">Avg 84% healthy days · 8 visits</span>
          </div>
        </section>
      </div>

      {/* 50/50 Expense Settlement Calculator + Ledger */}
      <section className="rounded-2xl border border-stone-200 dark:border-white/10 bg-white dark:bg-[#17171A] p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-stone-200 dark:border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-stone-100 dark:bg-white/[0.06] text-rose-500 dark:text-amber-400 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-[#101012] dark:text-[#F7F4EF]">
                Shared childcare & medical expenses (50/50)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                November total:{' '}
                <span className="font-mono tabular-nums font-semibold text-[#101012] dark:text-[#F7F4EF]">
                  ${settlement.totalUsd.toFixed(2)}
                </span>{' '}
                · Claire paid ${settlement.clairePaidUsd.toFixed(2)} · David paid $
                {settlement.davidPaidUsd.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 dark:border-white/10 bg-stone-50 dark:bg-[#101012]/80 px-4 py-2.5 text-right shrink-0">
            <div className="text-[11px] text-stone-500 dark:text-stone-400">
              Current settlement balance
            </div>
            {settlement.owesParent && settlement.owedToParent ? (
              <div className="text-sm font-semibold text-[#101012] dark:text-[#F7F4EF]">
                {PARENTS[settlement.owesParent].name} owes{' '}
                {PARENTS[settlement.owedToParent].name}
                <span className="ml-1.5 font-mono tabular-nums text-rose-600 dark:text-amber-400">
                  ${settlement.settlementAmountUsd.toFixed(2)}
                </span>
              </div>
            ) : (
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                All settled even ($0.00)
              </div>
            )}
          </div>
        </div>

        {/* Add Expense Form */}
        <form onSubmit={handleExpenseSubmit} className="space-y-3">
          {formError && <div className="text-xs text-rose-500 font-medium">{formError}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label htmlFor="exp-title" className="sr-only">
                Expense description
              </label>
              <input
                id="exp-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New expense (e.g. Flu vaccine or Winter boots)"
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="exp-amount" className="sr-only">
                Amount in USD
              </label>
              <input
                id="exp-amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount ($)"
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm font-mono tabular-nums text-[#101012] dark:text-[#F7F4EF] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="exp-cat" className="sr-only">
                Expense category
              </label>
              <select
                id="exp-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseItem['category'])}
                className="w-full rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-3 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="medication">Meds & Pharmacy</option>
                <option value="pediatric">Pediatric & Labs</option>
                <option value="preschool">Preschool</option>
                <option value="clothing">Clothing</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-2">
              <label htmlFor="exp-payer" className="sr-only">
                Paid by
              </label>
              <select
                id="exp-payer"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value as ParentId)}
                className="w-28 rounded-lg border border-stone-300 dark:border-white/15 bg-white dark:bg-[#101012] px-2.5 py-2 text-sm text-[#101012] dark:text-[#F7F4EF] focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="claire">Claire</option>
                <option value="david">David</option>
              </select>
              <button
                type="submit"
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg suno-gradient text-xs font-semibold text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Expense Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-white/10 text-xs text-stone-500 dark:text-stone-400">
                <th className="py-2.5 pr-4 font-medium">Item</th>
                <th className="py-2.5 px-4 font-medium">Category</th>
                <th className="py-2.5 px-4 font-medium">Date</th>
                <th className="py-2.5 px-4 font-medium">Paid by</th>
                <th className="py-2.5 pl-4 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 dark:divide-white/10 text-sm">
              {expenses.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-stone-50/80 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <td className="py-3 pr-4 font-medium text-[#101012] dark:text-[#F7F4EF]">
                    {item.title}
                  </td>
                  <td className="py-3 px-4 text-xs text-stone-500 dark:text-stone-400">
                    {EXPENSE_CAT_LABELS[item.category]}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono tabular-nums text-stone-500 dark:text-stone-400">
                    {formatEnglishDate(item.date)}
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-stone-700 dark:text-stone-300">
                    {PARENTS[item.paidBy].name}
                  </td>
                  <td className="py-3 pl-4 text-right font-mono tabular-nums font-semibold text-[#101012] dark:text-[#F7F4EF]">
                    ${item.amountUsd.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
