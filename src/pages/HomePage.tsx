import React from 'react';
import {
  UserProfile,
  Transaction,
  BudgetRecord,
  CategoryKey,
} from '../types';
import {
  calculatePeriod,
  calculatePeriodTotals,
  calculateRemainingBalance,
  calculateDailyAllowance,
  calculateWalletHealthScore,
  calculateWeeklyRecap,
} from '../lib/calculations';
import { formatRupiah, formatDateIndonesia, getWibTodayString } from '../lib/formatters';
import { STRINGS } from '../constants/strings';
import { HealthScoreCard } from '../components/HealthScoreCard';
import { WeeklyRecapCard } from '../components/WeeklyRecapCard';
import { ExpenseDonut } from '../components/ExpenseDonut';
import { TrendChart } from '../components/TrendChart';
import { AlertBanner, CategoryAlert } from '../components/AlertBanner';
import { TransactionItem } from '../components/TransactionItem';
import {
  Wallet,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface HomePageProps {
  profile: UserProfile;
  transactions: Transaction[];
  budgets: BudgetRecord[];
  onOpenAddModal: () => void;
  onNavigateToTransactions: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  isLoading?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  profile,
  transactions,
  budgets,
  onOpenAddModal,
  onNavigateToTransactions,
  onEditTransaction,
  onDeleteTransaction,
  isLoading,
}) => {
  const todayStr = getWibTodayString();
  const period = calculatePeriod(profile.cycleStartDay);

  // Active transactions
  const activeTx = transactions.filter((t) => !t.deletedAt);
  const periodTx = activeTx.filter((t) => {
    const d = t.occurredAt.slice(0, 10);
    return d >= period.startDate && d <= period.endDate;
  });

  const { totalExpense, totalIncome, expenseByCategory } = calculatePeriodTotals(periodTx);
  const remainingBalance = calculateRemainingBalance(
    profile.monthlyAllowance,
    totalIncome,
    totalExpense
  );
  const dailyAllowance = calculateDailyAllowance(remainingBalance, period.daysRemaining);

  // Health Score
  const health = calculateWalletHealthScore({
    monthlyAllowance: profile.monthlyAllowance,
    periodExpenses: totalExpense,
    expenseByCategory,
    budgets,
    remainingBalance,
    period,
    transactionsLast7Days: activeTx.filter((t) => {
      const d = new Date(t.occurredAt.slice(0, 10)).getTime();
      const now = new Date(todayStr).getTime();
      return now - d <= 7 * 24 * 60 * 60 * 1000;
    }),
  });

  // Weekly Recap
  const totalBudgetAmount = budgets.find((b) => b.categoryKey === 'total')?.amount || profile.monthlyAllowance;
  const remainingBudget = Math.max(0, totalBudgetAmount - totalExpense);
  const weeklyRecap = calculateWeeklyRecap(transactions, remainingBudget, todayStr);

  // Threshold alerts (80% and >=100%)
  const alerts: CategoryAlert[] = [];
  budgets.forEach((b) => {
    if (b.categoryKey !== 'total' && b.amount > 0) {
      const spent = expenseByCategory[b.categoryKey as CategoryKey] || 0;
      const percentage = Math.round((spent / b.amount) * 100);
      if (percentage >= 100) {
        alerts.push({
          category: b.categoryKey as CategoryKey,
          spent,
          budget: b.amount,
          percentage,
          type: 'danger',
        });
      } else if (percentage >= 80) {
        alerts.push({
          category: b.categoryKey as CategoryKey,
          spent,
          budget: b.amount,
          percentage,
          type: 'warning',
        });
      }
    }
  });

  // Recent 5 transactions
  const recentTransactions = activeTx.slice(0, 5);

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="h-10 skeleton w-1/3 mb-4" />
        <div className="h-44 skeleton rounded-card" />
        <div className="h-32 skeleton rounded-card" />
        <div className="h-64 skeleton rounded-card" />
      </div>
    );
  }

  // Calculate percentage of allowance spent for main card progress bar
  const baseBudget = profile.monthlyAllowance + totalIncome;
  const spentPercent = baseBudget > 0 ? Math.min(100, Math.round((totalExpense / baseBudget) * 100)) : 0;

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {STRINGS.home.greeting(profile.displayName || 'Kamu')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {STRINGS.home.cyclePeriodText(
              formatDateIndonesia(period.startDate, true),
              formatDateIndonesia(period.endDate, true)
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-moneta-primary hover:bg-teal-800 text-white font-semibold text-xs rounded-xl shadow-sm transition"
        >
          <Sparkles size={16} />
          <span>Tambah Cepat</span>
        </button>
      </div>

      {/* Warning Strip if any budget >= 80% */}
      <AlertBanner alerts={alerts} />

      {/* Card Sisa Uang (Angka Sisa Uang Selalu Elemen Paling Besar - PRD Bagian 4 & F13) */}
      <div className="bg-gradient-to-br from-teal-800 to-teal-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-teal-600/20 blur-2xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2 text-teal-200 text-xs font-semibold uppercase tracking-wider">
            <Wallet size={16} />
            <span>{STRINGS.home.remainingBalanceTitle}</span>
          </div>
          <span className="text-[11px] bg-white/10 px-2.5 py-1 rounded-full text-teal-100 font-medium backdrop-blur-sm">
            {period.daysRemaining} hari tersisa
          </span>
        </div>

        {/* Big Remaining Amount (Paling Besar) */}
        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            {formatRupiah(remainingBalance)}
          </h1>
          <p className="text-xs sm:text-sm text-teal-100/90 font-medium mt-1.5 flex items-center gap-1.5">
            <Calendar size={14} className="text-teal-300" />
            <span>
              {STRINGS.home.dailyAllowanceText(period.daysRemaining, formatRupiah(dailyAllowance))}
            </span>
          </p>
        </div>

        {/* Progress Bar & Sub-totals */}
        <div className="space-y-2 relative z-10 pt-1">
          <div className="w-full bg-black/30 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spentPercent >= 100
                  ? 'bg-rose-500'
                  : spentPercent >= 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.max(3, spentPercent)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-teal-200/90 pt-1">
            <div className="flex items-center gap-1">
              <TrendingDown size={14} className="text-rose-300" />
              <span>Keluar: <strong className="text-white font-mono">{formatRupiah(totalExpense)}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp size={14} className="text-emerald-300" />
              <span>Masuk: <strong className="text-white font-mono">{formatRupiah(totalIncome)}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Wallet Health Score & Weekly Recap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HealthScoreCard health={health} />
        <WeeklyRecapCard recap={weeklyRecap} />
      </div>

      {/* Grid: Charts (Donut & 30-Day Trend) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ExpenseDonut data={expenseByCategory} />
        <TrendChart transactions={activeTx} />
      </div>

      {/* 5 Transaksi Terbaru */}
      <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              {STRINGS.home.recentTransactionsTitle}
            </h3>
            <p className="text-xs text-slate-500">Aktivitas keuangan paling baru</p>
          </div>
          {activeTx.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToTransactions}
              className="text-xs text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 transition"
            >
              <span>{STRINGS.home.viewAllTransactions}</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              {STRINGS.emptyStates.noTransactions}
            </p>
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 text-teal-800 text-xs font-bold rounded-xl hover:bg-teal-100 transition"
            >
              <Sparkles size={14} />
              <span>Catat Transaksi Pertama</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
