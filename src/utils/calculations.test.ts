import {
  calcMonthTotals,
  calc503020,
  calcHealthScore,
  calcZakat,
  calcSettleUp,
  calcGoldCurrentValue,
  calcDebtPayoffProgress,
  calcDebtPayoffStrategies,
  val
} from './calculations';
import { MonthDoc, ExpenseTx, GoldItem, DebtItem } from '../types';

export function runCalculationUnitTests() {
  const results: { name: string; passed: boolean; message?: string }[] = [];

  const test = (name: string, fn: () => void) => {
    try {
      fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({ name, passed: false, message: err?.message || String(err) });
    }
  };

  const assertEqual = (actual: any, expected: any, desc = '') => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, but got ${actual}. ${desc}`);
    }
  };

  // 1. Currency conversion (IQD vs USD at stored rate)
  test('Currency conversion with stored rate', () => {
    const txIQD: ExpenseTx = { c: 6, d: '2026-10-10', a: 10000, cu: 'D', r: 1500, w: 0 };
    assertEqual(val(txIQD), 10000, 'IQD amount should be unchanged');

    const txUSD: ExpenseTx = { c: 6, d: '2026-10-10', a: 20, cu: 'U', r: 1520, w: 0 };
    assertEqual(val(txUSD), 30400, '20 USD * 1520 rate should equal 30400 IQD');
  });

  // 2. Month totals calculation
  test('Month totals, expenses, income, remaining & savings rate', () => {
    const doc: MonthDoc = {
      inc: [1000000, 500000],
      oi: 100000, // Total income = 1,600,000
      bud: [],
      tx: [
        { c: 6, d: '2026-10-01', a: 200000, cu: 'D', r: 1500, w: 0 },
        { c: 11, d: '2026-10-02', a: 100000, cu: 'D', r: 1500, w: 0 },
        { c: 10, d: '2026-10-03', a: 100, cu: 'U', r: 1500, w: 1 }, // 150,000 IQD
      ],
      sv: [
        { g: 0, a: 320000, d: '2026-10-05' } // 320,000 saved
      ]
    };

    const totals = calcMonthTotals(doc);
    assertEqual(totals.inc, 1600000, 'Income');
    assertEqual(totals.exp, 450000, 'Expenses');
    assertEqual(totals.sv, 320000, 'Savings');
    assertEqual(totals.rem, 830000, 'Remaining = 1600000 - 450000 - 320000');
    assertEqual(totals.savingsRate, 0.20, 'Savings rate = 320000 / 1600000 = 20%');
  });

  // 3. 50/30/20 rule classification
  test('50/30/20 needs vs wants categorization', () => {
    const totals = {
      sp: Array(32).fill(0),
      inc: 1000000,
      exp: 400000,
      sv: 200000,
      rem: 400000,
      savingsRate: 0.2
    };
    // Category 6 is Groceries (need), Category 10 is Restaurant (want)
    totals.sp[6] = 250000;
    totals.sp[10] = 150000;

    const breakdown = calc503020(totals);
    assertEqual(breakdown.needs, 250000, 'Needs should be Groceries (250,000)');
    assertEqual(breakdown.wants, 150000, 'Wants should be Restaurants (150,000)');
    assertEqual(breakdown.savings, 200000, 'Savings should be 200,000');
    assertEqual(breakdown.savingsPct, 20, 'Savings %');
  });

  // 4. Financial Health score calculation
  test('Financial Health score 0-100 logic', () => {
    const perfectHealth = calcHealthScore({
      savingsRate: 0.25, // >= 20% -> 30 pts
      monthlyDebtPayment: 100000,
      monthlyIncome: 1500000, // dti = 6.6% <= 10% -> 25 pts
      liquidAssets: 6000000,
      averageMonthlyExpense: 1000000, // 6 months covered -> 25 pts
      budgetedCategoriesCount: 5,
      adheredCategoriesCount: 5 // 100% adherence -> 20 pts
    });
    assertEqual(perfectHealth.score, 100, 'Perfect health scenario score');

    const lowHealth = calcHealthScore({
      savingsRate: 0, // 0 pts
      monthlyDebtPayment: 600000,
      monthlyIncome: 1000000, // dti = 60% >= 35% -> 0 pts
      liquidAssets: 500000,
      averageMonthlyExpense: 1000000, // 0.5 months -> 2 pts
      budgetedCategoriesCount: 5,
      adheredCategoriesCount: 1 // 20% adherence -> 4 pts
    });
    if (lowHealth.score > 20) {
      throw new Error(`Low health score should be <= 20, got ${lowHealth.score}`);
    }
  });

  // 5. Zakat calculation & Nisab threshold (85g 21k)
  test('Zakat estimate matches Nisab of 85 grams 21k', () => {
    const goldPrice21k = 70000; // IQD per gram
    const nisab = 85 * 70000; // 5,950,000 IQD

    const belowNisab = calcZakat(5000000, goldPrice21k);
    assertEqual(belowNisab.isEligible, 0, 'Wealth below nisab is not eligible');
    assertEqual(belowNisab.zakatAmount, 0, 'No zakat when below nisab');

    const aboveNisab = calcZakat(10000000, goldPrice21k);
    assertEqual(aboveNisab.isEligible, 1, 'Wealth above nisab is eligible');
    assertEqual(aboveNisab.zakatAmount, 250000, 'Zakat should be 2.5% of 10,000,000 = 250,000');
  });

  // 6. Gold Karat Valuation
  test('Gold karat scaling against 21k baseline', () => {
    const current21kRate = 60000;
    const gold24k: GoldItem = { d: '2026-10-10', g: 10, k: 24, p: 55000 };
    // adjusted price = (60000 * 24) / 21 = ~68571.428 -> * 10g = ~685714.28
    const val24k = calcGoldCurrentValue(gold24k, current21kRate);
    assertEqual(Math.round(val24k), Math.round((10 * 60000 * 24) / 21));

    const gold18k: GoldItem = { d: '2026-10-10', g: 10, k: 18, p: 45000 };
    const val18k = calcGoldCurrentValue(gold18k, current21kRate);
    assertEqual(Math.round(val18k), Math.round((10 * 60000 * 18) / 21));
  });

  // 7. Settle up between household members
  test('Settle-up balances split shared expenses equally', () => {
    const txs: ExpenseTx[] = [
      { c: 6, d: '2026-10-10', a: 100000, cu: 'D', r: 1500, w: 0, s: 1 }, // Member 0 paid 100k
      { c: 7, d: '2026-10-11', a: 20000, cu: 'D', r: 1500, w: 1, s: 1 },  // Member 1 paid 20k
      { c: 16, d: '2026-10-12', a: 50000, cu: 'D', r: 1500, w: 0, s: 0 }, // Personal, not shared
    ];
    // Total shared = 120,000. Each member's fair share = 60,000.
    // Member 0 net: 100,000 - 60,000 = +40,000
    // Member 1 net: 20,000 - 60,000 = -40,000
    const result = calcSettleUp(txs, [0, 1]);
    assertEqual(result.totalShared, 120000);
    assertEqual(result.sharePerMember, 60000);
    assertEqual(result.balances[0].net, 40000);
    assertEqual(result.balances[1].net, -40000);
    assertEqual(result.transfers.length, 1);
    assertEqual(result.transfers[0].fromIndex, 1);
    assertEqual(result.transfers[0].toIndex, 0);
    assertEqual(result.transfers[0].amount, 40000);
  });

  // 8. Debt visual progress and payoff timeline calculation
  test('Debt payoff progress, remaining balance, and estimated payoff months', () => {
    const debts: DebtItem[] = [
      // Borrowed 1: 1,000,000 total, 400,000 paid. Rem = 600,000. Monthly installment = 100,000
      { n: 'Car Loan', k: 'b', a: 1000000, p: 400000, cu: 'D', m: 100000 },
      // Borrowed 2: $200 (at rate 1500 = 300,000 IQD). 0 paid. Monthly = $50 (75,000 IQD)
      { n: 'Shop Debt', k: 'b', a: 200, p: 0, cu: 'U', m: 50 },
      // Lent 1: 500,000 lent to friend, 200,000 received. Rem = 300,000
      { n: 'Friend loan', k: 'l', a: 500000, p: 200000, cu: 'D' }
    ];

    // Total Borrowed = 1,000,000 + 300,000 = 1,300,000
    // Total Paid = 400,000 + 0 = 400,000
    // Total Remaining = 600,000 + 300,000 = 900,000
    // Overall Borrowed Progress Pct = Math.round(400,000 / 1,300,000 * 100) = 31%
    // Configured monthly installments = 100,000 + 75,000 = 175,000 IQD/mo
    // Estimated months = Math.ceil(900,000 / 175,000) = 6 months
    const progress = calcDebtPayoffProgress(debts, 1500, 0, 0, '2026-10');
    assertEqual(progress.totalBorrowedOriginalIQD, 1300000, 'Original borrowed');
    assertEqual(progress.totalBorrowedPaidIQD, 400000, 'Paid borrowed');
    assertEqual(progress.totalBorrowedRemainingIQD, 900000, 'Remaining borrowed');
    assertEqual(progress.overallBorrowedProgressPct, 31, 'Overall progress %');
    assertEqual(progress.configuredMonthlyInstallmentsIQD, 175000, 'Installments pace');
    assertEqual(progress.estimatedMonthsToDebtFree, 6, 'Estimated months to debt free');
    assertEqual(progress.projectedDebtFreeMonth, '2027-04', 'Debt free month (2026-10 + 6)');
    assertEqual(progress.isDebtFree, false, 'Should not be debt free yet');

    // With extra payment of 25,000 IQD/mo:
    // Pace becomes 175,000 + 25,000 = 200,000 IQD/mo
    // Estimated months = Math.ceil(900,000 / 200,000) = 5 months
    const accelerated = calcDebtPayoffProgress(debts, 1500, 25000, 0, '2026-10');
    assertEqual(accelerated.estimatedMonthsToDebtFree, 5, 'Accelerated to 5 months');
    assertEqual(accelerated.projectedDebtFreeMonth, '2027-03', 'Accelerated date');

    // When fully paid off:
    const paidDebts: DebtItem[] = [
      { n: 'Car Loan', k: 'b', a: 500000, p: 500000, cu: 'D', m: 50000 }
    ];
    const free = calcDebtPayoffProgress(paidDebts, 1500, 0, 0, '2026-10');
    assertEqual(free.isDebtFree, true, 'Fully paid off isDebtFree true');
    assertEqual(free.estimatedMonthsToDebtFree, 0, '0 months remaining');
    assertEqual(free.overallBorrowedProgressPct, 100, '100% progress');
  });

  // 9. Debt Payoff Strategies (Snowball vs Avalanche)
  test('Debt Payoff Strategies (Snowball vs Avalanche)', () => {
    const debts: DebtItem[] = [
      // Debt A: 1,000,000 IQD remaining
      { n: 'Big IQD Debt', k: 'b', a: 1000000, p: 0, cu: 'D' },
      // Debt B: 100,000 IQD remaining (smallest)
      { n: 'Small Debt', k: 'b', a: 100000, p: 0, cu: 'D' },
      // Debt C: $200 (300,000 IQD, in USD)
      { n: 'USD Debt', k: 'b', a: 200, p: 0, cu: 'U' }
    ];

    const res = calcDebtPayoffStrategies(debts, 1500, 200000, '2026-10');
    assertEqual(res.hasDebtsToPay, true, 'Has debts to pay');
    assertEqual(res.totalRemainingIQD, 1400000, 'Total remaining: 1M + 100k + 300k = 1.4M');
    
    // Snowball sorts smallest first: Small Debt (100k), then USD Debt (300k), then Big IQD (1M)
    assertEqual(res.snowball.steps[0].debt.n, 'Small Debt', 'Snowball #1 is Small Debt');
    assertEqual(res.snowball.steps[1].debt.n, 'USD Debt', 'Snowball #2 is USD Debt');
    assertEqual(res.snowball.steps[2].debt.n, 'Big IQD Debt', 'Snowball #3 is Big IQD Debt');

    // Avalanche sorts USD first, then largest: USD Debt ($200), then Big IQD Debt (1M), then Small Debt (100k)
    assertEqual(res.avalanche.steps[0].debt.n, 'USD Debt', 'Avalanche #1 is USD Debt');
    assertEqual(res.avalanche.recommended, true, 'Avalanche recommended due to USD currency risk');
  });

  return results;
}
