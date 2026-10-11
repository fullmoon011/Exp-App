import React, { useState, useRef } from 'react';
import {
  ScanLine,
  Sparkles,
  Camera,
  Plus,
  Save,
  X,
  Repeat,
  Users,
  Search,
  Pencil,
  Trash2,
  Undo2,
  AlertTriangle,
  Lock,
  Image as ImageIcon,
  CheckCircle2,
  TrendingDown,
  Calendar
} from 'lucide-react';
import { ExpenseTx, MonthDoc, NamesConfig, RecurringExpense } from '../types';
import { CATEGORIES } from '../constants/categories';
import { val, fmt, fa, calcMonthTotals } from '../utils/calculations';
import { CategoryIcon } from './CategoryIcon';
import { AddExpenseModal } from './AddExpenseModal';

interface ExpensesTabProps {
  currentMonth: string;
  doc: MonthDoc;
  names: NamesConfig;
  isLocked: boolean;
  langIndex: number;
  t: (key: string) => string;
  recurring: RecurringExpense[];
  onAddExpense: (tx: ExpenseTx, repeatMonthly: boolean, dueDay?: number) => void;
  onEditExpense: (index: number, tx: ExpenseTx) => void;
  onDeleteExpense: (index: number) => void;
  onUndoDelete: () => void;
  hasUndo: boolean;
  onApplyRecurring: () => void;
  onDeleteRecurring: (idx: number) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  currentMonth,
  doc,
  names,
  isLocked,
  langIndex,
  t,
  recurring,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
  onUndoDelete,
  hasUndo,
  onApplyRecurring,
  onDeleteRecurring
}) => {
  // Form state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [catIndex, setCatIndex] = useState<number>(6); // default groceries
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
  const [repeatMonthly, setRepeatMonthly] = useState<boolean>(false);
  const [dueDay, setDueDay] = useState<string>('');
  const [photoData, setPhotoData] = useState<string>('');

  // AI states
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [quickText, setQuickText] = useState('');
  const [isParsingQuick, setIsParsingQuick] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCat, setFilterCat] = useState<string>('');
  const [filterPerson, setFilterPerson] = useState<string>('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Photo modal
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Add Transaction Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalDefaultRepeat, setModalDefaultRepeat] = useState(false);
  const [modalDefaultCat, setModalDefaultCat] = useState(6);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const defaultRate = names.fx || 1500;
  const totals = calcMonthTotals(doc, defaultRate);
  const members = names.mem || [{ n: 'Person 1', e: 'user' }];
  const activeMemberIndices = members.map((_, i) => i).filter(i => !members[i]?.x);

  // Live Limit & Budget Check
  const enteredVal = (+amount || 0) * (currency === 'U' ? defaultRate : 1);
  const budgetForCat = doc.bud[catIndex] || 0;
  const currentSpentInCat = totals.sp[catIndex] || 0;
  const projectedCatSpent = currentSpentInCat + enteredVal;

  const warningThresholdPct = (names.lim?.p || 80) / 100;
  const isBudgetWarning =
    budgetForCat > 0 &&
    enteredVal > 0 &&
    projectedCatSpent >= budgetForCat * warningThresholdPct &&
    projectedCatSpent <= budgetForCat;
  const isBudgetExceeded = budgetForCat > 0 && enteredVal > 0 && projectedCatSpent > budgetForCat;

  // Monthly Spending Cap check
  let isMonthlyCapExceeded = false;
  if (names.lim?.m === 'a' && names.lim?.v && enteredVal > 0) {
    isMonthlyCapExceeded = totals.exp + enteredVal > names.lim.v;
  } else if (names.lim?.m === 'p' && names.lim?.v && totals.inc > 0 && enteredVal > 0) {
    const capAmount = totals.inc * (names.lim.v / 100);
    isMonthlyCapExceeded = totals.exp + enteredVal > capAmount;
  }

  // Handle Form Submit
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

    if (editingIndex !== null) {
      onEditExpense(editingIndex, tx);
      setEditingIndex(null);
    } else {
      onAddExpense(tx, repeatMonthly, dueDay ? +dueDay : undefined);
    }

    // Reset inputs
    setAmount('');
    setNote('');
    setPhotoData('');
    setRepeatMonthly(false);
    setDueDay('');
    setScanMessage('');
  };

  // Start editing
  const handleStartEdit = (idx: number) => {
    const tx = doc.tx[idx];
    if (!tx) return;
    setEditingIndex(idx);
    setCatIndex(tx.c);
    setAmount(String(tx.a));
    setDate(tx.d);
    setCurrency(tx.cu);
    setPersonIndex(tx.w);
    setIsShared(Boolean(tx.s));
    setNote(tx.n || '');
    setPhotoData(tx.ph || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Receipt Scanner via Server API
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

  // Quick Text Entry via Server API
  const handleQuickEntry = async () => {
    if (!quickText.trim()) return;
    setIsParsingQuick(true);
    try {
      const res = await fetch('/api/parse-quick-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quickText })
      });

      if (!res.ok) throw new Error('Failed to parse text');
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
        if (data.note) setNote(data.note);
        setQuickText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsParsingQuick(false);
    }
  };

  // Attach photo
  const handleAttachPhoto = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Month Projection & Daily Allowance
  const now = new Date();
  const daysInMonth = new Date(+currentMonth.slice(0, 4), +currentMonth.slice(5), 0).getDate();
  const currentDay = now.toISOString().slice(0, 7) === currentMonth ? now.getDate() : 0;
  const projectedSpending = currentDay > 0 ? (totals.exp / currentDay) * daysInMonth : totals.exp;
  const remainingDays = Math.max(1, daysInMonth - currentDay + 1);
  const dailyAllowance = Math.max(0, (totals.inc - totals.sv - totals.exp) / remainingDays);

  // Filtered transactions
  const filteredList = (doc.tx || [])
    .map((tx, idx) => ({ tx, idx }))
    .filter(({ tx }) => {
      if (filterCat !== '' && tx.c !== +filterCat) return false;
      if (filterPerson !== '' && tx.w !== +filterPerson) return false;
      if (filterDateFrom && tx.d < filterDateFrom) return false;
      if (filterDateTo && tx.d > filterDateTo) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        // 1. Note / details description
        const notes = (tx.n || '').toLowerCase();
        // 2. Category name across all languages
        const cat = CATEGORIES[tx.c];
        const catNames = cat ? cat.names.join(' ').toLowerCase() : '';
        // 3. Amount checks (raw amount, formatted amount, and converted IQD value)
        const amtStr = String(tx.a).toLowerCase();
        const amtFmt = fmt(tx.a).toLowerCase().replace(/,/g, '');
        const amtFa = fa(tx.a).toLowerCase();
        const iqdVal = String(Math.round(val(tx, defaultRate)));
        const iqdFmt = fmt(val(tx, defaultRate)).toLowerCase().replace(/,/g, '');
        // 4. Currency tags
        const cuStr = tx.cu === 'U' ? 'usd $ dollar دۆلار' : 'iqd dinar دینار';
        // 5. Date
        const dateStr = (tx.d || '').toLowerCase();
        // 6. Person name
        const personName = (members[tx.w]?.n || '').toLowerCase();

        const matches =
          notes.includes(query) ||
          catNames.includes(query) ||
          amtStr.includes(query) ||
          amtFmt.includes(query) ||
          amtFa.includes(query) ||
          iqdVal.includes(query) ||
          iqdFmt.includes(query) ||
          cuStr.includes(query) ||
          dateStr.includes(query) ||
          personName.includes(query);

        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => (b.tx.d || '').localeCompare(a.tx.d || ''));

  const filteredTotalIQD = filteredList.reduce((acc, { tx }) => acc + val(tx, defaultRate), 0);

  return (
    <div className="space-y-4 pb-12">
      {/* Closed month alert */}
      {doc.closed === 1 && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-red-700 dark:text-red-300 text-sm font-semibold">
          <Lock className="w-5 h-5 shrink-0" />
          <span>{t('lock')}</span>
        </div>
      )}

      {/* Quick Add / Edit Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <span>{editingIndex !== null ? t('desc') : t('newx')}</span>
          </h2>

          {/* Action Tools Bar */}
          <div className="flex items-center gap-2 np">
            <button
              type="button"
              onClick={() => {
                setModalDefaultRepeat(true);
                setModalDefaultCat(4); // default to Internet
                setIsAddModalOpen(true);
              }}
              disabled={Boolean(doc.closed)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Repeat className="w-3.5 h-3.5" />
              <span>+ {t('recbill_title').split(' / ')[0]}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isScanning || Boolean(doc.closed)}
              className="flex items-center gap-1.5 py-1.5 px-2.5 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800 transition"
            >
              <ScanLine className="w-4 h-4" />
              <span>{isScanning ? t('scng') : t('scan')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => e.target.files?.[0] && handleReceiptScan(e.target.files[0])}
            />
          </div>
        </div>

        {/* AI Quick entry input */}
        <div className="mb-4 np">
          <div className="flex gap-2">
            <input
              type="text"
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickEntry()}
              placeholder={t('qph')}
              className="flex-1 py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="button"
              onClick={handleQuickEntry}
              disabled={isParsingQuick || !quickText.trim()}
              className="py-2 px-3 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('qgo')}</span>
            </button>
          </div>
          {scanMessage && (
            <p className="text-xs mt-1.5 font-medium text-teal-600 dark:text-teal-400">
              {scanMessage}
            </p>
          )}
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {/* Amount & Currency */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('amt')}
              </label>
              <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-teal-500">
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold text-base focus:outline-none"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'D' | 'U')}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs px-2.5 border-s border-slate-200 dark:border-slate-700 focus:outline-none"
                >
                  <option value="D">{t('iqd')}</option>
                  <option value="U">$</option>
                </select>
              </div>
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('cat')}
              </label>
              <select
                value={catIndex}
                onChange={(e) => setCatIndex(+e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.names[langIndex]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('due')}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Person selector (if > 1 active members) */}
            {activeMemberIndices.length > 1 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  {t('byp')}
                </label>
                <select
                  value={personIndex}
                  onChange={(e) => setPersonIndex(+e.target.value)}
                  className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            )}

            {/* Description / Note */}
            <div className={activeMemberIndices.length > 1 ? 'sm:col-span-2' : 'sm:col-span-2 md:col-span-2'}>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {t('desc')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('desc')}
                className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* RECURRING EXPENSE TOGGLE CONTAINER */}
          <div
            className={`p-3.5 rounded-2xl border transition-all ${
              repeatMonthly
                ? 'bg-teal-50/80 dark:bg-teal-950/50 border-teal-300 dark:border-teal-700'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    repeatMonthly
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">
                    {t('recbill_title')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block max-w-sm">
                    {t('recbill_desc')}
                  </span>
                </div>
              </div>

              {/* Toggle switch */}
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

            {/* When toggled ON: due day selector & quick chips */}
            {repeatMonthly && (
              <div className="mt-3 pt-2.5 border-t border-teal-200 dark:border-teal-800/60 space-y-2 animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{t('recbill_day')}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay || '1'}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="1"
                      className="w-16 py-1 px-2 text-center text-xs font-bold bg-white dark:bg-slate-800 border border-teal-300 dark:border-teal-700 rounded-lg focus:outline-none"
                    />
                    <span className="text-xs text-slate-500">{t('days')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] overflow-x-auto py-0.5 no-scrollbar">
                  <span className="text-slate-400 shrink-0">{t('recbill_quickdays')}</span>
                  {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDueDay(String(d))}
                      className={`py-0.5 px-2 rounded-md font-semibold transition ${
                        (dueDay || '1') === String(d)
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

          {/* Options & Photo Attachment */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
              {activeMemberIndices.length > 1 && (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => setIsShared(e.target.checked)}
                    className="rounded-sm text-teal-600 focus:ring-teal-500"
                  />
                  <span>{t('shr')}</span>
                </label>
              )}

              {/* Photo attach button */}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className={`flex items-center gap-1 py-1 px-2.5 rounded-lg border text-xs font-medium transition ${
                  photoData
                    ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{photoData ? t('phv') : t('pht')}</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleAttachPhoto(e.target.files[0])}
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="flex-1 sm:flex-none py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={Boolean(doc.closed) || !amount}
                className="flex-1 sm:flex-none py-2.5 px-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition active:scale-98"
              >
                {editingIndex !== null ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('sa')}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('add')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Limit / Over-budget warning under form */}
        {(isBudgetWarning || isBudgetExceeded || isMonthlyCapExceeded) && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl space-y-1">
            {isBudgetExceeded && (
              <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {CATEGORIES[catIndex]?.names[langIndex]}: {t('wb')} ({fmt(projectedCatSpent)} / {fmt(budgetForCat)} IQD)
                </span>
              </p>
            )}
            {isBudgetWarning && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {CATEGORIES[catIndex]?.names[langIndex]}: {t('wp')} ({fmt(projectedCatSpent)} / {fmt(budgetForCat)} IQD)
                </span>
              </p>
            )}
            {isMonthlyCapExceeded && (
              <p className="text-xs text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t('wc')}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* 3 KPI Overview Cards */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-4">
        {/* Income Card (Masked when locked) */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3 md:p-4 text-center shadow-xs">
          <span className="text-[11px] md:text-xs font-semibold text-emerald-700 dark:text-emerald-300 block mb-1">
            {t('inc')}
          </span>
          <b className="text-base md:text-2xl font-black text-emerald-800 dark:text-emerald-100 block truncate">
            {isLocked ? '••••••' : `${fmt(totals.inc)}`}
          </b>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('iqd')}</span>
        </div>

        {/* Expenses Card */}
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-3 md:p-4 text-center shadow-xs">
          <span className="text-[11px] md:text-xs font-semibold text-rose-700 dark:text-rose-300 block mb-1">
            {t('exp')}
          </span>
          <b className="text-base md:text-2xl font-black text-rose-800 dark:text-rose-100 block truncate">
            {fmt(totals.exp)}
          </b>
          <span className="text-[10px] text-rose-600 dark:text-rose-400">{t('iqd')}</span>
        </div>

        {/* Savings Card */}
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3 md:p-4 text-center shadow-xs">
          <span className="text-[11px] md:text-xs font-semibold text-blue-700 dark:text-blue-300 block mb-1">
            {t('ns')}
          </span>
          <b className="text-base md:text-2xl font-black text-blue-800 dark:text-blue-100 block truncate">
            {fmt(totals.sv)}
          </b>
          <span className="text-[10px] text-blue-600 dark:text-blue-400">{t('iqd')}</span>
        </div>
      </div>

      {/* Month Forecast & Daily Allowance */}
      <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span>{t('proj')}:</span>
          <b className="font-bold text-slate-900 dark:text-white">{fmt(projectedSpending)} {t('iqd')}</b>
        </div>
        {!isLocked && (
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <span>{t('daily')}:</span>
            <b className="font-bold text-teal-600 dark:text-teal-400">
              {fmt(dailyAllowance)} {t('iqd')}
            </b>
          </div>
        )}
      </div>

      {/* Recurring Expenses Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h3 className="text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Repeat className="w-4 h-4 text-teal-600" />
            <span>{t('rec')}</span>
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setModalDefaultRepeat(true);
                setModalDefaultCat(4); // default to internet
                setIsAddModalOpen(true);
              }}
              disabled={Boolean(doc.closed)}
              className="py-1 px-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('add')}</span>
            </button>
            {recurring.length > 0 && (
              <button
                onClick={onApplyRecurring}
                disabled={Boolean(doc.closed) || doc.rec === 1}
                className="py-1 px-3 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 disabled:opacity-40 text-xs font-bold rounded-lg border border-teal-200 dark:border-teal-800 transition"
              >
                {doc.rec === 1 ? t('ok2') : t('recap')}
              </button>
            )}
          </div>
        </div>

        {recurring.length === 0 ? (
          <div className="text-center py-4 text-xs text-slate-400">
            <p className="mb-2">{t('none')}</p>
            <button
              onClick={() => {
                setModalDefaultRepeat(true);
                setModalDefaultCat(1); // default to electricity
                setIsAddModalOpen(true);
              }}
              className="py-1.5 px-3 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold rounded-xl border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('recbill_title').split(' / ')[0]} ({CATEGORIES[1]?.names[langIndex].split(' ')[0]}, {CATEGORIES[4]?.names[langIndex]}...)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {recurring.map((rec, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <CategoryIcon name={CATEGORIES[rec.c]?.icon} className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{CATEGORIES[rec.c]?.names[langIndex]}</span>
                  {rec.n && <span className="text-slate-400 truncate max-w-[120px]">({rec.n})</span>}
                  {rec.dd && <span className="text-teal-600 dark:text-teal-400 font-medium">({t('recbill_day').split(' (')[0]}: {rec.dd})</span>}
                </div>
                <div className="flex items-center gap-3">
                  <b className="font-bold">{fa(rec.a)} {rec.cu === 'U' ? '$' : t('iqd')}</b>
                  <button
                    onClick={() => onDeleteRecurring(i)}
                    className="text-red-500 hover:text-red-700 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Log Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{t('log')}</span>
            <span className="text-xs font-normal text-slate-400">
              ({filteredList.length})
            </span>
          </h3>

          {hasUndo && (
            <button
              onClick={onUndoDelete}
              className="flex items-center gap-1.5 py-1 px-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-800 hover:bg-amber-500/20 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>{t('udo')}</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 np">
          {/* Search Query */}
          <div className="col-span-2 relative">
            <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('srch')}
              className="w-full ps-9 pe-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="w-full py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="">{t('all')} ({t('cat')})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.names[langIndex]}
                </option>
              ))}
            </select>
          </div>

          {/* Person Filter */}
          {activeMemberIndices.length > 1 && (
            <div>
              <select
                value={filterPerson}
                onChange={(e) => setFilterPerson(e.target.value)}
                className="w-full py-1.5 px-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="">{t('all')} ({t('byp')})</option>
                {members.map((m, idx) =>
                  !m.x ? (
                    <option key={idx} value={idx}>
                      {m.n}
                    </option>
                  ) : null
                )}
              </select>
            </div>
          )}
        </div>

        {/* Table of expenses */}
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-start">
                <th className="py-2.5 px-2 font-semibold text-start">{t('due')}</th>
                <th className="py-2.5 px-2 font-semibold text-start">{t('cat')}</th>
                <th className="py-2.5 px-2 font-semibold text-start">{t('amt')}</th>
                <th className="py-2.5 px-2 font-semibold text-start">{t('byp')}</th>
                <th className="py-2.5 px-2 font-semibold text-start">{t('desc')}</th>
                <th className="py-2.5 px-2 font-semibold text-end np"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t('none')}
                  </td>
                </tr>
              ) : (
                filteredList.map(({ tx, idx }) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-750/50 transition-colors"
                  >
                    <td className="py-2.5 px-2 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {tx.d}
                    </td>
                    <td className="py-2.5 px-2 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <CategoryIcon
                          name={CATEGORIES[tx.c]?.icon}
                          className="w-4 h-4 text-teal-600 dark:text-teal-400"
                        />
                        <span>{CATEGORIES[tx.c]?.names[langIndex]}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 font-bold whitespace-nowrap">
                      <span>{fa(tx.a)}</span>
                      <span className="text-xs text-slate-400 ms-1">
                        {tx.cu === 'U' ? '$' : t('iqd')}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <span>{members[tx.w]?.n || '—'}</span>
                        {Boolean(tx.s) && (
                          <span
                            title={t('shr')}
                            className="p-0.5 rounded-sm bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300"
                          >
                            <Users className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 max-w-[180px] truncate">
                      {tx.n || '—'}
                    </td>
                    <td className="py-2.5 px-2 text-end whitespace-nowrap np">
                      <div className="flex items-center justify-end gap-1">
                        {tx.ph && (
                          <button
                            type="button"
                            onClick={() => setPreviewPhoto(tx.ph || null)}
                            className="p-1 rounded-md text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={Boolean(doc.closed)}
                          onClick={() => handleStartEdit(idx)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(doc.closed)}
                          onClick={() => onDeleteExpense(idx)}
                          className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Photo Preview Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-transparent">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 end-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Receipt"
              className="max-h-[85vh] w-auto rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Add Transaction & Recurring Bill Modal */}
      <AddExpenseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        currentMonth={currentMonth}
        doc={doc}
        names={names}
        langIndex={langIndex}
        t={t}
        onAddExpense={onAddExpense}
        defaultRepeat={modalDefaultRepeat}
        defaultCategory={modalDefaultCat}
      />
    </div>
  );
};
