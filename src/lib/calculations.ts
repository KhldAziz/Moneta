import {
  CategoryKey,
  Transaction,
  BudgetRecord,
  WalletHealthBreakdown,
  HealthScoreLabel,
  WeeklyRecap,
} from '../types';
import {
  DEFAULT_BUDGET_PERCENTAGES,
  MANDATORY_NEED_CATEGORIES,
} from '../constants/config';
import { CATEGORIES } from '../constants/categories';

export interface PeriodInfo {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysRemaining: number;
  daysPassed: number;
  totalDays: number;
}

/**
 * Calculates current cycle period based on user's cycleStartDay (1-28)
 * Starts on cycleStartDay and ends on (next cycleStartDay - 1 day).
 */
export function calculatePeriod(cycleStartDay: number, referenceDate?: Date): PeriodInfo {
  const safeCycleDay = Math.min(28, Math.max(1, cycleStartDay || 1));
  const now = referenceDate ? new Date(referenceDate) : new Date();
  
  // Format reference date to Asia/Jakarta (WIB) year, month, day
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [currentYear, currentMonth, currentDay] = formatter
    .format(now)
    .split('-')
    .map(Number);

  let startYear = currentYear;
  let startMonth = currentMonth; // 1-indexed

  if (currentDay < safeCycleDay) {
    // Current cycle started in previous month
    startMonth -= 1;
    if (startMonth < 1) {
      startMonth = 12;
      startYear -= 1;
    }
  }

  // Start date of period
  const startDateObj = new Date(Date.UTC(startYear, startMonth - 1, safeCycleDay));
  
  // End date is 1 day before the next cycle start
  let nextCycleMonth = startMonth + 1;
  let nextCycleYear = startYear;
  if (nextCycleMonth > 12) {
    nextCycleMonth = 1;
    nextCycleYear += 1;
  }
  const nextCycleStartObj = new Date(Date.UTC(nextCycleYear, nextCycleMonth - 1, safeCycleDay));
  const endDateObj = new Date(nextCycleStartObj.getTime() - 24 * 60 * 60 * 1000);

  const formatIsoDate = (d: Date) => d.toISOString().slice(0, 10);
  const startDateStr = formatIsoDate(startDateObj);
  const endDateStr = formatIsoDate(endDateObj);

  // Calculate days passed and days remaining relative to today
  const todayUtc = new Date(Date.UTC(currentYear, currentMonth - 1, currentDay));
  const totalDays = Math.round((endDateObj.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const daysPassed = Math.max(1, Math.round((todayUtc.getTime() - startDateObj.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const daysRemaining = Math.max(1, Math.round((endDateObj.getTime() - todayUtc.getTime()) / (24 * 60 * 60 * 1000)) + 1);

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    daysRemaining,
    daysPassed,
    totalDays,
  };
}

/**
 * Pure calculation of remaining balance:
 * Uang saku bulanan + pemasukan periode - pengeluaran periode
 */
export function calculateRemainingBalance(
  monthlyAllowance: number,
  periodIncomes: number,
  periodExpenses: number
): number {
  return (monthlyAllowance || 0) + (periodIncomes || 0) - (periodExpenses || 0);
}

/**
 * Average daily allowance = sisa uang / hari tersisa
 */
export function calculateDailyAllowance(remainingBalance: number, daysRemaining: number): number {
  const safeDays = Math.max(1, daysRemaining);
  return Math.max(0, Math.round(remainingBalance / safeDays));
}

/**
 * Filter active (non-deleted) transactions within period
 */
export function getActiveTransactionsInPeriod(
  transactions: Transaction[],
  period: PeriodInfo
): Transaction[] {
  return transactions.filter(t => {
    if (t.deletedAt) return false;
    const dateStr = t.occurredAt.slice(0, 10);
    return dateStr >= period.startDate && dateStr <= period.endDate;
  });
}

/**
 * Calculate totals for income and expense in period
 */
export function calculatePeriodTotals(transactions: Transaction[]) {
  let totalExpense = 0;
  let totalIncome = 0;
  const expenseByCategory: Partial<Record<CategoryKey, number>> = {};

  for (const t of transactions) {
    if (t.deletedAt) continue;
    if (t.type === 'expense') {
      totalExpense += t.amount;
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    } else if (t.type === 'income') {
      totalIncome += t.amount;
    }
  }

  return { totalExpense, totalIncome, expenseByCategory };
}

/**
 * Generate automatic budget suggestions from monthly allowance
 */
export function calculateAutoBudget(monthlyAllowance: number): Record<CategoryKey, number> {
  const allowance = Math.max(0, monthlyAllowance || 0);
  const budgets = {} as Record<CategoryKey, number>;

  for (const [key, percent] of Object.entries(DEFAULT_BUDGET_PERCENTAGES)) {
    budgets[key as CategoryKey] = Math.round(allowance * percent);
  }

  return budgets;
}

/**
 * Wallet Health Score (PRD Section 7)
 * Score = 40% Kepatuhan Budget + 25% Kecepatan Habis + 20% Konsistensi + 15% Kebutuhan
 */
export function calculateWalletHealthScore(params: {
  monthlyAllowance: number;
  periodExpenses: number;
  expenseByCategory: Partial<Record<CategoryKey, number>>;
  budgets: BudgetRecord[];
  remainingBalance: number;
  period: PeriodInfo;
  transactionsLast7Days: Transaction[];
}): WalletHealthBreakdown {
  const {
    periodExpenses,
    expenseByCategory,
    budgets,
    remainingBalance,
    period,
    transactionsLast7Days,
  } = params;

  // 1. Kepatuhan Budget (40%)
  // Untuk tiap kategori yang punya budget:
  // nilai 100 jika <= 80%, turun linier ke 50 pada 100%, turun linier ke 0 pada >= 150%. Tanpa budget = 50.
  const activeBudgets = budgets.filter(b => b.categoryKey !== 'total' && b.amount > 0);
  let budgetCompliance = 50;

  if (activeBudgets.length > 0) {
    let totalCatScore = 0;
    for (const b of activeBudgets) {
      const catKey = b.categoryKey as CategoryKey;
      const spent = expenseByCategory[catKey] || 0;
      const ratioPercent = (spent / b.amount) * 100;

      let catScore = 100;
      if (ratioPercent <= 80) {
        catScore = 100;
      } else if (ratioPercent <= 100) {
        // Linear 100 down to 50
        catScore = 100 - (ratioPercent - 80) * 2.5;
      } else if (ratioPercent < 150) {
        // Linear 50 down to 0
        catScore = 50 - (ratioPercent - 100) * 1.0;
      } else {
        catScore = 0;
      }
      totalCatScore += Math.max(0, Math.min(100, catScore));
    }
    budgetCompliance = totalCatScore / activeBudgets.length;
  }

  // 2. Kecepatan Habis (25%)
  // r = (sisa uang dibagi hari tersisa) dibagi (rata-rata pengeluaran harian sejauh ini)
  // nilai = min(100, 50 * r); jika belum ada pengeluaran bernilai 100.
  let burnRate = 100;
  const avgDailyExpense = period.daysPassed > 0 ? periodExpenses / period.daysPassed : 0;
  
  if (periodExpenses <= 0 || avgDailyExpense <= 0) {
    burnRate = 100;
  } else if (remainingBalance <= 0) {
    burnRate = 0;
  } else {
    const dailyRemainingAllowance = remainingBalance / Math.max(1, period.daysRemaining);
    const r = dailyRemainingAllowance / avgDailyExpense;
    burnRate = Math.min(100, Math.max(0, Math.round(50 * r)));
  }

  // 3. Konsistensi (20%)
  // Persentase dari 7 hari terakhir yang punya minimal 1 transaksi.
  const daysWithTx = new Set<string>();
  for (const t of transactionsLast7Days) {
    if (!t.deletedAt) {
      daysWithTx.add(t.occurredAt.slice(0, 10));
    }
  }
  const consistency = Math.min(100, Math.round((daysWithTx.size / 7) * 100));

  // 4. Kebutuhan (15%)
  // Persentase pengeluaran periode ini di kategori wajib dibagi 70%, maksimal 100.
  let needsRatio = 100;
  if (periodExpenses > 0) {
    let mandatorySpent = 0;
    for (const cat of MANDATORY_NEED_CATEGORIES) {
      mandatorySpent += expenseByCategory[cat] || 0;
    }
    const percentNeeds = (mandatorySpent / periodExpenses) * 100;
    needsRatio = Math.min(100, Math.max(0, Math.round((percentNeeds / 70) * 100)));
  }

  // Total Score (0-100)
  const totalScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        budgetCompliance * 0.40 +
        burnRate * 0.25 +
        consistency * 0.20 +
        needsRatio * 0.15
      )
    )
  );

  let label: HealthScoreLabel = 'Sehat';
  if (totalScore < 40) {
    label = 'Rawan';
  } else if (totalScore < 70) {
    label = 'Waspada';
  }

  // Weakest component detection & advice message
  const componentMap = [
    { name: 'Kepatuhan Budget', score: budgetCompliance, key: 'budget' },
    { name: 'Kecepatan Habis', score: burnRate, key: 'burn' },
    { name: 'Konsistensi Mencatat', score: consistency, key: 'consistency' },
    { name: 'Alokasi Kebutuhan', score: needsRatio, key: 'needs' },
  ];
  componentMap.sort((a, b) => a.score - b.score);
  const weakest = componentMap[0];

  let message = 'Kondisi keuangan kamu sehat! Pertahankan gaya belanja hemat ini ya.';
  if (weakest.key === 'budget') {
    // Check which category is most over budget
    const overCat = activeBudgets.find(b => (expenseByCategory[b.categoryKey as CategoryKey] || 0) > b.amount * 0.8);
    if (overCat) {
      const catLabel = CATEGORIES[overCat.categoryKey as CategoryKey]?.label || overCat.categoryKey;
      message = `Budget ${catLabel} hampir habis, coba kurangi jajan minggu ini ya.`;
    } else {
      message = 'Beberapa budget kategori mulai menipis, yuk lebih disiplin!';
    }
  } else if (weakest.key === 'burn') {
    message = 'Laju pengeluaran kamu cukup cepat dibanding sisa hari, tahan godaan belanja impulsif ya.';
  } else if (weakest.key === 'consistency') {
    message = 'Kamu jarang mencatat transaksi 7 hari ini. Yuk foto nota atau chat pengeluaranmu rutin!';
  } else if (weakest.key === 'needs') {
    message = 'Porsi pengeluaran non-primer kamu agak tinggi, prioritaskan kebutuhan pokok kos & kuliah dulu ya.';
  }

  return {
    score: totalScore,
    label,
    message,
    components: {
      budgetCompliance: Math.round(budgetCompliance),
      burnRate: Math.round(burnRate),
      consistency: Math.round(consistency),
      needsRatio: Math.round(needsRatio),
    },
    weakestComponent: weakest.name,
  };
}

/**
 * Weekly Recap (PRD F11):
 * 7 hari terakhir vs 7 hari sebelumnya
 */
export function calculateWeeklyRecap(
  allTransactions: Transaction[],
  remainingBudget: number,
  todayStr: string
): WeeklyRecap {
  const activeTx = allTransactions.filter(t => !t.deletedAt && t.type === 'expense');
  const todayDate = new Date(`${todayStr}T12:00:00+07:00`);

  const currentWeekDays: string[] = [];
  const prevWeekDays: string[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
    currentWeekDays.push(d.toISOString().slice(0, 10));
  }
  for (let i = 7; i < 14; i++) {
    const d = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
    prevWeekDays.push(d.toISOString().slice(0, 10));
  }

  let currentWeekTotal = 0;
  const currentCategoryMap: Partial<Record<CategoryKey, number>> = {};
  let previousWeekTotal = 0;

  for (const t of activeTx) {
    const d = t.occurredAt.slice(0, 10);
    if (currentWeekDays.includes(d)) {
      currentWeekTotal += t.amount;
      currentCategoryMap[t.category] = (currentCategoryMap[t.category] || 0) + t.amount;
    } else if (prevWeekDays.includes(d)) {
      previousWeekTotal += t.amount;
    }
  }

  let percentChange: number | null = null;
  if (previousWeekTotal > 0) {
    percentChange = Math.round(((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100);
  }

  // Top 3 categories
  const sortedCategories = Object.entries(currentCategoryMap)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 3)
    .map(([cat, amount]) => ({
      category: cat as CategoryKey,
      amount: amount || 0,
      percentage: currentWeekTotal > 0 ? Math.round(((amount || 0) / currentWeekTotal) * 100) : 0,
    }));

  return {
    currentWeekTotal,
    previousWeekTotal,
    percentChange,
    topCategories: sortedCategories,
    remainingBudget,
  };
}
