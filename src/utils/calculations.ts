import { ExpenseTx, MonthDoc, DebtItem, KumalaItem, GoldItem, AssetItem } from '../types';
import { CATEGORIES, NEED_CATEGORY_IDS } from '../constants/categories';

export const sum = (arr: number[]): number => arr.reduce((acc, curr) => acc + (+curr || 0), 0);

export const fmt = (n: number | string): string => {
  const num = Math.round(+n || 0);
  return num.toLocaleString('en-US');
};

export const fa = (n: number | string): string => {
  const num = +n || 0;
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

// Convert expense amount to IQD using its stored exchange rate
export const val = (tx: ExpenseTx, defaultRate = 1500): number => {
  const amount = +tx.a || 0;
  const rate = tx.r || defaultRate;
  return tx.cu === 'U' ? amount * rate : amount;
};

// Calculate monthly spending by category, total income, expenses, savings, and remaining
export interface MonthTotals {
  sp: number[]; // spending per category index (32)
  inc: number; // total income
  exp: number; // total expenses
  sv: number; // total savings deposits
  rem: number; // remaining
  savingsRate: number; // 0 to 1
}

export const calcMonthTotals = (doc: MonthDoc, defaultRate = 1500): MonthTotals => {
  const sp = Array(CATEGORIES.length).fill(0);
  (doc.tx || []).forEach(tx => {
    if (tx.c >= 0 && tx.c < CATEGORIES.length) {
      sp[tx.c] += val(tx, defaultRate);
    }
  });

  const salaryIncome = sum(doc.inc || []);
  const otherIncome = +doc.oi || 0;
  const inc = salaryIncome + otherIncome;
  const exp = sum(sp);
  const sv = sum((doc.sv || []).map(s => +s.a || 0));
  const rem = inc - exp - sv;
  const savingsRate = inc > 0 ? sv / inc : 0;

  return { sp, inc, exp, sv, rem, savingsRate };
};

// 50/30/20 breakdown
export interface RuleBreakdown {
  needs: number;
  wants: number;
  savings: number;
  needsPct: number;
  wantsPct: number;
  savingsPct: number;
}

export const calc503020 = (totals: MonthTotals): RuleBreakdown => {
  const needs = sum(NEED_CATEGORY_IDS.map(id => totals.sp[id] || 0));
  const wants = Math.max(0, totals.exp - needs);
  const savings = totals.sv;
  const base = totals.inc || (totals.exp + totals.sv) || 1;

  return {
    needs,
    wants,
    savings,
    needsPct: Math.round((needs / base) * 100),
    wantsPct: Math.round((wants / base) * 100),
    savingsPct: Math.round((savings / base) * 100)
  };
};

// Financial health score (0 to 100)
export interface HealthScoreResult {
  score: number;
  savingsPart: number; // max 30
  debtPart: number; // max 25
  emergencyPart: number; // max 25
  budgetPart: number; // max 20
  emergencyMonths: number;
  debtToIncome: number;
  budgetAdherencePct: number;
}

export const calcHealthScore = (params: {
  savingsRate: number; // 0 to 1
  monthlyDebtPayment: number;
  monthlyIncome: number;
  liquidAssets: number;
  averageMonthlyExpense: number;
  budgetedCategoriesCount: number;
  adheredCategoriesCount: number;
}): HealthScoreResult => {
  const {
    savingsRate,
    monthlyDebtPayment,
    monthlyIncome,
    liquidAssets,
    averageMonthlyExpense,
    budgetedCategoriesCount,
    adheredCategoriesCount
  } = params;

  // 1. Savings part (max 30, full score at savings rate >= 20%)
  const savingsPart = Math.round(Math.min(Math.max(savingsRate / 0.2, 0), 1) * 30);

  // 2. Debt-to-income part (max 25, full at <= 10%, 0 at >= 35%)
  const debtToIncome = monthlyIncome > 0 ? monthlyDebtPayment / monthlyIncome : 0;
  let debtPart = 25;
  if (debtToIncome > 0.10) {
    const penalty = Math.min((debtToIncome - 0.10) / 0.25, 1);
    debtPart = Math.round((1 - penalty) * 25);
  }

  // 3. Emergency fund part (max 25 at >= 6 months average expense)
  const expenseBase = averageMonthlyExpense > 0 ? averageMonthlyExpense : 1;
  const emergencyMonths = liquidAssets / expenseBase;
  const emergencyPart = Math.round(Math.min(emergencyMonths / 6, 1) * 25);

  // 4. Budget adherence part (max 20)
  let budgetPart = 15;
  let budgetAdherencePct = 100;
  if (budgetedCategoriesCount > 0) {
    budgetAdherencePct = Math.round((adheredCategoriesCount / budgetedCategoriesCount) * 100);
    budgetPart = Math.round((adheredCategoriesCount / budgetedCategoriesCount) * 20);
  }

  const score = Math.min(100, Math.max(0, savingsPart + debtPart + emergencyPart + budgetPart));

  return {
    score,
    savingsPart,
    debtPart,
    emergencyPart,
    budgetPart,
    emergencyMonths,
    debtToIncome,
    budgetAdherencePct
  };
};

// Zakat Estimate Calculation
export interface ZakatEstimate {
  nisab: number;
  isEligible: number;
  zakatAmount: number;
}

export const calcZakat = (liquidWealth: number, gold21PricePerGram: number): ZakatEstimate => {
  const nisab = 85 * (gold21PricePerGram || 0);
  const isEligible = nisab > 0 && liquidWealth >= nisab ? 1 : 0;
  const zakatAmount = isEligible ? liquidWealth * 0.025 : 0;

  return {
    nisab,
    isEligible,
    zakatAmount
  };
};

// Settle Up calculation between family members for shared expenses
export interface SettleUpMemberBalance {
  memberIndex: number;
  paid: number;
  share: number;
  net: number; // positive = should receive, negative = owes
}

export interface SettleUpTransfer {
  fromIndex: number;
  toIndex: number;
  amount: number;
}

export const calcSettleUp = (txs: ExpenseTx[], activeMemberIndices: number[], defaultRate = 1500): {
  balances: SettleUpMemberBalance[];
  transfers: SettleUpTransfer[];
  totalShared: number;
  sharePerMember: number;
} => {
  const sharedTxs = txs.filter(x => x.s === 1);
  const totalShared = sum(sharedTxs.map(x => val(x, defaultRate)));
  const count = activeMemberIndices.length || 1;
  const sharePerMember = totalShared / count;

  const paidMap: Record<number, number> = {};
  activeMemberIndices.forEach(idx => { paidMap[idx] = 0; });
  sharedTxs.forEach(x => {
    if (paidMap[x.w] !== undefined) {
      paidMap[x.w] += val(x, defaultRate);
    }
  });

  const balances: SettleUpMemberBalance[] = activeMemberIndices.map(idx => {
    const paid = paidMap[idx] || 0;
    return {
      memberIndex: idx,
      paid,
      share: sharePerMember,
      net: paid - sharePerMember
    };
  });

  // Calculate simple settle-up transfers
  const debtors = balances.filter(b => b.net < -0.01).map(b => ({ ...b, amountOwed: -b.net }));
  const creditors = balances.filter(b => b.net > 0.01).map(b => ({ ...b, amountOwed: b.net }));
  const transfers: SettleUpTransfer[] = [];

  let d = 0;
  let c = 0;
  while (d < debtors.length && c < creditors.length) {
    const deb = debtors[d];
    const cred = creditors[c];
    const amount = Math.min(deb.amountOwed, cred.amountOwed);

    if (amount > 0) {
      transfers.push({
        fromIndex: deb.memberIndex,
        toIndex: cred.memberIndex,
        amount
      });
      deb.amountOwed -= amount;
      cred.amountOwed -= amount;
    }

    if (deb.amountOwed < 0.01) d++;
    if (cred.amountOwed < 0.01) c++;
  }

  return { balances, transfers, totalShared, sharePerMember };
};

// Gold Ledger valuation
export const calcGoldCurrentValue = (item: GoldItem, current21kPrice: number): number => {
  const grams = +item.g || 0;
  const karat = +item.k || 21;
  const adjustedPrice = (current21kPrice * karat) / 21;
  return grams * adjustedPrice;
};

// Helper: Calculate number of days from today until date string YYYY-MM-DD
export const getDaysDifference = (targetDateStr: string): number => {
  if (!targetDateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper: Shift month string YYYY-MM by offset months
export const shiftMonth = (monthStr: string, offset: number): string => {
  const [yearStr, mStr] = monthStr.split('-');
  const date = new Date(+yearStr, +mStr - 1 + offset, 15);
  return date.toISOString().slice(0, 7);
};

// Debt Payoff Progress & Habit Calculation
export interface DebtPayoffProgress {
  totalBorrowedOriginalIQD: number;
  totalBorrowedPaidIQD: number;
  totalBorrowedRemainingIQD: number;
  overallBorrowedProgressPct: number;

  totalLentOriginalIQD: number;
  totalLentPaidIQD: number;
  totalLentRemainingIQD: number;
  overallLentProgressPct: number;

  configuredMonthlyInstallmentsIQD: number;
  effectiveMonthlyPaymentHabitIQD: number;
  estimatedMonthsToDebtFree: number;
  projectedDebtFreeMonth: string;
  isDebtFree: boolean;
  activeBorrowedCount: number;
  completedBorrowedCount: number;
}

export const calcDebtPayoffProgress = (
  debts: DebtItem[],
  defaultRate = 1500,
  extraMonthlyPayment = 0,
  customHabitOverride = 0,
  currentMonth = new Date().toISOString().slice(0, 7)
): DebtPayoffProgress => {
  const borrowed = debts.filter(d => d.k === 'b');
  const lent = debts.filter(d => d.k === 'l');

  const getRate = (cu: string) => (cu === 'U' ? defaultRate : 1);

  let totalBorrowedOriginalIQD = 0;
  let totalBorrowedPaidIQD = 0;
  let configuredMonthlyInstallmentsIQD = 0;
  let activeBorrowedCount = 0;
  let completedBorrowedCount = 0;

  borrowed.forEach(d => {
    const r = getRate(d.cu);
    const orig = (d.a || 0) * r;
    const paid = Math.min(orig, (d.p || 0) * r);
    const rem = Math.max(0, orig - paid);
    totalBorrowedOriginalIQD += orig;
    totalBorrowedPaidIQD += paid;
    if (rem > 0) {
      activeBorrowedCount++;
      if (d.m && d.m > 0) {
        configuredMonthlyInstallmentsIQD += d.m * r;
      }
    } else {
      completedBorrowedCount++;
    }
  });

  const totalBorrowedRemainingIQD = Math.max(0, totalBorrowedOriginalIQD - totalBorrowedPaidIQD);
  const overallBorrowedProgressPct =
    totalBorrowedOriginalIQD > 0
      ? Math.min(100, Math.round((totalBorrowedPaidIQD / totalBorrowedOriginalIQD) * 100))
      : 100;

  // Lent debts
  let totalLentOriginalIQD = 0;
  let totalLentPaidIQD = 0;
  lent.forEach(d => {
    const r = getRate(d.cu);
    const orig = (d.a || 0) * r;
    const paid = Math.min(orig, (d.p || 0) * r);
    totalLentOriginalIQD += orig;
    totalLentPaidIQD += paid;
  });
  const totalLentRemainingIQD = Math.max(0, totalLentOriginalIQD - totalLentPaidIQD);
  const overallLentProgressPct =
    totalLentOriginalIQD > 0
      ? Math.min(100, Math.round((totalLentPaidIQD / totalLentOriginalIQD) * 100))
      : 100;

  const isDebtFree = totalBorrowedRemainingIQD <= 0;

  // Monthly payment habit
  let effectiveMonthlyPaymentHabitIQD = 0;
  if (customHabitOverride > 0) {
    effectiveMonthlyPaymentHabitIQD = customHabitOverride + (extraMonthlyPayment || 0);
  } else if (configuredMonthlyInstallmentsIQD > 0) {
    effectiveMonthlyPaymentHabitIQD = configuredMonthlyInstallmentsIQD + (extraMonthlyPayment || 0);
  } else if (extraMonthlyPayment > 0) {
    effectiveMonthlyPaymentHabitIQD = extraMonthlyPayment;
  }

  let estimatedMonthsToDebtFree = 0;
  let projectedDebtFreeMonth = currentMonth;

  if (isDebtFree) {
    estimatedMonthsToDebtFree = 0;
    projectedDebtFreeMonth = currentMonth;
  } else if (effectiveMonthlyPaymentHabitIQD > 0) {
    estimatedMonthsToDebtFree = Math.ceil(totalBorrowedRemainingIQD / effectiveMonthlyPaymentHabitIQD);
    projectedDebtFreeMonth = shiftMonth(currentMonth, estimatedMonthsToDebtFree);
  } else {
    estimatedMonthsToDebtFree = -1; // Unknown / no scheduled pace
    projectedDebtFreeMonth = '';
  }

  return {
    totalBorrowedOriginalIQD,
    totalBorrowedPaidIQD,
    totalBorrowedRemainingIQD,
    overallBorrowedProgressPct,
    totalLentOriginalIQD,
    totalLentPaidIQD,
    totalLentRemainingIQD,
    overallLentProgressPct,
    configuredMonthlyInstallmentsIQD,
    effectiveMonthlyPaymentHabitIQD,
    estimatedMonthsToDebtFree,
    projectedDebtFreeMonth,
    isDebtFree,
    activeBorrowedCount,
    completedBorrowedCount
  };
};

// -------------------------------------------------------------
// Debt Payoff Strategy: Snowball vs Avalanche
// -------------------------------------------------------------
export interface DebtStrategyStep {
  debt: DebtItem;
  originalIndex: number;
  remainingIQD: number;
  order: number;
  estimatedMonths: number;
  projectedMonth: string;
}

export interface DebtStrategiesResult {
  hasDebtsToPay: boolean;
  totalRemainingIQD: number;
  effectiveMonthlyHabitIQD: number;
  snowball: {
    steps: DebtStrategyStep[];
    firstDebtMonths: number;
    totalMonths: number;
    recommended: boolean;
    reason: string;
  };
  avalanche: {
    steps: DebtStrategyStep[];
    firstDebtMonths: number;
    totalMonths: number;
    recommended: boolean;
    reason: string;
  };
}

export const calcDebtPayoffStrategies = (
  debts: DebtItem[],
  defaultRate = 1500,
  monthlyHabitIQD = 0,
  currentMonth = new Date().toISOString().slice(0, 7)
): DebtStrategiesResult => {
  const getRate = (cu: string) => (cu === 'U' ? defaultRate : 1);

  // Active borrowed items
  const activeItems = debts
    .map((debt, originalIndex) => {
      const r = getRate(debt.cu);
      const orig = (debt.a || 0) * r;
      const paid = Math.min(orig, (debt.p || 0) * r);
      const rem = Math.max(0, orig - paid);
      return { debt, originalIndex, rem, orig, paid };
    })
    .filter(item => item.debt.k === 'b' && item.rem > 0);

  const totalRemainingIQD = activeItems.reduce((acc, curr) => acc + curr.rem, 0);

  if (activeItems.length === 0 || totalRemainingIQD <= 0) {
    return {
      hasDebtsToPay: false,
      totalRemainingIQD: 0,
      effectiveMonthlyHabitIQD: monthlyHabitIQD,
      snowball: { steps: [], firstDebtMonths: 0, totalMonths: 0, recommended: false, reason: '' },
      avalanche: { steps: [], firstDebtMonths: 0, totalMonths: 0, recommended: false, reason: '' }
    };
  }

  // Monthly capacity
  const effectiveHabit = monthlyHabitIQD > 0 ? monthlyHabitIQD : 250000; // default modest monthly budget

  // 1. Snowball: Sort ascending by remaining balance
  const snowballSorted = [...activeItems].sort((a, b) => a.rem - b.rem);
  let cumSnowballRem = 0;
  const snowballSteps: DebtStrategyStep[] = snowballSorted.map((item, idx) => {
    cumSnowballRem += item.rem;
    const estMonths = Math.ceil(cumSnowballRem / effectiveHabit);
    return {
      debt: item.debt,
      originalIndex: item.originalIndex,
      remainingIQD: item.rem,
      order: idx + 1,
      estimatedMonths: estMonths,
      projectedMonth: shiftMonth(currentMonth, estMonths)
    };
  });

  // 2. Avalanche: USD debts first (due to currency volatility), then largest balance descending
  const avalancheSorted = [...activeItems].sort((a, b) => {
    if (a.debt.cu === 'U' && b.debt.cu !== 'U') return -1;
    if (b.debt.cu === 'U' && a.debt.cu !== 'U') return 1;
    return b.rem - a.rem;
  });
  let cumAvalancheRem = 0;
  const avalancheSteps: DebtStrategyStep[] = avalancheSorted.map((item, idx) => {
    cumAvalancheRem += item.rem;
    const estMonths = Math.ceil(cumAvalancheRem / effectiveHabit);
    return {
      debt: item.debt,
      originalIndex: item.originalIndex,
      remainingIQD: item.rem,
      order: idx + 1,
      estimatedMonths: estMonths,
      projectedMonth: shiftMonth(currentMonth, estMonths)
    };
  });

  const totalMonths = Math.ceil(totalRemainingIQD / effectiveHabit);
  const snowballFirstMonths = snowballSteps[0]?.estimatedMonths || 0;
  const avalancheFirstMonths = avalancheSteps[0]?.estimatedMonths || 0;

  // Recommendation logic
  const hasUsdDebt = activeItems.some(i => i.debt.cu === 'U');
  const preferAvalanche = hasUsdDebt;

  return {
    hasDebtsToPay: true,
    totalRemainingIQD,
    effectiveMonthlyHabitIQD: effectiveHabit,
    snowball: {
      steps: snowballSteps,
      firstDebtMonths: snowballFirstMonths,
      totalMonths,
      recommended: !preferAvalanche,
      reason: !preferAvalanche
        ? 'پێشنیاز دەکرێت بۆ سەرکەوتنی دەروونی خێرا و کەمکردنەوەی ژمارەی قەرزەکان لە زووترین کاتدا'
        : 'باشە بۆ بەدەستهێنانی متمانە لە کورتخایەندا'
    },
    avalanche: {
      steps: avalancheSteps,
      firstDebtMonths: avalancheFirstMonths,
      totalMonths,
      recommended: preferAvalanche,
      reason: preferAvalanche
        ? 'پێشنیاز دەکرێت چونکە قەرزی بە دۆلارت هەیە و کەمکردنەوەی مەترسی جیاوازی دراو لەپێشینەیە'
        : 'باشە بۆ کەمکردنەوەی گەورەترین پابەندبوونەکان سەرەتا'
    }
  };
};

