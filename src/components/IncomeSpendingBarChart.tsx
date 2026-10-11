import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  CartesianGrid
} from 'recharts';
import { BarChart3, Layers, Lock, PieChart, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../constants/categories';
import { fmt } from '../utils/calculations';

interface IncomeSpendingBarChartProps {
  income: number;
  expenses: number;
  savings: number;
  remaining: number;
  isLocked: boolean;
  categorySpending: number[]; // 32 items
  categoryBudgets: number[]; // 32 items
  langIndex: number;
  t: (key: string) => string;
}

export const IncomeSpendingBarChart: React.FC<IncomeSpendingBarChartProps> = ({
  income,
  expenses,
  savings,
  remaining,
  isLocked,
  categorySpending,
  categoryBudgets,
  langIndex,
  t
}) => {
  const [viewMode, setViewMode] = useState<'overview' | 'categories'>('categories');

  // Overview data
  const overviewData = [
    {
      name: t('inc'),
      amount: isLocked ? 0 : Math.round(income),
      displayAmount: isLocked ? '••••••' : `${fmt(income)} IQD`,
      color: '#10b981', // emerald-500
      isMasked: isLocked
    },
    {
      name: t('exp'),
      amount: Math.round(expenses),
      displayAmount: `${fmt(expenses)} IQD`,
      color: '#f43f5e', // rose-500
      isMasked: false
    },
    {
      name: t('ns'),
      amount: Math.round(savings),
      displayAmount: `${fmt(savings)} IQD`,
      color: '#3b82f6', // blue-500
      isMasked: false
    },
    {
      name: t('rem'),
      amount: isLocked ? 0 : Math.round(remaining),
      displayAmount: isLocked ? '••••••' : `${fmt(remaining)} IQD`,
      color: remaining >= 0 ? '#14b8a6' : '#ef4444', // teal or red
      isMasked: isLocked
    }
  ];

  // Top categories breakdown data (take top 6)
  const categoryData = CATEGORIES.map((cat, idx) => {
    const spent = Math.round(categorySpending[idx] || 0);
    const budget = Math.round(categoryBudgets[idx] || 0);
    return {
      id: cat.id,
      name: cat.names[langIndex] || cat.names[0],
      shortName: cat.names[langIndex]?.split(' ')[0] || cat.names[0],
      spent,
      budget,
      color: `hsl(${(idx * 47) % 360}, 65%, 48%)`
    };
  })
    .filter((c) => c.spent > 0 || c.budget > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 6);

  // Custom Recharts Tooltip for Overview
  const CustomOverviewTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs">
          <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">{data.name}</p>
          <p className="font-bold font-mono text-sm" style={{ color: data.color }}>
            {data.displayAmount}
          </p>
          {data.isMasked && (
            <p className="text-[10px] text-amber-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>{t('locked')}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Recharts Tooltip for Categories
  const CustomCategoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
          <p className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-1.5">{data.name}</p>
          <div className="flex items-center justify-between gap-3 text-rose-500">
            <span>{t('exp')}:</span>
            <b className="font-mono">{fmt(data.spent)} IQD</b>
          </div>
          {data.budget > 0 && (
            <div className="flex items-center justify-between gap-3 text-teal-600 dark:text-teal-400">
              <span>{t('bud')}:</span>
              <b className="font-mono">{fmt(data.budget)} IQD</b>
            </div>
          )}
          {data.budget > 0 && (
            <div className="pt-1 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 flex justify-between gap-3">
              <span>{t('used')}:</span>
              <b className={data.spent > data.budget ? 'text-red-500 font-bold' : ''}>
                {Math.round((data.spent / data.budget) * 100)}%
              </b>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
      {/* Header and Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>
            {viewMode === 'overview' ? t('chart_inc_vs_exp') : t('chart_top_cats')}
          </span>
        </h3>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`py-1 px-3 rounded-lg transition ${
              viewMode === 'categories'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('chart_top_cats').split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('overview')}
            className={`py-1 px-3 rounded-lg transition ${
              viewMode === 'overview'
                ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('chart_inc_vs_exp')}
          </button>
        </div>
      </div>

      {/* Chart container */}
      <div className="w-full h-72 min-h-[280px]">
        {viewMode === 'overview' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={overviewData}
              margin={{ top: 15, right: 10, left: -10, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`)}
                stroke="#cbd5e1"
              />
              <Tooltip content={<CustomOverviewTooltip />} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                {overviewData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : categoryData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            {t('none')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryData}
              margin={{ top: 15, right: 10, left: -10, bottom: 35 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#64748b' }}
                interval={0}
                stroke="#cbd5e1"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                tickFormatter={(val) => (val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${(val / 1000).toFixed(0)}k`)}
                stroke="#cbd5e1"
              />
              <Tooltip content={<CustomCategoryTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                formatter={(val) => (val === 'spent' ? t('exp') : t('bud'))}
              />
              <Bar dataKey="spent" fill="#f43f5e" radius={[6, 6, 0, 0]} name="spent" />
              <Bar dataKey="budget" fill="#0f766e" radius={[6, 6, 0, 0]} name="budget" opacity={0.65} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Helpful legend note under chart */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-750 text-xs text-slate-500">
        {viewMode === 'overview' ? (
          <div>
            {isLocked ? (
              <span className="text-amber-500 flex items-center gap-1 font-medium">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('locked')}</span>
              </span>
            ) : (
              <span>
                {t('inc')}: <b>{fmt(income)}</b> · {t('exp')}: <b>{fmt(expenses)} IQD</b>
              </span>
            )}
          </div>
        ) : (
          <div>
            <span>{t('chart_budget_vs_spent')}: </span>
            <span className="text-rose-500 font-bold me-2">■ {t('exp')}</span>
            <span className="text-teal-600 dark:text-teal-400 font-bold">■ {t('bud')}</span>
          </div>
        )}

        <span className="text-[11px] text-slate-400 font-medium">
          Recharts · Interactive Visualization
        </span>
      </div>
    </div>
  );
};
