import * as XLSX from 'xlsx';
import {
  MonthDoc,
  NamesConfig,
  SettingsConfig,
  SavingsGoal,
  RecurringExpense,
  DebtItem,
  ShopItem,
  KumalaItem,
  GoldItem,
  EventItem,
  ImportantDateItem,
  WealthData,
  ExpenseTx
} from '../types';
import { CATEGORIES } from '../constants/categories';
import { val, fmt, sum, calcMonthTotals } from './calculations';

const PREFIX = 'b_';

export const getKeyName = (key: string, workspaceId?: string): string => {
  if (workspaceId && key !== 'settings' && key !== 'names') {
    return `a${workspaceId}_${key}`;
  }
  return key;
};

export const getItem = async <T>(key: string, workspaceId?: string): Promise<T | null> => {
  try {
    const raw = localStorage.getItem(PREFIX + getKeyName(key, workspaceId));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Error reading key ${key}:`, err);
    return null;
  }
};

export const setItem = async <T>(key: string, value: T, workspaceId?: string): Promise<void> => {
  try {
    localStorage.setItem(PREFIX + getKeyName(key, workspaceId), JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
};

export const createEmptyMonth = (): MonthDoc => ({
  inc: [],
  oi: 0,
  bud: Array(CATEGORIES.length).fill(0),
  tx: [],
  sv: []
});

export const loadMonthDoc = async (monthStr: string, workspaceId?: string): Promise<MonthDoc> => {
  const loaded = await getItem<MonthDoc>('m' + monthStr, workspaceId);
  const empty = createEmptyMonth();
  if (!loaded) return empty;
  return {
    inc: loaded.inc || [],
    oi: loaded.oi || 0,
    bud: loaded.bud && loaded.bud.length ? loaded.bud : empty.bud,
    tx: loaded.tx || [],
    sv: loaded.sv || [],
    closed: loaded.closed || 0,
    rec: loaded.rec || 0
  };
};

export const saveMonthDoc = async (monthStr: string, doc: MonthDoc, workspaceId?: string): Promise<void> => {
  await setItem('m' + monthStr, doc, workspaceId);
};

// PIN Hash with salt
export const sha256Hash = async (value: string): Promise<string> => {
  const enc = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', enc.encode('xp:' + value));
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Browser download helper
export const downloadFile = (filename: string, content: Blob | string, mimeType = 'application/json') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// Export Full JSON Backup
export const exportBackupJSON = async (currentYear: string, workspaceId?: string, allData?: any) => {
  const months: MonthDoc[] = [];
  for (let m = 1; m <= 12; m++) {
    const mStr = `${currentYear}-${String(m).padStart(2, '0')}`;
    months.push(await loadMonthDoc(mStr, workspaceId));
  }

  const backupObject = {
    y: currentYear,
    m: months,
    g: allData?.goals || (await getItem<{ list: SavingsGoal[] }>('goals', workspaceId)) || { list: [] },
    r: allData?.recurring || (await getItem<{ list: RecurringExpense[] }>('rec', workspaceId)) || { list: [] },
    n: allData?.names || (await getItem<NamesConfig>('names', workspaceId)) || { mem: [], fx: 1500, gp: 0 },
    w: allData?.wealth || (await getItem<WealthData>('wealth', workspaceId)) || { as: [], fu: [] },
    pl: allData?.debts || (await getItem<{ l: DebtItem[] }>('ppl', workspaceId)) || { l: [] },
    sh: allData?.shopping || (await getItem<{ l: ShopItem[] }>('shop', workspaceId)) || { l: [] },
    km: allData?.kumala || (await getItem<{ l: KumalaItem[] }>('kom', workspaceId)) || { l: [] },
    gl: allData?.gold || (await getItem<{ l: GoldItem[] }>('gold', workspaceId)) || { l: [] },
    ev: allData?.events || (await getItem<{ l: EventItem[] }>('evt', workspaceId)) || { l: [] },
    dt: allData?.dates || (await getItem<{ l: ImportantDateItem[] }>('dts', workspaceId)) || { l: [] },
    timestamp: new Date().toISOString()
  };

  downloadFile(`expenses-backup-${currentYear}.json`, JSON.stringify(backupObject, null, 2));
};

// Export CSV for Year
export const exportYearCSV = async (currentYear: string, workspaceId?: string, langIndex = 0) => {
  const q = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  let csv = '\ufeffDate,Category,Amount,Currency,IQD Equivalent,Note\n';

  for (let m = 1; m <= 12; m++) {
    const mStr = `${currentYear}-${String(m).padStart(2, '0')}`;
    const doc = await loadMonthDoc(mStr, workspaceId);
    (doc.tx || []).forEach(tx => {
      const catName = CATEGORIES[tx.c]?.names[langIndex] || 'Other';
      const iqdVal = Math.round(val(tx));
      csv += `${tx.d},${q(catName)},${tx.a},${tx.cu === 'U' ? 'USD' : 'IQD'},${iqdVal},${q(tx.n || '')}\n`;
    });
  }

  downloadFile(`expenses-${currentYear}.csv`, csv, 'text/csv;charset=utf-8;');
};

// Export Excel XLSX via SheetJS
export const exportExcelWorkbook = async (params: {
  currentMonth: string;
  isYearly: boolean;
  isIncomeLocked: boolean;
  workspaceId?: string;
  langIndex: number;
  monthNames: string[];
  members: { n: string }[];
  defaultRate: number;
}) => {
  const {
    currentMonth,
    isYearly,
    isIncomeLocked,
    workspaceId,
    langIndex,
    monthNames,
    members,
    defaultRate
  } = params;

  const yearStr = currentMonth.slice(0, 4);
  const docs: { label: string; doc: MonthDoc }[] = [];

  if (isYearly) {
    for (let m = 1; m <= 12; m++) {
      const mStr = `${yearStr}-${String(m).padStart(2, '0')}`;
      docs.push({
        label: monthNames[m - 1] || mStr,
        doc: await loadMonthDoc(mStr, workspaceId)
      });
    }
  } else {
    docs.push({
      label: currentMonth,
      doc: await loadMonthDoc(currentMonth, workspaceId)
    });
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: Monthly Overview
  const sheet1Data: (string | number)[][] = [
    [
      'Period',
      ...(isIncomeLocked ? [] : ['Income (IQD)']),
      'Expenses (IQD)',
      'Savings (IQD)',
      ...(isIncomeLocked ? [] : ['Remaining (IQD)', 'Savings Rate (%)'])
    ]
  ];

  docs.forEach(({ label, doc }) => {
    const totals = calcMonthTotals(doc, defaultRate);
    sheet1Data.push([
      label,
      ...(isIncomeLocked ? [] : [Math.round(totals.inc)]),
      Math.round(totals.exp),
      Math.round(totals.sv),
      ...(isIncomeLocked ? [] : [Math.round(totals.rem), Math.round(totals.savingsRate * 100)])
    ]);
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Data), 'Overview');

  // Sheet 2: Expenses Log
  const sheet2Data: (string | number)[][] = [
    ['Date', 'Category', 'Amount', 'Currency', 'Amount (IQD)', 'Person', 'Shared', 'Notes']
  ];
  docs.forEach(({ doc }) => {
    (doc.tx || []).forEach(tx => {
      const catName = CATEGORIES[tx.c]?.names[langIndex] || 'Other';
      const personName = members[tx.w]?.n || '—';
      sheet2Data.push([
        tx.d,
        catName,
        tx.a,
        tx.cu === 'U' ? 'USD' : 'IQD',
        Math.round(val(tx, defaultRate)),
        personName,
        tx.s ? 'Yes' : 'No',
        tx.n || ''
      ]);
    });
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2Data), 'Expenses Log');

  // Sheet 3: Categories Summary
  const catTotals = Array(CATEGORIES.length).fill(0);
  docs.forEach(({ doc }) => {
    (doc.tx || []).forEach(tx => {
      if (tx.c >= 0 && tx.c < CATEGORIES.length) {
        catTotals[tx.c] += val(tx, defaultRate);
      }
    });
  });
  const totalAllExp = sum(catTotals) || 1;
  const sheet3Data: (string | number)[][] = [['Category', 'Total Spent (IQD)', 'Share (%)']];
  CATEGORIES.forEach((cat, idx) => {
    if (catTotals[idx] > 0) {
      sheet3Data.push([
        cat.names[langIndex],
        Math.round(catTotals[idx]),
        +((catTotals[idx] / totalAllExp) * 100).toFixed(1)
      ]);
    }
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3Data), 'Categories');

  // Write and download
  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const filename = `expenses-${isYearly ? yearStr : currentMonth}.xlsx`;
  downloadFile(filename, new Blob([wbOut], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
};
