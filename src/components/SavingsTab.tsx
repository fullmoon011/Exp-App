import React, { useState } from 'react';
import { PiggyBank, Plus, Trophy, Banknote, X, Calendar, ArrowRight } from 'lucide-react';
import { SavingsGoal, SavingsDeposit } from '../types';
import { fmt, fa, shiftMonth } from '../utils/calculations';

interface SavingsTabProps {
  currentMonth: string;
  goals: SavingsGoal[];
  deposits: SavingsDeposit[];
  onAddGoal: (name: string, target: number, targetMonth?: string) => void;
  onDeposit: (goalIndex: number, amount: number) => void;
  onUndoDeposit: (depositIndex: number) => void;
  onDeleteGoal: (goalIndex: number) => void;
  t: (key: string) => string;
}

export const SavingsTab: React.FC<SavingsTabProps> = ({
  currentMonth,
  goals,
  deposits,
  onAddGoal,
  onDeposit,
  onUndoDeposit,
  onDeleteGoal,
  t
}) => {
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMonth, setGoalMonth] = useState('');
  const [depositAmounts, setDepositAmounts] = useState<Record<number, string>>({});

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName.trim() || !goalTarget || +goalTarget <= 0) return;
    onAddGoal(goalName.trim(), +goalTarget, goalMonth || undefined);
    setGoalName('');
    setGoalTarget('');
    setGoalMonth('');
  };

  const handleDepositClick = (idx: number) => {
    const amt = +depositAmounts[idx] || 0;
    if (amt <= 0) return;
    onDeposit(idx, amt);
    setDepositAmounts(prev => ({ ...prev, [idx]: '' }));
  };

  // Average monthly deposits across all goals
  const totalSavedAll = goals.reduce((acc, g) => acc + (g.s || 0), 0);

  return (
    <div className="space-y-4 pb-12">
      {/* Add New Goal Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-teal-600" />
          <span>{t('goals')}</span>
        </h3>

        <form onSubmit={handleCreateGoal} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            required
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            placeholder={t('gn')}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="number"
            min="1"
            required
            value={goalTarget}
            onChange={(e) => setGoalTarget(e.target.value)}
            placeholder={t('tg')}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex gap-2">
            <input
              type="month"
              value={goalMonth}
              onChange={(e) => setGoalMonth(e.target.value)}
              title={t('bydt')}
              className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Goals List */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400 border border-slate-200 dark:border-slate-700">
            {t('none')}
          </div>
        ) : (
          goals.map((goal, idx) => {
            const saved = goal.s || 0;
            const target = goal.t || 1;
            const pct = Math.min(100, Math.round((saved / target) * 100));

            // Calculate needed per month if target date is set
            let neededPerMonth = 0;
            if (goal.dt && goal.t > saved) {
              const [tY, tM] = goal.dt.split('-').map(Number);
              const [cY, cM] = currentMonth.split('-').map(Number);
              const monthsLeft = Math.max(1, (tY - cY) * 12 + (tM - cM) + 1);
              neededPerMonth = (goal.t - saved) / monthsLeft;
            }

            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <b className="text-sm font-bold text-slate-800 dark:text-slate-100">{goal.n}</b>
                  </div>
                  <button
                    onClick={() => onDeleteGoal(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Stats */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                  <div>
                    <span>{t('made')}: </span>
                    <b className="text-slate-800 dark:text-slate-200">{fmt(saved)}</b> / {fmt(target)} IQD ({pct}%)
                  </div>
                  {neededPerMonth > 0 && (
                    <div className="text-teal-600 dark:text-teal-400 font-semibold">
                      {t('need')}: {fmt(neededPerMonth)} IQD
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Deposit Form */}
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder={t('amt')}
                    value={depositAmounts[idx] || ''}
                    onChange={(e) =>
                      setDepositAmounts({ ...depositAmounts, [idx]: e.target.value })
                    }
                    className="flex-1 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
                  />
                  <button
                    onClick={() => handleDepositClick(idx)}
                    disabled={!depositAmounts[idx] || +depositAmounts[idx] <= 0}
                    className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    {t('dep')}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* This Month's Deposits Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-teal-600" />
          <span>{t('deps')}</span>
        </h3>

        {deposits.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{t('none')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {deposits.map((dep, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">{dep.d}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {goals[dep.g]?.n || t('ns')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <b className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{fmt(dep.a)} IQD
                  </b>
                  <button
                    onClick={() => onUndoDeposit(i)}
                    className="text-slate-400 hover:text-red-500 p-0.5"
                    title={t('udo')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
