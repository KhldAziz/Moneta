export type TransactionType = 'expense' | 'income';

export type CategoryKey =
  | 'makan_minum'
  | 'kopi_jajan'
  | 'transportasi'
  | 'kos_tagihan'
  | 'pulsa_internet'
  | 'kuliah'
  | 'belanja'
  | 'hiburan'
  | 'kesehatan'
  | 'lainnya'
  | 'uang_saku'
  | 'kerja'
  | 'pemasukan_lainnya';

export type TransactionSource = 'photo' | 'chat' | 'manual';

export interface TransactionItem {
  name: string;
  qty: number;
  unitPrice: number;
  total: number;
}

export interface ConfidenceMap {
  amount: number;
  date: number;
  merchant: number;
  category: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // positive integer in Rupiah
  category: CategoryKey;
  merchant: string | null;
  note: string | null;
  occurredAt: string; // ISO string or YYYY-MM-DD
  source: TransactionSource;
  confidence: ConfidenceMap | null;
  items: TransactionItem[];
  deletedAt: string | null; // ISO string if soft deleted
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  monthlyAllowance: number;
  cycleStartDay: number; // 1-28
  onboardingDone: boolean;
  createdAt: string;
}

export interface BudgetRecord {
  categoryKey: CategoryKey | 'total';
  amount: number;
}

export interface CategoryRule {
  id: string;
  pattern: string; // lowercase merchant or keyword
  category: CategoryKey;
}

export interface AlertRecord {
  id: string; // periodStart_category_threshold
  sentAt: string;
}

export interface AiLog {
  id: string;
  kind: 'photo' | 'chat';
  latencyMs: number;
  confidenceMin: number;
  userCorrected: boolean;
  feedback: 'up' | 'down' | null;
  createdAt: string;
}

export interface AiTransactionDraft {
  type: TransactionType;
  amount: number;
  category: CategoryKey;
  merchant: string | null;
  note: string | null;
  date: string;
  items: TransactionItem[];
  confidence: ConfidenceMap;
}

export interface AiParseResponse {
  isReceipt: boolean;
  transactions: AiTransactionDraft[];
  message?: string;
}

export type HealthScoreLabel = 'Rawan' | 'Waspada' | 'Sehat';

export interface WalletHealthBreakdown {
  score: number; // 0-100
  label: HealthScoreLabel;
  message: string;
  components: {
    budgetCompliance: number; // 0-100
    burnRate: number;         // 0-100
    consistency: number;      // 0-100
    needsRatio: number;       // 0-100
  };
  weakestComponent: string;
}

export interface WeeklyRecap {
  currentWeekTotal: number;
  previousWeekTotal: number;
  percentChange: number | null; // percentage change vs last week
  topCategories: { category: CategoryKey; amount: number; percentage: number }[];
  remainingBudget: number;
}
