import React from 'react';
import { WalletHealthBreakdown } from '../types';
import { ShieldCheck, ShieldAlert, AlertOctagon, Info } from 'lucide-react';

interface HealthScoreCardProps {
  health: WalletHealthBreakdown;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ health }) => {
  const { score, label, message, components } = health;

  const getTheme = () => {
    switch (label) {
      case 'Sehat':
        return {
          textColor: 'text-emerald-700',
          badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          meterBg: 'bg-emerald-600',
          icon: ShieldCheck,
        };
      case 'Waspada':
        return {
          textColor: 'text-amber-700',
          badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
          meterBg: 'bg-amber-500',
          icon: ShieldAlert,
        };
      case 'Rawan':
      default:
        return {
          textColor: 'text-red-700',
          badgeBg: 'bg-red-50 text-red-800 border-red-200',
          meterBg: 'bg-red-600',
          icon: AlertOctagon,
        };
    }
  };

  const theme = getTheme();
  const IconComponent = theme.icon;

  return (
    <div className="bg-white rounded-card p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconComponent size={20} className={theme.textColor} />
          <h3 className="font-bold text-slate-900 text-sm">Wallet Health Score</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${theme.badgeBg}`}
        >
          {label} ({score}/100)
        </span>
      </div>

      {/* Big Score & Progress Meter */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className={`text-4xl font-extrabold tracking-tight ${theme.textColor}`}>
            {score}
            <span className="text-slate-400 text-base font-normal">/100</span>
          </span>
          <span className="text-xs text-slate-500 font-medium">Status Keuangan Kos</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${theme.meterBg}`}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>
      </div>

      {/* 1 Sentence Advice from PRD Section 7 */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 flex items-start gap-2">
        <Info size={16} className="text-teal-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">{message}</p>
      </div>

      {/* Component breakdown pill details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
        <div className="p-2 bg-slate-50/70 rounded-xl">
          <p className="text-[10px] text-slate-500 font-medium">Kepatuhan (40%)</p>
          <p className="text-xs font-bold text-slate-800">{components.budgetCompliance}</p>
        </div>
        <div className="p-2 bg-slate-50/70 rounded-xl">
          <p className="text-[10px] text-slate-500 font-medium">Kecepatan (25%)</p>
          <p className="text-xs font-bold text-slate-800">{components.burnRate}</p>
        </div>
        <div className="p-2 bg-slate-50/70 rounded-xl">
          <p className="text-[10px] text-slate-500 font-medium">Konsistensi (20%)</p>
          <p className="text-xs font-bold text-slate-800">{components.consistency}%</p>
        </div>
        <div className="p-2 bg-slate-50/70 rounded-xl">
          <p className="text-[10px] text-slate-500 font-medium">Kebutuhan (15%)</p>
          <p className="text-xs font-bold text-slate-800">{components.needsRatio}</p>
        </div>
      </div>
    </div>
  );
};
