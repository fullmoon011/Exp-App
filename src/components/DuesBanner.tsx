import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  ArrowUpRight,
  ArrowDownLeft,
  CalendarClock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2
} from 'lucide-react';
import { DebtItem, RecurringExpense, KumalaItem, ImportantDateItem } from '../types';
import { CATEGORIES } from '../constants/categories';
import { getDaysDifference, fa, fmt } from '../utils/calculations';

interface DuesBannerProps {
  debts: DebtItem[];
  recurring: RecurringExpense[];
  kumala: KumalaItem[];
  dates: ImportantDateItem[];
  langIndex: number;
  t: (key: string) => string;
}

export const DuesBanner: React.FC<DuesBannerProps> = ({
  debts,
  recurring,
  kumala,
  dates,
  langIndex,
  t
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'overdue' | 'dueSoon'>('all');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === 'granted') {
          new Notification('داهاتوو • Dahatu', {
            body: 'زەنگی ئاگادارکردنەوەی وادەی قەرز و پسوولەکان بە سەرکەوتوویی چالاک کرا!',
            icon: '/pwa-192x192.png'
          });
          setTestSent(true);
          setTimeout(() => setTestSent(false), 3000);
        }
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  };

  const items: {
    days: number;
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    isOverdue: boolean;
    type: 'debt' | 'recurring' | 'kumala' | 'date';
  }[] = [];

  const defaultRemindDays = 7;

  // 1. Debts
  debts.forEach((debt) => {
    if (debt.due && debt.a > debt.p) {
      const diff = getDaysDifference(debt.due);
      const reminderThreshold = debt.rd || defaultRemindDays;
      if (diff <= reminderThreshold) {
        items.push({
          days: diff,
          title: `${debt.n}: ${fmt(debt.a - debt.p)} ${debt.cu === 'U' ? '$' : t('iqd')}`,
          subtitle: debt.k === 'l' ? t('dbt_owed_to_me') : t('dbt_i_owe'),
          icon: debt.k === 'l' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : (
            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
          ),
          isOverdue: diff < 0,
          type: 'debt'
        });
      }
    }
  });

  // 2. Recurring expenses with due day
  recurring.forEach((rec) => {
    if (rec.dd) {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth();
      let due = new Date(year, month, rec.dd);
      if (due < today) {
        due = new Date(year, month + 1, rec.dd);
      }
      const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= defaultRemindDays) {
        const catName = CATEGORIES[rec.c]?.names[langIndex] || 'Expense';
        items.push({
          days: diff,
          title: `${catName}: ${fmt(rec.a)} ${rec.cu === 'U' ? '$' : t('iqd')}`,
          subtitle: t('rec'),
          icon: <Bell className="w-4 h-4 text-teal-500" />,
          isOverdue: false,
          type: 'recurring'
        });
      }
    }
  });

  // 3. Kumala turns
  const todayStr = new Date().toISOString().slice(0, 7);
  kumala.forEach((k) => {
    const [startYear, startMonth] = k.s.split('-').map(Number);
    const [curYear, curMonth] = todayStr.split('-').map(Number);
    const monthDiff = (curYear - startYear) * 12 + (curMonth - startMonth);

    if (monthDiff >= 0 && monthDiff < k.m) {
      if (monthDiff === k.t - 1 && !k.rc) {
        items.push({
          days: 0,
          title: `${k.n}: ${t('kru')} (${fmt(k.a * k.m)} IQD)`,
          subtitle: t('kom'),
          icon: <RefreshCw className="w-4 h-4 text-amber-500" />,
          isOverdue: false,
          type: 'kumala'
        });
      }
    }
  });

  // 4. Important dates
  dates.forEach((d) => {
    const diff = getDaysDifference(d.d);
    const rd = d.rd || 14;
    if (diff <= rd && diff >= -15) {
      items.push({
        days: diff,
        title: d.n,
        subtitle: t('dts'),
        icon: <CalendarClock className="w-4 h-4 text-indigo-500" />,
        isOverdue: diff < 0,
        type: 'date'
      });
    }
  });

  if (!items.length) return null;

  items.sort((a, b) => a.days - b.days);

  const overdueCount = items.filter((i) => i.isOverdue).length;
  const dueTodayCount = items.filter((i) => i.days === 0 && !i.isOverdue).length;

  const filteredItems = items.filter((item) => {
    if (filterMode === 'overdue') return item.isOverdue;
    if (filterMode === 'dueSoon') return !item.isOverdue;
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 mb-4 shadow-xs np space-y-2.5 transition-all">
      {/* Banner Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              overdueCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-teal-500/10 text-teal-600'
            }`}>
              <BellRing className={`w-4 h-4 ${overdueCount > 0 ? 'animate-bounce text-rose-500' : 'text-teal-600'}`} />
            </div>
            {overdueCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            )}
          </div>
          <div>
            <b className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>{t('due_center_title')}</span>
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {items.length}
              </span>
            </b>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
              {overdueCount > 0 && (
                <span className="text-rose-600 font-bold">
                  {overdueCount} {t('due_overdue')}
                </span>
              )}
              {dueTodayCount > 0 && (
                <span className="text-amber-600 font-bold">
                  {dueTodayCount} {t('due_today')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side controls: Notification permission & Collapse */}
        <div className="flex items-center gap-1.5 text-xs">
          {notifPermission !== 'granted' && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="py-1 px-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 text-[11px] font-bold flex items-center gap-1 transition"
            >
              <Volume2 className="w-3 h-3" />
              <span>{t('due_enable_notif')}</span>
            </button>
          )}

          {notifPermission === 'granted' && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/60">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t('due_notif_enabled')}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Items List */}
      {isExpanded && (
        <div className="space-y-1.5 pt-1">
          {/* Quick Filter chips if multiple items */}
          {items.length > 2 && (
            <div className="flex items-center gap-1 text-[10px] pb-0.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  filterMode === 'all'
                    ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t('all')} ({items.length})
              </button>
              {overdueCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('overdue')}
                  className={`px-2 py-0.5 rounded-md font-semibold transition ${
                    filterMode === 'overdue'
                      ? 'bg-rose-600 text-white'
                      : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  {t('due_overdue')} ({overdueCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setFilterMode('dueSoon')}
                className={`px-2 py-0.5 rounded-md font-semibold transition ${
                  filterMode === 'dueSoon'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {t('due_in_days')} ({items.length - overdueCount})
              </button>
            </div>
          )}

          {filteredItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl border transition-all ${
                item.isOverdue
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                  : item.days === 0
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                  : 'bg-slate-50/80 dark:bg-slate-900 border-slate-150 dark:border-slate-750'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="shrink-0">{item.icon}</div>
                <div className="truncate">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`shrink-0 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  item.isOverdue
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                    : item.days === 0
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {item.isOverdue
                  ? `${t('due_overdue')}: ${Math.abs(item.days)} ${t('days')}`
                  : item.days === 0
                  ? t('due_today')
                  : `${item.days} ${t('due_in_days')}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
