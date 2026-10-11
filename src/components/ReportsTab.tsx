import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  Users,
  Scale,
  CalendarRange,
  Columns2,
  BarChart2,
  Sparkles,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  List
} from 'lucide-react';
import { MonthDoc, NamesConfig } from '../types';
import { CATEGORIES } from '../constants/categories';
import {
  val,
  fmt,
  fa,
  calcMonthTotals,
  calc503020,
  calcSettleUp,
  sum,
  shiftMonth
} from '../utils/calculations';
import { exportExcelWorkbook, loadMonthDoc } from '../utils/storage';
import { CategoryIcon } from './CategoryIcon';
import { IncomeSpendingBarChart } from './IncomeSpendingBarChart';
import { DailySpendingLimitCard } from './DailySpendingLimitCard';
import { MonthlySummaryCard } from './MonthlySummaryCard';
import { SavingsAdvisorCard } from './SavingsAdvisorCard';

interface ReportsTabProps {
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  isLocked: boolean;
  langIndex: number;
  monthNames: string[];
  t: (key: string) => string;
  onUpdateBudget: (catIndex: number, amount: number) => void;
  onSuggestBudget: () => void;
  workspaceId?: string;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  currentMonth,
  doc,
  names,
  isLocked,
  langIndex,
  monthNames,
  t,
  onUpdateBudget,
  onSuggestBudget,
  workspaceId
}) => {
  const defaultRate = names.fx || 1500;
  const currentTotals = calcMonthTotals(doc, defaultRate);
  const ruleBreakdown = calc503020(currentTotals);
  const members = names.mem || [{ n: 'Person 1', e: 'user' }];
  const activeMemberIndices = members.map((_, i) => i).filter(i => !members[i]?.x);

  // Previous month data for comparisons
  const prevMonthStr = shiftMonth(currentMonth, -1);
  const [prevDoc, setPrevDoc] = useState<MonthDoc | null>(null);

  // Month A / Month B comparison
  const [cmpMonthA, setCmpMonthA] = useState<string>(currentMonth);
  const [cmpMonthB, setCmpMonthB] = useState<string>(prevMonthStr);
  const [docA, setDocA] = useState<MonthDoc>(doc);
  const [docB, setDocB] = useState<MonthDoc | null>(null);

  // Year docs for 12 months chart
  const currentYear = currentMonth.slice(0, 4);
  const [yearDocs, setYearDocs] = useState<MonthDoc[]>([]);

  // Category trend selector
  const [trendCatIndex, setTrendCatIndex] = useState<number>(6); // groceries

  // AI Month Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>('');

  // Load comparison and year docs
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const pDoc = await loadMonthDoc(prevMonthStr, workspaceId);
      if (isMounted) setPrevDoc(pDoc);

      const yDocs: MonthDoc[] = [];
      for (let m = 1; m <= 12; m++) {
        const mStr = `${currentYear}-${String(m).padStart(2, '0')}`;
        yDocs.push(await loadMonthDoc(mStr, workspaceId));
      }
      if (isMounted) setYearDocs(yDocs);

      const loadedA = await loadMonthDoc(cmpMonthA, workspaceId);
      const loadedB = await loadMonthDoc(cmpMonthB, workspaceId);
      if (isMounted) {
        setDocA(loadedA);
        setDocB(loadedB);
      }
    })();

    return () => { isMounted = false; };
  }, [currentMonth, currentYear, cmpMonthA, cmpMonthB, workspaceId]);

  const prevTotals = prevDoc ? calcMonthTotals(prevDoc, defaultRate) : null;
  const totalsA = calcMonthTotals(docA, defaultRate);
  const totalsB = docB ? calcMonthTotals(docB, defaultRate) : totalsA;

  // Settle up shared expenses
  const settleUp = calcSettleUp(doc.tx || [], activeMemberIndices, defaultRate);

  // Spending by person
  const personSpends = members.map((_, pIdx) => {
    const total = sum(
      (doc.tx || [])
        .filter(x => x.w === pIdx)
        .map(x => val(x, defaultRate))
    );
    return { name: members[pIdx]?.n || `P${pIdx + 1}`, total, isSoftDeleted: members[pIdx]?.x };
  });
  const maxPersonSpend = Math.max(1, ...personSpends.map(p => p.total));

  // Category ranking this month
  const categoryRanking = currentTotals.sp
    .map((amount, idx) => ({ idx, amount }))
    .filter(c => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Top 10 single largest expenses
  const top10Expenses = [...(doc.tx || [])]
    .map((tx) => ({ tx, totalIQD: val(tx, defaultRate) }))
    .sort((a, b) => b.totalIQD - a.totalIQD)
    .slice(0, 10);

  // SVG Donut calculation
  let cumulativeOffset = 0;
  const donutSlices = categoryRanking.map((item, i) => {
    const pct = currentTotals.exp > 0 ? (item.amount / currentTotals.exp) * 100 : 0;
    const slice = {
      ...item,
      pct,
      offset: cumulativeOffset,
      color: `hsl(${(i * 47) % 360}, 65%, 48%)`
    };
    cumulativeOffset += pct;
    return slice;
  });

  // 12 Months comparison stats
  const yearMonthlyTotals = yearDocs.map(d => calcMonthTotals(d, defaultRate));
  const maxYearSpend = Math.max(1, ...yearMonthlyTotals.map(t => Math.max(isLocked ? 0 : t.inc, t.exp)));
  const maxTrendCatSpend = Math.max(1, ...yearMonthlyTotals.map(t => t.sp[trendCatIndex] || 0));

  // AI Month Analysis trigger
  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const topCategories = categoryRanking.slice(0, 5).map(c => ({
        category: CATEGORIES[c.idx]?.names[2],
        spentIQD: c.amount,
        budgetIQD: doc.bud[c.idx] || 0
      }));

      const payload = {
        month: currentMonth,
        totalExpensesIQD: currentTotals.exp,
        totalIncomeIQD: isLocked ? undefined : currentTotals.inc,
        savingsIQD: currentTotals.sv,
        topCategories,
        previousMonthExpensesIQD: prevTotals ? prevTotals.exp : undefined
      };

      const langNames = ['Kurdish Sorani', 'Arabic', 'English', 'Kurdish Badini', 'Persian', 'Turkish'];
      const res = await fetch('/api/month-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload, language: langNames[langIndex] })
      });

      if (!res.ok) throw new Error('Analysis failed');
      const data = await res.json();
      setAiAnalysisResult(data.analysis || '');
    } catch (err) {
      console.error(err);
      setAiAnalysisResult(t('scer'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Overview 5 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {/* Income */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 block mb-0.5">
            {t('inc')}
          </span>
          <b className="text-base md:text-xl font-black text-emerald-800 dark:text-emerald-100 block truncate">
            {isLocked ? '••••••' : fmt(currentTotals.inc)}
          </b>
        </div>

        {/* Expenses */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 block mb-0.5">
            {t('exp')}
          </span>
          <b className="text-base md:text-xl font-black text-rose-800 dark:text-rose-100 block truncate">
            {fmt(currentTotals.exp)}
          </b>
        </div>

        {/* Savings */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300 block mb-0.5">
            {t('ns')}
          </span>
          <b className="text-base md:text-xl font-black text-blue-800 dark:text-blue-100 block truncate">
            {fmt(currentTotals.sv)}
          </b>
        </div>

        {/* Remaining */}
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3 text-center">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 block mb-0.5">
            {t('rem')}
          </span>
          <b className={`text-base md:text-xl font-black block truncate ${!isLocked && currentTotals.rem < 0 ? 'text-red-600' : 'text-amber-800 dark:text-amber-100'}`}>
            {isLocked ? '••••••' : fmt(currentTotals.rem)}
          </b>
        </div>

        {/* Savings Rate */}
        <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 block mb-0.5">
            {t('rate')}
          </span>
          <b className="text-base md:text-xl font-black text-purple-800 dark:text-purple-100 block truncate">
            {isLocked ? '••••' : `${Math.round(currentTotals.savingsRate * 100)}%`}
          </b>
        </div>
      </div>

      {/* Comparison with Previous Month Banner */}
      {prevTotals && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-3.5 shadow-xs border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {currentTotals.exp > prevTotals.exp ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            )}
            <span>
              {t('vsprev')}: <b>{fmt(currentTotals.exp)}</b> vs <b>{fmt(prevTotals.exp)}</b> IQD
            </span>
          </div>
          <span className={`font-bold px-2 py-0.5 rounded-full ${currentTotals.exp > prevTotals.exp ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
            {currentTotals.exp > prevTotals.exp ? '+' : ''}
            {prevTotals.exp > 0 ? Math.round(((currentTotals.exp - prevTotals.exp) / prevTotals.exp) * 100) : 0}%
          </span>
        </div>
      )}

      {/* Official Monthly Financial Summary Card for WhatsApp & PNG Export */}
      <MonthlySummaryCard
        currentMonth={currentMonth}
        doc={doc}
        names={names}
        langIndex={langIndex}
        t={t}
      />

      {/* Daily Spending Limit Card based on remaining budget */}
      <DailySpendingLimitCard
        currentMonth={currentMonth}
        doc={doc}
        totalBudget={sum(doc.bud)}
        totalExpenses={currentTotals.exp}
        income={currentTotals.inc}
        savings={currentTotals.sv}
        isLocked={isLocked}
        defaultRate={defaultRate}
        t={t}
      />

      {/* Income vs Spending & Top Categories Recharts Bar Chart */}
      <IncomeSpendingBarChart
        income={currentTotals.inc}
        expenses={currentTotals.exp}
        savings={currentTotals.sv}
        remaining={currentTotals.rem}
        isLocked={isLocked}
        categorySpending={currentTotals.sp}
        categoryBudgets={doc.bud}
        langIndex={langIndex}
        t={t}
      />

      {/* Smart Savings & Cut-Spending Advisor */}
      <SavingsAdvisorCard
        currentMonth={currentMonth}
        doc={doc}
        names={names}
        langIndex={langIndex}
        t={t}
        onUpdateBudget={onUpdateBudget}
      />

      {/* Spending by Category with Animated Donut */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-teal-600" />
          <span>{t('bycat')}</span>
        </h3>

        {currentTotals.exp === 0 ? (
          <p className="text-center text-xs text-slate-400 py-8">{t('none')}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            {/* SVG Donut */}
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 42 42" className="w-full h-full -rotate-90 transform">
                  {donutSlices.map((slice, i) => (
                    <circle
                      key={i}
                      cx="21"
                      cy="21"
                      r="15.9155"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="6"
                      strokeDasharray={`${slice.pct} ${100 - slice.pct}`}
                      strokeDashoffset={-slice.offset}
                      className="transition-all duration-700 ease-out"
                    />
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] text-slate-400 font-medium">{t('exp')}</span>
                  <b className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 truncate px-2">
                    {fmt(currentTotals.exp)}
                  </b>
                  <span className="text-[10px] text-slate-400">{t('iqd')}</span>
                </div>
              </div>
            </div>

            {/* Category breakdown legend */}
            <div className="space-y-2 max-h-56 overflow-y-auto pe-2">
              {donutSlices.map((slice, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                    <span className="font-medium truncate">{CATEGORIES[slice.idx]?.names[langIndex]}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-slate-400">{Math.round(slice.pct)}%</span>
                    <b className="font-bold text-slate-800 dark:text-slate-200">{fmt(slice.amount)}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 50/30/20 Rule Card (Masked when locked) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Scale className="w-5 h-5 text-teal-600" />
          <span>{t('rule')}</span>
        </h3>

        {isLocked ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-xs text-slate-400">
            {t('locked')}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Needs */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">{t('ned')}</span>
                <span>{ruleBreakdown.needsPct}% / 50% ({fmt(ruleBreakdown.needs)} IQD)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${ruleBreakdown.needsPct > 50 ? 'bg-amber-500' : 'bg-teal-500'}`}
                  style={{ width: `${Math.min(100, ruleBreakdown.needsPct)}%` }}
                />
              </div>
            </div>

            {/* Wants */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">{t('wnt')}</span>
                <span>{ruleBreakdown.wantsPct}% / 30% ({fmt(ruleBreakdown.wants)} IQD)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${ruleBreakdown.wantsPct > 30 ? 'bg-rose-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, ruleBreakdown.wantsPct)}%` }}
                />
              </div>
            </div>

            {/* Savings */}
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-300">{t('ns')} (20%)</span>
                <span>{ruleBreakdown.savingsPct}% / 20% ({fmt(ruleBreakdown.savings)} IQD)</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ruleBreakdown.savingsPct)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spending by Person (if > 1 active members) */}
      {personSpends.filter(p => !p.isSoftDeleted).length > 1 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>{t('byp')}</span>
          </h3>
          <div className="space-y-3">
            {personSpends.map((p, i) => (
              !p.isSoftDeleted ? (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span>{p.name}</span>
                    <span>{fmt(p.total)} IQD</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                      style={{ width: `${(p.total / maxPersonSpend) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}

      {/* Settle Up Shared Expenses */}
      {settleUp.totalShared > 0 && activeMemberIndices.length > 1 && (
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-2xl p-4 shadow-xs">
          <h3 className="text-xs md:text-sm font-bold text-teal-900 dark:text-teal-200 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600" />
            <span>{t('stl')}</span>
          </h3>
          <p className="text-xs text-teal-700 dark:text-teal-300 mb-3">
            {t('shr')}: <b>{fmt(settleUp.totalShared)} IQD</b> ({t('all')}: {fmt(settleUp.sharePerMember)} IQD / {t('p1')})
          </p>
          <div className="space-y-1.5 text-xs">
            {settleUp.transfers.map((tr, i) => (
              <div key={i} className="flex items-center gap-2 py-1 px-2.5 rounded-lg bg-white dark:bg-slate-900 font-medium">
                <span className="font-bold text-rose-600">{members[tr.fromIndex]?.n}</span>
                <span className="text-slate-400">{t('owe')}</span>
                <span className="font-bold text-emerald-600">{members[tr.toIndex]?.n}</span>
                <b className="ms-auto text-teal-700 dark:text-teal-300">{fmt(tr.amount)} IQD</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Yearly Comparison Chart (12 Months) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-teal-600" />
          <span>{t('yr')} ({currentYear})</span>
        </h3>

        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-36 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          {yearMonthlyTotals.map((mTotals, idx) => {
            const incH = isLocked ? 0 : (mTotals.inc / maxYearSpend) * 100;
            const expH = (mTotals.exp / maxYearSpend) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                <div className="w-full flex items-end justify-center gap-0.5 h-full">
                  {!isLocked && (
                    <div
                      className="w-1.5 sm:w-2.5 bg-emerald-500 rounded-t-sm transition-all duration-500"
                      style={{ height: `${incH}%` }}
                      title={`${monthNames[idx]}: Inc ${fmt(mTotals.inc)}`}
                    />
                  )}
                  <div
                    className="w-1.5 sm:w-2.5 bg-rose-500 rounded-t-sm transition-all duration-500"
                    style={{ height: `${expH}%` }}
                    title={`${monthNames[idx]}: Exp ${fmt(mTotals.exp)}`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1.5">
                  {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500 mt-2">
          {!isLocked && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span>{t('inc')}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500" />
            <span>{t('exp')}</span>
          </div>
        </div>
      </div>

      {/* Category Budget Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{t('bud')}</span>
          </h3>
          <button
            onClick={onSuggestBudget}
            disabled={Boolean(doc.closed)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('asb')}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs md:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-start">
                <th className="py-2 px-2 text-start">{t('cat')}</th>
                <th className="py-2 px-2 text-start">{t('bud')}</th>
                <th className="py-2 px-2 text-start">{t('exp')}</th>
                <th className="py-2 px-2 text-start">{t('left')}</th>
                <th className="py-2 px-2 text-start w-24">{t('used')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {CATEGORIES.map((cat, i) => {
                const b = doc.bud[i] || 0;
                const spent = currentTotals.sp[i] || 0;
                const left = b - spent;
                const pct = b > 0 ? (spent / b) * 100 : 0;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-750/40">
                    <td className="py-2 px-2 font-medium">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon name={cat.icon} className="w-4 h-4 text-teal-600" />
                        <span>{cat.names[langIndex]}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        min="0"
                        disabled={Boolean(doc.closed)}
                        value={b || ''}
                        onChange={(e) => onUpdateBudget(i, +e.target.value)}
                        placeholder="0"
                        className="w-24 py-1 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:outline-none"
                      />
                    </td>
                    <td className="py-2 px-2 font-semibold">{fmt(spent)}</td>
                    <td className={`py-2 px-2 font-bold ${left < 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                      {fmt(left)}
                    </td>
                    <td className="py-2 px-2">
                      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : 'bg-teal-500'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compare Two Months Tool */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Columns2 className="w-5 h-5 text-teal-600" />
          <span>{t('cmp')}</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3 mb-4 np">
          <input
            type="month"
            value={cmpMonthA}
            onChange={(e) => setCmpMonthA(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          />
          <span className="text-slate-400">vs</span>
          <input
            type="month"
            value={cmpMonthB}
            onChange={(e) => setCmpMonthB(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400">
                <th className="py-2 px-2 text-start">{t('cat')}</th>
                <th className="py-2 px-2 text-start">{cmpMonthA}</th>
                <th className="py-2 px-2 text-start">{cmpMonthB}</th>
                <th className="py-2 px-2 text-start">{t('diff')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {CATEGORIES.map((cat, i) => {
                const spA = totalsA.sp[i] || 0;
                const spB = totalsB.sp[i] || 0;
                if (!spA && !spB) return null;
                const diff = spA - spB;
                return (
                  <tr key={cat.id}>
                    <td className="py-2 px-2 font-medium">{cat.names[langIndex]}</td>
                    <td className="py-2 px-2 font-bold">{fmt(spA)}</td>
                    <td className="py-2 px-2 font-bold text-slate-500">{fmt(spB)}</td>
                    <td className={`py-2 px-2 font-bold ${diff > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {diff > 0 ? '+' : ''}{fmt(diff)} IQD
                    </td>
                  </tr>
                );
              })}
              <tr className="font-bold border-t border-slate-300 dark:border-slate-600">
                <td className="py-2.5 px-2">{t('exp')}</td>
                <td className="py-2.5 px-2">{fmt(totalsA.exp)}</td>
                <td className="py-2.5 px-2 text-slate-500">{fmt(totalsB.exp)}</td>
                <td className={`py-2.5 px-2 ${totalsA.exp - totalsB.exp > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {totalsA.exp - totalsB.exp > 0 ? '+' : ''}{fmt(totalsA.exp - totalsB.exp)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Category 12-Month Trend */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-600" />
            <span>{t('cmpc')}</span>
          </h3>
          <select
            value={trendCatIndex}
            onChange={(e) => setTrendCatIndex(+e.target.value)}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.names[langIndex]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-1.5 h-32 pt-4 pb-2 border-b border-slate-200 dark:border-slate-700">
          {yearMonthlyTotals.map((mTotals, idx) => {
            const h = (mTotals.sp[trendCatIndex] / maxTrendCatSpend) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end">
                <div
                  className="w-full bg-teal-500 rounded-t-sm transition-all duration-500"
                  style={{ height: `${h}%` }}
                  title={`${monthNames[idx]}: ${fmt(mTotals.sp[trendCatIndex])} IQD`}
                />
                <span className="text-[10px] text-slate-400 mt-1">{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top 10 Single Largest Expenses */}
      {top10Expenses.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
            <List className="w-5 h-5 text-teal-600" />
            <span>{t('tp')}</span>
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {top10Expenses.map(({ tx, totalIQD }, i) => (
              <div key={i} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-mono text-[11px]">{tx.d}</span>
                  <span className="font-semibold">{CATEGORIES[tx.c]?.names[langIndex]}</span>
                  {tx.n && <span className="text-slate-500 truncate max-w-[150px]">({tx.n})</span>}
                </div>
                <b className="font-bold">{fmt(totalIQD)} IQD</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Monthly Financial Advisor */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-slate-850 dark:to-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-teal-200 dark:border-teal-800 np">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span>{t('an')}</span>
          </h3>
          <button
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? t('scng') : t('ango')}</span>
          </button>
        </div>

        {aiAnalysisResult && (
          <div className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-teal-100 dark:border-teal-900 text-xs md:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {aiAnalysisResult}
          </div>
        )}
      </div>

      {/* Export Tools (Excel, Print) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700 np">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-teal-600" />
          <span>{t('expo')}</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('expn')}</p>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() =>
              exportExcelWorkbook({
                currentMonth,
                isYearly: false,
                isIncomeLocked: isLocked,
                workspaceId,
                langIndex,
                monthNames,
                members,
                defaultRate
              })
            }
            className="flex items-center gap-2 py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('xlb')} ({currentMonth})</span>
          </button>

          <button
            onClick={() =>
              exportExcelWorkbook({
                currentMonth,
                isYearly: true,
                isIncomeLocked: isLocked,
                workspaceId,
                langIndex,
                monthNames,
                members,
                defaultRate
              })
            }
            className="flex items-center gap-2 py-2 px-4 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{t('xlb')} ({currentYear})</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 py-2 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>{t('pr')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
