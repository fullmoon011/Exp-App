import React, { useState, useRef } from 'react';
import {
  X,
  Plus,
  Repeat,
  Camera,
  Calendar,
  Sparkles,
  ScanLine,
  AlertTriangle,
  Zap,
  Wifi,
  Home,
  Droplets,
  Flame,
  Smartphone
} from 'lucide-react';
import { ExpenseTx, MonthDoc, NamesConfig } from '../types';
import { CATEGORIES } from '../constants/categories';
import { fmt, val } from '../utils/calculations';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  langIndex: number;
  t: (key: string) => string;
  onAddExpense: (tx: ExpenseTx, repeatMonthly: boolean, dueDay?: number) => void;
  defaultRepeat?: boolean;
  defaultCategory?: number;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  doc,
  names,
  langIndex,
  t,
  onAddExpense,
  defaultRepeat = false,
  defaultCategory = 6
}) => {
  const [catIndex, setCatIndex] = useState<number>(defaultCategory);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10).startsWith(currentMonth)
      ? new Date().toISOString().slice(0, 10)
      : `${currentMonth}-01`
  );
  const [currency, setCurrency] = useState<'D' | 'U'>('D');
  const [personIndex, setPersonIndex] = useState<number>(0);
  const [isShared, setIsShared] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [repeatMonthly, setRepeatMonthly] = useState<boolean>(defaultRepeat);
  const [dueDay, setDueDay] = useState<string>('1');
  const [photoData, setPhotoData] = useState<string>('');

  // AI states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const defaultRate = names.fx || 1500;
  const members = names.mem || [{ n: 'Person 1', e: 'user' }];
  const activeMemberIndices = members.map((_, i) => i).filter(i => !members[i]?.x);

  // Quick Bill Presets
  const billPresets = [
    { cat: 1, icon: <Zap className="w-3.5 h-3.5 text-amber-500" />, label: 'کارەبا / مۆلیدە (Electricity)' },
    { cat: 4, icon: <Wifi className="w-3.5 h-3.5 text-blue-500" />, label: 'ئینتەرنێت (Internet)' },
    { cat: 5, icon: <Smartphone className="w-3.5 h-3.5 text-indigo-500" />, label: 'مۆبایل (Mobile)' },
    { cat: 0, icon: <Home className="w-3.5 h-3.5 text-emerald-500" />, label: 'کرێ (Rent)' },
    { cat: 2, icon: <Droplets className="w-3.5 h-3.5 text-cyan-500" />, label: 'ئاو (Water)' },
    { cat: 3, icon: <Flame className="w-3.5 h-3.5 text-orange-500" />, label: 'گاز و نەوت (Gas)' },
  ];

  const handleSelectBillPreset = (presetCat: number, label: string) => {
    setCatIndex(presetCat);
    setRepeatMonthly(true);
    if (!note) setNote(CATEGORIES[presetCat]?.names[langIndex] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || +amount <= 0 || doc.closed) return;

    const tx: ExpenseTx = {
      c: catIndex,
      d: date,
      a: +amount,
      cu: currency,
      r: defaultRate,
      w: personIndex,
      s: isShared ? 1 : 0,
      ph: photoData,
      n: note.trim()
    };

    onAddExpense(tx, repeatMonthly, dueDay ? +dueDay : 1);
    onClose();
  };

  const handleReceiptScan = async (file: File) => {
    if (!file) return;
    setIsScanning(true);
    setScanMessage(t('scng'));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch('/api/scan-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64 })
          });

          if (!res.ok) throw new Error('API scan failed');
          const data = await res.json();

          if (data.total && +data.total > 0) {
            setAmount(String(data.total));
            if (data.currency === 'USD') setCurrency('U');
            else setCurrency('D');

            if (data.category >= 0 && data.category < CATEGORIES.length) {
              setCatIndex(data.category);
            }
            if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
              setDate(data.date);
            }
            const notes = [data.merchant, data.note].filter(Boolean).join(' - ');
            setNote(notes);
            setPhotoData(base64);
            setScanMessage(t('scok'));
          } else {
            setScanMessage(t('scer'));
          }
        } catch (err) {
          console.error(err);
          setScanMessage(t('scer'));
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanning(false);
      setScanMessage(t('scer'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-750 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {t('newx')}
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('app')} · {currentMonth}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Bill Presets */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 block mb-1.5">
            پسوڵە باوەکان (Quick Bill Setup):
          </span>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {billPresets.map((bp) => (
              <button
                key={bp.cat}
                type="button"
                onClick={() => handleSelectBillPreset(bp.cat, bp.label)}
                className={`flex items-center gap-1.5 py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  catIndex === bp.cat
                    ? 'bg-teal-50 dark:bg-teal-950/80 border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                {bp.icon}
                <span>{bp.label.split(' (')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Amount & Currency */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {t('amt')} *
            </label>
            <div className="flex rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
              <input
                type="number"
                step="any"
                min="0"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full py-3 px-3.5 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-black text-lg focus:outline-none"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'D' | 'U')}
                className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm px-3.5 border-s border-slate-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="D">{t('iqd')}</option>
                <option value="U">$ (USD)</option>
              </select>
            </div>
          </div>

          {/* Category & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('cat')}
              </label>
              <select
                value={catIndex}
                onChange={(e) => setCatIndex(+e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.names[langIndex]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('due')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          {/* Note / Vendor */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
              {t('desc')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="وەک ناوی مارکێت، پسوڵە، کۆمپانیا..."
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-100 focus:outline-none"
            />
          </div>

          {/* Person Selector (if > 1) */}
          {activeMemberIndices.length > 1 && (
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {t('byp')}
                </label>
                <select
                  value={personIndex}
                  onChange={(e) => setPersonIndex(+e.target.value)}
                  className="w-full py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  {members.map((m, idx) =>
                    !m.x ? (
                      <option key={idx} value={idx}>
                        {m.n}
                      </option>
                    ) : null
                  )}
                </select>
              </div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 pt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="rounded-sm text-teal-600"
                />
                <span>{t('shr')}</span>
              </label>
            </div>
          )}

          {/* RECURRING EXPENSE TOGGLE CONTAINER */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              repeatMonthly
                ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-400/80 dark:border-teal-700'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    repeatMonthly
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 block">
                    {t('recbill_title')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block max-w-xs">
                    {t('recbill_desc')}
                  </span>
                </div>
              </div>

              {/* iOS style toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={repeatMonthly}
                onClick={() => setRepeatMonthly(!repeatMonthly)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  repeatMonthly ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    repeatMonthly ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* When toggled ON: Due day selector & quick chips */}
            {repeatMonthly && (
              <div className="mt-3.5 pt-3 border-t border-teal-200 dark:border-teal-800/60 space-y-2 animate-in fade-in duration-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <span>{t('recbill_day')}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="1"
                      className="w-16 py-1 px-2 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-lg focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">{t('days')}</span>
                  </div>
                </div>

                {/* Quick days chips */}
                <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-0.5 no-scrollbar">
                  <span className="text-slate-400 shrink-0">{t('recbill_quickdays')}</span>
                  {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDueDay(String(d))}
                      className={`py-0.5 px-2 rounded-md font-semibold transition ${
                        dueDay === String(d)
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-750">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t('rst')}
            </button>
            <button
              type="submit"
              disabled={!amount || +amount <= 0}
              className="py-2.5 px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs md:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{t('add')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
