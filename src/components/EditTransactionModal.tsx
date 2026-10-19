import React, { useState, useEffect } from 'react';
import { Transaction, CategoryKey, TransactionType } from '../types';
import { CATEGORIES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants/categories';
import { STRINGS } from '../constants/strings';
import { parseRupiahInput } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import { X, Trash2, Check } from 'lucide-react';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Transaction, categoryChangedMerchant?: { merchant: string; category: CategoryKey }) => Promise<void>;
  onDelete: (id: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !transaction) return null;

  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<number>(transaction.amount);
  const [category, setCategory] = useState<CategoryKey>(transaction.category);
  const [date, setDate] = useState<string>(transaction.occurredAt.slice(0, 10));
  const [merchant, setMerchant] = useState<string>(transaction.merchant || '');
  const [note, setNote] = useState<string>(transaction.note || '');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount);
      setCategory(transaction.category);
      setDate(transaction.occurredAt.slice(0, 10));
      setMerchant(transaction.merchant || '');
      setNote(transaction.note || '');
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    let categoryChangedMerchant: { merchant: string; category: CategoryKey } | undefined;
    if (merchant.trim() && category !== transaction.category) {
      categoryChangedMerchant = {
        merchant: merchant.trim(),
        category,
      };
    }

    const updatedTx: Transaction = {
      ...transaction,
      type,
      amount,
      category,
      merchant: merchant.trim() || null,
      note: note.trim() || null,
      occurredAt: `${date}T12:00:00+07:00`,
    };

    await onSave(updatedTx, categoryChangedMerchant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{STRINGS.transactions.editSheetTitle}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 touch-target flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                if (CATEGORIES[category]?.isIncome) setCategory('makan_minum');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                type === 'expense' ? 'bg-slate-900 text-white shadow' : 'text-slate-600'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                if (!CATEGORIES[category]?.isIncome) setCategory('uang_saku');
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition ${
                type === 'income' ? 'bg-emerald-700 text-white shadow' : 'text-slate-600'
              }`}
            >
              Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Nominal</label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-lg font-bold text-slate-500">Rp</span>
              <input
                type="text"
                value={amount ? new Intl.NumberFormat('id-ID').format(amount) : ''}
                onChange={(e) => setAmount(parseRupiahInput(e.target.value))}
                className="w-full pl-12 pr-4 py-3 text-2xl font-bold text-slate-900 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Kategori</label>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border rounded-xl border-slate-100 bg-slate-50/50">
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((cat) => {
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-xl flex items-center gap-1.5 transition ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CategoryIcon category={cat.key} size={14} className="p-0.5 rounded" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Merchant / Toko</label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="Nama tempat transaksi"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan tambahan..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                onDelete(transaction.id);
                onClose();
              }}
              className="py-3 px-4 border border-red-200 text-red-600 rounded-btn text-sm font-semibold hover:bg-red-50 transition flex items-center justify-center gap-1.5 touch-target"
            >
              <Trash2 size={16} />
              Hapus
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 touch-target"
            >
              <Check size={18} />
              {STRINGS.transactions.saveEdit}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
