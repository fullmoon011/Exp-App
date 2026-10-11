import React, { useState } from 'react';
import {
  CreditCard,
  TrendingDown,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  Zap,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Trophy,
  Sliders,
  DollarSign,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { DebtItem, CurrencyType } from '../types';
import {
  fmt,
  fa,
  shiftMonth,
  getDaysDifference,
  calcDebtPayoffProgress,
  calcDebtPayoffStrategies,
  DebtPayoffProgress
} from '../utils/calculations';

interface DebtProgressTrackerProps {
  currentMonth: string;
  debts: DebtItem[];
  defaultRate: number;
  onAddDebt: (debt: DebtItem) => void;
  onPayDebt: (index: number, amount: number) => void;
  onDeleteDebt: (index: number) => void;
  t: (key: string) => string;
}

export const DebtProgressTracker: React.FC<DebtProgressTrackerProps> = ({
  currentMonth,
  debts,
  defaultRate,
  onAddDebt,
  onPayDebt,
  onDeleteDebt,
  t
}) => {
  // Extra monthly payment simulation state (in IQD)
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [customHabit, setCustomHabit] = useState<number>(0);
  const [filterType, setFilterType] = useState<'all' | 'borrowed' | 'lent'>('all');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [payAmounts, setPayAmounts] = useState<Record<number, string>>({});
  const [strategyTab, setStrategyTab] = useState<'snowball' | 'avalanche'>('snowball');
  const [showStrategyCard, setShowStrategyCard] = useState<boolean>(true);

  // Add Debt Form State
  const [debtName, setDebtName] = useState('');
  const [debtKind, setDebtKind] = useState<'b' | 'l'>('b');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtCurrency, setDebtCurrency] = useState<CurrencyType>('D');
  const [debtDueDate, setDebtDueDate] = useState('');
  const [debtMonthly, setDebtMonthly] = useState('');

  // Calculate overall debt payoff progress
  const progress: DebtPayoffProgress = calcDebtPayoffProgress(
    debts,
    defaultRate,
    extraPayment,
    customHabit,
    currentMonth
  );

  // Accelerated calculation with extra boost (+50,000 IQD) for motivational comparison
  const boostStep = 50000;
  const boostedProgress = calcDebtPayoffProgress(
    debts,
    defaultRate,
    extraPayment + boostStep,
    customHabit,
    currentMonth
  );

  const monthsSavedWithBoost =
    progress.estimatedMonthsToDebtFree > 0 && boostedProgress.estimatedMonthsToDebtFree > 0
      ? progress.estimatedMonthsToDebtFree - boostedProgress.estimatedMonthsToDebtFree
      : 0;

  // Debt Payoff Strategy: Snowball vs Avalanche
  const strategies = calcDebtPayoffStrategies(
    debts,
    defaultRate,
    progress.effectiveMonthlyPaymentHabitIQD,
    currentMonth
  );
  const activePlan = strategyTab === 'snowball' ? strategies.snowball : strategies.avalanche;

  // Filter debts list
  const filteredDebts = debts
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      if (filterType === 'borrowed') return item.k === 'b';
      if (filterType === 'lent') return item.k === 'l';
      return true;
    });

  const handleQuickPay = (idx: number) => {
    const amt = +payAmounts[idx] || 0;
    if (amt <= 0) return;
    onPayDebt(idx, amt);
    setPayAmounts((prev) => ({ ...prev, [idx]: '' }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName.trim() || !debtAmount || +debtAmount <= 0) return;
    onAddDebt({
      n: debtName.trim(),
      k: debtKind,
      a: +debtAmount,
      cu: debtCurrency,
      p: 0,
      due: debtDueDate || undefined,
      m: debtMonthly ? +debtMonthly : undefined,
      d: new Date().toISOString().slice(0, 10)
    });
    setDebtName('');
    setDebtAmount('');
    setDebtDueDate('');
    setDebtMonthly('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-5">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>{t('dbt_tracker')}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('dbt_habit_desc')}
            </p>
          </div>
        </div>

        {/* Action button to add debt */}
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? t('cncl') : t('add')}</span>
        </button>
      </div>

      {/* Hero Progress Banner */}
      {progress.isDebtFree ? (
        <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-5 text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
            <Trophy className="w-6 h-6" />
          </div>
          <h4 className="text-base font-black text-emerald-700 dark:text-emerald-300">
            {t('dbt_free')}
          </h4>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 max-w-md mx-auto">
            {t('dbt_congrats')}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 shadow-md space-y-4">
          {/* Top Hero Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('dbt_rem_total')}</span>
              </span>
              <div className="flex items-baseline gap-2">
                <b className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {fmt(progress.totalBorrowedRemainingIQD)}
                </b>
                <span className="text-xs text-slate-300 font-semibold">{t('iqd')}</span>
                {defaultRate > 0 && (
                  <span className="text-xs text-teal-300 font-semibold opacity-90">
                    ≈ ${fmt(Math.round(progress.totalBorrowedRemainingIQD / defaultRate))}
                  </span>
                )}
              </div>
            </div>

            {/* Estimated Payoff Target Badge */}
            {progress.estimatedMonthsToDebtFree > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3.5 py-2 text-end">
                <span className="text-[11px] block text-slate-300 flex items-center gap-1 justify-end">
                  <Clock className="w-3 h-3 text-teal-300" />
                  <span>{t('dbt_target_date')}</span>
                </span>
                <b className="text-sm sm:text-base font-black text-teal-200">
                  {progress.projectedDebtFreeMonth}
                </b>
                <span className="text-[11px] text-teal-100 block opacity-90">
                  {progress.estimatedMonthsToDebtFree} {t('dbt_months_left')}
                </span>
              </div>
            )}
          </div>

          {/* Visual Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">
                {t('dbt_paid_total')}:{' '}
                <b className="text-white">{fmt(progress.totalBorrowedPaidIQD)} IQD</b> (
                {progress.overallBorrowedProgressPct}%)
              </span>
              <span className="text-slate-300 font-medium">
                {t('tot')}: <b className="text-white">{fmt(progress.totalBorrowedOriginalIQD)} IQD</b>
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-700/80 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
                style={{ width: `${progress.overallBorrowedProgressPct}%` }}
              />
            </div>
          </div>

          {/* Payment Habits Insight & Accelerator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            <div className="bg-white/10 border border-white/10 rounded-xl p-2.5 space-y-1">
              <span className="text-slate-300 text-[11px] block flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{t('dbt_habit')}</span>
              </span>
              <div className="flex items-baseline justify-between">
                <b className="text-sm font-bold text-white">
                  {progress.effectiveMonthlyPaymentHabitIQD > 0
                    ? `${fmt(progress.effectiveMonthlyPaymentHabitIQD)} IQD / ${t('mth').split(' ')[0]}`
                    : t('no_val') || '0 IQD'}
                </b>
                <span className="text-[10px] text-teal-300">
                  {progress.activeBorrowedCount} {t('dbt_active_count')}
                </span>
              </div>
            </div>

            {/* Payoff accelerator teaser */}
            <div className="bg-teal-500/20 border border-teal-500/30 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-teal-200 block">
                  ⚡ {t('dbt_speedup')} (+50k IQD)
                </span>
                <span className="text-[10px] text-teal-100/90 block">
                  {monthsSavedWithBoost > 0
                    ? `${monthsSavedWithBoost} ${t('dbt_months_left')} ${t('vsprev').split(' ')[0]}!`
                    : t('dbt_snowball_tip').split('!')[0]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setExtraPayment((prev) => prev + boostStep)}
                className="py-1 px-2.5 bg-teal-400 hover:bg-teal-300 text-slate-900 rounded-lg text-xs font-black transition shrink-0"
              >
                +50k
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Habit & Simulator Controls */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            <span>{t('xtr')}</span>
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="5000"
              value={extraPayment || ''}
              onChange={(e) => setExtraPayment(+e.target.value || 0)}
              placeholder="0"
              className="w-24 py-1 px-2 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            <span className="text-xs text-slate-500">{t('iqd')}</span>
          </div>
        </div>

        {/* Quick increment chips */}
        <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-0.5 no-scrollbar">
          <span className="text-slate-400 shrink-0">{t('add')}:</span>
          {[0, 25000, 50000, 100000, 250000].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => setExtraPayment(step)}
              className={`py-0.5 px-2.5 rounded-lg font-semibold transition ${
                extraPayment === step
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              {step === 0 ? t('all').split(' ')[0] : `+${fmt(step)}`}
            </button>
          ))}
        </div>
      </div>

      {/* Debt Strategy Planner: Snowball vs Avalanche */}
      {strategies.hasDebtsToPay && (
        <div className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/30 dark:via-slate-800 dark:to-slate-850 rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <b className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100 block">
                  {t('dbt_strat_title')}
                </b>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {strategyTab === 'snowball' ? t('dbt_strat_snowball_desc') : t('dbt_strat_avalanche_desc')}
                </span>
              </div>
            </div>

            {/* Strategy Switcher Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/80 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStrategyTab('snowball')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  strategyTab === 'snowball'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>❄️ {t('dbt_strat_snowball')}</span>
                {strategies.snowball.recommended && (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
                    ★
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStrategyTab('avalanche')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  strategyTab === 'avalanche'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <span>⚡ {t('dbt_strat_avalanche')}</span>
                {strategies.avalanche.recommended && (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-200 px-1.5 py-0.2 rounded-full font-bold">
                    ★
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Strategy Recommendation Note */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-2.5 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between gap-2 border border-indigo-200/50 dark:border-indigo-800/40">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{activePlan.reason}</span>
            </div>
            <div className="shrink-0 text-end">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                {t('dbt_order_badge')}
              </span>
              <b className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                1st: {activePlan.firstDebtMonths} {t('dbt_months_left')}
              </b>
            </div>
          </div>

          {/* Strategy Step-by-Step Priority Sequence */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              {t('dbt_order_badge')}:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {activePlan.steps.map((step, idx) => (
                <div
                  key={step.originalIndex}
                  className={`p-3 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        idx === 0
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      #{step.order} {idx === 0 ? '🔥 ئامانجی سەرەکی' : ''}
                    </span>
                    <span
                      className={`text-[10px] font-bold ${
                        idx === 0 ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {step.projectedMonth}
                    </span>
                  </div>

                  <b className="text-xs sm:text-sm font-bold block truncate">{step.debt.n}</b>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      className={`text-xs font-black ${
                        idx === 0 ? 'text-indigo-100' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {fmt(step.remainingIQD)} {t('iqd')}
                    </span>
                    <span
                      className={`text-[10px] ${
                        idx === 0 ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {step.estimatedMonths} {t('dbt_months_left')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add New Debt Accordion Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-teal-200/60 dark:border-teal-800/60 pb-2">
            <b className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('add')}</span>
            </b>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <input
              type="text"
              required
              value={debtName}
              onChange={(e) => setDebtName(e.target.value)}
              placeholder={t('who')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs focus:outline-none"
            />
            <select
              value={debtKind}
              onChange={(e) => setDebtKind(e.target.value as any)}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs focus:outline-none"
            >
              <option value="b">{t('bor')}</option>
              <option value="l">{t('lent')}</option>
            </select>
            <div className="flex rounded-xl border border-teal-200 dark:border-teal-700 overflow-hidden bg-white dark:bg-slate-800">
              <input
                type="number"
                step="any"
                min="1"
                required
                value={debtAmount}
                onChange={(e) => setDebtAmount(e.target.value)}
                placeholder={t('amt')}
                className="w-full py-1.5 px-2 bg-transparent text-xs focus:outline-none"
              />
              <select
                value={debtCurrency}
                onChange={(e) => setDebtCurrency(e.target.value as any)}
                className="bg-slate-100 dark:bg-slate-700 text-xs px-2 border-s border-teal-200 dark:border-teal-700"
              >
                <option value="D">{t('iqd')}</option>
                <option value="U">$</option>
              </select>
            </div>
            <input
              type="number"
              min="0"
              value={debtMonthly}
              onChange={(e) => setDebtMonthly(e.target.value)}
              placeholder={t('mth')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs focus:outline-none"
            />
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => setDebtDueDate(e.target.value)}
              title={t('due')}
              className="py-1.5 px-3 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700 rounded-xl text-xs focus:outline-none sm:col-span-2"
            />
            <button
              type="submit"
              className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 sm:col-span-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('save')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`py-1 px-3 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dbt_all')} ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('borrowed')}
            className={`py-1 px-3 rounded-lg transition ${
              filterType === 'borrowed'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dbt_i_owe')} ({debts.filter((d) => d.k === 'b').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('lent')}
            className={`py-1 px-3 rounded-lg transition ${
              filterType === 'lent'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('dbt_owed_to_me')} ({debts.filter((d) => d.k === 'l').length})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          {filteredDebts.length} {t('dbt').toLowerCase()}
        </span>
      </div>

      {/* Debts Individual Progress Cards */}
      {filteredDebts.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          {t('no_tx') || 'هیچ قەرزێک تۆمار نەکراوە.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDebts.map(({ item, originalIndex }) => {
            const remaining = Math.max(0, item.a - item.p);
            const isCompleted = remaining <= 0;
            const pctPaid = item.a > 0 ? Math.min(100, Math.round((item.p / item.a) * 100)) : 100;

            // Days difference for due date
            const daysLeft = item.due ? getDaysDifference(item.due) : null;
            const isOverdue = daysLeft !== null && daysLeft < 0 && !isCompleted;
            const isDueSoon = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7 && !isCompleted;

            // Payoff projection for this specific debt
            const monthsToPayoff = item.m && remaining > 0 ? Math.ceil(remaining / item.m) : 0;
            const payoffTargetMonth =
              monthsToPayoff > 0 ? shiftMonth(currentMonth, monthsToPayoff) : '';

            return (
              <div
                key={originalIndex}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                    : isOverdue
                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/80'
                }`}
              >
                {/* Header row: Person name, kind, status badge, delete */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        item.k === 'l'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                      }`}
                    >
                      {item.k === 'l' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <b className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 block">
                        {item.n}
                      </b>
                      <span className="text-[10px] text-slate-400 block">
                        {item.k === 'l' ? t('lent') : t('bor')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{t('all').split(' ')[0]}</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
                        <AlertTriangle className="w-3 h-3" />
                        <span>{t('ovd')}</span>
                      </span>
                    ) : isDueSoon ? (
                      <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                        <Clock className="w-3 h-3" />
                        <span>{daysLeft} {t('days')}</span>
                      </span>
                    ) : null}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => onDeleteDebt(originalIndex)}
                      className="text-slate-400 hover:text-rose-500 p-1 transition"
                      title={t('del')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Amounts & Timeline Row */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 mb-2 gap-2">
                  <div>
                    <span className="text-slate-400 text-[11px]">{t('left')}: </span>
                    <b className="text-slate-900 dark:text-white font-black text-sm">
                      {fmt(remaining)} {item.cu === 'U' ? '$' : t('iqd')}
                    </b>
                    <span className="text-slate-400 text-[11px] ms-1">
                      / {fmt(item.a)} {item.cu === 'U' ? '$' : t('iqd')}
                    </span>
                  </div>

                  {item.m && item.m > 0 && !isCompleted && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-slate-400">{t('mth')}:</span>
                      <b>
                        {fmt(item.m)} {item.cu === 'U' ? '$' : t('iqd')}
                      </b>
                      {payoffTargetMonth && (
                        <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded-md font-bold">
                          🎯 {payoffTargetMonth}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Visual Progress Bar for this debt item */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>
                      {t('dbt_paid_total')}: {fmt(item.p)} ({pctPaid}%)
                    </span>
                    {item.due && (
                      <span>
                        {t('due')}: {item.due}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isOverdue
                          ? 'bg-rose-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${pctPaid}%` }}
                    />
                  </div>
                </div>

                {/* Repayment Action Form for this debt */}
                {!isCompleted && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <input
                      type="number"
                      min="1"
                      placeholder={item.m ? `${t('pay')} (${fmt(item.m)})` : t('amt')}
                      value={payAmounts[originalIndex] || ''}
                      onChange={(e) =>
                        setPayAmounts((prev) => ({
                          ...prev,
                          [originalIndex]: e.target.value
                        }))
                      }
                      className="flex-1 py-1.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    {item.m && item.m > 0 && !payAmounts[originalIndex] && (
                      <button
                        type="button"
                        onClick={() =>
                          setPayAmounts((prev) => ({
                            ...prev,
                            [originalIndex]: String(item.m)
                          }))
                        }
                        className="py-1.5 px-2 bg-slate-150 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-semibold transition"
                      >
                        1 {t('mth').split(' ')[0]}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleQuickPay(originalIndex)}
                      disabled={!payAmounts[originalIndex] || +payAmounts[originalIndex] <= 0}
                      className="py-1.5 px-3.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow-xs"
                    >
                      {t('pay')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
