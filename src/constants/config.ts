import { CategoryKey } from '../types';

export const GEMINI_MODEL = 'gemini-2.5-flash';

// Budget recommendations percentage from monthly allowance (PRD Section 7)
export const DEFAULT_BUDGET_PERCENTAGES: Record<CategoryKey, number> = {
  makan_minum: 0.30,      // 30%
  kos_tagihan: 0.25,      // 25%
  kopi_jajan: 0.10,       // 10%
  transportasi: 0.10,     // 10%
  pulsa_internet: 0.05,   // 5%
  kuliah: 0.05,           // 5%
  belanja: 0.05,          // 5%
  hiburan: 0.05,          // 5%
  lainnya: 0.03,          // 3%
  kesehatan: 0.02,        // 2%
  uang_saku: 0,
  kerja: 0,
  pemasukan_lainnya: 0,
};

// Mandatory categories for Wallet Health Score component "Kebutuhan"
export const MANDATORY_NEED_CATEGORIES: CategoryKey[] = [
  'makan_minum',
  'transportasi',
  'kos_tagihan',
  'pulsa_internet',
  'kuliah',
  'kesehatan',
];

export const MAX_TRANSACTION_AMOUNT = 50_000_000;
export const MAX_PHOTO_LONG_EDGE = 1568;
export const PHOTO_JPEG_QUALITY = 0.8;
