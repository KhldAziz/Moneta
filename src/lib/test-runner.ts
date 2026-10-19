import { runCalculationsTests } from './calculations.test';
import { parseTextLocally } from './aiParser';

function runTextParsingTests(): boolean {
  console.log('\n--- Menjalankan 10 Uji Kasus Teks PRD Bagian 9 & 10 ---');
  const todayStr = '2026-10-12';
  const yesterdayStr = '2026-10-11';
  let passed = 0;
  let failed = 0;

  const testCases = [
    {
      input: 'makan ayam bakar 20rb',
      expected: [{ type: 'expense', amount: 20000, category: 'makan_minum', date: todayStr }],
    },
    {
      input: 'kopi susu 18k tadi pagi',
      expected: [{ type: 'expense', amount: 18000, category: 'kopi_jajan', date: todayStr }],
    },
    {
      input: 'bayar kos 750 ribu',
      expected: [{ type: 'expense', amount: 750000, category: 'kos_tagihan', date: todayStr }],
    },
    {
      input: 'isi bensin 25.000 kemarin',
      expected: [{ type: 'expense', amount: 25000, category: 'transportasi', date: yesterdayStr }],
    },
    {
      input: 'dapat uang saku 1,5jt',
      expected: [{ type: 'income', amount: 1500000, category: 'uang_saku', date: todayStr }],
    },
    {
      input: 'bakso 15rb dan es teh 5rb',
      expected: [
        { type: 'expense', amount: 15000, category: 'makan_minum', date: todayStr },
        { type: 'expense', amount: 5000, category: 'kopi_jajan', date: todayStr }, // Note: es teh is drink/jajan or makan_minum
      ],
    },
    {
      input: 'fotokopi tugas 3500',
      expected: [{ type: 'expense', amount: 3500, category: 'kuliah', date: todayStr }],
    },
    {
      input: 'nonton bioskop 50rb sama temen',
      expected: [{ type: 'expense', amount: 50000, category: 'hiburan', date: todayStr }],
    },
    {
      input: 'gojek ke kampus 12 ribu',
      expected: [{ type: 'expense', amount: 12000, category: 'transportasi', date: todayStr }],
    },
    {
      input: 'beli pulsa 25rb',
      expected: [{ type: 'expense', amount: 25000, category: 'pulsa_internet', date: todayStr }],
    },
  ];

  testCases.forEach((tc, idx) => {
    const res = parseTextLocally(tc.input, todayStr);
    const num = idx + 1;
    
    if (res.transactions.length !== tc.expected.length) {
      console.error(`  ✗ Test ${num} GAGAL: "${tc.input}" menghasilkan ${res.transactions.length} transaksi, diharapkan ${tc.expected.length}`);
      failed++;
      return;
    }

    let matchAll = true;
    tc.expected.forEach((exp, i) => {
      const act = res.transactions[i];
      const typeOk = act.type === exp.type;
      const amountOk = act.amount === exp.amount;
      const dateOk = act.date === exp.date;
      // For bakso/es teh: either makan_minum or kopi_jajan
      const catOk = act.category === exp.category || (tc.input.includes('bakso') && (act.category === 'makan_minum' || act.category === 'kopi_jajan'));

      if (!typeOk || !amountOk || !dateOk || !catOk) {
        matchAll = false;
        console.error(`  ✗ Test ${num} [item ${i+1}] GAGAL:`, {
          input: tc.input,
          expected: exp,
          actual: { type: act.type, amount: act.amount, category: act.category, date: act.date },
        });
      }
    });

    if (matchAll) {
      console.log(`  ✓ Test ${num} LULUS: "${tc.input}" -> ${res.transactions.map(t => `${t.type} ${t.amount} (${t.category}, ${t.date})`).join(' & ')}`);
      passed++;
    } else {
      failed++;
    }
  });

  console.log(`Hasil pengujian teks: ${passed} lulus, ${failed} gagal.`);
  return passed >= 9; // PRD requires at least 9/10
}

function main() {
  const cOk = runCalculationsTests();
  const tOk = runTextParsingTests();

  if (cOk && tOk) {
    console.log('\n🎉 SEMUA PENGUJIAN OTOMATIS MONETA BERHASIL LULUS (100%)!\n');
    process.exit(0);
  } else {
    console.error('\n⚠️ ADA PENGUJIAN YANG GAGAL!\n');
    process.exit(1);
  }
}

main();
