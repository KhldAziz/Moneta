import React from 'react';
import { CategoryKey } from '../types';
import { CATEGORIES } from '../constants/categories';
import { AlertTriangle, AlertOctagon } from 'lucide-react';

export interface CategoryAlert {
  category: CategoryKey;
  spent: number;
  budget: number;
  percentage: number;
  type: 'warning' | 'danger'; // warning: 80-99%, danger: >=100%
}

interface AlertBannerProps {
  alerts: CategoryAlert[];
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ alerts }) => {
  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((al) => {
        const meta = CATEGORIES[al.category] || CATEGORIES.lainnya;
        const isDanger = al.type === 'danger';

        return (
          <div
            key={al.category}
            className={`p-3.5 rounded-card flex items-start gap-3 border transition-all ${
              isDanger
                ? 'bg-moneta-danger-bg border-red-200 text-moneta-danger'
                : 'bg-moneta-warning-bg border-amber-200 text-moneta-warning'
            }`}
          >
            {isDanger ? (
              <AlertOctagon size={20} className="shrink-0 mt-0.5 text-moneta-danger" />
            ) : (
              <AlertTriangle size={20} className="shrink-0 mt-0.5 text-moneta-warning" />
            )}
            <div className="text-xs flex-1">
              <p className="font-bold">
                {isDanger
                  ? `Budget ${meta.label} Terlampaui! (${al.percentage}%)`
                  : `Budget ${meta.label} Mendekati Batas (${al.percentage}%)`}
              </p>
              <p className="mt-0.5 opacity-90">
                {isDanger
                  ? `Pengeluaran sudah melebihi kuota budget yang kamu rencanakan untuk kategori ini.`
                  : `Pengeluaran sudah mencapai ${al.percentage}% dari kuota budget. Yuk lebih cermat!`}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
