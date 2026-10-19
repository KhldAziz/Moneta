import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Transaction } from '../types';
import { formatRupiah, getWibTodayString } from '../lib/formatters';

interface TrendChartProps {
  transactions: Transaction[];
}

export const TrendChart: React.FC<TrendChartProps> = ({ transactions }) => {
  const todayStr = getWibTodayString();
  const todayDate = new Date(`${todayStr}T12:00:00+07:00`);

  // Build last 30 days array
  const dailyDataMap: Record<string, number> = {};
  const daysList: { dateKey: string; label: string }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayDate.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyDataMap[key] = 0;
    daysList.push({
      dateKey: key,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
    });
  }

  // Aggregate active expenses
  transactions.forEach((t) => {
    if (t.deletedAt || t.type !== 'expense') return;
    const dateKey = t.occurredAt.slice(0, 10);
    if (dateKey in dailyDataMap) {
      dailyDataMap[dateKey] += t.amount;
    }
  });

  const chartData = daysList.map((item) => ({
    label: item.label,
    amount: dailyDataMap[item.dateKey],
  }));

  const maxExpense = Math.max(...chartData.map((d) => d.amount), 10000);

  return (
    <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Tren Pengeluaran 30 Hari</h3>
          <p className="text-xs text-slate-500">Pola pengeluaran harian kamu selama sebulan</p>
        </div>
      </div>

      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stop-color="#0F766E" stopOpacity={0.4} />
                <stop offset="95%" stop-color="#14B8A6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              interval={4}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
            />
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
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#0F766E"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#trendGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
