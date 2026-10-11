import React, { useState } from 'react';
import { AlertTriangle, Check, DollarSign, Coins } from 'lucide-react';
import { NamesConfig } from '../types';

interface RatesBannerProps {
  names: NamesConfig;
  onUpdateRates: (fx: number, gp: number) => void;
  t: (key: string) => string;
}

export const RatesBanner: React.FC<RatesBannerProps> = ({ names, onUpdateRates, t }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isStale = names.fxd !== today || (names.gp > 0 && names.gpd !== today);

  const [fxVal, setFxVal] = useState<number>(names.fx || 1500);
  const [gpVal, setGpVal] = useState<number>(names.gp || 0);

  if (!isStale) return null;

  const handleConfirm = () => {
    onUpdateRates(fxVal, gpVal);
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-2xl p-3.5 mb-4 shadow-xs text-amber-900 dark:text-amber-200 np">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs md:text-sm font-semibold mb-2">
            {t('stale')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700/60 shadow-xs">
              <span className="text-xs font-bold text-slate-500">$</span>
              <input
                type="number"
                value={fxVal || ''}
                onChange={(e) => setFxVal(+e.target.value)}
                placeholder="1500"
                className="w-20 text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-700/60 shadow-xs">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <input
                type="number"
                value={gpVal || ''}
                onChange={(e) => setGpVal(+e.target.value)}
                placeholder="Gold 21k"
                className="w-24 text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{t('ok2')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
