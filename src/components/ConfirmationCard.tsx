import React, { useState } from 'react';
import {
  AiTransactionDraft,
  CategoryKey,
  TransactionItem,
} from '../types';
import { CATEGORIES } from '../constants/categories';
import { STRINGS } from '../constants/strings';
import { formatRupiah, parseRupiahInput } from '../lib/formatters';
import { CategoryIcon } from './CategoryIcon';
import {
  Check,
  X,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Plus,
  Trash2,
} from 'lucide-react';

interface ConfirmationCardProps {
  drafts: AiTransactionDraft[];
  onConfirm: (finalDrafts: AiTransactionDraft[], feedback?: 'up' | 'down') => void;
  onCancel: () => void;
}

export const ConfirmationCard: React.FC<ConfirmationCardProps> = ({
  drafts,
  onConfirm,
  onCancel,
}) => {
  const [itemsList, setItemsList] = useState<AiTransactionDraft[]>(drafts);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  // Check lowest confidence across all drafts
  const getMinConfidence = (draft: AiTransactionDraft) => {
    return Math.min(
      draft.confidence.amount,
      draft.confidence.date,
      draft.confidence.merchant,
      draft.confidence.category
    );
  };

  const lowestConfidence = Math.min(...itemsList.map(getMinConfidence));
  const isAmber = lowestConfidence >= 0.5 && lowestConfidence < 0.85;

  const handleUpdateField = (
    index: number,
    field: keyof AiTransactionDraft,
    value: any
  ) => {
    const updated = [...itemsList];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setItemsList(updated);
  };

  const handleAddItem = (draftIdx: number) => {
    const updated = [...itemsList];
    const items = [...updated[draftIdx].items, { name: '', qty: 1, unitPrice: 0, total: 0 }];
    updated[draftIdx] = { ...updated[draftIdx], items };
    setItemsList(updated);
  };

  const handleRemoveItem = (draftIdx: number, itemIdx: number) => {
    const updated = [...itemsList];
    const items = updated[draftIdx].items.filter((_, i) => i !== itemIdx);
    updated[draftIdx] = { ...updated[draftIdx], items };
    setItemsList(updated);
  };

  const handleUpdateItem = (
    draftIdx: number,
    itemIdx: number,
    field: keyof TransactionItem,
    val: any
  ) => {
    const updated = [...itemsList];
    const items = [...updated[draftIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: val };
    if (field === 'qty' || field === 'unitPrice') {
      items[itemIdx].total = items[itemIdx].qty * items[itemIdx].unitPrice;
    }
    updated[draftIdx] = { ...updated[draftIdx], items };
    setItemsList(updated);
  };

  const getAmberBorder = (conf: number) => {
    return conf >= 0.5 && conf < 0.85 ? 'border-b-2 border-amber-500 bg-amber-50/50' : 'border-slate-200';
  };

  return (
    <div className="space-y-4">
      {/* Header status */}
      <div
        className={`p-3 rounded-card flex items-start gap-3 ${
          isAmber ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-teal-50 border border-teal-200 text-teal-900'
        }`}
      >
        {isAmber ? (
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
        ) : (
          <Check className="text-teal-600 shrink-0 mt-0.5" size={20} />
        )}
        <div className="text-sm">
          <p className="font-semibold">
            {isAmber
              ? STRINGS.confirmationCard.titleAmberReview
              : STRINGS.confirmationCard.titleSingleTap}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">
            Ditemukan {itemsList.length} transaksi dari struk / teks kamu.
          </p>
        </div>
      </div>

      {/* Cards list */}
      <div className="space-y-4 max-h-[58vh] overflow-y-auto pr-1">
        {itemsList.map((draft, idx) => {
          return (
            <div
              key={idx}
              className="p-4 bg-white border border-slate-200 rounded-card shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={draft.category} size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Transaksi {idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateField(idx, 'type', 'expense')}
                    className={`px-2 py-1 text-xs rounded-lg font-medium transition ${
                      draft.type === 'expense'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateField(idx, 'type', 'income')}
                    className={`px-2 py-1 text-xs rounded-lg font-medium transition ${
                      draft.type === 'income'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nominal
                  {draft.confidence.amount < 0.85 && (
                    <span className="text-amber-600 ml-1 text-[11px]">(Kurang yakin)</span>
                  )}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-semibold text-slate-500">Rp</span>
                  <input
                    type="text"
                    value={draft.amount ? new Intl.NumberFormat('id-ID').format(draft.amount) : ''}
                    onChange={e => handleUpdateField(idx, 'amount', parseRupiahInput(e.target.value))}
                    className={`w-full pl-10 pr-3 py-2 text-lg font-bold text-slate-900 rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-600 ${getAmberBorder(
                      draft.confidence.amount
                    )}`}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Kategori
                    {draft.confidence.category < 0.85 && (
                      <span className="text-amber-600 ml-1 text-[11px]">(Cek lagi)</span>
                    )}
                  </label>
                  <select
                    value={draft.category}
                    onChange={e => handleUpdateField(idx, 'category', e.target.value as CategoryKey)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-600 ${getAmberBorder(
                      draft.confidence.category
                    )}`}
                  >
                    {Object.values(CATEGORIES)
                      .filter(c => (draft.type === 'income' ? c.isIncome : !c.isIncome))
                      .map(cat => (
                        <option key={cat.key} value={cat.key}>
                          {cat.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tanggal
                    {draft.confidence.date < 0.85 && (
                      <span className="text-amber-600 ml-1 text-[11px]">(Cek lagi)</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={draft.date}
                    onChange={e => handleUpdateField(idx, 'date', e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-600 ${getAmberBorder(
                      draft.confidence.date
                    )}`}
                  />
                </div>
              </div>

              {/* Merchant & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Merchant / Toko
                  </label>
                  <input
                    type="text"
                    value={draft.merchant || ''}
                    onChange={e => handleUpdateField(idx, 'merchant', e.target.value || null)}
                    placeholder="Contoh: Indomaret, Warung"
                    className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-teal-600 ${getAmberBorder(
                      draft.confidence.merchant
                    )}`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Catatan Tambahan
                  </label>
                  <input
                    type="text"
                    value={draft.note || ''}
                    onChange={e => handleUpdateField(idx, 'note', e.target.value || null)}
                    placeholder="Keterangan singkat"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Items Breakdown (if available) */}
              {draft.items && draft.items.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">
                      {STRINGS.confirmationCard.itemsTitle}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(idx)}
                      className="text-xs text-teal-700 hover:text-teal-800 flex items-center gap-1 font-semibold"
                    >
                      <Plus size={14} /> Tambah Item
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {draft.items.map((it, itIdx) => (
                      <div key={itIdx} className="flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          value={it.name}
                          placeholder="Nama item"
                          onChange={e => handleUpdateItem(idx, itIdx, 'name', e.target.value)}
                          className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-600"
                        />
                        <input
                          type="number"
                          value={it.qty || 1}
                          min={1}
                          onChange={e => handleUpdateItem(idx, itIdx, 'qty', parseInt(e.target.value, 10) || 1)}
                          className="w-12 px-2 py-1.5 rounded-lg border border-slate-200 text-center"
                        />
                        <span className="text-slate-500 font-mono text-[11px] w-20 text-right">
                          {formatRupiah(it.total || it.unitPrice * it.qty)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx, itIdx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Accuracy Feedback */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-card flex items-center justify-between">
        <span className="text-xs text-slate-600 font-medium">
          {feedback ? STRINGS.confirmationCard.feedbackThanks : STRINGS.confirmationCard.feedbackPrompt}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFeedback('up')}
            className={`p-2 rounded-xl transition ${
              feedback === 'up' ? 'bg-teal-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'
            }`}
            title="Hasil AI Akurat"
          >
            <ThumbsUp size={16} />
          </button>
          <button
            type="button"
            onClick={() => setFeedback('down')}
            className={`p-2 rounded-xl transition ${
              feedback === 'down' ? 'bg-red-600 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'
            }`}
            title="Hasil AI Perlu Koreksi"
          >
            <ThumbsDown size={16} />
          </button>
        </div>
      </div>

      {/* Actions: Simpan & Batal */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-slate-300 rounded-btn text-slate-700 text-sm font-semibold hover:bg-slate-100 transition flex items-center justify-center gap-2 touch-target"
        >
          <X size={18} />
          {STRINGS.confirmationCard.cancelButton}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(itemsList, feedback || undefined)}
          className="flex-1 py-3 px-4 bg-moneta-primary hover:bg-teal-800 text-white rounded-btn text-sm font-semibold shadow-md transition flex items-center justify-center gap-2 touch-target"
        >
          <Check size={18} />
          {STRINGS.confirmationCard.saveButton}
        </button>
      </div>
    </div>
  );
};
