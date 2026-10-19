import {
  calculatePeriod,
  calculateRemainingBalance,
  calculateDailyAllowance,
  calculateAutoBudget,
  calculateWalletHealthScore,
} from './calculations';
import { Transaction, BudgetRecord } from '../types';

export function runCalculationsTests(): boolean {
  console.log('--- Menjalankan Unit Test Perhitungan Moneta ---');
  let passed = 0;
  let failed = 0;

  function assert(desc: string, cond: boolean) {
    if (cond) {
      console.log(`  ✓ ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ GAGAL: ${desc}`);
      failed++;
    }
  }

  // 1. Period calculation
  const period = calculatePeriod(1, new Date('2026-10-15T12:00:00+07:00'));
  assert('Siklus mulai tanggal 1 menghasilkan start 2026-10-01', period.startDate === '2026-10-01');
  assert('Siklus mulai tanggal 1 menghasilkan end 2026-10-31', period.endDate === '2026-10-31');
  assert('Hari tersisa bernilai positif', period.daysRemaining > 0);

  // 2. Remaining balance
  const rem = calculateRemainingBalance(1500000, 200000, 700000);
  assert('Sisa uang = 1.5jt + 200rb - 700rb = 1.000.000', rem === 1000000);

  // 3. Daily allowance
  const daily = calculateDailyAllowance(1000000, 20);
  assert('Rata-rata per hari = 1jt / 20 hari = 50.000', daily === 50000);

  // 4. Auto budget percentages
  const autoBudgets = calculateAutoBudget(1000000);
  assert('Auto budget makan_minum 30% dari 1jt = 300.000', autoBudgets.makan_minum === 300000);
  assert('Auto budget kos_tagihan 25% dari 1jt = 250.000', autoBudgets.kos_tagihan === 250000);
  assert('Auto budget kopi_jajan 10% dari 1jt = 100.000', autoBudgets.kopi_jajan === 100000);
  assert('Auto budget transportasi 10% dari 1jt = 100.000', autoBudgets.transportasi === 100000);
  assert('Auto budget pulsa_internet 5% dari 1jt = 50.000', autoBudgets.pulsa_internet === 50000);
  assert('Auto budget kuliah 5% dari 1jt = 50.000', autoBudgets.kuliah === 50000);
  assert('Auto budget belanja 5% dari 1jt = 50.000', autoBudgets.belanja === 50000);
  assert('Auto budget hiburan 5% dari 1jt = 50.000', autoBudgets.hiburan === 50000);
  assert('Auto budget lainnya 3% dari 1jt = 30.000', autoBudgets.lainnya === 30000);
  assert('Auto budget kesehatan 2% dari 1jt = 20.000', autoBudgets.kesehatan === 20000);

  // Total auto budgets sum = 1.000.000
  const totalAuto = Object.values(autoBudgets).reduce((a, b) => a + b, 0);
  assert('Total auto budget persis 1.000.000 (100%)', totalAuto === 1000000);

  // 5. Wallet Health Score calculation
  const mockBudgets: BudgetRecord[] = [
    { categoryKey: 'makan_minum', amount: 300000 },
    { categoryKey: 'kopi_jajan', amount: 100000 },
  ];
  const healthResult = calculateWalletHealthScore({
    monthlyAllowance: 1000000,
    periodExpenses: 200000,
    expenseByCategory: { makan_minum: 150000, kopi_jajan: 50000 },
    budgets: mockBudgets,
    remainingBalance: 800000,
    period: {
      startDate: '2026-10-01',
      endDate: '2026-10-31',
      daysPassed: 10,
      daysRemaining: 21,
      totalDays: 31,
    },
    transactionsLast7Days: [
      { id: '1', occurredAt: '2026-10-10', deletedAt: null } as Transaction,
      { id: '2', occurredAt: '2026-10-11', deletedAt: null } as Transaction,
      { id: '3', occurredAt: '2026-10-12', deletedAt: null } as Transaction,
    ],
  });

  assert('Skor kesehatan dalam rentang 0-100', healthResult.score >= 0 && healthResult.score <= 100);
  assert('Label skor adalah Rawan, Waspada, atau Sehat', ['Rawan', 'Waspada', 'Sehat'].includes(healthResult.label));
  assert('Pesan rekomendasi terisi', healthResult.message.length > 0);

  console.log(`Hasil pengujian: ${passed} lolos, ${failed} gagal.`);
  return failed === 0;
}
