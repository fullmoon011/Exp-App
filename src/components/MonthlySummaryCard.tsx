import React, { useState, useRef } from 'react';
import {
  Share2,
  Copy,
  Download,
  Check,
  TrendingUp,
  TrendingDown,
  Sparkles,
  PieChart as PieIcon,
  Award,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { MonthDoc, NamesConfig } from '../types';
import { CATEGORIES } from '../constants/categories';
import { MONTH_NAMES } from '../constants/translations';
import { calcMonthTotals, calc503020, fmt, fa } from '../utils/calculations';

interface MonthlySummaryCardProps {
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  langIndex: number;
  t: (key: string) => string;
}

export const MonthlySummaryCard: React.FC<MonthlySummaryCardProps> = ({
  currentMonth,
  doc,
  names,
  langIndex,
  t
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const defaultRate = names.fx || 1500;
  const totals = calcMonthTotals(doc, defaultRate);
  const ruleBreakdown = calc503020(totals);

  // Month title formatted
  const [yearStr, monthNumStr] = currentMonth.split('-');
  const monthIdx = parseInt(monthNumStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] ? MONTH_NAMES[monthIdx][langIndex] || MONTH_NAMES[monthIdx][0] : currentMonth;

  // Top 3 spending categories
  const topCategories = CATEGORIES
    .map((cat, idx) => ({
      name: cat.names[langIndex] || cat.names[0],
      icon: cat.icon,
      spent: totals.sp[idx] || 0,
      pct: totals.exp > 0 ? Math.round(((totals.sp[idx] || 0) / totals.exp) * 100) : 0
    }))
    .filter(c => c.spent > 0)
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 3);

  // Financial status assessment
  let statusBadge = {
    text: 'نایاب و تەندروست (Excellent)',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
  };
  if (totals.sav < 0) {
    statusBadge = {
      text: 'خەرجی زیاتر لە داهات (Deficit)',
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
    };
  } else if (totals.sr < 15) {
    statusBadge = {
      text: 'مامناوەند - پێویست بە ئاگاداری (Moderate)',
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
    };
  }

  // Generate formatted WhatsApp text
  const generateSummaryText = (): string => {
    const topLines = topCategories
      .map((c, i) => `${i + 1}. ${c.name}: ${fmt(c.spent)} IQD (${c.pct}%)`)
      .join('\n');

    return `📊 *پوختەی دارایی مانگی ${monthName} ${yearStr}*\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 *کۆی داهات:* ${fmt(totals.inc)} IQD\n` +
      `🛒 *کۆی خەرجی:* ${fmt(totals.exp)} IQD\n` +
      `💎 *پاشەکەوتی پوخت:* ${fmt(totals.sav)} IQD (${totals.sr}%)\n\n` +
      `🔥 *زۆرترین خەرجییەکان:*\n${topLines || 'هیچ تۆمار نەکراوە'}\n\n` +
      `🎯 *پشکی ڕێسای ٥٠/٣٠/٢٠:*\n` +
      `• پێداویستی بنەڕەتی: ${fmt(ruleBreakdown.needs)} IQD (${ruleBreakdown.needsPct}%)\n` +
      `• ئارەزوو و خۆشی: ${fmt(ruleBreakdown.wants)} IQD (${ruleBreakdown.wantsPct}%)\n` +
      `• پاشەکەوت: ${fmt(ruleBreakdown.savings)} IQD (${ruleBreakdown.savingsPct}%)\n\n` +
      `✨ *دۆخی گشتی:* ${statusBadge.text}\n` +
      `📱 _تۆمارکراوە لە ڕێگەی ئەپی داهاتوو (Dahatu)_`;
  };

  // Copy to clipboard
  const handleCopyWhatsApp = async () => {
    try {
      const text = generateSummaryText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Mobile Web Share API
  const handleShare = async () => {
    const text = generateSummaryText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `پوختەی دارایی ${monthName} ${yearStr}`,
          text: text
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopyWhatsApp();
    }
  };

  // Export card directly as crisp PNG image via HTML5 Canvas
  const handleDownloadImage = () => {
    setIsExportingImage(true);
    try {
      const width = 800;
      const height = 960;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0f172a'); // slate-900
      bgGrad.addColorStop(0.6, '#1e293b'); // slate-800
      bgGrad.addColorStop(1, '#0f2b2b'); // dark teal
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Decorative top arc
      ctx.fillStyle = 'rgba(15, 118, 110, 0.25)';
      ctx.beginPath();
      ctx.arc(width - 80, 80, 180, 0, Math.PI * 2);
      ctx.fill();

      // Card Header
      ctx.fillStyle = '#0d9488'; // teal-600
      ctx.beginPath();
      ctx.roundRect(40, 40, width - 80, 120, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "Noto Sans Arabic", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`پوختەی دارایی مانگی ${monthName} ${yearStr}`, width - 70, 95);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '18px "Noto Sans Arabic", sans-serif';
      ctx.fillText('داهاتوو • سیستەمی بەڕێوەبردنی دارایی و خێزانی', width - 70, 132);

      // Financial Metrics Row (Income, Expenses, Savings)
      const boxW = (width - 80 - 32) / 3;
      const yRow1 = 180;
      const hRow1 = 150;

      // Box 1: Income
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(40, yRow1, boxW, hRow1, 20);
      ctx.fill();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Noto Sans Arabic", sans-serif';
      ctx.fillText('کۆی داهات', 40 + boxW - 20, yRow1 + 45);
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(fmt(totals.inc), 40 + boxW - 20, yRow1 + 95);
      ctx.font = '14px sans-serif';
      ctx.fillText('IQD', 40 + boxW - 20, yRow1 + 125);

      // Box 2: Expenses
      const xBox2 = 40 + boxW + 16;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(xBox2, yRow1, boxW, hRow1, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Noto Sans Arabic", sans-serif';
      ctx.fillText('کۆی خەرجی', xBox2 + boxW - 20, yRow1 + 45);
      ctx.fillStyle = '#fb7185';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(fmt(totals.exp), xBox2 + boxW - 20, yRow1 + 95);
      ctx.font = '14px sans-serif';
      ctx.fillText('IQD', xBox2 + boxW - 20, yRow1 + 125);

      // Box 3: Savings
      const xBox3 = xBox2 + boxW + 16;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(xBox3, yRow1, boxW, hRow1, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Noto Sans Arabic", sans-serif';
      ctx.fillText('پاشەکەوت', xBox3 + boxW - 20, yRow1 + 45);
      ctx.fillStyle = totals.sav >= 0 ? '#38bdf8' : '#fb7185';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(fmt(totals.sav), xBox3 + boxW - 20, yRow1 + 95);
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(`${totals.sr}% پاشەکەوت`, xBox3 + boxW - 20, yRow1 + 125);

      // Section: Top Categories
      const yTop = 350;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(40, yTop, width - 80, 240, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px "Noto Sans Arabic", sans-serif';
      ctx.fillText('🔥 زۆرترین پۆلەکانی خەرجی', width - 70, yTop + 45);

      topCategories.forEach((cat, idx) => {
        const itemY = yTop + 85 + idx * 48;
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 17px "Noto Sans Arabic", sans-serif';
        ctx.fillText(`${idx + 1}. ${cat.name}`, width - 70, itemY);

        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'left';
        ctx.fillText(`${fmt(cat.spent)} IQD (${cat.pct}%)`, 70, itemY);
        ctx.textAlign = 'right';
      });

      // Section: 50/30/20 Rule Breakdown
      const yRule = 610;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(40, yRule, width - 80, 180, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 20px "Noto Sans Arabic", sans-serif';
      ctx.fillText('🎯 دابەشبوونی بودجە بەپێی ٥٠/٣٠/٢٠', width - 70, yRule + 45);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '16px "Noto Sans Arabic", sans-serif';
      ctx.fillText(`• پێداویستی بنەڕەتی: ${fmt(ruleBreakdown.needs)} IQD (${ruleBreakdown.needsPct}%)`, width - 70, yRule + 85);
      ctx.fillText(`• ئارەزوو و کەیفوسەفا: ${fmt(ruleBreakdown.wants)} IQD (${ruleBreakdown.wantsPct}%)`, width - 70, yRule + 120);
      ctx.fillText(`• پاشەکەوت و داهاتوو: ${fmt(ruleBreakdown.savings)} IQD (${ruleBreakdown.savingsPct}%)`, width - 70, yRule + 155);

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '14px "Noto Sans Arabic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('دروستکراوە بە بەرنامەی دارایی داهاتوو (Dahatu) • پاراستنی داتای کەسی', width / 2, 850);

      // Download triggered
      const link = document.createElement('a');
      link.download = `Dahatu-Summary-${currentMonth}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div
      ref={cardRef}
      className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4 transition-all"
    >
      {/* Header and Quick Share Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-750">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <b className="text-sm md:text-base font-bold text-slate-900 dark:text-white block">
              {t('sum_card_title')}
            </b>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {monthName} {yearStr} • {t('sum_card_desc')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopyWhatsApp}
            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
            }`}
            title={t('sum_whatsapp_copy')}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? t('copied') || 'کۆپی کرا' : t('sum_whatsapp_copy')}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-650 transition flex items-center gap-1"
            title={t('sum_share_native')}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('sum_share_native')}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExportingImage}
            className="py-1.5 px-2.5 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1 shadow-xs disabled:opacity-50"
            title={t('sum_download_img')}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('sum_download_img')}</span>
          </button>
        </div>
      </div>

      {/* Main 3 Metrics Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        {/* Income */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('inc')}</span>
          </span>
          <b className="text-base sm:text-lg font-black text-slate-900 dark:text-white block">
            {fmt(totals.inc)} <span className="text-xs font-medium text-slate-400">{t('iqd')}</span>
          </b>
        </div>

        {/* Expenses */}
        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('exp')}</span>
          </span>
          <b className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 block">
            {fmt(totals.exp)} <span className="text-xs font-medium text-slate-400">{t('iqd')}</span>
          </b>
        </div>

        {/* Net Savings */}
        <div className="bg-teal-50/60 dark:bg-teal-950/30 p-3 rounded-xl border border-teal-200/70 dark:border-teal-800/60 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-teal-800 dark:text-teal-200 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t('sum_net_savings')}</span>
            </span>
            <span className="font-bold text-teal-700 dark:text-teal-300">
              {totals.sr}%
            </span>
          </div>
          <b className={`text-base sm:text-lg font-black block ${totals.sav >= 0 ? 'text-teal-700 dark:text-teal-300' : 'text-rose-600'}`}>
            {fmt(totals.sav)} <span className="text-xs font-medium text-slate-400">{t('iqd')}</span>
          </b>
        </div>
      </div>

      {/* Top 3 Spending Categories & 50/30/20 Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
        {/* Top 3 */}
        <div className="bg-slate-50/80 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
            {t('sum_top_expenses')}:
          </span>
          {topCategories.length === 0 ? (
            <span className="text-slate-400 italic text-[11px] block">{t('no_tx') || 'هیچ خەرجییەک نییە'}</span>
          ) : (
            <div className="space-y-1.5">
              {topCategories.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center text-slate-600 dark:text-slate-300">
                      {i + 1}
                    </span>
                    <span className="font-medium truncate max-w-[140px]">{c.name}</span>
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <b className="text-slate-850 dark:text-white font-bold">{fmt(c.spent)}</b>
                    <span className="text-[10px] text-slate-400">({c.pct}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 50/30/20 summary */}
        <div className="bg-slate-50/80 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
              {t('r50')} (50/30/20):
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
              {statusBadge.text.split(' ')[0]}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500">{t('nd')} (50%)</span>
              <b className="text-slate-700 dark:text-slate-200">{ruleBreakdown.needsPct}%</b>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, ruleBreakdown.needsPct)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] pt-0.5">
              <span className="text-slate-500">{t('wt')} (30%)</span>
              <b className="text-slate-700 dark:text-slate-200">{ruleBreakdown.wantsPct}%</b>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${Math.min(100, ruleBreakdown.wantsPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
