import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';
import { formatRupiah } from '../lib/formatters';

interface ExpenseDonutProps {
  data: Partial<Record<CategoryKey, number>>;
}

export const ExpenseDonut: React.FC<ExpenseDonutProps> = ({ data }) => {
  const chartData = Object.entries(data)
    .filter(([, amount]) => (amount || 0) > 0)
    .map(([key, amount]) => {
      const meta = CATEGORIES[key as CategoryKey] || CATEGORIES.lainnya;
      return {
        name: meta.label,
        value: amount || 0,
        color: meta.color,
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalExpense = chartData.reduce((acc, cur) => acc + cur.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">Belum ada data pengeluaran</p>
        <p className="text-xs text-slate-400 mt-1">Grafik donat akan tampil setelah kamu mencatat transaksi.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Porsi Pengeluaran Kategori</h3>
          <p className="text-xs text-slate-500">Distribusi alokasi dana periode ini</p>
        </div>
        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
          Total {formatRupiah(totalExpense)}
        </span>
      </div>

      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [formatRupiah(val), 'Pengeluaran']}
              contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
        {chartData.slice(0, 6).map((item, idx) => {
          const percent = Math.round((item.value / totalExpense) * 100);
          return (
            <div key={idx} className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-700 font-medium">{item.name}</span>
              </div>
              <span className="font-mono text-slate-500 text-[11px] shrink-0">{percent}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
