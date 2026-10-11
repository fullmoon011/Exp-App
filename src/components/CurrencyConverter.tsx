import React, { useState } from 'react';
import {
  ArrowLeftRight,
  DollarSign,
  Copy,
  Check,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { fmt, fa } from '../utils/calculations';

interface CurrencyConverterProps {
  fxRate: number; // IQD per 1 USD defined in app settings
  t: (key: string) => string;
}

export type CurrencyCode = 'IQD' | 'USD' | 'EUR' | 'TRY' | 'IRT' | 'GBP';

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  name: string;
  nameSorani: string;
  flag: string;
  rateToUSD: number; // How many USD for 1 unit of this currency
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ fxRate, t }) => {
  const [amount, setAmount] = useState<string>('100');
  const [fromCurrency, setFromCurrency] = useState<CurrencyCode>('USD');
  const [toCurrency, setToCurrency] = useState<CurrencyCode>('IQD');
  const [copied, setCopied] = useState<boolean>(false);

  // Dynamic rates grounded on user's defined fxRate
  // 1 USD = fxRate IQD => 1 IQD = 1 / fxRate USD
  const currencies: Record<CurrencyCode, CurrencyInfo> = {
    USD: {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      nameSorani: 'دۆلاری ئەمریکی',
      flag: '🇺🇸',
      rateToUSD: 1.0
    },
    IQD: {
      code: 'IQD',
      symbol: 'د.ع',
      name: 'Iraqi Dinar',
      nameSorani: 'دیناری عێراقی',
      flag: '🇮🇶',
      rateToUSD: fxRate > 0 ? 1 / fxRate : 1 / 1500
    },
    EUR: {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      nameSorani: 'یۆرۆ',
      flag: '🇪🇺',
      rateToUSD: 1.085
    },
    TRY: {
      code: 'TRY',
      symbol: '₺',
      name: 'Turkish Lira',
      nameSorani: 'لیرەی تورکی',
      flag: '🇹🇷',
      rateToUSD: 0.029 // ~34.5 TRY per USD
    },
    IRT: {
      code: 'IRT',
      symbol: 'تومان',
      name: 'Iranian Toman',
      nameSorani: 'تمەنی ئێرانی',
      flag: '🇮🇷',
      rateToUSD: 1 / 65000 // ~65,000 Toman per USD
    },
    GBP: {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      nameSorani: 'پاوەندی بەریتانی',
      flag: '🇬🇧',
      rateToUSD: 1.295
    }
  };

  const numAmount = +amount || 0;

  // Convert: Amount in From -> USD -> To
  const fromInfo = currencies[fromCurrency];
  const toInfo = currencies[toCurrency];

  const amountInUSD = numAmount * fromInfo.rateToUSD;
  const convertedAmount = toInfo.rateToUSD > 0 ? amountInUSD / toInfo.rateToUSD : 0;

  // 1 unit of From in To
  const unitRateInTo = toInfo.rateToUSD > 0 ? fromInfo.rateToUSD / toInfo.rateToUSD : 0;

  // Swap currencies
  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Quick Amount presets
  const quickPresets: Record<CurrencyCode, number[]> = {
    USD: [50, 100, 200, 500, 1000],
    IQD: [25000, 50000, 100000, 250000, 1000000],
    EUR: [50, 100, 200, 500],
    TRY: [500, 1000, 2500, 5000],
    IRT: [1000000, 2000000, 5000000, 10000000],
    GBP: [50, 100, 200, 500]
  };

  // Copy converted result
  const handleCopy = () => {
    const formatted = convertedAmount >= 100 ? fmt(convertedAmount) : fa(convertedAmount);
    navigator.clipboard.writeText(`${formatted} ${toCurrency}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <ArrowLeftRight className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>{t('curconv')}</span>
        </h3>

        {/* Live app rate badge */}
        <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
          <span>1 USD = {fmt(fxRate)} IQD</span>
        </div>
      </div>

      {/* Main Conversion Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-750 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 items-center">
          {/* FROM amount and currency */}
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">{t('convfrom')}</span>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full py-2 px-3 text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 border-s border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                {Object.values(currencies).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SWAP BUTTON */}
          <div className="flex justify-center items-center sm:pt-4">
            <button
              type="button"
              onClick={handleSwap}
              title={t('swap')}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/60 active:rotate-180 transition-all duration-300 shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* TO target currency */}
          <div className="sm:col-span-2 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 block">{t('convto')}</span>
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="w-full py-2 px-3 text-sm md:text-base font-black text-teal-700 dark:text-teal-300 truncate">
                {convertedAmount >= 100 ? fmt(convertedAmount) : fa(convertedAmount)}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
                className="bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 px-2.5 border-s border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                {Object.values(currencies).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Conversion summary line & copy button */}
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="text-slate-500">
            <span>{t('rateused')}: </span>
            <b className="text-slate-700 dark:text-slate-200 font-semibold">
              1 {fromCurrency} = {unitRateInTo >= 100 ? fmt(unitRateInTo) : fa(unitRateInTo)} {toCurrency}
            </b>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'کۆپی کرا' : 'کۆپیکردن'}</span>
          </button>
        </div>
      </div>

      {/* Quick Amount presets */}
      <div className="mb-4">
        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">{t('quickamt')}</span>
        <div className="flex flex-wrap gap-1.5">
          {(quickPresets[fromCurrency] || [10, 50, 100, 500]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className={`py-1 px-2.5 rounded-lg text-xs font-bold transition border ${
                amount === String(preset)
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {fromInfo.symbol} {fmt(preset)}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-Currency Overview Grid */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
          {fmt(numAmount)} {fromCurrency} لە دراوەکانی تردا:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {Object.values(currencies)
            .filter((c) => c.code !== fromCurrency)
            .map((c) => {
              const eq = c.rateToUSD > 0 ? amountInUSD / c.rateToUSD : 0;
              return (
                <div
                  key={c.code}
                  onClick={() => setToCurrency(c.code)}
                  className={`p-2 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    toCurrency === c.code
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-400 text-teal-900 dark:text-teal-200'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{c.flag}</span>
                    <span className="font-semibold truncate">{c.code}</span>
                  </div>
                  <b className="font-bold font-mono">
                    {eq >= 100 ? fmt(eq) : fa(eq)}
                  </b>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
