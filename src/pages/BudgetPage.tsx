import React, { useState } from 'react';
import {
  UserProfile,
  Transaction,
  BudgetRecord,
  CategoryKey,
} from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES } from '../constants/categories';
import { STRINGS } from '../constants/strings';
import {
  calculatePeriod,
  calculatePeriodTotals,
  calculateAutoBudget,
} from '../lib/calculations';
import { formatRupiah, parseRupiahInput } from '../lib/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  PieChart,
  Sparkles,
  Edit2,
  Check,
  X,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

interface BudgetPageProps {
  profile: UserProfile;
  transactions: Transaction[];
  budgets: BudgetRecord[];
  onSaveBudgets: (updated: BudgetRecord[]) => Promise<void>;
}

export const BudgetPage: React.FC<BudgetPageProps> = ({
  profile,
  transactions,
  budgets,
  onSaveBudgets,
}) => {
  const period = calculatePeriod(profile.cycleStartDay);
  const activeTx = transactions.filter((t) => {
    if (t.deletedAt) return false;
    const d = t.occurredAt.slice(0, 10);
    return d >= period.startDate && d <= period.endDate;
  });

  const { totalExpense, expenseByCategory } = calculatePeriodTotals(activeTx);

  // Budget map
  const budgetMap: Partial<Record<CategoryKey | 'total', number>> = {};
  budgets.forEach((b) => {
    budgetMap[b.categoryKey] = b.amount;
  });

  const totalBudget = budgetMap['total'] || profile.monthlyAllowance;

  // Editing state for category budget
  const [editingCategory, setEditingCategory] = useState<CategoryKey | 'total' | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);

  const startEdit = (catKey: CategoryKey | 'total', currentVal: number) => {
    setEditingCategory(catKey);
    setEditAmount(currentVal || 0);
  };

  const saveEdit = async () => {
    if (!editingCategory) return;
    const updated = [...budgets.filter((b) => b.categoryKey !== editingCategory)];
    updated.push({ categoryKey: editingCategory, amount: editAmount });
    await onSaveBudgets(updated);
    setEditingCategory(null);
  };

  // Auto-fill budget from monthly allowance (PRD F10)
  const handleAutoFill = async () => {
    const confirmed = window.confirm(STRINGS.budget.autoFillConfirm);
    if (!confirmed) return;

    const autoAlloc = calculateAutoBudget(profile.monthlyAllowance);
    const updated: BudgetRecord[] = [
      { categoryKey: 'total', amount: profile.monthlyAllowance },
    ];

    Object.entries(autoAlloc).forEach(([catKey, amount]) => {
      if (amount > 0) {
        updated.push({ categoryKey: catKey as CategoryKey, amount });
      }
    });

    await onSaveBudgets(updated);
  };

  // Progress metrics for Total
  const totalPercent = totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {STRINGS.budget.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pantau batas pengeluaran per kategori agar tidak kebobolan sebelum akhir bulan
          </p>
        </div>

        {/* Auto Fill Button (PRD F10) */}
        <button
          type="button"
          onClick={handleAutoFill}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition shadow-sm touch-target"
        >
          <Sparkles size={16} className="text-teal-600" />
          <span>{STRINGS.budget.autoFillButton}</span>
        </button>
      </div>

      {/* Cincin / Banner Budget Total */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <PieChart size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{STRINGS.budget.totalBudgetTitle}</h3>
              <p className="text-xs text-slate-500">Siklus periode ini</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                totalPercent >= 100
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : totalPercent >= 80
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {totalPercent >= 100
                ? STRINGS.budget.statusDanger
                : totalPercent >= 80
                ? STRINGS.budget.statusWarning
                : STRINGS.budget.statusSafe}{' '}
              ({totalPercent}%)
            </span>

            <button
              type="button"
              onClick={() => startEdit('total', totalBudget)}
              className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-slate-100"
              title="Ubah Total Budget"
            >
              <Edit2 size={16} />
            </button>
          </div>
        </div>

        {/* Total numbers */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <p className="text-3xl font-black text-slate-900">{formatRupiah(totalExpense)}</p>
            <p className="text-xs text-slate-500">Terpakai dari kuota {formatRupiah(totalBudget)}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-teal-800">
              {formatRupiah(Math.max(0, totalBudget - totalExpense))}
            </p>
            <p className="text-xs text-slate-500">Sisa kuota budget</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              totalPercent >= 100
                ? 'bg-moneta-danger'
                : totalPercent >= 80
                ? 'bg-amber-500'
                : 'bg-moneta-primary'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, totalPercent))}%` }}
          />
        </div>
      </div>

      {/* Daftar Kategori dengan Progress Bar (PRD F9 & Bagian 4) */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm px-1">
          {STRINGS.budget.categoryListTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {EXPENSE_CATEGORIES.map((cat) => {
            const spent = expenseByCategory[cat.key] || 0;
            const target = budgetMap[cat.key] || 0;
            const percent = target > 0 ? Math.round((spent / target) * 100) : 0;
            const isExceeded = target > 0 && percent >= 100;
            const isNearLimit = target > 0 && percent >= 80 && percent < 100;

            return (
              <div
                key={cat.key}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CategoryIcon category={cat.key} size={18} />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{cat.label}</p>
                      <p className="text-[11px] text-slate-400">
                        {target > 0 ? `Target: ${formatRupiah(target)}` : 'Belum diatur'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Status Label (Always with text label as per PRD) */}
                    {target > 0 && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isExceeded
                            ? 'bg-moneta-danger-bg text-moneta-danger'
                            : isNearLimit
                            ? 'bg-moneta-warning-bg text-moneta-warning'
                            : 'bg-teal-50 text-teal-800'
                        }`}
                      >
                        {isExceeded && <AlertOctagon size={12} />}
                        {isNearLimit && <AlertTriangle size={12} />}
                        <span>
                          {isExceeded
                            ? 'Lebih Kuota'
                            : isNearLimit
                            ? 'Hampir Habis'
                            : 'Aman'}{' '}
                          ({percent}%)
                        </span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => startEdit(cat.key, target)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
                      title="Ubah Target"
                    >
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-medium text-slate-500">
                    Terpakai: <strong className={isExceeded ? 'text-moneta-danger font-bold' : 'text-slate-900 font-bold'}>{formatRupiah(spent)}</strong>
                  </span>
                  {target > 0 && (
                    <span className="font-mono text-slate-400 text-[11px]">
                      Sisa: {formatRupiah(Math.max(0, target - spent))}
                    </span>
                  )}
                </div>

                {/* Progress bar (teal di bawah 80%, amber 80-99%, merah >=100%) */}
                {target > 0 ? (
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isExceeded
                          ? 'bg-moneta-danger'
                          : isNearLimit
                          ? 'bg-amber-500'
                          : 'bg-moneta-primary'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(2, percent))}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-50 rounded-full h-2 border border-dashed border-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Budget Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Atur Budget {editingCategory === 'total' ? 'Total' : CATEGORIES[editingCategory as CategoryKey]?.label}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Target Budget Bulanan (Rupiah)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">Rp</span>
                <input
                  type="text"
                  value={editAmount ? new Intl.NumberFormat('id-ID').format(editAmount) : ''}
                  onChange={(e) => setEditAmount(parseRupiahInput(e.target.value))}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-2.5 text-xl font-bold text-slate-900 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 py-2.5 bg-moneta-primary text-white text-xs font-semibold rounded-xl hover:bg-teal-800 shadow-sm flex items-center justify-center gap-1.5"
              >
                <Check size={16} /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
