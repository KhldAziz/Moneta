import React, { useState, useMemo } from 'react';
import {
  Transaction,
  CategoryKey,
  TransactionSource,
} from '../types';
import { CATEGORIES } from '../constants/categories';
import { STRINGS } from '../constants/strings';
import { formatRupiah, formatDateIndonesia, formatRelativeDate } from '../lib/formatters';
import { TransactionItem } from '../components/TransactionItem';
import {
  Search,
  Filter,
  X,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface TransactionsPageProps {
  transactions: Transaction[];
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenAddModal: () => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  onEditTransaction,
  onDeleteTransaction,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Filter out soft deleted transactions
  const activeTransactions = useMemo(() => {
    return transactions.filter((t) => !t.deletedAt);
  }, [transactions]);

  // Extract unique available months (YYYY-MM)
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    activeTransactions.forEach((t) => {
      months.add(t.occurredAt.slice(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [activeTransactions]);

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return activeTransactions.filter((t) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const m = (t.merchant || '').toLowerCase();
        const n = (t.note || '').toLowerCase();
        const catLabel = (CATEGORIES[t.category]?.label || '').toLowerCase();
        const amountStr = t.amount.toString();
        const matches = m.includes(query) || n.includes(query) || catLabel.includes(query) || amountStr.includes(query);
        if (!matches) return false;
      }

      // 2. Month filter
      if (selectedMonth !== 'all') {
        if (!t.occurredAt.startsWith(selectedMonth)) return false;
      }

      // 3. Category filter
      if (selectedCategory !== 'all') {
        if (t.category !== selectedCategory) return false;
      }

      // 4. Source filter
      if (selectedSource !== 'all') {
        if (t.source !== selectedSource) return false;
      }

      return true;
    });
  }, [activeTransactions, searchQuery, selectedMonth, selectedCategory, selectedSource]);

  // Group by date (YYYY-MM-DD)
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: Transaction[]; dailyExpense: number; dailyIncome: number }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    filteredTransactions.forEach((t) => {
      const d = t.occurredAt.slice(0, 10);
      if (!dateMap.has(d)) {
        dateMap.set(d, []);
      }
      dateMap.get(d)!.push(t);
    });

    const sortedDates = Array.from(dateMap.keys()).sort().reverse();

    sortedDates.forEach((dateStr) => {
      const items = dateMap.get(dateStr)!;
      let dailyExpense = 0;
      let dailyIncome = 0;
      items.forEach((it) => {
        if (it.type === 'expense') dailyExpense += it.amount;
        else dailyIncome += it.amount;
      });

      groups.push({
        date: dateStr,
        items,
        dailyExpense,
        dailyIncome,
      });
    });

    return groups;
  }, [filteredTransactions]);

  const hasActiveFilters = searchQuery || selectedMonth !== 'all' || selectedCategory !== 'all' || selectedSource !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMonth('all');
    setSelectedCategory('all');
    setSelectedSource('all');
  };

  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {STRINGS.transactions.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Semua catatan pengeluaran & pemasukan kamu yang tersimpan rapi
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-card p-4 border border-slate-200/80 shadow-sm space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={STRINGS.transactions.searchPlaceholder}
            className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Calendar size={14} className="text-slate-500 shrink-0" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent w-full text-slate-700 focus:outline-none font-medium"
            >
              <option value="all">{STRINGS.transactions.filterAllMonths}</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatDateIndonesia(`${m}-01`, false).slice(3)}
                </option>
              ))}
            </select>
          </div>

          {/* Category selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Layers size={14} className="text-slate-500 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent w-full text-slate-700 focus:outline-none font-medium"
            >
              <option value="all">{STRINGS.transactions.filterAllCategories}</option>
              {Object.values(CATEGORIES).map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter size={14} className="text-slate-500 shrink-0" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-transparent w-full text-slate-700 focus:outline-none font-medium"
            >
              <option value="all">{STRINGS.transactions.filterAllSources}</option>
              <option value="photo">{STRINGS.transactions.sourcePhoto}</option>
              <option value="chat">{STRINGS.transactions.sourceChat}</option>
              <option value="manual">{STRINGS.transactions.sourceManual}</option>
            </select>
          </div>
        </div>

        {/* Clear filters badge */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-500">
              Menampilkan {filteredTransactions.length} dari {activeTransactions.length} transaksi
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <X size={14} /> Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Transaction List Grouped by Date (PRD F8) */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white rounded-card p-8 border border-slate-200/80 shadow-sm text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700">
            {hasActiveFilters
              ? STRINGS.emptyStates.noSearchResults
              : STRINGS.emptyStates.noTransactions}
          </p>
          {!hasActiveFilters && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-moneta-primary text-white text-xs font-semibold rounded-btn shadow hover:bg-teal-800 transition touch-target"
            >
              <Sparkles size={16} />
              <span>Catat Transaksi Sekarang</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {groupedByDate.map((group) => (
            <div key={group.date} className="space-y-2">
              {/* Daily Header with Total (PRD F8) */}
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-extrabold text-sm">
                    {formatRelativeDate(group.date)}
                  </span>
                  <span className="text-slate-400 font-normal">
                    {formatDateIndonesia(group.date, true)}
                  </span>
                </div>
                <div className="text-right font-mono">
                  {group.dailyExpense > 0 && (
                    <span className="text-slate-800">
                      Total: {formatRupiah(group.dailyExpense)}
                    </span>
                  )}
                  {group.dailyIncome > 0 && (
                    <span className="text-emerald-700 ml-2">
                      +{formatRupiah(group.dailyIncome)}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions for this date */}
              <div className="space-y-2">
                {group.items.map((tx) => (
                  <TransactionItem
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEditTransaction}
                    onDelete={onDeleteTransaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
