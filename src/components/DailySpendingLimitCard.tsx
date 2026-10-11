import React from 'react';
import {
  Gauge,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Coins
} from 'lucide-react';
import { fmt, val } from '../utils/calculations';
import { MonthDoc } from '../types';

interface DailySpendingLimitCardProps {
  currentMonth: string;
  doc: MonthDoc;
  totalBudget: number;
  totalExpenses: number;
  income: number;
  savings: number;
  isLocked: boolean;
  defaultRate: number;
  t: (key: string) => string;
}

export const DailySpendingLimitCard: React.FC<DailySpendingLimitCardProps> = ({
  currentMonth,
  doc,
  totalBudget,
  totalExpenses,
  income,
  savings,
  isLocked,
  defaultRate,
  t
}) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const isCurrentCalendarMonth = todayStr.startsWith(currentMonth);

  // Month days
  const [yStr, mStr] = currentMonth.split('-');
  const daysInMonth = new Date(+yStr, +mStr, 0).getDate();
  const currentDayNumber = isCurrentCalendarMonth ? now.getDate() : 1;

  // Remaining days including today
  const remainingDays = isCurrentCalendarMonth
    ? Math.max(1, daysInMonth - currentDayNumber + 1)
    : daysInMonth;

  // Days elapsed so far
  const daysElapsed = isCurrentCalendarMonth ? Math.max(1, currentDayNumber) : daysInMonth;

  // Calculate today's spending from transactions
  const todaySpent = (doc.tx || [])
    .filter((tx) => tx.d === todayStr)
    .reduce((acc, tx) => acc + val(tx, defaultRate), 0);

  // Average daily spending so far this month
  const avgDailySpendSoFar = daysElapsed > 0 ? totalExpenses / daysElapsed : 0;

  // Remaining budget
  const remainingBudget = Math.max(0, totalBudget - totalExpenses);
  const isOverBudget = totalBudget > 0 && totalExpenses > totalBudget;

  // Daily Spending Limit based on remaining budget
  // If budget is set, calculate from remaining budget; if not set, calculate from remaining net income
  let dailyLimit = 0;
  let calculationBasis: 'budget' | 'income' = 'budget';

  if (totalBudget > 0) {
    dailyLimit = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    calculationBasis = 'budget';
  } else if (income > 0) {
    const netRemainingIncome = Math.max(0, income - savings - totalExpenses);
    dailyLimit = remainingDays > 0 ? netRemainingIncome / remainingDays : 0;
    calculationBasis = 'income';
  }

  // Projected month-end spending based on current daily pace
  const projectedMonthSpend = avgDailySpendSoFar * daysInMonth;
  const paceDifference = totalBudget > 0 ? projectedMonthSpend - totalBudget : 0;

  // Status for today
  const isTodayPaceExceeded = dailyLimit > 0 && todaySpent > dailyLimit;

  // Progress percentages
  const budgetUsedPct = totalBudget > 0 ? Math.min(100, Math.round((totalExpenses / totalBudget) * 100)) : 0;
  const monthDaysElapsedPct = Math.min(100, Math.round((daysElapsed / daysInMonth) * 100));

  return (
    <div className="bg-gradient-to-br from-white via-slate-50 to-teal-50/40 dark:from-slate-800 dark:via-slate-850 dark:to-teal-950/20 rounded-2xl p-4 md:p-5 shadow-xs border border-teal-200/80 dark:border-teal-800/80 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100">
              {t('daily_budget_limit')}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('remaining_days')}: <b>{remainingDays}</b> / {daysInMonth} {t('days')}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {dailyLimit > 0 && (
          <span
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-bold shadow-xs ${
              isTodayPaceExceeded
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            }`}
          >
            {isTodayPaceExceeded ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('daily_pace_warning')}</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('daily_pace_good')}</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Hero Display: Daily Limit Number */}
      <div className="bg-white dark:bg-slate-900/80 rounded-xl p-4 border border-teal-100 dark:border-teal-900/60 shadow-xs mb-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {calculationBasis === 'budget' ? t('remaining_budget') : t('rem')} ÷ {remainingDays} {t('days')}
          </span>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
            {remainingDays} {t('days')} {t('left')}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <b className={`text-3xl md:text-4xl font-black tracking-tight ${isOverBudget ? 'text-red-600' : 'text-teal-700 dark:text-teal-300'}`}>
            {isOverBudget ? '0' : fmt(dailyLimit)}
          </b>
          <span className="text-sm md:text-base font-bold text-slate-500 dark:text-slate-400">
            {t('iqd')} / {t('days').slice(0, -1) || 'ڕۆژ'}
          </span>
        </div>

        {isOverBudget && (
          <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('wb')} ({fmt(totalExpenses - totalBudget)} IQD)</span>
          </p>
        )}
      </div>

      {/* 4 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
        {/* Remaining Budget */}
        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">{t('remaining_budget')}</span>
          <b className="font-bold text-slate-800 dark:text-slate-200 truncate block">
            {totalBudget > 0 ? `${fmt(remainingBudget)} IQD` : '—'}
          </b>
        </div>

        {/* Today's Spending */}
        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">{t('today_spent')}</span>
          <b className={`font-bold truncate block ${isTodayPaceExceeded ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>
            {fmt(todaySpent)} IQD
          </b>
        </div>

        {/* Average Daily Pace */}
        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">{t('avg_daily_spent')}</span>
          <b className="font-bold text-slate-800 dark:text-slate-200 truncate block">
            {fmt(avgDailySpendSoFar)} IQD
          </b>
        </div>

        {/* Projected Month End */}
        <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-0.5">{t('proj')}</span>
          <b className={`font-bold truncate block ${paceDifference > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
            {fmt(projectedMonthSpend)} IQD
          </b>
        </div>
      </div>

      {/* Progress & Pace Bars */}
      {totalBudget > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-teal-100 dark:border-teal-900/50">
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>
              {t('bud')}: <b>{fmt(totalExpenses)}</b> / {fmt(totalBudget)} IQD ({budgetUsedPct}%)
            </span>
            <span>
              {t('nm')}: {monthDaysElapsedPct}% {t('used')}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPct > 100
                  ? 'bg-rose-500'
                  : budgetUsedPct > monthDaysElapsedPct + 10
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
            />
          </div>
        </div>
      )}

      {totalBudget === 0 && (
        <div className="text-[11px] text-slate-400 text-center pt-2">
          💡 بۆ ئەنجامی وردتر، لە خشتەی بودجەی خوارەوە بڕی پێشبینیکراو دابنێ یان دوگمەی «{t('asb')}» دابگرە.
        </div>
      )}
    </div>
  );
};
