import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  TrendingDown,
  Percent,
  CheckCircle2,
  Sliders,
  DollarSign,
  Coffee,
  Utensils,
  ShoppingBag,
  Film,
  Zap,
  ArrowRight
} from 'lucide-react';
import { MonthDoc, NamesConfig } from '../types';
import { CATEGORIES } from '../constants/categories';
import { calcMonthTotals, fmt, fa } from '../utils/calculations';

interface SavingsAdvisorCardProps {
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  langIndex: number;
  t: (key: string) => string;
  onUpdateBudget: (catIndex: number, amount: number) => void;
}

export const SavingsAdvisorCard: React.FC<SavingsAdvisorCardProps> = ({
  currentMonth,
  doc,
  names,
  langIndex,
  t,
  onUpdateBudget
}) => {
  const defaultRate = names.fx || 1500;
  const totals = calcMonthTotals(doc, defaultRate);

  // Target savings slider percentage (default 15% of income)
  const [targetPct, setTargetPct] = useState<number>(15);
  const [appliedNotice, setAppliedNotice] = useState<boolean>(false);

  // Non-essential / discretionary category indices in CATEGORIES array:
  // Cat 0: Housing (Fixed)
  // Cat 1: Utilities (Fixed)
  // Cat 2: Groceries/Food (Partially flexible)
  // Cat 3: Transportation (Semi-fixed)
  // Cat 4: Healthcare (Fixed)
  // Cat 5: Dining/Restaurants (Discretionary)
  // Cat 6: Shopping/Clothes (Discretionary)
  // Cat 7: Entertainment/Hobby (Discretionary)
  // Cat 8: Education (Fixed)
  // Cat 9: Personal care (Discretionary)
  // Cat 10: Debt payment (Fixed)
  // Cat 11: Miscellaneous/Other (Discretionary)
  const discretionaryIndices = [2, 5, 6, 7, 9, 11];

  const targetMonthlySavingsIQD = Math.round((totals.inc * targetPct) / 100);
  const targetAnnualSavingsIQD = targetMonthlySavingsIQD * 12;
  const targetMonthlySavingsUSD = Math.round(targetMonthlySavingsIQD / defaultRate);

  // Current savings gap
  const currentSavings = totals.sav;
  const savingsGap = Math.max(0, targetMonthlySavingsIQD - currentSavings);

  // Discretionary spending breakdown
  const flexibleSpendingList = discretionaryIndices
    .map(idx => {
      const cat = CATEGORIES[idx];
      const spent = totals.sp[idx] || 0;
      const budget = doc.bud[idx] || 0;
      return {
        idx,
        name: cat ? cat.names[langIndex] || cat.names[0] : 'Category',
        spent,
        budget,
        // Suggested cut: reduce by 20% rounded to nearest 5,000
        suggestedBudget: Math.max(0, Math.round((spent > 0 ? spent * 0.8 : budget * 0.8) / 5000) * 5000),
        potentialCut: Math.round(spent * 0.2)
      };
    })
    .filter(item => item.spent > 0 || item.budget > 0);

  // Actionable tips tailored to spending patterns
  const tips = [
    {
      icon: <Utensils className="w-4 h-4 text-amber-500" />,
      title: 'چێشتخانە و فاست فوود (Dining & Fast Food)',
      desc: 'ئامادەکردنی خواردن لە ماڵەوە لە جیاتی نانخواردنی دەرەوە دەتوانێت مانگانە تا ٢٥٪ لەم پۆلە پاشەکەوت بکات.'
    },
    {
      icon: <Coffee className="w-4 h-4 text-orange-500" />,
      title: 'کافێ و خواردنەوەی ڕۆژانە (Daily Cafes)',
      desc: 'دیاریکردنی بڕێکی جێگیر (بۆ نموونە هەفتەی ١٥ هەزار دینار) بۆ قاوە و شەربەت لە دەرەوە بۆ ڕێگری لە دزەکردنی بڕە بچووکەکان.'
    },
    {
      icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />,
      title: 'یاسای ٢٤ کاتژمێر بۆ بازاڕکردن (24-Hour Rule)',
      desc: 'بۆ هەر شتێکی ناکتوپڕ کە نرخی لە ٣٠,٠٠٠ دینار زیاترە، ٢٤ کاتژمێر چاوەڕێ بکە پێش کڕین بۆ دڵنیابوونەوە لە پێویستییەکەی.'
    },
    {
      icon: <Zap className="w-4 h-4 text-emerald-500" />,
      title: 'سەرەتا پشکی خۆت بدە (Pay Yourself First)',
      desc: `لە ڕۆژی وەرگرتنی مووچە، پێش خەرجکردن دەستبەجێ بڕی ${fmt(targetMonthlySavingsIQD)} د.ع بخەرە حیسابی پاشەکەوت یان زێڕ.`
    }
  ];

  const handleApplyRecommendedBudgets = () => {
    flexibleSpendingList.forEach(item => {
      if (item.suggestedBudget > 0) {
        onUpdateBudget(item.idx, item.suggestedBudget);
      }
    });
    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 4000);
  };

  return (
    <div className="bg-gradient-to-br from-teal-50/50 via-white to-slate-50 dark:from-teal-950/20 dark:via-slate-800 dark:to-slate-850 rounded-2xl p-4 md:p-5 border border-teal-100 dark:border-teal-900/40 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100/60 dark:border-teal-900/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div>
            <b className="text-sm md:text-base font-bold text-slate-900 dark:text-white block">
              {t('adv_title')}
            </b>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {t('adv_subtitle')}
            </span>
          </div>
        </div>

        {/* Target Slider Selector */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-700/80 px-3 py-1.5 rounded-xl border border-teal-200/60 dark:border-teal-800/60 text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            {t('adv_slider_label')}:
          </span>
          <div className="flex items-center gap-1 font-bold">
            {[10, 15, 20, 25].map(pct => (
              <button
                key={pct}
                type="button"
                onClick={() => setTargetPct(pct)}
                className={`px-2 py-0.5 rounded-md transition ${
                  targetPct === pct
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-650'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Savings Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            ئامانجی پاشەکەوتی مانگانە ({targetPct}%)
          </span>
          <b className="text-base font-black text-teal-600 dark:text-teal-400 block">
            {fmt(targetMonthlySavingsIQD)} {t('iqd')}
          </b>
          <span className="text-[10px] text-slate-400 block">
            ≈ ${fmt(targetMonthlySavingsUSD)}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            {t('adv_potential_savings')}
          </span>
          <b className="text-base font-black text-emerald-600 dark:text-emerald-400 block">
            {fmt(targetAnnualSavingsIQD)} {t('iqd')}
          </b>
          <span className="text-[10px] text-slate-400 block">
            لە ماوەی ١ ساڵدا
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
          <span className="text-slate-400 text-[11px] block">
            جیاوازی پاشەکەوتی ئێستات
          </span>
          <b className={`text-base font-black block ${savingsGap === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {savingsGap === 0 ? 'گەیشتووی بە ئامانجەکە! 🎉' : `${fmt(savingsGap)} ${t('iqd')}`}
          </b>
          <span className="text-[10px] text-slate-400 block">
            {savingsGap === 0 ? 'بەردەوام بە لەسەر ئەم ڕیتمە' : 'پێویستە کەم بکرێتەوە لە خەرجییەکان'}
          </span>
        </div>
      </div>

      {/* Discretionary Spending Reductions Table / Grid */}
      {flexibleSpendingList.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
              <span>پۆلە نەرمەکان و پێشنیازی بودجەی کەمکردنەوە (-20%)</span>
            </span>

            <button
              type="button"
              onClick={handleApplyRecommendedBudgets}
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>{t('adv_apply_budget')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {appliedNotice && (
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>بودجە پێشنیازکراوەکان بە سەرکەوتوویی لە خشتەی بودجەی ئەم مانگەدا تۆمار کران!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {flexibleSpendingList.map(item => (
              <div
                key={item.idx}
                className="bg-slate-50 dark:bg-slate-850 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                  <span className="text-[10px] text-rose-600 font-semibold">-{fmt(item.potentialCut)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>خەرجی: {fmt(item.spent)}</span>
                  <span>پێشنیاز: <b className="text-teal-600 font-bold">{fmt(item.suggestedBudget)}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Practical Actionable Tips */}
      <div className="space-y-2 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
          {t('adv_tips_title')}:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {tips.map((tip, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex gap-2.5 items-start"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 shrink-0 mt-0.5">
                {tip.icon}
              </div>
              <div>
                <b className="font-bold text-slate-850 dark:text-slate-100 block text-[11px]">
                  {tip.title}
                </b>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed block mt-0.5">
                  {tip.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
