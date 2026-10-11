import React, { useState } from 'react';
import {
  RefreshCw,
  PartyPopper,
  CalendarClock,
  Plus,
  X,
  Check,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { KumalaItem, EventItem, ImportantDateItem, SinkingFundItem } from '../types';
import { fmt, fa, shiftMonth, getDaysDifference } from '../utils/calculations';
import { CurrencyConverter } from './CurrencyConverter';

interface MoreTabProps {
  currentMonth: string;
  fxRate: number;
  kumala: KumalaItem[];
  events: EventItem[];
  dates: ImportantDateItem[];
  sinkingFunds: SinkingFundItem[];
  onAddKumala: (item: KumalaItem) => void;
  onPayKumalaMonth: (kumalaIndex: number, monthStepIndex: number) => void;
  onReceiveKumalaPot: (kumalaIndex: number) => void;
  onDeleteKumala: (index: number) => void;
  onAddEvent: (event: EventItem) => void;
  onAddEventItem: (eventIndex: number, name: string, price: number) => void;
  onToggleEventItem: (eventIndex: number, itemIndex: number) => void;
  onDeleteEventItem: (eventIndex: number, itemIndex: number) => void;
  onDepositEvent: (eventIndex: number, amount: number) => void;
  onDeleteEvent: (index: number) => void;
  onAddDate: (item: ImportantDateItem) => void;
  onDeleteDate: (index: number) => void;
  onAddSinkingFund: (name: string, yearlyAmount: number) => void;
  onDeleteSinkingFund: (index: number) => void;
  t: (key: string) => string;
}

export const MoreTab: React.FC<MoreTabProps> = ({
  currentMonth,
  fxRate,
  kumala,
  events,
  dates,
  sinkingFunds,
  onAddKumala,
  onPayKumalaMonth,
  onReceiveKumalaPot,
  onDeleteKumala,
  onAddEvent,
  onAddEventItem,
  onToggleEventItem,
  onDeleteEventItem,
  onDepositEvent,
  onDeleteEvent,
  onAddDate,
  onDeleteDate,
  onAddSinkingFund,
  onDeleteSinkingFund,
  t
}) => {
  // Kumala Form
  const [kName, setKName] = useState('');
  const [kAmount, setKAmount] = useState('');
  const [kMembers, setKMembers] = useState('');
  const [kStart, setKStart] = useState(currentMonth);
  const [kTurn, setKTurn] = useState('');
  const [kDay, setKDay] = useState('1');

  // Event Form
  const [eName, setEName] = useState('');
  const [eDate, setEDate] = useState('');
  const [eBudget, setEBudget] = useState('');
  const [newItemName, setNewItemName] = useState<Record<number, string>>({});
  const [newItemPrice, setNewItemPrice] = useState<Record<number, string>>({});
  const [eventDepositVal, setEventDepositVal] = useState<Record<number, string>>({});

  // Sinking Fund Form
  const [sfName, setSfName] = useState('');
  const [sfAmount, setSfAmount] = useState('');

  // Important Dates Form
  const [dateTitle, setDateTitle] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [dateReminder, setDateReminder] = useState('14');
  const [dateRepeatYearly, setDateRepeatYearly] = useState(false);

  // Kumala Submit
  const handleKumalaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kName.trim() || !kAmount || !kMembers || +kMembers < 2) return;
    const membersCount = +kMembers;
    onAddKumala({
      n: kName.trim(),
      a: +kAmount,
      m: membersCount,
      s: kStart,
      t: Math.min(membersCount, Math.max(1, +kTurn || 1)),
      dd: Math.min(28, Math.max(1, +kDay || 1)),
      pd: Array(membersCount).fill(0),
      rc: 0
    });
    setKName('');
    setKAmount('');
    setKMembers('');
    setKTurn('');
  };

  // Event Submit
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eName.trim() || !eBudget) return;
    onAddEvent({
      n: eName.trim(),
      d: eDate || undefined,
      b: +eBudget,
      sv: 0,
      it: []
    });
    setEName('');
    setEDate('');
    setEBudget('');
  };

  // Add Item to Event
  const handleAddEventItemSubmit = (idx: number) => {
    const itemName = newItemName[idx]?.trim();
    if (!itemName) return;
    const itemPr = +newItemPrice[idx] || 0;
    onAddEventItem(idx, itemName, itemPr);
    setNewItemName({ ...newItemName, [idx]: '' });
    setNewItemPrice({ ...newItemPrice, [idx]: '' });
  };

  // Sinking Fund Submit
  const handleSinkingFundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sfName.trim() || !sfAmount || +sfAmount <= 0) return;
    onAddSinkingFund(sfName.trim(), +sfAmount);
    setSfName('');
    setSfAmount('');
  };

  // Important Date Submit
  const handleDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateTitle.trim() || !dateVal) return;
    onAddDate({
      n: dateTitle.trim(),
      d: dateVal,
      rd: +dateReminder || 14,
      y: dateRepeatYearly ? 1 : 0
    });
    setDateTitle('');
    setDateVal('');
  };

  const totalSinkingPerMonth = sinkingFunds.reduce((acc, sf) => acc + (sf.a / 12), 0);

  return (
    <div className="space-y-4 pb-12">
      {/* 0. Mini Currency Converter Tool */}
      <CurrencyConverter fxRate={fxRate} t={t} />

      {/* 1. Kumala Rotating Savings Circle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-teal-600" />
          <span>{t('kom')}</span>
        </h3>

        {/* Existing Circles */}
        {kumala.length > 0 && (
          <div className="space-y-4 mb-4">
            {kumala.map((k, idx) => {
              const potTotal = k.a * k.m;
              const paidCount = k.pd.filter(Boolean).length;
              const pct = Math.round((paidCount / k.m) * 100);

              // Calculate active turn index
              const [sY, sM] = k.s.split('-').map(Number);
              const [cY, cM] = currentMonth.split('-').map(Number);
              const currentStepIndex = (cY - sY) * 12 + (cM - sM);
              const isMyPayoutMonth = currentStepIndex === k.t - 1;

              return (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-750">
                  <div className="flex items-center justify-between mb-2">
                    <b className="font-bold text-sm text-slate-800 dark:text-slate-100">{k.n}</b>
                    <button onClick={() => onDeleteKumala(idx)} className="text-slate-400 hover:text-red-500 p-0.5">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 mb-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{t('kam')}: <b>{fmt(k.a)} IQD</b></span>
                    <span>{t('kpot')}: <b>{fmt(potTotal)} IQD</b></span>
                    <span>{t('ktn')}: <b>{k.t}</b> ({shiftMonth(k.s, k.t - 1)})</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>

                  {/* Month payout buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {k.pd.map((paid, mIdx) => {
                      const mMonthLabel = shiftMonth(k.s, mIdx);
                      return (
                        <button
                          key={mIdx}
                          disabled={Boolean(paid)}
                          onClick={() => onPayKumalaMonth(idx, mIdx)}
                          className={`w-9 h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                            paid
                              ? 'bg-teal-600 text-white cursor-default'
                              : mIdx === currentStepIndex
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-2 border-amber-500 hover:bg-amber-200'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                          title={`${mMonthLabel}: ${paid ? 'Paid' : 'Unpaid'}`}
                        >
                          {mIdx + 1}{mIdx === k.t - 1 ? '★' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* Claim Payout Button */}
                  {isMyPayoutMonth && !k.rc && (
                    <button
                      onClick={() => onReceiveKumalaPot(idx)}
                      className="w-full mt-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>{t('krc')} ({fmt(potTotal)} IQD)</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Kumala Form */}
        <form onSubmit={handleKumalaSubmit} className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <input
            type="text"
            required
            value={kName}
            onChange={(e) => setKName(e.target.value)}
            placeholder={t('nme')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="number"
            min="1000"
            required
            value={kAmount}
            onChange={(e) => setKAmount(e.target.value)}
            placeholder={t('kam')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="number"
            min="2"
            max="30"
            required
            value={kMembers}
            onChange={(e) => setKMembers(e.target.value)}
            placeholder={t('kmb')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="month"
            required
            value={kStart}
            onChange={(e) => setKStart(e.target.value)}
            title={t('kst')}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="number"
            min="1"
            value={kTurn}
            onChange={(e) => setKTurn(e.target.value)}
            placeholder={t('ktn')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="col-span-2 sm:col-span-1 py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add')}</span>
          </button>
        </form>
      </div>

      {/* 2. Events & Occasions Planner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-amber-500" />
          <span>{t('evt')}</span>
        </h3>

        {/* Event presets buttons */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setEName(t('eve'))}
            className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs rounded-lg"
          >
            {t('eve')}
          </button>
          <button
            type="button"
            onClick={() => setEName(t('evz'))}
            className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs rounded-lg"
          >
            {t('evz')}
          </button>
          <button
            type="button"
            onClick={() => setEName(t('evw'))}
            className="py-1 px-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs rounded-lg"
          >
            {t('evw')}
          </button>
        </div>

        {/* Existing Events */}
        {events.length > 0 && (
          <div className="space-y-4 mb-4">
            {events.map((ev, idx) => {
              const checklistSum = ev.it.reduce((a, b) => a + (b.pr || 0), 0);
              const daysLeft = ev.d ? getDaysDifference(ev.d) : null;
              const monthsLeft = ev.d ? Math.max(1, Math.ceil((daysLeft || 1) / 30)) : 1;
              const neededMonthly = ev.b > ev.sv ? (ev.b - ev.sv) / monthsLeft : 0;
              const pctSaved = ev.b > 0 ? Math.min(100, Math.round((ev.sv / ev.b) * 100)) : 0;

              return (
                <div key={idx} className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-750">
                  <div className="flex items-center justify-between mb-1.5">
                    <b className="font-bold text-sm text-slate-800 dark:text-slate-100">{ev.n}</b>
                    <button onClick={() => onDeleteEvent(idx)} className="text-slate-400 hover:text-red-500 p-0.5">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-500 mb-2 flex flex-wrap gap-x-4 gap-y-1">
                    <span>{t('evb')}: <b>{fmt(ev.b)} IQD</b></span>
                    <span>{t('made')}: <b>{fmt(ev.sv)} IQD</b> ({pctSaved}%)</span>
                    {ev.d && <span>{ev.d} ({daysLeft} {t('days')})</span>}
                    {neededMonthly > 0 && <span className="text-teal-600 dark:text-teal-400 font-bold">{t('need')}: {fmt(neededMonthly)} IQD</span>}
                  </div>

                  {/* Savings progress */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pctSaved}%` }} />
                  </div>

                  {/* Checklist items */}
                  {ev.it.length > 0 && (
                    <div className="space-y-1 mb-3">
                      {ev.it.map((item, itemIdx) => (
                        <div key={itemIdx} className={`flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-800 ${item.ck ? 'opacity-50 line-through' : ''}`}>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(item.ck)}
                              onChange={() => onToggleEventItem(idx, itemIdx)}
                              className="rounded-sm text-teal-600 focus:ring-teal-500"
                            />
                            <span>{item.n}</span>
                          </label>
                          <div className="flex items-center gap-2">
                            {item.pr > 0 && <span>{fmt(item.pr)} IQD</span>}
                            <button onClick={() => onDeleteEventItem(idx, itemIdx)} className="text-slate-400 hover:text-red-500">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add checklist item */}
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      placeholder={t('evi')}
                      value={newItemName[idx] || ''}
                      onChange={(e) => setNewItemName({ ...newItemName, [idx]: e.target.value })}
                      className="flex-1 py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <input
                      type="number"
                      placeholder={t('shpe')}
                      value={newItemPrice[idx] || ''}
                      onChange={(e) => setNewItemPrice({ ...newItemPrice, [idx]: e.target.value })}
                      className="w-24 py-1 px-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleAddEventItemSubmit(idx)}
                      className="py-1 px-2.5 bg-teal-600 text-white rounded-lg text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Deposit towards event budget */}
                  <div className="flex gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-750">
                    <input
                      type="number"
                      placeholder={t('amt')}
                      value={eventDepositVal[idx] || ''}
                      onChange={(e) => setEventDepositVal({ ...eventDepositVal, [idx]: e.target.value })}
                      className="flex-1 py-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => {
                        const amt = +eventDepositVal[idx] || 0;
                        if (amt > 0) {
                          onDepositEvent(idx, amt);
                          setEventDepositVal({ ...eventDepositVal, [idx]: '' });
                        }
                      }}
                      className="py-1 px-3 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                    >
                      {t('dep')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Event Form */}
        <form onSubmit={handleEventSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            required
            value={eName}
            onChange={(e) => setEName(e.target.value)}
            placeholder={t('evn')}
            className="sm:col-span-2 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="date"
            value={eDate}
            onChange={(e) => setEDate(e.target.value)}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <div className="flex gap-1.5">
            <input
              type="number"
              min="1000"
              required
              value={eBudget}
              onChange={(e) => setEBudget(e.target.value)}
              placeholder={t('evb')}
              className="flex-1 py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
            />
            <button
              type="submit"
              className="py-1.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* 3. Yearly Expenses Sinking Fund (Split over 12 months) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-indigo-500" />
          <span>{t('sink')}</span>
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          {t('tot')}: <b>{fmt(totalSinkingPerMonth)} IQD / {t('nm')}</b>
        </p>

        {sinkingFunds.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-3">
            {sinkingFunds.map((sf, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between">
                <div>
                  <b className="font-semibold">{sf.n}</b>
                  <span className="text-slate-400 ms-2">({fmt(sf.a)} IQD / {t('y')})</span>
                </div>
                <div className="flex items-center gap-3">
                  <b className="font-bold text-teal-600 dark:text-teal-400">{fmt(sf.a / 12)} IQD / {t('nm')}</b>
                  <button onClick={() => onDeleteSinkingFund(idx)} className="text-slate-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSinkingFundSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            required
            value={sfName}
            onChange={(e) => setSfName(e.target.value)}
            placeholder={t('nme')}
            className="py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="number"
            min="1000"
            required
            value={sfAmount}
            onChange={(e) => setSfAmount(e.target.value)}
            placeholder={`${t('tot')} (${t('y')})`}
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

      {/* 4. Important Dates & Renewals */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 shadow-xs border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-teal-600" />
          <span>{t('dts')}</span>
        </h3>

        {dates.length > 0 && (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs mb-3">
            {dates.map((d, idx) => {
              const diff = getDaysDifference(d.d);
              return (
                <div key={idx} className="py-2 flex items-center justify-between">
                  <div>
                    <b className="font-semibold">{d.n}</b>
                    <span className="text-slate-400 ms-2">({d.d})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold ${diff < 0 ? 'text-red-500' : diff <= 7 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                      {diff < 0 ? `${t('ovd')} ${Math.abs(diff)} ${t('days')}` : `${diff} ${t('days')}`}
                    </span>
                    <button onClick={() => onDeleteDate(idx)} className="text-slate-400 hover:text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <form onSubmit={handleDateSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="text"
            required
            value={dateTitle}
            onChange={(e) => setDateTitle(e.target.value)}
            placeholder={t('dtn')}
            className="sm:col-span-2 py-1.5 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
          />
          <input
            type="date"
            required
            value={dateVal}
            onChange={(e) => setDateVal(e.target.value)}
            className="py-1.5 px-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
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
    </div>
  );
};
