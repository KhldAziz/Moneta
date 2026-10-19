import { CategoryKey } from '../types';

export interface CategoryMeta {
  key: CategoryKey;
  label: string;
  icon: string; // Emoji or Lucide icon name identifier
  color: string;
  isIncome: boolean;
  isMandatoryNeed?: boolean; // For Wallet Health Score: mandatory categories
}

export const CATEGORIES: Record<CategoryKey, CategoryMeta> = {
  makan_minum: {
    key: 'makan_minum',
    label: 'Makan & Minum',
    icon: 'UtensilsCrossed',
    color: '#F97316',
    isIncome: false,
    isMandatoryNeed: true,
  },
  kopi_jajan: {
    key: 'kopi_jajan',
    label: 'Kopi & Jajan',
    icon: 'Coffee',
    color: '#8B5CF6',
    isIncome: false,
    isMandatoryNeed: false,
  },
  transportasi: {
    key: 'transportasi',
    label: 'Transportasi',
    icon: 'Bike',
    color: '#0EA5E9',
    isIncome: false,
    isMandatoryNeed: true,
  },
  kos_tagihan: {
    key: 'kos_tagihan',
    label: 'Kos & Tagihan',
    icon: 'Home',
    color: '#64748B',
    isIncome: false,
    isMandatoryNeed: true,
  },
  pulsa_internet: {
    key: 'pulsa_internet',
    label: 'Pulsa & Internet',
    icon: 'Wifi',
    color: '#6366F1',
    isIncome: false,
    isMandatoryNeed: true,
  },
  kuliah: {
    key: 'kuliah',
    label: 'Kuliah & Alat Tulis',
    icon: 'BookOpen',
    color: '#EAB308',
    isIncome: false,
    isMandatoryNeed: true,
  },
  belanja: {
    key: 'belanja',
    label: 'Belanja',
    icon: 'ShoppingBag',
    color: '#EC4899',
    isIncome: false,
    isMandatoryNeed: false,
  },
  hiburan: {
    key: 'hiburan',
    label: 'Hiburan',
    icon: 'Gamepad2',
    color: '#22C55E',
    isIncome: false,
    isMandatoryNeed: false,
  },
  kesehatan: {
    key: 'kesehatan',
    label: 'Kesehatan',
    icon: 'Pill',
    color: '#EF4444',
    isIncome: false,
    isMandatoryNeed: true,
  },
  lainnya: {
    key: 'lainnya',
    label: 'Lainnya',
    icon: 'Package',
    color: '#94A3B8',
    isIncome: false,
    isMandatoryNeed: false,
  },
  uang_saku: {
    key: 'uang_saku',
    label: 'Uang Saku (pemasukan)',
    icon: 'Coins',
    color: '#15803D',
    isIncome: true,
  },
  kerja: {
    key: 'kerja',
    label: 'Kerja/Freelance (pemasukan)',
    icon: 'Briefcase',
    color: '#15803D',
    isIncome: true,
  },
  pemasukan_lainnya: {
    key: 'pemasukan_lainnya',
    label: 'Pemasukan Lainnya',
    icon: 'ArrowDownToLine',
    color: '#15803D',
    isIncome: true,
  },
};

export const EXPENSE_CATEGORIES = Object.values(CATEGORIES).filter(c => !c.isIncome);
export const INCOME_CATEGORIES = Object.values(CATEGORIES).filter(c => c.isIncome);

export function getCategoryMeta(key: string): CategoryMeta {
  if (key in CATEGORIES) {
    return CATEGORIES[key as CategoryKey];
  }
  return CATEGORIES.lainnya;
}
