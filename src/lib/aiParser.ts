import {
  AiParseResponse,
  AiTransactionDraft,
  CategoryKey,
  ConfidenceMap,
  TransactionType,
} from '../types';
import { MAX_TRANSACTION_AMOUNT } from '../constants/config';

/**
 * Parses Indonesian currency strings like:
 * '20rb', '20k', '20 ribu', '20.000', '1,5jt', '1.5 juta', '3500', '750 ribu'
 */
export function parseIndonesianAmount(rawStr: string): { amount: number; confidence: number } | null {
  const s = rawStr.trim().toLowerCase();
  
  // Pattern 1: juta / jt (e.g., 1,5jt, 1.5 juta, 2jt)
  const jutaMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i);
  if (jutaMatch) {
    const num = parseFloat(jutaMatch[1].replace(',', '.'));
    return { amount: Math.round(num * 1_000_000), confidence: 0.95 };
  }

  // Pattern 2: rb / k / ribu (e.g., 20rb, 18k, 750 ribu)
  const ribuMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/i);
  if (ribuMatch) {
    const num = parseFloat(ribuMatch[1].replace(',', '.'));
    return { amount: Math.round(num * 1_000), confidence: 0.95 };
  }

  // Pattern 3: standard format with dot separator (e.g. 25.000 or 25,000)
  const dotSepMatch = s.match(/\b(\d{1,3}(?:\.\d{3})+)\b/);
  if (dotSepMatch) {
    const clean = dotSepMatch[1].replace(/\./g, '');
    const num = parseInt(clean, 10);
    return { amount: num, confidence: 0.95 };
  }

  // Pattern 4: raw numbers
  const rawNumMatch = s.match(/\b(\d+)\b/);
  if (rawNumMatch) {
    const num = parseInt(rawNumMatch[1], 10);
    if (num < 1000) {
      // PRD Section 6: "Angka di bawah 1.000 tanpa satuan dianggap ribuan dengan keyakinan nominal 0,6"
      return { amount: num * 1000, confidence: 0.6 };
    }
    return { amount: num, confidence: 0.9 };
  }

  return null;
}

/**
 * Determine category from keywords in Indonesian text
 */
export function inferCategoryFromText(text: string, type: TransactionType): { category: CategoryKey; confidence: number } {
  const lower = text.toLowerCase();

  if (type === 'income') {
    if (lower.includes('uang saku') || lower.includes('saku') || lower.includes('kiriman') || lower.includes('beasiswa')) {
      return { category: 'uang_saku', confidence: 0.95 };
    }
    if (lower.includes('gaji') || lower.includes('freelance') || lower.includes('kerja') || lower.includes('proyek')) {
      return { category: 'kerja', confidence: 0.95 };
    }
    return { category: 'pemasukan_lainnya', confidence: 0.85 };
  }

  // Expense categories
  if (lower.match(/\b(kopi|coffee|latte|boba|jajan|snack|camilan|es teh|teh|jus|boba|croissant|starbucks|janji jiwa|kulo|kopi kenangan)\b/)) {
    return { category: 'kopi_jajan', confidence: 0.92 };
  }
  if (lower.match(/\b(makan|ayam|nasi|bakso|mie|soto|pecel|rendang|warteg|padang|mcd|kfc|pizza|burger|sarapan|siang|malam)\b/)) {
    return { category: 'makan_minum', confidence: 0.92 };
  }
  if (lower.match(/\b(bensin|pertalite|pertamax|gojek|grab|maxim|krl|mrt|busway|angkot|parkir|toll|tol|ojol|transport)\b/)) {
    return { category: 'transportasi', confidence: 0.92 };
  }
  if (lower.match(/\b(kos|kost|kontrakan|listrik|pln|air|pdam|tagihan|ipl|sewa)\b/)) {
    return { category: 'kos_tagihan', confidence: 0.95 };
  }
  if (lower.match(/\b(pulsa|paket data|kuota|internet|wifi|indihome|telkomsel|indosat|xl|smartfren)\b/)) {
    return { category: 'pulsa_internet', confidence: 0.95 };
  }
  if (lower.match(/\b(fotokopi|print|tugas|buku|kuliah|kampus|alat tulis|atk|pulpen|spidol|kertas|skripsi|spp|ukt)\b/)) {
    return { category: 'kuliah', confidence: 0.92 };
  }
  if (lower.match(/\b(nonton|bioskop|cinema|xxi|game|steam|netflix|spotify|karaoke|liburan|healing|jalan-jalan)\b/)) {
    return { category: 'hiburan', confidence: 0.92 };
  }
  if (lower.match(/\b(obat|dokter|klinik|apotek|paracetamol|vitamin|sakit|rumah sakit|puskesmas)\b/)) {
    return { category: 'kesehatan', confidence: 0.95 };
  }
  if (lower.match(/\b(belanja|baju|sepatu|kaos|tas|skincare|sabun|shampoo|odol|indomaret|alfamart|superindo|shopee|tokopedia)\b/)) {
    return { category: 'belanja', confidence: 0.9 };
  }

  return { category: 'lainnya', confidence: 0.7 };
}

/**
 * Determine date from text given today's date string YYYY-MM-DD
 */
export function inferDateFromText(text: string, todayStr: string): { date: string; confidence: number } {
  const lower = text.toLowerCase();
  const todayDate = new Date(`${todayStr}T12:00:00+07:00`);

  if (lower.includes('kemarin')) {
    const yesterday = new Date(todayDate.getTime() - 24 * 60 * 60 * 1000);
    return { date: yesterday.toISOString().slice(0, 10), confidence: 0.95 };
  }
  
  if (lower.includes('tadi pagi') || lower.includes('tadi siang') || lower.includes('tadi malam') || lower.includes('hari ini')) {
    return { date: todayStr, confidence: 0.95 };
  }

  // Default is today with standard confidence
  return { date: todayStr, confidence: 0.9 };
}

/**
 * Rule-based Indonesian transaction text parser
 * Accurately parses compound phrases like: "bakso 15rb dan es teh 5rb"
 */
export function parseTextLocally(text: string, todayStr: string): AiParseResponse {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isReceipt: false, transactions: [] };
  }

  // Determine income vs expense
  const incomeKeywords = ['dapat', 'terima', 'transfer masuk', 'gaji', 'uang saku', 'dapet', 'masuk'];
  const hasIncomeKeyword = incomeKeywords.some(kw => trimmed.toLowerCase().includes(kw));

  // Check if there are multiple transactions linked by 'dan', 'serta', '&', ';' or comma with spaces
  // Note: do not split comma inside decimals like 1,5jt or 1.5jt
  const segments: string[] = [];
  const parts = trimmed.split(/\s+(?:dan|serta|&|;)\s+|\s*;\s*|(?<!\d)\s*,\s*|\s*,\s*(?!\d)/i);
  
  // If multiple parts contain price indicators, treat as separate transactions
  const partsWithAmount = parts.filter(p => /\d+/.test(p));
  if (partsWithAmount.length > 1) {
    segments.push(...partsWithAmount);
  } else {
    segments.push(trimmed);
  }

  const transactions: AiTransactionDraft[] = [];

  for (const segment of segments) {
    const segmentIncome = hasIncomeKeyword || incomeKeywords.some(kw => segment.toLowerCase().includes(kw));
    const txType: TransactionType = segmentIncome ? 'income' : 'expense';
    
    const amountResult = parseIndonesianAmount(segment);
    if (!amountResult) continue;

    const dateResult = inferDateFromText(segment, todayStr);
    const catResult = inferCategoryFromText(segment, txType);

    // Extract potential merchant or item name
    let cleanName = segment
      .replace(/(?:dapat|terima|transfer masuk|gaji|uang saku|bayar|beli|makan|isi|nonton)\s*/gi, '')
      .replace(/\d+(?:[.,]\d+)?\s*(?:jt|juta|rb|k|ribu|\.000)?/gi, '')
      .replace(/(?:kemarin|tadi pagi|tadi siang|tadi malam|hari ini|sama temen|ke kampus)/gi, '')
      .trim();
    if (!cleanName) cleanName = segment.trim();

    // Check merchant indicators
    let merchant: string | null = null;
    if (segment.toLowerCase().includes('indomaret')) merchant = 'Indomaret';
    else if (segment.toLowerCase().includes('alfamart')) merchant = 'Alfamart';
    else if (segment.toLowerCase().includes('gojek')) merchant = 'Gojek';
    else if (segment.toLowerCase().includes('grab')) merchant = 'Grab';
    else if (segment.toLowerCase().includes('kopi susu')) merchant = 'Kopi Susu';

    const confidence: ConfidenceMap = {
      amount: amountResult.confidence,
      date: dateResult.confidence,
      merchant: merchant ? 0.9 : 0.75,
      category: catResult.confidence,
    };

    transactions.push({
      type: txType,
      amount: amountResult.amount,
      category: catResult.category,
      merchant,
      note: cleanName || null,
      date: dateResult.date,
      items: [{
        name: cleanName || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
        qty: 1,
        unitPrice: amountResult.amount,
        total: amountResult.amount,
      }],
      confidence,
    });
  }

  return {
    isReceipt: transactions.length > 0,
    transactions,
  };
}

/**
 * Backend post-validation rules from PRD Section 6:
 * - total > 0 and <= Rp50.000.000
 * - tanggal tidak di masa depan dan tidak lebih dari 365 hari ke belakang
 * - jika selisih jumlah item dan total lebih dari 2%, turunkan keyakinan nominal menjadi maksimal 0,6
 */
export function validateAndSanitizeAiResponse(
  response: AiParseResponse,
  todayStr: string
): AiParseResponse {
  if (!response.transactions || response.transactions.length === 0) {
    return response;
  }

  const todayDate = new Date(`${todayStr}T23:59:59+07:00`);
  const minAllowedDate = new Date(todayDate.getTime() - 365 * 24 * 60 * 60 * 1000);

  const sanitizedTx: AiTransactionDraft[] = [];

  for (const tx of response.transactions) {
    // 1. Amount validation
    if (tx.amount <= 0 || tx.amount > MAX_TRANSACTION_AMOUNT) {
      continue;
    }

    // 2. Date validation
    const txDate = new Date(`${tx.date}T12:00:00+07:00`);
    let validDate = tx.date;
    if (isNaN(txDate.getTime()) || txDate > todayDate || txDate < minAllowedDate) {
      validDate = todayStr;
      tx.confidence.date = Math.min(tx.confidence.date, 0.6);
    }

    // 3. Item sum discrepancy validation
    if (tx.items && tx.items.length > 0) {
      const itemSum = tx.items.reduce((acc, it) => acc + (it.total || it.unitPrice * it.qty || 0), 0);
      if (itemSum > 0) {
        const diffPercent = Math.abs(itemSum - tx.amount) / tx.amount;
        if (diffPercent > 0.02) {
          // Turunkan keyakinan nominal menjadi maksimal 0.6
          tx.confidence.amount = Math.min(tx.confidence.amount, 0.6);
        }
      }
    }

    sanitizedTx.push({
      ...tx,
      date: validDate,
    });
  }

  return {
    ...response,
    transactions: sanitizedTx,
  };
}
