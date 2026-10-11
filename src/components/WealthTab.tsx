import React, { useState } from 'react';
import {
  Gem,
  Plus,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  LifeBuoy,
  Moon,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  CreditCard
} from 'lucide-react';
import { WealthData, DebtItem, GoldItem, NamesConfig, AssetItem } from '../types';
import {
  fmt,
  fa,
  calcGoldCurrentValue,
  calcHealthScore,
  calcZakat,
  sum,
  getDaysDifference,
  shiftMonth
} from '../utils/calculations';
import { DebtProgressTracker } from './DebtProgressTracker';

interface WealthTabProps {
  currentMonth: string;
  wealth: WealthData;
  debts: DebtItem[];
  gold: GoldItem[];
  names: NamesConfig;
  averageMonthlyExpense: number;
  monthlyIncome: number;
  savingsRate: number;
  budgetedCount: number;
  adheredCount: number;
  onAddAsset: (name: string, kind: 'i' | 'u' | 'g' | 'o', val: number) => void;
  onDeleteAsset: (index: number) => void;
  onAddDebt: (debt: DebtItem) => void;
  onPayDebt: (index: number, amount: number) => void;
  onDeleteDebt: (index: number) => void;
  onAddGold: (item: GoldItem) => void;
  onDeleteGold: (index: number) => void;
  t: (key: string) => string;
}

export const WealthTab: React.FC<WealthTabProps> = ({
  currentMonth,
  wealth,
  debts,
  gold,
  names,
  averageMonthlyExpense,
  monthlyIncome,
  savingsRate,
  budgetedCount,
  adheredCount,
  onAddAsset,
  onDeleteAsset,
  onAddDebt,
  onPayDebt,
  onDeleteDebt,
  onAddGold,
  onDeleteGold,
  t
}) => {
  const defaultRate = names.fx || 1500;
  const gold21kPrice = names.gp || 0;

  // New Asset form state
  const [assetName, setAssetName] = useState('');
  const [assetKind, setAssetKind] = useState<'i' | 'u' | 'g' | 'o'>('i');
  const [assetVal, setAssetVal] = useState('');

  // New Gold form state
  const [goldDate, setGoldDate] = useState(new Date().toISOString().slice(0, 10));
  const [goldGrams, setGoldGrams] = useState('');
  const [goldKarat, setGoldKarat] = useState<number>(21);
  const [goldPricePaid, setGoldPricePaid] = useState('');
  const [goldNote, setGoldNote] = useState('');

  // 1. Valuation Calculations
  const assetValueInIQD = (a: AssetItem): number => {
    if (a.k === 'u') return (+a.v || 0) * defaultRate;
    if (a.k === 'g') return (+a.v || 0) * gold21kPrice;
    return +a.v || 0;
  };

  const totalAssetsAssets = sum(wealth.as.map(assetValueInIQD));
  const totalLentToOthers = sum(
    debts
      .filter(d => d.k === 'l')
      .map(d => (d.a - d.p) * (d.cu === 'U' ? defaultRate : 1))
  );
  const totalGoldLedgerValue = sum(gold.map(g => calcGoldCurrentValue(g, gold21kPrice)));
  const totalAssets = totalAssetsAssets + totalLentToOthers + totalGoldLedgerValue;

  const totalBorrowedDebts = sum(
    debts
      .filter(d => d.k === 'b')
      .map(d => (d.a - d.p) * (d.cu === 'U' ? defaultRate : 1))
  );
  const netWorth = totalAssets - totalBorrowedDebts;

  // Liquid wealth (excluding 'other assets') for Zakat & Emergency Fund
  const liquidAssets =
    sum(wealth.as.filter(a => a.k !== 'o').map(assetValueInIQD)) +
    totalLentToOthers +
    totalGoldLedgerValue;

  // Monthly debt payments sum
  const monthlyDebtPaymentTotal = sum(
    debts
      .filter(d => d.k === 'b' && d.a > d.p)
      .map(d => (d.m || 0) * (d.cu === 'U' ? defaultRate : 1))
  );

  // Financial Health Score
  const health = calcHealthScore({
    savingsRate,
    monthlyDebtPayment: monthlyDebtPaymentTotal,
    monthlyIncome,
    liquidAssets,
    averageMonthlyExpense: averageMonthlyExpense || 1,
    budgetedCategoriesCount: budgetedCount,
    adheredCategoriesCount: adheredCount
  });

  // Zakat calculation
  const zakat = calcZakat(liquidAssets, gold21kPrice);

  // Submit new asset
  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim() || !assetVal || +assetVal <= 0) return;
    onAddAsset(assetName.trim(), assetKind, +assetVal);
    setAssetName('');
    setAssetVal('');
  };

  // Submit new gold
  const handleAddGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goldGrams || +goldGrams <= 0 || !goldPricePaid || +goldPricePaid <= 0) return;
    onAddGold({
      d: goldDate,
      g: +goldGrams,
      k: goldKarat,
      p: +goldPricePaid,
      n: goldNote.trim() || undefined
    });
    setGoldGrams('');
    setGoldPricePaid('');
    setGoldNote('');
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Financial Health Score Card */}
      <div className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
            {t('hs')}
          </span>
          <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold">
            {health.score >= 80 ? '🌟 Excellent' : health.score >= 60 ? '👍 Good' : '⚠️ Fair'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <b className="text-4xl md:text-5xl font-black">{health.score}</b>
          <span className="text-lg opacity-70">/ 100</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              health.score >= 70 ? 'bg-emerald-400' : health.score >= 50 ? 'bg-amber-400' : 'bg-rose-400'
            }`}
            style={{ width: `${health.score}%` }}
          />
        </div>

        {/* Breakdown chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs opacity-90 pt-1">
          <div className="bg-white/10 p-2 rounded-xl">
            <span className="block text-[11px] opacity-75">{t('rate')}</span>
            <b>{health.savingsPart} / 30 pts</b>
          </div>
          <div className="bg-white/10 p-2 rounded-xl">
            <span className="block text-[11px] opacity-75">{t('dr')}</span>
            <b>{health.debtPart} / 25 pts</b>
          </div>
          <div className="bg-white/10 p-2 rounded-xl">
            <span className="block text-[11px] opacity-75">{t('emf').split(' (')[0]}</span>
            <b>{health.emergencyMonths.toFixed(1)} {t('nm')} ({health.emergencyPart}/25)</b>
          </div>
          <div className="bg-white/10 p-2 rounded-xl">
            <span className="block text-[11px] opacity-75">{t('bud')}</span>
            <b>{health.budgetAdherencePct}% ({health.budgetPart}/20)</b>
          </div>
        </div>
      </div>

      {/* Net Worth Summary KPI */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 md:p-4 text-center">
          <span className="text-[11px] md:text-xs font-semibold text-emerald-700 dark:text-emerald-300 block mb-0.5">
            {t('ast')}
          </span>
          <b className="text-sm md:text-xl font-black text-emerald-800 dark:text-emerald-100 block truncate">
            {fmt(totalAssets)}
          </b>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('iqd')}</span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 md:p-4 text-center">
          <span className="text-[11px] md:text-xs font-semibold text-rose-700 dark:text-rose-300 block mb-0.5">
            {t('dbt')}
          </span>
          <b className="text-sm md:text-xl font-black text-rose-800 dark:text-rose-100 block truncate">
            {fmt(totalBorrowedDebts)}
          </b>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">{t('iqd')}</span>
        </div>

        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-2xl p-3 md:p-4 text-center">
          <span className="text-[11px] md:text-xs font-semibold text-teal-700 dark:text-teal-300 block mb-0.5">
            {t('nwv')}
          </span>
          <b className={`text-sm md:text-xl font-black block truncate ${netWorth < 0 ? 'text-red-600' : 'text-teal-800 dark:text-teal-100'}`}>
            {fmt(netWorth)}
          </b>
          <span className="text-[10px] text-teal-600 dark:text-teal-400">{t('iqd')}</span>
        </div>
      </div>

      {/* Liquid Assets Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Gem className="w-5 h-5 text-teal-600" />
          <span>{t('ast')}</span>
        </h3>

        {wealth.as.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{t('none')}</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-4">
            {wealth.as.map((a, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <div>
                  <b className="font-semibold">{a.n}</b>
                  <span className="text-slate-400 ms-2">
                    ({fa(a.v)} {a.k === 'u' ? '$' : a.k === 'g' ? 'g' : t('iqd')})
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <b className="font-bold">{fmt(assetValueInIQD(a))} IQD</b>
                  <button
                    onClick={() => onDeleteAsset(i)}
                    className="text-slate-400 hover:text-red-500 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Asset Form */}
        <form onSubmit={handleAddAssetSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            required
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder={t('nme')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <select
            value={assetKind}
            onChange={(e) => setAssetKind(e.target.value as any)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          >
            <option value="i">{t('kc')}</option>
            <option value="u">{t('ku')}</option>
            <option value="g">{t('kg')}</option>
            <option value="o">{t('ko')}</option>
          </select>
          <input
            type="number"
            step="any"
            min="0"
            required
            value={assetVal}
            onChange={(e) => setAssetVal(e.target.value)}
            placeholder={t('amt')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
          </button>
        </form>
      </div>

      {/* Gold Wealth Ledger Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <span>{t('gld')}</span>
          </h3>
          <span className="text-xs text-slate-400">
            21k: {fmt(gold21kPrice)} IQD/g
          </span>
        </div>

        {gold.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-4">
            {gold.map((item, idx) => {
              const currentVal = calcGoldCurrentValue(item, gold21kPrice);
              const costPaid = item.g * item.p;
              const profitLoss = currentVal - costPaid;

              return (
                <div key={idx} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold flex items-center gap-2">
                      <span>{fa(item.g)} g ({item.k}k)</span>
                      {item.n && <span className="text-slate-400 font-normal">({item.n})</span>}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {t('ppg')}: {fmt(item.p)} IQD · {item.d}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-end">
                      <b className="block">{fmt(currentVal)} IQD</b>
                      <span className={`text-[10px] font-bold ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {profitLoss >= 0 ? '+' : ''}{fmt(profitLoss)} IQD
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteGold(idx)}
                      className="text-slate-400 hover:text-red-500 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Gold purchase record form */}
        <form onSubmit={handleAddGoldSubmit} className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <input
            type="number"
            step="any"
            min="0.1"
            required
            value={goldGrams}
            onChange={(e) => setGoldGrams(e.target.value)}
            placeholder={t('grm')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <select
            value={goldKarat}
            onChange={(e) => setGoldKarat(+e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          >
            <option value={24}>24k</option>
            <option value={22}>22k</option>
            <option value={21}>21k</option>
            <option value={18}>18k</option>
          </select>
          <input
            type="number"
            min="1000"
            required
            value={goldPricePaid}
            onChange={(e) => setGoldPricePaid(e.target.value)}
            placeholder={t('ppg')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="text"
            value={goldNote}
            onChange={(e) => setGoldNote(e.target.value)}
            placeholder={t('desc')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
          </button>
        </form>
        <p className="text-[11px] text-slate-400 mt-2">{t('gnote')}</p>
      </div>

      {/* Visual Debt Progress Tracker & Payoff Calculator */}
      <DebtProgressTracker
        currentMonth={currentMonth}
        debts={debts}
        defaultRate={defaultRate}
        onAddDebt={onAddDebt}
        onPayDebt={onPayDebt}
        onDeleteDebt={onDeleteDebt}
        t={t}
      />

      {/* Emergency Fund Runway Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <LifeBuoy className="w-5 h-5 text-teal-600" />
          <span>{t('emf')}</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {t('emf').split(' (')[0]}: <b>{health.emergencyMonths.toFixed(1)} {t('nm')}</b> ({t('all')}: {fmt(liquidAssets)} IQD)
        </p>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${health.emergencyMonths >= 6 ? 'bg-emerald-500' : health.emergencyMonths >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(100, (health.emergencyMonths / 6) * 100)}%` }}
          />
        </div>
      </div>

      {/* Zakat Estimate Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <Moon className="w-5 h-5 text-amber-500" />
          <span>{t('zk')}</span>
        </h3>

        {gold21kPrice <= 0 ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">{t('zks')}</p>
        ) : (
          <div className="text-xs space-y-1 mb-3">
            <div>
              <span>Nisab (85g 21k): </span>
              <b>{fmt(zakat.nisab)} IQD</b>
            </div>
            <div>
              <span>{t('ast')} (Liquid): </span>
              <b>{fmt(liquidAssets)} IQD</b>
            </div>
            {zakat.isEligible === 1 ? (
              <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {t('zk')}: {fmt(zakat.zakatAmount)} IQD (2.5%)
              </div>
            ) : (
              <div className="text-slate-400 mt-1">
                Below Nisab (No Zakat due currently)
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{t('zkn')}</span>
        </div>
      </div>
    </div>
  );
};
