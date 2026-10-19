import React from 'react';
import { WeeklyRecap } from '../types';
import { formatRupiah } from '../lib/formatters';
import { CATEGORIES } from '../constants/categories';
import { CategoryIcon } from './CategoryIcon';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeeklyRecapCardProps {
  recap: WeeklyRecap;
}

export const WeeklyRecapCard: React.FC<WeeklyRecapCardProps> = ({ recap }) => {
  const { currentWeekTotal, percentChange, topCategories, remainingBudget } = recap;

  const renderTrendBadge = () => {
    if (percentChange === null) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
          <Minus size={14} /> Data minggu lalu belum cukup
        </span>
      );
    }
    if (percentChange > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-semibold">
          <TrendingUp size={14} /> Naik {percentChange}% vs 7 hari lalu
        </span>
      );
    }
    if (percentChange < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
          <TrendingDown size={14} /> Hemat {Math.abs(percentChange)}% vs 7 hari lalu
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
        <Minus size={14} /> Sama dengan 7 hari lalu
      </span>
    );
  };

  return (
    <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
            <Calendar size={18} />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">Rekap 7 Hari Terakhir</h3>
        </div>
        {renderTrendBadge()}
      </div>

      {/* Spending sum */}
      <div className="flex items-baseline justify-between pt-1">
        <div>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(currentWeekTotal)}</p>
          <p className="text-xs text-slate-500">Total keluar 7 hari terakhir</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-teal-700">{formatRupiah(remainingBudget)}</p>
          <p className="text-xs text-slate-500">Sisa budget periode ini</p>
        </div>
      </div>

      {/* Top 3 categories */}
      {topCategories.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-600">3 Kategori Terbanyak Minggu Ini:</p>
          <div className="space-y-1.5">
            {topCategories.map((item) => {
              const meta = CATEGORIES[item.category] || CATEGORIES.lainnya;
              return (
                <div key={item.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={item.category} size={14} className="p-1 rounded-md" />
                    <span className="font-medium text-slate-700">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-900 font-semibold">{formatRupiah(item.amount)}</span>
                    <span className="text-slate-400 text-[11px]">({item.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
