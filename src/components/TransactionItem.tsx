import React from 'react';
import { Transaction } from '../types';
import { CATEGORIES } from '../constants/categories';
import { formatRupiah } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { Camera, Sparkles, Edit3, Trash2, ChevronRight } from 'lucide-react';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isIncome = transaction.type === 'income';
  const categoryMeta = CATEGORIES[transaction.category] || CATEGORIES.lainnya;

  const getSourceIcon = () => {
    switch (transaction.source) {
      case 'photo':
        return (
          <span title="Foto Nota" className="inline-flex">
            <Camera size={12} className="text-teal-600" />
          </span>
        );
      case 'chat':
        return (
          <span title="Chat AI" className="inline-flex">
            <Sparkles size={12} className="text-purple-600" />
          </span>
        );
      case 'manual':
      default:
        return (
          <span title="Manual" className="inline-flex">
            <Edit3 size={12} className="text-slate-400" />
          </span>
        );
    }
  };

  return (
    <div
      onClick={() => onEdit(transaction)}
      className="group relative flex items-center justify-between p-3.5 bg-white hover:bg-slate-50/80 rounded-2xl border border-slate-100 transition shadow-sm cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <CategoryIcon category={transaction.category} size={20} />
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">
            {transaction.merchant || categoryMeta.label}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="truncate">{categoryMeta.label}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5" title={`Sumber: ${transaction.source}`}>
              {getSourceIcon()}
              <span className="capitalize">{transaction.source}</span>
            </span>
            {transaction.note && (
              <>
                <span>•</span>
                <span className="truncate max-w-[120px] text-slate-400">{transaction.note}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p
            className={`font-bold text-sm tracking-tight ${
              isIncome ? 'text-moneta-income' : 'text-slate-900'
            }`}
          >
            {isIncome ? `+${formatRupiah(transaction.amount)}` : formatRupiah(transaction.amount)}
          </p>
          <p className="text-[10px] text-slate-400">
            {transaction.items?.length > 1 ? `${transaction.items.length} item` : ''}
          </p>
        </div>

        {/* Delete action button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(transaction.id);
          }}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition touch-target flex items-center justify-center"
          title="Hapus transaksi"
        >
          <Trash2 size={16} />
        </button>

        <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 hidden sm:block" />
      </div>
    </div>
  );
};
